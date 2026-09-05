/**
 * bundle.test.mjs — the published single-file build must be the source, not a cousin of it.
 *
 * The curl quickstart hands people ONE file. If that file drifted from src/ — an edit landed
 * in the source and the bundle was not rebuilt — then the thing everyone runs is not the
 * thing anyone reviewed. Two assertions close that gap: the committed bundle must be
 * byte-identical to a fresh build, and it must return the same verdict as the library on
 * every fixture, including every failing one.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const PUBLISHED = join(root, "..", "..", "public", "verifier", "gspc-verify.mjs");
const PUBLISHED_CHAIN = join(root, "..", "..", "public", "signed", "chain.json");

test("the published bundle is byte-identical to a fresh build of src/", () => {
  const tmp = join(mkdtempSync(join(tmpdir(), "gspc-bundle-")), "gspc-verify.mjs");
  execFileSync(process.execPath, [join(root, "scripts", "bundle.mjs"), tmp], { encoding: "utf8" });
  assert.equal(
    readFileSync(tmp, "utf8"),
    readFileSync(PUBLISHED, "utf8"),
    "public/verifier/gspc-verify.mjs is stale — run `npm run bundle`",
  );
});

test("the bundle agrees with the library on every fixture, failures included", () => {
  const run = (bin, file) => {
    try {
      return { code: 0, out: execFileSync(process.execPath, [bin, file], { encoding: "utf8" }) };
    } catch (e) {
      return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
    }
  };
  const fixtures = readdirSync(join(here, "fixtures")).filter((f) => /^\d\d-/.test(f)).sort();
  assert.ok(fixtures.length >= 9, "fixtures are missing");
  let sawInvalid = 0, sawUncheckable = 0;
  for (const f of fixtures) {
    const file = join(here, "fixtures", f);
    const lib = run(join(root, "bin", "gspc-verify.mjs"), file);
    const bun = run(PUBLISHED, file);
    assert.equal(bun.code, lib.code, `exit code differs for ${f}`);
    assert.equal(bun.out, lib.out, `output differs for ${f}`);
    if (lib.code === 1) sawInvalid++;
    if (lib.code === 2) sawUncheckable++;
  }
  // Agreement is worthless if every fixture passes. Assert the comparison covered failures.
  assert.ok(sawInvalid >= 3, `expected at least 3 INVALID fixtures, saw ${sawInvalid}`);
  assert.ok(sawUncheckable >= 4, `expected at least 4 UNCHECKABLE fixtures, saw ${sawUncheckable}`);
});

test("the source and published CLIs verify the signed chain envelope itself", () => {
  for (const bin of [join(root, "bin", "gspc-verify.mjs"), PUBLISHED]) {
    const out = execFileSync(process.execPath, [bin, PUBLISHED_CHAIN], { encoding: "utf8" });
    assert.match(out, /VALID 1 · INVALID 0 · UNCHECKABLE 0/);
  }
});

test("--chain accepts the published envelope body and text output never crashes on withheld reporting", () => {
  const chain = JSON.parse(readFileSync(PUBLISHED_CHAIN, "utf8"));
  const held = chain.body.links.find((link) => link.body_published && link.card_url);
  assert.ok(held, "published chain must name at least one published body");
  const card = join(root, "..", "..", "public", held.card_url.replace(/^\//, ""));

  for (const bin of [join(root, "bin", "gspc-verify.mjs"), PUBLISHED]) {
    let result;
    try {
      result = { code: 0, out: execFileSync(process.execPath, [bin, card, "--chain", PUBLISHED_CHAIN], { encoding: "utf8" }) };
    } catch (error) {
      result = { code: error.status, out: (error.stdout || "") + (error.stderr || "") };
    }
    assert.equal(result.code, 3, "withheld bodies remain an incomplete local verification, not a crash");
    assert.match(result.out, /manifest: \d+ positions/);
    assert.match(result.out, /\d+ withheld/);
    assert.doesNotMatch(result.out, /TypeError/);
  }
});
