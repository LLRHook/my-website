import type { AppId } from "@/app/lib/apps";
import { SCENE, type SceneData } from "@/app/lib/room-scene";
import type { ObjectId } from "./ObjectDetail";

export type HotspotAction =
  | { kind: "inspect"; object: ObjectId }
  | { kind: "app"; app: AppId }
  | { kind: "toggle"; target: "night" | "lamp" };

export type Hotspot = {
  name: keyof SceneData["hotspots"];
  short: string;
  label: string | ((state: { night: boolean; lamp: boolean }) => string);
  action: HotspotAction;
};

export const HOTSPOTS: Hotspot[] = [
  { name: "window", short: "Window", label: ({ night }) => night ? "Window. Switch to daylight" : "Window. Switch to evening", action: { kind: "toggle", target: "night" } },
  { name: "plant_floor", short: "Plants", label: "Plants", action: { kind: "inspect", object: "plants" } },
  { name: "books_shelf", short: "Reading", label: "Bookshelf. Currently reading Red Rising", action: { kind: "inspect", object: "reading" } },
  { name: "desk_lamp", short: "Lamp", label: ({ lamp }) => lamp ? "Desk lamp. Switch off" : "Desk lamp. Switch on", action: { kind: "toggle", target: "lamp" } },
  { name: "diploma", short: "Diploma", label: "Diploma. B.S. Computer Science, UMBC", action: { kind: "inspect", object: "education" } },
  { name: "photo_conference", short: "Speaking", label: "Conference photo", action: { kind: "inspect", object: "conference" } },
  { name: "photo_peru", short: "Peru", label: "Travel photo from Peru", action: { kind: "inspect", object: "peru" } },
  { name: "photo_profile", short: "Profile", label: "Profile photo", action: { kind: "inspect", object: "profile" } },
  { name: "pokeball", short: "Games", label: "Poké Ball. Magic and Pokémon", action: { kind: "inspect", object: "games" } },
  { name: "bww_carton", short: "Wings", label: "Buffalo Wild Wings carton", action: { kind: "inspect", object: "wings" } },
  { name: "sticky_note", short: "Projects", label: "Sticky note: one more commit. Open Projects", action: { kind: "app", app: "projects" } },
];

HOTSPOTS.sort((a, b) => {
  const first = SCENE.hotspots[a.name];
  const second = SCENE.hotspots[b.name];
  return second.w * second.h - first.w * first.h;
});
