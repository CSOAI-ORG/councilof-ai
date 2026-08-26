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

const COUNT_RE =
  /\b(\d{1,3})\s+(?:canonical\s+|public\s+|measured\s+|quotable\s+)?(axes|axis|slots)\b/gi;

// A published correction QUOTES the number it is correcting. Exonerate that.
const CORRECTION_CTX =
  /\bC-\d{4}-\d{4}-\d{2}\b|\bcorrections? ledger\b|\bwe published a correction\b|\bcount-gating canon\b/i;

// "1 of 4 axes resolved", "the other 10 axes are ties" — breakdowns of a whole,
// not an assertion of the board total.
const BREAKDOWN_BEFORE = /\b(?:\d+\s+of|the other|remaining|only|another)\s+$/i;

// "13 axis signals", "5 axis lens" — the noun is qualified; not a board count.
const QUALIFIED_AFTER = /^\s*(?:signals?|lens|families|groups?|pairs?)\b/i;

function ruleAxisCount(facts, file, text, add, liveCount) {
  if (liveCount == null) return;
  const ns = facts.counts?.namespaces || {};
  // Surfaces that legitimately carry their own instrument's count.
  const scoped = new Set();
  for (const v of Object.values(ns)) if (v && v.surface) scoped.add(v.surface.replace(/^\//, ""));

  let m;
  while ((m = COUNT_RE.exec(text))) {
    const n = Number(m[1]);
    if (n === liveCount) continue;
    if (isProhibition(text, m.index)) continue; // "do not invent 22 axes"
    if (isNegated(text, m.index, COUNT_RE.lastIndex)) continue;

    // "Art-5 axis", "slot-15 axis" — hyphenated article/slot reference, not a count.
    if (text[m.index - 1] === "-") continue;

    const before = text.slice(Math.max(0, m.index - 40), m.index);
    if (BREAKDOWN_BEFORE.test(before)) continue;
    if (QUALIFIED_AFTER.test(text.slice(COUNT_RE.lastIndex))) continue;

    // A published correction quotes the wrong number on purpose.
    if (CORRECTION_CTX.test(ctx(text, m.index, COUNT_RE.lastIndex, 300))) continue;

    // The board legitimately describes itself as "13 canonical axes ... + jail".
    const window = ctx(text, m.index, COUNT_RE.lastIndex, 160).toLowerCase();
    if (/\bjail\b/.test(window) && n === liveCount - 1) continue;

    const base = file.replace(/\.html?$/, "").replace(/__/g, "/");
    if ([...scoped].some((s) => base.endsWith(s))) continue;

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

async function liveAxisCount(facts) {
  const ep = facts.counts?.axis_count?.endpoint;
  if (!ep || process.env.FACTS_GATE_OFFLINE === "1") {
    return facts.counts?.axis_count?.observed?.axes ?? null;
  }
  try {
    const res = await fetch(ep, { signal: AbortSignal.timeout(20000) });
    const j = await res.json();
    const n = j?.totals?.axes;
    if (typeof n === "number") return n;
  } catch {
    console.warn(
      `facts-gate: could not reach ${ep}; falling back to recorded observation (non-binding).`
    );
  }
  return facts.counts?.axis_count?.observed?.axes ?? null;
}

function runRules(facts, files, rootDir, liveCount) {
  const violations = [];
  const add = (v) => violations.push(v);
  for (const f of files) {
    const rel = relative(rootDir, f);
    const raw = readFileSync(f, "utf8");
    const text = contentOf(f, raw);
    ruleBoundary(facts, rel, text, add);
    ruleAxisCount(facts, rel, text, add, liveCount);
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
const SELFTEST_CASES = [
  // [name, html, shouldFail]
  ["negation: we do not certify", "<p>We measure. We do not certify, accredit or approve anything.</p>", false],
  ["negation: not a certification body", "<p>We are a measurement body, not a certification body.</p>", false],
  ["negation-by-object: we certify nothing", "<p>Training records — it attests training, not conformity; we certify nothing.</p>", false],
  ["negation: Measurement, not certification", "<p>Measurement, not certification.</p>", false],
  ["VIOLATION: we certify", "<p>We certify that this model meets the standard.</p>", true],
  ["VIOLATION: our certification", "<p>Ask about our certification programme for vendors.</p>", true],
  ["VIOLATION: accredited by us", "<p>Labs accredited by us receive a badge.</p>", true],
  ["prohibition: do not invent 22 axes", "<p>Cite live totals.public_count — do not invent 22 axes.</p>", false],
  ["VIOLATION: hardcoded 22 axes", "<p>The board measures 22 axes across the fleet.</p>", true],
  ["board self-description: 13 canonical axes + jail", "<p>Measured on 2026-08-12 (13 canonical axes) · 2026-08-18 (jail).</p>", false],
  ["VIOLATION: EAS asserted live", "<p>Every attestation is anchored on EAS today.</p>", true],
  ["honest EAS label", "<p>EVM · EAS BlackRock BUIDL 0x7712c3420573… UNMEASURED</p>", false],
  ["VIOLATION: ERC-3643 asserted live", "<p>We issue ERC-3643 credentials; issuance runs on the trusted-issuer bridge.</p>", true],
  ["VIOLATION: XRPL mainnet carrier", "<p>Our attestations are published to XRPL mainnet in production.</p>", true],
  ["honest XRPL devnet", "<p>Network: XRPL DEVNET · evidence card 82994353b8f94337…</p>", false],
];

async function selftest(facts) {
  const liveCount = facts.counts?.axis_count?.observed?.axes ?? 14;
  let pass = 0;
  let fail = 0;
  console.log(`facts-gate --selftest  (live axis count = ${liveCount})\n`);
  for (const [name, html, shouldFail] of SELFTEST_CASES) {
    const violations = [];
    const add = (v) => violations.push(v);
    const text = textOf(html);
    ruleBoundary(facts, "selftest", text, add);
    ruleAxisCount(facts, "selftest", text, add, liveCount);
    ruleCapabilityTense(facts, "selftest", text, add);
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
const files = walk(root);
console.log(`facts-gate: scanning ${files.length} prerendered files in ${root} (live axis count = ${liveCount})`);

const violations = runRules(facts, files, root, liveCount);
report(violations);

if (violations.length) {
  console.error(`\nfacts-gate FAILED: ${violations.length} contradiction(s) against facts.json.`);
  process.exit(1);
}
console.log("facts-gate OK: no claim contradicts facts.json.");
