import { describe, expect, it } from "vitest";
import { onRequestGet } from "./receipts.xml";

/**
 * The receipts feed serves RECORDS, not counters. /api/revenue reports aggregates, and an aggregate
 * is exactly where a number can be typed; this serves one entry per settlement so a reader checks
 * the chain instead of trusting our arithmetic.
 *
 * The case that matters most is the self-settlement. Our own wallet paying our own door produces a
 * real receipt and a real transaction, and it is NOT a buyer. If the feed ever stopped saying which
 * is which, a reader skimming it would read our own money as demand — the single most misleading
 * thing this estate could publish.
 */
const kvWith = (records: Record<string, unknown>) => ({
  list: async () => ({ keys: Object.keys(records).map((name) => ({ name })), list_complete: true }),
  get: async (k: string) => (k in records ? JSON.stringify(records[k]) : null),
});
const call = async (env: unknown) =>
  (await (onRequestGet as any)({ env })) as Response;

describe("/feeds/receipts.xml", () => {
  it("says why it is empty rather than serving a bare feed when the store is unbound", async () => {
    const r = await call({});
    const xml = await r.text();
    expect(r.headers.get("content-type")).toMatch(/atom\+xml/);
    expect(xml).toMatch(/REVENUE_KV is not bound/);
    expect(xml, "an empty feed with no reason reads as 'there are no receipts'")
      .toMatch(/not the same as there being no receipts/);
    expect(xml).not.toMatch(/<entry>/);
  });

  it("labels a self-settlement as one, in the title", async () => {
    const r = await call({ REVENUE_KV: kvWith({
      "settled:tx:0xaaa": { self: true, amount_atomic: "20000", settled_at: "2026-09-06T08:01:20Z",
                            tx: "0xaaa", payer: "0x4dB7", resource: "/api/request-attestation" },
    }) });
    const xml = await r.text();
    expect(xml).toMatch(/<title>self-settlement — our own wallet, never revenue — 0\.020000 USDC<\/title>/);
    expect(xml).toMatch(/never counts as revenue/);
    expect(r.headers.get("x-receipts-total")).toBe("1");
  });

  it("does not dress a zero-value settlement as a purchase", async () => {
    const r = await call({ REVENUE_KV: kvWith({
      "settled:tx:0xbbb": { self: false, amount_atomic: "0", settled_at: "2026-09-05T00:00:00Z", tx: "0xbbb" },
    }) });
    expect(await r.text()).toMatch(/zero-value: recorded, never a purchase/);
  });

  it("carries the transaction so the chain is the check", async () => {
    const r = await call({ REVENUE_KV: kvWith({
      "settled:tx:0xccc": { self: false, amount_atomic: "50000", settled_at: "2026-09-06T00:00:00Z", tx: "0xccc" },
    }) });
    const xml = await r.text();
    expect(xml).toMatch(/basescan\.org\/tx\/0xccc/);
    expect(xml).toMatch(/transaction 0xccc/);
  });

  it("skips an unreadable record instead of inventing an entry for it", async () => {
    const kv = {
      list: async () => ({ keys: [{ name: "settled:tx:0xddd" }], list_complete: true }),
      get: async () => "{not json",
    };
    const r = await call({ REVENUE_KV: kv });
    expect(await r.text()).not.toMatch(/<entry>/);
    expect(r.headers.get("x-receipts-total")).toBe("0");
  });

  it("orders newest first, so the feed reads as a feed", async () => {
    const r = await call({ REVENUE_KV: kvWith({
      "settled:tx:0x1": { self: true, amount_atomic: "1", settled_at: "2026-09-01T00:00:00Z", tx: "0x1" },
      "settled:tx:0x2": { self: true, amount_atomic: "2", settled_at: "2026-09-06T00:00:00Z", tx: "0x2" },
    }) });
    const xml = await r.text();
    expect(xml.indexOf("0x2")).toBeLessThan(xml.indexOf("0x1"));
  });
});
