import { describe, expect, it } from "vitest";
import { onRequestGet } from "./revenue";

/**
 * A settlement of zero must never make a buyer.
 *
 * Measured live 2026-09-05: one zero-value settle through /api/free-door, signed by an EPHEMERAL
 * wallet created inside the probe, moved /api/revenue one_number.all_time from 0 to 1. A wallet
 * we created and controlled, paying nothing, was counted as a distinct non-self BUYER — against
 * the number's own definition, and enough to trip its own gate "≥1 repeat: open the next door"
 * on our own test traffic.
 */

const kvFrom = (records: Record<string, unknown>[]) => {
  const store = new Map<string, string>();
  records.forEach((r, i) => store.set(`settled:tx:0x${i}`, JSON.stringify(r)));
  return {
    get: async (k: string) => store.get(k) ?? null,
    list: async () => ({ keys: [...store.keys()].map((name) => ({ name })), list_complete: true, cursor: undefined }),
    put: async () => undefined,
  };
};

const call = async (records: Record<string, unknown>[]) => {
  const r = (await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({
    request: new Request("https://councilof.ai/api/revenue"),
    env: { REVENUE_KV: kvFrom(records) },
  })) as Response;
  return ((await r.json()) as { one_number: Record<string, unknown> }).one_number;
};

const NOW = new Date().toISOString();
const payer = (p: string, amount: string | null, extra: Record<string, unknown> = {}) => ({
  payer: p, self: false, settled_at: NOW, amount_atomic: amount, ...extra,
});

describe("one_number excludes settlements that moved nothing", () => {
  it("does not count a zero-amount settle as a buyer, even from an unlisted wallet", async () => {
    const o = await call([payer("0x620e8d6cca8202533960831631073db701e49fec", "0")]);
    expect(o.all_time).toBe(0);
    expect(o.settlements).toBe(0);
    expect(o.zero_value_settlements).toBe(1);
  });

  it("counts a real payment", async () => {
    const o = await call([payer("0xaaa", "20000")]);
    expect(o.all_time).toBe(1);
    expect(o.settlements).toBe(1);
    expect(o.zero_value_settlements).toBe(0);
  });

  it("reads the zero_value flag when present, and falls back to the amount when it is not", async () => {
    // The record that revealed the bug was written BEFORE the flag existed — reading only the
    // flag would have left the live number wrong for exactly that record.
    const o = await call([
      payer("0xbbb", "0", { zero_value: true }),   // flagged
      payer("0xccc", "0"),                          // pre-flag, amount says zero
      payer("0xddd", null),                         // no amount at all
      payer("0xeee", "notanumber"),                 // unparseable
      payer("0xfff", "100000"),                     // the only real buyer
    ]);
    expect(o.all_time).toBe(1);
    expect(o.zero_value_settlements).toBe(4);
  });

  it("still keeps self-payments apart, and never confuses the two", async () => {
    const o = await call([
      { payer: "0x111", self: true, settled_at: NOW, amount_atomic: "20000" },
      payer("0x222", "0"),
      payer("0x333", "20000"),
    ]);
    expect(o.self_settlements).toBe(1);
    expect(o.zero_value_settlements).toBe(1);
    expect(o.settlements).toBe(1);
    expect(o.all_time).toBe(1);
  });

  it("says in its own definition that paying nothing is not buying", async () => {
    const o = await call([]);
    expect(String(o.definition)).toMatch(/non-zero amount/i);
    expect(String(o.definition)).toMatch(/settlement of zero is not a purchase/i);
  });
});
