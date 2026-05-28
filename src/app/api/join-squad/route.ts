import { NextResponse } from "next/server";
import { apiError, deriveFanRank, getFanByWallet, incrementCountryPoints, normalizeWallet, serverSupabase } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const walletAddress = normalizeWallet(body.walletAddress);
    const countryCode = typeof body.countryCode === "string" ? body.countryCode.trim() : "";

    if (!walletAddress || !countryCode) return apiError("walletAddress and countryCode are required.");

    const existing = await getFanByWallet(walletAddress);
    if (existing) return apiError("Wallet is already registered. Country selection is permanent.", 409);

    const { data: profile, error } = await serverSupabase
      .from("fan_profiles")
      .insert({
        wallet_address: walletAddress,
        country_code: countryCode,
        total_points: 0,
        check_in_streak: 0,
        longest_streak: 0,
        badge_count: 0,
        prediction_streak: 0,
        fan_rank: deriveFanRank(0),
      })
      .select("*")
      .single();

    if (error) throw error;

    await incrementCountryPoints(countryCode, 0, 1);

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error("POST /api/join-squad failed", error);
    return apiError("Unable to join squad.", 500);
  }
}
