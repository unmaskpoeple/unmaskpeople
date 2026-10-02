import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { WalletService } from "@/services/wallet.service";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req);
    const depositId = params.id;
    const body = await req.json();
    const action = body.action; // "APPROVE" or "REJECT"

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json({ error: "Invalid action. Use APPROVE or REJECT." }, { status: 400 });
    }

    let deposit: any = null;

    if (db) {
      try {
        const dSnap = await getDoc(doc(db, "upi_deposits", depositId));
        if (dSnap.exists()) {
          deposit = dSnap.data();
        }
      } catch (e) {
        console.warn("Firestore find deposit warning:", e);
      }
    }

    if (!deposit) {
      try {
        const p = await prisma.payment.findUnique({
          where: { id: depositId },
          include: { user: true },
        });
        if (p) {
          deposit = {
            id: p.id,
            userId: p.userId,
            amount: p.amount,
            utr: p.gatewayReference,
            status: p.status,
          };
        }
      } catch {}
    }

    if (!deposit) {
      return NextResponse.json({ error: "Deposit request not found." }, { status: 404 });
    }

    if (deposit.status === "APPROVED") {
      return NextResponse.json({ error: "This deposit has already been approved." }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    if (action === "APPROVE") {
      // 1. Credit the user's wallet
      const depositResult = await WalletService.depositFunds({
        userId: deposit.userId,
        amount: Number(deposit.amount),
        referenceId: deposit.utr || depositId,
        description: `Approved manual UPI deposit (UTR: ${deposit.utr})`,
        gateway: "MANUAL_UPI",
      });

      // Update Firestore user document wallet balance
      if (db) {
        try {
          const userRef = doc(db, "users", deposit.userId);
          const uSnap = await getDoc(userRef);
          if (uSnap.exists()) {
            const currentBal = Number((uSnap.data().walletBalance ?? 0.0).toFixed(2));
            await updateDoc(userRef, {
              walletBalance: Number((currentBal + Number(deposit.amount)).toFixed(2)),
            });
          }
        } catch (e) {
          console.warn("Firestore user balance update warning:", e);
        }
      }

      // 2. Mark deposit as APPROVED in Firestore
      if (db) {
        try {
          await updateDoc(doc(db, "upi_deposits", depositId), {
            status: "APPROVED",
            approvedAt: nowIso,
            approvedBy: admin.email || admin.id,
            updatedAt: nowIso,
          });
        } catch {}
      }

      // 3. Update Prisma Payment record if present
      try {
        await prisma.payment.update({
          where: { id: depositId },
          data: { status: "SUCCESSFUL" },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        status: "APPROVED",
        message: `Deposit of ₹${Number(deposit.amount).toFixed(2)} approved! Funds credited to user wallet.`,
      });
    } else {
      // REJECT action
      const reason = body.reason || "Invalid or unverified UPI reference number.";

      if (db) {
        try {
          await updateDoc(doc(db, "upi_deposits", depositId), {
            status: "REJECTED",
            rejectedAt: nowIso,
            rejectedBy: admin.email || admin.id,
            rejectionReason: reason,
            updatedAt: nowIso,
          });
        } catch {}
      }

      try {
        await prisma.payment.update({
          where: { id: depositId },
          data: { status: "FAILED" },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        status: "REJECTED",
        message: `Deposit marked as rejected: ${reason}`,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process deposit action" }, { status: 400 });
  }
}
