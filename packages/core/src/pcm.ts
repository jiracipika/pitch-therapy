// ─── Raw PCM helpers (mobile microphone path) ────────────────────────────────
// Pure, platform-free: used by the mobile mic hook to turn base64 PCM16
// chunks from react-native-live-audio-stream into Float32 frames for
// estimatePitch. Tested in __tests__/pcm.test.ts.

const B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** atob is not guaranteed on Hermes — decode base64 directly. Handles both
 *  padded ('QQ==') and padding-stripped ('QQ') stream chunks. */
export function decodeBase64ToBytes(b64: string): Uint8Array {
  const B64_LOOKUP = new Int16Array(128).fill(-1);
  for (let i = 0; i < B64_ALPHABET.length; i++) {
    B64_LOOKUP[B64_ALPHABET.charCodeAt(i)] = i;
  }
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, "");
  const len = clean.length;
  const out = new Uint8Array(Math.floor((len * 3) / 4));
  let p = 0;
  const at = (k: number) => (k < len ? B64_LOOKUP[clean.charCodeAt(k)]! & 63 : 0);
  for (let i = 0; i < len; i += 4) {
    const rem = Math.min(4, len - i);
    const n =
      (at(i) << 18) |
      (at(i + 1) << 12) |
      (at(i + 2) << 6) |
      at(i + 3);
    out[p++] = (n >> 16) & 255;
    // '=' (61) terminates a padded final group; a short remainder means the
    // stream stripped padding — both gate how many bytes the group holds.
    if (rem >= 3 && clean.charCodeAt(i + 2) !== 61) out[p++] = (n >> 8) & 255;
    if (rem >= 4 && clean.charCodeAt(i + 3) !== 61) out[p++] = n & 255;
  }
  return out.subarray(0, p);
}

/** 16-bit little-endian PCM bytes → normalized Float32 samples (-1..1). */
export function pcm16ToFloat32(bytes: Uint8Array): Float32Array {
  const sampleCount = bytes.length >> 1;
  const out = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const lo = bytes[i * 2]!;
    const hi = bytes[i * 2 + 1]!;
    const sample = (hi << 8) | lo;
    out[i] = ((sample << 16) >> 16) / 32768;
  }
  return out;
}
