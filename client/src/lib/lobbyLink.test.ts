import { describe, expect, it } from "vitest";
import { LOBBY_TASKS, lobbyHref, lobbyTaskHref, osDoorHref, osKeepsDoorQuery, osPanelHref, resolveIntent } from "./lobbyLink";

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

  it("defaults crawlable hrefs onto the Dashboard tab directly — no /os redirect hop, never the marketing dump", () => {
    expect(lobbyHref({ pane: "board" })).toBe("/dashboard?tab=board");
    expect(lobbyHref({ pane: "board" })).not.toMatch(/^\/\?lobby=/);
    expect(lobbyHref({ pane: "board" })).not.toMatch(/^\/os\?/);
    // A seeded task still opens the chat overlay on that pane: tab for the shell, lobby+task for the overlay.
    const withTask = lobbyTaskHref("verify-a-card", { ctx: "C-1" });
    expect(withTask.startsWith("/dashboard?")).toBe(true);
    expect(withTask).toContain("tab=verify");
    expect(withTask).toContain("lobby=verify");
    expect(withTask).toContain("task=verify-a-card");
  });

  it("keeps /os door query so CouncilLobby does not strip Assess task=", () => {
    expect(osKeepsDoorQuery("/os", "lobby=assess&task=pricing-overview")).toBe(true);
    expect(osKeepsDoorQuery("/os", "lobby=assess&task=enterprise-start")).toBe(true);
    expect(osKeepsDoorQuery("/os", "lobby=verify")).toBe(true);
    expect(osKeepsDoorQuery("/os", "lobby=cards")).toBe(true);
    expect(osKeepsDoorQuery("/os", "embed=1&lobby=board")).toBe(true);
    expect(osKeepsDoorQuery("/os", "lobby=home&ask=hello")).toBe(false);
    expect(osKeepsDoorQuery("/", "lobby=board")).toBe(true);
    expect(osKeepsDoorQuery("/", "lobby=assess&task=pricing-overview")).toBe(true);
  });

  it("mints a harness panel URL without using withEmbed on /os", () => {
    expect(osPanelHref("board")).toBe("/os?embed=1&lobby=board");
    expect(osPanelHref("verify")).toBe("/os?embed=1&lobby=verify");
    expect(osPanelHref("cards")).toBe("/os?embed=1&lobby=cards");
  });

  it("preserves embed=1 on a door hop and does not invent it", () => {
    expect(osDoorHref("verify", "embed=1&lobby=board")).toBe("/os?lobby=verify&embed=1");
    expect(osDoorHref("cards", "lobby=board")).toBe("/os?lobby=cards");
    expect(osDoorHref("verify", "lobby=board", "/")).toBe("/?lobby=verify");
  });

  it("resolves regulator brief with context", () => {
    const intent = resolveIntent({ task: "regulator-brief", ctx: "EU AI Act" });
    expect(intent?.pane).toBe("home");
    expect(intent?.prompt).toMatch(/EU AI Act/);
  });
});
