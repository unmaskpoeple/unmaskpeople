import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import { SettingsService } from "@/services/settings.service";
import { AuditService } from "@/services/audit.service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const settings = await SettingsService.getAllSettings();
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();

    const currentSettings = await SettingsService.getAllSettings();
    const updated = await SettingsService.updateSettings(body);

    await AuditService.record({
      adminId: admin.id,
      action: "UPDATE_SYSTEM_SETTINGS",
      targetType: "SETTINGS",
      targetId: "SYSTEM_SETTINGS",
      metadata: { previous: currentSettings, updated },
    });

    return NextResponse.json({
      success: true,
      message: "System settings and pricing policies updated successfully.",
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
