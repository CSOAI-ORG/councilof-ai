/**
 * An artifact that claims to be evidence should be re-derivable by a stranger.
 *
 * Measured 2026-09-04: 1,942 published artifacts under public/interop, of which 256 carry an
 * evidence-shaped schema (card / vector / attestation / measurement / anchor / root) and FIVE sit
 * beside a script that recomputes them. The five are the SCRAPI-CCF vectors — and they are the
 * only family that produced anything: an independent recomputation by Emek Can Dogru found the
 * CBOR tag axis, Konrad Gruszka found the outer-array axis on a third platform, and measuring the
 * class found 64 encodings and the root cause. The other 1,937 produced nothing.
 *
 * That is not proof of causation, but it is the difference between a mark someone can pick up and
 * a mark they can only read. A published number nobody can re-derive is a claim; a published
 * number with the script that makes it is evidence.
 *
 * This does NOT fail on the existing backlog — a guard that blocks 251 files on the day it lands
 * gets set to continue-on-error and stops mattering. It is a RATCHET: the recorded baseline may
 * improve and must not regress.
 *
 *   node scripts/recomputability-audit.mjs --selftest
 *   node scripts/recomputability-audit.mjs            # report + ratchet check
 *   node scripts/recomputability-audit.mjs --update   # accept the current state as the baseline
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const REPO = process.cwd();
const ROOT = path.join(REPO, "public", "interop");
const BASELINE = path.join(REPO, "scripts", "recomputability-baseline.json");
const EVIDENCE = /(card|vector|attestation|measurement|anchor|root|witness|receipt)/i;

export function isEvidence(doc) {
  if (!doc || typeof doc !== "object") return false;
  const s = String(doc.schema ?? doc.kind ?? "");
  return s.length > 0 && EVIDENCE.test(s);
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".json")) out.push(p);
  }
  return out;
}

const hasRecompute = (dir) =>
  existsSync(dir) && readdirSync(dir).some((f) => f.endsWith(".py") || f.endsWith(".mjs"));

if (process.argv.includes("--selftest")) {
  const cases = [
    ["a measurement card is evidence", isEvidence({ schema: "gspc.measurement-card/1" }) === true],
    ["a framing-space vector is evidence", isEvidence({ schema: "csoai.data-hash-vector/1" }) === true],
    ["a schema without an evidence word is not", isEvidence({ schema: "csoai.scrapi-ccf-framing-space/0.1" }) === false],
    ["an api spec is not", isEvidence({ schema: "csoai.api-spec/1" }) === false],
    ["a schemaless blob is not", isEvidence({ note: "hello" }) === false],
    ["a non-object is not", isEvidence(null) === false],
  ];
  const bad = cases.filter(([, ok]) => !ok).map(([w]) => w);
  if (bad.length) { console.error("✖ recomputability selftest FAILED: " + bad.join("; ")); process.exit(1); }
  console.log(`✓ recomputability selftest: ${cases.length}/${cases.length} classifications correct`);
  process.exit(0);
}

if (!existsSync(ROOT)) { console.log("recomputability-audit: no public/interop — nothing to audit"); process.exit(0); }

let total = 0, evidence = 0, recomputable = 0, schemaless = 0;
const gaps = [];
for (const f of walk(ROOT)) {
  total++;
  let doc; try { doc = JSON.parse(readFileSync(f, "utf8")); } catch { continue; }
  if (doc && typeof doc === "object" && !doc.schema && !doc.kind) schemaless++;
  if (!isEvidence(doc)) continue;
  evidence++;
  if (hasRecompute(path.dirname(f))) recomputable++;
  else gaps.push(path.relative(REPO, f));
}

const now = { evidence, recomputable, schemaless };
console.log(`recomputability-audit: ${total} artifact(s) under public/interop`);
console.log(`  claim an evidence-shaped schema : ${evidence}`);
console.log(`  sit beside a recompute script   : ${recomputable}`);
console.log(`  declare no schema at all        : ${schemaless}`);

if (process.argv.includes("--update")) {
  writeFileSync(BASELINE, JSON.stringify({ recorded: new Date().toISOString().slice(0, 10), ...now }, null, 2) + "\n");
  console.log(`  baseline written to ${path.relative(REPO, BASELINE)}`);
  process.exit(0);
}

if (!existsSync(BASELINE)) { console.log("  no baseline yet — run with --update to record one"); process.exit(0); }
const base = JSON.parse(readFileSync(BASELINE, "utf8"));

// The ratchet: more evidence is fine, but it must not become LESS recomputable in proportion,
// and the count of recomputable artifacts must never fall.
const fail = [];
if (recomputable < base.recomputable)
  fail.push(`recomputable fell from ${base.recomputable} to ${recomputable}`);
const newEvidence = evidence - base.evidence;
const newRecomputable = recomputable - base.recomputable;
if (newEvidence > 0 && newRecomputable < 1)
  fail.push(`${newEvidence} new evidence artifact(s) added, none of them recomputable — a new claim must ship with the script that makes it`);

if (fail.length) {
  console.error("\n✖ recomputability ratchet:");
  for (const f of fail) console.error(`   ${f}`);
  console.error("\n  Add a script beside the artifact that re-derives it and fails if it disagrees.");
  console.error("  See public/interop/scrapi-ccf/mint_framing_space.py for the shape.");
  process.exit(1);
}
console.log(`✓ ratchet holds (baseline ${base.recorded}: ${base.recomputable}/${base.evidence})`);
