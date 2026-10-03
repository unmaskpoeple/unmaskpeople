import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import { db } from "@/lib/firebase";
import { FS_COLLECTIONS } from "@/lib/collections";
import { doc, getDoc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
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

    // 1. Fetch deposit record from Firestore (Namespaced)
    if (db) {
      try {
        const dSnap = await getDoc(doc(db, FS_COLLECTIONS.UPI_DEPOSITS, depositId));
        if (dSnap.exists()) {
          deposit = dSnap.data();
        }
      } catch (e) {
        console.warn("Firestore find deposit warning:", e);
      }
    }

    // 2. Fallback to Prisma Payment table
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
            userEmail: p.user?.email || "",
            userName: p.user?.name || "Subscriber",
            amount: p.amount,
            utr: p.gatewayReference,
            status: p.status === "SUCCESSFUL" ? "APPROVED" : p.status,
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
    const amount = Number(deposit.amount);

    if (action === "APPROVE") {
      // ─────────────────────────────────────────────
      // APPROVE: Credit user wallet in Firestore & Prisma
      // ─────────────────────────────────────────────
      let targetUserId = deposit.userId;

      // 1. Update Cloud Firestore User Wallet Balance
      if (db) {
        try {
          let userDocRef: any = null;
          let uSnap: any = null;

          if (targetUserId && !targetUserId.startsWith("anon_")) {
            userDocRef = doc(db, FS_COLLECTIONS.USERS, targetUserId);
            uSnap = await getDoc(userDocRef);
          }

          // If not found by userId, resolve by userEmail
          if ((!uSnap || !uSnap.exists()) && deposit.userEmail) {
            const cleanEmail = String(deposit.userEmail).toLowerCase().trim();
            const uQuery = query(collection(db, FS_COLLECTIONS.USERS), where("email", "==", cleanEmail));
            const qSnap = await getDocs(uQuery);
            if (!qSnap.empty) {
              userDocRef = qSnap.docs[0].ref;
              uSnap = qSnap.docs[0];
              targetUserId = qSnap.docs[0].id;
            }
          }

          if (uSnap && uSnap.exists() && userDocRef) {
            const currentBal = Number((uSnap.data().walletBalance ?? 0.0).toFixed(2));
            const newBal = Number((currentBal + amount).toFixed(2));
            await setDoc(userDocRef, { walletBalance: newBal }, { merge: true });
          }
        } catch (e) {
          console.warn("Firestore user balance update warning:", e);
        }
      }

      // 2. Best-effort Prisma Wallet Credit
      if (targetUserId && !targetUserId.startsWith("anon_")) {
        try {
          await WalletService.depositFunds({
            userId: targetUserId,
            amount,
            referenceId: deposit.utr || depositId,
            description: `Approved manual UPI deposit (UTR: ${deposit.utr})`,
            gateway: "MANUAL_UPI",
          });
        } catch (e) {
          console.warn("Prisma depositFunds fallback warning:", e);
        }
      }

      // 3. Mark deposit document as APPROVED in Firestore
      if (db) {
        try {
          await setDoc(
            doc(db, FS_COLLECTIONS.UPI_DEPOSITS, depositId),
            {
              status: "APPROVED",
              approvedAt: nowIso,
              approvedBy: admin.email || admin.id,
              updatedAt: nowIso,
            },
            { merge: true }
          );
        } catch {}
      }

      // 4. Update Prisma Payment record if present
      try {
        await prisma.payment.update({
          where: { id: depositId },
          data: { status: "SUCCESSFUL" },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        status: "APPROVED",
        message: `Deposit of ₹${amount.toFixed(2)} approved! ₹${amount.toFixed(2)} credited to ${deposit.userEmail || deposit.userId}.`,
      });
    } else {
      // ─────────────────────────────────────────────
      // REJECT: Mark deposit as REJECTED
      // ─────────────────────────────────────────────
      const reason = body.reason || "Invalid or unverified UPI reference number.";

      if (db) {
        try {
          await setDoc(
            doc(db, FS_COLLECTIONS.UPI_DEPOSITS, depositId),
            {
              status: "REJECTED",
              rejectedAt: nowIso,
              rejectedBy: admin.email || admin.id,
              rejectionReason: reason,
              updatedAt: nowIso,
            },
            { merge: true }
          );
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
