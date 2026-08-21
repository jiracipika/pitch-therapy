'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useStatsContext } from '@/components/StatsProvider';
import {
  DAILY_CHALLENGE_MODES,
  formatClockCountdown,
  getDailyChallengeCompletion,
  getSecondsUntilLocalMidnight,
  GAME_MODE_META,
} from '@pitch-therapy/core';

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => setTimeLeft(formatClockCountdown(getSecondsUntilLocalMidnight()));
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <b style={{ font: '400 26px/1 ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: '-.04em', color: 'var(--ios-label)', fontVariantNumeric: 'tabular-nums' }}>
      {timeLeft}
    </b>
  );
}

// Daily challenges derive from the shared-core metadata (single source of truth).
const CHALLENGES = DAILY_CHALLENGE_MODES.map((id) => {
  const mode = GAME_MODE_META[id];
  return { id: mode.id, label: mode.label, icon: mode.icon, color: mode.accentHex, desc: mode.description, href: `/play/${id}` };
});

export default function DailyPage() {
  const { stats, loaded } = useStatsContext();
  const reduce = useReducedMotion();
  const completion = getDailyChallengeCompletion(stats.results);
  const played: Record<string, boolean> = Object.fromEntries(
    DAILY_CHALLENGE_MODES.map((mode) => [mode, completion.completedModes.includes(mode)]),
  );
  const completedCount = completion.completedCount;
  const completionPct = Math.round((completedCount / CHALLENGES.length) * 100);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
  const fade = (delay: number) => (reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.42 } });

  return (
    <div className="studio-page">
      <div className="pt-page-shell studio-dashboard">
        <motion.header className="studio-inner-header" {...fade(0)}>
          <div>
            <span className="studio-overline">DAILY CHALLENGE / {today}</span>
            <h1>Two drills.<br /><em>Every day.</em></h1>
            <p>Fresh wordle-style drills each day. Complete both before midnight to keep your streak locked in.</p>
          </div>
          <div className="studio-header-chip">
            <span>RESETS IN</span>
            <CountdownTimer />
            <small>{completion.isComplete ? 'TOMORROW’S SET' : 'BEFORE RESET'}</small>
          </div>
        </motion.header>

        <section className="studio-inner-grid">
          <div className="studio-inner-main">
            <motion.section className="studio-panel" {...fade(0.05)}>
              <div className="studio-panel-heading">
                <div><span>TODAY</span><h2>{completion.isComplete ? 'Daily complete' : 'Today’s challenges'}</h2></div>
                <span className="studio-time-chip">{completedCount}/{CHALLENGES.length} DONE</span>
              </div>
              <p style={{ margin: '-6px 0 14px', color: 'var(--ios-label2)', fontSize: 12, lineHeight: 1.55 }}>
                {completion.isComplete ? 'Great work. Your streak-safe sessions for today are done.' : 'Complete both drills before reset to keep consistency strong.'}
              </p>
              <div className="studio-row-list">
                {CHALLENGES.map((c) => {
                  const done = !!played[c.id];
                  return (
                    <div key={c.id} className="studio-challenge-row">
                      <span className="studio-challenge-icon" style={{ background: `color-mix(in srgb, ${c.color} 13%, transparent)` }}>{c.icon}</span>
                      <span>
                        <b>{c.label}</b>
                        <small>{c.desc}</small>
                      </span>
                      {done ? (
                        <span className="studio-challenge-done" role="img" aria-label={`${c.label} completed`}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                        </span>
                      ) : (
                        <Link href={c.href} className="studio-challenge-cta">Play <span aria-hidden="true">→</span></Link>
                      )}
                    </div>
                  );
                })}
              </div>
              <i className="studio-meter" aria-hidden="true" style={{ marginTop: 14 }}>
                <motion.i animate={{ width: `${completionPct}%` }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} style={{ background: 'linear-gradient(90deg, var(--ios-green), var(--ios-blue))', display: 'block', height: '100%' }} />
              </i>
            </motion.section>

            <div className="studio-stat-strip">
              <motion.article {...fade(0.08)}><span>STREAK</span><b>{loaded ? stats.streak : '—'}<small> days</small></b><i>{stats.streak ? 'Momentum is building.' : 'Begin today’s streak.'}</i></motion.article>
              <motion.article {...fade(0.11)}><span>BEST STREAK</span><b>{loaded ? stats.bestStreak : '—'}<small> days</small></b><i>Your personal record.</i></motion.article>
              <motion.article {...fade(0.14)}><span>SESSIONS</span><b>{loaded ? stats.results.length : '—'}</b><i>Short, focused repetitions.</i></motion.article>
              <motion.article {...fade(0.17)}><span>COMPLETED</span><b>{completedCount}<small>/{CHALLENGES.length}</small></b><i>{completionPct}% of today done.</i></motion.article>
            </div>
          </div>

          <aside className="studio-inner-side">
            <motion.section className="studio-panel" {...fade(0.1)}>
              <div className="studio-panel-heading"><div><span>HISTORY</span><h2>Previous days</h2></div><span className="studio-time-chip">LAST 5</span></div>
              <div className="studio-row-list">
                {[...Array(5)].map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (i + 1));
                  const dayCompletion = getDailyChallengeCompletion(stats.results, date);
                  const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  return (
                    <div key={i} className="studio-history-row">
                      <span>{label}</span>
                      <div className="studio-history-dots">
                        {CHALLENGES.map((c) => {
                          const done = dayCompletion.completedModes.some((mode) => mode === c.id);
                          return <i key={c.id} className={done ? 'is-done' : ''} aria-label={`${c.label}: ${done ? 'completed' : 'not completed'}`}><b /></i>;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>

            <motion.section className="studio-panel studio-daily-panel" {...fade(0.16)}>
              <div className="studio-panel-heading"><div><span>STRATEGY</span><h2>Daily strategy</h2></div></div>
              <p>Start with {CHALLENGES[0]?.label ?? 'the first drill'} for pitch recall, then finish with {CHALLENGES[1]?.label ?? 'the second drill'} while your ear is warmed up.</p>
              <Link href="/play-modes">Browse all exercises <span aria-hidden="true">→</span></Link>
            </motion.section>
          </aside>
        </section>
      </div>
    </div>
  );
}
