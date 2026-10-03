import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/jwt";
import { FiveSimService } from "@/services/fivesim.service";
import { WalletService } from "@/services/wallet.service";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { FS_COLLECTIONS } from "@/lib/collections";
import { doc, setDoc } from "firebase/firestore";
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

    // 3. Purchase activation number via carrier gateway
    let carrierOrder;
    try {
      carrierOrder = await FiveSimService.buyActivation({
        country,
        operator,
        product,
      });
    } catch (orderError: any) {
      // Carrier allocation failed -> Instantly refund user's wallet!
      await WalletService.refundForFailedRequest({
        userId: sessionUser.id,
        amount: chargeAmountInr,
        referenceId,
        reason: `Carrier allocation timed out: ${orderError.message}`,
      });

      return NextResponse.json(
        {
          success: false,
          error: orderError.message || "Failed to acquire phone number. Your wallet was not charged.",
        },
        { status: 400 }
      );
    }

    // 4. Save order record in local database with compliance telemetry
    const expiresAt = carrierOrder.expires ? new Date(carrierOrder.expires) : new Date(Date.now() + 20 * 60 * 1000);
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Unknown";
    
    let dbOrder;
    try {
      dbOrder = await prisma.otpOrder.create({
        data: {
          userId: sessionUser.id,
          fiveSimId: carrierOrder.id,
          phone: carrierOrder.phone,
          service: product,
          serviceName: productItem.name,
          country,
          countryName: formatCountryName(country),
          operator: carrierOrder.operator || operator,
          cost: chargeAmountInr,
          costFiveSim: wholesaleUsd,
          currency: "INR",
          status: "PENDING",
          expiresAt,
          ipAddress,
          userAgent,
        },
      });
    } catch (dbErr) {
      console.error("Failed to save OtpOrder to DB:", dbErr);
    }

    // 4b. Synchronize Order to Cloud Firestore (Primary cloud storage)
    if (db) {
      try {
        await setDoc(doc(db, FS_COLLECTIONS.OTP_ORDERS, String(carrierOrder.id)), {
          id: dbOrder?.id || `ord_${carrierOrder.id}`,
          fiveSimId: carrierOrder.id,
          userId: sessionUser.id,
          userEmail: sessionUser.email,
          userName: sessionUser.name,
          phone: carrierOrder.phone,
          service: product,
          serviceName: productItem.name,
          country,
          countryName: formatCountryName(country),
          operator: carrierOrder.operator || operator,
          cost: chargeAmountInr,
          costFiveSim: wholesaleUsd,
          currency: "INR",
          status: "PENDING",
          smsCode: null,
          smsText: null,
          smsSender: null,
          smsReceivedAt: null,
          expiresAt: expiresAt.toISOString(),
          isRefunded: false,
          ipAddress,
          userAgent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (fsErr) {
        console.warn("Firestore save OtpOrder warning:", fsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Phone number allocated successfully! Waiting for SMS...",
      order: {
        id: dbOrder?.id || `ord_${carrierOrder.id}`,
        fiveSimId: carrierOrder.id,
        phone: carrierOrder.phone,
        service: product,
        serviceName: productItem.name,
        country,
        countryName: formatCountryName(country),
        operator: carrierOrder.operator || operator,
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
