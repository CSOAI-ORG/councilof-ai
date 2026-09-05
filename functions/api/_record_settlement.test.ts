import { describe, expect, it } from "vitest";
import { recordSettlement } from "./_x402";

/**
 * A failed write must not look like no settlement.
 *
 * recordSettlement used to swallow every KV error into an empty catch and return the record
 * anyway, so `/api/revenue` reported `settlements: 0, status: MEASURED` whether nothing had
 * settled or every write had failed. Measured live on 2026-09-05: a confirmed settle through
 * /api/free-door (facilitator tx 0xb7ec8a79…, payer 0x620e8d6c…, HTTP 200) left settlements at
 * 0 with records_unreadable 0 and kv_bound true — a real payment the one number never saw.
 */

const rec = {
  transaction: "0xdeadbeef",
  network: "base",
  payer: "0x620e8d6cca8202533960831631073db701e49fec",
  resource: "https://councilof.ai/api/free-door",
  amount_atomic: "0",
};

const kvThatWorks = () => {
  const store = new Map<string, string>();
  return {
    store,
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => void store.set(k, v),
  };
};

describe("recordSettlement reports whether it actually wrote", () => {
  it("says so when no store is bound, instead of implying a write", async () => {
    const out = await recordSettlement({} as never, rec);
    expect(out.stored).toBe(false);
    if (!out.stored) expect(out.reason).toMatch(/no REVENUE_KV bound/i);
  });

  it("says so when the write THROWS — the case that read as 'nothing settled'", async () => {
    const kv = {
      get: async () => null,
      put: async () => {
        throw new Error("KV PUT failed: quota");
      },
    };
    const out = await recordSettlement({ REVENUE_KV: kv } as never, rec);
    expect(out.stored).toBe(false);
    if (!out.stored) {
      expect(out.reason).toMatch(/kv write failed/i);
      expect(out.reason).toMatch(/quota/);
      // the record is still returned — the grant stands, only the bookkeeping is missing
      expect(out.record?.transaction).toBe("0xdeadbeef");
    }
  });

  it("reports stored:true and writes the append-only tx record when the store works", async () => {
    const kv = kvThatWorks();
    const out = await recordSettlement({ REVENUE_KV: kv } as never, rec);
    expect(out.stored).toBe(true);
    expect(kv.store.has("settled:tx:0xdeadbeef")).toBe(true);
    const written = JSON.parse(kv.store.get("settled:tx:0xdeadbeef")!);
    expect(written.schema).toBe("csoai.x402.settlement/0.1");
    expect(written.payer).toBe(rec.payer);
  });

  it("never overwrites an existing record for the same tx", async () => {
    const kv = kvThatWorks();
    kv.store.set("settled:tx:0xdeadbeef", JSON.stringify({ first: true }));
    await recordSettlement({ REVENUE_KV: kv } as never, rec);
    expect(JSON.parse(kv.store.get("settled:tx:0xdeadbeef")!).first).toBe(true);
  });

  it("keeps a self-payment apart from revenue", async () => {
    const kv = kvThatWorks();
    const env = { REVENUE_KV: kv, X402_PAY_TO: rec.payer } as never;
    const out = await recordSettlement(env, rec);
    expect(out.stored).toBe(true);
    if (out.stored) expect(out.record.self).toBe(true);
  });
});
