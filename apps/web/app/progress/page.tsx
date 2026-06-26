'use client';

import { motion } from 'framer-motion';
import { useStatsContext } from '@/components/StatsProvider';
import Link from 'next/link';
import { AnimatedStatCard, PageHero, Reveal, StatusCard } from '@/components/PremiumMotion';
import { GAME_MODE_META, GAME_MODES } from '@pitch-therapy/core';

const MODES = GAME_MODES.map((id) => {
  const mode = GAME_MODE_META[id];
  return { id: mode.id, label: mode.label, icon: mode.icon, color: mode.accentHex };
});

const WEEKS = 12;
const DAYS = 7;
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function activityColor(count: number, max: number): string {
  if (count === 0) return 'rgba(255,255,255,0.04)';
  const t = count / max;
  if (t < 0.25) return 'rgba(10,132,255,0.18)';
  if (t < 0.5) return 'rgba(10,132,255,0.35)';
  if (t < 0.75) return 'rgba(10,132,255,0.55)';
  return 'rgba(10,132,255,0.8)';
}

export default function ProgressPage() {
  const { stats, loaded, getModeStats } = useStatsContext();

  const activityMap: Record<string, number> = {};
  stats.results.forEach((r) => {
    const day = r.date.slice(0, 10);
    activityMap[day] = (activityMap[day] || 0) + 1;
  });
  const maxActivity = Math.max(1, ...Object.values(activityMap));

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

  const modePlayCounts = MODES.map((m) => ({ ...m, ...getModeStats(m.id) })).sort((a, b) => b.gamesPlayed - a.gamesPlayed);
  const topMode = modePlayCounts[0];
  const totalGames = stats.results.length;
  const avgAccuracy = totalGames > 0 ? Math.round((stats.results.reduce((s, r) => s + r.accuracy, 0) / totalGames) * 100) : 0;
  const totalTimeMin = Math.round(stats.results.reduce((s, r) => s + r.timeMs, 0) / 60000);

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="pt-page-shell pt-page-progress px-4 pt-14">

        <PageHero
          variant="progress"
          eyebrow="Your journey"
          title="Progress"
          subtitle="Track consistency, precision, and growth across every mode."
        />

        <div className="pt-progress-layout">
          <div className="pt-progress-main">

            {/* ── SUMMARY STATS ── */}
            <div className="pt-mobile-stats mb-3 pt-desktop-card">
              <AnimatedStatCard label="Games" value={loaded ? totalGames : '—'} color="var(--ios-blue)" delay={0.04} />
              <AnimatedStatCard label="Best Streak" value={loaded ? stats.bestStreak : '—'} color="var(--ios-orange)" delay={0.08} />
              <AnimatedStatCard label="Avg Acc" value={loaded ? `${avgAccuracy}%` : '—'} color="var(--ios-green)" delay={0.12} />
              <AnimatedStatCard label="Time" value={loaded ? `${totalTimeMin}m` : '—'} color="var(--ios-purple)" delay={0.16} />
            </div>

            {/* ── ACTIVITY CALENDAR ── */}
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label3)', textTransform: 'uppercase', letterSpacing: '-0.08px', padding: '16px 4px 8px' }}>
              Activity (Last 12 Weeks)
            </div>

            <motion.div
              className="ios-card pt-desktop-card"
              style={{
                padding: '16px',
                overflowX: 'auto',
                background: 'linear-gradient(135deg, rgba(10,132,255,0.04) 0%, transparent 100%)',
                border: '1px solid rgba(10,132,255,0.08)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.4 }}
            >
              <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                {DAY_LABELS.map((d, i) => (
                  <div key={i} style={{ width: 14, textAlign: 'center', fontSize: 9, fontWeight: 600, color: 'var(--ios-label3)', letterSpacing: 0.3 }}>
                    {d}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 3 }}>
                {Array.from({ length: WEEKS }).map((_, w) => (
                  <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {Array.from({ length: DAYS }).map((_, d) => {
                      const cell = gridDays[w * DAYS + d];
                      const bg = cell?.future ? 'transparent' : activityColor(cell?.count || 0, maxActivity);
                      return (
                        <motion.div
                          key={d}
                          title={cell ? `${cell.date}: ${cell.count} games` : ''}
                          className="pt-calendar-cell"
                          style={{ background: bg }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 + (w * DAYS + d) * 0.002, duration: 0.2 }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 10 }}>
                <span style={{ fontSize: 10, color: 'var(--ios-label3)' }}>Less</span>
                {[0, 0.18, 0.35, 0.55, 0.8].map((i) => (
                  <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: `rgba(10,132,255,${i || 0.04})` }} />
                ))}
                <span style={{ fontSize: 10, color: 'var(--ios-label3)' }}>More</span>
              </div>
            </motion.div>

            {/* ── FAVORITE MODE ── */}
            {loaded && totalGames > 0 && topMode && topMode.gamesPlayed > 0 && (
              <motion.div
                className="ios-card pt-desktop-card"
                style={{
                  padding: 20,
                  marginTop: 12,
                  background: `linear-gradient(135deg, ${topMode.color}0F 0%, ${topMode.color}06 100%)`,
                  border: `1px solid ${topMode.color}18`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4 }}
              >
                <div style={{
                  position: 'absolute', top: -8, right: -8, fontSize: 48, opacity: 0.06, pointerEvents: 'none',
                }}>
                  {topMode.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ios-label3)', marginBottom: 10 }}>
                  Most Played
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `linear-gradient(135deg, ${topMode.color}22, ${topMode.color}0A)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                  }}>
                    {topMode.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.4px' }}>
                      {topMode.label}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ios-label2)', marginTop: 2 }}>
                      {topMode.gamesPlayed} games · {Math.round(topMode.avgAccuracy * 100)}% avg accuracy
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: topMode.color }}>{topMode.bestScore}</div>
                    <div style={{ fontSize: 11, color: 'var(--ios-label3)' }}>Best</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── EMPTY STATE ── */}
            {loaded && totalGames === 0 && (
              <Reveal delay={0.22}>
                <StatusCard
                  tone="empty"
                  title="No progress data yet"
                  body="Complete your first training session and your charts, trends, and mode breakdowns will appear here."
                  action={(
                    <Link
                      href="/dashboard"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        height: 36, borderRadius: 10, padding: '0 14px',
                        background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 100%)',
                        color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                        boxShadow: '0 2px 12px rgba(10,132,255,0.3)',
                      }}
                    >
                      Start Training
                    </Link>
                  )}
                />
              </Reveal>
            )}
          </div>

          <div className="pt-progress-side">
            {/* ── PER MODE ── */}
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label3)', textTransform: 'uppercase', letterSpacing: '-0.08px', padding: '24px 4px 8px' }}>
              Per Mode
            </div>

            <motion.div
              className="ios-group pt-desktop-card"
              style={{ overflow: 'hidden', borderRadius: 12 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {MODES.map((m, idx) => {
                const ms = getModeStats(m.id);
                const progressPct = ms.gamesPlayed > 0 ? Math.min(100, Math.round(ms.avgAccuracy * 100)) : 0;

                return (
                  <div
                    key={m.id}
                    style={{
                      padding: '14px 16px',
                      borderTop: idx === 0 ? 'none' : '0.5px solid var(--ios-sep)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: ms.gamesPlayed > 0 ? 10 : 0 }}>
                      <Link href={`/play/${m.id}`} style={{ display: 'flex', alignItems: 'center', flex: 1, textDecoration: 'none' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 9,
                          background: `linear-gradient(135deg, ${m.color}22, ${m.color}0A)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, marginRight: 12, flexShrink: 0,
                        }}>
                          {m.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--ios-label)', letterSpacing: '-0.32px' }}>
                            {m.label}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 1 }}>
                            {ms.gamesPlayed > 0
                              ? `${ms.gamesPlayed} game${ms.gamesPlayed !== 1 ? 's' : ''} · ${Math.round(ms.avgAccuracy * 100)}% accuracy`
                              : 'Not played yet'}
                          </div>
                        </div>
                      </Link>
                      {ms.gamesPlayed > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: m.color }}>{ms.bestScore}</div>
                          <div style={{ fontSize: 11, color: 'var(--ios-label3)' }}>Best</div>
                        </div>
                      )}
                    </div>

                    {ms.gamesPlayed > 0 && (
                      <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                          style={{
                            height: '100%', borderRadius: 3,
                            background: `linear-gradient(90deg, ${m.color}, ${m.color}BB)`,
                            boxShadow: `0 0 6px ${m.color}33`,
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
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label3)', textTransform: 'uppercase', letterSpacing: '-0.08px', padding: '24px 4px 8px' }}>
                  Recent Games
                </div>
                <div className="ios-group pt-desktop-card" style={{ overflow: 'hidden', borderRadius: 12 }}>
                  {stats.results.slice(-8).reverse().map((r, idx) => {
                    const mode = MODES.find((m) => m.id === r.mode);
                    const acc = Math.round(r.accuracy * 100);
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.02 * idx, duration: 0.3 }}
                        style={{
                          padding: '12px 16px',
                          borderTop: idx === 0 ? 'none' : '0.5px solid var(--ios-sep)',
                          display: 'flex', alignItems: 'center',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: `${mode?.color || '#888'}18`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, marginRight: 10, flexShrink: 0,
                        }}>
                          {mode?.icon || '🎵'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ios-label)' }}>{mode?.label || r.mode}</div>
                          <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 1 }}>
                            {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            {' · '}{r.rounds} rounds
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ios-label)' }}>{r.score}</div>
                          <div style={{ fontSize: 11, color: acc >= 70 ? 'var(--ios-green)' : acc >= 40 ? 'var(--ios-orange)' : 'var(--ios-red)' }}>
                            {acc}%
                          </div>
                        </div>
                      </motion.div>
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
