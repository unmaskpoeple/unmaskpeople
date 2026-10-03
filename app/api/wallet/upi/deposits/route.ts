import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireUser(req);
    const deposits: any[] = [];

    if (db) {
      try {
        const { FS_COLLECTIONS } = await import("@/lib/collections");
        const q = query(
          collection(db, FS_COLLECTIONS.UPI_DEPOSITS),
          where("userId", "==", sessionUser.id),
          limit(20)
        );
        const snap = await getDocs(q);
        snap.forEach((doc) => {
          deposits.push(doc.data());
        });
      } catch (e) {
        console.warn("Firestore user deposits query fallback:", e);
      }
    }

    if (deposits.length === 0) {
      try {
        const prismaPayments = await prisma.payment.findMany({
          where: { userId: sessionUser.id, gateway: "MANUAL_UPI" },
          orderBy: { createdAt: "desc" },
          take: 20,
        });
        prismaPayments.forEach((p) => {
          deposits.push({
            id: p.id,
            userId: p.userId,
            amount: p.amount,
            utr: p.gatewayReference,
            status: p.status,
            createdAt: p.createdAt.toISOString(),
          });
        });
      } catch {}
    }

    // Sort by createdAt desc
    deposits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      deposits,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load deposits" }, { status: 400 });
  }
}
