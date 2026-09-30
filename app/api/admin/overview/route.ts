import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    // Parallel aggregate metrics
    const [
      totalUsers,
      activeUsers,
      walletsAggregate,
      depositsAggregate,
      chargesAggregate,
      totalRequests,
      successfulRequests,
      failedRequests,
      recentRequests,
      recentAudits,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.wallet.aggregate({ _sum: { balance: true } }),
      prisma.walletTransaction.aggregate({
        where: { type: "DEPOSIT", status: "SUCCESS" },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { type: "API_CHARGE", status: "SUCCESS" },
        _sum: { amount: true },
      }),
      prisma.apiRequest.count(),
      prisma.apiRequest.count({ where: { status: "SUCCESSFUL" } }),
      prisma.apiRequest.count({ where: { status: { in: ["FAILED", "REFUNDED"] } } }),
      prisma.apiRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          user: { select: { name: true, email: true } },
          apiConfig: { select: { name: true } },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          admin: { select: { name: true, email: true } },
        },
      }),
    ]);

    // 7-day Trend Analytics for Charts
    const chartData = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));

      const [reqs, successReqs, revenueSum, depositsSum] = await Promise.all([
        prisma.apiRequest.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd } },
        }),
        prisma.apiRequest.count({
          where: { status: "SUCCESSFUL", createdAt: { gte: dayStart, lte: dayEnd } },
        }),
        prisma.walletTransaction.aggregate({
          where: {
            type: "API_CHARGE",
            status: "SUCCESS",
            createdAt: { gte: dayStart, lte: dayEnd },
          },
          _sum: { amount: true },
        }),
        prisma.walletTransaction.aggregate({
          where: {
            type: "DEPOSIT",
            status: "SUCCESS",
            createdAt: { gte: dayStart, lte: dayEnd },
          },
          _sum: { amount: true },
        }),
      ]);

      chartData.push({
        day: dayLabel,
        requests: reqs,
        successful: successReqs,
        revenue: revenueSum._sum.amount || 0,
        deposits: depositsSum._sum.amount || 0,
      });
    }

    const successRate = totalRequests > 0
      ? Math.round((successfulRequests / totalRequests) * 100)
      : 100;

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        totalWalletBalance: walletsAggregate._sum.balance || 0,
        totalDeposits: depositsAggregate._sum.amount || 0,
        totalRevenue: chargesAggregate._sum.amount || 0,
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate,
      },
      recentRequests,
      recentAudits,
      chartData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
