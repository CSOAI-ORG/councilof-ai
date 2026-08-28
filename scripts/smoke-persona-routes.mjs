#!/usr/bin/env node
/**
 * Persona entry-route smoke — Council OS surface map from docs/COUNCIL_OS_HARMONY.md.
 * Curl-only; no invented scores. Run with vite on :43125 (+ honesty API for /api/*).
 */
const BASE = process.env.BASE_URL || "http://127.0.0.1:43125";
const API = process.env.HONESTY_API_BASE || "http://127.0.0.1:3001";

const PERSONA_ROUTES = [
  { persona: "regulator", path: "/government" },
  { persona: "regulator", path: "/indices" },
  { persona: "regulator", path: "/gspc-verify" },
  { persona: "enterprise", path: "/enterprise" },
  { persona: "enterprise", path: "/dashboard" },
  { persona: "enterprise", path: "/products" },
  { persona: "insurer", path: "/insurers" },
  { persona: "insurer", path: "/indices" },
  { persona: "developer", path: "/mcp-fleet" },
  { persona: "developer", path: "/agent-runbook" },
  { persona: "player", path: "/sov-os" },
  { persona: "player", path: "/gspc-arena" },
  { persona: "operator", path: "/os" },
  { persona: "operator", path: "/engine-axis" },
];

const API_CHECKS = [
  { path: "/api/indices", expect: (j) => j.register === "UNMEASURED" },
  { path: "/api/rwa-attestation", expect: (j) => j.measured_score === null || j.register === "UNMEASURED" },
  { path: "/api/mcp", expect: (j) => Array.isArray(j.servers) && j.servers.length >= 200 },
  { path: "/api/health", expect: (j) => j.ok === true },
];

const checks = [];
const ok = (name, pass, detail = "") => {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "  PASS" : "  FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

async function httpCode(url) {
  const r = await fetch(url, { redirect: "manual" });
  return r.status;
}

try {
  for (const { persona, path } of PERSONA_ROUTES) {
    const status = await httpCode(`${BASE}${path}`);
    ok(`${persona} ${path}`, status === 200 || status === 304, `HTTP ${status}`);
  }

  for (const { path, expect } of API_CHECKS) {
    const r = await fetch(`${API}${path}`);
    const j = await r.json();
    ok(`API ${path}`, r.ok && expect(j), `HTTP ${r.status}`);
  }
} catch (e) {
  ok("fetch", false, String(e.message ?? e));
}

const failed = checks.filter((c) => !c.pass);
console.log(`\n${checks.length - failed.length}/${checks.length} persona-route checks passed`);
if (failed.length) {
  console.error("Start: npm run dev  (vite :43125 + honesty :3001)");
  process.exit(1);
}
