import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import { ReferralService } from "@/services/referral.service";
import { SettingsService } from "@/services/settings.service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const data = await ReferralService.getAllReferralsAdmin();
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch admin referral records" },
      { status: err.message.includes("Admin") ? 403 : 401 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { welcome_bonus, referral_bonus, referral_required_searches, referral_enabled } = body;

    const updates: any = {};
    if (typeof welcome_bonus === "number") updates.welcome_bonus = welcome_bonus;
    if (typeof referral_bonus === "number") updates.referral_bonus = referral_bonus;
    if (typeof referral_required_searches === "number") updates.referral_required_searches = referral_required_searches;
    if (typeof referral_enabled === "boolean") updates.referral_enabled = referral_enabled;

    const newSettings = await SettingsService.updateSettings(updates);
    return NextResponse.json({
      success: true,
      message: "Referral & welcome bonus settings updated successfully",
      settings: newSettings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update referral configuration" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const { referralId } = body;

    if (!referralId) {
      return NextResponse.json({ error: "Missing referralId" }, { status: 400 });
    }

    const result = await ReferralService.manuallyCreditReferral(referralId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to credit referral manually" },
      { status: 400 }
    );
  }
}
