import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GSPC_HEALTH_PITCH,
  HEALTH_TERMS,
  HEALTH_TERMS_RULING,
  HEALTH_VOICE,
  healthVoiceFromLive,
  termsWeRefuse,
  termsWeUse,
} from "./healthTerms";

const products = readFileSync(resolve(__dirname, "../pages/Products.tsx"), "utf8");

describe("Health terms we can borrow", () => {
  it("uses chart language and refuses NEWS-style composites", () => {
    expect(HEALTH_TERMS_RULING).toMatch(/vital signs/i);
    expect(HEALTH_TERMS_RULING).toMatch(/Do not speak like NEWS/);
    expect(HEALTH_VOICE).toMatch(/Do not say the patient is well/);
    expect(HEALTH_VOICE).not.toMatch(/15 of 22|Seven deferred|7 unmeasured/i);
    const liveVoice = healthVoiceFromLive({
      axes: 22,
      measured_axes: 22,
      unmeasured_axes: 0,
      public_count: "22 axis · 22 measured",
    });
    expect(liveVoice).toMatch(/22 of 22 systems examined/);
    expect(liveVoice).toMatch(/22 axis · 22 measured/);
    expect(liveVoice).toMatch(/No systems deferred/);
    expect(liveVoice).not.toMatch(/Seven deferred|7 unmeasured|15 of 22/i);
    expect(GSPC_HEALTH_PITCH).toMatch(/open-source systems and AI models/);
    expect(GSPC_HEALTH_PITCH).toMatch(/never issue a clean bill of health/);
    expect(termsWeUse().some((t) => t.id === "vital-signs")).toBe(true);
    expect(termsWeUse().some((t) => t.id === "ros")).toBe(true);
    expect(termsWeUse().some((t) => t.id === "coverage")).toBe(true);
    expect(termsWeUse().some((t) => t.id === "second-opinion")).toBe(true);
    expect(termsWeRefuse().some((t) => t.id === "news")).toBe(true);
    expect(termsWeRefuse().some((t) => t.id === "prognosis")).toBe(true);
    expect(termsWeRefuse().some((t) => t.id === "wnl")).toBe(true);
    expect(HEALTH_TERMS.length).toBeGreaterThanOrEqual(16);
  });

  it("does not smuggle a fused grade or a sold rank", () => {
    const blob = JSON.stringify({ HEALTH_TERMS, HEALTH_TERMS_RULING, HEALTH_VOICE });
    expect(blob).not.toMatch(/£79|£499|rank for sale|22\/22|dorado|cibola|sovos/i);
    expect(products).toContain("HealthTerms");
  });
});
