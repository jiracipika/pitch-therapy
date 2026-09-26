// ─── Live microphone pitch detection (mobile) ────────────────────────────────
//
// Streams raw PCM from the mic via react-native-live-audio-stream, decodes the
// base64 chunks to Float32 frames, and runs the same pure estimator the web
// app uses (core estimatePitch + stabilizePitch), so both platforms score
// identically.
//
// Requires a dev-client build that includes the native module — on an Expo Go
// or stale dev client, start() fails and callers fall back to self-assessment.

import { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import LiveAudioStream from 'react-native-live-audio-stream';
import { estimatePitch, stabilizePitch, type PitchEstimate } from '@pitch-therapy/core';

export type MicStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable';

const SAMPLE_RATE = 44100;
const BUFFER_SIZE = 8192; // ~93 ms of 16-bit mono audio per chunk
const ANDROID_VOICE_RECOGNITION_SOURCE = 6;

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_LOOKUP = new Int16Array(128).fill(-1);
for (let i = 0; i < B64_ALPHABET.length; i++) {
  B64_LOOKUP[B64_ALPHABET.charCodeAt(i)] = i;
}

/** atob is not guaranteed on Hermes — decode base64 PCM chunks directly.
 *  Padding '=' characters must be KEPT: short final chunks rely on them. */
function decodeBase64(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const len = clean.length;
  const out = new Uint8Array(Math.floor((len * 3) / 4));
  let p = 0;
  for (let i = 0; i + 3 < len; i += 4) {
    const n =
      (B64_LOOKUP[clean.charCodeAt(i)]! << 18) |
      (B64_LOOKUP[clean.charCodeAt(i + 1)]! << 12) |
      ((B64_LOOKUP[clean.charCodeAt(i + 2)]! & 63) << 6) |
      (B64_LOOKUP[clean.charCodeAt(i + 3)]! & 63);
    out[p++] = (n >> 16) & 255;
    if (i + 4 < len || clean.charCodeAt(i + 2) !== 61) out[p++] = (n >> 8) & 255;
    if (i + 4 < len || clean.charCodeAt(i + 3) !== 61) out[p++] = n & 255;
  }
  return out.subarray(0, p);
}

/** 16-bit little-endian PCM bytes → normalized Float32 samples (-1..1). */
function pcm16ToFloat32(bytes: Uint8Array): Float32Array {
  const sampleCount = bytes.length >> 1;
  const out = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const lo = bytes[i * 2]!;
    const hi = bytes[i * 2 + 1]!;
    const sample = (hi << 8) | lo; // little-endian pair, unsigned combine
    out[i] = (sample << 16 >> 16) / 32768; // re-interpret as signed 16-bit
  }
  return out;
}

export function useMicPitch() {
  const [status, setStatus] = useState<MicStatus>('idle');
  const [latestEstimate, setLatestEstimate] = useState<PitchEstimate | null>(null);
  const initializedRef = useRef(false);
  const historyRef = useRef<PitchEstimate[]>([]);
  const ignoreUntilRef = useRef(0);
  const unmountedRef = useRef(false);

  /** Suppress detection for a beat after the target tone plays through the
   *  speaker, so the mic doesn't score the reference instead of the user. */
  const suppressUntil = useCallback((ms: number) => {
    ignoreUntilRef.current = performance.now() + ms;
    historyRef.current = [];
    setLatestEstimate(null);
  }, []);

  const stop = useCallback(() => {
    try {
      LiveAudioStream.stop();
    } catch {
      // stop() before start() throws on some native versions — already idle.
    }
    historyRef.current = [];
    setLatestEstimate(null);
    setStatus('idle');
  }, []);

  const start = useCallback(async (): Promise<MicStatus> => {
    setStatus('requesting');
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone access',
            message: 'Pitch Therapy uses the microphone to detect the pitch you sing or play.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          },
        );
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          setStatus('denied');
          return 'denied';
        }
      } catch {
        setStatus('unavailable');
        return 'unavailable';
      }
    }

    try {
      if (!initializedRef.current) {
        LiveAudioStream.init({
          sampleRate: SAMPLE_RATE,
          channels: 1,
          bitsPerSample: 16,
          audioSource: ANDROID_VOICE_RECOGNITION_SOURCE,
          wavFile: 'pitch-therapy-temp.wav',
          bufferSize: BUFFER_SIZE,
        });
        LiveAudioStream.on('data', (chunk: string) => {
          if (unmountedRef.current) return;
          if (performance.now() < ignoreUntilRef.current) {
            historyRef.current = [];
            return;
          }
          const bytes = decodeBase64(chunk);
          const frame = pcm16ToFloat32(bytes);
          const estimate = estimatePitch(frame, SAMPLE_RATE);
          if (estimate) {
            historyRef.current = [...historyRef.current.slice(-4), estimate];
            const stable = stabilizePitch(historyRef.current);
            if (stable) {
              setLatestEstimate(stable);
            }
          } else {
            historyRef.current = [];
            setLatestEstimate(null);
          }
        });
        initializedRef.current = true;
      }
      historyRef.current = [];
      ignoreUntilRef.current = performance.now() + 500;
      LiveAudioStream.start();
      setStatus('active');
      return 'active';
    } catch {
      // Most common cause: the dev client build predates the native module.
      setStatus('unavailable');
      return 'unavailable';
    }
  }, []);

  // Stop the stream when the consuming screen unmounts.
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      try {
        LiveAudioStream.stop();
      } catch {
        // already stopped
      }
    };
  }, []);

  return { status, latestEstimate, start, stop, suppressUntil };
}
