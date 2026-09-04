import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageNames = [
  "CouncilDetail.tsx",
  "MaternalCovenant.tsx",
  "Charter.tsx",
  "Technology.tsx",
  "EnterpriseHowItWorks.tsx",
  "About.tsx",
  "PocShowcase.tsx",
  "ComparisonPage.tsx",
  "AgentRegistry.tsx",
] as const;

const sources = Object.fromEntries(
  pageNames.map((name) => [
    name,
    readFileSync(resolve(__dirname, name), "utf8"),
  ]),
) as Record<(typeof pageNames)[number], string>;

const allPages = Object.values(sources).join("\n");

describe("council runtime claim boundary", () => {
  it("removes the superseded independence result", () => {
    expect(allPages).not.toContain("n_eff 1.21");
    expect(allPages).not.toContain("1.21/3");
    expect(allPages).not.toContain("effective n of 1.21");
  });

  it("links the current point result wherever these pages quote it", () => {
    for (const name of ["CouncilDetail.tsx", "About.tsx"] as const) {
      expect(sources[name]).toContain("rho=1 and n_eff=1");
      expect(sources[name]).toContain(
        'href="/interop/council-independence.json"',
      );
    }
  });

  it("does not present the designed council as a live monitoring service", () => {
    for (const claim of [
      "33 AI agents from 12 different providers monitor",
      "Council monitors AI systems 24/7",
      "Council monitors 24/7",
      "Start real-time Council consensus immediately",
      "The Council assistant tracks every agent and humanoid, live and global",
      "33 agents independently analyze",
      "continuous, real-time monitoring and compliance automation",
    ]) {
      expect(allPages).not.toContain(claim);
    }

    expect(sources["PocShowcase.tsx"]).toContain(
      "It does not track real agents or humanoids",
    );
    expect(sources["Charter.tsx"]).toContain(
      "not a current 24/7 monitoring or enforcement service",
    );
  });
});
