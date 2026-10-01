import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, uid } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isMasterAdmin = cleanEmail === "zh@gmail.com";
    const userRole = isMasterAdmin ? "ADMIN" : "USER";
    const initialBalance = isMasterAdmin ? 10000.0 : 50.0;

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { wallet: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: name || (isMasterAdmin ? "Master Admin" : cleanEmail.split("@")[0]),
          email: cleanEmail,
          passwordHash: uid || "FIREBASE_AUTH_PROVIDER",
          role: userRole,
          status: "ACTIVE",
          emailVerified: true,
          wallet: {
            create: {
              balance: initialBalance,
              currency: "INR",
            },
          },
        },
        include: { wallet: true },
      });
    } else {
      // Ensure role is correctly upgraded for master admin
      if (isMasterAdmin && user.role !== "ADMIN") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN", status: "ACTIVE", emailVerified: true },
          include: { wallet: true },
        });
      }
    }

    // Generate session JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        walletBalance: user.wallet?.balance ?? initialBalance,
        currency: "INR",
        createdAt: user.createdAt.toISOString(),
      },
      token,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error("Firebase sync error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to synchronize Firebase session" },
      { status: 500 }
    );
  }
}
