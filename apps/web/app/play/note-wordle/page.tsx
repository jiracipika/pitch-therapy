"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { playTone, stopAllTones, NOTE_NAMES, NOTE_FREQUENCIES } from "@/lib/audio";
import WaveVisualizer from "@/components/WaveVisualizer";
import NoteComparisonStaff from "@/components/NoteComparisonStaff";
import TrainingShell from "@/components/training/TrainingShell";
import { useStatsContext } from "@/components/StatsProvider";
import {
  buildNoteWordleResult,
  buildNoteWordleShareText,
  getNoteWordleFeedback,
  noteForSpeech,
  type NoteWordleFeedback,
} from "@pitch-therapy/core";
import { useTrackedTimeouts } from "@/lib/useTrackedTimeouts";

interface GuessRow {
  note: string;
  feedback: NoteWordleFeedback;
}

const MAX_GUESSES = 6;
const ACCENT = "#30D158";

export default function NoteWordlePage() {
  const { recordResult } = useStatsContext();
  const recordedRef = useRef(false);
  const sessionStartRef = useRef(Date.now());
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router = useRouter();
  const { trackTimeout, clearAllTimeouts } = useTrackedTimeouts();
  const [targetIdx, setTargetIdx] = useState(0);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string | null>(null);
  const [phase, setPhase] = useState<"playing" | "won" | "lost">("playing");
  const [shareStatus, setShareStatus] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [announcement, setAnnouncement] = useState("Puzzle ready. Listen and guess the note.");

  // Canonical game-page unmount cleanup: tracked timeouts + stop all tones.
  useEffect(
    () => () => {
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
      stopAllTones();
    },
    [],
  );

  const initGame = () => {
    setTargetIdx(Math.floor(Math.random() * 12));
    setGuesses([]);
    setCurrentGuess(null);
    setPhase("playing");
    setShareStatus("");
    setAnnouncement("New puzzle ready. Listen and guess the note.");
    recordedRef.current = false;
    sessionStartRef.current = Date.now();
  };

  useEffect(() => {
    if (phase === "playing" || recordedRef.current) return;
    recordedRef.current = true;
    recordResult({
      mode: "note-wordle",
      ...buildNoteWordleResult(phase, guesses.length),
      date: new Date().toISOString(),
      timeMs: Date.now() - sessionStartRef.current,
    });
  }, [guesses.length, phase, recordResult]);

  const playNote = (note: string, durationMs: number) => {
    if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    playTone(NOTE_FREQUENCIES[`${note}4`] || 261.63, durationMs / 1000);
    setIsPlaying(true);
    playbackTimerRef.current = trackTimeout(() => setIsPlaying(false), durationMs);
  };

  const submitGuess = () => {
    if (!currentGuess || guesses.length >= MAX_GUESSES || phase !== "playing") return;
    const feedback = getNoteWordleFeedback(currentGuess, NOTE_NAMES[targetIdx]);
    playNote(currentGuess, 300);
    const newGuesses = [...guesses, { note: currentGuess, feedback }];
    setGuesses(newGuesses);
    setCurrentGuess(null);
    if (feedback === "correct") {
      setPhase("won");
      setAnnouncement(`Correct. Solved in ${newGuesses.length} ${newGuesses.length === 1 ? "guess" : "guesses"}.`);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setPhase("lost");
      setAnnouncement(`No guesses remaining. The note was ${noteForSpeech(NOTE_NAMES[targetIdx])}.`);
    } else {
      const hint =
        feedback === "close" ? "Within two semitones" : "More than two semitones away";
      setAnnouncement(
        `${noteForSpeech(currentGuess)}: ${hint}. ${MAX_GUESSES - newGuesses.length} guesses remaining.`,
      );
    }
  };

  const handleShare = async () => {
    const text = buildNoteWordleShareText(guesses.map((guess) => guess.feedback));
    const canUseShareSheet = typeof navigator.share === "function";
    try {
      if (canUseShareSheet) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      setShareStatus(canUseShareSheet ? "Shared" : "Copied");
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return;
      setShareStatus("Could not share. Try again.");
    }
    window.setTimeout(() => setShareStatus(""), 2500);
  };

  const targetNote = NOTE_NAMES[targetIdx];

  // Clear pending timers and audio on unmount (back navigation).
  useEffect(() => {
    return () => {
      clearAllTimeouts();
      stopAllTones();
    };
  }, [clearAllTimeouts]);

  return (
    <TrainingShell
      title="🟩 Note Wordle"
      round={guesses.length}
      totalRounds={MAX_GUESSES}
      scoreLabel={`${MAX_GUESSES - guesses.length} LEFT`}
      accent={ACCENT}
      confirmExit={phase === "playing" && guesses.length > 0}
      exitHref="/dashboard"
    >
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <WaveVisualizer active={isPlaying} color={ACCENT} height={35} />
        </div>
        {phase === "playing" && (
          <button
            aria-label="New puzzle"
            onClick={initGame}
            style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ios-label2)",
              background: "var(--pt-surface-1)",
              border: "1px solid var(--pt-stroke)",
              borderRadius: 999,
              padding: "9px 14px",
              cursor: "pointer",
              minHeight: 36,
            }}
          >
            New
          </button>
        )}
      </div>

      {/* Guess rows */}
      <div
        role="list"
        aria-label="Note Wordle guesses"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {Array.from({ length: MAX_GUESSES }).map((_, i) => {
          const guess = guesses[i];
          const isCurrent = phase === "playing" && i === guesses.length;
          let bg = "var(--ios-bg2)";
          let border = "1.5px solid var(--ios-sep)";
          let color = "var(--ios-label3)";
          if (guess) {
            if (guess.feedback === "correct") {
              bg = "rgba(48,209,88,0.15)";
              border = "2px solid var(--ios-green)";
              color = "var(--ios-green)";
            } else if (guess.feedback === "close") {
              bg = "rgba(255,159,10,0.15)";
              border = "2px solid var(--ios-orange)";
              color = "var(--ios-orange)";
            } else {
              bg = "rgba(255,69,58,0.12)";
              border = "2px solid var(--ios-red)";
              color = "var(--ios-red)";
            }
          } else if (isCurrent) {
            bg = "var(--ios-bg2)";
            border = "2px solid var(--ios-sep)";
            color = "var(--ios-label)";
          }
          return (
            <div
              key={i}
              role="listitem"
              aria-label={
                guess
                  ? `Guess ${i + 1}: ${noteForSpeech(guess.note)}. ${guess.feedback === "correct" ? "Correct" : guess.feedback === "close" ? "Within two semitones" : "Far away"}.`
                  : `Guess ${i + 1}: ${isCurrent ? "current guess" : "empty"}`
              }
              style={{
                width: "100%",
                height: 52,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                background: bg,
                border,
                color,
                transition: "all 0.2s ease",
              }}
            >
              {guess ? guess.note : isCurrent ? (currentGuess ?? "") : ""}
            </div>
          );
        })}
      </div>

      {phase === "playing" && (
        <div>
          <div
            role="group"
            aria-label="Choose a note"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 6,
              marginBottom: 12,
            }}
          >
            {NOTE_NAMES.map((n) => (
              <button
                key={n}
                aria-pressed={currentGuess === n}
                aria-label={`Select note ${noteForSpeech(n)}`}
                onClick={() => setCurrentGuess(n)}
                style={{
                  borderRadius: 10,
                  padding: "10px 4px",
                  fontSize: 13,
                  fontWeight: 700,
                  background: currentGuess === n ? ACCENT : "var(--ios-bg2)",
                  color: currentGuess === n ? "#000" : "var(--ios-label2)",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.12s",
                  minHeight: 44,
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={submitGuess}
            disabled={!currentGuess}
            className="ios-btn-primary"
            style={{ background: ACCENT, opacity: currentGuess ? 1 : 0.3 }}
          >
            Submit
          </button>
        </div>
      )}

      {(phase === "won" || phase === "lost") && (
        <div style={{ textAlign: "center", paddingTop: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{phase === "won" ? "🎉" : "😔"}</div>
          <div
            role="status"
            aria-live="polite"
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--ios-label)",
              letterSpacing: "-0.5px",
              marginBottom: 20,
            }}
          >
            {phase === "won" ? "Got it!" : `It was ${targetNote}4`}
          </div>

          {/* Staff comparison showing last guess vs target */}
          <NoteComparisonStaff
            guessedNote={guesses[guesses.length - 1]?.note ?? "?"}
            correctNote={targetNote}
            isCorrect={phase === "won"}
          />

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              onClick={handleShare}
              className="ios-btn-secondary"
              style={{ flex: 1 }}
            >
              {shareStatus === "Shared"
                ? "✅ Shared"
                : shareStatus === "Copied"
                  ? "✅ Copied"
                  : "📋 Share result"}
            </button>
            <button
              onClick={initGame}
              className="ios-btn-primary"
              style={{ flex: 1, background: ACCENT }}
            >
              Play Again
            </button>
          </div>
          <button className="ios-btn-secondary" onClick={() => router.push("/dashboard")}>
            Dashboard
          </button>
          <p
            aria-live="polite"
            style={{ minHeight: 20, margin: "8px 0 0", color: "var(--ios-label2)", fontSize: 13 }}
          >
            {shareStatus === "Could not share. Try again." ? shareStatus : ""}
          </p>
        </div>
      )}

      <div className="ios-card" style={{ padding: 16, textAlign: "center", marginTop: 16 }}>
        <div style={{ fontSize: 12, color: "var(--ios-label2)" }}>
          🟩 Correct • 🟨 Within 2 semitones • 🟥 More than 2 semitones
        </div>
        <button
          aria-label="Play target tone"
          onClick={() => playNote(targetNote, 600)}
          style={{
            marginTop: 8,
            fontSize: 12,
            color: ACCENT,
            background: "none",
            border: "none",
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          🔊 Play target tone
        </button>
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </TrainingShell>
  );
}
