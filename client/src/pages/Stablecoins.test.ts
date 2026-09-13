import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(__dirname, "Stablecoins.tsx"), "utf8");
const view = readFileSync(resolve(__dirname, "../components/StablecoinReadinessView.tsx"), "utf8");
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
    expect(page).toContain('rel="canonical" href={CANONICAL}');
    expect(page).toContain('type="application/ld+json"');
    expect(page).toContain('"@type": "Dataset"');
    expect(page).toContain("READINESS_LEDGER");
    expect(page).toContain("PROMOTION_QUEUE");
    expect(page).toContain("Indexed is not measured.");
  });

  it("keeps every displayed total evidence-derived and indexed distinct from measured", () => {
    expect(page + view).not.toMatch(/\b(?:425|424|1640|211)\b/);
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
});
