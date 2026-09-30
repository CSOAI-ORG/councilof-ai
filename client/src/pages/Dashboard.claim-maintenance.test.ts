import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboard = readFileSync(resolve(__dirname, "Dashboard.tsx"), "utf8");
const claimPage = readFileSync(resolve(__dirname, "ClaimMaintenance.tsx"), "utf8");
const ROOT = resolve(__dirname, "../../..");
const capabilities = JSON.parse(readFileSync(resolve(ROOT, "council-os/capabilities.json"), "utf8"));
const openapi = JSON.parse(readFileSync(resolve(ROOT, "public/openapi.json"), "utf8"));

describe("Claim Maintenance counter engine wiring", () => {
  it("dashboard reads live watch, reaction and corrections instead of typing counts", () => {
    for (const path of [
      "/api/claim-maintenance-watch",
      "/api/claim-maintenance-reaction",
      "/api/corrections",
    ]) expect(dashboard).toContain(path);
    expect(dashboard).toContain('data-testid="claim-maintenance-control-loop"');
    expect(dashboard).toContain("Source changes prompt review");
    expect(dashboard).toContain("Category overlap is not legal ownership or equivalence");
    expect(dashboard).toContain("/spec/claim-maintenance/priority-snapshots/index.json");
    expect(dashboard).toContain("Layer O adapter lanes");
    expect(dashboard).toContain("Counter packets");
    expect(dashboard).toContain("Claim ceiling:");
    expect(dashboard).toContain("CATEGORY_COLLISION emits a bounded");
    expect(dashboard).toContain("/spec/claim-maintenance/priority-root.json");
    expect(dashboard).toContain("/spec/claim-maintenance/priority-root-witness.json");
    expect(dashboard).toContain("it is not evidence that CSOAI adopted or measured that primitive");
    expect(dashboard).not.toMatch(/Observed change prompts["'][^\n]*\b32\b/);
    expect(dashboard).not.toMatch(/Our dated corrections["'][^\n]*\b80\b/);
  });

  it("category page uses live doors with committed-byte fallbacks", () => {
    for (const s of [
      'const REACTION_INDEX = "/api/claim-maintenance-reaction"',
      'const REACTION_STATIC = "/spec/claim-maintenance/reaction-index.json"',
      'const WATCH = "/api/claim-maintenance-watch"',
      'const WATCH_STATIC = "/spec/claim-maintenance/watch/latest.json"',
      "Latest maintenance run — what needs a human look",
      "Category reaction radar — what changed around us",
      "Claim ceiling — Layer O policy runtime",
      "Bounded counter-evidence packets",
      "Priority Merkle root",
      "Priority root witness",
    ]) expect(claimPage).toContain(s);
  });

  it("declares both doors once and exports them through OpenAPI", () => {
    const byId = new Map(capabilities.capabilities.map((c: any) => [c.id, c]));
    const reaction: any = byId.get("api-claim-maintenance-reaction");
    const watch: any = byId.get("api-claim-maintenance-watch");
    expect(reaction?.path).toBe("/api/claim-maintenance-reaction");
    expect(watch?.path).toBe("/api/claim-maintenance-watch");
    expect(reaction?.surfaces).toContain("openapi");
    expect(watch?.surfaces).toContain("openapi");
    expect(openapi.paths["/api/claim-maintenance-reaction"]?.get).toBeTruthy();
    expect(openapi.paths["/api/claim-maintenance-watch"]?.get).toBeTruthy();
  });

  it("keeps corrections explicitly about our own publication history", () => {
    const correction = capabilities.capabilities.find((c: any) => c.id === "api-corrections");
    expect(correction.description_state).toBe("DOCUMENTED");
    expect(correction.description).toMatch(/own publication history/i);
    expect(correction.surfaces).toEqual(expect.arrayContaining(["openapi", "llms", "nav"]));
  });
});
