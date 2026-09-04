/**
 * One registry, N doors — and the doors must agree with it.
 *
 * Measured 2026-09-04, before this guard existed: openapi.json carried 67 paths, /mcp advertised
 * 12 tools of which 10 appeared in no other door, and the A2A agent-card declared 5 skills that
 * appeared in none. 84 capabilities, and every one of them was reachable through exactly ONE
 * door. An agent's view of the estate depended entirely on which door it knocked on, which is the
 * opposite of interoperability.
 *
 * This guard compares each live door against capabilities/registry.json and fails on drift.
 *   node scripts/capability-drift-guard.mjs --selftest
 *   node scripts/capability-drift-guard.mjs [--base https://councilof.ai] [--warn]
 */
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const BASE = (args.includes("--base") ? args[args.indexOf("--base") + 1] : "https://councilof.ai").replace(/\/$/, "");
const WARN_ONLY = args.includes("--warn");

const idOf = (s) => String(s ?? "").trim().toLowerCase().replace(/[-\s.]/g, "_").replace(/^api_/, "");

/** Which capability ids each door SHOULD expose, per the registry. */
export function expected(registry) {
  const out = { http: new Set(), mcp: new Set(), a2a: new Set() };
  for (const c of registry.capabilities ?? []) {
    for (const p of c.protocols ?? []) if (out[p]) out[p].add(idOf(c.id));
  }
  return out;
}

/** What each door ACTUALLY exposes. */
export function observed({ openapi, mcp, agentCard }) {
  return {
    http: new Set(Object.keys(openapi?.paths ?? {}).map((p) => idOf(p.replace(/^\//, "").replace(/^api\//, "").replace(/\//g, "_")) || "root")),
    mcp: new Set(((mcp?.result?.tools) ?? []).map((t) => idOf(t.name))),
    a2a: new Set(((agentCard?.skills) ?? []).map((s) => idOf(s.id ?? s.name))),
  };
}

export function diff(exp, obs) {
  const report = {};
  for (const door of ["http", "mcp", "a2a"]) {
    const missing = [...exp[door]].filter((x) => !obs[door].has(x));   // promised, not served
    const extra = [...obs[door]].filter((x) => !exp[door].has(x));     // served, not registered
    report[door] = { missing, extra, ok: missing.length === 0 && extra.length === 0 };
  }
  return report;
}

if (args.includes("--selftest")) {
  const reg = { capabilities: [{ id: "get_root", protocols: ["mcp", "a2a"] }, { id: "gspc", protocols: ["http"] }] };
  const d = diff(expected(reg), observed({
    openapi: { paths: { "/api/gspc": {} } },
    mcp: { result: { tools: [{ name: "get_root" }, { name: "ghost_tool" }] } },
    agentCard: { skills: [] },
  }));
  const caught = d.mcp.extra.includes("ghost_tool") && d.a2a.missing.includes("get_root") && d.http.ok;
  if (!caught) { console.error("✖ capability-drift-guard selftest FAILED"); process.exit(1); }
  console.log("✓ capability-drift-guard selftest: an unregistered tool and an undelivered skill are both caught");
  process.exit(0);
}

const registry = JSON.parse(readFileSync("capabilities/registry.json", "utf8"));
const j = async (u, init) => { try { const r = await fetch(u, init); return r.ok ? await r.json() : null; } catch { return null; } };

const [openapi, agentCard, mcp] = await Promise.all([
  j(`${BASE}/openapi.json`),
  j(`${BASE}/.well-known/agent-card.json`),
  j(`${BASE}/mcp`, { method: "POST", headers: { "content-type": "application/json" },
                     body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) }),
]);

// A door that could not be fetched is UNCHECKABLE, not clean. Never report silence as agreement.
const unreachable = [["openapi.json", openapi], ["agent-card.json", agentCard], ["/mcp", mcp]]
  .filter(([, v]) => v === null).map(([n]) => n);
if (unreachable.length) {
  console.error(`✖ capability-drift-guard: UNCHECKABLE — could not fetch ${unreachable.join(", ")} from ${BASE}`);
  process.exit(WARN_ONLY ? 0 : 1);
}

const report = diff(expected(registry), observed({ openapi, mcp, agentCard }));
let bad = 0;
for (const [door, r] of Object.entries(report)) {
  if (r.ok) { console.log(`✓ ${door}: agrees with the registry`); continue; }
  bad++;
  console.error(`✖ ${door}: drifted from capabilities/registry.json`);
  if (r.missing.length) console.error(`    registered but NOT served (${r.missing.length}): ${r.missing.slice(0, 12).join(", ")}`);
  if (r.extra.length) console.error(`    served but NOT registered (${r.extra.length}): ${r.extra.slice(0, 12).join(", ")}`);
}
if (bad && !WARN_ONLY) { console.error("\n  Update capabilities/registry.json, or the door. The registry is the source of truth."); process.exit(1); }
if (bad) console.error("\n  (--warn: drift reported, not enforced)");
