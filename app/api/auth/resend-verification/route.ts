import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Please provide your email address." },
        { status: 400 }
      );
    }

    const result = await AuthService.resendVerification(email);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to resend verification email." },
      { status: 400 }
    );
  }
}
