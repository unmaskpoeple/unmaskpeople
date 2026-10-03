import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { FS_COLLECTIONS } from "@/lib/collections";
import { collection, query, where, getDocs } from "firebase/firestore";
import { WalletService } from "@/services/wallet.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireUser(req);
    const wallet = await WalletService.getWallet(sessionUser.id);

    let totalOrders = 0;
    let successfulOrders = 0;
    let refundedOrders = 0;
    let recentOrders: any[] = [];
    let recentTransactions: any[] = [];
    let chartData: { day: string; requests: number }[] = [];
    let foundInFirestore = false;

    // 1. Try Cloud Firestore (Primary online source of truth - strictly namespaced)
    if (db) {
      try {
        const ordersRef = collection(db, FS_COLLECTIONS.OTP_ORDERS);
        const qOrders = query(ordersRef, where("userId", "==", sessionUser.id));
        const orderSnap = await getDocs(qOrders);

        const allUserOrders: any[] = [];
        orderSnap.forEach((doc) => {
          const d = doc.data();
          allUserOrders.push({
            id: doc.id,
            phone: d.phone,
            serviceName: d.serviceName || d.service || "SMS Service",
            countryName: d.countryName || d.country || "Global",
            operator: d.operator || "any",
            status: d.status || "PENDING",
            cost: Number(d.cost || 0),
            smsCode: d.smsCode || null,
            smsText: d.smsText || null,
            isRefunded: Boolean(d.isRefunded || d.status === "CANCELED" || d.status === "TIMEOUT"),
            createdAt: d.createdAt || new Date().toISOString(),
          });
        });

        if (allUserOrders.length > 0) {
          totalOrders = allUserOrders.length;
          allUserOrders.forEach((o) => {
            if (o.status === "FINISHED" || o.status === "RECEIVED" || o.smsCode) {
              successfulOrders++;
            } else if (o.isRefunded || o.status === "CANCELED" || o.status === "TIMEOUT") {
              refundedOrders++;
            }
          });

          allUserOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          recentOrders = allUserOrders.slice(0, 5);

          // Build 7-day chart buckets
          const now = new Date();
          for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dayKey = d.toISOString().split("T")[0];
            const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });

            const count = allUserOrders.filter((o) => {
              const oDay = new Date(o.createdAt).toISOString().split("T")[0];
              return oDay === dayKey;
            }).length;

            chartData.push({ day: dayLabel, requests: count });
          }

          // Fetch recent wallet transactions from Firestore
          try {
            const txRef = collection(db, FS_COLLECTIONS.WALLET_TRANSACTIONS);
            const qTx = query(txRef, where("userId", "==", sessionUser.id));
            const txSnap = await getDocs(qTx);
            const allTxs: any[] = [];
            txSnap.forEach((td) => {
              const d = td.data();
              allTxs.push({
                id: td.id,
                userId: d.userId,
                type: d.type,
                amount: Number(d.amount || 0),
                balanceBefore: Number(d.balanceBefore || 0),
                balanceAfter: Number(d.balanceAfter || 0),
                referenceId: d.referenceId || td.id,
                description: d.description || "",
                status: d.status || "SUCCESS",
                createdAt: d.createdAt || new Date().toISOString(),
              });
            });
            allTxs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            recentTransactions = allTxs.slice(0, 5);
          } catch {}

          foundInFirestore = true;
        }
      } catch (fsErr) {
        console.warn("Firestore dashboard stats query warning:", fsErr);
      }
    }

    // 2. Fallback to Prisma SQLite
    if (!foundInFirestore) {
      try {
        const [
          pTotalOrders,
          pSuccessfulOrders,
          pRefundedOrders,
          pRecentOrders,
          pRecentTransactions,
        ] = await Promise.all([
          prisma.otpOrder.count({ where: { userId: sessionUser.id } }),
          prisma.otpOrder.count({ where: { userId: sessionUser.id, status: { in: ["RECEIVED", "FINISHED"] } } }),
          prisma.otpOrder.count({
            where: {
              userId: sessionUser.id,
              OR: [{ isRefunded: true }, { status: { in: ["CANCELED", "TIMEOUT"] } }],
            },
          }),
          prisma.otpOrder.findMany({
            where: { userId: sessionUser.id },
            orderBy: { createdAt: "desc" },
            take: 5,
          }),
          prisma.walletTransaction.findMany({
            where: { userId: sessionUser.id },
            orderBy: { createdAt: "desc" },
            take: 5,
          }),
        ]);

        totalOrders = pTotalOrders;
        successfulOrders = pSuccessfulOrders;
        refundedOrders = pRefundedOrders;
        recentOrders = pRecentOrders;
        recentTransactions = pRecentTransactions;

        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
          const dayStart = new Date(d.setHours(0, 0, 0, 0));
          const dayEnd = new Date(d.setHours(23, 59, 59, 999));

          const count = await prisma.otpOrder.count({
            where: {
              userId: sessionUser.id,
              createdAt: { gte: dayStart, lte: dayEnd },
            },
          });

          chartData.push({ day: dayLabel, requests: count });
        }
      } catch {}
    }

    // Calculate success rate percentage
    const successRate = totalOrders > 0
      ? Math.round((successfulOrders / totalOrders) * 100)
      : 100;

    return NextResponse.json({
      walletBalance: wallet.balance,
      currency: wallet.currency,
      totalOrders,
      successfulOrders,
      refundedOrders,
      totalRequests: totalOrders,
      successfulRequests: successfulOrders,
      failedRequests: refundedOrders,
      successRate,
      accountStatus: sessionUser.status,
      recentOrders,
      recentRequests: recentOrders.map((o) => ({
        id: o.id,
        maskedPhone: o.phone,
        status: o.status,
        amountCharged: o.cost,
        isRefunded: o.isRefunded,
        createdAt: o.createdAt,
        apiConfig: { name: `${o.serviceName || "SMS"} (${o.countryName || "Global"})` },
      })),
      recentTransactions,
      chartData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
