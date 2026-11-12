import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("./", import.meta.url));
export default defineConfig({
  root, resolve: { alias: { "@": root + "client/src" } }, esbuild: { jsx: "automatic" },
  test: { include: ["client/src/components/home/HomePublicJourney.test.tsx", "client/src/components/lobby/useWorkspaceNavigation.test.tsx"], environment: "node", maxWorkers: 1, fileParallelism: false, testTimeout: 10000 },
});
