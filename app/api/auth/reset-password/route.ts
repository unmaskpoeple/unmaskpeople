import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) {
      return NextResponse.json({ error: "Reset token and new password are required." }, { status: 400 });
    }

    // Decode token: rst_<base64UserId>
    const b64 = token.replace("rst_", "");
    let userId = "";
    try {
      userId = Buffer.from(b64, "base64").toString("utf8");
    } catch {
      return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 400 });
    }

    const result = await AuthService.resetPassword(userId, newPassword);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
