import { describe, expect, it } from "vitest";
import { challengeFromResult, outputHeader, paidReservePreviewFromResult } from "@/components/ToolRunner";

const base = { ok: false, text: "", state: "runtime_observed" as const };

describe("challengeFromResult", () => {
  it("reads a v2 402 from structuredContent", () => {
    const c = challengeFromResult({
      ...base,
      structuredContent: {
        accepts: [
          {
            network: "eip155:8453",
            asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
            payTo: "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
            amount: "10000",
            resource: "https://councilof.ai/api/proof",
            extra: { name: "USD Coin", version: "2" },
          },
        ],
      },
    } as never);
    expect(c?.payTo).toBe("0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31");
    expect(c?.amount).toBe("10000");
    expect(c?.extra?.version).toBe("2");
  });

  it("accepts the v1 maxAmountRequired spelling", () => {
    const c = challengeFromResult({
      ...base,
      structuredContent: {
        accepts: [
          {
            payTo: "0xabc",
            maxAmountRequired: "20000",
            resource: "https://councilof.ai/api/x",
          },
        ],
      },
    } as never);
    expect(c?.amount).toBe("20000");
  });

  it("returns null rather than guess when payTo is missing", () => {
    expect(
      challengeFromResult({
        ...base,
        structuredContent: {
          accepts: [{ amount: "1", resource: "https://councilof.ai/api/x" }],
        },
      } as never),
    ).toBeNull();
  });

  it("returns null on a result carrying no challenge at all", () => {
    expect(
      challengeFromResult({ ...base, structuredContent: { ok: true } } as never),
    ).toBeNull();
  });

  it("reads the live MCP PAYMENT_REQUIRED envelope (v2 resource object, nested payment_required)", () => {
    const c = challengeFromResult({
      ...base,
      structuredContent: {
        status: "PAYMENT_REQUIRED",
        payment_required: {
          x402Version: 2,
          resource: {
            url: "https://councilof.ai/api/request-attestation",
            description: "A signed card-v0 commission receipt for one named subject.",
            mimeType: "application/json",
          },
          accepts: [
            {
              scheme: "exact",
              network: "eip155:8453",
              asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
              payTo: "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
              amount: "20000",
              extra: { name: "USD Coin", version: "2" },
            },
          ],
        },
      },
    } as never);
    expect(c?.resource).toBe("https://councilof.ai/api/request-attestation");
    expect(c?.payTo).toBe("0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31");
    expect(c?.amount).toBe("20000");
    expect(c?.network).toBe("eip155:8453");
  });
});


describe("paid reserve disclosure", () => {
  it("extracts a zero-card reserve and its date before any payment", () => {
    const result = {
      ...base,
      structuredContent: {
        status: "PAYMENT_REQUIRED",
        payment_required: {
          csoai: {
            schema: "csoai.request-attestation/0.2",
            preview: { signed_cards_on_file: 0, corpus_as_of: "2026-08-19T00:00:00Z" },
          },
        },
      },
    } as never;
    expect(paidReservePreviewFromResult(result)).toEqual({
      signedCardsOnFile: 0,
      corpusAsOf: "2026-08-19T00:00:00Z",
    });
  });

  it("does not invent a reserve count for another door or malformed input", () => {
    expect(paidReservePreviewFromResult({
      ...base, structuredContent: { payment_required: { csoai: {
        schema: "csoai.other/1", preview: { signed_cards_on_file: 0 },
      } } },
    } as never)).toBeNull();
    expect(paidReservePreviewFromResult({
      ...base, structuredContent: { payment_required: { csoai: {
        schema: "csoai.request-attestation/0.2", preview: { signed_cards_on_file: "0" },
      } } },
    } as never)).toBeNull();
  });
});

describe("the result header for a 402 challenge", () => {
  it("reads the live MCP PAYMENT_REQUIRED envelope as PAYMENT REQUIRED (amber), not UNCHECKABLE", () => {
    // Shape read from POST /mcp tools/call commission_card without x_payment, 6 Oct 2026:
    // result.isError true, structuredContent.status "PAYMENT_REQUIRED", nothing_charged true.
    const result = {
      ok: false,
      text: '{"x402Version":2,"error":"Payment required"}',
      state: "unchecked" as const,
      structuredContent: {
        x402Version: 2,
        error: "Payment required",
        status: "PAYMENT_REQUIRED",
        http_status: 402,
        nothing_charged: true,
        delivery_state: "NOT_DELIVERED",
        settlement_state: "NOT_REQUESTED",
      },
    };
    const head = outputHeader(result as never);
    expect(head).toMatchObject({ word: "PAYMENT REQUIRED: nothing has been charged", tone: "payment" });
    expect(head.meaning).toMatch(/own wallet/);
  });
});
