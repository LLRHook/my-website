export type RoomSoundSettings = { volume: number; music: boolean; nature: boolean };

export const DEFAULT_ROOM_SOUND: RoomSoundSettings = { volume: 28, music: true, nature: true };

const MASTER_GAIN_LIMIT = 0.28;
const MAX_VOICES = 24;
const CHORD_INTERVAL = 20;
const PAD_DURATION = 28;
const LAYER_FADE_SECONDS = 0.45;
// Shared pentatonic notes avoid close semitone clashes during the long crossfades.
const CHORDS = [[48, 55, 60, 64], [48, 55, 62, 67], [45, 52, 60, 64], [43, 50, 57, 62]];
type Layer = "music" | "nature";
type Voice = { layer: Layer; nodes: AudioNode[] };
type Tone = { layer: Layer; frequency: number; at: number; duration: number; peak: number; attack: number; endFrequency?: number; waveform?: OscillatorType };

/** Original, quiet synthesis. One scheduler and a bounded set of short-lived voices. */
export class RoomSoundscape {
  private readonly master: GainNode;
  private readonly music: GainNode;
  private readonly nature: GainNode;
  private readonly musicFilter: BiquadFilterNode;
  private readonly natureFilter: BiquadFilterNode;
  private readonly voices = new Map<AudioScheduledSourceNode, Voice>();
  private readonly releaseTimers = new Map<Layer, ReturnType<typeof setTimeout>>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private settings: RoomSoundSettings;
  private visible = false;
  private disposed = false;
  private revision = 0;
  private nextChord = 0;
  private nextBird = 0;
  private nextInsect = 0;
  private chord = 0;
  private breeze: AudioBufferSourceNode | null = null;

  constructor(private readonly context: AudioContext, settings: RoomSoundSettings = DEFAULT_ROOM_SOUND) {
    this.settings = { ...settings };
    this.master = context.createGain();
    this.music = context.createGain();
    this.nature = context.createGain();
    this.musicFilter = context.createBiquadFilter();
    this.natureFilter = context.createBiquadFilter();
    this.master.gain.value = 0;
    this.music.gain.value = settings.music ? 1 : 0;
    this.nature.gain.value = settings.nature ? 1 : 0;
    this.musicFilter.type = "lowpass";
    this.musicFilter.frequency.value = 680;
    this.musicFilter.Q.value = 0.45;
    this.natureFilter.type = "lowpass";
    this.natureFilter.frequency.value = 2000;
    this.natureFilter.Q.value = 0.4;
    this.music.connect(this.musicFilter);
    this.musicFilter.connect(this.master);
    this.nature.connect(this.natureFilter);
    this.natureFilter.connect(this.master);
    this.master.connect(context.destination);
    this.setSettings(settings);
  }

  setSettings(settings: RoomSoundSettings) {
    if (this.disposed) return;
    const previous = this.settings;
    this.settings = { ...settings, volume: Math.min(100, Math.max(0, Number.isFinite(settings.volume) ? settings.volume : 0)) };
    const now = this.context.currentTime;
    // Replace the previous volume ramp so dragging the slider cannot stack automation.
    if (typeof this.master.gain.cancelAndHoldAtTime === "function") this.master.gain.cancelAndHoldAtTime(now);
    else this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime((this.settings.volume / 100) * MASTER_GAIN_LIMIT, now, 0.2);
    for (const layer of ["music", "nature"] as const) {
      if (settings[layer] === previous[layer]) continue;
      this.cancelRelease(layer);
      const level = (layer === "music" ? this.music : this.nature).gain;
      const current = level.value;
      if (typeof level.cancelAndHoldAtTime === "function") level.cancelAndHoldAtTime(now);
      else level.cancelScheduledValues(now);
      // Anchor even an untouched gain: otherwise the first ramp can start at context time zero.
      level.setValueAtTime(current, now);
      level.linearRampToValueAtTime(settings[layer] ? 1 : 0, now + LAYER_FADE_SECONDS);
      const hasVoices = Array.from(this.voices.values()).some((voice) => voice.layer === layer);
      if (!settings[layer] && hasVoices) {
        // At most one release task per layer; hiding or closing cancels both immediately.
        this.releaseTimers.set(layer, setTimeout(() => {
          this.releaseTimers.delete(layer);
          if (!this.settings[layer]) this.clearVoices(layer);
        }, LAYER_FADE_SECONDS * 1000));
      } else if (settings[layer] && !hasVoices) {
        if (layer === "music") this.nextChord = this.context.currentTime;
        else {
          this.nextBird = this.context.currentTime + 3;
          this.nextInsect = this.context.currentTime + 6;
        }
      }
    }
    if (!settings.music && !settings.nature) this.stopScheduler();
    else if (this.visible && this.context.state === "running") this.startScheduler();
  }

  async setVisible(visible: boolean) {
    if (this.disposed) return;
    // Only skip when already audible: a suspended/interrupted context with a live scheduler must still resume.
    if (visible && this.visible && this.timer !== null && this.context.state === "running") return;
    this.visible = visible;
    const revision = ++this.revision;
    if (!visible) {
      this.stopScheduler();
      this.clearVoices();
      if (this.context.state !== "closed") await this.context.suspend();
      return;
    }
    // Called directly in the enable click handler, before an await, for mobile autoplay rules.
    await this.context.resume();
    if (this.disposed || !this.visible || revision !== this.revision) return;
    this.nextChord = this.context.currentTime;
    this.nextBird = this.context.currentTime + 4;
    this.nextInsect = this.context.currentTime + 7;
    this.startScheduler();
  }

  async close() {
    if (this.disposed) return;
    this.disposed = true;
    this.revision++;
    this.stopScheduler();
    this.clearVoices();
    this.master.disconnect();
    this.music.disconnect();
    this.nature.disconnect();
    this.musicFilter.disconnect();
    this.natureFilter.disconnect();
    if (this.context.state !== "closed") await this.context.close();
  }

  private startScheduler() {
    if (this.timer !== null || this.disposed || !this.visible || (!this.settings.music && !this.settings.nature)) return;
    this.tick();
    this.timer = setInterval(() => this.tick(), 500);
  }

  private stopScheduler() {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  private cancelRelease(layer: Layer) {
    const timer = this.releaseTimers.get(layer);
    if (timer !== undefined) clearTimeout(timer);
    this.releaseTimers.delete(layer);
  }

  private clearVoices(layer?: Layer) {
    if (layer) this.cancelRelease(layer);
    else {
      this.cancelRelease("music");
      this.cancelRelease("nature");
    }
    for (const [source, voice] of this.voices) {
      if (layer && voice.layer !== layer) continue;
      source.onended = null;
      // Every source is started when registered; stopping a scheduled source cancels it too.
      source.stop();
      source.disconnect();
      for (const node of voice.nodes) node.disconnect();
      if (source === this.breeze) {
        this.breeze.buffer = null;
        this.breeze = null;
      }
      this.voices.delete(source);
    }
  }

  private track(source: AudioScheduledSourceNode, layer: Layer, nodes: AudioNode[]) {
    this.voices.set(source, { layer, nodes });
    source.onended = () => {
      source.onended = null;
      source.disconnect();
      for (const node of nodes) node.disconnect();
      this.voices.delete(source);
    };
  }

  private tone({ layer, frequency, at, duration, peak, attack, endFrequency, waveform = "sine" }: Tone) {
    if (this.voices.size >= MAX_VOICES) return;
    const source = this.context.createOscillator();
    const envelope = this.context.createGain();
    source.type = waveform;
    source.frequency.setValueAtTime(frequency, at);
    if (endFrequency) source.frequency.exponentialRampToValueAtTime(endFrequency, at + duration);
    const rise = new Float32Array(48);
    const fall = new Float32Array(48);
    for (let index = 0; index < rise.length; index++) {
      const phase = (index / (rise.length - 1)) * Math.PI / 2;
      rise[index] = Math.sin(phase) ** 2 * peak;
      fall[index] = Math.cos(phase) ** 2 * peak;
    }
    fall[fall.length - 1] = 0;
    // Rounded attack and release slopes remove the percussive edge of the old bell.
    const releaseAt = Math.max(attack, duration * (waveform === "triangle" ? 0.58 : 0.32));
    envelope.gain.value = 0;
    envelope.gain.setValueCurveAtTime(rise, at, attack);
    envelope.gain.setValueCurveAtTime(fall, at + releaseAt, duration - releaseAt);
    source.connect(envelope);
    envelope.connect(layer === "music" ? this.music : this.nature);
    this.track(source, layer, [envelope]);
    source.start(at);
    source.stop(at + duration + 0.03);
  }

  private startBreeze() {
    if (this.breeze || this.voices.size >= MAX_VOICES) return;
    const buffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = 340;
    filter.Q.value = 0.4;
    envelope.gain.value = 0.03;
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.nature);
    this.track(source, "nature", [filter, envelope]);
    this.breeze = source;
    source.start();
  }

  private tick() {
    if (this.disposed || !this.visible || this.context.state !== "running") return;
    const now = this.context.currentTime;
    if (this.settings.music && this.nextChord <= now + 0.1) {
      const at = now + 0.08;
      const notes = CHORDS[this.chord++ % CHORDS.length];
      notes.forEach((note, index) => {
        const frequency = 440 * 2 ** ((note - 69) / 12);
        this.tone({ layer: "music", frequency, at: at + index * 0.24, duration: PAD_DURATION, peak: 0.065, attack: 4.8, waveform: "triangle" });
      });
      // A low, slow swell adds movement without a struck-note transient.
      const melody = 440 * 2 ** ((notes[3] - 69) / 12);
      this.tone({ layer: "music", frequency: melody, at: at + 6, duration: 10, peak: 0.022, attack: 2.4 });
      this.nextChord = now + CHORD_INTERVAL;
    }
    if (this.settings.nature) {
      this.startBreeze();
      if (this.nextBird <= now + 0.1) {
        const pitch = 1350 + Math.random() * 250;
        this.tone({ layer: "nature", frequency: pitch, at: now + 0.08, duration: 0.65, peak: 0.032, attack: 0.16, endFrequency: pitch * 1.14 });
        this.tone({ layer: "nature", frequency: pitch * 1.08, at: now + 0.85, duration: 0.8, peak: 0.024, attack: 0.2, endFrequency: pitch * 0.97 });
        this.nextBird = now + 14 + Math.random() * 8;
      }
      if (this.nextInsect <= now + 0.1) {
        for (let index = 0; index < 2; index++) this.tone({ layer: "nature", frequency: 2350, at: now + 0.08 + index * 0.32, duration: 0.22, peak: 0.01, attack: 0.075, endFrequency: 2200 });
        this.nextInsect = now + 10 + Math.random() * 8;
      }
    }
  }
}
