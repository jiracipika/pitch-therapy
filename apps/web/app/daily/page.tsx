'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
    <span style={{ fontFamily: '-apple-system, "SF Mono", monospace', fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--ios-label)', fontVariantNumeric: 'tabular-nums' }}>
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
  const [played] = useState<Record<string, boolean>>({});

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="pt-page-shell pt-page-daily px-4 pt-14">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 pt-hero"
        >
          <div style={{ fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px', marginBottom: 2 }}>
            {today}
          </div>
          <h1 className="ios-large-title">Daily Challenge</h1>
        </motion.div>

        <div className="pt-daily-layout">
          <div className="pt-daily-main">
            {/* ── STREAK + COUNTDOWN ROW ── */}
            <motion.div
              className="ios-card p-0 mb-1 overflow-hidden pt-desktop-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4 }}
            >
              <div className="grid grid-cols-2">
                {/* Countdown */}
                <div style={{ padding: '16px 20px', borderRight: '0.5px solid var(--ios-sep)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--ios-label3)', marginBottom: 6 }}>
                    Resets in
                  </div>
                  <CountdownTimer />
                </div>

                {/* Streak */}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--ios-label3)', marginBottom: 6 }}>
                    Streak
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>0</span>
                    <span style={{ fontSize: 18 }}>🔥</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── TODAY'S CHALLENGES ── */}
            <div style={{ fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px', textTransform: 'uppercase', padding: '20px 4px 8px' }}>
              Today
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="ios-group pt-desktop-card"
            >
              {CHALLENGES.map((c, i) => {
                const done = !!played[c.id];
                return (
                  <div
                    key={c.id}
                    className="ios-row"
                    style={{
                      padding: '14px 16px',
                      borderTop: i === 0 ? 'none' : '0.5px solid var(--ios-sep)',
                      alignItems: 'center',
                      gap: 0,
                    }}
                  >
                    {/* App icon */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: `${c.color}18`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        marginRight: 12,
                        flexShrink: 0,
                      }}
                    >
                      {c.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--ios-label)', letterSpacing: '-0.32px' }}>
                        {c.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 2 }}>
                        {c.desc}
                      </div>
                    </div>

                    {/* Action */}
                    {done ? (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          background: 'rgba(48, 209, 88, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ios-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    ) : (
                      <Link
                        href={c.href}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: 32,
                          borderRadius: 16,
                          background: c.color,
                          color: '#000',
                          fontSize: 14,
                          fontWeight: 600,
                          letterSpacing: '-0.08px',
                          padding: '0 14px',
                          textDecoration: 'none',
                          flexShrink: 0,
                        }}
                      >
                        Play
                      </Link>
                    )}
                  </div>
                );
              })}
            </motion.div>
          </div>

          <div className="pt-daily-side">
            {/* ── PREVIOUS DAYS ── */}
            <div style={{ fontSize: 13, color: 'var(--ios-label3)', letterSpacing: '-0.08px', textTransform: 'uppercase', padding: '24px 4px 8px' }}>
              Previous Days
            </div>

            <motion.div
              className="ios-group pt-desktop-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.4 }}
            >
              {[...Array(5)].map((_, i) => {
                const date = new Date(Date.now() - (i + 1) * 86400000);
                const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <div
                    key={i}
                    className="ios-row"
                    style={{
                      padding: '12px 16px',
                      borderTop: i === 0 ? 'none' : '0.5px solid var(--ios-sep)',
                    }}
                  >
                    <span style={{ flex: 1, fontSize: 16, color: 'var(--ios-label)', letterSpacing: '-0.32px' }}>
                      {label}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {CHALLENGES.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
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

            <motion.div
              className="ios-card pt-desktop-card"
              style={{ padding: 16, marginTop: 12, background: 'rgba(10,132,255,0.06)', border: '0.5px solid rgba(10,132,255,0.12)' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-blue)', marginBottom: 6 }}>
                Daily Strategy
              </div>
              <div style={{ fontSize: 14, color: 'var(--ios-label2)', lineHeight: 1.45 }}>
                Start with Note Wordle for pitch recall, then finish with Frequency Wordle while your ear is warmed up.
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
