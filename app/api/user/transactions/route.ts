import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import { WalletService } from "@/services/wallet.service";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await requireUser(req);
    const searchParams = req.nextUrl.searchParams;

    const type = searchParams.get("type") || "ALL";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    const result = await WalletService.getTransactions({
      userId: sessionUser.id,
      type,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
