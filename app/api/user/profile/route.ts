import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await requireUser(req);
    const body = await req.json();
    const { name, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updates: any = {};

    if (name && typeof name === "string") {
      updates.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to change password." }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: "Current password does not match." }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters long." }, { status: 400 });
      }
      updates.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
