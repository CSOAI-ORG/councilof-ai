import { describe, expect, it } from "vitest";
import { freezeEastWest, GRAMMAR, MEASURED_AXES, OWNER_BLOCKS } from "@/data/eastWest";
import { verifyHashedEnvelope, CARD_KIND } from "@/lib/eastWestCrypto";

describe("East-West frozen artifacts", () => {
  it("freezes a crosswalk hash and a card bound to it", async () => {
    const frozen = await freezeEastWest();
    expect(frozen.crosswalkHash).toMatch(/^[0-9a-f]{64}$/);
    expect(frozen.card.kind).toBe(CARD_KIND);
    expect(frozen.card.measured).toBe("13 measured of 14");
  });
});
