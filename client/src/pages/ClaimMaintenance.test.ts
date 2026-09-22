import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const page = readFileSync(resolve(__dirname, "ClaimMaintenance.tsx"), "utf8");
const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
const library = readFileSync(resolve(__dirname, "../data/library-ia.ts"), "utf8");
const seoHead = JSON.parse(readFileSync(resolve(__dirname, "../data/seo-head.json"), "utf8"));
const ROOT = resolve(__dirname, "../../..");
const prerender = readFileSync(resolve(ROOT, "scripts/prerender.mjs"), "utf8");
const specMd = readFileSync(
  resolve(ROOT, "public/spec/claim-maintenance/v0.1/claim-maintenance-v0.1.md"),
  "utf8",
);
const specHtml = readFileSync(resolve(ROOT, "public/spec/claim-maintenance/v0.1/index.html"), "utf8");
const specJson = JSON.parse(
  readFileSync(resolve(ROOT, "public/spec/claim-maintenance/v0.1/spec.json"), "utf8"),
);

describe("/claim-maintenance — the four wirings a new page needs", () => {
  it("is lazily imported, routed, titled, prerendered and registered PRIMARY", () => {
    expect(app).toContain('const ClaimMaintenance = lazy(() => import("./pages/ClaimMaintenance"))');
    expect(app).toContain('<Route path="/claim-maintenance" component={ClaimMaintenance} />');
    expect(seoHead.routes["/claim-maintenance"]?.title).toMatch(/^Claim maintenance/);
    expect(seoHead.routes["/claim-maintenance"]?.description?.length).toBeGreaterThan(80);
    // Without the MUST entry a crawler cold-loading the category name gets the SPA shell.
    expect(prerender).toContain('"/claim-maintenance"');
    // Without PRIMARY_PATHS the page ships flagged "archived" under a link we actively promote.
    expect(library).toContain('"/claim-maintenance"');
  });

  it("keeps the trailing-slash canonical constant and leaves the canonical tag to the central writer", () => {
    expect(page).toContain('const CANONICAL = "https://councilof.ai/claim-maintenance/"');
    expect(page).not.toMatch(/rel=["']canonical["']/);
  });
});

describe("/claim-maintenance — the page states the category and links every artifact", () => {
  it("carries the definition, in the same words as the specification", () => {
    const sentence =
      "continuous, independent observation of the public claims an organisation makes about itself";
    expect(page.replace(/\s+/g, " ")).toContain(sentence);
    expect(specMd.replace(/\s+/g, " ")).toContain(sentence);
  });

  it("links the specification, the register, the reference implementation and the corrections ledger", () => {
    for (const href of [
      "/spec/claim-maintenance/v0.1/",
      "/spec/claim-maintenance/v0.1/claim-maintenance-v0.1.md",
      "/spec/claim-maintenance/v0.1/schema/claim-artifact-v0.1.schema.json",
      "/spec/claim-maintenance/",
      "/api/claims/register",
      "/spec/claim-maintenance/register.json",
      "/api/corrections",
      "scripts/claim-capture.mjs",
    ]) {
      expect(page, `page does not link ${href}`).toContain(href);
    }
    // The live registries themselves are reached per-subject from the register, not typed here.
    expect(page).toContain("s.registry_url");
  });

  it("says plainly what it does not do — all five, plus the non-allegation rule", () => {
    for (const s of [
      "not fact-checking",
      "not certification",
      "not auditing",
      "not reputation scoring",
      "not adversarial journalism",
    ]) {
      expect(page.toLowerCase()).toContain(s);
    }
    expect(page).toMatch(/asserts no falsity about anyone/i);
    expect(page).toMatch(/neither an endorsement nor an accusation|not an endorsement and it is not an accusation/i);
  });

  it("names the four states and no fifth", () => {
    for (const s of ["CLAIM_CAPTURED", "CLAIM_MEASURED", "UNMEASURED", "UNCHECKABLE"]) {
      expect(page).toContain(s);
    }
    expect(page).not.toMatch(/CLAIM_DISPUTED|CLAIM_FALSE|CLAIM_REFUTED|CLAIM_VERIFIED/);
  });

  it("types no count, no price and no verdict — every number is read from the live register", () => {
    expect(page).toContain("read(REGISTER)");
    expect(page).toContain("read(REGISTER_STATIC)");
    expect(page).toContain("reg?.as_of");
    // No frozen population figures.
    expect(page).not.toMatch(/\b\d+\s+(subjects?|claims?|registries|organisations)\b/i);
    expect(page).not.toMatch(/(?:£|\$|€)\s?\d/);
    expect(page).not.toMatch(/\b(get certified|we certify|certified by)\b/i);
    // No verdict vocabulary about any subject.
    expect(page).not.toMatch(/\b(debunk|busted|caught out|red-handed)\b/i);
  });
});

describe("the published specification is citable and self-describing", () => {
  it("has a stable versioned URL, a date, a digest of its document of record, and CC0", () => {
    expect(specJson.version).toBe("0.1");
    expect(specJson.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(specJson.canonical_url).toBe("https://councilof.ai/spec/claim-maintenance/v0.1/");
    expect(specJson.document_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(specJson.licence).toBe("CC0-1.0");
    expect(specJson.cite_as).toContain("Claim Maintenance, version 0.1");
  });

  it("ships JSON-LD, a canonical link and a description a stranger can read", () => {
    expect(specHtml).toContain('<link rel="canonical" href="https://councilof.ai/spec/claim-maintenance/v0.1/">');
    expect(specHtml).toContain('"@type":"TechArticle"');
    expect(specHtml).toContain('"encodingFormat":"text/markdown"');
    expect(specHtml).toMatch(/<meta name="description" content="Claim maintenance: /);
    expect(specHtml).toContain("creativecommons.org/publicdomain/zero/1.0/");
  });

  it("the HTML is derived from the Markdown, so the two cannot disagree", () => {
    // The digest in the footer is the digest of the .md the generator read.
    const digest = specJson.document_sha256;
    expect(specHtml).toContain(digest);
  });

  it("carries a persistent identifier we do not control, and the deposited bytes are the served bytes", () => {
    const deposit = JSON.parse(
      readFileSync(resolve(ROOT, "public/spec/claim-maintenance/v0.1/deposit.json"), "utf8"),
    );
    expect(deposit.doi).toMatch(/^10\.5281\/zenodo\.\d+$/);
    expect(deposit.licence).toBe("CC0-1.0");
    // The archived copy and the served copy must hash the same, or the DOI cites something else.
    expect(deposit.document_sha256).toBe(specJson.document_sha256);
    expect(specJson.doi).toBe(deposit.doi);
    expect(specJson.concept_doi).toBe(deposit.concept_doi);
    expect(specHtml).toContain(deposit.doi);
    expect(page).toContain(deposit.doi);
    // A deposit is storage and an identifier, never a review.
    expect(deposit.does_not_prove.join(" ")).toMatch(/not a review/);
    expect(page).toMatch(/does not make it right/);
  });
});
