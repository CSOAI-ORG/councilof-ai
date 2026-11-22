// The Pages per-file cap is a platform fact, pinned here so it cannot drift (22 Nov 2026).
//
// public/cards-bundle.json reached 24,635,449 of 26,214,400 bytes before anyone was told: the guard
// had the right cap but printed nothing until a file was over it. These tests hold the numbers and
// the behaviour: a file AT the cap is accepted, one byte more is refused by name, and a file above
// 80% of the cap is named in the log while there is still room.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, truncateSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { PAGES_FILE_BYTES_CAP, PAGES_FILE_BYTES_WARN, PAGES_FILE_COUNT_CAP, PAGES_FILE_COUNT_WARN } from "./pages-limits.mjs";

const GUARD = fileURLToPath(new URL("./pages-size-guard.mjs", import.meta.url));
const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** A tree with one file of exactly `size` bytes. truncate makes it sparse, so no real disk is used. */
function treeWith(size: number, name = "data/big.json"): string {
  const dir = mkdtempSync(join(tmpdir(), "pages-size-guard-"));
  dirs.push(dir);
  mkdirSync(join(dir, "data"), { recursive: true });
  const file = join(dir, name);
  writeFileSync(file, "");
  truncateSync(file, size);
  writeFileSync(join(dir, "index.html"), "<!doctype html>");
  return dir;
}
const guard = (dir: string) => spawnSync(process.execPath, [GUARD, dir], { encoding: "utf8", timeout: 30_000 });

describe("Cloudflare Pages limits are pinned", () => {
  it("the per-file cap is 25 MiB = 26,214,400 bytes and the early warning is 80% of it", () => {
    expect(PAGES_FILE_BYTES_CAP).toBe(26_214_400);
    expect(PAGES_FILE_BYTES_CAP).toBe(25 * 1024 * 1024);
    expect(PAGES_FILE_BYTES_WARN).toBe(20_971_520);
    expect(PAGES_FILE_BYTES_WARN / PAGES_FILE_BYTES_CAP).toBe(0.8);
    expect(PAGES_FILE_COUNT_CAP).toBe(20_000);
    expect(PAGES_FILE_COUNT_WARN).toBe(19_000);
  });

  it("a file of exactly the cap passes, and is named as near the cap", () => {
    const r = guard(treeWith(PAGES_FILE_BYTES_CAP));
    expect(r.status, r.stderr).toBe(0);
    expect(r.stderr).toMatch(/data\/big\.json — 25\.0 MiB, 100\.0% of the 25 MiB per-file cap \(0 bytes left\)/);
  });

  it("one byte over the cap goes red and names the file", () => {
    const r = guard(treeWith(PAGES_FILE_BYTES_CAP + 1));
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/1 file\(s\) exceed Cloudflare Pages' 25 MiB limit/);
    expect(r.stderr).toMatch(/data\/big\.json — 25\.0 MiB/);
  });

  it("above 80% of the cap a file is named with its share; at or below it the log stays quiet", () => {
    const near = guard(treeWith(PAGES_FILE_BYTES_WARN + 1));
    expect(near.status, near.stderr).toBe(0);
    expect(near.stderr).toMatch(/! pages-size-guard: data\/big\.json — 20\.0 MiB, 80\.0% of the 25 MiB per-file cap/);
    const quiet = guard(treeWith(PAGES_FILE_BYTES_WARN));
    expect(quiet.status, quiet.stderr).toBe(0);
    expect(quiet.stderr).not.toMatch(/per-file cap/);
  });
});
