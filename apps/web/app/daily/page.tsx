'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageHero, Reveal, StatusCard } from '@/components/PremiumMotion';
import { useStatsContext } from '@/components/StatsProvider';

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontFamily: '-apple-system, "SF Mono", monospace', fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)', fontVariantNumeric: 'tabular-nums' }}>
      {timeLeft}
    </span>
  );
}

const CHALLENGES = [
  {
    id: 'note-wordle',
    label: 'Note Wordle',
    icon: '🟩',
    color: '#30D158',
    desc: '6 attempts to identify today\'s mystery note',
    href: '/play/note-wordle',
  },
  {
    id: 'frequency-wordle',
    label: 'Frequency Wordle',
    icon: '🔊',
    color: '#5AC8FA',
    desc: '6 attempts to guess today\'s target frequency',
    href: '/play/frequency-wordle',
  },
];

export default function DailyPage() {
  const { stats, loaded } = useStatsContext();
  const [played] = useState<Record<string, boolean>>({});

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayResults = loaded ? stats.results.filter((r) => r.date.startsWith(todayStr)) : [];
  const dailyAccuracy = todayResults.length > 0
    ? Math.round(todayResults.reduce((s, r) => s + r.accuracy, 0) / todayResults.length * 100)
    : 0;

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="pt-page-shell pt-page-daily px-4 pt-14">

        <PageHero
          variant="daily"
          eyebrow={today}
          title="Daily Challenge"
          subtitle="Two fresh drills each day to keep momentum and consistency strong."
        />

        <div className="pt-daily-layout">
          <div className="pt-daily-main">

            {/* ── COUNTDOWN + STREAK ROW ── */}
            <motion.div
              className="ios-card p-0 mb-3 overflow-hidden pt-desktop-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4 }}
              style={{
                background: 'linear-gradient(135deg, rgba(48,209,88,0.06) 0%, rgba(90,200,250,0.04) 100%)',
                border: '1px solid rgba(48,209,88,0.08)',
              }}
            >
              <div className="grid grid-cols-2">
                <div style={{ padding: '16px 20px', borderRight: '0.5px solid var(--ios-sep)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--ios-label3)', marginBottom: 6 }}>
                    Resets in
                  </div>
                  <CountdownTimer />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: '100%', height: 2, borderRadius: 1, background: 'linear-gradient(90deg, var(--ios-green), var(--ios-teal))', marginTop: 8 }}
                  />
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--ios-label3)', marginBottom: 6 }}>
                    Streak
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>
                      {loaded ? stats.streak : '—'}
                    </span>
                    <motion.span
                      style={{ fontSize: 22 }}
                      animate={stats.streak > 0 ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      🔥
                    </motion.span>
                  </div>
                  {loaded && stats.bestStreak > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 2 }}>Best: {stats.bestStreak} days</div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── TODAY'S CHALLENGES ── */}
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.08px', textTransform: 'uppercase', color: 'var(--ios-label3)', padding: '16px 4px 8px' }}>
              Today&apos;s Drills
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CHALLENGES.map((c, i) => {
                const done = !!played[c.id];
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                    className="pt-desktop-card"
                  >
                    <div
                      className="ios-card ios-card-lift"
                      style={{
                        overflow: 'hidden',
                        border: `1px solid ${done ? 'rgba(48,209,88,0.15)' : `${c.color}12`}`,
                        background: done
                          ? 'linear-gradient(135deg, rgba(48,209,88,0.06) 0%, transparent 100%)'
                          : `linear-gradient(135deg, ${c.color}0A 0%, transparent 100%)`,
                      }}
                    >
                      <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          {/* Icon */}
                          <motion.div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 12,
                              background: `linear-gradient(135deg, ${c.color}20, ${c.color}08)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 24,
                              flexShrink: 0,
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {c.icon}
                          </motion.div>

                          {/* Text */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.4px' }}>
                              {c.label}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginTop: 2 }}>
                              {c.desc}
                            </div>
                          </div>

                          {/* Action */}
                          {done ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                background: 'linear-gradient(135deg, rgba(48,209,88,0.25), rgba(48,209,88,0.15))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </motion.div>
                          ) : (
                            <Link
                              href={c.href}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                height: 36,
                                borderRadius: 18,
                                background: `linear-gradient(135deg, ${c.color}, ${c.color}CC)`,
                                color: '#000',
                                fontSize: 14,
                                fontWeight: 600,
                                letterSpacing: '-0.08px',
                                padding: '0 18px',
                                textDecoration: 'none',
                                flexShrink: 0,
                                boxShadow: `0 2px 12px ${c.color}33`,
                              }}
                            >
                              Play
                              <svg width="4" height="8" viewBox="0 0 4 8" fill="none"><path d="M0 0l4 4-4 4" fill="currentColor" opacity="0.7" /></svg>
                            </Link>
                          )}
                        </div>

                        {/* Progress bar for completed */}
                        {done && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                              marginTop: 12,
                              height: 4,
                              borderRadius: 2,
                              background: 'linear-gradient(90deg, #30D158, #5AC8FA)',
                              transformOrigin: 'left',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ── TODAY STATS ── */}
            {loaded && todayResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                style={{ marginTop: 16 }}
                className="pt-desktop-card"
              >
                <div className="ios-card" style={{
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, rgba(10,132,255,0.06) 0%, rgba(94,92,230,0.04) 100%)',
                  border: '1px solid rgba(10,132,255,0.08)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', color: 'var(--ios-blue)', marginBottom: 4 }}>
                        Today&apos;s Accuracy
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px' }}>
                        {dailyAccuracy}%
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ios-label3)' }}>
                      {todayResults.length} drill{todayResults.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="pt-daily-side">
            {/* ── PREVIOUS DAYS ── */}
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.08px', textTransform: 'uppercase', color: 'var(--ios-label3)', padding: '24px 4px 8px' }}>
              Previous Days
            </div>

            <motion.div
              className="ios-group pt-desktop-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.4 }}
              style={{ overflow: 'hidden', borderRadius: 12 }}
            >
              {[...Array(7)].map((_, i) => {
                const date = new Date(Date.now() - (i + 1) * 86400000);
                const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <div
                    key={i}
                    className="ios-row"
                    style={{
                      padding: '12px 16px',
                      borderTop: i === 0 ? 'none' : '0.5px solid var(--ios-sep)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    }}
                  >
                    <span style={{ flex: 1, fontSize: 15, color: isWeekend ? 'var(--ios-label2)' : 'var(--ios-label)', letterSpacing: '-0.2px' }}>
                      {label}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {CHALLENGES.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            background: 'var(--ios-bg3)',
                            border: '1.5px solid var(--ios-sep)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--ios-bg4)' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>

            <Reveal delay={0.24}>
              <StatusCard
                tone={Object.values(played).length > 0 ? 'success' : 'empty'}
                title={Object.values(played).length > 0 ? 'Daily progress saved' : 'No daily drills completed yet'}
                body={Object.values(played).length > 0 ? 'Great pace. Finish the second challenge to secure today\'s streak.' : 'Complete both drills to lock your day and strengthen long-term recall.'}
              />
            </Reveal>

            <motion.div
              className="ios-card pt-desktop-card"
              style={{
                padding: 16,
                marginTop: 12,
                background: 'linear-gradient(135deg, rgba(10,132,255,0.06) 0%, rgba(94,92,230,0.04) 100%)',
                border: '0.5px solid rgba(10,132,255,0.12)',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>🎯</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-blue)' }}>
                  Daily Strategy
                </div>
              </div>
              <div style={{ fontSize: 14, color: 'var(--ios-label2)', lineHeight: 1.5 }}>
                Start with Note Wordle for pitch recall, then finish with Frequency Wordle while your ear is warmed up. Consistency beats perfection.
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
