/**
 * Doctrine lint: compliance-status words in tool, skill and plugin descriptions (master plugin plan 3d, 2026-09-30).
 *
 * We measure; we never certify. A description that calls a subject "compliant", "certified" or "approved" turns a
 * measurement into a status we cannot grant, and a model reading tools/list repeats it to a person. A listed word
 * passes only when the SAME clause negates it ("not a conformity assessment", "never a certification", "does not
 * certify"), when it sits under a JSON key that is a negation by construction (explicitly_not, …), or when it is
 * a fixed third-party string that makes no claim of ours (PyPI's "License :: OSI Approved :: …").
 *
 * One module, two callers: functions/mcp/tool-descriptions-doctrine.test.ts (vitest, failing-first) and
 * scripts/harness-x/check.mjs (every rendered distribution/** output).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
/** Compliance-status words: each names a status a measurement body cannot grant. */
export const BANNED = [
  ["compliant", /\b(?:non-)?compliant\b/gi],
  ["compliance-ready", /\bcompliance[- ]ready\b/gi],
  ["certified / certification / certify", /\bcertif(?:ied|ies|y|ying|ication|ications|icate|icates)\b/gi],
  ["conformity / conformant", /\bconform(?:ity|ant)\b/gi],
  ["approved", /\bapproved\b/gi],
  ["accredited", /\baccredited\b/gi],
  ["guaranteed", /\bguarantee[ds]?\b/gi],
  ["regulated by us", /\bregulated by (?:us|csoai|council of ai)\b/gi],
  ["audited by us", /\baudited by (?:us|csoai|council of ai)\b/gi],
];

/** A negator in the same clause (within 90 characters before the word) makes the use a denial. */
const NEGATOR =
  /\b(?:not|never|no|nor|nothing|without|neither|none|isn't|aren't|doesn't|don't|won't|cannot|non)\b|n't\b|\bnot_an?_|explicitly_not/i;
/** Third-party fixed strings that contain a listed word but make no claim of ours (PyPI trove classifiers). */
const THIRD_PARTY = [/License :: OSI Approved :: /g];

/**
 * The board's OWN axis ids, exempted for the same reason as the PyPI classifiers above: they
 * are fixed strings that make no claim of ours.
 *
 * `machinery-conformity` is the name the live board gives that axis, and we publish it at
 * councilof.ai/gspc/machinery-conformity/ and in /api/gspc. A tool named for the axis is a
 * reference to a published identifier, not a conformity claim about a subject — the same
 * distinction the house already drew for display copy ("code identifiers are exempt").
 *
 * ONE source: functions/mcp/axis-aliases.json, the table pinned to the board's declared slots.
 * Not typed here — a typed copy would drift from the board.
 *
 * NARROW ON PURPOSE. Only the ids that would otherwise trip the lint are exempted, and only
 * the id itself is blanked. A claim beside the id still trips: "this axis is
 * machinery-conformity, so it certifies you" still fails on `certifies`.
 */
const AXIS_ID_EXEMPTIONS = (() => {
  try {
    const p = new URL("../../functions/mcp/axis-aliases.json", import.meta.url);
    const doc = JSON.parse(readFileSync(p, "utf8"));
    return Object.keys(doc.axes ?? {}).filter((id) =>
      BANNED.some(([, re]) => new RegExp(re.source, "i").test(id)),
    );
  } catch {
    return [];
  }
})();
/** JSON keys whose string values are negations by construction. */
export const NEGATION_KEYS =
  /^(?:explicitly_not|never|not_claimed|does_not_establish|claim_boundary|not_a_certification|what_this_is_not|is_not)$/;

function clauseNegated(text, index) {
  const lineStart = text.lastIndexOf("\n", index) + 1;
  const window = text.slice(Math.max(lineStart, index - 90), index);
  const clause = window.split(/[.;:!?]\s|— (?=[A-Z])/).pop() ?? "";
  return NEGATOR.test(clause);
}

/** Every affirmative compliance-status word in one piece of text: [{where, word, context}]. */
export function doctrineViolations(raw, where = "text") {
  let text = THIRD_PARTY.reduce((t, re) => t.replace(re, (m) => " ".repeat(m.length)), raw);
  for (const id of AXIS_ID_EXEMPTIONS) {
    if (!id) continue;
    text = text.split(id).join(" ".repeat(id.length));
  }
  const out = [];
  for (const [word, re] of BANNED) {
    for (const m of text.matchAll(re)) {
      const i = m.index ?? 0;
      if (clauseNegated(text, i)) continue;
      out.push({ where, word, context: text.slice(Math.max(0, i - 50), i + m[0].length + 20).replace(/\s+/g, " ") });
    }
  }
  return out;
}

export function jsonViolations(node, where, underNegation = false, out = []) {
  if (typeof node === "string") {
    if (!underNegation) out.push(...doctrineViolations(node, where));
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => jsonViolations(v, `${where}[${i}]`, underNegation, out));
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) jsonViolations(v, `${where}.${k}`, underNegation || NEGATION_KEYS.test(k), out);
  }
  return out;
}

const TEXT_FILE = /\.(json|md|ya?ml|py|js|mjs|ts|toml|txt)$/;

/** Scan one file (JSON by structure, anything else as text). `root` makes `where` repo-relative. */
export function fileViolations(abs, root) {
  const rel = root ? relative(root, abs) : abs;
  const text = readFileSync(abs, "utf8");
  return abs.endsWith(".json") ? jsonViolations(JSON.parse(text), rel) : doctrineViolations(text, rel);
}

/** Every text file under a directory, minus owner notes (SUBMIT.md, MANIFEST.json), licences and binaries. */
export function distributionFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...distributionFiles(p));
    else if (TEXT_FILE.test(name) && !/^(SUBMIT\.md|MANIFEST\.json|LICENSE)$/.test(name)) out.push(p);
  }
  return out;
}
