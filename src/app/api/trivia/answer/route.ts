import { NextResponse } from "next/server";
import { apiError, awardFanPoints, getFanByWallet, normalizeWallet, serverSupabase } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const walletAddress = normalizeWallet(body.walletAddress);
    const triviaId = typeof body.triviaId === "string" ? body.triviaId.trim() : "";
    const selectedAnswer = typeof body.selectedAnswer === "string" ? body.selectedAnswer.trim() : "";

    if (!walletAddress || !triviaId || !selectedAnswer) {
      return apiError("walletAddress, triviaId, and selectedAnswer are required.");
    }

    const profile = await getFanByWallet(walletAddress);
    if (!profile) return apiError("Fan profile not found.", 404);

    const { data: existing, error: existingError } = await serverSupabase
      .from("trivia_answers")
      .select("id")
      .eq("fan_id", profile.id)
      .eq("trivia_id", triviaId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) return apiError("Trivia already answered.", 409);

    const { data: trivia, error: triviaError } = await serverSupabase
      .from("daily_trivia")
      .select("id, correct_answer")
      .eq("id", triviaId)
      .single();

    if (triviaError) throw triviaError;

    const isCorrect = selectedAnswer.trim().toLowerCase() === trivia.correct_answer.trim().toLowerCase();
    const pointsEarned = isCorrect ? 30 : 0;

    const { error: insertError } = await serverSupabase.from("trivia_answers").insert({
      fan_id: profile.id,
      trivia_id: triviaId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
    });

    if (insertError) throw insertError;
    if (pointsEarned > 0) await awardFanPoints(profile, pointsEarned);

    return NextResponse.json({ isCorrect, pointsEarned, correctAnswer: trivia.correct_answer });
  } catch (error) {
    console.error("POST /api/trivia/answer failed", error);
    return apiError("Unable to submit trivia answer.", 500);
  }
}
