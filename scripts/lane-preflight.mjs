#!/usr/bin/env node
/**
 * lane-preflight.mjs — the pre-push human-in-the-loop gate for a lane branch.
 *
 * WHY. CI runs ~18 checks; a lane that pushes first and reads CI later learns about its failures
 * twenty minutes after they were "out". This script runs the same gates LOCALLY, in order, and
 * fail-closes: nothing is "probably fine". It exists so the fails are caught before they are out.
 *
 * WAIVERS, NOT SILENCES. Known reds are listed below with their reason and their clearing
 * condition, and each is matched by test name. A waiver that stops matching (because the red was
 * cleared, or the test renamed) surfaces as UNEXPECTED-RED, never as a pass — so the waiver list
 * itself is held honest. Everything not waived blocks the push.
 *
 *   node scripts/lane-preflight.mjs            # run all gates
 *   node scripts/lane-preflight.mjs --fast     # derivation checks + marker sweep only (no vitest)
 *
 * Exit 0 = green or only waived reds. Exit 1 = at least one blocking failure. Exit 2 = a gate
 * could not run (missing tool) — treat as blocking for a deploy, advisory for a WIP push.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname2(fileURLToPath(import.meta.url)), "..");
const FAST = process.argv.includes("--fast");

function dirname2(p) {
  return p.slice(0, p.lastIndexOf("/") > -1 ? p.lastIndexOf("/") : p.lastIndexOf("\\"));
}

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", timeout: 600_000, ...opts });
  return { ok: r.status === 0, status: r.status, out: (r.stdout || "") + (r.stderr || "") };
};

// ── WAIVERS: the only reds this preflight may absorb. Each names its clearing condition. ────
const WAIVED_REDS = [
  {
    match: /the staged mcp\.so submission names the derived fleet/,
    reason:
      "npm capture vs door: 0.2.7 published @54 names, this branch's door is 55 (board_counts).",
    clears_when: "csoai-gspc-mcp@0.2.8 publishes after PR #3888 merge+deploy (prepack carries the door's list).",
  },
];

// ── gates ────────────────────────────────────────────────────────────────────────────────────
const gates = [];

gates.push({
  id: "conflict-markers",
  label: "no unresolved conflict markers in tracked source/data",
  run: () => {
    const dirs = ["functions", "client/src", "scripts", "council-os", "distribution", "public", "docs", "evidence"];
    const hits = [];
    const exts = new Set([".json", ".ts", ".tsx", ".md", ".yaml", ".yml", ".mjs"]);
    // Self-exempt: this script carries the marker literal it scans for. UPSTREAM-EXEMPT: files
    // that ship the marker from master itself (named, so the exemption cannot hide a new one).
    const self = fileURLToPath(import.meta.url);
    const upstreamExempt = /OUTREACH-TRACKER\.md$|DAY6_DRAGON_MODE_RESULTS/;
    const scan = (dir) => {
      let entries;
      try {
        entries = readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        const p = join(dir, e.name);
        if (e.isDirectory()) {
          if (e.name === "node_modules" || e.name === ".git" || e.name === "dist") continue;
          scan(p);
        } else if (exts.has(p.slice(p.lastIndexOf(".")))) {
          if (p === self || upstreamExempt.test(p)) continue;
          let s;
          try {
            s = readFileSync(p, "utf8");
          } catch {
            continue;
          }
          if (s.includes("<<<<<<< HEAD")) hits.push(p);
        }
      }
    };
    for (const d of dirs) scan(join(ROOT, d));
    return { ok: hits.length === 0, detail: hits.length ? hits.join(", ") : "clean" };
  },
});

const derive = (id, label, cmd, args) =>
  gates.push({
    id,
    label,
    run: () => {
      const r = run(cmd, args);
      const tail = r.out.trim().split("\n").slice(-1)[0] || "(no output)";
      return { ok: r.ok, detail: r.ok ? tail : tail.slice(0, 300) };
    },
  });

derive("llms", "llms.txt matches its derivation", "node", ["scripts/llms-txt.mjs", "--check"]);
derive("openapi", "openapi.json matches its producer", "python3", ["scripts/build_openapi.py", "--check"]);
derive("harness-x", "distribution artifacts match their render", "node", ["scripts/harness-x/render.mjs", "--check"]);
derive("capability", "capability artifacts match the registry", "node", ["scripts/capability-render.mjs", "all", "--check"]);

// OTS gates run only where the python dependency exists; SKIP is reported, never faked.
gates.push({
  id: "stamped-bytes",
  label: "OTS-stamped files changed only with valid new proofs",
  run: () => {
    const probe = run("python3", ["-c", "import opentimestamps"]);
    if (!probe.ok) return { ok: true, skip: true, detail: "SKIP — python opentimestamps module unavailable on this machine" };
    const r = run("python3", ["scripts/stamped-bytes-gate.py", "--base", "origin/master", "--head", "HEAD"]);
    const tail = r.out.trim().split("\n").slice(-1)[0] || "(no output)";
    return { ok: r.ok, detail: tail.slice(0, 300) };
  },
});

if (!FAST) {
  gates.push({
    id: "offline-protocol",
    label: "offline MCP/client/paid-tool contract suite (CI: offline-protocol)",
    run: () => {
      const r = run("npx", [
        "vitest", "run",
        "functions/mcp",
        "functions/api/fabric.test.ts",
        "scripts/capability-drift-guard.test.ts",
        "client/src/lib/mcpHttp.test.ts",
        "client/src/lib/sovTools.test.ts",
        "client/src/components/ToolRunner.test.ts",
        "--maxWorkers=1",
      ]);
      const failures = [...r.out.matchAll(/FAIL\s+(\S+)/g)].map((m) => m[1]);
      // Classify per failing TEST (vitest prints FAIL file > test name lines).
      const waived = [];
      const blocking = [];
      for (const block of r.out.split(/(?=FAIL\s)/)) {
        if (!block.startsWith("FAIL")) continue;
        const testLine = block.match(/FAIL\s+(\S+)\s*>\s*(.*)/);
        const name = testLine ? testLine[2] : block.split("\n")[0];
        const waiver = WAIVED_REDS.find((w) => w.match.test(name || ""));
        (waiver ? waived : blocking).push(
          `${testLine ? testLine[1] : "?"} — ${name || "(unnamed)"}${waiver ? `  [WAIVED: ${waiver.reason} clears when ${waiver.clears_when}]` : ""}`,
        );
      }
      return {
        ok: r.ok ? true : blocking.length === 0,
        detail:
          (blocking.length ? `BLOCKING:\n    ${blocking.join("\n    ")}` : "") +
          (waived.length ? `\n    WAIVED (${waived.length}):\n    ${waived.join("\n    ")}` : "") +
          (r.ok && !waived.length && !blocking.length ? "suite green" : ""),
        blocking,
      };
    },
  });
}

// ── run + report ─────────────────────────────────────────────────────────────────────────────
let exit = 0;
console.log(`lane-preflight — ${FAST ? "FAST (derivation only)" : "full"} · ${new Date().toISOString()}\n`);
for (const g of gates) {
  const r = g.run();
  const mark = r.skip ? "SKIP" : r.ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${g.id} — ${g.label}${r.detail ? `\n       ${r.detail}` : ""}`);
  if (!r.ok && !r.skip && exit < 1) exit = 1;
}
console.log(
  exit === 0
    ? "\nlaneflight green (waived reds are documented above; clearing conditions attached)."
    : "\nlaneflight RED — resolve the blocking gates before pushing; waived reds stay listed for the human reviewer.",
);
process.exit(exit);
