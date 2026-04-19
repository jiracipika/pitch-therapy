// ─── MIDI stub for React Native ──────────────────────────────────────────────
// Web MIDI API (navigator.requestMIDIAccess, MIDIAccess, etc.) does not exist in RN.

export interface MidiNoteEvent {
  note: number;
  name: string;
  octave: number;
  velocity: number;
  frequency: number;
  timestamp: number;
}

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  type: 'input' | 'output';
}

export class MidiManager {
  static isSupported(): boolean { return false; }
  get isConnected() { return false; }
  async connect(): Promise<boolean> { return false; }
  disconnect() {}
  getDevices(): MidiDevice[] { return []; }
  onNote() {}
  offNote() {}
  removeAllListeners() {}
}

export function midiNoteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export function midiNoteToName(note: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return names[note % 12] + String(Math.floor(note / 12) - 1);
}

export function frequencyToMidiNote(freq: number): number {
  return Math.round(12 * Math.log2(freq / 440) + 69);
}
