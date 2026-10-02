import { NextResponse } from "next/server";
import { SettingsService } from "@/services/settings.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await SettingsService.getAllSettings();
    return NextResponse.json(
      {
        phoneCost: Number(settings.default_cost_per_request ?? 3.5),
        minWalletBalance: Number(settings.min_wallet_balance ?? 0.0),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json({
      phoneCost: 3.5,
      minWalletBalance: 0.0,
    });
  }
}
