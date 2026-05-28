import { NextRequest, NextResponse } from "next/server";
import { apiError, serverSupabase } from "@/lib/server-api";

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type") ?? "countries";

    if (type === "fans") {
      const { data, error } = await serverSupabase
        .from("fan_profiles")
        .select("*")
        .order("total_points", { ascending: false })
        .limit(50);

      if (error) throw error;
      return NextResponse.json({ type, leaderboard: data ?? [] });
    }

    const { data, error } = await serverSupabase
      .from("country_stats")
      .select("country_code, total_points")
      .gt("total_points", 0)
      .order("total_points", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ type: "countries", leaderboard: data ?? [] });
  } catch (error) {
    console.error("GET /api/leaderboard failed", error);
    return apiError("Unable to load leaderboard.", 500);
  }
}
