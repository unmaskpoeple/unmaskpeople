import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { AUTH_COOKIE_NAME } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, requiredRole } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const result = await AuthService.login({ email, password, requiredRole });

    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: "Authentication successful.",
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Invalid credentials." },
      { status: 401 }
    );
  }
}
