import type { GameRepo } from "./data/ids.js";
import { Audio } from "./engine/audio.js";
import { Input } from "./engine/input.js";
import { startLoop } from "./engine/loop.js";
import { SceneStack } from "./engine/scenes.js";
import { Screen } from "./engine/screen.js";
import { loadOptions } from "./engine/storage.js";
import { initFont } from "./gfx/font.js";
import { TitleScene } from "./ui/title.js";

function parseRepos(raw: string): GameRepo[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) {
      return [];
    }
    const valid = (entry: unknown): entry is GameRepo => {
      if (typeof entry !== "object" || entry === null) {
        return false;
      }
      const repo = entry as Record<string, unknown>;
      return Number.isSafeInteger(repo.id) && (repo.id as number) > 0 &&
        typeof repo.name === "string" && typeof repo.title === "string"
        && typeof repo.description === "string" && (typeof repo.language === "string" || repo.language === null)
        && Number.isSafeInteger(repo.stars) && (repo.stars as number) >= 0 && typeof repo.pushedAt === "string"
        && typeof repo.url === "string" && /^https?:\/\//i.test(repo.url)
        && (repo.homepage === null || (typeof repo.homepage === "string" && /^https?:\/\//i.test(repo.homepage)));
    };
    return value.every(valid) ? value : [];
  } catch {
    return [];
  }
}

const root = document.getElementById("game");
if (root) {
  let failed = false;
  const fail = (error: unknown) => {
    if (failed) {
      return;
    }
    failed = true;
    root.removeAttribute("data-ready");
    root.dataset.scene = "error";
    console.error("[codelings] Boot failed:", error);
  };
  try {
    root.dataset.scene = "loading";
    const canvas = root.querySelector("canvas");
    if (!canvas) {
      throw new Error("Game canvas is missing");
    }
    const repos = parseRepos(root.dataset.repos ?? "[]");
    const options = loadOptions();
    const screen = new Screen(canvas);
    initFont();
    const audio = new Audio(options);
    const input = new Input(root, () => audio.resume());
    const scenes = new SceneStack(root);
    scenes.push(new TitleScene(input, audio, scenes, options, repos));
    const draw = () => {
      scenes.draw(screen);
      screen.present();
    };
    draw();
    startLoop((dt) => {
      input.update();
      audio.update();
      scenes.update(dt);
    }, draw, fail);
    root.dataset.ready = "";
  } catch (error) {
    fail(error);
  }
}
