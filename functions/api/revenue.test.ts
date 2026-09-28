import { describe, it, expect } from "vitest";
import { onRequestGet } from "./revenue";
import { railMode } from "./_x402_config";
import countersDoc from "../../counters.json";

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
  return (await res.json()) as {
    one_number: Record<string, unknown>;
    settled_usdc: Record<string, unknown>;
    contract: { null_rule: string };
    skus: Record<string, { note: string }>;
  };
};

const rec = (tx: string, payer: string, self: boolean, at: string, resource = "r") =>
  JSON.stringify({ schema: "csoai.x402.settlement/0.1", transaction: tx, network: "base", payer, self, resource, amount_atomic: "500000", settled_at: at });

describe("/api/revenue — the One Number", () => {
  it("is null, never 0, without a store", async () => {
    const body = await call({});
    expect(body.one_number).toMatchObject({ status: "UNMEASURED", all_time: null, last_30d: null, distinct_payers_by_door: null });
  });

  it("counts distinct non-self payers from records, keeps self apart, and windows 30 days", async () => {
    const now = new Date();
    const old = new Date(now.getTime() - 40 * 24 * 3600 * 1000).toISOString();
    const kv = kvFrom({
      "settled:tx:0x1": rec("0x1", "0xAAAA", false, now.toISOString()),
      "settled:tx:0x2": rec("0x2", "0xaaaa", false, now.toISOString()), // same wallet, different case
      "settled:tx:0x3": rec("0x3", "0xBBBB", false, old),
      "settled:tx:0x4": rec("0x4", "0xSELF", true, now.toISOString()),
      "settled:usdc_atomic": "2000000",
    });
    const body = await call({ REVENUE_KV: kv });
    expect(body.one_number).toMatchObject({ status: "MEASURED", all_time: 2, last_30d: 1, settlements: 3, self_settlements: 1 });
    expect(body.settled_usdc).toMatchObject({ count: 1500000, status: "MEASURED", excludes_self: true });
  });

  it("counts distinct non-self payers per door under the same rule as all_time; nameless records group, never vanish", async () => {
    const now = new Date().toISOString();
    const body = await call({ REVENUE_KV: kvFrom({
      "settled:tx:a1": rec("a1", "0xAAAA", false, now, "/api/wrapper"),
      "settled:tx:a2": rec("a2", "0xaaaa", false, now, "/api/wrapper"), // same wallet, same door
      "settled:tx:b1": rec("b1", "0xBBBB", false, now, "/api/request-attestation"),
      "settled:tx:s1": rec("s1", "0xSELF", true, now, "/api/wrapper"),  // self: never a payer anywhere
      "settled:tx:n1": JSON.stringify({ schema: "csoai.x402.settlement/0.1", transaction: "n1", network: "base", payer: "0xCCCC", self: false, amount_atomic: "500000", settled_at: now }),
    }) });
    expect(body.one_number).toMatchObject({ all_time: 3, distinct_payers_by_door: { "/api/wrapper": 1, "/api/request-attestation": 1, UNKNOWN_RESOURCE: 1 } });
    const empty = await call({ REVENUE_KV: kvFrom({}) });
    expect(empty.one_number).toMatchObject({ status: "MEASURED", all_time: 0, distinct_payers_by_door: {} });
  });

  it("retroactively excludes the documented internal browser-test wallet from buyers and revenue", async () => {
    const kv = kvFrom({
      "settled:tx:external": rec("external", "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", false, new Date().toISOString()),
      "settled:tx:browser-test": rec("browser-test", "0x6ea00613c15f2463bC10c7188215c4FA6f4943C6", false, new Date().toISOString()),
      // This legacy tally includes both payments. The record-derived result must correct it.
      "settled:usdc_atomic": "1000000",
    });
    const body = await call({ REVENUE_KV: kv });
    expect(body.one_number).toMatchObject({ all_time: 1, settlements: 1, self_settlements: 1 });
    expect(body.settled_usdc).toMatchObject({ count: 500000, status: "MEASURED" });
  });
});

// The SKU notes used to copy a typed "x402 is fail-closed, mode:mock" clause out of counters.json
// while contract.null_rule on the same payload derived "live" from railMode(env). Proven here so
// the drift cannot return: the served note must carry the SAME mode railMode(env) reports, in
// both env states, and the canon string itself must not assert any rail state.
describe("/api/revenue — SKU notes derive the rail state from env, never from counters.json", () => {
  const canonNote = (countersDoc as { counters: Record<string, { note?: string }> }).counters.revenue_issuances.note || "";
  const liveEnv = { X402_FACILITATOR_URL: "https://facilitator.example" };

  it("counters.json no longer types a rail state into the SKU-1 note", () => {
    expect(canonNote).not.toMatch(/mock|fail-closed|No live settle path/i);
    expect(canonNote).toContain("railMode(env)");
  });

  it("without a facilitator, every SKU note says challenge-only — and so does null_rule", async () => {
    const body = await call({});
    const mode = railMode({}).mode;
    expect(mode).toBe("challenge-only");
    for (const sku of ["issuance", "proofs", "licences"]) {
      expect(body.skus[sku].note).toContain(`x402 rail: ${mode}`);
      expect(body.skus[sku].note).not.toMatch(/mock/i);
    }
    expect(body.contract.null_rule).toContain(`currently ${mode}`);
  });

  it("with a facilitator, every SKU note says live — the same word null_rule says", async () => {
    const body = await call(liveEnv);
    const mode = railMode(liveEnv).mode;
    expect(mode).toBe("live");
    for (const sku of ["issuance", "proofs", "licences"]) {
      expect(body.skus[sku].note).toContain(`x402 rail: ${mode}`);
      expect(body.skus[sku].note).not.toMatch(/mock|fail-closed/i);
    }
    expect(body.contract.null_rule).toContain(`currently ${mode}`);
  });

  it("keeps the canon doctrine text in front of the derived clause", async () => {
    const body = await call(liveEnv);
    expect(body.skus.issuance.note.startsWith(canonNote.trim())).toBe(true);
  });

  it("keeps rail-state prose true when recorded revenue is non-null", async () => {
    const kv = kvFrom({
      "settled:tx:paid": rec("paid", "0xAAAA", false, new Date().toISOString()),
    });
    for (const env of [
      { REVENUE_KV: kv },
      { ...liveEnv, REVENUE_KV: kv },
      { ...liveEnv, X402_PAY_TO: "invalid", REVENUE_KV: kv },
    ]) {
      const body = await call(env);
      expect(body.one_number).toMatchObject({ all_time: 1, settlements: 1 });
      expect(body.settled_usdc).toMatchObject({ count: 500000, status: "MEASURED" });
      expect(String(body.settled_usdc.note)).toContain(`x402 rail: ${railMode(env).mode}`);
      expect(String(body.settled_usdc.note)).not.toMatch(/this count (?:stays|is) (?:honestly )?null/i);
      expect(body.contract.null_rule).not.toMatch(/every count (?:stays|is) (?:honestly )?null/i);
    }
  });
});
