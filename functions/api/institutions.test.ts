// /api/institutions — the register endpoint derives in-process from the committed artifact.
//
// The four contract points under test, in the order they can silently rot:
//   1. the artifact's schema field and as_of are ECHOED, not regenerated (no new Date());
//   2. rows pass through untouched — the endpoint adds no row and no field it cannot defend;
//   3. a missing, malformed or schema-mismatched artifact is UNCHECKABLE and never
//      degrades to zero (zero is a claim; a broken register is not a count of nothing);
//   4. totals are counts of the artifact's OWN rows by kind, labelled catalogued, and
//      their sum is the row count — rows are observations, never a customer count.
// Plus the HEAD ratchet (functions/api/_head.coverage.test.ts) and CORS.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  ARTIFACT_PATH,
  REGISTER_SCHEMA,
  RESPONSE_SCHEMA,
  deriveInstitutions,
  onRequestGet,
  onRequestHead,
} from "./institutions";

const get = async (): Promise<Response> =>
  (onRequestGet as (c: { request: Request }) => Promise<Response>)({
    request: new Request("https://councilof.ai/api/institutions"),
  });

const artifactBytes = readFileSync(new URL(`../../${ARTIFACT_PATH}`, import.meta.url), "utf8");
const artifact = JSON.parse(artifactBytes) as { schema: string; as_of: string; rows: unknown[] };

describe("GET /api/institutions — artifact echo", () => {
  it("echoes the artifact's schema and reads as_of OUT OF the artifact, naming the key", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schema).toBe(RESPONSE_SCHEMA);
    expect(body.artifact_schema).toBe(REGISTER_SCHEMA);
    expect(body.artifact_schema).toBe(artifact.schema);
    expect(body.as_of).toBe(artifact.as_of);
    expect(body.as_of).toBe("2026-11-19");
    expect(body.as_of_field).toBe("as_of");
    expect(body.source).toBe(ARTIFACT_PATH);
  });

  it("is deterministic: no serve-time stamp, byte-identical payload across calls", async () => {
    const first = await (await get()).text();
    const second = await (await get()).text();
    expect(second).toBe(first);
    // No clock-following field: no serve-time key and no ISO *instant* anywhere in the
    // payload (the artifact's as_of is a date of record, not an instant).
    expect(first).not.toMatch(/"generated_at"|"served_at"|"last_checked"/);
    expect(first).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  });

  it("passes the artifact's rows through untouched", async () => {
    const body = await (await get()).json();
    expect(body.rows).toEqual(artifact.rows);
    expect(body.row_count).toBe(artifact.rows.length);
    expect(body.row_count).toBe(8);
    // No row gained a relationship the estate never recorded.
    for (const row of body.rows) expect(row.relationship_state).toBe("none_on_record");
  });

  it("answers OPTIONS-relevant CORS and a cache header on GET", async () => {
    const res = await get();
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("cache-control")).toContain("max-age=");
  });
});

describe("GET /api/institutions — totals are catalogue-kind counts of the artifact's own rows", () => {
  it("totals by kind match row lengths, each labelled catalogued, summing to row_count", async () => {
    const body = await (await get()).json();
    const rows = artifact.rows as { kind: string }[];
    expect(body.totals.by_kind.length).toBeGreaterThan(0);
    let sum = 0;
    for (const entry of body.totals.by_kind) {
      expect(entry.kind_label).toBe("catalogued");
      expect(entry.basis).toMatch(/artifact's own rows/);
      const expected = rows.filter((row) => row.kind === entry.kind).length;
      expect(entry.count).toBe(expected);
      expect(expected).toBeGreaterThan(0);
      sum += expected;
    }
    expect(sum).toBe(rows.length);
    expect(body.row_count).toBe(rows.length);
  });

  it("publishes the aggregate rule: observations, never a count of customers", async () => {
    const body = await (await get()).json();
    expect(body.contract.aggregate_rule).toMatch(/never added into a count of customers/);
    expect(body.contract.what_a_row_is).toMatch(/not a customer count/);
    expect(body.totals.rule).toMatch(/never a count of customers/);
  });
});

describe("deriveInstitutions — a bad or missing artifact is UNCHECKABLE, never zero", () => {
  it("returns UNCHECKABLE with null counts for missing and non-object artifacts", () => {
    for (const bad of [undefined, null, "register", 42, []]) {
      const d = deriveInstitutions(bad);
      expect(d.status).toBe("UNCHECKABLE");
      expect(d.status_reason).toMatch(/missing|not a JSON object/);
      expect(d.row_count).toBeNull();
      expect(d.rows).toBeNull();
      expect(d.totals_by_kind).toBeNull();
      expect(d.as_of).toBeNull();
      expect(d.artifact_schema).toBeNull();
    }
  });

  it("returns UNCHECKABLE for a schema mismatch and for missing rows", () => {
    const wrongSchema = deriveInstitutions({ schema: "csoai.institutions-register/0.2", as_of: "2026-11-19", rows: [] });
    expect(wrongSchema.status).toBe("UNCHECKABLE");
    expect(wrongSchema.status_reason).toMatch(/schema field/);
    expect(wrongSchema.row_count).toBeNull();

    const noRows = deriveInstitutions({ schema: REGISTER_SCHEMA, as_of: "2026-11-19" });
    expect(noRows.status).toBe("UNCHECKABLE");
    expect(noRows.status_reason).toMatch(/rows array/);
    expect(noRows.row_count).toBeNull();
  });

  it("a valid EMPTY register is PUBLISHED with an honest zero — zero only exists there", () => {
    const empty = deriveInstitutions({ schema: REGISTER_SCHEMA, as_of: "2026-11-19", rows: [] });
    expect(empty.status).toBe("PUBLISHED");
    expect(empty.row_count).toBe(0);
    expect(empty.totals_by_kind).toEqual([]);
  });
});

describe("HEAD /api/institutions", () => {
  it("answers what GET answers, with no body", async () => {
    const res = await (onRequestHead as (c: { request: Request }) => Promise<Response>)({
      request: new Request("https://councilof.ai/api/institutions", { method: "HEAD" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(await res.text()).toBe("");
  });
});

describe("the committed register itself", () => {
  it("carries every source its evidence_quality labels, and no invented contacts", () => {
    const rows = artifact.rows as { sources: string[]; evidence_quality: { url: string }[]; actor: string }[];
    for (const row of rows) {
      expect(row.evidence_quality.map((e) => e.url)).toEqual(row.sources);
      expect(row.actor).not.toMatch(/@/);
    }
    expect(artifactBytes).not.toMatch(/mailto:|@(csoai\.org|gmail\.com)/);
  });
});
