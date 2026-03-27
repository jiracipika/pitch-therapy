'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: Record<Difficulty, { options: number; rounds: number; timeLimit: number }> = {
  easy: { options: 4, rounds: 5, timeLimit: 0 },
  medium: { options: 6, rounds: 10, timeLimit: 15 },
  hard: { options: 12, rounds: 15, timeLimit: 8 },
};

export default function NoteIdPage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [phase, setPhase] = useState<'setup' | 'playing' | 'feedback' | 'done'>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetNote, setTargetNote] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<{ round: number; correct: boolean; points: number; target: string; answer: string; timeMs: number }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const config = DIFFICULTIES[difficulty];

  const pickNotes = useCallback((count: number) => {
    const shuffled = [...Array(12).keys()].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, count).sort((a, b) => a - b);
    const target = picked[Math.floor(Math.random() * picked.length)] ?? 0;
    return { picked, target };
  }, []);

  const startGame = () => {
    setRound(0);
    setScore(0);
    setStreak(0);
    setResults([]);
    startRound();
  };

  const startRound = () => {
    const { picked, target } = pickNotes(config.options);
    setOptions(picked);
    setTargetNote(target);
    setFeedback(null);
    setPhase('playing');
    setRound((r) => r + 1);
    playTone(NOTE_FREQUENCIES[`${NOTE_NAMES[target]}4`] || 261.63, 0.6);

    if (config.timeLimit > 0) {
      setTimeLeft(config.timeLimit);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleAnswer(-1, true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  };

  const handleAnswer = (noteIdx: number, timeout = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const correct = noteIdx === targetNote;
    const points = correct ? (config.timeLimit > 0 ? 100 + timeLeft * 5 : 100) : 0;
    setScore((s) => s + points);
    if (correct) setStreak((s) => s + 1);
    else setStreak(0);
    setFeedback(correct ? 'correct' : 'wrong');
    setResults((r) => [...r, {
      round, correct, points,
      target: NOTE_NAMES[targetNote] ?? 'A',
      answer: noteIdx >= 0 ? (NOTE_NAMES[noteIdx] ?? 'A') : 'timeout',
      timeMs: (config.timeLimit > 0 ? config.timeLimit - timeLeft : 0) * 1000,
    }]);
    setPhase('feedback');

    if (!timeout) {
      playTone(NOTE_FREQUENCIES[`${NOTE_NAMES[noteIdx]}4`] || 261.63, 0.3);
    }

    setTimeout(() => {
      if (round >= config.rounds) {
        setPhase('done');
      } else {
        startRound();
      }
    }, 1200);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (phase === 'done') {
    return (
      <div className="min-h-screen px-4 pt-8">
        <div className="mx-auto max-w-md text-center">
          <div className="text-6xl">🏆</div>
          <h1 className="mt-4 text-3xl font-bold">Game Complete!</h1>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
              <div className="text-2xl font-bold">{score}</div>
              <div className="text-xs text-zinc-400">Score</div>
            </div>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
              <div className="text-2xl font-bold">{results.filter(r => r.correct).length}/{config.rounds}</div>
              <div className="text-xs text-zinc-400">Correct</div>
            </div>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
              <div className="text-2xl font-bold">🔥 {streak}</div>
              <div className="text-xs text-zinc-400">Streak</div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={startGame} className="flex-1 rounded-xl bg-violet-500 py-3 font-bold text-white hover:bg-violet-600">Play Again</button>
            <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-xl bg-zinc-800 py-3 font-medium hover:bg-zinc-700">Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="min-h-screen px-4 pt-8">
        <div className="mx-auto max-w-md text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-3xl font-bold text-violet-500">Note ID</h1>
          <p className="mt-2 text-zinc-400">Identify notes by ear</p>
          <div className="mt-8">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Select Difficulty</h3>
            <div className="flex gap-3 justify-center">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${difficulty === d ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-500">{config.options} notes • {config.rounds} rounds{config.timeLimit ? ` • ${config.timeLimit}s timer` : ''}</p>
          </div>
          <button onClick={startGame} className="mt-8 rounded-xl bg-violet-500 px-8 py-3 font-bold text-white hover:bg-violet-600">
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-8">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-400 hover:text-white">← Back</button>
          <h1 className="text-lg font-bold text-violet-500">🎵 Note ID</h1>
          <div className="text-sm text-zinc-400">Score: {score}</div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full bg-violet-500 transition-all" style={{ width: `${(round / config.rounds) * 100}%` }} />
        </div>

        {config.timeLimit > 0 && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className={`h-full transition-all duration-1000 ${timeLeft < 3 ? 'bg-red-500' : 'bg-violet-500'}`}
              style={{ width: `${(timeLeft / config.timeLimit) * 100}%` }} />
          </div>
        )}

        <div className="mt-8 text-center">
          <button onClick={() => playTone(NOTE_FREQUENCIES[`${NOTE_NAMES[targetNote]}4`] || 261.63, 0.6)}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-violet-500/20 border-2 border-violet-500 text-4xl hover:bg-violet-500/30 transition-colors">
            🔊
          </button>
          <p className="mt-3 text-sm text-zinc-400">Tap to replay</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          {options.map((idx) => {
            const name = NOTE_NAMES[idx];
            const isTarget = idx === targetNote;
            let btnClass = 'bg-zinc-800 hover:bg-zinc-700 text-white';
            if (feedback) {
              if (isTarget) btnClass = 'bg-green-500/20 border-2 border-green-500 text-green-400';
              else if (!isTarget && feedback === 'wrong') btnClass = 'bg-zinc-800/50 text-zinc-600';
            }
            return (
              <button key={idx} onClick={() => phase === 'playing' && handleAnswer(idx)}
                className={`rounded-xl py-4 text-lg font-bold transition-all ${btnClass}`} disabled={phase === 'feedback'}>
                {name}
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <div className="text-sm text-zinc-400">🔥 Streak: {streak} • Round {round}/{config.rounds}</div>
        </div>
      </div>
    </div>
  );
}


