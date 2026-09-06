/**
 * The point of this endpoint is one distinction: "no receipts for you" vs "no receipts for
 * anyone, because none are recorded". An empty array would say the first and mean the second,
 * and the only person who calls this is a buyer who just paid.
 */
import { describe, expect, it } from "vitest";
import { handle, onRequestGet, type ReceiptRow } from "./index";

const call = async (qs: string) => {
  const res = await onRequestGet({
    request: new Request(`https://councilof.ai/api/receipts${qs}`),
  } as Parameters<typeof onRequestGet>[0]);
  return { res, body: (await res.json()) as Record<string, never> };
};

describe("/api/receipts?payer=", () => {
  it("never returns an empty list while receipts are unrecorded", async () => {
    const { res, body } = await call("?payer=0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31");
    expect(res.status).toBe(200);
    expect(body.status).toBe("UNRECORDED");
    // the load-bearing assertion: null, not []
    expect(body.items).toBeNull();
    expect(body.count).toBeNull();
    expect(body.items).not.toEqual([]);
  });

  it("names the exact missing capability rather than failing vaguely", async () => {
    const { body } = await call("?payer=0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31");
    const gap = body.unavailable_capability as unknown as Record<string, string>;
    expect(gap.capability).toBe("settlement-receipt persistence");
    // Receipts ARE recorded now; UNRECORDED means THIS deployment has no store bound (a preview
    // build without REVENUE_KV). The gap text must say that, or it teaches the wrong lesson.
    expect(gap.detail).toMatch(/Receipts ARE written now/);
    expect(gap.detail).toMatch(/REVENUE_KV/);
    expect(gap.proof).toMatch(/kv_bound/);
  });

  it("requires a payer — it never answers for everyone", async () => {
    const { res, body } = await call("");
    expect(res.status).toBe(400);
    expect(body.status).toBe("BAD_REQUEST");
    expect(body.items).toBeNull();
  });

  it("refuses a value that cannot be an address instead of answering emptily", async () => {
    for (const bad of ["?payer=nick", "?payer=0x123", "?payer=0xZZZZ212686404A7D1E1fD88F35eD6200c3aF"]) {
      const { res, body } = await call(bad);
      expect(res.status).toBe(400);
      expect(body.items).toBeNull();
    }
  });

  it("echoes the payer it was asked about, so a reply cannot be mistaken for another query", async () => {
    const payer = "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31";
    const { body } = await call(`?payer=${payer}`);
    expect((body.query as unknown as Record<string, string>).payer).toBe(payer);
  });

  it("says out loud that batch receipts are a different artefact", async () => {
    const { body } = await call("?payer=0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31");
    const honesty = body.honesty as unknown as Record<string, string>;
    expect(honesty.what_a_receipt_is_not).toMatch(/not evidence of payment/i);
    expect(honesty.empty_is_not_none).toMatch(/including\s+one who has paid/i);
    expect(honesty.what_the_signature_covers).toMatch(/board-attestation-1/);
    expect(honesty.what_the_signature_covers).toMatch(/NOT amount, asset/);
  });

  it("serves rows as OK once a store exists — the seam actually works", async () => {
    const row: ReceiptRow = {
      payer: "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
      txHash: "0xabc",
      network: "eip155:8453",
      amount: "0",
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      resource: "https://councilof.ai/api/free-door",
      settledAt: "2026-09-06T00:00:00Z",
    };
    const res = await handle(
      new Request(`https://councilof.ai/api/receipts?payer=${row.payer}`),
      async () => [row],
    );
    const body = (await res.json()) as Record<string, never>;
    expect(res.status).toBe(200);
    expect(body.status).toBe("OK");
    expect(body.count).toBe(1);
    expect((body.items as unknown as ReceiptRow[])[0].txHash).toBe("0xabc");
  });

  it("still distinguishes a genuinely empty history from an unrecorded one", async () => {
    const payer = "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31";
    const empty = await handle(new Request(`https://councilof.ai/api/receipts?payer=${payer}`), async () => []);
    const eb = (await empty.json()) as Record<string, never>;
    expect(eb.status).toBe("OK");
    expect(eb.items).toEqual([]);   // recorded, and there are none
    expect(eb.count).toBe(0);

    const unrec = await handle(new Request(`https://councilof.ai/api/receipts?payer=${payer}`), async () => null);
    const ub = (await unrec.json()) as Record<string, never>;
    expect(ub.status).toBe("UNRECORDED");
    expect(ub.items).toBeNull();    // not recorded at all
  });
});
