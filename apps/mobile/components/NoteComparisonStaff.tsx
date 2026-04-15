import { View, Text, StyleSheet } from 'react-native';
import { noteToStaffPos, STAFF_LINES } from '@pitch-therapy/core';

// ─── NoteComparisonStaff (React Native) ──────────────────────────────────────
// Treble clef staff comparing guessed (red) vs correct (green) note positions.

interface NoteComparisonStaffProps {
  guessedNote: string;
  correctNote: string;
  isCorrect: boolean;
}

const LINE_SP = 14;         // px per staff position step
const BOTTOM_PAD = 22;      // space below E4 line for ledger notes
const NOTEHEAD_W = 18;
const NOTEHEAD_H = 13;
const STAFF_LEFT = 40;
const STAFF_RIGHT_MARGIN = 14;

function posToBottom(pos: number) {
  return BOTTOM_PAD + (pos - 2) * LINE_SP;
}

export default function NoteComparisonStaff({
  guessedNote,
  correctNote,
  isCorrect,
}: NoteComparisonStaffProps) {
  const guessed = noteToStaffPos(guessedNote);
  const correct = noteToStaffPos(correctNote);
  const needsLowLedger = guessed.position <= 0 || correct.position <= 0;

  const green = '#30D158';
  const red = '#FF453A';

  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        {isCorrect ? 'STAFF POSITION' : 'NOTE COMPARISON'}
      </Text>

      <View style={styles.staffContainer}>
        {/* Treble clef */}
        <Text style={styles.clef}>𝄞</Text>

        {/* 5 staff lines */}
        {STAFF_LINES.map((linePos) => (
          <View
            key={linePos}
            style={[
              styles.staffLine,
              { bottom: posToBottom(linePos) },
            ]}
          />
        ))}

        {/* Ledger line for C4 if needed */}
        {needsLowLedger && (
          <View style={[styles.staffLine, { bottom: posToBottom(0) }]} />
        )}

        {/* Notes */}
        {!isCorrect && (
          <NoteHead
            position={guessed.position}
            accidental={guessed.accidental}
            color={red}
            centerX={95}
            posToBottom={posToBottom}
          />
        )}
        <NoteHead
          position={correct.position}
          accidental={correct.accidental}
          color={isCorrect ? green : green}
          centerX={isCorrect ? 130 : 165}
          posToBottom={posToBottom}
        />
      </View>

      {/* Legend */}
      {!isCorrect ? (
        <View style={styles.legendRow}>
          <Text style={[styles.legendText, { color: red }]}>
            ● {guessedNote} (yours)
          </Text>
          <Text style={[styles.legendText, { color: green }]}>
            ● {correctNote} (correct)
          </Text>
        </View>
      ) : (
        <Text style={[styles.successText, { color: green }]}>
          ✓ {correctNote} — Perfect!
        </Text>
      )}
    </View>
  );
}

// ─── Notehead ────────────────────────────────────────────────────────────────

function NoteHead({
  position,
  accidental,
  color,
  centerX,
  posToBottom,
}: {
  position: number;
  accidental: string | null;
  color: string;
  centerX: number;
  posToBottom: (p: number) => number;
}) {
  const bottomPx = posToBottom(position);

  return (
    <View style={[styles.noteWrapper, { bottom: bottomPx }]}>
      {/* Accidental */}
      {accidental && (
        <Text style={[styles.accidental, { color, right: NOTEHEAD_W / 2 + 4 }]}>
          {accidental}
        </Text>
      )}
      {/* Notehead ellipse */}
      <View
        style={[
          styles.notehead,
          {
            left: centerX - NOTEHEAD_W / 2,
            backgroundColor: color,
            shadowColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717a',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  staffContainer: {
    position: 'relative',
    height: 130,
    marginHorizontal: 'auto',
    width: 260,
  },
  clef: {
    position: 'absolute',
    left: 4,
    bottom: BOTTOM_PAD - 8,
    fontSize: 40,
    color: 'rgba(255,255,255,0.2)',
    fontFamily: 'serif',
  },
  staffLine: {
    position: 'absolute',
    left: STAFF_LEFT,
    right: STAFF_RIGHT_MARGIN,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  noteWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: NOTEHEAD_H + 4,
    alignItems: 'flex-start',
  },
  notehead: {
    position: 'absolute',
    top: 2,
    width: NOTEHEAD_W,
    height: NOTEHEAD_H,
    borderRadius: NOTEHEAD_H / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  accidental: {
    position: 'absolute',
    top: -4,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'serif',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  successText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
  },
});
