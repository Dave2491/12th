import { supabase } from "./supabase";
import type { Database } from "@/types/database";

type FanProfileRow = Database["public"]["Tables"]["fan_profiles"]["Row"];
type CountryStatsRow = Database["public"]["Tables"]["country_stats"]["Row"];

// ── Registration ──────────────────────────────────────────────────────────────

export async function registerFan(
  walletAddress: string,
  countryCode: string,
  displayName?: string,
): Promise<FanProfileRow> {
  const { data, error } = await supabase
    .from("fan_profiles")
    .insert({
      wallet_address: walletAddress.toLowerCase(),
      country_code: countryCode,
      display_name: displayName ?? null,
      total_points: 0,
      check_in_streak: 0,
      longest_streak: 0,
      badge_count: 0,
    })
    .select()
    .single();

  if (error) throw error;

  // Increment country fan count atomically via RPC
  await supabase.rpc("increment_country_stats", {
    p_country: countryCode,
    p_points: 0,
    p_fans: 1,
  });

  return data;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getProfile(
  walletAddress: string
): Promise<FanProfileRow | null> {
  const { data, error } = await supabase
    .from("fan_profiles")
    .select("*")
    .eq("wallet_address", walletAddress.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ── Check-in ──────────────────────────────────────────────────────────────────

export async function hasCheckedIn(
  fanId: string,
  fixtureId: number
): Promise<boolean> {
  const { data } = await supabase
    .from("check_ins")
    .select("id")
    .eq("fan_id", fanId)
    .eq("fixture_id", fixtureId)
    .maybeSingle();

  return data !== null;
}

export async function checkIn(
  profile: FanProfileRow,
  fixtureId: number
): Promise<{ points: number; newStreak: number }> {
  // Determine consecutive streak by querying the last check-in
  const { data: lastCheckIn } = await supabase
    .from("check_ins")
    .select("fixture_id")
    .eq("fan_id", profile.id)
    .order("checked_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isConsecutive = lastCheckIn ? lastCheckIn.fixture_id === fixtureId - 1 : false;
  const newStreak = isConsecutive ? profile.check_in_streak + 1 : 1;
  const newLongest = Math.max(newStreak, profile.longest_streak);

  const points = newStreak >= 7 ? 150 : newStreak >= 3 ? 125 : 100;

  // Insert check-in (will throw on duplicate due to unique index)
  const { error: ciError } = await supabase.from("check_ins").insert({
    fan_id: profile.id,
    fixture_id: fixtureId,
    points_earned: points,
  });
  if (ciError) throw ciError;

  // Update fan profile
  const { error: fpError } = await supabase
    .from("fan_profiles")
    .update({
      total_points: profile.total_points + points,
      check_in_streak: newStreak,
      longest_streak: newLongest,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);
  if (fpError) throw fpError;

  // Update country stats atomically
  await supabase.rpc("increment_country_stats", {
    p_country: profile.country_code,
    p_points: points,
    p_fans: 0,
  });

  return { points, newStreak };
}

// ── Quest completion ──────────────────────────────────────────────────────────

export async function getCompletedQuestIds(
  fanId: string,
  fixtureId: number
): Promise<string[]> {
  const { data } = await supabase
    .from("quest_completions")
    .select("quest_id")
    .eq("fan_id", fanId)
    .eq("fixture_id", fixtureId);

  return (data ?? []).map((r) => r.quest_id);
}

export async function completeQuest(
  profile: FanProfileRow,
  questId: string,
  fixtureId: number,
  answer: string | null,
  points: number
): Promise<void> {
  const { error: qcError } = await supabase.from("quest_completions").insert({
    fan_id: profile.id,
    quest_id: questId,
    fixture_id: fixtureId,
    answer,
    points_earned: points,
  });
  if (qcError) throw qcError;

  // Update fan points
  const { error: fpError } = await supabase
    .from("fan_profiles")
    .update({
      total_points: profile.total_points + points,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);
  if (fpError) throw fpError;

  // Update country stats
  await supabase.rpc("increment_country_stats", {
    p_country: profile.country_code,
    p_points: points,
    p_fans: 0,
  });
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export async function getLeaderboard(
  limit = 20
): Promise<CountryStatsRow[]> {
  const { data, error } = await supabase
    .from("country_stats")
    .select("*")
    .order("total_points", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getCountryStats(
  countryCode: string
): Promise<CountryStatsRow | null> {
  const { data } = await supabase
    .from("country_stats")
    .select("*")
    .eq("country_code", countryCode)
    .maybeSingle();

  return data;
}
