import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "Wrappers.tsx"), "utf8");
const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
const nav = readFileSync(resolve(__dirname, "../components/HeaderNav.tsx"), "utf8");
const library = readFileSync(resolve(__dirname, "../data/library-ia.ts"), "utf8");
const prerender = readFileSync(resolve(__dirname, "../../../scripts/prerender.mjs"), "utf8");
const ledger = JSON.parse(readFileSync(resolve(__dirname, "../../../public/interop/wrapped-asset-parity-latest.json"), "utf8"));

describe("/wrappers public ledger page", () => {
  it("carries all four wirings a new page needs (route, title, prerender MUST, PRIMARY_PATHS) and a nav entry", () => {
    expect(app).toContain('const Wrappers = lazy(() => import("./pages/Wrappers"))');
    expect(app).toContain('<Route path="/wrappers" component={Wrappers} />');
    expect(app).toMatch(/"\/wrappers": "Wrapped-asset parity ledger/);
    expect(prerender).toContain('"/wrappers"');
    expect(library).toContain('"/wrappers"');
    expect(nav).toContain("href: '/wrappers'");
  });

  it("publishes honest metadata and Dataset JSON-LD with both distributions", () => {
    expect(page).toContain('rel="canonical" href={CANONICAL}');
    expect(page).toContain('"@type": "Dataset"');
    expect(page).toContain("huggingface.co/datasets/csoai/wrapped-asset-parity");
    expect(page).toContain("A read is not a measurement");
    expect(page).toContain("not a reserve attestation");
  });

  it("uses the route title as the single title authority", () => {
    expect(app).toContain('"/wrappers": "Wrapped-asset parity ledger — read, not rated | Council of AI"');
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
});
