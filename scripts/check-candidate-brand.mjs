#!/usr/bin/env node
// Check candidate published bytes against the estate's OWN brand-gate rules, without a built tree.
//
// AGENTS.md says the two gate scripts want a built tree, and that the way to check without one is
// to take the rules from master and run them against the candidate bytes: the brand gate's RULES
// array is an eval-able literal in the source. This does exactly that — it evals the RULES array
// out of scripts/brand-gate.mjs and applies the gate's own jsonDisplayHits logic (same DISPLAY_KEYS
// regex, same nearAllow window, same pagesOnly skip) to the given JSON files.
//
//   node scripts/check-candidate-brand.mjs public/interop/model-lifecycle.json ...
import { readFileSync } from "node:fs";

const GATE = readFileSync(new URL("./brand-gate.mjs", import.meta.url), "utf8");

function literalAfter(src, marker) {
  const i = src.indexOf(marker);
  if (i < 0) throw new Error(`brand-gate: ${marker} not found`);
  const start = src.indexOf("[", i);
  // The RULES array ends at a line that is exactly "];". Bracket counting is wrong here: the
  // rules carry regex literals whose character classes contain "[" and "]".
  const end = src.indexOf("\n];", start);
  if (end < 0) throw new Error(`brand-gate: no closing "];" for ${marker}`);
  return src.slice(start, end + 3);
}

const RULES = eval(literalAfter(GATE, "const RULES = "));
// The display-key regex is READ FROM THE GATE, not copied: a second copy of the rules could
// drift from the gate and then agree with itself about bytes the gate would refuse.
const dm = GATE.match(/const\s+DISPLAY_KEYS\s*=\s*(\/[^\n]*\/[a-z]*);/);
if (!dm) throw new Error("brand-gate: DISPLAY_KEYS not found — this checker must read the gate, not a copy");
const DISPLAY_KEYS = eval(dm[1]);
const REGISTRY_IDENTIFIER = /^io\.github\.[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
const DISTRIBUTION_CATALOGUE = /distribution/i;

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

function jsonDisplayHits(obj, rel) {
  const hits = [];
  (function rec(node, at, key) {
    if (typeof node === "string") {
      if (!DISPLAY_KEYS.test(key || "")) return;
      if (DISTRIBUTION_CATALOGUE.test(rel) && /(^|\.)packages\[\d+\]\.name$/.test(at)) return;
      if (REGISTRY_IDENTIFIER.test(node.trim())) return;
      const text = decodeEntities(node);
      for (const rule of RULES) {
        if (rule.pagesOnly) continue;
        if (rule.allowOn && rule.allowOn.test(rel)) continue;
        const re = new RegExp(rule.pattern.source, "gi");
        let m;
        while ((m = re.exec(text)) !== null) {
          const w = text.slice(Math.max(0, m.index - 90), m.index + m[0].length + 90);
          if (rule.nearAllow && rule.nearAllow.test(w)) continue;
          hits.push({ at, rule: rule.id, why: rule.why, hit: m[0] });
          break;
        }
      }
    } else if (Array.isArray(node)) {
      node.forEach((v, i) => rec(v, `${at}[${i}]`, key));
    } else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) rec(v, at ? `${at}.${k}` : k, k);
    }
  })(obj, "", null);
  return hits;
}

let bad = 0;
for (const file of process.argv.slice(2)) {
  const rel = `/${file.split("/").slice(-2).join("/")}`;
  const doc = JSON.parse(readFileSync(file, "utf8"));
  const hits = jsonDisplayHits(doc, rel);
  if (hits.length === 0) {
    console.log(`candidate-brand: ${file} — no display-field hit across ${RULES.length} rules`);
  } else {
    bad += hits.length;
    for (const h of hits) console.log(`candidate-brand: ${file} ${h.at} [${h.rule}] "${h.hit}" — ${h.why}`);
  }
}
process.exit(bad ? 1 : 0);
