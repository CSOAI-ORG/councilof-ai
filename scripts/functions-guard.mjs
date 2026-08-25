#!/usr/bin/env node
/**
 * functions-guard.mjs — asserts the live site serves every required /api/* function.
 *
 * WHY THIS EXISTS (Move 12, 2026-08-23): the deploy war between concurrent worktrees
 * keeps dropping /api/* Pages Functions — a thin Vite rebuild overwrites the function
 * bundle, so /api/cards and /api/axis-register silently 404 while / stays 200. This
 * guard converts that into a deploy FAILURE so a function-dropping deploy cannot land.
 *
 * Checks: each REQUIRED_API path must end HTTP 200 (redirects followed) on the host.
 *   (a) /api/gspc            — the board
 *   (b) /api/cards           — signed measurement cards (G4)
 *   (c) /api/axis-register   — the 14-axis registry (13 canonical + jail; Move 24)
 *   (d) /api/mcp             — MCP catalogue
 * Reads nothing secret. Fetches public URLs and asserts. Exit 1 = a function dropped.
 *
 * Run: node scripts/functions-guard.mjs [--host https://councilof.ai]
 */

const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i > 0 ? process.argv[i + 1] : d;
};
const HOST = (arg("host", "https://councilof.ai")).replace(/\/$/, "");
const UA = "CSOAI-functions-guard/1.0";

const REQUIRED_API = [
  "/api/gspc",
  "/api/cards",
  "/api/axis-register",
  "/api/mcp",
  "/api/tools",
  "/api/receipts/latest",
  "/api/dorado",
  "/api/evidence-pack",
];

async function fetchCode(path) {
  try {
    const r = await fetch(`${HOST}${path}`, {
      method: "GET",
      headers: { "user-agent": UA },
      redirect: "follow",
    });
    return r.status;
  } catch (e) {
    return 0;
  }
}

async function main() {
  const fails = [];
  const pass = (m) => console.log(`  ✓ ${m}`);
  const fail = (m) => {
    console.log(`  ✗ ${m}`);
    fails.push(m);
  };

  console.log(`functions-guard: checking ${REQUIRED_API.length} /api functions on ${HOST}\n`);
  for (const p of REQUIRED_API) {
    const code = await fetchCode(p);
    if (code === 200) {
      pass(`${p} -> 200`);
    } else {
      fail(`${p} -> ${code} (function dropped? deploy guard must block this)`);
    }
  }

  console.log("");
  if (fails.length) {
    console.log(
      `functions-guard: RED — ${fails.length} required /api function${fails.length > 1 ? "s" : ""} not serving. ` +
      `A concurrent rebuild dropped the function bundle. Blocking deploy.`
    );
    process.exit(1);
  }
  console.log("functions-guard: GREEN — all required /api functions serving.");
  process.exit(0);
}

main();
