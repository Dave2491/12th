import { NextResponse } from "next/server";
import { apiError, getFanByWallet, normalizeWallet, serverSupabase } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const walletAddress = normalizeWallet(body.walletAddress);
    const fixtureId = Number(body.fixtureId);
    const predictedWinner = typeof body.predictedWinner === "string" ? body.predictedWinner.trim() : "";
    const predictedHomeScore = Number(body.predictedHomeScore);
    const predictedAwayScore = Number(body.predictedAwayScore);

    if (!walletAddress || !Number.isInteger(fixtureId) || !predictedWinner) {
      return apiError("walletAddress, fixtureId, and predictedWinner are required.");
    }

    const profile = await getFanByWallet(walletAddress);
    if (!profile) return apiError("Fan profile not found.", 404);

    const { data: fixture, error: fixtureError } = await serverSupabase
      .from("fixtures")
      .select("id, kickoff_utc, home_team, away_team")
      .eq("id", fixtureId)
      .single();

    if (fixtureError) throw fixtureError;
    if (new Date(fixture.kickoff_utc).getTime() <= Date.now()) {
      return apiError("Predictions must be submitted before kickoff.", 409);
    }

    const { data: existing, error: existingError } = await serverSupabase
      .from("predictions")
      .select("id")
      .eq("fan_id", profile.id)
      .eq("fixture_id", fixtureId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) return apiError("Prediction already submitted for this fixture.", 409);

    const { data, error } = await serverSupabase
      .from("predictions")
      .insert({
        fan_id: profile.id,
        fixture_id: fixtureId,
        predicted_winner: predictedWinner,
        predicted_home_score: Number.isFinite(predictedHomeScore) ? predictedHomeScore : null,
        predicted_away_score: Number.isFinite(predictedAwayScore) ? predictedAwayScore : null,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ prediction: data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/predictions failed", error);
    return apiError("Unable to submit prediction.", 500);
  }
}
