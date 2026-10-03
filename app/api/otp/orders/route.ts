import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { FS_COLLECTIONS } from "@/lib/collections";
import { collection, query, where, getDocs } from "firebase/firestore";
import { WalletService } from "@/services/wallet.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Please sign in to view orders." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get("status") || "all";
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

    // 1. Try Cloud Firestore (Primary online source of truth)
    if (db) {
      try {
        const ordersRef = collection(db, FS_COLLECTIONS.OTP_ORDERS);
        const qSnap = await getDocs(ordersRef);
        let fsOrders: any[] = [];
        qSnap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.userId === sessionUser.id || (sessionUser.email && d.userEmail === sessionUser.email)) {
            fsOrders.push({
              id: docSnap.id,
              ...d,
            });
          }
        });

        if (fsOrders.length > 0) {
          fsOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

          if (filterStatus === "active") {
            fsOrders = fsOrders.filter((o) => o.status === "PENDING");
          } else if (filterStatus === "received") {
            fsOrders = fsOrders.filter((o) => o.status === "RECEIVED" || o.status === "FINISHED");
          } else if (filterStatus === "canceled") {
            fsOrders = fsOrders.filter((o) => ["CANCELED", "TIMEOUT", "BANNED"].includes(o.status));
          }

          return NextResponse.json({
            success: true,
            count: fsOrders.length,
            orders: fsOrders.slice(0, limit),
          });
        }
      } catch (fsErr) {
        console.warn("Firestore orders fetch warning:", fsErr);
      }
    }

    // 2. Fallback to Prisma SQLite (Local database)
    const whereClause: any = { userId: sessionUser.id };

    if (filterStatus === "active") {
      whereClause.status = "PENDING";
    } else if (filterStatus === "received") {
      whereClause.status = { in: ["RECEIVED", "FINISHED"] };
    } else if (filterStatus === "canceled") {
      whereClause.status = { in: ["CANCELED", "TIMEOUT", "BANNED"] };
    }

    const orders = await prisma.otpOrder.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Check if any PENDING order is past expiry and not refunded yet
    const now = new Date();
    for (const ord of orders) {
      if (ord.status === "PENDING" && now > new Date(ord.expiresAt) && !ord.isRefunded) {
        try {
          await WalletService.refundForFailedRequest({
            userId: ord.userId,
            amount: ord.cost,
            referenceId: `auto_timeout_${ord.id}`,
            reason: `Order #${ord.fiveSimId} expired without SMS received.`,
          });

          await prisma.otpOrder.update({
            where: { id: ord.id },
            data: { status: "TIMEOUT", isRefunded: true },
          });
          ord.status = "TIMEOUT";
          ord.isRefunded = true;
        } catch (e) {
          console.error("Auto refund error:", e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    console.error("Error in /api/otp/orders:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch orders." },
      { status: 500 }
    );
  }
}
