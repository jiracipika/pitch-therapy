'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';
import WaveVisualizer from '@/components/WaveVisualizer';
import FeedbackOverlay from '@/components/FeedbackOverlay';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: Record<Difficulty, { options: number; rounds: number; timeLimit: number }> = {
  easy: { options: 4, rounds: 5, timeLimit: 0 },
  medium: { options: 6, rounds: 10, timeLimit: 15 },
  hard: { options: 12, rounds: 15, timeLimit: 8 },
};

const ACCENT = '#A78BFA';

export default function NoteIdPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get('practice') === 'true';
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [phase, setPhase] = useState<'setup' | 'playing' | 'feedback' | 'done'>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [targetNote, setTargetNote] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
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
    setBestStreak(0);
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
    playToneWithVisual(NOTE_FREQUENCIES[`${NOTE_NAMES[target]}4`] || 261.63, 0.6);

    if (!isPractice && config.timeLimit > 0) {
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

  const playToneWithVisual = (freq: number, dur: number) => {
    setIsPlaying(true);
    playTone(freq, dur);
    setTimeout(() => setIsPlaying(false), dur * 1000);
  };

  const handleAnswer = (noteIdx: number, timeout = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const correct = noteIdx === targetNote;
    const points = isPractice ? 0 : correct ? (config.timeLimit > 0 ? 100 + timeLeft * 5 : 100) : 0;
    if (!isPractice) setScore((s) => s + points);
    if (correct) {
      setStreak((s) => {
        const newStreak = s + 1;
        setBestStreak((b) => Math.max(b, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }
    setFeedback(correct ? 'correct' : 'wrong');
    if (!isPractice) {
      setShowFeedbackOverlay(true);
    }
    setResults((r) => [...r, {
      round, correct, points,
      target: NOTE_NAMES[targetNote] ?? 'A',
      answer: noteIdx >= 0 ? (NOTE_NAMES[noteIdx] ?? 'A') : 'timeout',
      timeMs: (config.timeLimit > 0 ? config.timeLimit - timeLeft : 0) * 1000,
    }]);
    setPhase('feedback');

    if (!timeout) {
      playToneWithVisual(NOTE_FREQUENCIES[`${NOTE_NAMES[noteIdx]}4`] || 261.63, 0.3);
    }

    const nextDelay = isPractice ? 2000 : 1200;
    setTimeout(() => {
      if (isPractice) {
        startRound();
      } else if (round >= config.rounds) {
        setPhase('done');
      } else {
        startRound();
      }
    }, nextDelay);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (phase === 'done') {
    return (
      <div className="min-h-screen px-4 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-6xl"
          >
            🏆
          </motion.div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Game Complete!</h1>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Score', value: score },
              { label: 'Correct', value: `${results.filter(r => r.correct).length}/${config.rounds}` },
              { label: 'Best Streak', value: `🔥 ${bestStreak}` },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="glass-card p-4"
              >
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-zinc-500">{s.label}</div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={startGame} className="flex-1 rounded-full py-3 font-semibold text-white transition-all duration-300 ease-out hover:opacity-90" style={{ background: ACCENT }}>Play Again</button>
            <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-full bg-white/5 py-3 font-medium text-zinc-300 transition-all duration-300 ease-out hover:bg-white/10">Dashboard</button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="min-h-screen px-4 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl"
            style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}
          >
            <span className="text-4xl">🎵</span>
          </motion.div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: ACCENT }}>Note ID</h1>
          <p className="mt-2 text-zinc-500">Identify notes by ear</p>
          <div className="mt-8">
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Select Difficulty</h3>
            <div className="flex gap-3 justify-center">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ease-out ${difficulty === d ? 'text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'}`}
                  style={difficulty === d ? { background: ACCENT } : {}}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-600">{config.options} notes • {config.rounds} rounds{config.timeLimit ? ` • ${config.timeLimit}s timer` : ''}</p>
          </div>
          <button onClick={startGame} className="mt-8 rounded-full px-6 py-2.5 font-semibold text-white transition-all duration-300 ease-out hover:opacity-90" style={{ background: ACCENT }}>
            {isPractice ? '🎓 Start Practicing' : 'Start Game'}
          </button>
          {isPractice && (
            <p className="mt-3 text-xs text-zinc-600">Practice mode — no scores, just learn</p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-10">
      <FeedbackOverlay correct={feedback === 'correct'} show={showFeedbackOverlay} streak={streak} onDone={() => setShowFeedbackOverlay(false)} />

      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-white transition-colors duration-300">← Back</button>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: ACCENT }}>🎵 Note ID</h1>
          <div className="flex items-center gap-2">
            {isPractice && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${ACCENT}20`, color: ACCENT }}>Practice</span>}
            {!isPractice && <div className="text-sm text-zinc-500">Score: {score}</div>}
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full"
            style={{ background: ACCENT }}
            animate={{ width: isPractice ? '100%' : `${(round / config.rounds) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {!isPractice && config.timeLimit > 0 && (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className={`h-full rounded-full transition-colors`}
              style={{ background: timeLeft < 3 ? '#f87171' : ACCENT, width: `${(timeLeft / config.timeLimit) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Wave Visualizer */}
        <div className="mt-6">
          <WaveVisualizer active={isPlaying} color={ACCENT} height={50} />
        </div>

        <div className="mt-4 text-center">
          <motion.button
            onClick={() => playToneWithVisual(NOTE_FREQUENCIES[`${NOTE_NAMES[targetNote]}4`] || 261.63, 0.6)}
            whileTap={{ scale: 0.92 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-4xl transition-all duration-300 ease-out hover:bg-white/10 backdrop-blur-xl"
          >
            🔊
          </motion.button>
          <p className="mt-3 text-sm text-zinc-500">Tap to replay</p>
        </div>

        <AnimatePresence mode="popLayout">
          <motion.div
            key={targetNote}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="mt-6 grid grid-cols-2 gap-2"
          >
            {options.map((idx) => {
              const name = NOTE_NAMES[idx];
              const isTarget = idx === targetNote;
              let btnStyle: React.CSSProperties = {};
              let btnClass = 'glass-card text-white';
              if (feedback) {
                if (isTarget) {
                  btnClass = 'border-2 text-white';
                  btnStyle = { borderColor: '#4ADE80', background: 'rgba(74,222,128,0.1)' };
                } else if (!isTarget && feedback === 'wrong') {
                  btnClass = 'glass-card opacity-40';
                }
              }
              return (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => phase === 'playing' && handleAnswer(idx)}
                  className={`rounded-2xl py-4 text-lg font-semibold transition-all duration-300 ease-out ${btnClass}`}
                  style={btnStyle}
                  disabled={phase === 'feedback'}
                >
                  {name}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 text-center">
          {!isPractice && <div className="text-sm text-zinc-500">🔥 Streak: {streak} • Round {round}/{config.rounds}</div>}
          {isPractice && <div className="text-sm text-zinc-500">🎓 Practice mode • Round {round}</div>}
        </div>
      </div>
    </div>
  );
}
