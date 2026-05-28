import { NextRequest, NextResponse } from "next/server";
import {
  apiError,
  getFanByWallet,
  hashToIndex,
  normalizeWallet,
  serverSupabase,
  todayUtcDate,
  tomorrowUtcDate,
} from "@/lib/server-api";

const QUESTIONS_PER_SESSION = 5;

export async function GET(request: NextRequest) {
  try {
    const walletAddress = normalizeWallet(
      request.nextUrl.searchParams.get("walletAddress")
    );
    if (!walletAddress) return apiError("walletAddress is required.");

    const profile = await getFanByWallet(walletAddress);
    if (!profile) return apiError("Fan profile not found.", 404);

    const today = todayUtcDate();
    const tomorrow = tomorrowUtcDate();

    // Fetch all available questions
    const { data: allQuestions, error: qError } = await serverSupabase
      .from("daily_trivia")
      .select("id, question, options, difficulty, points")
      .order("created_at", { ascending: true });

    if (qError) throw qError;
    if (!allQuestions?.length) return apiError("No trivia questions available.", 404);

    // Deterministically select QUESTIONS_PER_SESSION questions for this user today
    const count = Math.min(QUESTIONS_PER_SESSION, allQuestions.length);
    const startIdx = hashToIndex(profile.id + today, allQuestions.length);
    const selected = Array.from(
      { length: count },
      (_, i) => allQuestions[(startIdx + i) % allQuestions.length]
    );

    // Check which of today's selected questions are already answered
    const { data: todayAnswers, error: aError } = await serverSupabase
      .from("trivia_answers")
      .select("trivia_id")
      .eq("fan_id", profile.id)
      .gte("answered_at", `${today}T00:00:00.000Z`)
      .lt("answered_at", `${tomorrow}T00:00:00.000Z`);

    if (aError) throw aError;

    const answeredIds = new Set((todayAnswers ?? []).map((a) => a.trivia_id));
    const remaining = selected.filter((q) => !answeredIds.has(q.id));

    if (remaining.length === 0) {
      return NextResponse.json({ alreadyAnswered: true });
    }

    return NextResponse.json({ alreadyAnswered: false, questions: remaining.map(q => ({ ...q, points: 30 })) });
  } catch (error) {
    console.error("GET /api/trivia/today failed", error);
    return apiError("Unable to load trivia.", 500);
  }
}
