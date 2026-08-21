"use client";

/**
 * A single stat card in the results grid.
 */
export interface ResultStat {
  /** Large value displayed in the card (string or number). */
  value: string | number;
  /** Small label below the value. */
  label: string;
  /** Whether to colour the value with accentColor (default: false). */
  accent?: boolean;
}

/**
 * Standard results / game-complete screen.
 *
 * Shows the mode icon in an accent frame, a studio-style headline, a
 * responsive stat-card grid (2 or 3 columns), then a "Play Again" pill
 * and a "Dashboard" secondary button.
 *
 * Visual language: "Resonance Studio" — mono micro-labels, stroke-bordered
 * stat tiles, accent pill CTA (same system as the landing page).
 */
export default function GameResults({
  icon = "🏆",
  heading = "Session complete",
  score,
  stats,
  onPlayAgain,
  onBack,
  accentColor,
}: {
  /** Trophy emoji (default 🏆). */
  icon?: string;
  /** Headline text (default "Session complete"). */
  heading?: string;
  /** Final score — shown in an accent-coloured card as the first stat. */
  score: number;
  /** Additional mode-specific stat cards (correct count, streak, accuracy, …). */
  stats: ResultStat[];
  /** Called when "Play Again" is tapped. */
  onPlayAgain: () => void;
  /** Called when "Dashboard" is tapped. */
  onBack: () => void;
  /** Accent colour for the score card value and Play Again button. */
  accentColor: string;
}) {
  const allStats: ResultStat[] = [
    { value: score, label: "Score", accent: true },
    ...stats,
  ];
  const colCount = allStats.length === 2 ? 2 : allStats.length === 4 ? 2 : 3;

  return (
    <div style={{ textAlign: "center", paddingTop: 40, paddingBottom: 40 }}>
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
          color: "var(--ios-label3)",
          font: "700 9px/1 ui-monospace, SFMono-Regular, Menlo, monospace",
          letterSpacing: ".16em",
          marginBottom: 10,
        }}
      >
        SESSION REPORT
      </div>
      <h1
        style={{
          margin: "0 0 26px",
          color: "var(--ios-label)",
          fontSize: 34,
          fontWeight: 450,
          lineHeight: 1,
          letterSpacing: "-.055em",
        }}
      >
        {heading}
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gap: 10,
          marginBottom: 26,
          textAlign: "center",
        }}
      >
        {allStats.map((stat, i) => (
          <div
            key={i}
            style={{
              padding: "15px 10px",
              borderRadius: 18,
              border: "1px solid var(--pt-stroke)",
              background: stat.accent
                ? `color-mix(in srgb, ${accentColor} 8%, var(--pt-surface-1))`
                : "var(--pt-surface-1)",
            }}
          >
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: "-.04em",
                color: stat.accent ? accentColor : "var(--ios-label)",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                marginTop: 6,
                color: "var(--ios-label3)",
                font: "700 8px/1 ui-monospace, SFMono-Regular, Menlo, monospace",
                letterSpacing: ".12em",
              }}
            >
              {stat.label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          className="ios-btn-primary"
          style={{ background: accentColor, borderRadius: 999, letterSpacing: "-.01em" }}
          onClick={onPlayAgain}
        >
          Play again
        </button>
        <button className="ios-btn-secondary" style={{ borderRadius: 999 }} onClick={onBack}>
          Back to exercises
        </button>
      </div>
    </div>
  );
}
