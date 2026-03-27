'use client';

import { useEffect, useRef } from 'react';

interface WaveVisualizerProps {
  active: boolean;
  color?: string;
  height?: number;
}

export default function WaveVisualizer({ active, color = '#6366f1', height = 60 }: WaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    if (active && !ctxRef.current) {
      ctxRef.current = new AudioContext();
      analyserRef.current = ctxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      // Visual-only simulation
    }

    const draw = () => {
      if (!ctx) return;
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.03;

      const barCount = 32;
      const barWidth = (w / barCount) * 0.6;
      const gap = (w / barCount) * 0.4;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap) + gap / 2;
        let barH: number;

        if (active) {
          const wave = Math.sin(timeRef.current * 3 + i * 0.4) * 0.5 + 0.5;
          const wave2 = Math.sin(timeRef.current * 5 + i * 0.8) * 0.3 + 0.5;
          barH = (wave * 0.6 + wave2 * 0.4) * h * 0.85 + h * 0.05;
        } else {
          barH = h * 0.05 + Math.sin(i * 0.3) * 2;
        }

        const opacity = active ? 0.5 + (barH / h) * 0.5 : 0.15;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        const radius = Math.min(barWidth / 2, 3);
        const y = h - barH;
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, h);
        ctx.lineTo(x, h);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, color, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-2xl"
      style={{ height }}
    />
  );
}
