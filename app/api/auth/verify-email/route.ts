import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { AUTH_COOKIE_NAME } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Verification token is missing. Please use the link sent to your email." },
      { status: 400 }
    );
  }

  try {
    const result = await AuthService.verifyEmail(token);

    const response = NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to verify email. Link may have expired." },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body.token || req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required." },
        { status: 400 }
      );
    }

    const result = await AuthService.verifyEmail(token);

    const response = NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to verify email. Link may have expired." },
      { status: 400 }
    );
  }
}
