'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { playTone, NOTE_FREQUENCIES } from '@/lib/audio';
import FeedbackOverlay from '@/components/FeedbackOverlay';

const ACCENT = '#6366F1';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

type Mode = 'chromatic' | 'diatonic' | 'key';

const MODE_CONFIG: Record<Mode, { label: string; keys: string[] }> = {
  chromatic: { label: 'Chromatic', keys: KEYS },
  diatonic: { label: 'Diatonic', keys: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
  key: { label: 'Key of G', keys: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'] },
};

export default function PianoTapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get('practice') === 'true';
  const [phase, setPhase] = useState<'setup' | 'playing' | 'feedback' | 'done'>('setup');
  const [mode, setMode] = useState<Mode>('diatonic');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [targetNote, setTargetNote] = useState('C');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [results, setResults] = useState<{ round: number; correct: boolean; points: number; target: string; answer: string }[]>([]);
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const totalRounds = 8;
  const roundStartRef = useRef(0);

  const pickTarget = useCallback(() => {
    const keys = MODE_CONFIG[mode].keys;
    return keys[Math.floor(Math.random() * keys.length)];
  }, [mode]);

  const startGame = () => {
    setRound(0); setScore(0); setStreak(0); setBestStreak(0); setResults([]);
    nextRound();
  };

  const nextRound = () => {
    const note = pickTarget();
    setTargetNote(note);
    setSelectedKey(null);
    setFeedback(null);
    setPhase('playing');
    setRound(r => r + 1);
    roundStartRef.current = Date.now();
    playTone(NOTE_FREQUENCIES[`${note}4`] || 261.63, 0.6);
  };

  const handleKeyTap = (key: string) => {
    if (phase !== 'playing' || feedback) return;
    const freq = NOTE_FREQUENCIES[`${key}4`] || 261.63;
    playTone(freq, 0.3);

    setSelectedKey(key);
    const correct = key === targetNote;
    const elapsed = Date.now() - roundStartRef.current;
    const points = correct ? Math.max(10, Math.round(100 - elapsed / 100)) : 0;

    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) {
      setFlashKey(key);
      setShowFeedbackOverlay(true);
      setStreak(s => { const ns = s + 1; setBestStreak(b => Math.max(b, ns)); return ns; });
    } else {
      setStreak(0);
    }
    if (!isPractice) setScore(s => s + points);
    setResults(r => [...r, { round, correct, points, target: targetNote, answer: key }]);

    setTimeout(() => setFlashKey(null), 400);

    setTimeout(() => {
      if (isPractice) { nextRound(); }
      else if (round >= totalRounds) { setPhase('done'); }
      else { nextRound(); }
    }, isPractice ? 800 : 1200);
  };

  const activeKeys = MODE_CONFIG[mode].keys;

  // For chromatic mode: lay out a proper piano with absolute-positioned black keys
  const ALL_WHITE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const BLACK_POSITIONS: Record<string, number> = { 'C#': 1, 'D#': 2, 'F#': 4, 'G#': 5, 'A#': 6 };
  const isChromaticMode = mode === 'chromatic';

  if (phase === 'done') {
    return (
      <div className="min-h-screen px-4 pt-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-6xl">🎹</motion.div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Piano Tap Complete!</h1>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Score', value: score },
              { label: 'Hit', value: `${results.filter(r => r.correct).length}/${totalRounds}` },
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
            <span className="text-4xl">🎹</span>
          </motion.div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: ACCENT }}>Piano Tap</h1>
          <p className="mt-2 text-zinc-500">Tap the correct key after hearing the note</p>

          {/* How to play */}
          <div className="mt-6 rounded-2xl p-4 text-left" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>How to Play</p>
            <ol className="space-y-1.5 text-sm text-zinc-400">
              <li>1. A note plays — identify it by ear</li>
              <li>2. Tap 🔊 to replay if needed</li>
              <li>3. Tap the matching key on the piano</li>
              <li>4. Score more by answering quickly</li>
            </ol>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Keyboard Mode</h3>
            <div className="flex gap-2 justify-center flex-wrap">
              {(Object.keys(MODE_CONFIG) as Mode[]).map(m => (
                <button key={m} onClick={() => setMode(m)} className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${mode === m ? 'text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`} style={mode === m ? { background: ACCENT } : {}}>{MODE_CONFIG[m].label}</button>
              ))}
            </div>
          </div>
          <button onClick={startGame} className="mt-8 rounded-full px-6 py-2.5 font-semibold text-white hover:opacity-90 transition-all" style={{ background: ACCENT }}>Start Game</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-10">
      <FeedbackOverlay correct={feedback === 'correct'} show={showFeedbackOverlay} streak={streak} onDone={() => setShowFeedbackOverlay(false)} />

      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-white transition-colors">← Back</button>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: ACCENT }}>🎹 Piano Tap</h1>
          <div className="text-sm text-zinc-500">Score: {score}</div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <motion.div className="h-full rounded-full" style={{ background: ACCENT }} animate={{ width: `${(round / totalRounds) * 100}%` }} transition={{ duration: 0.5 }} />
        </div>

        {/* Replay */}
        <div className="mt-8 text-center">
          <motion.button onClick={() => playTone(NOTE_FREQUENCIES[`${targetNote}4`] || 261.63, 0.6)} whileTap={{ scale: 0.92 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-3xl hover:bg-white/10 transition-all">
            🔊
          </motion.button>
          <p className="mt-3 text-sm text-zinc-500">Tap to replay note</p>
        </div>

        {/* Piano keyboard */}
        <div className="mt-8">
          {isChromaticMode ? (
            /* Proper piano layout: white keys with black keys overlaid */
            <div className="relative flex justify-center" style={{ height: 128 }}>
              {/* White keys */}
              {ALL_WHITE.map((key) => {
                const isTarget = feedback && key === targetNote;
                const isSelected = selectedKey === key;
                let bg = 'rgba(255,255,255,0.08)';
                let border = 'rgba(255,255,255,0.12)';
                if (isTarget) { bg = 'rgba(74,222,128,0.25)'; border = '#4ADE80'; }
                else if (isSelected && feedback === 'wrong') { bg = 'rgba(248,113,113,0.2)'; border = '#F87171'; }
                if (flashKey === key) { bg = 'rgba(99,102,241,0.4)'; border = ACCENT; }
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleKeyTap(key)}
                    disabled={!!feedback}
                    className="relative rounded-b-lg flex items-end justify-center pb-2 transition-all duration-150"
                    style={{ width: 40, height: 128, background: bg, border: `1px solid ${border}`, marginRight: 2 }}
                  >
                    <span className="text-xs font-bold text-zinc-300">{key}</span>
                  </motion.button>
                );
              })}
              {/* Black keys — absolutely positioned */}
              {Object.entries(BLACK_POSITIONS).map(([key, pos]) => {
                const isTarget = feedback && key === targetNote;
                const isSelected = selectedKey === key;
                let bg = 'rgba(20,20,30,0.95)';
                let border = 'rgba(255,255,255,0.15)';
                if (isTarget) { bg = 'rgba(74,222,128,0.3)'; border = '#4ADE80'; }
                else if (isSelected && feedback === 'wrong') { bg = 'rgba(248,113,113,0.3)'; border = '#F87171'; }
                if (flashKey === key) { bg = 'rgba(99,102,241,0.6)'; border = ACCENT; }
                // Each white key is 42px wide; black key sits between pos-1 and pos
                const leftOffset = pos * 42 - 14;
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleKeyTap(key)}
                    disabled={!!feedback}
                    className="absolute top-0 rounded-b-md flex items-end justify-center pb-1.5 z-10 transition-all duration-150"
                    style={{ width: 28, height: 80, left: leftOffset, background: bg, border: `1px solid ${border}` }}
                  >
                    <span className="text-[9px] font-bold text-zinc-300">{key}</span>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            /* Non-chromatic: simple grid of note buttons */
            <div className="grid grid-cols-4 gap-2">
              {activeKeys.map(key => {
                const isTarget = feedback && key === targetNote;
                const isSelected = selectedKey === key;
                let bg = 'rgba(255,255,255,0.06)';
                let border = 'rgba(255,255,255,0.1)';
                if (isTarget) { bg = 'rgba(74,222,128,0.2)'; border = '#4ADE80'; }
                else if (isSelected && feedback === 'wrong') { bg = 'rgba(248,113,113,0.2)'; border = '#F87171'; }
                if (flashKey === key) { bg = `${ACCENT}40`; border = ACCENT; }
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => handleKeyTap(key)}
                    disabled={!!feedback}
                    className="rounded-2xl py-5 font-bold text-lg transition-all duration-150"
                    style={{ background: bg, border: `1px solid ${border}`, color: isTarget ? '#4ADE80' : 'rgba(255,255,255,0.8)' }}
                  >
                    {key}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Feedback banner */}
        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mt-6 rounded-2xl p-4 text-center font-semibold ${feedback === 'correct' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
              {feedback === 'correct' ? '✓ Correct!' : `✗ The note was ${targetNote}`}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 text-center text-sm text-zinc-500">
          🔥 {streak} streak • Round {round}/{totalRounds} • {MODE_CONFIG[mode].label}
        </div>
      </div>
    </div>
  );
}
