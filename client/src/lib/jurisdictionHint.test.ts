import { describe, expect, it } from "vitest";
import { buildJurisdictionHint, countryToDesk, countryToLanguage } from "./jurisdictionHint";

describe("jurisdictionHint", () => {
  it("maps EU27 to eu desk", () => {
    expect(countryToDesk("DE")).toBe("eu");
    expect(countryToDesk("FR")).toBe("eu");
  });

  it("maps GB to uk, CN to china, US to us honesty (not Illinois)", () => {
    expect(countryToDesk("GB")).toBe("uk");
    expect(countryToDesk("CN")).toBe("china");
    expect(countryToDesk("US")).toBe("us");
  });

  it("never treats hint as legal fact", () => {
    const h = buildJurisdictionHint({ country: "DE", source: "cf-country" });
    expect(h.confirmRequired).toBe(true);
    expect(h.doctrine).toMatch(/proxy/i);
    expect(h.deskPath).toBe("/east-west/desks/eu");
    expect(h.language).toBe("de");
  });

  it("Accept-Language can pick en-GB", () => {
    expect(countryToLanguage(null, "en-GB,en;q=0.9")).toBe("en-GB");
  });
});
