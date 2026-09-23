import { describe, expect, it } from "vitest";
import { onRequestGet as boardGet } from "./gspc";
import { onRequestGet as x402Get } from "./x402";
import { onRequestGet as badgeGet } from "./badge";
import { onRequestGet as badgeMarkdownGet } from "../badge.md";

const getBoard = async () => {
  (globalThis as unknown as { caches: unknown }).caches = {
    default: { match: async () => undefined, put: async () => undefined },
  };
  const response = await boardGet({
    request: new Request("https://councilof.ai/api/gspc"),
    env: {},
    waitUntil: () => undefined,
  } as unknown as Parameters<typeof boardGet>[0]);
  return (await response.json()) as { totals: { lid: string; measured_axes: number; fact_runs: number } };
};

describe("public board lid parity", () => {
  it("uses the served board lid on the x402 catalogue and both badge doors", async () => {
    const { totals } = await getBoard();
    const x402 = await x402Get({
      request: new Request("https://councilof.ai/api/x402"),
      env: {},
    } as unknown as Parameters<typeof x402Get>[0]);
    const catalogue = (await x402.json()) as {
      lid: string;
      rail: { scheme: string; network: string; asset: { symbol: string; contract: string; decimals: number }; pay_to: string };
      resources: unknown[];
    };
    const badge = await badgeGet({
      request: new Request("https://councilof.ai/api/badge?format=json"),
    } as unknown as Parameters<typeof badgeGet>[0]);
    const badgeBody = (await badge.json()) as { lid: string };
    const markdown = await badgeMarkdownGet();

    expect(catalogue.lid).toBe(totals.lid);
    expect(badgeBody.lid).toBe(totals.lid);
    expect(await markdown.text()).toContain(`**Lid:** ${totals.lid}`);
    expect(totals.measured_axes).toBe(23);
    expect(totals.fact_runs).toBe(9);
    // The correction is descriptive only: the buyer's asset, network, pay-to,
    // and catalogue resources remain the existing x402 contract.
    expect(catalogue.rail).toMatchObject({
      scheme: "exact",
      network: "eip155:8453",
      asset: { symbol: "USDC", contract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
      pay_to: "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
    });
    expect(catalogue.resources.length).toBeGreaterThanOrEqual(6);
  });
});
