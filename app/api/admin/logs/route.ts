import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const searchParams = req.nextUrl.searchParams;

    const status = searchParams.get("status") || "ALL";
    const apiConfigId = searchParams.get("apiConfigId") || "ALL";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status !== "ALL") where.status = status;
    if (apiConfigId !== "ALL") where.apiConfigId = apiConfigId;

    const [logs, total] = await Promise.all([
      prisma.apiRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          apiConfig: { select: { id: true, name: true } },
        },
      }),
      prisma.apiRequest.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
