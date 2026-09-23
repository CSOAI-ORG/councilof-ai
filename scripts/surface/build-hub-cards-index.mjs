#!/usr/bin/env node
/** Derived requester index of reproducibly admitted signed Hub-model cards. */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, lstatSync } from "node:fs";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";

export const SCHEMA = "csoai.hub-cards-index/0.1";
const CARD_URL = "https://councilof.ai/interop/mill-cards-signed/";
const RECEIPT_SCHEMA = "csoai.mill-evidence-admission/0.2";

const sha = (value) => createHash("sha256").update(value).digest("hex");

function canonicalDeep(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalDeep).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalDeep(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
}

export function hasCurrentAdmission(wrap, evidenceDir) {
  try {
    const body = wrap?.body, admission = body?.admission, ev = body?.evidence;
    if (!body || admission?.schema !== RECEIPT_SCHEMA || ev?.schema !== "csoai.mill-item-evidence/0.2") return false;
    if (!/^[0-9a-f]{64}$/.test(admission.sha256) || !/^admission-[0-9a-f]{12}\.json$/.test(admission.file)) return false;
    const receiptPath = join(evidenceDir, admission.file);
    if (!lstatSync(receiptPath).isFile() || lstatSync(receiptPath).isSymbolicLink()) return false;
    const raw = readFileSync(receiptPath);
    if (sha(raw) !== admission.sha256) return false;
    const receipt = JSON.parse(raw.toString("utf8"));
    if (receipt.schema !== RECEIPT_SCHEMA || receipt.state !== "VERIFIED_ADMISSION" || !receipt.source_body) return false;
    if (receipt.source_card_id !== sha(canonicalDeep(receipt.source_body))) return false;
    const expected = structuredClone(receipt.source_body);
    expected.status = Number(expected.n || 0) >= 30 ? "MEASURED" : "UNMEASURED";
    expected.unmeasured = Number(expected.n || 0) >= 30 ? [] : ["n<30 unquotable"];
    expected.signature_state = "SIGNED";
    expected.admission = admission;
    if (canonicalDeep(body) !== canonicalDeep(expected)) return false;
    if (wrap.id !== sha(canonicalDeep(body))) return false;
    if (receipt.items_sha256 !== ev.items_sha256 || receipt.bank_sha256 !== ev.bank_sha256) return false;
    for (const [file, digest] of [[ev.items_file, ev.items_sha256], [ev.bank_file, ev.bank_sha256]]) {
      if (!/^(items|bank)-[a-z0-9-]{1,12}-[0-9a-f]{12}\.jsonl$/.test(file) || !/^[0-9a-f]{64}$/.test(digest)) return false;
      const path = join(evidenceDir, file);
      if (!lstatSync(path).isFile() || lstatSync(path).isSymbolicLink() || sha(readFileSync(path)) !== digest) return false;
    }
    return true;
  } catch { return false; }
}

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

/**
 * Card ids WITHDRAWN.jsonl withdraws (C-2026-0914-01: graded by a one-option prompt,
 * no replacement card). Throws on a malformed row: an index built past a ledger it
 * could not read would list withdrawn cards as current.
 */
export function withdrawnIds(cardsDir) {
  const path = join(cardsDir, "WITHDRAWN.jsonl");
  const ids = new Set();
  if (!existsSync(path)) return ids;
  for (const [i, line] of readFileSync(path, "utf8").split("\n").entries()) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    if (!/^[0-9a-f]{64}$/.test(row?.withdrawn_id ?? "") || typeof row.correction !== "string" || !row.correction.trim()) {
      throw new Error(`WITHDRAWN.jsonl row ${i + 1}: withdrawn_id (sha256) and correction are required`);
    }
    ids.add(row.withdrawn_id);
  }
  return ids;
}

export function buildIndex(cardsDir, evidenceDir = "public/interop/mill-evidence") {
  const cards = []; let skipped = 0; let withdrawnExcluded = 0;
  const withdrawn = withdrawnIds(cardsDir);
  const names = existsSync(cardsDir) ? readdirSync(cardsDir).filter((f) => f.startsWith("signed-") && f.endsWith(".json")).sort() : [];
  for (const name of names) {
    try {
      const wrap = JSON.parse(readFileSync(join(cardsDir, name), "utf8"));
      if (withdrawn.has(wrap?.id)) { withdrawnExcluded++; continue; }
      const row = hasCurrentAdmission(wrap, evidenceDir) ? rowFromCard(name, wrap) : null;
      row ? cards.push(row) : skipped++;
    }
    catch { skipped++; }
  }
  return { schema: SCHEMA, as_of: new Date().toISOString(),
    source: "reproducibly admitted signed Hub cards on the deployed commit",
    count: cards.length, signed_files_seen: names.length,
    skipped_non_current_or_unreadable: skipped,
    withdrawn_excluded: withdrawnExcluded,
    withdrawn_ledger: "interop/mill-cards-signed/WITHDRAWN.jsonl — withdrawn cards still resolve and verify; they are not current measurements",
    cards };
}

/** A sibling OTS proof covers these exact bytes. Rebuilds may observe newer skipped
 * files, but must not rewrite the proved snapshot while its admitted cards agree.
 * A changed card set needs a new versioned index and proof, not an in-place edit. */
export function writeIndexPreservingStamp(out, index) {
  if (existsSync(`${out}.ots`)) {
    if (!existsSync(out) || !lstatSync(out).isFile() || lstatSync(out).isSymbolicLink()) {
      throw new Error(`stamped hub index is missing or not a regular file: ${out}`);
    }
    const current = JSON.parse(readFileSync(out, "utf8"));
    if (current.schema !== index.schema || current.source !== index.source ||
        current.withdrawn_ledger !== index.withdrawn_ledger ||
        !Array.isArray(current.cards) || current.count !== current.cards.length ||
        index.count !== index.cards.length ||
        canonicalDeep(current.cards) !== canonicalDeep(index.cards)) {
      throw new Error("stamped hub index differs from current admitted cards; create a versioned index and proof before release");
    }
    return { state: "PRESERVED_STAMPED", count: current.count,
      metadata_drift: current.signed_files_seen !== index.signed_files_seen ||
        current.skipped_non_current_or_unreadable !== index.skipped_non_current_or_unreadable ||
        current.withdrawn_excluded !== index.withdrawn_excluded };
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(index, null, 1) + "\n");
  return { state: "WRITTEN", count: index.count, metadata_drift: false };
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());
if (isMain) {
  const args = process.argv.slice(2); const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const out = opt("--out", "public/interop/hub-cards-index.json");
  const index = buildIndex(opt("--cards", "public/interop/mill-cards-signed"), opt("--evidence", "public/interop/mill-evidence"));
  const result = writeIndexPreservingStamp(out, index);
  console.log(`hub-cards-index: ${result.count} current admitted cards; ${result.state} → ${out}`);
  if (result.metadata_drift) console.warn("hub-cards-index: file-census metadata changed; stamped snapshot preserved pending versioned proof migration");
}
