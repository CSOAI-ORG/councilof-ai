import { describe, expect, it } from "vitest";
import { challengeFromResult } from "@/components/ToolRunner";

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
});
