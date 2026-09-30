/**
 * board-render-guard.mjs — fail a build whose prerendered pages print board separation figures
 * that the board payload of the same build does not carry.
 *
 * WHY (28 Sep 2026). ~20 prerendered pages flipped "8 tied" → "2 tied" → "8 tied" across three
 * consecutive deploys while every one of those deploys' own /api/gspc said 8 TIE · 6 UNTESTED.
 * The prerender had baked whichever board the live origin answered. Nothing compared the numbers
 * on the page with the numbers in the payload, so the flip shipped twice. This does, for the
 * sentences that carry them:
 *
 *   · "S of C model-comparison axes separated a leader — T tied, U untested"   (home band)
 *   · "S of C model-comparison axes separated a leader · T TIE · U UNTESTED"   (totals.separation_public_count)
 *   · "T TIE · U UNTESTED"                                                      (any echo of it)
 *   · "A axes measured · F model fleets · S separated leaders · L public leader scores · R fact runs"
 *                                                                               (totals.lid)
 *
 * Every expected number is read from the payload's totals (the Function's one derivation), never
 * typed here. A page that prints none of these sentences is not checked by this guard.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const STRIP_BLOCKS = /<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi;
const ENT = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", mdash: "—", ndash: "–", middot: "·", hellip: "…" };
export function visibleText(html) {
  return html
    .replace(STRIP_BLOCKS, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
      e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENT[e.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

const LID_RE = /(\d+) axes measured · (\d+) model fleets · (\d+) separated leaders · (\d+) public leader scores · (\d+) fact runs/;
// Comparison wording, served from 30 Sep 2026 (no count of "leaders"): the lid states the comparison states.
const LID2_RE = /(\d+) ax(?:is|es) measured · (\d+) model comparisons: (\d+) separated · (\d+) TIE · (\d+) UNTESTED · (\d+) fact runs/;

/** What the payload says, from totals only. Null fields are not checked. */
export function expectedFromBoard(raw) {
  const d = JSON.parse(Buffer.isBuffer(raw) ? raw.toString("utf8") : raw);
  const t = d?.totals ?? {};
  const n = (v) => (Number.isSafeInteger(v) ? v : null);
  const lid = typeof t.lid === "string" ? t.lid.match(LID_RE) : null;
  const lid2 = typeof t.lid === "string" ? t.lid.match(LID2_RE) : null;
  return {
    separated: n(t.separated_leads),
    comparison: n(t.comparison_axes),
    ties: n(t.ties),
    untested: n(t.untested_separations),
    lid: lid ? lid.slice(1, 6).map(Number) : null,
    lid2: lid2 ? lid2.slice(1, 7).map(Number) : null,
  };
}

const RULES = [
  {
    id: "separation-line",
    re: /(\d+) of (\d+) model-comparison axes separated a leader\s*[—–-]\s*(\d+) tied,\s*(\d+) untested/g,
    fields: ["separated", "comparison", "ties", "untested"],
  },
  {
    id: "separation-public-count",
    re: /(\d+) of (\d+) model-comparison axes separated a leader · (\d+) TIE · (\d+) UNTESTED/g,
    fields: ["separated", "comparison", "ties", "untested"],
  },
  { id: "tie-untested", re: /\b(\d+) TIE · (\d+) UNTESTED\b/g, fields: ["ties", "untested"] },
  { id: "lid", re: new RegExp(LID_RE.source, "g"), fields: ["lid0", "lid1", "lid2", "lid3", "lid4"] },
  { id: "lid-comparison", re: new RegExp(LID2_RE.source, "g"), fields: ["lidb0", "lidb1", "lidb2", "lidb3", "lidb4", "lidb5"] },
];

/** Violations of `expected` in one page's visible text. */
export function checkText(text, expected) {
  const want = {
    ...expected,
    ...(expected.lid ? Object.fromEntries(expected.lid.map((v, i) => [`lid${i}`, v])) : {}),
    ...(expected.lid2 ? Object.fromEntries(expected.lid2.map((v, i) => [`lidb${i}`, v])) : {}),
  };
  const out = [];
  for (const rule of RULES) {
    for (const m of text.matchAll(rule.re)) {
      const got = m.slice(1).map(Number);
      const bad = rule.fields
        .map((f, i) => (want[f] === null || want[f] === undefined || want[f] === got[i] ? null : `${f.replace(/^lidb?\d$/, "lid")} ${got[i]}≠${want[f]}`))
        .filter(Boolean);
      if (bad.length) out.push({ rule: rule.id, found: m[0], mismatch: bad.join(", ") });
    }
  }
  return out;
}

/** The file each prerendered route was written to (the same rule prerender.mjs writes by). */
export function routeFile(dist, route) {
  return route === "/" || route === "" ? join(dist, "index.html") : join(dist, route.replace(/^\//, "").replace(/\/$/, ""), "index.html");
}

/**
 * Check every route the prerender snapshotted (client-only shells and skipped routes carry no
 * board text). Returns { checked, violations: [{route, rule, found, mismatch}] }.
 */
export function guardRenderedBoard(dist, results, boardRaw) {
  const expected = expectedFromBoard(boardRaw);
  const violations = [];
  let checked = 0;
  const seen = new Set();
  for (const r of results) {
    if (!r || !r.ok || r.clientOnly || r.skipped404) continue;
    const file = routeFile(dist, r.route);
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    checked++;
    for (const v of checkText(visibleText(readFileSync(file, "utf8")), expected)) violations.push({ route: r.route, ...v });
  }
  return { checked, expected, violations };
}
