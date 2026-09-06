import { describe, expect, it } from "vitest";
import { onRequestGet } from "./revenue";

/**
 * What the facilitator said about indexing, made readable.
 *
 * _x402.ts records a `bazaar` outcome on EVERY settle — deliberately, because per
 * specs/extensions/bazaar.md a facilitator only MAY report on the EXTENSION-RESPONSES
 * sidechannel, and x402#2112 records one that never does, leaving services silently unindexed.
 * That field was written to every settlement record and surfaced on no endpoint. The one number
 * that answers "why are we not in the Bazaar" was being measured and thrown away.
 *
 * MEASURED 2026-09-06, which is why this matters: six of our doors settled on chain between
 * 05:59Z and 08:05Z, five of them for the first time, and a complete scan of both x402 indexes
 * (28,230 PayAI + 15,768 CDP) found ONE councilof.ai resource, last updated the day before.
 * Settling does not list you, and until now nothing we served could say whether the facilitator
 * had even claimed otherwise.
 *
 * The tally counts SELF settlements too. Move A settled our own doors; those are precisely the
 * settles whose indexing outcome we need, and the buyer counters skip them by design.
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
const rec = (extra: Record<string, unknown>) => ({ settled_at: NOW, amount_atomic: "20000", ...extra });

describe("/api/revenue reports what the facilitator said about indexing", () => {
  it("tallies the outcomes by status", async () => {
    const one = await call([
      rec({ self: true, bazaar: { status: "UNREPORTED" } }),
      rec({ self: true, bazaar: { status: "UNREPORTED" } }),
      rec({ payer: "0xaaa", self: false, bazaar: { status: "REPORTED" } }),
    ]);
    const idx = one.indexing as { facilitator_bazaar_outcomes: Record<string, number> };
    expect(idx.facilitator_bazaar_outcomes).toEqual({ UNREPORTED: 2, REPORTED: 1 });
  });

  it("counts SELF settlements, which the buyer counters skip", async () => {
    // Move A was entirely self. If the tally sat after the `self` early-return it would read {},
    // and the endpoint would report nothing about the only settles we have actually made.
    const one = await call([
      rec({ self: true, bazaar: { status: "UNREPORTED" } }),
      rec({ self: true, bazaar: { status: "UNREPORTED" } }),
    ]);
    const idx = one.indexing as { facilitator_bazaar_outcomes: Record<string, number> };
    expect(one.self_settlements).toBe(2);
    expect(one.all_time, "self settlements are never buyers").toBe(0);
    expect(idx.facilitator_bazaar_outcomes.UNREPORTED,
      "a tally that skips self records says nothing about Move A").toBe(2);
  });

  it("names ABSENT for records written before the field existed, rather than dropping them", async () => {
    const one = await call([rec({ self: true }), rec({ self: true, bazaar: null })]);
    const idx = one.indexing as { facilitator_bazaar_outcomes: Record<string, number> };
    expect(idx.facilitator_bazaar_outcomes).toEqual({ ABSENT: 2 });
  });

  it("says plainly that UNREPORTED is not evidence either way, and where to actually look", async () => {
    const one = await call([rec({ self: true, bazaar: { status: "UNREPORTED" } })]);
    const idx = one.indexing as { note: string };
    expect(idx.note).toMatch(/NOT the same as not being indexed/);
    expect(idx.note, "the note must point at the thing that can answer the question")
      .toMatch(/x402-bazaar-audit\.py/);
  });
});
