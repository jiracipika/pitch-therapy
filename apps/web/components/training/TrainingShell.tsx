"use client";

/**
 * TrainingShell — shared layout for every training mode.
 *
 * Owns the parts that were duplicated across all 18 mode pages:
 * - mode header (back with unsaved-progress confirmation, title, score pill)
 * - session progress bar
 * - microphone status banner with actionable error messages
 * - exit confirmation dialog
 * - reduced-motion-aware entrance
 *
 * The shell owns PRESENTATION only — scoring, round logic, and audio
 * detection remain in each mode page.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export type MicStatus =
  | "idle"
  | "requesting"
  | "denied"
  | "unavailable"
  | "active"
  | "silent";

export interface TrainingShellProps {
  title: string;
  /** Current round (0-based). */
  round: number;
  totalRounds: number;
  /** Score pill text; hidden when null (e.g. practice mode). */
  scoreLabel: string | null;
  accent?: string;
  micStatus?: MicStatus;
  micError?: string | null;
  /** Prompt before abandoning a session in progress. */
  confirmExit?: boolean;
  /** Exit destination; defaults to /play-modes. */
  exitHref?: string;
  children: ReactNode;
}

const MIC_MESSAGES: Record<Exclude<MicStatus, "idle" | "active">, { label: string; hint: string }> = {
  requesting: { label: "Requesting microphone…", hint: "Your browser will ask for permission." },
  denied: {
    label: "Microphone access denied",
    hint: "Allow mic access in your browser's site settings, then start again.",
  },
  unavailable: {
    label: "Microphone unavailable",
    hint: "Check that a mic is connected and no other app is using it.",
  },
  silent: {
    label: "We can't hear you",
    hint: "Move closer or hum a little louder.",
  },
};

export function MicStatusBanner({ status, error }: { status: MicStatus; error?: string | null }) {
  if (status === "idle" || status === "active") return null;
  const msg = error ? { label: error, hint: MIC_MESSAGES[status]?.hint ?? "" } : MIC_MESSAGES[status];
  const tone = status === "requesting" || status === "silent" ? "warn" : "error";
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        marginTop: 12,
        borderRadius: 12,
        padding: "12px 16px",
        background: tone === "error" ? "rgba(255,69,58,0.12)" : "rgba(255,159,10,0.12)",
        border: `1px solid ${tone === "error" ? "var(--ios-red)" : "var(--ios-orange)"}`,
        fontSize: 13,
        color: tone === "error" ? "var(--ios-red)" : "var(--ios-orange)",
        textAlign: "left",
      }}
    >
      ⚠️ {msg.label}
      {msg.hint ? <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>{msg.hint}</div> : null}
    </div>
  );
}

export default function TrainingShell({
  title,
  round,
  totalRounds,
  scoreLabel,
  accent = "#0A84FF",
  micStatus = "idle",
  micError,
  confirmExit = false,
  exitHref = "/play-modes",
  children,
}: TrainingShellProps) {
  const router = useRouter();
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const handleBack = () => {
    if (confirmExit) setExitDialogOpen(true);
    else router.push(exitHref);
  };

  return (
    <div
      ref={shellRef}
      className="pb-tab"
      style={{ background: "var(--ios-bg)", minHeight: "100dvh" }}
      data-training-shell=""
    >
      <div className="mx-auto max-w-sm px-4 pt-12 md:max-w-lg">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            minHeight: 44,
          }}
        >
          <button
            aria-label={`Exit ${title}`}
            onClick={handleBack}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: "var(--ios-bg2)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none" aria-hidden="true">
              <path
                d="M8.5 1.5L1.5 8.5L8.5 15.5"
                stroke="var(--ios-blue)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "var(--ios-label)",
              letterSpacing: "-0.43px",
            }}
          >
            {title}
          </div>
          <div
            aria-live="polite"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--ios-label2)",
              background: "var(--ios-bg2)",
              borderRadius: 10,
              padding: "4px 10px",
              minWidth: 60,
              textAlign: "center",
            }}
          >
            {scoreLabel ?? ""}
          </div>
        </div>

        {/* Progress */}
        <div
          className="ios-progress-track mb-6"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalRounds}
          aria-valuenow={Math.min(round, totalRounds)}
          aria-label={`${title} progress`}
        >
          <div
            className="ios-progress-fill"
            style={{
              width: `${Math.min((round / totalRounds) * 100, 100)}%`,
              background: accent,
              transition: reduced ? "none" : undefined,
            }}
          />
        </div>

        <MicStatusBanner status={micStatus} error={micError} />

        {children}

        {exitDialogOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Leave session?"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              padding: 24,
            }}
          >
            <div
              className="ios-card"
              style={{ padding: 24, maxWidth: 320, width: "100%", textAlign: "center" }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "var(--ios-label)" }}>
                Leave session?
              </div>
              <div style={{ fontSize: 14, color: "var(--ios-label3)", marginBottom: 20 }}>
                Your progress in this session will be lost.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  className="ios-btn-primary"
                  style={{ background: "var(--ios-red)" }}
                  onClick={() => router.push(exitHref)}
                >
                  Leave
                </button>
                <button className="ios-btn-secondary" onClick={() => setExitDialogOpen(false)} autoFocus>
                  Keep Training
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
