#!/usr/bin/env node
/**
 * signed-json-guard — Allows honest-150 OR sha256-verified 335.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
const dist = process.argv[2] || "dist/client";
const dir = join(dist, "signed");
const VERIFIED_335_SHA256 = "12f5122df916c1f165281e6453d8673ffc52992513e218c62f354337091d8ccb";
let failures = [];
let files = [];
try { files = readdirSync(dir).filter(f => f.endsWith(".json")); }
catch { process.exit(0); }
for (const f of files) {
  const p = join(dir, f);
  const raw = readFileSync(p, "utf8");
  const size = statSync(p).size;
  if (f !== "card_index.json") continue;
  const parsed = JSON.parse(raw);
  const cards = Array.isArray(parsed) ? parsed : (parsed.cards ?? []);
  const nField = (!Array.isArray(parsed) && typeof parsed.n_cards === "number") ? parsed.n_cards : null;
  const digest = createHash("sha256").update(Buffer.from(raw, "utf8")).digest("hex");
  const honest150 = cards.length === 150 && (nField == null || nField === 150) && size >= 30000;
  const verified335 = cards.length === 335 && nField === 335 && digest === VERIFIED_335_SHA256;
  if (!honest150 && !verified335) failures.push(`card_index: ${cards.length} cards not honest-150 or verified-335`);
}
if (failures.length) { console.error(failures); process.exit(1); }
console.log("ok");
