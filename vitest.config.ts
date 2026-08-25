import path from "node:path";
import { defineConfig, defaultExclude } from "vitest/config";

// Vitest must not collect the Playwright e2e specs (e2e/**) — they run under
// `playwright test`, not vitest. Without this, `npm test` fails on every spec.
// `**/e2e/**` covers nested copies (e.g. .claude/worktrees/*/e2e/**) and
// `**/worktrees/**` keeps the parallel Claude worktrees out of the unit run.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
    },
  },
  test: {
    exclude: [...defaultExclude, "e2e/**", "**/e2e/**", "**/worktrees/**"],
  },
});
