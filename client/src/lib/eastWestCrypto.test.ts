import { describe, expect, it } from "vitest";
import { freezeEastWest, GRAMMAR, MEASURED_AXES, OWNER_BLOCKS } from "@/data/eastWest";
import { verifyHashedEnvelope, CARD_KIND } from "@/lib/eastWestCrypto";

describe("East-West frozen artifacts", () => {
  it("freezes a crosswalk hash and a card bound to it", async () => {
    const frozen = await freezeEastWest();
    expect(frozen.crosswalkHash).toMatch(/^[0-9a-f]{64}$/);
    expect(frozen.card.crosswalk.hash).toBe(frozen.crosswalkHash);
    expect(frozen.card.kind).toBe(CARD_KIND);
    expect(frozen.card.grammar).toBe(GRAMMAR.product);
    expect(frozen.card.measured).toBe("13 measured of 14");
    expect(frozen.card.axes.filter((a) => a.status === "MEASURED")).toHaveLength(MEASURED_AXES.length);
    expect(frozen.card.axes.find((a) => a.axis === "jail")?.status).toBe("UNMEASURED");
    expect(MEASURED_AXES).toHaveLength(13);
    const v = await verifyHashedEnvelope(frozen.card, {
      expectedCrosswalkHash: frozen.crosswalkHash,
    });
    expect(v.ok).toBe(true);
  });

  it("fails closed on a tampered card", async () => {
    const frozen = await freezeEastWest();
    const v = await verifyHashedEnvelope(frozen.vectors.tampered, {
      expectedCrosswalkHash: frozen.crosswalkHash,
    });
    expect(v.ok).toBe(false);
    expect(v.lines.some((l) => l.label === "contentHash" && l.ok === false)).toBe(true);
  });

  it("fails closed on a wrong crosswalk hash", async () => {
    const frozen = await freezeEastWest();
    const v = await verifyHashedEnvelope(frozen.vectors.wrongCrosswalkHash, {
      expectedCrosswalkHash: frozen.crosswalkHash,
    });
    expect(v.ok).toBe(false);
  });

  it("keeps owner blocks honest and never sells scores", () => {
    expect(OWNER_BLOCKS.pricing).toMatch(/OWNER-BLOCKED/);
    expect(OWNER_BLOCKS.sale).toMatch(/0/);
    expect(GRAMMAR.scores).toMatch(/never sold/i);
    expect(GRAMMAR.product).not.toMatch(/certif/i);
  });
});

describe("East-West grammar lint", () => {
  it("does not claim certification or forecasts in canon strings", async () => {
    const frozen = await freezeEastWest();
    const blob = JSON.stringify(frozen.crosswalk) + JSON.stringify(frozen.card);
    expect(blob).not.toMatch(/\bis certified\b/i);
    expect(blob).not.toMatch(/\bforecast\b/i);
    expect(blob).not.toMatch(/dorado\.dev/i);
    expect(blob).not.toMatch(/growing fast/i);
    expect(blob).toMatch(/13 measured of 14/);
    expect(blob).toMatch(/determination stays with authorities/i);
  });
});

describe("East-West commerce honesty", () => {
  it("keeps the buyer screen, license, and x402 rail unpublished until the owner ruling", async () => {
    const {
      BUYER_SCREEN,
      LICENSE_TERMS,
      X402_FALLBACK,
      COMMERCE_FIREWALL,
      ONE_PAGERS,
      PRICING_DOCTRINE,
    } = await import("@/data/eastWest");
    expect(PRICING_DOCTRINE.status).toBe("OWNER-BLOCKED");
    expect(PRICING_DOCTRINE.scores).toMatch(/£0 forever/);
    expect(X402_FALLBACK.status).toBe("OWNER-BLOCKED");
    expect(X402_FALLBACK.primary).toMatch(/not live/i);
    expect(LICENSE_TERMS.status).toMatch(/template only/i);
    expect(LICENSE_TERMS.weAlways).toMatch(/never white-labels/i);
    expect(BUYER_SCREEN.some((s) => /invented numbers/i.test(s.fail))).toBe(true);
    expect(COMMERCE_FIREWALL.some((f) => /Published count is 0/.test(f))).toBe(true);
    expect(ONE_PAGERS).toHaveLength(3);
    expect(ONE_PAGERS.every((p) => /Verify any of it without asking us/.test(p.close))).toBe(true);
  });
});
