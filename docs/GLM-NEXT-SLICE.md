# GLM Next Slice — Pitch Therapy

Status: setup-screen migration DONE (2026-09-05). Next slice defined at bottom.
Owner: GLM 5.2/5.3 polish lane
Priority: P1 shared training UX

## DONE — Resonance Studio setup screens on all 16 non-wordle modes (2026-09-05)

Scope: all 15 remaining setup/idle screens migrated to StudioSetup primitives; tuning-battle done screen (previously still inline) migrated to StudioResults.

New primitives in `StudioScreen.tsx`:
- `studioModeMeta(mode)` — eyebrow (`DRILL NN / CATEGORY`), icon, title, description derived from shared `GAME_MODE_META` + `MODE_CATEGORIES`. No local copies.
- `StudioHowTo` — replaces per-page inline "How to Play" ios-cards.
- `StudioToggle` — accessible switch (sr-only checkbox + focus ring) for chord-detective advanced mode.
- `StudioDifficulty` gained `label` + `renderOption` (mode pills, duration pills, Best-of).
- `.studio-setup-error` chip for mic errors (drone-lock, tune-in, pitch-match).

Evidence (verified against `next start` production build, port 3457):
- `npm run ci:verify` passes (738/738 core tests, lint 0, typecheck clean).
- `npm run build` passes — 32 static routes.
- Live CDP: note-id full round → StudioResults ("Ear sharpened.", 0/5 CORRECT etc.); cents-deviation HowTo(4 steps)+hint; chord-detective toggle present; tuning-battle Best-of pills; speed-round 30s/60s pills; frequency-guess in-game StudioListenPad ("TAP TO REPLAY"); all 15 screens render with correct DRILL NN eyebrows; 375px narrow check — no horizontal overflow, 50px start button.

## DONE — Training-slice hardening (2026-09-03, commits 7e2c59a..f55b84a)

Scope: timer/audio leak cleanup on all 18 web game pages + aria-live round feedback.

Evidence (all verified on `main`):
- `npm run ci:verify` passes — lint 0 errors, typecheck:ci clean, core tests 738/738.
- `npm run build` passes — 32 routes.
- `npm run typecheck:mobile` passes.
- Shared hook `apps/web/lib/useTrackedTimeouts.ts` (trackTimeout/trackInterval/clearAllTimeouts).
- All 18 play pages: no bare setTimeout/setInterval; canonical unmount cleanup (`clearAllTimeouts()` + `stopAllTones()`) present; interval-based games keep ref-stored intervals cleared on unmount.
- pitch-memory migrated from a local tracker copy to the shared hook.
- aria-live round-result announcements: 9 pages via FeedbackOverlay's built-in sr-only region; 7 pages (drone-lock, frequency-hunt, name-that-note, pitch-match, pitch-memory, tuning-battle, waveform-match) got dedicated sr-only `role="status" aria-live="polite"` regions; mobile name-that-note got `accessibilityLiveRegion="polite"`; note-wordle/frequency-wordle/speed-round already had coverage.
- Known gap: interactive browser smoke (round-play + back-nav audio check) was NOT completed — the browser-harness daemon was down. Static SSR/build/type evidence only. Re-run the smoke when browser tooling is back.

## Next slice: narrow-layout responsive audit of the four shell routes

Target routes: `pitch-match`, `note-id`, `frequency-guess`, plus one daily challenge route.
- Audit at 360px and 768px: stacked CTA groups, meter/slider hit targets ≥44px, TrainingShell header wrapping.
- Use GAME_MODE_META for any card/copy reuse; no local arrays.
- Gate: ci:verify + build + browser DOM evidence (desktop + 375px).


## Baseline evidence

- `npm run ci:verify` passes.
- Core tests: 690 passing.
- Web production build passes: 32 routes.
- Mobile dependency-resolution check passes.
- Web lint has accumulated stale warnings across training screens.
- Existing design direction is Signal Lab Dark: `#0a0a0f` background, `#1c1c2e` surfaces, cyan/mint signal accents.

## Product goal

Make the training loop feel like one premium audio instrument rather than a collection of unrelated mini-games:

`choose drill → prepare → listen/try → receive clear feedback → see learning result → continue`

## First vertical slice

Implement and wire a shared training shell for exactly these representative routes:

- `apps/web/app/play/pitch-match/page.tsx`
- `apps/web/app/play/note-id/page.tsx`
- `apps/web/app/play/frequency-guess/page.tsx`
- one daily challenge route selected from the current daily flow

Do not migrate all modes in one pass.

## Shared component contract

Create reusable components under `apps/web/components/training/` only when they are wired into the four real routes:

- `TrainingShell`
- `TrainingHeader`
- `SessionProgress`
- `AudioInputStatus`
- `TrainingFeedback`
- `TrainingExitDialog`
- `SessionResultSummary`

The shell must own shared layout and state presentation, not game-specific scoring rules.

## Required states

Every migrated route must visibly handle:

- loading/preparing
- ready
- active round
- correct result
- incorrect result
- microphone permission needed
- microphone denied/unavailable
- session complete
- exit confirmation
- reduced motion

No state may render a dead button or imply a score when audio input was unavailable.

## UX rules

- One dominant primary action per state.
- Minimum 44px touch targets.
- Keyboard operation must remain available on desktop.
- `aria-live` feedback for round results.
- Visible focus rings.
- Reduced motion disables non-essential transitions.
- Do not add a second navigation model.
- Keep the five-destination shell: Home, Modes, Daily, Progress, Settings.
- Preserve existing game logic unless a failing test proves a bug.

## TDD / verification

Before implementation, add the smallest focused test for the shell contract or state mapper and run it RED. Then implement the minimum GREEN slice.

Required checks:

```bash
npm run typecheck:ci
npm run lint
npm run test
npm run build
npm run ci:verify
```

Add a browser smoke check for:

1. dashboard → selected mode
2. mode → training ready state
3. one round result
4. completion/results state
5. exit confirmation

## Lint cleanup boundary

Fix warnings only in files touched by this vertical slice. Do not perform a noisy repository-wide dependency-array rewrite in the same commit.

## Definition of done

- Four real routes use the shared shell.
- No duplicated header/progress/exit logic remains in those routes.
- Existing 690 core tests still pass.
- Web build still generates all 32 routes.
- The first-session user can start one recommended drill without browsing every mode.
- GLM handoff includes screenshots or headless DOM evidence for desktop and narrow mobile widths.
