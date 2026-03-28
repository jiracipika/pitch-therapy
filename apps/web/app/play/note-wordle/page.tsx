'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES } from '@/lib/audio';
import WaveVisualizer from '@/components/WaveVisualizer';

type Feedback = 'correct' | 'close' | 'miss';
interface GuessRow { note: string; feedback: Feedback }

export default function NoteWordlePage() {
  const router = useRouter();
  const [targetIdx, setTargetIdx] = useState(0);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string | null>(null);
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing');
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const ACCENT = '#30D158';

  const initGame = () => {
    setTargetIdx(Math.floor(Math.random() * 12));
    setGuesses([]); setCurrentGuess(null); setPhase('playing');
  };

  useEffect(() => { initGame(); }, []);

  const getFeedback = (guess: string): Feedback => {
    const guessIdx = NOTE_NAMES.indexOf(guess as typeof NOTE_NAMES[number]);
    const diff = Math.abs(guessIdx - targetIdx);
    if (diff === 0) return 'correct';
    if (diff <= 2 || diff >= 10) return 'close';
    return 'miss';
  };

  const submitGuess = () => {
    if (!currentGuess || guesses.length >= 6 || phase !== 'playing') return;
    const feedback = getFeedback(currentGuess);
    setIsPlaying(true);
    playTone(NOTE_FREQUENCIES[`${currentGuess}4`] || 261.63, 0.3);
    setTimeout(() => setIsPlaying(false), 300);
    const newGuesses = [...guesses, { note: currentGuess, feedback }];
    setGuesses(newGuesses); setCurrentGuess(null);
    if (feedback === 'correct') setPhase('won');
    else if (newGuesses.length >= 6) setPhase('lost');
  };

  const handleShare = () => {
    const grid = guesses.map(g => g.feedback === 'correct' ? '🟩' : g.feedback === 'close' ? '🟨' : '🟥').join('\n');
    navigator.clipboard.writeText(`🎵 Note Wordle ${phase === 'won' ? guesses.length : 'X'}/6\n${grid}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const targetNote = NOTE_NAMES[targetIdx];

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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>🟩 Note Wordle</div>
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
                  fontSize: 18, fontWeight: 700,
                  background: bg, border, color,
                  transition: 'all 0.2s ease',
                }}
              >
                {guess ? guess.note : i === guesses.length ? currentGuess ?? '' : ''}
              </div>
            );
          })}
        </div>

        {phase === 'playing' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 12 }}>
              {NOTE_NAMES.map((n) => (
                <button
                  key={n}
                  onClick={() => setCurrentGuess(n)}
                  style={{
                    borderRadius: 10, padding: '10px 4px',
                    fontSize: 13, fontWeight: 700,
                    background: currentGuess === n ? ACCENT : 'var(--ios-bg2)',
                    color: currentGuess === n ? '#000' : 'var(--ios-label2)',
                    border: 'none', cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={submitGuess}
              disabled={!currentGuess}
              className="ios-btn-primary"
              style={{ background: ACCENT, opacity: currentGuess ? 1 : 0.3 }}
            >
              Submit
            </button>
          </div>
        )}

        {(phase === 'won' || phase === 'lost') && (
          <div style={{ textAlign: 'center', paddingTop: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{phase === 'won' ? '🎉' : '😔'}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 20 }}>
              {phase === 'won' ? 'Got it!' : `It was ${targetNote}4`}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
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
                className="ios-btn-primary"
                style={{ flex: 1, background: ACCENT }}
              >
                Play Again
              </button>
            </div>
            <button className="ios-btn-secondary" onClick={() => router.push('/dashboard')}>Dashboard</button>
          </div>
        )}

        <div className="ios-card" style={{ padding: 16, textAlign: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--ios-label3)' }}>
            🟩 Correct • 🟨 Within 2 semitones • 🟥 More than 2 semitones
          </div>
          <button
            onClick={() => playTone(NOTE_FREQUENCIES[`${targetNote}4`] || 261.63, 0.6)}
            style={{ marginTop: 8, fontSize: 12, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            🔊 Play target tone
          </button>
        </div>
      </div>
    </div>
  );
}
