import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireUser(req);

    const apis = await prisma.apiConfig.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        cost: true,
        isActive: true,
      },
      orderBy: { cost: "asc" },
    });

    return NextResponse.json({ apis });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
