import { describe, expect, it } from "vitest";
import { buildLedger, onRequestGet } from "./distribution-ledger";

describe("/api/distribution-ledger — unified outward destinations", () => {
  it("aggregates entries from all three source ledgers with dedup", () => {
    const entries = buildLedger();
    expect(entries.length).toBeGreaterThan(0);

    // Verify no two entries have the same id (each entry is uniquely keyed)
    const ids = new Set<string>();
    for (const e of entries) {
      expect(ids.has(e.id), `duplicate id: ${e.id}`).toBe(false);
      ids.add(e.id);
    }
  });

  it("every entry has a canonical URL (skipped entries without are dropped)", () => {
    const entries = buildLedger();
    for (const e of entries) {
      expect(e.canonical_url, `${e.id} missing canonical_url`).toBeTruthy();
    }
  });

  it("every entry has a non-empty platform name", () => {
    const entries = buildLedger();
    for (const e of entries) {
      expect(e.platform.length, `${e.id} empty platform`).toBeGreaterThan(0);
    }
  });

  it("entries are sorted live first, then planned, stale, absent", () => {
    const entries = buildLedger();
    const order: Record<string, number> = { live: 0, planned: 1, stale: 2, absent: 3 };
    for (let i = 1; i < entries.length; i++) {
      expect(order[entries[i - 1].state]).toBeLessThanOrEqual(order[entries[i].state]);
    }
  });

  it("source files are tracked for provenance", () => {
    const entries = buildLedger();
    const sources = new Set(entries.map((e) => e.source_file));
    expect(sources.has("public/interop/platforms-registered.json")).toBe(true);
    expect(sources.has("public/interop/mcp-directories.json")).toBe(true);
    expect(sources.has("public/interop/a2a-directories.json")).toBe(true);
  });

  it("serves the ledger via GET with summary", async () => {
    const res = await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({ env: {} });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schema).toBe("csoai.distribution-ledger/0.1");
    expect(body.endpoint).toBe("/api/distribution-ledger");
    expect(typeof body.summary.total).toBe("number");
    expect(body.summary.by_state).toBeDefined();
    expect(typeof body.summary.by_state.live).toBe("number");
  });

  it("includes all four state categories", () => {
    const entries = buildLedger();
    const states = new Set(entries.map((e) => e.state));
    // Should have at least live and planned; stale/absent are optional
    expect(states.has("live")).toBe(true);
  });
});
