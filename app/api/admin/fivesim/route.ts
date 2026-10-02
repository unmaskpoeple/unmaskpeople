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
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    // 1. Fetch live 5SIM account profile
    let profile = null;
    let fiveSimError = null;
    try {
      profile = await FiveSimService.getProfile();
    } catch (e: any) {
      fiveSimError = e.message;
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

    const pricing = await FiveSimService.getPricingConfig();

    return NextResponse.json({
      success: true,
      profile,
      fiveSimError,
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        revenueInr: totalRevenueObj._sum.cost || 0,
        costFiveSimUsd: totalRevenueObj._sum.costFiveSim || 0,
      },
      pricing,
    });
  } catch (error: any) {
    console.error("Error in /api/admin/fivesim:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load admin stats." },
      { status: 500 }
    );
  }
}
