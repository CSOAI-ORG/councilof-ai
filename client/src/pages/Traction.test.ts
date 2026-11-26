import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import ExternalUseEvidence from "../components/ExternalUseEvidence";
import { EXTERNAL_USE_EXAMPLES, EXTERNAL_USE_REVIEWED } from "../data/external-use";
import INSTITUTIONS_REGISTER from "../../../public/interop/institutions-register.json";
import Traction from "./Traction";

const source = readFileSync(new URL("./Traction.tsx", import.meta.url), "utf8");
const ia = readFileSync(new URL("../data/library-ia.ts", import.meta.url), "utf8");

// renderToStaticMarkup escapes apostrophes in text nodes; compare through the same escape.
const escaped = (text: string) => text.replace(/'/g, "&#x27;");

describe("traction public-truth contract", () => {
  it("offers a source-linked research review without granting authority or implying funding", () => {
    const html = renderToStaticMarkup(createElement(Router, { ssrPath: "/traction", children: createElement(Traction) }));
    expect(html).toContain('id="research-diligence"');
    expect(html).toContain('href="#research-diligence"');
    for (const href of ["/methodology", "/gspc-verify", "#external-use", "/independence/", "/working-groups/catalog.json", "/api/gspc", "/api/corrections"]) {
      expect(html).toContain('href="' + href + '"');
    }
    expect(html).toContain("A catalogue entry is not human authority");
    expect(html).toContain("A valid publisher signature does not independently reproduce the measurement");
    expect(html).toContain("No score, membership or download count establishes certification, funding or customer adoption");
  });

  it("derives operating and commercial counters from public JSON", () => {
    for (const endpoint of ["/root.json", "/api/revenue", "/api/commissions", "/api/coverage", "/api/worker", "/api/corrections"]) {
      expect(source).toContain(endpoint);
    }
    expect(source).toContain("No cached number substituted");
  });

  it("counts published corrections from the ledger, never a typed number", () => {
    expect(source).toContain("corrections.value.corrections.length");
    expect(source).toContain('label="Published corrections"');
    expect(source).not.toMatch(/Published corrections" value="\d/);
  });

  it("headlines outside commissions only, never the raw receipt count", () => {
    expect(source).toContain("commissions.value?.by_origin");
    expect(source).toContain('label="Outside commissions"');
    expect(source).toContain("value={live.commissions?.outside}");
    expect(source).not.toContain('label="Open commissions"');
    expect(source).not.toMatch(/value=\{live\.commissions\?\.count\}/);
  });

  it("dates outside evidence and keeps execution, contribution and citation within scope", () => {
    expect(EXTERNAL_USE_REVIEWED).toBe("2026-11-16");
    const rerun = EXTERNAL_USE_EXAMPLES.find((example) => example.id === "r7-rerun")!;
    expect(rerun.sources[0].href).toBe("https://github.com/probityai/agent-evidence-vectors/actions/runs/41583335594");
    expect(rerun.boundary).toMatch(/does not establish production deployment, customer acceptance/);
    expect(rerun.detail).toMatch(/outputs were visible/);
    const implementation = EXTERNAL_USE_EXAMPLES.find((example) => example.id === "evidence-state-implementation")!;
    expect(implementation.event).toMatch(/Merged into the W3C AIKR Community Group repository: 8 November 2026/);
    expect(implementation.boundary).toMatch(/does not establish W3C Recommendation status, standards adoption, endorsement or production deployment/);
    const independentReproduction = EXTERNAL_USE_EXAMPLES.find((example) => example.id === "safe-template-reproduction")!;
    expect(independentReproduction.event).toContain("18 October 2026");
    expect(independentReproduction.revision).toBe("b640a9045730a07e72ad5d90a62fde906ca99b80");
    expect(independentReproduction.sources[0].href).toContain("issuecomment-6251270225");
    expect(independentReproduction.boundary).toMatch(/not an unrelated third party running Council's product/);
    expect(independentReproduction.boundary).toMatch(/upstream PR #60 remains open/);
    const citation = EXTERNAL_USE_EXAMPLES.find((example) => example.id === "framing-space-citation")!;
    expect(citation.boundary).toMatch(/individual Internet-Draft, not an adopted IETF standard or RFC/);
    for (const example of EXTERNAL_USE_EXAMPLES) {
      expect(example.sources.length).toBeGreaterThan(0);
      for (const reference of example.sources) expect(reference.href).toMatch(/^https:\/\//);
    }
  });

  it("records the outside Kaggle notebook as dated data reuse, within scope", () => {
    expect(source).toContain("https://www.kaggle.com/code/hosseinbadrnezhad/csoai-gspc-living-board-etl-eda-visualize-model");
    expect(source).toContain("https://www.kaggle.com/datasets/nicktempleman/csoai-gspc-living-board");
    expect(source).toContain("last run to 14 November 2026");
    expect(source).toContain("not a review of the measurement method, a validation of any result or a customer deployment");
    expect(source).toContain("Sources reviewed 17 November 2026");
  });

  it("keeps distribution attribution, adoption census and commercial records separate", () => {
    expect(source).toContain("Council, MEOK and shared material");
    expect(source).toContain("do not identify unique users or customers");
    expect(source).toContain("unmeasured stages of the estate-wide adoption census");
    expect(source).toContain('id="commercial-evidence"');
    expect(source).toContain("not a full set of company accounts");
    expect(source).toContain("No company or standalone IP valuation is established");
  });

  it("keeps status and scope visible in both compact and full evidence views", () => {
    for (const compact of [true, false]) {
      const html = renderToStaticMarkup(createElement(Router, { ssrPath: "/traction", children: createElement(ExternalUseEvidence, { compact }) }));
      expect(html.match(/<article /g)).toHaveLength(4);
      expect(html).toMatch(/datetime="2026-11-16"/i);
      expect(html).toContain("16 November 2026");
      expect(html).toContain("Merged into the W3C AIKR Community Group repository: 8 November 2026");
      expect(html).toMatch(/SAFE template author reviewed Council(?:&#x27;|&#39;|')s checker/);
      expect(html).toContain("upstream PR #60 remains open");
      expect(html).not.toContain("open and unmerged on 4 November 2026");
      expect(html).toContain("does not establish production deployment, customer acceptance");
      expect(html).toContain("not an adopted IETF standard or RFC");
      if (compact) expect(html).toContain('href="/traction/#external-use"');
      else expect(html).toContain(EXTERNAL_USE_EXAMPLES[0].revision);
    }
  });

  it("removes the stale August vanity inventory and keeps traction primary", () => {
    expect(source).not.toMatch(/15574|21091|579 public repos|last audit: 2026-08-10/);
    expect(ia).toMatch(/"\/faq", "\/traction"/);
  });

  it("renders the institutions register from the committed artifact, within scope", () => {
    // The section reads the register artifact, not typed rows, and links the machine surface.
    expect(source).toContain('id="institutions-register"');
    expect(source).toContain("Institutions register");
    expect(source).toContain("public/interop/institutions-register.json");
    expect(source).toContain('href="/api/institutions"');
    expect(INSTITUTIONS_REGISTER.schema).toBe("csoai.institutions-register/0.1");
    const rows = INSTITUTIONS_REGISTER.rows as {
      actor: string;
      date_or_since: string;
      claim_boundary: string;
      sources: string[];
      relationship_state: string;
      evidence_quality: { url: string; label: string }[];
    }[];
    expect(rows).toHaveLength(8);
    for (const row of rows) {
      // Every row stays a bounded observation with its own sources and honest default relationship.
      expect(row.relationship_state).toBe("none_on_record");
      expect(row.claim_boundary.length).toBeGreaterThan(0);
      expect(row.sources.length).toBeGreaterThan(0);
      expect(row.evidence_quality.map((e) => e.url)).toEqual(row.sources);
    }
    // The rendered page carries every row, its date formatting and the boundary line.
    const html = renderToStaticMarkup(createElement(Router, { ssrPath: "/traction", children: createElement(Traction) }));
    expect(html).toContain("Institutions register");
    expect(html).toContain("as of 2026-11-19");
    expect(html).toContain("3 November 2026");
    expect(html).toContain("Since 23 July 2026");
    expect(html).toContain("relationship_state: none on record");
    for (const row of rows) {
      expect(html).toContain(escaped(row.actor));
      for (const href of row.sources) expect(html).toContain(href);
    }
    // The register is visibility for the catalogue; it does not claim an institution count.
    expect(html).toContain("never a count of customers");
  });
});
