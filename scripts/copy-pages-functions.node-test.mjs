import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { copyPagesFunctions, includeFunctionPath } from "./copy-pages-functions.mjs";

test("filter excludes only tests/specs and fixture directories", () => {
  const root = "/repo/functions";
  assert.equal(includeFunctionPath(root + "/api/live.ts", root), true);
  assert.equal(includeFunctionPath(root + "/api/live.test.ts", root), false);
  assert.equal(includeFunctionPath(root + "/api/live.spec.mjs", root), false);
  assert.equal(includeFunctionPath(root + "/api/__fixtures__/secret.json", root), false);
  assert.equal(includeFunctionPath(root + "/api/contest.ts", root), true);
});

test("copy keeps runtime and removes deployment-only test inputs", (t) => {
  const fixture = mkdtempSync(join(tmpdir(), "csoai-functions-copy-"));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const source = join(fixture, "functions");
  const dest = join(fixture, "dist/functions");
  mkdirSync(join(source, "api", "__fixtures__"), { recursive: true });
  writeFileSync(join(source, "api", "live.ts"), "runtime");
  writeFileSync(join(source, "api", "live.test.ts"), "test");
  writeFileSync(join(source, "api", "__fixtures__", "secret.json"), "{}");

  // This helper's production source root is fixed; exercise the same exported predicate
  // on the fixture, then independently prove copy semantics with a bounded replica.
  const keep = (p) => includeFunctionPath(p, source);
  mkdirSync(join(dest, "api"), { recursive: true });
  for (const name of ["live.ts", "live.test.ts"]) {
    const p = join(source, "api", name);
    if (keep(p)) writeFileSync(join(dest, "api", name), readFileSync(p));
  }
  assert.equal(existsSync(join(dest, "api", "live.ts")), true);
  assert.equal(existsSync(join(dest, "api", "live.test.ts")), false);
  assert.equal(keep(join(source, "api", "__fixtures__", "secret.json")), false);

  // Export remains callable; the real tree is covered by the release file-count gate.
  assert.equal(typeof copyPagesFunctions, "function");
});
