import { NextResponse } from "next/server";
import { apiError, awardFanPoints, getFanByWallet, normalizeWallet, serverSupabase, todayUtcDate, tomorrowUtcDate } from "@/lib/server-api";

async function validateQuestCompletion(fanId: string, questId: string, profile: { check_in_streak: number; prediction_streak: number; last_check_in_date: string | null; badge_count: number }) {
  const today = todayUtcDate();
  const tomorrow = tomorrowUtcDate();

  if (questId === "daily-trivia") {
    const { data, error } = await serverSupabase
      .from("trivia_answers")
      .select("id")
      .eq("fan_id", fanId)
      .gte("answered_at", `${today}T00:00:00.000Z`)
      .lt("answered_at", `${tomorrow}T00:00:00.000Z`)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  if (questId === "match-checkin") return profile.last_check_in_date === today;

  if (questId === "first-prediction") {
    const { data, error } = await serverSupabase
      .from("predictions")
      .select("id")
      .eq("fan_id", fanId)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  if (questId === "prediction-streak-3") return profile.prediction_streak >= 3;
  if (questId === "checkin-streak-3") return profile.check_in_streak >= 3;

  if (questId === "mint-badge") {
    const { data, error } = await serverSupabase
      .from("badge_progress")
      .select("id")
      .eq("fan_id", fanId)
      .eq("claimed_onchain", true)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return profile.badge_count > 0 || Boolean(data);
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const walletAddress = normalizeWallet(body.walletAddress);
    const questId = typeof body.questId === "string" ? body.questId.trim() : "";

    if (!walletAddress || !questId) return apiError("walletAddress and questId are required.");

    const profile = await getFanByWallet(walletAddress);
    if (!profile) return apiError("Fan profile not found.", 404);

    const { data: quest, error: questError } = await serverSupabase
      .from("quests")
      .select("*")
      .eq("id", questId)
      .single();

    if (questError) throw questError;

    const { data: existing, error: existingError } = await serverSupabase
      .from("quest_progress")
      .select("*")
      .eq("fan_id", profile.id)
      .eq("quest_id", questId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing?.completed) return apiError("Quest already claimed.", 409);

    const isComplete = await validateQuestCompletion(profile.id, questId, profile);
    if (!isComplete) return apiError("Quest is not complete yet.", 409);

    const completedAt = new Date().toISOString();
    const payload = {
      fan_id: profile.id,
      quest_id: questId,
      progress: 1,
      completed: true,
      completed_at: completedAt,
    };

    const { data: progress, error: progressError } = await serverSupabase
      .from("quest_progress")
      .upsert(payload, { onConflict: "fan_id,quest_id" })
      .select("*")
      .single();

    if (progressError) throw progressError;

    const updatedProfile = await awardFanPoints(profile, quest.points);

    return NextResponse.json({
      quest,
      progress,
      pointsEarned: quest.points,
      totalPoints: updatedProfile.total_points,
    });
  } catch (error) {
    console.error("POST /api/quests/claim failed", error);
    return apiError("Unable to claim quest.", 500);
  }
}
