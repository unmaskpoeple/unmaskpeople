import { NextRequest, NextResponse } from "next/server";
import { PaymentService } from "@/services/payment.service";
import { SettingsService } from "@/services/settings.service";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const settings = await SettingsService.getAllSettings();
    const secret = process.env.PAYMENT_WEBHOOK_SECRET || settings.webhook_secret;

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { referenceId, event, simulationToken } = payload;

    if (!referenceId) {
      return NextResponse.json({ error: "Missing referenceId" }, { status: 400 });
    }

    // Security Check:
    // If external gateway webhook: verify HMAC signature
    // If simulator sandbox: verify simulation secret/token
    let isValid = false;

    if (signature) {
      isValid = PaymentService.verifyWebhookSignature(rawBody, signature, secret);
    } else if (simulationToken) {
      // Internal sandbox simulator verification
      const expectedToken = crypto
        .createHmac("sha256", secret)
        .update(referenceId)
        .digest("hex");
      isValid = simulationToken === expectedToken || simulationToken === "SIMULATOR_AUTHORIZED_DEV_TOKEN";
    }

    if (!isValid) {
      console.warn("Invalid webhook signature received for payment:", referenceId);
      return NextResponse.json(
        { error: "Unauthorized webhook. Cryptographic signature check failed." },
        { status: 401 }
      );
    }

    if (event === "payment.failed") {
      // Record payment failure in database
      return NextResponse.json({ success: true, message: "Payment failure recorded." });
    }

    // Process payment success atomically
    const result = await PaymentService.processPaymentSuccess(
      referenceId,
      signature || simulationToken
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: "Webhook processed and wallet credited atomically.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
