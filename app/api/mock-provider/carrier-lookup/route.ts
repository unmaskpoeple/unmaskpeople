import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    // Validate mock authorization
    if (!authHeader || !authHeader.includes("Bearer")) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized. Missing or invalid Bearer token." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const phone = String(body.phone || body.number || "").replace(/\s+/g, "");

    if (!phone) {
      return NextResponse.json(
        { status: "error", message: "Missing required parameter 'phone'" },
        { status: 400 }
      );
    }

    // Determine carrier dynamically based on phone prefix
    let carrier = "Reliance Jio Infocomm";
    let circle = "Mumbai & Maharashtra";
    let lineType = "Mobile";

    if (phone.includes("98") || phone.includes("99")) {
      carrier = "Bharti Airtel Telecom";
      circle = "Delhi NCR & Northern";
    } else if (phone.includes("88") || phone.includes("77")) {
      carrier = "Vodafone Idea (Vi)";
      circle = "Karnataka & South";
    } else if (phone.startsWith("+1") || phone.startsWith("1")) {
      carrier = "AT&T Mobility LLC";
      circle = "North America / California";
    } else if (phone.startsWith("+44") || phone.startsWith("44")) {
      carrier = "Vodafone UK Limited";
      circle = "United Kingdom / London";
    }

    const isTestInvalid = phone.endsWith("0000");

    if (isTestInvalid) {
      return NextResponse.json({
        status: "error",
        message: "The entered phone number is not assigned or is currently disconnected by the provider.",
        data: {
          valid: false,
          phone,
          status: "Disconnected",
          reason: "Number not in service",
        },
      });
    }

    // Realistic telecom response
    return NextResponse.json({
      status: "success",
      message: "Phone number resolved successfully",
      data: {
        valid: true,
        phone,
        country: phone.startsWith("+1") ? "United States" : phone.startsWith("+44") ? "United Kingdom" : "India",
        country_code: phone.startsWith("+1") ? "US" : phone.startsWith("+44") ? "GB" : "IN",
        carrier,
        line_type: lineType,
        circle,
        mcc_mnc: "404-45",
        original_carrier: carrier,
        is_ported: false,
        roaming_status: "National Roaming Off",
        hlr_status: "Active / Reachable",
        fraud_risk: "Low",
        reputation_score: "98 / 100",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Provider internal error" },
      { status: 500 }
    );
  }
}
