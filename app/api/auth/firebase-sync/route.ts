import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
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
    // All new user profiles initialize with 0.00 INR balance; funds are added online via UPI deposit
    const initialBalance = 0.0;

    const userId = uid || `usr_${Date.now()}`;
    const userName = name || (isMasterAdmin ? "Master Admin" : cleanEmail.split("@")[0]);

    let userDocData: any = null;

    // 1. Primary Cloud Firestore Sync (Always persistent in cloud)
    if (db) {
      try {
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const { FS_COLLECTIONS } = await import("@/lib/collections");
        const userDocRef = doc(db, FS_COLLECTIONS.USERS, userId);
        const userSnap = await getDoc(userDocRef);

        let existingDocSnap = userSnap.exists() ? userSnap : null;
        let targetDocRef = userDocRef;

        // If not found by document ID, check by email to prevent duplicate documents
        if (!existingDocSnap) {
          const q = query(collection(db, FS_COLLECTIONS.USERS), where("email", "==", cleanEmail));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            existingDocSnap = qSnap.docs[0];
            targetDocRef = qSnap.docs[0].ref;
          }
        }

        if (existingDocSnap && existingDocSnap.exists()) {
          userDocData = existingDocSnap.data();
          // Ensure master admin role is always maintained, but NEVER reset their balance!
          if (isMasterAdmin && userDocData.role !== "ADMIN") {
            userDocData.role = "ADMIN";
            await updateDoc(targetDocRef, {
              role: "ADMIN",
              status: "ACTIVE",
            });
          }
        } else {
          userDocData = {
            id: userId,
            uid: userId,
            name: userName,
            email: cleanEmail,
            role: userRole,
            status: "ACTIVE",
            emailVerified: true,
            walletBalance: initialBalance,
            currency: "INR",
            createdAt: new Date().toISOString(),
          };
          await setDoc(targetDocRef, userDocData);
        }
      } catch (firestoreErr) {
        console.warn("Firestore cloud sync warning:", firestoreErr);
      }
    }

    // 2. Best-effort local Prisma SQLite sync (safe if running locally, gracefully bypassed if on serverless)
    try {
      let localUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: { wallet: true },
      });

      if (!localUser) {
        localUser = await prisma.user.create({
          data: {
            id: userId,
            name: userName,
            email: cleanEmail,
            passwordHash: userId,
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
      } else if (isMasterAdmin && localUser.role !== "ADMIN") {
        await prisma.user.update({
          where: { id: localUser.id },
          data: { role: "ADMIN", status: "ACTIVE" },
        });
      }
    } catch (prismaErr) {
      // Ignore SQLite missing file on Vercel serverless
      console.warn("Prisma SQLite skipped on serverless:", prismaErr);
    }

    // Fallback in case Firestore write failed or was slow
    if (!userDocData) {
      userDocData = {
        id: userId,
        uid: userId,
        name: userName,
        email: cleanEmail,
        role: userRole,
        status: "ACTIVE",
        emailVerified: true,
        walletBalance: initialBalance,
        currency: "INR",
        createdAt: new Date().toISOString(),
      };
    }

    // 3. Issue secure JWT Session Token
    const token = signToken({
      userId: userDocData.id || userId,
      email: cleanEmail,
      role: userDocData.role || userRole,
      name: userDocData.name || userName,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userDocData.id || userId,
        name: userDocData.name || userName,
        email: cleanEmail,
        role: userDocData.role || userRole,
        status: userDocData.status || "ACTIVE",
        emailVerified: true,
        walletBalance: userDocData.walletBalance ?? initialBalance,
        currency: "INR",
        createdAt: userDocData.createdAt || new Date().toISOString(),
      },
      token,
    });

    // 4. Set HTTP-only Cookie for seamless Next.js route protection
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
