import prisma from "@/lib/prisma";
import { hashPhoneNumber, maskPhoneNumber } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/rate-limiter";
import { WalletService } from "./wallet.service";
import { ApiExecutorService } from "./api-executor.service";
import { SettingsService } from "./settings.service";

export interface SubmitPhoneParams {
  userId: string;
  phone: string;
  countryCode: string;
  apiConfigId?: string;
  ipAddress?: string;
}

export class RequestService {
  /**
   * Main phone number submission pipeline with full transaction safety,
   * rate limiting, wallet charging, API proxying, and failure refunding.
   */
  static async processPhoneSubmission(params: SubmitPhoneParams) {
    const { userId, phone, countryCode, apiConfigId, ipAddress } = params;

    // 1. Verify User & Account Status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      throw new Error("User account not found.");
    }

    if (user.status !== "ACTIVE") {
      throw new Error("Your account is currently disabled or suspended. Please contact support.");
    }

    // 2. Validate Phone Number (Strictly 10 digits)
    const cleanedDigits = phone.replace(/\D/g, "");
    if (cleanedDigits.length !== 10) {
      throw new Error("Phone number must be exactly 10 digits.");
    }

    const fullFormattedPhone = `${countryCode} ${phone.trim()}`;
    const maskedPhone = maskPhoneNumber(fullFormattedPhone);
    const phoneHash = hashPhoneNumber(fullFormattedPhone);

    // 3. Load System Settings & Check Rate Limits
    const settings = await SettingsService.getAllSettings();

    if (settings.maintenance_mode && user.role !== "ADMIN") {
      throw new Error("The platform is currently undergoing scheduled maintenance. Please try again shortly.");
    }

    const rateLimitCheck = checkRateLimit({
      key: `user:${userId}`,
      maxPerMinute: settings.max_requests_per_minute,
      maxPerDay: settings.max_requests_per_day,
    });

    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.reason || "Rate limit reached. Please wait before submitting another request.");
    }

    // 4. Resolve Active API Configuration
    let apiConfig;
    if (apiConfigId) {
      apiConfig = await prisma.apiConfig.findUnique({
        where: { id: apiConfigId },
      });
    }

    if (!apiConfig || !apiConfig.isActive) {
      apiConfig = await prisma.apiConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
    }

    if (!apiConfig) {
      throw new Error("No active provider API is configured. Please contact the administrator.");
    }

    // 5. Determine Cost Server-Side
    const requestCost = apiConfig.cost ?? settings.default_cost_per_request;

    // 6. Check Wallet Balance Prior to Calling External API
    const currentWallet = user.wallet || (await WalletService.getWallet(userId));
    if (currentWallet.balance < requestCost) {
      throw new Error(
        `Insufficient wallet balance. Required: ₹${requestCost.toFixed(2)}, Available: ₹${currentWallet.balance.toFixed(2)}. Please recharge your wallet to proceed.`
      );
    }

    // 7. Create Initial Request Record ("PROCESSING")
    const apiRequest = await prisma.apiRequest.create({
      data: {
        userId,
        apiConfigId: apiConfig.id,
        phoneHash,
        maskedPhone,
        countryCode,
        status: "PROCESSING",
        amountCharged: 0.0,
        ipAddress: ipAddress || "127.0.0.1",
      },
    });

    // 8. Deduct amount from wallet initially (Reserve funds atomically)
    const chargeResult = await WalletService.chargeForApiRequest({
      userId,
      amount: requestCost,
      referenceId: apiRequest.id,
      description: `Phone lookup fee for ${maskedPhone} (${apiConfig.name})`,
    });

    if (!chargeResult.success) {
      // Wallet failed to lock
      await prisma.apiRequest.update({
        where: { id: apiRequest.id },
        data: {
          status: "FAILED",
          errorMessage: chargeResult.error,
          completedAt: new Date(),
        },
      });
      throw new Error(chargeResult.error || "Wallet charge failed.");
    }

    // Update request with amount charged
    await prisma.apiRequest.update({
      where: { id: apiRequest.id },
      data: { amountCharged: requestCost },
    });

    // 9. Call External API Server-Side
    const executionResult = await ApiExecutorService.execute(
      apiConfig,
      phone,
      countryCode
    );

    // 10. Handle Success vs Failure & Refund Policy
    let finalStatus = executionResult.success ? "SUCCESSFUL" : "FAILED";
    let isRefunded = false;

    if (!executionResult.success && settings.refund_on_failure) {
      // Auto-refund failed request
      await WalletService.refundApiCharge({
        userId,
        amount: requestCost,
        referenceId: apiRequest.id,
        reason: `Failed lookup: ${executionResult.message}`,
      });
      finalStatus = "REFUNDED";
      isRefunded = true;
    }

    // 11. Update Request Record with Final Results
    const updatedRequest = await prisma.apiRequest.update({
      where: { id: apiRequest.id },
      data: {
        status: finalStatus,
        httpStatus: executionResult.httpStatus,
        latencyMs: executionResult.latencyMs,
        isRefunded,
        rawResponse: JSON.stringify(executionResult.rawResponse),
        sanitizedResult: JSON.stringify(executionResult.sanitizedResult),
        errorMessage: executionResult.success ? null : executionResult.message,
        completedAt: new Date(),
      },
      include: {
        apiConfig: {
          select: { name: true, cost: true },
        },
      },
    });

    // 12. If search was strictly successful (not refunded or failed), record towards referral criteria
    if (executionResult.success && !isRefunded) {
      const { ReferralService } = await import("./referral.service");
      await ReferralService.recordSuccessfulSearch(userId);
    }

    // 13. Fetch refreshed wallet balance
    const updatedWallet = await WalletService.getWallet(userId);

    return {
      requestId: updatedRequest.id,
      status: finalStatus,
      success: executionResult.success,
      phone: maskedPhone,
      latencyMs: executionResult.latencyMs,
      amountCharged: isRefunded ? 0 : requestCost,
      isRefunded,
      message: executionResult.message,
      data: executionResult.sanitizedResult,
      raw: executionResult.rawResponse,
      apiUsed: apiConfig.name,
      walletBalance: updatedWallet.balance,
    };
  }

  /**
   * Get user request history with pagination and search
   */
  static async getUserRequests(options: {
    userId: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = { userId: options.userId };
    if (options.status && options.status !== "ALL") {
      where.status = options.status;
    }

    const [requests, total] = await Promise.all([
      prisma.apiRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          apiConfig: {
            select: { name: true },
          },
        },
      }),
      prisma.apiRequest.count({ where }),
    ]);

    return {
      requests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single request details ensuring privacy boundary
   */
  static async getRequestById(requestId: string, userId?: string) {
    const request = await prisma.apiRequest.findUnique({
      where: { id: requestId },
      include: {
        apiConfig: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!request) return null;

    // Enforce ownership unless admin request
    if (userId && request.userId !== userId) {
      return null;
    }

    return request;
  }
}
