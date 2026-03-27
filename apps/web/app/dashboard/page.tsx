'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const MODES = [
  { id: 'pitch-match', label: 'Pitch Match', color: '#60A5FA', desc: 'Match pitches with your voice', href: '/play/pitch-match' },
  { id: 'note-id', label: 'Note ID', color: '#A78BFA', desc: 'Identify notes by ear', href: '/play/note-id' },
  { id: 'frequency-guess', label: 'Frequency Guess', color: '#FBBF24', desc: 'Guess frequencies', href: '/play/frequency-guess' },
  { id: 'note-wordle', label: 'Note Wordle', color: '#4ADE80', desc: 'Wordle meets ear training', href: '/play/note-wordle' },
  { id: 'frequency-wordle', label: 'Frequency Wordle', color: '#2DD4BF', desc: 'Wordle for frequencies', href: '/play/frequency-wordle' },
];

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
      className="font-mono text-2xl font-semibold text-white"
      style={{ letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
    >
      {timeLeft}
    </span>
  );
}

function StreakRing({ streak, size = 88 }: { streak: number; size?: number }) {
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(streak / 7, 1);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="streak-ring" width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#FBBF24" strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className="transition-all duration-700 ease-out"
          style={{ filter: progress > 0 ? 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' : 'none' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  return (
    <div className="min-h-screen pb-nav px-4 pt-12">
      <div className="mx-auto max-w-lg">

        {/* ── GREETING ── */}
        <div className="mb-8">
          <p className="text-sm font-medium text-zinc-600" style={{ letterSpacing: '0.01em' }}>
            {greeting()}
          </p>
          <h1
            className="mt-0.5 text-3xl font-semibold text-white"
            style={{ letterSpacing: '-0.03em' }}
          >
            Ready to train?
          </h1>
        </div>

        {/* ── STREAK + DAILY ROW ── */}
        <div className="grid gap-3 sm:grid-cols-2 mb-3">
          {/* Streak */}
          <div className="glass-card flex items-center gap-5 p-5">
            <StreakRing streak={0} />
            <div>
              <div
                className="text-4xl font-bold text-white"
                style={{ letterSpacing: '-0.04em' }}
              >
                0
              </div>
              <div className="mt-0.5 text-sm text-zinc-500">Day Streak</div>
            </div>
          </div>

          {/* Daily Challenge */}
          <div className="glass-card flex flex-col justify-between p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 mb-1">Daily Challenge</p>
              <p className="text-[11px] text-zinc-600">Next reset in</p>
              <CountdownTimer />
            </div>
            <Link
              href="/daily"
              className="btn-primary mt-4 w-full justify-center text-sm"
              style={{ padding: '0.5rem 1rem' }}
            >
              Play Today
            </Link>
          </div>
        </div>

        {/* ── GAME MODES ── */}
        <p className="section-header mt-8">Game Modes</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {MODES.map((m) => (
            <Link
              key={m.id}
              href={m.href}
              className="glass-card group flex items-center gap-4 p-4 transition-all duration-250 ease-out hover:scale-[1.015]"
            >
              <div
                className="h-9 w-9 flex-shrink-0 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${m.color}15`, border: `1px solid ${m.color}25` }}
              >
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: m.color, boxShadow: `0 0 6px ${m.color}80` }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  className="text-sm font-semibold text-white truncate"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {m.label}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-600 truncate">{m.desc}</p>
              </div>
              <div className="flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(82,82,91)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-colors group-hover:stroke-zinc-400">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* ── QUICK PLAY ── */}
        <p className="section-header mt-8">Quick Play</p>
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/play/pitch-match"
            className="glass-card flex flex-col items-center justify-center gap-2 py-6 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <span className="text-xs font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>Pitch Match</span>
          </Link>
          <Link
            href="/play/note-id"
            className="glass-card flex flex-col items-center justify-center gap-2 py-6 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <span className="text-xs font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>Note ID</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
