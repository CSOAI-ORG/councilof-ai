// committed-bytes.node-test.mjs — the two edge generators can now be ASKED whether the
// committed bytes still match a fresh generation.
//
// WHY THIS FILE EXISTS. On 2026-11-06 the committed public/sitemap.xml listed 536 URLs while
// the build produced 535, and the committed public/_redirects still carried a
// `/mcp  /mcp/  308` rule for a route that #3847 (857a6cc02) had moved out of App.tsx into a
// Pages Function. The LIVE site was correct — the live sitemap was set-identical to a fresh
// generation — and the committed artefacts were the fiction, rewritten in place by every
// deploy. Nothing noticed, because nothing compared the two.
//
// A gate that has never gone red proves nothing about the tree it just passed, so this file
// proves the DETECTION works, in both directions, and that check mode never writes.
//
// The first two tests assert the estate's invariant — committed bytes == a fresh generation —
// so on a tree whose committed sitemap or redirect table is stale they go RED. That is the
// finding, not a flake: the same drift that fails scripts/producers-check.mjs fails here.
//
// node:test file vitest cannot collect, so it is named in NODE_TEST_FILES in vitest.config.ts
// and pr-gates.yml runs it under `node --test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITEMAP = join(ROOT, "public/sitemap.xml");
const REDIRECTS = join(ROOT, "public/_redirects");

// An UNTRACKED probe page. It is not a tracked byte, so nothing here can corrupt a commit:
// the drift it induces is real drift (the committed sitemap no longer describes the tree),
// and removing the probe restores the tree exactly.
const PROBE = join(ROOT, "public/zzz-committed-bytes-probe.html");
const PROBE_URL = "https://councilof.ai/zzz-committed-bytes-probe";

function run(script, args = []) {
  try {
    const out = execFileSync("node", [join(ROOT, "scripts", script), ...args], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, out: `${out}` };
  } catch (e) {
    return { code: typeof e.status === "number" ? e.status : 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

test("the committed sitemap matches a fresh generation", () => {
  const r = run("generate-sitemap.mjs", ["--check"]);
  assert.equal(r.code, 0, `public/sitemap.xml is stale:\n${r.out}`);
});

test("the committed redirect table matches a fresh generation", () => {
  const r = run("generate-redirects.mjs", ["--check"]);
  assert.equal(r.code, 0, `public/_redirects is stale:\n${r.out}`);
});

test("the sitemap check detects drift and names the URL that drifted", () => {
  writeFileSync(PROBE, "<!doctype html><title>probe</title>\n");
  try {
    const r = run("generate-sitemap.mjs", ["--check"]);
    assert.equal(r.code, 1, `drift was not detected:\n${r.out}`);
    assert.ok(r.out.includes(PROBE_URL), `the check did not name the drifted URL:\n${r.out}`);
    assert.ok(r.out.includes("generated but not listed"), "the check did not say which way it drifted");
  } finally {
    rmSync(PROBE, { force: true });
  }
});

test("the redirect check detects drift and names the rule that drifted", () => {
  // The redirect table is a tracked file, so this tamper is undone in the same breath.
  // The estate's producers-check --selftest uses the same pattern.
  const original = readFileSync(REDIRECTS, "utf8");
  const DEAD = "/zzz-committed-bytes-probe  /zzz-committed-bytes-probe/  308";
  writeFileSync(REDIRECTS, `${original}\n${DEAD}\n`);
  try {
    const r = run("generate-redirects.mjs", ["--check"]);
    assert.equal(r.code, 1, `drift was not detected:\n${r.out}`);
    assert.ok(r.out.includes(DEAD), `the check did not name the drifted rule:\n${r.out}`);
  } finally {
    writeFileSync(REDIRECTS, original);
  }
  assert.equal(readFileSync(REDIRECTS, "utf8"), original, "the redirect table was not restored");
});

test("check mode never writes the file it is checking", () => {
  const before = [readFileSync(SITEMAP, "utf8"), readFileSync(REDIRECTS, "utf8")];
  run("generate-sitemap.mjs", ["--check"]);
  run("generate-redirects.mjs", ["--check"]);
  const after = [readFileSync(SITEMAP, "utf8"), readFileSync(REDIRECTS, "utf8")];
  assert.equal(after[0], before[0], "checking the sitemap modified public/sitemap.xml");
  assert.equal(after[1], before[1], "checking the redirects modified public/_redirects");
});

test("check mode reports UNCHECKABLE, not a finding, when an input is absent", () => {
  // Exit 2 is UNCHECKABLE: the store could not answer, so it makes no claim about the file.
  // The estate's vocabulary is three-state, and an unreadable store is not a stale artefact.
  const src = readFileSync(join(ROOT, "scripts/generate-sitemap.mjs"), "utf8");
  assert.ok(src.includes('process.exit(2)'), "the sitemap check has no UNCHECKABLE exit");
  assert.ok(
    src.includes("functions/ is absent") && src.includes("public/_redirects is absent"),
    "the sitemap check does not name the inputs it cannot do without",
  );
  assert.ok(existsSync(join(ROOT, "functions")), "functions/ should exist in a full checkout");
});
