import { afterEach, expect, it } from "vitest";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const marker = "Derived at generation from https://councilof.ai/interop/ots/manifest.json";
const names = ["llms.txt", "llms-full.txt"];
const indexMarker = "Derived at generation from https://councilof.ai/interop/file-index.json";
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "csoai-timestamps-"));
  roots.push(root);
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, "scripts/harness-x"), { recursive: true });
  mkdirSync(join(root, "public/interop/ots"), { recursive: true });
  copyFileSync(resolve(__dirname, "llms-txt.mjs"), join(root, "scripts/llms-txt.mjs"));
  // llms-txt.mjs imports ./internal-links-check.mjs, so the fixture has to carry it too.
  // Without it the producer cannot even start: the run dies on module resolution and the
  // test is measuring a missing file rather than the timestamp behaviour it is about.
  copyFileSync(resolve(__dirname, "internal-links-check.mjs"), join(root, "scripts/internal-links-check.mjs"));
  // And it imports ./harness-x/npm-release-state.mjs, for the npm release's sentences. The same
  // rule applies to every import the producer has: a fixture that copies a module must copy the
  // modules that module imports, or the run dies on resolution and the assertion that follows
  // reports "exit 1" where it means "the fixture was incomplete". (This is how it failed in CI:
  // the fixture was written when llms-txt.mjs had two imports, and gained a third.)
  copyFileSync(
    resolve(__dirname, "harness-x/npm-release-state.mjs"),
    join(root, "scripts/harness-x/npm-release-state.mjs"),
  );
  // And ./llms-txt-distribution.mjs, the distribution section and its print rule (18 Nov 2026).
  copyFileSync(resolve(__dirname, "llms-txt-distribution.mjs"), join(root, "scripts/llms-txt-distribution.mjs"));
  // And the ids of the datasets our own services read, which llms-txt-distribution.mjs reads when it
  // loads (24 Nov 2026): CSOAI's download figures leave those datasets out.
  mkdirSync(join(root, "client/src/data"), { recursive: true });
  copyFileSync(resolve(__dirname, "../client/src/data/hf-self-read-ids.json"), join(root, "client/src/data/hf-self-read-ids.json"));
  for (const name of names) writeFileSync(join(root, "public", name), `BOARD SNAPSHOT ${name}\n## Timestamps\n\n${marker}\nstale\n\n## Evidence\nIMMUTABLE SNAPSHOT ${name}\n## Index\n\n${indexMarker}\nstale index\n\n## End\nIMMUTABLE TAIL\n`);
  writeFileSync(join(root, "public/interop/ots/manifest.json"), JSON.stringify({
    schema: "csoai.ots-manifest/0.4", as_of: "2026-10-11T00:00:00Z",
    counts: { proofs: 7, bitcoin_attested: 5, calendar_pending: 2, subject_absent: 1 },
  }));
  writeFileSync(join(root, "public/interop/file-index.json"), JSON.stringify({
    schema: "csoai.interop-file-index/0.1", as_of: "2026-11-28T00:00:00Z",
    counts: { files: 3, bytes: 12, by_served: { pages: 3 } },
  }));
  const read = (name: string) => readFileSync(join(root, "public", name), "utf8");
  const runMode = (mode: string, ...args: string[]) => spawnSync(process.execPath, [join(root, "scripts/llms-txt.mjs"), mode, ...args], {
    encoding: "utf8", timeout: 5000, env: { ...process.env, CSOAI_BOARD_URL: "http://127.0.0.1:1/unreachable" },
  });
  return { root, read, run: (...args: string[]) => runMode("--timestamps-only", ...args), runBoth: (...args: string[]) => runMode("--timestamps-and-index-only", ...args) };
}

it("refreshes only timestamp text offline and is idempotent", () => {
  const f = fixture();
  const before = names.map(f.read);
  expect(f.run().status).toBe(0);
  names.forEach((name, i) => {
    const after = f.read(name);
    expect(after.slice(0, after.indexOf(marker))).toBe(before[i].slice(0, before[i].indexOf(marker)));
    expect(after.slice(after.indexOf("\n## Evidence"))).toBe(before[i].slice(before[i].indexOf("\n## Evidence")));
    expect(after).toContain("artifact as_of 2026-10-11T00:00:00Z");
    expect(after).toContain("BitcoinBlockHeaderAttestation): 5");
    expect(after).toContain("Still calendar-pending: 2");
  });
  expect(f.run("--check").status).toBe(0);
});

it("check reports drift without writing either file", () => {
  const f = fixture();
  const before = names.map(f.read);
  expect(f.run("--check").status).toBe(1);
  expect(names.map(f.read)).toEqual(before);
});

it("refuses malformed second output before writing the first", () => {
  const f = fixture();
  writeFileSync(join(f.root, "public/llms-full.txt"), "no timestamp boundary\n");
  const before = names.map(f.read);
  expect(f.run().status).toBe(1);
  expect(names.map(f.read)).toEqual(before);
});


it("refreshes timestamps and the file-index section together, preserving other snapshots", () => {
  const f = fixture();
  expect(f.runBoth("--check").status).toBe(1);
  expect(f.runBoth().status).toBe(0);
  for (const name of names) {
    const after = f.read(name);
    expect(after).toContain(`BOARD SNAPSHOT ${name}`);
    expect(after).toContain(`IMMUTABLE SNAPSHOT ${name}`);
    expect(after).toContain("IMMUTABLE TAIL");
    expect(after).toContain("artifact as_of 2026-11-28T00:00:00Z");
    expect(after).toContain("Files indexed: 3. Bytes indexed: 12.");
    expect(after).toContain("measured, signed, certified or true.\n## End");
    expect(after).toContain("Still calendar-pending: 2");
  }
  expect(f.runBoth("--check").status).toBe(0);
});

it("combined refresh validates the second index section before either output is written", () => {
  const f = fixture();
  writeFileSync(join(f.root, "public/llms-full.txt"), f.read("llms-full.txt").replace(indexMarker, "missing index"));
  const before = names.map(f.read);
  expect(f.runBoth().status).toBe(1);
  expect(names.map(f.read)).toEqual(before);
});
