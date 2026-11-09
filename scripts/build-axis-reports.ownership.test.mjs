import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { writeTree, canonicalHash, SCHEMA_INDEX } from "./build-axis-reports.mjs";

// Synthetic local inputs; the injected verifier is fixture-only. No signed
// production card or live measurement is asserted by this filesystem test.
function fixture(t) {
  const repo = mkdtempSync(join(tmpdir(), "axis-report-ownership-"));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const put = (path, content) => {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), typeof content === "string" ? content : JSON.stringify(content));
  };
  const card = "a".repeat(64);
  put("public/signed/card-matrix.json", { as_of: "2026-11-04T00:00:00Z", cells: [{ model: "Example", axis: "fixture", card }] });
  put(`public/signed/cards/${card}.json`, { body: { axis: "fixture", status: "MEASURED", n: 31, created: "2026-11-04T00:00:00Z", rows: [] } });
  put("client/src/data/regulator-crosswalk.json", { axes: { fixture: { board_axis: "fixture", pointers: [] } } });
  const run = (extra = {}) => writeTree({ repo, slots: [{ axis: "fixture", kind: "model-comparison", status: "MEASURED", n: 31 }], verify: async () => ({ state: "VALID" }), ...extra });
  const clear = () => put("public/signed/card-matrix.json", { as_of: "2026-11-04T00:00:00Z", cells: [] });
  const read = path => readFileSync(join(repo, path), "utf8");
  const rewriteIndex = edit => {
    const index = JSON.parse(read("public/reports/index.json"));
    edit(index);
    index.canonical_sha256 = canonicalHash(index);
    put("public/reports/index.json", index);
  };
  return { repo, put, run, clear, read, rewriteIndex };
}

test("daily archives and unrelated nested files survive generation and check", async t => {
  const f = fixture(t);
  f.put("public/reports/daily-signal/2026-11-04.json", "daily archive sentinel\n");
  f.put("public/reports/daily-signal/archive/source.txt", "nested sentinel\n");
  f.put("public/reports/other-producer.json", "top-level sentinel\n");
  assert.equal((await f.run()).ok, true);
  assert.equal((await f.run({ check: true })).ok, true);
  assert.equal(f.read("public/reports/daily-signal/2026-11-04.json"), "daily archive sentinel\n");
  assert.equal(f.read("public/reports/daily-signal/archive/source.txt"), "nested sentinel\n");
  assert.equal(f.read("public/reports/other-producer.json"), "top-level sentinel\n");
});

test("obsolete owned reports are removed and empty subject directory is removed", async t => {
  const f = fixture(t);
  await f.run();
  assert.ok(existsSync(join(f.repo, "public/reports/example/fixture.json")));
  f.clear();
  const check = await f.run({ check: true });
  assert.equal(check.ok, false);
  assert.ok(check.stale.includes("example/fixture.json (orphan)"));
  assert.ok(existsSync(join(f.repo, "public/reports/example/fixture.json")), "check must be read-only");
  await f.run();
  assert.equal(existsSync(join(f.repo, "public/reports/example")), false);
  assert.equal((await f.run({ check: true })).ok, true);
});

test("unowned file within a retired subject directory is preserved", async t => {
  const f = fixture(t);
  await f.run();
  f.put("public/reports/example/another-producer.json", "preserve me\n");
  f.clear();
  await f.run();
  assert.equal(f.read("public/reports/example/another-producer.json"), "preserve me\n");
  assert.equal(existsSync(join(f.repo, "public/reports/example/fixture.md")), false);
});

test("missing obsolete owned file does not block bounded cleanup", async t => {
  const f = fixture(t);
  await f.run();
  rmSync(join(f.repo, "public/reports/example/fixture.json"));
  f.clear();
  assert.equal((await f.run()).ok, true);
  assert.equal(existsSync(join(f.repo, "public/reports/example")), false);
});

test("malformed or wrong-schema previous index fails before modifying any report", async t => {
  const f = fixture(t);
  await f.run();
  const original = f.read("public/reports/example/fixture.json");
  f.clear();
  for (const bad of ["{broken", { schema: "another-producer", reports: [] }]) {
    f.put("public/reports/index.json", bad);
    const index = f.read("public/reports/index.json");
    await assert.rejects(f.run(), /previous index/);
    assert.equal(f.read("public/reports/index.json"), index);
    assert.equal(f.read("public/reports/example/fixture.json"), original);
  }
});

test("modified index content without matching canonical digest fails closed", async t => {
  const f = fixture(t);
  await f.run();
  const index = JSON.parse(f.read("public/reports/index.json"));
  index.reports = [];
  f.put("public/reports/index.json", index);
  await assert.rejects(f.run(), /previous index/);
  assert.ok(existsSync(join(f.repo, "public/reports/example/fixture.json")));
});

test("traversal or mismatched previous path is rejected before cleanup", async t => {
  for (const edit of [
    index => { index.reports[0].slug = ".."; },
    index => { index.reports[0].path_json = "/reports/daily-signal/2026-11-04.json"; },
    index => { index.reports.push(index.reports[0]); },
  ]) {
    const f = fixture(t);
    await f.run();
    f.put("public/reports/daily-signal/2026-11-04.json", "sentinel\n");
    f.rewriteIndex(edit);
    const before = f.read("public/reports/index.json");
    f.clear();
    await assert.rejects(f.run(), /invalid|ambiguous/);
    assert.equal(f.read("public/reports/index.json"), before);
    assert.equal(f.read("public/reports/daily-signal/2026-11-04.json"), "sentinel\n");
  }
});

test("new candidate cannot overwrite a pre-existing unowned file", async t => {
  const f = fixture(t);
  f.put("public/reports/example/fixture.json", "another producer\n");
  await assert.rejects(f.run(), /unowned file/);
  assert.equal(f.read("public/reports/example/fixture.json"), "another producer\n");
  assert.equal(existsSync(join(f.repo, "public/reports/index.json")), false);
});

test("owned file and subject-directory symlinks are rejected without following them", async t => {
  for (const isDirectory of [false, true]) {
    const f = fixture(t);
    await f.run();
    const target = join(f.repo, "outside");
    mkdirSync(target);
    writeFileSync(join(target, "fixture.json"), "outside sentinel\n");
    const relative = isDirectory ? "public/reports/example" : "public/reports/example/fixture.json";
    rmSync(join(f.repo, relative), { recursive: isDirectory });
    symlinkSync(isDirectory ? target : join(target, "fixture.json"), join(f.repo, relative));
    const before = f.read("public/reports/index.json");
    f.clear();
    await assert.rejects(f.run(), /unsafe output path/);
    assert.equal(readFileSync(join(target, "fixture.json"), "utf8"), "outside sentinel\n");
    assert.equal(f.read("public/reports/index.json"), before);
  }
});

test("unrelated symlink remains untouched and is not traversed for size accounting", async t => {
  const f = fixture(t);
  f.put("outside/sentinel.txt", "outside sentinel\n");
  mkdirSync(join(f.repo, "public/reports"), { recursive: true });
  symlinkSync(join(f.repo, "outside"), join(f.repo, "public/reports/unrelated"));
  assert.equal((await f.run()).ok, true);
  assert.equal(f.read("outside/sentinel.txt"), "outside sentinel\n");
  assert.equal((await f.run({ check: true })).ok, true);
});

test("a symlinked previous index and reports root are rejected", async t => {
  for (const indexLink of [false, true]) {
    const f = fixture(t);
    f.put("outside/sentinel.txt", "outside sentinel\n");
    if (indexLink) {
      const index = { schema: SCHEMA_INDEX, reports: [] };
      index.canonical_sha256 = canonicalHash(index);
      f.put("outside/index.json", index);
      mkdirSync(join(f.repo, "public/reports"), { recursive: true });
      symlinkSync(join(f.repo, "outside/index.json"), join(f.repo, "public/reports/index.json"));
    } else {
      symlinkSync(join(f.repo, "outside"), join(f.repo, "public/reports"));
    }
    await assert.rejects(f.run(), /unsafe output path/);
    assert.equal(f.read("outside/sentinel.txt"), "outside sentinel\n");
  }
});
