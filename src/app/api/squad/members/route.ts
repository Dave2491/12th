import { NextRequest, NextResponse } from "next/server";
import { apiError, serverSupabase } from "@/lib/server-api";

export async function GET(request: NextRequest) {
  try {
    const countryCode = request.nextUrl.searchParams.get("countryCode");
    if (!countryCode) return apiError("countryCode is required.");

    const { data, error } = await serverSupabase
      .from("fan_profiles")
      .select("wallet_address, display_name, total_points, joined_at")
      .eq("country_code", countryCode.toUpperCase())
      .order("total_points", { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ members: data ?? [] });
  } catch (error) {
    console.error("GET /api/squad/members failed", error);
    return apiError("Unable to load squad members.", 500);
  }
}
