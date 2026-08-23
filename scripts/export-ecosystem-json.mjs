#!/usr/bin/env node
/**
 * export-ecosystem-json.mjs — machine-readable org index from ecosystem.ts
 *
 * Writes:
 *   public/ecosystem.json          — static asset (CDN-cacheable)
 *   functions/data/ecosystem.json    — Pages Functions import at the edge
 *
 * Honesty: recon_status derived from source field — never upgrades modeled → cited.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(ROOT, "client/src/data/ecosystem.ts");

function loadAccounts() {
  const ts = readFileSync(SRC, "utf8");
  const arr = ts.slice(ts.indexOf("export const ECOSYSTEM"));
  const rows = [];
  for (const m of arr.matchAll(/\{[^{}]*\}/g)) {
    try {
      const json = m[0]
        .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
        .replace(/,\s*}/g, "}");
      rows.push(JSON.parse(json));
    } catch {
      /* skip */
    }
  }
  return rows.filter((r) => r.id && r.name);
}

function reconStatus(a) {
  const src = String(a.source || "").toLowerCase();
  if (src === "pending-recon" || src === "n/a") return "pending-recon";
  if (a.posture === "sets-rules" || a.type === "regulator" || a.type === "government") return "cited";
  if (src.includes("http") || src.includes(".com") || src.includes(".gov") || src.includes("sec.gov")) {
    if (src.length > 40 && !src.startsWith("pending")) return "cited";
  }
  if (a.currentVendor && a.currentVendor !== "unknown") return "cited";
  return "modeled";
}

const accounts = loadAccounts().map((a) => ({
  ...a,
  recon_status: reconStatus(a),
  outreach_status: a.outreach_status || "new",
  brief_url: `https://councilof.ai/brief?id=${a.id}`,
  jsonld_url: `https://councilof.ai/api/ecosystem/${a.id}`,
}));

const payload = {
  schema: "csoai.ecosystem-index/0.1",
  generated_at: new Date().toISOString(),
  license: "CC-BY-4.0",
  doctrine:
    "Org-level public data only. Measurement, not certification. recon_status modeled = hypothesis until cited recon.",
  counts: {
    total: accounts.length,
    cited: accounts.filter((a) => a.recon_status === "cited").length,
    modeled: accounts.filter((a) => a.recon_status === "modeled").length,
    pending_recon: accounts.filter((a) => a.recon_status === "pending-recon").length,
    regulators: accounts.filter((a) => a.type === "regulator" || a.type === "government").length,
    enterprises: accounts.filter((a) => ["fortune100", "fortune500", "global2000", "sector"].includes(a.type)).length,
  },
  accounts,
};

const out = JSON.stringify(payload, null, 2);
writeFileSync(resolve(ROOT, "public/ecosystem.json"), out);
mkdirSync(resolve(ROOT, "functions/data"), { recursive: true });
writeFileSync(resolve(ROOT, "functions/data/ecosystem.json"), out);
console.log(`ecosystem index: ${accounts.length} orgs → public/ecosystem.json + functions/data/ecosystem.json`);
