import { bedroom } from "./bedroom.js";
import { house } from "./house.js";
import { sterling } from "./sterling.js";
import { lab } from "./lab.js";
import { route1 } from "./route1.js";
import { commit } from "./commit.js";
import { center } from "./center.js";
import { mart } from "./mart.js";
import { gym } from "./gym.js";
import { route2 } from "./route2.js";
import { cave } from "./cave.js";
import type { MapId } from "../../data/ids.js";
import type { GameMap } from "../map.js";

export const MAPS: Readonly<Record<MapId, GameMap>> = {
  bedroom, house, sterling, lab, route1, commit, center, mart, gym, route2, cave,
};
