import { describe, it, expect } from "vitest";
import { onRequestGet } from "./revenue";

// /api/revenue derives the One Number from settlement records, never from a tally, and is null
// (never 0) without a store. Proven here so the guard can fail: a bound store with two outside
// payers and one self payer must read 2, not 3 and not null.

function kvFrom(entries: Record<string, string>) {
  const store = new Map(Object.entries(entries));
  return {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => { store.set(k, v); },
    list: async ({ prefix }: { prefix: string }) => ({
      keys: [...store.keys()].filter((n) => n.startsWith(prefix)).map((name) => ({ name })),
      list_complete: true,
      cursor: "",
    }),
  } as unknown as KVNamespace;
}

const call = async (env: Record<string, unknown>) => {
  const res = await onRequestGet({ request: new Request("https://councilof.ai/api/revenue"), env } as never);
  return (await res.json()) as { one_number: Record<string, unknown>; settled_usdc: Record<string, unknown> };
};

const rec = (tx: string, payer: string, self: boolean, at: string) =>
  JSON.stringify({ schema: "csoai.x402.settlement/0.1", transaction: tx, network: "base", payer, self, resource: "r", amount_atomic: "500000", settled_at: at });

describe("/api/revenue — the One Number", () => {
  it("is null, never 0, without a store", async () => {
    const body = await call({});
    expect(body.one_number).toMatchObject({ status: "UNMEASURED", all_time: null, last_30d: null });
  });

  it("counts distinct non-self payers from records, keeps self apart, and windows 30 days", async () => {
    const now = new Date();
    const old = new Date(now.getTime() - 40 * 24 * 3600 * 1000).toISOString();
    const kv = kvFrom({
      "settled:tx:0x1": rec("0x1", "0xAAAA", false, now.toISOString()),
      "settled:tx:0x2": rec("0x2", "0xaaaa", false, now.toISOString()), // same wallet, different case
      "settled:tx:0x3": rec("0x3", "0xBBBB", false, old),
      "settled:tx:0x4": rec("0x4", "0xSELF", true, now.toISOString()),
      "settled:usdc_atomic": "1500000",
    });
    const body = await call({ REVENUE_KV: kv });
    expect(body.one_number).toMatchObject({ status: "MEASURED", all_time: 2, last_30d: 1, settlements: 3, self_settlements: 1 });
    expect(body.settled_usdc).toMatchObject({ count: 1500000, status: "MEASURED", excludes_self: true });
  });
});
