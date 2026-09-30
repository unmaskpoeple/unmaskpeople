import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import { AuditService } from "@/services/audit.service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const searchParams = req.nextUrl.searchParams;

    const action = searchParams.get("action") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await AuditService.getLogs({ action, page, limit });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
