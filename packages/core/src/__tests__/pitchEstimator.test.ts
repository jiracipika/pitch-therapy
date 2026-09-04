import { describe, expect, it } from "vitest";
import { noteToFrequency } from "../audio";
import {
  estimatePitch,
  stabilizePitch,
  type PitchEstimate,
} from "../pitchDetection";

const SAMPLE_RATE = 48_000;
const FRAME_SIZE = 4096;

function synth(
  frequency: number,
  {
    harmonics = [1],
    noise = 0,
    phase = 0,
  }: { harmonics?: number[]; noise?: number; phase?: number } = {},
): Float32Array {
  let seed = 0x51f15e;
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) / 0xffffffff) * 2 - 1;
  };
  const out = new Float32Array(FRAME_SIZE);
  for (let i = 0; i < out.length; i++) {
    let sample = 0;
    for (let h = 0; h < harmonics.length; h++) {
      sample +=
        harmonics[h] *
        Math.sin(2 * Math.PI * frequency * (h + 1) * (i / SAMPLE_RATE) + phase);
    }
    out[i] = sample / harmonics.reduce((sum, value) => sum + Math.abs(value), 0) + noise * random();
  }
  return out;
}

function centsBetween(a: number, b: number): number {
  return 1200 * Math.log2(a / b);
}

describe("estimatePitch", () => {
  it.each(["C2", "E2", "A2", "C3", "F#3", "A4", "C5", "B5"])(
    "tracks %s within five cents",
    (note) => {
      const expected = noteToFrequency(note);
      const result = estimatePitch(synth(expected), SAMPLE_RATE);
      expect(result).not.toBeNull();
      expect(Math.abs(centsBetween(result!.frequency, expected))).toBeLessThan(5);
      expect(result!.clarity).toBeGreaterThan(0.9);
    },
  );

  it("finds the fundamental when the second harmonic is louder", () => {
    const expected = noteToFrequency("A2");
    const result = estimatePitch(
      synth(expected, { harmonics: [0.45, 1, 0.3], noise: 0.015 }),
      SAMPLE_RATE,
    );
    expect(result).not.toBeNull();
    expect(Math.abs(centsBetween(result!.frequency, expected))).toBeLessThan(10);
  });

  it("rejects silence and low-energy background noise", () => {
    expect(estimatePitch(new Float32Array(FRAME_SIZE), SAMPLE_RATE)).toBeNull();
    expect(estimatePitch(synth(220, { harmonics: [0], noise: 0.004 }), SAMPLE_RATE)).toBeNull();
  });

  it("rejects invalid sample rates and undersized frames", () => {
    expect(estimatePitch(new Float32Array(32), SAMPLE_RATE)).toBeNull();
    expect(estimatePitch(synth(220), 0)).toBeNull();
  });
});

describe("stabilizePitch", () => {
  const p = (frequency: number, clarity = 0.98): PitchEstimate => ({ frequency, clarity });

  it("waits for three consistent frames before returning a pitch", () => {
    expect(stabilizePitch([p(220)])).toBeNull();
    expect(stabilizePitch([p(220), p(220.5)])).toBeNull();
    expect(stabilizePitch([p(220), p(220.5), p(219.8)])).toMatchObject({
      frequency: 220,
    });
  });

  it("uses the median so a one-frame octave error cannot move the meter", () => {
    const result = stabilizePitch([p(220), p(440), p(220.4), p(219.8), p(220.2)]);
    expect(result).not.toBeNull();
    expect(result!.frequency).toBeCloseTo(220.2, 6);
  });

  it("rejects unstable or low-clarity windows", () => {
    expect(stabilizePitch([p(200), p(240), p(280)])).toBeNull();
    expect(stabilizePitch([p(220, 0.4), p(220.2, 0.5), p(219.9, 0.6)])).toBeNull();
  });
});
