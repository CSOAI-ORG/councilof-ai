import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "Wrappers.tsx"), "utf8");
const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
const nav = readFileSync(resolve(__dirname, "../components/HeaderNav.tsx"), "utf8");
const library = readFileSync(resolve(__dirname, "../data/library-ia.ts"), "utf8");
const prerender = readFileSync(resolve(__dirname, "../../../scripts/prerender.mjs"), "utf8");
const ledger = JSON.parse(readFileSync(resolve(__dirname, "../../../public/interop/wrapped-asset-parity-latest.json"), "utf8"));
const head = JSON.parse(readFileSync(resolve(__dirname, "../data/seo-head.json"), "utf8")) as { routes: Record<string, { title: string }> };

describe("/wrappers public ledger page", () => {
  it("carries all four wirings a new page needs (route, title, prerender MUST, PRIMARY_PATHS) and a nav entry", () => {
    expect(app).toContain('const Wrappers = lazy(() => import("./pages/Wrappers"))');
    expect(app).toContain('<Route path="/wrappers" component={Wrappers} />');
    // Titles live in client/src/data/seo-head.json since 2026-09-16 (one producer, see lib/seoHead.ts).
    expect(head.routes["/wrappers"]?.title).toMatch(/^Wrapped-asset parity ledger/);
    expect(prerender).toContain('"/wrappers"');
    expect(library).toContain('"/wrappers"');
    expect(nav).toContain("href: '/wrappers'");
  });

  it("publishes honest metadata and Dataset JSON-LD with both distributions", () => {
    // One canonical record: the central writer owns it; the page states the served URL for JSON-LD.
    expect(page).not.toContain('rel="canonical" href={CANONICAL}');
    expect(page).toContain('const CANONICAL = "https://councilof.ai/wrappers/";');
    expect(page).toContain('"@type": "Dataset"');
    expect(page).toContain("huggingface.co/datasets/csoai/wrapped-asset-parity");
    expect(page).toContain("A read is not a measurement");
    expect(page).toContain("not a reserve attestation");
  });

  it("uses the route title as the single title authority", () => {
    expect(head.routes["/wrappers"]?.title).toBe("Wrapped-asset parity ledger — read, not rated | Council of AI");
    expect(app).not.toMatch(/const ROUTE_TITLES/);
    expect(page).not.toContain("<title>");
  });

  it("types no price and no verdict — the amount lives only in the 402; states are named, never collapsed", () => {
    expect(page).not.toMatch(/\$\s?\d/);
    expect(page).not.toMatch(/\b(unbacked|backed by|certif|compliant|approved|guarantee)\b/i);
    for (const s of ["ESCROW_PARITY_READ", "UNCHECKABLE_NATIVE_ISSUANCE", "INDEXED_CUSTODIAL", "UNMEASURED"]) expect(page).toContain(s);
    expect(page).not.toMatch(/(?<!UN)MEASURED\b/);
  });

  it("reads totals from the ledger, never from typed numbers; the committed ledger is well-formed", () => {
    expect(page).not.toMatch(/\b1[0-9] pairs\b/);
    expect(Array.isArray(ledger.records)).toBe(true);
    expect(ledger.records.length).toBe(Object.values(ledger.counts as Record<string, number>).reduce((a, b) => a + b, 0));
    for (const r of ledger.records) expect(["ESCROW_PARITY_READ", "UNCHECKABLE_NATIVE_ISSUANCE", "INDEXED_CUSTODIAL", "UNMEASURED"]).toContain(r.state);
  });

  it("documentary rows are sourced, dated and never read: every axis UNMEASURED, every source carries a retrieval date", () => {
    const doc = ledger.documentary;
    expect(doc?.class).toBe("DOCUMENTARY");
    expect(doc.rows.length).toBe(doc.counts.DOCUMENTARY);
    for (const row of doc.rows) {
      expect(Object.values(row.axes).every((v) => v === "UNMEASURED")).toBe(true);
      expect(row.sources.length).toBeGreaterThan(0);
      for (const s of row.sources) { expect(s.url).toMatch(/^https:\/\//); expect(s.retrieved_at).toMatch(/^\d{4}-\d{2}-\d{2}/); }
    }
    for (const r of ledger.records) {
      if (r.profile === null) continue;
      expect(Object.values(r.profile.axes).every((v) => v === "UNMEASURED")).toBe(true);
      for (const s of r.profile.sources) expect(s.retrieved_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
  });
  it("exposes the free-preview -> 402 -> exact-byte verify -> maintenance path without a typed price", () => {
    expect(page).toContain('const CHANGES = "/api/wrapper/changes?id="');
    expect(page).toContain('const VERIFY = "/api/verify"');
    expect(page).toContain("x-csoai-delivery-sha256");
    expect(page).toContain("Browser clients can read those headers through CORS");
    expect(page).toContain("402 terms");
    expect(page).toContain("buyer acceptance");
  });

});
