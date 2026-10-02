import { NextResponse } from "next/server";
import { FiveSimService } from "@/services/fivesim.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const countries = await FiveSimService.getCountries();
    return NextResponse.json({
      success: true,
      count: countries.length,
      countries,
    });
  } catch (error: any) {
    console.error("Error in /api/otp/countries:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load countries" },
      { status: 500 }
    );
  }
}
