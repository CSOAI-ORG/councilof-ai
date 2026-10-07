#!/usr/bin/env node
/** The regulatory evidence inventory, versioned instead of edited.
 *
 * STAMPED BYTES ARE NEVER REWRITTEN. public/interop/regulatory-inventory.json has carried a sibling
 * OpenTimestamps proof since #2816, so its bytes are frozen as the historical snapshot. Its
 * crosswalk_assets pin the in-toto statements by path (public/interop/crosswalk/intoto/<axis>-<id16>
 * .intoto.json), and that path changes whenever scripts/crosswalk/emit_intoto.py moves an axis's
 * pick. Until 7 Oct 2026 nothing could record such a move without breaking the stamp, so mill PR
 * #2888 could not pass both the producer manifest and build:client. This is the migration #2865
 * (hub-cards index) and #2868 (mill receipt readiness) made:
 *
 *   --version   Derive the inventory from the current stamped one with its DERIVED_MEASUREMENT_STATEMENT
 *               rows re-read from the in-toto index (one row per axis statement). When that differs
 *               from the current stamped content, write a NEW immutable file,
 *               regulatory-inventory-<YYYY-MM-DD>-<content12>.json (create-only; <content12> is the
 *               first 12 hex of sha256 over the canonical content), stamp it with the estate's OTS
 *               primitive, move the unsigned discovery pointer regulatory-inventory-latest.json, and
 *               regenerate functions/api/_regulatory_inventory.ts, the build-time binding through
 *               which /api/counters imports the selected bytes. Unchanged content writes nothing; a
 *               failed stamp releases nothing. `--from <file.json>` takes a reviewed hand edit
 *               (an adapter added, a count corrected) as the base instead of the current version.
 *   (default)   Also `--check`, and what scripts/regulatory-inventory-gate.mjs runs inside
 *               build:client. Writes nothing. Resolves the pointer, checks its sha256 against the
 *               bytes and that the proof commits to those bytes, checks the binding module names the
 *               same file and digest, and fails closed with the full recipe when the in-toto index
 *               no longer matches the current stamped inventory.
 *
 * Every write goes through assertNotStamped: a path with a sibling .ots is refused in every mode.
 * Consumers read the pointer (or the binding module generated from it). Earlier versions and their
 * proofs stay published as history.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { assertNotStamped, otsSubjectDigest, pythonStamper } from "./surface/build-hub-cards-index.mjs";

export { assertNotStamped };
export const SCHEMA = "csoai.regulatory-inventory/0.1";
export const POINTER_SCHEMA = "csoai.regulatory-inventory-pointer/1";
const URL_DIR = "/interop/";
const REPO_DIR = "public/interop/";
export const DERIVED_TYPE = "DERIVED_MEASUREMENT_STATEMENT";
const INTOTO_DIR = "public/interop/crosswalk/intoto/";
/** A new version adds a proof: the OTS manifest is derived from proofs, and llms.txt quotes the manifest. */
export const VERSION_RECIPE =
  "python3 scripts/crosswalk/emit_intoto.py && node scripts/build-regulatory-inventory.mjs --version && " +
  "python3 scripts/ots_manifest_rebuild.py --apply && node scripts/llms-txt.mjs";
/** Version metadata is not content: two files with the same content are the same inventory. */
const VERSION_META = ["versioned_at", "content_sha256", "supersedes"];

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const DEFAULT_OUT = path.join(repo, "public/interop/regulatory-inventory.json");
export const DEFAULT_INTOTO_INDEX = path.join(repo, INTOTO_DIR, "index.json");
export const DEFAULT_BINDING = path.join(repo, "functions/api/_regulatory_inventory.ts");

const sha = (value) => createHash("sha256").update(value).digest("hex");

function canonicalDeep(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalDeep).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalDeep(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
}

export const contentOf = (doc) => Object.fromEntries(Object.entries(doc ?? {}).filter(([k]) => !VERSION_META.includes(k)));
export const contentDigest = (doc) => sha(canonicalDeep(contentOf(doc)));
const sameContent = (a, b) => canonicalDeep(contentOf(a)) === canonicalDeep(contentOf(b));

// ── derivation: only the in-toto rows move; every other field is carried from the base ────────

/** The DERIVED_MEASUREMENT_STATEMENT rows the in-toto index implies: one per statement, axis order. */
export function derivedRows(intotoIndex) {
  const statements = intotoIndex?.statements;
  if (!Array.isArray(statements) || statements.length === 0) throw new Error("in-toto index has no statements");
  return [...statements]
    .sort((a, b) => String(a.axis).localeCompare(String(b.axis)))
    .map((s) => {
      if (typeof s?.axis !== "string" || typeof s?.file !== "string" || s.file.includes("/")) {
        throw new Error(`in-toto index statement is malformed: ${JSON.stringify(s).slice(0, 120)}`);
      }
      return { id: `intoto-${s.axis}`, path: `${INTOTO_DIR}${s.file}`, asset_type: DERIVED_TYPE, evidence_state: "MEASURED_SOURCE_DERIVATION" };
    });
}

/**
 * The inventory a base implies under the current in-toto index. The derived rows replace the base's
 * derived rows at the position of the first one; counts.crosswalk_assets follows the array. Nothing
 * else is touched, so a hand-maintained field can only change through a reviewed `--from` edit.
 */
export function deriveInventory(base, intotoIndex) {
  if (base?.schema !== SCHEMA || !Array.isArray(base.crosswalk_assets)) throw new Error("base is not a csoai.regulatory-inventory document");
  const rows = derivedRows(intotoIndex);
  const assets = base.crosswalk_assets;
  const first = assets.findIndex((row) => row.asset_type === DERIVED_TYPE);
  const others = assets.filter((row) => row.asset_type !== DERIVED_TYPE);
  const at = first < 0 ? 0 : first; // every row before the first derived row is a non-derived row
  const crosswalk_assets = [...others.slice(0, at), ...rows, ...others.slice(at)];
  const doc = contentOf(base);
  return { ...doc, counts: { ...doc.counts, crosswalk_assets: crosswalk_assets.length }, crosswalk_assets };
}

// ── stamped versions ──────────────────────────────────────────────────────────────────────────

const isRegular = (p) => fs.existsSync(p) && fs.lstatSync(p).isFile() && !fs.lstatSync(p).isSymbolicLink();

/** File layout derived from the legacy path: <stem>.json, <stem>-latest.json, <stem>-<date>-<hex12>.json. */
export function layout(out) {
  const dir = path.dirname(out), file = path.basename(out);
  if (!file.endsWith(".json")) throw new Error(`inventory path must end in .json: ${out}`);
  const stem = file.slice(0, -".json".length);
  const esc = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { dir, legacy: file, pointer: `${stem}-latest.json`, stem,
    versioned: new RegExp(`^${esc}-(\\d{4}-\\d{2}-\\d{2})-([0-9a-f]{12})\\.json$`) };
}

/** Read one stamped inventory and prove its proof commits to its exact bytes. Throws otherwise. */
export function readStamped(dir, name) {
  const p = path.join(dir, name), proof = `${p}.ots`;
  if (!isRegular(p) || !isRegular(proof)) throw new Error(`stamped regulatory inventory or its proof is missing or not a regular file: ${name}`);
  const raw = fs.readFileSync(p);
  const digest = sha(raw);
  if (otsSubjectDigest(fs.readFileSync(proof)) !== digest) throw new Error(`${name}.ots does not commit to the bytes of ${name}`);
  const doc = JSON.parse(raw.toString("utf8"));
  if (doc?.schema !== SCHEMA || !Array.isArray(doc.crosswalk_assets)) throw new Error(`${name} is not a ${SCHEMA} document`);
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
      throw new Error(`versioned regulatory inventory has no proof (a failed --version run?): ${name} — remove it and re-run`);
    }
    versions.push(readStamped(L.dir, name));
  }
  return versions;
}

/** The version the pointer selects (or the legacy snapshot when no pointer exists), verified. */
export function resolveCurrent(out = DEFAULT_OUT) {
  const L = layout(out);
  const pointerPath = path.join(L.dir, L.pointer);
  if (!fs.existsSync(pointerPath)) return fs.existsSync(path.join(L.dir, `${L.legacy}.ots`)) ? readStamped(L.dir, L.legacy) : null;
  if (!isRegular(pointerPath)) throw new Error(`regulatory inventory pointer is not a regular file: ${L.pointer}`);
  const pointer = JSON.parse(fs.readFileSync(pointerPath, "utf8"));
  const url = pointer?.index_url;
  const name = typeof url === "string" && url.startsWith(URL_DIR) ? url.slice(URL_DIR.length) : null;
  if (pointer?.schema !== POINTER_SCHEMA || !name || (name !== L.legacy && !L.versioned.test(name))) {
    throw new Error(`regulatory inventory pointer ${L.pointer} is malformed or names a file outside the versioned set`);
  }
  const current = readStamped(L.dir, name);
  if (pointer.index_sha256 !== current.sha256 || pointer.content_sha256 !== current.content_sha256 ||
      pointer.crosswalk_assets !== current.doc.crosswalk_assets.length) {
    throw new Error(`regulatory inventory pointer ${L.pointer} disagrees with the bytes of ${name}`);
  }
  return current;
}

export function pointerDocument(current, versions) {
  const ref = (v) => ({ index_url: URL_DIR + v.name, index_sha256: v.sha256, ots_url: `${URL_DIR}${v.name}.ots`,
    content_sha256: v.content_sha256, crosswalk_assets: v.doc.crosswalk_assets.length, versioned_at: v.doc.versioned_at ?? null });
  return {
    schema: POINTER_SCHEMA,
    kind: "DISCOVERY_POINTER_ONLY",
    versioned_at: current.doc.versioned_at ?? null,
    index_url: URL_DIR + current.name,
    index_sha256: current.sha256,
    content_sha256: current.content_sha256,
    crosswalk_assets: current.doc.crosswalk_assets.length,
    ots_url: `${URL_DIR}${current.name}.ots`,
    versions: versions.map(ref),
    scope: "This unsigned pointer selects the stamped regulatory inventory whose derived-statement rows match the in-toto crosswalk index " +
      "(public/interop/crosswalk/intoto/index.json) on this commit; scripts/build-regulatory-inventory.mjs derives it and " +
      "scripts/regulatory-inventory-gate.mjs checks it in every build. Every listed file is immutable and has its own OpenTimestamps proof; " +
      "earlier versions stay published as history and are not current. A proof file's existence is not a Bitcoin anchor: read its verified state. " +
      "The inventory's own truth_boundaries still apply: 25 heterogeneous crosswalk assets are not 25 signed legal crosswalks.",
  };
}

function writeIfChanged(p, encoded) {
  assertNotStamped(p);
  if (fs.existsSync(p) && fs.readFileSync(p, "utf8") === encoded) return false;
  const temp = `${p}.tmp`;
  assertNotStamped(temp);
  fs.writeFileSync(temp, encoded, { flag: "wx" });
  fs.renameSync(temp, p);
  return true;
}

function writePointer(out, current) {
  const L = layout(out);
  return writeIfChanged(path.join(L.dir, L.pointer), JSON.stringify(pointerDocument(current, stampedVersions(out)), null, 2) + "\n");
}

// ── the build-time binding /api/counters imports (a Pages Function cannot import by a computed path) ──

const BINDING_RE = {
  import: /^import inventory from "\.\.\/\.\.\/public\/interop\/([^"]+)";$/m,
  path: /^export const REGULATORY_INVENTORY_PATH = "([^"]+)";$/m,
  sha: /^export const REGULATORY_INVENTORY_SHA256 = "([0-9a-f]{64})";$/m,
};

export function bindingSource(current) {
  return [
    "// GENERATED by scripts/build-regulatory-inventory.mjs --version. Do not edit by hand.",
    "//",
    "// The stamped regulatory inventory that public/interop/regulatory-inventory-latest.json selects.",
    "// A Pages Function cannot import a JSON file by a path read at run time, so the selection is",
    "// bound here at build time. scripts/regulatory-inventory-gate.mjs (inside build:client) fails",
    "// when this module names any file or digest other than the pointer's, and checks that the",
    "// file's OpenTimestamps proof commits to exactly those bytes.",
    `import inventory from "../../public/interop/${current.name}";`,
    "",
    `export const REGULATORY_INVENTORY_PATH = "${REPO_DIR}${current.name}";`,
    `export const REGULATORY_INVENTORY_SHA256 = "${current.sha256}";`,
    `export const REGULATORY_INVENTORY_POINTER = "${REPO_DIR}regulatory-inventory-latest.json";`,
    "export default inventory;",
    "",
  ].join("\n");
}

/** Throws unless the binding module imports, names and digests exactly the current stamped file. */
export function checkBinding(current, bindingPath = DEFAULT_BINDING) {
  if (!fs.existsSync(bindingPath)) throw new Error(`${path.basename(bindingPath)} is missing; run \`node scripts/build-regulatory-inventory.mjs --version\``);
  const text = fs.readFileSync(bindingPath, "utf8");
  const imported = BINDING_RE.import.exec(text)?.[1];
  const named = BINDING_RE.path.exec(text)?.[1];
  const digest = BINDING_RE.sha.exec(text)?.[1];
  if (imported !== current.name || named !== REPO_DIR + current.name || digest !== current.sha256) {
    throw new Error(`${path.basename(bindingPath)} binds ${imported ?? "nothing"} (${(digest ?? "no digest").slice(0, 12)}), ` +
      `but the pointer selects ${current.name} (${current.sha256.slice(0, 12)}); run \`node scripts/build-regulatory-inventory.mjs --version\``);
  }
  return true;
}

// ── modes ─────────────────────────────────────────────────────────────────────────────────────

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

/**
 * Default (build/check) mode. Writes nothing. Passes while the current stamped inventory already
 * holds what the in-toto index derives and the binding names it; throws otherwise, or when nothing
 * stamped exists at all. Returns the verified current version.
 */
export function checkCurrent(out = DEFAULT_OUT, intotoIndex = readJson(DEFAULT_INTOTO_INDEX), { binding = DEFAULT_BINDING } = {}) {
  const current = resolveCurrent(out);
  if (current === null) throw new Error(`no stamped regulatory inventory exists at ${path.basename(out)}; run \`${VERSION_RECIPE}\``);
  if (!sameContent(current.doc, deriveInventory(current.doc, intotoIndex))) {
    throw new Error(`regulatory inventory is stale: stamped ${current.name} pins in-toto statements the crosswalk index no longer lists; ` +
      `run \`${VERSION_RECIPE}\` to write a new versioned file, its OTS proof and the derived manifest (stamped bytes are never edited)`);
  }
  if (binding !== null) checkBinding(current, binding);
  return current;
}

/**
 * --version mode. Changed content gets a new immutable file and a fresh proof; the pointer and the
 * binding move. `stamp(path)` must create `${path}.ots` committing to the file's bytes; on any
 * failure the new file is removed and nothing else has been written.
 */
export function writeVersioned(out, intotoIndex, { stamp, now = new Date(), base = null, binding = DEFAULT_BINDING } = {}) {
  const L = layout(out);
  const current = resolveCurrent(out);
  const from = base ?? current?.doc;
  if (!from) throw new Error(`no stamped regulatory inventory to derive from at ${path.basename(out)}, and no --from given`);
  const document = deriveInventory(from, intotoIndex);
  const settle = (state, version) => {
    const pointerMoved = writePointer(out, version);
    const bound = binding === null ? false : writeIfChanged(binding, bindingSource(version));
    return { state: state === "UNCHANGED" && (pointerMoved || bound) ? "POINTER_WRITTEN" : state, file: version.name };
  };
  if (current !== null && sameContent(current.doc, document)) return settle("UNCHANGED", current);
  const existing = stampedVersions(out).find((v) => sameContent(v.doc, document));
  if (existing) return settle("REPOINTED", existing);
  if (typeof stamp !== "function") throw new Error("a new regulatory inventory version needs a stamper; none was given");
  const at = now.toISOString();
  const digest = contentDigest(document);
  const name = `${L.stem}-${at.slice(0, 10)}-${digest.slice(0, 12)}.json`;
  const p = path.join(L.dir, name);
  assertNotStamped(p);
  const doc = { ...document, versioned_at: at, content_sha256: digest,
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
  return settle("VERSIONED", readStamped(L.dir, name));
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2); const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const out = path.resolve(opt("--out", DEFAULT_OUT));
  const intotoIndex = readJson(path.resolve(opt("--intoto-index", DEFAULT_INTOTO_INDEX)));
  try {
    if (args.includes("--version")) {
      const fromPath = opt("--from", null);
      const result = writeVersioned(out, intotoIndex, { stamp: pythonStamper, base: fromPath ? readJson(path.resolve(fromPath)) : null });
      console.log(`regulatory inventory: ${result.state}; current stamped file ${path.relative(repo, path.join(path.dirname(out), result.file))}`);
      if (result.state === "VERSIONED") console.log("regulatory inventory: new proof written; now run: python3 scripts/ots_manifest_rebuild.py --apply && node scripts/llms-txt.mjs");
    } else {
      const current = checkCurrent(out, intotoIndex);
      console.log(`regulatory inventory PASS (PRESERVED_STAMPED ${current.name}): ${current.doc.crosswalk_assets.length} crosswalk assets, in-toto rows match the index, binding agrees`);
    }
  } catch (error) {
    console.error(`regulatory inventory: ${error.message}`);
    process.exit(1);
  }
}
