import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const STAGER = join(ROOT, "scripts", "stage-public-root-interop.sh");
const temporary = [];

afterEach(() => {
  for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true });
});

function repository(files) {
  const dir = mkdtempSync(join(tmpdir(), "public-root-stage-"));
  temporary.push(dir);
  execFileSync("git", ["init", "-q"], { cwd: dir });
  for (const path of files) {
    const full = join(dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, `${path}\n`);
  }
  return dir;
}

const required = [
  "public/interop/root-witness-latest.json",
  "public/interop/root-witness-pointer.json",
  "public/interop/root-witness-2026-09-04-deadbeef.json",
];

describe("public-root interop staging", () => {
  it("stages Rekor and OTS receipts when the optional EAS log is absent", () => {
    const dir = repository([
      ...required,
      "public/interop/rekor-root-deadbeef.json",
      "public/interop/root-deadbeef.json.ots",
      "public/interop/witness/request-1.json",
    ]);

    execFileSync("bash", [STAGER], { cwd: dir });
    const staged = execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: dir, encoding: "utf8" })
      .trim().split("\n").filter(Boolean).sort();

    expect(staged).toEqual([
      ...required,
      "public/interop/rekor-root-deadbeef.json",
      "public/interop/root-deadbeef.json.ots",
      "public/interop/witness/request-1.json",
    ].sort());
    expect(staged).not.toContain("public/interop/eas-root-attestations.json");
  });

  it("succeeds when every optional receipt group is absent", () => {
    const dir = repository(required);
    execFileSync("bash", [STAGER], { cwd: dir });
    const staged = execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: dir, encoding: "utf8" });
    for (const path of required) expect(staged).toContain(path);
  });

  it("fails closed when a required witness pointer is absent", () => {
    const dir = repository(required.filter((path) => !path.endsWith("root-witness-pointer.json")));
    const result = spawnSync("bash", [STAGER], { cwd: dir, encoding: "utf8" });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("required public-root witness output is missing");
  });
});
