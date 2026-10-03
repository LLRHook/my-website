import type { GameMap } from "../map.js";
import { POSTGAME_TEXT as T } from "../../data/text.js";

export const vault: GameMap = {
  id: "vault", name: T.vault, music: "cave", width: 10, height: 10, outdoor: false,
  tiles: [
    "AAAAAAAAAA",
    "AOccccccOA",
    "Ac'cccc'cA",
    "Ac';--;'cA",
    "Acc;--;ccA",
    "AcO;;;;OcA",
    "Accc;;cccA",
    "Ac';;;;c0A",
    "AccS;;cccA",
    "AAAAAAAAAA",
  ],
  warps: [{ x: 8, y: 7, to: "cave", tx: 0, ty: 6, dir: "right" }],
  npcs: [{ id: "origin", x: 4, y: 3, sprite: "prof", dir: "down", movement: "static",
    script: [{ say: T.origin }, { battle: "origin" }] }],
  signs: [{ x: 3, y: 8, text: T.vaultInscription }],
};
