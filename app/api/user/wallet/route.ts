import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import { WalletService } from "@/services/wallet.service";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { FS_COLLECTIONS } from "@/lib/collections";
import { collection, query, where, getDocs } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireUser(req);
    const wallet = await WalletService.getWallet(sessionUser.id);

    let totalSpent = 0;
    let totalDeposited = 0;
    let totalRefunded = 0;
    let transactionCount = 0;
    let foundInFirestore = false;

    // 1. Try Cloud Firestore (Primary online source of truth - strictly namespaced)
    if (db) {
      try {
        const q = query(
          collection(db, FS_COLLECTIONS.WALLET_TRANSACTIONS),
          where("userId", "==", sessionUser.id)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          snap.forEach((doc) => {
            const d = doc.data();
            const amt = Number(d.amount || 0);
            if (d.type === "API_CHARGE") totalSpent += amt;
            else if (d.type === "DEPOSIT") totalDeposited += amt;
            else if (d.type === "REFUND") totalRefunded += amt;
            transactionCount++;
          });
          foundInFirestore = true;
        }
      } catch (fsErr) {
        console.warn("Firestore user wallet stats warning:", fsErr);
      }
    }

    // 2. Fallback to Prisma SQLite
    if (!foundInFirestore) {
      try {
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

        totalSpent = chargesAgg._sum.amount || 0.0;
        totalDeposited = depositsAgg._sum.amount || 0.0;
        totalRefunded = refundsAgg._sum.amount || 0.0;
        transactionCount = (chargesAgg._count || 0) + (depositsAgg._count || 0) + (refundsAgg._count || 0);
      } catch {}
    }

    return NextResponse.json({
      balance: wallet.balance,
      currency: wallet.currency,
      totalSpent: Number(totalSpent.toFixed(2)),
      totalDeposited: Number(totalDeposited.toFixed(2)),
      totalRefunded: Number(totalRefunded.toFixed(2)),
      transactionCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
