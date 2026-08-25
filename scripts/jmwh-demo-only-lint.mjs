#!/usr/bin/env node
/**
 * jmwh-demo-only-lint — NEXT_300 #189
 *
 * JMWH must stay demo-only. Fails if claimed as production MEASURED without demo label.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = [
  "client/src/data",
  "adapters",
  "functions/api",
  "publishers",
  "docs",
];
const EXT = /\.(json|ts|tsx|md|mjs)$/;

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

function checkRwaTargets(path, src) {
  if (!path.endsWith("rwaAttestationTargets.ts")) return;
  const block = src.match(/slug:\s*["']justoken-jmwh["'][\s\S]*?\n\s*\},/);
  if (block && !/\bplay:\s*["']demo["']/.test(block[0])) {
    hits.push(`${relative(process.cwd(), path)}: justoken-jmwh must have play: "demo"`);
  }
  const stage2Refs = src.match(/RWA_STAGE2_REFS\s*=\s*\[([^\]]+)\]/);
  if (stage2Refs && /justoken-jmwh|jmwh/i.test(stage2Refs[1])) {
    hits.push(`${relative(process.cwd(), path)}: JMWH must not appear in RWA_STAGE2_REFS (clean plays only)`);
  }
}

function checkText(path, src) {
  checkRwaTargets(path, src);

  // JMWH + MEASURED without demo hedge in same window
  const re = /\bJMWH\b[\s\S]{0,80}\bMEASURED\b|\bMEASURED\b[\s\S]{0,80}\bJMWH\b/gi;
  let m;
  while ((m = re.exec(src)) !== null) {
    const window = src.slice(Math.max(0, m.index - 80), m.index + m[0].length + 80);
    if (/demo[\s-]?only|play:\s*["']demo["']|DEMO ONLY|never mainnet|not\s+production|UNMEASURED|not\s+MEASURED/i.test(window)) {
      continue;
    }
    hits.push(
      `${relative(process.cwd(), path)}: JMWH collocated with MEASURED without demo-only hedge`,
    );
  }

  // justoken-jmwh slug with clean play or MEASURED status
  if (/justoken-jmwh/i.test(src)) {
    const slugBlocks = src.split(/slug:\s*["']justoken-jmwh["']/i).slice(1);
    for (const block of slugBlocks) {
      const chunk = block.slice(0, 400);
      if (/play:\s*["']clean["']/i.test(chunk)) {
        hits.push(`${relative(process.cwd(), path)}: justoken-jmwh must not use play: "clean"`);
      }
      if (/status:\s*["']MEASURED["']/i.test(chunk) || /register:\s*["']MEASURED["']/i.test(chunk)) {
        hits.push(`${relative(process.cwd(), path)}: justoken-jmwh must not be MEASURED`);
      }
    }
  }
}

for (const root of ROOTS) {
  for (const file of walk(root)) {
    checkText(file, readFileSync(file, "utf8"));
  }
}

if (hits.length) {
  console.error("jmwh-demo-only-lint FAIL:\n" + hits.map((h) => "  - " + h).join("\n"));
  process.exit(1);
}
console.log("jmwh-demo-only-lint OK — JMWH remains demo-only");
