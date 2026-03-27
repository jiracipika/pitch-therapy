'use client';

import { useState } from 'react';

interface Result {
  round: number;
  correct: boolean;
  points: number;
  target?: string;
  answer?: string;
}

export default function ResultsScreen({
  mode,
  results,
  score,
  totalRounds,
  onPlayAgain,
  onDashboard,
}: {
  mode: string;
  results: Result[];
  score: number;
  totalRounds: number;
  onPlayAgain: () => void;
  onDashboard: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const accuracy = results.length ? Math.round((results.filter((r) => r.correct).length / results.length) * 100) : 0;

  const shareText = results.map((r) => (r.correct ? '🟩' : '🟥')).join('');

  const handleShare = () => {
    navigator.clipboard.writeText(`Pitch Therapy - ${mode}\nScore: ${score}\n${shareText}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black pb-24 pt-10 px-4">
      <div className="mx-auto max-w-md">
        <div className="animate-slide-up text-center">
          <div className="mb-4 text-6xl">🏆</div>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-white">Game Complete!</h1>
          <p className="text-zinc-500 capitalize">{mode.replace('-', ' ')}</p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="glass-card p-4 text-center"><div className="text-2xl font-bold text-white">{score}</div><div className="text-xs text-zinc-500">Score</div></div>
          <div className="glass-card p-4 text-center"><div className="text-2xl font-bold text-white">{accuracy}%</div><div className="text-xs text-zinc-500">Accuracy</div></div>
          <div className="glass-card p-4 text-center"><div className="text-2xl font-bold text-white">{results.length}/{totalRounds}</div><div className="text-xs text-zinc-500">Rounds</div></div>
        </div>

        <div className="mt-6 glass-card p-5">
          <h3 className="mb-3 text-sm font-medium text-zinc-500">Round Breakdown</h3>
          <div className="flex flex-wrap gap-1.5">
            {results.map((r) => (
              <div key={r.round}
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-semibold ${
                  r.correct ? 'bg-[#4ADE80]/10 text-[#4ADE80]' : 'bg-red-400/10 text-red-400'
                }`}>
                {r.round}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={handleShare}
            className="flex-1 rounded-full bg-white/5 py-3 text-sm font-medium text-zinc-300 transition-all duration-300 ease-out hover:bg-white/10">
            {copied ? '✅ Copied!' : '📋 Share'}
          </button>
          <button onClick={onPlayAgain}
            className="flex-1 rounded-full bg-[#60A5FA] py-3 text-sm font-semibold text-white transition-all duration-300 ease-out hover:opacity-90">
            🔄 Play Again
          </button>
          <button onClick={onDashboard}
            className="flex-1 rounded-full bg-white/5 py-3 text-sm font-medium text-zinc-300 transition-all duration-300 ease-out hover:bg-white/10">
            🏠 Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
