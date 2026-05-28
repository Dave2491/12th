import { NextRequest, NextResponse } from "next/server";
import { apiError, serverSupabase, todayUtcDate, tomorrowUtcDate } from "@/lib/server-api";

export async function GET(request: NextRequest) {
  try {
    const scoreParam = request.nextUrl.searchParams.get("score");
    const userScore  = scoreParam !== null ? parseInt(scoreParam, 10) : null;
    const today      = todayUtcDate();
    const tomorrow   = tomorrowUtcDate();

    // Get all answers submitted today, regardless of which trivia question
    const { data: answers, error: aError } = await serverSupabase
      .from("trivia_answers")
      .select("fan_id, is_correct")
      .gte("answered_at", `${today}T00:00:00.000Z`)
      .lt("answered_at", `${tomorrow}T00:00:00.000Z`);

    if (aError) throw aError;

    // Group by fan, count correct answers per fan
    const fanMap = new Map<string, number>();
    for (const a of answers ?? []) {
      if (!fanMap.has(a.fan_id)) fanMap.set(a.fan_id, 0);
      if (a.is_correct) fanMap.set(a.fan_id, fanMap.get(a.fan_id)! + 1);
    }

    const scores       = Array.from(fanMap.values());
    const totalPlayers = scores.length;
    if (totalPlayers === 0) return NextResponse.json({ totalPlayers: 0, averageScore: 0, percentile: null });

    const averageScore = Math.round((scores.reduce((s, v) => s + v, 0) / totalPlayers) * 10) / 10;

    let percentile: number | null = null;
    if (userScore !== null && !isNaN(userScore) && totalPlayers > 1) {
      const below = scores.filter((s) => s < userScore).length;
      percentile  = Math.round((below / totalPlayers) * 100);
    }

    return NextResponse.json({ totalPlayers, averageScore, percentile });
  } catch (error) {
    console.error("GET /api/trivia/today-stats failed", error);
    return apiError("Unable to load today's stats.", 500);
  }
}
