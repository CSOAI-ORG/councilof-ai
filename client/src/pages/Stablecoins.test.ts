import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "Stablecoins.tsx"), "utf8");
const view = readFileSync(resolve(__dirname, "../components/StablecoinReadinessView.tsx"), "utf8");
const relation = readFileSync(resolve(__dirname, "../components/StablecoinCorpusRelation.tsx"), "utf8");
const app = readFileSync(resolve(__dirname, "../App.tsx"), "utf8");
const nav = readFileSync(resolve(__dirname, "../components/HeaderNav.tsx"), "utf8");
const library = readFileSync(resolve(__dirname, "../data/library-ia.ts"), "utf8");
const readiness = JSON.parse(
  readFileSync(
    resolve(__dirname, "../../../public/interop/stablecoin-universe-2026-09/readiness.json"),
    "utf8",
  ),
);

describe("/stablecoins public evidence landing", () => {
  it("routes and promotes the canonical public page", () => {
    expect(app).toContain('const Stablecoins = lazy(() => import("./pages/Stablecoins"))');
    expect(app).toContain('<Route path="/stablecoins" component={Stablecoins} />');
    expect(nav).toContain("name: 'Stablecoin readiness', href: '/stablecoins'");
    expect(library).toContain('"/stablecoins"');
  });

  it("reuses the evidence-backed readiness view", () => {
    expect(page).toContain("StablecoinReadinessView");
    expect(view).toContain("loadStablecoinReadiness");
    expect(view).toContain("loadStablecoinPromotionQueue");
  });

  it("publishes honest metadata and dataset JSON-LD", () => {
    // One canonical record: the central writer owns it; the page states the served URL for JSON-LD.
    expect(page).not.toContain('rel="canonical" href={CANONICAL}');
    expect(page).toContain('const CANONICAL = "https://councilof.ai/stablecoins/";');
    expect(page).toContain('type="application/ld+json"');
    expect(page).toContain('"@type": "Dataset"');
    expect(page).toContain("READINESS_LEDGER");
    expect(page).toContain("PROMOTION_QUEUE");
    expect(page).toContain("Indexed is not measured.");
  });

  it("keeps every displayed total evidence-derived and indexed distinct from measured", () => {
    expect(page + view + relation).not.toMatch(/\b(?:425|424|1640|211|302|283|123)\b/);
    expect(readiness.assets).toHaveLength(readiness.coverage.indexed_assets);
    expect(readiness.coverage.deeply_measured_assets).toBe(
      readiness.assets.filter((asset: { measurement: { state: string } }) =>
        asset.measurement.state === "MEASURED",
      ).length,
    );
    expect(readiness.coverage.deeply_measured_assets).toBeLessThan(
      readiness.coverage.indexed_assets,
    );
  });

  it("separates readiness, the supply read and parity (corpus_relation) and adds the cross-ledger section", () => {
    expect(page).toContain("<StablecoinCorpusRelation />");
    expect(relation).toContain('id="corpus_relation"');
    expect(relation).toContain("corpus_relation: {CORPUS_RELATION.relation}");
    expect(relation).toContain('id="cross-ledger"');
    expect(relation).toMatch(/Cross-ledger reads/);
    for (const id of ["readiness", "supply_read", "parity"]) expect(relation).toContain(`id="${id}"`);
    // a figure that cannot be read is shown as UNMEASURED with no fallback number
    expect(relation).toContain("No fallback figure is shown.");
    expect(page).toContain('const CROSS_LEDGER = "/api/xl";');
    expect(page).toContain("contentUrl: `https://councilof.ai${CROSS_LEDGER}`");
  });
});
