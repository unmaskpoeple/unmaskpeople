import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/jwt";
import { PaymentService } from "@/services/payment.service";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await requireUser(req);
    const body = await req.json();
    const amount = Number(body.amount);

    if (isNaN(amount) || amount < 10) {
      return NextResponse.json(
        { error: "Minimum recharge amount is ₹10.00" },
        { status: 400 }
      );
    }

    if (amount > 100000) {
      return NextResponse.json(
        { error: "Maximum single recharge amount is ₹1,00,000.00" },
        { status: 400 }
      );
    }

    const order = await PaymentService.initiateDeposit({
      userId: sessionUser.id,
      amount,
      gateway: body.gateway || "GATEWAY_SIMULATOR",
    });

    return NextResponse.json({
      success: true,
      order,
      message: "Payment order initialized successfully.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
