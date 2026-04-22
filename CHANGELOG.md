# Changelog

All notable changes to this project are documented in this file.

## 2026-04-22

### Android Launch Hotfix (Phase 1)
- Added Codemagic pre-build diagnostics for mobile dependency resolution (`react`, `react-native`, `expo`, `expo-router`).
- Added Android export smoke checks and aligned Expo config/build execution from `apps/mobile`.
- Kept Hermes enabled and fixed startup-adjacent mobile component issues tied to launch reliability.
- Ignored Expo local state at `apps/mobile/.expo/`.

### Stabilization Pass (Phase 2)
- Aligned CI checks to run lint, typecheck matrix, and tests consistently.
- Added root scripts for workspace typecheck aggregation (`typecheck:*`, `typecheck:ci`) and unified test invocation.
- Added Turbo pipeline support for `test`.
- Fixed non-launch typing/tooling debt surfaced in mobile and core.
- Updated package lint scripts for ESLint legacy-config compatibility where needed.

### References
- PR #2: https://github.com/jiracipika/pitch-therapy/pull/2
- PR #3: https://github.com/jiracipika/pitch-therapy/pull/3
- Merge commit (phase 1): `5e6679b5d1ff263e3b7bd2eb4151adabedc4e750`
- Merge commit (phase 2): `59610c3b22b580b93a5dad4fa89cec7ca42bd397`
