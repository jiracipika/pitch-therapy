"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  buildModeBreakdown,
  buildProgressInsights,
  evaluateAchievements,
  getNextGoals,
  type AchievementStatus,
  type ModeBreakdownEntry,
  type ModeTrendLabel,
} from "@pitch-therapy/core";
import { useStatsContext } from "@/components/StatsProvider";
import Link from "next/link";
import { AnimatedStatCard, PageHero, Reveal, StatusCard } from "@/components/PremiumMotion";

const MODES = [
  { id: "pitch-match", label: "Pitch Match", icon: "🎤", color: "#0A84FF" },
  { id: "note-id", label: "Note ID", icon: "🎵", color: "#BF5AF2" },
  { id: "frequency-guess", label: "Freq Guess", icon: "📡", color: "#FF9F0A" },
  { id: "note-wordle", label: "Note Wordle", icon: "🟩", color: "#30D158" },
  { id: "frequency-wordle", label: "Freq Wordle", icon: "🔊", color: "#5AC8FA" },
  { id: "pitch-memory", label: "Pitch Memory", icon: "🧠", color: "#FF375F" },
  { id: "name-that-note", label: "Name That Note", icon: "🎼", color: "#32ADE6" },
  { id: "frequency-hunt", label: "Freq Hunt", icon: "🔍", color: "#FF9F0A" },
  { id: "drone-lock", label: "Drone Lock", icon: "🔒", color: "#63E6E2" },
  { id: "speed-round", label: "Speed Round", icon: "⚡", color: "#FF9F0A" },
  { id: "chord-detective", label: "Chord Detective", icon: "🕵️", color: "#FF375F" },
  { id: "waveform-match", label: "Waveform Match", icon: "〰️", color: "#5E5CE6" },
  { id: "tuning-battle", label: "Tuning Battle", icon: "⚔️", color: "#FF453A" },
  { id: "tune-in", label: "Tune In", icon: "📻", color: "#FF375F" },
  { id: "piano-tap", label: "Piano Tap", icon: "🎹", color: "#5E5CE6" },
  { id: "frequency-slider", label: "Freq Slider", icon: "🎚️", color: "#5AC8FA" },
  { id: "cents-deviation", label: "Cents Deviation", icon: "📐", color: "#30D158" },
  { id: "interval-archer", label: "Interval Archer", icon: "🏹", color: "#BF5AF2" },
];

const WEEKS = 12;
const DAYS = 7;
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// Per-mode trend display, driven by shared-core analytics (buildModeBreakdown).
// Same source of truth as the mobile Progress screen.
const TREND_DISPLAY: Record<ModeTrendLabel, { arrow: string; color: string; label: string }> = {
  improving: { arrow: "↗", color: "var(--ios-green)", label: "Improving" },
  steady: { arrow: "→", color: "var(--ios-label3)", label: "Steady" },
  slipping: { arrow: "↘", color: "var(--ios-red)", label: "Slipping" },
};

/** Format the progress metric for a locked tier as "current / target". */
function formatMetricProgress(s: AchievementStatus): string {
  const { tier, progress } = s;
  switch (tier.category) {
    case "volume":
      return `${Math.round(progress)} / ${tier.threshold} sessions`;
    case "consistency":
      return `${Math.round(progress)} / ${tier.threshold} day streak`;
    case "accuracy":
      return `${Math.round(progress * 100)}% / ${Math.round(tier.threshold * 100)}%`;
    case "versatility":
      return `${Math.round(progress)} / ${tier.threshold} modes`;
    case "speed": {
      // Speed is inverted: lower is better. Show current / target seconds.
      const targetSec = (tier.threshold / 1000).toFixed(0);
      const currentSec =
        Number.isFinite(progress) && progress > 0 ? (progress / 1000).toFixed(1) : "—";
      return `${currentSec}s avg / under ${targetSec}s`;
    }
    default:
      return "";
  }
}

export default function ProgressPage() {
  const { stats, loaded, getModeStats } = useStatsContext();
  const insights = useMemo(() => buildProgressInsights(stats.results), [stats.results]);
  const achievements = useMemo(() => evaluateAchievements(stats.results), [stats.results]);
  const nextGoals = useMemo(() => getNextGoals(stats.results), [stats.results]);

  // Per-mode trend (improving / steady / slipping) from shared core analytics.
  // Mirrors the mobile Progress screen so both surfaces agree.
  const modeBreakdown = useMemo(() => buildModeBreakdown(stats.results), [stats.results]);
  const breakdownByMode = useMemo(() => {
    const map = new Map<string, ModeBreakdownEntry>();
    for (const entry of modeBreakdown) map.set(entry.mode, entry);
    return map;
  }, [modeBreakdown]);

  // Build activity map: date -> count
  const activityMap: Record<string, number> = {};
  stats.results.forEach((r) => {
    const day = r.date.slice(0, 10);
    activityMap[day] = (activityMap[day] || 0) + 1;
  });
  const maxActivity = Math.max(1, ...Object.values(activityMap));

  // Build grid data (last 12 weeks)
  const today = new Date();
  const gridDays: { date: string; count: number; future: boolean }[] = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    for (let d = 0; d < DAYS; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (w * 7 + ((today.getDay() + 6) % 7) - d));
      const dateStr = date.toISOString().slice(0, 10);
      gridDays.push({
        date: dateStr,
        count: activityMap[dateStr] || 0,
        future: date > today,
      });
    }
  }

  // Find the most played mode
  const modePlayCounts = MODES.map((m) => {
    const ms = getModeStats(m.id);
    return { ...m, ...ms };
  }).sort((a, b) => b.gamesPlayed - a.gamesPlayed);

  const topMode = modePlayCounts[0];
  const totalGames = stats.results.length;
  const avgAccuracy =
    totalGames > 0
      ? Math.round((stats.results.reduce((s, r) => s + r.accuracy, 0) / totalGames) * 100)
      : 0;
  const totalTimeMin = Math.round(stats.results.reduce((s, r) => s + r.timeMs, 0) / 60000);
  const consistencyTier =
    stats.streak >= 14
      ? "Elite consistency"
      : stats.streak >= 7
        ? "Strong consistency"
        : stats.streak >= 3
          ? "Building momentum"
          : "Just getting started";
  const statusTone = !loaded ? "loading" : totalGames > 0 ? "success" : "empty";
  const statusTitle = !loaded
    ? "Analyzing your training history"
    : totalGames > 0
      ? "Progress intelligence is live"
      : "No sessions yet";
  const statusBody = !loaded
    ? "Pulling your mode-level trends and recent momentum."
    : totalGames > 0
      ? insights.focusTip
      : "Complete your first session to unlock trend detection and weak-mode insights.";

  return (
    <div className="pb-tab" style={{ background: "var(--ios-bg)", minHeight: "100dvh" }}>
      <div className="pt-page-shell pt-page-progress px-4 pt-14">
        <PageHero
          variant="progress"
          eyebrow="Your journey"
          title="Progress"
          subtitle="Track consistency, precision, and growth across every mode."
        />
        <Reveal delay={0.04}>
          <StatusCard
            tone={statusTone}
            title={statusTitle}
            body={statusBody}
            action={
              loaded && totalGames === 0 ? (
                <Link
                  href="/dashboard"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 36,
                    borderRadius: 10,
                    padding: "0 14px",
                    background: "var(--ios-blue)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Start Training
                </Link>
              ) : undefined
            }
          />
        </Reveal>

        <div className="pt-progress-layout">
          <div className="pt-progress-main">
            {/* ── SUMMARY STATS ── */}
            <div className="pt-desktop-card mb-1 grid grid-cols-4 gap-2">
              <AnimatedStatCard
                label="Games"
                value={loaded ? totalGames : "—"}
                color="var(--ios-blue)"
                delay={0.04}
              />
              <AnimatedStatCard
                label="Best Streak"
                value={loaded ? stats.bestStreak : "—"}
                color="var(--ios-orange)"
                delay={0.08}
              />
              <AnimatedStatCard
                label="Avg Acc"
                value={loaded ? `${avgAccuracy}%` : "—"}
                color="var(--ios-green)"
                delay={0.12}
              />
              <AnimatedStatCard
                label="Time"
                value={loaded ? `${totalTimeMin}m` : "—"}
                color="var(--ios-purple)"
                delay={0.16}
              />
            </div>

            {/* ── ACTIVITY CALENDAR ── */}
            <div
              style={{
                fontSize: 13,
                color: "var(--ios-label3)",
                textTransform: "uppercase",
                letterSpacing: "-0.08px",
                padding: "20px 4px 8px",
              }}
            >
              Activity (Last 12 Weeks)
            </div>

            <motion.div
              className="ios-card pt-desktop-card"
              style={{ padding: "16px", overflowX: "auto" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.4 }}
            >
              {/* Day labels */}
              <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                {DAY_LABELS.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      width: 14,
                      textAlign: "center",
                      fontSize: 9,
                      fontWeight: 600,
                      color: "var(--ios-label3)",
                      letterSpacing: 0.3,
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid — columns = weeks */}
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: WEEKS }).map((_, w) => (
                  <div key={w} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {Array.from({ length: DAYS }).map((_, d) => {
                      const cell = gridDays[w * DAYS + d];
                      const intensity = cell?.future
                        ? 0
                        : cell?.count
                          ? Math.max(0.15, cell.count / maxActivity)
                          : 0;
                      return (
                        <div
                          key={d}
                          title={cell ? `${cell.date}: ${cell.count} games` : ""}
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 3,
                            background:
                              intensity === 0
                                ? "rgba(255,255,255,0.04)"
                                : `rgba(10, 132, 255, ${intensity})`,
                            transition: "background 0.3s ease",
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 4,
                  marginTop: 10,
                }}
              >
                <span style={{ fontSize: 10, color: "var(--ios-label3)" }}>Less</span>
                {[0, 0.15, 0.35, 0.6, 0.85].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      background: `rgba(10,132,255,${i || 0.04})`,
                    }}
                  />
                ))}
                <span style={{ fontSize: 10, color: "var(--ios-label3)" }}>More</span>
              </div>
            </motion.div>

            {/* ── FAVORITE MODE ── */}
            {loaded && totalGames > 0 && topMode && topMode.gamesPlayed > 0 && (
              <motion.div
                className="ios-card pt-desktop-card"
                style={{
                  padding: 20,
                  marginTop: 12,
                  background: `linear-gradient(135deg, ${topMode.color}12 0%, ${topMode.color}06 100%)`,
                  border: `0.5px solid ${topMode.color}20`,
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4 }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: "var(--ios-label3)",
                    marginBottom: 8,
                  }}
                >
                  Most Played
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 32 }}>{topMode.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 600,
                        color: "var(--ios-label)",
                        letterSpacing: "-0.4px",
                      }}
                    >
                      {topMode.label}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ios-label2)", marginTop: 2 }}>
                      {topMode.gamesPlayed} games · {Math.round(topMode.avgAccuracy * 100)}% avg
                      accuracy
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: topMode.color }}>
                      {topMode.bestScore}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ios-label3)" }}>Best</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ACHIEVEMENTS ── */}
            {loaded && totalGames > 0 && (
              <>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--ios-label3)",
                    textTransform: "uppercase",
                    letterSpacing: "-0.08px",
                    padding: "24px 4px 8px",
                  }}
                >
                  Achievements
                </div>
                <motion.div
                  className="ios-card pt-desktop-card"
                  style={{ padding: 16, marginTop: 0 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 650,
                        color: "var(--ios-label)",
                        letterSpacing: "-0.2px",
                      }}
                    >
                      {achievements.unlockedCount} of {achievements.totalCount} unlocked
                    </div>
                    {achievements.latestUnlock && (
                      <div style={{ fontSize: 11, color: "var(--ios-green)", fontWeight: 600 }}>
                        {achievements.latestUnlock.icon} {achievements.latestUnlock.label}
                      </div>
                    )}
                  </div>

                  {/* Progress bar across all tiers */}
                  <div className="ios-progress-track" style={{ marginBottom: 16 }}>
                    <div
                      className="ios-progress-fill"
                      style={{
                        width: `${(achievements.unlockedCount / achievements.totalCount) * 100}%`,
                        background: "linear-gradient(90deg, var(--ios-green), var(--ios-blue))",
                        transition: "width 0.6s ease-out",
                      }}
                    />
                  </div>

                  {/* Tier grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                      gap: 8,
                    }}
                  >
                    {achievements.statuses.map((s: AchievementStatus) => {
                      const goal = nextGoals.find(
                        (g) => g.tier.category === s.tier.category && !g.unlocked,
                      );
                      const isNext = goal?.tier.id === s.tier.id;
                      return (
                        <div
                          key={s.tier.id}
                          style={{
                            padding: 10,
                            borderRadius: 10,
                            background: s.unlocked
                              ? "linear-gradient(135deg, rgba(48,209,88,0.12), rgba(10,132,255,0.06))"
                              : "rgba(255,255,255,0.03)",
                            border: isNext
                              ? "0.5px solid var(--ios-blue)"
                              : s.unlocked
                                ? "0.5px solid rgba(48,209,88,0.2)"
                                : "0.5px solid var(--ios-sep)",
                            opacity: s.unlocked ? 1 : 0.65,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 4,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 16,
                                filter: s.unlocked ? "none" : "grayscale(0.7)",
                              }}
                            >
                              {s.tier.icon}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "var(--ios-label)",
                                letterSpacing: "-0.1px",
                              }}
                            >
                              {s.tier.label}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--ios-label3)",
                              lineHeight: 1.4,
                              marginBottom: 6,
                            }}
                          >
                            {s.tier.description}
                          </div>
                          {s.unlocked ? (
                            <div
                              style={{ fontSize: 10, color: "var(--ios-green)", fontWeight: 600 }}
                            >
                              Unlocked
                            </div>
                          ) : (
                            <>
                              <div
                                className="ios-progress-track"
                                style={{ height: 4, marginBottom: 3 }}
                              >
                                <div
                                  className="ios-progress-fill"
                                  style={{
                                    width: `${Math.round(s.progressFraction * 100)}%`,
                                    background: isNext ? "var(--ios-blue)" : "var(--ios-label3)",
                                    transition: "width 0.5s ease-out",
                                  }}
                                />
                              </div>
                              <div style={{ fontSize: 9, color: "var(--ios-label3)" }}>
                                {formatMetricProgress(s)}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </div>

          <div className="pt-progress-side">
            <motion.div
              className="ios-card pt-desktop-card"
              style={{
                padding: 14,
                marginBottom: 12,
                background: "linear-gradient(160deg, rgba(48,209,88,0.12), rgba(10,132,255,0.08))",
                border: "0.5px solid rgba(48,209,88,0.22)",
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.35 }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ios-label3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 8,
                }}
              >
                Consistency
              </div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 650,
                  color: "var(--ios-label)",
                  letterSpacing: "-0.2px",
                }}
              >
                {consistencyTier}
              </div>
              <div style={{ fontSize: 12, color: "var(--ios-label3)", marginTop: 4 }}>
                Current streak:{" "}
                <span style={{ color: "var(--ios-label2)", fontWeight: 600 }}>
                  {stats.streak} days
                </span>
              </div>
            </motion.div>

            {loaded && totalGames > 0 ? (
              <motion.div
                className="ios-card pt-desktop-card"
                style={{
                  padding: 14,
                  marginBottom: 12,
                  background:
                    "linear-gradient(160deg, rgba(191,90,242,0.12), rgba(10,132,255,0.09))",
                  border: "0.5px solid rgba(191,90,242,0.24)",
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.35 }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ios-label3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 8,
                  }}
                >
                  Focus Next
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--ios-label)",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {insights.weakModes[0]?.label ?? "Balanced training"}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ios-label3)",
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {insights.focusTip}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ios-label2)",
                      border: "1px solid var(--ios-sep)",
                      borderRadius: 999,
                      padding: "3px 8px",
                    }}
                  >
                    Sessions 7d: {insights.momentum.sessionsLast7}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ios-label2)",
                      border: "1px solid var(--ios-sep)",
                      borderRadius: 999,
                      padding: "3px 8px",
                    }}
                  >
                    Accuracy delta: {Math.round(insights.momentum.accuracyDeltaPct)}%
                  </div>
                </div>
              </motion.div>
            ) : null}

            {/* ── PER MODE ── */}
            <div
              style={{
                fontSize: 13,
                color: "var(--ios-label3)",
                textTransform: "uppercase",
                letterSpacing: "-0.08px",
                padding: "24px 4px 8px",
              }}
            >
              Per Mode
            </div>

            <motion.div
              className="ios-group pt-desktop-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {MODES.map((m, idx) => {
                const ms = getModeStats(m.id);
                const progressPct =
                  ms.gamesPlayed > 0 ? Math.min(100, Math.round(ms.avgAccuracy * 100)) : 0;

                return (
                  <div
                    key={m.id}
                    className="ios-row"
                    style={{
                      padding: "14px 16px",
                      borderTop: idx === 0 ? "none" : "0.5px solid var(--ios-sep)",
                      flexDirection: "column",
                      alignItems: "stretch",
                      gap: 0,
                    }}
                  >
                    {/* Top row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: ms.gamesPlayed > 0 ? 10 : 0,
                      }}
                    >
                      <Link
                        href={`/play/${m.id}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flex: 1,
                          textDecoration: "none",
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 9,
                            background: `${m.color}18`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            marginRight: 12,
                            flexShrink: 0,
                          }}
                        >
                          {m.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 500,
                              color: "var(--ios-label)",
                              letterSpacing: "-0.32px",
                            }}
                          >
                            {m.label}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--ios-label3)", marginTop: 1 }}>
                            {ms.gamesPlayed > 0
                              ? `${ms.gamesPlayed} game${ms.gamesPlayed !== 1 ? "s" : ""} · ${Math.round(ms.avgAccuracy * 100)}% accuracy`
                              : "Not played yet"}
                          </div>
                        </div>
                      </Link>
                      {ms.gamesPlayed > 0 && (
                        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                          {(() => {
                            const breakdown = breakdownByMode.get(m.id);
                            const trend = breakdown ? TREND_DISPLAY[breakdown.trendLabel] : null;
                            if (!trend) return null;
                            // Trend requires >=4 sessions in shared core; otherwise "steady".
                            const isSteady = breakdown?.trendLabel === "steady";
                            return (
                              <div
                                title={`Trend: ${trend.label}${breakdown && !isSteady ? ` (${breakdown.trendDelta >= 0 ? "+" : ""}${Math.round(breakdown.trendDelta * 100)}%)` : ""}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  color: trend.color,
                                  background: "var(--ios-bg3)",
                                  border: "0.5px solid var(--ios-sep)",
                                  borderRadius: 999,
                                  padding: "1px 7px",
                                  marginBottom: 2,
                                }}
                              >
                                <span style={{ fontSize: 12, lineHeight: 1 }}>{trend.arrow}</span>
                                {trend.label}
                              </div>
                            );
                          })()}
                          <div
                            style={{ fontSize: 15, fontWeight: 600, color: "var(--ios-label2)" }}
                          >
                            {ms.bestScore}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--ios-label3)" }}>Best</div>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    {ms.gamesPlayed > 0 && (
                      <div className="ios-progress-track">
                        <div
                          className="ios-progress-fill"
                          style={{
                            width: `${progressPct}%`,
                            background: m.color,
                            transition: "width 0.6s ease-out",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>

            {/* ── RECENT RESULTS ── */}
            {loaded && stats.results.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--ios-label3)",
                    textTransform: "uppercase",
                    letterSpacing: "-0.08px",
                    padding: "24px 4px 8px",
                  }}
                >
                  Recent Games
                </div>
                <div className="ios-group pt-desktop-card">
                  {stats.results
                    .slice(-10)
                    .reverse()
                    .map((r, idx) => {
                      const mode = MODES.find((m) => m.id === r.mode);
                      return (
                        <div
                          key={idx}
                          className="ios-row"
                          style={{
                            padding: "12px 16px",
                            borderTop: idx === 0 ? "none" : "0.5px solid var(--ios-sep)",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: `${mode?.color || "#888"}18`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 16,
                              marginRight: 10,
                              flexShrink: 0,
                            }}
                          >
                            {mode?.icon || "🎵"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{ fontSize: 14, fontWeight: 500, color: "var(--ios-label)" }}
                            >
                              {mode?.label || r.mode}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--ios-label3)", marginTop: 1 }}>
                              {new Date(r.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                              {" · "}
                              {r.rounds} rounds
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{ fontSize: 15, fontWeight: 600, color: "var(--ios-label)" }}
                            >
                              {r.score}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color:
                                  Math.round(r.accuracy * 100) >= 70
                                    ? "var(--ios-green)"
                                    : "var(--ios-orange)",
                              }}
                            >
                              {Math.round(r.accuracy * 100)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
