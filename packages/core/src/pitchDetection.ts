// ─── Pitch Detection via Autocorrelation ─────────────────────────────────────

import { frequencyToNote } from "./audio";

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

  constructor(audioContext: AudioContext, fftSize = 2048) {
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

  /**
   * Detect pitch using autocorrelation (YIN-inspired).
   * Returns frequency in Hz or null if no clear pitch detected.
   */
  detect(): PitchDetectionResult {
    this.analyser.getFloatTimeDomainData(this.buffer);

    // RMS check — skip silence
    let rms = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      rms += this.buffer[i] * this.buffer[i];
    }
    rms = Math.sqrt(rms / this.buffer.length);

    const isVoice = rms > 0.01;

    if (!isVoice) {
      return { frequency: null, note: null, rms, isVoice: false };
    }

    const frequency = this.autocorrelate();
    const note = frequency ? frequencyToNote(frequency) : null;

    return { frequency, note, rms, isVoice: !!frequency };
  }

  private autocorrelate(): number | null {
    const buf = this.buffer;
    const size = buf.length;
    const sampleRate = this.audioContext.sampleRate;

    // Normalize
    let rms = 0;
    for (let i = 0; i < size; i++) {
      rms += buf[i] * buf[i];
    }
    rms = Math.sqrt(rms / size);
    if (rms < 0.01) return null;

    // Autocorrelation
    const halfSize = Math.floor(size / 2);

    // Find the first dip (zero crossing region)
    let foundDip = false;
    let maxCorr = 0;
    let bestOffset = -1;

    for (let offset = 1; offset < halfSize; offset++) {
      let corr = 0;
      for (let i = 0; i < halfSize; i++) {
        corr += buf[i] * buf[i + offset];
      }

      if (!foundDip && corr < 0) {
        foundDip = true;
      }

      if (foundDip && corr > maxCorr) {
        maxCorr = corr;
        bestOffset = offset;
      }
    }

    if (bestOffset === -1 || maxCorr < 0.01) return null;

    // Parabolic interpolation for sub-sample accuracy
    const y1 = this.correlationAt(bestOffset - 1);
    const y2 = maxCorr;
    const y3 = this.correlationAt(bestOffset + 1);
    const a = (y1 + y3 - 2 * y2) / 2;
    const b = (y3 - y1) / 2;

    let refinedOffset = bestOffset;
    if (Math.abs(a) > 1e-10) {
      refinedOffset = bestOffset - b / (2 * a);
    }

    const frequency = sampleRate / refinedOffset;

    // Valid vocal/instrument range: 50 Hz – 2000 Hz
    if (frequency < 50 || frequency > 2000) return null;

    return frequency;
  }

  private correlationAt(offset: number): number {
    const buf = this.buffer;
    const halfSize = Math.floor(buf.length / 2);
    let corr = 0;
    for (let i = 0; i < halfSize; i++) {
      corr += buf[i] * buf[i + offset];
    }
    return corr;
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
 * Calculate cents deviation from a detected frequency to a target frequency.
 * Positive = sharp, negative = flat.
 */
export function calculateCentsDeviation(
  detectedHz: number,
  targetHz: number,
): number {
  if (detectedHz <= 0 || targetHz <= 0) return 0;
  return 1200 * Math.log2(detectedHz / targetHz);
}

/**
 * Map cents deviation to a -1..+1 range, clamped at ±50 cents.
 */
export function centsToTunerRange(cents: number): number {
  return Math.max(-1, Math.min(1, cents / 50));
}
