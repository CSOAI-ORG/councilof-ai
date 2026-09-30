import { defineConfig } from "vitest/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  test: { include: ["test/*.test.js"], environment: "node" },
});
