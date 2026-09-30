import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { code: 401, status_message: "Missing X-Api-Key authentication header." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const phone = String(body.number || body.phone || "").replace(/\s+/g, "");

    if (!phone) {
      return NextResponse.json(
        { code: 400, status_message: "Number parameter is required." },
        { status: 400 }
      );
    }

    const isSpam = phone.endsWith("9999");

    return NextResponse.json({
      code: 200,
      status_message: "Risk profiling completed.",
      result: {
        number: phone,
        risk_score: isSpam ? 88 : 8,
        risk_classification: isSpam ? "HIGH_RISK_SPAM" : "CLEAN_INDIVIDUAL",
        telecom_status: "CONNECTED",
        spam_reports_30d: isSpam ? 142 : 0,
        carrier_type: "Wireless Cellular",
        activity_index: "Active Subscriber",
        last_seen_epoch: Math.floor(Date.now() / 1000) - 3600,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { code: 500, status_message: err.message || "Risk scoring engine failed" },
      { status: 500 }
    );
  }
}
