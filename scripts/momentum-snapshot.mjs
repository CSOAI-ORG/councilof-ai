#!/usr/bin/env node
/**
 * momentum-snapshot — writes <dist>/interop/momentum-snapshot.json at build time, from the SAME
 * producer the live endpoint runs (functions/api/_momentum.ts), so the prerender can bake the
 * figures into the HTML and the page is not empty without JavaScript. The client labels it a
 * snapshot and prints when it was taken; the live read of /api/momentum replaces it.
 *
 *   node scripts/momentum-snapshot.mjs dist/client [--origin https://councilof.ai]
 *
 * It never fails the build. If the producer cannot run (no network, a Node without
 * --experimental-strip-types) or returns no figure, NO snapshot is written and the surfaces
 * render nothing without JavaScript — an absent figure, never an invented one.
 */
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const dist = resolve(args.find((a) => !a.startsWith("--")) ?? "dist/client");
const oi = args.indexOf("--origin");
const origin = oi >= 0 ? args[oi + 1] : "https://councilof.ai";
const r = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--no-warnings", join(here, "momentum-snapshot-run.mjs"), dist, origin],
  { stdio: "inherit", timeout: 90_000 },
);
if (r.status !== 0) console.log(`momentum-snapshot: producer did not complete (status ${r.status ?? r.signal}); no snapshot written, build continues`);
process.exit(0);
