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
 * Shows a centred trophy, heading, a responsive stat-card grid (2 or 3
 * columns), then a "Play Again" button and a "Dashboard" button.
 *
 * Extracted from the done-phase blocks across all game mode pages.
 */
export default function GameResults({
  icon = "🏆",
  heading = "Game Complete",
  score,
  stats,
  onPlayAgain,
  onBack,
  accentColor,
}: {
  /** Trophy emoji (default 🏆). */
  icon?: string;
  /** Headline text (default "Game Complete"). */
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
    <div className="pb-tab" style={{ background: "var(--ios-bg)", minHeight: "100dvh" }}>
      <div className="mx-auto max-w-sm px-4 pt-12 md:max-w-lg">
        <div style={{ textAlign: "center", paddingTop: 40, paddingBottom: 40 }}>
          <div style={{ fontSize: 60, marginBottom: 12 }}>{icon}</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--ios-label)",
              letterSpacing: "-0.5px",
              marginBottom: 24,
            }}
          >
            {heading}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${colCount}, 1fr)`,
              gap: 10,
              marginBottom: 24,
            }}
          >
            {allStats.map((stat, i) => (
              <div
                key={i}
                className="ios-card"
                style={{ padding: "14px 12px", textAlign: "center" }}
              >
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "-0.5px",
                    color: stat.accent ? accentColor : "var(--ios-label)",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: 11, color: "var(--ios-label3)", marginTop: 4 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              className="ios-btn-primary"
              style={{ background: accentColor }}
              onClick={onPlayAgain}
            >
              Play Again
            </button>
            <button className="ios-btn-secondary" onClick={onBack}>
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
