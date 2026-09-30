import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const searchParams = req.nextUrl.searchParams;

    const query = searchParams.get("query") || "";
    const status = searchParams.get("status") || "ALL";
    const role = searchParams.get("role") || "ALL";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const skip = (page - 1) * limit;

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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
