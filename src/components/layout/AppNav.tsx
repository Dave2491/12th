"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Zap, Trophy, Shield, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/play",        label: "Play",        icon: Zap    },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/squad",       label: "My Team",     icon: Shield },
  { href: "/profile",     label: "Profile",     icon: User   },
];

function HexLogo() {
  return (
    <span className="flex items-center gap-3">
      <span className="relative flex items-center justify-center w-8 h-8 shrink-0">
        <svg viewBox="0 0 32 32" className="absolute inset-0 w-full h-full" fill="none">
          <polygon
            points="16,2 28,8 28,24 16,30 4,24 4,8"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
            fill="rgba(255,255,255,0.04)"
          />
        </svg>
        <span className="relative font-syne font-extrabold text-[11px] text-white leading-none">12</span>
      </span>
      <span className="font-syne font-extrabold tracking-[0.22em] text-sm text-white uppercase">TWELFTH</span>
    </span>
  );
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 h-full w-[240px] z-40"
        style={{
          background: "#080808",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="px-5 py-6">
          <Link href="/">
            <HexLogo />
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-[10px] px-4 py-3 text-sm font-syne font-semibold transition-all duration-200"
                style={{
                  background: active ? "rgba(255,255,255,0.04)" : "transparent",
                  color: active ? "#ffffff" : "#666666",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "#666666";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {active && (
                  <span
                    className="animate-dot-appear shrink-0"
                    style={{ width: 5, height: 5, borderRadius: "50%", background: "#ffffff", opacity: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div
          className="px-4 py-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingBottom: "12px" }}>
            <img src="/images/xlayer-logo.svg" alt="X Layer" style={{ width: "16px", height: "16px", objectFit: "contain", opacity: 0.6 }} />
            <span style={{ fontSize: "10px", color: "#444", letterSpacing: "0.05em" }}>
              Built on <span style={{ color: "#666", fontWeight: 600 }}>X Layer</span>
            </span>
          </div>
          <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────────────────────────────── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 h-[48px] flex items-center justify-between px-4"
        style={{
          background: "#080808",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link href="/">
          <HexLogo />
        </Link>
        <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
      </div>

      {/* ── Mobile bottom bar ─────────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-[64px] flex"
        style={{
          background: "#080808",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center transition-colors relative"
              style={{ color: active ? "#ffffff" : "#555555" }}
            >
              {active && (
                <span
                  className="animate-dot-appear absolute top-2"
                  style={{ width: 4, height: 4, borderRadius: "50%", background: "#ffffff", opacity: 0.6 }}
                />
              )}
              <Icon size={22} />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
