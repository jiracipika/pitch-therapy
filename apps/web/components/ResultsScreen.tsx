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

  const shareText = results
    .map((r) => (r.correct ? '🟩' : '🟥'))
    .join('');

  const handleShare = () => {
    navigator.clipboard.writeText(`Pitch Therapy - ${mode}\nScore: ${score}\n${shareText}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 pt-8 px-4">
      <div className="mx-auto max-w-md">
        <div className="animate-slide-up text-center">
          <div className="mb-4 text-6xl">🏆</div>
          <h1 className="mb-2 text-3xl font-bold">Game Complete!</h1>
          <p className="text-zinc-400 capitalize">{mode.replace('-', ' ')}</p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold">{score}</div>
            <div className="text-xs text-zinc-400">Score</div>
          </div>
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold">{accuracy}%</div>
            <div className="text-xs text-zinc-400">Accuracy</div>
          </div>
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold">{results.length}/{totalRounds}</div>
            <div className="text-xs text-zinc-400">Rounds</div>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <h3 className="mb-3 text-sm font-medium text-zinc-400">Round Breakdown</h3>
          <div className="flex flex-wrap gap-1.5">
            {results.map((r) => (
              <div
                key={r.round}
                className={`flex h-8 w-8 items-center justify-center rounded text-xs font-bold ${
                  r.correct ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {r.round}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 rounded-xl bg-zinc-800 py-3 text-sm font-medium transition-colors hover:bg-zinc-700"
          >
            {copied ? '✅ Copied!' : '📋 Share'}
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 rounded-xl bg-blue-500 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-600"
          >
            🔄 Play Again
          </button>
          <button
            onClick={onDashboard}
            className="flex-1 rounded-xl bg-zinc-800 py-3 text-sm font-medium transition-colors hover:bg-zinc-700"
          >
            🏠 Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
