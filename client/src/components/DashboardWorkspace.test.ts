import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CANDIDATE_INTAKE_LIVE, paneForTool } from "./DashboardWorkspace";
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
