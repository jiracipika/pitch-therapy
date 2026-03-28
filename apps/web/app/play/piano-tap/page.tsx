'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { playTone, NOTE_FREQUENCIES } from '@/lib/audio';
import FeedbackOverlay from '@/components/FeedbackOverlay';

const ACCENT = '#5E5CE6';

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
      <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
        <div className="max-w-sm mx-auto px-4 pt-12">
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🎹</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 24 }}>
              Piano Tap Complete!
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: ACCENT }}>{score}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Score</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{results.filter(r => r.correct).length}/{totalRounds}</div>
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
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎹</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Piano Tap</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>Tap the correct key after hearing the note</div>

            <div className="ios-card" style={{ padding: 16, textAlign: 'left', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>How to Play</div>
              <ol style={{ fontSize: 14, color: 'var(--ios-label3)', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>1. A note plays — identify it by ear</li>
                <li>2. Tap 🔊 to replay if needed</li>
                <li>3. Tap the matching key on the piano</li>
                <li>4. Score more by answering quickly</li>
              </ol>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginBottom: 10 }}>Keyboard Mode</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {(Object.keys(MODE_CONFIG) as Mode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      height: 34, borderRadius: 17, padding: '0 16px',
                      fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                      background: mode === m ? ACCENT : 'var(--ios-bg2)',
                      color: mode === m ? '#fff' : 'var(--ios-label3)',
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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>🎹 Piano Tap</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
            {score} pts
          </div>
        </div>

        <div className="ios-progress-track mb-6">
          <motion.div
            className="ios-progress-fill"
            style={{ background: ACCENT }}
            animate={{ width: `${(round / totalRounds) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Replay */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <motion.button
              onClick={() => playTone(NOTE_FREQUENCIES[`${targetNote}4`] || 261.63, 0.6)}
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
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ios-label3)' }}>Tap to replay note</div>
          </div>
        </div>

        {/* Piano keyboard */}
        <div style={{ marginBottom: 20 }}>
          {isChromaticMode ? (
            /* Proper piano layout: white keys with black keys overlaid */
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', height: 128 }}>
              {/* White keys */}
              {ALL_WHITE.map((key) => {
                const isTarget = feedback && key === targetNote;
                const isSelected = selectedKey === key;
                let bg = 'rgba(255,255,255,0.92)';
                let border = 'var(--ios-sep)';
                let color = 'rgba(0,0,0,0.7)';
                if (isTarget) { bg = 'rgba(48,209,88,0.3)'; border = 'var(--ios-green)'; color = 'var(--ios-green)'; }
                else if (isSelected && feedback === 'wrong') { bg = 'rgba(255,69,58,0.2)'; border = 'var(--ios-red)'; color = 'var(--ios-red)'; }
                if (flashKey === key) { bg = `rgba(94,92,230,0.4)`; border = ACCENT; color = ACCENT; }
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleKeyTap(key)}
                    disabled={!!feedback}
                    style={{
                      width: 40, height: 128, borderRadius: '0 0 8px 8px',
                      background: bg, border: `0.5px solid ${border}`,
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                      paddingBottom: 8, cursor: 'pointer', marginRight: 2,
                      fontWeight: 700, fontSize: 11, color,
                      transition: 'all 0.15s',
                    }}
                  >
                    {key}
                  </motion.button>
                );
              })}
              {/* Black keys — absolutely positioned */}
              {Object.entries(BLACK_POSITIONS).map(([key, pos]) => {
                const isTarget = feedback && key === targetNote;
                const isSelected = selectedKey === key;
                let bg = 'var(--ios-bg4)';
                let border = 'var(--ios-sep)';
                let color = 'rgba(255,255,255,0.7)';
                if (isTarget) { bg = 'rgba(48,209,88,0.4)'; border = 'var(--ios-green)'; color = 'var(--ios-green)'; }
                else if (isSelected && feedback === 'wrong') { bg = 'rgba(255,69,58,0.4)'; border = 'var(--ios-red)'; color = 'var(--ios-red)'; }
                if (flashKey === key) { bg = `rgba(94,92,230,0.7)`; border = ACCENT; color = '#fff'; }
                // Each white key is 42px wide; black key sits between pos-1 and pos
                const leftOffset = pos * 42 - 14;
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleKeyTap(key)}
                    disabled={!!feedback}
                    style={{
                      position: 'absolute', top: 0, left: leftOffset,
                      width: 28, height: 80, borderRadius: '0 0 5px 5px',
                      background: bg, border: `0.5px solid ${border}`,
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                      paddingBottom: 6, zIndex: 10, cursor: 'pointer',
                      fontWeight: 700, fontSize: 9, color,
                      transition: 'all 0.15s',
                    }}
                  >
                    {key}
                  </motion.button>
                );
              })}
            </div>
          ) : (
            /* Non-chromatic: simple grid of note buttons */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {activeKeys.map(key => {
                const isTarget = feedback && key === targetNote;
                const isSelected = selectedKey === key;
                let bg = 'var(--ios-bg2)';
                let border = '1.5px solid transparent';
                let color = 'var(--ios-label2)';
                if (isTarget) { bg = 'rgba(48,209,88,0.15)'; border = `2px solid var(--ios-green)`; color = 'var(--ios-green)'; }
                else if (isSelected && feedback === 'wrong') { bg = 'rgba(255,69,58,0.15)'; border = `2px solid var(--ios-red)`; color = 'var(--ios-red)'; }
                if (flashKey === key) { bg = `rgba(94,92,230,0.2)`; border = `2px solid ${ACCENT}`; color = ACCENT; }
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => handleKeyTap(key)}
                    disabled={!!feedback}
                    style={{
                      borderRadius: 12, padding: '18px 8px',
                      fontSize: 18, fontWeight: 700,
                      background: bg, border,
                      color, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                borderRadius: 12, padding: '12px 16px', textAlign: 'center',
                fontSize: 14, fontWeight: 600, marginBottom: 12,
                background: feedback === 'correct' ? 'rgba(48,209,88,0.12)' : 'rgba(255,69,58,0.12)',
                border: `1px solid ${feedback === 'correct' ? 'var(--ios-green)' : 'var(--ios-red)'}`,
                color: feedback === 'correct' ? 'var(--ios-green)' : 'var(--ios-red)',
              }}
            >
              {feedback === 'correct' ? '✓ Correct!' : `✗ The note was ${targetNote}`}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ios-label3)' }}>
          🔥 {streak} streak · Round {round}/{totalRounds} · {MODE_CONFIG[mode].label}
          {isPractice && <span style={{ marginLeft: 8, color: ACCENT }}>Practice</span>}
        </div>
      </div>
    </div>
  );
}
