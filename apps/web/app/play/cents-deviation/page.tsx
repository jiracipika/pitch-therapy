'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';

const ACCENT = '#84CC16';
const CENTS_RANGE = 50;

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFF_CONFIG: Record<Difficulty, { label: string; centsRange: number; rounds: number }> = {
  easy: { label: 'Easy', centsRange: 50, rounds: 6 },
  medium: { label: 'Medium', centsRange: 30, rounds: 8 },
  hard: { label: 'Hard', centsRange: 15, rounds: 10 },
};

export default function CentsDeviationPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'reveal' | 'done'>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [baseNote, setBaseNote] = useState('A4');
  const [baseFreq, setBaseFreq] = useState(440);
  const [actualCents, setActualCents] = useState(0);
  const [needlePos, setNeedlePos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ round: number; note: string; actualCents: number; guessCents: number; points: number }[]>([]);
  const meterRef = useRef<HTMLDivElement>(null);

  const config = DIFF_CONFIG[difficulty];
  const totalRounds = config.rounds;

  const playRefAndDeviation = useCallback((freq: number, cents: number) => {
    playTone(freq, 0.8);
    setTimeout(() => {
      const deviatedFreq = freq * Math.pow(2, cents / 1200);
      playTone(deviatedFreq, 1.2);
    }, 1000);
  }, []);

  const pickRound = () => {
    const noteIdx = Math.floor(Math.random() * 12);
    const note = NOTE_NAMES[noteIdx];
    const freq = NOTE_FREQUENCIES[`${note}4`] || 261.63;
    const cents = Math.round((Math.random() * 2 - 1) * config.centsRange);
    const clampedCents = Math.max(-config.centsRange, Math.min(config.centsRange, cents));

    setBaseNote(`${note}4`);
    setBaseFreq(freq);
    setActualCents(clampedCents);
    setNeedlePos(0);
    setSubmitted(false);

    // Auto-play reference then deviated tone so user hears both immediately
    playRefAndDeviation(freq, clampedCents);
    return { note, freq, cents: clampedCents };
  };

  const startGame = () => {
    setRound(0); setScore(0); setStreak(0); setBestStreak(0); setResults([]);
    nextRound();
  };

  const nextRound = () => {
    pickRound();
    setPhase('playing');
    setRound(r => r + 1);
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    const error = Math.abs(needlePos - actualCents);
    const points = Math.max(0, Math.round((1 - error / config.centsRange) * 100));
    const correct = error <= 5;

    setScore(s => s + points);
    if (correct) setStreak(s => { const ns = s + 1; setBestStreak(b => Math.max(b, ns)); return ns; });
    else setStreak(0);
    setResults(r => [...r, { round, note: baseNote, actualCents, guessCents: needlePos, points }]);
    setPhase('reveal');
  };

  const handleDrag = useCallback((clientX: number) => {
    if (!meterRef.current || submitted) return;
    const rect = meterRef.current.getBoundingClientRect();
    const pct = (clientX - rect.left) / rect.width;
    const cents = Math.round((pct - 0.5) * 2 * CENTS_RANGE);
    setNeedlePos(Math.max(-CENTS_RANGE, Math.min(CENTS_RANGE, cents)));
  }, [submitted]);

  if (phase === 'done') {
    return (
      <div className="min-h-screen px-4 pt-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-6xl">🎯</motion.div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Cents Deviation Complete!</h1>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Score', value: score },
              { label: 'Accuracy', value: `${results.filter(r => Math.abs(r.guessCents - r.actualCents) <= 5).length}/${totalRounds}` },
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
            <span className="text-4xl">🎯</span>
          </motion.div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: ACCENT }}>Cents Deviation</h1>
          <p className="mt-2 text-zinc-500">Detect microtonal sharp/flat deviations</p>

          {/* How to play */}
          <div className="mt-6 rounded-2xl p-4 text-left" style={{ background: 'rgba(132,204,22,0.06)', border: '1px solid rgba(132,204,22,0.15)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>How to Play</p>
            <ol className="space-y-1.5 text-sm text-zinc-400">
              <li>1. Hear a reference note, then a slightly detuned version</li>
              <li>2. Drag the needle to match the deviation in cents</li>
              <li>3. Within ±5¢ = correct; wider = partial credit</li>
              <li>4. Tap "Play Both" to replay both notes anytime</li>
            </ol>
          </div>

          <div className="mt-6 flex gap-2 justify-center">
            {(Object.keys(DIFF_CONFIG) as Difficulty[]).map(d => (
              <button key={d} onClick={() => setDifficulty(d)} className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${difficulty === d ? 'text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`} style={difficulty === d ? { background: ACCENT } : {}}>{DIFF_CONFIG[d].label}</button>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-600">±{config.centsRange} cents · {config.rounds} rounds</p>
          <button onClick={startGame} className="mt-6 rounded-full px-6 py-2.5 font-semibold text-white hover:opacity-90 transition-all" style={{ background: ACCENT }}>Start Game</button>
        </motion.div>
      </div>
    );
  }

  const needlePct = 50 + (needlePos / CENTS_RANGE) * 45;
  const actualPct = 50 + (actualCents / CENTS_RANGE) * 45;

  return (
    <div className="min-h-screen px-4 pt-10">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-white transition-colors">← Back</button>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: ACCENT }}>🎯 Cents Deviation</h1>
          <div className="text-sm text-zinc-500">Score: {score}</div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <motion.div className="h-full rounded-full" style={{ background: ACCENT }} animate={{ width: `${(round / totalRounds) * 100}%` }} transition={{ duration: 0.5 }} />
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-400">Reference note: <span className="font-bold text-white">{baseNote}</span></p>
          <p className="mt-1 text-xs text-zinc-600">Listen to both notes, then set the needle</p>
        </div>

        {/* Play buttons */}
        <div className="mt-6 flex justify-center gap-4">
          <motion.button onClick={() => playTone(baseFreq, 0.8)} whileTap={{ scale: 0.92 }} className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-xl hover:bg-white/10 transition-all">
            🔊
          </motion.button>
          <motion.button onClick={() => playRefAndDeviation(baseFreq, actualCents)} whileTap={{ scale: 0.92 }} className="flex h-14 items-center justify-center rounded-xl px-4 text-sm font-medium transition-all" style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}`, color: ACCENT }}>
            🔊+🔊 Play Both
          </motion.button>
        </div>

        {/* Cents meter */}
        <div className="mt-8 px-2">
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-zinc-600">Flat -{CENTS_RANGE}¢</span>
            <span className="text-[10px] text-zinc-600">Perfect 0¢</span>
            <span className="text-[10px] text-zinc-600">Sharp +{CENTS_RANGE}¢</span>
          </div>
          <div
            ref={meterRef}
            className="relative h-20 rounded-2xl cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onPointerDown={(e) => { setIsDragging(true); handleDrag(e.clientX); }}
            onPointerMove={(e) => { if (isDragging) handleDrag(e.clientX); }}
            onPointerUp={() => setIsDragging(false)}
            onPointerLeave={() => setIsDragging(false)}
          >
            {/* Center line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-zinc-700" />
            {/* Zone markers */}
            {[-40, -30, -20, -10, 10, 20, 30, 40].map(c => (
              <div key={c} className="absolute top-0 bottom-0 w-px bg-zinc-800/50" style={{ left: `${50 + (c / CENTS_RANGE) * 45}%` }} />
            ))}
            {/* Needle */}
            <motion.div
              className="absolute top-2 bottom-2 w-1 rounded-full z-10"
              style={{ left: `${needlePct}%`, marginLeft: '-2px', backgroundColor: ACCENT, boxShadow: `0 0 10px ${ACCENT}60` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            {/* Actual (revealed) */}
            {submitted && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                className="absolute top-4 bottom-4 w-1 rounded-full"
                style={{ left: `${actualPct}%`, marginLeft: '-2px', backgroundColor: '#F87171' }}
              />
            )}
          </div>
          <div className="mt-2 text-center text-lg font-bold" style={{ color: ACCENT }}>
            {needlePos > 0 ? '+' : ''}{needlePos}¢
          </div>
        </div>

        {/* Reveal */}
        <AnimatePresence>
          {submitted && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl p-4 text-center" style={{ background: 'rgba(132,204,22,0.08)', border: '1px solid rgba(132,204,22,0.2)' }}>
              <p className="text-sm text-zinc-400">Actual deviation: <span className="font-bold text-white">{actualCents > 0 ? '+' : ''}{actualCents}¢</span></p>
              <p className="text-sm text-zinc-400">Your guess: <span className="font-bold text-white">{needlePos > 0 ? '+' : ''}{needlePos}¢</span></p>
              <p className="mt-1 text-sm font-bold" style={{ color: Math.abs(needlePos - actualCents) <= 5 ? '#4ADE80' : '#FBBF24' }}>
                {Math.abs(needlePos - actualCents)}¢ error
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit / Next */}
        <div className="mt-6">
          {!submitted ? (
            <button onClick={handleSubmit} className="w-full rounded-full py-3 font-semibold text-white hover:opacity-90 transition-all" style={{ background: ACCENT }}>Lock In</button>
          ) : (
            <button onClick={() => { if (round >= totalRounds) { setPhase('done'); } else { nextRound(); } }} className="w-full rounded-full py-3 font-semibold text-white hover:opacity-90 transition-all" style={{ background: ACCENT }}>
              {round >= totalRounds ? 'See Results' : 'Next Round →'}
            </button>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-zinc-500">
          🔥 {streak} streak • Round {round}/{totalRounds} • {config.label}
        </div>
      </div>
    </div>
  );
}
