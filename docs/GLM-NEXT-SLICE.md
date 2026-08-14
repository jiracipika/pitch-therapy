# GLM Next Slice — Pitch Therapy

Status: implementation-ready handoff
Owner: GLM 5.2/5.3 polish lane
Priority: P1 shared training UX

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
