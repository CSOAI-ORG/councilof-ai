#!/usr/bin/env node
/** Derive lifecycle and regulatory readiness without altering signed card bytes.
 *
 * STAMPED BYTES ARE NEVER REWRITTEN. public/interop/mill-receipt-readiness.json carries a sibling
 * OpenTimestamps proof, so its bytes are frozen as the historical snapshot. Until 7 Oct 2026 this
 * generator rewrote that file in place whenever SUPERSEDED.jsonl moved a receipt to a newer card,
 * so every mill PR failed the gates ("mill receipt readiness is stale") and could only go green by
 * breaking a stamp. This is the same migration #2865 made for the hub-cards index:
 *
 *   --version   When the derived readiness differs from the current stamped one, write a NEW
 *               immutable file, mill-receipt-readiness-<YYYY-MM-DD>-<content12>.json (create-only;
 *               <content12> is the first 12 hex of sha256 over the canonical content), stamp it
 *               with the estate's OTS primitive, and move the unsigned discovery pointer
 *               mill-receipt-readiness-latest.json to it. Unchanged content writes nothing; a
 *               failed stamp releases nothing.
 *   (default)   Also `--check`. Writes nothing. Resolves the pointer, checks its sha256 against the
 *               bytes and that the proof commits to those bytes, and fails closed with the full
 *               recipe when the derived readiness differs.
 *
 * Every write goes through assertNotStamped: a path with a sibling .ots is refused in every mode.
 * Consumers read the pointer. Earlier versions and their proofs stay published as history.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { verifyCard } from "../public/signed/verify-card.mjs";
import { assertNotStamped, otsSubjectDigest, pythonStamper } from "./surface/build-hub-cards-index.mjs";

export { assertNotStamped };
export const SCHEMA = "csoai.mill-receipt-readiness/v2";
export const POINTER_SCHEMA = "csoai.mill-receipt-readiness-pointer/1";
const READINESS_SCHEMA = /^csoai\.mill-receipt-readiness\/v\d+$/;
const URL_DIR = "/interop/";
/** A new version adds a proof: the OTS manifest is derived from proofs, and llms.txt quotes the manifest. */
export const VERSION_RECIPE = "node scripts/build-mill-receipt-readiness.mjs --version && python3 scripts/ots_manifest_rebuild.py --apply && node scripts/llms-txt.mjs";
/** The derived content. Version metadata (as_of, content_sha256, supersedes) is not content. */
export const CONTENT_KEYS = ["schema", "derived_from", "truth_rule", "counts", "receipts"];

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const DEFAULT_OUT = path.join(repo, "public/interop/mill-receipt-readiness.json");

const sha = (value) => createHash("sha256").update(value).digest("hex");

function canonicalDeep(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalDeep).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalDeep(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
}

const contentOf = (doc) => Object.fromEntries(CONTENT_KEYS.map((k) => [k, doc?.[k]]));
export const contentDigest = (doc) => sha(canonicalDeep(contentOf(doc)));
const sameContent = (a, b) => canonicalDeep(contentOf(a)) === canonicalDeep(contentOf(b));

// ── derivation (unchanged rules; it only ever reads signed bytes) ─────────────────────────────

export async function deriveReadiness(sourceDir = path.join(repo, "public/interop/mill-cards-signed")) {
  const files = fs.readdirSync(sourceDir).filter((name) => name.endsWith(".json")).sort();
  const cardsById = new Map();
  for (const file of files) {
    const card = JSON.parse(fs.readFileSync(path.join(sourceDir, file), "utf8"));
    if (typeof card?.id === "string") cardsById.set(card.id, { card, file });
  }
  const replacements = new Map();
  const ledger = path.join(sourceDir, "SUPERSEDED.jsonl");
  if (fs.existsSync(ledger)) {
    for (const line of fs.readFileSync(ledger, "utf8").split(/\r?\n/)) {
      if (!line.trim()) continue;
      const row = JSON.parse(line);
      if (typeof row.superseded_id === "string" && typeof row.by_id === "string") {
        replacements.set(row.superseded_id, row.by_id);
      }
    }
  }
  const rows = [];

  for (const file of files) {
    const original = JSON.parse(fs.readFileSync(path.join(sourceDir, file), "utf8"));
    if (original?.body?.signature_state !== "STAGED_UNSIGNED") continue;
    let currentId = original.id;
    const seen = new Set();
    while (replacements.has(currentId)) {
      if (seen.has(currentId)) throw new Error(`supersession cycle at ${currentId}`);
      seen.add(currentId);
      currentId = replacements.get(currentId);
    }
    const current = cardsById.get(currentId);
    if (!current) throw new Error(`missing terminal replacement ${currentId} for ${original.id}`);
    const { card, file: currentFile } = current;
    const verdict = await verifyCard(card);
    const rawLinkage = card.body?.regulatory_crosswalk?.linkage_status ?? "UNLINKED";
    const linkage = rawLinkage === "DIRECT" ? "LINKED" : "UNLINKED";
    // A date is only ever read off the signed bytes. When it is absent the artifact says why,
    // because a bare null cannot tell an UNMEASURED cell apart from a dateless MEASURED one.
    const measuredAt = typeof card.body.measured_at === "string" ? card.body.measured_at : null;
    const status = typeof card.body.status === "string" ? card.body.status : null;
    const unmeasuredReasons = Array.isArray(card.body.unmeasured) ? card.body.unmeasured : [];
    const measuredAtAbsence = measuredAt !== null ? null
      : status === "UNMEASURED"
        ? `the signed body carries no measured_at field: this card is UNMEASURED (${unmeasuredReasons.join("; ") || "no reason recorded"}), so there is no measurement date to record`
        : `the signed body carries no measured_at field: this card is ${status ?? "of unrecorded status"} but was signed without a date, and signed bytes are superseded, never edited`;
    rows.push({
      id: card.id,
      card_url: `/interop/mill-cards-signed/${currentFile}`,
      supersedes_staged_id: original.id,
      model: card.body.model,
      axis: card.body.axis,
      status,
      unmeasured: unmeasuredReasons,
      measured_at: measuredAt,
      measured_at_absence: measuredAtAbsence,
      outer_signature: { state: verdict.state, alg: card.alg ?? null, key: card.did ?? null },
      declared_lifecycle: card.body.signature_state,
      regulatory_linkage: {
        state: linkage,
        source_state: rawLinkage,
        refs: card.body?.regulatory_crosswalk?.refs ?? [],
        regulation_score_eligible: linkage === "LINKED",
      },
    });
  }

  const counts = {
    receipts: rows.length,
    outer_signature_valid: rows.filter((row) => row.outer_signature.state === "VALID").length,
    declared_staged_unsigned: rows.filter((row) => row.declared_lifecycle === "STAGED_UNSIGNED").length,
    declared_signed: rows.filter((row) => row.declared_lifecycle === "SIGNED").length,
    regulatory_linked: rows.filter((row) => row.regulatory_linkage.state === "LINKED").length,
    regulatory_unlinked: rows.filter((row) => row.regulatory_linkage.state === "UNLINKED").length,
    regulation_score_eligible: rows.filter((row) => row.regulatory_linkage.regulation_score_eligible).length,
    measured_at_recorded: rows.filter((row) => row.measured_at !== null).length,
    measured_at_absent_unmeasured_card: rows.filter((row) => row.measured_at === null && row.status === "UNMEASURED").length,
    measured_at_absent_dateless_card: rows.filter((row) => row.measured_at === null && row.status !== "UNMEASURED").length,
  };

  if (counts.receipts !== 36 || counts.outer_signature_valid !== 36 ||
      counts.declared_staged_unsigned !== 0 || counts.declared_signed !== 36 || counts.regulatory_linked !== 5 ||
      counts.regulatory_unlinked !== 31 || counts.regulation_score_eligible !== 5 ||
      counts.measured_at_recorded !== 34 || counts.measured_at_absent_unmeasured_card !== 1 ||
      counts.measured_at_absent_dateless_card !== 1) {
    throw new Error(`mill receipt truth drift: ${JSON.stringify(counts)}`);
  }
  if (rows.some((row) => (row.measured_at === null) !== (row.measured_at_absence !== null))) {
    throw new Error("every absent measured_at must carry a stated reason, and every present one must carry none");
  }

  return {
    schema: SCHEMA,
    derived_from: "the 36 original STAGED_UNSIGNED wrappers resolved through public/interop/mill-cards-signed/SUPERSEDED.jsonl to their terminal immutable replacements",
    truth_rule: "Outer cryptographic validity, inner declared lifecycle, and regulatory linkage are independent states. UNLINKED receipts are not regulation-scored. measured_at is read off the signed bytes and is never supplied by this generator; where it is null, measured_at_absence states why, and an UNMEASURED card having no date is not the same defect as a MEASURED card signed without one.",
    counts,
    receipts: rows,
  };
}

// ── stamped versions ──────────────────────────────────────────────────────────────────────────

const isRegular = (p) => fs.existsSync(p) && fs.lstatSync(p).isFile() && !fs.lstatSync(p).isSymbolicLink();

/** File layout derived from the legacy path: <stem>.json, <stem>-latest.json, <stem>-<date>-<hex12>.json. */
export function layout(out) {
  const dir = path.dirname(out), file = path.basename(out);
  if (!file.endsWith(".json")) throw new Error(`readiness path must end in .json: ${out}`);
  const stem = file.slice(0, -".json".length);
  const esc = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { dir, legacy: file, pointer: `${stem}-latest.json`, stem,
    versioned: new RegExp(`^${esc}-(\\d{4}-\\d{2}-\\d{2})-([0-9a-f]{12})\\.json$`) };
}

/** Read one stamped readiness file and prove its proof commits to its exact bytes. Throws otherwise. */
export function readStamped(dir, name) {
  const p = path.join(dir, name), proof = `${p}.ots`;
  if (!isRegular(p) || !isRegular(proof)) throw new Error(`stamped mill receipt readiness or its proof is missing or not a regular file: ${name}`);
  const raw = fs.readFileSync(p);
  const digest = sha(raw);
  if (otsSubjectDigest(fs.readFileSync(proof)) !== digest) throw new Error(`${name}.ots does not commit to the bytes of ${name}`);
  const doc = JSON.parse(raw.toString("utf8"));
  if (typeof doc?.schema !== "string" || !READINESS_SCHEMA.test(doc.schema) || !Array.isArray(doc.receipts)) {
    throw new Error(`${name} is not a csoai.mill-receipt-readiness document`);
  }
  return { name, sha256: digest, doc, content_sha256: contentDigest(doc) };
}

/** Every stamped version on disk, legacy snapshot first, then by name (date order). */
export function stampedVersions(out) {
  const L = layout(out);
  const names = fs.existsSync(L.dir) ? fs.readdirSync(L.dir).filter((f) => L.versioned.test(f)).sort() : [];
  const versions = [];
  if (fs.existsSync(path.join(L.dir, `${L.legacy}.ots`))) versions.push(readStamped(L.dir, L.legacy));
  for (const name of names) {
    if (!fs.existsSync(path.join(L.dir, `${name}.ots`))) {
      throw new Error(`versioned mill receipt readiness has no proof (a failed --version run?): ${name} — remove it and re-run`);
    }
    versions.push(readStamped(L.dir, name));
  }
  return versions;
}

/** The version the pointer selects (or the legacy snapshot when no pointer exists), verified. */
export function resolveCurrent(out) {
  const L = layout(out);
  const pointerPath = path.join(L.dir, L.pointer);
  if (!fs.existsSync(pointerPath)) return fs.existsSync(path.join(L.dir, `${L.legacy}.ots`)) ? readStamped(L.dir, L.legacy) : null;
  if (!isRegular(pointerPath)) throw new Error(`mill receipt readiness pointer is not a regular file: ${L.pointer}`);
  const pointer = JSON.parse(fs.readFileSync(pointerPath, "utf8"));
  const url = pointer?.index_url;
  const name = typeof url === "string" && url.startsWith(URL_DIR) ? url.slice(URL_DIR.length) : null;
  if (pointer?.schema !== POINTER_SCHEMA || !name || (name !== L.legacy && !L.versioned.test(name))) {
    throw new Error(`mill receipt readiness pointer ${L.pointer} is malformed or names a file outside the versioned set`);
  }
  const current = readStamped(L.dir, name);
  if (pointer.index_sha256 !== current.sha256 || pointer.content_sha256 !== current.content_sha256 ||
      pointer.count !== current.doc.counts?.receipts) {
    throw new Error(`mill receipt readiness pointer ${L.pointer} disagrees with the bytes of ${name}`);
  }
  return current;
}

export function pointerDocument(current, versions) {
  const ref = (v) => ({ index_url: URL_DIR + v.name, index_sha256: v.sha256, ots_url: `${URL_DIR}${v.name}.ots`,
    content_sha256: v.content_sha256, count: v.doc.counts?.receipts ?? null, as_of: v.doc.as_of ?? null });
  return {
    schema: POINTER_SCHEMA,
    kind: "DISCOVERY_POINTER_ONLY",
    as_of: current.doc.as_of ?? null,
    index_url: URL_DIR + current.name,
    index_sha256: current.sha256,
    content_sha256: current.content_sha256,
    count: current.doc.counts?.receipts ?? null,
    ots_url: `${URL_DIR}${current.name}.ots`,
    versions: versions.map(ref),
    scope: "This unsigned pointer selects the stamped mill receipt readiness file whose content equals what scripts/build-mill-receipt-readiness.mjs derives from the signed mill cards on this commit. " +
      "Every listed file is immutable and has its own OpenTimestamps proof; earlier versions stay published as history and are not current. " +
      "A proof file's existence is not a Bitcoin anchor: read its verified state. Outer signature validity, declared lifecycle and regulatory linkage stay separate states, as the file's truth_rule says.",
  };
}

function writePointer(out, current) {
  const L = layout(out);
  const p = path.join(L.dir, L.pointer);
  assertNotStamped(p);
  const encoded = JSON.stringify(pointerDocument(current, stampedVersions(out)), null, 2) + "\n";
  if (fs.existsSync(p) && fs.readFileSync(p, "utf8") === encoded) return false;
  const temp = `${p}.tmp`;
  assertNotStamped(temp);
  fs.writeFileSync(temp, encoded, { flag: "wx" });
  fs.renameSync(temp, p);
  return true;
}

/**
 * Default (build/check) mode. Writes nothing. Passes while the current stamped readiness has the
 * derived content, and throws when it does not, or when nothing stamped exists at all.
 */
export function checkCurrent(out, document) {
  const current = resolveCurrent(out);
  if (current === null) {
    throw new Error(`no stamped mill receipt readiness exists at ${path.basename(out)}; run \`${VERSION_RECIPE}\``);
  }
  if (!sameContent(current.doc, document)) {
    throw new Error(`mill receipt readiness is stale: stamped ${current.name} differs from what the signed cards derive; ` +
      `run \`${VERSION_RECIPE}\` to write a new versioned file, its OTS proof and the derived manifest (stamped bytes are never edited)`);
  }
  return { state: "PRESERVED_STAMPED", file: current.name, count: current.doc.counts?.receipts ?? null };
}

/**
 * --version mode. Changed content gets a new immutable file and a fresh proof; the pointer moves.
 * `stamp(path)` must create `${path}.ots` committing to the file's bytes; on any failure the new
 * file is removed and nothing else has been written.
 */
export function writeVersioned(out, document, { stamp, now = new Date() } = {}) {
  const L = layout(out);
  const current = resolveCurrent(out);
  if (current !== null && sameContent(current.doc, document)) {
    const moved = fs.existsSync(path.join(L.dir, L.pointer)) ? false : writePointer(out, current);
    return { state: moved ? "POINTER_WRITTEN" : "UNCHANGED", file: current.name, count: current.doc.counts?.receipts ?? null };
  }
  const existing = stampedVersions(out).find((v) => sameContent(v.doc, document));
  if (existing) {
    writePointer(out, existing);
    return { state: "REPOINTED", file: existing.name, count: existing.doc.counts?.receipts ?? null };
  }
  if (typeof stamp !== "function") throw new Error("a new mill receipt readiness version needs a stamper; none was given");
  const asOf = now.toISOString();
  const digest = contentDigest(document);
  const name = `${L.stem}-${asOf.slice(0, 10)}-${digest.slice(0, 12)}.json`;
  const p = path.join(L.dir, name);
  assertNotStamped(p);
  const doc = { ...contentOf(document), as_of: asOf, content_sha256: digest,
    supersedes: current === null ? null : { index_url: URL_DIR + current.name, index_sha256: current.sha256 } };
  fs.mkdirSync(L.dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(doc, null, 2) + "\n", { flag: "wx" });
  try {
    stamp(p);
    readStamped(L.dir, name);
  } catch (error) {
    for (const f of [p, `${p}.ots`]) { try { fs.unlinkSync(f); } catch { /* absent */ } }
    throw new Error(`stamping ${name} failed, nothing was released: ${error.message}`);
  }
  writePointer(out, readStamped(L.dir, name));
  return { state: "VERSIONED", file: name, count: document.counts?.receipts ?? null };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2); const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const out = path.resolve(opt("--out", DEFAULT_OUT));
  const document = await deriveReadiness();
  const c = document.counts;
  if (args.includes("--version")) {
    const result = writeVersioned(out, document, { stamp: pythonStamper });
    console.log(`mill receipt readiness: ${result.state}; current stamped file ${path.relative(repo, path.join(path.dirname(out), result.file))}`);
    if (result.state === "VERSIONED") console.log("mill receipt readiness: new proof written; now run: python3 scripts/ots_manifest_rebuild.py --apply && node scripts/llms-txt.mjs");
  } else {
    const result = checkCurrent(out, document);
    console.log(`mill receipt readiness PASS (${result.state} ${result.file}): ${c.outer_signature_valid}/36 outer VALID; ${c.declared_signed}/36 lifecycle SIGNED; ${c.regulatory_linked} linked; ${c.regulatory_unlinked} unlinked`);
  }
}
