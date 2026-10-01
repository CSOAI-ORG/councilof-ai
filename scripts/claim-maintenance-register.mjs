#!/usr/bin/env node
/**
 * claim-maintenance-register.mjs — the register of every subject we maintain claims on.
 *
 * Specification §7.5: the register MUST be GENERATED FROM THE REGISTRY FILES THAT EXIST, never
 * hand-listed, and it MUST carry an `as_of`. That is the whole design constraint. A hand-listed
 * register drifts from the registries the moment either changes, and the drift always runs in
 * the flattering direction — a subject that was going to be maintained stays listed after the
 * work stops.
 *
 * So this reads public/claims/*.json off disk and counts what is there. It does not pad, it does
 * not project, and where a pre-specification registry does not carry a field this register needs
 * — a per-claim read schedule, say — it records the absence rather than inventing a date.
 *
 *   node scripts/claim-maintenance-register.mjs            # write the register
 *   node scripts/claim-maintenance-register.mjs --check    # CI: committed register must match disk
 *
 * The register is published at:
 *   https://councilof.ai/spec/claim-maintenance/register.json   (static bytes)
 *   https://councilof.ai/api/claims/register                    (same bytes, via functions/api/claims/register.ts)
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLAIMS_DIR = join(ROOT, "public/claims");
const OUT = join(ROOT, "public/spec/claim-maintenance/register.json");
const CHECK = process.argv.includes("--check");
const BASE = "https://councilof.ai";
const STATES = ["CLAIM_CAPTURED", "CLAIM_MEASURED", "UNMEASURED", "UNCHECKABLE"];
/** Every published artifact schema. A v0.1 artifact stays conforming to v0.1 forever (spec 12). */
const ARTIFACT_SCHEMAS = new Set(["csoai.claim-maintenance.artifact/0.1", "csoai.claim-maintenance.artifact/0.2"]);

const canonical = (value) => {
  const walk = (v) => {
    if (v === null || typeof v === "boolean" || typeof v === "string") return JSON.stringify(v);
    if (typeof v === "number") {
      if (!Number.isInteger(v)) throw new Error(`non-integer number ${v} — carry decimals as strings`);
      return String(v);
    }
    if (Array.isArray(v)) return "[" + v.map(walk).join(",") + "]";
    const keys = Object.keys(v).filter((k) => v[k] !== undefined).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + walk(v[k])).join(",") + "}";
  };
  return Buffer.from(walk(value), "utf8");
};
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

/** A UTC date-time, or null. Never a guess: an invented schedule is worse than an admitted gap. */
const iso = (v) => {
  if (typeof v !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(v)) return v.replace(/\.\d+Z$/, "Z");
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00Z`;
  return null;
};

/**
 * Both registry shapes are read, because the estate holds one of each and this register must
 * count what exists rather than what it would prefer to find:
 *   · `subjects: { key: { source, claims: [...] } }` — the pre-specification registry shape.
 *   · `claims: [ artifact, … ]` — artifacts conforming to csoai.claim-maintenance.artifact/0.1 or /0.2.
 */
function readRegistry(file) {
  const raw = readFileSync(join(CLAIMS_DIR, file), "utf8");
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (err) {
    return { file, error: `unparseable JSON: ${err.message}`, subjects: [] };
  }
  const registry_url = `${BASE}/claims/${file}`;
  const otsPresent = existsSync(join(CLAIMS_DIR, file + ".ots"));
  const created = iso(doc.created_utc || doc.created || doc.as_of);
  const subjects = [];

  const tally = (claims) => {
    const states = Object.fromEntries(STATES.map((s) => [s, 0]));
    let unknown = 0;
    let conforming = 0;
    const reads = [];
    const firsts = [];
    const nexts = [];
    for (const c of claims) {
      const st = c?.state;
      if (STATES.includes(st)) states[st] += 1;
      else unknown += 1;
      if (ARTIFACT_SCHEMAS.has(c?.schema)) conforming += 1;
      const a = iso(c?.access_date);
      if (a) reads.push(a);
      const f = iso(c?.first_captured_utc);
      if (f) firsts.push(f);
      const n = iso(c?.next_read_utc);
      if (n) nexts.push(n);
    }
    return { states, unknown, conforming, reads, firsts, nexts };
  };

  if (doc.subjects && typeof doc.subjects === "object" && !Array.isArray(doc.subjects)) {
    for (const [key, s] of Object.entries(doc.subjects)) {
      const claims = Array.isArray(s?.claims) ? s.claims : [];
      const t = tally(claims);
      subjects.push({ key, name: s?.name || key, source: s?.source ?? null, claims, ...t });
    }
  } else if (Array.isArray(doc.claims)) {
    const grouped = new Map();
    for (const c of doc.claims) {
      const key = c?.subject?.identifier || c?.subject?.name || "unattributed";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(c);
    }
    for (const [key, claims] of grouped) {
      const t = tally(claims);
      subjects.push({
        key,
        name: claims[0]?.subject?.name || key,
        identifier: claims[0]?.subject?.identifier ?? null,
        identifier_kind: claims[0]?.subject?.identifier_kind ?? null,
        source: claims[0]?.source_url ?? null,
        claims,
        ...t,
      });
    }
  }
  return {
    file,
    registry_url,
    registry_id: doc.registry_id || file.replace(/\.json$/, ""),
    schema: doc.schema ?? null,
    created,
    otsPresent,
    subjects,
    // Quoted, never restated. The registry's own words are carried in a field whose NAME says
    // they are a quotation, so this register never asserts the source's vocabulary as its own —
    // and `signed` below is derived here rather than trusted from that sentence.
    signature_state_verbatim: doc.signature_state ?? null,
    supersedes: doc.supersedes ?? null,
    ...signatureOf(file, raw, doc),
  };
}


/**
 * Is this registry signed, and over WHICH bytes? A registry may carry the signature inside it, or
 * — as the rev2 registry does — in a sidecar that pins the registry by sha256. A sidecar is only
 * a signature of this file if the digest it pins is the digest this file actually has, so that is
 * checked rather than assumed: an unchecked claim about bytes is the failure this lane exists to
 * stop, and reading "signed" off a prose field would have reported a signed registry as unsigned.
 */
function signatureOf(file, raw, doc) {
  const inline = Boolean(doc.sig || doc.sig_ed25519 || doc.signature);
  if (inline) return { signed: true, signature_binding: "inline" };
  const sidecarFile = file.replace(/\.json$/, ".signed.json");
  const sidecarPath = join(CLAIMS_DIR, sidecarFile);
  if (!existsSync(sidecarPath)) return { signed: false, signature_binding: "none" };
  let sidecar;
  try {
    sidecar = JSON.parse(readFileSync(sidecarPath, "utf8"));
  } catch {
    return { signed: false, signature_binding: "sidecar_unparseable", signature_sidecar_url: `${BASE}/claims/${sidecarFile}` };
  }
  const pinned = sidecar?.payload?.artifact?.sha256 ?? null;
  const actual = sha256(Buffer.from(raw, "utf8"));
  const ok = Boolean(pinned) && pinned === actual;
  return {
    signed: ok,
    signature_binding: "sidecar",
    signature_sidecar_url: `${BASE}/claims/${sidecarFile}`,
    sidecar_pins_sha256: pinned,
    file_sha256_read_here: actual,
    sidecar_pin_verified: ok,
    ...(ok
      ? {}
      : {
          sidecar_pin_note:
            "The sidecar does not pin the bytes of this file as read here. That is recorded, not resolved: " +
            "a signature over other bytes is not a signature over these.",
        }),
  };
}

const files = existsSync(CLAIMS_DIR)
  ? readdirSync(CLAIMS_DIR).filter((f) => f.endsWith(".json")).sort()
  : [];

const all = files.map(readRegistry);
// A directory of .json files is not a set of registries. public/claims/ also holds signed-run
// envelopes (csoai.signed-run/0.1) that carry a payload, not subjects; counting those as
// registries inflates totals.registries with files that hold no claims. Only a document that
// declares a claim-registry schema, or that carries an artifact array, is a registry here.
const isRegistry = (r) =>
  /^csoai\.claim-registry\//.test(String(r.schema || "")) || r.subjects.length > 0;
const registries = all.filter(isRegistry);
const nonRegistryFiles = all.filter((r) => !isRegistry(r)).map((r) => ({ file: r.file, schema: r.schema }));

// SUPERSESSION. A revision declares `supersedes: { registry_id, file, sha256 }` and the prior
// file stays on disk, unedited, served at its own URL — which is right, and which means a naive
// read of the directory counts the same subject twice and reports a population nobody maintains.
// The superseded registry is therefore resolved out of the live totals and reported separately,
// and the recorded sha256 is CHECKED against the bytes on disk: a supersession is a claim about
// specific bytes, and an unchecked claim about bytes is the thing this whole lane exists to stop.
const supersededIds = new Map();
for (const r of registries) {
  const sup = r.supersedes;
  if (!sup) continue;
  const id = sup.registry_id || (sup.file || "").split("/").pop()?.replace(/\.json$/, "");
  if (id) supersededIds.set(id, { by: r.registry_id, declared_sha256: sup.sha256 ?? null });
}
for (const r of registries) {
  const hit = supersededIds.get(r.registry_id);
  if (!hit) continue;
  r.superseded_by = hit.by;
  const actual = sha256(readFileSync(join(CLAIMS_DIR, r.file)));
  r.supersession_sha256_matches = hit.declared_sha256 ? actual === hit.declared_sha256 : null;
  r.file_sha256 = actual;
}
const live = registries.filter((r) => !r.superseded_by);
const superseded = registries.filter((r) => r.superseded_by);
// A full UTC instant, not a date. Two registers generated on the same day from different
// registries would otherwise both claim the same as_of, and an archived snapshot could not be
// told apart from the live document it no longer matches — one label over two byte-sets is the
// defect this whole lane is about.
const asOf = new Date().toISOString().replace(/\.\d+Z$/, "Z");

const subjectRows = [];
for (const r of live) {
  for (const s of r.subjects) {
    const min = (a) => (a.length ? a.slice().sort()[0] : null);
    const max = (a) => (a.length ? a.slice().sort().slice(-1)[0] : null);
    subjectRows.push({
      subject: s.name,
      subject_key: s.key,
      identifier: s.identifier ?? s.key,
      identifier_kind: s.identifier_kind ?? "other",
      source: s.source,
      claim_count: s.claims.length,
      states: s.states,
      // A pre-specification registry carries no per-claim read schedule. Recorded as absent —
      // never filled in with today's date, which would assert a read that did not happen.
      first_captured: min(s.firsts) || r.created,
      first_captured_basis: s.firsts.length ? "artifact.first_captured_utc" : "registry.created_utc",
      last_read: max(s.reads) || r.created,
      last_read_basis: s.reads.length ? "artifact.access_date" : "registry.created_utc",
      next_scheduled_read: min(s.nexts),
      // A named date that is already before this register's as_of is not "SCHEDULED" — the
      // weekly pod loop that owned those reads was retired 2026-09-28 and the dates passed
      // without a completed run. DUE_NOT_RUN is the same word the one scheduler uses
      // (scripts/claims/maintenance_due.py). This field is derived from (next, as_of) only;
      // run outcomes stay in the checks ledger, never inferred here.
      next_scheduled_read_state: !s.nexts.length
        ? "UNSCHEDULED"
        : min(s.nexts) < asOf
          ? "DUE_NOT_RUN"
          : "SCHEDULED",
      registry_id: r.registry_id,
      registry_url: r.registry_url,
      registry_schema: r.schema,
      timestamp_receipt: r.otsPresent ? `${r.registry_url}.ots` : null,
      // "submitted" is not "anchored" (spec 8.1). The register reports that a receipt file
      // exists; it does NOT report that anything is anchored, because that word is reserved for
      // an upgraded receipt whose attestation path has been verified.
      timestamp_state: r.otsPresent ? "RECEIPT_PRESENT_UPGRADE_UNVERIFIED" : "NONE",
      conforming_artifacts: s.conforming,
      claims_without_a_specification_state: s.unknown,
    });
  }
}
subjectRows.sort((a, b) => (a.subject < b.subject ? -1 : a.subject > b.subject ? 1 : 0));

const totals = {
  registries: live.length,
  registry_files_on_disk: registries.length,
  registries_superseded: superseded.length,
  subjects: subjectRows.length,
  claims: subjectRows.reduce((n, s) => n + s.claim_count, 0),
  by_state: Object.fromEntries(
    STATES.map((st) => [st, subjectRows.reduce((n, s) => n + (s.states[st] || 0), 0)]),
  ),
  claims_conforming_to_artifact_schema: subjectRows.reduce((n, s) => n + s.conforming_artifacts, 0),
  subjects_with_a_scheduled_next_read: subjectRows.filter((s) => s.next_scheduled_read_state === "SCHEDULED").length,
  subjects_with_a_due_unrun_next_read: subjectRows.filter((s) => s.next_scheduled_read_state === "DUE_NOT_RUN").length,
};

/**
 * Disclosures are computed, not written. This one exists because a source registry describes an
 * OpenTimestamps receipt as "OTS-anchored" while the receipt has not been upgraded and verified —
 * exactly the submitted/anchored confusion the specification reserves the word against (§8). The
 * source bytes are not edited (they may be signed, and signed bytes are superseded, never edited);
 * the register quotes them and records the distinction beside the quotation.
 */
// Computed over EVERY registry the register prints, live or superseded: if these bytes carry
// the word, these bytes carry the disclosure. Scoping this to live registries only would print
// a superseded registry's "OTS-anchored" wording with nothing beside it.
const disclosures = registries
  .filter((r) => /anchor/i.test(String(r.signature_state_verbatim || "")))
  .map((r) => ({
    kind: "vocabulary",
    registry_id: r.registry_id,
    registry_status: r.superseded_by ? "SUPERSEDED" : "LIVE",
    quoted: r.signature_state_verbatim,
    disclosure:
      "That sentence is the source registry's own wording, quoted. This register does not confirm " +
      "anchoring for it: a receipt file is SUBMITTED until its upgrade has been run and its attestation " +
      "path verified. The receipt's state here is RECEIPT_PRESENT_UPGRADE_UNVERIFIED (spec 8.1-8.3).",
  }));

const register = {
  schema: "csoai.claim-maintenance.register/0.1",
  title: "Claim maintenance register — the subjects Council of AI maintains public claims on",
  as_of: asOf,
  specification: `${BASE}/spec/claim-maintenance/v0.2/`,
  specification_licence: "CC0-1.0",
  maintainer: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
  generated_by: "scripts/claim-maintenance-register.mjs — generated from the registry files on disk, never hand-listed (spec 7.5)",
  what_this_is:
    "The continuous, independent observation of public claims these organisations make about themselves: " +
    "captured verbatim with source and date, hashed, re-read on a schedule, every observed change recorded, " +
    "and measured only where public evidence can settle it.",
  what_this_is_not: [
    "not fact-checking — no verdict is reached about any claim",
    "not certification — no mark, badge or grade arises from any state here",
    "not auditing — no engagement, no non-public records, no opinion",
    "not reputation scoring — no score, rank or index may be derived from these counts",
    "not adversarial journalism — no theory of anyone's intent is held or implied",
  ],
  non_allegation:
    "No entry in this register states or implies that any claim is false, misleading or dishonest, and none may be read that way. " +
    "Presence here means only that a public page is being read on a schedule. A listing is not an endorsement and it is not an accusation.",
  states: {
    CLAIM_CAPTURED: "read from its public source, recorded verbatim, hashed, dated, scheduled. Nothing measured.",
    CLAIM_MEASURED: "a measurement against public evidence exists beside the claim, with its window, denominator, method and result. Not a verdict.",
    UNMEASURED: "in scope and settleable in principle; no measurement has been run. A first-class state.",
    UNCHECKABLE: "no public evidence can settle it. A statement about the evidence, never about the subject.",
  },
  selection_criteria:
    "Subjects are selected where a public claim is (a) specific enough to capture verbatim and (b) about infrastructure " +
    "a third party relies on. Selection is published because a selection rule is the one place an agenda can hide (spec 10.3).",
  right_of_reply:
    "A defect in any record here is a defect in this register. Report it to nicholas@csoai.org; corrections are published at " +
    `${BASE}/api/corrections.`,
  totals,
  disclosures,
  subjects: subjectRows,
  non_registry_files_in_claims_dir: nonRegistryFiles,
  registries: registries.map((r) => ({
    status: r.superseded_by ? "SUPERSEDED" : "LIVE",
    ...(r.superseded_by
      ? {
          superseded_by: r.superseded_by,
          file_sha256: r.file_sha256,
          supersession_sha256_matches: r.supersession_sha256_matches,
        }
      : {}),
    registry_id: r.registry_id,
    url: r.registry_url,
    schema: r.schema,
    created: r.created,
    signature_state_verbatim: r.signature_state_verbatim,
    signed: r.signed,
    signature_binding: r.signature_binding,
    ...(r.signature_sidecar_url ? { signature_sidecar_url: r.signature_sidecar_url } : {}),
    ...(r.sidecar_pin_verified === undefined ? {} : { sidecar_pin_verified: r.sidecar_pin_verified }),
    ...(r.sidecar_pin_note ? { sidecar_pin_note: r.sidecar_pin_note } : {}),
    subjects: r.subjects.length,
    claims: r.subjects.reduce((n, s) => n + s.claims.length, 0),
    ...(r.error ? { error: r.error } : {}),
  })),
  does_not_prove: [
    "that any claim listed here is false — this register makes no such statement about anyone",
    "that a claim in CLAIM_CAPTURED or UNMEASURED has been checked; it has not",
    "that the subjects here are the only organisations making claims worth observing — this is what we maintain, not a survey",
    "that a superseded registry was wrong; it was replaced, its bytes are unchanged, and it is still served at its own URL",
    "that a timestamp receipt is anchored in a block; a receipt file is submitted, not confirmed, until its upgrade is verified",
  ],
};
register.register_digest = sha256(canonical(register));

const body = JSON.stringify(register, null, 2) + "\n";
const existing = existsSync(OUT) ? readFileSync(OUT, "utf8") : null;

if (CHECK) {
  // as_of moves every day by design, so a byte comparison would be red every morning. Compare
  // the part that is supposed to be stable: everything the registries on disk determine.
  const strip = (s) => {
    const o = JSON.parse(s);
    delete o.as_of;
    delete o.register_digest;
    return canonical(o).toString("utf8");
  };
  if (!existing) {
    console.error(`[register] MISSING: ${OUT.replace(ROOT + "/", "")} — run: node scripts/claim-maintenance-register.mjs`);
    process.exit(1);
  }
  if (strip(existing) !== strip(body)) {
    console.error(
      `[register] DRIFT: the committed register does not match the registries on disk. ` +
        `Run: node scripts/claim-maintenance-register.mjs`,
    );
    process.exit(1);
  }
  console.log(
    `[register] OK — ${totals.subjects} subject(s), ${totals.claims} claim(s), ` +
      `${totals.registries} live registry file(s) (${totals.registries_superseded} superseded)`,
  );
} else {
  writeFileSync(OUT, body);
  console.log(
    `[register] wrote ${OUT.replace(ROOT + "/", "")} — ${totals.subjects} subject(s), ${totals.claims} claim(s) ` +
      `(${STATES.map((s) => `${s} ${totals.by_state[s]}`).join(", ")}) across ${totals.registries} live registry ` +
      `file(s), ${totals.registries_superseded} superseded, as_of ${asOf}`,
  );
}
