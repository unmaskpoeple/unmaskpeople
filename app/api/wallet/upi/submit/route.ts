import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/jwt";
import { SettingsService } from "@/services/settings.service";
import { WalletService } from "@/services/wallet.service";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDoc, getDocs, query, where } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    // 1. Resolve Authenticated User if present
    let sessionUser: any = null;
    try {
      sessionUser = await getSessionUser(req);
    } catch {
      // Unauthenticated / expired cookie
    }

    const body = await req.json();

    const amount = Number(body.amount);
    const rawUtr = String(body.utr || "").trim();
    // Sanitize UTR: strip whitespace, hyphens, slashes, convert to uppercase
    const cleanUtr = rawUtr.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    // 2. Validate Amount
    if (isNaN(amount) || amount < 10) {
      return NextResponse.json(
        { error: "Minimum recharge amount is ₹10.00" },
        { status: 400 }
      );
    }

    if (amount > 100000) {
      return NextResponse.json(
        { error: "Maximum single recharge amount is ₹1,00,000.00" },
        { status: 400 }
      );
    }

    // 3. Validate UTR length (Indian UPI UTRs are 12 digits, but allow 6-30 alphanumeric)
    if (!cleanUtr || cleanUtr.length < 6 || cleanUtr.length > 30) {
      return NextResponse.json(
        { error: "Please enter a valid 12-digit UPI Reference Number / UTR." },
        { status: 400 }
      );
    }

    // 4. Resolve Target User Account (session or provided email)
    const userEmail = (sessionUser?.email || body.userEmail || "").trim().toLowerCase();
    const userName = (sessionUser?.name || body.userName || userEmail.split("@")[0] || "Subscriber").trim();
    let userId = sessionUser?.id;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Please provide your registered account email so we can verify and credit your wallet." },
        { status: 400 }
      );
    }

    // If userId not found from session, try finding user in Firestore by email
    if (!userId && db) {
      try {
        const userQuery = query(collection(db, "users"), where("email", "==", userEmail));
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          userId = userSnap.docs[0].id;
        }
      } catch {}
    }

    // Also check Prisma user by email if still missing
    if (!userId) {
      try {
        const pUser = await prisma.user.findUnique({ where: { email: userEmail } });
        if (pUser) {
          userId = pUser.id;
        }
      } catch {}
    }

    if (!userId) {
      userId = `anon_${cleanUtr.slice(0, 8)}_${Date.now()}`;
    }

    // 5. ENFORCE STRICT SINGLE-USE UTR CONSTRAINT
    // Check A: Firestore direct primary key lookup (O(1) foolproof check)
    if (db) {
      try {
        const utrDocRef = doc(db, "upi_deposits", `utr_${cleanUtr}`);
        const utrDocSnap = await getDoc(utrDocRef);
        if (utrDocSnap.exists()) {
          return NextResponse.json(
            { error: `This UPI Reference Number (UTR: ${cleanUtr}) has already been submitted or redeemed. Each transaction reference can only be used once.` },
            { status: 400 }
          );
        }

        // Check B: Query for legacy deposits where document ID was randomized
        const q1 = query(collection(db, "upi_deposits"), where("utr", "==", cleanUtr));
        const snap1 = await getDocs(q1);
        if (!snap1.empty) {
          return NextResponse.json(
            { error: `This UPI Reference Number (UTR: ${cleanUtr}) has already been submitted or redeemed. Each transaction reference can only be used once.` },
            { status: 400 }
          );
        }
      } catch (e) {
        console.warn("Firestore duplicate check warning:", e);
      }
    }

    // Check C: Prisma Payment & WalletTransaction tables
    try {
      const existingPayment = await prisma.payment.findFirst({
        where: { gatewayReference: cleanUtr },
      });
      if (existingPayment) {
        return NextResponse.json(
          { error: `This UPI Reference Number (UTR: ${cleanUtr}) has already been submitted or redeemed. Each transaction reference can only be used once.` },
          { status: 400 }
        );
      }

      const existingTx = await prisma.walletTransaction.findFirst({
        where: { referenceId: cleanUtr },
      });
      if (existingTx) {
        return NextResponse.json(
          { error: `This UPI Reference Number (UTR: ${cleanUtr}) has already been credited to a wallet. Each transaction reference can only be used once.` },
          { status: 400 }
        );
      }
    } catch {}

    const settings = await SettingsService.getAllSettings();
    // Unique deposit ID anchored to cleanUtr
    const depositId = `utr_${cleanUtr}`;
    const nowIso = new Date().toISOString();
    const isAutoApprove = settings.upi_auto_approve === true;

    if (isAutoApprove && userId && !userId.startsWith("anon_")) {
      // ─────────────────────────────────────────────
      // AUTO-APPROVAL FLOW: Instantly credit wallet
      // ─────────────────────────────────────────────
      try {
        await WalletService.depositFunds({
          userId,
          amount,
          referenceId: cleanUtr,
          description: `Instant UPI auto-credit (UTR: ${cleanUtr})`,
          gateway: "MANUAL_UPI",
        });
      } catch (e) {
        console.warn("Prisma depositFunds error:", e);
      }

      // Also ensure Firestore user wallet balance is incremented
      let updatedBalance = amount;
      if (db) {
        try {
          const userRef = doc(db, "users", userId);
          const uSnap = await getDoc(userRef);
          if (uSnap.exists()) {
            const currentBal = Number((uSnap.data().walletBalance ?? 0.0).toFixed(2));
            updatedBalance = Number((currentBal + amount).toFixed(2));
            await setDoc(userRef, { walletBalance: updatedBalance }, { merge: true });
          }
        } catch {}
      }

      // Record deposit in Firestore
      if (db) {
        try {
          await setDoc(doc(db, "upi_deposits", depositId), {
            id: depositId,
            userId,
            userName,
            userEmail,
            amount,
            utr: cleanUtr,
            originalUtr: rawUtr,
            status: "APPROVED",
            gateway: "MANUAL_UPI",
            approvedAt: nowIso,
            approvedBy: "AUTO_APPROVAL_SYSTEM",
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        } catch {}
      }

      return NextResponse.json({
        success: true,
        status: "APPROVED",
        depositId,
        walletBalance: updatedBalance,
        message: `₹${amount.toFixed(2)} credited to ${userEmail} successfully!`,
      });
    } else {
      // ─────────────────────────────────────────────
      // MANUAL ADMIN REVIEW FLOW: Record as PENDING
      // ─────────────────────────────────────────────
      if (db) {
        try {
          await setDoc(doc(db, "upi_deposits", depositId), {
            id: depositId,
            userId,
            userName,
            userEmail,
            amount,
            utr: cleanUtr,
            originalUtr: rawUtr,
            status: "PENDING",
            gateway: "MANUAL_UPI",
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        } catch (e) {
          console.warn("Firestore save deposit warning:", e);
        }
      }

      // Save Prisma Payment record if user exists in Prisma
      try {
        if (!userId.startsWith("anon_")) {
          await prisma.payment.create({
            data: {
              id: depositId,
              userId,
              gateway: "MANUAL_UPI",
              gatewayReference: cleanUtr,
              amount,
              currency: "INR",
              status: "PENDING",
              metadata: JSON.stringify({
                utr: cleanUtr,
                originalUtr: rawUtr,
                userEmail,
                userName,
                submittedAt: nowIso,
              }),
            },
          });
        }
      } catch {}

      return NextResponse.json({
        success: true,
        status: "PENDING",
        depositId,
        message: `Deposit request of ₹${amount.toFixed(2)} (UTR: ${cleanUtr}) submitted successfully. Your wallet (${userEmail}) will be credited upon admin verification.`,
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to submit deposit" },
      { status: 400 }
    );
  }
}
