#!/usr/bin/env node
/**
 * served-html-digests.mjs — the bytes the injector would WRITE for each HTML file in a tree.
 *
 * WHY THIS EXISTS. The build injects a workspace-launcher script into every HTML page it
 * serves (scripts/inject-workspace-launcher.mjs), so the SERVED bytes of an HTML file are
 * not the tree's bytes: they are the tree's bytes plus that script. Measured 2026-11-07:
 * 23 published rows differ by exactly +63 bytes for that reason alone.
 *
 * So a digest over the tree's bytes can never match what a reader fetches, and a check that
 * compares tree bytes to published digests would sit RED on 23 correct rows — the estate's own
 * rule about a gate that cries wolf on a correct answer.
 *
 * The fix is NOT to re-implement the injection here. The injector EXPORTS its transform
 * (injectLauncher), so this helper asks THE INJECTOR ITSELF what it would write. One rule, one
 * place: the estate's own principle that the claim lives in two places — the artefact and the
 * generator that emits it.
 *
 * USAGE
 *   node scripts/surface/served-html-digests.mjs <tree-root> <out.json>
 *   node scripts/surface/served-html-digests.mjs <tree-root> <out.json> --served-root <dir>
 *
 * The second form reads the BUILT copies where they exist (ground truth) and asks the
 * injector only for the ones the build did not carry. The first form asks the injector for
 * every HTML file, which is what a CI job without a build needs.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, join, relative, sep } from "node:path";
import { createHash } from "node:crypto";
import { injectLauncher } from "../inject-workspace-launcher.mjs";

const args = process.argv.slice(2);
const tree = args[0] && !args[0].startsWith("--") ? args[0] : null;
const out = args[1] && !args[1].startsWith("--") ? args[1] : null;
if (!tree || !out) {
  console.error("usage: served-html-digests.mjs <tree-root> <out.json> [--served-root <dir>]");
  process.exit(2);
}
const servedRootIdx = args.indexOf("--served-root");
const servedRoot = servedRootIdx >= 0 ? args[servedRootIdx + 1] : null;

function htmlFiles(dir) {
  const found = [];
  const walk = (d) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".html")) found.push(p);
    }
  };
  walk(resolve(tree));
  return found;
}

const digests = {};
let fromBuilt = 0;
let fromInjector = 0;
for (const file of htmlFiles(tree)) {
  const rel = relative(resolve(tree), file).split(sep).join("/");
  let bytes = null;
  if (servedRoot) {
    const built = resolve(servedRoot, rel);
    if (existsSync(built) && statSync(built).isFile()) {
      bytes = readFileSync(built);
      fromBuilt += 1;
    }
  }
  if (bytes === null) {
    // What the injector WOULD write. The injector's own transform, imported — not re-implemented.
    bytes = Buffer.from(injectLauncher(readFileSync(file, "utf8")), "utf8");
    fromInjector += 1;
  }
  digests[rel] = { bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}
writeFileSync(out, JSON.stringify(digests, null, 1) + "\n");
console.error(
  `served-html-digests: ${Object.keys(digests).length} HTML file(s) — ${fromBuilt} from the built tree, ` +
  `${fromInjector} from the injector's own transform`,
);
