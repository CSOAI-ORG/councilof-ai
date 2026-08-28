import { describe, expect, it } from "vitest";
import { LOBBY_TASKS, lobbyHref, lobbyTaskHref, osKeepsDoorQuery, resolveIntent } from "./lobbyLink";

describe("lobbyLink — demographic task registry", () => {
  const demographicTasks = [
    "pricing-overview",
    "honesty-audit",
    "library-research",
    "regulator-brief",
    "insurer-evidence",
    "enterprise-start",
    "sector-brief",
  ] as const;

  it("registers every demographic shortcut", () => {
    for (const id of demographicTasks) {
      expect(LOBBY_TASKS[id]).toBeDefined();
      expect(LOBBY_TASKS[id].prompt()).toMatch(/\?/);
    }
  });

  it("builds crawlable hrefs for sector briefs", () => {
    const href = lobbyTaskHref("sector-brief", { ctx: "finance", path: "/for/finance" });
    expect(href).toContain("task=sector-brief");
    expect(href).toContain("ctx=finance");
  });

  it("defaults crawlable hrefs onto /os, not the marketing dump", () => {
    expect(lobbyHref({ pane: "board" })).toMatch(/^\/os\?/);
    expect(lobbyHref({ pane: "board" })).not.toMatch(/^\/\?lobby=/);
  });

  it("keeps /os door query so CouncilLobby does not strip Assess task=", () => {
    expect(osKeepsDoorQuery("/os", "lobby=assess&task=pricing-overview")).toBe(true);
    expect(osKeepsDoorQuery("/os", "lobby=assess&task=enterprise-start")).toBe(true);
    expect(osKeepsDoorQuery("/os", "lobby=verify")).toBe(true);
    expect(osKeepsDoorQuery("/os", "lobby=home&ask=hello")).toBe(false);
    expect(osKeepsDoorQuery("/", "lobby=assess&task=pricing-overview")).toBe(false);
  });

  it("resolves regulator brief with context", () => {
    const intent = resolveIntent({ task: "regulator-brief", ctx: "EU AI Act" });
    expect(intent?.pane).toBe("home");
    expect(intent?.prompt).toMatch(/EU AI Act/);
  });
});
