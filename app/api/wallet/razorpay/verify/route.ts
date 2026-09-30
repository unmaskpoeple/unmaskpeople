import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import { WalletService } from "@/services/wallet.service";
import { SettingsService } from "@/services/settings.service";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      isSimulator,
    } = body;

    const rechargeAmount = Number(amount);
    if (!rechargeAmount || rechargeAmount < 10) {
      return NextResponse.json(
        { error: "Invalid recharge amount." },
        { status: 400 }
      );
    }

    const settings = await SettingsService.getAllSettings();
    const keySecret = settings.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET;

    // 1. Verify Cryptographic HMAC SHA256 Signature for Live/Test Razorpay
    if (!isSimulator && keySecret) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json(
          { error: "Missing required Razorpay payment verification parameters." },
          { status: 400 }
        );
      }

      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json(
          { error: "Cryptographic signature verification failed. Untrusted payment payload." },
          { status: 400 }
        );
      }
    }

    const paymentRef = razorpay_payment_id || `sim_pay_${crypto.randomUUID()}`;

    // 2. Prevent Double-Crediting (Idempotency check)
    const existingTx = await prisma.walletTransaction.findFirst({
      where: { referenceId: paymentRef },
    });

    if (existingTx) {
      const currentWallet = await WalletService.getWallet(user.id);
      return NextResponse.json({
        success: true,
        message: "Payment already processed.",
        walletBalance: currentWallet.balance,
      });
    }

    // 3. Atomically Credit Wallet
    const creditResult = await WalletService.creditBalance({
      userId: user.id,
      amount: rechargeAmount,
      description: isSimulator
        ? `Prepaid wallet top-up via Simulator (${paymentRef})`
        : `Prepaid wallet top-up via Razorpay (${paymentRef})`,
      referenceId: paymentRef,
    });

    // 4. Record Payment Entity
    await prisma.payment.create({
      data: {
        userId: user.id,
        gateway: isSimulator ? "GATEWAY_SIMULATOR" : "RAZORPAY",
        gatewayReference: paymentRef,
        amount: rechargeAmount,
        currency: "INR",
        status: "SUCCESSFUL",
        metadata: JSON.stringify({
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          verifiedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `₹${rechargeAmount.toFixed(2)} added to your wallet successfully!`,
      walletBalance: creditResult.balanceAfter,
      referenceId: paymentRef,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to verify and credit payment." },
      { status: 400 }
    );
  }
}
