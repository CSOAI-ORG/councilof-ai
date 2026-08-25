#!/usr/bin/env node
/**
 * signed-json-guard — block deploy when signed artifacts are broken.
 * Allows exact honest-150 OR sha256-verified 335 (mine MANIFEST 335 all signed).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const dist = process.argv[2] || "dist/client";
const dir = join(dist, "signed");
const STUB_MARKERS = ["__LOAD_FROM__","PLACEHOLDER_WILL_REPLACE","LOAD_FROM__","LOAD_FROM_FILE","__CURSOR_LOAD__","__FULL_CONTENT_FROM_","$load:","@file:","@file://","file://","data:application","test data uri"];
const VERIFIED_335_SHA256 = "12f5122df916c1f165281e6453d8673ffc52992513e218c62f354337091d8ccb";
let failures = [];
let files = [];
try { files = readdirSync(dir).filter(f => f.endsWith(".json")); }
catch { console.log(`signed-json-guard: no ${dir} directory`); process.exit(0); }
for (const f of files) {
  const p = join(dir, f);
  const raw = readFileSync(p, "utf8");
  const size = statSync(p).size;
  for (const m of STUB_MARKERS) if (raw.includes(m)) failures.push(`${f}: stub ${m}`);
  let parsed; try { parsed = JSON.parse(raw); } catch (e) { failures.push(`${f}: json`); continue; }
  if (f === "card_index.json") {
    const cards = Array.isArray(parsed) ? parsed : (parsed.cards ?? []);
    const nField = (!Array.isArray(parsed) && typeof parsed.n_cards === "number") ? parsed.n_cards : null;
    const digest = createHash("sha256").update(Buffer.from(raw, "utf8")).digest("hex");
    const honest150 = cards.length === 150 && (nField == null || nField === 150) && size >= 30000;
    const verified335 = cards.length === 335 && nField === 335 && digest === VERIFIED_335_SHA256;
    if (honest150 || verified335) { console.log(`card_index.json: ok ${cards.length}`); continue; }
    failures.push(`card_index.json: ${cards.length} not ok`);
  }
}
if (failures.length) { console.error(failures); process.exit(1); }
console.log(`ok ${files.length}`);
