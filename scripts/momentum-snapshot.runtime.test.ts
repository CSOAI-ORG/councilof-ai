import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const owned: string[] = [];
afterEach(() => { for (const path of owned.splice(0)) rmSync(path, { recursive: true, force: true }); });

function run(producer: string) {
  const root = mkdtempSync(join(tmpdir(), "csoai-momentum-runtime-"));
  owned.push(root);
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, "functions", "api"), { recursive: true });
  writeFileSync(join(root, "package.json"), JSON.stringify({ type: "module" }));
  // Run the actual wrapper and child; only the producer is a controlled TypeScript fixture.
  for (const name of ["momentum-snapshot.mjs", "momentum-snapshot-run.mjs"])
    writeFileSync(join(root, "scripts", name), readFileSync(join(repository, "scripts", name)));
  writeFileSync(join(root, "functions", "api", "_momentum.ts"), producer);
  const dist = join(root, "dist");
  const result = spawnSync(process.execPath, [join(root, "scripts", "momentum-snapshot.mjs"), dist, "--origin", "https://fixture.invalid"], {
    cwd: repository,
    env: { ...process.env, NODE_OPTIONS: "" },
    encoding: "utf8", timeout: 8000, maxBuffer: 1024 * 1024,
  });
  expect(result.error).toBeUndefined();
  expect(result.signal).toBeNull();
  return { result, output: join(dist, "interop", "momentum-snapshot.json") };
}

describe("momentum snapshot uses the installed TypeScript loader on the current Node runtime", () => {
  it("executes real TypeScript and preserves the producer's original figures and dates", () => {
    const payload = {
      as_of: "2026-10-06T12:00:00Z",
      figures: [{ id: "controlled-source", value: 2, as_of: "2026-10-05T10:00:00Z" }],
      listings: [], omitted: [],
    };
    const { result, output } = run(
      "type Context = { origin: string; now: () => Date };\n" +
      "export async function buildMomentum(context: Context): Promise<unknown> {\n" +
      "if (context.origin !== 'https://fixture.invalid') throw new Error('wrong origin');\n" +
      "return " + JSON.stringify(payload) + ";\n}\n"
    );
    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain("bad option");
    expect(existsSync(output)).toBe(true);
    expect(JSON.parse(readFileSync(output, "utf8"))).toEqual({
      ...payload, snapshot_of: "https://fixture.invalid/api/momentum",
    });
  });

  it("does not write a snapshot when the producer returns no figures", () => {
    const { result, output } = run(
      "export async function buildMomentum(): Promise<unknown> { return { figures: [], listings: [], omitted: [] }; }\n"
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("every source failed; no snapshot written");
    expect(existsSync(output)).toBe(false);
  });

  it("keeps a producer failure nonfatal without pretending a snapshot was written", () => {
    const { result, output } = run(
      "export async function buildMomentum(): Promise<never> { throw new Error('controlled producer failure'); }\n"
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toContain("controlled producer failure");
    expect(result.stdout).toContain("producer did not complete (status 1); no snapshot written, build continues");
    expect(existsSync(output)).toBe(false);
  });
});
