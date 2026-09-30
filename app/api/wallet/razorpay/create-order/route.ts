import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import { SettingsService } from "@/services/settings.service";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const amount = Number(body.amount);

    if (!amount || amount < 10) {
      return NextResponse.json(
        { error: "Minimum recharge amount is ₹10.00" },
        { status: 400 }
      );
    }

    const settings = await SettingsService.getAllSettings();
    const keyId = settings.razorpay_key_id || process.env.RAZORPAY_KEY_ID;
    const keySecret = settings.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET;

    // If Razorpay API credentials are configured, create live Razorpay Order
    if (keyId && keySecret && settings.razorpay_enabled) {
      const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Razorpay accepts amount in paise
          currency: "INR",
          receipt: `rcpt_${crypto.randomUUID().slice(0, 10)}`,
          payment_capture: 1,
        }),
      });

      const rzpData = await rzpRes.json();
      if (!rzpRes.ok) {
        throw new Error(rzpData.error?.description || "Failed to create Razorpay order");
      }

      return NextResponse.json({
        success: true,
        isSimulator: false,
        keyId,
        orderId: rzpData.id,
        amount: amount,
        currency: "INR",
        user: {
          name: user.name,
          email: user.email,
        },
      });
    }

    // Fallback: If Razorpay keys not yet entered by admin, provide sandbox simulator order
    const simOrderId = `order_sim_${crypto.randomUUID().slice(0, 12)}`;
    return NextResponse.json({
      success: true,
      isSimulator: true,
      keyId: "rzp_test_unmaskpeople_simulator",
      orderId: simOrderId,
      amount: amount,
      currency: "INR",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to initiate payment" },
      { status: 400 }
    );
  }
}
