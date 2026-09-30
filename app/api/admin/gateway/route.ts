import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import { SettingsService } from "@/services/settings.service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const settings = await SettingsService.getAllSettings();

    return NextResponse.json({
      success: true,
      razorpay_enabled: settings.razorpay_enabled,
      razorpay_key_id: settings.razorpay_key_id || "",
      // Mask secret for UI security: show last 4 chars
      razorpay_key_secret_masked: settings.razorpay_key_secret
        ? `••••••••••••${settings.razorpay_key_secret.slice(-4)}`
        : "",
      razorpay_has_secret: Boolean(settings.razorpay_key_secret),
      razorpay_webhook_secret: settings.razorpay_webhook_secret || "",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch payment gateway configuration" },
      { status: err.message.includes("Admin") ? 403 : 401 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const {
      razorpay_enabled,
      razorpay_key_id,
      razorpay_key_secret,
      razorpay_webhook_secret,
    } = body;

    const updates: any = {};
    if (typeof razorpay_enabled === "boolean") updates.razorpay_enabled = razorpay_enabled;
    if (typeof razorpay_key_id === "string") updates.razorpay_key_id = razorpay_key_id.trim();
    if (typeof razorpay_key_secret === "string" && razorpay_key_secret.trim() !== "") {
      updates.razorpay_key_secret = razorpay_key_secret.trim();
    }
    if (typeof razorpay_webhook_secret === "string") {
      updates.razorpay_webhook_secret = razorpay_webhook_secret.trim();
    }

    const newSettings = await SettingsService.updateSettings(updates);

    return NextResponse.json({
      success: true,
      message: "Razorpay payment gateway configuration saved successfully!",
      settings: {
        razorpay_enabled: newSettings.razorpay_enabled,
        razorpay_key_id: newSettings.razorpay_key_id,
        razorpay_has_secret: Boolean(newSettings.razorpay_key_secret),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update payment gateway settings" },
      { status: 400 }
    );
  }
}
