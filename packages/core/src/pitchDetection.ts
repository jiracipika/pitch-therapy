// ─── Pitch Detection via McLeod Pitch Method ─────────────────────────────────

import { frequencyToNote } from "./audio";
import { estimatePitch } from "./pitchEstimator";
export { estimatePitch, stabilizePitch } from "./pitchEstimator";
export type { PitchEstimate, PitchEstimateOptions } from "./pitchEstimator";

export interface PitchDetectionResult {
  frequency: number | null;
  note: ReturnType<typeof frequencyToNote>;
  rms: number;
  isVoice: boolean;
}

export class PitchDetector {
  private analyser: AnalyserNode;
  private audioContext: AudioContext;
  private buffer: Float32Array;
  private _isListening = false;

  constructor(audioContext: AudioContext, fftSize = 4096) {
    this.audioContext = audioContext;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.analyser.smoothingTimeConstant = 0.8;
    this.buffer = new Float32Array(this.analyser.fftSize);
  }

  get isListening() {
    return this._isListening;
  }

  getAnalyser(): AnalyserNode {
    return this.analyser;
  }

  connect(source: MediaStreamAudioSourceNode): void {
    source.connect(this.analyser);
  }

  disconnect(): void {
    this.analyser.disconnect();
  }

  start(): void {
    this._isListening = true;
  }

  stop(): void {
    this._isListening = false;
  }

  /** Detect a confidence-gated fundamental via the shared MPM estimator. */
  detect(): PitchDetectionResult {
    this.analyser.getFloatTimeDomainData(this.buffer as Float32Array<ArrayBuffer>);

    let rms = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      rms += this.buffer[i] * this.buffer[i];
    }
    rms = Math.sqrt(rms / this.buffer.length);

    const estimate = estimatePitch(this.buffer, this.audioContext.sampleRate);
    const frequency = estimate?.frequency ?? null;
    return {
      frequency,
      note: frequency ? frequencyToNote(frequency) : null,
      rms,
      isVoice: frequency !== null,
    };
  }

  destroy(): void {
    this.stop();
    this.analyser.disconnect();
  }
}

// ─── Microphone Manager ──────────────────────────────────────────────────────

export type MicPermissionState = "prompt" | "granted" | "denied" | "unsupported";

export class MicrophoneManager {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private detector: PitchDetector | null = null;
  private animFrameId: number | null = null;
  private _isRecording = false;
  private onPitchCallback: ((result: PitchDetectionResult) => void) | null =
    null;

  async getPermissionState(): Promise<MicPermissionState> {
    if (!navigator?.mediaDevices?.getUserMedia) return "unsupported";

    if (typeof navigator.permissions !== "undefined") {
      try {
        const result = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        return result.state as MicPermissionState;
      } catch {
        // Some browsers don't support 'microphone' permission query
      }
    }

    return "prompt";
  }

  async requestPermission(): Promise<boolean> {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch {
      return false;
    }
  }

  get isRecording() {
    return this._isRecording;
  }

  onPitch(cb: (result: PitchDetectionResult) => void): void {
    this.onPitchCallback = cb;
  }

  async start(): Promise<PitchDetector> {
    if (this._isRecording) return this.detector!;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    this.stream = stream;
    this.audioContext = new AudioContext();
    this.sourceNode = this.audioContext.createMediaStreamSource(stream);
    this.detector = new PitchDetector(this.audioContext);
    this.detector.connect(this.sourceNode);
    this._isRecording = true;
    this.detector.start();

    // Start detection loop
    const loop = () => {
      if (!this._isRecording) return;
      const result = this.detector!.detect();
      this.onPitchCallback?.(result);
      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();

    return this.detector;
  }

  stop(): void {
    this._isRecording = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.detector?.stop();
    this.detector?.disconnect();
    this.sourceNode?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.stream = null;
    this.sourceNode = null;
    this.detector = null;
    this.audioContext = null;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  getDetector(): PitchDetector | null {
    return this.detector;
  }

  destroy(): void {
    this.stop();
    this.onPitchCallback = null;
  }
}

// ─── Cents Deviation ─────────────────────────────────────────────────────────

/**
 * Calculate the nearest signed cents deviation between pitch classes.
 *
 * Octave-equivalent notes intentionally collapse to the same pitch class:
 * C2, C4, and C6 are all 0¢ from a C target. Adjacent chromatic notes are
 * ±100¢ apart. The result is wrapped to [-600, 600), so tuning meters never
 * report whole-octave errors such as ±1200¢ or ±4800¢.
 *
 * Positive = sharp, negative = flat.
 */
export function calculateCentsDeviation(
  detectedHz: number,
  targetHz: number,
): number {
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
  // Exact octave ratios can pick up tiny floating-point residue.
  return Math.abs(wrapped) < 1e-9 ? 0 : wrapped;
}

/**
 * Map cents deviation to a -1..+1 range, clamped at ±50 cents.
 */
export function centsToTunerRange(cents: number): number {
  return Math.max(-1, Math.min(1, cents / 50));
}
