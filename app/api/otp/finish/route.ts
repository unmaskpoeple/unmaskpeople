import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/jwt";
import { FiveSimService } from "@/services/fivesim.service";
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
        { success: false, error: "Unauthorized." },
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

    try {
      await FiveSimService.finishOrder(order.fiveSimId);
    } catch (e: any) {
      console.warn("Carrier finish warning:", e.message);
    }

    const updated = await prisma.otpOrder.update({
      where: { id: order.id },
      data: { status: "FINISHED" },
    });

    // Sync FINISHED state to Cloud Firestore
    if (db) {
      try {
        await setDoc(
          doc(db, FS_COLLECTIONS.OTP_ORDERS, String(order.fiveSimId)),
          {
            status: "FINISHED",
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn("Firestore finish sync error:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Order finished successfully.",
      order: updated,
    });
  } catch (error: any) {
    console.error("Error in /api/otp/finish:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to finish order." },
      { status: 500 }
    );
  }
}
