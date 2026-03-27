'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';
import FeedbackOverlay from '@/components/FeedbackOverlay';

const ACCENT = '#D946EF';

const INTERVALS = [
  { name: 'Unison', semitones: 0 },
  { name: 'm2', semitones: 1 },
  { name: 'M2', semitones: 2 },
  { name: 'm3', semitones: 3 },
  { name: 'M3', semitones: 4 },
  { name: 'P4', semitones: 5 },
  { name: 'Tritone', semitones: 6 },
  { name: 'P5', semitones: 7 },
  { name: 'm6', semitones: 8 },
  { name: 'M6', semitones: 9 },
  { name: 'm7', semitones: 10 },
  { name: 'M7', semitones: 11 },
  { name: 'Octave', semitones: 12 },
];

type IntervalMode = 'ascending' | 'descending' | 'harmonic';

const MODE_CONFIG: Record<IntervalMode, { label: string; pool: number[] }> = {
  ascending: { label: 'Ascending', pool: [1, 2, 3, 4, 5, 7, 8, 9, 12] },
  descending: { label: 'Descending', pool: [1, 2, 3, 4, 5, 7, 8, 9, 12] },
  harmonic: { label: 'Harmonic', pool: [3, 4, 5, 7, 12] },
};

const TOTAL_ROUNDS = 8;

export default function IntervalArcherPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'feedback' | 'done'>('setup');
  const [intervalMode, setIntervalMode] = useState<IntervalMode>('ascending');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [rootNote, setRootNote] = useState('A3');
  const [rootFreq, setRootFreq] = useState(220);
  const [targetInterval, setTargetInterval] = useState(INTERVALS[4]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<string | null>(null);
  const [results, setResults] = useState<{ round: number; root: string; interval: string; answer: string; correct: boolean; points: number; semitonesOff: number }[]>([]);
  const roundStartRef = useRef(0);

  const pool = MODE_CONFIG[intervalMode].pool;

  const pickRound = () => {
    const noteIdx = Math.floor(Math.random() * 12);
    const note = NOTE_NAMES[noteIdx];
    const freq = NOTE_FREQUENCIES[`${note}3`] || 220;
    const intervalSemitones = pool[Math.floor(Math.random() * pool.length)];
    const interval = INTERVALS[intervalSemitones];

    setRootNote(`${note}3`);
    setRootFreq(freq);
    setTargetInterval(interval);
    setFeedback(null);
    setSelectedInterval(null);
    return { note, freq, interval };
  };

  const playInterval = (freq: number, semitones: number, mode: IntervalMode) => {
    const secondFreq = freq * Math.pow(2, semitones / 12);
    if (mode === 'ascending') {
      playTone(freq, 0.5);
      setTimeout(() => playTone(secondFreq, 0.8), 550);
    } else if (mode === 'descending') {
      playTone(secondFreq, 0.5);
      setTimeout(() => playTone(freq, 0.8), 550);
    } else {
      // harmonic: play both at once
      const ctx = new AudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.frequency.value = freq;
      osc2.frequency.value = secondFreq;
      osc1.type = 'sine';
      osc2.type = 'sine';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.3);
      osc2.stop(ctx.currentTime + 1.3);
    }
  };

  const startGame = () => {
    setRound(0); setScore(0); setStreak(0); setBestStreak(0); setResults([]);
    nextRound();
  };

  const nextRound = () => {
    const { freq, interval } = pickRound();
    playInterval(freq, interval.semitones, intervalMode);
    setPhase('playing');
    setRound(r => r + 1);
    roundStartRef.current = Date.now();
  };

  const handleAnswer = (semitones: number, name: string) => {
    if (feedback) return;
    const correct = semitones === targetInterval.semitones;
    const elapsed = Date.now() - roundStartRef.current;
    const semitonesOff = Math.abs(semitones - targetInterval.semitones);

    let points = 0;
    if (correct) {
      points = Math.max(10, Math.round(120 - elapsed / 100));
    } else {
      // Partial credit for close intervals (arrow metaphor)
      if (semitonesOff === 1) points = 30;
      else if (semitonesOff === 2) points = 10;
    }

    setSelectedInterval(name);
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) {
      setShowFeedbackOverlay(true);
      setStreak(s => { const ns = s + 1; setBestStreak(b => Math.max(b, ns)); return ns; });
    } else {
      setStreak(0);
    }
    setScore(s => s + points);
    setResults(r => [...r, { round, root: rootNote, interval: targetInterval.name, answer: name, correct, points, semitonesOff }]);

    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) { setPhase('done'); }
      else { nextRound(); }
    }, 1200);
  };

  if (phase === 'done') {
    return (
      <div className="min-h-screen px-4 pt-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-6xl">🏹</motion.div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Interval Archer Complete!</h1>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Score', value: score },
              { label: 'Hit', value: `${results.filter(r => r.correct).length}/${TOTAL_ROUNDS}` },
              { label: 'Best Streak', value: `🔥 ${bestStreak}` },
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
            <span className="text-4xl">🏹</span>
          </motion.div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: ACCENT }}>Interval Archer</h1>
          <p className="mt-2 text-zinc-500">Identify intervals — closer to bullseye = more points</p>
          <div className="mt-8">
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Mode</h3>
            <div className="flex gap-2 justify-center">
              {(Object.keys(MODE_CONFIG) as IntervalMode[]).map(m => (
                <button key={m} onClick={() => setIntervalMode(m)} className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${intervalMode === m ? 'text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`} style={intervalMode === m ? { background: ACCENT } : {}}>{MODE_CONFIG[m].label}</button>
              ))}
            </div>
          </div>
          <button onClick={startGame} className="mt-8 rounded-full px-6 py-2.5 font-semibold text-white hover:opacity-90 transition-all" style={{ background: ACCENT }}>Start Game</button>
        </motion.div>
      </div>
    );
  }

  const activeIntervals = INTERVALS.filter(i => pool.includes(i.semitones));

  return (
    <div className="min-h-screen px-4 pt-10">
      <FeedbackOverlay correct={feedback === 'correct'} show={showFeedbackOverlay} streak={streak} onDone={() => setShowFeedbackOverlay(false)} />

      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-white transition-colors">← Back</button>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: ACCENT }}>🏹 Interval Archer</h1>
          <div className="text-sm text-zinc-500">Score: {score}</div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <motion.div className="h-full rounded-full" style={{ background: ACCENT }} animate={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }} transition={{ duration: 0.5 }} />
        </div>

        {/* Replay */}
        <div className="mt-8 text-center">
          <motion.button onClick={() => playInterval(rootFreq, targetInterval.semitones, intervalMode)} whileTap={{ scale: 0.92 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-3xl hover:bg-white/10 transition-all">
            🔊
          </motion.button>
          <p className="mt-3 text-sm text-zinc-500">Replay interval</p>
          <p className="mt-1 text-xs text-zinc-600">Root: {rootNote} · {MODE_CONFIG[intervalMode].label}</p>
        </div>

        {/* Arrow/target visual */}
        <div className="mt-6 flex justify-center">
          <div className="relative w-32 h-32">
            {[48, 36, 24, 12].map((size, i) => (
              <div key={i} className="absolute rounded-full border" style={{
                width: size, height: size, top: `calc(50% - ${size / 2}px)`, left: `calc(50% - ${size / 2}px)`,
                borderColor: `rgba(217,70,239,${0.1 + i * 0.08})`,
                backgroundColor: i === 3 ? 'rgba(217,70,239,0.15)' : 'transparent',
              }} />
            ))}
          </div>
        </div>

        {/* Interval buttons */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          {activeIntervals.map(interval => {
            const isTarget = feedback && interval.semitones === targetInterval.semitones;
            const isSelected = selectedInterval === interval.name;
            let bg = 'rgba(255,255,255,0.04)';
            let border = 'rgba(255,255,255,0.07)';

            if (isTarget) { bg = 'rgba(74,222,128,0.15)'; border = '#4ADE80'; }
            else if (isSelected && feedback === 'wrong') { bg = 'rgba(248,113,113,0.15)'; border = '#F87171'; }

            return (
              <motion.button
                key={interval.name}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleAnswer(interval.semitones, interval.name)}
                className="rounded-2xl py-4 font-semibold transition-all"
                style={{ background: bg, border: `1px solid ${border}` }}
                disabled={!!feedback}
              >
                <span className="text-white">{interval.name}</span>
                <span className="block text-xs text-zinc-500">{interval.semitones === 0 ? '' : interval.semitones === 12 ? '8va' : `${interval.semitones}st`}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mt-4 rounded-2xl p-4 text-center font-semibold ${feedback === 'correct' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
              {feedback === 'correct' ? '🎯 Bullseye!' : `It was ${targetInterval.name}`}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 text-center text-sm text-zinc-500">
          🔥 {streak} streak • Round {round}/{TOTAL_ROUNDS}
        </div>
      </div>
    </div>
  );
}
