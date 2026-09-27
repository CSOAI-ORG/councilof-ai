import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PLAIN_LANGUAGE, exposureLine } from "./bankExposure";

const DIR = resolve(__dirname, "../../../public/interop/instrument-guard");
const signed = (by_axis: Record<string, Record<string, number>>) => ({
  payload: { schema: "csoai.bank-exposure-labels-signed/0.1", by_axis },
});

describe("bank_exposure line", () => {
  it("names the single label every live card carries", () => {
    const l = exposureLine(signed({ governance: { live_cards: 3, PUBLIC_BANK: 3 } }), "governance");
    expect(l?.label).toBe("PUBLIC_BANK");
    expect(l?.sentence).toBe(PLAIN_LANGUAGE.PUBLIC_BANK);
  });
  it("does not collapse a mixed axis to one label", () => {
    const l = exposureLine(signed({ swarm: { live_cards: 4, PUBLIC_BANK: 3, UNPINNED: 1 } }), "swarm");
    expect(l?.label).toBeNull();
    expect(l?.counts).toEqual([["PUBLIC_BANK", 3], ["UNPINNED", 1]]);
  });
  it("absent record, wrong schema or unknown axis reads as nothing, never as clean", () => {
    expect(exposureLine(null, "governance")).toBeNull();
    expect(exposureLine({ payload: { schema: "other", by_axis: {} } }, "governance")).toBeNull();
    expect(exposureLine(signed({}), "governance")).toBeNull();
  });
  it("control: a planted wrong count is not reported as a single label", () => {
    const l = exposureLine(signed({ care: { live_cards: 5, PUBLIC_BANK: 4 } }), "care");
    expect(l?.label).toBeNull();
  });
  it("the sentences are the producer's, byte for byte", () => {
    const p = resolve(DIR, "bank-exposure-labels.json");
    expect(existsSync(p)).toBe(true);
    const rec = JSON.parse(readFileSync(p, "utf8"));
    for (const [k, v] of Object.entries(rec.values as Record<string, { plain_language: string }>)) {
      expect(PLAIN_LANGUAGE[k]).toBe(v.plain_language);
    }
    expect(Object.keys(PLAIN_LANGUAGE).sort()).toEqual(Object.keys(rec.values).sort());
  });
  it("the signed payload's per-axis counts equal the record's", () => {
    const rec = JSON.parse(readFileSync(resolve(DIR, "bank-exposure-labels.json"), "utf8"));
    const s = JSON.parse(readFileSync(resolve(DIR, "bank-exposure-labels.signed.json"), "utf8"));
    expect(s.payload.by_axis).toEqual(rec.by_axis);
  });
});
