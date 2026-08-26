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
