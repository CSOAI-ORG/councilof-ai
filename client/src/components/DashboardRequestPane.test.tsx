import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import DashboardRequestPane, {
  REQUEST_ATTESTATION_CONTRACT,
  buildActualJobs,
} from "./DashboardRequestPane";

const catalog = {
  rail: {
    mode: "live",
    network: "eip155:8453",
    asset: { symbol: "USDC" },
    amounts: "only inside each resource's 402 challenge (accepts[].amount)",
  },
  free_forever: ["https://councilof.ai/gspc-verify"],
  resources: [
    {
      id: "issuance",
      resource:
        "https://councilof.ai/api/request-attestation?subject=<id>&axis=<slug>",
      deliverable: "Commission receipt plus signed cards already on file.",
    },
    {
      id: "rwa_evidence",
      resource: "https://councilof.ai/api/rwa/evidence?asset=<symbol>",
      deliverable: "Signed XRPL evidence card from public ledger fields.",
    },
    {
      id: "evidence_bundle",
      resource:
        "https://councilof.ai/api/evidence-bundle?obligation=article-50|article-53|dora|cra&subject=<model-id>&bundle=1",
      deliverable: "OSCAL bundle assembled from already-signed cards.",
    },
    {
      id: "provider_diff_feed",
      resource: "https://councilof.ai/api/feeds/provider-diff?history=1",
      deliverable:
        "Hash-only provider-document diff leaves with inclusion proofs.",
    },
  ],
  mcp: {
    paid_tools: [
      {
        name: "commission_card",
        route: "https://councilof.ai/api/request-attestation",
      },
      { name: "rwa_evidence", route: "https://councilof.ai/api/rwa/evidence" },
    ],
  },
};

describe("request-attestation dashboard pane", () => {
  it("binds the native pane to the callable commission contract", () => {
    expect(REQUEST_ATTESTATION_CONTRACT).toMatchObject({
      tool: "commission_card",
      route: "/api/request-attestation",
      requestState: "PAYMENT_REQUIRED",
      deliveredState: "DELIVERED",
      freshRunState: "UNMEASURED",
    });
  });

  it("keeps the preview, delivery and evidence boundaries visible", () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/dashboard" ssrSearch="tab=measured">
        <DashboardRequestPane />
      </Router>,
    );
    expect(html).toContain("commission_card");
    expect(html).toContain("payment never creates a MEASURED cell");
    expect(html).toContain("PAYMENT_REQUIRED");
    expect(html).toContain("DELIVERED");
    expect(html).toContain("POST /api/assess");
    expect(html).toContain("does not fetch the system");
    expect(html).not.toContain("Coming — Paddle");
  });

  it("honours the pricing-overview deep link without selling a grade or measurement", () => {
    const html = renderToStaticMarkup(
      <Router
        ssrPath="/dashboard"
        ssrSearch="tab=measured&task=pricing-overview"
      >
        <DashboardRequestPane />
      </Router>,
    );
    expect(html).toContain("How the free rail works");
    expect(html).toContain("Verify is free forever");
    expect(html).toContain("A grade is never sold");
    expect(html).toContain("no SaaS tiers");
    expect(html).toContain("payment never creates a MEASURED cell");
    expect(html).toContain("UNMEASURED");
    expect(html).toContain("Choose the outcome you need");
    expect(html).toContain(
      "conformance census or generic inspection is not a live purchase",
    );
  });

  it("derives only real human jobs from the current catalogue", () => {
    const jobs = buildActualJobs(catalog);
    expect(jobs.map((job) => job.id)).toEqual([
      "verify",
      "rwa",
      "article50",
      "provider-history",
      "commission",
    ]);
    expect(jobs.find((job) => job.id === "verify")?.href).toBe("/gspc-verify");
    expect(jobs.find((job) => job.id === "rwa")?.href).toBe(
      "/dashboard?tab=tools&tool=rwa_evidence",
    );
    expect(jobs.find((job) => job.id === "article50")?.href).toBe(
      "/api/evidence-bundle?obligation=article-50&bundle=1",
    );
    expect(jobs.find((job) => job.id === "provider-history")?.href).toBe(
      "/api/feeds/provider-diff?history=1",
    );
    expect(jobs.find((job) => job.id === "commission")?.href).toBe(
      "#request-attestation-runner",
    );
    expect(jobs.find((job) => job.id === "commission")?.payment).toContain(
      "does not trigger or promise an instant fresh measurement",
    );
    expect(
      jobs
        .filter((job) => job.id !== "verify")
        .every((job) => job.payment.includes("accepts[].amount")),
    ).toBe(true);
    expect(JSON.stringify(jobs)).not.toMatch(
      /conformance.*(?:buy|purchase)|census.*(?:buy|purchase)/i,
    );
    expect(JSON.stringify(jobs)).not.toMatch(/[£$€]\s?\d/);
  });

  it("fails closed instead of inventing jobs when catalogue entries are absent", () => {
    expect(buildActualJobs({ resources: [], free_forever: [] })).toEqual([]);
    expect(
      buildActualJobs({ ...catalog, rail: { mode: "live" } }).map(
        (job) => job.id,
      ),
    ).toEqual(["verify"]);
  });
});
