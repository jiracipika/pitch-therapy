"use client";

import { type ReactNode } from "react";

/**
 * Standard outer wrapper for game pages.
 *
 * Renders the full-screen background + max-width container and the shared
 * header bar: back chevron (left), centred title, score badge (right).
 *
 * This is extracted from the ~18 identical header blocks across
 * the game mode pages.
 */
export default function GameShell({
  title,
  accentColor,
  score,
  onBack,
  children,
}: {
  /** Display title shown centred in the header (include emoji prefix). */
  title: string;
  /** Hex colour used for the score badge text when score > 0. */
  accentColor: string;
  /** Score to show in the right badge. Pass `null` to show "Practice". */
  score: number | null;
  /** Called when the back chevron is tapped. */
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div className="pb-tab" style={{ background: "var(--ios-bg)", minHeight: "100dvh" }}>
      <div className="mx-auto max-w-sm px-4 pt-12 md:max-w-lg">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            minHeight: 44,
          }}
        >
          {/* Back chevron */}
          <button
            aria-label="Back to dashboard"
            onClick={onBack}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: "var(--ios-bg2)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
              <path
                d="M8.5 1.5L1.5 8.5L8.5 15.5"
                stroke="var(--ios-blue)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Centred title */}
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

          {/* Score / practice badge */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: score === null ? "var(--ios-label3)" : "var(--ios-label2)",
              background: "var(--ios-bg2)",
              borderRadius: 10,
              padding: "4px 10px",
            }}
          >
            {score === null ? "Practice" : `${score} pts`}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
