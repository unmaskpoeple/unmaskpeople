import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/jwt";
import { FiveSimService } from "@/services/fivesim.service";
import { WalletService } from "@/services/wallet.service";
import prisma from "@/lib/prisma";

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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing order ID." },
        { status: 400 }
      );
    }

    const order = await prisma.otpOrder.findUnique({
      where: { id: orderId },
    });

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
      return NextResponse.json(
        { success: false, error: "This order has already been cancelled and refunded." },
        { status: 400 }
      );
    }

    // 1. Cancel on 5SIM
    try {
      await FiveSimService.cancelOrder(order.fiveSimId);
    } catch (cancelErr: any) {
      console.warn("5SIM cancel error:", cancelErr.message);
      // Even if 5SIM says already canceled/expired, continue to refund locally
    }

    // 2. Refund user's wallet
    const refundRes = await WalletService.refundForFailedRequest({
      userId: order.userId,
      amount: order.cost,
      referenceId: `cancel_refund_${order.id}`,
      reason: `Customer cancelled order #${order.fiveSimId}. 100% refund.`,
    });

    // 3. Update order in DB
    const updated = await prisma.otpOrder.update({
      where: { id: order.id },
      data: {
        status: "CANCELED",
        isRefunded: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully. Full refund credited to your wallet.",
      order: updated,
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
