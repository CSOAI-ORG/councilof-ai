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

  it("shows Coming — Paddle waitlist, not a live purchase desk", () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/dashboard" ssrSearch="tab=measured">
        <DashboardRequestPane />
      </Router>,
    );
    expect(html).toContain("Paid assessment — booking not live");
    expect(html).toContain("Coming — Paddle");
    expect(html).toContain("Waitlist only");
    expect(html).toContain("Never free RAS");
    expect(html).toContain("Never Stripe");
    expect(html).toContain("commission_card");
    expect(html).toContain("payment never creates a MEASURED cell");
    expect(html).toContain("PAYMENT_REQUIRED");
    expect(html).toContain("DELIVERED");
    expect(html).toContain("POST /api/assess");
    expect(html).toContain("does not fetch the system");
    expect(html).not.toContain("Free. No account. The card is yours.");
    expect(html).not.toMatch(/MetaMask|buy\\.stripe|pages\\.dev/i);
  });

  it("honours the pricing-overview deep link without selling a grade or free RAS", () => {
    const html = renderToStaticMarkup(
      <Router
        ssrPath="/dashboard"
        ssrSearch="tab=measured&task=pricing-overview"
      >
        <DashboardRequestPane />
      </Router>,
    );
    expect(html).toContain("Paid assessment — booking not live");
    expect(html).toContain("Coming — Paddle");
    expect(html).toContain("Verify stays free");
    expect(html).toContain("A grade is never sold");
    expect(html).toContain("Never free RAS");
    expect(html).toContain("UNMEASURED");
  });
});
