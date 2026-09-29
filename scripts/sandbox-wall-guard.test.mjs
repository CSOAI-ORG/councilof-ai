/**
 * The sandbox wall: nothing from the SovSpace sandbox (proofof.ai) appears on a councilof.ai measurement surface.
 * Sandbox records (reactions, prediction commits, scores, the calibration ledger, the scoreboard), its predictor
 * ids, its twin signing key and its data URLs are refused in the source trees that become councilof.ai, and at
 * deploy on dist/client (scripts/pod-loops/deploy-prod.sh runs the same guard, selftest first).
 */
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { scan, scanText, KNOWN } from "./sandbox-wall-guard.mjs";

// Every schema the sandbox engine emits today (sov_reaction.py, sov_resolve.py, sov_claim_reaction.py). The guard
// refuses them by pattern, so a schema added later is refused without an edit here; this list pins today's set.
const SANDBOX_SCHEMAS = [
  "csoai.sov-reaction/0.1",
  "csoai.sov-score/0.1",
  "csoai.sov-calibration/0.1",
  "csoai.sov-claim-reaction/0.1",
  "csoai.sov-prediction-commit/0.1",
  "csoai.sov-prediction-commit-head/0.1",
  "csoai.sov-claim-score/0.1",
  "csoai.sov-claim-scoreboard/0.1",
];

describe("sandbox-wall-guard", () => {
  it("selftest: every planted marker is caught and the clean fixtures pass", () => {
    const r = spawnSync(process.execPath, ["scripts/sandbox-wall-guard.mjs", "--selftest"], { encoding: "utf8" });
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(JSON.parse(r.stdout.trim().split("\n").pop()).selftest).toBe("ok");
  });

  it("refuses every sandbox schema, in a record or inlined in a bundle", () => {
    for (const s of SANDBOX_SCHEMAS) {
      expect(scanText(JSON.stringify({ schema: s })).map((h) => h.rule), s).toContain("SANDBOX_SCHEMA");
      expect(scanText(`var a="${s}";`).length, s).toBeGreaterThan(0);
    }
  });

  it("allows the measurement-side Sov Signal index and plain links to proofof.ai", () => {
    expect(scanText('{"schema":"csoai.sov-signal-index/1"}')).toEqual([]);
    expect(scanText('<a href="https://proofof.ai">proofof.ai</a> https://proofof.ai/ https://proofof.ai/receipt')).toEqual([]);
  });

  it("refuses sandbox data URLs, the twin key and predictor ids", () => {
    const rules = scanText([
      'fetch("https://proofof.ai/sovspace/latest.json")',
      "https://proofof.ai/scores/2026-09-29.jsonl",
      "did:web:proofof.ai#twin-run-1",
      "climatology-hier/0.2",
    ].join("\n")).map((h) => h.rule);
    expect(rules).toEqual(["SANDBOX_PREDICTOR", "SANDBOX_KEY", "SANDBOX_DATA_URL", "SANDBOX_DATA_URL"]);
  });

  it("a planted sandbox scoreboard in a public-like tree fails the scan (exit 1)", () => {
    const root = mkdtempSync(join(tmpdir(), "wall-"));
    mkdirSync(join(root, "claims"), { recursive: true });
    writeFileSync(join(root, "claims", "scoreboard.json"),
      JSON.stringify({ schema: "csoai.sov-claim-scoreboard/0.1", not_a_measurement: true }));
    const r = spawnSync(process.execPath, ["scripts/sandbox-wall-guard.mjs", root], { encoding: "utf8" });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("REFUSED SANDBOX_SCHEMA");
  });

  it("the measurement surfaces in this repo carry no sandbox bytes; known exceptions are exactly the named ones", () => {
    const r = scan(["public", "functions", "client/src"]);
    expect(r.violations.map((v) => `${v.rule} ${v.where} ${v.match}`)).toEqual([]);
    // Record names, not a count: a swap (one exception fixed, another added) must show up here.
    expect([...r.known.keys()].sort()).toEqual([...KNOWN.keys()].sort());
  });
});
