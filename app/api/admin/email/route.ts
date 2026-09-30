import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/jwt";
import { SettingsService } from "@/services/settings.service";
import { EmailService } from "@/services/email.service";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const settings = await SettingsService.getAllSettings();

    return NextResponse.json({
      smtp_enabled: settings.smtp_enabled,
      smtp_host: settings.smtp_host,
      smtp_port: settings.smtp_port,
      smtp_secure: settings.smtp_secure,
      smtp_user: settings.smtp_user,
      smtp_has_pass: Boolean(settings.smtp_pass),
      smtp_from_name: settings.smtp_from_name,
      smtp_from_email: settings.smtp_from_email,
      app_url: settings.app_url,
      require_email_verification: settings.require_email_verification,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (typeof body.smtp_enabled === "boolean") {
      updateData.smtp_enabled = body.smtp_enabled;
    }
    if (typeof body.require_email_verification === "boolean") {
      updateData.require_email_verification = body.require_email_verification;
    }
    if (typeof body.smtp_host === "string") {
      updateData.smtp_host = body.smtp_host.trim();
    }
    if (typeof body.smtp_port === "number" || typeof body.smtp_port === "string") {
      updateData.smtp_port = Number(body.smtp_port) || 587;
    }
    if (typeof body.smtp_secure === "boolean") {
      updateData.smtp_secure = body.smtp_secure;
    }
    if (typeof body.smtp_user === "string") {
      updateData.smtp_user = body.smtp_user.trim();
    }
    if (typeof body.smtp_pass === "string" && body.smtp_pass.trim() !== "") {
      updateData.smtp_pass = body.smtp_pass.trim();
    }
    if (typeof body.smtp_from_name === "string") {
      updateData.smtp_from_name = body.smtp_from_name.trim();
    }
    if (typeof body.smtp_from_email === "string") {
      updateData.smtp_from_email = body.smtp_from_email.trim();
    }
    if (typeof body.app_url === "string") {
      updateData.app_url = body.app_url.trim().replace(/\/$/, "");
    }

    const updated = await SettingsService.updateSettings(updateData);

    return NextResponse.json({
      success: true,
      message: "Email & SMTP settings saved successfully.",
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const body = await req.json();
    const targetEmail = body.targetEmail || sessionUser.email;

    const result = await EmailService.testConnection(targetEmail);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
