"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { playTone, getAudioContext, NOTE_NAMES, NOTE_FREQUENCIES, stopAllTones } from "@/lib/audio";
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
import { INTERVALS as CORE_INTERVALS } from "@pitch-therapy/core";

const ACCENT = "#D946EF";

// Display adapter: uses short abbreviation labels for this mode's compact UI.
const INTERVALS = CORE_INTERVALS.map((i) => ({
  name: i.abbr,
  semitones: i.semitones,
}));

type IntervalMode = "ascending" | "descending" | "harmonic";

const MODE_CONFIG: Record<IntervalMode, { label: string; pool: number[] }> = {
  ascending: { label: "Ascending", pool: [1, 2, 3, 4, 5, 7, 8, 9, 12] },
  descending: { label: "Descending", pool: [1, 2, 3, 4, 5, 7, 8, 9, 12] },
  harmonic: { label: "Harmonic", pool: [3, 4, 5, 7, 12] },
};

const TOTAL_ROUNDS = 8;

export default function IntervalArcherPage() {
  const { recordResult } = useStatsContext();
  const recordedRef = useRef(false);

  const router = useRouter();
  const { trackTimeout, clearAllTimeouts } = useTrackedTimeouts();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get("practice") === "true";
  const [phase, setPhase] = useState<"setup" | "playing" | "feedback" | "done">("setup");
  const [intervalMode, setIntervalMode] = useState<IntervalMode>("ascending");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [rootNote, setRootNote] = useState("A3");
  const [rootFreq, setRootFreq] = useState(220);
  const [targetInterval, setTargetInterval] = useState(INTERVALS[4]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<string | null>(null);
  const [results, setResults] = useState<
    {
      round: number;
      root: string;
      interval: string;
      answer: string;
      correct: boolean;
      points: number;
      semitonesOff: number;
    }[]
  >([]);
  const roundRef = useRef(0);
  const roundStartRef = useRef(0);

  const pool = MODE_CONFIG[intervalMode].pool;

  const pickRound = () => {
    const noteIdx = Math.floor(Math.random() * 12);
    const note = NOTE_NAMES[noteIdx];
    const freq = NOTE_FREQUENCIES[`${note}3`] || 220;
    const intervalSemitones = pool[Math.floor(Math.random() * pool.length)];
    const interval = INTERVALS[intervalSemitones];

    setRootNote(`${note}3`);
    setRootFreq(freq);
    setTargetInterval(interval);
    setFeedback(null);
    setSelectedInterval(null);
    return { note, freq, interval };
  };

  const playInterval = (freq: number, semitones: number, mode: IntervalMode) => {
    const secondFreq = freq * Math.pow(2, semitones / 12);
    if (mode === "ascending") {
      playTone(freq, 0.5);
      trackTimeout(() => playTone(secondFreq, 0.8), 550);
    } else if (mode === "descending") {
      playTone(secondFreq, 0.5);
      trackTimeout(() => playTone(freq, 0.8), 550);
    } else {
      // harmonic: play both at once using shared context (no leak)
      const ctx = getAudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.frequency.value = freq;
      osc2.frequency.value = secondFreq;
      osc1.type = "sine";
      osc2.type = "sine";
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.3);
      osc2.stop(ctx.currentTime + 1.3);
    }
  };

  const startGame = () => {
    setRound(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setResults([]);
    roundRef.current = 0;
    nextRound();
  };

  const nextRound = () => {
    const { freq, interval } = pickRound();
    playInterval(freq, interval.semitones, intervalMode);
    setPhase("playing");
    roundRef.current += 1;
    setRound(roundRef.current);
    roundStartRef.current = Date.now();
  };

  const handleAnswer = (semitones: number, name: string) => {
    if (feedback) return;
    const correct = semitones === targetInterval.semitones;
    const elapsed = Date.now() - roundStartRef.current;
    const semitonesOff = Math.abs(semitones - targetInterval.semitones);

    let points = 0;
    if (correct) {
      points = Math.max(10, Math.round(120 - elapsed / 100));
    } else {
      if (semitonesOff === 1) points = 30;
      else if (semitonesOff === 2) points = 10;
    }

    setSelectedInterval(name);
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      setShowFeedbackOverlay(true);
      setStreak((s) => {
        const ns = s + 1;
        setBestStreak((b) => Math.max(b, ns));
        return ns;
      });
    } else {
      setStreak(0);
    }
    setScore((s) => s + points);
    setResults((r) => [
      ...r,
      {
        round: roundRef.current,
        root: rootNote,
        interval: targetInterval.name,
        answer: name,
        correct,
        points,
        semitonesOff,
      },
    ]);

    trackTimeout(() => {
      if (roundRef.current >= TOTAL_ROUNDS) {
        setPhase("done");
      } else {
        nextRound();
      }
    }, 1200);
  };

  useEffect(() => {
    if (!(phase === "done")) {
      recordedRef.current = false;
      return;
    }
    if (!recordedRef.current) {
      recordedRef.current = true;
      recordResult({
        mode: "interval-archer",
        score: score,
        accuracy: results.length > 0 ? results.filter((r) => r.correct).length / results.length : 0,
        rounds: TOTAL_ROUNDS,
        date: new Date().toISOString(),
        timeMs: TOTAL_ROUNDS * 5000,
      });
    }
  }, [phase, recordResult, results, score, TOTAL_ROUNDS]);

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
        headline="Bullseye."
        accent={ACCENT}
        stats={[
          { value: score, label: "SCORE", accentValue: true },
          { value: `${results.filter((r) => r.correct).length}/${TOTAL_ROUNDS}`, label: "CORRECT" },
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
        title="Interval Archer"
        round={0}
        totalRounds={TOTAL_ROUNDS}
        scoreLabel={null}
        accent={ACCENT}
        confirmExit={false}
        exitHref="/dashboard"
      >
        <StudioSetup
          icon="🏹"
          eyebrow={studioModeMeta("interval-archer").eyebrow}
          title="Interval Archer"
          description="Identify intervals — closer to bullseye = more points"
          accent={ACCENT}
        >
          <StudioHowTo
            steps={[
              "1. Hear two notes played in sequence (or together)",
              "2. Identify the musical interval between them",
              "3. Exact hit = bullseye (max pts), 1 semitone off = partial credit",
              "4. Tap 🔊 to replay the interval anytime",
            ]}
          />
          <StudioDifficulty
            options={Object.keys(MODE_CONFIG)}
            value={intervalMode}
            onChange={(m) => setIntervalMode(m as IntervalMode)}
            accent={ACCENT}
            label="SELECT MODE"
            renderOption={(m) => MODE_CONFIG[m as IntervalMode].label}
          />
          <StudioStartButton onClick={startGame} accent={ACCENT}>
            {isPractice ? "🎓 Start Practicing" : "Start Game"}
          </StudioStartButton>
        </StudioSetup>
      </TrainingShell>
    );
  }

  const activeIntervals = INTERVALS.filter((i) => pool.includes(i.semitones));

  return (
    <TrainingShell
        title="Interval Archer"
        round={round}
        totalRounds={TOTAL_ROUNDS}
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
        <div className="ios-progress-track mb-6">
          <motion.div
            className="ios-progress-fill"
            style={{ background: ACCENT }}
            animate={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Replay */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ textAlign: "center" }}>
            <motion.button
              onClick={() => playInterval(rootFreq, targetInterval.semitones, intervalMode)}
              whileTap={{ scale: 0.92 }}
              style={{
                width: 80,
                height: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 24,
                background: "var(--ios-bg2)",
                border: "1px solid var(--ios-sep)",
                fontSize: 36,
                cursor: "pointer",
              }}
            >
              🔊
            </motion.button>
            <div style={{ marginTop: 8, fontSize: 13, color: "var(--ios-label3)" }}>
              Replay interval
            </div>
            <div style={{ marginTop: 2, fontSize: 11, color: "var(--ios-label4)" }}>
              Root: {rootNote} · {MODE_CONFIG[intervalMode].label}
            </div>
          </div>
        </div>

        {/* Interval buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {activeIntervals.map((interval) => {
            const isTarget = feedback && interval.semitones === targetInterval.semitones;
            const isSelected = selectedInterval === interval.name;
            let bg = "var(--ios-bg2)";
            let border = "1.5px solid transparent";
            let color = "var(--ios-label2)";

            if (isTarget) {
              bg = "rgba(48,209,88,0.15)";
              border = "1.5px solid var(--ios-green)";
              color = "var(--ios-green)";
            } else if (isSelected && feedback === "wrong") {
              bg = "rgba(255,69,58,0.15)";
              border = "1.5px solid var(--ios-red)";
              color = "var(--ios-red)";
            }

            return (
              <motion.button
                key={interval.name}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleAnswer(interval.semitones, interval.name)}
                disabled={!!feedback}
                style={{
                  borderRadius: 12,
                  padding: "14px 8px",
                  fontSize: 14,
                  fontWeight: 600,
                  background: bg,
                  border,
                  color,
                  cursor: feedback ? "default" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div>{interval.name}</div>
                <div style={{ fontSize: 10, color: "var(--ios-label4)", marginTop: 2 }}>
                  {interval.semitones === 0
                    ? ""
                    : interval.semitones === 12
                      ? "8va"
                      : `${interval.semitones}st`}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                borderRadius: 12,
                padding: "12px 16px",
                textAlign: "center",
                marginBottom: 12,
                fontSize: 14,
                fontWeight: 600,
                background:
                  feedback === "correct" ? "rgba(48,209,88,0.12)" : "rgba(255,69,58,0.12)",
                border: `1px solid ${feedback === "correct" ? "var(--ios-green)" : "var(--ios-red)"}`,
                color: feedback === "correct" ? "var(--ios-green)" : "var(--ios-red)",
              }}
            >
              {feedback === "correct" ? "🎯 Bullseye!" : `It was ${targetInterval.name}`}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ textAlign: "center", fontSize: 13, color: "var(--ios-label3)" }}>
          🔥 {streak} streak · Round {round}/{TOTAL_ROUNDS}
          {isPractice && <span style={{ marginLeft: 8, color: ACCENT }}>Practice</span>}
        </div>
    </TrainingShell>
  );
}
