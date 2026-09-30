import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import { WalletService } from "@/services/wallet.service";
import { AuditService } from "@/services/audit.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const { type, amount, reason } = body;

    if (!type || !["MANUAL_CREDIT", "MANUAL_DEBIT"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid adjustment type. Must be MANUAL_CREDIT or MANUAL_DEBIT." },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number greater than 0." },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "A detailed audit reason (at least 5 characters) is mandatory for financial adjustments." },
        { status: 400 }
      );
    }

    // Execute atomic wallet adjustment
    const result = await WalletService.adminManualAdjustment({
      userId: params.id,
      type,
      amount: numAmount,
      reason: reason.trim(),
      adminId: admin.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Record admin audit log
    await AuditService.record({
      adminId: admin.id,
      action: type === "MANUAL_CREDIT" ? "ADMIN_CREDIT_WALLET" : "ADMIN_DEBIT_WALLET",
      targetType: "WALLET",
      targetId: params.id,
      metadata: {
        adjustmentAmount: numAmount,
        reason: reason.trim(),
        balanceBefore: result.balanceBefore,
        balanceAfter: result.balanceAfter,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${type === "MANUAL_CREDIT" ? "credited" : "debited"} ₹${numAmount.toFixed(2)}. New balance: ₹${result.balanceAfter.toFixed(2)}.`,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
