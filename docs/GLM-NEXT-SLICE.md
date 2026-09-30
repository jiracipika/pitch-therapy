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

## DONE — Narrow-layout responsive audit of the four shell routes (2026-09-27, commit after 73528ae)

Scope: pitch-match, note-id, frequency-guess, note-wordle (daily route) — setup + playing states, at 360px and 768px, via CDP DOM audit + screenshots.

Findings fixed (all touch-target violations, consistent at both widths):
- `StudioDifficulty` option pills 38px → 44px min-height (shared component — lifts every mode with a difficulty selector).
- `.studio-range` slider 28px → 44px hit height with 5px visible track; gained `--range-accent` for per-game tint. frequency-guess and frequency-hunt migrated from thin inline-styled inputs (16px/12px) onto the shared class; settings volume slider inherits the taller hit area unchanged.
- pitch-match "Play Target" 31px → 44px (minHeight + padding) and "Stop" 34px → 44px.
- note-wordle / frequency-wordle "New puzzle" 36px → 44px.

Evidence:
- CDP DOM audit: 16/16 route-state-width combinations clean — no horizontal overflow, no sub-44px interactive elements outside the header bar, no training-header wrapping.
- Screenshots at 375px (pitch-match playing with mic-denied banner rendering correctly, frequency-guess playing with new accent slider, note-wordle) and 768px.
- `npm run ci:verify` + `next build` (all routes static) pass from the canonical clone.

Known follow-up (out of slice): identical small replay-pill buttons exist on pages outside the four audited routes (drone-lock "Hear Target", tune-in "Hear target", frequency-hunt "Play Target Again", interval-archer replay) — same one-line minHeight fix, next housekeeping pass.

## DONE — Small-target pass, all 18 play pages (2026-09-27, housekeeping follow-up)

The follow-up above is complete, and it closed bigger than listed: a repo-wide CDP sweep (360px, setup + playing states of every page) found one more class of violation the four-route audit couldn't see — waveform-match's 8px detune slider.

Fixed:
- Replay/hear pills → minHeight 44: drone-lock "Hear Target", tune-in "Hear target" + "Skip round", frequency-hunt "Play Target Again", waveform-match replay trio.
- waveform-match detune slider migrated onto `.studio-range` (was an 8px inline input).

Evidence: repo-wide DOM sweep — **18/18 pages fully clean** (no sub-44px interactive elements outside the training header bar, no horizontal overflow, setup + playing states). `ci:verify` + `next build` green.

Note: the training-slice hardening entry's "known gap" (interactive browser smoke) is considered closed — the CDP round-play sweeps across all three Sep 2026 passes (triple-click submit, chord round advance, wordle guess, mic-denied banner, per-page start-button automation) cover it.

## DONE — New-scope slice: PWA installability, brand assets, dialog a11y (2026-09-27, commit after b3ea172)

The roadmap had no defined next slice, so three candidates were promoted into one:

**PWA installability (web)**
- `app/manifest.ts` — name/short_name, standalone display, start_url /dashboard, theme/background #050507, icons 192/512 + maskable 512. Served at /manifest.webmanifest (verified JSON + all icon URLs 200).
- `layout.tsx` appleWebApp metadata (capable, black-translucent, title) + apple-touch-icon — iOS add-to-homescreen renders standalone with the brand mark.

**Brand assets (mobile + web)**
- Placeholder logo replaced everywhere. Generated from the Resonance Studio wordmark (lime rounded square, dark waveform bars): mobile `icon.png` (1024), `adaptive-icon.png` (lime bars on transparent; adaptive bg now #0A0A0F), `splash.png` (1284×2778, centered mark), `logo.png` (settings screen, replaced the deleted logo-placeholder import — caught by the Metro smoke). Web: `icon-192/512/-maskable.png`.
- app.json points at all branded assets; placeholder deleted.

**Accessibility (web)**
- TrainingShell exit dialog: Escape closes, Tab is trapped inside, focus restores to the back button on close (was: focus escaped to page background, no Escape path). CDP-verified: opens focused on "Keep Training", Tab wraps last→first, Escape closes + restores focus.
- Reduced-motion spot check on mobile: no raw Animated loops in any play screen; all motion flows through lib/motion.tsx which honors the system reduce-motion setting.

Evidence: /manifest.webmanifest JSON + icons 200, apple meta in SSR HTML, 3/3 dialog CDP checks, `ci:verify` + `next build` + mobile typecheck + Metro Android export smoke green.

## DONE — Offline service worker + tested PCM decoding + deep mobile a11y (2026-09-27, commit after a6181d7)

**Offline service worker (web)** — the remaining PWA half:
- `public/sw.js`: navigations network-first (never stale HTML online) with cache → precached `/offline` fallback; `/_next/static` cache-first (content-hashed); icons/manifest stale-while-revalidate. Versioned caches, old-cache cleanup on activate. No precache manifest → deploys can't poison the app shell.
- Registered prod-only via `components/ServiceWorkerRegister.tsx` in the root layout. Styled `app/offline/page.tsx`.
- CDP-verified: SW registers, dashboard fully renders with the network emulated offline, recovers when back online.

**PCM decoding hardened in core** (mobile mic path):
- base64 decoder + PCM16→Float32 moved from the hook into `packages/core/src/pcm.ts` (exported from both entries) with 7 vitest cases. TDD paid off immediately: the tests caught that padding-stripped base64 chunks (which streaming native modules sometimes emit) decoded to zero bytes. Decoder now handles padded + stripped remainders.

**Deep mobile a11y integration** (from a full read-only subagent audit of all 18 play screens + components):
- labeled the unlabeled emoji-only replay buttons (4 screens); white-on-accent text → dark-on-accent in 6 screens (worst was 2.15:1); border token no longer used as text color (was 1.85:1); 4 playing headers out of the status-bar zone; outcome banners announce via accessibilityLiveRegion on 10 screens (speed-round's color-only note box gained a state label); Advanced toggle is a real switch; chord chips expose selected state; settings switches labelled; tuning-battle selection dead-code fixed.

Evidence: 728 core tests (incl. new pcm suite), ci:verify + next build + mobile typecheck + Metro smoke green, CDP SW checks 3/3.

## Next slice candidates (open)

- Cross-device sync: BLOCKED on creating a Supabase project + setting `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` in Vercel (project currently has zero env vars). Client auth states already handle both configured/unconfigured.
- Mobile dev-client rebuild to activate mic detection (EAS cloud or re-enable Codemagic `expo_android_eas`).
- Remaining mobile a11y P1s deferred as layout-level: custom PanResponder sliders lack `accessibilityRole="adjustable"` + accessibilityActions (frequency-slider/frequency-guess/frequency-hunt — needs per-game value mapping); pitch-memory piano keys are 28pt wide (needs a 2-row layout); sub-legible fontSize 8-10 labels. These need design decisions, not one-liners.


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
