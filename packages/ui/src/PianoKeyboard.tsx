"use client";

import React, { useCallback, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PianoDisplayMode = "chromatic" | "diatonic";
export type KeyHighlightColor = "correct" | "wrong" | "active" | null;

export interface PianoKeyboardProps {
  /** Starting octave (default 3) */
  startOctave?: number;
  /** Number of octaves to show (default 2) */
  octaves?: number;
  /** Display mode */
  mode?: PianoDisplayMode;
  /** Map of note names to highlight color, e.g. { "C4": "correct" } */
  highlights?: Record<string, KeyHighlightColor>;
  /** Show note labels on keys */
  showLabels?: boolean;
  /** Called when a key is pressed/clicked */
  onKeyPress?: (note: string, midiNote: number) => void;
  /** Called when a key is released */
  onKeyRelease?: (note: string, midiNote: number) => void;
  /** Currently pressed notes */
  pressedKeys?: Set<string>;
  /** Additional CSS class */
  className?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const DIATONIC_NOTES = ["C", "D", "E", "F", "G", "A", "B"];

const HIGHLIGHT_COLORS: Record<string, string> = {
  correct: "bg-emerald-400",
  wrong: "bg-red-400",
  active: "bg-blue-400",
};

// ─── Component ───────────────────────────────────────────────────────────────

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  startOctave = 3,
  octaves = 2,
  mode = "chromatic",
  highlights = {},
  showLabels = true,
  onKeyPress,
  onKeyRelease,
  pressedKeys = new Set(),
  className = "",
}) => {
  const notes = useMemo(() => {
    const result: { note: string; midi: number; isBlack: boolean }[] = [];
    const noteList = mode === "diatonic" ? DIATONIC_NOTES : NOTE_NAMES_SHARP;

    for (let oct = startOctave; oct < startOctave + octaves; oct++) {
      for (const noteName of noteList) {
        const idx = NOTE_NAMES_SHARP.indexOf(noteName);
        const midi = (oct + 1) * 12 + idx;
        const fullName = noteName + oct;
        const isBlack = noteName.includes("#");

        if (mode === "chromatic" || !isBlack) {
          result.push({ note: fullName, midi, isBlack });
        }
      }
    }
    return result;
  }, [startOctave, octaves, mode]);

  const handlePointerDown = useCallback(
    (note: string, midi: number) => {
      onKeyPress?.(note, midi);
    },
    [onKeyPress],
  );

  const handlePointerUp = useCallback(
    (note: string, midi: number) => {
      onKeyRelease?.(note, midi);
    },
    [onKeyRelease],
  );

  // Build white and black keys separately for proper overlay
  const whiteKeys = notes.filter((n) => !n.isBlack);
  const blackKeys = notes.filter((n) => n.isBlack);

  return (
    <div className={`relative select-none ${className}`} style={{ touchAction: "none" }}>
      {/* White keys container */}
      <div className="flex">
        {whiteKeys.map((key) => {
          const highlight = highlights[key.note];
          const isPressed = pressedKeys.has(key.note);
          const bg = highlight ? HIGHLIGHT_COLORS[highlight] : isPressed ? "bg-slate-200" : "bg-white";
          const border = highlight
            ? ""
            : isPressed
              ? "border-slate-300"
              : "border-slate-200";

          return (
            <div
              key={key.note}
              className={`
                relative flex-1 h-32 sm:h-40 md:h-48
                border border-t-0 rounded-b-md
                ${bg} ${border}
                cursor-pointer
                transition-colors duration-75
                hover:bg-slate-50
                active:bg-slate-200
              `}
              style={{ minWidth: 0 }}
              onPointerDown={(e) => {
                e.preventDefault();
                handlePointerDown(key.note, key.midi);
              }}
              onPointerUp={() => handlePointerUp(key.note, key.midi)}
              onPointerLeave={() => handlePointerUp(key.note, key.midi)}
            >
              {showLabels && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-slate-500 font-medium">
                  {key.note}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Black keys overlay */}
      <div className="absolute inset-0 flex pointer-events-none">
        {blackKeys.map((key) => {
          // Find position: black key sits between its neighboring white keys
          const whiteIdx = whiteKeys.findIndex(
            (w) => {
              const wNoteName = w.note.replace(/\d/, "");
              const wOct = parseInt(w.note.slice(-1));
              const kNoteName = key.note.replace(/\d/, "");
              const kOct = parseInt(key.note.slice(-1));
              // Black key follows the white key with same base (e.g., C# follows C)
              return NOTE_NAMES_SHARP.indexOf(wNoteName) === NOTE_NAMES_SHARP.indexOf(kNoteName) - 1 && wOct === kOct;
            },
          );

          if (whiteIdx < 0) return null;

          // Each white key is (100 / whiteKeys.length)%, black keys span ~60% and offset between two whites
          const whitePercent = 100 / whiteKeys.length;
          const leftPercent = (whiteIdx + 0.65) * whitePercent;

          const highlight = highlights[key.note];
          const isPressed = pressedKeys.has(key.note);
          const bg = highlight ? HIGHLIGHT_COLORS[highlight] : isPressed ? "bg-slate-600" : "bg-slate-900";

          return (
            <div
              key={key.note}
              className={`
                absolute top-0 pointer-events-auto
                w-[60%] h-[58%] sm:h-[60%] md:h-[62%]
                rounded-b-md z-10
                ${bg}
                cursor-pointer
                transition-colors duration-75
                hover:bg-slate-700
                active:bg-slate-500
                shadow-md
              `}
              style={{
                left: `${leftPercent}%`,
                transform: "translateX(-50%)",
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePointerDown(key.note, key.midi);
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                handlePointerUp(key.note, key.midi);
              }}
              onPointerLeave={(e) => {
                e.stopPropagation();
                handlePointerUp(key.note, key.midi);
              }}
            >
              {showLabels && (
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] text-slate-400 font-medium">
                  {key.note}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PianoKeyboard;
