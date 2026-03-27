'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';
import FeedbackOverlay from '@/components/FeedbackOverlay';

const ACCENT = '#FB923C'; // orange-400
const DURATION_OPTIONS = [30, 60];

const ALL_NOTES = NOTE_NAMES;

function pickRandom() {
  return ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)];
}

export default function SpeedRoundPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'done'>('setup');
  const [duration, setDuration] = useState(30);
  const [currentNote, setCurrentNote] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextNote = useCallback(() => {
    const n = pickRandom();
    setCurrentNote(n);
    return n;
  }, []);

  const startGame = () => {
    setScore(0); setCorrect(0); setTotal(0); setStreak(0); setBestStreak(0);
    setTimeLeft(duration);
    setFeedback(null);
    nextNote();
    setPhase('playing');
    playTone(NOTE_FREQUENCIES['A4'] || 440, 0.1); // start beep

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setPhase('done');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleKeyTap = (note: string) => {
    if (phase !== 'playing') return;
    const isCorrect = note === currentNote;
    setTotal((t) => t + 1);

    if (isCorrect) {
      setCorrect((c) => c + 1);
      setScore((s) => s + 10 + streak * 2);
      setStreak((s) => {
        const ns = s + 1;
        setBestStreak((b) => Math.max(b, ns));
        return ns;
      });
      setFeedback('correct');
      setShowOverlay(true);
    } else {
      setStreak(0);
      setFeedback('wrong');
    }

    nextNote();
    playTone(NOTE_FREQUENCIES[`${note}4`] || 261.63, 0.15);

    setTimeout(() => setFeedback(null), 300);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (phase === 'done') {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="min-h-screen px-4 pt-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-6xl">⚡</motion.div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Time&apos;s Up!</h1>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { label: 'Score', value: score },
              { label: 'Accuracy', value: `${accuracy}%` },
              { label: 'Correct', value: `${correct}/${total}` },
              { label: 'Best Streak', value: `🔥 ${bestStreak}` },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="glass-card p-4">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-zinc-500">{s.label}</div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={startGame} className="flex-1 rounded-full py-3 font-semibold text-white" style={{ background: ACCENT }}>Play Again</button>
            <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-full bg-white/5 py-3 font-medium text-zinc-300">Dashboard</button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="min-h-screen px-4 pt-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}>
            <span className="text-4xl">⚡</span>
          </motion.div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: ACCENT }}>Speed Round</h1>
          <p className="mt-2 text-zinc-500">Identify notes as fast as you can</p>
          <div className="mt-8">
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Duration</h3>
            <div className="flex gap-3 justify-center">
              {DURATION_OPTIONS.map((d) => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`rounded-full px-6 py-2 text-sm font-medium transition-all duration-300 ${duration === d ? 'text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                  style={duration === d ? { background: ACCENT } : {}}>
                  {d}s
                </button>
              ))}
            </div>
          </div>
          <button onClick={startGame} className="mt-8 rounded-full px-6 py-2.5 font-semibold text-white" style={{ background: ACCENT }}>
            Start Sprint
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-10">
      <FeedbackOverlay correct={feedback === 'correct'} show={showOverlay} streak={streak} onDone={() => setShowOverlay(false)} />
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-white transition-colors">← Back</button>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: ACCENT }}>⚡ Speed Round</h1>
          <div className="text-sm text-zinc-500">Score: {score}</div>
        </div>

        {/* Timer bar */}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
          <motion.div className="h-full rounded-full" style={{ background: timeLeft < 5 ? '#f87171' : ACCENT }}
            animate={{ width: `${(timeLeft / duration) * 100}%` }} transition={{ duration: 0.5 }} />
        </div>

        {/* Flashcard */}
        <div className="mt-8 flex justify-center">
          <AnimatePresence mode="wait">
            <motion.div key={currentNote} initial={{ opacity: 0, scale: 0.8, rotateY: 90 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} exit={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              transition={{ duration: 0.2 }}
              className={`flex h-32 w-32 items-center justify-center rounded-3xl text-5xl font-bold ${feedback === 'correct' ? 'text-green-400' : feedback === 'wrong' ? 'text-red-400' : 'text-white'}`}
              style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(40px)' }}>
              {currentNote}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Piano keyboard */}
        <div className="mt-8 flex justify-center">
          <div className="flex">
            {ALL_NOTES.map((note, i) => {
              const isBlack = note.includes('#');
              if (isBlack) return null;
              const blackKey = i < 11 && ALL_NOTES[i + 1]?.includes('#');
              return (
                <div key={note} className="relative" style={{ marginRight: 2 }}>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleKeyTap(note)}
                    className="h-40 w-12 rounded-b-xl bg-white/10 border border-white/15 text-white font-bold text-sm flex items-end justify-center pb-3 hover:bg-white/15 transition-colors">
                    {note}
                  </motion.button>
                  {blackKey && (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleKeyTap(ALL_NOTES[i + 1])}
                      className="absolute -top-4 left-7 h-24 w-8 rounded-b-lg bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs flex items-end justify-center pb-2 z-10 hover:bg-zinc-700 transition-colors">
                      {ALL_NOTES[i + 1]}
                    </motion.button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-zinc-500">
          🔥 Streak: {streak} • {correct}/{total} correct • {timeLeft}s left
        </div>
      </div>
    </div>
  );
}
