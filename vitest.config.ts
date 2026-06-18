import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Unit/component tests only. Playwright owns e2e/*.spec.ts.
    include: ["app/**/*.test.{ts,tsx}"],
  },
});
