import { build, context } from "esbuild";
import { rmSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const outputDirectory = new URL("../public/game/", import.meta.url);
const outfile = new URL("main.js", outputDirectory);

rmSync(outputDirectory, { recursive: true, force: true });
const options = {
  entryPoints: [fileURLToPath(new URL("src/main.ts", import.meta.url))],
  bundle: true,
  minify: true,
  format: "esm",
  target: ["es2022", "safari15"],
  legalComments: "none",
  outfile: fileURLToPath(outfile),
  sourcemap: false,
  plugins: [{
    name: "output-size",
    setup(builder) {
      builder.onEnd((result) => {
        if (result.errors.length === 0) {
          console.log(`Game bundle: ${statSync(outfile).size} bytes`);
        }
      });
    },
  }],
};

if (process.argv.includes("--watch")) {
  const builder = await context(options);
  await builder.watch();
} else {
  await build(options);
}
