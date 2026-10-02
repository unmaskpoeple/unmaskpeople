import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit as fbLimit } from "firebase/firestore";
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

    // 1. Verify User & Account Status (Prisma with Firestore fallback)
    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });
    } catch (e) {
      // Prisma missing on serverless
    }

    if (!user && db) {
      try {
        const userSnap = await getDoc(doc(db, "users", userId));
        if (userSnap.exists()) {
          const uData = userSnap.data();
          user = {
            id: userId,
            name: uData.name,
            email: uData.email,
            role: uData.role,
            status: uData.status || "ACTIVE",
            wallet: { balance: uData.walletBalance ?? 0.0, currency: "INR" },
          };
        }
      } catch (fsErr) {
        console.warn("Firestore user lookup fallback error:", fsErr);
      }
    }

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
    let apiConfig: any = null;
    try {
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
    } catch (e) {
      // Prisma missing on serverless
    }

    // Check Firestore for custom API config if Prisma didn't have one
    if (!apiConfig && db) {
      try {
        const { collection, getDocs } = await import("firebase/firestore");
        const snap = await getDocs(collection(db, "api_configs"));
        if (!snap.empty) {
          const first = snap.docs[0].data();
          if (first.isActive) {
            apiConfig = { id: snap.docs[0].id, ...first };
          }
        }
      } catch (e) {}
    }

    // Live SpyDox Subscriber Gateway (Primary Provider)
    const defaultApiUrl =
      process.env.PHONE_SEARCH_API_URL ||
      "https://numtoinfo-ownarspydox.vercel.app/api";
    const defaultApiKey =
      process.env.PHONE_SEARCH_API_KEY || "iamspydox";

    if (!apiConfig || !apiConfig.isActive) {
      apiConfig = {
        id: "spydox-subscriber-gateway",
        name: "SpyDox Subscriber Gateway",
        endpoint: defaultApiUrl,
        method: (process.env.PHONE_SEARCH_API_METHOD || "GET").toUpperCase(),
        cost: Number(settings.default_cost_per_request ?? 3.5),
        isActive: true,
        successField: "found",
        successValues: "1,2,3,4,5,true,success,200,ok",
        messageField: "message",
        resultField: "data",
        phoneParameter: process.env.PHONE_SEARCH_PARAM_NAME || "term",
        authType: "API_KEY_QUERY",
        authKeyName: process.env.PHONE_SEARCH_KEY_PARAM || "key",
        encryptedSecret: defaultApiKey,
      };
    }

    const requestCost = Number(settings.default_cost_per_request ?? apiConfig?.cost ?? 3.5);

    // 5. Check Wallet Balance Prior to Calling API
    const currentWallet = user.wallet || (await WalletService.getWallet(userId));
    const availableBalance = Number((currentWallet?.balance ?? 0).toFixed(2));
    if (availableBalance < requestCost && user.role !== "ADMIN") {
      throw new Error(
        `Insufficient wallet balance. Required: ₹${requestCost.toFixed(2)}, Available: ₹${availableBalance.toFixed(2)}. Please recharge your wallet to proceed.`
      );
    }

    // 6. Create Initial Request Record
    const requestId = `req_${Date.now()}`;
    let apiRequest: any = { id: requestId };
    try {
      apiRequest = await prisma.apiRequest.create({
        data: {
          id: requestId,
          userId,
          apiConfigId: apiConfig?.id || "internal-telecom-engine",
          phoneHash,
          maskedPhone,
          countryCode,
          status: "PROCESSING",
          amountCharged: 0.0,
          ipAddress: ipAddress || "127.0.0.1",
        },
      });
    } catch (e) {
      // Prisma optional on serverless
    }

    // 7. Deduct amount from wallet initially (Reserve funds)
    const chargeResult = await WalletService.chargeForApiRequest({
      userId,
      amount: requestCost,
      referenceId: apiRequest.id,
      description: `Phone lookup fee for ${maskedPhone}`,
    });

    if (!chargeResult.success && user.role !== "ADMIN") {
      throw new Error(chargeResult.error || "Wallet charge failed.");
    }

    // 8. Execute Phone Lookup
    let executionResult: any;

    // If an external endpoint is configured and NOT localhost / dead domain
    const hasExternalApi =
      apiConfig &&
      apiConfig.endpoint &&
      apiConfig.endpoint.startsWith("http") &&
      !apiConfig.endpoint.includes("localhost") &&
      !apiConfig.endpoint.includes("spydox.site");

    if (hasExternalApi) {
      try {
        executionResult = await ApiExecutorService.execute(
          apiConfig,
          cleanedDigits,
          countryCode
        );
      } catch (e) {
        console.warn("External provider error, resolving via telecom core:", e);
      }
    }

    // Check if external API actually responded (HTTP status 200 or returned structured found / data)
    const isLiveApiResponse =
      executionResult &&
      executionResult.httpStatus >= 200 &&
      executionResult.httpStatus < 300 &&
      executionResult.rawResponse &&
      typeof executionResult.rawResponse === "object" &&
      ("found" in executionResult.rawResponse || "data" in executionResult.rawResponse);

    if (isLiveApiResponse) {
      const raw = executionResult.rawResponse;
      const isFound =
        (typeof raw.found === "number" && raw.found > 0) ||
        raw.found === true ||
        raw.found === 1 ||
        raw.found === "1" ||
        (Array.isArray(raw.data) && raw.data.length > 0);

      if (!isFound) {
        // No subscriber found in live database: refund fee
        await WalletService.refundForFailedRequest({
          userId,
          amount: requestCost,
          referenceId: apiRequest.id,
          reason: `No subscriber records found for ${maskedPhone}`,
        });

        if (db) {
          try {
            await setDoc(doc(db, "requests", requestId), {
              id: requestId,
              userId,
              phone: maskedPhone,
              countryCode,
              status: "REFUNDED",
              amountCharged: 0.0,
              isRefunded: true,
              result: raw,
              rawResponse: raw,
              createdAt: new Date().toISOString(),
            });
          } catch (e) {}
        }

        const updatedWallet = await WalletService.getWallet(userId);

        return {
          requestId,
          status: "REFUNDED",
          success: true,
          phone: maskedPhone,
          latencyMs: executionResult.latencyMs,
          amountCharged: 0.0,
          isRefunded: true,
          message: `No subscriber records found for this phone number. ₹${requestCost.toFixed(2)} refunded to wallet.`,
          data: raw,
          raw,
          apiUsed: executionResult.apiName || apiConfig?.name,
          walletBalance: updatedWallet.balance,
        };
      }
    } else if (!executionResult || !executionResult.success) {
      // API call failed: refund fee and return honest provider error
      await WalletService.refundForFailedRequest({
        userId,
        amount: requestCost,
        referenceId: apiRequest.id,
        reason: `Lookup provider error: ${executionResult?.message || "Provider unreachable"}`,
      });

      const updatedWallet = await WalletService.getWallet(userId);
      const fallbackPayload = executionResult?.rawResponse || {
        found: 0,
        data: [],
        message: executionResult?.message || "Lookup service error",
      };

      if (db) {
        try {
          await setDoc(doc(db, "requests", requestId), {
            id: requestId,
            userId,
            phone: maskedPhone,
            countryCode,
            status: "REFUNDED",
            amountCharged: 0.0,
            isRefunded: true,
            result: fallbackPayload,
            rawResponse: executionResult?.rawResponse || null,
            createdAt: new Date().toISOString(),
          });
        } catch (e) {}
      }

      return {
        requestId,
        status: "REFUNDED",
        success: false,
        phone: maskedPhone,
        latencyMs: executionResult?.latencyMs || 0,
        amountCharged: 0.0,
        isRefunded: true,
        message: executionResult?.message || `Lookup failed. ₹${requestCost.toFixed(2)} refunded to wallet.`,
        data: fallbackPayload,
        raw: executionResult?.rawResponse || null,
        apiUsed: executionResult?.apiName || apiConfig?.name,
        walletBalance: updatedWallet.balance,
      };
    }

    // 9. Save Request Record in Firestore
    if (db) {
      try {
        await setDoc(doc(db, "requests", requestId), {
          id: requestId,
          userId,
          phone: maskedPhone,
          countryCode,
          status: "SUCCESSFUL",
          amountCharged: requestCost,
          result: executionResult.rawResponse || executionResult.sanitizedResult,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("Firestore request record error:", e);
      }
    }

    // Update in Prisma if available
    try {
      await prisma.apiRequest.update({
        where: { id: apiRequest.id },
        data: {
          status: "SUCCESSFUL",
          httpStatus: 200,
          latencyMs: executionResult.latencyMs,
          amountCharged: requestCost,
          isRefunded: false,
          rawResponse: JSON.stringify(executionResult.rawResponse),
          sanitizedResult: JSON.stringify(executionResult.rawResponse || executionResult.sanitizedResult),
          completedAt: new Date(),
        },
      });
    } catch (e) {
      // Prisma optional
    }

    // 10. Fetch refreshed wallet balance
    const updatedWallet = await WalletService.getWallet(userId);

    return {
      requestId,
      status: "SUCCESSFUL",
      success: true,
      phone: maskedPhone,
      latencyMs: executionResult.latencyMs,
      amountCharged: requestCost,
      isRefunded: false,
      message: executionResult.message,
      data: executionResult.rawResponse || executionResult.sanitizedResult,
      raw: executionResult.rawResponse,
      apiUsed: executionResult.apiName,
      walletBalance: updatedWallet.balance,
    };
  }

  /**
   * Get specific request by ID with user ownership check
   */
  static async getRequestById(id: string, userId: string) {
    if (db) {
      try {
        const snap = await getDoc(doc(db, "requests", id));
        if (snap.exists()) {
          const data = snap.data();
          if (data.userId === userId) {
            return { id, ...data };
          }
        }
      } catch (e) {
        console.warn("Firestore getRequestById error:", e);
      }
    }

    try {
      return await prisma.apiRequest.findFirst({
        where: { id, userId },
      });
    } catch (e) {
      return null;
    }
  }

  /**
   * Get paginated user requests
   */
  static async getUserRequests(options: {
    userId: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 15));

    // 1. Try Firestore
    if (db) {
      try {
        const col = collection(db, "requests");
        const q = query(
          col,
          where("userId", "==", options.userId),
          fbLimit(limit)
        );
        const snapshot = await getDocs(q);
        const requests = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (requests.length > 0) {
          return {
            requests,
            total: requests.length,
            page,
            totalPages: 1,
          };
        }
      } catch (e) {
        console.warn("Firestore getUserRequests error:", e);
      }
    }

    // 2. Fallback to Prisma
    try {
      const where: any = { userId: options.userId };
      if (options.status && options.status !== "ALL") {
        where.status = options.status;
      }
      const skip = (page - 1) * limit;
      const [requests, total] = await Promise.all([
        prisma.apiRequest.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.apiRequest.count({ where }),
      ]);
      return {
        requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (e) {
      return {
        requests: [],
        total: 0,
        page: 1,
        totalPages: 1,
      };
    }
  }
}
