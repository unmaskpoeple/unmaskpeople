import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/jwt";
import { FiveSimService } from "@/services/fivesim.service";
import { WalletService } from "@/services/wallet.service";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { FS_COLLECTIONS } from "@/lib/collections";
import { doc, updateDoc, setDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Please sign in to cancel an order." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { orderId, fiveSimId } = body;

    if (!orderId && !fiveSimId) {
      return NextResponse.json(
        { success: false, error: "Missing order ID." },
        { status: 400 }
      );
    }

    const numericFiveSimId = Number(fiveSimId || String(orderId).replace(/\D/g, "")) || 0;

    // 1. Locate order in Prisma OR Firestore
    let order: any = null;

    try {
      order = await prisma.otpOrder.findFirst({
        where: {
          OR: [
            orderId ? { id: String(orderId) } : {},
            numericFiveSimId > 0 ? { fiveSimId: numericFiveSimId } : {},
          ],
        },
      });
    } catch (dbErr) {
      console.warn("Prisma find order error on cancel:", dbErr);
    }

    // Fallback to Cloud Firestore if not found in Prisma
    if (!order && db) {
      try {
        const { getDoc, getDocs, collection, query, where } = await import("firebase/firestore");
        if (numericFiveSimId > 0) {
          const fsDoc = await getDoc(doc(db, FS_COLLECTIONS.OTP_ORDERS, String(numericFiveSimId)));
          if (fsDoc.exists()) {
            order = fsDoc.data();
          }
        }
        if (!order && orderId) {
          const fsDoc = await getDoc(doc(db, FS_COLLECTIONS.OTP_ORDERS, String(orderId)));
          if (fsDoc.exists()) {
            order = fsDoc.data();
          } else {
            const qSnap = await getDocs(
              query(collection(db, FS_COLLECTIONS.OTP_ORDERS), where("id", "==", String(orderId)))
            );
            if (!qSnap.empty) {
              order = qSnap.docs[0].data();
            }
          }
        }
      } catch (fsErr) {
        console.warn("Firestore find order error on cancel:", fsErr);
      }
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    if (order.userId !== sessionUser.id && sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized." },
        { status: 403 }
      );
    }

    if (order.status === "RECEIVED" || order.smsCode) {
      return NextResponse.json(
        { success: false, error: "Cannot cancel an order after the SMS has already been received." },
        { status: 400 }
      );
    }

    if (order.status === "CANCELED" || order.isRefunded) {
      return NextResponse.json({
        success: true,
        message: "This order has already been cancelled and refunded.",
        order: { ...order, status: "CANCELED", isRefunded: true },
      });
    }

    // 1. Cancel on carrier gateway
    const carrierId = order.fiveSimId || numericFiveSimId;
    if (carrierId) {
      try {
        await FiveSimService.cancelOrder(carrierId);
      } catch (cancelErr: any) {
        console.warn("Carrier cancel warning:", cancelErr.message);
        // Even if carrier says already canceled/expired, continue to refund locally
      }
    }

    // 2. Refund user's wallet
    const refundRes = await WalletService.refundForFailedRequest({
      userId: order.userId,
      amount: Number(order.cost || 0),
      referenceId: `cancel_refund_${order.id || carrierId}`,
      reason: `Customer cancelled order #${carrierId}. 100% refund.`,
    });

    // 3. Update order in DB
    let updatedOrder = {
      ...order,
      status: "CANCELED",
      isRefunded: true,
    };

    try {
      if (order.id) {
        updatedOrder = await prisma.otpOrder.update({
          where: { id: order.id },
          data: {
            status: "CANCELED",
            isRefunded: true,
          },
        });
      }
    } catch (e) {
      console.warn("Prisma cancel order update error:", e);
    }

    // Sync CANCELED state to Cloud Firestore
    if (db && carrierId) {
      try {
        await setDoc(
          doc(db, FS_COLLECTIONS.OTP_ORDERS, String(carrierId)),
          {
            status: "CANCELED",
            isRefunded: true,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn("Firestore cancel sync error:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully. Full refund credited to your wallet.",
      order: updatedOrder,
      newBalance: refundRes.balanceAfter,
    });
  } catch (error: any) {
    console.error("Error in /api/otp/cancel:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel order." },
      { status: 500 }
    );
  }
}
