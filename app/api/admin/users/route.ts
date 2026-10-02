import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const searchParams = req.nextUrl.searchParams;

    const query = searchParams.get("query")?.toLowerCase() || "";
    const status = searchParams.get("status") || "ALL";
    const role = searchParams.get("role") || "ALL";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const skip = (page - 1) * limit;

    // 1. Try Cloud Firestore (online cloud database)
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const fsUsers: any[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fsUsers.push({
            id: doc.id,
            name: data.name || doc.id,
            email: data.email || "",
            role: (data.email === "zh@gmail.com" ? "ADMIN" : data.role) || "USER",
            status: data.status || "ACTIVE",
            emailVerified: data.emailVerified ?? true,
            createdAt: data.createdAt || new Date().toISOString(),
            wallet: {
              balance: Number(data.walletBalance ?? 0.0),
              currency: "INR",
            },
            _count: { apiRequests: 0, walletTransactions: 0 },
          });
        });

        if (fsUsers.length > 0) {
          let filtered = fsUsers;
          if (query) {
            filtered = filtered.filter(
              (u) =>
                u.name?.toLowerCase().includes(query) ||
                u.email?.toLowerCase().includes(query)
            );
          }
          if (status !== "ALL") filtered = filtered.filter((u) => u.status === status);
          if (role !== "ALL") filtered = filtered.filter((u) => u.role === role);

          return NextResponse.json({
            users: filtered.slice(skip, skip + limit),
            total: filtered.length,
            page,
            totalPages: Math.ceil(filtered.length / limit) || 1,
          });
        }
      } catch (fsErr) {
        console.warn("Firestore admin users fetch warning:", fsErr);
      }
    }

    // 2. Try Prisma SQLite (Local fallback)
    try {
      const where: any = {};
      if (query) {
        where.OR = [
          { name: { contains: query } },
          { email: { contains: query } },
        ];
      }
      if (status !== "ALL") where.status = status;
      if (role !== "ALL") where.role = role;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            emailVerified: true,
            createdAt: true,
            wallet: {
              select: { balance: true, currency: true },
            },
            _count: {
              select: {
                apiRequests: true,
                walletTransactions: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      return NextResponse.json({
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (e) {
      // Prisma missing on serverless - return at least Master Admin
    }

    return NextResponse.json({
      users: [
        {
          id: "admin_zh",
          name: "Master Admin",
          email: "zh@gmail.com",
          role: "ADMIN",
          status: "ACTIVE",
          emailVerified: true,
          createdAt: new Date().toISOString(),
          wallet: { balance: 10000, currency: "INR" },
          _count: { apiRequests: 0, walletTransactions: 0 },
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
