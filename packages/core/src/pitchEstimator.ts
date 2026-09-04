import { PitchDetector as McLeodPitchDetector } from "pitchy";

export interface PitchEstimate {
  frequency: number;
  /** 0..1 periodicity/confidence reported by the McLeod detector. */
  clarity: number;
}

export interface PitchEstimateOptions {
  minFrequency?: number;
  maxFrequency?: number;
  minClarity?: number;
  minRms?: number;
}

const mpmDetectors = new Map<number, McLeodPitchDetector<Float32Array>>();

/**
 * Analyze one time-domain frame with the McLeod Pitch Method (MPM).
 * Detector work buffers are cached by frame size, avoiding per-frame FFT
 * allocations. Returns null for silence, noise, invalid input, or frequencies
 * outside the useful voice/instrument range.
 */
export function estimatePitch(
  input: Float32Array,
  sampleRate: number,
  options: PitchEstimateOptions = {},
): PitchEstimate | null {
  if (input.length < 256 || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    return null;
  }

  const minRms = options.minRms ?? 0.01;
  let energy = 0;
  for (let i = 0; i < input.length; i++) energy += input[i] * input[i];
  if (Math.sqrt(energy / input.length) < minRms) return null;

  let detector = mpmDetectors.get(input.length);
  if (!detector) {
    detector = McLeodPitchDetector.forFloat32Array(input.length);
    detector.clarityThreshold = 0.85;
    detector.minVolumeAbsolute = minRms;
    mpmDetectors.set(input.length, detector);
  }

  const [frequency, clarity] = detector.findPitch(input, sampleRate);
  const minFrequency = options.minFrequency ?? 50;
  const maxFrequency = options.maxFrequency ?? 1600;
  const minClarity = options.minClarity ?? 0.85;
  if (
    !Number.isFinite(frequency) ||
    !Number.isFinite(clarity) ||
    frequency < minFrequency ||
    frequency > maxFrequency ||
    clarity < minClarity
  ) {
    return null;
  }
  return { frequency, clarity };
}

/**
 * Return a stable median pitch after at least three mutually consistent,
 * high-clarity frames. A one-frame octave/harmonic error is discarded as an
 * outlier instead of jerking the tuner needle.
 */
export function stabilizePitch(
  estimates: readonly PitchEstimate[],
  minFrames = 3,
  maxSpreadCents = 35,
  minClarity = 0.8,
): PitchEstimate | null {
  const candidates = estimates
    .filter(
      (estimate) =>
        Number.isFinite(estimate.frequency) &&
        estimate.frequency > 0 &&
        Number.isFinite(estimate.clarity) &&
        estimate.clarity >= minClarity,
    )
    .sort((a, b) => a.frequency - b.frequency);
  if (candidates.length < minFrames) return null;

  const median = candidates[Math.floor(candidates.length / 2)].frequency;
  const inliers = candidates.filter(
    ({ frequency }) =>
      Math.abs(1200 * Math.log2(frequency / median)) <= maxSpreadCents,
  );
  if (inliers.length < minFrames) return null;

  const stable = inliers[Math.floor(inliers.length / 2)];
  return {
    frequency: stable.frequency,
    clarity:
      inliers.reduce((sum, estimate) => sum + estimate.clarity, 0) /
      inliers.length,
  };
}
