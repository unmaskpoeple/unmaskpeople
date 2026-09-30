import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import { ReferralService } from "@/services/referral.service";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const data = await ReferralService.getUserReferralData(user.id);
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch referral data" },
      { status: err.message.includes("Authentication") ? 401 : 400 }
    );
  }
}
