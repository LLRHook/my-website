export interface Note {
  time: number;
  duration: number;
  midi: number | null;
  volume: number;
  duty: number;
}

export interface Track {
  notes: Note[];
  duration: number;
  loopStart: number;
}

const SEMITONES: Readonly<Record<string, number>> = {
  c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11
};

export function parseMml(src: string): Track {
  let position = 0;
  let tempo = 120;
  let octave = 4;
  let length = 4;
  let volume = 10;
  let duty = 2;
  let time = 0;
  let loopStart = 0;
  let tie = false;
  const notes: Note[] = [];
  const space = () => {
    while (/\s/.test(src[position] ?? "") && position < src.length) {
      position++;
    }
  };
  const number = (fallback?: number): number => {
    const start = position;
    while (/\d/.test(src[position] ?? "") && position < src.length) {
      position++;
    }
    if (start === position) {
      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error(`Expected number at ${position}`);
    }
    return Number(src.slice(start, position));
  };
  const parse = (depth = 0): void => {
    if (depth > 8) {
      throw new Error("MML loop nesting limit exceeded");
    }
    while (position < src.length) {
      space();
      if (position === src.length) {
        break;
      }
      const token = src[position++];
      if (token === "]") {
        if (!depth) {
          throw new Error("Unexpected loop end");
        }
        return;
      }
      if (token === "[") {
        const start = position;
        parse(depth + 1);
        const end = position;
        if (src[end - 1] !== "]") {
          throw new Error("Unclosed MML loop");
        }
        const repeats = number(2);
        if (repeats < 1 || repeats > 64) {
          throw new Error("Invalid loop count");
        }
        const after = position;
        for (let repeat = 1; repeat < repeats; repeat++) {
          position = start;
          parse(depth + 1);
        }
        position = after;
        continue;
      }
      if (token === "L") {
        loopStart = time;
        continue;
      }
      if (token === "&" || token === "^") {
        if (!notes.length || tie) {
          throw new Error("Invalid tie");
        }
        tie = true;
        continue;
      }
      if (token === ">" || token === "<") {
        octave += token === ">" ? 1 : -1;
        if (octave < 0 || octave > 8) {
          throw new Error("Invalid octave");
        }
        continue;
      }
      if (["t", "o", "l", "v", "@"].includes(token)) {
        const value = number();
        if (token === "t") {
          if (value < 20 || value > 400) {
            throw new Error("Invalid tempo");
          }
          tempo = value;
        }
        if (token === "o") {
          if (value > 8) {
            throw new Error("Invalid octave");
          }
          octave = value;
        }
        if (token === "l") {
          if (!value || value > 128) {
            throw new Error("Invalid length");
          }
          length = value;
        }
        if (token === "v") {
          if (value > 15) {
            throw new Error("Invalid volume");
          }
          volume = value;
        }
        if (token === "@") {
          if (value > 2) {
            throw new Error("Invalid duty");
          }
          duty = value;
        }
        continue;
      }
      if (!(token in SEMITONES) && token !== "r") {
        throw new Error(`Unknown MML token: ${token}`);
      }
      let accidental = 0;
      if (src[position] === "+" || src[position] === "#") {
        accidental = 1;
        position++;
      } else if (src[position] === "-") {
        accidental = -1;
        position++;
      }
      const denominator = number(length);
      if (!denominator || denominator > 128) {
        throw new Error("Invalid note length");
      }
      let duration = 240 / tempo / denominator;
      let addition = duration / 2;
      while (src[position] === ".") {
        position++;
        duration += addition;
        addition /= 2;
      }
      const midi = token === "r" ? null : (octave + 1) * 12 + SEMITONES[token] + accidental;
      if (midi !== null && (midi < 0 || midi > 127)) {
        throw new Error("Note out of range");
      }
      if (tie) {
        const previous = notes.at(-1)!;
        if (previous.midi !== midi) {
          throw new Error("Tied notes must have the same pitch");
        }
        previous.duration += duration;
        tie = false;
      } else {
        notes.push({
          time, duration, midi, volume, duty
        });
      }
      time += duration;
      if (notes.length > 16384 || time > 3600) {
        throw new Error("MML track limit exceeded");
      }
    }
  };

  parse();
  if (tie) {
    throw new Error("Unfinished tie");
  }
  if (!notes.length || loopStart >= time) {
    throw new Error("Empty MML loop");
  }
  return {
    notes, duration: time, loopStart
  };
}
// Original 32-second theme: a rising call, a descending answer, then a bright turnaround.
export const TITLE_THEME: readonly Track[] = [

  parseMml("t120 o5 v9 @1 l8 L [c e g4 a g e4 d f a4 g e d4 e g b4 a g e4 f a >c4 <b a g4 g e d4 e c r4 a g e4 d f g4 e g >c4 <b g a4 f e d4 c2]2"),

  parseMml("t120 o4 v5 @0 l8 L [c r e r g r e r d r f r a r f r e r g r b r g r f r a r >c r <a r]4"),

  parseMml("t120 o2 v9 l4 L [c g c g d a d a e b e b f >c <f >c <]4"),

  parseMml("t120 o2 v4 l8 L [c r c c r c c r]16"),
];

export interface NotePlayer {
  readonly time: number;

  note(channel: number, note: Note, when: number): void;
}

export class Sequencer {
  private readonly positions: number[];
  private readonly starts: number[];

  constructor(private readonly player: NotePlayer, private readonly tracks: readonly Track[]) {
    this.positions = tracks.map(() => 0);
    this.starts = tracks.map(() => player.time + 0.04);
  }

  update(): void {
    this.tracks.forEach((track, channel) => {
      let scheduled = 0;
      while (scheduled++ < 128) {
        const index = this.positions[channel];
        const note = track.notes[index];
        const when = this.starts[channel] + note.time;
        if (when > this.player.time + 0.15) {
          break;
        }
        if (when >= this.player.time - 0.02 && note.midi !== null) {
          this.player.note(channel, note, Math.max(this.player.time, when));
        }
        this.positions[channel]++;
        if (this.positions[channel] === track.notes.length) {
          this.starts[channel] += track.duration - track.loopStart;
          this.positions[channel] = track.notes.findIndex((entry) => entry.time >= track.loopStart);
        }
      }
    });
  }
}
