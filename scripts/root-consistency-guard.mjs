/**
 * Does the published root history only ever grow?
 *
 * Measured 2026-09-04 against the live /receipts/root-history.json: all 14 transitions removed
 * cards, 421 distinct cards were committed to by some published root, 281 of them are absent from
 * the current one, and a sample of the dropped cards returns HTTP 404. Retaining all 421 costs
 * about 337 KB — less than a third of one percent of the video assets already in this repo. They
 * were not dropped for cost; nothing retained them.
 *
 * That matters because a root carrying an Ed25519 signature and a Bitcoin timestamp reads as a
 * transparency log. A log that silently drops entries is a rolling snapshot wearing a log's
 * clothes: the anchor proves "these bytes existed", not "and nothing was removed", and only the
 * second claim is what a reader assumes.
 *
 * BOTH is the answer, not either. A rolling HEAD is correct for the board — a superseded
 * measurement should leave the current view. An append-only LOG is correct for the evidence.
 * They answer different questions and the estate needs both; today it has only the first, named
 * as though it were the second.
 *
 * This guard does not force append-only overnight. It records what the history does now and fails
 * when it gets WORSE, so the decision stays the owner's while the drift does not go unnoticed.
 *
 *   node scripts/root-consistency-guard.mjs --selftest
 *   node scripts/root-consistency-guard.mjs [--url <root-history.json>] [--strict]
 *
 * --strict requires true append-only and is what to switch on once the log exists.
 */
import { readFileSync, existsSync } from "node:fs";

const args = process.argv.slice(2);
const STRICT = args.includes("--strict");
const URL = args.includes("--url") ? args[args.indexOf("--url") + 1]
                                   : "https://councilof.ai/receipts/root-history.json";
const BASELINE = "scripts/root-consistency-baseline.json";

/** @returns {{transitions:number, removing:number, everCards:number, currentCards:number, drops:Array}} */
export function analyseHistory(history) {
  const roots = [...(history.roots ?? [])].sort((a, b) => String(a.as_of).localeCompare(String(b.as_of)));
  const ever = new Set();
  let prev = null, removing = 0, transitions = 0;
  const drops = [];
  for (const r of roots) {
    const cur = new Set(r.card_sha256 ?? []);
    for (const c of cur) ever.add(c);
    if (prev) {
      transitions++;
      const removed = [...prev].filter((c) => !cur.has(c));
      if (removed.length) { removing++; drops.push({ from: prevAsOf, to: r.as_of, removed: removed.length }); }
    }
    prev = cur; var prevAsOf = r.as_of;
  }
  return {
    roots: roots.length, transitions, removing,
    everCards: ever.size,
    currentCards: prev ? prev.size : 0,
    droppedEver: prev ? [...ever].filter((c) => !prev.has(c)).length : 0,
    drops,
  };
}

if (args.includes("--selftest")) {
  const appendOnly = { roots: [
    { as_of: "2026-01-01", card_sha256: ["a"] },
    { as_of: "2026-01-02", card_sha256: ["a", "b"] },
    { as_of: "2026-01-03", card_sha256: ["a", "b", "c"] },
  ] };
  const dropping = { roots: [
    { as_of: "2026-01-01", card_sha256: ["a", "b"] },
    { as_of: "2026-01-02", card_sha256: ["b", "c"] },  // "a" removed
  ] };
  const ok = analyseHistory(appendOnly);
  const bad = analyseHistory(dropping);
  const checks = [
    ["append-only history reports zero removing transitions", ok.removing === 0],
    ["append-only history counts every card as still present", ok.droppedEver === 0],
    ["a dropping history is detected", bad.removing === 1],
    ["a dropping history names the lost card", bad.droppedEver === 1],
    ["ever-set is the union, not the last root", bad.everCards === 3],
  ];
  const failed = checks.filter(([, v]) => !v).map(([w]) => w);
  if (failed.length) { console.error("✖ root-consistency selftest FAILED: " + failed.join("; ")); process.exit(1); }
  console.log(`✓ root-consistency selftest: ${checks.length}/${checks.length} — append-only passes, removal is caught`);
  process.exit(0);
}

const history = await (async () => {
  if (existsSync(URL)) return JSON.parse(readFileSync(URL, "utf8"));
  const r = await fetch(URL, { headers: { "user-agent": "csoai-root-consistency/0.1 (+https://councilof.ai)" } });
  if (!r.ok) { console.error(`✖ root-consistency: UNCHECKABLE — ${URL} returned HTTP ${r.status}`); process.exit(1); }
  return await r.json();
})();

const a = analyseHistory(history);
console.log(`root-consistency: ${a.roots} published root(s), ${a.transitions} transition(s)`);
console.log(`  transitions that removed cards : ${a.removing} of ${a.transitions}`);
console.log(`  distinct cards ever rooted     : ${a.everCards}`);
console.log(`  in the current root            : ${a.currentCards}`);
console.log(`  rooted once, absent now        : ${a.droppedEver}`);

if (STRICT) {
  if (a.removing === 0) { console.log("✓ append-only: no published root ever removed a card"); process.exit(0); }
  console.error(`\n✖ --strict: the published history is NOT append-only (${a.removing} removing transition(s))`);
  for (const d of a.drops.slice(0, 5)) console.error(`   ${d.from} -> ${d.to}  dropped ${d.removed}`);
  process.exit(1);
}

if (!existsSync(BASELINE)) { console.log(`  no baseline — run --update-baseline once the owner has ruled on what the root IS`); process.exit(0); }
const base = JSON.parse(readFileSync(BASELINE, "utf8"));
if (a.droppedEver > base.droppedEver) {
  console.error(`\n✖ regression: cards rooted-then-absent rose from ${base.droppedEver} to ${a.droppedEver}`);
  console.error("  A root that drops what an earlier root committed to is a snapshot, not a log.");
  process.exit(1);
}
console.log(`✓ no worse than the recorded baseline (${base.recorded}: ${base.droppedEver} absent)`);
