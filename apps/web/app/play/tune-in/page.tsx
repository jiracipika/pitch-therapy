'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { playTone, NOTE_FREQUENCIES } from '@/lib/audio';
import FeedbackOverlay from '@/components/FeedbackOverlay';

const ACCENT = '#FF2D55';

const TARGET_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

export default function TuneInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get('practice') === 'true';
  const [phase, setPhase] = useState<'setup' | 'playing' | 'feedback' | 'done'>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [targetNote, setTargetNote] = useState('A4');
  const [targetFreq, setTargetFreq] = useState(440);
  const [centsOff, setCentsOff] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [results, setResults] = useState<{ round: number; correct: boolean; points: number; target: string; accuracy: number; timeMs: number }[]>([]);
  const [useMidi, setUseMidi] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const roundStartRef = useRef(0);
  const holdStartRef = useRef<number | null>(null);
  const totalRounds = 5;

  const autoCorrelate = useCallback((buf: Float32Array, sampleRate: number): number | null => {
    const SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return null;

    const halfSize = Math.floor(SIZE / 2);
    let bestCorrelation = 0;
    let bestOffset = 0;

    const correlations = new Float32Array(halfSize);
    for (let offset = 1; offset < halfSize; offset++) {
      let correlation = 0;
      for (let i = 0; i < halfSize; i++) {
        correlation += Math.abs(buf[i] - buf[i + offset]);
      }
      correlations[offset] = correlation;
      if (correlation < bestCorrelation || offset === 1) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    if (bestCorrelation > rms * 1.5) return null;
    return sampleRate / bestOffset;
  }, []);

  const detectPitch = useCallback(() => {
    if (!analyserRef.current) return;
    const buf = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buf);
    const freq = autoCorrelate(buf, audioContextRef.current?.sampleRate || 44100);
    if (freq && freq > 60 && freq < 1200) {
      const semitones = 12 * Math.log2(freq / targetFreq);
      const cents = Math.round(semitones * 100);
      setCentsOff(cents);

      if (Math.abs(cents) <= 10) {
        if (!holdStartRef.current) holdStartRef.current = Date.now();
        const held = Date.now() - holdStartRef.current;
        const needed = 1500;
        setHoldProgress(Math.min(held / needed, 1));
        if (held >= needed) {
          handleSuccess();
        }
      } else {
        holdStartRef.current = null;
        setHoldProgress(0);
      }
    }
  }, [targetFreq]);

  useEffect(() => {
    if (!isListening) return;
    const interval = setInterval(detectPitch, 50);
    return () => clearInterval(interval);
  }, [isListening, detectPitch]);

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      setIsListening(true);
    } catch {
      setUseMidi(false);
    }
  };

  const stopMic = () => {
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    setIsListening(false);
    holdStartRef.current = null;
  };

  const pickTarget = () => {
    const note = TARGET_NOTES[Math.floor(Math.random() * TARGET_NOTES.length)];
    const freq = NOTE_FREQUENCIES[note] || 440;
    setTargetNote(note);
    setTargetFreq(freq);
    setCentsOff(0);
    setHoldProgress(0);
    return note;
  };

  const startGame = () => {
    setRound(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setResults([]);
    if (!useMidi) startMic();
    nextRound();
  };

  const nextRound = () => {
    const note = pickTarget();
    playTone(NOTE_FREQUENCIES[note] || 440, 0.8);
    setFeedback(null);
    setPhase('playing');
    setRound(r => r + 1);
    roundStartRef.current = Date.now();
  };

  const handleSuccess = () => {
    stopMic();
    const elapsed = Date.now() - roundStartRef.current;
    const accuracy = 1 - Math.abs(centsOff) / 50;
    const points = Math.round(accuracy * 100 + Math.max(0, 50 - elapsed / 100));
    setScore(s => s + points);
    setStreak(s => {
      const ns = s + 1;
      setBestStreak(b => Math.max(b, ns));
      return ns;
    });
    setFeedback('correct');
    setShowFeedbackOverlay(true);
    setResults(r => [...r, { round, correct: true, points, target: targetNote, accuracy, timeMs: elapsed }]);

    setTimeout(() => {
      if (round >= totalRounds) {
        setPhase('done');
        stopMic();
      } else {
        if (!useMidi) startMic();
        nextRound();
      }
    }, isPractice ? 1000 : 1500);
  };

  const handleGiveUp = () => {
    stopMic();
    setFeedback('wrong');
    setShowFeedbackOverlay(false);
    setStreak(0);
    setResults(r => [...r, { round, correct: false, points: 0, target: targetNote, accuracy: 0, timeMs: Date.now() - roundStartRef.current }]);

    setTimeout(() => {
      if (round >= totalRounds) {
        setPhase('done');
      } else {
        if (!useMidi) startMic();
        nextRound();
      }
    }, 1500);
  };

  useEffect(() => { return () => stopMic(); }, []);

  if (phase === 'done') {
    return (
      <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
        <div className="max-w-sm mx-auto px-4 pt-12">
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 24 }}>
              Tune In Complete!
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
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎤</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Tune In</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 24 }}>Hit the target note with your voice or instrument</div>

            <div className="ios-card" style={{ padding: 16, textAlign: 'left', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>How to Play</div>
              <ol style={{ fontSize: 14, color: 'var(--ios-label3)', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>1. A target note appears — tap 🔊 to hear it</li>
                <li>2. Sing or play that note into your microphone</li>
                <li>3. The tuning meter shows how close you are (±50¢)</li>
                <li>4. Hold within ±10¢ for 1.5 seconds to score</li>
              </ol>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginBottom: 10 }}>Input Mode</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  onClick={() => setUseMidi(false)}
                  style={{
                    height: 34, borderRadius: 17, padding: '0 16px',
                    fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: !useMidi ? ACCENT : 'var(--ios-bg2)',
                    color: !useMidi ? '#fff' : 'var(--ios-label3)',
                    transition: 'background 0.15s',
                  }}
                >
                  🎤 Microphone
                </button>
                <button
                  onClick={() => setUseMidi(true)}
                  style={{
                    height: 34, borderRadius: 17, padding: '0 16px',
                    fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: useMidi ? ACCENT : 'var(--ios-bg2)',
                    color: useMidi ? '#fff' : 'var(--ios-label3)',
                    transition: 'background 0.15s',
                  }}
                >
                  👁️ Listen Only
                </button>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ios-label3)' }}>
                {useMidi ? 'Practice without mic — mark rounds yourself' : 'Real-time pitch detection via microphone'}
              </div>
            </div>
            <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={startGame}>Start Game</button>
          </div>
        </div>
      </div>
    );
  }

  const centsColor = Math.abs(centsOff) <= 10 ? 'var(--ios-green)' : Math.abs(centsOff) <= 25 ? 'var(--ios-orange)' : 'var(--ios-red)';

  return (
    <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
      <div className="max-w-sm mx-auto px-4 pt-12">
        <FeedbackOverlay correct={feedback === 'correct'} show={showFeedbackOverlay} streak={streak} onDone={() => setShowFeedbackOverlay(false)} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, minHeight: 44 }}>
          <button
            onClick={() => { stopMic(); router.push('/dashboard'); }}
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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>🎤 Tune In</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
            {score} pts
          </div>
        </div>

        <div className="ios-progress-track mb-6">
          <motion.div
            className="ios-progress-fill"
            style={{ background: ACCENT }}
            animate={{ width: `${(round / totalRounds) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Target note */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ fontSize: 72, fontWeight: 800, color: ACCENT, letterSpacing: '-2px', lineHeight: 1 }}
          >
            {targetNote}
          </motion.div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ios-label3)' }}>{targetFreq.toFixed(1)} Hz</div>
          <motion.button
            onClick={() => playTone(targetFreq, 0.8)}
            whileTap={{ scale: 0.92 }}
            style={{
              marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
              borderRadius: 12, padding: '8px 16px', fontSize: 14, fontWeight: 500,
              background: 'var(--ios-bg2)', border: '1px solid var(--ios-sep)',
              color: 'var(--ios-label2)', cursor: 'pointer',
            }}
          >
            🔊 Hear target
          </motion.button>
        </div>

        {useMidi ? (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: 'var(--ios-label3)', marginBottom: 20 }}>Sing or play the note, then mark your result</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <motion.button
                onClick={handleSuccess}
                whileTap={{ scale: 0.93 }}
                style={{
                  flex: 1, borderRadius: 16, padding: '20px 0',
                  background: 'rgba(48,209,88,0.15)', border: '1px solid rgba(48,209,88,0.4)',
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'block', fontSize: 24, marginBottom: 4 }}>✓</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-green)' }}>Got it</span>
              </motion.button>
              <motion.button
                onClick={handleGiveUp}
                whileTap={{ scale: 0.93 }}
                style={{
                  flex: 1, borderRadius: 16, padding: '20px 0',
                  background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.3)',
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'block', fontSize: 24, marginBottom: 4 }}>✗</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ios-red)' }}>Skip</span>
              </motion.button>
            </div>
          </div>
        ) : (
          <>
            {/* Tuning meter */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ios-label3)', marginBottom: 6 }}>
                <span>-50¢</span><span>0</span><span>+50¢</span>
              </div>
              <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'var(--ios-bg3)', overflow: 'visible', margin: '0 4px' }}>
                <div style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1.5, background: 'var(--ios-green)', transform: 'translateX(-50%)' }} />
                <div style={{
                  position: 'absolute', top: 0, width: 12, height: 8, borderRadius: 4,
                  background: ACCENT,
                  left: `calc(50% + ${Math.max(-45, Math.min(45, centsOff / 2))}%)`,
                  transform: 'translateX(-50%)',
                  transition: 'left 0.1s ease',
                  boxShadow: `0 0 8px ${ACCENT}60`,
                }} />
              </div>
              <div style={{ marginTop: 8, textAlign: 'center', fontSize: 18, fontWeight: 700, color: centsColor }}>
                {centsOff > 0 ? '+' : ''}{centsOff}¢
              </div>
            </div>

            {/* Hold progress */}
            {holdProgress > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="ios-progress-track">
                  <motion.div
                    className="ios-progress-fill"
                    style={{ background: 'var(--ios-green)' }}
                    animate={{ width: `${holdProgress * 100}%` }}
                  />
                </div>
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ios-label3)', marginTop: 4 }}>Hold steady...</div>
              </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--ios-label3)', marginBottom: 8 }}>Sing or play into your mic</div>
              <button
                onClick={handleGiveUp}
                style={{ fontSize: 14, color: 'var(--ios-label3)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Skip round
              </button>
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ios-label3)' }}>
          🔥 {streak} streak • Round {round}/{totalRounds}
        </div>
      </div>
    </div>
  );
}
