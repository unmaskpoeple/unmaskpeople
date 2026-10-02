import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isMasterAdminEmail } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const isMaster = isMasterAdminEmail(sessionUser.email);
    let walletBalance = 0;
    let userName = sessionUser.name;
    let userRole = isMaster ? "ADMIN" : sessionUser.role;
    let userStatus = "ACTIVE";
    let foundInFirestore = false;

    // 1. Primary: Fetch live balance directly from Cloud Firestore (Online database)
    if (db) {
      try {
        let userSnap = null;
        if (sessionUser.id) {
          userSnap = await getDoc(doc(db, "users", sessionUser.id));
        }

        if (userSnap && userSnap.exists()) {
          const data = userSnap.data();
          walletBalance = Number(data.walletBalance ?? 0);
          userName = data.name || userName;
          userRole = isMaster ? "ADMIN" : (data.role || userRole);
          userStatus = data.status || userStatus;
          foundInFirestore = true;
        } else if (sessionUser.email) {
          // If doc ID was not matched directly, find by email in Firestore
          const cleanEmail = sessionUser.email.trim().toLowerCase();
          const q = query(collection(db, "users"), where("email", "==", cleanEmail));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const data = qSnap.docs[0].data();
            walletBalance = Number(data.walletBalance ?? 0);
            userName = data.name || userName;
            userRole = isMaster ? "ADMIN" : (data.role || userRole);
            userStatus = data.status || userStatus;
            foundInFirestore = true;
          }
        }
      } catch (fsErr) {
        console.warn("Firestore fetch in /me skipped:", fsErr);
      }
    }

    // 2. Secondary: Fallback to local Prisma only if Firestore was unreachable
    if (!foundInFirestore) {
      try {
        const freshUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: sessionUser.id },
              { email: sessionUser.email },
            ],
          },
          include: { wallet: true },
        });
        if (freshUser) {
          walletBalance = Number(freshUser.wallet?.balance ?? walletBalance);
          userName = freshUser.name || userName;
          userRole = isMaster ? "ADMIN" : (freshUser.role || userRole);
          userStatus = freshUser.status || userStatus;
        }
      } catch (prismaErr) {
        // Prisma missing on serverless - silent fallback
      }
    }

    if (isMaster) {
      userRole = "ADMIN";
      userStatus = "ACTIVE";
    }

    if (userStatus !== "ACTIVE") {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const response = NextResponse.json({
      authenticated: true,
      user: {
        id: sessionUser.id,
        name: userName,
        email: sessionUser.email,
        role: userRole,
        status: userStatus,
        emailVerified: true,
        walletBalance: Number(walletBalance.toFixed(2)),
        currency: "INR",
        createdAt: new Date().toISOString(),
      },
    });

    // Enforce no-cache so browser or network never caches the wallet balance
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
