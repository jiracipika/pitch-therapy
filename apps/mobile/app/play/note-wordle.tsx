import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  GAME_MODE_META,
  NOTE_WORDLE_NOTES,
  buildNoteWordleResult,
  buildNoteWordleShareText,
  getNoteWordleFeedback,
  noteForSpeech,
  type NoteWordleFeedback,
  type NoteWordleNote,
} from "@pitch-therapy/core";
import NoteComparisonStaff from "@/components/NoteComparisonStaff";
import { playTone, NOTE_FREQS_4 } from "@/lib/audio";
import { triggerCorrectHaptic, triggerIncorrectHaptic } from "@/lib/haptics";
import { useSessionResults } from "@/lib/sessionResults";
import { colors } from "@/lib/theme";

const MODE = GAME_MODE_META["note-wordle"];
const ACCENT = MODE.accentHex;
const MAX_GUESSES = 6;

interface GuessRow {
  note: NoteWordleNote;
  feedback: NoteWordleFeedback;
}

const FEEDBACK_LABELS: Record<NoteWordleFeedback, string> = {
  correct: "Correct",
  close: "Within two semitones",
  miss: "Far away",
};

function randomTarget(): NoteWordleNote {
  return NOTE_WORDLE_NOTES[Math.floor(Math.random() * NOTE_WORDLE_NOTES.length)];
}

export default function NoteWordleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recordResult } = useSessionResults();
  const [targetNote, setTargetNote] = useState<NoteWordleNote>(randomTarget);
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [currentGuess, setCurrentGuess] = useState<NoteWordleNote | null>(null);
  const [phase, setPhase] = useState<"playing" | "won" | "lost">("playing");
  const sessionStartRef = useRef(Date.now());
  const recordedRef = useRef(false);

  const initGame = () => {
    setTargetNote(randomTarget());
    setGuesses([]);
    setCurrentGuess(null);
    setPhase("playing");
    recordedRef.current = false;
    sessionStartRef.current = Date.now();
  };

  useEffect(() => {
    if (phase === "playing" || recordedRef.current) return;
    recordedRef.current = true;
    const result = buildNoteWordleResult(phase, guesses.length);
    recordResult({
      mode: "note-wordle",
      ...result,
      timeMs: Date.now() - sessionStartRef.current,
    });
  }, [guesses.length, phase, recordResult]);

  const playTarget = () => {
    const frequency = NOTE_FREQS_4[targetNote];
    if (frequency) playTone(targetNote, frequency);
  };

  const submitGuess = () => {
    if (!currentGuess || guesses.length >= MAX_GUESSES || phase !== "playing") return;

    const feedback = getNoteWordleFeedback(currentGuess, targetNote);
    const frequency = NOTE_FREQS_4[currentGuess];
    if (frequency) playTone(currentGuess, frequency);

    const nextGuesses = [...guesses, { note: currentGuess, feedback }];
    setGuesses(nextGuesses);
    setCurrentGuess(null);

    if (feedback === "correct") {
      void triggerCorrectHaptic();
      setPhase("won");
      AccessibilityInfo.announceForAccessibility(
        `${noteForSpeech(currentGuess)}, correct. Puzzle solved in ${nextGuesses.length} ${nextGuesses.length === 1 ? "guess" : "guesses"}.`,
      );
      return;
    }

    void triggerIncorrectHaptic();
    if (nextGuesses.length === MAX_GUESSES) {
      setPhase("lost");
      AccessibilityInfo.announceForAccessibility(
        `${noteForSpeech(currentGuess)}, ${FEEDBACK_LABELS[feedback].toLowerCase()}. No guesses remaining. The target was ${noteForSpeech(targetNote)}.`,
      );
      return;
    }

    AccessibilityInfo.announceForAccessibility(
      `${noteForSpeech(currentGuess)}, ${FEEDBACK_LABELS[feedback].toLowerCase()}. ${MAX_GUESSES - nextGuesses.length} guesses remaining.`,
    );
  };

  const shareResult = async () => {
    try {
      await Share.share({
        message: buildNoteWordleShareText(guesses.map((guess) => guess.feedback)),
      });
    } catch {
      AccessibilityInfo.announceForAccessibility(
        "The result could not be shared. Please try again.",
      );
    }
  };

  const rowStyle = (guess?: GuessRow, isCurrent?: boolean) => {
    if (!guess && !isCurrent) return styles.rowEmpty;
    if (!guess) return styles.rowCurrent;
    if (guess.feedback === "correct") return [styles.rowFilled, styles.rowCorrect];
    if (guess.feedback === "close") return [styles.rowFilled, styles.rowClose];
    return [styles.rowFilled, styles.rowMiss];
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.headerAction}
        >
          <Text style={styles.headerButton}>‹ Back</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          Note Wordle
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New puzzle"
          hitSlop={8}
          onPress={initGame}
          style={styles.headerAction}
        >
          <Text style={styles.headerButton}>New</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Find the mystery pitch</Text>
          <Text style={styles.instructionsText}>
            Listen, choose a note, and use the distance hint. You have six attempts.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Play target tone"
            accessibilityHint="Plays the mystery note"
            onPress={playTarget}
            style={styles.listenButton}
          >
            <Text style={styles.listenButtonText}>▶ Play target tone</Text>
          </Pressable>
        </View>

        <View accessibilityRole="summary" style={styles.guessList}>
          {Array.from({ length: MAX_GUESSES }).map((_, index) => {
            const guess = guesses[index];
            const isCurrent = phase === "playing" && index === guesses.length;
            const label = guess
              ? `Guess ${index + 1}: ${noteForSpeech(guess.note)}. ${FEEDBACK_LABELS[guess.feedback]}.`
              : isCurrent
                ? `Guess ${index + 1}: ${currentGuess ? noteForSpeech(currentGuess) : "no note selected"}`
                : `Guess ${index + 1}: empty`;
            const feedbackColor = guess
              ? guess.feedback === "correct"
                ? colors.success
                : guess.feedback === "close"
                  ? colors.warning
                  : colors.danger
              : colors.textSecondary;

            return (
              <View
                key={index}
                accessible
                accessibilityLabel={label}
                style={rowStyle(guess, isCurrent)}
              >
                <Text style={[styles.guessNote, { color: feedbackColor }]}>
                  {guess ? guess.note : isCurrent ? (currentGuess ?? "?") : ""}
                </Text>
                {guess ? (
                  <Text style={[styles.feedbackText, { color: feedbackColor }]}>
                    {FEEDBACK_LABELS[guess.feedback]}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>

        {phase === "playing" ? (
          <View>
            <Text nativeID="note-picker-label" style={styles.sectionLabel}>
              Choose a note
            </Text>
            <View
              accessibilityLabelledBy="note-picker-label"
              accessibilityRole="radiogroup"
              style={styles.noteGrid}
            >
              {NOTE_WORDLE_NOTES.map((note) => {
                const selected = currentGuess === note;
                return (
                  <Pressable
                    key={note}
                    accessibilityRole="radio"
                    accessibilityLabel={noteForSpeech(note)}
                    accessibilityState={{ selected }}
                    onPress={() => setCurrentGuess(note)}
                    style={[styles.noteButton, selected && styles.noteButtonSelected]}
                  >
                    <Text
                      style={[styles.noteButtonText, selected && styles.noteButtonTextSelected]}
                    >
                      {note}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityHint={
                currentGuess ? `Submit ${noteForSpeech(currentGuess)}` : "Select a note first"
              }
              accessibilityState={{ disabled: !currentGuess }}
              disabled={!currentGuess}
              onPress={submitGuess}
              style={[styles.submitButton, !currentGuess && styles.buttonDisabled]}
            >
              <Text style={styles.submitButtonText}>
                {currentGuess ? `Submit ${currentGuess}` : "Select a note to submit"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.resultCard}>
            <Text accessibilityElementsHidden style={styles.resultEmoji}>
              {phase === "won" ? "🎉" : "🎧"}
            </Text>
            <Text
              accessibilityLiveRegion="polite"
              accessibilityRole="header"
              style={styles.resultTitle}
            >
              {phase === "won" ? `Solved in ${guesses.length}!` : `The target was ${targetNote}4`}
            </Text>
            <Text style={styles.resultSubtitle}>
              {phase === "won"
                ? `Score ${buildNoteWordleResult("won", guesses.length).score} · ${guesses.length} of ${MAX_GUESSES} attempts`
                : "Listen once more, compare the final guess, then try a new puzzle."}
            </Text>
            <View style={styles.staffContainer}>
              <NoteComparisonStaff
                guessedNote={guesses[guesses.length - 1]?.note ?? "?"}
                correctNote={targetNote}
                isCorrect={phase === "won"}
              />
            </View>
            <View style={styles.resultActions}>
              <Pressable
                accessibilityRole="button"
                onPress={shareResult}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Share result</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={initGame}
                style={styles.playAgainButton}
              >
                <Text style={styles.submitButtonText}>Play again</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View
          accessible
          accessibilityLabel="Hint legend. Correct, within two semitones, or far away."
          style={styles.legend}
        >
          <Text style={styles.legendText}>✓ Correct · ≈ Within 2 semitones · × Far away</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  headerAction: { minHeight: 48, minWidth: 64, alignItems: "center", justifyContent: "center" },
  headerButton: { color: colors.blue, fontSize: 15, fontWeight: "600" },
  headerTitle: { color: ACCENT, fontSize: 17, fontWeight: "700" },
  content: { width: "100%", maxWidth: 560, alignSelf: "center", padding: 20, paddingBottom: 40 },
  instructions: { alignItems: "center", marginBottom: 20 },
  instructionsTitle: { color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: 6 },
  instructionsText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  listenButton: {
    minHeight: 48,
    marginTop: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  listenButtonText: { color: ACCENT, fontSize: 15, fontWeight: "700" },
  guessList: { gap: 8, marginBottom: 20 },
  rowEmpty: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCurrent: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  rowFilled: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCorrect: { borderColor: colors.success, backgroundColor: "rgba(48,209,88,0.12)" },
  rowClose: { borderColor: colors.warning, backgroundColor: "rgba(255,159,10,0.12)" },
  rowMiss: { borderColor: colors.danger, backgroundColor: "rgba(255,69,58,0.10)" },
  guessNote: { fontSize: 18, fontWeight: "700" },
  feedbackText: { fontSize: 11, fontWeight: "600", marginTop: 1 },
  sectionLabel: { color: colors.text, fontSize: 15, fontWeight: "700", marginBottom: 10 },
  noteGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  noteButton: {
    width: 52,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  noteButtonSelected: { backgroundColor: ACCENT, borderColor: ACCENT },
  noteButtonText: { fontSize: 15, fontWeight: "700", color: colors.textSecondary },
  noteButtonTextSelected: { color: "#001A08" },
  submitButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    paddingHorizontal: 16,
  },
  submitButtonText: { color: "#001A08", fontWeight: "800", fontSize: 16 },
  buttonDisabled: { opacity: 0.38 },
  resultCard: {
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultEmoji: { fontSize: 38, marginBottom: 8 },
  resultTitle: { fontSize: 22, fontWeight: "700", color: colors.text, textAlign: "center" },
  resultSubtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  staffContainer: { width: "100%", marginTop: 12 },
  resultActions: { width: "100%", flexDirection: "row", gap: 10, marginTop: 12 },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  secondaryButtonText: { color: colors.text, fontSize: 14, fontWeight: "700" },
  playAgainButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
  },
  legend: {
    minHeight: 48,
    marginTop: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: "center" },
});
