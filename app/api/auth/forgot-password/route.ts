import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    const result = await AuthService.requestPasswordReset(email);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
