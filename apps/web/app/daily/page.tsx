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

  return <span className="font-mono text-xl font-bold">{timeLeft}</span>;
}

export default function DailyPage() {
  const [playedNote] = useState(false);
  const [playedFreq] = useState(false);

  return (
    <div className="min-h-screen px-4 pt-8">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-bold">📅 Daily Challenge</h1>
        <p className="mt-1 text-zinc-400">A fresh challenge every day</p>

        {/* Timer */}
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
          <p className="text-sm text-zinc-400">Next challenge in</p>
          <CountdownTimer />
        </div>

        {/* Today's challenges */}
        <h2 className="mt-8 text-xl font-bold">Today&apos;s Challenges</h2>

        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-green-500/30 bg-gradient-to-r from-green-500/10 to-transparent p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🟩</span>
                  <h3 className="text-lg font-bold text-green-500">Note Wordle</h3>
                </div>
                <p className="mt-1 text-sm text-zinc-400">6 attempts to identify the note</p>
              </div>
              <Link href="/play/note-wordle"
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${playedNote ? 'bg-zinc-700 text-zinc-400' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                {playedNote ? '✅ Done' : 'Play'}
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-teal-500/30 bg-gradient-to-r from-teal-500/10 to-transparent p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔵</span>
                  <h3 className="text-lg font-bold text-teal-500">Frequency Wordle</h3>
                </div>
                <p className="mt-1 text-sm text-zinc-400">6 attempts to guess the frequency</p>
              </div>
              <Link href="/play/frequency-wordle"
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${playedFreq ? 'bg-zinc-700 text-zinc-400' : 'bg-teal-500 text-white hover:bg-teal-600'}`}>
                {playedFreq ? '✅ Done' : 'Play'}
              </Link>
            </div>
          </div>
        </div>

        {/* Previous days */}
        <h2 className="mt-8 text-xl font-bold">Previous Days</h2>
        <div className="mt-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-zinc-400">
                  {new Date(Date.now() - (i + 1) * 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex gap-1 text-xs">
                <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-500">—</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
