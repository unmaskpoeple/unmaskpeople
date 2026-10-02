import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import { SettingsService } from "@/services/settings.service";
import { WalletService } from "@/services/wallet.service";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await requireUser(req);
    const body = await req.json();

    const amount = Number(body.amount);
    const utr = String(body.utr || "").trim();

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

    // Validate UTR format (Indian UPI UTRs are 12 digits, but allow 8-25 alphanumeric to be safe)
    if (!utr || utr.length < 6 || utr.length > 30) {
      return NextResponse.json(
        { error: "Please enter a valid 12-digit UPI Reference Number / UTR." },
        { status: 400 }
      );
    }

    // Check for duplicate UTR submissions in Firestore
    if (db) {
      try {
        const dupQuery = query(
          collection(db, "upi_deposits"),
          where("utr", "==", utr)
        );
        const dupSnap = await getDocs(dupQuery);
        if (!dupSnap.empty) {
          return NextResponse.json(
            { error: "This UPI Reference Number (UTR) has already been submitted." },
            { status: 400 }
          );
        }
      } catch (e) {
        console.warn("Firestore duplicate check warning:", e);
      }
    }

    // Also check Prisma Payment table if available
    try {
      const existingPayment = await prisma.payment.findFirst({
        where: { gatewayReference: utr },
      });
      if (existingPayment) {
        return NextResponse.json(
          { error: "This UPI Reference Number (UTR) has already been submitted." },
          { status: 400 }
        );
      }
    } catch {}

    const settings = await SettingsService.getAllSettings();
    const depositId = `upi_dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const isAutoApprove = settings.upi_auto_approve === true;

    if (isAutoApprove) {
      // 1. Instantly credit user wallet
      const depositResult = await WalletService.depositFunds({
        userId: sessionUser.id,
        amount,
        referenceId: utr,
        description: `Manual UPI deposit (UTR: ${utr})`,
        gateway: "MANUAL_UPI",
      });

      // Also ensure Firestore user wallet is updated
      if (db) {
        try {
          const { getDoc, updateDoc } = await import("firebase/firestore");
          const userRef = doc(db, "users", sessionUser.id);
          const uSnap = await getDoc(userRef);
          if (uSnap.exists()) {
            const currentBal = Number((uSnap.data().walletBalance ?? 0.0).toFixed(2));
            await updateDoc(userRef, {
              walletBalance: Number((currentBal + amount).toFixed(2)),
            });
          }
        } catch {}
      }

      // Record deposit in Firestore
      if (db) {
        try {
          await setDoc(doc(db, "upi_deposits", depositId), {
            id: depositId,
            userId: sessionUser.id,
            userName: sessionUser.name || "User",
            userEmail: sessionUser.email,
            amount,
            utr,
            status: "APPROVED",
            gateway: "MANUAL_UPI",
            approvedAt: nowIso,
            approvedBy: "AUTO_APPROVAL_SYSTEM",
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        } catch {}
      }

      const updatedWallet = await WalletService.getWallet(sessionUser.id);

      return NextResponse.json({
        success: true,
        status: "APPROVED",
        depositId,
        walletBalance: updatedWallet.balance,
        message: `₹${amount.toFixed(2)} credited to your wallet successfully!`,
      });
    } else {
      // Manual Admin Review Flow: Record deposit with status "PENDING"
      if (db) {
        try {
          await setDoc(doc(db, "upi_deposits", depositId), {
            id: depositId,
            userId: sessionUser.id,
            userName: sessionUser.name || "User",
            userEmail: sessionUser.email,
            amount,
            utr,
            status: "PENDING",
            gateway: "MANUAL_UPI",
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        } catch (e) {
          console.warn("Firestore save deposit warning:", e);
        }
      }

      // Prisma record if available
      try {
        await prisma.payment.create({
          data: {
            id: depositId,
            userId: sessionUser.id,
            gateway: "MANUAL_UPI",
            gatewayReference: utr,
            amount,
            currency: "INR",
            status: "PENDING",
            metadata: JSON.stringify({
              utr,
              userEmail: sessionUser.email,
              userName: sessionUser.name,
              submittedAt: nowIso,
            }),
          },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        status: "PENDING",
        depositId,
        message: `Deposit request of ₹${amount.toFixed(2)} (UTR: ${utr}) submitted successfully. Your wallet will be credited shortly upon admin verification.`,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit deposit" }, { status: 400 });
  }
}
