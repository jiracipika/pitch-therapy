import AsyncStorage from 'expo-sqlite/kv-store';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

export interface AppSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

const SETTINGS_KEY = 'pitch_therapy_settings_v1';
const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  hapticEnabled: true,
};

const listeners = new Set<() => void>();

let cachedSettings: AppSettings = DEFAULT_SETTINGS;
let isHydrated = false;
let hydratePromise: Promise<void> | null = null;

function normalizeSettings(partial: Partial<AppSettings> | null | undefined): AppSettings {
  return {
    soundEnabled: partial?.soundEnabled ?? DEFAULT_SETTINGS.soundEnabled,
    hapticEnabled: partial?.hapticEnabled ?? DEFAULT_SETTINGS.hapticEnabled,
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

async function hydrateSettings() {
  if (isHydrated) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      cachedSettings = normalizeSettings(parsed);
      notify();
    } catch {
      cachedSettings = DEFAULT_SETTINGS;
    } finally {
      isHydrated = true;
      hydratePromise = null;
    }
  })();

  return hydratePromise;
}

function saveSettingsToStorage(settings: AppSettings) {
  void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => {
    // No-op: keep UI responsive even when persistence fails.
  });
}

export function preloadAppSettings() {
  void hydrateSettings();
}

export function getAppSettings(): AppSettings {
  if (!isHydrated && !hydratePromise) {
    void hydrateSettings();
  }
  return cachedSettings;
}

export function updateAppSettings(patch: Partial<AppSettings>) {
  const current = getAppSettings();
  const next: AppSettings = { ...current, ...patch };
  cachedSettings = next;
  saveSettingsToStorage(next);
  notify();
}

export function subscribeAppSettings(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppSettings() {
  const settings = useSyncExternalStore(subscribeAppSettings, getAppSettings, getAppSettings);

  useEffect(() => {
    preloadAppSettings();
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    updateAppSettings({ soundEnabled: enabled });
  }, []);

  const setHapticEnabled = useCallback((enabled: boolean) => {
    updateAppSettings({ hapticEnabled: enabled });
  }, []);

  return {
    ...settings,
    setSoundEnabled,
    setHapticEnabled,
  };
}
