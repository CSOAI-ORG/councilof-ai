import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateFreshness,
  evaluateRegisterPage,
  runChecks,
} from "./memberships-check.mjs";

const NOW = new Date("2026-11-13T00:00:00.000Z");
const baseRow = {
  id: "public-row",
  org: "Example Registry",
  short: "Example",
  group: "registries",
  kind: "listed",
  since: "2026-09-01",
  verified_on: "2026-10-07",
  evidence: "https://evidence.example/registry",
  evidence_kind: "public_url",
  public_evidence: true,
  state: "VERIFIED",
  what_it_proves: "A public directory lists Council of AI.",
  what_it_does_not_prove: "It does not establish endorsement or adoption.",
};
const baseManifest = () => ({
  schema: "csoai.memberships/0.1",
  as_of: "2026-10-07",
  signed: false,
  groups: [{ id: "registries", label: "Registries" }],
  rows: [
    { ...baseRow },
    {
      ...baseRow,
      id: "private-row",
      org: "Private Membership",
      short: "Private",
      evidence: "INBOX 12345 2026-10-07",
      evidence_kind: "private_email",
      public_evidence: false,
    },
  ],
});
const page = (date = "2026-10-07", unsigned = true) => ({
  status: 200,
  body: `<main><p>Machine-readable: /interop/memberships.json (schema csoai.memberships/0.1, as of ${date}, ${unsigned ? "unsigned" : "signed"} — it says so in the file).</p></main>`,
});

test("freshness gate rejects a 37-day-old manifest but accepts row evidence within 60 days", () => {
  const result = evaluateFreshness(baseManifest(), undefined, NOW);
  assert.equal(result.ok, false);
  assert.equal(result.age_days, 37);
  assert.equal(result.public_rows, 1);
  assert.equal(result.private_rows, 1);
  assert.ok(result.issues.some((issue) => issue.includes("manifest as_of is stale")));
  assert.equal(result.stale_rows.length, 0);
});

test("fresh manifest with current row evidence passes", () => {
  const manifest = baseManifest();
  manifest.as_of = "2026-11-13";
  for (const row of manifest.rows) row.verified_on = manifest.as_of;
  const result = evaluateFreshness(manifest, { as_of: manifest.as_of }, NOW);
  assert.equal(result.ok, true);
  assert.equal(result.age_days, 0);
});

test("row evidence older than 60 days is independently flagged", () => {
  const manifest = baseManifest();
  manifest.rows[0].verified_on = "2026-08-01";
  const result = evaluateFreshness(manifest, undefined, NOW);
  assert.ok(result.stale_rows.some((row) => row.id === "public-row"));
});

test("future and missing verification dates fail closed except recorded UNVERIFIED rows", () => {
  const manifest = baseManifest();
  manifest.rows[0].verified_on = "2026-11-14";
  manifest.rows[1].verified_on = null;
  manifest.rows[1].state = "UNVERIFIED";
  const result = evaluateFreshness(manifest, undefined, NOW);
  assert.ok(result.issues.some((issue) => issue.includes("later than manifest as_of")));
  assert.ok(result.issues.some((issue) => issue.includes("in the future")));
  assert.equal(result.rows_missing_verified_on.length, 0);
});

test("updates log must carry the same as_of date as the manifest", () => {
  const result = evaluateFreshness(baseManifest(), { as_of: "2026-09-22" }, NOW);
  assert.ok(result.issues.some((issue) => issue.includes("updates log as_of")));
});

test("HTML register must expose the same manifest date and unsigned status", () => {
  const manifest = baseManifest();
  assert.equal(evaluateRegisterPage(page(), manifest).ok, true);
  assert.equal(evaluateRegisterPage(page("2026-09-22"), manifest).ok, false);
  assert.equal(evaluateRegisterPage(page("2026-10-07", false), manifest).ok, false);
});

test("stale manifest still causes every public row to be fetched", async () => {
  const manifest = baseManifest();
  const requested = [];
  const fetcher = async (url) => {
    requested.push(url);
    if (url === "https://councilof.ai/memberships") return page();
    return { status: 200, body: "Council of AI appears in this directory" };
  };
  const result = await runChecks(manifest, fetcher, undefined, NOW);
  assert.equal(result.checked, 1);
  assert.equal(result.skipped, 1);
  assert.ok(requested.includes("https://evidence.example/registry"));
  assert.ok(requested.includes("https://councilof.ai/memberships"));
  assert.ok(result.failures.some((failure) => failure.id === "manifest-freshness"));
  assert.equal(result.pageCheck.ok, true);
  assert.equal(result.exitCode, 1);
});
