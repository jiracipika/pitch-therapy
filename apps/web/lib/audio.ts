// Singleton AudioContext — reused to avoid browser 6-context limit and memory leaks
let _ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!_ctx || _ctx.state === 'closed') {
    _ctx = new AudioContext();
  }
  if (_ctx.state === 'suspended') {
    void _ctx.resume();
  }
  return _ctx;
}

// ─── Settings integration ───────────────────────────────────────────────────
//
// playTone reads the persisted user settings (sound on/off, waveform, volume)
// directly from localStorage so that every play screen — including ones that do
// not mount inside the SettingsProvider React tree — honors the user's audio
// preferences. The Settings UI (app/settings/page.tsx) writes to the same key
// via useSettings, so changes take effect on the next tone without a reload.
//
// Keeping this read at the audio layer (instead of threading React context into
// every game page) avoids a large refactor and guarantees the Settings page is
// not a no-op: previously sound/soundType/volume were persisted but never read
// by any caller.

export type ToneWaveform = OscillatorType;

export interface ToneOptions {
  /** Override the persisted waveform (sine/triangle/square/sawtooth). */
  type?: ToneWaveform;
  /** Override the persisted volume (0–1). When omitted, uses stored volume. */
  volume?: number;
}

interface PersistedAudioSettings {
  sound: boolean;
  soundType: ToneWaveform;
  volume: number;
}

const SETTINGS_STORAGE_KEY = 'pitch-therapy-settings-v1';
const VALID_WAVEFORMS: ToneWaveform[] = ['sine', 'triangle', 'square', 'sawtooth'];

function isValidWaveform(value: unknown): value is ToneWaveform {
  return typeof value === 'string' && (VALID_WAVEFORMS as string[]).includes(value);
}

/**
 * Read the persisted audio settings from localStorage.
 *
 * Returns sensible defaults when storage is unavailable (SSR, privacy mode),
 * empty, or malformed. Exported for unit testing.
 */
export function readAudioSettings(): Required<PersistedAudioSettings> {
  const defaults: Required<PersistedAudioSettings> = {
    sound: true,
    soundType: 'sine',
    volume: 0.7,
  };

  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<PersistedAudioSettings>;

    const volume =
      typeof parsed.volume === 'number' &&
      Number.isFinite(parsed.volume) &&
      parsed.volume >= 0 &&
      parsed.volume <= 100
        ? parsed.volume / 100
        : defaults.volume;

    return {
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : defaults.sound,
      soundType: isValidWaveform(parsed.soundType) ? parsed.soundType : defaults.soundType,
      volume,
    };
  } catch {
    return defaults;
  }
}

/**
 * Play a tone at `frequency` Hz for `duration` seconds.
 *
 * Honors the user's persisted settings (sound mute, waveform, volume) unless
 * overridden via `options`. When sound is disabled in Settings, this is a
 * no-op — mirroring the mobile app's behavior.
 */
export function playTone(frequency: number, duration: number = 0.5, options?: ToneOptions): void {
  const settings = readAudioSettings();
  if (!settings.sound) return;

  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = frequency;
  osc.type = options?.type ?? settings.soundType;

  // Clamp volume into a safe perceptual range (0–0.4) so even max UI volume
  // (100%) stays comfortable and avoids clipping on bright waveforms.
  const baseVolume = options?.volume ?? settings.volume;
  const safeVolume = Math.max(0, Math.min(0.4, baseVolume * 0.4));

  gain.gain.setValueAtTime(safeVolume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export const NOTE_FREQUENCIES: Record<string, number> = {
  "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56,
  "E3": 164.81, "F3": 174.61, "F#3": 185.0, "G3": 196.0,
  "G#3": 207.65, "A3": 220.0, "A#3": 233.08, "B3": 246.94,
  "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13,
  "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.0,
  "G#4": 415.30, "A4": 440.0, "A#4": 466.16, "B4": 493.88,
  "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25,
  "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99,
  "G#5": 830.61, "A5": 880.0, "A#5": 932.33, "B5": 987.77,
};

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
