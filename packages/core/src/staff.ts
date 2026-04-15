// ─── Note-to-Staff Mapping ──────────────────────────────────────────────────
// Maps note names to treble clef staff positions for visual rendering.
//
// Treble clef lines (bottom to top): E4, G4, B4, D5, F5
// Treble clef spaces (bottom to top): F4, A4, C5, E5
//
// Position numbering:
//   0 = C4 (ledger line below staff)
//   1 = D4 (space below staff)
//   2 = E4 (1st line, bottom)
//   ...
//   6 = B4 (3rd line, middle)
//   ...
//   10 = F5 (5th line, top)
//
// Sharps/flats share the same staff position as their natural,
// with an accidental symbol drawn beside the notehead.

export interface StaffPosition {
  /** Vertical step index (0=C4, 2=E4 first line, 10=F5 top line) */
  position: number;
  /** Accidental to display, null for naturals */
  accidental: "#" | "b" | null;
}

/**
 * Map a note name (with optional accidental) to its staff position.
 * Supports C through B with sharps, in octave 4 context.
 */
export function noteToStaffPos(noteName: string): StaffPosition {
  const NATURAL_POSITIONS: Record<string, number> = {
    C: 0,
    D: 1,
    E: 2,
    F: 3,
    G: 4,
    A: 5,
    B: 6,
  };

  // Handle sharps: "C#" -> natural "C" + accidental
  const isSharp = noteName.includes("#");
  const natural = noteName.replace("#", "").replace("b", "");
  const position = NATURAL_POSITIONS[natural];

  if (position === undefined) {
    // Fallback: treat unknown as middle of staff
    return { position: 4, accidental: null };
  }

  return {
    position,
    accidental: isSharp ? "#" : null,
  };
}

/** Staff line positions (the 5 lines of the treble clef) */
export const STAFF_LINES = [2, 4, 6, 8, 10]; // E4, G4, B4, D5, F5

/** Convert a staff position to a vertical pixel offset from bottom */
export function staffPosToY(pos: number, lineSpacing: number = 12): number {
  // Position 2 (E4, bottom line) = 0px offset, each step = lineSpacing/2
  return (pos - 2) * (lineSpacing / 2);
}
