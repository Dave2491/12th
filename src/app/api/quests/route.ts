import { NextRequest, NextResponse } from "next/server";
import { apiError, getFanByWallet, normalizeWallet, serverSupabase } from "@/lib/server-api";

export async function GET(request: NextRequest) {
  try {
    const walletAddress = normalizeWallet(request.nextUrl.searchParams.get("walletAddress"));
    if (!walletAddress) return apiError("walletAddress is required.");

    const profile = await getFanByWallet(walletAddress);
    if (!profile) return apiError("Fan profile not found.", 404);

    const [{ data: quests, error: questsError }, { data: progress, error: progressError }] = await Promise.all([
      serverSupabase.from("quests").select("*").order("points", { ascending: true }),
      serverSupabase.from("quest_progress").select("*").eq("fan_id", profile.id),
    ]);

    if (questsError) throw questsError;
    if (progressError) throw progressError;

    const progressByQuest = new Map((progress ?? []).map((item) => [item.quest_id, item]));
    const merged = (quests ?? []).map((quest) => ({
      ...quest,
      progress: progressByQuest.get(quest.id) ?? null,
    }));

    return NextResponse.json({ quests: merged });
  } catch (error) {
    console.error("GET /api/quests failed", error);
    return apiError("Unable to load quests.", 500);
  }
}
