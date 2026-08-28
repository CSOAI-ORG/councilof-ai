#!/usr/bin/env node
/**
 * Upload staged UNMEASURED HF packs (#139, #186, #253).
 *
 * Auth (any one):
 *   - HF_TOKEN env / secret file / `hf auth login` (can create repos)
 *   - GitHub Actions Trusted Publisher OIDC (`HF_UPLOAD_MODE=oidc`)
 *     — repos must already exist; JWT cannot create_repo
 *
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
    oidcResource: "datasets/csoai/labour-economy-unmeasured",
    local: "datasets/labour-economy-unmeasured",
    message: "UNMEASURED labour/economy manifest — measured_score null",
  },
  {
    move: "186",
    repo: "csoai/rwa-testnet-unmeasured",
    oidcResource: "datasets/csoai/rwa-testnet-unmeasured",
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

function tokenLooksJwt(t) {
  return typeof t === "string" && /^hf_jwt_/i.test(t.trim());
}

function hfAuthOk() {
  if (process.env.HF_TOKEN && process.env.HF_TOKEN.length > 8) return true;
  const r = spawnSync("hf", ["auth", "whoami"], { encoding: "utf8" });
  return r.status === 0 && !/not logged in/i.test(r.stdout + r.stderr);
}

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...opts.env }, ...opts });
}

function resolveMode() {
  const raw = (process.env.HF_UPLOAD_MODE || "auto").toLowerCase();
  if (raw === "oidc" || raw === "token") return raw;
  if (process.env.HF_OIDC_RESOURCE || process.env.ACTIONS_ID_TOKEN_REQUEST_URL) {
    if (!process.env.HF_TOKEN || tokenLooksJwt(process.env.HF_TOKEN)) return "oidc";
  }
  if (process.env.HF_TOKEN && tokenLooksJwt(process.env.HF_TOKEN)) return "oidc";
  if (process.env.HF_SKIP_CREATE === "1") return "oidc";
  return "token";
}

function uploadPackToken(pack, dir, skipCreate) {
  if (!skipCreate) {
    run(`hf repos create ${pack.repo} --type dataset --exist-ok`);
  }
  run(
    `hf upload ${pack.repo} ${dir} --repo-type dataset --commit-message "${pack.message}"`,
  );
}

function uploadPackOidc(pack, dir) {
  // Repo-scoped OIDC token: one resource per upload step.
  const env = {
    ...process.env,
    HF_OIDC_RESOURCE: pack.oidcResource,
  };
  // Drop a long-lived secret so the CLI prefers OIDC exchange when available.
  delete env.HF_TOKEN;
  run(
    `hf upload ${pack.repo} ${dir} --repo-type dataset --commit-message "${pack.message}"`,
    { env },
  );
}

function main() {
  const fromFile = loadTokenFromFiles();
  if (fromFile) console.log(`hf-upload-staged: loaded token from ${fromFile}`);

  const mode = resolveMode();
  console.log(`hf-upload-staged: mode=${mode}`);

  if (mode === "token" && !hfAuthOk()) {
    console.error("hf-upload-staged: no HF write auth.");
    console.error("  Set HF_TOKEN, place it in /run/secrets/HF_TOKEN, or: hf auth login");
    console.error("  Or use HF_UPLOAD_MODE=oidc after Hub Trusted Publishers are configured");
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
    console.log(`\n=== NEXT_300 #${pack.move} → ${pack.repo} (${mode}) ===`);
    if (mode === "oidc") {
      uploadPackOidc(pack, dir);
    } else {
      const skipCreate =
        process.env.HF_SKIP_CREATE === "1" || tokenLooksJwt(process.env.HF_TOKEN);
      uploadPackToken(pack, dir, skipCreate);
    }
    console.log(`Uploaded ${pack.repo}`);
  }

  console.log("\nhf-upload-staged OK — verify with hf_fs stat on both repos, then tick NEXT_300.");
}

main();
