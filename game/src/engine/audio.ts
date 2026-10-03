import { MUSIC } from "../data/music.js";
import type { TrackId } from "../data/ids.js";
import type { Options } from "../data/ids.js";
import { mulberry32 } from "./rng.js";
import { Sequencer, type Note } from "./sequencer.js";

export type Sfx = "cursor" | "confirm" | "cancel" | "bump" | "save"
  | "door" | "ledge" | "grass" | "heal" | "item" | "badge"
  | "hit" | "super" | "weak" | "faint" | "throw" | "shake" | "catch" | "run";

const EFFECTS: Readonly<Record<Sfx, readonly number[]>> = {
  hit: [44, 39], super: [55, 43, 36], weak: [40], faint: [55, 48, 40, 32],
  throw: [60, 67, 76], shake: [52, 57], catch: [72, 79, 86, 84], run: [64, 60, 55],
  door: [48, 55], ledge: [60, 67, 72], grass: [42, 46],
  heal: [72, 76, 79, 74, 77, 81, 79, 84], item: [72, 79, 76, 84], badge: [72, 76, 79, 84, 83, 86, 91],
  cursor: [76], confirm: [72, 79], cancel: [67, 60], bump: [36, 32], save: [72, 76, 79, 84],
};

export class Audio {
  private context?: AudioContext;
  private master?: GainNode;
  private music?: GainNode;
  private effects?: GainNode;
  private noise?: AudioBuffer;
  private readonly waves: PeriodicWave[] = [];
  private sequencer?: Sequencer;
  private unavailable = false;
  private paused = false;
  private track: TrackId = "title";

  constructor(private options: Options) {
    document.addEventListener("visibilitychange", () => this.syncPause());
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.syncPause();
  }

  private syncPause(): void {
    if (!this.context || !this.master) {
      return;
    }
    const paused = this.paused || document.hidden;
    this.master.gain.value = paused ? 0 : 0.65;
    if (paused) {
      void this.context.suspend().catch(() => {});
    } else {
      this.resume();
    }
  }

  get time(): number {
    return this.context?.currentTime ?? 0;
  }

  resume(): void {
    if (this.unavailable || document.hidden || this.paused) {
      return;
    }
    try {
      if (!this.context) {
        const context = new AudioContext();
        this.context = context;
        this.master = context.createGain();
        this.master.gain.value = 0.65;
        this.master.connect(context.destination);
        this.music = context.createGain();
        this.music.connect(this.master);
        this.effects = context.createGain();
        this.effects.connect(this.master);
        this.setOptions(this.options);
        for (const duty of [0.125, 0.25, 0.5]) {
          const real = new Float32Array(65);
          const imaginary = new Float32Array(65);
          for (let harmonic = 1; harmonic < 65; harmonic++) {
            real[harmonic] = 2 * Math.sin(2 * Math.PI * harmonic * duty) / (Math.PI * harmonic);
            imaginary[harmonic] = 2 * (1 - Math.cos(2 * Math.PI * harmonic * duty)) / (Math.PI * harmonic);
          }
          this.waves.push(context.createPeriodicWave(real, imaginary));
        }
        this.noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
        const samples = this.noise.getChannelData(0);
        const random = mulberry32(2026);
        for (let index = 0; index < samples.length; index++) {
          samples[index] = random() * 2 - 1;
        }
        this.sequencer = new Sequencer(this, MUSIC[this.track],
          this.track !== "evolve" && this.track !== "evolveSuccess");
      }
      if (this.context.state === "suspended") {
        void this.context.resume().catch(() => {
        });
      }
    } catch {
      this.unavailable = true;
    }
  }

  setOptions(options: Options): void {
    this.options = {
      ...options
    };
    if (this.music) {
      this.music.gain.value = options.music / 10;
    }
    if (this.effects) {
      this.effects.gain.value = options.sfx / 10;
    }
  }

  play(track: TrackId): void {
    if (track === this.track) {
      return;
    }
    this.track = track;
    const context = this.context;
    if (!context || !this.master) {
      return;
    }
    const old = this.music;
    if (old) {
      old.gain.cancelScheduledValues(this.time);
      old.gain.setValueAtTime(old.gain.value, this.time);
      old.gain.linearRampToValueAtTime(0, this.time + 0.3);
      window.setTimeout(() => old.disconnect(), 600);
    }
    this.music = context.createGain();
    this.music.connect(this.master);
    this.music.gain.setValueAtTime(0, this.time);
    this.music.gain.linearRampToValueAtTime(this.options.music / 10, this.time + 0.3);
    this.sequencer = new Sequencer(this, MUSIC[track], track !== "evolve" && track !== "evolveSuccess");
  }

  update(): void {
    if (this.context?.state === "running" && !document.hidden) {
      this.sequencer?.update();
    }
  }

  note(channel: number, note: Note, when: number): void {
    this.voice(channel, note, when, this.music);
  }

  sfx(effect: Sfx): void {
    this.resume();
    EFFECTS[effect].forEach((midi, index) => this.voice((effect === "bump" || effect === "grass") ? 3 : 0, {
      time: 0, duration: 0.07, midi, volume: 9, duty: 2
    }, this.time + index * 0.07, this.effects));
  }

  cry(seed: number): void {
    this.resume();
    const rng = mulberry32(seed);
    const base = 44 + Math.floor(rng() * 32);
    for (let i = 0; i < 5; i++) {
      this.voice(i % 2 ? 2 : 0, { time: 0, duration: 0.08, midi: base + Math.floor(rng() * 12) - i * 2,
        volume: 8, duty: seed % 3 }, this.time + i * 0.08, this.effects);
    }
  }

  private voice(channel: number, note: Note, when: number, output?: GainNode): void {
    const context = this.context;
    if (!context || !output || note.midi === null) {
      return;
    }
    const envelope = context.createGain();
    envelope.connect(output);
    const end = when + note.duration * 0.92;
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(note.volume / 15 * (channel === 3 ? 0.07 : 0.16), when + 0.005);
    envelope.gain.setValueAtTime(note.volume / 15 * (channel === 3 ? 0.07 : 0.16),
      Math.max(when + 0.005, end - 0.015));
    envelope.gain.linearRampToValueAtTime(0, end);
    let source: OscillatorNode | AudioBufferSourceNode;
    if (channel === 3) {
      const noise = context.createBufferSource();
      noise.buffer = this.noise!;
      noise.loop = true;
      noise.playbackRate.value = Math.pow(2, (note.midi - 36) / 12);
      source = noise;
    } else {
      const oscillator = context.createOscillator();
      oscillator.frequency.value = 440 * Math.pow(2, (note.midi - 69) / 12);
      if (channel === 2) {
        oscillator.type = "triangle";
      } else {
        oscillator.setPeriodicWave(this.waves[note.duty]);
      }
      source = oscillator;
    }
    source.connect(envelope);
    source.start(when);
    source.stop(end + 0.01);
    source.onended = () => {
      source.disconnect();
      envelope.disconnect();
    };
  }
}
