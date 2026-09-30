import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuditService } from "@/services/audit.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(req);
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        wallet: true,
        _count: {
          select: { apiRequests: true, walletTransactions: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
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

    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
    if (resetPassword && resetPassword.length >= 8) {
      updates.passwordHash = await bcrypt.hash(resetPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updates,
    });

    // Record Audit Log
    await AuditService.record({
      adminId: admin.id,
      action: "UPDATE_USER",
      targetType: "USER",
      targetId: params.id,
      metadata: {
        previous: { status: existingUser.status, role: existingUser.role },
        updated: { status: updatedUser.status, role: updatedUser.role, passwordReset: !!resetPassword },
      },
    });

    const { passwordHash, ...safeUser } = updatedUser;
    return NextResponse.json({
      success: true,
      message: "User updated successfully.",
      user: safeUser,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
