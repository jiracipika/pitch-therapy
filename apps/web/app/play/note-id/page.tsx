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
      <div className="min-h-screen px-4 pt-10">
        <div className="mx-auto max-w-md text-center">
          <div className="text-6xl">🏆</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Game Complete!</h1>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="glass-card p-4"><div className="text-2xl font-bold text-white">{score}</div><div className="text-xs text-zinc-500">Score</div></div>
            <div className="glass-card p-4"><div className="text-2xl font-bold text-white">{results.filter(r => r.correct).length}/{config.rounds}</div><div className="text-xs text-zinc-500">Correct</div></div>
            <div className="glass-card p-4"><div className="text-2xl font-bold text-white">🔥 {streak}</div><div className="text-xs text-zinc-500">Streak</div></div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={startGame} className="flex-1 rounded-full bg-[#A78BFA] py-3 font-semibold text-white transition-all duration-300 ease-out hover:opacity-90">Play Again</button>
            <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-full bg-white/5 py-3 font-medium text-zinc-300 transition-all duration-300 ease-out hover:bg-white/10">Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="min-h-screen px-4 pt-10">
        <div className="mx-auto max-w-md text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#A78BFA]">Note ID</h1>
          <p className="mt-2 text-zinc-500">Identify notes by ear</p>
          <div className="mt-8">
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Select Difficulty</h3>
            <div className="flex gap-3 justify-center">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ease-out ${difficulty === d ? 'bg-[#A78BFA] text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'}`}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-600">{config.options} notes • {config.rounds} rounds{config.timeLimit ? ` • ${config.timeLimit}s timer` : ''}</p>
          </div>
          <button onClick={startGame} className="mt-8 rounded-full bg-[#A78BFA] px-6 py-2.5 font-semibold text-white transition-all duration-300 ease-out hover:opacity-90">
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-10">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-white transition-colors duration-300">← Back</button>
          <h1 className="text-lg font-semibold tracking-tight text-[#A78BFA]">🎵 Note ID</h1>
          <div className="text-sm text-zinc-500">Score: {score}</div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-[#A78BFA] transition-all duration-500" style={{ width: `${(round / config.rounds) * 100}%` }} />
        </div>

        {config.timeLimit > 0 && (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
            <div className={`h-full rounded-full transition-all duration-1000 ${timeLeft < 3 ? 'bg-red-400' : 'bg-[#A78BFA]'}`}
              style={{ width: `${(timeLeft / config.timeLimit) * 100}%` }} />
          </div>
        )}

        <div className="mt-10 text-center">
          <button onClick={() => playTone(NOTE_FREQUENCIES[`${NOTE_NAMES[targetNote]}4`] || 261.63, 0.6)}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-4xl transition-all duration-300 ease-out hover:bg-white/10 backdrop-blur-xl">
            🔊
          </button>
          <p className="mt-3 text-sm text-zinc-500">Tap to replay</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          {options.map((idx) => {
            const name = NOTE_NAMES[idx];
            const isTarget = idx === targetNote;
            let btnClass = 'glass-card hover:bg-white/[0.08] text-white';
            if (feedback) {
              if (isTarget) btnClass = 'rounded-2xl bg-[#4ADE80]/10 border-2 border-[#4ADE80] text-[#4ADE80]';
              else if (!isTarget && feedback === 'wrong') btnClass = 'glass-card opacity-40';
            }
            return (
              <button key={idx} onClick={() => phase === 'playing' && handleAnswer(idx)}
                className={`rounded-2xl py-4 text-lg font-semibold transition-all duration-300 ease-out ${btnClass}`} disabled={phase === 'feedback'}>
                {name}
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <div className="text-sm text-zinc-500">🔥 Streak: {streak} • Round {round}/{config.rounds}</div>
        </div>
      </div>
    </div>
  );
}
