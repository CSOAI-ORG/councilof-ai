import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(p, "utf8");
const json = (p) => JSON.parse(read(p));

test("state uses the already-landed ledgers block and names the one-authority flywheel", () => {
  const s = read("functions/api/state.ts");
  assert.match(s, /const ledgerState = ledgersBlock\(\)/);
  assert.match(s, /ledgers: ledgerState/);
  assert.match(s, /executed_rechecks: "\/api\/state → ledgers\.claim_maintenance"/);
  for (const stage of ["CAPTURE", "RECHECK", "MEASURE", "CORRECT", "QUOTE"]) {
    assert.ok(s.includes(`stage: "${stage}"`), stage);
  }
});

test("canonical Actions exposes only existing convergence reads", () => {
  const s = read("functions/api/openapi.json.ts");
  for (const p of ["/api/state", "/api/claims/register", "/api/claims/events", "/api/claims/events/head", "/api/corrections"]) {
    assert.ok(s.includes(`"${p}"`), p);
  }
});

test("legacy ChatGPT manifest points to canonical Actions and freezes no board count", () => {
  const p = json("public/interop/chatgpt-plugin.json");
  assert.equal(p["x-canonical-openapi"], "https://councilof.ai/api/openapi.json");
  assert.doesNotMatch(JSON.stringify(p.info), /\b\d+-axis\b/i);
  assert.ok(p.paths["/state"]);
  assert.ok(p.paths["/claims/register"]);
  assert.ok(p.paths["/claims/events"]);
  assert.ok(p.paths["/claims/events/head"]);
  assert.ok(p.paths["/corrections"]);
  assert.equal(p.paths["/measure"], undefined);
  assert.equal(p.paths["/anchor"], undefined);
});

test("site and plugin surfaces point at the same public authorities", () => {
  // 30 Sep 2026: Dashboard.tsx is now a thin routing wrapper; the actual surface content
  // lives in ClaimMaintenance.tsx (the bounded remeasurement pane) and PluginBlock.tsx
  // (the plugin integration listing). Verifying those two is sufficient.
  const claimMaintenance = read("client/src/pages/ClaimMaintenance.tsx");
  const pluginBlock = read("client/src/components/home/PluginBlock.tsx");

  // PluginBlock describes the four canonical reads in a single sentence:
  // "Operational state is GET /api/state; maintained claims are GET /api/claims/register;
  //  recheck event history is GET /api/claims/events; corrections are GET /api/corrections."
  assert.ok(pluginBlock.includes("/api/state"), "PluginBlock → /api/state");
  assert.ok(pluginBlock.includes("/api/claims/register"), "PluginBlock → /api/claims/register");
  assert.ok(pluginBlock.includes("/api/claims/events"), "PluginBlock → /api/claims/events");
  assert.ok(pluginBlock.includes("/api/corrections"), "PluginBlock → /api/corrections");

  // ClaimMaintenance is the bounded remeasurement pane; it reads the register and events
  assert.ok(claimMaintenance.includes("/api/claims/register"), "ClaimMaintenance → /api/claims/register");
  assert.ok(claimMaintenance.includes("/api/claims/events"), "ClaimMaintenance → /api/claims/events");
  assert.ok(claimMaintenance.includes("/api/claims/events/head"), "ClaimMaintenance → /api/claims/events/head");
});

test("plugin descriptor carries no frozen tool or axis count", () => {
  const p = json("plugins/gspc/plugin.json");
  assert.doesNotMatch(p.description, /\b\d+ (?:tools?|axes?|axis)\b/i);
});
