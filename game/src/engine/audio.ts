import type { Options } from "../data/ids.js";
import { mulberry32 } from "./rng.js";
import { Sequencer, TITLE_THEME, type Note } from "./sequencer.js";

export type Sfx = "cursor" | "confirm" | "cancel" | "bump" | "save";

const EFFECTS: Readonly<Record<Sfx, readonly number[]>> = {
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

  constructor(private options: Options) {
    document.addEventListener("visibilitychange", () => {
      if (!this.context || !this.master) {
        return;
      }
      this.master.gain.value = document.hidden ? 0 : 0.65;
      if (document.hidden) {
        void this.context.suspend().catch(() => {
        });
      } else {
        this.resume();
      }
    });
  }
  get time(): number {
    return this.context?.currentTime ?? 0;
  }

  resume(): void {
    if (this.unavailable || document.hidden) {
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
        this.sequencer = new Sequencer(this, TITLE_THEME);
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
    EFFECTS[effect].forEach((midi, index) => this.voice(effect === "bump" ? 3 : 0, {
      time: 0, duration: 0.07, midi, volume: 9, duty: 2
    }, this.time + index * 0.07, this.effects));
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
    envelope.gain.setValueAtTime(note.volume / 15 * (channel === 3 ? 0.07 : 0.16), Math.max(when + 0.005, end - 0.015));
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
