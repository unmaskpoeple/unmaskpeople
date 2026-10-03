import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { FS_COLLECTIONS } from "@/lib/collections";
import { collection, getDocs } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    let totalUsers = 0;
    let activeUsers = 0;
    let totalWalletBalance = 0;
    let totalDeposits = 0;
    let totalRevenue = 0;
    let totalOrders = 0;
    let successfulOrders = 0;
    let pendingOrders = 0;
    let refundedOrders = 0;
    let recentOrders: any[] = [];
    let recentAudits: any[] = [];

    // Map for 7-day chart buckets
    const now = new Date();
    const daysMap = new Map<string, { orders: number; successful: number; revenue: number; deposits: number }>();
    const dayLabels: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      dayLabels.push(label);
      daysMap.set(dayKey, { orders: 0, successful: 0, revenue: 0, deposits: 0 });
    }

    // 1. Primary: Cloud Firestore (Strictly Namespaced NumVerge Collections)
    if (db) {
      // 1a. NumVerge Users
      try {
        const usersSnapshot = await getDocs(collection(db, FS_COLLECTIONS.USERS));
        if (!usersSnapshot.empty) {
          totalUsers = usersSnapshot.size;
          let act = 0;
          let sumBal = 0;
          usersSnapshot.forEach((doc) => {
            const d = doc.data();
            if (d.status !== "DISABLED" && d.status !== "SUSPENDED") act++;
            sumBal += Number(d.walletBalance || 0);
          });
          activeUsers = act;
          totalWalletBalance = Number(sumBal.toFixed(2));
        }
      } catch (fsUsersErr) {
        console.warn("Firestore overview numverge_users read skipped:", fsUsersErr);
      }

      // 1b. NumVerge UPI Deposits
      try {
        const depSnapshot = await getDocs(collection(db, FS_COLLECTIONS.UPI_DEPOSITS));
        if (!depSnapshot.empty) {
          let sumDep = 0;
          depSnapshot.forEach((doc) => {
            const d = doc.data();
            const amt = Number(d.amount || 0);
            if (d.status === "APPROVED" || d.status === "SUCCESS") {
              sumDep += amt;
            }

            // Bucket into chart
            if (d.createdAt) {
              const depDate = new Date(d.createdAt).toISOString().split("T")[0];
              if (daysMap.has(depDate)) {
                daysMap.get(depDate)!.deposits += amt;
              }
            }
          });
          totalDeposits = Number(sumDep.toFixed(2));
        }
      } catch (fsDepErr) {
        console.warn("Firestore overview numverge_upi_deposits read skipped:", fsDepErr);
      }

      // 1c. NumVerge OTP Orders
      try {
        const orderSnapshot = await getDocs(collection(db, FS_COLLECTIONS.OTP_ORDERS));
        if (!orderSnapshot.empty) {
          totalOrders = orderSnapshot.size;
          let succ = 0;
          let pend = 0;
          let ref = 0;
          let rev = 0;
          const allOrders: any[] = [];

          orderSnapshot.forEach((doc) => {
            const d = doc.data();
            const oStatus = d.status || "PENDING";
            const cost = Number(d.cost || 0);
            const isRefunded = Boolean(d.isRefunded || oStatus === "CANCELED" || oStatus === "TIMEOUT");

            if (oStatus === "FINISHED" || oStatus === "RECEIVED" || d.smsCode) {
              succ++;
              rev += cost;
            } else if (oStatus === "PENDING") {
              pend++;
            } else if (isRefunded) {
              ref++;
            }

            const createdAtStr = d.createdAt || new Date().toISOString();

            allOrders.push({
              id: doc.id,
              phone: d.phone,
              serviceName: d.serviceName || d.service || "SMS Service",
              countryName: d.countryName || d.country || "Global",
              operator: d.operator || "any",
              status: oStatus,
              cost,
              smsCode: d.smsCode || null,
              isRefunded,
              createdAt: createdAtStr,
              user: {
                name: d.userName || "Subscriber",
                email: d.userEmail || "",
              },
            });

            // Bucket into 7-day chart
            const ordDate = new Date(createdAtStr).toISOString().split("T")[0];
            if (daysMap.has(ordDate)) {
              const bucket = daysMap.get(ordDate)!;
              bucket.orders++;
              if (oStatus === "FINISHED" || oStatus === "RECEIVED" || d.smsCode) {
                bucket.successful++;
                bucket.revenue += cost;
              }
            }
          });

          successfulOrders = succ;
          pendingOrders = pend;
          refundedOrders = ref;
          totalRevenue = Number(rev.toFixed(2));

          allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          recentOrders = allOrders.slice(0, 8);
        }
      } catch (fsOrdErr) {
        console.warn("Firestore overview numverge_otp_orders read skipped:", fsOrdErr);
      }

      // 1d. NumVerge Audit Logs
      try {
        const audSnapshot = await getDocs(collection(db, FS_COLLECTIONS.AUDIT_LOGS));
        if (!audSnapshot.empty) {
          const allAuds: any[] = [];
          audSnapshot.forEach((doc) => {
            const d = doc.data();
            allAuds.push({
              id: doc.id,
              action: d.action || "SYSTEM_EVENT",
              targetType: d.targetType || "SYSTEM",
              targetId: d.targetId || "Global",
              ipAddress: d.ipAddress || null,
              createdAt: d.createdAt || new Date().toISOString(),
              admin: {
                name: d.adminName || "System Operator",
                email: d.adminEmail || "",
              },
            });
          });
          allAuds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          recentAudits = allAuds.slice(0, 5);
        }
      } catch (fsAudErr) {
        console.warn("Firestore overview numverge_audit_logs read skipped:", fsAudErr);
      }
    }

    // 2. Secondary: Prisma SQLite Local DB (Sync/Augment)
    try {
      const [
        pTotalUsers,
        pActiveUsers,
        walletsAggregate,
        depositsAggregate,
        pTotalOrders,
        pSuccessfulOrders,
        pPendingOrders,
        pRefundedOrders,
        pRecentOrders,
        pRecentAudits,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.wallet.aggregate({ _sum: { balance: true } }),
        prisma.payment.aggregate({
          where: { status: "SUCCESSFUL" },
          _sum: { amount: true },
        }),
        prisma.otpOrder.count(),
        prisma.otpOrder.count({ where: { status: { in: ["FINISHED", "RECEIVED"] } } }),
        prisma.otpOrder.count({ where: { status: "PENDING" } }),
        prisma.otpOrder.count({ where: { isRefunded: true } }),
        prisma.otpOrder.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          include: {
            user: { select: { name: true, email: true } },
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

      if (totalUsers === 0) totalUsers = pTotalUsers;
      if (activeUsers === 0) activeUsers = pActiveUsers;
      if (totalWalletBalance === 0) totalWalletBalance = Number((walletsAggregate._sum.balance ?? 0).toFixed(2));
      if (totalDeposits === 0) totalDeposits = Number((depositsAggregate._sum.amount ?? 0).toFixed(2));

      if (totalOrders === 0 && pTotalOrders > 0) {
        totalOrders = pTotalOrders;
        successfulOrders = pSuccessfulOrders;
        pendingOrders = pPendingOrders;
        refundedOrders = pRefundedOrders;

        if (pRecentOrders && pRecentOrders.length > 0) {
          recentOrders = pRecentOrders.map((o) => ({
            id: o.id,
            phone: o.phone,
            serviceName: o.serviceName,
            countryName: o.countryName,
            operator: o.operator,
            status: o.status,
            cost: o.cost,
            smsCode: o.smsCode,
            isRefunded: o.isRefunded,
            createdAt: o.createdAt.toISOString(),
            user: { name: o.user.name, email: o.user.email },
          }));
        }
      }

      if (recentAudits.length === 0 && pRecentAudits && pRecentAudits.length > 0) {
        recentAudits = pRecentAudits.map((a) => ({
          id: a.id,
          action: a.action,
          targetType: a.targetType,
          targetId: a.targetId,
          ipAddress: a.ipAddress,
          createdAt: a.createdAt.toISOString(),
          admin: { name: a.admin?.name || "System", email: a.admin?.email || "" },
        }));
      }
    } catch (prismaErr) {
      console.warn("Prisma overview query warning:", prismaErr);
    }

    // Assemble 7-day Trend Analytics for Charts
    const chartData = [];
    let idx = 0;
    for (const [dayKey, stats] of daysMap.entries()) {
      chartData.push({
        day: dayLabels[idx] || dayKey,
        orders: stats.orders,
        successful: stats.successful,
        revenue: Number(stats.revenue.toFixed(2)),
        deposits: Number(stats.deposits.toFixed(2)),
      });
      idx++;
    }

    if (chartData.length > 0 && chartData.every((c) => c.orders === 0 && c.deposits === 0)) {
      chartData[chartData.length - 1].orders = totalOrders;
      chartData[chartData.length - 1].successful = successfulOrders;
      chartData[chartData.length - 1].revenue = totalRevenue;
      chartData[chartData.length - 1].deposits = totalDeposits;
    }

    const successRate =
      totalOrders > 0
        ? Math.round((successfulOrders / totalOrders) * 100)
        : 100;

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        totalWalletBalance: Number(totalWalletBalance.toFixed(2)),
        totalDeposits: Number(totalDeposits.toFixed(2)),
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        successfulOrders,
        pendingOrders,
        refundedOrders,
        successRate,
      },
      recentOrders,
      recentAudits,
      chartData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unauthorized access." }, { status: 403 });
  }
}
