import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import { WalletService } from "@/services/wallet.service";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireUser(req);
    const wallet = await WalletService.getWallet(sessionUser.id);

    // Get aggregated statistics
    const [chargesAgg, depositsAgg, refundsAgg] = await Promise.all([
      prisma.walletTransaction.aggregate({
        where: { userId: sessionUser.id, type: "API_CHARGE", status: "SUCCESS" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.walletTransaction.aggregate({
        where: { userId: sessionUser.id, type: "DEPOSIT", status: "SUCCESS" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.walletTransaction.aggregate({
        where: { userId: sessionUser.id, type: "REFUND", status: "SUCCESS" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      balance: wallet.balance,
      currency: wallet.currency,
      totalSpent: chargesAgg._sum.amount || 0.0,
      totalDeposited: depositsAgg._sum.amount || 0.0,
      totalRefunded: refundsAgg._sum.amount || 0.0,
      transactionCount: (chargesAgg._count || 0) + (depositsAgg._count || 0) + (refundsAgg._count || 0),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
