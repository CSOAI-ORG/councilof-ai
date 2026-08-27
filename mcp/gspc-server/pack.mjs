#!/usr/bin/env node
/**
 * prepack — copy the two canonical files into the package directory so the npm
 * tarball is self-contained, and refuse to pack if a stale copy has drifted.
 *
 * The canonical files stay canonical:
 *   functions/mcp/gspc-tools.json   — the ONE tool-definition source (HTTP + stdio)
 *   public/signed/verify-card.mjs   — the ONE published card verifier
 *
 * In a repo checkout index.mjs reads the canonical paths directly; the copies
 * made here exist only inside the published tarball.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

const PAIRS = [
  ["../../functions/mcp/gspc-tools.json", "./gspc-tools.json"],
  ["../../public/signed/verify-card.mjs", "./verify-card.mjs"],
];

for (const [src, dst] of PAIRS) {
  const s = here(src);
  const d = here(dst);
  if (!existsSync(s)) {
    console.error(`pack: canonical file missing: ${src} — packing outside a repo checkout is not supported`);
    process.exit(1);
  }
  writeFileSync(d, readFileSync(s));
  if (sha(s) !== sha(d)) {
    console.error(`pack: copy of ${src} does not match its source — aborting`);
    process.exit(1);
  }
  console.error(`pack: ${dst} <- ${src} (${sha(d).slice(0, 12)}…)`);
}
