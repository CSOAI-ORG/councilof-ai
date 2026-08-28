#!/usr/bin/env node
/**
 * Verify staged HF packs (#139, #186, #253) before upload — no invented MEASURED scores.
 * Does not require HF auth. Exit 0 when packs are ready; exit 1 on honesty violations.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

const PACKS = [
  {
    move: "139/253",
    dir: "datasets/labour-economy-unmeasured",
    files: ["README.md", "labour-economy-unmeasured.json"],
    requireTags: ["unmeasured"],
  },
  {
    move: "186",
    dir: "datasets/rwa-testnet-unmeasured",
    files: ["README.md", "catalog.json"],
    requireTags: ["unmeasured", "testnet"],
  },
];

function assertNoMeasuredScore(obj, path) {
  const walk = (v, p) => {
    if (v && typeof v === "object") {
      if ("measured_score" in v && v.measured_score !== null) {
        throw new Error(`${p}.measured_score must be null, got ${v.measured_score}`);
      }
      for (const [k, val] of Object.entries(v)) walk(val, `${p}.${k}`);
    }
  };
  walk(obj, path);
}

function assertReadmeCard(text, path, requireTags) {
  if (!text.startsWith("---")) {
    throw new Error(`${path} missing YAML dataset-card frontmatter`);
  }
  const end = text.indexOf("\n---", 3);
  if (end < 0) throw new Error(`${path} unclosed YAML frontmatter`);
  const yaml = text.slice(3, end).toLowerCase();
  for (const tag of requireTags) {
    if (!yaml.includes(tag)) {
      throw new Error(`${path} frontmatter must mention tag/label '${tag}'`);
    }
  }
  if (/measured-index/i.test(text) && !/unmeasured/i.test(text)) {
    throw new Error(`${path} must not present MEASURED product register without UNMEASURED`);
  }
}

let ok = true;
for (const pack of PACKS) {
  const dir = join(root, pack.dir);
  console.log(`\n=== NEXT_300 #${pack.move} ${pack.dir} ===`);
  if (!existsSync(dir)) {
    console.error(`  FAIL  missing directory ${pack.dir}`);
    ok = false;
    continue;
  }
  for (const f of pack.files) {
    const fp = join(dir, f);
    if (!existsSync(fp)) {
      console.error(`  FAIL  missing ${pack.dir}/${f}`);
      ok = false;
      continue;
    }
    console.log(`  OK    ${f}`);
    if (f === "README.md") {
      try {
        assertReadmeCard(readFileSync(fp, "utf8"), `${pack.dir}/${f}`, pack.requireTags);
        console.log(`  OK    ${f} — dataset-card YAML + UNMEASURED tags`);
      } catch (e) {
        console.error(`  FAIL  ${f} — ${e.message}`);
        ok = false;
      }
    }
    if (f.endsWith(".json")) {
      try {
        const j = JSON.parse(readFileSync(fp, "utf8"));
        assertNoMeasuredScore(j, `${pack.dir}/${f}`);
        console.log(`  OK    ${f} — all measured_score null`);
      } catch (e) {
        console.error(`  FAIL  ${f} — ${e.message}`);
        ok = false;
      }
    }
  }
}

if (!ok) process.exit(1);
const hasToken = !!(process.env.HF_TOKEN && process.env.HF_TOKEN.length > 8);
console.log(
  hasToken
    ? "\nverify-staged-hf OK — HF_TOKEN present; run npm run hf:upload-staged"
    : "\nverify-staged-hf OK — packs staged; HF_TOKEN missing (Hub upload deferred)",
);
