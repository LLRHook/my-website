export type RoomSoundSettings = { volume: number; music: boolean; nature: boolean };

export const DEFAULT_ROOM_SOUND: RoomSoundSettings = { volume: 28, music: true, nature: true };

const MASTER_GAIN_LIMIT = 0.28;
const MAX_VOICES = 24;
const CHORDS = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 57, 62]];
type Layer = "music" | "nature";
type Voice = { layer: Layer; nodes: AudioNode[] };

/** Original, quiet synthesis. One scheduler and a bounded set of short-lived voices. */
export class RoomSoundscape {
  private readonly master: GainNode;
  private readonly music: GainNode;
  private readonly nature: GainNode;
  private readonly voices = new Map<AudioScheduledSourceNode, Voice>();
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
    this.master.gain.value = 0;
    this.music.connect(this.master);
    this.nature.connect(this.master);
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
      if (!settings[layer]) this.clearVoices(layer);
      else if (!previous[layer]) {
        if (layer === "music") this.nextChord = this.context.currentTime;
        else {
          this.nextBird = this.context.currentTime + 1;
          this.nextInsect = this.context.currentTime + 3;
        }
      }
    }
    if (!settings.music && !settings.nature) this.stopScheduler();
    else if (this.visible && this.context.state === "running") this.startScheduler();
  }

  async setVisible(visible: boolean) {
    if (this.disposed) return;
    if (visible && this.visible && this.timer !== null) return;
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
    this.nextBird = this.context.currentTime + 2;
    this.nextInsect = this.context.currentTime + 5;
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

  private clearVoices(layer?: Layer) {
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

  private tone(layer: Layer, frequency: number, at: number, duration: number, peak: number, attack: number, endFrequency?: number) {
    if (this.voices.size >= MAX_VOICES) return;
    const source = this.context.createOscillator();
    const envelope = this.context.createGain();
    source.type = "sine";
    source.frequency.setValueAtTime(frequency, at);
    if (endFrequency) source.frequency.exponentialRampToValueAtTime(endFrequency, at + duration);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(peak, at + attack);
    if (attack >= 1) envelope.gain.linearRampToValueAtTime(peak * 0.75, at + duration * 0.64);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    envelope.gain.setValueAtTime(0, at + duration + 0.02);
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
    filter.frequency.value = 480;
    envelope.gain.value = 0.04;
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
        this.tone("music", frequency, at + index * 0.18, 13, 0.1, 2.2);
      });
      // A soft, bell-like upper note gives the sustained chords a little melody.
      const melody = 440 * 2 ** ((notes[2] + 12 - 69) / 12);
      this.tone("music", melody, at + 3.8, 3.8, 0.09, 0.045);
      this.nextChord = now + 12;
    }
    if (this.settings.nature) {
      this.startBreeze();
      if (this.nextBird <= now + 0.1) {
        const pitch = 2050 + Math.random() * 450;
        this.tone("nature", pitch, now + 0.08, 0.24, 0.12, 0.035, pitch * 1.36);
        this.tone("nature", pitch * 1.15, now + 0.46, 0.32, 0.09, 0.04, pitch * 0.94);
        this.nextBird = now + 8 + Math.random() * 7;
      }
      if (this.nextInsect <= now + 0.1) {
        for (let index = 0; index < 3; index++) this.tone("nature", 3800, now + 0.08 + index * 0.17, 0.085, 0.037, 0.02, 3600);
        this.nextInsect = now + 5 + Math.random() * 6;
      }
    }
  }
}
