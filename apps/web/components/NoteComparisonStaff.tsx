'use client';

import { noteToStaffPos, STAFF_LINES } from '@pitch-therapy/core';

// ─── NoteComparisonStaff ─────────────────────────────────────────────────────
// Shows a treble clef staff comparing guessed vs correct note positions.
// Red = user's guess, Green = correct answer, Green only = correct guess.

interface NoteComparisonStaffProps {
  guessedNote: string;  // e.g. "C#" or "D"
  correctNote: string;  // e.g. "A" or "G#"
  isCorrect: boolean;
}

const LINE_SPACING = 16;   // px between adjacent staff positions
const NOTEHEAD_W = 18;
const NOTEHEAD_H = 14;
const STAFF_BOTTOM_PAD = 28; // space below bottom line for ledger notes
const CONTAINER_H = 140;

export default function NoteComparisonStaff({
  guessedNote,
  correctNote,
  isCorrect,
}: NoteComparisonStaffProps) {
  const guessed = noteToStaffPos(guessedNote);
  const correct = noteToStaffPos(correctNote);

  // Y offset from bottom of staff area (E4 = position 2 = 0px)
  const toBottomPx = (pos: number) => STAFF_BOTTOM_PAD + (pos - 2) * LINE_SPACING;

  // Need ledger line below staff if either note is C4 (pos 0) or D4 (pos 1)?
  const needsLowLedger = guessed.position <= 0 || correct.position <= 0;

  // Color scheme
  const greenColor = '#30D158';
  const redColor = '#FF453A';
  const successColor = '#30D158';

  return (
    <div style={{
      background: 'var(--ios-bg2)',
      borderRadius: 16,
      padding: '16px 12px',
      border: '1px solid var(--ios-sep)',
      marginBottom: 16,
    }}>
      {/* Label */}
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--ios-label3)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: 12,
        textAlign: 'center',
      }}>
        {isCorrect ? 'Staff Position' : 'Note Comparison'}
      </div>

      {/* Staff container */}
      <div style={{ position: 'relative', margin: '0 auto', width: 260, height: CONTAINER_H }}>
        {/* Treble clef symbol */}
        <div style={{
          position: 'absolute',
          left: 4,
          bottom: STAFF_BOTTOM_PAD - 6,
          fontSize: 42,
          lineHeight: 1,
          color: 'rgba(255,255,255,0.25)',
          fontFamily: 'serif',
          userSelect: 'none',
        }}>
          𝄞
        </div>

        {/* 5 staff lines */}
        {STAFF_LINES.map((linePos) => (
          <div
            key={linePos}
            style={{
              position: 'absolute',
              left: 36,
              right: 12,
              height: 1,
              background: 'rgba(255,255,255,0.15)',
              bottom: toBottomPx(linePos),
            }}
          />
        ))}

        {/* Ledger line for C4 if needed */}
        {needsLowLedger && (
          <div style={{
            position: 'absolute',
            left: 36,
            right: 12,
            height: 1,
            background: 'rgba(255,255,255,0.15)',
            bottom: toBottomPx(0),
          }} />
        )}

        {/* Notes - positioned with guessed note on left, correct on right */}
        {!isCorrect && (
          <>
            {/* Guessed note (red) - left side */}
            <NoteHead
              pos={guessed.position}
              accidental={guessed.accidental}
              color={redColor}
              label={guessedNote}
              centerX={110}
              toBottomPx={toBottomPx}
              isLabel="Your guess"
            />
          </>
        )}

        {/* Correct note (green) - right side (or center if correct) */}
        <NoteHead
          pos={correct.position}
          accidental={correct.accidental}
          color={isCorrect ? successColor : greenColor}
          label={correctNote}
          centerX={isCorrect ? 140 : 180}
          toBottomPx={toBottomPx}
          isLabel={isCorrect ? 'Correct!' : 'Correct'}
        />
      </div>

      {/* Legend */}
      {!isCorrect && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginTop: 8,
          fontSize: 11,
        }}>
          <span style={{ color: redColor }}>● {guessedNote} (yours)</span>
          <span style={{ color: greenColor }}>● {correctNote} (correct)</span>
        </div>
      )}
      {isCorrect && (
        <div style={{
          textAlign: 'center',
          marginTop: 8,
          fontSize: 13,
          fontWeight: 600,
          color: successColor,
        }}>
          ✓ {correctNote} — Perfect!
        </div>
      )}
    </div>
  );
}

// ─── Notehead sub-component ──────────────────────────────────────────────────

function NoteHead({
  pos,
  accidental,
  color,
  label,
  centerX,
  toBottomPx,
  isLabel,
}: {
  pos: number;
  accidental: string | null;
  color: string;
  label: string;
  centerX: number;
  toBottomPx: (p: number) => number;
  isLabel: string;
}) {
  const bottomPx = toBottomPx(pos);

  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: bottomPx }}>
      {/* Accidental symbol */}
      {accidental && (
        <div style={{
          position: 'absolute',
          right: centerX + NOTEHEAD_W / 2 + 2,
          top: -6,
          fontSize: 14,
          fontWeight: 700,
          color,
          fontFamily: 'serif',
          lineHeight: 1,
        }}>
          {accidental}
        </div>
      )}

      {/* Ellipse notehead */}
      <div style={{
        position: 'absolute',
        left: centerX - NOTEHEAD_W / 2,
        top: -NOTEHEAD_H / 2,
        width: NOTEHEAD_W,
        height: NOTEHEAD_H,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 8px ${color}40`,
        transition: 'all 0.3s ease',
      }} />

      {/* Label below notehead */}
      <div style={{
        position: 'absolute',
        left: centerX,
        transform: 'translateX(-50%)',
        top: NOTEHEAD_H / 2 + 2,
        fontSize: 9,
        color: 'var(--ios-label3)',
        whiteSpace: 'nowrap',
      }}>
        {isLabel}
      </div>
    </div>
  );
}
