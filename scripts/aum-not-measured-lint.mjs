#!/usr/bin/env node
/**
 * aum-not-measured-lint — NEXT_300 #177
 *
 * AUM / TVL / ARR cited on RWA or labour fixtures must not be labeled MEASURED.
 * Primary pages may cite REPORTED AUM with dated sources; inventing MEASURED
 * floats (or pairing AUM with measured_score numbers) fails the gate.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = [
  "scripts/index-fixtures",
  "datasets",
  "client/src/data",
  "adapters",
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

function checkJsonFixture(path, raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }
  const rows = Array.isArray(data?.indices)
    ? data.indices
    : Array.isArray(data)
      ? data
      : data?.targets
        ? data.targets
        : [data];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const status = String(row.status || row.register || "").toUpperCase();
    const score = row.measured_score;
    const aumish =
      row.aum != null ||
      row.AUM != null ||
      row.tvl != null ||
      row.TVL != null ||
      /aum|tvl|arr/i.test(JSON.stringify(row));
    if (aumish && status === "MEASURED") {
      hits.push(`${relative(process.cwd(), path)}: AUM/TVL/ARR marked MEASURED`);
    }
    if (aumish && typeof score === "number" && !Number.isNaN(score)) {
      hits.push(`${relative(process.cwd(), path)}: AUM-adjacent row has numeric measured_score`);
    }
  }
}

function checkText(path, src) {
  // "AUM … MEASURED" or "MEASURED AUM $X" without REPORTED / cite hedge nearby
  const re =
    /(?:\bAUM\b|\bTVL\b|\bARR\b)[\s\S]{0,60}\bMEASURED\b|\bMEASURED\b[\s\S]{0,60}(?:\bAUM\b|\bTVL\b|\bARR\b)/gi;
  let m;
  while ((m = re.exec(src)) !== null) {
    const window = src.slice(Math.max(0, m.index - 50), m.index + m[0].length + 50);
    if (/REPORTED|cite\s+dated|not\s+(?:a\s+)?MEASURED|never\s+invent|do\s+not\s+invent|primary\s+AUM\s+only|Invent\s+AUM|≠\s*MEASURED|as\s+MEASURED\.|UNMEASURED/i.test(window)) {
      continue;
    }
    hits.push(`${relative(process.cwd(), path)}: AUM/TVL/ARR collocated with MEASURED without REPORTED hedge`);
  }
}

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const raw = readFileSync(file, "utf8");
    if (file.endsWith(".json")) checkJsonFixture(file, raw);
    else checkText(file, raw);
  }
}

// Labour fixtures: measured_score must be null
const labourFix = "scripts/index-fixtures/labour-economy-unmeasured.json";
try {
  const labour = JSON.parse(readFileSync(labourFix, "utf8"));
  for (const row of labour.indices || []) {
    if (row.measured_score !== null) {
      hits.push(`${labourFix}: ${row.slug} measured_score must be null (got ${JSON.stringify(row.measured_score)})`);
    }
    if (String(row.status).toUpperCase() === "MEASURED") {
      hits.push(`${labourFix}: ${row.slug} must not be MEASURED`);
    }
  }
} catch (e) {
  hits.push(`${labourFix}: unreadable — ${e.message}`);
}

if (hits.length) {
  console.error("aum-not-measured-lint FAIL:\n" + hits.map((h) => "  - " + h).join("\n"));
  process.exit(1);
}
console.log("aum-not-measured-lint OK — AUM/TVL not invented as MEASURED");
