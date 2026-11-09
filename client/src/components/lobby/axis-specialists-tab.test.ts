import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { hasPane, PANE_IDS } from "../DashboardPane";
import { DASHBOARD_NAV_GROUPS, matchTab, tabById } from "./tabs";

describe("MEOK Hive axis specialists destination", () => {
  it("is a native Council OS pane beside Evidence Delivery", () => {
    expect(tabById("axis-specialists")).toMatchObject({ kind: "native", path: "" });
    expect(hasPane("axis-specialists")).toBe(true);
    expect(PANE_IDS).toContain("axis-specialists");
    const verify = DASHBOARD_NAV_GROUPS.find((group) => group.id === "verify");
    expect(verify?.tabs.map((tab) => tab.id)).toContain("axis-specialists");
  });

  it("opens from an explicit command without capturing an ordinary axis board request", () => {
    expect(matchTab("open the axis specialists")?.id).toBe("axis-specialists");
    expect(matchTab("show the MEOK Hive")?.id).toBe("axis-specialists");
    expect(matchTab("show the axis")?.id).toBe("board");
  });

  it("uses the bounded loader and exposes no proposal-apply control", () => {
    const source = readFileSync(resolve(__dirname, "../gspc/CouncilAxisSpecialistPane.tsx"), "utf8");
    expect(source).toContain('fetcher(`/api/axis-specialists/${axis}`, { credentials: "omit" })');
    expect(source).toContain('gate?.decision !== "HOLD"');
    expect(source).toContain("DECLARED_NOT_PROVISIONED");
    expect(source).not.toMatch(/<button[^>]*>\s*(?:Apply|Approve|Deploy)/i);
  });
});
