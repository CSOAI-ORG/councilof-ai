#!/usr/bin/env node
/**
 * Overnight honesty status for NEXT_300 #139/#186/#253.
 * Does not invent MEASURED scores. Exit 0 always (status report).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const TARGETS = [
  "csoai/labour-economy-unmeasured",
  "csoai/rwa-testnet-unmeasured",
];

function hasToken() {
  if (process.env.HF_TOKEN && process.env.HF_TOKEN.length > 8) return "env:HF_TOKEN";
  for (const fp of ["/run/secrets/HF_TOKEN", ".hf_token", ".secrets/HF_TOKEN"]) {
    if (existsSync(fp)) return `file:${fp}`;
  }
  const r = spawnSync("hf", ["auth", "whoami"], { encoding: "utf8" });
  if (r.status === 0 && !/not logged in/i.test((r.stdout || "") + (r.stderr || ""))) {
    return "hf-cli-login";
  }
  return null;
}

async function hubExists(repo) {
  const url = `https://huggingface.co/api/datasets/${repo}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "csoai-hf-status" } });
    if (res.status === 200) return "exists";
    if (res.status === 401 || res.status === 403) return "missing-or-private (unauthenticated)";
    if (res.status === 404) return "missing";
    return `http-${res.status}`;
  } catch (e) {
    return `error:${e.message}`;
  }
}

const verify = spawnSync("node", ["scripts/verify-staged-hf.mjs"], { encoding: "utf8" });
console.log("=== verify:staged-hf ===");
console.log((verify.stdout || "").trim().split("\n").slice(-3).join("\n"));
console.log("verify exit", verify.status);

const tok = hasToken();
console.log("\n=== write auth ===");
console.log(tok ? `present (${tok})` : "missing — upload deferred");

console.log("\n=== Hub targets ===");
for (const repo of TARGETS) {
  const st = await hubExists(repo);
  console.log(`${repo}: ${st}`);
}

console.log("\n=== next ===");
if (!tok) {
  console.log("Set HF_TOKEN (or Actions secret) then: npm run hf:upload-staged");
  console.log("Or workflow_dispatch: .github/workflows/hf-upload-staged.yml");
} else {
  console.log("Auth present — run: npm run hf:upload-staged");
  console.log("Then tick NEXT_300 only after Hub shows exists");
}
