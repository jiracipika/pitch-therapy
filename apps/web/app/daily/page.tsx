'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className="font-mono text-3xl font-semibold text-white"
      style={{ letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
    >
      {timeLeft}
    </span>
  );
}

const CHALLENGES = [
  {
    id: 'note-wordle',
    label: 'Note Wordle',
    color: '#4ADE80',
    desc: '6 attempts to identify today\'s mystery note',
    href: '/play/note-wordle',
  },
  {
    id: 'frequency-wordle',
    label: 'Frequency Wordle',
    color: '#2DD4BF',
    desc: '6 attempts to guess today\'s target frequency',
    href: '/play/frequency-wordle',
  },
];

export default function DailyPage() {
  const [played] = useState<Record<string, boolean>>({});

  return (
    <div className="min-h-screen pb-nav px-4 pt-12">
      <div className="mx-auto max-w-lg">

        {/* ── HEADER ── */}
        <div className="mb-8">
          <p className="text-sm font-medium text-zinc-600" style={{ letterSpacing: '0.01em' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1
            className="mt-0.5 text-3xl font-semibold text-white"
            style={{ letterSpacing: '-0.03em' }}
          >
            Daily Challenge
          </h1>
        </div>

        {/* ── COUNTDOWN ── */}
        <div className="glass-card mb-6 flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 mb-1">Next reset</p>
            <CountdownTimer />
          </div>
          <div className="h-12 w-px bg-white/6" />
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 mb-1">Streak</p>
            <span className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>0</span>
          </div>
        </div>

        {/* ── TODAY'S CHALLENGES ── */}
        <p className="section-header">Today</p>
        <div className="space-y-2.5 mb-8">
          {CHALLENGES.map((c) => {
            const done = !!played[c.id];
            return (
              <div key={c.id} className="glass-card overflow-hidden">
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${c.color}12`, border: `1px solid ${c.color}22` }}
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: c.color, boxShadow: `0 0 6px ${c.color}80` }}
                      />
                    </div>
                    <div>
                      <h3
                        className="text-sm font-semibold"
                        style={{ color: c.color, letterSpacing: '-0.01em' }}
                      >
                        {c.label}
                      </h3>
                      <p className="mt-0.5 text-xs text-zinc-500">{c.desc}</p>
                    </div>
                  </div>

                  {done ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(161,161,170)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                  ) : (
                    <Link
                      href={c.href}
                      className="rounded-full px-4 py-1.5 text-xs font-semibold text-black transition-all duration-200 hover:opacity-85 active:scale-95"
                      style={{ backgroundColor: c.color }}
                    >
                      Play
                    </Link>
                  )}
                </div>

                {/* thin color accent bottom bar */}
                <div className="h-px" style={{ background: `linear-gradient(to right, ${c.color}30, transparent)` }} />
              </div>
            );
          })}
        </div>

        {/* ── PREVIOUS DAYS ── */}
        <p className="section-header">Previous Days</p>
        <div className="glass-card overflow-hidden">
          {[...Array(5)].map((_, i) => {
            const date = new Date(Date.now() - (i + 1) * 86400000);
            const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            return (
              <div key={i} className={`flex items-center justify-between px-5 py-3.5 ${i < 4 ? 'border-b border-white/5' : ''}`}>
                <span className="text-sm text-zinc-400">{label}</span>
                <div className="flex gap-1.5">
                  {CHALLENGES.map((c) => (
                    <div
                      key={c.id}
                      className="h-5 w-5 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
