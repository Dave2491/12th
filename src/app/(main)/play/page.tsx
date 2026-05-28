"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAccount, useWriteContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useProfile } from "@/hooks/useProfile";
import { COUNTRIES } from "@/lib/mock-data";
import { FlagImage } from "@/components/FlagImage";
import { FAN_BADGE_ABI, FAN_BADGE_ADDRESS } from "@/lib/contracts";
import { BadgeCard } from "@/components/BadgeCard";

const TIMER_SECONDS = 60;
const FEEDBACK_MS  = 800;
const EXIT_ANIM_MS = 200;

// ── Types ────────────────────────────────────────────────────────────────────

type TriviaQuestion = {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
  points: number;
};

type AnsweredQuestion = {
  question: TriviaQuestion;
  selectedAnswer: string | null;
  isCorrect: boolean;
  pointsEarned: number;
  correctAnswer: string | null;
};

type Phase =
  | "loading"
  | "error"
  | "no_profile"
  | "already_done"
  | "idle"
  | "question"
  | "feedback"
  | "done";

type BadgeTier = { tier: "Rookie" | "Fan" | "Expert"; tokenId: 7 | 8 | 9; icon: string };

function getBadgeTier(correct: number): BadgeTier {
  if (correct >= 5) return { tier: "Expert", tokenId: 9, icon: "🥇" };
  if (correct >= 3) return { tier: "Fan",    tokenId: 8, icon: "🥈" };
  return              { tier: "Rookie",  tokenId: 7, icon: "🥉" };
}

// ── Sub-components ───────────────────────────────────────────────────────────

function CircularTimer({ timer, total }: { timer: number; total: number }) {
  const r = 24;
  const cx = 32;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - timer / total);
  const isLow = timer <= 10;
  const stroke = isLow ? "#ef4444" : "rgba(255,255,255,0.7)";

  return (
    <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
      <svg width={64} height={64} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={3} />
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-syne font-bold text-sm tabular-nums"
        style={{ color: isLow ? "#ef4444" : "white" }}
      >
        {timer}
      </span>
    </div>
  );
}

function ProgressDots({ total, idx, answeredCount }: { total: number; idx: number; answeredCount: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const isDone    = i < answeredCount;
        const isCurrent = i === idx && !isDone;
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-200"
            style={{
              width:      isCurrent ? 10 : 8,
              height:     isCurrent ? 10 : 8,
              background: isDone ? "white" : "transparent",
              border:     isDone ? "none" : isCurrent ? "2px solid white" : "2px solid #333333",
              transform:  isDone ? "scale(1.2)" : "scale(1)",
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PlayPage() {
  const { isConnected, address } = useAccount();
  const { profile, loading: profileLoading } = useProfile(address);
  const { writeContractAsync } = useWriteContract();

  // ── Core state ───────────────────────────────────────────────────────────
  const [phase, setPhase]               = useState<Phase>("loading");
  const [mintPhase, setMintPhase]       = useState<"idle" | "minting" | "success" | "error" | "skipped">("idle");
  const [badgeTxHash, setBadgeTxHash]   = useState<string | null>(null);
  const [questions, setQuestions]       = useState<TriviaQuestion[]>([]);
  const [idx, setIdx]                   = useState(0);
  const [timer, setTimer]               = useState(TIMER_SECONDS);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer]   = useState<string | null>(null);
  const [answers, setAnswers]           = useState<AnsweredQuestion[]>([]);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const [prevBestTierNum, setPrevBestTierNum] = useState(0);
  const [todayStats, setTodayStats]     = useState<{ totalPlayers: number; averageScore: number; percentile: number | null } | null>(null);

  // ── Visual state ─────────────────────────────────────────────────────────
  const [transitionKey, setTransitionKey] = useState(0);
  const [exitingCard, setExitingCard]     = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [flashCorrect, setFlashCorrect]   = useState<string | null>(null);
  const [animProgress, setAnimProgress]   = useState(0);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const questionsRef = useRef<TriviaQuestion[]>([]);
  const idxRef       = useRef(0);
  const answersRef   = useRef<AnsweredQuestion[]>([]);
  const phaseRef     = useRef<Phase>("loading");

  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { idxRef.current = idx; }, [idx]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Load previous best badge tier ───────────────────────────────────────
  useEffect(() => {
    if (!address) return;
    try {
      const stored = localStorage.getItem(`twelfth_best_badge_tier_${address}`);
      if (stored) setPrevBestTierNum(parseInt(stored, 10) || 0);
    } catch { /* ignore */ }
  }, [address]);

  // ── Fetch today's community stats when done ──────────────────────────────
  useEffect(() => {
    if (phase !== "done") return;
    const score = answersRef.current.filter((a) => a.isCorrect).length;
    fetch(`/api/trivia/today-stats?score=${score}`)
      .then((r) => r.json())
      .then((data: { totalPlayers: number; averageScore: number; percentile: number | null }) => setTodayStats(data))
      .catch(() => {});
  }, [phase]);

  // ── Results countup ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "done") { setAnimProgress(0); return; }
    let frame: number;
    const start = performance.now();
    const dur = 800;
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      setAnimProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  // ── Fetch questions ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected || !address || profileLoading) return;
    if (!profile) { setPhase("no_profile"); return; }

    fetch(`/api/trivia/today?walletAddress=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then((data: { alreadyAnswered: boolean; questions?: TriviaQuestion[] }) => {
        if (data.alreadyAnswered) { setPhase("already_done"); return; }
        if (!data.questions?.length) {
          setErrorMsg("No questions available right now.");
          setPhase("error");
          return;
        }
        setQuestions(data.questions);
        setPhase("idle");
      })
      .catch(() => {
        setErrorMsg("Failed to load trivia. Try again.");
        setPhase("error");
      });
  }, [isConnected, address, profile, profileLoading]);

  // ── Advance to next question ─────────────────────────────────────────────
  const advanceToNext = useCallback((answered: AnsweredQuestion) => {
    const nextAnswers = [...answersRef.current, answered];
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);

    const nextIdx = idxRef.current + 1;

    const exitId = setTimeout(
      () => setExitingCard(true),
      Math.max(0, FEEDBACK_MS - EXIT_ANIM_MS - 50)
    );

    setTimeout(() => {
      clearTimeout(exitId);
      setExitingCard(false);
      setHoveredOption(null);
      setSelectedAnswer(null);
      setCorrectAnswer(null);

      if (nextIdx >= questionsRef.current.length) {
        setPhase("done");
        phaseRef.current = "done";
      } else {
        idxRef.current = nextIdx;
        setIdx(nextIdx);
        setTimer(TIMER_SECONDS);
        setTransitionKey((k) => k + 1);
        setPhase("question");
        phaseRef.current = "question";
      }
    }, FEEDBACK_MS);
  }, []);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "question") return;
    if (timer <= 0) {
      const q = questionsRef.current[idxRef.current];
      setPhase("feedback");
      phaseRef.current = "feedback";
      advanceToNext({
        question: q, selectedAnswer: null, isCorrect: false, pointsEarned: 0, correctAnswer: null,
      });
      return;
    }
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timer, advanceToNext]);

  // ── Answer selection ─────────────────────────────────────────────────────
  async function selectAnswer(answer: string) {
    if (phaseRef.current !== "question" || !address) return;
    const q = questionsRef.current[idxRef.current];

    setPhase("feedback");
    phaseRef.current = "feedback";
    setSelectedAnswer(answer);
    setHoveredOption(null);

    try {
      const res  = await fetch("/api/trivia/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, triviaId: q.id, selectedAnswer: answer }),
      });
      const data = await res.json() as {
        isCorrect: boolean;
        pointsEarned: number;
        correctAnswer?: string;
      };
      const ca = data.correctAnswer ?? null;
      setCorrectAnswer(ca);
      if (data.isCorrect) {
        setFlashCorrect(answer);
        setTimeout(() => setFlashCorrect(null), 180);
      }
      advanceToNext({
        question: q, selectedAnswer: answer,
        isCorrect: !!data.isCorrect, pointsEarned: data.pointsEarned ?? 0, correctAnswer: ca,
      });
    } catch {
      advanceToNext({
        question: q, selectedAnswer: answer, isCorrect: false, pointsEarned: 0, correctAnswer: null,
      });
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const country        = COUNTRIES.find((c) => c.code === profile?.country_code);
  const totalPoints    = answers.reduce((s, a) => s + a.pointsEarned, 0);
  const correctCount   = answers.filter((a) => a.isCorrect).length;
  const totalAvailable = questions.reduce((s, q) => s + q.points, 0);
  const displayScore   = Math.round(correctCount * animProgress);
  const displayPoints  = Math.round(totalPoints  * animProgress);

  // ── Option style ─────────────────────────────────────────────────────────
  function optionStyle(option: string): React.CSSProperties {
    const base: React.CSSProperties = {
      padding: "18px 20px",
      borderRadius: 14,
      transition: "all 0.15s ease",
      cursor: phase === "question" ? "pointer" : "default",
      textAlign: "left",
    };

    if (phase === "question") {
      const isHovered = hoveredOption === option;
      return {
        ...base,
        background: isHovered ? "#161616" : "#111111",
        border: isHovered ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.08)",
        color: "white",
        transform: isHovered ? "translateY(-1px)" : "translateY(0)",
      };
    }

    const isSelected   = option === selectedAnswer;
    const isCorrectOpt = correctAnswer !== null && option === correctAnswer;
    const isWrong      = isSelected && correctAnswer !== null && !isCorrectOpt;

    if (isCorrectOpt && flashCorrect === option) return { ...base, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.9)", color: "white", transition: "none" };
    if (isCorrectOpt) return { ...base, background: "rgba(22,163,74,0.2)", border: "1px solid #16a34a", color: "white" };
    if (isWrong)      return { ...base, background: "rgba(220,38,38,0.1)", border: "1px solid #dc2626", color: "#ef4444" };
    if (isSelected)   return { ...base, background: "#161616", border: "1px solid rgba(255,255,255,0.2)", color: "white" };
    return               { ...base, background: "#111111", border: "1px solid rgba(255,255,255,0.05)", color: "#555555", opacity: 0.35 };
  }

  // ── Screens ──────────────────────────────────────────────────────────────

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="text-5xl">⚡</div>
        <h1 className="font-syne font-bold text-2xl tracking-tight text-white">Connect to play.</h1>
        <p className="font-inter text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
          Your wallet identifies your squad and tracks your points.
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (phase === "loading" || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-inter text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (phase === "no_profile") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="text-5xl">🏳️</div>
        <h1 className="font-syne font-bold text-2xl tracking-tight text-white">Join a squad first.</h1>
        <p className="font-inter text-sm" style={{ color: "var(--text-secondary)" }}>Pick your country to start earning points.</p>
        <Link
          href="/onboard"
          className="glass font-syne font-bold px-6 py-3 text-white transition-all duration-200"
          style={{ borderRadius: 12 }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
        >
          Pick your country
        </Link>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="font-syne font-bold text-2xl text-white">Something went wrong.</p>
        <p className="font-inter text-sm" style={{ color: "var(--text-secondary)" }}>{errorMsg}</p>
      </div>
    );
  }

  if (phase === "already_done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center max-w-sm mx-auto page-enter">
        <div className="text-5xl">✅</div>
        <h1 className="font-syne font-bold text-2xl tracking-tight text-white">You&apos;ve played today.</h1>
        <p className="font-inter text-sm" style={{ color: "var(--text-secondary)" }}>Come back tomorrow for a fresh set of questions.</p>
        <p className="font-inter text-xs" style={{ color: "var(--text-muted)" }}>Resets at midnight UTC.</p>
        <div className="flex gap-3 pt-2">
          <Link
            href="/leaderboard"
            className="font-syne font-bold px-5 py-3 rounded-xl text-sm text-black transition-all duration-200"
            style={{ background: "white" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Leaderboard
          </Link>
          <Link
            href="/squad"
            className="glass font-syne font-semibold px-5 py-3 text-sm text-white transition-all duration-200"
            style={{ borderRadius: 12 }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          >
            My Squad
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-7 text-center max-w-sm mx-auto page-enter">
        <div className="flex flex-col items-center gap-3">
          {profile?.country_code && (
            <div style={{ filter: "drop-shadow(0 0 16px rgba(22,163,74,0.35))" }}>
              <FlagImage code={profile.country_code} size={80} />
            </div>
          )}
          <p className="font-syne font-bold text-xl text-white">{country?.name ?? profile?.country_code}</p>
        </div>
        <div className="space-y-3">
          <h1 className="font-syne font-extrabold text-4xl tracking-tight text-white">Today&apos;s Trivia</h1>
          <p className="font-inter text-sm" style={{ color: "var(--text-secondary)" }}>
            {questions.length} question{questions.length !== 1 ? "s" : ""}. Prove your knowledge.
          </p>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-syne font-bold text-sm"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#888888" }}
          >
            +{totalAvailable} pts up for grabs
          </div>
        </div>

        {/* Badge tier guide */}
        <div
          style={{
            background: "#111111",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: "14px 18px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "#444444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
              Earn a badge
            </p>
            {prevBestTierNum > 0 && (
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700,
                color: prevBestTierNum === 3 ? "#fbbf24" : prevBestTierNum === 2 ? "#22d3ee" : "#a78bfa",
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                Best: {prevBestTierNum === 3 ? "Expert" : prevBestTierNum === 2 ? "Fan" : "Rookie"}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {([
              { tier: "Expert", range: "5/5 correct", color: "#fbbf24", num: 3 },
              { tier: "Fan",    range: "3–4 correct", color: "#22d3ee", num: 2 },
              { tier: "Rookie", range: "0–2 correct", color: "#a78bfa", num: 1 },
            ] as const).map(({ tier, range, color, num }) => (
              <div key={tier} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0,
                  opacity: prevBestTierNum >= num ? 1 : 0.45,
                }} />
                <span style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700,
                  color: prevBestTierNum >= num ? color : "rgba(255,255,255,0.35)",
                  flex: "0 0 56px", letterSpacing: "0.06em", textTransform: "uppercase",
                }}>
                  {tier}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#444444" }}>
                  {range}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            setTransitionKey((k) => k + 1);
            setTimer(TIMER_SECONDS);
            setPhase("question");
            phaseRef.current = "question";
          }}
          className="w-full py-4 rounded-2xl text-lg font-syne font-bold text-white transition-all duration-200"
          style={{ background: "#16a34a" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#15803d";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 30px rgba(22,163,74,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#16a34a";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Start
        </button>
      </div>
    );
  }

  if (phase === "question" || phase === "feedback") {
    const q = questions[idx];

    return (
      <div className="max-w-lg mx-auto space-y-5">
        {/* Timer progress bar */}
        {phase === "question" && (
          <div key={transitionKey} style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 100, background: "rgba(255,255,255,0.06)" }}>
            <div
              style={{
                height: "100%",
                background: "rgba(255,255,255,0.5)",
                width: `${((TIMER_SECONDS - timer) / TIMER_SECONDS) * 100}%`,
                transition: "width 1s linear",
              }}
            />
          </div>
        )}
        {/* Progress + Timer */}
        <div className="flex items-center justify-between">
          <ProgressDots total={questions.length} idx={idx} answeredCount={answers.length} />
          <CircularTimer timer={timer} total={TIMER_SECONDS} />
        </div>

        {/* Question card */}
        <div className="overflow-hidden rounded-[20px]">
          <div
            key={transitionKey}
            className={exitingCard ? "animate-card-out" : "animate-card-in"}
            style={{
              background: "rgba(17,17,17,0.9)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderTop: "2px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
              padding: "36px 32px",
              textAlign: "center",
            }}
          >
            <div className="mb-3">
              <span
                className="font-inter text-xs uppercase tracking-widest font-semibold"
                style={{ color: "#555555" }}
              >
                Question {idx + 1} of {questions.length}
              </span>
            </div>
            <p className="font-syne font-semibold text-xl text-white leading-snug">{q.question}</p>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {q.options.map((option, optIdx) => {
            const isSelected   = option === selectedAnswer;
            const isCorrectOpt = correctAnswer !== null && option === correctAnswer;
            const isWrong      = isSelected && phase === "feedback" && correctAnswer !== null && !isCorrectOpt;

            return (
              <button
                key={`${option}-${transitionKey}`}
                onClick={() => selectAnswer(option)}
                disabled={phase !== "question"}
                onMouseEnter={() => phase === "question" && setHoveredOption(option)}
                onMouseLeave={() => setHoveredOption(null)}
                className="font-inter text-sm font-medium disabled:cursor-default"
                style={{
                  ...optionStyle(option),
                  ...(phase === "question" ? { animation: `option-appear 0.2s ease-out ${optIdx * 50}ms both` } : {}),
                }}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{option}</span>
                  {phase === "feedback" && isCorrectOpt && (
                    <span style={{ color: "#16a34a", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  )}
                  {phase === "feedback" && isWrong && (
                    <span style={{ color: "#ef4444", flexShrink: 0 }}>✗</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const badge = getBadgeTier(correctCount);
    const currentTier = badge.tokenId - 6; // 7→1, 8→2, 9→3

    const TIER_NAMES: Record<number, string> = { 1: "Rookie", 2: "Fan", 3: "Expert" };
    const mintCondition: "upgrade" | "same" | "lower" =
      currentTier > prevBestTierNum ? "upgrade" :
      currentTier === prevBestTierNum ? "same" : "lower";

    async function mintBadge() {
      if (!address) return;
      setMintPhase("minting");
      try {
        const hash = await writeContractAsync({
          address: FAN_BADGE_ADDRESS,
          abi: FAN_BADGE_ABI,
          functionName: "mintBadge",
          args: [address as `0x${string}`, BigInt(badge.tokenId), badge.tier],
          gas: BigInt(200000),
        });
        setMintPhase("success");
        setBadgeTxHash(hash);
        try {
          localStorage.setItem(`twelfth_best_badge_tier_${address}`, String(currentTier));
          localStorage.setItem(
            `twelfth_best_badge_${address}`,
            JSON.stringify({ tier: badge.tier, tokenId: badge.tokenId, icon: badge.icon, txHash: hash, mintedAt: new Date().toISOString() })
          );
        } catch { /* ignore */ }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("rejected") || msg.includes("denied") || msg.includes("cancelled")) {
          setMintPhase("idle");
        } else {
          setMintPhase("error");
        }
      }
    }

    return (
      <div className="max-w-lg mx-auto space-y-6 page-enter">
        {/* Score */}
        <div
          className="glass text-center py-10 px-6 space-y-3"
          style={{
            background: "#111111",
            borderTop: "2px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <p className="font-inter text-xs uppercase tracking-widest font-semibold" style={{ color: "#555555" }}>
            Final Score
          </p>
          <div className="font-syne font-black tabular-nums leading-none" style={{ fontSize: "5rem", color: "white" }}>
            {displayScore}
            <span style={{ fontSize: "2.5rem", color: "rgba(255,255,255,0.25)", margin: "0 4px" }}>/</span>
            <span style={{ fontSize: "2.5rem", color: "rgba(255,255,255,0.6)" }}>{answers.length}</span>
          </div>
          <p className="font-inter text-sm" style={{ color: "var(--text-secondary)" }}>correct answers</p>
          {totalPoints > 0 && (
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-syne font-bold text-lg" style={{ background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.3)", color: "#16a34a" }}>
              +{displayPoints} pts earned
            </div>
          )}
        </div>

        {/* Today's community stats */}
        {todayStats && todayStats.totalPlayers > 1 && (
          <div
            style={{
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "12px 20px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "#444444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                Today&apos;s Game
              </p>
            </div>
            <div style={{ display: "flex" }}>
              <div style={{ flex: 1, textAlign: "center", padding: "16px 8px", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="font-syne font-black tabular-nums" style={{ fontSize: "1.7rem", color: "white", lineHeight: 1 }}>
                  {todayStats.totalPlayers.toLocaleString()}
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "#555555", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 5 }}>
                  Fans played
                </div>
              </div>
              <div style={{ flex: 1, textAlign: "center", padding: "16px 8px" }}>
                <div className="font-syne font-black tabular-nums" style={{ fontSize: "1.7rem", color: "white", lineHeight: 1 }}>
                  {todayStats.averageScore}/5
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "#555555", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 5 }}>
                  Avg score
                </div>
              </div>
            </div>
            {todayStats.percentile !== null && (
              <div style={{ padding: "10px 20px 12px", borderTop: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: todayStats.percentile >= 50 ? "#22d3ee" : "#666666" }}>
                  {todayStats.percentile >= 50
                    ? `You scored better than ${todayStats.percentile}% of players today`
                    : `Top ${100 - todayStats.percentile}% of players scored higher today`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Badge */}
        {(() => {
          const safeMintPhase: "idle" | "minting" | "success" | "error" =
            mintPhase === "skipped" ? "idle" : mintPhase;
          return (
            <div className="flex flex-col items-center gap-4">
              <BadgeCard
                tier={badge.tier.toLowerCase() as "rookie" | "fan" | "expert"}
                countryCode={profile?.country_code ?? ""}
                score={`${correctCount}/${answers.length} correct`}
                size="lg"
                showMintButton={mintCondition === "upgrade" && mintPhase !== "skipped"}
                onMint={() => { void mintBadge(); }}
                mintPhase={safeMintPhase}
                txHash={badgeTxHash ?? undefined}
              />
              {mintCondition === "same" && (
                <p className="font-inter text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                  You already have this. Score higher to upgrade.
                </p>
              )}
              {mintCondition === "lower" && (
                <p className="font-inter text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                  Your {TIER_NAMES[prevBestTierNum]} badge stands. Beat it next time.
                </p>
              )}
            </div>
          );
        })()}

        {/* Breakdown */}
        <div className="space-y-2">
          {answers.map((a) => (
            <div
              key={a.question.id}
              className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{
                background: "rgba(13,26,13,0.6)",
                border: `1px solid ${a.isCorrect ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
              }}
            >
              <span className="mt-0.5 text-sm shrink-0 font-bold" style={{ color: a.isCorrect ? "#16a34a" : "#ef4444" }}>
                {a.isCorrect ? "✓" : "✗"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-inter text-sm text-gray-200 leading-snug">{a.question.question}</p>
                {a.selectedAnswer ? (
                  <p className="font-inter text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Your answer:{" "}
                    <span style={{ color: a.isCorrect ? "#16a34a" : "#ef4444" }}>{a.selectedAnswer}</span>
                  </p>
                ) : (
                  <p className="font-inter text-xs mt-1" style={{ color: "var(--text-muted)" }}>Time&apos;s up</p>
                )}
              </div>
              {a.isCorrect && (
                <span className="font-syne font-bold text-xs shrink-0 tabular-nums" style={{ color: "#16a34a" }}>+{a.pointsEarned}pts</span>
              )}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          <Link
            href="/leaderboard"
            className="text-center font-syne font-bold py-4 rounded-2xl text-black transition-all duration-200"
            style={{ background: "white" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Leaderboard
          </Link>
          <Link
            href="/squad"
            className="text-center glass font-syne font-semibold py-4 text-white transition-all duration-200"
            style={{ borderRadius: 16 }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
          >
            My Squad
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
