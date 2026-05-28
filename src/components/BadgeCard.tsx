"use client";

import { useState } from "react";
import { FlagImage } from "@/components/FlagImage";
import { TX_EXPLORER_BASE } from "@/lib/contracts";
import { COUNTRIES } from "@/lib/mock-data";

const TIER_CONFIG = {
  rookie: {
    label:      "Rookie",
    num:        "01",
    scoreRange: "0–2 correct",
    primary:    "#a78bfa",
    bg:         "linear-gradient(155deg, #0d0b1e 0%, #1c1848 55%, #0f0d28 100%)",
    glow:       "rgba(167,139,250,0.35)",
    glowMid:    "rgba(167,139,250,0.12)",
    border:     "rgba(167,139,250,0.32)",
    stripe:     "linear-gradient(90deg, #5b21b6, #a78bfa, #c4b5fd)",
    chipBg:     "rgba(167,139,250,0.1)",
    chipBorder: "rgba(167,139,250,0.28)",
  },
  fan: {
    label:      "Fan",
    num:        "02",
    scoreRange: "3–4 correct",
    primary:    "#22d3ee",
    bg:         "linear-gradient(155deg, #020e14 0%, #053545 55%, #021a22 100%)",
    glow:       "rgba(34,211,238,0.3)",
    glowMid:    "rgba(34,211,238,0.1)",
    border:     "rgba(34,211,238,0.3)",
    stripe:     "linear-gradient(90deg, #0891b2, #22d3ee, #a5f3fc)",
    chipBg:     "rgba(34,211,238,0.08)",
    chipBorder: "rgba(34,211,238,0.25)",
  },
  expert: {
    label:      "Expert",
    num:        "03",
    scoreRange: "5/5 correct",
    primary:    "#fbbf24",
    bg:         "linear-gradient(155deg, #100800 0%, #301800 55%, #1a0d00 100%)",
    glow:       "rgba(251,191,36,0.38)",
    glowMid:    "rgba(251,191,36,0.12)",
    border:     "rgba(251,191,36,0.4)",
    stripe:     "linear-gradient(90deg, #b45309, #fbbf24, #fde68a)",
    chipBg:     "rgba(251,191,36,0.1)",
    chipBorder: "rgba(251,191,36,0.3)",
  },
} as const;

interface BadgeCardProps {
  tier: "rookie" | "fan" | "expert";
  countryCode: string;
  score?: string;
  size?: "sm" | "md" | "lg";
  showMintButton?: boolean;
  onMint?: () => void;
  mintPhase?: "idle" | "minting" | "success" | "error";
  txHash?: string;
}

export function BadgeCard({
  tier,
  countryCode,
  score,
  size = "md",
  showMintButton = false,
  onMint,
  mintPhase = "idle",
  txHash,
}: BadgeCardProps) {
  const [hovered, setHovered] = useState(false);
  const cfg = TIER_CONFIG[tier];

  const W   = size === "sm" ? 140 : size === "lg" ? 220 : 180;
  const H   = Math.round(W * 1.48);
  const pad = Math.round(W * 0.11);

  const fs = {
    label:  Math.max(7,  Math.round(W * 0.058)),
    score:  Math.max(7,  Math.round(W * 0.058)),
    brand:  Math.max(6,  Math.round(W * 0.048)),
    chip:   Math.max(6,  Math.round(W * 0.046)),
    num:    Math.round(W * 0.82),
    flag:   Math.round(W * 0.44),
    country: Math.max(8, Math.round(W * 0.068)),
  };

  const countryName = COUNTRIES.find((c) => c.code === countryCode)?.name ?? countryCode;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "relative",
          width: W, height: H,
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          borderRadius: 20,
          boxShadow: hovered
            ? `0 0 0 1px ${cfg.border}, 0 0 80px ${cfg.glow}, 0 32px 64px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.09)`
            : `0 0 0 1px ${cfg.border}, 0 0 60px ${cfg.glow}, 0 28px 56px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.07)`,
          overflow: "hidden",
          transition: "transform 320ms ease, box-shadow 320ms ease",
          transform: hovered ? "translateY(-8px) scale(1.03)" : "translateY(0) scale(1)",
          flexShrink: 0,
          cursor: "default",
        }}
      >

        {/* ── Background layers ────────────────────────────────────────── */}

        {/* Ghost flag — large, offset right */}
        <div style={{
          position: "absolute",
          right: -Math.round(W * 0.1),
          top: "50%",
          transform: "translateY(-52%)",
          opacity: 0.12,
          pointerEvents: "none",
          filter: "saturate(0.5) blur(1px)",
        }}>
          <FlagImage code={countryCode} size={Math.round(W * 1.0)} />
        </div>

        {/* Tier number — massive typographic ghost */}
        <div style={{
          position: "absolute",
          top: -Math.round(W * 0.08),
          right: -Math.round(W * 0.04),
          fontFamily: "'Syne', sans-serif",
          fontSize: fs.num,
          fontWeight: 900,
          color: cfg.primary,
          opacity: 0.07,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          pointerEvents: "none",
          userSelect: "none",
        }}>
          {cfg.num}
        </div>

        {/* X Layer watermark */}
        <div style={{
          position: "absolute",
          bottom: Math.round(H * 0.14),
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.06,
          pointerEvents: "none",
        }}>
          <img
            src="/images/xlayer-logo.svg"
            alt=""
            style={{ width: Math.round(W * 0.28), height: "auto" }}
          />
        </div>

        {/* Radial glow — centered on flag area */}
        <div style={{
          position: "absolute",
          top: "42%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "120%", height: "70%",
          background: `radial-gradient(ellipse, ${cfg.glowMid} 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* Bottom vignette */}
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "35%",
          background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />

        {/* Diagonal shine */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 45%, rgba(255,255,255,0.01) 100%)",
          pointerEvents: "none",
        }} />

        {/* Top accent stripe */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: cfg.stripe,
          boxShadow: `0 0 14px ${cfg.glow}`,
        }} />

        {/* Shimmer sweep on hover */}
        {hovered && (
          <div style={{
            position: "absolute",
            top: "-50%",
            left: 0,
            width: "35%",
            height: "200%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
            animation: "badge-shimmer 0.75s ease-in-out",
            pointerEvents: "none",
            zIndex: 4,
          }} />
        )}

        {/* ── Content ──────────────────────────────────────────────────── */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column",
          height: "100%",
          padding: `${pad}px ${pad}px ${Math.round(pad * 0.75)}px`,
          boxSizing: "border-box",
        }}>

          {/* ── Header: tier label + number ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%",
                background: cfg.primary,
                boxShadow: `0 0 8px ${cfg.glow}`,
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: fs.label,
                fontWeight: 700,
                color: cfg.primary,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}>
                {cfg.label}
              </span>
            </div>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: fs.label,
              fontWeight: 900,
              color: cfg.primary,
              opacity: 0.4,
              letterSpacing: "0.04em",
            }}>
              #{cfg.num}
            </span>
          </div>

          {/* ── Center: flag + country name + score ── */}
          <div style={{
            flex: 1,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: Math.round(W * 0.045),
            paddingTop: Math.round(W * 0.06),
            paddingBottom: Math.round(W * 0.04),
          }}>
            {/* Flag with tier-colored glow */}
            <div style={{
              filter: `drop-shadow(0 4px ${Math.round(W * 0.1)}px ${cfg.glow})`,
            }}>
              <FlagImage code={countryCode} size={fs.flag} />
            </div>

            {/* Country name */}
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: fs.country,
              fontWeight: 800,
              color: "rgba(255,255,255,0.9)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textAlign: "center",
              lineHeight: 1.15,
              textShadow: `0 0 24px ${cfg.glow}`,
            }}>
              {countryName}
            </div>

            {/* Score / range */}
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: fs.score,
              color: "rgba(255,255,255,0.3)",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
            }}>
              {score ?? cfg.scoreRange}
            </div>
          </div>

          {/* ── Footer ── */}
          <div>
            <div style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, ${cfg.primary}55, transparent)`,
              marginBottom: Math.round(W * 0.055),
            }} />
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: fs.brand,
                color: "rgba(255,255,255,0.18)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                TWELFTH · 2026
              </span>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: fs.chip,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: cfg.primary,
                background: cfg.chipBg,
                border: `1px solid ${cfg.chipBorder}`,
                borderRadius: 4,
                padding: "2px 5px",
                flexShrink: 0,
              }}>
                X LAYER
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Mint section ─────────────────────────────────────────────────── */}
      {showMintButton && (
        <div style={{ width: W, display: "flex", flexDirection: "column", gap: 8 }}>
          {mintPhase === "success" && txHash ? (
            <a
              href={`${TX_EXPLORER_BASE}/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", textAlign: "center",
                fontFamily: "'Syne', sans-serif", fontWeight: 700,
                fontSize: 13, color: cfg.primary,
                background: cfg.chipBg,
                border: `1px solid ${cfg.chipBorder}`,
                borderRadius: 12, padding: "10px 0",
                textDecoration: "none",
              }}
            >
              Minted ✓ View on Explorer →
            </a>
          ) : mintPhase === "error" ? (
            <>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: 12,
                color: "#ef4444", textAlign: "center", margin: 0,
              }}>
                Failed. Try again.
              </p>
              <button
                onClick={onMint}
                style={{
                  width: "100%", fontFamily: "'Syne', sans-serif",
                  fontWeight: 700, fontSize: 13, color: "white",
                  background: "#16a34a", border: "none", borderRadius: 12,
                  padding: "10px 0", cursor: "pointer",
                }}
              >
                Retry
              </button>
            </>
          ) : (
            <button
              onClick={mintPhase === "idle" ? onMint : undefined}
              disabled={mintPhase === "minting"}
              style={{
                width: "100%", fontFamily: "'Syne', sans-serif",
                fontWeight: 700, fontSize: 13, color: "white",
                background: "#16a34a", border: "none", borderRadius: 12,
                padding: "10px 0",
                cursor: mintPhase === "idle" ? "pointer" : "default",
                opacity: mintPhase === "minting" ? 0.6 : 1,
                transition: "all 200ms",
              }}
            >
              {mintPhase === "minting" ? "Confirming…" : "Mint on X Layer"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
