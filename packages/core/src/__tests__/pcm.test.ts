import { describe, expect, it } from "vitest";
import { decodeBase64ToBytes, pcm16ToFloat32 } from "../pcm";

describe("decodeBase64ToBytes", () => {
  it("decodes standard base64 (reference vectors)", () => {
    // "QQ==" → [0x41], "QUI=" → [0x41, 0x42], "QUJD" → [0x41, 0x42, 0x43]
    expect([...decodeBase64ToBytes("QQ==")]).toEqual([0x41]);
    expect([...decodeBase64ToBytes("QUI=")]).toEqual([0x41, 0x42]);
    expect([...decodeBase64ToBytes("QUJD")]).toEqual([0x41, 0x42, 0x43]);
  });

  it("decodes padding-less chunks (streaming native modules sometimes strip it)", () => {
    expect([...decodeBase64ToBytes("QQ")]).toEqual([0x41]);
    expect([...decodeBase64ToBytes("QUI")]).toEqual([0x41, 0x42]);
  });

  it("round-trips binary data through btoa", () => {
    const bytes = new Uint8Array(257);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256;
    const b64 = Buffer.from(bytes).toString("base64");
    expect([...decodeBase64ToBytes(b64)]).toEqual([...bytes]);
  });

  it("decodes multi-chunk stream sizes typical of 93ms 16kHz-ish buffers", () => {
    // 8192 bytes → base64 length 10924 (with padding)
    const bytes = new Uint8Array(8192).map((_, i) => (i * 37) % 256);
    const b64 = Buffer.from(bytes).toString("base64");
    expect(decodeBase64ToBytes(b64).length).toBe(8192);
    expect([...decodeBase64ToBytes(b64)]).toEqual([...bytes]);
  });
});

describe("pcm16ToFloat32", () => {
  it("converts 16-bit little-endian samples with correct sign", () => {
    // 0x0000 → 0, 0x7FFF → ~1.0, 0x8000 → -1.0, 0xFFFF → ≈ -0.00003
    const bytes = new Uint8Array([0x00, 0x00, 0xff, 0x7f, 0x00, 0x80, 0xff, 0xff]);
    const out = pcm16ToFloat32(bytes);
    expect(out.length).toBe(4);
    expect(out[0]).toBe(0);
    expect(out[1]).toBeCloseTo(32767 / 32768, 5);
    expect(out[2]).toBe(-1);
    expect(out[3]).toBeCloseTo(-1 / 32768, 5);
  });

  it("handles odd byte counts by dropping the trailing byte", () => {
    const out = pcm16ToFloat32(new Uint8Array([0x00, 0x00, 0x11]));
    expect(out.length).toBe(1);
  });

  it("scales a sine wave into [-1, 1] without clipping", () => {
    const samples = [16384, -16384, 8192, -8192];
    const bytes = new Uint8Array(samples.length * 2);
    samples.forEach((s, i) => {
      const v = s & 0xffff;
      bytes[i * 2] = v & 0xff;
      bytes[i * 2 + 1] = v >> 8;
    });
    const out = pcm16ToFloat32(bytes);
    for (const v of out) {
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(out[0]).toBeCloseTo(0.5, 4);
    expect(out[1]).toBeCloseTo(-0.5, 4);
  });
});
