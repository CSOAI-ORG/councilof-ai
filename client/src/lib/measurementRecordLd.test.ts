import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { measurementRecordLd, ldJson } from "./measurementRecordLd";
import MEDICARE from "@/data/measurements/disclosure-lag/2026-09-medicare-agent.json";
import GEMINI from "@/data/measurements/disclosure-lag/2026-09-gemini-evaluation.json";

const ROOT = resolve(__dirname, "../../..");
const CASES = [
  { base: "/measurements/disclosure-lag/2026-09-medicare-agent/record", rec: MEDICARE, page: "client/src/pages/DisclosureLagMedicareAgent.tsx" },
  { base: "/measurements/disclosure-lag/2026-09-gemini-evaluation/record", rec: GEMINI, page: "client/src/pages/DisclosureLagGeminiEvaluation.tsx" },
];

describe("measurement record Dataset JSON-LD", () => {
  for (const c of CASES) {
    it(`${c.base}: fields dataset search reads, copied from the record, files served beside the page`, () => {
      const ld = measurementRecordLd(c.base, c.rec as never, "A record name", "x".repeat(60));
      expect(ld["@type"]).toBe("Dataset");
      expect(ld.url).toBe(`https://councilof.ai${c.base.replace(/\/record$/, "/")}`);
      expect(ld.dateModified).toBe(c.rec.as_of);
      expect(ld.identifier).toBe(c.rec.capsules[0].subject_id);
      expect(ld.creativeWorkStatus).toBe(c.rec.capsules[0].measurement_state);
      expect("license" in ld).toBe(false); // the record states none; none is asserted
      for (const d of ld.distribution) {
        const local = resolve(ROOT, "public" + d.contentUrl.replace("https://councilof.ai", ""));
        expect(existsSync(local), local).toBe(true);
      }
      const src = readFileSync(resolve(ROOT, c.page), "utf8");
      expect(src).toMatch(/<script type="application\/ld\+json" dangerouslySetInnerHTML=\{\{ __html: ldJson\(LD\) \}\} \/>/);
      expect(src).toMatch(/measurementRecordLd\(BASE, REC, /);
    });
  }
  it("a '<' in a value cannot close the script element", () => {
    expect(ldJson({ a: "</script>" })).toBe('{"a":"\\u003c/script>"}');
  });
});
