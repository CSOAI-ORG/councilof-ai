/**
 * The census producer says where it ran, and can name its client without a personal address.
 *
 * scripts/distribution-measure.py runs on the pod as /workspace/lanes/loops/distribution-measure.py;
 * scripts/pod-loops/distribution-measure.py is that copy in the repo. Until 18 Nov 2026 it wrote
 * "host": "rp-3090-now" on every run and sent a User-Agent carrying the owner's email address, so a
 * census measured off the pod (#4464, 07:01-07:22Z) claimed a pod run and sent that address to
 * pepy.tech, api.npmjs.org, huggingface.co and pypistats.org. Both now come from the environment
 * (DISTRIBUTION_MEASURE_HOST, DISTRIBUTION_MEASURE_UA). Unset, they keep the pod's values, so the
 * daily loop behaves exactly as before.
 *
 * Each copy is RUN, not grepped: a comment naming a variable would satisfy a text match while the
 * code ignored it. `--registries ""` measures nothing, so these runs make no request.
 */
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const COPIES = ["scripts/distribution-measure.py", "scripts/pod-loops/distribution-measure.py"];
const READ_UA =
  "import importlib.util, sys; s = importlib.util.spec_from_file_location('m', sys.argv[1]); " +
  "m = importlib.util.module_from_spec(s); s.loader.exec_module(m); print(m.UA)";

/** One copy, run with no registries: the User-Agent it would send, and the host its artifact names. */
function run(copy: string, env: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "distribution-measure-"));
  try {
    writeFileSync(join(dir, "list.json"), "{}");
    const base = { ...process.env };
    delete base.DISTRIBUTION_MEASURE_UA;
    delete base.DISTRIBUTION_MEASURE_HOST;
    const opts = { cwd: ROOT, encoding: "utf8" as const, timeout: 60_000, env: { ...base, ...env } };
    const ua = spawnSync("python3", ["-I", "-B", "-c", READ_UA, copy], opts);
    expect(ua.status, ua.stderr).toBe(0);
    const census = spawnSync("python3", ["-I", "-B", copy, "--now", "--list", join(dir, "list.json"), "--out-dir", dir, "--registries", ""], opts);
    expect(census.status, census.stderr).toBe(0);
    return { ua: ua.stdout.trim(), host: JSON.parse(readFileSync(join(dir, "distribution-latest.json"), "utf8")).host };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("scripts/distribution-measure.py", () => {
  it("is byte-identical to scripts/pod-loops/distribution-measure.py", () => {
    const [repo, pod] = COPIES.map((p) => readFileSync(resolve(ROOT, p)));
    expect(repo.equals(pod), "the two copies of the census producer differ").toBe(true);
  });

  for (const copy of COPIES) {
    it(`${copy} reads DISTRIBUTION_MEASURE_HOST and DISTRIBUTION_MEASURE_UA, and unset keeps the pod's host`, () => {
      const client = "test-client (+https://example.invalid/contact)";
      expect(run(copy, { DISTRIBUTION_MEASURE_HOST: "test-host", DISTRIBUTION_MEASURE_UA: client })).toEqual({ host: "test-host", ua: client });
      const unset = run(copy, {});
      expect(unset.host).toBe("rp-3090-now");
      expect(unset.ua).toMatch(/^councilof\.ai distribution-measure \(/);
    });
  }
});
