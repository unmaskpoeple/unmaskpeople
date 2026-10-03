import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import { SettingsService } from "@/services/settings.service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const settings = await SettingsService.getAllSettings();

    return NextResponse.json({
      success: true,
      upi_enabled: settings.upi_enabled !== false,
      upi_id: settings.upi_id || "numverge@upi",
      upi_payee_name: settings.upi_payee_name || "NumVerge OTP",
      upi_qr_image_url: settings.upi_qr_image_url || "",
      upi_auto_approve: settings.upi_auto_approve === true,
      upi_min_deposit: Number(settings.upi_min_deposit ?? 10),
      upi_instructions:
        settings.upi_instructions ||
        "Scan the UPI QR code using any UPI app (GPay, PhonePe, Paytm, BHIM) and enter the 12-digit UTR/Reference number below.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch gateway configuration" },
      { status: err.message.includes("Admin") ? 403 : 401 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const {
      upi_enabled,
      upi_id,
      upi_payee_name,
      upi_qr_image_url,
      upi_auto_approve,
      upi_min_deposit,
      upi_instructions,
    } = body;

    const updates: any = {};
    if (typeof upi_enabled === "boolean") updates.upi_enabled = upi_enabled;
    if (typeof upi_id === "string") updates.upi_id = upi_id.trim();
    if (typeof upi_payee_name === "string") updates.upi_payee_name = upi_payee_name.trim();
    if (typeof upi_qr_image_url === "string") updates.upi_qr_image_url = upi_qr_image_url.trim();
    if (typeof upi_auto_approve === "boolean") updates.upi_auto_approve = upi_auto_approve;
    if (!isNaN(Number(upi_min_deposit))) updates.upi_min_deposit = Number(upi_min_deposit);
    if (typeof upi_instructions === "string") updates.upi_instructions = upi_instructions.trim();

    const newSettings = await SettingsService.updateSettings(updates);

    return NextResponse.json({
      success: true,
      message: "Manual UPI gateway configuration saved successfully!",
      settings: {
        upi_enabled: newSettings.upi_enabled,
        upi_id: newSettings.upi_id,
        upi_payee_name: newSettings.upi_payee_name,
        upi_auto_approve: newSettings.upi_auto_approve,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update payment gateway settings" },
      { status: 400 }
    );
  }
}
