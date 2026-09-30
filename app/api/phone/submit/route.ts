import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import { RequestService } from "@/services/request.service";

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce user authentication & active status
    const sessionUser = await requireUser(req);

    const body = await req.json();
    const phoneInput = body.phone || body.phoneNumber;
    const { countryCode, apiConfigId } = body;

    if (!phoneInput || typeof phoneInput !== "string") {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 2. Execute full transactional lookup pipeline
    const result = await RequestService.processPhoneSubmission({
      userId: sessionUser.id,
      phone: phoneInput.trim(),
      countryCode: countryCode || "+91",
      apiConfigId: apiConfigId || undefined,
      ipAddress,
    });

    return NextResponse.json({
      success: result.success,
      status: result.status,
      requestId: result.requestId,
      phone: result.phone,
      latencyMs: result.latencyMs,
      amountCharged: result.amountCharged,
      isRefunded: result.isRefunded,
      message: result.message,
      data: result.data,
      raw: result.raw,
      apiUsed: result.apiUsed,
      walletBalance: result.walletBalance,
    });
  } catch (err: any) {
    const status =
      err.message.includes("Insufficient") ? 402 :
      err.message.includes("Rate limit") ? 429 :
      err.message.includes("disabled") || err.message.includes("suspended") ? 403 :
      err.message.includes("Authentication") ? 401 : 400;

    return NextResponse.json(
      { error: err.message || "Failed to process phone submission." },
      { status }
    );
  }
}
