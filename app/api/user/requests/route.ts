import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import { RequestService } from "@/services/request.service";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireUser(req);
    const searchParams = req.nextUrl.searchParams;

    const status = searchParams.get("status") || "ALL";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    const result = await RequestService.getUserRequests({
      userId: sessionUser.id,
      status,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
