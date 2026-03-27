"use client";

import React, { useRef, useEffect, useCallback } from "react";

// ─── Waveform Visualization ──────────────────────────────────────────────────

export type WaveformType = "sine" | "triangle" | "square" | "sawtooth";

export interface WaveformVisProps {
  /** Audio data source — an AnalyserNode */
  analyser?: AnalyserNode | null;
  /** If no analyser, draw a static waveform of this type */
  staticWaveform?: WaveformType;
  /** Frequency for static waveform (Hz) */
  staticFrequency?: number;
  /** Overlay waveform for comparison (e.g., target vs detected) */
  overlayAnalyser?: AnalyserNode | null;
  /** Color of primary waveform (CSS color) */
  color?: string;
  /** Color of overlay waveform */
  overlayColor?: string;
  /** Whether to show the overlay */
  showOverlay?: boolean;
  /** Line width */
  lineWidth?: number;
  /** Additional CSS class */
  className?: string;
}

export const WaveformVis: React.FC<WaveformVisProps> = ({
  analyser,
  staticWaveform,
  staticFrequency = 440,
  overlayAnalyser,
  color = "#3B82F6",
  overlayColor = "#F59E0B",
  showOverlay = false,
  lineWidth = 2,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const drawStaticWaveform = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      type: WaveformType,
      col: string,
      phase = 0,
    ) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      const cycles = 4;
      const samples = width;

      for (let i = 0; i < samples; i++) {
        const t = (i / samples) * cycles * Math.PI * 2 + phase;
        let y = 0;

        switch (type) {
          case "sine":
            y = Math.sin(t);
            break;
          case "triangle":
            y = 2 * Math.abs(2 * (t / (2 * Math.PI) - Math.floor(t / (2 * Math.PI) + 0.5))) - 1;
            break;
          case "square":
            y = Math.sin(t) >= 0 ? 1 : -1;
            break;
          case "sawtooth":
            y = 2 * (t / (2 * Math.PI) - Math.floor(t / (2 * Math.PI) + 0.5));
            break;
        }

        const px = i;
        const py = (height / 2) - y * (height * 0.4);

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      ctx.stroke();
    },
    [lineWidth],
  );

  const drawFromAnalyser = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      node: AnalyserNode,
      col: string,
    ) => {
      const bufferLength = node.fftSize;
      const dataArray = new Float32Array(bufferLength);
      node.getFloatTimeDomainData(dataArray);

      ctx.strokeStyle = col;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] ?? 0;
        const y = (height / 2) - v * (height * 0.45);
        const x = i * sliceWidth;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
    },
    [lineWidth],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Center line
      ctx.strokeStyle = "rgba(148,163,184,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Primary waveform
      if (analyser) {
        drawFromAnalyser(ctx, width, height, analyser, color);
      } else if (staticWaveform) {
        const phase = performance.now() * 0.001 * staticFrequency * 0.01;
        drawStaticWaveform(ctx, width, height, staticWaveform, color, phase);
      }

      // Overlay waveform
      if (showOverlay && overlayAnalyser) {
        drawFromAnalyser(ctx, width, height, overlayAnalyser, overlayColor);
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.scale(dpr, dpr);
    });
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animRef.current);
      resizeObserver.disconnect();
    };
  }, [
    analyser,
    overlayAnalyser,
    staticWaveform,
    staticFrequency,
    color,
    overlayColor,
    showOverlay,
    drawFromAnalyser,
    drawStaticWaveform,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-24 sm:h-32 rounded-lg bg-slate-900/5 ${className}`}
    />
  );
};

export default WaveformVis;
