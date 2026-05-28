"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const NAV_LINKS = [
  { href: "/matchday",    label: "Matchday"    },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/squad",       label: "My Squad"    },
  { href: "/profile",     label: "Profile"     },
];

function HexLogo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative flex items-center justify-center w-7 h-7 shrink-0">
        <svg viewBox="0 0 28 28" className="absolute inset-0 w-full h-full" fill="none">
          <polygon
            points="14,2 24,7.5 24,20.5 14,26 4,20.5 4,7.5"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.25"
          />
        </svg>
        <span className="relative text-white font-black text-[11px] leading-none">12</span>
      </span>
      <span className="text-white font-bold tracking-[0.18em] text-sm">TWELFTH</span>
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/[0.06] bg-[#080809]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0">
          <HexLogo />
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`relative px-3.5 py-1.5 text-sm font-medium transition-colors ${
                pathname === href ? "text-white" : "text-gray-500 hover:text-gray-200"
              }`}
            >
              {label}
              {pathname === href && (
                <span className="absolute bottom-0 left-3 right-3 h-px bg-white" />
              )}
            </Link>
          ))}
        </div>

        <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#080809] border-t border-white/[0.06] z-50 flex">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
              pathname === href ? "text-white" : "text-gray-600"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
