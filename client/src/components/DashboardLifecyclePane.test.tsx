import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import DashboardLifecyclePane, { isProductFlow } from "./DashboardLifecyclePane";

describe("one-product lifecycle pane", () => {
  it("renders the canonical request-to-maintenance journey without claiming completion", () => {
    const html = renderToStaticMarkup(
      <Router ssrPath="/dashboard" ssrSearch="tab=lifecycle">
        <DashboardLifecyclePane />
      </Router>,
    );
    expect(html).toContain("One product · one evidence lifecycle");
    expect(html).toContain("Request → evidence → measure → verify → maintain.");
    expect(html).toContain("infrastructure health is not customer-job completion");
    expect(html).toContain("Subject");
    expect(html).toContain("Optional axis");
    expect(html).toContain("Start request");
    expect(html).toContain("Reading the live product lifecycle");
    expect(html).not.toContain("certified");
  });
});

it("rejects malformed stage data and unsafe stage destinations", () => {
  expect(isProductFlow({ schema: "csoai.product-flow/0.1" })).toBe(false);
  const stage = { id: "request", order: 1, label: "Request", engine: "Requests", state: "AVAILABLE", source: "/api/x402", href: "/dashboard?tab=measured", meaning: "Open request" };
  const body = { schema: "csoai.product-flow/0.1", stages: [stage], contract: { one_product: "One workflow", order: "request" }, commercial: {} };
  expect(isProductFlow(body)).toBe(true);
  for (const href of ["javascript:alert(1)", "//other.example", "/\\\\other.example"])
    expect(isProductFlow({ ...body, stages: [{ ...stage, href }] })).toBe(false);
  expect(isProductFlow({ ...body, stages: [{ ...stage, state: "invented" }] })).toBe(false);
});
