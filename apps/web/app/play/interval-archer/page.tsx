'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { playTone, getAudioContext, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';
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
  const searchParams = useSearchParams();
  const isPractice = searchParams.get('practice') === 'true';
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
  const roundRef = useRef(0);
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
      // harmonic: play both at once using shared context (no leak)
      const ctx = getAudioContext();
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
    roundRef.current = 0;
    nextRound();
  };

  const nextRound = () => {
    const { freq, interval } = pickRound();
    playInterval(freq, interval.semitones, intervalMode);
    setPhase('playing');
    roundRef.current += 1;
    setRound(roundRef.current);
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
    setResults(r => [...r, { round: roundRef.current, root: rootNote, interval: targetInterval.name, answer: name, correct, points, semitonesOff }]);

    setTimeout(() => {
      if (roundRef.current >= TOTAL_ROUNDS) { setPhase('done'); }
      else { nextRound(); }
    }, 1200);
  };

  if (phase === 'done') {
    return (
      <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
        <div className="max-w-sm mx-auto px-4 pt-12">
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🏹</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 24 }}>
              Interval Archer
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: ACCENT }}>{score}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Score</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{results.filter(r => r.correct).length}/{TOTAL_ROUNDS}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Hit</div>
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
            <div style={{ fontSize: 64, marginBottom: 20 }}>🏹</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Interval Archer</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>Identify intervals — closer to bullseye = more points</div>

            <div className="ios-card" style={{ padding: 16, textAlign: 'left', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>How to Play</div>
              <ol style={{ fontSize: 14, color: 'var(--ios-label3)', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>1. Hear two notes played in sequence (or together)</li>
                <li>2. Identify the musical interval between them</li>
                <li>3. Exact hit = bullseye (max pts), 1 semitone off = partial credit</li>
                <li>4. Tap 🔊 to replay the interval anytime</li>
              </ol>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginBottom: 10 }}>Mode</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {(Object.keys(MODE_CONFIG) as IntervalMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setIntervalMode(m)}
                    style={{
                      height: 34, borderRadius: 17, padding: '0 16px',
                      fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                      background: intervalMode === m ? ACCENT : 'var(--ios-bg2)',
                      color: intervalMode === m ? '#fff' : 'var(--ios-label3)',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                  >
                    {MODE_CONFIG[m].label}
                  </button>
                ))}
              </div>
            </div>

            <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={startGame}>
              {isPractice ? '🎓 Start Practicing' : 'Start Game'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeIntervals = INTERVALS.filter(i => pool.includes(i.semitones));

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="max-w-sm mx-auto px-4 pt-12">
        <FeedbackOverlay correct={feedback === 'correct'} show={showFeedbackOverlay} streak={streak} onDone={() => setShowFeedbackOverlay(false)} />

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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>🏹 Interval Archer</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
            {score} pts
          </div>
        </div>

        <div className="ios-progress-track mb-6">
          <motion.div
            className="ios-progress-fill"
            style={{ background: ACCENT }}
            animate={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Replay */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <motion.button
              onClick={() => playInterval(rootFreq, targetInterval.semitones, intervalMode)}
              whileTap={{ scale: 0.92 }}
              style={{
                width: 80, height: 80,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 24, background: 'var(--ios-bg2)',
                border: '1px solid var(--ios-sep)', fontSize: 36, cursor: 'pointer',
              }}
            >
              🔊
            </motion.button>
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ios-label3)' }}>Replay interval</div>
            <div style={{ marginTop: 2, fontSize: 11, color: 'var(--ios-label4)' }}>Root: {rootNote} · {MODE_CONFIG[intervalMode].label}</div>
          </div>
        </div>

        {/* Interval buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {activeIntervals.map(interval => {
            const isTarget = feedback && interval.semitones === targetInterval.semitones;
            const isSelected = selectedInterval === interval.name;
            let bg = 'var(--ios-bg2)';
            let border = '1.5px solid transparent';
            let color = 'var(--ios-label2)';

            if (isTarget) {
              bg = 'rgba(48,209,88,0.15)';
              border = '1.5px solid var(--ios-green)';
              color = 'var(--ios-green)';
            } else if (isSelected && feedback === 'wrong') {
              bg = 'rgba(255,69,58,0.15)';
              border = '1.5px solid var(--ios-red)';
              color = 'var(--ios-red)';
            }

            return (
              <motion.button
                key={interval.name}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleAnswer(interval.semitones, interval.name)}
                disabled={!!feedback}
                style={{
                  borderRadius: 12, padding: '14px 8px',
                  fontSize: 14, fontWeight: 600,
                  background: bg, border, color,
                  cursor: feedback ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div>{interval.name}</div>
                <div style={{ fontSize: 10, color: 'var(--ios-label4)', marginTop: 2 }}>
                  {interval.semitones === 0 ? '' : interval.semitones === 12 ? '8va' : `${interval.semitones}st`}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                borderRadius: 12, padding: '12px 16px', textAlign: 'center', marginBottom: 12,
                fontSize: 14, fontWeight: 600,
                background: feedback === 'correct' ? 'rgba(48,209,88,0.12)' : 'rgba(255,69,58,0.12)',
                border: `1px solid ${feedback === 'correct' ? 'var(--ios-green)' : 'var(--ios-red)'}`,
                color: feedback === 'correct' ? 'var(--ios-green)' : 'var(--ios-red)',
              }}
            >
              {feedback === 'correct' ? '🎯 Bullseye!' : `It was ${targetInterval.name}`}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ios-label3)' }}>
          🔥 {streak} streak · Round {round}/{TOTAL_ROUNDS}
          {isPractice && <span style={{ marginLeft: 8, color: ACCENT }}>Practice</span>}
        </div>
      </div>
    </div>
  );
}
