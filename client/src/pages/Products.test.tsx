import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Products from "./Products";

/**
 * /products — derived page tests.
 * Asserts: the page renders the catalog it fetches (no typed SKU list),
 * prints no price-like string, carries the lid, and links the SKU docs.
 */

const CATALOG = {
  schema: "csoai.x402-catalog/0.2",
  one_line: "Verification is free forever. Agents pay per artefact.",
  lid: "22 axes measured · 14 model fleets · not a certificate.",
  tiers: [
    { tier: 1, id: "issuance", name: "Commission a signed card (request-attestation)", resource: "https://councilof.ai/api/request-attestation?subject=<id>&axis=<slug>", free_preview: "https://councilof.ai/api/request-attestation?subject=<id>", deliverable: "one card-v0 leaf" },
    { tier: 2, id: "evidence_bundle", name: "Evidence bundle mapped to an obligation", resource: "https://councilof.ai/api/evidence-bundle?obligation=article-50", free_preview: "https://councilof.ai/api/evidence-bundle?obligation=<id>", deliverable: "OSCAL observations of already-signed cards" },
    { tier: 3, id: "data_feed", name: "Signed data feed (assembly + cadence)", resource: "https://councilof.ai/api/eunomia-data?feed=1", free_preview: "https://councilof.ai/api/eunomia-data", deliverable: "one feed document with signed signals index" },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("/products derived page", () => {
  it("renders tiers from the fetched catalog, not from a typed list", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => CATALOG })));
    render(<Products />);
    await waitFor(() => expect(screen.getByText(/Evidence bundle mapped to an obligation/i)).toBeTruthy());
    expect(screen.getByText(/Signed data feed/i)).toBeTruthy();
    expect(screen.getByText(/Commission a signed card/i)).toBeTruthy();
  });

  it("carries the lid verbatim from the catalog", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => CATALOG })));
    render(<Products />);
    await waitFor(() => expect(screen.getByText(/not a certificate/i)).toBeTruthy());
  });

  it("never prints a price-like string (price-gate doctrine)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => CATALOG })));
    const { container } = render(<Products />);
    await waitFor(() => expect(screen.getByText(/Evidence bundle mapped to an obligation/i)).toBeTruthy());
    const text = container.textContent ?? "";
    expect(text.match(/[\$£€]\s*\d+(\.\d+)?/)).toBeNull();
    expect(text).not.toMatch(/\b(?:price|prices?)\s*:\s*\d+/i);
  });

  it("links each SKU to its docs/product description", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => CATALOG })));
    render(<Products />);
    await waitFor(() => expect(screen.getByText(/commission-card\.md/i)).toBeTruthy());
  });
});
