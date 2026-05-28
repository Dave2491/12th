"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { COUNTRIES } from "@/lib/mock-data";
import { FlagImage } from "@/components/FlagImage";
import { useProfile } from "@/hooks/useProfile";
import { BadgeCard } from "@/components/BadgeCard";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function HexAvatar({ code }: { code: string }) {
  return (
    <div className="relative w-20 h-[88px] mx-auto">
      <svg viewBox="0 0 80 88" className="absolute inset-0 w-full h-full" fill="none">
        <polygon
          points="40,2 74,21 74,67 40,86 6,67 6,21"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
          fill="rgba(255,255,255,0.03)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <FlagImage code={code} size={40} />
      </span>
    </div>
  );
}

function tierColor(correct: number, total: number) {
  const pct = total > 0 ? correct / total : 0;
  if (pct >= 1)   return "#fbbf24"; // expert — gold
  if (pct >= 0.6) return "#22d3ee"; // fan — cyan
  return "#a78bfa";                  // rookie — violet
}

type Session = { date: string; correct: number; total: number; pointsEarned: number };
type StoredBadge = { tier: string; tokenId: number; icon: string; txHash: string; mintedAt: string };

export default function ProfilePage() {
  const { isConnected, address } = useAccount();
  const { profile, loading } = useProfile(address);
  const [copied, setCopied] = useState(false);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [bestBadge, setBestBadge] = useState<StoredBadge | null>(null);

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
    setSessionsLoading(true);
    fetch(`/api/trivia/history?walletAddress=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then((data: { sessions?: Session[] }) => setSessions(data.sessions ?? []))
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, [address]);

  useEffect(() => {
    if (!address) return;
    try {
      const raw = localStorage.getItem(`twelfth_best_badge_${address}`);
      if (raw) setBestBadge(JSON.parse(raw) as StoredBadge);
    } catch { /* ignore */ }
  }, [address]);

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="text-6xl">👤</div>
        <h1 className="font-syne font-bold text-2xl tracking-tight text-white">Connect to see your record.</h1>
        <ConnectButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="font-inter text-sm" style={{ color: "var(--text-muted)" }}>Loading profile…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="text-6xl">👤</div>
        <h1 className="font-syne font-bold text-2xl tracking-tight text-white">No record yet.</h1>
        <p className="font-inter text-sm" style={{ color: "var(--text-secondary)" }}>
          Pick your squad to start building your history.
        </p>
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

  const country    = COUNTRIES.find((c) => c.code === profile.country_code);
  const joinedDate = new Date(profile.joined_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
  const rankColor = globalRank === 1 ? "#f59e0b" : "#ffffff";

  const totalCorrect   = sessions.reduce((s, r) => s + r.correct, 0);
  const totalQuestions = sessions.reduce((s, r) => s + r.total,   0);
  const accuracy       = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null;
  const gamesPlayed    = sessions.length;

  return (
    <div className="page-enter space-y-5 max-w-lg mx-auto">

      {/* Identity Card */}
      <div className="glass overflow-hidden" style={{ borderRadius: 16 }}>
        <div
          className="px-6 pt-8 pb-6 space-y-4 text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <HexAvatar code={profile.country_code} />
          <div>
            <div className="font-syne font-bold text-2xl text-white">
              {profile.display_name ?? shortenAddress(address ?? "0x0000")}
            </div>
            <div className="font-inter text-sm mt-1" style={{ color: "#666666" }}>
              {country?.name ?? profile.country_code}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-3 gap-4">
          <span className="font-inter text-xs" style={{ color: "#444444" }}>
            Joined {joinedDate}
          </span>
          <button
            onClick={copyAddress}
            className="inline-flex items-center gap-2 font-inter font-mono text-xs px-3 py-1.5 rounded-full transition-all duration-200"
            style={{ color: "#444444", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#ffffff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#444444"; }}
          >
            <span className="truncate max-w-[160px]">{address}</span>
            <span className="shrink-0">{copied ? "✓" : "⎘"}</span>
          </button>
        </div>
      </div>

      {/* Stats — 2×2 grid */}
      <div
        style={{
          background: "#111111",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          overflow: "hidden",
        }}
      >
        {[
          { label: "Total Points",  value: profile.total_points.toLocaleString(), color: "#ffffff" },
          { label: "Global Rank",   value: globalRank !== null ? `#${globalRank}` : "—", color: rankColor },
          { label: "Accuracy",      value: accuracy !== null ? `${accuracy}%` : "—", color: accuracy !== null && accuracy >= 60 ? "#22d3ee" : "#ffffff" },
          { label: "Games Played",  value: gamesPlayed > 0 ? String(gamesPlayed) : "—", color: "#ffffff" },
        ].map(({ label, value, color }, i) => (
          <div
            key={label}
            className="text-center py-6"
            style={{
              borderRight:  i % 2 === 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
              borderBottom: i < 2      ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}
          >
            <div className="font-syne font-black text-4xl tabular-nums tracking-tight" style={{ color }}>
              {value}
            </div>
            <div className="font-inter text-xs mt-2 uppercase tracking-widest font-medium" style={{ color: "#666666" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Best Badge — compact */}
      {bestBadge && (
        <div className="flex flex-col items-center gap-3">
          <p className="font-inter text-xs uppercase tracking-widest font-semibold" style={{ color: "#444444" }}>
            Best Badge
          </p>
          <BadgeCard
            tier={bestBadge.tier.toLowerCase() as "rookie" | "fan" | "expert"}
            countryCode={profile.country_code}
            size="sm"
            showMintButton={false}
          />
        </div>
      )}

      {/* Trivia History */}
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
            Trivia History
          </h2>
        </div>

        {sessionsLoading ? (
          <div className="font-inter text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>Loading…</div>
        ) : sessions.length === 0 ? (
          <div className="font-inter text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>
            No trivia played yet.
          </div>
        ) : (
          <div>
            {sessions.map((s) => {
              const formatted = new Date(s.date + "T12:00:00Z").toLocaleDateString("en-GB", {
                day: "numeric", month: "short",
              });
              const tc = tierColor(s.correct, s.total);
              return (
                <div
                  key={s.date}
                  className="flex items-center gap-4 px-5 py-3 font-inter text-sm"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  {/* Date */}
                  <span className="w-16 shrink-0" style={{ color: "#555555", fontSize: 12 }}>{formatted}</span>

                  {/* Score dots */}
                  <div className="flex items-center gap-1 shrink-0">
                    {Array.from({ length: s.total }, (_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: i < s.correct ? tc : "rgba(255,255,255,0.1)",
                        }}
                      />
                    ))}
                  </div>

                  {/* Score label */}
                  <span className="flex-1 tabular-nums font-medium" style={{ color: tc }}>
                    {s.correct}/{s.total}
                  </span>

                  {/* Points */}
                  <span className="font-syne font-bold tabular-nums shrink-0" style={{ color: "#16a34a", fontSize: 13 }}>
                    +{s.pointsEarned} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
