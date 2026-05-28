"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { COUNTRIES } from "@/lib/mock-data";
import { FlagImage } from "@/components/FlagImage";
import { useProfile } from "@/hooks/useProfile";
import { getCountryStats } from "@/lib/db";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Database } from "@/types/database";
import { BadgeCard } from "@/components/BadgeCard";

type CountryStats = Database["public"]["Tables"]["country_stats"]["Row"];

type SquadMember = {
  wallet_address: string;
  display_name: string | null;
  total_points: number;
  joined_at: string;
};

const RANK_MEDAL: Record<number, { bg: string; color: string; border: string; label: string }> = {
  1: { bg: "rgba(245,158,11,0.1)",  color: "#f59e0b", border: "rgba(245,158,11,0.3)",  label: "🥇" },
  2: { bg: "rgba(192,192,192,0.08)", color: "#c0c0c0", border: "rgba(192,192,192,0.25)", label: "🥈" },
  3: { bg: "rgba(205,127,50,0.08)", color: "#cd7f32", border: "rgba(205,127,50,0.25)", label: "🥉" },
};

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function SquadPage() {
  const { isConnected, address } = useAccount();
  const { profile, loading } = useProfile(address);
  const [stats, setStats] = useState<CountryStats | null>(null);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [bestBadgeTier, setBestBadgeTier] = useState<"rookie" | "fan" | "expert" | null>(null);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    getCountryStats(profile.country_code).then(setStats);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data: { leaderboard?: Array<{ country_code: string }> }) => {
        const idx = (data.leaderboard ?? []).findIndex(
          (row) => row.country_code === profile.country_code
        );
        if (idx !== -1) setGlobalRank(idx + 1);
      })
      .catch(() => {});
  }, [profile]);

  useEffect(() => {
    if (!address) return;
    try {
      const raw = localStorage.getItem(`twelfth_best_badge_${address}`);
      if (raw) {
        const parsed = JSON.parse(raw) as { tier: string };
        const t = parsed.tier.toLowerCase();
        if (t === "rookie" || t === "fan" || t === "expert") setBestBadgeTier(t);
      }
    } catch { /* ignore */ }
  }, [address]);

  useEffect(() => {
    if (!profile) return;
    setMembersLoading(true);
    fetch(`/api/squad/members?countryCode=${encodeURIComponent(profile.country_code)}`)
      .then((r) => r.json())
      .then((data: { members?: SquadMember[] }) => setMembers(data.members ?? []))
      .catch(() => {})
      .finally(() => setMembersLoading(false));
  }, [profile]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="text-6xl">🏳️</div>
        <h1 className="font-syne font-bold text-2xl tracking-tight text-white">No team yet.</h1>
        <p className="font-inter text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
          Connect your wallet. Pick your country. That&apos;s your team.
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-inter text-sm" style={{ color: "var(--text-muted)" }}>Loading your team…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="text-6xl">🏳️</div>
        <h1 className="font-syne font-bold text-2xl tracking-tight text-white">You haven&apos;t joined a team yet.</h1>
        <Link
          href="/onboard"
          className="font-syne font-bold px-6 py-3 text-black transition-all duration-200"
          style={{ background: "#ffffff", borderRadius: 12 }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          Pick your country
        </Link>
      </div>
    );
  }

  const country      = COUNTRIES.find((c) => c.code === profile.country_code);
  const squadPoints  = stats?.total_points ?? 0;
  const medal        = globalRank !== null ? RANK_MEDAL[globalRank] : null;
  const rankStyle    = medal ?? { bg: "rgba(255,255,255,0.05)", color: "#888888", border: "rgba(255,255,255,0.12)", label: "" };
  const myRankInSquad = members.findIndex((m) => m.wallet_address.toLowerCase() === address?.toLowerCase()) + 1;

  return (
    <div className="page-enter space-y-5">

      {/* Country Banner */}
      <div
        className="text-center space-y-4 p-8"
        style={{
          background: "#111111",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <FlagImage code={profile.country_code} size={280} style={{ opacity: 0.06, filter: "blur(12px)", transform: "scale(1.1)" }} />
        </div>
        <div className="relative flex justify-center">
          <div style={{ filter: "drop-shadow(0 0 20px rgba(255,255,255,0.15))" }}>
            <FlagImage code={profile.country_code} size={96} />
          </div>
        </div>
        <h1 className="relative font-syne font-extrabold text-4xl tracking-tight text-white">
          {country?.name ?? profile.country_code}
        </h1>
        <div className="relative flex items-center justify-center gap-3 flex-wrap">
          {globalRank !== null && (
            <span
              className="font-syne font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full"
              style={{ background: rankStyle.bg, color: rankStyle.color, border: `1px solid ${rankStyle.border}` }}
            >
              {rankStyle.label} #{globalRank} Global
            </span>
          )}
          {members.length > 0 && (
            <span
              className="font-inter text-xs uppercase tracking-widest px-4 py-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.04)", color: "#666666", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {members.length}{members.length === 10 ? "+" : ""} fans
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          background: "#111111",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {[
          { label: "Squad Points", value: squadPoints.toLocaleString(), color: "#ffffff" },
          { label: "Your Points",  value: profile.total_points.toLocaleString(), color: "#ffffff" },
          { label: "Your Rank",    value: myRankInSquad > 0 ? `#${myRankInSquad}` : "—", color: myRankInSquad === 1 ? "#f59e0b" : "#ffffff" },
        ].map(({ label, value, color }, i) => (
          <div
            key={label}
            className="flex-1 text-center py-5"
            style={i > 0 ? { borderLeft: "1px solid rgba(255,255,255,0.06)" } : {}}
          >
            <div className="font-syne font-black text-3xl text-white tabular-nums tracking-tight" style={{ color }}>{value}</div>
            <div className="font-inter text-xs mt-1.5 uppercase tracking-widest font-medium" style={{ color: "#666666" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Squad Roster */}
      <div
        style={{
          background: "#111111",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <h2 className="font-syne font-semibold text-xs uppercase tracking-widest" style={{ color: "#444444" }}>
            Squad Roster
          </h2>
        </div>

        {membersLoading ? (
          <div className="font-inter text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>Loading…</div>
        ) : members.length === 0 ? (
          <div className="font-inter text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>
            No fans yet — you&apos;re the first.
          </div>
        ) : (
          <div>
            {members.map((member, i) => {
              const isMe = member.wallet_address.toLowerCase() === address?.toLowerCase();
              const rank = i + 1;
              const rankColor = rank === 1 ? "#f59e0b" : rank === 2 ? "#c0c0c0" : rank === 3 ? "#cd7f32" : "#444444";
              return (
                <div
                  key={member.wallet_address}
                  className="flex items-center gap-3 px-5 py-3 font-inter text-sm"
                  style={{
                    borderBottom: i < members.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    background: isMe ? "rgba(255,255,255,0.025)" : "transparent",
                  }}
                >
                  {/* Rank */}
                  <span
                    className="font-syne font-bold tabular-nums w-6 shrink-0 text-center"
                    style={{ fontSize: 12, color: rankColor }}
                  >
                    {rank}
                  </span>

                  {/* Name */}
                  <span
                    className="flex-1 truncate"
                    style={{ color: isMe ? "#ffffff" : "#888888", fontWeight: isMe ? 600 : 400 }}
                  >
                    {member.display_name ?? shortenAddress(member.wallet_address)}
                    {isMe && (
                      <span className="ml-2 font-inter text-xs" style={{ color: "#444444" }}>you</span>
                    )}
                  </span>

                  {/* Points */}
                  <span
                    className="font-syne font-bold tabular-nums shrink-0"
                    style={{ fontSize: 13, color: isMe ? "#ffffff" : "#666666" }}
                  >
                    {member.total_points.toLocaleString()} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Best Badge */}
      {bestBadgeTier && profile && (
        <div className="flex flex-col items-center gap-3">
          <p className="font-inter text-xs uppercase tracking-widest font-semibold" style={{ color: "#444444" }}>
            Best Badge
          </p>
          <BadgeCard
            tier={bestBadgeTier}
            countryCode={profile.country_code}
            size="sm"
            showMintButton={false}
          />
        </div>
      )}

    </div>
  );
}
