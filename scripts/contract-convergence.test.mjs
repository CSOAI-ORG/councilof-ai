import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const json = (p) => JSON.parse(read(p));

test("state derives existing Claim Maintenance and corrections authorities", () => {
  const s = read("functions/api/state.ts");
  assert.match(s, /claimMaintenanceRegister from .*claim-maintenance\/register\.json/);
  assert.match(s, /LEDGER as correctionsLedger/);
  assert.match(s, /claim_maintenance:/);
  assert.match(s, /corrections_ledger:/);
  assert.match(s, /authority: SRC_CLAIM_MAINTENANCE/);
  assert.match(s, /authority: SRC_CORRECTIONS/);
});

test("Claim Maintenance register totals equal the rows it contains", () => {
  const r = json("public/spec/claim-maintenance/register.json");
  assert.equal(r.totals.subjects, r.subjects.length);
  assert.equal(r.totals.claims, r.subjects.reduce((n, s) => n + s.claim_count, 0));
  const by = {};
  for (const s of r.subjects) for (const [k, n] of Object.entries(s.states)) by[k] = (by[k] || 0) + n;
  assert.deepEqual(by, r.totals.by_state);
});

test("public claims register declares every status it uses", () => {
  const r = json("public/claims-register.json");
  const declared = new Set(r.statuses);
  assert.deepEqual([...new Set(r.claims.map((c) => c.status).filter((s) => !declared.has(s)))], []);
});

test("canonical Actions schema exposes the existing convergence contracts", () => {
  const s = read("functions/api/openapi.json.ts");
  for (const p of ["/api/state", "/api/claims/register", "/api/claims/events", "/api/claims/events/head", "/api/corrections"]) assert.ok(s.includes(`\"${p}\"`), p);
});

test("legacy ChatGPT manifest is a compatibility pointer, not a frozen second truth", () => {
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

test("site and plugin surfaces point at the same public contracts", () => {
  const claim = read("client/src/pages/ClaimMaintenance.tsx");
  const dash = read("client/src/pages/Dashboard.tsx");
  const block = read("client/src/components/home/PluginBlock.tsx");
  for (const s of [claim, dash, block]) {
    assert.ok(s.includes("/api/state"));
    assert.ok(s.includes("/api/corrections"));
    assert.ok(s.includes("/api/claims/events"));
  }
  assert.ok(claim.includes("/api/claims/register"));
  assert.ok(dash.includes("/api/claims/register"));
  assert.ok(block.includes("/api/claims/register"));
  assert.ok(claim.includes("/api/claims/events/head"));
});

test("plugin descriptor carries no frozen tool or axis count", () => {
  const p = json("plugins/gspc/plugin.json");
  assert.doesNotMatch(p.description, /\b\d+ (?:tools?|axes?|axis)\b/i);
});


test("Claim Maintenance discovery stays on current immutable v0.2 and exposes its companions", () => {
  const page = read("client/src/pages/ClaimMaintenance.tsx");
  const short = read("scripts/llms/llms.txt.tmpl");
  const full = read("scripts/llms/llms-full.txt.tmpl");
  const idx = json("public/spec/claim-maintenance/index.json");
  for (const s of [page, short, full]) {
    assert.ok(s.includes("/spec/claim-maintenance/v0.2/"));
    assert.ok(s.includes("/spec/claim-maintenance/conformance/v0.2/"));
    assert.ok(s.includes("/spec/claim-maintenance/interop/"));
  }
  assert.doesNotMatch(short, /Specification v0\.1 \(CC0/);
  assert.doesNotMatch(full, /Specification v0\.1, dedicated/);
  assert.equal(idx.latest, "0.2");
  assert.equal(idx.companions.conformance_corpus.version, "0.2");
  assert.equal(idx.companions.event_chain.url, "https://councilof.ai/api/claims/events");
  assert.equal(idx.companions.corrections_ledger.url, "https://councilof.ai/api/corrections");
});

test("Claim Maintenance conformance corpus is pinned and explicitly non-certifying", () => {
  const m = json("public/spec/claim-maintenance/conformance/v0.2/manifest.json");
  assert.equal(m.spec_version, "0.2");
  assert.match(m.spec_document_sha256, /^[0-9a-f]{64}$/);
  assert.match(m.reference_implementation.sha256, /^[0-9a-f]{64}$/);
  assert.equal(m.cases.length, 11);
  assert.ok(m.cases.every((c) => /^[0-9a-f]{64}$/.test(c.sha256)));
  assert.match(m.what_this_is_not.join(" "), /Not certification/i);
});
