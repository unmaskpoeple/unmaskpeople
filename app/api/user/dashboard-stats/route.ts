import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { WalletService } from "@/services/wallet.service";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireUser(req);
    const wallet = await WalletService.getWallet(sessionUser.id);

    // Run parallel aggregation queries for the user
    const [
      totalRequests,
      successfulRequests,
      failedRequests,
      recentRequests,
      recentTransactions,
    ] = await Promise.all([
      prisma.apiRequest.count({ where: { userId: sessionUser.id } }),
      prisma.apiRequest.count({ where: { userId: sessionUser.id, status: "SUCCESSFUL" } }),
      prisma.apiRequest.count({
        where: {
          userId: sessionUser.id,
          status: { in: ["FAILED", "REFUNDED"] },
        },
      }),
      prisma.apiRequest.findMany({
        where: { userId: sessionUser.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { apiConfig: { select: { name: true } } },
      }),
      prisma.walletTransaction.findMany({
        where: { userId: sessionUser.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // Calculate success rate percentage
    const successRate = totalRequests > 0
      ? Math.round((successfulRequests / totalRequests) * 100)
      : 100;

    // Generate chart data for last 7 days
    const chartData = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));

      const count = await prisma.apiRequest.count({
        where: {
          userId: sessionUser.id,
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      chartData.push({ day: dayLabel, requests: count });
    }

    return NextResponse.json({
      walletBalance: wallet.balance,
      currency: wallet.currency,
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate,
      accountStatus: sessionUser.status,
      recentRequests,
      recentTransactions,
      chartData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
