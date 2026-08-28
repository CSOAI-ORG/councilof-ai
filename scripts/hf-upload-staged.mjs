#!/usr/bin/env node
/**
 * Upload staged UNMEASURED HF packs (#139, #186, #253).
 * Requires HF_TOKEN env, secret file, or `hf auth login`.
 * Never invent MEASURED scores — uploads local fixtures only.
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

const PACKS = [
  {
    move: "139/253",
    repo: "csoai/labour-economy-unmeasured",
    local: "datasets/labour-economy-unmeasured",
    message: "UNMEASURED labour/economy manifest — measured_score null",
  },
  {
    move: "186",
    repo: "csoai/rwa-testnet-unmeasured",
    local: "datasets/rwa-testnet-unmeasured",
    message: "TESTNET UNMEASURED RWA catalog — no fake MEASURED scores",
  },
];

const TOKEN_FILES = [
  "/run/secrets/HF_TOKEN",
  join(root, ".hf_token"),
  join(root, ".secrets/HF_TOKEN"),
];

function loadTokenFromFiles() {
  for (const fp of TOKEN_FILES) {
    if (!existsSync(fp)) continue;
    const t = readFileSync(fp, "utf8").trim();
    if (t.length > 8) {
      process.env.HF_TOKEN = t;
      return fp;
    }
  }
  return null;
}

function hfAuthOk() {
  if (process.env.HF_TOKEN && process.env.HF_TOKEN.length > 8) return true;
  const r = spawnSync("hf", ["auth", "whoami"], { encoding: "utf8" });
  return r.status === 0 && !/not logged in/i.test(r.stdout + r.stderr);
}

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", env: process.env, ...opts });
}

function main() {
  const fromFile = loadTokenFromFiles();
  if (fromFile) console.log(`hf-upload-staged: loaded token from ${fromFile}`);

  if (!hfAuthOk()) {
    console.error("hf-upload-staged: no HF write auth.");
    console.error("  Set HF_TOKEN, place it in /run/secrets/HF_TOKEN, or: hf auth login");
    console.error("  MCP OAuth (read-mcp) cannot push — see docs/HF_UPLOAD_RUNBOOK.md");
    process.exit(2);
  }

  // Preflight honesty gate
  run("node scripts/verify-staged-hf.mjs");

  for (const pack of PACKS) {
    const dir = join(root, pack.local);
    if (!existsSync(dir)) {
      console.error(`Missing staged pack: ${pack.local}`);
      process.exit(1);
    }
    console.log(`\n=== NEXT_300 #${pack.move} → ${pack.repo} ===`);
    run(`hf repos create ${pack.repo} --type dataset --exist-ok`);
    run(
      `hf upload ${pack.repo} ${dir} --repo-type dataset --commit-message "${pack.message}"`,
    );
    console.log(`Uploaded ${pack.repo}`);
  }

  console.log("\nhf-upload-staged OK — verify with hf_fs stat on both repos, then tick NEXT_300.");
}

main();
