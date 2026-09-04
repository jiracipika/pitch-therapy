# Training Slice Hardening — Timer/Audio Leak Cleanup + aria-live Feedback

> **For Hermes:** Execute via GLM coder subagent (delegate_task, sequential), then independent reviewer subagent. Parent verifies commit/push at the end.

**Goal:** Eliminate timer/audio leaks on back-navigation from all 18 web game pages and add `aria-live` round feedback where missing.

**Architecture:** Extract one shared timeout-tracking hook, apply it per game page alongside the canonical unmount cleanup, add `aria-live` result announcements. No game logic changes.

**Tech Stack:** Next.js App Router (apps/web), React 19, Web Audio via `apps/web/lib/audio.ts`.

---

## Baseline evidence (verified 2026-09-03, repo `jiracipika/pitch-therapy` @ f1a1865, clean, 0/0 vs origin/main)

- `npm run ci:verify` passes (lint + typecheck:ci + 738 core tests).
- `npm run build` passes: 32 routes.
- `npm run typecheck:mobile` passes.
- All 18 play pages use TrainingShell.
- `stopAllTones()` already exported from `apps/web/lib/audio.ts:14`.
- `trackTimeout` pattern already exists locally in `apps/web/app/play/pitch-memory/page.tsx` (the model to extract).

## Gap inventory (measured, not guessed)

**Bare setTimeout/setInterval with ZERO clears (11 pages — leaks):**
cents-deviation (2), chord-detective (2), drone-lock (2), frequency-guess (3), frequency-hunt (2), interval-archer (5), piano-tap (2), pitch-match (2), tune-in (3), waveform-match (2), frequency-slider (0 bare but include in sweep for stopAllTones).

**Partially cleaned (7 pages — missing leak sources):** frequency-wordle, name-that-note, note-id, note-wordle, pitch-memory, speed-round, tuning-battle.

**stopAllTones adopted:** 5/18 pages. **aria-live:** 2/18 pages. **role="slider" keyboard support:** 2 pages (out of scope unless trivial — do not expand).

---

### Task 1: Extract shared timeout-tracking hook

**Files:**
- Create: `apps/web/lib/useTrackedTimeouts.ts`

```ts
"use client";
import { useEffect, useRef } from "react";

/**
 * Tracks setTimeout ids so ALL pending timeouts can be cleared on unmount.
 * Prevents feedback/audio timers from firing after back-navigation.
 */
export function useTrackedTimeouts() {
  const idsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function trackTimeout(fn: () => void, delay: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      idsRef.current = idsRef.current.filter((t) => t !== id);
      fn();
    }, delay);
    idsRef.current.push(id);
    return id;
  }

  function clearAllTimeouts() {
    idsRef.current.forEach((t) => clearTimeout(t));
    idsRef.current = [];
  }

  useEffect(() => clearAllTimeouts, []);

  return { trackTimeout, clearAllTimeouts };
}
```

**Verify:** `npm run typecheck:web` → exit 0.
**Commit:** `feat(web): shared useTrackedTimeouts hook for game timer cleanup`

### Task 2: Migrate the 11 zero-cleanup pages

For EACH of: `cents-deviation`, `chord-detective`, `drone-lock`, `frequency-guess`, `frequency-hunt`, `interval-archer`, `piano-tap`, `pitch-match`, `tune-in`, `waveform-match`, `frequency-slider` (page under `apps/web/app/play/<mode>/page.tsx`):

1. Import `{ useTrackedTimeouts } from "@/lib/useTrackedTimeouts"` and `stopAllTones` from `"@/lib/audio"` (merge with existing playTone import).
2. In the component: `const { trackTimeout, clearAllTimeouts } = useTrackedTimeouts();`
3. Replace every bare `setTimeout(fn, d)` with `trackTimeout(fn, d)`; replace bare `setInterval` with a ref-stored interval.
4. Add canonical unmount cleanup (only if the page lacks a unmount effect):

```tsx
useEffect(() => {
  return () => {
    clearAllTimeouts();
    if (timerRef.current) clearInterval(timerRef.current);
    stopAllTones();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

   For pages already having a unmount return: merge the three cleanup calls into it.
5. Keep ALL game logic identical. Do not touch scoring, phases, or TrainingShell props.

**Verify per batch:** `npm run typecheck:web && npm run lint` → clean.
**Commit:** one commit for all 11: `fix(web): clear game timers and audio on unmount across 11 game pages`

### Task 3: Patch the 7 partially-cleaned pages

Pages: `frequency-wordle`, `name-that-note`, `note-id`, `note-wordle`, `pitch-memory`, `speed-round`, `tuning-battle`.

Same pattern, but only add what's MISSING per page: bare timeouts not routed through tracking (pitch-memory already uses a local trackTimeout — migrate it to the shared hook and delete the local copy), missing `stopAllTones()`, missing interval clears. Do not duplicate cleanup calls.

**Verify:** `npm run typecheck:web && npm run lint` → clean.
**Commit:** `fix(web): complete timer/audio cleanup on remaining 7 game pages`

### Task 4: aria-live round feedback sweep

For every play page that announces round results visually (correct/incorrect feedback text) but lacks `aria-live`: wrap the feedback region in `<div aria-live="polite" className="sr-only">{message}</div>` (or add `aria-live="polite"` to the existing visible feedback element if one exists). Message must include correct/incorrect + the target answer. Confirm `.sr-only` exists in `apps/web/app/globals.css` (it does per prior work — verify with grep before relying on it).

Also update the **mobile** counterparts (`apps/mobile/app/play/*.tsx`) ONLY where a literal `<Text>` result announcement exists and lacks `accessibilityLiveRegion`: add `accessibilityLiveRegion="polite"` on Android-usable feedback Views. Keep this narrow — no refactor.

**Verify:** `npm run typecheck:web && npm run typecheck:mobile` → clean.
**Commit:** `feat(a11y): aria-live round-result announcements on game pages`

### Task 5: Full verification gate + interactive smoke

```bash
npm run ci:verify          # lint + typecheck:ci + 738+ tests
npm run build              # 32 routes
npm run bundle:android:smoke   # mobile export smoke (optional; skip if env breaks — report honestly)
```

Then production web runtime check (per skill reference interactive-game-runtime-verification): `npm run build && npm run start` (or existing dev server), and with browser automation:
1. Open `/play/pitch-match`, complete one round.
2. Click back mid-feedback within 2s of a round transition → no console errors, no stray tone.
3. Confirm `aria-live` element present in DOM on 2 sampled pages.

### Task 6: Push + handoff update

1. `git fetch origin && git rev-list --left-right --count HEAD...origin/main` — rebase if remote moved.
2. Push. Verify `git rev-parse HEAD == origin/main` and clean tree.
3. Update `docs/GLM-NEXT-SLICE.md`: mark this slice DONE with evidence (test count, route count, commit shas); next slice = narrow-layout responsive audit of the four shell routes.

## Constraints

- NO game-logic changes. NO new CSS files. NO dependency-array rewrites beyond touched lines. NO scope creep into role=slider keyboard work.
- If a page's structure makes trackTimeout awkward (interval-in-interval chains), store interval ids in a ref and clear on unmount — acceptable deviation, note it in the commit body.
- After ANY runtime-discovered edit, rerun the FULL verification gate — earlier green output is stale.
