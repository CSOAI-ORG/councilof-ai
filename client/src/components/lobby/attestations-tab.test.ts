import { describe, it, expect } from "vitest";
import { DASHBOARD_TABS, LOBBY_ROUTES, LOBBY_TABS, matchRoute, matchTab, tabById } from "./tabs";
import { PANE_IDS } from "../DashboardPane";
import { PRIMARY_PATHS } from "../../data/library-ia";

describe("attestations tab — one door, /dashboard?tab=attestations", () => {
  it("is a native pane with no standalone URL", () => {
    const t = tabById("attestations");
    expect(t.id).toBe("attestations");
    expect(t.kind).toBe("native");
    expect(t.path).toBe("");
    expect(t.label).toBe("Attestations");
  });

  it("is rendered by the Dashboard shell under its own id", () => {
    expect(PANE_IDS).toContain("attestations");
  });

  it("registers its door as a primary path", () => {
    expect(PRIMARY_PATHS.has("/dashboard?tab=attestations")).toBe(true);
  });

  it("resolves from chat cues without stealing verify / cards / state", () => {
    expect(matchTab("open the attestations")?.id).toBe("attestations");
    expect(matchTab("show the witnesses")?.id).toBe("attestations");
    expect(matchTab("show me the corrections ledger")?.id).toBe("attestations");
    expect(matchTab("open rekor")?.id).toBe("attestations");
    expect(matchTab("verify a card")?.id).not.toBe("attestations");
    expect(matchTab("show the signed cards")?.id).toBe("cards");
    expect(matchTab("show the estate state")?.id).toBe("state");
    expect(matchTab("open the board")?.id).toBe("board");
    expect(matchRoute("open the attestations")).toBeNull();
  });

  it("stays out of the DSH sidebar (no URL) and out of LOBBY_ROUTES (one owner)", () => {
    expect(DASHBOARD_TABS.some((t) => t.id === "attestations")).toBe(false);
    expect(LOBBY_ROUTES.some((r) => /attest/i.test(r.path))).toBe(false);
    expect(LOBBY_TABS.filter((t) => t.id === "attestations").length).toBe(1);
  });
});
