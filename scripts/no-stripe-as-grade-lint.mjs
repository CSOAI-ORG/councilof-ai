#!/usr/bin/env node
/**
 * no-stripe-as-grade-lint — HO.2 / NEXT_300 #233
 *
 * Stripe (or any PSP) may meter access/runs. It must never be copy-framed as
 * selling a GSPC grade, axis score, or MEASURED placement.
 *
 * Scans client + docs source for forbidden collocations. Exit 1 on hit.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["client/src", "docs", "functions/api"];
const EXT = /\.(tsx?|jsx?|md|mjs|ts)$/;

/** Stripe/PSP near "grade" / "score sold" / axis price language */
const FORBIDDEN = [
  {
    id: "stripe_sells_grade",
    re: /stripe[\s\S]{0,80}(?:sell(?:s|ing)?|price|buy|purchase|checkout)[\s\S]{0,80}(?:grade|gspc\s+score|axis\s+score|measured\s+score)/i,
    why: "Stripe must not sell grades/scores (HO.2).",
  },
  {
    id: "grade_via_stripe",
    re: /(?:grade|gspc\s+score|measured\s+score)[\s\S]{0,80}(?:via|with|using|through)\s+stripe/i,
    why: "Grades are never sold via Stripe.",
  },
  {
    id: "stripe_per_grade_sku",
    re: /stripe[\s\S]{0,60}(?:per[\s-]?(?:grade|score|axis)|grade[\s-]?sku|score[\s-]?sku)/i,
    why: "No per-grade / score SKU on Stripe.",
  },
];

const ALLOW_NEAR =
  /never\s+sold|scores?\s+never|grade\s+is\s+never|HO\.2|not\s+(?:a\s+)?(?:grade|rating)\s+sale|meter(?:ed)?\s+access|access\s+\/\s+runs|do\s+not\s+imply|must\s+not\s+sell/i;

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXT.test(name)) out.push(p);
  }
  return out;
}

const hits = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = readFileSync(file, "utf8");
    for (const rule of FORBIDDEN) {
      const m = src.match(rule.re);
      if (!m) continue;
      const idx = m.index ?? 0;
      const window = src.slice(Math.max(0, idx - 40), idx + (m[0]?.length || 0) + 40);
      if (ALLOW_NEAR.test(window)) continue;
      hits.push(`${relative(process.cwd(), file)}: ${rule.id} — ${rule.why}`);
    }
  }
}

if (hits.length) {
  console.error("no-stripe-as-grade-lint FAIL:\n" + hits.map((h) => "  - " + h).join("\n"));
  process.exit(1);
}
console.log("no-stripe-as-grade-lint OK — Stripe not framed as grade sales");
