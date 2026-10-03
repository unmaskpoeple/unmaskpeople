import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/jwt";
import { SettingsService } from "@/services/settings.service";
import { WalletService } from "@/services/wallet.service";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { FS_COLLECTIONS } from "@/lib/collections";
import { collection, doc, setDoc, getDoc, getDocs, query, where } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    // Capture Client Telemetry for Safe Harbor & Cyber Law Compliance
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Unknown";
    const nowIso = new Date().toISOString();

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
    // Sanitize UTR: extract numeric digits only
    const cleanUtr = rawUtr.replace(/[^0-9]/g, "").trim();

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

    // 3. Validate UTR: Indian NPCI UPI UTRs are strictly 12 numeric digits
    if (!cleanUtr || !/^\d{12}$/.test(cleanUtr)) {
      return NextResponse.json(
        { error: "Invalid UPI Reference Number. Please enter the authentic 12-digit numeric UTR/Ref ID from your payment receipt (e.g. 428190123456)." },
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

    // If userId not found from session, try finding user in Firestore by email (namespaced)
    if (!userId && db) {
      try {
        const userQuery = query(collection(db, FS_COLLECTIONS.USERS), where("email", "==", userEmail));
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

    // If user is still not registered in Prisma/Firestore, create account on the fly
    if (!userId) {
      userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      try {
        const newPrismaUser = await prisma.user.create({
          data: {
            id: userId,
            name: userName,
            email: userEmail,
            passwordHash: userId,
            role: "USER",
            status: "ACTIVE",
            emailVerified: true,
            wallet: {
              create: {
                balance: 0.0,
                currency: "INR",
              },
            },
          },
        });
        userId = newPrismaUser.id;
      } catch {}

      if (db) {
        try {
          await setDoc(doc(db, FS_COLLECTIONS.USERS, userId), {
            id: userId,
            uid: userId,
            name: userName,
            email: userEmail,
            role: "USER",
            walletBalance: 0.0,
            status: "ACTIVE",
            createdAt: nowIso,
          });
        } catch {}
      }
    }

    // 5. ENFORCE STRICT SINGLE-USE UTR CONSTRAINT
    // Check A: Firestore direct primary key lookup (namespaced)
    if (db) {
      try {
        const utrDocRef = doc(db, FS_COLLECTIONS.UPI_DEPOSITS, `utr_${cleanUtr}`);
        const utrDocSnap = await getDoc(utrDocRef);
        if (utrDocSnap.exists()) {
          return NextResponse.json(
            { error: `This UPI Reference Number (UTR: ${cleanUtr}) has already been submitted or redeemed. Each transaction reference can only be used once.` },
            { status: 400 }
          );
        }

        // Check B: Query for legacy deposits where document ID was randomized
        const q1 = query(collection(db, FS_COLLECTIONS.UPI_DEPOSITS), where("utr", "==", cleanUtr));
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
    const depositId = `utr_${cleanUtr}`;
    // Auto-approve is disabled by default so fake/random UTRs cannot steal balance
    // Manual deposits are safely queued for Administrator verification against bank statements
    const isAutoApprove = settings.upi_auto_approve === true;

    if (isAutoApprove) {
      // ─────────────────────────────────────────────────────────────
      // INSTANT UTR AUTO-APPROVAL FLOW: Immediately credit wallet
      // ─────────────────────────────────────────────────────────────
      let updatedBalance = amount;

      // 1. Credit Wallet in Cloud Firestore and Prisma
      try {
        const depositResult = await WalletService.depositFunds({
          userId,
          amount,
          referenceId: cleanUtr,
          description: `Instant UPI auto-credit (UTR: ${cleanUtr})`,
          gateway: "MANUAL_UPI",
        });
        if (depositResult.success) {
          updatedBalance = depositResult.balanceAfter;
        }
      } catch (e) {
        console.warn("Wallet depositFunds error:", e);
      }

      // 3. Record Payment in Prisma for accounting and legal compliance
      try {
        await prisma.payment.create({
          data: {
            id: depositId,
            userId,
            gateway: "MANUAL_UPI",
            gatewayReference: cleanUtr,
            amount,
            currency: "INR",
            status: "SUCCESSFUL",
            metadata: JSON.stringify({
              utr: cleanUtr,
              originalUtr: rawUtr,
              userEmail,
              userName,
              ipAddress,
              userAgent,
              submittedAt: nowIso,
              approvedAt: nowIso,
              approvedBy: "INSTANT_UTR_SYSTEM",
            }),
          },
        });
      } catch (payErr) {
        console.warn("Prisma Payment save error:", payErr);
      }

      // 4. Log Audit Activity for safe harbor & cyber cell compliance
      try {
        await prisma.auditLog.create({
          data: {
            action: "UPI_DEPOSIT_INSTANT_CREDIT",
            targetType: "PAYMENT",
            targetId: cleanUtr,
            ipAddress,
            metadata: JSON.stringify({
              userId,
              userEmail,
              amount,
              utr: cleanUtr,
              ipAddress,
              userAgent,
              timestamp: nowIso,
            }),
          },
        });
      } catch {}

      // 5. Record deposit in Firestore (namespaced)
      if (db) {
        try {
          await setDoc(doc(db, FS_COLLECTIONS.UPI_DEPOSITS, depositId), {
            id: depositId,
            userId,
            userName,
            userEmail,
            amount,
            utr: cleanUtr,
            originalUtr: rawUtr,
            ipAddress,
            userAgent,
            status: "APPROVED",
            gateway: "MANUAL_UPI",
            approvedAt: nowIso,
            approvedBy: "INSTANT_UTR_SYSTEM",
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
        message: `₹${amount.toFixed(2)} credited to your account (${userEmail}) instantly! UTR: ${cleanUtr}`,
      });
    } else {
      // ─────────────────────────────────────────────
      // MANUAL REVIEW FLOW (Fallback if auto-approve explicitly turned off)
      // ─────────────────────────────────────────────
      if (db) {
        try {
          await setDoc(doc(db, FS_COLLECTIONS.UPI_DEPOSITS, depositId), {
            id: depositId,
            userId,
            userName,
            userEmail,
            amount,
            utr: cleanUtr,
            originalUtr: rawUtr,
            ipAddress,
            userAgent,
            status: "PENDING",
            gateway: "MANUAL_UPI",
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        } catch (e) {
          console.warn("Firestore save deposit warning:", e);
        }
      }

      try {
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
              ipAddress,
              userAgent,
              submittedAt: nowIso,
            }),
          },
        });
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
