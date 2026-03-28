'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { playTone } from '@/lib/audio';
import WaveVisualizer from '@/components/WaveVisualizer';
import FeedbackOverlay from '@/components/FeedbackOverlay';

type Difficulty = 'easy' | 'medium' | 'hard';

const CONFIGS: Record<Difficulty, { min: number; max: number; step: number; rounds: number }> = {
  easy: { min: 100, max: 1000, step: 10, rounds: 5 },
  medium: { min: 100, max: 2000, step: 1, rounds: 8 },
  hard: { min: 50, max: 4000, step: 1, rounds: 12 },
};

const ACCENT = '#FF9F0A';

export default function FrequencyGuessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get('practice') === 'true';
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [phase, setPhase] = useState<'setup' | 'playing' | 'done'>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [targetFreq, setTargetFreq] = useState(0);
  const [guess, setGuess] = useState(200);
  const [showFeedback, setShowFeedback] = useState(false);
  const [errorPct, setErrorPct] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [results, setResults] = useState<{ correct: boolean; points: number; target: string; answer: string }[]>([]);
  const config = CONFIGS[difficulty];

  const generateFreq = () => Math.round((Math.random() * (config.max - config.min) + config.min) / config.step) * config.step;

  const startGame = () => { setRound(0); setScore(0); setResults([]); nextRound(); };

  const nextRound = () => {
    const freq = generateFreq();
    setTargetFreq(freq);
    setGuess(Math.round((config.min + config.max) / 2));
    setShowFeedback(false);
    setPhase('playing');
    setRound((r) => r + 1);
    setIsPlaying(true);
    playTone(freq, 0.8);
    setTimeout(() => setIsPlaying(false), 800);
  };

  const submitGuess = () => {
    const err = Math.abs(guess - targetFreq) / targetFreq * 100;
    setErrorPct(err);
    const correct = err < 5;
    const points = isPractice ? 0 : correct ? Math.max(Math.round(100 - err * 10), 10) : 0;
    setScore((s) => s + points);
    setResults((r) => [...r, { correct, points, target: `${targetFreq} Hz`, answer: `${guess} Hz` }]);
    setShowFeedback(true);
    if (!isPractice) setShowFeedbackOverlay(correct);
    setTimeout(() => {
      if (isPractice) nextRound();
      else if (round >= config.rounds) setPhase('done');
      else nextRound();
    }, 2000);
  };

  if (phase === 'done') {
    return (
      <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
        <div className="max-w-sm mx-auto px-4 pt-12">
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 24 }}>
              Game Complete
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: ACCENT }}>{score}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Score</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{results.filter(r => r.correct).length}/{config.rounds}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Within 5%</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{results.length ? Math.round(results.reduce((a, r) => a + (r.points > 0 ? Math.abs(parseFloat(r.answer) - parseFloat(r.target)) / parseFloat(r.target) * 100 : 20), 0) / results.length) : 0}%</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Avg Error</div>
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
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎯</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Frequency Guess</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 32 }}>Guess the frequency of a tone</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  style={{
                    height: 34, borderRadius: 17, padding: '0 16px',
                    fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: difficulty === d ? ACCENT : 'var(--ios-bg2)',
                    color: difficulty === d ? '#000' : 'var(--ios-label3)',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginBottom: 28 }}>{config.min}–{config.max} Hz • {config.rounds} rounds</div>
            <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={startGame}>Start Game</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="max-w-sm mx-auto px-4 pt-12">
        <FeedbackOverlay correct={showFeedback && errorPct < 5} show={showFeedbackOverlay} onDone={() => setShowFeedbackOverlay(false)} />

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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>🎯 Frequency Guess</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
            {isPractice ? 'Practice' : `${score} pts`}
          </div>
        </div>

        <div className="ios-progress-track mb-6">
          <div className="ios-progress-fill" style={{ width: `${(round / config.rounds) * 100}%`, background: ACCENT }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <WaveVisualizer active={isPlaying} color={ACCENT} height={40} />
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <motion.button
              onClick={() => { setIsPlaying(true); playTone(targetFreq, 0.8); setTimeout(() => setIsPlaying(false), 800); }}
              whileTap={{ scale: 0.92 }}
              style={{
                width: 72, height: 72,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto', borderRadius: 18,
                background: 'var(--ios-bg2)', border: '1px solid var(--ios-sep)',
                fontSize: 32, cursor: 'pointer',
              }}
            >
              🔊
            </motion.button>
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ios-label3)' }}>Tap to replay</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, color: ACCENT, letterSpacing: '-0.03em', marginBottom: 12 }}>{guess} Hz</div>
          <input
            type="range" min={config.min} max={config.max} step={config.step} value={guess}
            onChange={(e) => setGuess(Number(e.target.value))} disabled={showFeedback}
            className="w-full" style={{ accentColor: ACCENT }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>
            <span>{config.min} Hz</span><span>{config.max} Hz</span>
          </div>
        </div>

        {showFeedback && (
          <div className="ios-card" style={{
            padding: 16, textAlign: 'center', marginBottom: 16,
            border: `1px solid ${errorPct < 5 ? 'var(--ios-green)' : 'var(--ios-red)'}`,
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ios-label)' }}>{errorPct < 5 ? '✅ Great!' : '❌'}</div>
            <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginTop: 4 }}>
              Target: {targetFreq} Hz • Your guess: {guess} Hz • Error: {errorPct.toFixed(1)}%
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={submitGuess} disabled={showFeedback}
            className="ios-btn-tonal"
            style={{ background: ACCENT, color: '#000', opacity: showFeedback ? 0.4 : 1 }}
          >
            Submit Guess
          </button>
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--ios-label3)' }}>Round {round}/{config.rounds}</div>
        </div>
      </div>
    </div>
  );
}
