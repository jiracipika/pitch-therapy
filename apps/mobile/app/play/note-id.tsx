import { View, Text, Pressable } from "react-native";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { GAME_MODE_META, DIFFICULTY_CONFIG, type Difficulty } from "@pitch-therapy/core";
import { GameHeader } from "@/components/GameHeader";
import { GameResultRow, GameResultStats, GameResultsScreen } from "@/components/GameResultsScreen";
import NoteComparisonStaff from "@/components/NoteComparisonStaff";
import { playTone, NOTE_FREQS_4 } from "@/lib/audio";
import { triggerCorrectHaptic, triggerIncorrectHaptic } from "@/lib/haptics";
import { useSessionResults } from "@/lib/sessionResults";

const MODE = GAME_MODE_META["note-id"];
const ACCENT = MODE.accentHex;

const ALL_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

const DIFFICULTY_NOTES: Record<Difficulty, string[]> = {
  easy: ["C", "D", "E", "G", "A"],
  medium: ["C", "C#", "D", "E", "F", "G", "A", "B"],
  hard: [...ALL_NOTES],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Phase = "select-difficulty" | "playing" | "results";

interface RoundResult {
  target: string;
  answer: string;
  correct: boolean;
}

export default function NoteIdScreen() {
  const router = useRouter();
  const { recordResult } = useSessionResults();
  const [phase, setPhase] = useState<Phase>("select-difficulty");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [target, setTarget] = useState("");
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [roundStart, setRoundStart] = useState(0);

  // Per-round countdown (seconds remaining). Mirrors the web Note ID timer
  // driven by DIFFICULTY_CONFIG[difficulty].timeLimit (0 = untimed).
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timedOutRef = useRef(false);
  const feedbackLockRef = useRef(false);
  const sessionStartRef = useRef(0);
  const recordedRef = useRef(false);

  const totalRounds = DIFFICULTY_CONFIG[difficulty].rounds;
  const timeLimit = DIFFICULTY_CONFIG[difficulty].timeLimit;
  const notePool = DIFFICULTY_NOTES[difficulty];
  const isTimed = timeLimit > 0;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup on unmount.
  useEffect(() => clearTimer, [clearTimer]);

  // Persist session result once when the game completes.
  useEffect(() => {
    if (phase !== "results" || recordedRef.current) return;
    recordedRef.current = true;
    const correct = results.filter((r) => r.correct).length;
    recordResult({
      mode: "note-id",
      score,
      accuracy: totalRounds > 0 ? correct / totalRounds : 0,
      rounds: totalRounds,
      timeMs: Date.now() - sessionStartRef.current,
    });
  }, [phase, results, score, totalRounds, recordResult]);

  const beginCountdown = useCallback(() => {
    if (!isTimed) return;
    clearTimer();
    timedOutRef.current = false;
    setTimeLeft(timeLimit);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer();
          timedOutRef.current = true;
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [isTimed, timeLimit, clearTimer]);

  const startGame = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      feedbackLockRef.current = false;
      recordedRef.current = false;
      sessionStartRef.current = Date.now();
      const first = pickRandom(DIFFICULTY_NOTES[diff]);
      setTarget(first);
      setRound(1);
      setScore(0);
      setStreak(0);
      setResults([]);
      setFeedback(null);
      setSelected(null);
      setRoundStart(Date.now());
      setPhase("playing");
      const freq = NOTE_FREQS_4[first];
      if (freq) playTone(first, freq);
      // DIFFICULTY_CONFIG may differ from the current render's `difficulty`
      // until the next render; read the fresh value directly.
      if (DIFFICULTY_CONFIG[diff].timeLimit > 0) {
        const limit = DIFFICULTY_CONFIG[diff].timeLimit;
        clearTimer();
        timedOutRef.current = false;
        setTimeLeft(limit);
        timerRef.current = setInterval(() => {
          setTimeLeft((t) => {
            if (t <= 1) {
              clearTimer();
              timedOutRef.current = true;
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      } else {
        clearTimer();
        setTimeLeft(0);
      }
    },
    [clearTimer],
  );

  const handlePlay = useCallback(() => {
    const freq = NOTE_FREQS_4[target];
    if (freq) playTone(target, freq);
  }, [target]);

  // Auto-fail when the countdown reaches zero while still playing a round.
  useEffect(() => {
    if (!isTimed || phase !== "playing") return;
    if (!timedOutRef.current || timeLeft !== 0) return;
    if (feedbackLockRef.current) return;
    feedbackLockRef.current = true;

    void triggerIncorrectHaptic();
    setFeedback("wrong");
    setSelected(null);
    setStreak(0);
    setResults((r) => [...r, { target, answer: "timeout", correct: false }]);

    setTimeout(() => {
      if (round >= totalRounds) {
        setPhase("results");
      } else {
        const next = pickRandom(notePool);
        setTarget(next);
        setRound((r) => r + 1);
        setFeedback(null);
        setSelected(null);
        setRoundStart(Date.now());
        feedbackLockRef.current = false;
        const freq = NOTE_FREQS_4[next];
        if (freq) playTone(next, freq);
        beginCountdown();
      }
    }, 1000);
  }, [timeLeft, isTimed, phase, target, round, totalRounds, notePool, beginCountdown]);

  const handleAnswer = useCallback(
    (note: string) => {
      if (feedback !== null || feedbackLockRef.current) return;
      feedbackLockRef.current = true;
      clearTimer();
      const correct = note === target;
      const elapsed = Date.now() - roundStart;
      // Timed rounds award a time bonus (parity with web: 100 + timeLeft*5);
      // untimed rounds use the speed-decay formula.
      const pts = correct
        ? isTimed
          ? 100 + timeLeft * 5
          : Math.max(10, Math.round(100 * Math.max(0, 1 - elapsed / 8000)))
        : 0;
      const newStreak = correct ? streak + 1 : 0;
      if (correct) void triggerCorrectHaptic();
      else void triggerIncorrectHaptic();

      setSelected(note);
      setFeedback(correct ? "correct" : "wrong");
      setScore((s) => s + pts);
      setStreak(newStreak);
      setResults((r) => [...r, { target, answer: note, correct }]);

      setTimeout(() => {
        if (round >= totalRounds) {
          setPhase("results");
        } else {
          const next = pickRandom(notePool);
          setTarget(next);
          setRound((r) => r + 1);
          setFeedback(null);
          setSelected(null);
          setRoundStart(Date.now());
          feedbackLockRef.current = false;
          const freq = NOTE_FREQS_4[next];
          if (freq) playTone(next, freq);
          beginCountdown();
        }
      }, 900);
    },
    [
      feedback,
      target,
      round,
      totalRounds,
      streak,
      notePool,
      roundStart,
      isTimed,
      timeLeft,
      clearTimer,
      beginCountdown,
    ],
  );

  // ── Select Difficulty ──────────────────────────────────────────────────────
  if (phase === "select-difficulty") {
    return (
      <View style={{ flex: 1, backgroundColor: "#10130E" }}>
        <View
          style={{
            paddingTop: 56,
            paddingHorizontal: 20,
            paddingBottom: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ACCENT }} />
          <Text style={{ color: "#F8FAFC", fontSize: 22, fontWeight: "700" }}>{MODE.label}</Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: "center" }}>
          <Text style={{ color: "#97A3B6", fontSize: 14, marginBottom: 8 }}>
            Identify the note you hear.
          </Text>
          <Text style={{ color: "#F8FAFC", fontSize: 18, fontWeight: "600", marginBottom: 32 }}>
            Select difficulty
          </Text>
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <Pressable
              key={d}
              onPress={() => startGame(d)}
              accessibilityRole="button"
              accessibilityLabel={`Start ${d} difficulty`}
              accessibilityHint={`${DIFFICULTY_NOTES[d].length} notes · ${DIFFICULTY_CONFIG[d].rounds} rounds${DIFFICULTY_CONFIG[d].timeLimit > 0 ? ` · ${DIFFICULTY_CONFIG[d].timeLimit}s per round` : ""}`}
              style={({ pressed }) => ({
                backgroundColor: "rgba(21,24,32,0.86)",
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
                marginBottom: 12,
                minHeight: 48,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Text
                style={{
                  color: "#F8FAFC",
                  fontWeight: "600",
                  fontSize: 16,
                  textTransform: "capitalize",
                }}
              >
                {d}
              </Text>
              <Text style={{ color: "#97A3B6", fontSize: 13, marginTop: 3 }}>
                {DIFFICULTY_NOTES[d].length} notes · {DIFFICULTY_CONFIG[d].rounds} rounds
                {DIFFICULTY_CONFIG[d].timeLimit > 0
                  ? ` · ${DIFFICULTY_CONFIG[d].timeLimit}s timer`
                  : ""}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => router.back()} style={{ padding: 20 }}>
          <Text style={{ color: "#97A3B6", textAlign: "center" }}>← Back</Text>
        </Pressable>
      </View>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === "results") {
    const correct = results.filter((r) => r.correct).length;
    return (
      <GameResultsScreen
        title="Round Complete!"
        subtitle={`${MODE.label} · ${difficulty}`}
        score={score}
        accent={ACCENT}
        onPlayAgain={() => startGame(difficulty)}
        onExit={() => router.back()}
      >
        <GameResultStats
          items={[
            { label: "Correct", value: `${correct}/${totalRounds}` },
            { label: "Accuracy", value: `${Math.round((correct / totalRounds) * 100)}%` },
          ]}
        />
        {results.map((result, index) => (
          <GameResultRow
            key={`${index}-${result.target}`}
            label={`Round ${index + 1}`}
            detail={`Target: ${result.target}`}
            outcome={
              result.correct ? "Correct" : result.answer === "timeout" ? "Timed out" : result.answer
            }
            success={result.correct}
          />
        ))}
      </GameResultsScreen>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────────────
  const timerPct = isTimed ? Math.max(0, Math.min(1, timeLeft / timeLimit)) : 0;
  const timerUrgent = isTimed && timeLeft <= 3;
  return (
    <View style={{ flex: 1, backgroundColor: "#10130E" }}>
      <GameHeader
        score={score}
        round={round}
        totalRounds={totalRounds}
        streak={streak}
        accent={ACCENT}
      />

      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32 }}>
        {/* Countdown timer bar */}
        {isTimed && (
          <View style={{ marginBottom: 16 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}
            >
              <Text style={{ color: "#97A3B6", fontSize: 12, fontWeight: "600" }}>Time</Text>
              <Text
                accessibilityLabel={`${timeLeft} seconds remaining`}
                style={{
                  color: timerUrgent ? "#f87171" : "#F8FAFC",
                  fontSize: 13,
                  fontWeight: "700",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {timeLeft}s
              </Text>
            </View>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${timerPct * 100}%`,
                  borderRadius: 3,
                  backgroundColor: timerUrgent ? "#f87171" : ACCENT,
                }}
              />
            </View>
          </View>
        )}

        {/* Play button */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Pressable
            onPress={handlePlay}
            accessibilityRole="button"
            accessibilityLabel="Replay tone"
            style={({ pressed }) => ({
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: ACCENT + "22",
              borderWidth: 2,
              borderColor: ACCENT,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text style={{ fontSize: 36 }}>▶</Text>
          </Pressable>
          <Text style={{ color: "#97A3B6", marginTop: 12, fontSize: 14 }}>Tap to replay tone</Text>
        </View>

        {/* Feedback banner */}
        {feedback && (
          <View
            style={{
              backgroundColor:
                feedback === "correct" ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
              borderRadius: 12,
              padding: 12,
              marginBottom: 20,
              alignItems: "center",
              borderWidth: 1,
              borderColor: feedback === "correct" ? "#4ade80" : "#f87171",
            }}
          >
            <Text
              style={{
                color: feedback === "correct" ? "#4ade80" : "#f87171",
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              {feedback === "correct"
                ? "✓ Correct!"
                : selected === null
                  ? `⏱ Time's up — it was ${target}`
                  : `✗ It was ${target}`}
            </Text>
          </View>
        )}

        {/* Staff comparison after reveal */}
        {feedback && selected && (
          <NoteComparisonStaff
            guessedNote={selected}
            correctNote={target}
            isCorrect={feedback === "correct"}
          />
        )}

        {/* Note grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {notePool.map((note) => {
            const isSelected = selected === note;
            const isTarget = feedback !== null && note === target;
            let bgColor = "rgba(255,255,255,0.04)";
            let borderColor = "rgba(255,255,255,0.07)";
            let textColor = "#f4f4f5";

            if (isTarget && feedback !== null) {
              bgColor = "rgba(74,222,128,0.15)";
              borderColor = "#4ade80";
              textColor = "#4ade80";
            } else if (isSelected && feedback === "wrong") {
              bgColor = "rgba(248,113,113,0.15)";
              borderColor = "#f87171";
              textColor = "#f87171";
            }

            return (
              <Pressable
                key={note}
                onPress={() => handleAnswer(note)}
                accessibilityRole="button"
                accessibilityLabel={`Answer ${note}`}
                style={({ pressed }) => ({
                  width: 64,
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: bgColor,
                  borderWidth: 1,
                  borderColor,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text style={{ color: textColor, fontWeight: "700", fontSize: 15 }}>{note}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable onPress={() => router.back()} style={{ padding: 20 }}>
        <Text style={{ color: "#97A3B6", textAlign: "center", fontSize: 13 }}>← Dashboard</Text>
      </Pressable>
    </View>
  );
}
