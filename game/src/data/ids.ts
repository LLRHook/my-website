export type Dir = "up" | "down" | "left" | "right";

export type MapId = "bedroom" | "house" | "sterling" | "lab" | "route1" | "commit" | "center" | "mart" |
  "gym" | "route2" | "cave";

export type ItemId = "forkBall" | "greatFork" | "patch" | "hotfix" | "fullRebuild" | "rollback" | "linter";

export type MoveId = string;

export type TrackId = "title";

export type Status = "blocked" | "deprecated" | "frozen";

export interface Options {
  textSpeed: "slow" | "mid" | "fast";
  music: number;
  sfx: number;
  anims: boolean;
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
