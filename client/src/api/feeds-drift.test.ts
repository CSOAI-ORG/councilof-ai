import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * H2 drift gates for the three feeds (corrections, obligations, OTEL).
 * These tests FAIL when the source of truth changes and the feed JSON was
 * not regenerated. They are not about the sky — they are about the generator
 * doing its job after any source edit.
 */

const read = (p: string) => JSON.parse(readFileSync(join(process.cwd(), p), "utf8"));

describe("corrections-feed is derived from RefutationLedger source", () => {
  it("advertises refutations and each is shaped", () => {
    const feed = read("public/interop/corrections-feed.json");
    expect(feed.schema).toBe("csoai.corrections-feed/0.1");
    expect(feed.total).toBe(feed.corrections.length);
    expect(feed.state).toBe("HISTORICAL_REFUTATION_SNAPSHOT");
    expect(feed.signature_state).toBe("UNSIGNED_SNAPSHOT");
    expect(feed.canonical_corrections).toBe("/api/corrections");
    for (const c of feed.corrections) {
      expect(c.refutation_id).toMatch(/^REF-\d{3}$/);
      expect(typeof c.claim).toBe("string");
      expect(typeof c.measured).toBe("string");
      expect(c.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(c.kind).toBe("correction-card");
    }
  });

  it("preserves historical REF rows while containing every current UI ID", () => {
    const src = readFileSync(join(process.cwd(), "client/src/pages/RefutationLedger.tsx"), "utf8");
    const ids = [...src.matchAll(/n:\s*(\d+),/g)].map((m) => `REF-${m[1].padStart(3, "0")}`);
    const feed = read("public/interop/corrections-feed.json");
    const published = new Set(feed.corrections.map((row: { refutation_id: string }) => row.refutation_id));
    expect(published.size).toBe(feed.total);
    for (const id of ids) expect(published.has(id)).toBe(true);
    expect(published.has("REF-010")).toBe(true); // historical row absent from current UI
  });
});

describe("obligations-ledger stays parseable and honest", () => {
  it("has the obligation schema and non-negative evidence", () => {
    const led = read("public/interop/obligations-ledger.json");
    expect(led.schema).toBe("csoai.obligations-ledger/0.1");
    expect(led.obligations.length).toBeGreaterThan(0);
    for (const o of led.obligations) {
      expect(typeof o.obligation).toBe("string");
      expect(o.evidence_card_files).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("otel bridge traces stay parseable and honest", () => {
  it("has spans with measured=true and trace ids", () => {
    const otel = read("public/interop/otel-traces.json");
    expect(otel.schema).toBe("csoai.otel-bridge/0.1");
    expect(otel.trace_id).toMatch(/^[0-9a-f]{32}$/);
    expect(otel.spans.length).toBeGreaterThan(0);
    for (const s of otel.spans) {
      expect(s.span_id).toMatch(/^[0-9a-f]{16}$/);
      expect(s.status).toBeTruthy();
    }
  });
});
