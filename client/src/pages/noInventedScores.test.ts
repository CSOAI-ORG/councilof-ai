// 2026-09-26 doctrine audit: no number that no measurement produced. These pages printed
// compliance percentages and scores that were typed into the source (fallbacks such as
// `|| 85`, "+5% from last month", a sample PDF of per-system compliance scores, invented
// vendor scores). Each test reads the source that renders the figure, so a typed number
// coming back fails here, not in front of a reader.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const src = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");
const code = (p: string) => src(p).replace(/^\s*\/\/.*$/gm, "");

describe("no typed compliance score reaches a page", () => {
  it("dashboards fall back to UNMEASURED, never to a typed score or trend", () => {
    for (const p of ["pages/EnterpriseDashboard.tsx", "pages/RegulatorDashboard.tsx", "pages/ComplianceScorecard.tsx"]) {
      const c = code(p);
      expect(c, p).not.toMatch(/(score|Score|rate|Rate)\w*\s*(\|\||\?\?)\s*[1-9]/);
      expect(c, p).not.toMatch(/complianceScore:\s*(\d|system\.riskLevel)/);
      expect(c, p).not.toMatch(/\+\d+%/);
    }
    expect(code("pages/EnterpriseDashboard.tsx")).toContain("UNMEASURED");
    expect(code("pages/EnterpriseDashboard.tsx")).not.toMatch(/Customer Service AI|hours ago/);
    expect(code("pages/ComplianceScorecard.tsx")).toContain("UNMEASURED");
    expect(code("pages/ComplianceScorecard.tsx")).not.toMatch(/consensusLevel|validUntil/);
  });

  it("the government view shows no compliance rate for any framework or region", () => {
    const c = code("pages/GovernmentDashboard.tsx");
    expect(c).not.toMatch(/complianceRate:\s*\d/);
    expect(c).not.toMatch(/Compliance Rate/);
    expect(c).toContain("UNMEASURED");
  });

  it("/reports ships no sample PDF of invented per-system scores", () => {
    const c = code("pages/Reports.tsx");
    expect(c).not.toMatch(/complianceScore/);
    expect(c).not.toMatch(/RegulatoryExportButton/);
  });

  it("the PDCA simulator labels every figure beside it and frames nothing as % compliant", () => {
    const c = code("pages/PDCASimulator.tsx");
    expect(c).toContain("illustrative, not a measurement");
    expect(c).not.toMatch(/\d+%\s*compliant/i);
    for (const field of ["scenario", "task", "rec", "risk", "outcome"]) {
      expect(c).toMatch(new RegExp(`<Illustrative text=\\{(currentPhase\\.)?${field}\\} />`));
    }
  });

  it("/ei3 gives no vendor a score without a published run", () => {
    const c = code("pages/EI3.tsx");
    expect(c).not.toMatch(/score:\s*\d/);
    expect(c).toContain("UNMEASURED");
  });

  it("chart components carry no invented default series", () => {
    for (const p of ["components/charts/ComplianceTrendChart.tsx", "components/charts/FrameworkComparisonChart.tsx", "components/charts/IncidentTrendChart.tsx"]) {
      expect(code(p), p).toMatch(/const DEFAULT_DATA: \w+\[\] = \[\];/);
    }
  });

  it("framework pages sell no diagnostic and promise no readiness", () => {
    const c = code("pages/FrameworkDetail.tsx");
    expect(c).not.toMatch(/free diagnostic|-ready|audit-ready/i);
  });
});
