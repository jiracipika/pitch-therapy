'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';
import FeedbackOverlay from '@/components/FeedbackOverlay';

const ACCENT = '#FF2D55';

const CHORD_TYPES = [
  { id: 'major', label: 'Major', symbol: '' },
  { id: 'minor', label: 'Minor', symbol: 'm' },
  { id: 'dim', label: 'Dim', symbol: 'dim' },
  { id: 'aug', label: 'Aug', symbol: 'aug' },
  { id: 'dom7', label: 'Dom 7', symbol: '7' },
  { id: 'min7', label: 'Min 7', symbol: 'm7' },
];

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
      <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
        <div className="max-w-sm mx-auto px-4 pt-12">
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🕵️</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 24 }}>
              Case Closed!
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: ACCENT }}>{score}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Score</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{correct}/{ROUNDS}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Correct</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>🔥 {bestStreak}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Best Streak</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={startGame}>Play Again</button>
              <button className="ios-btn-secondary" onClick={() => router.push('/dashboard')}>Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
        <div className="max-w-sm mx-auto px-4 pt-12">
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🕵️</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Chord Detective</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>Identify chord quality by ear</div>

            <div className="ios-card" style={{ padding: 16, textAlign: 'left', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>How to Play</div>
              <ol style={{ fontSize: 14, color: 'var(--ios-label3)', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>1. A chord plays — tap 🔊 to replay it</li>
                <li>2. Select the chord quality (Major, Minor, Dim…)</li>
                <li>3. Advanced mode: also identify the root note</li>
                <li>4. Hit Submit to lock in your answer</li>
              </ol>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer' }}>
                <span style={{ fontSize: 14, color: 'var(--ios-label2)' }}>Advanced: Identify root note too</span>
                <div
                  style={{ width: 48, height: 28, borderRadius: 14, position: 'relative', background: advanced ? ACCENT : 'var(--ios-bg3)', transition: 'background 0.2s' }}
                  onClick={() => setAdvanced(!advanced)}
                >
                  <motion.div
                    style={{ position: 'absolute', top: 2, width: 24, height: 24, borderRadius: 12, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                    animate={{ left: advanced ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </div>
              </label>
            </div>
            <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={startGame}>
              {isPractice ? '🎓 Start Practicing' : 'Start Investigation'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="max-w-sm mx-auto px-4 pt-12">
        <FeedbackOverlay correct={feedback === 'correct'} show={showOverlay} streak={streak} onDone={() => setShowOverlay(false)} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, minHeight: 44 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              width: 36, height: 36, borderRadius: 18,
              background: 'var(--ios-bg2)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
              <path d="M8.5 1.5L1.5 8.5L8.5 15.5" stroke="var(--ios-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>🕵️ Chord Detective</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
            {score} pts
          </div>
        </div>

        <div className="ios-progress-track mb-6">
          <motion.div
            className="ios-progress-fill"
            style={{ background: ACCENT }}
            animate={{ width: `${(round / (ROUNDS + 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Play chord button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => playChord(root, chordType)}
            style={{
              width: 100, height: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 24, background: 'var(--ios-bg2)',
              border: '1px solid var(--ios-sep)', fontSize: 44, cursor: 'pointer',
            }}
          >
            🔊
          </motion.button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ios-label3)', marginBottom: 24 }}>Tap to replay chord</div>

        {/* Chord quality */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginBottom: 10, textAlign: 'center' }}>Chord Quality</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {CHORD_TYPES.map((ct) => (
              <motion.button
                key={ct.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => phase === 'playing' && setSelectedType(ct.id)}
                style={{
                  borderRadius: 12, padding: '14px 8px',
                  fontSize: 14, fontWeight: 600,
                  background: selectedType === ct.id ? `rgba(255,45,85,0.15)` : 'var(--ios-bg2)',
                  border: selectedType === ct.id ? `2px solid ${ACCENT}` : '1.5px solid transparent',
                  color: selectedType === ct.id ? ACCENT : 'var(--ios-label3)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {ct.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Advanced: root selection */}
        {advanced && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginBottom: 10, textAlign: 'center' }}>Root Note</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {ALL_NOTES.map((note) => (
                <motion.button
                  key={note}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedRoot(note)}
                  style={{
                    borderRadius: 10, padding: '10px 4px',
                    fontSize: 14, fontWeight: 600,
                    background: selectedRoot === note ? `rgba(255,45,85,0.15)` : 'var(--ios-bg2)',
                    border: selectedRoot === note ? `2px solid ${ACCENT}` : '1.5px solid transparent',
                    color: selectedRoot === note ? ACCENT : 'var(--ios-label3)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {note}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={submitAnswer}
          disabled={!selectedType || (advanced && !selectedRoot)}
          className="ios-btn-primary"
          style={{
            background: selectedType && (!advanced || selectedRoot) ? ACCENT : 'var(--ios-bg2)',
            color: selectedType && (!advanced || selectedRoot) ? '#fff' : 'var(--ios-label3)',
            marginBottom: 12,
          }}
        >
          Submit
        </motion.button>

        {/* Feedback */}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: 12, padding: '12px 16px', textAlign: 'center',
              fontSize: 14, fontWeight: 600,
              background: feedback === 'correct' ? 'rgba(48,209,88,0.12)' : 'rgba(255,69,58,0.12)',
              border: `1px solid ${feedback === 'correct' ? 'var(--ios-green)' : 'var(--ios-red)'}`,
              color: feedback === 'correct' ? 'var(--ios-green)' : 'var(--ios-red)',
              marginBottom: 12,
            }}
          >
            {feedback === 'correct' ? '✓ Correct!' : `✗ It was ${root} ${CHORD_TYPES.find(c => c.id === chordType)?.label}`}
          </motion.div>
        )}

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ios-label3)' }}>
          🔥 {streak} • Round {round}/{ROUNDS}
          {isPractice && <span style={{ marginLeft: 8, color: ACCENT }}>Practice</span>}
        </div>
      </div>
    </div>
  );
}
