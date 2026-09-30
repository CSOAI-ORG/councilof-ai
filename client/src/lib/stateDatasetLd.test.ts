import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import DOC from "@/data/state/2026-09-numbers.json";
import { sourceDatasets, stateReportDatasetLd, type StateNumbersDoc } from "./stateDatasetLd";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const read = (p: string) => readFileSync(root + p, "utf8");
const doc = DOC as unknown as StateNumbersDoc;

describe("State of the Agent Internet — Dataset JSON-LD comes from numbers.json", () => {
  const ld = stateReportDatasetLd(doc) as Record<string, any>;

  it("is a schema.org Dataset whose fields are the edition's own", () => {
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Dataset");
    expect(ld.name).toBe(DOC.title);
    expect(ld.description).toBe(`${DOC.what_this_is} ${DOC.doctrine}`);
    expect(ld.description.length).toBeGreaterThanOrEqual(50); // Google Dataset Search: 50–5000 characters
    expect(ld.description.length).toBeLessThanOrEqual(5000);
    expect(ld.url).toBe(DOC.page);
    expect(ld.dateModified).toBe(DOC.built_at);
    expect(ld.creator).toMatchObject({ "@type": "Organization", name: DOC.publisher, url: "https://councilof.ai/" });
    expect(ld.license).toBe("https://creativecommons.org/licenses/by/4.0/");
  });

  it("distribution points at files that are published beside the page", () => {
    const urls = ld.distribution.map((d: any) => d.contentUrl);
    expect(urls).toEqual(["https://councilof.ai/state/2026-09/numbers.json", "https://councilof.ai/state/2026-09/numbers.signed.json"]);
    for (const d of ld.distribution) {
      expect(d["@type"]).toBe("DataDownload");
      expect(d.encodingFormat).toBe("application/json");
      expect(existsSync(root + "public" + new URL(d.contentUrl).pathname), d.contentUrl).toBe(true);
    }
    // the page reads a byte-identical copy of the published numbers.json
    expect(read("client/src/data/state/2026-09-numbers.json")).toBe(read("public/state/2026-09/numbers.json"));
  });

  it("the licence premise holds: every public copy a source names is a csoai Hugging Face dataset", () => {
    const copies = Object.values(doc.sources).map((s) => s.public_copy).filter((u): u is string => !!u);
    expect(copies.length).toBeGreaterThan(0);
    for (const u of copies) expect(u, u).toMatch(/^https:\/\/huggingface\.co\/datasets\/csoai\//);
    expect(ld.isBasedOn).toEqual(sourceDatasets(doc));
    expect(ld.isBasedOn.length).toBeGreaterThan(0);
  });

  it("both /state/ pages emit it", () => {
    for (const p of ["client/src/pages/StateIndex.tsx", "client/src/pages/StateReport202609.tsx"]) {
      const s = read(p);
      expect(s, p).toContain('type="application/ld+json"');
      expect(s, p).toContain("stateReportDatasetLd(");
    }
  });
});
