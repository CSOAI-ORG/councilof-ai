#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const dist = process.argv[2] || "dist/client";
const dir = join(dist, "signed");
const STUB_MARKERS = ["__LOAD_FROM__","PLACEHOLDER_WILL_REPLACE","LOAD_FROM__","LOAD_FROM_FILE","__CURSOR_LOAD__","__FULL_CONTENT_FROM_","$load:","@file:","@file://","file://","data:application","test data uri"];
const HONEST_CARD_COUNT = 150;
const HONEST_SIZE_FLOOR = 30000;
const VERIFIED_335_SHA256 = "12f5122df916c1f165281e6453d8673ffc52992513e218c62f354337091d8ccb";
let failures = [];
let files = [];
try { files = readdirSync(dir).filter(f => f.endsWith(".json")); }
catch { console.log(`signed-json-guard: no ${dir}`); process.exit(0); }
for (const f of files) {
  const p = join(dir, f);
  const rawBuf = readFileSync(p);
  const raw = rawBuf.toString("utf8");
  const size = statSync(p).size;
  const sha = createHash("sha256").update(rawBuf).digest("hex");
  for (const m of STUB_MARKERS) if (raw.includes(m)) failures.push(`${f}: stub ${m}`);
  let parsed; try { parsed = JSON.parse(raw); } catch (e) { failures.push(`${f}: bad JSON`); continue; }
  if (f === "card_index.json") {
    const cards = Array.isArray(parsed) ? parsed : (parsed.cards ?? []);
    const nField = (!Array.isArray(parsed) && typeof parsed.n_cards === "number") ? parsed.n_cards : null;
    if (nField != null && nField !== cards.length) failures.push(`n_cards mismatch`);
    const ok335 = nField === 335 && cards.length === 335 && sha === VERIFIED_335_SHA256;
    const ok150 = nField === HONEST_CARD_COUNT && cards.length === HONEST_CARD_COUNT && size >= HONEST_SIZE_FLOOR;
    if (ok335 || ok150) { console.log(ok335 ? "OK verified 335" : "OK honest 150"); continue; }
    failures.push(`card_index ${cards.length}/${nField} rejected`);
  }
}
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`signed-json-guard OK ${files.length}`);
