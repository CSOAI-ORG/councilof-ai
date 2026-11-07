import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import ExternalUseEvidence from "../components/ExternalUseEvidence";
import { EXTERNAL_USE_EXAMPLES, EXTERNAL_USE_REVIEWED } from "../data/external-use";

const source = readFileSync(new URL("./Traction.tsx", import.meta.url), "utf8");
const ia = readFileSync(new URL("../data/library-ia.ts", import.meta.url), "utf8");

describe("traction public-truth contract", () => {
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
    expect(EXTERNAL_USE_REVIEWED).toBe("2026-11-04");
    const rerun = EXTERNAL_USE_EXAMPLES.find((example) => example.id === "r7-rerun")!;
    expect(rerun.sources[0].href).toBe("https://github.com/probityai/agent-evidence-vectors/actions/runs/41583335594");
    expect(rerun.boundary).toMatch(/does not establish production deployment, customer acceptance/);
    expect(rerun.detail).toMatch(/outputs were visible/);
    const implementation = EXTERNAL_USE_EXAMPLES.find((example) => example.id === "evidence-state-implementation")!;
    expect(implementation.event).toMatch(/open and unmerged/);
    expect(implementation.boundary).toMatch(/does not establish W3C adoption or endorsement/);
    const citation = EXTERNAL_USE_EXAMPLES.find((example) => example.id === "framing-space-citation")!;
    expect(citation.boundary).toMatch(/individual Internet-Draft, not an adopted IETF standard or RFC/);
    for (const example of EXTERNAL_USE_EXAMPLES) {
      expect(example.sources.length).toBeGreaterThan(0);
      for (const reference of example.sources) expect(reference.href).toMatch(/^https:\/\//);
    }
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
      expect(html.match(/<article /g)).toHaveLength(3);
      expect(html).toMatch(/datetime="2026-11-04"/i);
      expect(html).toContain("open and unmerged on 4 November 2026");
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
});
