import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

export const serverSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export type FanProfile = {
  id: string;
  wallet_address: string;
  country_code: string;
  display_name: string | null;
  total_points: number;
  check_in_streak: number;
  longest_streak: number;
  last_fixture_id: number | null;
  badge_count: number;
  last_check_in_date: string | null;
  prediction_streak: number;
  fan_rank: string;
  joined_at: string;
  updated_at: string;
};

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function normalizeWallet(walletAddress: unknown) {
  return typeof walletAddress === "string" ? walletAddress.trim().toLowerCase() : "";
}

export function todayUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

export function tomorrowUtcDate() {
  const date = new Date(`${todayUtcDate()}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function hashToIndex(value: string, modulo: number) {
  const hash = createHash("sha256").update(value).digest("hex").slice(0, 12);
  return Number.parseInt(hash, 16) % modulo;
}

export function deriveFanRank(points: number) {
  if (points >= 5000) return "Legend";
  if (points >= 2500) return "Elite";
  if (points >= 1000) return "Gold";
  if (points >= 400) return "Rising";
  return "Casual";
}

export async function getFanByWallet(walletAddress: string) {
  const { data, error } = await serverSupabase
    .from("fan_profiles")
    .select("*")
    .eq("wallet_address", walletAddress)
    .maybeSingle<FanProfile>();

  if (error) throw error;
  return data;
}

export async function incrementCountryPoints(countryCode: string, points: number, fans = 0) {
  const { error } = await serverSupabase.rpc("increment_country_stats", {
    p_country: countryCode,
    p_points: points,
    p_fans: fans,
  });

  if (error) throw error;
}

export async function awardFanPoints(profile: FanProfile, points: number, extra: Record<string, unknown> = {}) {
  const nextPoints = profile.total_points + points;
  const { data, error } = await serverSupabase
    .from("fan_profiles")
    .update({
      ...extra,
      total_points: nextPoints,
      fan_rank: deriveFanRank(nextPoints),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id)
    .select("*")
    .single<FanProfile>();

  if (error) throw error;
  await incrementCountryPoints(profile.country_code, points);
  return data;
}

export function badgeThreshold(tier: string) {
  const normalized = tier.toLowerCase();
  if (normalized === "gold") return 500;
  if (normalized === "elite") return 1500;
  if (normalized === "legend") return 3000;
  return Number.POSITIVE_INFINITY;
}

export function isClaimableBadgeTier(tier: string) {
  return ["gold", "elite", "legend"].includes(tier.toLowerCase());
}
