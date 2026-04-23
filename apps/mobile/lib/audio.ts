// ─── WAV Tone Generator ───────────────────────────────────────────────────────

let cachedBase64Table: string[] | null = null;

function getBase64Table(): string[] {
  if (!cachedBase64Table) {
    cachedBase64Table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');
  }
  return cachedBase64Table;
}

function bytesToBase64(bytes: Uint8Array): string {
  const table = getBase64Table();
  let output = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const chunk = (a << 16) | (b << 8) | c;

    output += table[(chunk >> 18) & 63];
    output += table[(chunk >> 12) & 63];
    output += i + 1 < bytes.length ? table[(chunk >> 6) & 63] : '=';
    output += i + 2 < bytes.length ? table[chunk & 63] : '=';
  }

  return output;
}

function generateToneDataURL(frequency: number, duration: number = 0.6, sampleRate: number = 44100): string {
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  // WAV header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);  // PCM
  view.setUint16(22, 1, true);  // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Sine wave with fade in/out envelope
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const fadeIn = Math.min(1, t * 10);
    const fadeOut = Math.min(1, (duration - t) * 10);
    const envelope = fadeIn * fadeOut;
    const sample = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.7;
    view.setInt16(44 + i * 2, Math.floor(sample * 32767), true);
  }

  // Convert ArrayBuffer to base64 without relying on browser-only globals.
  const bytes = new Uint8Array(buffer);
  return 'data:audio/wav;base64,' + bytesToBase64(bytes);
}

// ─── Note Frequencies ────────────────────────────────────────────────────────

export const NOTE_FREQS_4: Record<string, number> = {
  'C':  261.63,
  'C#': 277.18,
  'D':  293.66,
  'D#': 311.13,
  'E':  329.63,
  'F':  349.23,
  'F#': 369.99,
  'G':  392.00,
  'G#': 415.30,
  'A':  440.00,
  'A#': 466.16,
  'B':  493.88,
};

// ─── Audio Mode Setup ─────────────────────────────────────────────────────────

let audioModeSet = false;
let expoAvModule: typeof import('expo-av') | null = null;

function getExpoAvModule(): typeof import('expo-av') {
  if (!expoAvModule) {
    // Lazy-load native audio module so app startup isn't blocked by AV initialization.
    expoAvModule = require('expo-av');
  }
  return expoAvModule as typeof import('expo-av');
}

async function ensureAudioMode() {
  if (!audioModeSet) {
    const { Audio } = getExpoAvModule();
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    });
    audioModeSet = true;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function playTone(noteOrLabel: string, hz: number, duration: number = 0.6): Promise<void> {
  try {
    await ensureAudioMode();
    const { Audio } = getExpoAvModule();
    const dataUrl = generateToneDataURL(hz, duration);
    const { sound } = await Audio.Sound.createAsync({ uri: dataUrl });
    await sound.playAsync();
    setTimeout(() => {
      sound.unloadAsync().catch(() => {});
    }, (duration + 0.8) * 1000);
  } catch (err) {
    console.error('[audio] playTone failed', err);
  }
}

export async function playFrequency(hz: number, duration: number = 0.6): Promise<void> {
  return playTone('', hz, duration);
}
