// Frozen provision normaliser v1.0.0, ported from normaliser_v1.py (an exact copy of the
// corpus_anchor.py that produced public/interop/frozen-provision-hashes.json). Do not change its
// output: every frozen hash depends on it. A new rule is a new version.
//
// The Python original uses str.casefold() and Python regex \s and \d. JavaScript's toLowerCase(),
// \s and \d differ on a few hundred code points and move with the engine's Unicode version, so
// this port takes all three from normaliser-v1.tables.json (generated from Python by
// normaliser-v1-tables.py) and never calls toLowerCase. Python's re.IGNORECASE also lets "i" and
// [A-Z] match U+0130 and U+0131; the editorial pattern spells that out.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const NORMALISER_VERSION = "1.0.0";

const TABLES = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "normaliser-v1.tables.json"), "utf8"));
if (TABLES.normaliser_version !== NORMALISER_VERSION) throw new Error("normaliser tables are for another version");
const FOLD = new Map(Object.entries(TABLES.casefold).map(([k, v]) => [Number.parseInt(k, 16), v]));
const u = (cp) => `\\u{${cp.toString(16)}}`;
const WS_CLASS = `[${TABLES.whitespace.map(u).join("")}]`;
const DIGIT_CLASS = `[${TABLES.digit_ranges.map(([a, b]) => (a === b ? u(a) : `${u(a)}-${u(b)}`)).join("")}]`;

const SOFT_HYPHEN = /[\u00ad\u200b\u200c\u200d\ufeff]/gu;
// Python: r"\u25ba?[MC]\d+\s*|\(\s*OJ\s+L[^)]*\)|\[?consolidated text\]?|\u25bc[A-Z]\d*" with re.I
const EDITORIAL = new RegExp(
  [
    `\\u25ba?[MC]${DIGIT_CLASS}+${WS_CLASS}*`,
    `\\(${WS_CLASS}*OJ${WS_CLASS}+L[^)]*\\)`,
    `\\[?consol[i\\u0130\\u0131]dated text\\]?`,
    `\\u25bc[A-Z\\u0130\\u0131]${DIGIT_CLASS}*`,
  ].join("|"),
  "giu",
);
const WS_RUN = new RegExp(`${WS_CLASS}+`, "gu");

const casefold = (t) => {
  let out = "";
  for (const ch of t) out += FOLD.get(ch.codePointAt(0)) ?? ch;
  return out;
};

export function normalise(text) {
  if (text === null || text === undefined) throw new Error("cannot normalise None - a missing provision is UNKNOWN, not empty");
  let t = String(text).replace(SOFT_HYPHEN, "");
  t = t.replace(EDITORIAL, " ");
  t = t.replaceAll("\u2019", "'").replaceAll("\u2018", "'").replaceAll("\u201c", '"').replaceAll("\u201d", '"');
  t = t.replaceAll("\u2013", "-").replaceAll("\u2014", "-").replaceAll("\u00a0", " ");
  return casefold(t.replace(WS_RUN, " ").replace(/^ | $/g, ""));
}

export const provisionHash = (text) =>
  createHash("sha256").update(`${NORMALISER_VERSION}\u0000${normalise(text)}`, "utf8").digest("hex");

/** sha256 over sorted (id + hash), the same root as build-coverage.mjs corpusRoot(). */
export function corpusRoot(anchors) {
  const h = createHash("sha256");
  for (const k of Object.keys(anchors).sort()) h.update(k).update(anchors[k]);
  return h.digest("hex");
}
