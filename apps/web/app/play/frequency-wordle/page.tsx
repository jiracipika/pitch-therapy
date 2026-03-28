'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { playTone } from '@/lib/audio';
import WaveVisualizer from '@/components/WaveVisualizer';

type Feedback = 'correct' | 'close' | 'miss';
interface GuessRow { freq: number; feedback: Feedback; direction?: 'up' | 'down' }

const ACCENT = '#0A84FF';

export default function FrequencyWordlePage() {
  const router = useRouter();
  const [targetFreq, setTargetFreq] = useState(0);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing');
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const initGame = () => {
    setTargetFreq(Math.round((Math.random() * 800 + 200) * 10) / 10);
    setGuesses([]); setInputVal(''); setPhase('playing');
  };

  useEffect(() => { initGame(); }, []);

  const getFeedback = (guess: number): { feedback: Feedback; direction?: 'up' | 'down' } => {
    const err = Math.abs(guess - targetFreq) / targetFreq * 100;
    if (err <= 2) return { feedback: 'correct' };
    if (err <= 10) return { feedback: 'close', direction: guess < targetFreq ? 'up' : 'down' };
    return { feedback: 'miss', direction: guess < targetFreq ? 'up' : 'down' };
  };

  const submitGuess = () => {
    const freq = parseFloat(inputVal);
    if (isNaN(freq) || freq <= 0 || guesses.length >= 6 || phase !== 'playing') return;
    playTone(freq, 0.3);
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 300);
    const { feedback, direction } = getFeedback(freq);
    const newGuesses = [...guesses, { freq, feedback, direction }];
    setGuesses(newGuesses); setInputVal('');
    if (feedback === 'correct') setPhase('won');
    else if (newGuesses.length >= 6) setPhase('lost');
  };

  const handleShare = () => {
    const grid = guesses.map(g => g.feedback === 'correct' ? '🟩' : g.feedback === 'close' ? '🟨' : '🟥').join('\n');
    navigator.clipboard.writeText(`🎵 Frequency Wordle ${phase === 'won' ? guesses.length : 'X'}/6\n${grid}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="max-w-sm mx-auto px-4 pt-12">

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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>🔵 Frequency Wordle</div>
          <button
            onClick={initGame}
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-blue)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            🔄 New
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <WaveVisualizer active={isPlaying} color={ACCENT} height={35} />
        </div>

        {/* Guess rows */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const guess = guesses[i];
            let bg = 'var(--ios-bg2)';
            let border = '1.5px solid var(--ios-sep)';
            let color = 'var(--ios-label3)';
            if (guess) {
              if (guess.feedback === 'correct') { bg = 'rgba(48,209,88,0.15)'; border = '2px solid var(--ios-green)'; color = 'var(--ios-green)'; }
              else if (guess.feedback === 'close') { bg = 'rgba(255,159,10,0.15)'; border = '2px solid var(--ios-orange)'; color = 'var(--ios-orange)'; }
              else { bg = 'rgba(255,69,58,0.12)'; border = '2px solid var(--ios-red)'; color = 'var(--ios-red)'; }
            } else if (i === guesses.length) {
              bg = 'var(--ios-bg2)'; border = '2px solid var(--ios-sep)'; color = 'var(--ios-label)';
            }
            return (
              <div
                key={i}
                style={{
                  width: '100%', height: 52, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700,
                  background: bg, border, color,
                  transition: 'all 0.2s ease',
                }}
              >
                {guess
                  ? `${guess.freq} Hz ${guess.direction === 'up' ? '▲' : guess.direction === 'down' ? '▼' : '✓'}`
                  : i === guesses.length && inputVal ? `${inputVal} Hz` : ''}
              </div>
            );
          })}
        </div>

        {phase === 'playing' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="number" value={inputVal} onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitGuess()}
              placeholder="Frequency in Hz"
              style={{
                flex: 1, borderRadius: 12, padding: '12px 16px',
                background: 'var(--ios-bg2)', border: '1px solid var(--ios-sep)',
                color: 'var(--ios-label)', fontSize: 15, outline: 'none',
              }}
            />
            <button
              onClick={submitGuess} disabled={!inputVal}
              style={{
                borderRadius: 12, padding: '0 20px',
                background: ACCENT, color: '#fff',
                fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
                opacity: inputVal ? 1 : 0.3,
              }}
            >
              Go
            </button>
          </div>
        )}

        {(phase === 'won' || phase === 'lost') && (
          <div style={{ textAlign: 'center', paddingTop: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{phase === 'won' ? '🎉' : '😔'}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 20 }}>
              {phase === 'won' ? 'Got it!' : `It was ${targetFreq} Hz`}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button
                onClick={handleShare}
                style={{
                  flex: 1, borderRadius: 14, height: 50,
                  fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: 'var(--ios-bg2)', color: 'var(--ios-label2)',
                }}
              >
                {copied ? '✅ Copied!' : '📋 Share'}
              </button>
              <button
                onClick={initGame}
                style={{
                  flex: 1, borderRadius: 14, height: 50,
                  fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: ACCENT, color: '#fff',
                }}
              >
                Play Again
              </button>
            </div>
            <button className="ios-btn-secondary" onClick={() => router.push('/dashboard')}>Dashboard</button>
          </div>
        )}

        <div className="ios-card" style={{ padding: 16, textAlign: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--ios-label3)' }}>
            🟩 Within 2% • 🟨 Within 10% (+ ▲▼ direction) • 🟥 More than 10%
          </div>
          <button
            onClick={() => playTone(targetFreq, 0.6)}
            style={{ marginTop: 8, fontSize: 12, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            🔊 Play target tone
          </button>
        </div>
      </div>
    </div>
  );
}
