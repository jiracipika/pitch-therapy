'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const ACCENT = '#818CF8'; // indigo-400
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
  const w = canvas.width;
  const h = canvas.height;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const cycles = 4;
  const adjustedFreq = centsToFreq(freq, detuneCents);
  const totalCycles = Math.max(freq, adjustedFreq) / freq * cycles;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let x = 0; x < w; x++) {
    const t = x / w;
    const y = h / 2 + Math.sin(2 * Math.PI * totalCycles * t) * (h * 0.35);
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Label
  ctx.fillStyle = color;
  ctx.font = '12px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(label, w / 2, h - 8);
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
  const canvasRef1 = useRef<HTMLCanvasElement>(null);
  const canvasRef2 = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  const startGame = useCallback(() => {
    setRound(0); setScore(0); setResults([]);
    nextRound();
  }, []);

  const nextRound = useCallback(() => {
    const freqs = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
    const f = freqs[Math.floor(Math.random() * freqs.length)];
    const cents = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 40) + 10); // ±10-50 cents
    setBaseFreq(f); setDetuneCents(cents); setSliderCents(0); setRound((r) => r + 1);
    setPhase('playing');
    playTone(f); // target
    setTimeout(() => playTone(centsToFreq(f, cents)), 600); // detuned
  }, []);

  const drawCanvases = useCallback(() => {
    if (canvasRef1.current) drawWaveform(canvasRef1.current, baseFreq, ACCENT, 'Target', 0);
    if (canvasRef2.current) drawWaveform(canvasRef2.current, baseFreq, '#f87171', 'Detuned', detuneCents);
  }, [baseFreq, detuneCents]);

  useEffect(() => { if (phase === 'playing') drawCanvases(); }, [phase, drawCanvases]);

  const handleSlider = (val: number) => {
    setSliderCents(val);
    // Redraw with player's correction applied to the detuned waveform
    if (canvasRef2.current) {
      drawWaveform(canvasRef2.current, baseFreq, val > 0 ? '#fbbf24' : '#60a5fa', 'Your Match', val);
    }
  };

  const submit = () => {
    const diff = Math.abs(sliderCents - detuneCents);
    const roundScore = Math.max(0, Math.round(100 - diff * 3));
    setScore((s) => s + roundScore);
    setResults((r) => [...r, { round, detune: detuneCents, answer: sliderCents, score: roundScore }]);
    setPhase('done');
  };

  if (phase === 'done') {
    const avg = results.length > 0 ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0;
    return (
      <div className="min-h-screen px-4 pt-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-6xl">🌊</motion.div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Results</h1>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { label: 'Total Score', value: score },
              { label: 'Avg Accuracy', value: `${avg}%` },
              { label: 'Rounds', value: results.length },
              { label: 'Best Round', value: `${Math.max(...results.map(r => r.score))}pts` },
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
            <span className="text-4xl">🌊</span>
          </motion.div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: ACCENT }}>Waveform Match</h1>
          <p className="mt-2 text-zinc-500">Align waveforms by ear — identify sharp/flat and correct</p>
          <p className="mt-4 text-xs text-zinc-600">{ROUNDS} rounds • Drag slider to detune and match the target</p>
          <button onClick={startGame} className="mt-8 rounded-full px-6 py-2.5 font-semibold text-white" style={{ background: ACCENT }}>
            Start Matching
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-10">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-zinc-500 hover:text-white transition-colors">← Back</button>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: ACCENT }}>🌊 Waveform Match</h1>
          <div className="text-sm text-zinc-500">Round {round}/{ROUNDS}</div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <motion.div className="h-full rounded-full" style={{ background: ACCENT }}
            animate={{ width: `${(round / ROUNDS) * 100}%` }} transition={{ duration: 0.5 }} />
        </div>

        {/* Waveforms */}
        <div className="mt-6 space-y-4">
          <div className="glass-card p-4">
            <canvas ref={canvasRef1} width={340} height={100} className="w-full rounded-xl" />
          </div>
          <div className="glass-card p-4">
            <canvas ref={canvasRef2} width={340} height={100} className="w-full rounded-xl" />
          </div>
        </div>

        {/* Replay buttons */}
        <div className="mt-4 flex justify-center gap-4">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => playTone(baseFreq)}
            className="rounded-full px-4 py-2 text-xs font-medium bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10">
            ▶ Target
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => playTone(centsToFreq(baseFreq, detuneCents))}
            className="rounded-full px-4 py-2 text-xs font-medium bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10">
            ▶ Detuned
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => playTone(centsToFreq(baseFreq, sliderCents))}
            className="rounded-full px-4 py-2 text-xs font-medium bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10">
            ▶ Your Match
          </motion.button>
        </div>

        {/* Slider */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-zinc-500 mb-2">
            <span>♭ -50¢</span>
            <span className={`font-semibold ${Math.abs(sliderCents) < 5 ? 'text-green-400' : 'text-white'}`}>{sliderCents > 0 ? '+' : ''}{sliderCents}¢</span>
            <span>♯ +50¢</span>
          </div>
          <input type="range" min={-50} max={50} value={sliderCents} onChange={(e) => handleSlider(Number(e.target.value))} ref={sliderRef}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #60a5fa ${((sliderCents + 50) / 100) * 100}%, rgba(255,255,255,0.1) ${((sliderCents + 50) / 100) * 100}%)` }} />
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={submit}
          className="mt-6 w-full rounded-full py-3.5 font-semibold text-white" style={{ background: ACCENT }}>
          Submit ({round}/{ROUNDS})
        </motion.button>
      </div>
    </div>
  );
}
