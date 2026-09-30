import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    // Refresh wallet info from db
    const freshUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: { wallet: true },
    });

    if (!freshUser || freshUser.status !== "ACTIVE") {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: freshUser.id,
        name: freshUser.name,
        email: freshUser.email,
        role: freshUser.role,
        status: freshUser.status,
        emailVerified: freshUser.emailVerified,
        walletBalance: freshUser.wallet?.balance || 0,
        currency: freshUser.wallet?.currency || "INR",
        createdAt: freshUser.createdAt,
        referralCode: freshUser.referralCode,
        successfulSearchCount: freshUser.successfulSearchCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
