import { defineConfig, defaultExclude } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Vitest must not collect the Playwright e2e specs (e2e/**) — they run under
// `playwright test`, not vitest. Without this, `npm test` fails on every spec.
// `**/e2e/**` covers nested copies (e.g. .claude/worktrees/*/e2e/**) and
// `**/worktrees/**` keeps the parallel Claude worktrees out of the unit run.
//
// THE `@` ALIAS IS NOT OPTIONAL. client/vite.config.ts defines it, this file did
// not, so any test whose module graph reached an `@/...` import failed to LOAD —
// and vitest reports that as "0 test" in a failed suite, which reads like a
// missing file rather than absent coverage. client/src/lib/lobbyLink.test.ts (the
// Council OS deep-link contract: ?lobby= / ?task= / ?ask=) had been in that state:
// red on master, running nothing. The alias list mirrors client/vite.config.ts.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(here, './client/src'),
      '@/components': path.resolve(here, './client/src/components'),
      '@/pages': path.resolve(here, './client/src/pages'),
      '@/contexts': path.resolve(here, './client/src/contexts'),
      '@/hooks': path.resolve(here, './client/src/hooks'),
      '@/lib': path.resolve(here, './client/src/lib'),
      '@/data': path.resolve(here, './client/src/data'),
      '@/styles': path.resolve(here, './client/src/styles'),
    },
  },
  test: {
    // packages/** runs under `node --test` (see each package's own test script);
    // vitest cannot collect a node:test file and reports "No test suite found",
    // which made `npm test` red for three suites that are green under their own
    // runner (37/37 in packages/gspc-card-verifier). Excluded rather than left
    // failing, because a permanently-red gate is a gate nobody reads.
    exclude: [...defaultExclude, 'e2e/**', '**/e2e/**', '**/worktrees/**', 'packages/**'],
  },
});
