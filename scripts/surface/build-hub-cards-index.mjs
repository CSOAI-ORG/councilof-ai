#!/usr/bin/env node
/** Derived requester index of reproducibly admitted signed Hub-model cards. */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

export const SCHEMA = "csoai.hub-cards-index/0.1";
const CARD_URL = "https://councilof.ai/interop/mill-cards-signed/";

export function rowFromCard(name, wrap) {
  const body = wrap?.body;
  if (!body || typeof body !== "object" || typeof body.model !== "string" || body.model.startsWith("ollama:")) return null;
  if (typeof wrap.id !== "string" || typeof wrap.signature !== "string") return null;
  if (body.evidence?.schema !== "csoai.mill-item-evidence/0.2" ||
      body.admission?.schema !== "csoai.mill-evidence-admission/0.2") return null;
  return {
    id: wrap.id, file: name, url: CARD_URL + name, subject: body.model,
    axis: typeof body.axis === "string" ? body.axis : null,
    n: Number.isInteger(body.n) ? body.n : null,
    status: typeof body.status === "string" ? body.status : null,
    run_id: typeof body.run_id === "string" ? body.run_id : null,
    evidence_schema: body.evidence.schema,
    admission_sha256: body.admission.sha256,
    signed: true, verified_here: false,
  };
}

export function buildIndex(cardsDir) {
  const cards = []; let skipped = 0;
  const names = existsSync(cardsDir) ? readdirSync(cardsDir).filter((f) => f.startsWith("signed-") && f.endsWith(".json")).sort() : [];
  for (const name of names) {
    try { const row = rowFromCard(name, JSON.parse(readFileSync(join(cardsDir, name), "utf8"))); row ? cards.push(row) : skipped++; }
    catch { skipped++; }
  }
  return { schema: SCHEMA, as_of: new Date().toISOString(),
    source: "reproducibly admitted signed Hub cards on the deployed commit",
    count: cards.length, signed_files_seen: names.length,
    skipped_non_current_or_unreadable: skipped, cards };
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());
if (isMain) {
  const args = process.argv.slice(2); const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const out = opt("--out", "public/interop/hub-cards-index.json");
  const index = buildIndex(opt("--cards", "public/interop/mill-cards-signed"));
  mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, JSON.stringify(index, null, 1) + "\n");
  console.log(`hub-cards-index: ${index.count} current admitted cards → ${out}`);
}
