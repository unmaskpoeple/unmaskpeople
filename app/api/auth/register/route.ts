import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { AUTH_COOKIE_NAME } from "@/lib/jwt";
import { SettingsService } from "@/services/settings.service";

export async function POST(req: NextRequest) {
  try {
    const settings = await SettingsService.getAllSettings();
    if (!settings.registration_enabled) {
      return NextResponse.json(
        { error: "Public registration is currently disabled by administrator." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, referralCode } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Please provide your name, email, and password." },
        { status: 400 }
      );
    }

    const result = await AuthService.register({
      name,
      email,
      password,
      referralCode: referralCode?.trim(),
    });

    const response = NextResponse.json({
      success: true,
      requiresVerification: result.requiresVerification,
      user: result.user,
      message: result.message,
      simulatedActivationUrl: result.simulatedActivationUrl,
    });

    // Only set auth cookie if verification is NOT required
    if (!result.requiresVerification && result.token) {
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: result.token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Registration failed. Please try again." },
      { status: 400 }
    );
  }
}
