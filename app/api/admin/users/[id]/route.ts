import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { AuditService } from "@/services/audit.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(req);

    // 1. Try Firestore
    if (db) {
      try {
        const userDoc = await getDoc(doc(db, "users", params.id));
        if (userDoc.exists()) {
          const d = userDoc.data();
          return NextResponse.json({
            user: {
              id: params.id,
              name: d.name,
              email: d.email,
              role: d.role,
              status: d.status || "ACTIVE",
              emailVerified: d.emailVerified ?? true,
              wallet: { balance: d.walletBalance ?? 0, currency: "INR" },
              _count: { apiRequests: 0, walletTransactions: 0 },
            },
          });
        }
      } catch (e) {
        // Fallback to Prisma
      }
    }

    // 2. Try Prisma
    try {
      const user = await prisma.user.findUnique({
        where: { id: params.id },
        include: {
          wallet: true,
          _count: {
            select: { apiRequests: true, walletTransactions: true },
          },
        },
      });

      if (user) {
        const { passwordHash, ...safeUser } = user;
        return NextResponse.json({ user: safeUser });
      }
    } catch (e) {
      // Prisma missing
    }

    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { status, role, resetPassword, name } = body;

    const updates: any = {};
    if (status && ["ACTIVE", "DISABLED", "SUSPENDED"].includes(status)) {
      updates.status = status;
    }
    if (role && ["USER", "ADMIN"].includes(role)) {
      updates.role = role;
    }
    if (name) {
      updates.name = name.trim();
    }

    // 1. Update in Cloud Firestore
    let fsUpdated = false;
    if (db) {
      try {
        const userRef = doc(db, "users", params.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          await updateDoc(userRef, updates);
          fsUpdated = true;
        }
      } catch (fsErr) {
        console.warn("Firestore user update warning:", fsErr);
      }
    }

    // 2. Update in Prisma if available
    let safeUser: any = null;
    try {
      if (resetPassword && resetPassword.length >= 8) {
        updates.passwordHash = await bcrypt.hash(resetPassword, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id: params.id },
        data: updates,
      });
      const { passwordHash, ...safe } = updatedUser;
      safeUser = safe;
    } catch (prismaErr) {
      // Prisma optional on serverless
    }

    // Record Audit Log safely
    await AuditService.record({
      adminId: admin.id,
      action: "UPDATE_USER",
      targetType: "USER",
      targetId: params.id,
      metadata: { updates },
    });

    return NextResponse.json({
      success: true,
      message: "User account updated successfully.",
      user: safeUser || { id: params.id, ...updates },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
