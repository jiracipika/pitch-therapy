'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const MODES = [
  { id: 'pitch-match', label: 'Pitch Match', icon: '🎤', color: 'blue', desc: 'Match pitches with your voice', href: '/play/pitch-match', best: '--' },
  { id: 'note-id', label: 'Note ID', icon: '🎵', color: 'violet', desc: 'Identify notes by ear', href: '/play/note-id', best: '--' },
  { id: 'frequency-guess', label: 'Frequency Guess', icon: '🎯', color: 'amber', desc: 'Guess frequencies', href: '/play/frequency-guess', best: '--' },
  { id: 'note-wordle', label: 'Note Wordle', icon: '🟩', color: 'green', desc: 'Wordle meets ear training', href: '/play/note-wordle', best: '--' },
  { id: 'frequency-wordle', label: 'Frequency Wordle', icon: '🔵', color: 'teal', desc: 'Wordle for frequencies', href: '/play/frequency-wordle', best: '--' },
];

const colorBorder: Record<string, string> = {
  blue: 'border-l-[#60A5FA]', violet: 'border-l-[#A78BFA]', amber: 'border-l-[#FBBF24]',
  green: 'border-l-[#4ADE80]', teal: 'border-l-[#2DD4BF]',
};

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

  return <span className="font-mono text-2xl font-semibold tracking-tight text-white">{timeLeft}</span>;
}

function StreakRing({ streak, size = 80 }: { streak: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(streak / 7, 1); // 7-day ring

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="streak-ring" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="#FBBF24" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl">🔥</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen px-4 pt-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Welcome back! 👋</h1>
        <p className="mt-1 text-zinc-500">Let&apos;s train your ear today.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[auto_1fr]">
          {/* Streak */}
          <div className="glass-card p-6 flex items-center gap-6">
            <StreakRing streak={0} />
            <div>
              <div className="text-3xl font-bold tracking-tight text-white">0</div>
              <div className="text-sm text-zinc-500">Day Streak</div>
            </div>
          </div>

          {/* Daily Challenge */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-white">📅 Daily Challenge</h2>
                <p className="text-sm text-zinc-500">Next challenge in</p>
                <CountdownTimer />
              </div>
              <Link
                href="/daily"
                className="rounded-full bg-white px-6 py-2.5 font-semibold text-black transition-all duration-300 ease-out hover:bg-zinc-200"
              >
                Play
              </Link>
            </div>
          </div>
        </div>

        {/* Mode Grid */}
        <h2 className="mt-10 text-xl font-semibold tracking-tight text-white">Game Modes</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {MODES.map((m) => (
            <Link
              key={m.id}
              href={m.href}
              className={`glass-card border-l-4 ${colorBorder[m.color]} group flex items-center justify-between p-5 transition-all duration-300 ease-out hover:scale-[1.01]`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <h3 className="font-semibold tracking-tight text-white">{m.label}</h3>
                  <p className="text-xs text-zinc-500">{m.desc}</p>
                </div>
              </div>
              <span className="text-xs text-zinc-600">Best: {m.best}</span>
            </Link>
          ))}
        </div>

        {/* Quick Play */}
        <h2 className="mt-10 text-xl font-semibold tracking-tight text-white">Quick Play</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link href="/play/pitch-match" className="glass-card p-6 text-center transition-all duration-300 ease-out hover:scale-[1.02]">
            <div className="text-3xl">🎤</div>
            <div className="mt-2 text-sm font-medium text-white">Pitch Match</div>
          </Link>
          <Link href="/play/note-id" className="glass-card p-6 text-center transition-all duration-300 ease-out hover:scale-[1.02]">
            <div className="text-3xl">🎵</div>
            <div className="mt-2 text-sm font-medium text-white">Note ID</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
