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
  "CharterArticle.tsx",
  "TryCouncil.tsx",
  "ComplianceHowItWorks.tsx",
  "AltPage.tsx",
] as const;

const sources = Object.fromEntries(
  pageNames.map((name) => [
    name,
    readFileSync(resolve(__dirname, name), "utf8"),
  ]),
) as Record<(typeof pageNames)[number], string>;

const allPages = Object.values(sources).join("\n");
const overviewSources = [
  readFileSync(
    resolve(__dirname, "../components/home/LivingStages.tsx"),
    "utf8",
  ),
  readFileSync(resolve(__dirname, "Layer0.tsx"), "utf8"),
  readFileSync(
    resolve(__dirname, "../../../public/claims-register.json"),
    "utf8",
  ),
];

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

  it("distinguishes the unbound historical result from the latest point result", () => {
    for (const source of overviewSources) {
      expect(source).toContain("historical numeric result");
      expect(source).toContain("unbound");
      expect(source).toContain("artifact is absent");
      expect(source).toMatch(/latest (?:published )?point experiment/);
      expect(source).toContain("rho=1 and n_eff=1");
      expect(source).toContain("independent review or fault tolerance");
      expect(source).toContain("/interop/council-independence.json");
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

  it("keeps the routed demo, guide, charter article and comparisons inside the same truth boundary", () => {
    expect(sources["CharterArticle.tsx"]).toContain(
      "/interop/council-independence.json",
    );
    expect(sources["CharterArticle.tsx"]).toContain("rho=1 and n_eff=1");
    expect(sources["CharterArticle.tsx"]).toContain(
      "not treated\nas independently reproducible here",
    );

    expect(sources["TryCouncil.tsx"]).toContain(
      "Local classification complete — no Council vote",
    );
    expect(sources["TryCouncil.tsx"]).toContain(
      "33 seats and a target threshold of 23/33",
    );
    expect(sources["TryCouncil.tsx"]).not.toContain(
      "Convene the live 5-agent council",
    );
    expect(sources["TryCouncil.tsx"]).not.toContain("Consensus reached");

    expect(sources["ComplianceHowItWorks.tsx"]).toContain(
      "No continuous Council monitoring",
    );
    expect(sources["ComplianceHowItWorks.tsx"]).not.toContain(
      "The Council continuously monitors",
    );
    expect(sources["ComplianceHowItWorks.tsx"]).not.toContain(
      "Council independently reviews your compliance",
    );

    expect(sources["AltPage.tsx"]).toContain(
      "Designed 33-seat Council, target 23/33",
    );
    expect(sources["AltPage.tsx"]).not.toContain("multi-agent consensus");
    expect(sources["AltPage.tsx"]).not.toContain("Ed25519-signed verdicts");
    expect(sources["AltPage.tsx"]).not.toContain("signs every verdict");
  });

  it("keeps the public PQC claim planned rather than built", () => {
    const register = JSON.parse(
      readFileSync(
        resolve(__dirname, "../../../public/claims-register.json"),
        "utf8",
      ),
    ) as { claims: Array<{ id: string; status: string; notes: string }> };
    const pqc = register.claims.find((claim) => claim.id === "CR-006");

    expect(pqc?.status).toBe("planned");
    expect(pqc?.notes).toContain("Planned and scaffolded only");
    expect(pqc?.notes).toContain(
      "No ML-DSA signer or runtime is built or published",
    );
    expect(pqc?.notes).not.toContain("Built, not shipped");
  });
});
