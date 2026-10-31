'use client';

import { useEffect, useRef } from 'react';

type Particle = { x: number; y: number; r: number; hue: number; speed: number; sway: number; phase: number };

const HUES = ['199, 255, 74', '155, 140, 255', '102, 220, 255'] as const;

/**
 * Ambient "frequency field" canvas behind the landing hero.
 * Layered wave traces + drifting signal particles over a fully opaque
 * base. Decorative only; fully disabled (static CSS fallback) under
 * prefers-reduced-motion, and paused while off-screen.
 */
export default function LandingCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let frameId = 0;
    let visible = true;
    let particles: Particle[] = [];

    const seedParticles = () => {
      const count = Math.min(46, Math.round((w * h) / 34000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.8 + Math.random() * 1.7,
        hue: Math.floor(Math.random() * HUES.length),
        speed: 0.12 + Math.random() * 0.4,
        sway: 12 + Math.random() * 30,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedParticles();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    const draw = (t: number) => {
      frameId = requestAnimationFrame(draw);
      if (!visible) return;
      const time = t / 1000;

      // Opaque base — the hero never shows translucent stacking.
      const base = ctx.createLinearGradient(0, 0, 0, h);
      base.addColorStop(0, '#050507');
      base.addColorStop(0.65, '#08080f');
      base.addColorStop(1, '#0b0b14');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      // Faint oscilloscope grid.
      ctx.strokeStyle = 'rgba(247, 246, 242, 0.035)';
      ctx.lineWidth = 1;
      for (let y = h * 0.2; y < h; y += 46) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Layered wave traces — three voices (lime lead, violet mid, cyan ghost).
      const waves: Array<{ base: number; amp: number; freq: number; speed: number; color: string; glow: number; width: number }> = [
        { base: 0.42, amp: 42, freq: 0.011, speed: 0.9, color: 'rgba(199, 255, 74, 0.55)', glow: 14, width: 1.6 },
        { base: 0.52, amp: 30, freq: 0.017, speed: -0.6, color: 'rgba(155, 140, 255, 0.42)', glow: 10, width: 1.3 },
        { base: 0.6, amp: 22, freq: 0.026, speed: 0.4, color: 'rgba(102, 220, 255, 0.3)', glow: 8, width: 1 },
      ];
      for (const wave of waves) {
        ctx.beginPath();
        for (let x = -8; x <= w + 8; x += 7) {
          const y =
            h * wave.base +
            Math.sin(x * wave.freq + time * wave.speed) * wave.amp +
            Math.sin(x * wave.freq * 2.7 + time * wave.speed * 1.7) * wave.amp * 0.28;
          if (x <= -8) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.width;
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = wave.glow;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Drifting signal particles.
      for (const p of particles) {
        p.y -= p.speed;
        if (p.y < -6) {
          p.y = h + 6;
          p.x = Math.random() * w;
        }
        const x = p.x + Math.sin(time * 0.6 + p.phase) * p.sway * 0.4;
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${HUES[p.hue]}, 0.5)`;
        ctx.fill();
      }
    };
    frameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
