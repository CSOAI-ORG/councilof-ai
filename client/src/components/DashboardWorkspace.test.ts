import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { askOnHome, CANDIDATE_INTAKE_LIVE, paneForTool } from "./DashboardWorkspace";
import { LOBBY_TABS } from "./lobby/tabs";

describe("canonical dashboard workspace", () => {
  it("separates MCP catalogue discovery from observed tool execution", () => {
    // The tool count moved to the GSPC workspace home (30 Sep 2026); the wording rule moved with it.
    const source = readFileSync(
      resolve(__dirname, "./gspc/GspcWorkspaceHome.tsx"),
      "utf8",
    );
    expect(source).toMatch(/declared by tools\/list/);
    expect(source).toMatch(/runtime-observed only after its own tools\/call/);
    expect(source).not.toMatch(/returned live/);
  });

  it("names the canonical living board GSPC board (the section reads Leaderboard)", () => {
    expect(LOBBY_TABS.find((tab) => tab.id === "board")?.label).toBe(
      "GSPC board",
    );
  });

  it("opens every MCP capability in the exact live tool runner", () => {
    for (const tool of [
      "board_totals",
      "get_axis",
      "verify_card",
      "list_cards",
      "get_root",
      "get_card",
      "verify_inclusion",
      "commission_card",
      "art50_marking_evidence",
      "rwa_evidence",
      "receipts_batch",
    ])
      expect(paneForTool(tool)).toBe("tools");
  });

  it("sends newly discovered tools to the live Tools workspace instead of inventing a UI", () => {
    expect(paneForTool("future_runtime_tool")).toBe("tools");
  });

  it("keeps accepted home and follow-up questions in the stable Talk runner", () => {
    const talk = { ask: vi.fn(() => true), isBusy: () => false };
    const record = vi.fn();
    expect(askOnHome("  question  ", { activePane: false, talk, record })).toBe(true);
    expect(askOnHome("follow-up", { activePane: false, hasConversation: true, talk, record })).toBe(true);
    expect(talk.ask).toHaveBeenNthCalledWith(1, "question");
    expect(talk.ask).toHaveBeenNthCalledWith(2, "follow-up");
    expect(record).toHaveBeenCalledTimes(2);
  });

  it("distinguishes a busy request from a deliberate navigation fallback", () => {
    const record = vi.fn();
    const busyTalk = { ask: vi.fn(() => true), isBusy: () => true };
    expect(askOnHome("keep my draft", { activePane: false, talk: busyTalk, record })).toBe("busy");
    expect(busyTalk.ask).not.toHaveBeenCalled();
    const refused = { ask: vi.fn(() => false) };
    expect(askOnHome("keep my draft", { activePane: false, talk: refused, record })).toBe("busy");
    expect(record).not.toHaveBeenCalled();
    expect(askOnHome("show the board", { activePane: false, talk: refused, record })).toBe(false);
    expect(askOnHome("q", { activePane: true, talk: refused, record })).toBe(false);
    expect(askOnHome("q", { activePane: false, talk: null, record })).toBe(false);
  });

  it("offers no candidate-evidence receipt while network intake is not live (tools audit, 6 Oct 2026)", () => {
    expect(CANDIDATE_INTAKE_LIVE).toBe(false);
    const quests = readFileSync(
      resolve(__dirname, "../../../public/gspc-quests.html"),
      "utf8",
    );
    expect(quests).toContain("const CANDIDATE_REVIEW_LIVE = false;");
    // The only remaining "Review as candidate evidence" button is inside the gated helper.
    expect(quests.match(/onclick="offerQuestEvidence\(\)"/g)?.length).toBe(1);
    expect(quests).toContain("window.CouncilEvidence");
  });
});
