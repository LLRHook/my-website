import type { Page } from "@playwright/test";
import { build } from "esbuild";
import { resolve } from "node:path";

declare global {
  var __codelings: typeof import("./game-modules");
}

let bundle: Promise<string> | undefined;

export async function loadGameModules(page: Page): Promise<void> {
  bundle ??= build({
    entryPoints: [resolve(__dirname, "game-modules.ts")],
    bundle: true,
    write: false,
    format: "iife",
    globalName: "__codelings",
    target: "es2022",
  }).then((result) => `${result.outputFiles[0].text}\nglobalThis.__codelings = __codelings;`);
  await page.evaluate(await bundle);
}
