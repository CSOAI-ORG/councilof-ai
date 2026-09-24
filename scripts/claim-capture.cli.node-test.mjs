import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "scripts/claim-capture.mjs");
const publicReference = join(root, "public/spec/claim-maintenance/v0.1/reference/claim-capture.mjs");

test("published reference bytes match the maintained CLI source", () => {
  assert.deepEqual(readFileSync(publicReference), readFileSync(source));
});

for (const [label, target] of [["source", source], ["public reference", publicReference]]) {
  test(`${label} runs verification when launched through a symlink`, () => {
    const dir = mkdtempSync(join(tmpdir(), "csoai-claim-cli-"));
    try {
      const link = join(dir, "claim-capture.mjs");
      const missing = join(dir, "missing.json");
      symlinkSync(target, link);
      assert.notEqual(link, realpathSync(link));
      const result = spawnSync(process.execPath, [link, "--verify", missing], {
        encoding: "utf8",
        timeout: 5000,
      });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 1, `silent or wrong CLI exit: ${result.stderr}`);
      assert.match(result.stderr, /REJECTED .*missing\.json: not parseable JSON/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}
