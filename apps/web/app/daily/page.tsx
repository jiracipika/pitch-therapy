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

  return <span className="font-mono text-xl font-semibold tracking-tight text-white">{timeLeft}</span>;
}

export default function DailyPage() {
  const [playedNote] = useState(false);
  const [playedFreq] = useState(false);

  return (
    <div className="min-h-screen px-4 pt-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold tracking-tight text-white">📅 Daily Challenge</h1>
        <p className="mt-1 text-zinc-500">A fresh challenge every day</p>

        <div className="mt-6 glass-card p-6 text-center">
          <p className="text-sm text-zinc-500">Next challenge in</p>
          <CountdownTimer />
        </div>

        <h2 className="mt-10 text-xl font-semibold tracking-tight text-white">Today&apos;s Challenges</h2>

        <div className="mt-4 space-y-3">
          <div className="glass-card border-l-4 border-l-[#4ADE80] p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🟩</span>
                  <h3 className="text-lg font-semibold tracking-tight text-[#4ADE80]">Note Wordle</h3>
                </div>
                <p className="mt-1 text-sm text-zinc-500">6 attempts to identify the note</p>
              </div>
              <Link href="/play/note-wordle"
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ease-out ${playedNote ? 'bg-white/5 text-zinc-500' : 'bg-[#4ADE80] text-black hover:opacity-90'}`}>
                {playedNote ? '✅ Done' : 'Play'}
              </Link>
            </div>
          </div>

          <div className="glass-card border-l-4 border-l-[#2DD4BF] p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔵</span>
                  <h3 className="text-lg font-semibold tracking-tight text-[#2DD4BF]">Frequency Wordle</h3>
                </div>
                <p className="mt-1 text-sm text-zinc-500">6 attempts to guess the frequency</p>
              </div>
              <Link href="/play/frequency-wordle"
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ease-out ${playedFreq ? 'bg-white/5 text-zinc-500' : 'bg-[#2DD4BF] text-black hover:opacity-90'}`}>
                {playedFreq ? '✅ Done' : 'Play'}
              </Link>
            </div>
          </div>
        </div>

        <h2 className="mt-10 text-xl font-semibold tracking-tight text-white">Previous Days</h2>
        <div className="mt-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-4 flex items-center justify-between">
              <div className="text-sm text-zinc-500">
                {new Date(Date.now() - (i + 1) * 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div className="flex gap-1 text-xs">
                <span className="rounded-full bg-white/5 px-3 py-1 text-zinc-600">—</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
