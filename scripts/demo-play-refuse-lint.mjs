#!/usr/bin/env node
/**
 * demo-play-refuse-lint — NEXT_300 #167
 *
 * Refuses dangerous publish paths for demo-play targets without custody gate.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["publishers", "scripts"];
const EXT = /\.(js|mjs|ts|sh|md)$/;

const hits = [];

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(p, out);
    else if (EXT.test(name)) out.push(p);
  }
  return out;
}

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = readFileSync(file, "utf8");
    const rel = relative(process.cwd(), file);

    // --publish without custody env mention in same file
    if (/--publish\b/.test(src) && !/CSOAI_KEY_CUSTODY|custody miss|fail closed on custody/i.test(src)) {
      hits.push(`${rel}: --publish present without CSOAI_KEY_CUSTODY / custody fail-closed reference`);
    }

    // demo target wired to mainnet publish
    if (/justoken-jmwh|jmwh/i.test(src) && /mainnet|--publish|publish\(/i.test(src)) {
      if (!/demo[\s-]?only|play:\s*["']demo["']|never mainnet|Stage 2 testnet|refuse/i.test(src)) {
        hits.push(`${rel}: JMWH/demo target near publish/mainnet without demo-only refuse`);
      }
    }
  }
}

if (hits.length) {
  console.error("demo-play-refuse-lint FAIL:\n" + hits.map((h) => "  - " + h).join("\n"));
  process.exit(1);
}
console.log("demo-play-refuse-lint OK — demo-play publish paths guarded");
