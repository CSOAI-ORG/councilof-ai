import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PRIMARY_PATHS, isLibraried } from "../data/library-ia";

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

  it("is PRIMARY, so it does not ship marked archived — checked against the module, with a control", () => {
    expect(PRIMARY_PATHS.has("/claim-maintenance")).toBe(true);
    expect(isLibraried("/claim-maintenance")).toBe(false);
    // The control matters: an assertion that a predicate is false is worth nothing unless the
    // same predicate is shown to be true for something. /pdca is a libraried reference page.
    expect(isLibraried("/pdca")).toBe(true);
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
      "/spec/claim-maintenance/v0.2/reference/claim-capture.mjs",
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

// Same-site source distribution is an exact copy, not a rewritten implementation. The CURRENT
// reference (the version index's latest) is held to the maintained source; every published
// reference, v0.1 included, is held to its own manifest, and v0.1 to the literal digest its DOI
// pins, so no edit to a manifest can turn this green (spec 12: superseded, never edited).
it("downloads the existing reference without GitHub and pins its bytes", async () => {
  const { createHash } = await import("node:crypto");
  const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");
  const specDir = resolve(ROOT, "public/spec/claim-maintenance");
  const latest = JSON.parse(readFileSync(resolve(specDir, "index.json"), "utf8")).latest;
  expect(latest).toBe("0.2");
  const original = readFileSync(resolve(ROOT, "scripts/claim-capture.mjs"));
  const served = readFileSync(resolve(specDir, `v${latest}/reference/claim-capture.mjs`));
  expect(served.equals(original)).toBe(true);
  for (const v of ["v0.1", `v${latest}`]) {
    const bytes = readFileSync(resolve(specDir, `${v}/reference/claim-capture.mjs`));
    const manifest = JSON.parse(readFileSync(resolve(specDir, `${v}/reference/manifest.json`), "utf8"));
    expect(manifest.files["claim-capture.mjs"].sha256).toBe(sha(bytes));
    expect(manifest.files["claim-capture.mjs"].bytes).toBe(bytes.length);
  }
  expect(sha(readFileSync(resolve(specDir, "v0.1/reference/claim-capture.mjs")))).toBe(
    "a634515bec5e8999d73bf55d2e2c8641351fe0070d40596afa4877f2f3e86f60",
  );
  expect(page).toContain(`/spec/claim-maintenance/v${latest}/reference/claim-capture.mjs`);
  expect(page).not.toContain("git clone https://github.com/");
});
