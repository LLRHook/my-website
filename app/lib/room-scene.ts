import data from "./room-scene.json";

export type Variant = "day_lamp_on" | "day_lamp_off" | "night_lamp_on" | "night_lamp_off";
export type Box = { x: number; y: number; w: number; h: number };
export type Point = [number, number];
export type DetailId = "diploma" | "books" | "pokeball" | "bww" | "plants";
export type SceneData = {
  width: number;
  height: number;
  widths: number[];
  variants: Variant[];
  hotspots: Record<
    | "monitor_screen"
    | "roulette"
    | "diploma"
    | "photo_profile"
    | "photo_conference"
    | "photo_peru"
    | "sticky_note"
    | "books_shelf"
    | "pokeball"
    | "bww_carton"
    | "plant_shelf"
    | "plant_floor"
    | "window"
    | "desk_lamp",
    Box
  >;
  screen: { tl: Point; tr: Point; br: Point; bl: Point };
  roulette: {
    crop: Box;
    frames: number;
    columns: number;
    center: Point;
    u: Point;
    v: Point;
    pocketZero: number;
    pocketStep: number;
    frameStep: number;
    trackScale: number;
    ballDiameter: number;
  };
  details: Record<DetailId, { width: number; height: number }>;
};

export const SCENE = data as SceneData;

export function variantFor(night: boolean, lamp: boolean): Variant {
  return `${night ? "night" : "day"}_lamp_${lamp ? "on" : "off"}`;
}

export function srcSet(variant: Variant, format: "avif" | "webp"): string {
  return SCENE.widths.map((width) => `/room/${variant}-${width}.${format} ${width}w`).join(", ");
}

export function boxStyle(box: Box): { left: string; top: string; width: string; height: string } {
  return {
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.w * 100}%`,
    height: `${box.h * 100}%`,
  };
}
