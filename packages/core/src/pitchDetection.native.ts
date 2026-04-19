// ─── Pitch Detection stub for React Native ───────────────────────────────────
// Web Audio API (AudioContext, AnalyserNode, etc.) does not exist in RN.
// The mobile app uses expo-av for audio instead.

import { FrequencyToNoteResult } from './audio';

export interface PitchDetectionResult {
  frequency: number | null;
  note: FrequencyToNoteResult | null;
  rms: number;
  isVoice: boolean;
}

export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export class PitchDetector {
  constructor() {
    // no-op
  }
  get isListening() { return false; }
  connect() {}
  disconnect() {}
  start() {}
  stop() {}
  detect(): PitchDetectionResult {
    return { frequency: null, note: null, rms: 0, isVoice: false };
  }
  destroy() {}
}

export class MicrophoneManager {
  async getPermissionState(): Promise<MicPermissionState> {
    return 'unsupported';
  }
  async requestPermission(): Promise<boolean> {
    return false;
  }
  get isRecording() { return false; }
  onPitch() {}
  async start(): Promise<PitchDetector> {
    return new PitchDetector();
  }
  stop() {}
  destroy() {}
}

export function calculateCentsDeviation(detectedHz: number, targetHz: number): number {
  if (detectedHz <= 0 || targetHz <= 0) return 0;
  return 1200 * Math.log2(detectedHz / targetHz);
}

export function centsToTunerRange(cents: number): number {
  return Math.max(-1, Math.min(1, cents / 50));
}
