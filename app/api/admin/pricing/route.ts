import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isMasterAdminEmail } from "@/lib/jwt";
import { FiveSimService } from "@/services/fivesim.service";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    const isAdmin = sessionUser?.role === "ADMIN" || isMasterAdminEmail(sessionUser?.email);

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 403 });
    }

    const pricing = await FiveSimService.getPricingConfig();
    return NextResponse.json({ success: true, pricing });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    const isAdmin = sessionUser?.role === "ADMIN" || isMasterAdminEmail(sessionUser?.email);

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { markupPercent, minPriceUsd, exchangeRateInr } = body;

    const updates: Array<Promise<any>> = [];

    if (markupPercent !== undefined && !isNaN(Number(markupPercent))) {
      updates.push(
        prisma.systemSetting.upsert({
          where: { key: "PRICE_MARKUP_PERCENT" },
          update: { value: String(Number(markupPercent)) },
          create: { key: "PRICE_MARKUP_PERCENT", value: String(Number(markupPercent)) },
        })
      );
    }

    if (minPriceUsd !== undefined && !isNaN(Number(minPriceUsd))) {
      updates.push(
        prisma.systemSetting.upsert({
          where: { key: "MIN_PRICE_USD" },
          update: { value: String(Number(minPriceUsd)) },
          create: { key: "MIN_PRICE_USD", value: String(Number(minPriceUsd)) },
        })
      );
    }

    if (exchangeRateInr !== undefined && !isNaN(Number(exchangeRateInr))) {
      updates.push(
        prisma.systemSetting.upsert({
          where: { key: "EXCHANGE_RATE_INR" },
          update: { value: String(Number(exchangeRateInr)) },
          create: { key: "EXCHANGE_RATE_INR", value: String(Number(exchangeRateInr)) },
        })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: "Pricing configuration updated successfully.",
    });
  } catch (error: any) {
    console.error("Error updating pricing:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
