#!/usr/bin/env node
/**
 * Prevent the integrations surface from drifting back into unbound marketing
 * claims. The page may advertise only first-party interfaces it can probe.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const page = readFileSync(join(root, "client", "src", "pages", "Integrations.tsx"), "utf8");

const forbidden = [
  "50+ Integrations",
  "CSOAI Partner Ecosystem",
  "99.9% Uptime Guarantee",
  "status: 'Connected'",
  'status: "Connected"',
];

const required = [
  "/api/gspc",
  "/api/corrections",
  "/mcp",
  "/.well-known/agent-card.json",
  "/api/a2a",
  "/.well-known/x402.json",
  "customer adoption",
  "not an SLA",
];

const failures = [];
for (const value of forbidden) {
  if (page.includes(value)) failures.push(`forbidden unbound claim returned: ${value}`);
}
for (const value of required) {
  if (!page.includes(value)) failures.push(`required measured surface/boundary missing: ${value}`);
}

if (failures.length) {
  console.error("integrations-truth-gate: FAIL");
  for (const failure of failures) console.error("  - " + failure);
  process.exit(1);
}
console.log("integrations-truth-gate: OK — first-party measured interfaces only");
