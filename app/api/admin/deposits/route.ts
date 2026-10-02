import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit } from "firebase/firestore";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const deposits: any[] = [];

    if (db) {
      try {
        const snap = await getDocs(collection(db, "upi_deposits"));
        snap.forEach((doc) => {
          deposits.push(doc.data());
        });
      } catch (e) {
        console.warn("Firestore admin deposits query warning:", e);
      }
    }

    if (deposits.length === 0) {
      try {
        const prismaPayments = await prisma.payment.findMany({
          where: { gateway: "MANUAL_UPI" },
          include: { user: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        });
        prismaPayments.forEach((p) => {
          deposits.push({
            id: p.id,
            userId: p.userId,
            userName: p.user?.name || "User",
            userEmail: p.user?.email || "",
            amount: p.amount,
            utr: p.gatewayReference,
            status: p.status,
            createdAt: p.createdAt.toISOString(),
          });
        });
      } catch {}
    }

    deposits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      deposits,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status: 401 });
  }
}
