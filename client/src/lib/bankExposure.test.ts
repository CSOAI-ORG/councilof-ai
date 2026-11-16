import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PLAIN_LANGUAGE, exposureLine } from "./bankExposure";
import { dayLabel } from "@/components/gspc/claimChecks";

const DIR = resolve(__dirname, "../../../public/interop/instrument-guard");
const signed = (by_axis: Record<string, Record<string, number>>, as_of?: unknown) => ({
  payload: { schema: "csoai.bank-exposure-labels-signed/0.1", by_axis, ...(as_of === undefined ? {} : { as_of }) },
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
  it("carries the record's own as_of, never a date of its own", () => {
    const l = exposureLine(signed({ safety: { live_cards: 2, PUBLIC_BANK: 1, UNPINNED: 1 } }, "2026-09-27T02:09:21Z"), "safety");
    expect(l?.asOf).toBe("2026-09-27T02:09:21Z");
    expect(dayLabel(l!.asOf)).toMatch(/^27 Sept? 2026$/);
    expect(exposureLine(signed({ safety: { live_cards: 2, UNPINNED: 2 } }), "safety")?.asOf).toBeNull();
    expect(exposureLine(signed({ safety: { live_cards: 2, UNPINNED: 2 } }, "not a date"), "safety")?.asOf).toBeNull();
    expect(exposureLine(signed({ safety: { live_cards: 2, UNPINNED: 2 } }, 20260927), "safety")?.asOf).toBeNull();
  });
  it("the live signed record states an as_of the note can print", () => {
    const s = JSON.parse(readFileSync(resolve(DIR, "bank-exposure-labels.signed.json"), "utf8"));
    const l = exposureLine(s, "safety");
    expect(l?.asOf).toBe(s.payload.as_of);
    expect(Number.isFinite(Date.parse(l!.asOf!))).toBe(true);
  });
  it("the labelled cards share no identifier with the signed card index (separate corpora, never added)", () => {
    const rec = JSON.parse(readFileSync(resolve(DIR, "bank-exposure-labels.json"), "utf8"));
    const idx = JSON.parse(readFileSync(resolve(__dirname, "../../../public/signed/card_index.json"), "utf8"));
    const labelled = new Set<string>((rec.cards as { id: string }[]).map((c) => c.id));
    const indexed = new Set<string>((idx.cards as { card: string }[]).map((c) => c.card));
    expect(labelled.size).toBeGreaterThan(0);
    expect(indexed.size).toBe(idx.n_cards);
    const overlap = [...labelled].filter((id) => indexed.has(id));
    expect(overlap).toEqual([]);
    // The per-axis live count the note prints is a count over the labelled set, not over the index.
    const safetyLive = (rec.cards as { axis: string; live: boolean }[]).filter((c) => c.axis === "safety" && c.live).length;
    expect(rec.by_axis.safety.live_cards).toBe(safetyLive);
  });
});
