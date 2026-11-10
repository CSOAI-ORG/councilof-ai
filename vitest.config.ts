import path from 'node:path';
import { defineConfig, defaultExclude } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Vitest must not collect the Playwright e2e specs (e2e/**) — they run under
// `playwright test`, not vitest. Without this, `npm test` fails on every spec.
// `**/e2e/**` covers nested copies (e.g. .claude/worktrees/*/e2e/**) and
// `**/worktrees/**` keeps the parallel Claude worktrees out of the unit run.
//
// The `@` aliases mirror client/vite.config.ts so a test can import a page
// component (which imports `@/components/ui/*`) and render it.
//
// THE `@` ALIAS IS NOT OPTIONAL. client/vite.config.ts defines it, this file did
// not, so any test whose module graph reached an `@/...` import failed to LOAD —
// and vitest reports that as "0 test" in a failed suite, which reads like a
// missing file rather than absent coverage. client/src/lib/lobbyLink.test.ts (the
// Council OS deep-link contract: ?lobby= / ?task= / ?ask=) had been in that state:
// red on master, running nothing. Specific prefixes are listed before the bare
// `@` so the longest match wins however the resolver iterates.
// node:test files (import { test } from "node:test") and bare assert scripts. Vitest cannot collect them and
// reported each as a FAILED suite ("No test suite found"), which kept the pr-gates unit step red on
// every PR. They are named one by one, not globbed, and pr-gates.yml runs exactly this list under
// `node --test` in its own step, so excluding them here removes no coverage.
export const NODE_TEST_FILES = [
  'scripts/product/catalog-journeys.node-test.mjs',
  'scripts/build-daily-signal.node-test.mjs',
  'scripts/daily-maintenance-metadata.node-test.mjs',
  'scripts/daily-mapping-review-queue/build.test.mjs',
  'scripts/build-daily-product.node-test.mjs',
  'scripts/build-axis-reports.ownership.test.mjs',
  'scripts/build-axis-reports.slots.test.mjs',
  'scripts/build-models-measured.test.mjs',
  'scripts/contract-convergence.test.mjs',
  'scripts/feed-delivery-kit.test.mjs',
  'scripts/evidence-learning-contract.node-test.mjs',
  // Executed by node-test-registry: compiled site chrome must preserve frozen evidence bytes.
  'scripts/inject-workspace-launcher.capture.test.mjs',
  'scripts/harness-x/render.test.mjs',
  // The hub fetch that gates the build (authenticated, retrying): a node:test file vitest
  // cannot collect, named here so pr-gates.yml runs it under node --test. It stubs the
  // fetch, so a 429 and a 404 can be produced on demand.
  'scripts/surface/hub-fetch.node-test.mjs',
  // The HF mirror gate must tell a MISSING file from a FAILED READ: on 2026-11-07 it
  // published a rate limit as "the directory is not on HF" and blocked a PR whose files
  // were present. Named here so pr-gates.yml runs it under node --test (same reason as
  // hub-fetch above). It stubs the fetch, so a 429, a 404 and a network error can be
  // produced on demand, and it needs no network.
  'scripts/surface/hf-mirror-gate.node-test.mjs',
  // The hygiene sweeper planner: a node:test file vitest cannot collect, named here so
  // pr-gates.yml runs it under node --test (same reason as sitemap-withdrawal below).
  // No apostrophes in these comments: the registry and the workflow extract entries by
  // naive quote matching, and a stray quote inside the array corrupts the parsed list.
  // The committed-bytes check for the two edge generators (public/sitemap.xml and
  // public/_redirects): a node:test file vitest cannot collect, named here so
  // pr-gates.yml runs it under node --test. It proves the checks can detect drift.
  'scripts/committed-bytes.node-test.mjs',
  'scripts/hygiene/sweeper.node-test.mjs',
  // The cron-health watch decisions: a node:test file vitest cannot collect, named here so
  // pr-gates.yml runs it under node --test. It proves the watch catches a dead schedule,
  // passes a live one, and finds a schedule run buried behind pull_request runs.
  'scripts/hygiene/cron-watch.node-test.mjs',
  'scripts/regulator-census-redirects.test.mjs',
  'scripts/research/watch-sources.test.mjs',
  'scripts/review/deploy-target-wiring.test.mjs',
  'scripts/review/first-ask-completion.test.mjs',
  'scripts/review/pages-bind-missing-namespaces.test.mjs',
  'scripts/review/pages-release-target.test.mjs',
  // The published-pin liveness gate: a node:test file vitest cannot collect, named here so
  // pr-gates.yml runs it under `node --test` instead of leaving it collected-and-red.
  'scripts/review/published-pins-liveness.test.mjs',
  'scripts/sitemap-withdrawal.node-test.mjs',
  'scripts/surface/axis-index-truth.node-test.mjs',
  'scripts/surface/facts-scope.test.mjs',
  'scripts/surface/prerender-io.test.mjs',
  'scripts/surface/render-board-reference.test.mjs',
  'scripts/surface/public-copy.node-test.mjs',
  // The live persona gauntlet demands page markers that must exist in the page source. This
  // node:test file catches that drift at pull-request time instead of on a two-hourly
  // schedule, and it proves the retired copy has not come back.
  'scripts/surface/persona-markers.node-test.mjs',
  'scripts/surface/reviewed-blog-publication.node-test.mjs',
  'spaces/gspc-board/table.node-test.mjs',
  // node:test file. vitest cannot collect it and reports it as a FAILED SUITE
  // ("No test suite found in file ..."), so it is named here: pr-gates.yml reads
  // this same list and runs it under `node --test`, which both removes it from
  // vitest and keeps it covered.
  'scripts/probe-zenodo-status.test.mjs',
  // A bare assert script (no test framework): node --test runs it as one test; vitest reported
  // "No test suite found" in the orphan-coverage step (`npx vitest run council-os ...`).
  'council-os/gspc-pontius-boundary.test.mjs',
  'scripts/watchdog/source-status.test.mjs',
  // 2026-11-02: seven more node:test files that no gate ran. mcp/gspc-server/wired-tools was
  // already excluded from vitest but was never executed anywhere; the other six were collected
  // by a bare vitest run and reported as failed suites. Two of them were also RED: the
  // journey-backends file had read a journey_backends block that the generated capability
  // registry never carried, and card-counts caught CLAUDE.md pinning a card_count the estate's
  // own rule forbids. A test nobody runs is a comment.
  //
  // NOTE FOR THE NEXT EDITOR: this list is read by a plain quote-scan, so a comment here must
  // not contain a quoted word - a comment is not a path. scripts/node-test-registry.mjs now
  // strips comments before reading, but the shell step in pr-gates.yml does not, so keep it
  // plain anyway.
  'mcp/gspc-server/wired-tools.test.mjs',
  'capabilities/card-counts.test.mjs',
  'capabilities/journey-backends.test.mjs',
  'integrations/integrations.test.mjs',
  'tests/population-delivery-verifier.test.mjs',
  'actions/verify-card/run.test.mjs',
  'actions/verify-card/workflow.test.mjs',
  'scripts/derive-fin-run-attestation.test.mjs',
];

export default defineConfig({
  // A clean unit-test checkout has no pod dist bundle. Resolve only this actual
  // service import to its shared TypeScript bundle entry; execute the real core.
  plugins: [{
    name: 'route-service-source-core-for-tests',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === './dist/route-core.mjs' &&
          importer?.split('?')[0] === path.resolve(here, 'services/gspc-router/route_service.mjs')) {
        return path.resolve(here, 'services/gspc-router/core.ts');
      }
    },
  }],
  // Match the application's React transform. Several component tests render
  // TSX directly through Vitest rather than through client/vite.config.ts.
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@/components': path.resolve(here, './client/src/components'),
      '@/pages': path.resolve(here, './client/src/pages'),
      '@/contexts': path.resolve(here, './client/src/contexts'),
      '@/hooks': path.resolve(here, './client/src/hooks'),
      '@/lib': path.resolve(here, './client/src/lib'),
      '@/data': path.resolve(here, './client/src/data'),
      '@/styles': path.resolve(here, './client/src/styles'),
      '@': path.resolve(here, './client/src'),
    },
  },
  test: {
    // 2026-11-03 re-land (lost in the wave-2 consolidation): the default 5s timeout
    // predates the corpus — 3,197-card mill sets, 18s byte-position tamper sweeps and
    // 33k-file sitemap builds blew it under full-suite parallel load. 20s covers every
    // standalone-measured test with headroom; explicit per-test timeouts still win.
    testTimeout: 20_000,
    // packages/** runs under `node --test` (see each package's own test script);
    // vitest cannot collect a node:test file and reports "No test suite found",
    // which made `npm test` red for three suites that are green under their own
    // runner (37/37 in packages/gspc-card-verifier). Excluded rather than left
    // failing, because a permanently-red gate is a gate nobody reads.
    // `dist/**` is BUILD OUTPUT. `npm run build:client` copies the repo's functions/ and
    // public/ into dist/client, so after any build 113 test files exist twice — and the
    // copies resolve their fixture paths relative to dist/, so they fail on files that are
    // present in the source tree. dist/ is gitignored, so CI never saw it and only a local
    // run after a build went red, which reads like a broken test rather than a duplicate.
    exclude: [...defaultExclude, 'dist/**', '**/dist/**', '**/.git-wt-*/**', 'docs/**/*.test.mjs', 'e2e/**', '**/e2e/**', '**/worktrees/**', 'packages/**', 'council-os/planned-ready.lock.test.mjs', ...NODE_TEST_FILES],
  },
});
