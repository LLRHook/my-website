import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { environment: "node", env: { STYLE_CSS: "body { color: #000; }" }, include: ["app/**/*.test.ts", "scripts/**/*.test.ts"] },
});
