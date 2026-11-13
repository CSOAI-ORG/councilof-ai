import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { readFileSync } from "node:fs";
import GpaiEvidencePack from "./GpaiEvidencePack";

describe("GPAI product page offers its existing evidence rather than a different commission", () => {
  it("renders the scoped preview on the page before the informational sections", () => {
    const html = renderToStaticMarkup(<Router ssrPath="/gpai-evidence"><GpaiEvidencePack /></Router>);
    expect(html).toContain('id="existing-gpai-evidence"');
    expect(html.indexOf('id="existing-gpai-evidence"')).toBeLessThan(html.indexOf("The enforcement reality"));
    expect(html).toContain('href="#existing-gpai-evidence"');
    expect(html).not.toContain('href="/dashboard?tab=measured"');
  });
  it("retains the separate fresh-scope enquiry, verifier and no-order boundary", () => {
    const html = renderToStaticMarkup(<Router ssrPath="/gpai-evidence"><GpaiEvidencePack /></Router>);
    expect(html).toContain('href="/contact/?arm=run"');
    expect(html).toContain('href="/gspc-verify"');
    expect(html).toContain("does not book a run or place an order");
  });
  it("does not import a wallet or payment component into the preview", () => {
    const source = readFileSync(new URL("../components/GpaiEvidencePreview.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(/X402PayButton|window\.ethereum|signTypedData|sendTransaction|localStorage|sessionStorage/);
    expect(source).toContain("BUYING_ENQUIRIES");
  });
});
