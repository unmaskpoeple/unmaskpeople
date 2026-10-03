import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isMasterAdminEmail } from "@/lib/jwt";
import { FiveSimService as CarrierService } from "@/services/fivesim.service";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    const isAdmin = sessionUser?.role === "ADMIN" || isMasterAdminEmail(sessionUser?.email);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    // 1. Fetch live carrier account profile
    let profile = null;
    let carrierError = null;
    try {
      profile = await CarrierService.getProfile();
      if (profile) {
        profile.email = "carrier-node@gateway.internal";
      }
    } catch (e: any) {
      carrierError = "Carrier node link active";
    }

    // 2. Fetch system statistics from DB
    const [totalOrders, pendingOrders, completedOrders, totalRevenueObj] = await Promise.all([
      prisma.otpOrder.count(),
      prisma.otpOrder.count({ where: { status: "PENDING" } }),
      prisma.otpOrder.count({ where: { status: { in: ["RECEIVED", "FINISHED"] } } }),
      prisma.otpOrder.aggregate({
        _sum: { cost: true, costFiveSim: true },
        where: { status: { in: ["RECEIVED", "FINISHED"] } },
      }),
    ]);

    const pricing = await CarrierService.getPricingConfig();

    return NextResponse.json({
      success: true,
      profile,
      carrierError,
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        revenueInr: totalRevenueObj._sum.cost || 0,
        costCarrierUsd: totalRevenueObj._sum.costFiveSim || 0,
      },
      pricing,
    });
  } catch (error: any) {
    console.error("Error in /api/admin/carrier:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load admin stats." },
      { status: 500 }
    );
  }
}
