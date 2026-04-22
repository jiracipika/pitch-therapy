// ─── Web MIDI Module ─────────────────────────────────────────────────────────

const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

export interface MidiNoteEvent {
  note: number; // MIDI note number 0-127
  name: string; // e.g. "C#4"
  octave: number;
  velocity: number; // 0-127
  frequency: number; // Hz
  timestamp: number;
}

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  type: "input" | "output";
}

type MidiEventHandler = (event: MidiNoteEvent) => void;

export class MidiManager {
  private access: MIDIAccess | null = null;
  private inputs = new Map<string, MIDIInput>();
  private handlers = new Map<string, Set<MidiEventHandler>>();
  private _isConnected = false;

  static isSupported(): boolean {
    return typeof navigator !== "undefined" && "requestMIDIAccess" in navigator;
  }

  get isConnected() {
    return this._isConnected;
  }

  async connect(): Promise<boolean> {
    if (!MidiManager.isSupported()) return false;

    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false });
      this._isConnected = true;
      this.bindInputs();

      this.access.onstatechange = () => {
        this.bindInputs();
      };

      return true;
    } catch {
      this._isConnected = false;
      return false;
    }
  }

  disconnect(): void {
    for (const [, input] of this.inputs) {
      input.onmidimessage = null;
    }
    this.inputs.clear();
    this.handlers.clear();
    this.access = null;
    this._isConnected = false;
  }

  getDevices(): MidiDevice[] {
    if (!this.access) return [];
    const devices: MidiDevice[] = [];
    this.access.inputs.forEach((input, id) => {
      devices.push({
        id,
        name: input.name ?? "Unknown",
        manufacturer: input.manufacturer ?? "",
        type: "input",
      });
    });
    this.access.outputs.forEach((output, id) => {
      devices.push({
        id,
        name: output.name ?? "Unknown",
        manufacturer: output.manufacturer ?? "",
        type: "output",
      });
    });
    return devices;
  }

  onNoteOn(deviceId: string, handler: MidiEventHandler): () => void {
    return this.addDeviceHandler(deviceId, handler);
  }

  onAnyNoteOn(handler: MidiEventHandler): () => void {
    return this.addDeviceHandler("*", handler);
  }

  /** Send a noteOn message to an output device */
  sendNoteOn(deviceId: string, note: number, velocity = 100): void {
    this.send(deviceId, [0x90, note, velocity]);
  }

  /** Send a noteOff message to an output device */
  sendNoteOff(deviceId: string, note: number, velocity = 0): void {
    this.send(deviceId, [0x80, note, velocity]);
  }

  destroy(): void {
    this.disconnect();
  }

  // ─── Private ───────────────────────────────────────────────────────────

  private bindInputs(): void {
    if (!this.access) return;

    const activeInputIds = new Set<string>();
    this.access.inputs.forEach((_input, id) => {
      activeInputIds.add(id);
    });

    // Remove old handlers for disconnected inputs
    for (const [id] of this.inputs) {
      if (!activeInputIds.has(id)) {
        this.inputs.delete(id);
      }
    }

    this.access.inputs.forEach((input, id) => {
      if (!this.inputs.has(id)) {
        this.inputs.set(id, input);
        input.onmidimessage = (e: MIDIMessageEvent) => this.handleMessage(id, e);
      }
    });
  }

  private handleMessage(deviceId: string, event: MIDIMessageEvent): void {
    const data = event.data;
    if (!data || data.length < 3) return;

    const status = data[0] ?? 0;
    const note = data[1] ?? 0;
    const velocity = data[2] ?? 0;
    const command = status & 0xf0;

    // noteOn (0x90) or noteOff (0x80)
    if (command === 0x90 && velocity > 0) {
      const midiEvent = this.createNoteEvent(note, velocity);
      this.emit("*", midiEvent);
      this.emit(deviceId, midiEvent);
    }
  }

  private createNoteEvent(note: number, velocity: number): MidiNoteEvent {
    const octave = Math.floor(note / 12) - 1;
    const name = NOTE_NAMES[note % 12] + octave;
    return {
      note,
      name,
      octave,
      velocity,
      frequency: midiNoteToFrequency(note),
      timestamp: Date.now(),
    };
  }

  private addDeviceHandler(
    deviceId: string,
    handler: MidiEventHandler,
  ): () => void {
    if (!this.handlers.has(deviceId)) {
      this.handlers.set(deviceId, new Set());
    }
    this.handlers.get(deviceId)!.add(handler);

    return () => {
      this.handlers.get(deviceId)?.delete(handler);
    };
  }

  private emit(deviceId: string, event: MidiNoteEvent): void {
    this.handlers.get(deviceId)?.forEach((h) => h(event));
  }

  private send(deviceId: string, data: number[]): void {
    let output: MIDIOutput | undefined;
    this.access?.outputs.forEach((candidate, id) => {
      if (id === deviceId) output = candidate;
    });
    if (output) {
      output.send(data);
    }
  }
}

// ─── Conversions ─────────────────────────────────────────────────────────────

const NOTE_NAMES_ARR = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

/**
 * Convert MIDI note number (0-127) to frequency in Hz.
 * A4 = MIDI 69 = 440 Hz
 */
export function midiNoteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/**
 * Convert MIDI note number to note name with octave.
 * e.g. 60 → "C4", 69 → "A4"
 */
export function midiNoteToName(note: number): string {
  const octave = Math.floor(note / 12) - 1;
  const name = NOTE_NAMES_ARR[((note % 12) + 12) % 12];
  return name + octave;
}

/**
 * Convert frequency to nearest MIDI note number.
 */
export function frequencyToMidiNote(hz: number): number {
  return Math.round(69 + 12 * Math.log2(hz / 440));
}
