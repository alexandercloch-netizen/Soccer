import { defineConfig } from "vitest/config";
import path from "node:path";
/** Repository contract suite: the same tests run against every TeamRepo implementation (WP00/WP01). */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src"), "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts") } },
  test: { include: ["tests/contract/**/*.test.ts"], environment: "node", env: { GOODSPORT_NOW: "2026-09-10" } },
});
