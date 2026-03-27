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

const colorClasses: Record<string, string> = {
  blue: 'from-blue-500/20 to-transparent border-blue-500/30',
  violet: 'from-violet-500/20 to-transparent border-violet-500/30',
  amber: 'from-amber-500/20 to-transparent border-amber-500/30',
  green: 'from-green-500/20 to-transparent border-green-500/30',
  teal: 'from-teal-500/20 to-transparent border-teal-500/30',
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

  return <span className="font-mono text-2xl font-bold text-zinc-100">{timeLeft}</span>;
}

export default function Dashboard() {
  return (
    <div className="min-h-screen px-4 pt-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Welcome back! 👋</h1>
        <p className="mt-1 text-zinc-400">Let&apos;s train your ear today.</p>

        {/* Streak */}
        <div className="mt-6 flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-orange-500/30" />
            <div
              className="absolute inset-0 rounded-full border-4 border-orange-500"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}
            />
            <span className="text-2xl">🔥</span>
          </div>
          <div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-zinc-400">Day Streak</div>
          </div>
        </div>

        {/* Daily Challenge */}
        <div className="mt-6 rounded-xl border border-zinc-800 bg-gradient-to-r from-orange-500/10 to-transparent p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">📅 Daily Challenge</h2>
              <p className="text-sm text-zinc-400">Next challenge in</p>
              <CountdownTimer />
            </div>
            <Link
              href="/daily"
              className="rounded-lg bg-orange-500 px-5 py-2.5 font-bold text-white transition-colors hover:bg-orange-600"
            >
              Play
            </Link>
          </div>
        </div>

        {/* Mode Grid */}
        <h2 className="mt-8 text-xl font-bold">Game Modes</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {MODES.map((m) => (
            <Link
              key={m.id}
              href={m.href}
              className={`group rounded-xl border bg-gradient-to-b p-4 transition-all hover:scale-[1.02] ${colorClasses[m.color]}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <h3 className="font-bold">{m.label}</h3>
                    <p className="text-xs text-zinc-500">{m.desc}</p>
                  </div>
                </div>
                <span className="text-xs text-zinc-500">Best: {m.best}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Play */}
        <h2 className="mt-8 text-xl font-bold">Quick Play</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link href="/play/pitch-match" className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4 text-center transition-all hover:bg-blue-500/20">
            <div className="text-2xl">🎤</div>
            <div className="mt-1 text-sm font-medium">Pitch Match</div>
          </Link>
          <Link href="/play/note-id" className="rounded-xl bg-violet-500/10 border border-violet-500/30 p-4 text-center transition-all hover:bg-violet-500/20">
            <div className="text-2xl">🎵</div>
            <div className="mt-1 text-sm font-medium">Note ID</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
