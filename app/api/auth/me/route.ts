import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isMasterAdminEmail } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const isMaster = isMasterAdminEmail(sessionUser.email);
    let walletBalance = isMaster ? 10000 : 0;
    let userName = sessionUser.name;
    let userRole = isMaster ? "ADMIN" : sessionUser.role;
    let userStatus = "ACTIVE";

    // 1. Try fetching from Cloud Firestore
    if (db) {
      try {
        const userSnap = await getDoc(doc(db, "users", sessionUser.id));
        if (userSnap.exists()) {
          const data = userSnap.data();
          walletBalance = data.walletBalance ?? walletBalance;
          userName = data.name || userName;
          userRole = isMaster ? "ADMIN" : (data.role || userRole);
          userStatus = data.status || userStatus;
        }
      } catch (fsErr) {
        console.warn("Firestore fetch in /me skipped:", fsErr);
      }
    }

    // 2. Try fetching from Prisma (local fallback)
    try {
      const freshUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        include: { wallet: true },
      });
      if (freshUser) {
        walletBalance = freshUser.wallet?.balance ?? walletBalance;
        userName = freshUser.name || userName;
        userRole = isMaster ? "ADMIN" : (freshUser.role || userRole);
        userStatus = freshUser.status || userStatus;
      }
    } catch (prismaErr) {
      // Prisma missing on serverless - silent fallback
    }

    if (isMaster) {
      userRole = "ADMIN";
      userStatus = "ACTIVE";
      if (walletBalance < 10000) walletBalance = 10000;
    }

    if (userStatus !== "ACTIVE") {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: sessionUser.id,
        name: userName,
        email: sessionUser.email,
        role: userRole,
        status: userStatus,
        emailVerified: true,
        walletBalance,
        currency: "INR",
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
