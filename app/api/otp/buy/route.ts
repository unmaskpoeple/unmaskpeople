import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/jwt";
import { FiveSimService } from "@/services/fivesim.service";
import { WalletService } from "@/services/wallet.service";
import prisma from "@/lib/prisma";
import { formatServiceName, formatCountryName } from "@/lib/fivesim-catalog";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Please sign in to order a phone number." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const country = String(body.country || "usa").toLowerCase().trim();
    const operator = String(body.operator || "any").toLowerCase().trim();
    const product = String(body.product || "").toLowerCase().trim();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Please select a service to purchase." },
        { status: 400 }
      );
    }

    // 1. Get live product info and verified pricing
    const products = await FiveSimService.getProducts(country, operator);
    const productItem = products.find((p) => p.code.toLowerCase() === product);

    if (!productItem || productItem.qty <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No numbers currently available for ${formatServiceName(product)} in ${formatCountryName(country)}. Please try another country or operator.`,
        },
        { status: 400 }
      );
    }

    const chargeAmountInr = productItem.priceCustomerInr;
    const chargeAmountUsd = productItem.priceCustomerUsd;
    const wholesaleUsd = productItem.priceWholesaleUsd;
    const referenceId = `otp_intent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 2. Atomically verify and charge user wallet
    const chargeResult = await WalletService.chargeForApiRequest({
      userId: sessionUser.id,
      amount: chargeAmountInr,
      referenceId,
      description: `OTP Activation: ${productItem.name} (${formatCountryName(country)})`,
    });

    if (!chargeResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: chargeResult.error || "Insufficient wallet balance. Please add funds.",
          requiredAmount: chargeAmountInr,
        },
        { status: 402 }
      );
    }

    // 3. Purchase activation number on 5SIM
    let fiveSimOrder;
    try {
      fiveSimOrder = await FiveSimService.buyActivation({
        country,
        operator,
        product,
      });
    } catch (orderError: any) {
      // 5SIM purchase failed -> Instantly refund user's wallet!
      await WalletService.refundForFailedRequest({
        userId: sessionUser.id,
        amount: chargeAmountInr,
        referenceId,
        reason: `5SIM purchase failed: ${orderError.message}`,
      });

      return NextResponse.json(
        {
          success: false,
          error: orderError.message || "Failed to acquire phone number. Your wallet was not charged.",
        },
        { status: 400 }
      );
    }

    // 4. Save order record in local database
    const expiresAt = fiveSimOrder.expires ? new Date(fiveSimOrder.expires) : new Date(Date.now() + 20 * 60 * 1000);
    
    let dbOrder;
    try {
      dbOrder = await prisma.otpOrder.create({
        data: {
          userId: sessionUser.id,
          fiveSimId: fiveSimOrder.id,
          phone: fiveSimOrder.phone,
          service: product,
          serviceName: productItem.name,
          country,
          countryName: formatCountryName(country),
          operator: fiveSimOrder.operator || operator,
          cost: chargeAmountInr,
          costFiveSim: wholesaleUsd,
          currency: "INR",
          status: "PENDING",
          expiresAt,
        },
      });
    } catch (dbErr) {
      console.error("Failed to save OtpOrder to DB:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Phone number allocated successfully! Waiting for SMS...",
      order: {
        id: dbOrder?.id || `ord_${fiveSimOrder.id}`,
        fiveSimId: fiveSimOrder.id,
        phone: fiveSimOrder.phone,
        service: product,
        serviceName: productItem.name,
        country,
        countryName: formatCountryName(country),
        operator: fiveSimOrder.operator || operator,
        cost: chargeAmountInr,
        costUsd: chargeAmountUsd,
        status: "PENDING",
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        smsCode: null,
        smsText: null,
      },
    });
  } catch (error: any) {
    console.error("Unhandled error in /api/otp/buy:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
