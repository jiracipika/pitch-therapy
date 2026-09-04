"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  calculateCentsDeviation,
  estimatePitch,
  stabilizePitch,
  type PitchEstimate,
} from "@pitch-therapy/core";
import { playTone, NOTE_NAMES, NOTE_FREQUENCIES, stopAllTones } from "@/lib/audio";
import WaveVisualizer from "@/components/WaveVisualizer";
import { useStatsContext } from "@/components/StatsProvider";
import TrainingShell, { type MicStatus } from "@/components/training/TrainingShell";
import { useTrackedTimeouts } from "@/lib/useTrackedTimeouts";

const NOTE_FREQS = NOTE_NAMES.map((n) => NOTE_FREQUENCIES[`${n}4`] ?? 261.63) as number[];
const freq = (i: number) => NOTE_FREQS[i] ?? 261.63;

const ACCENT = "#0A84FF";

export default function PitchMatchPage() {
  const { recordResult } = useStatsContext();
  const recordedRef = useRef(false);

  const router = useRouter();
  const { trackTimeout, clearAllTimeouts } = useTrackedTimeouts();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get("practice") === "true";
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(5);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [targetNote, setTargetNote] = useState(0);
  const targetNoteRef = useRef(0);
  const [cents, setCents] = useState(0);
  const [hasDetectedPitch, setHasDetectedPitch] = useState(false);
  const [results, setResults] = useState<
    {
      round: number;
      correct: boolean;
      points: number;
      target: string;
      answer: string;
      timeMs: number;
    }[]
  >([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const pitchHistoryRef = useRef<PitchEstimate[]>([]);
  const ignoreMicUntilRef = useRef(0);
  const roundStart = useRef(0);

  const playTargetNote = (noteIdx: number) => {
    ignoreMicUntilRef.current = performance.now() + 950;
    pitchHistoryRef.current = [];
    setHasDetectedPitch(false);
    setIsPlaying(true);
    playTone(freq(noteIdx), 0.8);
    trackTimeout(() => setIsPlaying(false), 800);
  };

  const startRound = () => {
    const noteIdx = Math.floor(Math.random() * 12);
    // Ref updates synchronously so a mic loop started in this same event sees
    // the new target; React state alone would leave round 1 comparing to C.
    targetNoteRef.current = noteIdx;
    setTargetNote(noteIdx);
    setCents(0);
    setHasDetectedPitch(false);
    setPhase("playing");
    setRound((r) => r + 1);
    roundStart.current = Date.now();
    playTargetNote(noteIdx);
  };

  const startMic = async () => {
    try {
      setMicError(null);
      setMicStatus("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      setMicStatus("active");
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      source.connect(analyser);
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      const data = new Float32Array(analyser.fftSize);
      const detect = () => {
        analyser.getFloatTimeDomainData(data);
        if (performance.now() < ignoreMicUntilRef.current) {
          pitchHistoryRef.current = [];
          setHasDetectedPitch(false);
        } else {
          const estimate = estimatePitch(data, ctx.sampleRate);
          if (estimate) {
            pitchHistoryRef.current = [
              ...pitchHistoryRef.current.slice(-4),
              estimate,
            ];
            const stable = stabilizePitch(pitchHistoryRef.current);
            if (stable) {
              const targetFreq = freq(targetNoteRef.current);
              setCents(
                Math.round(calculateCentsDeviation(stable.frequency, targetFreq)),
              );
              setHasDetectedPitch(true);
            }
          } else {
            pitchHistoryRef.current = [];
            setHasDetectedPitch(false);
          }
        }
        rafRef.current = requestAnimationFrame(detect);
      };
      detect();
    } catch (err) {
      const denied = err instanceof Error && err.name === "NotAllowedError";
      setMicStatus(denied ? "denied" : "unavailable");
      setMicError(
        denied
          ? "Microphone access denied. Please allow mic access in your browser settings."
          : "Could not access microphone. Please check your device.",
      );
    }
  };

  const stopMic = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    void audioContextRef.current?.close();
    streamRef.current = null;
    audioContextRef.current = null;
    pitchHistoryRef.current = [];
  };

  const submit = () => {
    if (!hasDetectedPitch) return;
    const correct = Math.abs(cents) < 50;
    const points = correct ? Math.max(100 - Math.abs(cents) * 2, 10) : 0;
    const targetName = NOTE_NAMES[targetNote] ?? "A";
    setScore((s) => s + points);
    if (correct) setStreak((s) => s + 1);
    else setStreak(0);
    setResults((r) => [
      ...r,
      {
        round,
        correct,
        points,
        target: targetName,
        answer: `${cents} cents`,
        timeMs: Date.now() - roundStart.current,
      },
    ]);
    stopMic();
    if (!isPractice && round >= totalRounds) setPhase("done");
    else trackTimeout(async () => {
      startRound();
      await startMic();
    }, 1500);
  };

  const handleStart = async () => {
    setPhase("idle");
    setRound(0);
    setScore(0);
    setStreak(0);
    setResults([]);
    startRound();
    await startMic();
  };

  const handleStop = () => {
    stopMic();
    setPhase("idle");
    setRound(0);
    setScore(0);
    setStreak(0);
    setResults([]);
    setCents(0);
    setMicStatus("idle");
  };

  useEffect(() => {
    return () => {
      stopMic();
    };
  }, []);

  /* ── RESULTS SCREEN ── */
  useEffect(() => {
    if (!(phase === "done")) {
      recordedRef.current = false;
      return;
    }
    if (!recordedRef.current) {
      recordedRef.current = true;
      recordResult({
        mode: "pitch-match",
        score: score,
        accuracy: results.length > 0 ? results.filter((r) => r.correct).length / results.length : 0,
        rounds: totalRounds,
        date: new Date().toISOString(),
        timeMs: totalRounds * 5000,
      });
    }
  }, [phase, recordResult, results, score, totalRounds]);

  // Clear pending timers and audio on unmount (back navigation).
  useEffect(() => {
    return () => {
      clearAllTimeouts();
      stopAllTones();
    };
  }, [clearAllTimeouts]);

  if (phase === "done") {
    const correct = results.filter((r) => r.correct).length;
    return (
      <div className="pb-tab" style={{ background: "var(--ios-bg)", minHeight: "100dvh" }}>
        <div className="mx-auto max-w-sm px-4 pt-12 md:max-w-lg">
          <div style={{ textAlign: "center", paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>🏆</div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "var(--ios-label)",
                letterSpacing: "-0.5px",
                marginBottom: 24,
              }}
            >
              Game Complete
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
                marginBottom: 24,
              }}
            >
              <div className="ios-card" style={{ padding: "14px 12px", textAlign: "center" }}>
                <div
                  style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: ACCENT }}
                >
                  {score}
                </div>
                <div style={{ fontSize: 11, color: "var(--ios-label3)", marginTop: 4 }}>Score</div>
              </div>
              <div className="ios-card" style={{ padding: "14px 12px", textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "-0.5px",
                    color: "var(--ios-label)",
                  }}
                >
                  {correct}/{totalRounds}
                </div>
                <div style={{ fontSize: 11, color: "var(--ios-label3)", marginTop: 4 }}>
                  Correct
                </div>
              </div>
              <div className="ios-card" style={{ padding: "14px 12px", textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "-0.5px",
                    color: "var(--ios-label)",
                  }}
                >
                  {streak}
                </div>
                <div style={{ fontSize: 11, color: "var(--ios-label3)", marginTop: 4 }}>
                  Best Streak
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="ios-btn-primary"
                style={{ background: ACCENT }}
                onClick={() => {
                  setPhase("idle");
                  setRound(0);
                  setScore(0);
                  setStreak(0);
                  setResults([]);
                }}
              >
                Play Again
              </button>
              <button className="ios-btn-secondary" onClick={() => router.push("/dashboard")}>
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TrainingShell
      title="Pitch Match"
      round={round}
      totalRounds={isPractice ? Math.max(round, totalRounds) : totalRounds}
      scoreLabel={isPractice ? "Practice" : `${score} pts`}
      accent={ACCENT}
      micStatus={micStatus}
      micError={micError}
      confirmExit={phase === "playing"}
      exitHref="/dashboard"
    >
      {/* Screen-reader announcement for round results */}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {results.length > 0 && phase === "playing"
          ? results[results.length - 1].correct
            ? `Correct. You matched the note within ${Math.abs(cents)} cents.`
            : `Not quite. You were ${Math.abs(cents)} cents off.`
          : ""}
      </span>
      {/* ── IDLE STATE ── */}
        {phase === "idle" && (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎤</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--ios-label)",
                letterSpacing: "-0.5px",
                marginBottom: 8,
              }}
            >
              Ready to train?
            </div>
            <div style={{ fontSize: 15, color: "var(--ios-label3)", marginBottom: 32 }}>
              Sing or hum to match the target pitch
            </div>
            <button
              onClick={handleStart}
              className="ios-btn-primary"
              style={{ background: ACCENT }}
            >
              Start Training
            </button>
          </div>
        )}

        {/* ── PLAYING STATE ── */}
        {phase === "playing" && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 13,
                color: "var(--ios-label3)",
                letterSpacing: "-0.08px",
                marginBottom: 8,
              }}
            >
              Match this note
            </div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: ACCENT,
                letterSpacing: "-2px",
                lineHeight: 1,
                marginBottom: 12,
              }}
            >
              {NOTE_NAMES[targetNote] ?? "A"}
            </motion.div>
            <div style={{ fontSize: 13, color: "var(--ios-label3)", marginBottom: 12 }}>
              Any octave accepted · reference {freq(targetNote).toFixed(1)} Hz
            </div>

            <div style={{ marginBottom: 12 }}>
              <WaveVisualizer active={isPlaying} color={ACCENT} height={40} />
            </div>

            <motion.button
              onClick={() => playTargetNote(targetNote)}
              whileTap={{ scale: 0.92 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ios-label2)",
                background: "var(--ios-bg2)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Play Target
            </motion.button>

            {/* Cents meter */}
            <div style={{ marginTop: 28 }}>
              <div
                style={{
                  position: "relative",
                  height: 8,
                  borderRadius: 4,
                  background: "var(--ios-bg3)",
                  overflow: "visible",
                  margin: "0 4px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: -2,
                    bottom: -2,
                    width: 1.5,
                    background: "var(--ios-green)",
                    transform: "translateX(-50%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    width: 12,
                    height: 8,
                    borderRadius: 4,
                    background: ACCENT,
                    left: `calc(50% + ${Math.max(-45, Math.min(45, cents / 2))}%)`,
                    transform: "translateX(-50%)",
                    transition: "left 0.1s ease",
                    boxShadow: `0 0 8px ${ACCENT}60`,
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: "var(--ios-label3)",
                }}
              >
                <span>-100¢</span>
                <span>0¢</span>
                <span>+100¢</span>
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color:
                    Math.abs(cents) < 25
                      ? "var(--ios-green)"
                      : Math.abs(cents) < 50
                        ? "var(--ios-orange)"
                        : "var(--ios-red)",
                }}
              >
                {hasDetectedPitch ? (
                  <>
                    {cents > 0 ? "+" : ""}
                    {cents}¢
                  </>
                ) : (
                  "Listening…"
                )}
              </div>
            </div>

            {/* Round + streak info */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 20,
                fontSize: 13,
                color: "var(--ios-label3)",
                letterSpacing: "-0.08px",
                marginTop: 16,
              }}
            >
              <span>
                Round {isPractice ? round : `${round}/${totalRounds}`}
              </span>
              <span>🔥 {streak}</span>
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={submit}
                disabled={!hasDetectedPitch}
                aria-label={hasDetectedPitch ? "Submit pitch" : "Hum a steady note before submitting"}
                className="ios-btn-tonal"
                style={{
                  background: ACCENT,
                  color: "#fff",
                  opacity: hasDetectedPitch ? 1 : 0.5,
                  cursor: hasDetectedPitch ? "pointer" : "not-allowed",
                }}
              >
                {hasDetectedPitch ? "Submit" : "Hum a note first"}
              </button>
              <button
                onClick={handleStop}
                style={{
                  height: 34,
                  borderRadius: 17,
                  padding: "0 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: "var(--ios-bg2)",
                  color: "var(--ios-label3)",
                }}
              >
                Stop
              </button>
            </div>
          </div>
        )}
    </TrainingShell>
  );
}
