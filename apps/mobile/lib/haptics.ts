import * as Haptics from 'expo-haptics';
import { getAppSettings } from '@/lib/settings';

export async function triggerSelectionHaptic() {
  if (!getAppSettings().hapticEnabled) return;
  try {
    await Haptics.selectionAsync();
  } catch {}
}

export async function triggerCorrectHaptic() {
  if (!getAppSettings().hapticEnabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}

export async function triggerIncorrectHaptic() {
  if (!getAppSettings().hapticEnabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {}
}

/** Light impact — subtle tick for micro-interactions (toggles, segment selects). */
export async function triggerImpactLight() {
  if (!getAppSettings().hapticEnabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

/** Medium impact — card taps, button presses with medium emphasis. */
export async function triggerImpactMedium() {
  if (!getAppSettings().hapticEnabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
}

/** Heavy impact — significant events: streak milestone, achievement unlock. */
export async function triggerImpactHeavy() {
  if (!getAppSettings().hapticEnabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {}
}

/** Warning haptic — countdown entering final minute, streak at risk. */
export async function triggerWarningHaptic() {
  if (!getAppSettings().hapticEnabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {}
}
