#!/usr/bin/env node
/**
 * claim-maintenance-wave.mjs — re-read every captured claim and record what happened to it.
 *
 * WHY
 * ---
 * The `claim-maintenance` board slot is DECLARED-UNMEASURED with the bench "pending gated
 * re-read wave (>=30 claims)". This is that wave: it re-reads the source of every captured
 * claim, recomputes the visible-text digest with the SPEC's own extractor, and records the
 * outcome. It is a dated observation, not a judgement about whether a claim is true.
 *
 * THE GRADER IS NOT RE-IMPLEMENTED
 * -------------------------------
 * The visible-text rule is the estate's own (`csoai-visible-text/2`, the extractor in
 * scripts/claim-capture.mjs, which is the published reference implementation of
 * https://councilof.ai/spec/claim-maintenance/v0.2/). It is IMPORTED here. Re-implementing
 * the rule would make this wave a different measurement from the captures it compares to.
 *
 * WHAT IT CAN AND CANNOT SETTLE
 * ------------------------------
 * Four outcomes are decidable from the evidence:
 *   UNCHANGED     the visible-text digest is the same as at capture
 *   CHANGED       the page's visible text changed (the claim's own text may or may not have)
 *   WITHDRAWN     the claim's verbatim text is no longer served at the source
 *   UNREACHABLE   the source could not be fetched at all
 *
 * The fifth outcome in the slot's wording — "changed with disclosure" versus "changed
 * silently" — is NOT decided here, and this script does not guess. The published Claim
 * Maintenance spec v0.2 defines disclosure at the ARTIFACT level (§10.3, a `conflicts` array)
 * and does not define a rule for whether a SOURCE disclosed its own edit. A wave that
 * asserted that split would be inventing the method the slot is waiting for. Those claims are
 * recorded as CHANGED_DISCLOSURE_NOT_DECIDABLE, with the reason, and the slot stays honest.
 *
 *   node scripts/measurements/claim-maintenance-wave.mjs --out public/interop/claim-maintenance-wave-2026-10-28.json
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { extractVisibleText, CURRENT_EXTRACTOR, SPEC_URL } from "../claim-capture.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const UA = "csoai-claim-maintenance-wave/0.1 (+https://councilof.ai; measurement, not scraping)";
const MIN_VALID = 30;          // the slot's own threshold: n_valid >= 30
const TIMEOUT_MS = 20000;
const CONCURRENCY = 6;

const sha256hex = (data) => createHash("sha256").update(data).digest("hex");
const norm = (s) => String(s || "").toLowerCase().split(/\s+/).join(" ").trim();

function loadClaims() {
  const dir = path.join(ROOT, "public/claims");
  const claims = [];
  const registers = [];
  for (const name of readdirSync(dir).sort()) {
    if (!/^claimreg-.*\.json$/.test(name)) continue;   // not the .signed.json copies
    if (name.includes(".signed.")) continue;
    const raw = readFileSync(path.join(dir, name));
    let doc;
    try { doc = JSON.parse(raw); } catch { continue; }
    const list = doc.claims || [];
    if (!list.length) continue;
    registers.push({ file: name, sha256: sha256hex(raw), claims: list.length });
    for (const c of list) claims.push({ ...c, register: name });
  }
  return { claims, registers };
}

async function reread(claim) {
  const stored = claim?.source_content_hash?.value || null;
  const base = {
    claim_id: claim.claim_id || null,
    subject: claim.subject?.name || null,
    identifier: claim.subject?.identifier || null,
    source_url: claim.source_url || null,
    captured_at: claim.access_date || null,
    captured_digest: stored,
    claim_verbatim_sha256: claim.claim_hash || null,
  };
  if (!claim.source_url) return { ...base, outcome: "UNREACHABLE", reason: "the capture recorded no source url" };
  let html = null;
  let reason = null;
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    const res = await fetch(claim.source_url, { headers: { "user-agent": UA, accept: "text/html,*/*" }, signal: ctl.signal, redirect: "follow" });
    clearTimeout(timer);
    if (!res.ok) { reason = `HTTP ${res.status}`; }
    else { html = await res.text(); }
  } catch (err) {
    reason = String(err?.name === "AbortError" ? "timeout" : (err?.message || err)).slice(0, 120);
  }
  if (html === null) return { ...base, outcome: "UNREACHABLE", reason };
  const text = extractVisibleText(html);
  const digest = sha256hex(text);
  const served = norm(claim.claim_verbatim).length > 0 && norm(text).includes(norm(claim.claim_verbatim));
  if (stored && digest === stored) return { ...base, outcome: "UNCHANGED", reread_digest: digest, reread_chars: text.length };
  if (!served) return { ...base, outcome: "WITHDRAWN", reread_digest: digest, reread_chars: text.length };
  return {
    ...base, outcome: "CHANGED", reread_digest: digest, reread_chars: text.length,
    disclosure: "NOT_DECIDABLE_BY_THIS_METHOD",
    disclosure_reason: "the published Claim Maintenance spec v0.2 defines disclosure at the artifact level "
      + "(§10.3) and defines no rule for whether a SOURCE disclosed its own edit; asserting the split here would "
      + "invent the method the slot is waiting for",
  };
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
}

async function main(argv) {
  const arg = (k, d) => {
    const i = argv.indexOf("--" + k);
    return i > 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d;
  };
  const out = arg("out", path.join(ROOT, "public/interop/claim-maintenance-wave.json"));
  const at = arg("at", new Date().toISOString().replace(/\.\d+Z$/, "Z"));

  const { claims, registers } = loadClaims();
  if (!claims.length) {
    console.error("no captured claims found under public/claims/");
    return 2;
  }
  console.error(`re-reading ${claims.length} claim(s) from ${registers.length} register(s)…`);
  const rows = await mapLimit(claims, CONCURRENCY, reread);

  const outcomes = {};
  for (const r of rows) outcomes[r.outcome] = (outcomes[r.outcome] || 0) + 1;
  const nValid = rows.filter((r) => r.outcome !== "UNREACHABLE").length;

  const doc = {
    schema: "csoai.claim-maintenance.wave/0.1",
    observed_at: at,
    method: {
      specification: SPEC_URL,
      extractor: CURRENT_EXTRACTOR,
      extractor_source: "scripts/claim-capture.mjs (the published reference implementation), imported, not re-implemented",
      what_this_is: "A dated re-read of every captured claim, recording what happened to the source: whether its "
        + "visible text is unchanged, changed, withdrawn, or unreachable.",
    },
    what_this_does_not_establish: [
      "Whether any claim is true. A re-read says what was served today, not what is correct.",
      "Whether a change was disclosed. The published spec defines disclosure at the artifact level and not for a "
        + "source's own edit, so those claims are recorded as CHANGED_DISCLOSURE_NOT_DECIDABLE rather than guessed.",
      "A ranking, a grade, or a verdict on any subject.",
    ],
    thresholds: { min_valid: MIN_VALID, n_valid: nValid, meets_threshold: nValid >= MIN_VALID },
    counts: { claims: claims.length, registers: registers.length, ...outcomes },
    registers,
    rows,
  };
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(doc, null, 2) + "\n");
  console.error(`wrote ${out}`);
  console.log(JSON.stringify({ out, n_valid: nValid, meets_threshold: nValid >= MIN_VALID, ...outcomes }, null, 1));
  return 0;
}

process.exit(await main(process.argv));
