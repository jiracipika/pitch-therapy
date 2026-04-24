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
