export type Dir = "up" | "down" | "left" | "right";

export type MapId = "bedroom" | "house" | "sterling" | "lab" | "route1" | "commit" | "center" | "mart" |
  "gym" | "route2" | "cave" | "route3" | "bay" | "bayCenter" | "bayMart" | "bayHouse" | "pipeGym"
  | "route4" | "ridge" | "ridgeCenter" | "ridgeMart" | "releaseGym" | "tower";

export type ItemId = "forkBall" | "greatFork" | "patch" | "hotfix" | "fullRebuild" | "rollback" | "linter";

export type MoveId = string;

export type TrackId = "title" | "intro" | "town" | "route" | "cave" | "lab" | "center" | "gym"
  | "wild" | "trainer" | "leader" | "victory" | "levelUp" | "badge" | "ending" | "evolve" | "evolveSuccess"
  | "bay" | "mountain" | "ridge" | "tower" | "champion";

export type Status = "blocked" | "deprecated" | "frozen";

export interface Options {
  textSpeed: "slow" | "mid" | "fast";
  music: number;
  sfx: number;
  anims: boolean;
  haptics: boolean;
}

export interface GameRepo {
  id: number;
  name: string;
  title: string;
  description: string;
  language: string | null;
  stars: number;
  pushedAt: string;
  url: string;
  homepage: string | null;
}
