"use client";

import { type ReactNode } from "react";

/**
 * Standard setup / intro screen shown before a game starts.
 *
 * Renders a centred icon, title, description, an optional "How to Play" card,
 * an optional slot for difficulty / mode selectors, and a Start button.
 *
 * Extracted from the setup-phase blocks across all game mode pages.
 */
export default function GameSetup({
  icon,
  title,
  description,
  howToPlay,
  onStart,
  accentColor,
  isPractice = false,
  children,
}: {
  /** Emoji shown at the top (e.g. "🎵"). */
  icon: string;
  /** Game title (e.g. "Note ID"). */
  title: string;
  /** One-line description below the title. */
  description: string;
  /** Steps for the "How to Play" card. Omit to hide the card. */
  howToPlay?: string[];
  /** Called when the Start button is tapped. */
  onStart: () => void;
  /** Accent colour for the "How to Play" header and Start button. */
  accentColor: string;
  /** Whether the game is in practice mode (changes button label). */
  isPractice?: boolean;
  /** Optional slot for difficulty / mode selectors (rendered above the button). */
  children?: ReactNode;
}) {
  return (
    <div className="pb-tab" style={{ background: "var(--ios-bg)", minHeight: "100dvh" }}>
      <div className="mx-auto max-w-sm px-4 pt-12 md:max-w-lg">
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>{icon}</div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--ios-label)",
              letterSpacing: "-0.5px",
              marginBottom: 8,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 15, color: "var(--ios-label3)", marginBottom: 24 }}>
            {description}
          </div>

          {howToPlay && (
            <div className="ios-card" style={{ padding: 16, textAlign: "left", marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: accentColor,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                How to Play
              </div>
              <ol
                style={{
                  fontSize: 14,
                  color: "var(--ios-label3)",
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {howToPlay.map((step, i) => (
                  <li key={i}>{`${i + 1}. ${step}`}</li>
                ))}
              </ol>
            </div>
          )}

          {children}

          <button
            className="ios-btn-primary"
            style={{ background: accentColor, marginTop: howToPlay || children ? 0 : 8 }}
            onClick={onStart}
          >
            {isPractice ? "🎓 Start Practicing" : "Start Game"}
          </button>
        </div>
      </div>
    </div>
  );
}
