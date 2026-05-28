"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { COUNTRIES } from "@/lib/mock-data";
import { FlagImage } from "@/components/FlagImage";
import { registerFan, getProfile } from "@/lib/db";
import {
  FAN_REGISTRY_ADDRESS,
  FAN_REGISTRY_ABI,
  TX_EXPLORER_BASE,
} from "@/lib/contracts";

const STEP_EXIT_MS = 250;
const MAX_NAME_LEN = 20;

// ── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;
type MintPhase = "idle" | "db" | "wallet" | "chain" | "done";

// ── Utilities ─────────────────────────────────────────────────────────────────

function extractError(e: unknown): { code: string; message: string } {
  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>;
    return {
      code: String(obj.code ?? ""),
      message: String(obj.message ?? obj.msg ?? JSON.stringify(e)),
    };
  }
  if (e instanceof Error) return { code: "", message: e.message };
  return { code: "", message: String(e) };
}

function isDuplicateError(e: unknown): boolean {
  const { code, message } = extractError(e);
  return (
    code === "23505" ||
    message.includes("duplicate") ||
    message.includes("unique")
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StepProgress({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {([1, 2, 3] as Step[]).map((s) => (
        <div
          key={s}
          className="rounded-full transition-all duration-300"
          style={{
            width: s === step ? 28 : 8,
            height: 8,
            background: s < step ? "white" : s === step ? "white" : "#333333",
          }}
        />
      ))}
    </div>
  );
}

function MiniPassport({
  code,
  name,
  countryName,
}: {
  code: string;
  name: string;
  countryName: string;
}) {
  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <FlagImage code={code} size={40} />
      <div>
        <p style={{ color: "white", fontWeight: 700, fontSize: 15 }}>
          {name || "YOUR NAME"}
        </p>
        <p style={{ color: "#555555", fontSize: 12 }}>{countryName}</p>
        <p style={{ color: "#888888", fontSize: 11, fontWeight: 700 }}>
          FAN #????
        </p>
      </div>
    </div>
  );
}

function PassportCard({
  code,
  name,
  countryName,
  address,
}: {
  code: string;
  name: string;
  countryName: string;
  address: string | undefined;
}) {
  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        overflow: "hidden",
        maxWidth: 340,
        margin: "0 auto",
      }}
    >
      {/* Header stripe */}
      <div
        style={{
          background: "#111111",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          height: 80,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* White top stripe overlay */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 16,
            color: "rgba(255,255,255,0.5)",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          World Cup 2026
        </div>
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            color: "#444444",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Fan Passport
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 24px 24px", textAlign: "center" }}>
        {/* Flag circle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#0d0d0d",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FlagImage code={code} size={52} />
          </div>
        </div>
        <p
          style={{
            color: "#444444",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 4,
          }}
        >
          {countryName}
        </p>
        <p
          style={{
            color: "white",
            fontSize: 22,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 4,
          }}
        >
          {name || "YOUR NAME"}
        </p>
        <p
          style={{
            color: "#888888",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          FAN #????
        </p>

        <p
          style={{
            color: "#444444",
            fontFamily: "monospace",
            fontSize: 11,
            marginBottom: 18,
          }}
        >
          {address
            ? `${address.slice(0, 6)}...${address.slice(-4)}`
            : "0x????...????"}
        </p>

        {/* Stats grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          {[
            { label: "Points", value: "0" },
            { label: "Issued", value: "Today" },
            { label: "Streak", value: "0" },
            { label: "Token ID", value: "Pending" },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{ background: "#0d0d0d", padding: "10px 14px" }}
            >
              <p
                style={{
                  color: "#444444",
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {label}
              </p>
              <p
                style={{
                  color: "#e5e7eb",
                  fontSize: 14,
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* X Layer badge */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              background: "#0d0d0d",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "4px 10px",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#16a34a",
              }}
            />
            <span
              style={{
                color: "#888888",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.12em",
              }}
            >
              X LAYER
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function OnboardPage() {
  const { isConnected, address } = useAccount();
  const router = useRouter();

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep]       = useState<Step>(1);
  const [stepKey, setStepKey] = useState(0);
  const [exiting, setExiting] = useState(false);
  const stepTimerRef          = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Per-step data ───────────────────────────────────────────────────────────
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [search, setSearch]             = useState("");
  const [displayName, setDisplayName]   = useState("");


  // ── Mint state ──────────────────────────────────────────────────────────────
  const [mintPhase, setMintPhase] = useState<MintPhase>("idle");
  const [txHash, setTxHash]       = useState<`0x${string}` | undefined>();
  const [error, setError]         = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();
  const { isSuccess: txConfirmed, isError: txFailed } =
    useWaitForTransactionReceipt({ hash: txHash });

  // ── Supabase registration check ─────────────────────────────────────────────
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) {
      setCheckingProfile(false);
      return;
    }
    setCheckingProfile(true);
    getProfile(address)
      .then((profile) => {
        if (profile) router.replace("/squad");
        else setCheckingProfile(false);
      })
      .catch(() => setCheckingProfile(false));
  }, [isConnected, address, router]);

  useEffect(() => {
    if (txConfirmed) setMintPhase("done");
    if (txFailed) setMintPhase("done"); // Supabase already committed
  }, [txConfirmed, txFailed]);

  // Cleanup step timer on unmount
  useEffect(() => () => clearTimeout(stepTimerRef.current), []);

  // ── Step navigation ─────────────────────────────────────────────────────────
  const goToStep = useCallback((next: Step) => {
    setExiting(true);
    stepTimerRef.current = setTimeout(() => {
      setExiting(false);
      setStep(next);
      setStepKey((k) => k + 1);
    }, STEP_EXIT_MS);
  }, []);

  // ── Mint ────────────────────────────────────────────────────────────────────
  async function handleMint() {
    if (!selectedCode || !address || !displayName.trim()) return;
    setMintPhase("db");
    setError(null);

    try {
      await registerFan(address, selectedCode, displayName.trim());
    } catch (e: unknown) {
      if (!isDuplicateError(e)) {
        const { code, message } = extractError(e);
        setError(code ? `DB error ${code}: ${message}` : message);
        setMintPhase("idle");
        return;
      }
    }

    if (!FAN_REGISTRY_ADDRESS) {
      setMintPhase("done");
      return;
    }

    try {
      setMintPhase("wallet");
      const hash = await writeContractAsync({
        address: FAN_REGISTRY_ADDRESS,
        abi: FAN_REGISTRY_ABI,
        functionName: "registerFan",
        args: [selectedCode],
        gas: BigInt(200000),
      });
      setTxHash(hash);
      setMintPhase("chain");
    } catch (e: unknown) {
      const { message } = extractError(e);
      const isAlreadyOnchain =
        message.includes("AlreadyRegistered") ||
        message.toLowerCase().includes("already registered");

      if (isAlreadyOnchain) {
        // DB is committed — treat as success
        setMintPhase("done");
      } else {
        const isRejection =
          message.toLowerCase().includes("user rejected") ||
          message.toLowerCase().includes("rejected the request") ||
          message.toLowerCase().includes("denied");
        setError(
          isRejection
            ? "Transaction rejected. Press 'Mint on X Layer' to try again."
            : message
        );
        setMintPhase("idle");
      }
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );
  const selectedCountry  = COUNTRIES.find((c) => c.code === selectedCode);
  const trimmedName      = displayName.trim();
  const canContinue2     = trimmedName.length >= 2;
  const mintBusy         = mintPhase !== "idle";

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div style={{ fontSize: 48 }}>⚽</div>
        <h1 className="font-syne font-bold text-2xl tracking-tight text-white">
          Your squad is waiting.
        </h1>
        <p className="font-inter text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
          Connect your wallet. Pick your country. That&apos;s it.
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (checkingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-inter text-sm" style={{ color: "var(--text-muted)" }}>
          Checking your account…
        </p>
      </div>
    );
  }

  // ── Step renderer ────────────────────────────────────────────────────────────
  function renderStep(): React.ReactNode {
    // ── Step 1 — Pick Country ─────────────────────────────────────────────────
    if (step === 1) {
      return (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <h1 className="font-syne font-bold text-2xl tracking-tight text-white">
              Pick your country.
            </h1>
            <p className="font-inter text-sm" style={{ color: "var(--text-secondary)" }}>
              This is your squad. Choose once. Cannot be changed.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "12px 16px",
              color: "white",
              fontSize: 14,
              outline: "none",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")
            }
          />

          <div
            className="grid grid-cols-2 gap-2 pr-1"
            style={{ maxHeight: 360, overflowY: "auto" }}
          >
            {filtered.map((country) => {
              const isSelected = selectedCode === country.code;
              return (
                <button
                  key={country.code}
                  onClick={() => setSelectedCode(country.code)}
                  disabled={exiting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: isSelected
                      ? "2px solid #ffffff"
                      : "1px solid rgba(255,255,255,0.06)",
                    background: isSelected
                      ? "#1a1a1a"
                      : "#111111",
                    boxShadow: isSelected
                      ? "0 0 20px rgba(255,255,255,0.08)"
                      : "none",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 200ms ease",
                    width: "100%",
                  }}
                >
                  <FlagImage code={country.code} size={32} />
                  <div>
                    <div
                      style={{
                        color: "white",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {country.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedCode && (
            <button
              onClick={() => goToStep(2)}
              disabled={exiting}
              style={{
                width: "100%",
                background: "#ffffff",
                color: "#080808",
                fontWeight: 700,
                fontSize: 16,
                padding: "16px",
                borderRadius: 16,
                border: "none",
                cursor: exiting ? "not-allowed" : "pointer",
                transition: "all 200ms ease",
                fontFamily: "var(--font-syne), Syne, sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Continue →
            </button>
          )}
        </div>
      );
    }

    // ── Step 2 — Your Name ────────────────────────────────────────────────────
    if (step === 2) {
      return (
        <div className="space-y-6 max-w-sm mx-auto">
          <div className="text-center space-y-1">
            <h1 className="font-syne font-bold text-2xl tracking-tight text-white">
              What is your name?
            </h1>
            <p className="font-inter text-sm" style={{ color: "var(--text-secondary)" }}>
              This appears on your fan passport and leaderboard.
            </p>
          </div>

          <div className="space-y-1">
            <input
              type="text"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) =>
                setDisplayName(e.target.value.slice(0, MAX_NAME_LEN))
              }
              maxLength={MAX_NAME_LEN}
              autoFocus
              style={{
                width: "100%",
                background: "#111111",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "14px 16px",
                color: "white",
                fontSize: 20,
                fontWeight: 700,
                textAlign: "center",
                outline: "none",
                letterSpacing: "0.02em",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")
              }
            />
            <p
              style={{
                textAlign: "right",
                color:
                  displayName.length >= MAX_NAME_LEN ? "#ef4444" : "#555555",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {displayName.length} / {MAX_NAME_LEN}
            </p>
          </div>

          {selectedCode && selectedCountry && (
            <MiniPassport
              code={selectedCode}
              name={displayName}
              countryName={selectedCountry.name}
            />
          )}

          <button
            onClick={() => goToStep(3)}
            disabled={!canContinue2 || exiting}
            style={{
              width: "100%",
              background: canContinue2 ? "#ffffff" : "rgba(255,255,255,0.08)",
              color: canContinue2 ? "#080808" : "#444444",
              fontWeight: 700,
              fontSize: 16,
              padding: "16px",
              borderRadius: 16,
              border: "none",
              cursor: canContinue2 && !exiting ? "pointer" : "not-allowed",
              transition: "all 200ms ease",
              fontFamily: "var(--font-syne), Syne, sans-serif",
            }}
            onMouseEnter={(e) => {
              if (canContinue2 && !exiting) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,255,255,0.15)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Continue →
          </button>
        </div>
      );
    }

    // ── Step 3 — Mint ─────────────────────────────────────────────────────────
    if (step === 3) {
      // Success state
      if (mintPhase === "done") {
        return (
          <div className="space-y-5 max-w-sm mx-auto text-center">
            <div style={{ fontSize: 48 }}>🎉</div>
            <div className="space-y-1">
              <h1 className="font-syne font-bold text-2xl tracking-tight text-white">
                Your passport is live.
              </h1>
              <p className="font-inter text-sm" style={{ color: "var(--text-muted)" }}>
                Welcome to the squad.
              </p>
            </div>
            {txHash && (
              <a
                href={`${TX_EXPLORER_BASE}/${txHash}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#16a34a",
                  fontSize: 13,
                  display: "block",
                }}
                className="hover:underline"
              >
                View transaction on explorer →
              </a>
            )}
            <Link
              href="/play"
              className="block text-center font-syne font-bold py-4 rounded-2xl text-white transition-all duration-200"
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
              Start Playing
            </Link>
          </div>
        );
      }

      // Pre-mint state
      const mintLabel =
        mintPhase === "db"     ? "Saving…"           :
        mintPhase === "wallet" ? "Confirm in wallet…" :
        mintPhase === "chain"  ? "Confirming…"        :
                                 "Mint on X Layer";

      return (
        <div className="space-y-5 max-w-sm mx-auto">
          <div className="text-center space-y-1">
            <h1 className="font-syne font-bold text-2xl tracking-tight text-white">
              Your passport is ready.
            </h1>
            <p className="font-inter text-sm" style={{ color: "var(--text-secondary)" }}>
              Mint it on X Layer. It&apos;s yours forever.
            </p>
          </div>

          {selectedCode && selectedCountry && (
            <PassportCard
              code={selectedCode}
              name={displayName}
              countryName={selectedCountry.name}
              address={address}
            />
          )}

          {error && (
            <div
              style={{
                background: "rgba(220,38,38,0.08)",
                border: "1px solid rgba(220,38,38,0.3)",
                borderRadius: 12,
                padding: "12px 16px",
              }}
            >
              <p
                style={{ color: "#ef4444", fontSize: 13, fontWeight: 600 }}
              >
                Registration failed
              </p>
              <p
                style={{
                  color: "rgba(239,68,68,0.7)",
                  fontSize: 11,
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  marginTop: 4,
                }}
              >
                {error}
              </p>
            </div>
          )}

          {mintPhase === "wallet" && (
            <p
              style={{
                color: "rgba(234,179,8,0.8)",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Check your wallet to confirm the transaction.
            </p>
          )}

          {mintPhase === "chain" && (
            <p
              style={{
                color: "#6b7280",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Transaction submitted — waiting for confirmation…
            </p>
          )}

          <button
            onClick={handleMint}
            disabled={mintBusy}
            style={{
              width: "100%",
              background: mintBusy ? "rgba(22,163,74,0.15)" : "#16a34a",
              color: mintBusy ? "var(--text-muted)" : "white",
              fontWeight: 700,
              fontSize: 16,
              padding: "16px",
              borderRadius: 16,
              border: "none",
              cursor: mintBusy ? "not-allowed" : "pointer",
              transition: "all 200ms ease",
              opacity: mintPhase === "chain" ? 0.7 : 1,
              fontFamily: "var(--font-syne), Syne, sans-serif",
            }}
            onMouseEnter={(e) => {
              if (!mintBusy) {
                e.currentTarget.style.background = "#15803d";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(22,163,74,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              if (!mintBusy) e.currentTarget.style.background = "#16a34a";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {mintLabel}
          </button>
        </div>
      );
    }

    return null;
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="page-enter max-w-lg mx-auto py-4">
      <StepProgress step={step} />
      <div style={{ overflow: "hidden" }}>
        <div
          key={stepKey}
          className={exiting ? "animate-step-out" : "animate-step-in"}
        >
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
