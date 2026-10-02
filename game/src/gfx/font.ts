import { PALETTE } from "./palette.js";
import type { Screen } from "../engine/screen.js";

// Seven five-bit rows (six for ©), centred in an 8x8 cell. Every glyph is drawn by hand.

const ROWS: Readonly<Record<string, string>> = {
  " ": "00000000000000", "!": "04040404040004", '"': "0a0a0a00000000", "#": "0a1f0a0a1f0a00",
  "$": "040f140e051e04", "%": "19190204081313", "&": "0c12140a15120d", "'": "04040800000000",
  "(": "02040808080402", ")": "08040202020408", "*": "00150e1f0e1500", "+": "0004041f040400",
  ",": "00000000000408", "-": "0000001f000000", ".": "00000000000004", "/": "01010204081010",
  "0": "0e11131519110e", "1": "040c040404040e", "2": "0e11010204081f", "3": "1e01010601111e",
  "4": "02060a121f0202", "5": "1f101e0101110e", "6": "0608101e11110e", "7": "1f010204080808",
  "8": "0e11110e11110e", "9": "0e11110f01020c", ":": "00040000040000", ";": "00040000040408",
  "<": "01020408040201", "=": "00001f001f0000", ">": "10080402040810", "?": "0e110102040004",
  "@": "0e11171716100f", "A": "0e11111f111111", "B": "1e11111e11111e", "C": "0e11101010110e",
  "D": "1c12111111121c", "E": "1f10101e10101f", "F": "1f10101e101010", "G": "0e11101711110f",
  "H": "1111111f111111", "I": "0e04040404040e", "J": "0702020212120c", "K": "11121418141211",
  "L": "1010101010101f", "M": "111b1515111111", "N": "11191513111111", "O": "0e11111111110e",
  "P": "1e11111e101010", "Q": "0e11111115120d", "R": "1e11111e141211", "S": "0f10100e01011e",
  "T": "1f040404040404", "U": "1111111111110e", "V": "11111111110a04", "W": "11111115151b11",
  "X": "11110a040a1111", "Y": "11110a04040404", "Z": "1f01020408101f", "[": "0e08080808080e",
  "\\": "10100804020101", "]": "0e02020202020e", "^": "040a1100000000", "_": "0000000000001f",
  "`": "08040200000000", "a": "00000e010f110f", "b": "10101e1111111e", "c": "00000e1110110e",
  "d": "01010f1111110f", "e": "00000e111f100e", "f": "0609081e080808", "g": "00000f110f010e",
  "h": "10101e11111111", "i": "04000c0404040e", "j": "0200060202120c", "k": "101011121c1211",
  "l": "0c04040404040e", "m": "00001a15151515", "n": "00001e11111111", "o": "00000e1111110e",
  "p": "00001e111e1010", "q": "00000f110f0101", "r": "00001619101010", "s": "00000f100e011e",
  "t": "08081e08080906", "u": "0000111111130d", "v": "00001111110a04", "w": "00001115151b11",
  "x": "0000110a040a11", "y": "000011110f010e", "z": "00001f0204081f", "{": "02040408040402",
  "|": "04040404040404", "}": "08040402040408", "~": "00000916000000",
  "▶": "10181c1e1c1810", "◀": "0103070f070301", "▼": "001f1f0e0e0400", "★": "0404150e1f0a11",
  "é": "02040e111f100e", "♪": "06050504041c1c", "…": "00000000001515", "♂": "07030509110e00", "♀": "0e11110e041f04",
  "©": "1e212d292d211e",
};

const CHARACTERS = Object.keys(ROWS);

const atlas = new Map<number, HTMLCanvasElement>();

export function initFont(): void {
  for (const colour of [0, 1, 4, 5, 6, 27]) {
    const canvas = document.createElement("canvas");
    canvas.width = CHARACTERS.length * 8;
    canvas.height = 8;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D is unavailable");
    }
    context.fillStyle = PALETTE[colour];
    CHARACTERS.forEach((character, index) => {
      const rows = ROWS[character];
      const width = character === "©" ? 6 : 5;
      for (let y = 0; y < 7; y++) {
        const bits = parseInt(rows.slice(y * 2, y * 2 + 2), 16);
        for (let x = 0; x < width; x++) {
          if (bits & (1 << (width - 1 - x))) {
            context.fillRect(index * 8 + x + 1, y, 1, 1);
          }
        }
      }
    });
    atlas.set(colour, canvas);
  }
}

export function measureText(text: string): number {
  return [...text].length * 8;
}

export function measureSmallText(text: string, scale = 1): number {
  const characters = [...text];
  const lastWidth = characters.at(-1) === "©" ? 6 : 5;
  return Math.max(0, (characters.length - 1) * 6 + lastWidth) * scale;
}

export function drawSmallText(screen: Screen, text: string, x: number, y: number, colour = 0, scale = 1): void {
  const source = atlas.get(colour);
  if (!source) {
    throw new Error("Font atlas has not been initialized");
  }
  [...text].forEach((character, offset) => {
    const index = CHARACTERS.indexOf(character);
    const glyph = index < 0 ? CHARACTERS.indexOf("?") : index;
    const width = character === "©" ? 6 : 5;
    screen.context.drawImage(source, glyph * 8 + 1, 0, width, 8, Math.round(x + offset * 6 * scale),
      Math.round(y), width * scale, 8 * scale);
  });
}

export function drawText(screen: Screen, text: string, x: number, y: number, colour = 0, scale = 1): void {
  const source = atlas.get(colour);
  if (!source) {
    throw new Error("Font atlas has not been initialized");
  }
  [...text].forEach((character, offset) => {
    const index = CHARACTERS.indexOf(character);
    const glyph = index < 0 ? CHARACTERS.indexOf("?") : index;
    screen.context.drawImage(source, glyph * 8, 0, 8, 8, Math.round(x + offset * 8 * scale),
      Math.round(y), 8 * scale, 8 * scale);
  });
}
