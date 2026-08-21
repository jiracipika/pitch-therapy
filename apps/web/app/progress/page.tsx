"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  buildModeBreakdown,
  buildProgressInsights,
  evaluateAchievements,
  GAME_MODE_META,
  GAME_MODES,
  getLatestBadges,
  getNextGoals,
  type AchievementStatus,
  type ModeBreakdownEntry,
  type ModeTrendLabel,
} from "@pitch-therapy/core";
import { useStatsContext } from "@/components/StatsProvider";
import Link from "next/link";
import {
  buildCategoryMastery,
  calculateTotalXP,
  getLevelProgress,
  levelTitle,
  MASTERY_CONFIG,
} from "@/lib/gamification";

const MODES = GAME_MODES.map((id) => {
  const mode = GAME_MODE_META[id];
  return { id: mode.id, label: mode.label, icon: mode.icon, color: mode.accentHex };
});

const WEEKS = 12;
const DAYS = 7;
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

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
    case "mastery":
      return `${Math.round(progress)} / ${tier.threshold} mastered`;
    case "speed": {
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
  const reduce = useReducedMotion();
  const insights = useMemo(() => buildProgressInsights(stats.results), [stats.results]);
  const achievements = useMemo(() => evaluateAchievements(stats.results), [stats.results]);
  const nextGoals = useMemo(() => getNextGoals(stats.results), [stats.results]);
  const latestBadges = useMemo(() => getLatestBadges(stats.results), [stats.results]);
  const modeBreakdown = useMemo(() => buildModeBreakdown(stats.results), [stats.results]);

  const totalXP = useMemo(() => calculateTotalXP(stats.results), [stats.results]);
  const levelInfo = useMemo(() => getLevelProgress(totalXP), [totalXP]);
  const categoryMastery = useMemo(
    () => buildCategoryMastery(stats.results, getModeStats),
    [stats.results, getModeStats],
  );
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
      gridDays.push({ date: dateStr, count: activityMap[dateStr] || 0, future: date > today });
    }
  }

  const modePlayCounts = MODES.map((m) => ({ ...m, ...getModeStats(m.id) })).sort(
    (a, b) => b.gamesPlayed - a.gamesPlayed,
  );
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

  const fade = (delay: number) => (reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.42 } });
  const hasData = loaded && totalGames > 0;

  return (
    <div className="studio-page">
      <div className="pt-page-shell studio-dashboard">
        <motion.header className="studio-inner-header" {...fade(0)}>
          <div>
            <span className="studio-overline">INSIGHTS / LISTENING STUDIO</span>
            <h1>Your growth,<br /><em>measured.</em></h1>
            <p>Consistency, precision, and momentum across every exercise — all in one view.</p>
          </div>
          <div className="studio-header-chip">
            <span>LEVEL</span>
            <b>{loaded ? levelInfo.level : "—"}</b>
            <small>{loaded ? levelTitle(levelInfo.level) : "LOADING"}</small>
          </div>
        </motion.header>

        <section className="studio-inner-grid">
          <div className="studio-inner-main">
            {/* ── SUMMARY STATS ── */}
            <div className="studio-stat-strip">
              <motion.article {...fade(0.05)}><span>SESSIONS</span><b>{loaded ? totalGames : "—"}</b><i>Short, focused repetitions.</i></motion.article>
              <motion.article {...fade(0.08)}><span>BEST STREAK</span><b>{loaded ? stats.bestStreak : "—"}<small> days</small></b><i>Your personal record.</i></motion.article>
              <motion.article {...fade(0.11)}><span>AVG ACCURACY</span><b>{loaded ? avgAccuracy : "—"}<small>%</small></b><i>Across every exercise.</i></motion.article>
              <motion.article {...fade(0.14)}><span>TIME LISTENING</span><b>{loaded ? totalTimeMin : "—"}<small> min</small></b><i>{totalXP} XP earned.</i></motion.article>
            </div>

            {/* ── EMPTY STATE ── */}
            {!hasData && (
              <motion.section className="studio-panel" {...fade(0.1)}>
                <div className="studio-panel-heading"><div><span>GETTING STARTED</span><h2>Insights unlock with play</h2></div></div>
                <p style={{ margin: '-6px 0 18px', color: 'var(--ios-label2)', fontSize: 12, lineHeight: 1.55 }}>
                  Complete your first session to unlock trend detection, activity history, and weak-mode insights.
                </p>
                <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 28, width: '100%', minHeight: 48, padding: '0 20px', borderRadius: 999, background: 'var(--ios-blue)', color: 'var(--pt-on-accent)', fontSize: 13, fontWeight: 750, textDecoration: 'none', boxShadow: '0 12px 30px rgba(199,255,74,.15)' }}>
                  Start your first session <span aria-hidden="true">→</span>
                </Link>
              </motion.section>
            )}

            {/* ── MASTERY OVERVIEW ── */}
            {hasData && (
              <motion.section className="studio-panel" {...fade(0.12)}>
                <div className="studio-panel-heading">
                  <div><span>COURSES</span><h2>Mastery by course</h2></div>
                  <Link href="/play-modes">All exercises ↗</Link>
                </div>
                <div className="studio-row-list" style={{ gap: 4 }}>
                  {categoryMastery.map((cat) => {
                    const mc = MASTERY_CONFIG[cat.level];
                    return (
                      <div key={cat.categoryId} style={{ display: 'grid', gridTemplateColumns: '42px 1fr auto', alignItems: 'center', gap: 12, padding: '10px 2px', minHeight: 58 }}>
                        <span className="studio-plan-icon" style={{ background: `color-mix(in srgb, ${cat.accentHex} 14%, transparent)` }}>{cat.icon}</span>
                        <span style={{ minWidth: 0 }}>
                          <b style={{ display: 'block', fontSize: 13 }}>{cat.label}</b>
                          <i className="studio-meter"><em style={{ display: 'block', height: '100%', width: `${cat.masteryPct}%`, background: cat.accentHex }} /></i>
                        </span>
                        <strong style={{ color: cat.masteryPct > 0 ? mc.color : 'var(--ios-label3)', font: '700 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace' }}>{cat.masteryPct}%</strong>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* ── ACTIVITY HEATMAP ── */}
            {hasData && (
              <motion.section className="studio-panel" {...fade(0.16)}>
                <div className="studio-panel-heading">
                  <div><span>ACTIVITY</span><h2>Last 12 weeks</h2></div>
                  <span className="studio-time-chip">{totalGames} SESSIONS</span>
                </div>
                <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                    {DAY_LABELS.map((d, i) => (
                      <div key={i} style={{ width: 13, textAlign: 'center', fontSize: 8, fontWeight: 700, color: 'var(--ios-label4)', letterSpacing: '.04em' }}>{d}</div>
                    ))}
                  </div>
                  <div className="studio-heatmap">
                    {Array.from({ length: WEEKS }).map((_, w) => (
                      <div key={w}>
                        {Array.from({ length: DAYS }).map((_, d) => {
                          const cell = gridDays[w * DAYS + d];
                          const heat = cell?.future
                            ? 'is-future'
                            : cell?.count
                              ? cell.count / maxActivity > 0.75 ? 'is-hot-4' : cell.count / maxActivity > 0.5 ? 'is-hot-3' : cell.count / maxActivity > 0.25 ? 'is-hot-2' : 'is-hot-1'
                              : '';
                          return (
                            <i key={d} className={heat} title={cell ? `${cell.date}: ${cell.count} session${cell.count !== 1 ? 's' : ''}` : ''} />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, marginTop: 10, color: 'var(--ios-label4)', font: '700 8px/1 ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: '.08em' }}>
                    <span>LESS</span>
                    <i className="studio-heatmap" style={{ display: 'flex', gap: 3 }} aria-hidden="true">
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,.045)', display: 'block' }} />
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(199,255,74,.22)', display: 'block' }} />
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(199,255,74,.45)', display: 'block' }} />
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(199,255,74,.7)', display: 'block' }} />
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: '#c7ff4a', display: 'block' }} />
                    </i>
                    <span>MORE</span>
                  </div>
                </div>
              </motion.section>
            )}

            {/* ── ACHIEVEMENTS ── */}
            {hasData && (
              <motion.section className="studio-panel" {...fade(0.2)}>
                <div className="studio-panel-heading">
                  <div><span>BADGES</span><h2>Achievements</h2></div>
                  <span className="studio-time-chip">{achievements.unlockedCount}/{achievements.totalCount}</span>
                </div>
                <i className="studio-meter" aria-hidden="true" style={{ margin: '0 0 14px' }}>
                  <em style={{ display: 'block', height: '100%', width: `${(achievements.unlockedCount / achievements.totalCount) * 100}%`, background: 'linear-gradient(90deg, var(--ios-green), var(--ios-blue))' }} />
                </i>
                {latestBadges.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {latestBadges.map((b) => (
                      <span key={b.tier.id} title={`${b.tier.label} — your current best in ${b.tier.category}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 999, border: '1px solid color-mix(in srgb, var(--ios-green) 30%, var(--pt-stroke))', background: 'color-mix(in srgb, var(--ios-green) 8%, transparent)', fontSize: 11, fontWeight: 650, color: 'var(--ios-label)' }}>
                        <span style={{ fontSize: 12 }}>{b.tier.icon}</span> {b.tier.label}
                      </span>
                    ))}
                  </div>
                )}
                <div className="studio-badge-grid">
                  {achievements.statuses.map((s) => {
                    const goal = nextGoals.find((g) => g.tier.category === s.tier.category && !g.unlocked);
                    const isNext = goal?.tier.id === s.tier.id;
                    const cls = s.unlocked ? 'is-unlocked' : isNext ? 'is-next' : 'is-locked';
                    return (
                      <div key={s.tier.id} className={`studio-badge ${cls}`}>
                        <div className="studio-badge-top">
                          <span>{s.tier.icon}</span>
                          <b>{s.tier.label}</b>
                        </div>
                        <p>{s.tier.description}</p>
                        {s.unlocked ? (
                          <span className="studio-badge-status">✓ UNLOCKED</span>
                        ) : (
                          <>
                            <i className="studio-meter" aria-hidden="true" style={{ height: 4, margin: '0 0 5px' }}>
                              <em style={{ display: 'block', height: '100%', width: `${Math.round(s.progressFraction * 100)}%`, background: isNext ? 'var(--ios-blue)' : 'rgba(255,255,255,.22)' }} />
                            </i>
                            <span className="studio-badge-metric">{formatMetricProgress(s)}</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}
          </div>

          <aside className="studio-inner-side">
            {/* ── CONSISTENCY ── */}
            <motion.section className="studio-panel" {...fade(0.12)}>
              <div className="studio-panel-heading"><div><span>CONSISTENCY</span><h2>Streak status</h2></div></div>
              <div style={{ color: 'var(--ios-label)', fontSize: 21, fontWeight: 600, letterSpacing: '-.035em' }}>{consistencyTier}</div>
              <p style={{ margin: '6px 0 0', color: 'var(--ios-label3)', fontSize: 11 }}>
                Current streak: <b style={{ color: 'var(--ios-label2)' }}>{loaded ? stats.streak : 0} days</b> · Best: {loaded ? stats.bestStreak : 0}
              </p>
            </motion.section>

            {/* ── FOCUS NEXT ── */}
            {hasData && (
              <motion.section className="studio-panel" {...fade(0.15)}>
                <div className="studio-panel-heading"><div><span>FOCUS NEXT</span><h2>Sharpen here</h2></div></div>
                <div style={{ color: 'var(--ios-label)', fontSize: 18, fontWeight: 600, letterSpacing: '-.03em' }}>
                  {insights.weakModes[0]?.label ?? "Balanced training"}
                </div>
                <p style={{ margin: '6px 0 12px', color: 'var(--ios-label3)', fontSize: 11, lineHeight: 1.55 }}>{insights.focusTip}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ padding: '5px 10px', border: '1px solid var(--pt-stroke)', borderRadius: 999, color: 'var(--ios-label2)', font: '600 9px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace' }}>SESSIONS 7D: {insights.momentum.sessionsLast7}</span>
                  <span style={{ padding: '5px 10px', border: '1px solid var(--pt-stroke)', borderRadius: 999, color: 'var(--ios-label2)', font: '600 9px/1.3 ui-monospace, SFMono-Regular, Menlo, monospace' }}>Δ ACCURACY: {Math.round(insights.momentum.accuracyDeltaPct)}%</span>
                </div>
              </motion.section>
            )}

            {/* ── MOST PLAYED ── */}
            {hasData && topMode && topMode.gamesPlayed > 0 && (
              <motion.section className="studio-panel" {...fade(0.18)}>
                <div className="studio-panel-heading"><div><span>FAVORITE</span><h2>Most played</h2></div></div>
                <div style={{ display: 'grid', gridTemplateColumns: '46px 1fr auto', alignItems: 'center', gap: 12 }}>
                  <span className="studio-plan-icon" style={{ width: 46, height: 46, background: `color-mix(in srgb, ${topMode.color} 14%, transparent)` }}>{topMode.icon}</span>
                  <div>
                    <b style={{ display: 'block', fontSize: 14 }}>{topMode.label}</b>
                    <small style={{ display: 'block', marginTop: 3, color: 'var(--ios-label3)', fontSize: 10 }}>{topMode.gamesPlayed} games · {Math.round(topMode.avgAccuracy * 100)}% avg</small>
                  </div>
                  <strong style={{ color: topMode.color, fontSize: 22, letterSpacing: '-.03em' }}>{topMode.bestScore}</strong>
                </div>
              </motion.section>
            )}

            {/* ── PER MODE ── */}
            {hasData && (
              <motion.section className="studio-panel" {...fade(0.22)}>
                <div className="studio-panel-heading">
                  <div><span>ALL 18</span><h2>Per mode</h2></div>
                  <Link href="/play-modes">Browse ↗</Link>
                </div>
                <div className="studio-row-list">
                  {MODES.map((m) => {
                    const ms = getModeStats(m.id);
                    const breakdown = breakdownByMode.get(m.id);
                    const trend = breakdown ? TREND_DISPLAY[breakdown.trendLabel] : null;
                    return (
                      <Link key={m.id} href={`/play/${m.id}`} style={{ display: 'grid', gridTemplateColumns: '38px 1fr auto', alignItems: 'center', gap: 10, minHeight: 58, padding: '8px 2px', color: 'var(--ios-label)', textDecoration: 'none' }}>
                        <span className="studio-mastery-icon" style={{ background: `color-mix(in srgb, ${m.color} 14%, transparent)` }}>{m.icon}</span>
                        <span style={{ minWidth: 0 }}>
                          <b style={{ display: 'block', fontSize: 13 }}>{m.label}</b>
                          {ms.gamesPlayed > 0 ? (
                            <>
                              <small style={{ display: 'block', marginTop: 2, color: 'var(--ios-label3)', fontSize: 10 }}>{ms.gamesPlayed} game{ms.gamesPlayed !== 1 ? 's' : ''} · {Math.round(ms.avgAccuracy * 100)}% accuracy</small>
                              <i className="studio-meter" aria-hidden="true"><em style={{ display: 'block', height: '100%', width: `${Math.min(100, Math.round(ms.avgAccuracy * 100))}%`, background: m.color }} /></i>
                            </>
                          ) : (
                            <small style={{ display: 'block', marginTop: 2, color: 'var(--ios-label4)', fontSize: 10 }}>Not played yet</small>
                          )}
                        </span>
                        {ms.gamesPlayed > 0 && trend && (
                          <strong title={`Trend: ${trend.label}`} style={{ color: trend.color, font: '700 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace' }}>{trend.arrow}</strong>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* ── RECENT RESULTS ── */}
            {loaded && stats.results.length > 0 && (
              <motion.section className="studio-panel" {...fade(0.26)}>
                <div className="studio-panel-heading">
                  <div><span>LATEST</span><h2>Recent sessions</h2></div>
                  <span className="studio-time-chip">LAST 10</span>
                </div>
                <div className="studio-row-list">
                  {stats.results.slice(-10).reverse().map((r, idx) => {
                    const mode = MODES.find((m) => m.id === r.mode);
                    return (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto', alignItems: 'center', gap: 10, minHeight: 52, padding: '8px 2px' }}>
                        <span className="studio-mastery-icon" style={{ width: 34, height: 34, fontSize: 15, background: `color-mix(in srgb, ${mode?.color || '#888'} 14%, transparent)` }}>{mode?.icon || '🎵'}</span>
                        <span style={{ minWidth: 0 }}>
                          <b style={{ display: 'block', fontSize: 12.5 }}>{mode?.label || r.mode}</b>
                          <small style={{ display: 'block', marginTop: 2, color: 'var(--ios-label3)', fontSize: 9.5 }}>
                            {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · {r.rounds} rounds
                          </small>
                        </span>
                        <span style={{ textAlign: 'right' }}>
                          <b style={{ display: 'block', fontSize: 14, color: 'var(--ios-label)' }}>{r.score}</b>
                          <small style={{ display: 'block', color: Math.round(r.accuracy * 100) >= 70 ? 'var(--ios-green)' : 'var(--ios-orange)', font: '700 9px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace' }}>{Math.round(r.accuracy * 100)}%</small>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
}
