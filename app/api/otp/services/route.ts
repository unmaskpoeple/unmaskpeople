import { NextRequest, NextResponse } from "next/server";
import { FiveSimService } from "@/services/fivesim.service";
import { POPULAR_SERVICES } from "@/lib/fivesim-catalog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = (searchParams.get("country") || "usa").toLowerCase().trim();
    const operator = (searchParams.get("operator") || "any").toLowerCase().trim();

    const products = await FiveSimService.getProducts(country, operator);

    // Map categories and popular flags
    const enriched = products.map((p) => {
      const popMeta = POPULAR_SERVICES.find((s) => s.code.toLowerCase() === p.code.toLowerCase());
      return {
        ...p,
        category: popMeta?.category || "other",
        isPopular: !!popMeta,
        color: popMeta?.color,
      };
    });

    return NextResponse.json({
      success: true,
      country,
      operator,
      count: enriched.length,
      products: enriched,
    });
  } catch (error: any) {
    console.error("Error in /api/otp/services:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load services" },
      { status: 500 }
    );
  }
}
