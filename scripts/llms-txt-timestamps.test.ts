import { afterEach, expect, it } from "vitest";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const marker = "Derived at generation from https://councilof.ai/interop/ots/manifest.json";
const names = ["llms.txt", "llms-full.txt"];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "csoai-timestamps-"));
  roots.push(root);
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, "public/interop/ots"), { recursive: true });
  copyFileSync(resolve(__dirname, "llms-txt.mjs"), join(root, "scripts/llms-txt.mjs"));
  for (const name of names) writeFileSync(join(root, "public", name), `BOARD SNAPSHOT ${name}\n## Timestamps\n\n${marker}\nstale\n\n## Evidence\nIMMUTABLE SNAPSHOT ${name}\n`);
  writeFileSync(join(root, "public/interop/ots/manifest.json"), JSON.stringify({
    schema: "csoai.ots-manifest/0.4", as_of: "2026-10-11T00:00:00Z",
    counts: { proofs: 7, bitcoin_attested: 5, calendar_pending: 2, subject_absent: 1 },
  }));
  const read = (name: string) => readFileSync(join(root, "public", name), "utf8");
  const run = (...args: string[]) => spawnSync(process.execPath, [join(root, "scripts/llms-txt.mjs"), "--timestamps-only", ...args], {
    encoding: "utf8", timeout: 5000, env: { ...process.env, CSOAI_BOARD_URL: "http://127.0.0.1:1/unreachable" },
  });
  return { root, read, run };
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
