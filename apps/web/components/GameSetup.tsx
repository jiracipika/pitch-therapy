"use client";

import { type ReactNode } from "react";

/**
 * Standard setup / intro screen shown before a game starts.
 *
 * Renders the mode icon, title, description, an optional "How to Play" card,
 * an optional slot for difficulty / mode selectors, and a Start button.
 *
 * Visual language: "Resonance Studio" — mono micro-labels, hairline list,
 * accent pill CTA (same system as the landing page instrument panel).
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
    <div style={{ paddingTop: 26, paddingBottom: 8 }}>
      <div
        aria-hidden="true"
        style={{
          width: 74,
          height: 74,
          display: "grid",
          placeItems: "center",
          margin: "0 auto 20px",
          borderRadius: 21,
          fontSize: 36,
          background: `color-mix(in srgb, ${accentColor} 13%, transparent)`,
          border: `1px solid color-mix(in srgb, ${accentColor} 24%, transparent)`,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          textAlign: "center",
          color: accentColor,
          font: "700 9px/1 ui-monospace, SFMono-Regular, Menlo, monospace",
          letterSpacing: ".16em",
          marginBottom: 10,
        }}
      >
        SETUP / LISTENING DRILL
      </div>

      <h1
        style={{
          margin: "0 0 10px",
          textAlign: "center",
          color: "var(--ios-label)",
          fontSize: 34,
          fontWeight: 450,
          lineHeight: 1,
          letterSpacing: "-.055em",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          margin: "0 auto 26px",
          maxWidth: "34ch",
          textAlign: "center",
          color: "var(--ios-label3)",
          fontSize: 13.5,
          lineHeight: 1.55,
        }}
      >
        {description}
      </p>

      {howToPlay && (
        <div
          style={{
            padding: "16px 18px",
            textAlign: "left",
            marginBottom: 22,
            borderRadius: 18,
            border: "1px solid var(--pt-stroke)",
            background: "var(--pt-surface-1)",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: accentColor,
              font: "700 9px/1 ui-monospace, SFMono-Regular, Menlo, monospace",
              letterSpacing: ".14em",
              marginBottom: 12,
            }}
          >
            HOW TO PLAY
          </div>
          <ol
            style={{
              fontSize: 13,
              color: "var(--ios-label2)",
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {howToPlay.map((step, i) => (
              <li key={i} style={{ display: "flex", gap: 10 }}>
                <span
                  style={{
                    flexShrink: 0,
                    color: "var(--ios-label4)",
                    font: "600 9px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  0{i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {children}

      <button
        className="ios-btn-primary"
        style={{
          background: accentColor,
          borderRadius: 999,
          marginTop: howToPlay || children ? 0 : 8,
          letterSpacing: "-.01em",
        }}
        onClick={onStart}
      >
        {isPractice ? "Start practicing" : "Start session"}
      </button>
    </div>
  );
}
