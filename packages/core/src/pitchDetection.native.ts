// ─── Pitch Detection stub for React Native ───────────────────────────────────
// Web Audio API (AudioContext, AnalyserNode, etc.) does not exist in RN.
// The mobile app uses expo-av for audio instead.

import { FrequencyToNoteResult } from './audio';
export { estimatePitch, stabilizePitch } from './pitchEstimator';
export type { PitchEstimate, PitchEstimateOptions } from './pitchEstimator';

export interface PitchDetectionResult {
  frequency: number | null;
  note: FrequencyToNoteResult | null;
  rms: number;
  isVoice: boolean;
}

export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export class PitchDetector {
  constructor(_audioContext?: unknown, _fftSize?: number) {
    // no-op — Web Audio API not available in RN
  }
  get isListening() { return false; }
  getAnalyser(): null { return null; }
  connect(_source?: unknown) {}
  disconnect() {}
  start() {}
  stop() {}
  detect(): PitchDetectionResult {
    return { frequency: null, note: null, rms: 0, isVoice: false };
  }
  destroy() {}
}

export class MicrophoneManager {
  private _detector: PitchDetector | null = null;

  async getPermissionState(): Promise<MicPermissionState> {
    return 'unsupported';
  }
  async requestPermission(): Promise<boolean> {
    return false;
  }
  get isRecording() { return false; }
  onPitch(_cb: (result: PitchDetectionResult) => void) {}
  async start(): Promise<PitchDetector> {
    this._detector = new PitchDetector();
    return this._detector;
  }
  stop() {}
  getAudioContext(): null { return null; }
  getDetector(): PitchDetector | null { return this._detector; }
  destroy() {
    this.stop();
  }
}

/** Native-safe mirror of the pitch-class cents calculation. */
export function calculateCentsDeviation(detectedHz: number, targetHz: number): number {
  if (
    !Number.isFinite(detectedHz) ||
    !Number.isFinite(targetHz) ||
    detectedHz <= 0 ||
    targetHz <= 0
  ) {
    return 0;
  }

  const rawCents = 1200 * Math.log2(detectedHz / targetHz);
  const wrapped = ((rawCents + 600) % 1200 + 1200) % 1200 - 600;
  return Math.abs(wrapped) < 1e-9 ? 0 : wrapped;
}

export function centsToTunerRange(cents: number): number {
  return Math.max(-1, Math.min(1, cents / 50));
}
