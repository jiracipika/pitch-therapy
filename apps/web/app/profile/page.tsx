'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useStatsContext } from '@/components/StatsProvider';
import {
  evaluateAchievements,
  getNextGoals,
  getLatestBadges,
  GAME_MODE_META,
  GAME_MODES,
  MODE_CATEGORIES,
  type AchievementStatus,
} from '@pitch-therapy/core';

// Derive modes + categories from shared-core metadata (single source of truth).
const MODES = GAME_MODES.map((id) => {
  const mode = GAME_MODE_META[id];
  return { id: mode.id, label: mode.label, icon: mode.icon, color: mode.accentHex, category: mode.category };
});
const CATEGORIES = MODE_CATEGORIES.map((cat) => ({ id: cat.id, label: cat.label, color: cat.accentHex, icon: cat.icon, desc: cat.description }));

/** Format the progress metric for a locked tier as "current / target". */
function formatMetricProgress(s: AchievementStatus): string {
  const { tier, progress } = s;
  switch (tier.category) {
    case 'volume':
      return `${Math.round(progress)} / ${tier.threshold} sessions`;
    case 'consistency':
      return `${Math.round(progress)} / ${tier.threshold} day streak`;
    case 'accuracy':
      return `${Math.round(progress * 100)}% / ${Math.round(tier.threshold * 100)}%`;
    case 'versatility':
      return `${Math.round(progress)} / ${tier.threshold} modes`;
    case 'mastery':
      return `${Math.round(progress)} / ${tier.threshold} mastered`;
    case 'speed': {
      const targetSec = (tier.threshold / 1000).toFixed(0);
      const currentSec =
        Number.isFinite(progress) && progress > 0 ? (progress / 1000).toFixed(1) : '—';
      return `${currentSec}s avg / under ${targetSec}s`;
    }
    default:
      return '';
  }
}

export default function ProfilePage() {
  const { stats, loaded } = useStatsContext();
  const reduce = useReducedMotion();

  const totalGames = stats.results.length;
  const totalTimeMin = Math.round(stats.results.reduce((s, r) => s + r.timeMs, 0) / 60000);
  const avgAccuracy = totalGames > 0
    ? Math.round((stats.results.reduce((s, r) => s + r.accuracy, 0) / totalGames) * 100)
    : 0;

  const modesPlayed = new Set(stats.results.map((r) => r.mode)).size;
  const varietyScore = Math.min(100, Math.round((modesPlayed / MODES.length) * 50));
  const accuracyScore = Math.min(100, avgAccuracy);
  const earProfileScore = Math.round((varietyScore * 0.4) + (accuracyScore * 0.4) + (Math.min(stats.bestStreak, 7) / 7 * 20));

  const achievements = useMemo(() => evaluateAchievements(stats.results), [stats.results]);
  const nextGoals = useMemo(() => getNextGoals(stats.results), [stats.results]);
  const latestBadges = useMemo(() => getLatestBadges(stats.results), [stats.results]);

  const categoryScores = CATEGORIES.map((cat) => {
    const catModes = MODES.filter((m) => m.category === cat.id);
    const catResults = stats.results.filter((r) => catModes.some((m) => m.id === r.mode));
    const games = catResults.length;
    const accuracy = games > 0
      ? Math.round((catResults.reduce((s, r) => s + r.accuracy, 0) / games) * 100)
      : 0;
    return { ...cat, games, accuracy };
  });

  const getProfileTitle = (score: number) => {
    if (score >= 90) return { title: 'Perfect Pitch Prodigy', emoji: '🎯', color: '#ffd65c' };
    if (score >= 75) return { title: 'Sharp Ear', emoji: '🎵', color: '#62e6a7' };
    if (score >= 55) return { title: 'Tuned Listener', emoji: '📻', color: '#c7ff4a' };
    if (score >= 35) return { title: 'Rising Musician', emoji: '🎶', color: '#9b8cff' };
    if (score >= 15) return { title: 'Eager Ear', emoji: '👂', color: '#ff7a59' };
    return { title: 'New Listener', emoji: '🌱', color: '#8e8e93' };
  };

  const profile = getProfileTitle(earProfileScore);
  const scorePct = loaded ? earProfileScore / 100 : 0;
  const circ = 2 * Math.PI * 52;

  const fade = (delay: number) => (reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.42 } });
  const hasData = loaded && totalGames > 0;

  return (
    <div className="studio-page">
      <div className="pt-page-shell studio-dashboard">
        <motion.header className="studio-inner-header" {...fade(0)}>
          <div>
            <span className="studio-overline">EAR PROFILE / {modesPlayed} OF 18 MODES</span>
            <h1>{loaded ? profile.title : 'Your ear,'}<br /><em>{loaded ? 'on record.' : 'undiscovered.'}</em></h1>
            <p>A dynamic snapshot of where your hearing strengths are evolving across every listening skill.</p>
          </div>
          <div className="studio-header-chip">
            <span>EAR SCORE</span>
            <b>{loaded ? earProfileScore : '—'}</b>
            <small>OUT OF 100</small>
          </div>
        </motion.header>

        <section className="studio-inner-grid">
          <div className="studio-inner-main">
            {/* ── PROFILE SCORE CARD ── */}
            <motion.section
              className="studio-panel"
              {...fade(0.05)}
              style={{ background: `radial-gradient(circle at 78% 22%, color-mix(in srgb, ${profile.color} 10%, transparent), transparent 35rem), var(--pt-surface-1)` }}
            >
              <div className="studio-panel-heading">
                <div><span>EAR PROFILE</span><h2>{loaded ? profile.title : 'Discover your profile'}</h2></div>
                <div className="studio-score-ring">
                  <svg viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r="42" />
                    <motion.circle
                      cx="50" cy="50" r="42"
                      initial={reduce ? false : { strokeDashoffset: circ }}
                      animate={{ strokeDashoffset: circ * (1 - scorePct) }}
                      style={{ strokeDasharray: circ, stroke: profile.color }}
                      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </svg>
                  <span><b>{loaded ? earProfileScore : '—'}</b><small>EAR SCORE</small></span>
                </div>
              </div>
              <p style={{ margin: '-6px 0 18px', color: 'var(--ios-label2)', fontSize: 12, lineHeight: 1.55 }}>
                {loaded && totalGames > 0
                  ? `Variety ${varietyScore}/50 · Accuracy ${accuracyScore}/40 · Streak up to 20 — built from ${totalGames} session${totalGames !== 1 ? 's' : ''}.`
                  : 'Play a few sessions to generate your personalized score, skill breakdown, and next-step guidance.'}
              </p>
              {!hasData && (
                <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 28, width: '100%', minHeight: 48, padding: '0 20px', borderRadius: 999, background: 'var(--ios-blue)', color: 'var(--pt-on-accent)', fontSize: 13, fontWeight: 750, textDecoration: 'none', boxShadow: '0 12px 30px rgba(199,255,74,.15)' }}>
                  Start training <span aria-hidden="true">→</span>
                </Link>
              )}
            </motion.section>

            {/* ── ACHIEVEMENTS / BADGES ── */}
            {hasData && (
              <motion.section className="studio-panel" {...fade(0.12)}>
                <div className="studio-panel-heading">
                  <div><span>BADGES</span><h2>Achievements</h2></div>
                  <span className="studio-time-chip">{achievements.unlockedCount}/{achievements.totalCount}</span>
                </div>
                <i className="studio-meter" aria-hidden="true" style={{ margin: '0 0 14px' }}>
                  <em style={{ display: 'block', height: '100%', width: `${(achievements.unlockedCount / achievements.totalCount) * 100}%`, background: 'linear-gradient(90deg, var(--ios-green), var(--ios-blue))' }} />
                </i>
                {achievements.latestUnlock && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ color: 'var(--ios-label2)', fontSize: 11 }}>Latest unlock</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 999, border: '1px solid color-mix(in srgb, var(--ios-green) 30%, var(--pt-stroke))', background: 'color-mix(in srgb, var(--ios-green) 8%, transparent)', fontSize: 11, fontWeight: 650, color: 'var(--ios-label)' }}>
                      <span style={{ fontSize: 12 }}>{achievements.latestUnlock.icon}</span> {achievements.latestUnlock.label}
                    </span>
                  </div>
                )}
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
            {/* ── SKILLS BREAKDOWN ── */}
            <motion.section className="studio-panel" {...fade(0.1)}>
              <div className="studio-panel-heading"><div><span>SKILLS</span><h2>Skills breakdown</h2></div></div>
              <div className="studio-row-list" style={{ gap: 6 }}>
                {categoryScores.map((cat) => (
                  <div key={cat.id} style={{ padding: '8px 2px', minHeight: 58 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <span className="studio-plan-icon" style={{ background: `color-mix(in srgb, ${cat.color} 14%, transparent)` }}>{cat.icon}</span>
                        <span>
                          <b style={{ display: 'block', fontSize: 13 }}>{cat.label}</b>
                          <small style={{ display: 'block', marginTop: 2, color: 'var(--ios-label3)', fontSize: 9.5 }}>{cat.desc} · {cat.games} game{cat.games !== 1 ? 's' : ''}</small>
                        </span>
                      </span>
                      <strong style={{ color: cat.games > 0 ? cat.color : 'var(--ios-label3)', fontSize: 17, letterSpacing: '-.03em' }}>
                        {cat.games > 0 ? `${cat.accuracy}%` : '—'}
                      </strong>
                    </div>
                    <i className="studio-meter" aria-hidden="true">
                      <motion.em
                        initial={reduce ? false : { width: 0 }}
                        animate={{ width: `${cat.accuracy}%` }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        style={{ display: 'block', height: '100%', background: cat.color }}
                      />
                    </i>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* ── NEXT STEPS ── */}
            {hasData && (
              <motion.section className="studio-panel studio-daily-panel" {...fade(0.16)}>
                <div className="studio-panel-heading"><div><span>NEXT STEPS</span><h2>Keep improving</h2></div></div>
                <p>
                  {modesPlayed < 5
                    ? 'Try more game modes to discover your strengths. Head to the exercise catalog and explore.'
                    : avgAccuracy < 60
                      ? 'Focus on accuracy over speed. Try practice mode to build precision.'
                      : stats.streak < 3
                        ? 'Build your daily streak. Consistency is key to ear training.'
                        : 'Great progress. Challenge yourself with Advanced modes like Chord Detective and Waveform Match.'}
                </p>
                <Link href="/play-modes">Open exercise catalog <span aria-hidden="true">→</span></Link>
              </motion.section>
            )}

            {/* ── QUICK STATS ── */}
            <div className="studio-stat-strip" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <motion.article {...fade(0.12)}><span>SESSIONS</span><b>{loaded ? totalGames : '—'}</b><i>Short, focused repetitions.</i></motion.article>
              <motion.article {...fade(0.15)}><span>STREAK</span><b>{loaded ? stats.streak : '—'}<small> days</small></b><i>{stats.streak ? 'Momentum is building.' : 'Begin today’s streak.'}</i></motion.article>
              <motion.article {...fade(0.18)}><span>ACCURACY</span><b>{loaded ? avgAccuracy : '—'}<small>%</small></b><i>Across every exercise.</i></motion.article>
              <motion.article {...fade(0.21)}><span>TIME</span><b>{loaded ? totalTimeMin : '—'}<small> min</small></b><i>Total listening time.</i></motion.article>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
