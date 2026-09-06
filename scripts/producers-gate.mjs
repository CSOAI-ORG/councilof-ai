#!/usr/bin/env node
/**
 * producers-gate — re-run every producer and fail if any output moves.
 *
 * WHY. On 2026-09-06 one x402 change left FOUR derived artefacts stale at once: the
 * byte-identical agent-card alias, the JWS signing input, the a2a census (our_agent.skills 6
 * against the card's 7), and public/llms.txt (missing 13 lines its own template already carried).
 * Every one had a working test. Every test went red. They were still found one at a time over an
 * hour, because nothing recorded which artefact derives from what — so each was a separate
 * surprise instead of one failure naming all four.
 *
 * This is that check: docs/operations/PRODUCERS.json says what produces what, and this re-runs
 * each producer in a clean tree. If an output moves, the source changed and the artefact was not
 * re-produced. The fix is always to run the producer — never to edit the output.
 *
 * IT RESTORES WHAT IT TOUCHES. Running producers mutates the tree, so every output is restored
 * from git afterwards whether the check passes or fails. A gate that leaves a dirty tree behind
 * breaks the steps after it and gets blamed for their failures.
 *
 *   node scripts/producers-gate.mjs            # re-run all, fail on drift
 *   node scripts/producers-gate.mjs --selftest # prove it can catch and can pass
 */
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SELFTEST = process.argv.includes("--selftest");
const MANIFEST = join(REPO, "docs/operations/PRODUCERS.json");

const sh = (cmd) => execSync(cmd, { cwd: REPO, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
const dirtyAmong = (paths, volatile = []) => {
  // Only ask git about the paths this producer claims — another lane's edit is not our drift.
  // And compare CONTENT minus declared-volatile lines: generate-sitemap stamps every entry with
  // the build date, so a filename-level check called 992 changed lines drift when 982 of them
  // were only <lastmod> moving from yesterday to today. A gate that goes red every morning is a
  // gate someone turns off, taking the 10 real lines with it.
  const args = paths.filter((p) => !p.includes("*")).map((p) => `'${p}'`).join(" ");
  if (!args) return [];
  let out = [];
  try { out = sh(`git diff --name-only -- ${args}`).split("\n").map((s) => s.trim()).filter(Boolean); }
  catch { return []; }
  if (!volatile.length) return out;
  return out.filter((f) => {
    let patch = "";
    try { patch = sh(`git diff -U0 -- '${f}'`); } catch { return true; }
    const changed = patch.split("\n").filter((l) => /^[+-][^+-]/.test(l));
    const real = changed.filter((l) => !volatile.some((v) => l.includes(v)));
    return real.length > 0;
  });
};
const restore = (paths) => {
  const args = paths.filter((p) => !p.includes("*")).map((p) => `'${p}'`).join(" ");
  if (args) { try { sh(`git checkout -- ${args}`); } catch { /* untracked output: nothing to restore */ } }
};

export function loadManifest(file = MANIFEST) {
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8"));
}

if (SELFTEST) {
  let bad = 0;
  const must = (l, c) => { if (!c) { console.error(`✖ selftest: ${l}`); bad++; } };
  const m = loadManifest();
  must("the manifest exists and parses", !!m);
  must("every producer names a cmd and at least one output",
    !!m && m.producers.every((p) => p.cmd && Array.isArray(p.outputs) && p.outputs.length));
  must("every producer says what it derives from",
    !!m && m.producers.every((p) => Array.isArray(p.derives_from) && p.derives_from.length));
  must("a network-dependent producer is flagged, so its drift is not reported as a defect",
    !!m && m.producers.some((p) => p.needs_network === true));
  must("no producer claims an output it does not own (no duplicate outputs)", (() => {
    if (!m) return false;
    const all = m.producers.flatMap((p) => p.outputs);
    return new Set(all).size === all.length;
  })());
  must("loadManifest returns null rather than throwing when the file is absent",
    loadManifest("/nonexistent/PRODUCERS.json") === null);
  must("a producer whose output carries a build date declares it volatile",
    !!m && m.producers.some((p) => Array.isArray(p.volatile) && p.volatile.length));
  if (bad) { console.error(`✖ producers-gate selftest FAILED (${bad})`); process.exit(1); }
  console.log("✓ producers-gate selftest: 7/7 — the manifest is well formed and absence is handled");
  process.exit(0);
}

const manifest = loadManifest();
if (!manifest) {
  console.error("producers-gate: docs/operations/PRODUCERS.json is missing.");
  console.error("  An absent manifest is an unguarded estate, not a passing one. Add it, or remove this step.");
  process.exit(1);
}

const drifted = [];
const networkDrift = [];
const failedToRun = [];

for (const p of manifest.producers) {
  // Never report someone else's uncommitted work as this producer's drift.
  const before = dirtyAmong(p.outputs, p.volatile || []);
  try { sh(p.cmd); }
  catch (e) {
    failedToRun.push(`${p.id}: \`${p.cmd}\` exited non-zero — ${String(e.stderr || e.message).split("\n")[0].slice(0, 120)}`);
    restore(p.outputs);
    continue;
  }
  const after = dirtyAmong(p.outputs, p.volatile || []);
  const moved = after.filter((f) => !before.includes(f));
  restore(p.outputs);
  if (moved.length) (p.needs_network ? networkDrift : drifted).push({ id: p.id, cmd: p.cmd, moved, note: p.note });
}

for (const n of networkDrift) {
  console.log(`⚠ ${n.id}: output moved, but this producer reads a live source (needs_network).`);
  console.log(`   ${n.moved.join(", ")} — not counted as drift. Its own --check step adjudicates.`);
}
if (failedToRun.length) {
  console.error(`\n✖ producers-gate: ${failedToRun.length} producer(s) could not run:\n`);
  for (const f of failedToRun) console.error("  " + f);
}
if (drifted.length) {
  console.error(`\n✖ producers-gate: ${drifted.length} artefact set(s) are not what their producer emits:\n`);
  for (const d of drifted) {
    console.error(`  ${d.id} — ${d.moved.join(", ")}`);
    console.error(`    fix:  ${d.cmd}`);
    if (d.note) console.error(`    why:  ${d.note}`);
  }
  console.error(`\n  A source changed and its artefact was not re-produced. Run the producer; never edit the output.`);
}
if (drifted.length || failedToRun.length) process.exit(1);
console.log(`✓ producers-gate: ${manifest.producers.length} producer(s) re-run, every output already current`);
