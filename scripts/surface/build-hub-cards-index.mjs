#!/usr/bin/env node
/** Derived requester index of reproducibly admitted signed Hub-model cards.
 *
 * STAMPED BYTES ARE NEVER REWRITTEN. public/interop/hub-cards-index.json carries a sibling
 * OpenTimestamps proof, so its bytes are frozen as the historical snapshot. When the admitted card
 * set changes, `--version` writes a NEW immutable file, hub-cards-index-<YYYY-MM-DD>-<cards12>.json
 * (the card-root-<date>-<hex12>.json convention; <cards12> is the first 12 hex of sha256 over the
 * canonical cards array), stamps it with the estate's OTS primitive (scripts/badger/ots_stamp.py)
 * and moves the unsigned discovery pointer hub-cards-index-latest.json to it. Consumers read the
 * pointer. Earlier versions and their proofs stay published as history.
 *
 * The default mode (what build:client runs) writes nothing while a stamped index matches the
 * current admitted cards, and fails closed when none does. Any write to a path with a sibling .ots
 * throws, in every mode.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, lstatSync, renameSync, unlinkSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const SCHEMA = "csoai.hub-cards-index/0.1";
export const POINTER_SCHEMA = "csoai.hub-cards-index-pointer/1";
const CARD_URL = "https://councilof.ai/interop/mill-cards-signed/";
const RECEIPT_SCHEMA = "csoai.mill-evidence-admission/0.2";
const URL_DIR = "/interop/";
/** A new version adds a proof: the OTS manifest is derived from proofs, and llms.txt quotes the manifest. */
export const VERSION_RECIPE = "node scripts/surface/build-hub-cards-index.mjs --version && python3 scripts/ots_manifest_rebuild.py --apply && node scripts/llms-txt.mjs";
// DetachedTimestampFile header: magic, major version 1, then the file-hash op (0x08 = sha256).
const OTS_MAGIC = Buffer.from("004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294", "hex");

const sha = (value) => createHash("sha256").update(value).digest("hex");

function canonicalDeep(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalDeep).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalDeep(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
}

export const cardsDigest = (cards) => sha(canonicalDeep(cards));

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

// ── stamped-file discipline ──────────────────────────────────────────────────────────────────

const isRegular = (path) => existsSync(path) && lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink();

/** Every write in this module goes through here: a path whose bytes a sibling .ots proves is frozen. */
export function assertNotStamped(path) {
  if (existsSync(`${path}.ots`)) {
    throw new Error(`refusing to write ${path}: a sibling .ots proof covers its bytes; stamped files are never rewritten — write a new version instead`);
  }
}

/** The sha256 a detached OpenTimestamps file commits to, read from its header; null if not one. */
export function otsSubjectDigest(raw) {
  const at = OTS_MAGIC.length;
  if (!Buffer.isBuffer(raw) || raw.length < at + 2 + 32 || !raw.subarray(0, at).equals(OTS_MAGIC)) return null;
  if (raw[at] !== 0x01 || raw[at + 1] !== 0x08) return null;
  return raw.subarray(at + 2, at + 2 + 32).toString("hex");
}

/** Same comparison the stamp-preserving writer has always made: identity of the admitted cards. */
function sameAdmittedCards(current, index) {
  return current?.schema === index.schema && current.source === index.source &&
    current.withdrawn_ledger === index.withdrawn_ledger &&
    Array.isArray(current.cards) && current.count === current.cards.length &&
    index.count === index.cards.length &&
    canonicalDeep(current.cards) === canonicalDeep(index.cards);
}

const metadataDrift = (current, index) => current.signed_files_seen !== index.signed_files_seen ||
  current.skipped_non_current_or_unreadable !== index.skipped_non_current_or_unreadable ||
  current.withdrawn_excluded !== index.withdrawn_excluded;

/** A sibling OTS proof covers these exact bytes. Rebuilds may observe newer skipped
 * files, but must not rewrite the proved snapshot while its admitted cards agree.
 * A changed card set needs a new versioned index and proof, not an in-place edit
 * (writeVersionedIndex). */
export function writeIndexPreservingStamp(out, index) {
  if (existsSync(`${out}.ots`)) {
    if (!isRegular(out)) {
      throw new Error(`stamped hub index is missing or not a regular file: ${out}`);
    }
    const current = JSON.parse(readFileSync(out, "utf8"));
    if (!sameAdmittedCards(current, index)) {
      throw new Error("stamped hub index differs from current admitted cards; create a versioned index and proof before release");
    }
    return { state: "PRESERVED_STAMPED", count: current.count, metadata_drift: metadataDrift(current, index) };
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(index, null, 1) + "\n");
  return { state: "WRITTEN", count: index.count, metadata_drift: false };
}

// ── versions ─────────────────────────────────────────────────────────────────────────────────

/** File layout derived from the legacy path: <stem>.json, <stem>-latest.json, <stem>-<date>-<hex12>.json. */
export function layout(out) {
  const dir = dirname(out), file = basename(out);
  if (!file.endsWith(".json")) throw new Error(`hub index path must end in .json: ${out}`);
  const stem = file.slice(0, -".json".length);
  const esc = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { dir, legacy: file, pointer: `${stem}-latest.json`, stem,
    versioned: new RegExp(`^${esc}-(\\d{4}-\\d{2}-\\d{2})-([0-9a-f]{12})\\.json$`) };
}

/** Read one stamped index and prove its proof commits to its exact bytes. Throws otherwise. */
export function readStamped(dir, name) {
  const path = join(dir, name), proof = `${path}.ots`;
  if (!isRegular(path) || !isRegular(proof)) throw new Error(`stamped hub index or its proof is missing or not a regular file: ${name}`);
  const raw = readFileSync(path);
  const digest = sha(raw);
  if (otsSubjectDigest(readFileSync(proof)) !== digest) throw new Error(`${name}.ots does not commit to the bytes of ${name}`);
  const doc = JSON.parse(raw.toString("utf8"));
  if (doc?.schema !== SCHEMA || !Array.isArray(doc.cards)) throw new Error(`${name} is not a ${SCHEMA} document`);
  return { name, sha256: digest, doc, cards_sha256: cardsDigest(doc.cards) };
}

/** Every stamped version on disk, legacy snapshot first, then by name (date order). */
export function stampedVersions(out) {
  const L = layout(out);
  const names = existsSync(L.dir) ? readdirSync(L.dir).filter((f) => L.versioned.test(f)).sort() : [];
  const versions = [];
  if (existsSync(join(L.dir, `${L.legacy}.ots`))) versions.push(readStamped(L.dir, L.legacy));
  for (const name of names) {
    if (!existsSync(join(L.dir, `${name}.ots`))) {
      throw new Error(`versioned hub index has no proof (a failed --version run?): ${name} — remove it and re-run`);
    }
    versions.push(readStamped(L.dir, name));
  }
  return versions;
}

/** The version the pointer selects (or the legacy snapshot when no pointer exists), verified. */
export function resolveCurrent(out) {
  const L = layout(out);
  const pointerPath = join(L.dir, L.pointer);
  if (!existsSync(pointerPath)) return existsSync(join(L.dir, `${L.legacy}.ots`)) ? readStamped(L.dir, L.legacy) : null;
  if (!isRegular(pointerPath)) throw new Error(`hub index pointer is not a regular file: ${L.pointer}`);
  const pointer = JSON.parse(readFileSync(pointerPath, "utf8"));
  const url = pointer?.index_url;
  const name = typeof url === "string" && url.startsWith(URL_DIR) ? url.slice(URL_DIR.length) : null;
  if (pointer?.schema !== POINTER_SCHEMA || !name || (name !== L.legacy && !L.versioned.test(name))) {
    throw new Error(`hub index pointer ${L.pointer} is malformed or names a file outside the versioned set`);
  }
  const current = readStamped(L.dir, name);
  if (pointer.index_sha256 !== current.sha256 || pointer.cards_sha256 !== current.cards_sha256 || pointer.count !== current.doc.count) {
    throw new Error(`hub index pointer ${L.pointer} disagrees with the bytes of ${name}`);
  }
  return current;
}

export function pointerDocument(out, current, versions) {
  const ref = (v) => ({ index_url: URL_DIR + v.name, index_sha256: v.sha256, ots_url: `${URL_DIR}${v.name}.ots`,
    cards_sha256: v.cards_sha256, count: v.doc.count, as_of: v.doc.as_of ?? null });
  return {
    schema: POINTER_SCHEMA,
    kind: "DISCOVERY_POINTER_ONLY",
    as_of: current.doc.as_of ?? null,
    index_url: URL_DIR + current.name,
    index_sha256: current.sha256,
    cards_sha256: current.cards_sha256,
    count: current.doc.count,
    ots_url: `${URL_DIR}${current.name}.ots`,
    versions: versions.map(ref),
    scope: "This unsigned pointer selects the stamped hub-cards index whose cards equal the admitted signed Hub cards on this commit. " +
      "Every listed index is immutable and has its own OpenTimestamps proof; earlier versions stay published as history and are not current. " +
      "A proof file's existence is not a Bitcoin anchor: read its verified state. The count is separate from /signed/card_index.json, /root.json and /api/gspc.",
  };
}

function writePointer(out, current) {
  const L = layout(out);
  const path = join(L.dir, L.pointer);
  assertNotStamped(path);
  const encoded = JSON.stringify(pointerDocument(out, current, stampedVersions(out)), null, 2) + "\n";
  if (existsSync(path) && readFileSync(path, "utf8") === encoded) return false;
  const temp = `${path}.tmp`;
  writeFileSync(temp, encoded, { flag: "wx" });
  renameSync(temp, path);
  return true;
}

/**
 * Default (build) mode. Writes nothing while the current stamped index agrees with the admitted
 * cards, and throws when it does not: a release never ships an index whose proof covers other cards.
 * With no stamped index at all it keeps the original behaviour and writes the legacy file.
 */
export function checkCurrentIndex(out, index) {
  const current = resolveCurrent(out);
  if (current === null) return writeIndexPreservingStamp(out, index);
  if (!sameAdmittedCards(current.doc, index)) {
    throw new Error(`stamped hub index ${current.name} differs from current admitted cards; ` +
      `run \`${VERSION_RECIPE}\` to write a new versioned index, its OTS proof and the derived manifest (stamped bytes are never edited)`);
  }
  return { state: "PRESERVED_STAMPED", file: current.name, count: current.doc.count, metadata_drift: metadataDrift(current.doc, index) };
}

/**
 * --version mode. A changed card set gets a new immutable file and a fresh proof; the pointer moves.
 * `stamp(path)` must create `${path}.ots` committing to the file's bytes; on any failure the new
 * file is removed and nothing else has been written.
 */
export function writeVersionedIndex(out, index, { stamp } = {}) {
  const L = layout(out);
  const current = resolveCurrent(out);
  if (current === null) return writeIndexPreservingStamp(out, index);
  if (sameAdmittedCards(current.doc, index)) {
    const moved = existsSync(join(L.dir, L.pointer)) ? false : writePointer(out, current);
    return { state: moved ? "POINTER_WRITTEN" : "UNCHANGED", file: current.name, count: current.doc.count };
  }
  const existing = stampedVersions(out).find((v) => sameAdmittedCards(v.doc, index));
  if (existing) {
    writePointer(out, existing);
    return { state: "REPOINTED", file: existing.name, count: existing.doc.count };
  }
  if (typeof stamp !== "function") throw new Error("a new hub index version needs a stamper; none was given");
  const digest = cardsDigest(index.cards);
  const name = `${L.stem}-${index.as_of.slice(0, 10)}-${digest.slice(0, 12)}.json`;
  const path = join(L.dir, name);
  assertNotStamped(path);
  const doc = { ...index, cards_sha256: digest,
    supersedes: { index_url: URL_DIR + current.name, index_sha256: current.sha256 } };
  writeFileSync(path, JSON.stringify(doc, null, 1) + "\n", { flag: "wx" });
  try {
    stamp(path);
    readStamped(L.dir, name);
  } catch (error) {
    for (const p of [path, `${path}.ots`]) { try { unlinkSync(p); } catch { /* absent */ } }
    throw new Error(`stamping ${name} failed, nothing was released: ${error.message}`);
  }
  const next = readStamped(L.dir, name);
  writePointer(out, next);
  return { state: "VERSIONED", file: name, count: index.count };
}

/** The estate's one OTS primitive (scripts/badger/ots_stamp.py submit_ots), create-only. */
export function pythonStamper(path) {
  const helper = join(dirname(fileURLToPath(import.meta.url)), "stamp_hub_cards_index.py");
  const r = spawnSync(process.env.PYTHON || "python3", [helper, path], { stdio: ["ignore", "inherit", "inherit"] });
  if (r.status !== 0) throw new Error(`OTS stamper exited ${r.status ?? r.signal}`);
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());
if (isMain) {
  const args = process.argv.slice(2); const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const out = opt("--out", "public/interop/hub-cards-index.json");
  const index = buildIndex(opt("--cards", "public/interop/mill-cards-signed"), opt("--evidence", "public/interop/mill-evidence"));
  const result = args.includes("--version")
    ? writeVersionedIndex(out, index, { stamp: pythonStamper })
    : checkCurrentIndex(out, index);
  console.log(`hub-cards-index: ${result.count} current admitted cards; ${result.state} → ${result.file ? join(dirname(out), result.file) : out}`);
  if (result.state === "VERSIONED") console.log("hub-cards-index: new proof written; now run: python3 scripts/ots_manifest_rebuild.py --apply && node scripts/llms-txt.mjs");
  if (result.metadata_drift) console.warn("hub-cards-index: file-census metadata changed (same admitted cards); stamped bytes preserved");
}
