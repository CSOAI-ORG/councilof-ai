import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ResearchSourceList, researchPlanUrl, watchdogSourcesUrl } from "./DashboardResearchPane";

describe("Continuous research pane", () => {
  it("uses the same-origin API in production and the deployed read-only API for local development", () => {
    expect(researchPlanUrl("councilof.ai")).toBe("/api/research-plan");
    expect(researchPlanUrl("localhost")).toBe("https://councilof.ai/api/research-plan");
    expect(researchPlanUrl("127.0.0.1")).toBe("https://councilof.ai/api/research-plan");
    expect(watchdogSourcesUrl("councilof.ai")).toBe("/api/watchdog-sources");
    expect(watchdogSourcesUrl("localhost")).toBe("https://councilof.ai/api/watchdog-sources");
    expect(watchdogSourcesUrl("127.0.0.1")).toBe("https://councilof.ai/api/watchdog-sources");
  });

  it("renders each source's configured watch state and declared reuse boundary", () => {
    const html = renderToStaticMarkup(createElement(ResearchSourceList, { sources: [
      { id: "watched", publisher: "Standards body", title: "Watched method", url: "https://example.test/method", watch: true },
      {
        id: "reference", publisher: "Benchmark owner", title: "Method reference", url: "https://example.test/reference", watch: false,
        reviewed_on: "2026-11-06", boundary: "Practice results are internal only; this link grants no execution rights.",
        rights_url: "https://example.test/terms", version: "1.4", license: "Dataset terms apply separately",
      },
    ] }));
    const rows = html.match(/<li[\s>][\s\S]*?<\/li>/g)!;
    expect(html).toContain("Research sources and references");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain("Watch configured");
    expect(rows[0]).not.toContain("watching disabled");
    expect(rows[1]).toContain("Reference only — watching disabled");
    expect(rows[1]).not.toContain("Watch configured");
    expect(rows[1]).toContain("Practice results are internal only; this link grants no execution rights.");
    expect(rows[1]).toContain("Reference reviewed:");
    expect(rows[1]).toContain("2026-11-06");
    expect(rows[1]).toContain("1.4");
    expect(rows[1]).toContain("Declared license:");
    expect(rows[1]).toContain("Dataset terms apply separately");
    expect(rows[1]).toContain('href="https://example.test/terms"');
    expect(rows[1]).toContain("Read source terms");
  });

  it("escapes boundary markup and omits invalid dates and unsafe source-terms links", () => {
    const html = renderToStaticMarkup(createElement(ResearchSourceList, { sources: [{
      id: "restricted", publisher: "Owner", title: "Restricted method", url: "https://example.test/method", watch: false,
      boundary: "Do not publish <script>alert('practice')</script>", reviewed_on: "2026-02-30",
      rights_url: "javascript:alert('terms')",
    }] }));
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("Read source terms");
    expect(html).not.toContain("Reference reviewed:");
    expect(html).not.toContain("2026-02-30");
  });

  it("keeps legacy source links usable without inventing metadata or a running watch", () => {
    const html = renderToStaticMarkup(createElement(ResearchSourceList, { sources: [
      { id: "legacy", publisher: "Owner", title: "Legacy method", url: "https://example.test/legacy", watch: true },
      { id: "unknown", publisher: "Owner", title: "Unspecified watch", url: "https://example.test/unknown" },
    ] }));
    expect(html).toContain('href="https://example.test/legacy"');
    expect(html).toContain('href="https://example.test/unknown"');
    expect(html).toContain("Watch configured");
    expect(html).toContain("Watch status uncheckable");
    expect(html).not.toContain("Reference reviewed:");
    expect(html).not.toContain("Read source terms");
    expect(html).not.toContain("Declared license:");
  });
});
