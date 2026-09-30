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
  for (const p of ["/api/state", "/api/claims/register", "/api/corrections"]) {
    assert.ok(s.includes(`"${p}"`), p);
  }
});

test("legacy ChatGPT manifest points to canonical Actions and freezes no board count", () => {
  const p = json("public/interop/chatgpt-plugin.json");
  assert.equal(p["x-canonical-openapi"], "https://councilof.ai/api/openapi.json");
  assert.doesNotMatch(JSON.stringify(p.info), /\b\d+-axis\b/i);
  assert.ok(p.paths["/state"]);
  assert.ok(p.paths["/claims/register"]);
  assert.ok(p.paths["/corrections"]);
  assert.equal(p.paths["/measure"], undefined);
  assert.equal(p.paths["/anchor"], undefined);
});

test("site and plugin surfaces point at the same public authorities", () => {
  const files = [
    read("client/src/pages/ClaimMaintenance.tsx"),
    read("client/src/pages/Dashboard.tsx"),
    read("client/src/components/home/PluginBlock.tsx"),
  ];
  for (const s of files) {
    assert.ok(s.includes("/api/state"));
    assert.ok(s.includes("/api/corrections"));
  }
  for (const s of files) assert.ok(s.includes("/api/claims/register"));
});

test("plugin descriptor carries no frozen tool or axis count", () => {
  const p = json("plugins/gspc/plugin.json");
  assert.doesNotMatch(p.description, /\b\d+ (?:tools?|axes?|axis)\b/i);
});
