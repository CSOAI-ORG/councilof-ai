#!/usr/bin/env node
/**
 * facts-gate.mjs — fail any build whose PRERENDERED output contradicts facts.json.
 *
 * Scans dist/client (the layer a reader actually sees), NOT source.
 * Source-linting this produced 219 false positives historically.
 *
 *   node scripts/facts-gate.mjs dist/client
 *   node scripts/facts-gate.mjs --selftest
 *
 * Exit 0 = clean. Exit 1 = contradiction found. Exit 2 = gate could not run.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const FACTS_PATH =
  process.env.FACTS_JSON || join(__dirname, "..", "client", "src", "data", "facts.json");

// ---------------------------------------------------------------- text extract
const STRIP_BLOCKS = /<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi;
const STRIP_TAGS = /<[^>]+>/g;

function textOf(html) {
  let t = html.replace(STRIP_BLOCKS, " ").replace(STRIP_TAGS, " ");
  t = t
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…");
  return t.replace(/\s+/g, " ").trim();
}

// Non-HTML text assets (llms.txt, feed.xml, api json) are scanned raw-ish.
function contentOf(file, raw) {
  return /\.(html?)$/i.test(file) ? textOf(raw) : raw.replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------- negation
// A match is exonerated if it sits inside a negation. Two shapes matter:
//   BEFORE: "we do not certify", "not a certification body", "never accredit"
//   AFTER : "we certify nothing", "we accredit no one"
const NEG_BEFORE =
  /\b(?:not|never|no|nor|without|non-|don'?t|doesn'?t|do not|does not|did not|cannot|can'?t|won'?t|isn'?t|aren'?t|refuses? to|neither)\b[^.;!?]{0,60}$/i;
const NEG_AFTER = /^\s*(?:nothing|no one|nobody|none|no\b)/i;

function isNegated(text, start, end) {
  const before = text.slice(Math.max(0, start - 90), start);
  const after = text.slice(end, Math.min(text.length, end + 30));
  return NEG_BEFORE.test(before) || NEG_AFTER.test(after);
}

// Quoting/prohibition context: "do not invent 22 axes", "do not say X".
const PROHIBITION =
  /\b(?:do not|don'?t|never|avoid|forbidden|must not|no longer|stop)\b[^.;!?]{0,80}$/i;

function isProhibition(text, start) {
  return PROHIBITION.test(text.slice(Math.max(0, start - 100), start));
}

function ctx(text, start, end, pad = 120) {
  return text.slice(Math.max(0, start - pad), Math.min(text.length, end + pad)).trim();
}

// ---------------------------------------------------------------- rules
function ruleBoundary(facts, file, text, add) {
  const forbidden = facts.boundary?.forbidden_self_description || [];
  for (const phrase of forbidden) {
    const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    let m;
    while ((m = re.exec(text))) {
      if (isNegated(text, m.index, re.lastIndex)) continue;
      if (isProhibition(text, m.index)) continue;
      add({
        rule: "boundary",
        file,
        text: m[0],
        why:
          `Forbidden boundary phrase used as self-description. facts.json boundary doctrine: ` +
          `"We do NOT certify, accredit, enforce, endorse, or tokenize." ` +
          `Negation forms are allowed; this occurrence is not negated.`,
        ctx: ctx(text, m.index, re.lastIndex),
      });
    }
  }
}

// Group 2 captures the qualifier so the rule can tell a BOARD-TOTAL claim
// ("22 axes") from a MEASURED-COUNT claim ("15 measured axes"). They are different
// assertions about different numbers and must be checked against different values;
// comparing "15 measured axes" against the board total of 22 flags an honest
// sentence. Measured/quotable-qualified counts are delegated to
// ruleMeasuredOverclaim, which compares them against totals.measured_axes.
const COUNT_RE =
  /\b(\d{1,3})\s+(canonical\s+|public\s+|measured\s+|quotable\s+)?(axes|axis|slots)\b/gi;

// ---------------------------------------------------------------- unsigned interop scoping
// Unsigned run artifacts in /interop/ are a DIFFERENT INSTRUMENT from the public board.
// They measure subsets of axes on specific populations (e.g. 4 financial axes on 6 issuers)
// and legitimately report their own counts. Comparing "4 axes" in an UNSIGNED run against
// the board total of 22 is a category error: the run is not claiming to be the board.
//
// A file is scoped (exempt from board-count comparison) when BOTH conditions hold:
//   1. It lives under interop/ (the machine-readable export directory)
//   2. It carries explicit unsigned markers: "signed": false OR "status": "UNSIGNED"
//      OR board_write contains "NOT WRITTEN"
//
// Signed interop files ARE compared against the board: a signed artifact has passed
// review and should not contradict the board's totals without explanation.
const UNSIGNED_MARKERS = [
  /"signed"\s*:\s*false/,
  /"status"\s*:\s*"UNSIGNED"/i,
  /board_write[^}]*NOT WRITTEN/i,
];

function isUnsignedInteropFile(file, rawContent) {
  if (!file.startsWith("interop/") && !file.includes("/interop/")) return false;
  return UNSIGNED_MARKERS.some((re) => re.test(rawContent));
}

// A published correction QUOTES the number it is correcting. Exonerate that.
// Widened 2026-08-26: coverage-register.json carries a field explaining "This field
// previously read '… 14 axes …'", and the gate flagged it for quoting the very text it
// retired. A gate that punishes a page for documenting its own correction pushes authors
// to delete the audit trail to get green — the opposite of the doctrine it enforces.
// Corrections are published, never silently edited, so the wording of a correction must
// itself be safe to publish.
const CORRECTION_CTX =
  /\bC-\d{4}-\d{4}-\d{2}\b|\bcorrections? ledger\b|\bwe published a correction\b|\bcount-gating canon\b|\bpreviously read\b|\bgrammar_correction\b|\bsupersed(?:ed|es)\b|\bwas accurate while\b|\bretired\b/i;

// "1 of 4 axes resolved", "the other 10 axes are ties" — breakdowns of a whole,
// not an assertion of the board total.
const BREAKDOWN_BEFORE = /\b(?:\d+\s+of|the other|remaining|only|another)\s+$/i;

// "13 axis signals", "5 axis lens" — the noun is qualified; not a board count.
const QUALIFIED_AFTER = /^\s*(?:signals?|lens|families|groups?|pairs?)\b/i;

function ruleAxisCount(facts, file, text, add, liveCount, rawContent = "") {
  if (liveCount == null) return;

  // Unsigned interop files are scoped to their own instrument and not compared
  // against the board total. See facts.json counts.unsigned_interop_scoping.
  if (isUnsignedInteropFile(file, rawContent || text)) return;

  const ns = facts.counts?.namespaces || {};
  // Surfaces that legitimately carry their own instrument's count.
  //
  // A namespace may declare `surface` (one path) or `surfaces` (a list). Only
  // `surface` was read until 2026-08-26, and the arena namespace had no `surface`
  // key at all — which is the entire mechanical reason 27 arena-derived counts were
  // flagged as contradicting the GSPC board. They never contradicted it: the arena
  // measures a different set of axes. Supporting a list, and a trailing "/*" prefix
  // form for a route family such as the 26 /gspc/:axis pages, lets a multi-surface
  // instrument declare itself honestly instead of being silenced case by case.
  const scopedExact = new Set();
  const scopedPrefix = [];
  const declare = (s) => {
    if (typeof s !== "string" || !s) return;
    const clean = s.replace(/^\//, "");
    if (clean.endsWith("/*")) scopedPrefix.push(clean.slice(0, -2));
    else scopedExact.add(clean);
  };
  for (const v of Object.values(ns)) {
    if (!v) continue;
    declare(v.surface);
    if (Array.isArray(v.surfaces)) v.surfaces.forEach(declare);
  }

  let m;
  while ((m = COUNT_RE.exec(text))) {
    const n = Number(m[1]);
    if (n === liveCount) continue;
    // A measured/quotable-qualified count is a claim about the MEASURED count, not
    // the board total. ruleMeasuredOverclaim owns it.
    if (/^(?:measured|quotable)\s*$/i.test(m[2] || "")) continue;
    if (isProhibition(text, m.index)) continue; // "do not invent 22 axes"
    if (isNegated(text, m.index, COUNT_RE.lastIndex)) continue;

    // "Art-5 axis", "slot-15 axis" — hyphenated article/slot reference, not a count.
    if (text[m.index - 1] === "-") continue;

    const before = text.slice(Math.max(0, m.index - 40), m.index);
    if (BREAKDOWN_BEFORE.test(before)) continue;
    if (QUALIFIED_AFTER.test(text.slice(COUNT_RE.lastIndex))) continue;

    // A published correction quotes the wrong number on purpose.
    if (CORRECTION_CTX.test(ctx(text, m.index, COUNT_RE.lastIndex, 300))) continue;

    // The board legitimately describes itself as "13 canonical axes ... + jail" —
    // a measurement stamp recording that 13 axes were measured on one date and jail
    // on another. That sums to the GSPC FAMILY count (14), not to the whole board.
    // This was written as `liveCount - 1` when the board was 14 axes and the two
    // happened to coincide; once the board became 22 the arithmetic broke and a true
    // historical stamp started being flagged. Compare against the family count that
    // the stamp is actually a breakdown of.
    const familyCount = facts.counts?.axis_count?.gspc_family_axes;
    const window = ctx(text, m.index, COUNT_RE.lastIndex, 160).toLowerCase();
    if (/\bjail\b/.test(window) && typeof familyCount === "number" && n === familyCount - 1) continue;

    // A route renders to "<route>/index.html", so the base of /gspc-gap-map is
    // "gspc-gap-map/index" — which endsWith("gspc-gap-map") is FALSE. Every
    // directory-index route therefore escaped its own namespace's exoneration,
    // including eunomia and gspc-gap-map, which had declared a surface and were
    // being flagged anyway. Strip the trailing "/index" before matching.
    const base = file
      .replace(/\.html?$/, "")
      .replace(/__/g, "/")
      .replace(/\/index$/, "");
    if ([...scopedExact].some((s) => base === s || base.endsWith("/" + s))) continue;
    // A prefix entry ("gspc/*") exonerates every route beneath it. Anchored on a
    // path separator so "gspc/openness" matches but "gspc-scoreboard" does not —
    // a bare startsWith would quietly swallow neighbouring routes.
    if (scopedPrefix.some((p) => base === p || base.includes(p + "/"))) continue;

    add({
      rule: "axis-count",
      file,
      text: m[0],
      why:
        `Hardcoded count "${m[0]}" disagrees with the live board ` +
        `(${facts.counts.axis_count.endpoint} -> ${facts.counts.axis_count.field} = ${liveCount}). ` +
        `facts.json: counts are a POINTER, never a typed integer.`,
      ctx: ctx(text, m.index, COUNT_RE.lastIndex),
    });
  }
}

// ---------------------------------------------------------------- measured-overclaim
// THE FAILURE MODE THE 22-AXIS SWEEP CREATED, and the reason this rule exists.
//
// ruleAxisCount only compares against the SLOT count. A sentence like "N measured
// axes" passes that check whenever N equals the slot total, even when fewer slots
// actually carry a run — historically the estate's single most damaging class of
// claim, because a published slot is not a measurement. Owner lock 22·15·7: seven
// slots remain empty. The rule reads the live MEASURED count and fails any surface
// asserting that MORE axes are measured than actually are. An axis-count rule
// cannot catch that, because the error is in the word "measured", not in the number.
const MEASURED_RE = /\b(\d{1,3})\s+(?:of\s+\d{1,3}\s+)?measured\s+(?:axes|axis|slots)\b/gi;
const ALL_MEASURED_RE = /\ball\s+(\d{1,3})\s+(?:axes|axis|slots)\s+(?:are|were|have\s+been)\s+measured\b/gi;

function ruleMeasuredOverclaim(facts, file, text, add, liveMeasured) {
  if (liveMeasured == null) return;
  for (const re of [MEASURED_RE, ALL_MEASURED_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      const n = Number(m[1]);
      if (n <= liveMeasured) continue; // claiming fewer or exactly as many is safe
      if (isProhibition(text, m.index)) continue;
      if (isNegated(text, m.index, re.lastIndex)) continue;
      if (CORRECTION_CTX.test(ctx(text, m.index, re.lastIndex, 300))) continue;
      add({
        rule: "measured-overclaim",
        file,
        text: m[0],
        why:
          `"${m[0]}" claims ${n} measured axes, but the live board reports only ${liveMeasured} ` +
          `measured (${facts.counts.axis_count.endpoint} -> totals.measured_axes). The board's axis ` +
          `count and its measured count are DIFFERENT NUMBERS: a published slot is not a measurement. ` +
          `Quote totals.public_count, which carries both.`,
        ctx: ctx(text, m.index, re.lastIndex),
      });
    }
  }
}

// Present-tense assertions that a planned/devnet rail is already live.
const LIVE_TENSE = [
  "is live",
  "are live",
  "we anchor",
  "anchored on",
  "anchored to",
  "we mint",
  "we issue",
  "issued on",
  "minted on",
  "now live",
  "in production",
  "goes through",
  "runs on",
  "published to",
  "we publish to",
  "attested on",
];

const RAIL_TERMS = {
  eas: /\bEAS\b|Ethereum Attestation Service/i,
  erc3643_onchainid: /ERC[-\s]?3643|ONCHAINID|trusted[-\s]issuer/i,
  xrpl_mainnet_carrier: /\bmainnet\b/i,
  xrpl_devnet_carrier: /\bXRPL\b|\bXRP Ledger\b/i,
  index_product: /\bindex product\b/i,
  data_business: /\bdata business\b/i,
  rating_the_raters: /rating[-\s]the[-\s]raters/i,
};

function ruleCapabilityTense(facts, file, text, add) {
  const rails = (facts.rails || []).filter(
    (r) => r.status === "planned" || r.status === "devnet"
  );
  for (const rail of rails) {
    const term = RAIL_TERMS[rail.id];
    if (!term) continue;
    const re = new RegExp(term.source, "gi");
    let m;
    while ((m = re.exec(text))) {
      const start = m.index;
      const end = re.lastIndex;
      const window = ctx(text, start, end, 130);
      const lower = window.toLowerCase();

      // Exonerate: the copy already labels the honest status.
      if (/\bunmeasured\b|\bdevnet\b|\bplanned\b|\bnot yet\b|\bwill\b|\bwould\b|\bonce\b|\bcoming\b|\brefuses? to mint\b|\bnot attested\b|\bnot located\b/i.test(window)) {
        continue;
      }
      // devnet rail: only "mainnet/production" framing is a violation.
      if (rail.status === "devnet" && !/\bmainnet\b|\bproduction\b/i.test(lower)) continue;

      if (!LIVE_TENSE.some((p) => lower.includes(p))) continue;

      add({
        rule: "capability-tense",
        file,
        text: m[0],
        why:
          `"${rail.claim}" has status "${rail.status}" in facts.json but is described in ` +
          `present tense as live here. ${rail.note ? rail.note : ""}`.trim(),
        ctx: window,
      });
    }
  }
}

// ---------------------------------------------------------------- driver
function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(html?|txt|xml|json)$/i.test(e)) out.push(p);
  }
  return out;
}

// The gate compares surface counts NUMERICALLY, so it must read the numeric field.
// facts.json declares two: `field` (totals.public_count) is the SENTENCE a surface
// quotes and is a string; `numeric_field` (totals.axes) is the integer to compare.
// Reading `field` here would compare a number against "22 axes · 15 measured" and
// silently never match. Until 2026-08-26 this read totals.axes while facts.json
// declared public_count as the authority — a latent mismatch masked only because
// both yielded 14. The field to read is now resolved from the declaration.
function pick(obj, path) {
  return String(path || "").split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
}

async function liveAxisCount(facts) {
  const ac = facts.counts?.axis_count;
  const ep = ac?.endpoint;
  const numericPath = ac?.numeric_field || "totals.axes";
  if (!ep || process.env.FACTS_GATE_OFFLINE === "1") {
    return ac?.observed?.axes ?? null;
  }
  try {
    const res = await fetch(ep, { signal: AbortSignal.timeout(20000) });
    const j = await res.json();
    const n = pick(j, numericPath);
    if (typeof n === "number") return n;
    console.warn(
      `facts-gate: ${ep} -> ${numericPath} is ${typeof n}, not a number; ` +
        `falling back to the recorded observation. Check facts.json numeric_field.`
    );
  } catch {
    console.warn(
      `facts-gate: could not reach ${ep}; falling back to recorded observation (non-binding).`
    );
  }
  return facts.counts?.axis_count?.observed?.axes ?? null;
}

async function liveMeasuredCount(facts) {
  const ac = facts.counts?.axis_count;
  const ep = ac?.endpoint;
  const path = ac?.measured_numeric_field || "totals.measured_axes";
  if (!ep || process.env.FACTS_GATE_OFFLINE === "1") return ac?.observed?.measured_axes ?? null;
  try {
    const res = await fetch(ep, { signal: AbortSignal.timeout(20000) });
    const n = pick(await res.json(), path);
    if (typeof n === "number") return n;
  } catch {
    console.warn(`facts-gate: could not reach ${ep} for the measured count; using the recorded observation.`);
  }
  return ac?.observed?.measured_axes ?? null;
}

function runRules(facts, files, rootDir, liveCount, liveMeasured) {
  const violations = [];
  const add = (v) => violations.push(v);
  for (const f of files) {
    const rel = relative(rootDir, f);
    const raw = readFileSync(f, "utf8");
    const text = contentOf(f, raw);
    ruleBoundary(facts, rel, text, add);
    ruleAxisCount(facts, rel, text, add, liveCount, raw);
    ruleMeasuredOverclaim(facts, rel, text, add, liveMeasured);
    ruleCapabilityTense(facts, rel, text, add);
  }
  return violations;
}

function report(violations) {
  if (!violations.length) return;
  const byRule = {};
  for (const v of violations) (byRule[v.rule] ||= []).push(v);
  for (const [rule, vs] of Object.entries(byRule)) {
    console.error(`\n${"=".repeat(72)}\n${rule}: ${vs.length} violation(s)\n${"=".repeat(72)}`);
    for (const v of vs) {
      console.error(`\n  FILE : ${v.file}`);
      console.error(`  TEXT : ${v.text}`);
      console.error(`  WHY  : ${v.why}`);
      console.error(`  CTX  : …${v.ctx}…`);
    }
  }
}

// ---------------------------------------------------------------- selftest
// Selftest cases: [name, html, shouldFail] OR [name, html, shouldFail, filePath]
// When filePath is provided, the test simulates a file at that path with the given content.
// This allows testing file-path-based scoping rules (e.g. unsigned interop files).
const SELFTEST_CASES = [
  // [name, html, shouldFail]
  ["negation: we do not certify", "<p>We measure. We do not certify, accredit or approve anything.</p>", false],
  ["negation: not a certification body", "<p>We are a measurement body, not a certification body.</p>", false],
  ["negation-by-object: we certify nothing", "<p>Training records — it attests training, not conformity; we certify nothing.</p>", false],
  ["negation: Measurement, not certification", "<p>Measurement, not certification.</p>", false],
  ["VIOLATION: we certify", "<p>We certify that this model meets the standard.</p>", true],
  ["VIOLATION: our certification", "<p>Ask about our certification programme for vendors.</p>", true],
  ["VIOLATION: accredited by us", "<p>Labs accredited by us receive a badge.</p>", true],
  // ── the 22-axis canon (ADR-001) + owner lock 22·15·7 after #1074 ───────────────
  // These cases were first written when the board was 14 axes and "22" was a number
  // nobody was allowed to say, then when the board was "22 axes · 15 measured"
  // and "22 MEASURED" was the forbidden overclaim. Fill-7 briefly claimed 22/22;
  // owner lock restores 15 measured · 7 empty. Empty cells stay empty. The
  // overclaim rule catches any claim of MORE measured axes than liveMeasured (15).
  ["prohibition form still passes", "<p>Cite live totals.public_count — do not invent 22 axes.</p>", false],
  ["22 axes is now the canon and matches the live board", "<p>The board carries 22 axes across both families.</p>", false],
  ["stale count: the pre-sweep 14", "<p>The board measures 14 axes across the fleet.</p>", true],
  ["board self-description: 13 canonical axes + jail (a GSPC-family stamp)", "<p>Measured on 2026-08-12 (13 canonical axes) · 2026-08-18 (jail).</p>", false],
  ["honest swept grammar", "<p>22 axes · 15 measured — seven slots remain empty. Empty cells stay empty.</p>", false],
  ["22 measured is an overclaim while 7 are empty", "<p>The board publishes 22 measured axes.</p>", true],
  ["all 22 axes are measured is an overclaim", "<p>All 22 axes are measured and signed.</p>", true],
  ["VIOLATION: 30 measured axes (more than the board carries)", "<p>The board publishes 30 measured axes.</p>", true],
  ["exact measured count passes", "<p>The board carries 15 measured axes today.</p>", false],
  ["VIOLATION: EAS asserted live", "<p>Every attestation is anchored on EAS today.</p>", true],
  ["honest EAS label", "<p>EVM · EAS BlackRock BUIDL 0x7712c3420573… UNMEASURED</p>", false],
  ["VIOLATION: ERC-3643 asserted live", "<p>We issue ERC-3643 credentials; issuance runs on the trusted-issuer bridge.</p>", true],
  ["VIOLATION: XRPL mainnet carrier", "<p>Our attestations are published to XRPL mainnet in production.</p>", true],
  ["honest XRPL devnet", "<p>Network: XRPL DEVNET · evidence card 82994353b8f94337…</p>", false],
  // ── unsigned interop scoping (#841 regression) ────────────────────────────────
  // An unsigned run artifact in /interop/ is a DIFFERENT INSTRUMENT from the board.
  // It legitimately says "4 axes" when measuring 4 axes on its own population.
  // Comparing that against the board total of 22 is a category error.
  // This case reproduces the #841 failure: financial-4axis-unsigned.json said
  // "These 4 axes remain UNMEASURED" and the gate flagged it as 4 ≠ 22.
  [
    "unsigned interop file: 4 axes is scoped (reproduces #841)",
    '{"signed": false, "status": "UNSIGNED", "board_write": "NOT WRITTEN. These 4 axes remain UNMEASURED."}',
    false,
    "interop/test-unsigned-run.json",
  ],
];

async function selftest(facts) {
  const liveCount = facts.counts?.axis_count?.observed?.axes ?? 14;
  const liveMeasured = facts.counts?.axis_count?.observed?.measured_axes ?? null;
  let pass = 0;
  let fail = 0;
  console.log(`facts-gate --selftest  (live axis count = ${liveCount})\n`);
  for (const testCase of SELFTEST_CASES) {
    const [name, html, shouldFail, filePath] = testCase;
    const file = filePath || "selftest";
    const violations = [];
    const add = (v) => violations.push(v);
    const text = textOf(html);
    ruleBoundary(facts, file, text, add);
    ruleAxisCount(facts, file, text, add, liveCount, html);
    ruleMeasuredOverclaim(facts, file, text, add, liveMeasured);
    ruleCapabilityTense(facts, file, text, add);
    const didFail = violations.length > 0;
    const ok = didFail === shouldFail;
    if (ok) pass++;
    else fail++;
    const verdict = shouldFail ? "must CATCH " : "must PASS  ";
    console.log(
      `  ${ok ? "ok  " : "FAIL"}  ${verdict} ${name}` +
        (ok ? "" : `  -> got ${didFail ? "CAUGHT" : "passed"}`)
    );
    if (!ok && didFail) console.log(`         ${violations[0].rule}: ${violations[0].text}`);
  }
  console.log(`\n  ${pass} passed, ${fail} failed`);
  if (fail) {
    console.error("\nfacts-gate SELFTEST FAILED — the gate does not behave as specified.");
    process.exit(1);
  }
  console.log("\nfacts-gate selftest OK — the gate provably catches violations AND passes negations.");
}

// ---------------------------------------------------------------- main
const args = process.argv.slice(2);

if (!existsSync(FACTS_PATH)) {
  console.error(`facts-gate: cannot find facts.json at ${FACTS_PATH}`);
  process.exit(2);
}
const facts = JSON.parse(readFileSync(FACTS_PATH, "utf8"));

if (args.includes("--selftest")) {
  await selftest(facts);
  process.exit(0);
}

const root = args[0];
if (!root || !existsSync(root)) {
  console.error("usage: node scripts/facts-gate.mjs <dist/client> | --selftest");
  process.exit(2);
}

const liveCount = await liveAxisCount(facts);
const liveMeasured = await liveMeasuredCount(facts);
const files = walk(root);
console.log(`facts-gate: scanning ${files.length} prerendered files in ${root} (live axis count = ${liveCount})`);

const violations = runRules(facts, files, root, liveCount, liveMeasured);
report(violations);

if (violations.length) {
  console.error(`\nfacts-gate FAILED: ${violations.length} contradiction(s) against facts.json.`);
  process.exit(1);
}
console.log("facts-gate OK: no claim contradicts facts.json.");
