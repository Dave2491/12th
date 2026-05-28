import { NextRequest, NextResponse } from "next/server";
import { apiError, getFanByWallet, normalizeWallet, serverSupabase } from "@/lib/server-api";

export async function GET(request: NextRequest) {
  try {
    const walletAddress = normalizeWallet(request.nextUrl.searchParams.get("walletAddress"));
    if (!walletAddress) return apiError("walletAddress is required.");

    const profile = await getFanByWallet(walletAddress);
    if (!profile) return apiError("Fan profile not found.", 404);

    const { data: answers, error: aError } = await serverSupabase
      .from("trivia_answers")
      .select("trivia_id, is_correct, answered_at")
      .eq("fan_id", profile.id)
      .order("answered_at", { ascending: false })
      .limit(100);

    if (aError) throw aError;
    if (!answers?.length) return NextResponse.json({ sessions: [] });

    const sessionMap = new Map<string, { correct: number; total: number; pointsEarned: number }>();
    for (const a of answers) {
      const date = a.answered_at.slice(0, 10);
      if (!sessionMap.has(date)) sessionMap.set(date, { correct: 0, total: 0, pointsEarned: 0 });
      const s = sessionMap.get(date)!;
      s.total += 1;
      if (a.is_correct) {
        s.correct += 1;
        s.pointsEarned += 30;
      }
    }

    const sessions = Array.from(sessionMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 10)
      .map(([date, stats]) => ({ date, ...stats }));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("GET /api/trivia/history failed", error);
    return apiError("Unable to load trivia history.", 500);
  }
}
