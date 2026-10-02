import type { GameRepo } from "./data/ids.js";
import { mulberry32 } from "./engine/rng.js";
import { Audio } from "./engine/audio.js";
import { Input } from "./engine/input.js";
import { startLoop } from "./engine/loop.js";
import { SceneStack } from "./engine/scenes.js";
import { Screen } from "./engine/screen.js";
import { loadOptions } from "./engine/storage.js";
import { initScenery } from "./gfx/scenery.js";
import { initSprites } from "./gfx/sprites.js";
import { initTiles } from "./gfx/tiles.js";
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
    initTiles();
    initScenery();
    initSprites();
    const audio = new Audio(options);
    const input = new Input(root, () => audio.resume(), () => {
      if (options.haptics) {
        navigator.vibrate?.(8);
      }
    });
    let scrollY = 0;
    let visible = true;
    let paused = false;
    const fullscreen = () => root.hasAttribute("data-fullscreen");
    const syncPause = () => {
      paused = document.hidden || (!visible && !fullscreen());
      audio.setPaused(paused);
    };
    const resize = () => {
      if (!fullscreen()) {
        return;
      }
      const width = root.clientWidth;
      const height = root.clientHeight;
      root.toggleAttribute("data-landscape", width > height);
      const style = getComputedStyle(root);
      const left = parseFloat(style.paddingLeft);
      const right = width - parseFloat(style.paddingRight);
      const top = parseFloat(style.paddingTop);
      const bottom = height - parseFloat(style.paddingBottom);
      const parts = root.querySelectorAll<HTMLElement>(".game-bezel, .dpad, .game-ab, .game-system, .game-exit");
      for (let scale = Math.max(1, Math.floor(Math.min(width / 160, height / 144))); scale >= 1; scale--) {
        root.style.setProperty("--screen-width", `calc(160px * ${scale})`);
        const fits = [...parts].every((part) => {
          const bounds = part.getBoundingClientRect();
          return bounds.left >= left && bounds.right <= right && bounds.top >= top && bounds.bottom <= bottom;
        });
        if (fits) {
          break;
        }
      }
    };
    const exitFullscreen = () => {
      if (!fullscreen()) {
        return;
      }
      root.removeAttribute("data-fullscreen");
      root.removeAttribute("data-landscape");
      root.style.removeProperty("--screen-width");
      document.documentElement.classList.remove("game-locked");
      document.body.style.removeProperty("top");
      window.scrollTo(0, scrollY);
      if (document.fullscreenElement === root) {
        void document.exitFullscreen().catch(() => {});
      }
      syncPause();
    };
    document.querySelector('[data-action="fullscreen"]')?.addEventListener("click", () => {
      if (fullscreen()) {
        exitFullscreen();
        return;
      }
      scrollY = window.scrollY;
      document.body.style.top = `${-scrollY}px`;
      root.dataset.fullscreen = "";
      document.documentElement.classList.add("game-locked");
      syncPause();
      resize();
      root.focus({ preventScroll: true });
      audio.resume();
      void root.requestFullscreen?.({ navigationUI: "hide" }).catch(() => {});
    });
    root.querySelector('[data-action="exit-fullscreen"]')?.addEventListener("click", exitFullscreen);
    document.addEventListener("keydown", (event) => {
      if (event.code === "Escape" && fullscreen()) {
        exitFullscreen();
      }
    });
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) {
        exitFullscreen();
      } else if (!fullscreen() && document.fullscreenElement === root) {
        // An API request can finish after the user has already left the CSS overlay.
        void document.exitFullscreen().catch(() => {});
      } else {
        resize();
      }
    });
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    window.visualViewport?.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", syncPause);
    new IntersectionObserver(([entry]) => {
      visible = entry.intersectionRatio >= 0.25;
      syncPause();
    }, { threshold: [0, 0.25] }).observe(root);
    root.addEventListener("contextmenu", (event) => event.preventDefault());
    root.addEventListener("pointerup", () => audio.resume());
    root.addEventListener("touchend", () => audio.resume());
    const scenes = new SceneStack(root);
    const parameters = new URLSearchParams(location.search);
    const rawSeed = parameters.get("seed");
    const rng = rawSeed !== null && /^-?\d+$/.test(rawSeed) ? mulberry32(Number(rawSeed)) : Math.random;
    const encounter = parameters.get("encounter") === "1";
    const rawHour = new URLSearchParams(location.search).get("hour");
    const forcedHour = rawHour !== null && /^([0-9]|1[0-9]|2[0-3])$/.test(rawHour)
      ? Number(rawHour) : undefined;
    scenes.push(new TitleScene(input, audio, scenes, options, repos, root, forcedHour, rng, encounter));
    const draw = () => {
      if (paused) {
        return;
      }
      scenes.draw(screen);
      screen.present();
    };
    draw();
    startLoop((dt) => {
      if (paused) {
        return;
      }
      input.update();
      audio.update();
      scenes.update(dt);
    }, draw, fail);
    root.dataset.ready = "";
  } catch (error) {
    fail(error);
  }
}
