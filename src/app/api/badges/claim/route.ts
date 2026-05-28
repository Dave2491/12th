import { NextResponse } from "next/server";
import { apiError, badgeThreshold, getFanByWallet, isClaimableBadgeTier, normalizeWallet, serverSupabase } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const walletAddress = normalizeWallet(body.walletAddress);
    const badgeType = typeof body.badgeType === "string" ? body.badgeType.trim() : "";
    const tier = typeof body.tier === "string" ? body.tier.trim() : "";

    if (!walletAddress || !badgeType || !tier) {
      return apiError("walletAddress, badgeType, and tier are required.");
    }

    if (!isClaimableBadgeTier(tier)) {
      return apiError("Only Gold, Elite, and Legend tiers can be claimed onchain.");
    }

    const profile = await getFanByWallet(walletAddress);
    if (!profile) return apiError("Fan profile not found.", 404);

    const threshold = badgeThreshold(tier);
    if (profile.total_points < threshold) {
      return apiError(`Fan has not reached the ${tier} badge tier.`, 409);
    }

    const { data, error } = await serverSupabase
      .from("badge_progress")
      .upsert(
        {
          fan_id: profile.id,
          badge_type: badgeType,
          current_tier: tier,
          progress: profile.total_points,
          claimed_onchain: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "fan_id,badge_type" },
      )
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({
      badge: data,
      metadata: {
        name: `Twelfth ${tier} ${badgeType} Badge`,
        description: `${profile.country_code} fan badge earned through Twelfth World Cup engagement.`,
        attributes: [
          { trait_type: "Tier", value: tier },
          { trait_type: "Badge Type", value: badgeType },
          { trait_type: "Country", value: profile.country_code },
          { trait_type: "Points", value: profile.total_points },
        ],
      },
    });
  } catch (error) {
    console.error("POST /api/badges/claim failed", error);
    return apiError("Unable to claim badge.", 500);
  }
}
