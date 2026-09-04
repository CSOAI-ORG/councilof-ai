import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import DashboardRequestPane, {
  REQUEST_ATTESTATION_CONTRACT,
} from "./DashboardRequestPane";

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
});
