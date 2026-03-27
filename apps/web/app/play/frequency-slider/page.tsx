'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { playTone } from '@/lib/audio';

const ACCENT = '#06B6D4';
const MIN_FREQ = 80;
const MAX_FREQ = 1200;
const TOTAL_ROUNDS = 6;

function freqToPos(freq: number): number {
  const minLog = Math.log(MIN_FREQ);
  const maxLog = Math.log(MAX_FREQ);
  return ((Math.log(freq) - minLog) / (maxLog - minLog)) * 100;
}

function posToFreq(pos: number): number {
  const minLog = Math.log(MIN_FREQ);
  const maxLog = Math.log(MAX_FREQ);
  return Math.exp(minLog + (pos / 100) * (maxLog - minLog));
}

const REFERENCE_NOTES = [
  { name: 'C3', freq: 130.81 }, { name: 'E3', freq: 164.81 },
  { name: 'A3', freq: 220 }, { name: 'C4', freq: 261.63 },
  { name: 'E4', freq: 329.63 }, { name: 'A4', freq: 440 },
  { name: 'C5', freq: 523.25 }, { name: 'E5', freq: 659.25 },
  { name: 'A5', freq: 880 }, { name: 'C6', freq: 1046.5 },
];

export default function FrequencySliderPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'reveal' | 'done'>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetFreq, setTargetFreq] = useState(440);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ round: number; freq: number; answer: number; centsOff: number; points: number }[]>([]);
  const barRef = useRef<HTMLDivElement>(null);

  const pickTarget = () => {
    const min = Math.log(MIN_FREQ);
    const max = Math.log(MAX_FREQ);
    const freq = Math.exp(min + Math.random() * (max - min));
    const rounded = Math.round(freq * 10) / 10;
    setTargetFreq(rounded);
    setSliderPos(50);
    setSubmitted(false);
    return rounded;
  };

  const startGame = () => {
    setRound(0); setScore(0); setStreak(0); setResults([]);
    nextRound();
  };

  const nextRound = () => {
    pickTarget();
    playTone(targetFreq, 1.0);
    setPhase('playing');
    setRound(r => r + 1);
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const answerFreq = posToFreq(sliderPos);
    const centsOff = Math.round(1200 * Math.log2(answerFreq / targetFreq));
    const accuracy = Math.max(0, 1 - Math.abs(centsOff) / 100);
    const points = Math.round(accuracy * 150);
    const correct = Math.abs(centsOff) <= 15;

    setScore(s => s + points);
    if (correct) setStreak(s => s + 1); else setStreak(0);
    setResults(r => [...r, { round, freq: targetFreq, answer: answerFreq, centsOff, points }]);
    setPhase('reveal');
  };

  const handleDrag = useCallback((clientX: number) => {
    if (!barRef.current || submitted) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  }, [submitted]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handleDrag(e.clientX);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isDragging) handleDrag(e.clientX);
  }, [isDragging, handleDrag]);

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // Play the selected frequency while dragging
      const freq = posToFreq(sliderPos);
      playTone(freq, 0.3);
    }
  }, [isDragging, sliderPos]);

  if (phase === 'done') {
    const avgCents = results.length > 0 ? Math.round(results.reduce((s, r) => s + Math.abs(r.centsOff), 0) / results.length) : 0;
    return (
      <div className="min-h-screen px-4 pt-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-6xl">📊</motion.div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Slider Complete!</h1>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Score', value: score },
              { label: 'Avg Error', value: `${avgCents}¢` },
              { label: 'Best Streak', value: `🔥 ${streak}` },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="glass-card p-4">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-zinc-500">{s.label}</div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={startGame} className="flex-1 rounded-full py-3 font-semibold text-white hover:opacity-90 transition-all" style={{ background: ACCENT }}>Play Again</button>
            <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-full bg-white/5 py-3 font-medium text-zinc-300 hover:bg-white/10 transition-all">Dashboard</button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="min-h-screen px-4 pt-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }} className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}>
            <span className="text-4xl">↔️</span>
          </motion.div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: ACCENT }}>Frequency Slider</h1>
          <p className="mt-2 text-zinc-500">Drag the slider to match a hidden frequency</p>
          <p className="mt-1 text-xs text-zinc-600">80 Hz — 1,200 Hz · Logarithmic scale</p>
          <button onClick={startGame} className="mt-8 rounded-full px-6 py-2.5 font-semibold text-white hover:opacity-90 transition-all" style={{ background: ACCENT }}>Start Game</button>
        </motion.div>
      </div>
    );
  }

  const answerFreq = posToFreq(sliderPos);
  const targetPos = freqToPos(targetFreq);

  return (
    <div className="min-h-screen px-4 pt-10">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-white transition-colors">← Back</button>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: ACCENT }}>↔️ Frequency Slider</h1>
          <div className="text-sm text-zinc-500">Score: {score}</div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <motion.div className="h-full rounded-full" style={{ background: ACCENT }} animate={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }} transition={{ duration: 0.5 }} />
        </div>

        <div className="mt-10 text-center">
          <motion.button onClick={() => playTone(targetFreq, 1.0)} whileTap={{ scale: 0.92 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-3xl hover:bg-white/10 transition-all">
            🔊
          </motion.button>
          <p className="mt-3 text-sm text-zinc-500">Tap to replay tone</p>
          <p className="mt-1 text-xs text-zinc-600">Your pick: {answerFreq.toFixed(1)} Hz</p>
        </div>

        {/* Slider */}
        <div className="mt-8 px-2">
          <div className="relative h-12 flex items-center">
            <div
              ref={barRef}
              className="absolute inset-0 rounded-full cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
            {/* Reference lines */}
            {REFERENCE_NOTES.map(n => (
              <div key={n.name} className="absolute top-0 bottom-0 w-px bg-zinc-800" style={{ left: `${freqToPos(n.freq)}%` }}>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-zinc-700 whitespace-nowrap">{n.name}</span>
              </div>
            ))}
            {/* Handle */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full border-2 cursor-grab active:cursor-grabbing"
              style={{ left: `${sliderPos}%`, marginLeft: '-12px', borderColor: ACCENT, backgroundColor: `${ACCENT}30`, boxShadow: `0 0 12px ${ACCENT}50` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            {/* Target (revealed) */}
            {submitted && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                className="absolute top-2 bottom-2 w-1 rounded-full"
                style={{ left: `${targetPos}%`, marginLeft: '-2px', backgroundColor: '#4ADE80' }}
              />
            )}
          </div>
          <div className="flex justify-between mt-6">
            <span className="text-[10px] text-zinc-600">80 Hz</span>
            <span className="text-[10px] text-zinc-600">1,200 Hz</span>
          </div>
        </div>

        {/* Reveal */}
        <AnimatePresence>
          {submitted && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl p-4 text-center" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <p className="text-sm text-zinc-400">Target: <span className="font-bold text-white">{targetFreq.toFixed(1)} Hz</span></p>
              <p className="text-sm text-zinc-400">Your answer: <span className="font-bold text-white">{answerFreq.toFixed(1)} Hz</span></p>
              <p className="mt-2 text-lg font-bold" style={{ color: Math.abs(1200 * Math.log2(answerFreq / targetFreq)) <= 15 ? '#4ADE80' : '#FBBF24' }}>
                {Math.abs(Math.round(1200 * Math.log2(answerFreq / targetFreq)))}¢ off
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit / Next */}
        <div className="mt-6">
          {!submitted ? (
            <button onClick={handleSubmit} className="w-full rounded-full py-3 font-semibold text-white hover:opacity-90 transition-all" style={{ background: ACCENT }}>Lock In</button>
          ) : (
            <button onClick={() => { if (round >= TOTAL_ROUNDS) { setPhase('done'); } else { nextRound(); } }} className="w-full rounded-full py-3 font-semibold text-white hover:opacity-90 transition-all" style={{ background: ACCENT }}>
              {round >= TOTAL_ROUNDS ? 'See Results' : 'Next Round →'}
            </button>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-zinc-500">
          🔥 {streak} streak • Round {round}/{TOTAL_ROUNDS}
        </div>
      </div>
    </div>
  );
}
