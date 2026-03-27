'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';
import FeedbackOverlay from '@/components/FeedbackOverlay';

const ACCENT = '#F472B6'; // pink-400

const CHORD_TYPES = [
  { id: 'major', label: 'Major', symbol: '' },
  { id: 'minor', label: 'Minor', symbol: 'm' },
  { id: 'dim', label: 'Dim', symbol: 'dim' },
  { id: 'aug', label: 'Aug', symbol: 'aug' },
  { id: 'dom7', label: 'Dom 7', symbol: '7' },
  { id: 'min7', label: 'Min 7', symbol: 'm7' },
];

// Semitone intervals from root
const CHORD_INTERVALS: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  dom7: [0, 4, 7, 10],
  min7: [0, 3, 7, 10],
};

const ALL_NOTES = NOTE_NAMES;
const ROUNDS = 10;

function midiToFreq(midi: number) { return 440 * Math.pow(2, (midi - 69) / 12); }

function playChord(root: string, chordType: string) {
  const rootIdx = ALL_NOTES.indexOf(root as typeof ALL_NOTES[number]);
  if (rootIdx < 0) return;
  const intervals = CHORD_INTERVALS[chordType] || CHORD_INTERVALS.major;
  intervals.forEach((semi, i) => {
    const noteIdx = (rootIdx + semi) % 12;
    const note = ALL_NOTES[noteIdx];
    const freq = NOTE_FREQUENCIES[`${note}4`] || midiToFreq(60 + noteIdx);
    setTimeout(() => playTone(freq, 1.2), i * 30);
  });
}

export default function ChordDetectivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get('practice') === 'true';
  const [advanced, setAdvanced] = useState(false);
  const [phase, setPhase] = useState<'setup' | 'playing' | 'feedback' | 'done'>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [root, setRoot] = useState('');
  const [chordType, setChordType] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRoot, setSelectedRoot] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [results, setResults] = useState<{ round: number; correct: boolean; root: string; type: string; answer: string }[]>([]);
  const targetRootRef = useRef('');
  const targetTypeRef = useRef('');

  const nextChord = useCallback(() => {
    const r = ALL_NOTES[Math.floor(Math.random() * ALL_NOTES.length)];
    const ct = CHORD_TYPES[Math.floor(Math.random() * CHORD_TYPES.length)].id;
    setRoot(r); setChordType(ct);
    targetRootRef.current = r;
    targetTypeRef.current = ct;
    setSelectedType(''); setSelectedRoot('');
    setFeedback(null);
    playChord(r, ct);
  }, []);

  const startGame = () => {
    setRound(0); setScore(0); setStreak(0); setBestStreak(0); setResults([]);
    nextChord();
    setRound(1);
    setPhase('playing');
  };

  const submitAnswer = () => {
    const correctType = selectedType === targetTypeRef.current;
    const correctRoot = !advanced || selectedRoot === targetRootRef.current;
    const allCorrect = correctType && correctRoot;

    if (allCorrect) {
      setScore((s) => s + (advanced ? 150 : 100));
      setStreak((s) => { const ns = s + 1; setBestStreak((b) => Math.max(b, ns)); return ns; });
      setFeedback('correct');
      setShowOverlay(true);
    } else {
      setStreak(0);
      setFeedback('wrong');
    }

    setResults((r) => [...r, {
      round, correct: allCorrect,
      root: targetRootRef.current, type: targetTypeRef.current,
      answer: advanced ? `${selectedRoot} ${selectedType}` : selectedType,
    }]);
    setPhase('feedback');

    setTimeout(() => {
      if (isPractice) {
        nextChord(); setRound((r) => r + 1); setPhase('playing');
      } else if (round >= ROUNDS) {
        setPhase('done');
      } else {
        nextChord(); setRound((r) => r + 1); setPhase('playing');
      }
    }, isPractice ? 1500 : 1200);
  };

  if (phase === 'done') {
    const correct = results.filter(r => r.correct).length;
    return (
      <div className="min-h-screen px-4 pt-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-6xl">🕵️</motion.div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Case Closed!</h1>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Score', value: score },
              { label: 'Correct', value: `${correct}/${ROUNDS}` },
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
            <span className="text-4xl">🕵️</span>
          </motion.div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: ACCENT }}>Chord Detective</h1>
          <p className="mt-2 text-zinc-500">Identify chord quality by ear</p>

          {/* How to play */}
          <div className="mt-6 rounded-2xl p-4 text-left" style={{ background: 'rgba(244,114,182,0.06)', border: '1px solid rgba(244,114,182,0.15)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>How to Play</p>
            <ol className="space-y-1.5 text-sm text-zinc-400">
              <li>1. A chord plays — tap 🔊 to replay it</li>
              <li>2. Select the chord quality (Major, Minor, Dim…)</li>
              <li>3. Advanced mode: also identify the root note</li>
              <li>4. Hit Submit to lock in your answer</li>
            </ol>
          </div>

          <div className="mt-6">
            <label className="flex items-center justify-center gap-3 cursor-pointer">
              <span className="text-sm text-zinc-400">Advanced: Identify root note too</span>
              <div className={`w-12 h-7 rounded-full transition-colors relative ${advanced ? 'bg-[#F472B6]' : 'bg-white/10'}`} onClick={() => setAdvanced(!advanced)}>
                <motion.div className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow" animate={{ left: advanced ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
              </div>
            </label>
          </div>
          <button onClick={startGame} className="mt-8 rounded-full px-6 py-2.5 font-semibold text-white" style={{ background: ACCENT }}>
            {isPractice ? '🎓 Start Practicing' : 'Start Investigation'}
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
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: ACCENT }}>🕵️ Chord Detective</h1>
          <div className="text-sm text-zinc-500">Score: {score}</div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <motion.div className="h-full rounded-full" style={{ background: ACCENT }}
            animate={{ width: `${(round / (ROUNDS + 1)) * 100}%` }} transition={{ duration: 0.5 }} />
        </div>

        {/* Play chord button */}
        <div className="mt-8 flex justify-center">
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => playChord(root, chordType)}
            className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-5xl backdrop-blur-xl hover:bg-white/10 transition-colors">
            🔊
          </motion.button>
        </div>
        <p className="mt-3 text-center text-sm text-zinc-500">Tap to replay chord</p>

        {/* Chord quality cards */}
        <div className="mt-8">
          <p className="text-xs font-medium text-zinc-500 mb-3 text-center">Chord Quality</p>
          <div className="grid grid-cols-3 gap-2">
            {CHORD_TYPES.map((ct) => (
              <motion.button key={ct.id} whileTap={{ scale: 0.95 }} onClick={() => phase === 'playing' && setSelectedType(ct.id)}
                className={`rounded-2xl py-4 text-sm font-semibold transition-all duration-300 ${selectedType === ct.id ? 'text-white' : 'glass-card text-zinc-400'}`}
                style={selectedType === ct.id ? { background: `${ACCENT}30`, border: `2px solid ${ACCENT}` } : {}}>
                {ct.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Advanced: root selection */}
        {advanced && (
          <div className="mt-6">
            <p className="text-xs font-medium text-zinc-500 mb-3 text-center">Root Note</p>
            <div className="grid grid-cols-4 gap-2">
              {ALL_NOTES.map((note) => (
                <motion.button key={note} whileTap={{ scale: 0.95 }} onClick={() => setSelectedRoot(note)}
                  className={`rounded-xl py-3 text-sm font-semibold transition-all ${selectedRoot === note ? 'text-white' : 'glass-card text-zinc-400'}`}
                  style={selectedRoot === note ? { background: `${ACCENT}30`, border: `2px solid ${ACCENT}` } : {}}>
                  {note}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="mt-8">
          <motion.button whileTap={{ scale: 0.97 }} onClick={submitAnswer}
            disabled={!selectedType || (advanced && !selectedRoot)}
            className={`w-full rounded-full py-3.5 font-semibold transition-all ${selectedType && (!advanced || selectedRoot) ? 'text-white' : 'text-zinc-600 cursor-not-allowed'}`}
            style={selectedType && (!advanced || selectedRoot) ? { background: ACCENT } : { background: 'rgba(255,255,255,0.05)' }}>
            Submit
          </motion.button>
        </div>

        {/* Feedback */}
        {feedback && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`mt-4 rounded-2xl p-4 text-center text-sm font-semibold ${feedback === 'correct' ? 'text-green-400 border border-green-400/30 bg-green-400/10' : 'text-red-400 border border-red-400/30 bg-red-400/10'}`}>
            {feedback === 'correct' ? '✓ Correct!' : `✗ It was ${root} ${CHORD_TYPES.find(c => c.id === chordType)?.label}`}
          </motion.div>
        )}

        <div className="mt-4 text-center text-sm text-zinc-500">
          🔥 {streak} • Round {round}/{ROUNDS}
          {isPractice && <span className="ml-2 text-pink-400">Practice</span>}
        </div>
      </div>
    </div>
  );
}
