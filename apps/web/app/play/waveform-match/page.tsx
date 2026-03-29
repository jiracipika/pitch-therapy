'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const ACCENT = '#5E5CE6';
const ROUNDS = 8;

function centsToFreq(baseFreq: number, cents: number) {
  return baseFreq * Math.pow(2, cents / 1200);
}

function playTone(frequency: number, duration: number = 0.4) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.frequency.value = frequency; osc.type = 'sine';
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  osc.start(); osc.stop(ctx.currentTime + duration);
}

function drawWaveform(canvas: HTMLCanvasElement, freq: number, color: string, label: string, detuneCents: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  // Use getBoundingClientRect to get CSS display size (avoids DPR accumulation bug)
  const rect = canvas.getBoundingClientRect();
  const cssW = rect.width || 340;
  const cssH = rect.height || 100;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);

  const cycles = 4;
  const adjustedFreq = centsToFreq(freq, detuneCents);
  const totalCycles = Math.max(freq, adjustedFreq) / freq * cycles;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let x = 0; x < cssW; x++) {
    const t = x / cssW;
    const y = cssH / 2 + Math.sin(2 * Math.PI * totalCycles * t) * (cssH * 0.35);
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = '12px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(label, cssW / 2, cssH - 8);
}

export default function WaveformMatchPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'setup' | 'playing' | 'done'>('setup');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [baseFreq, setBaseFreq] = useState(440);
  const [detuneCents, setDetuneCents] = useState(0);
  const [sliderCents, setSliderCents] = useState(0);
  const [results, setResults] = useState<{ round: number; detune: number; answer: number; score: number }[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [lastRoundScore, setLastRoundScore] = useState(0);
  const canvasRef1 = useRef<HTMLCanvasElement>(null);
  const canvasRef2 = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  const nextRound = useCallback(() => {
    const freqs = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
    const f = freqs[Math.floor(Math.random() * freqs.length)];
    const cents = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 40) + 10);
    setBaseFreq(f); setDetuneCents(cents); setSliderCents(0); setRound((r) => r + 1);
    setPhase('playing');
    playTone(f);
    setTimeout(() => playTone(centsToFreq(f, cents)), 600);
  }, []);

  const startGame = useCallback(() => {
    setRound(0); setScore(0); setResults([]); setShowResult(false);
    nextRound();
  }, [nextRound]);

  const drawCanvases = useCallback(() => {
    if (canvasRef1.current) drawWaveform(canvasRef1.current, baseFreq, ACCENT, 'Target', 0);
    if (canvasRef2.current) drawWaveform(canvasRef2.current, baseFreq, 'var(--ios-red)', 'Detuned', detuneCents);
  }, [baseFreq, detuneCents]);

  useEffect(() => { if (phase === 'playing') drawCanvases(); }, [phase, drawCanvases]);

  const handleSlider = (val: number) => {
    setSliderCents(val);
    if (canvasRef2.current) {
      drawWaveform(canvasRef2.current, baseFreq, val > 0 ? 'var(--ios-orange)' : 'var(--ios-blue)', 'Your Match', val);
    }
  };

  const submit = () => {
    const diff = Math.abs(sliderCents - detuneCents);
    const roundScore = Math.max(0, Math.round(100 - diff * 3));
    setLastRoundScore(roundScore);
    setScore((s) => s + roundScore);
    const newResults = [...results, { round, detune: detuneCents, answer: sliderCents, score: roundScore }];
    setResults(newResults);
    setShowResult(true);

    setTimeout(() => {
      setShowResult(false);
      if (newResults.length >= ROUNDS) {
        setPhase('done');
      } else {
        nextRound();
      }
    }, 1400);
  };

  if (phase === 'done') {
    const avg = results.length > 0 ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0;
    return (
      <div className="pb-tab" style={{ background: 'var(--ios-bg)', minHeight: '100dvh' }}>
        <div className="max-w-sm mx-auto px-4 pt-12">
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🌊</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 24 }}>
              Results
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: ACCENT }}>{score}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Total Score</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{avg}%</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Avg Accuracy</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{results.length}</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Rounds</div>
              </div>
              <div className="ios-card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ios-label)' }}>{results.length > 0 ? Math.max(...results.map(r => r.score)) : 0}pts</div>
                <div style={{ fontSize: 11, color: 'var(--ios-label3)', marginTop: 4 }}>Best Round</div>
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
            <div style={{ fontSize: 64, marginBottom: 20 }}>🌊</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ios-label)', letterSpacing: '-0.5px', marginBottom: 8 }}>Waveform Match</div>
            <div style={{ fontSize: 15, color: 'var(--ios-label3)', marginBottom: 8 }}>Align waveforms by ear — identify sharp/flat and correct</div>
            <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginBottom: 32 }}>{ROUNDS} rounds • Drag slider to detune and match the target</div>
            <button className="ios-btn-primary" style={{ background: ACCENT }} onClick={startGame}>
              Start Matching
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ios-label)', letterSpacing: '-0.43px' }}>🌊 Waveform Match</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ios-label2)', background: 'var(--ios-bg2)', borderRadius: 10, padding: '4px 10px' }}>
            {round}/{ROUNDS}
          </div>
        </div>

        <div className="ios-progress-track mb-6">
          <motion.div
            className="ios-progress-fill"
            style={{ background: ACCENT }}
            animate={{ width: `${(round / ROUNDS) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Waveforms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <div className="ios-card" style={{ padding: 16 }}>
            <canvas ref={canvasRef1} style={{ width: '100%', height: 100, borderRadius: 8 }} />
          </div>
          <div className="ios-card" style={{ padding: 16 }}>
            <canvas ref={canvasRef2} style={{ width: '100%', height: 100, borderRadius: 8 }} />
          </div>
        </div>

        {/* Replay buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          {[
            { label: '▶ Target', onClick: () => playTone(baseFreq) },
            { label: '▶ Detuned', onClick: () => playTone(centsToFreq(baseFreq, detuneCents)) },
            { label: '▶ Your Match', onClick: () => playTone(centsToFreq(baseFreq, sliderCents)) },
          ].map(({ label, onClick }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.95 }}
              onClick={onClick}
              style={{
                borderRadius: 20, padding: '6px 12px',
                fontSize: 12, fontWeight: 600,
                background: 'var(--ios-bg2)', border: '1px solid var(--ios-sep)',
                color: 'var(--ios-label2)', cursor: 'pointer',
              }}
            >
              {label}
            </motion.button>
          ))}
        </div>

        {/* Slider */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ios-label3)', marginBottom: 8 }}>
            <span>♭ -50¢</span>
            <span style={{ fontWeight: 600, color: Math.abs(sliderCents) < 5 ? 'var(--ios-green)' : 'var(--ios-label)' }}>
              {sliderCents > 0 ? '+' : ''}{sliderCents}¢
            </span>
            <span>♯ +50¢</span>
          </div>
          <input
            type="range" min={-50} max={50} value={sliderCents}
            onChange={(e) => handleSlider(Number(e.target.value))}
            ref={sliderRef}
            disabled={showResult}
            style={{
              width: '100%', height: 8, borderRadius: 4, appearance: 'none', WebkitAppearance: 'none',
              background: `linear-gradient(to right, var(--ios-blue) ${((sliderCents + 50) / 100) * 100}%, var(--ios-bg3) ${((sliderCents + 50) / 100) * 100}%)`,
              cursor: showResult ? 'default' : 'pointer',
            }}
          />
        </div>

        {/* Round result feedback */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                borderRadius: 12, padding: '12px 16px', textAlign: 'center', marginBottom: 16,
                background: lastRoundScore >= 70 ? 'rgba(48,209,88,0.12)' : lastRoundScore >= 40 ? 'rgba(255,159,10,0.12)' : 'rgba(255,69,58,0.12)',
                border: `1px solid ${lastRoundScore >= 70 ? 'var(--ios-green)' : lastRoundScore >= 40 ? 'var(--ios-orange)' : 'var(--ios-red)'}`,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: lastRoundScore >= 70 ? 'var(--ios-green)' : lastRoundScore >= 40 ? 'var(--ios-orange)' : 'var(--ios-red)' }}>
                {lastRoundScore >= 70 ? '✓ Nice!' : lastRoundScore >= 40 ? '~ Close' : '✗ Off'} — {lastRoundScore}pts
              </div>
              <div style={{ fontSize: 12, color: 'var(--ios-label3)', marginTop: 4 }}>
                Target: {detuneCents > 0 ? '+' : ''}{detuneCents}¢ · Your answer: {sliderCents > 0 ? '+' : ''}{sliderCents}¢
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={submit}
          disabled={showResult}
          className="ios-btn-primary"
          style={{ background: ACCENT, opacity: showResult ? 0.5 : 1 }}
        >
          {showResult ? 'Next round...' : `Submit (${round}/${ROUNDS})`}
        </motion.button>
      </div>
    </div>
  );
}
