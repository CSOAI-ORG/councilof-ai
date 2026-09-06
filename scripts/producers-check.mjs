#!/usr/bin/env node
/**
 * D45 — every gated producer in docs/operations/PRODUCERS.json still yields the committed bytes.
 *
 * WHY. On 2026-09-06 `public/interop/agent-card-jws-input.json` described a card nobody served.
 * The producer was correct the whole time; nothing re-ran it. The `gates` job went red for EVERY
 * lane — four PRs across three lanes, two of them freshly rebased — until someone diagnosed it.
 * The estate is good at building the check and bad at wiring it to something that runs.
 *
 * Two modes, because one size does not fit:
 *   delegate-to-check  the producer ships its own --check; run that and trust its exit code
 *   rerun-and-diff     re-run the producer, then require `git diff` on its declared outputs to
 *                      be empty. Only for producers PROVEN deterministic on a clean tree.
 *
 * What this deliberately does NOT do: re-run signers (the keys are not in CI, and must not be),
 * or byte-diff a producer that stamps a timestamp or a random id. Those are recorded in the
 * manifest with `gated: false` and the reason, which is the more useful half of the file.
 *
 *   node scripts/producers-check.mjs            # check every gated producer
 *   node scripts/producers-check.mjs --selftest # prove this gate can go red
 *   node scripts/producers-check.mjs --list     # what is gated, and what is not, and why
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(REPO, "docs/operations/PRODUCERS.json"), "utf8"));
const run = (cmd) => execSync(cmd, { cwd: REPO, stdio: "pipe", encoding: "utf8" });

if (process.argv.includes("--list")) {
  for (const p of manifest.producers) {
    const tag = p.gated ? "GATED " : "ungated";
    console.log(`${tag}  ${p.id}`);
    if (!p.gated) console.log(`         ${p.reason ?? "(no reason recorded — that is itself a defect)"}`);
  }
  process.exit(0);
}

// A gate that has never gone red proves nothing about the tree it just passed.
if (process.argv.includes("--selftest")) {
  const target = "public/interop/agent-card-jws-input.json";
  let bad = 0;
  const orig = readFileSync(join(REPO, target));
  try {
    execSync(`printf '\\n' >> ${target}`, { cwd: REPO });
    const dirty = run(`git status --porcelain -- ${target}`).trim();
    if (!dirty) { console.error("✖ selftest: tampering the output did not show as a git change"); bad++; }
  } finally {
    execSync(`git checkout -- ${target}`, { cwd: REPO });
  }
  const restored = readFileSync(join(REPO, target));
  if (!restored.equals(orig)) { console.error("✖ selftest: failed to restore the tampered file"); bad++; }
  if (bad) { console.error(`✖ producers-check selftest FAILED (${bad})`); process.exit(1); }
  console.log("✓ producers-check selftest: a moved output is detectable, and the tree was restored");
  process.exit(0);
}

const gated = manifest.producers.filter((p) => p.gated);
let failures = 0;
console.log(`producers-check — ${gated.length} gated of ${manifest.producers.length} in the manifest\n`);

for (const p of gated) {
  try {
    if (p.mode === "delegate-to-check") {
      const out = run(p.check).trim().split("\n").pop() ?? "";
      console.log(`  ✓ ${p.id.padEnd(28)} ${out.slice(0, 64)}`);
    } else if (p.mode === "rerun-and-diff") {
      // Compare the WHOLE tree, not just the declared outputs. Watching only `outputs` gives a
      // false green to a producer that writes somewhere it never declared — and leaves that file
      // dirty for every later step in the job. An undeclared output is a manifest bug, so it is
      // reported as one rather than silently tolerated.
      const dirty = () => new Set(
        run("git status --porcelain").trim().split("\n").filter(Boolean).map((l) => l.slice(3).trim()),
      );
      const before = dirty();
      if (p.outputs.some((o) => before.has(o))) {
        // In CI the tree is always clean, so this can only mean an earlier step touched the file.
        // Passing quietly would let a real staleness through, so it counts as a failure.
        failures++;
        console.error(`  ✗ ${p.id.padEnd(28)} CANNOT-CHECK — a declared output was modified before this gate ran`);
        continue;
      }
      run(p.command);
      const moved = [...dirty()].filter((f) => !before.has(f));
      const declared = moved.filter((f) => p.outputs.includes(f));
      const undeclared = moved.filter((f) => !p.outputs.includes(f));
      if (declared.length) {
        failures++;
        console.error(`  ✗ ${p.id.padEnd(28)} STALE — re-running the producer changed its own output:`);
        for (const f of declared) console.error(`      ${f}`);
        console.error(`      fix: ${p.command}`);
      }
      if (undeclared.length) {
        failures++;
        console.error(`  ✗ ${p.id.padEnd(28)} UNDECLARED OUTPUT — the producer also wrote:`);
        for (const f of undeclared) console.error(`      ${f}`);
        console.error(`      fix: add these to "outputs" in docs/operations/PRODUCERS.json`);
      }
      if (moved.length) run(`git checkout -- ${moved.map((f) => `'${f}'`).join(" ")}`);
      else console.log(`  ✓ ${p.id.padEnd(28)} re-ran the producer, tree unchanged`);
    } else {
      failures++;
      console.error(`  ✗ ${p.id}: unknown mode ${p.mode}`);
    }
  } catch (e) {
    failures++;
    console.error(`  ✗ ${p.id.padEnd(28)} ${(e.stdout || e.stderr || e.message || "").toString().trim().split("\n").pop()}`);
  }
}

if (failures) {
  console.error(`\n✗ ${failures} producer(s) disagree with their committed output.`);
  console.error("  The committed bytes are stale — run the producer named above and commit the result.");
  console.error("  Do NOT edit the output by hand: it is a producer artefact.");
  process.exit(1);
}
console.log(`\n✓ every gated producer still yields the committed bytes.`);
