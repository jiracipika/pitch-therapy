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
import { playTone, NOTE_FREQUENCIES, stopAllTones } from "@/lib/audio";
import FeedbackOverlay from "@/components/FeedbackOverlay";
import { useStatsContext } from "@/components/StatsProvider";
import TrainingShell from "@/components/training/TrainingShell";
import {
  StudioSetup,
  StudioHowTo,
  StudioDifficulty,
  StudioStartButton,
  StudioResults,
  studioModeMeta,
} from "@/components/training/StudioScreen";
import { useTrackedTimeouts } from "@/lib/useTrackedTimeouts";

const ACCENT = "#FF2D55";

const TARGET_NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];

export default function TuneInPage() {
  const { recordResult } = useStatsContext();
  const recordedRef = useRef(false);

  const router = useRouter();
  const { trackTimeout, trackInterval, clearAllTimeouts } = useTrackedTimeouts();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get("practice") === "true";
  const [phase, setPhase] = useState<"setup" | "playing" | "feedback" | "done">("setup");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [targetNote, setTargetNote] = useState("A4");
  const [targetFreq, setTargetFreq] = useState(440);
  const [centsOff, setCentsOff] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [results, setResults] = useState<
    {
      round: number;
      correct: boolean;
      points: number;
      target: string;
      accuracy: number;
      timeMs: number;
    }[]
  >([]);
  const [useMidi, setUseMidi] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sampleBufferRef = useRef<Float32Array | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const pitchHistoryRef = useRef<PitchEstimate[]>([]);
  const targetFreqRef = useRef(440);
  const ignoreMicUntilRef = useRef(0);
  const holdCompletedRef = useRef(false);
  const handleSuccessRef = useRef<() => void>(() => {});
  const roundStartRef = useRef(0);
  const holdStartRef = useRef<number | null>(null);
  const totalRounds = 5;

  useEffect(() => {
    if (!isListening) return;
    // Reuse one buffer across ticks instead of allocating a Float32Array
    // every 50 ms (this loop runs 20×/second).
    if (!sampleBufferRef.current) {
      sampleBufferRef.current = new Float32Array(analyserRef.current?.fftSize ?? 4096);
    }
    const interval = trackInterval(() => {
      if (!analyserRef.current) return;
      const buf = sampleBufferRef.current!;
      if (buf.length !== analyserRef.current.fftSize) {
        sampleBufferRef.current = new Float32Array(analyserRef.current.fftSize);
        return;
      }
      analyserRef.current.getFloatTimeDomainData(buf as Float32Array<ArrayBuffer>);
      if (performance.now() < ignoreMicUntilRef.current) {
        pitchHistoryRef.current = [];
        return;
      }
      const estimate = estimatePitch(buf, audioContextRef.current?.sampleRate || 44100);
      if (!estimate) {
        pitchHistoryRef.current = [];
        return;
      }
      pitchHistoryRef.current = [...pitchHistoryRef.current.slice(-4), estimate];
      const stable = stabilizePitch(pitchHistoryRef.current);
      if (!stable) return;
      const cents = Math.round(
        calculateCentsDeviation(stable.frequency, targetFreqRef.current),
      );
      setCentsOff(cents);

      // Reset the hold clock if the needle drifts; ignore blips ≥50¢ as
      // detection outliers rather than real user error.
      if (Math.abs(cents) <= 10) {
        if (!holdStartRef.current) holdStartRef.current = Date.now();
        const held = Date.now() - holdStartRef.current;
        const needed = 1500;
        setHoldProgress(Math.min(held / needed, 1));
        if (held >= needed && !holdCompletedRef.current) {
          holdCompletedRef.current = true;
          handleSuccessRef.current();
        }
      } else {
        if (Math.abs(cents) >= 50) {
          pitchHistoryRef.current = [];
        }
        holdStartRef.current = null;
        setHoldProgress(0);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isListening, trackInterval]);

  const startMic = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      analyserRef.current = analyser;
      sampleBufferRef.current = new Float32Array(analyser.fftSize);
      pitchHistoryRef.current = [];
      setIsListening(true);
    } catch {
      setMicError("Microphone access denied. Switch to Listen Only mode or grant permission.");
      setUseMidi(true);
    }
  };

  const stopMic = () => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    sampleBufferRef.current = null;
    pitchHistoryRef.current = [];
    setIsListening(false);
    holdStartRef.current = null;
  };

  const pickTarget = () => {
    const note = TARGET_NOTES[Math.floor(Math.random() * TARGET_NOTES.length)];
    const freq = NOTE_FREQUENCIES[note] || 440;
    // Update synchronously before the mic loop ticks; React state updates
    // from this event are asynchronous (stale-target bug in round 1).
    targetFreqRef.current = freq;
    ignoreMicUntilRef.current = performance.now() + 1000;
    holdCompletedRef.current = false;
    pitchHistoryRef.current = [];
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
    setPhase("playing");
    setRound((r) => r + 1);
    roundStartRef.current = Date.now();
  };

  const handleSuccess = () => {
    stopMic();
    const elapsed = Date.now() - roundStartRef.current;
    const accuracy = 1 - Math.abs(centsOff) / 50;
    const points = Math.round(accuracy * 100 + Math.max(0, 50 - elapsed / 100));
    setScore((s) => s + points);
    setStreak((s) => {
      const ns = s + 1;
      setBestStreak((b) => Math.max(b, ns));
      return ns;
    });
    setFeedback("correct");
    setShowFeedbackOverlay(true);
    setResults((r) => [
      ...r,
      { round, correct: true, points, target: targetNote, accuracy, timeMs: elapsed },
    ]);

    trackTimeout(
      () => {
        if (round >= totalRounds) {
          setPhase("done");
          stopMic();
        } else {
          if (!useMidi) startMic();
          nextRound();
        }
      },
      isPractice ? 1000 : 1500,
    );
  };
  handleSuccessRef.current = handleSuccess;

  const handleGiveUp = () => {
    stopMic();
    setFeedback("wrong");
    setShowFeedbackOverlay(false);
    setStreak(0);
    setResults((r) => [
      ...r,
      {
        round,
        correct: false,
        points: 0,
        target: targetNote,
        accuracy: 0,
        timeMs: Date.now() - roundStartRef.current,
      },
    ]);

    trackTimeout(() => {
      if (round >= totalRounds) {
        setPhase("done");
      } else {
        if (!useMidi) startMic();
        nextRound();
      }
    }, 1500);
  };

  useEffect(() => {
    return () => stopMic();
  }, []);

  useEffect(() => {
    if (!(phase === "done")) {
      recordedRef.current = false;
      return;
    }
    if (!recordedRef.current) {
      recordedRef.current = true;
      recordResult({
        mode: "tune-in",
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
    return (
      <StudioResults
        eyebrow="SESSION COMPLETE"
        headline="In tune."
        accent={ACCENT}
        stats={[
          { value: score, label: "SCORE", accentValue: true },
          { value: `${results.filter((r) => r.correct).length}/${totalRounds}`, label: "HITS" },
          { value: bestStreak, label: "BEST STREAK" },
        ]}
        primaryAction={{ label: "Play Again", onClick: startGame }}
        secondaryAction={{ label: "Dashboard", onClick: () => router.push("/dashboard") }}
      />
    );
  }

  if (phase === "setup") {
    return (
      <TrainingShell
          title="Tune In"
          round={0}
          totalRounds={totalRounds}
          scoreLabel={null}
          accent={ACCENT}
          confirmExit={false}
          exitHref="/dashboard"
        >
          <StudioSetup
            icon="📻"
            eyebrow={studioModeMeta("tune-in").eyebrow}
            title="Tune In"
            description="Hit the target note with your voice or instrument"
            accent={ACCENT}
          >
            <StudioHowTo
              steps={[
                "1. A target note appears — tap 🔊 to hear it",
                "2. Sing or play that note into your microphone",
                "3. The tuning meter shows how close you are (±50¢)",
                "4. Hold within ±10¢ for 1.5 seconds to score",
              ]}
            />
            <StudioDifficulty
              options={["mic", "listen"]}
              value={useMidi ? "listen" : "mic"}
              onChange={(v) => setUseMidi(v === "listen")}
              accent={ACCENT}
              label="SELECT INPUT MODE"
              renderOption={(v) => (v === "mic" ? "🎤 Microphone" : "Listen Only")}
              hint={
                useMidi
                  ? "Practice without mic — mark rounds yourself"
                  : "Real-time pitch detection via microphone"
              }
            />
            <StudioStartButton onClick={startGame} accent={ACCENT}>
              Start Game
            </StudioStartButton>
            {micError && (
              <div className="studio-setup-error">
                <strong>Microphone unavailable</strong>
                <span>{micError}</span>
              </div>
            )}
          </StudioSetup>
      </TrainingShell>
    );
  }

  const centsColor =
    Math.abs(centsOff) <= 10
      ? "var(--ios-green)"
      : Math.abs(centsOff) <= 25
        ? "var(--ios-orange)"
        : "var(--ios-red)";

  return (
    <TrainingShell
        title="Tune In"
        round={round}
        totalRounds={totalRounds}
        scoreLabel={null}
        accent={ACCENT}
        confirmExit={phase === "playing"}
        exitHref="/dashboard"
      >
        <FeedbackOverlay
          correct={feedback === "correct"}
          show={showFeedbackOverlay}
          streak={streak}
          onDone={() => setShowFeedbackOverlay(false)}
        />
        {/* Target note */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: ACCENT,
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            {targetNote.replace(/\d+$/, "")}
          </motion.div>
          <div style={{ marginTop: 6, fontSize: 13, color: "var(--ios-label3)" }}>
            Any octave accepted · reference {targetFreq.toFixed(1)} Hz
          </div>
          <motion.button
            onClick={() => playTone(targetFreq, 0.8)}
            whileTap={{ scale: 0.92 }}
            style={{
              marginTop: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 12,
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 500,
              background: "var(--ios-bg2)",
              border: "1px solid var(--ios-sep)",
              color: "var(--ios-label2)",
              cursor: "pointer",
            }}
          >
            🔊 Hear target
          </motion.button>
        </div>

        {useMidi ? (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: "var(--ios-label3)", marginBottom: 20 }}>
              Sing or play the note, then mark your result
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <motion.button
                onClick={handleSuccess}
                whileTap={{ scale: 0.93 }}
                style={{
                  flex: 1,
                  borderRadius: 16,
                  padding: "20px 0",
                  background: "rgba(48,209,88,0.15)",
                  border: "1px solid rgba(48,209,88,0.4)",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "block", fontSize: 24, marginBottom: 4 }}>✓</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ios-green)" }}>
                  Got it
                </span>
              </motion.button>
              <motion.button
                onClick={handleGiveUp}
                whileTap={{ scale: 0.93 }}
                style={{
                  flex: 1,
                  borderRadius: 16,
                  padding: "20px 0",
                  background: "rgba(255,69,58,0.1)",
                  border: "1px solid rgba(255,69,58,0.3)",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "block", fontSize: 24, marginBottom: 4 }}>✗</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ios-red)" }}>Skip</span>
              </motion.button>
            </div>
          </div>
        ) : (
          <>
            {/* Tuning meter */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: "var(--ios-label3)",
                  marginBottom: 6,
                }}
              >
                <span>-50¢</span>
                <span>0</span>
                <span>+50¢</span>
              </div>
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
                    left: `calc(50% + ${Math.max(-45, Math.min(45, centsOff / 2))}%)`,
                    transform: "translateX(-50%)",
                    transition: "left 0.1s ease",
                    boxShadow: `0 0 8px ${ACCENT}60`,
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 8,
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: 700,
                  color: centsColor,
                }}
              >
                {centsOff > 0 ? "+" : ""}
                {centsOff}¢
              </div>
            </div>

            {/* Hold progress */}
            {holdProgress > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="ios-progress-track">
                  <motion.div
                    className="ios-progress-fill"
                    style={{ background: "var(--ios-green)" }}
                    animate={{ width: `${holdProgress * 100}%` }}
                  />
                </div>
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    color: "var(--ios-label3)",
                    marginTop: 4,
                  }}
                >
                  Hold steady...
                </div>
              </div>
            )}

            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "var(--ios-label3)", marginBottom: 8 }}>
                Sing or play into your mic
              </div>
              <motion.button
                onClick={handleGiveUp}
                whileTap={{ scale: 0.95 }}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ios-label3)",
                  background: "var(--ios-bg2)",
                  border: "1px solid var(--ios-sep)",
                  cursor: "pointer",
                  borderRadius: 12,
                  padding: "8px 20px",
                  transition: "opacity 0.12s ease",
                }}
              >
                Skip round
              </motion.button>
            </div>
          </>
        )}

        <div style={{ textAlign: "center", fontSize: 13, color: "var(--ios-label3)" }}>
          🔥 {streak} streak • Round {round}/{totalRounds}
          {isPractice && <span style={{ marginLeft: 8, color: ACCENT }}>Practice</span>}
        </div>
    </TrainingShell>
  );
}
