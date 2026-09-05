import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { paneForTool } from "./DashboardWorkspace";
import { LOBBY_TABS } from "./lobby/tabs";

describe("canonical dashboard workspace", () => {
  it("separates MCP catalogue discovery from observed tool execution", () => {
    const source = readFileSync(
      resolve(__dirname, "./DashboardWorkspace.tsx"),
      "utf8",
    );
    expect(source).toMatch(/declared by tools\/list/);
    expect(source).toMatch(/runtime-observed only after its own tools\/call/);
    expect(source).not.toMatch(/returned live/);
  });

  it("names the canonical living board GSPC board", () => {
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
      "witness_hash",
      "receipts_batch",
    ])
      expect(paneForTool(tool)).toBe("tools");
  });

  it("sends newly discovered tools to the live Tools workspace instead of inventing a UI", () => {
    expect(paneForTool("future_runtime_tool")).toBe("tools");
  });
});
