#!/usr/bin/env node
import {currentCountContent,isFrozenBankSubset,correctedHistoricalContent} from './surface/facts-scope.mjs';
import {verifyBoardReference,boardCounts} from './surface/render-board-reference.mjs';
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

// The corrections ledger page renders ONLY published corrections (prerendered with its entries
// from 2026-09-30): each entry quotes the count it corrected, often more than 300 characters after
// its C-id heading. The whole built page is correction context for the axis-count rule. Exactly this
// one built path; every other rule still runs on it (selftest pins both directions).
const CORRECTIONS_LEDGER_FILE = "corrections/index.html";

// "1 of 4 axes resolved", "the other 10 axes are ties" — breakdowns of a whole,
// not an assertion of the board total.
const BREAKDOWN_BEFORE = /\b(?:\d+\s+of|the other|remaining|only|another)\s+$/i;

// "13 axis signals", "5 axis lens" — the noun is qualified; not a board count.
const QUALIFIED_AFTER = /^\s*(?:signals?|lens|families|groups?|pairs?)\b/i;

// "22 axes measured" — postfix-qualified MEASURED count (the live totals.lid grammar).
// Delegated to ruleMeasuredOverclaim; see the note inside ruleAxisCount.
const MEASURED_POSTFIX_AFTER = /^\s+measured\b/i;

// "3 axes carry an external public leader" — a SUBSET PREDICATE. The sentence says
// how many axes have a property; it does not assert the board's total. Blocked the
// whole deploy pipeline on 2026-09-03, and the sentence lives in
// public/signed/gspc-board.signed.json — signed bytes, which are superseded, never
// edited to satisfy a regex. So the gate learns the shape instead.
//
// Deliberately NARROW. Only transitive verbs that take an object ("carry a leader",
// "report a run") are listed. "have", "has" and "are" are excluded on purpose: they
// would exempt "14 axes have been measured", which is exactly the overclaim the
// measured rule exists to catch and which neither MEASURED_RE (needs "N measured
// axes") nor ALL_MEASURED_RE (needs a leading "all") would catch on its own.
const SUBSET_PREDICATE_AFTER =
  /^\s+(?:carry|carries|hold|holds|report|reports|expose|exposes|include|includes|list|lists)\b/i;

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
    // The POSTFIX form "22 axes measured" is the same claim — it is the grammar of the
    // live board's own derived `totals.lid` ("22 axes measured · 14 model fleets · …"),
    // which every surface is told to quote verbatim. When the board grew to 23 slots
    // (2026-09-16, one declared slot with no run) that verbatim quote was flagged 26
    // times as a wrong SLOT count. It is a measured count; MEASURED_RE (below) parses
    // the postfix form too, so an overclaim in this shape still fails.
    if (MEASURED_POSTFIX_AFTER.test(text.slice(COUNT_RE.lastIndex))) continue;
    if (isProhibition(text, m.index)) continue; // "do not invent 22 axes"
    if (isNegated(text, m.index, COUNT_RE.lastIndex)) continue;

    // "Art-5 axis", "slot-15 axis" — hyphenated article/slot reference, not a count.
    if (text[m.index - 1] === "-") continue;

    const before = text.slice(Math.max(0, m.index - 40), m.index);
    if (BREAKDOWN_BEFORE.test(before)) continue;
    // Matrix dimensions such as "10 models x 14 axes" describe a frozen batch,
    // not the current board's slot count. The model count immediately scopes the
    // following axis count to that batch.
    if (/\b\d+\s+models?\s*[x×]\s*$/i.test(before)) continue;
    // Derived triple 22·22·0 with labels "axes · measured · unmeasured".
    // Prerender concatenates the heading number with the next paragraph, so
    // COUNT_RE sees "0 axes". That 0 is unmeasured_axes, not a board-total claim.
    // A real sentence "The board carries 0 axes." has no N·M· before the digit.
    if (/\d{1,3}[·.]\d{1,3}[·.]\s*$/.test(before)) continue;
    if (QUALIFIED_AFTER.test(text.slice(COUNT_RE.lastIndex))) continue;
    if (isFrozenBankSubset(n,liveCount,text.slice(COUNT_RE.lastIndex))) continue;

    // A subset claim is only a subset if it is SMALLER than the whole. "23 axes
    // carry X" against a 22-axis board is still a contradiction and still fails.
    if (n < liveCount && SUBSET_PREDICATE_AFTER.test(text.slice(COUNT_RE.lastIndex))) continue;
    // ENUMERATED subset (2026-09-29): "Separation on 7 axes (governance, safety, …, care)".
    // The count names its members in the parenthesis that follows, so it is checkable on the
    // spot: exempt only when the list holds exactly n comma-separated names and n is smaller
    // than the board. The sentence is served live by /api/gspc and sits in the signed
    // 2026-09-29 freeze, whose bytes are never edited to satisfy a regex.
    if (n < liveCount) {
      const en = /^\s*\(([^()]{1,400})\)/.exec(text.slice(COUNT_RE.lastIndex));
      if (en && en[1].split(/\s*,\s*|\s+and\s+/).filter(Boolean).length === n) continue;
    }

    // A published correction quotes the wrong number on purpose.
    if (file === CORRECTIONS_LEDGER_FILE) continue;
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
        `Count "${m[0]}" disagrees with the selected board reference ` +
        `(validated totals.axes = ${liveCount}; source and digest are printed above). ` +
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
// claim, because a published slot is not a measurement. The board now carries a run
// on every slot (22 of 22), but the rule stays: it reads the live MEASURED count and
// fails any surface asserting that MORE axes are measured than actually are. An
// axis-count rule cannot catch that, because the error is in the word "measured",
// not in the number.
// Both orders: "22 measured axes" and "22 axes measured" (the live totals.lid grammar).
const MEASURED_RE =
  /\b(\d{1,3})\s+(?:of\s+\d{1,3}\s+)?(?:measured\s+(?:axes|axis|slots)|(?:axes|axis|slots)\s+measured)\b/gi;
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
          `"${m[0]}" claims ${n} measured axes, but the selected board reference reports only ${liveMeasured} ` +
          `measured (validated totals.measured_axes). The board's axis ` +
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

function hasLiveTense(text) {
  return LIVE_TENSE.some((phrase) => {
    const escaped = phrase
      .replace(/[.*+?^$()|[\]\\{}]/g, "\\$&")
      .replace(/\s+/g, "\\s+");
    return new RegExp("\\b" + escaped + "\\b", "i").test(text);
  });
}

const RAIL_TERMS = {
  eas: /\bEAS\b|Ethereum Attestation Service/i,
  erc3643_onchainid: /ERC[-\s]?3643|ONCHAINID|trusted[-\s]issuer/i,
  xrpl_mainnet_carrier: /\bmainnet\b/i,
  xrpl_devnet_carrier: /\bXRPL\b|\bXRP Ledger\b/i,
  index_product: /\bindex product\b/i,
  data_business: /\bdata business\b/i,
  rating_the_raters: /rating[-\s]the[-\s]raters/i,
  // A blanket "anchored to Bitcoin" is the claim to catch. Naming a specific
  // block ("anchored at Bitcoin block 965268") is not in LIVE_TENSE and passes,
  // which is the discipline we want: cite the block or speak in future tense.
  ots_atom_anchor: /OpenTimestamps|\bOTS\b|\bBitcoin\b/i,
};

// ── rail SUBJECT scoping (2026-09-03) ────────────────────────────────────────
// facts.json carries TWO Bitcoin/OTS rails with OPPOSITE statuses:
//   ots_root_anchor   live      "Anchoring the published ROOT to Bitcoin via OpenTimestamps"
//   ots_atom_anchor   planned   "Anchoring every queued ATOM, bridge card and press release"
// RAIL_TERMS matches keywords only (Bitcoin|OTS|OpenTimestamps), and live rails are filtered
// out of the tense rule entirely, so copy about the ROOT — the LIVE rail's subject — was being
// attributed to the PLANNED atom rail and required to speak in future tense.
//
// That blocked every production deploy on 2026-09-03, and drove a lane to rewrite correct
// indicative prose into "would be upgraded" / "would remain": the honesty gate manufacturing
// evasive English about a file whose entire purpose is to say "this is a commitment, not an
// anchor". A gate that forces a true statement to sound false has stopped measuring honesty.
//
// The exemption is deliberately narrow. It lifts ONLY inside the published-root artifacts, and
// ONLY while the surrounding window is not talking about atoms — so "every queued atom is
// anchored to Bitcoin" still fails INSIDE a root file, which is the claim the rail exists for.
const RAIL_SUBJECT_EXEMPT = {
  ots_atom_anchor: {
    files: /^(root\.json|interop\/card-root-[^/]*\.json)$/,
    unless: /\batoms?\b|\bqueued\b|\bpress release\b|\bbridge card\b/i,
  },
};

// ── anchor-count: a CONCEPT rule, not a string match ──────────────────────────
// Two passes of hand-grepping (mine and nicholas-48's) each missed what the other
// caught, because the same claim appears in variant wordings: "the 4-anchor
// machine", "signed, anchored measurement board", "4 anchors". The worst survivor
// was in proofs.councilof.ai's schema.org JSON-LD — the copy crawlers and AI
// assistants quote, so the version most likely to be repeated elsewhere as fact.
//
// A noun-form assertion carries no verb LIVE_TENSE can see, so capability-tense
// could never catch it. This rule reads the number instead: facts.json declares
// how many independent anchors actually exist, and any claim of MORE is flagged
// however it is phrased. Understatement always passes.
function ruleAnchorCount(facts, file, text, add) {
  const declared = facts?.counts?.live_anchors?.value;
  if (typeof declared !== "number") return;
  const names = (facts.counts.live_anchors.names || []).join(", ");
  const re = /\b(\d+|two|three|four|five|six)[-\s]anchor\b|\b(\d+|two|three|four|five|six)\s+(?:independent\s+)?anchors\b/gi;
  const WORDS = { two: 2, three: 3, four: 4, five: 5, six: 6 };
  let m;
  while ((m = re.exec(text))) {
    const raw = (m[1] || m[2] || "").toLowerCase();
    const n = WORDS[raw] ?? parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= declared) continue;   // understatement is safe
    const window = ctx(text, m.index, re.lastIndex, 130);
    // A Bitcoin block height followed by a flattened next-field name such as
    // "block 968674 anchors.json" is not a claim of 968674 independent anchors.
    const immediateBefore = text.slice(Math.max(0, m.index - 24), m.index);
    if (/\bblock\s*$/i.test(immediateBefore)) continue;
    if (/\bplanned\b|\bwill\b|\bwould\b|\bonce\b|\bnot yet\b|\bfund(s|ing|ed)?\b|\boutcome\b/i.test(window)) {
      continue;  // future/funded framing is honest — "OUTCOME: a 4-anchor machine"
    }
    // "anchor" has a second, unrelated sense in the 3D governance globe: map
    // ANCHOR NODES, which are places, not cryptographic anchors. "6 Anchor nodes
    // · 5 live" is a true statement about a map and must not be flagged. Match
    // the noun that follows, not just the number.
    if (/\banchor\s+nodes?\b/i.test(text.slice(m.index, re.lastIndex + 12))) continue;
    add({
      rule: "anchor-count",
      file,
      text: m[0],
      why:
        `claims ${n} anchors; facts.json counts.live_anchors declares ${declared} ` +
        `(${names}). Bitcoin OpenTimestamps is stamped, not anchored — see rail ` +
        `ots_atom_anchor. State it in future tense or name the live anchors.`,
      ctx: window,
    });
  }
}

function ruleCapabilityTense(facts, file, text, add) {
  const rails = (facts.rails || []).filter(
    (r) => r.status === "planned" || r.status === "devnet"
  );
  for (const rail of rails) {
    const term = RAIL_TERMS[rail.id];
    if (!term) {
      // A rail declared in facts.json with no term here was SILENTLY UNENFORCED.
      // That is how the OTS programme ran for a day with no gate over any of its
      // anchoring claims. A fact nobody can check is not a fact; fail loudly.
      add({
        rule: "capability-tense",
        file: "client/src/data/facts.json",
        text: rail.id,
        why: `rail "${rail.id}" is status "${rail.status}" but has no entry in RAIL_TERMS, ` +
             `so no copy is ever checked against it. Add a term or the rail is decoration.`,
        ctx: rail.claim,
      });
      continue;
    }
    const re = new RegExp(term.source, "gi");
    let m;
    while ((m = re.exec(text))) {
      const start = m.index;
      const end = re.lastIndex;
      const window = ctx(text, start, end, 130);
      const lower = window.toLowerCase();

      // Subject scoping: is this file the LIVE rail's subject rather than this rail's?
      const scope = RAIL_SUBJECT_EXEMPT[rail.id];
      if (scope && scope.files.test(file) && !scope.unless.test(window)) continue;

      // Exonerate: the copy already labels the honest status.
      if (/\bunmeasured\b|\bdevnet\b|\bplanned\b|\bnot yet\b|\bwill\b|\bwould\b|\bonce\b|\bonly when\b|\bcoming\b|\brefuses? to mint\b|\bnot attested\b|\bnot located\b/i.test(window)) {
        continue;
      }
      // devnet rail: only "mainnet/production" framing is a violation.
      if (rail.status === "devnet" && !/\bmainnet\b|\bproduction\b/i.test(lower)) continue;

      if (!hasLiveTense(lower)) continue;

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

function runRules(facts, files, rootDir, liveCount, liveMeasured) {
  const violations = [];
  const add = (v) => violations.push(v);
  for (const f of files) {
    const rel = relative(rootDir, f);
    const raw = readFileSync(f, "utf8");
    const corrected = correctedHistoricalContent(raw, rel, rootDir);
    const text = contentOf(f, corrected);
    ruleBoundary(facts, rel, text, add);
    const countText=contentOf(f,currentCountContent(corrected));
    ruleAxisCount(facts, rel, countText, add, liveCount, corrected);
    ruleMeasuredOverclaim(facts, rel, text, add, liveMeasured);
    ruleCapabilityTense(facts, rel, text, add);
    ruleAnchorCount(facts, rel, text, add);
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
// The board-canon cases below are written against the RECORDED OBSERVATION (facts.json
// counts.axis_count.observed: N slots, M measured, U unmeasured), never a typed number.
// Until 2026-09-22 they typed 22, so the selftest itself went red the moment the board
// moved to 23 — the exact defect the gate exists to catch, reproduced inside the gate.
function selftestCases(N, M, U) {
  return [
  // [name, html, shouldFail]
  ["negation: we do not certify", "<p>We measure. We do not certify, accredit or approve anything.</p>", false],
  ["negation: not a certification body", "<p>We are a measurement body, not a certification body.</p>", false],
  ["negation-by-object: we certify nothing", "<p>Training records — it attests training, not conformity; we certify nothing.</p>", false],
  ["negation: Measurement, not certification", "<p>Measurement, not certification.</p>", false],
  ["VIOLATION: we certify", "<p>We certify that this model meets the standard.</p>", true],
  ["VIOLATION: our certification", "<p>Ask about our certification programme for vendors.</p>", true],
  ["VIOLATION: accredited by us", "<p>Labs accredited by us receive a badge.</p>", true],
  // ── the board canon (ADR-001 derived counts; ADR-002 slot 23) ───────────────────
  // These cases were first written when the board was 14 axes and "22" was a number
  // nobody was allowed to say, then again when the board was "22 axes · 15 measured"
  // and "22 MEASURED" was the forbidden overclaim, then typed at 22·22·0. They now
  // read N·M·U off the observation, so the selftest moves with the board. The
  // overclaim rule still guards the line — it catches a claim of MORE measured axes
  // than the board actually carries (M).
  ["prohibition form still passes", `<p>Cite live totals.public_count — do not invent ${N} axes.</p>`, false],
  [`${N} axes is the observed slot count and matches the live board`, `<p>The board carries ${N} axes across both families.</p>`, false],
  ["stale count: the pre-sweep 14", "<p>The board measures 14 axes across the fleet.</p>", true],
  ["board self-description: 13 canonical axes + jail (a GSPC-family stamp)", "<p>Measured on 2026-08-12 (13 canonical axes) · 2026-08-18 (jail).</p>", false],
  ["honest swept grammar", `<p>${N} axes · ${M} measured — every slot has a run behind it.</p>`, false],
  [`derived triple flattened ${N}·${M}·${U} axes · measured · unmeasured (reproduces 1804 deploy)`, `<p>Living GSPC · derived totals ${N}·${M}·${U} axes · measured · unmeasured — ${N} axis · ${M} measured</p>`, false],
  ["VIOLATION: a real 0-axes board-total claim still fails", "<p>The board currently carries 0 axes.</p>", true],
  ["enumerated subset: the count names exactly its members", "<p>Separation on 3 axes (governance, safety, care) is computed from rows.</p>", false],
  ["matrix dimension scopes its own batch", "<p>Cross-runtime reproduction, batch 2 (10 models x 14 axes).</p>", false],
  ["VIOLATION: enumerated list shorter than the count", "<p>Separation on 4 axes (governance, safety, care) is computed from rows.</p>", true],
  [`${M} measured is the observed measured count, not an overclaim`, `<p>The board publishes ${M} measured axes.</p>`, false],
  // "All N axes are measured" is honest only while no slot is declared-but-unmeasured.
  [`all ${N} axes are measured is ${U === 0 ? "honest" : "an OVERCLAIM"} (U = ${U})`, `<p>All ${N} axes are measured and signed.</p>`, U !== 0],
  [`VIOLATION: ${N + 8} measured axes (more than the board carries)`, `<p>The board publishes ${N + 8} measured axes.</p>`, true],
  // ── postfix measured grammar = the live totals.lid (2026-09-16, board 23 · 22) ──
  ["live lid verbatim: N axes measured is a MEASURED claim, not a slot count", "<p>Lid: 15 axes measured · 14 model fleets · 3 public leader scores · 8 fact runs · TIE is TIE · not a certificate.</p>", false],
  ["VIOLATION: postfix overclaim still fails", "<p>Board right now: 30 axes measured · 14 model fleets.</p>", true],
  ["understatement passes (fewer than measured is safe)", "<p>The board carries 15 measured axes today.</p>", false],
  ["VIOLATION: EAS asserted live", "<p>Every attestation is anchored on EAS today.</p>", true],
  ["honest EAS label", "<p>EVM · EAS BlackRock BUIDL 0x7712c3420573… UNMEASURED</p>", false],
  ["VIOLATION: ERC-3643 asserted live", "<p>We issue ERC-3643 credentials; issuance runs on the trusted-issuer bridge.</p>", true],
  ["VIOLATION: XRPL mainnet carrier", "<p>Our attestations are published to XRPL mainnet in production.</p>", true],
  ["honest XRPL devnet", "<p>Network: XRPL DEVNET · evidence card 82994353b8f94337…</p>", false],
  // ── OTS: a stamp is not an anchor (2026-09-03) ────────────────────────────────
  // A card carrying a fresh OpenTimestamps stamp was described as "OTS-anchored to
  // Bitcoin" while its proof held only a PendingAttestation. 245 of 261 .ots files
  // in the repo were pending; the estate reported "42/45 OTS-anchored". The
  // ots_atom_anchor rail is `planned` precisely so this copy cannot ship.
  ["VIOLATION: atoms asserted OTS-anchored", "<p>Every queued atom is anchored to Bitcoin via OpenTimestamps.</p>", true],
  ["VIOLATION: press releases asserted anchored", "<p>Every press release is signed and anchored on Bitcoin today.</p>", true],
  ["honest pending label", "<p>Stamped, not yet anchored: the calendar has not committed this digest to Bitcoin.</p>", false],
  ["honest future tense for atom anchoring", "<p>Each atom will be anchored to Bitcoin once a calendar commits it.</p>", false],
  ["honest conditional verification rule", "<p>Treat OTS as Bitcoin-anchored only when the sidecar derives CONFIRMED_BITCOIN from the proof bytes.</p>", false],
  ["honest none-state on a live surface", "<p>This live surface has no OTS proof published alongside it.</p>", false],
  // ── anchor-count concept rule (2026-09-03) ───────────────────────────────────
  // Each of these survived a hand-grep pass. The noun form carries no verb the
  // tense rule can see; the JSON-LD one was live on proofs.councilof.ai.
  ["VIOLATION: 4-anchor machine as a noun", "<p>The 4-anchor machine (HuggingFace + Rekor + corrections + Bitcoin OTS) made visible.</p>", true],
  ["VIOLATION: four anchors spelled out", "<p>Our four anchors bind every measurement.</p>", true],
  ["VIOLATION: anchor count in JSON-LD description", '{"@type":"WebSite","description":"A 4-anchor machine for AI measurement."}', true, "subdomains/proofs/index.html"],
  ["honest: three live anchors named", "<p>Three independent live anchors — HuggingFace, Sigstore Rekor and a public corrections ledger.</p>", false],
  ["honest: 4-anchor as a funded OUTCOME", "<p>OUTCOME: a 4-anchor machine that gives regulators a single verifiable surface.</p>", false],
  ["honest: planned framing", "<p>A 4-anchor machine is planned once Bitcoin anchoring lands.</p>", false],
  ["map anchor NODES are a different sense and must pass", "<p>6 Anchor nodes · 5 live on the governance globe.</p>", false],
  ["Bitcoin block height beside anchors.json is not an anchor count", "<p>OpenTimestamps proof with a Bitcoin attestation at block 968674 anchors.json lists the states.</p>", false],
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
  // ── rail SUBJECT scoping: root vs atom (2026-09-03) ──────────────────────────
  // The published root IS anchored (ots_root_anchor, status live). Individual atoms are
  // NOT (ots_atom_anchor, status planned). Both mention Bitcoin, so a keyword-only match
  // attributed root copy to the planned atom rail and blocked every deploy for a day.
  // These four cases pin the boundary in both directions — the exemption must lift the
  // false positive WITHOUT letting a real atom over-claim through.
  [
    "root artifact may state its own anchoring in the indicative",
    '{"anchor_rule":"This root is anchored to Bitcoin via OpenTimestamps at block 965268."}',
    false,
    "interop/card-root-2026-09-03.json",
  ],
  [
    "root artifact explaining it is NOT yet an anchor still passes",
    '{"anchor_rule":"This document is a commitment, not an anchor. It becomes anchored only when an OpenTimestamps proof over these bytes is upgraded into a Bitcoin block."}',
    false,
    "interop/card-root-2026-09-03.json",
  ],
  [
    "VIOLATION: atom over-claim INSIDE a root artifact is still caught",
    '{"note":"Every queued atom is anchored to Bitcoin via OpenTimestamps."}',
    true,
    "interop/card-root-2026-09-03.json",
  ],
  [
    "VIOLATION: the same root sentence outside a root artifact is not exempt",
    '<p>Everything here is anchored to Bitcoin via OpenTimestamps.</p>',
    true,
    "subdomains/proofs/index.html",
  ],
  // ── corrections ledger page (2026-09-30) ─────────────────────────────────────
  [
    "the corrections ledger page may quote the axis count an old entry corrected",
    `<p>Fix: the board now derives '${N - 1} axes' from the axis array: ${N - 1} slots.</p>`,
    false,
    "corrections/index.html",
  ],
  [
    "VIOLATION: the same stale count on any other page is still caught",
    `<p>Fix: the board now derives '${N - 1} axes' from the axis array: ${N - 1} slots.</p>`,
    true,
    "corrections-archive/index.html",
  ],
  [
    "VIOLATION: the corrections page is not exempt from the other rules",
    "<p>Every queued atom is anchored to Bitcoin via OpenTimestamps.</p>",
    true,
    "corrections/index.html",
  ],
  ];
}

async function selftest(facts) {
  const observed = facts.counts?.axis_count?.observed ?? {};
  if (typeof observed.axes !== "number" || typeof observed.measured_axes !== "number") {
    console.error("facts-gate --selftest: facts.json counts.axis_count.observed carries no axes/measured_axes — run scripts/refresh-board-observation.mjs");
    process.exit(2);
  }
  const liveCount = observed.axes;
  const liveMeasured = observed.measured_axes;
  const liveUnmeasured = typeof observed.unmeasured_axes === "number" ? observed.unmeasured_axes : liveCount - liveMeasured;
  let pass = 0;
  let fail = 0;
  console.log(`facts-gate --selftest  (reference axis count = ${liveCount} · measured ${liveMeasured} · unmeasured ${liveUnmeasured}, observed ${observed.observed_at})\n`);
  for (const testCase of selftestCases(liveCount, liveMeasured, liveUnmeasured)) {
    const [name, html, shouldFail, filePath] = testCase;
    const file = filePath || "selftest";
    const violations = [];
    const add = (v) => violations.push(v);
    const text = textOf(html);
    ruleBoundary(facts, file, text, add);
    ruleAxisCount(facts, file, text, add, liveCount, html);
    ruleMeasuredOverclaim(facts, file, text, add, liveMeasured);
    ruleCapabilityTense(facts, file, text, add);
    ruleAnchorCount(facts, file, text, add);
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

const referenceFlag=args.indexOf('--board-reference');
const referenceFile=referenceFlag<0?null:args[referenceFlag+1];
let counts,referenceScope;
if(referenceFlag>=0){
  if(!referenceFile)throw new Error('Explicit board-reference path required');
  const reference=verifyBoardReference(referenceFile,root);counts=reference.counts;referenceScope=reference.scope+' '+reference.board_sha256;
}else{
  // A live-only invocation requires one successful response, never a stale recorded count.
  if(process.env.FACTS_GATE_OFFLINE==='1')throw new Error('Offline facts check requires an exact --board-reference from the completed render');
  const ep=facts.counts?.axis_count?.endpoint;if(!ep)throw new Error('Board endpoint missing');
  const response=await fetch(ep,{signal:AbortSignal.timeout(20000),redirect:'error'});
  if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw new Error('Board reference unavailable; no historical fallback');
  const raw=Buffer.from(await response.arrayBuffer());counts=boardCounts(raw);referenceScope='ONE_CURRENT_RESPONSE_NOT_RENDER_BOUND';
}
const liveCount=counts.axes,liveMeasured=counts.measured_axes;
console.log('facts-gate reference scope:',referenceScope);
const files = walk(root);
console.log(`facts-gate: scanning ${files.length} prerendered files in ${root} (reference axis count = ${liveCount})`);

const violations = runRules(facts, files, root, liveCount, liveMeasured);
report(violations);

if (violations.length) {
  console.error(`\nfacts-gate FAILED: ${violations.length} contradiction(s) against facts.json.`);
  process.exit(1);
}
console.log("facts-gate OK: no claim contradicts facts.json.");
