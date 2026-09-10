import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Next's server-only marker throws outside the Next build; tests are server code by construction.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts", "tests/request/**/*.test.ts", "tests/privacy/**/*.test.ts"],
    exclude: ["tests/e2e/**", "tests/contract/**", "node_modules/**", ".next/**"],
    environment: "node",
    env: { GOODSPORT_NOW: "2026-09-10" },
  },
});
