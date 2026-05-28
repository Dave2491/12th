import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Twelfth — The Supporter Layer",
};

export default function SplashPage() {

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#080808]">

      {/* ── Layer 1: Video ────────────────────────────────────────── */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.15 }}
        src="/videos/stadium.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />

      {/* ── Layer 2: Gradient overlay ─────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(8,8,8,0.5) 0%, rgba(8,8,8,0.1) 45%, rgba(8,8,8,0.7) 100%)",
        }}
      />

      {/* ── Layer 3: Animated gradient blobs ─────────────────────── */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ opacity: 0.4 }}
      >
        <div
          className="animate-blob-1 absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)" }}
        />
        <div
          className="animate-blob-2 absolute -top-16 -right-24 w-[420px] h-[420px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(192,192,192,0.02) 0%, transparent 70%)" }}
        />
        <div
          className="animate-blob-3 absolute -bottom-24 left-1/2 -translate-x-1/2 w-[560px] h-[300px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.02) 0%, transparent 70%)" }}
        />
      </div>

      {/* ── Noise texture ─────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-noise opacity-[0.038] pointer-events-none" />

      {/* ── Layer 4: Glass card ───────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-center h-full px-5">
        <div
          className="w-full rounded-3xl text-center"
          style={{
            maxWidth: "560px",
            padding: "clamp(2.5rem, 6vw, 3.5rem) clamp(1.75rem, 5vw, 3rem)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 0 40px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.5)",
          }}
        >

          {/* Badge */}
          <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest" style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" style={{ opacity: 0.7 }} />
              World Cup 2026 · Trivia
            </span>
          </div>

          {/* Wordmark */}
          <div className="animate-fade-up mt-6" style={{ animationDelay: "0.3s" }}>
            <h1
              className="font-bold tracking-tight text-white leading-none"
              style={{ fontSize: "clamp(3.75rem, 12vw, 7rem)", letterSpacing: "-0.03em" }}
            >
              Twelfth
            </h1>
          </div>

          {/* Tagline */}
          <div className="animate-fade-up mt-4" style={{ animationDelay: "0.55s" }}>
            <p
              className="font-medium"
              style={{ fontSize: "clamp(0.95rem, 2.2vw, 1.2rem)", color: "#888888" }}
            >
              You are the Twelfth player.
            </p>
          </div>

          {/* Divider */}
          <div
            className="animate-fade-up mx-auto mt-7 mb-7 h-px w-16"
            style={{
              animationDelay: "0.65s",
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)",
            }}
          />

          {/* CTA */}
          <div className="animate-fade-up" style={{ animationDelay: "0.8s" }}>
            <Link
              href="/onboard"
              className="animate-cta-pulse inline-flex items-center justify-center bg-white hover:bg-gray-100 active:scale-[0.97] text-black font-bold rounded-2xl transition-colors w-full"
              style={{
                fontSize: "clamp(0.95rem, 2vw, 1.05rem)",
                padding: "clamp(0.8rem, 2vw, 0.95rem) clamp(1.5rem, 3vw, 2rem)",
              }}
            >
              Enter Your Squad
            </Link>
          </div>

          {/* Built on X Layer */}
          <div className="animate-fade-up mt-6" style={{ animationDelay: "1s", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
            <img src="/images/xlayer-logo.svg" alt="X Layer" style={{ width: "18px", height: "18px", objectFit: "contain", opacity: 1 }} />
            <span style={{ fontSize: "11px", color: "#666666", letterSpacing: "0.06em" }}>
              Built on <span style={{ color: "#888888", fontWeight: 600 }}>X Layer</span>
            </span>
          </div>

        </div>
      </div>

      {/* ── Bottom vignette ───────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(8,8,8,0.85), transparent)" }}
      />

    </div>
  );
}
