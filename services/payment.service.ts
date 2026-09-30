import crypto from "crypto";
import prisma from "@/lib/prisma";
import { WalletService } from "./wallet.service";

export interface InitiateDepositParams {
  userId: string;
  amount: number;
  gateway?: string;
}

export class PaymentService {
  /**
   * Initiate an order/deposit record in PENDING state
   */
  static async initiateDeposit(params: InitiateDepositParams) {
    const { userId, amount, gateway = "GATEWAY_SIMULATOR" } = params;

    if (amount < 10) {
      throw new Error("Minimum deposit amount is ₹10.00");
    }

    const referenceId = `PAY_${Date.now()}_${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const payment = await prisma.payment.create({
      data: {
        userId,
        gateway,
        gatewayReference: referenceId,
        amount,
        currency: "INR",
        status: "PENDING",
        metadata: JSON.stringify({
          clientTimestamp: new Date().toISOString(),
          requestedAmount: amount,
        }),
      },
    });

    return {
      paymentId: payment.id,
      referenceId: payment.gatewayReference,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
    };
  }

  /**
   * Process a verified server-side payment completion
   */
  static async processPaymentSuccess(referenceId: string, signature?: string) {
    const payment = await prisma.payment.findUnique({
      where: { gatewayReference: referenceId },
      include: { user: true },
    });

    if (!payment) {
      throw new Error("Payment order not found.");
    }

    if (payment.status === "SUCCESSFUL") {
      // Idempotent: already credited
      return { success: true, message: "Payment was already processed successfully." };
    }

    // Atomically credit wallet
    const depositResult = await WalletService.depositFunds({
      userId: payment.userId,
      amount: payment.amount,
      referenceId: payment.gatewayReference,
      description: `Wallet recharge via ${payment.gateway} (${payment.gatewayReference})`,
      gateway: payment.gateway,
    });

    if (!depositResult.success) {
      throw new Error(depositResult.error || "Failed to credit funds to wallet.");
    }

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESSFUL",
        metadata: JSON.stringify({
          verifiedAt: new Date().toISOString(),
          signatureReceived: signature || "VERIFIED_INTERNAL_WEBHOOK",
          transactionId: depositResult.transactionId,
        }),
      },
    });

    return {
      success: true,
      amount: payment.amount,
      balanceAfter: depositResult.balanceAfter,
      referenceId: payment.gatewayReference,
    };
  }

  /**
   * Verify HMAC-SHA256 signature from payment gateway webhook
   */
  static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    try {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
      return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      );
    } catch {
      return false;
    }
  }
}
