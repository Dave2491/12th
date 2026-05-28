import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Home — Twelfth" };

export default function Home() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center py-12 space-y-4">
        <div className="inline-block bg-green-600/10 border border-green-600/30 text-green-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
          World Cup 2026
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          You are the{" "}
          <span className="text-green-400">Twelfth</span> player.
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Pick your country. Answer trivia. Help your squad climb the global leaderboard.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/onboard"
            className="bg-white hover:bg-gray-100 text-black font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Pick Your Squad
          </Link>
          <Link
            href="/leaderboard"
            className="bg-white/5 hover:bg-white/10 text-white font-semibold px-6 py-3 rounded-xl border border-white/10 transition-colors"
          >
            View Leaderboard
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: "🏳️",
            title: "Pick your country",
            desc: "One squad. Your nation. Locked in.",
          },
          {
            icon: "🧠",
            title: "Answer trivia. Earn points.",
            desc: "Daily questions. One chance. Make it count.",
          },
          {
            icon: "🏆",
            title: "Climb the leaderboard",
            desc: "Your points count for your country. Every one of them.",
          },
        ].map(({ icon, title, desc }) => (
          <div
            key={title}
            className="bg-[#111114] border border-white/[0.06] rounded-2xl p-5 space-y-2"
          >
            <div className="text-3xl">{icon}</div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-gray-400">{desc}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
