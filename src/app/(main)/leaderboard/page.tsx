"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { COUNTRIES } from "@/lib/mock-data";
import { FlagImage } from "@/components/FlagImage";
import type { LeaderboardEntry } from "@/types";

const RANK_COLOR: Record<number, string> = {
  1: "#f59e0b",
  2: "#c0c0c0",
  3: "#cd7f32",
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((json: { leaderboard: { country_code: string; total_points: number }[] }) => {
        const rows = json.leaderboard ?? [];
        const merged: LeaderboardEntry[] = rows
          .map((row, i) => {
            const country = COUNTRIES.find((c) => c.code === row.country_code);
            if (!country) return null;
            return {
              rank: i + 1,
              country: { ...country, totalPoints: row.total_points },
              totalPoints: row.total_points,
              weeklyGrowth: 0,
            };
          })
          .filter(Boolean) as LeaderboardEntry[];
        setEntries(merged);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="font-inter text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>
          Global Rankings
        </p>
        <h1 className="font-syne font-bold text-4xl tracking-tight text-white">Leaderboard</h1>
        <p className="font-inter text-sm" style={{ color: "#666666" }}>
          Every point you earn moves your country up.
        </p>
      </div>

      {loading ? (
        <div className="font-inter text-sm text-center py-20" style={{ color: "var(--text-muted)" }}>
          Loading…
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="text-5xl">🏳️</div>
          <p className="font-syne font-bold text-2xl text-white">No squads yet.</p>
          <p className="font-inter text-sm" style={{ color: "#666666" }}>Be the first.</p>
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
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry, i) => {
            const rankColor = RANK_COLOR[entry.rank] ?? "#444444";
            const isMedal   = entry.rank <= 3;
            const medals    = ["🥇", "🥈", "🥉"] as const;

            return (
              <div
                key={entry.country.code}
                className="row-enter flex items-center gap-4 px-5 py-4 cursor-default transition-all duration-200"
                style={{
                  background: "#111111",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  animationDelay: `${i * 0.05}s`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Rank */}
                <div className="shrink-0 w-8 text-right">
                  <span className="font-syne font-bold text-lg tabular-nums" style={{ color: rankColor }}>
                    {entry.rank}
                  </span>
                </div>

                {/* Flag + Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FlagImage code={entry.country.code} size={32} />
                  <div className="font-syne font-semibold text-white text-sm truncate">
                    {entry.country.name}
                  </div>
                </div>

                {/* Medal */}
                {isMedal && (
                  <span className="text-xl shrink-0">{medals[entry.rank - 1]}</span>
                )}

                {/* Points */}
                <div className="shrink-0 text-right">
                  <div className="font-syne font-bold text-white text-base tabular-nums">
                    {entry.totalPoints.toLocaleString()}
                  </div>
                  <div className="font-inter text-xs" style={{ color: "var(--text-muted)" }}>pts</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
