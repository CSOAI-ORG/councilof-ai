#!/usr/bin/env node
/**
 * Weekly diff of two x402 conformance census snapshots.
 *
 * WHY THE DIFF IS THE PRODUCT. A census is a photograph: 3,520 hosts, 394 conformant, one moment.
 * Two photographs are not twice as useful — the CHANGE between them is the thing nobody else
 * publishes, because nobody else took the first one. A host that refused once may be rate-limiting;
 * a host that refuses in both rounds has a posture. Only the second round can tell them apart.
 *
 * It answers, per week: who arrived, who vanished, who started conforming, who stopped, and who
 * moved their price. Every number is counted from the two files; none is carried over.
 *
 *   node scripts/conformance-census-diff.mjs --from <older.jsonl> --to <newer.jsonl> [--out <json>]
 *
 * Reads local paths or URLs. Refuses rather than guesses when a snapshot is unreadable: a diff
 * against a file you could not parse is not a diff, it is an assertion.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const arg = (n, d = null) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const FROM = arg("from");
const TO = arg("to");
const OUT = arg("out");
if (!FROM || !TO) {
  console.error("usage: conformance-census-diff.mjs --from <older.jsonl> --to <newer.jsonl> [--out <json>]");
  process.exit(2);
}

async function load(src) {
  const text = src.startsWith("http")
    ? await (await fetch(src, { headers: { "user-agent": "csoai-census-diff/1.0" } })).text()
    : readFileSync(src, "utf8");
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line)); } catch { /* one bad line is not a snapshot */ }
  }
  if (!rows.length) { console.error(`REFUSING: ${src} parsed to zero rows. A diff against an unreadable snapshot is an assertion, not a diff.`); process.exit(2); }
  return rows;
}

const [a, b] = [await load(FROM), await load(TO)];

/**
 * REFUSE TO DIFF TWO DIFFERENT THINGS. Handed the 3,520-row conformance census against the 316-row
 * settlement census, an earlier version of this script cheerfully reported "3204 vanished, 316
 * stopped conforming, 316 prices moved to null" — every number confident and every number
 * meaningless, because the two files are different populations with different field names. A diff
 * that cannot tell it is comparing unlike things will publish nonsense with a straight face.
 */
function shapeOf(rows) {
  const k = new Set();
  for (const r of rows.slice(0, 50)) for (const key of Object.keys(r)) k.add(key);
  return k;
}
const [sa, sb] = [shapeOf(a), shapeOf(b)];
const REQUIRED = ["host", "conformant", "amount"];
const missing = REQUIRED.filter((k) => !sa.has(k) || !sb.has(k));
if (missing.length) {
  console.error(`REFUSING: a conformance snapshot must carry ${REQUIRED.join(", ")}; missing ${missing.join(", ")}. ` +
    `These do not look like two conformance censuses.`);
  process.exit(2);
}
const overlap = [...new Set(a.map((r) => r.host))].filter((h) => new Set(b.map((r) => r.host)).has(h)).length;
const smaller = Math.min(a.length, b.length);
if (smaller && overlap / smaller < 0.5) {
  console.error(`REFUSING: only ${overlap} of ${smaller} hosts appear in both snapshots (<50%). ` +
    `Two censuses of the same population share most of it; these are different populations, and a ` +
    `diff between them would report the difference in SCOPE as churn.`);
  process.exit(2);
}
const byHost = (rows) => new Map(rows.map((r) => [r.host, r]));
const A = byHost(a), B = byHost(b);

const arrived = [...B.keys()].filter((h) => !A.has(h));
const vanished = [...A.keys()].filter((h) => !B.has(h));
const both = [...B.keys()].filter((h) => A.has(h));

const startedConforming = both.filter((h) => !A.get(h).conformant && B.get(h).conformant);
const stoppedConforming = both.filter((h) => A.get(h).conformant && !B.get(h).conformant);
const priceMoved = both
  .filter((h) => String(A.get(h).amount ?? "") !== String(B.get(h).amount ?? ""))
  .map((h) => ({ host: h, from: A.get(h).amount ?? null, to: B.get(h).amount ?? null }));
const payToMoved = both
  .filter((h) => (A.get(h).pay_to ?? null) !== (B.get(h).pay_to ?? null))
  .map((h) => ({ host: h, from: A.get(h).pay_to ?? null, to: B.get(h).pay_to ?? null }));

const conf = (rows) => rows.filter((r) => r.conformant).length;
const doc = {
  schema: "csoai.x402-conformance-diff/0.1",
  from: { source: FROM, hosts: a.length, conformant: conf(a) },
  to: { source: TO, hosts: b.length, conformant: conf(b) },
  as_of: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
  change: {
    hosts: b.length - a.length,
    conformant: conf(b) - conf(a),
    arrived: arrived.length,
    vanished: vanished.length,
    started_conforming: startedConforming.length,
    stopped_conforming: stoppedConforming.length,
    price_moved: priceMoved.length,
    pay_to_moved: payToMoved.length,
  },
  arrived, vanished, started_conforming: startedConforming, stopped_conforming: stoppedConforming,
  price_moved: priceMoved, pay_to_moved: payToMoved,
  what_this_is_not: [
    "Not a judgement of any host. A host that vanished may have moved, renamed, or rate-limited us.",
    "Not a claim about intent. A price that moved is a price that moved.",
    "Two observations, not a trend. Direction needs a third.",
  ],
};

const line = (k, v) => console.log(`  ${k.padEnd(20)}${v}`);
console.log(`  ${a.length} hosts (${conf(a)} conformant) -> ${b.length} hosts (${conf(b)} conformant)`);
for (const [k, v] of Object.entries(doc.change)) line(k, v >= 0 ? `+${v}` : String(v));
for (const p of priceMoved.slice(0, 5)) line("  price", `${p.host} ${p.from} -> ${p.to}`);
if (OUT) { mkdirSync(dirname(OUT), { recursive: true }); writeFileSync(OUT, JSON.stringify(doc, null, 1)); console.log(`  wrote ${OUT}`); }
