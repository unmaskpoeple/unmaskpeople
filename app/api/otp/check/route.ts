import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/jwt";
import { FiveSimService } from "@/services/fivesim.service";
import { WalletService } from "@/services/wallet.service";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { FS_COLLECTIONS } from "@/lib/collections";
import { doc, updateDoc, setDoc } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const fiveSimIdParam = searchParams.get("fiveSimId");

    if (!orderId && !fiveSimIdParam) {
      return NextResponse.json(
        { success: false, error: "Missing order identifier." },
        { status: 400 }
      );
    }

    // 1. Locate order in database
    let order = await prisma.otpOrder.findFirst({
      where: {
        OR: [
          orderId ? { id: orderId } : {},
          fiveSimIdParam ? { fiveSimId: Number(fiveSimIdParam) } : {},
        ],
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    // Security check: ensure requesting user owns this order, or is admin
    if (sessionUser && order.userId !== sessionUser.id && sessionUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to order." },
        { status: 403 }
      );
    }

    // If order is already in a terminal state (RECEIVED, FINISHED, CANCELED), return current DB record
    if (order.status === "FINISHED" || (order.status === "RECEIVED" && order.smsCode)) {
      return NextResponse.json({
        success: true,
        order,
      });
    }

    // 2. Poll carrier gateway for live order update
    try {
      const carrierData = await FiveSimService.checkOrder(order.fiveSimId);

      // Check for incoming SMS messages
      if (carrierData.sms && carrierData.sms.length > 0) {
        const latestSms = carrierData.sms[carrierData.sms.length - 1];
        let code = latestSms.code;

        // If code is not explicitly set, extract 4-8 digits from text
        if (!code && latestSms.text) {
          const match = latestSms.text.match(/\b\d{4,8}\b/);
          if (match) code = match[0];
        }

        order = await prisma.otpOrder.update({
          where: { id: order.id },
          data: {
            status: "RECEIVED",
            smsCode: code || null,
            smsText: latestSms.text || null,
            smsSender: latestSms.sender || null,
            smsReceivedAt: new Date(),
          },
        });

        // Sync SMS code to Cloud Firestore
        if (db) {
          try {
            await setDoc(
              doc(db, FS_COLLECTIONS.OTP_ORDERS, String(order.fiveSimId)),
              {
                status: "RECEIVED",
                smsCode: code || null,
                smsText: latestSms.text || null,
                smsSender: latestSms.sender || null,
                smsReceivedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (e) {
            console.warn("Firestore sync error on check:", e);
          }
        }

        return NextResponse.json({
          success: true,
          order,
          smsReceived: true,
        });
      }

      // Check if carrier marked order as CANCELED or TIMEOUT
      const isExpired = new Date() > new Date(order.expiresAt);
      if ((carrierData.status === "CANCELED" || carrierData.status === "TIMEOUT" || isExpired) && !order.isRefunded) {
        // Auto-refund user's wallet!
        await WalletService.refundForFailedRequest({
          userId: order.userId,
          amount: order.cost,
          referenceId: `timeout_refund_${order.id}`,
          reason: `OTP order #${order.fiveSimId} expired with no SMS received. 100% refund.`,
        });

        order = await prisma.otpOrder.update({
          where: { id: order.id },
          data: {
            status: "TIMEOUT",
            isRefunded: true,
          },
        });

        // Sync TIMEOUT to Cloud Firestore
        if (db) {
          try {
            await setDoc(
              doc(db, FS_COLLECTIONS.OTP_ORDERS, String(order.fiveSimId)),
              {
                status: "TIMEOUT",
                isRefunded: true,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (e) {}
        }

        return NextResponse.json({
          success: true,
          order,
          autoRefunded: true,
        });
      }

      return NextResponse.json({
        success: true,
        order: {
          ...order,
          carrierStatus: carrierData.status,
        },
      });
    } catch (checkErr: any) {
      console.warn(`Carrier poll error for order ${order.fiveSimId}:`, checkErr.message);
      return NextResponse.json({
        success: true,
        order,
      });
    }
  } catch (error: any) {
    console.error("Error in /api/otp/check:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check order." },
      { status: 500 }
    );
  }
}
