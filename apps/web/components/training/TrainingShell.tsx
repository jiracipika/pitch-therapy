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
 *
 * Visual language: "Resonance Studio" — same design system as the landing
 * page instrument panel (mono micro-labels, accent-tinted score pill,
 * hairline meters, grid backdrop).
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
  const isError = status === "denied" || status === "unavailable";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`studio-training-mic ${isError ? "is-error" : ""}`}
    >
      <span aria-hidden="true">{isError ? "⚠" : "◉"}</span>
      <span>
        <b>{msg.label}</b>
        {msg.hint ? <small>{msg.hint}</small> : null}
      </span>
    </div>
  );
}

export default function TrainingShell({
  title,
  round,
  totalRounds,
  scoreLabel,
  accent = "#c7ff4a",
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
      className="pb-tab studio-training"
      style={{ "--mode-accent": accent } as React.CSSProperties}
      data-training-shell=""
    >
      <div className="mx-auto max-w-sm px-4 pt-12 md:max-w-lg">
        {/* Header */}
        <div className="studio-training-bar">
          <button
            aria-label={`Exit ${title}`}
            onClick={handleBack}
            className="studio-training-back"
          >
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none" aria-hidden="true">
              <path
                d="M8.5 1.5L1.5 8.5L8.5 15.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <b>{title}</b>
          <div className="studio-training-score" aria-live="polite">
            {scoreLabel ?? ""}
          </div>
        </div>

        {/* Progress */}
        <div
          className="studio-training-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalRounds}
          aria-valuenow={Math.min(round, totalRounds)}
          aria-label={`${title} progress`}
        >
          <i
            style={{
              width: `${Math.min((round / totalRounds) * 100, 100)}%`,
              transition: reduced ? "none" : "width 350ms cubic-bezier(0.22, 1, 0.36, 1)",
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
              className="studio-panel"
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
                  style={{ background: "var(--ios-red)", color: "#fff" }}
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
