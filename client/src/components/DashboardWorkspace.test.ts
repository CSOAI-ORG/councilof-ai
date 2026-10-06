import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { askOnHome, paneForTool } from "./DashboardWorkspace";
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

  // 6 Oct 2026: the first question typed on the start screen never got an answer. askTalk also
  // called chat.recordUserMessage, which made a chat turn, which swapped the canvas away from the
  // TalkPanel, whose unmount aborted POST /api/agui/run. The question now goes to the TalkPanel
  // and to History (an "ask" activity entry), never to the chat thread.
  it("sends a home question to the TalkPanel and History, never to the lobby chat", () => {
    const talk = { ask: vi.fn() };
    const record = vi.fn();
    const taken = askOnHome("  what does the board say  ", {
      activePane: false,
      hasConversation: false,
      talk,
      record,
    });
    expect(taken).toBe(true);
    expect(talk.ask).toHaveBeenCalledWith("what does the board say");
    expect(record).toHaveBeenCalledWith({ kind: "ask", label: "what does the board say" });
  });

  it("leaves pane commands and busy canvases to the lobby chat", () => {
    const talk = { ask: vi.fn() };
    const record = vi.fn();
    expect(askOnHome("show the board", { activePane: false, hasConversation: false, talk, record })).toBe(false);
    expect(askOnHome("what does the board say", { activePane: true, hasConversation: false, talk, record })).toBe(false);
    expect(askOnHome("what does the board say", { activePane: false, hasConversation: true, talk, record })).toBe(false);
    expect(askOnHome("what does the board say", { activePane: false, hasConversation: false, talk: null, record })).toBe(false);
    expect(talk.ask).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });

  it("askTalk never calls recordUserMessage (a chat turn would unmount the TalkPanel mid-run)", () => {
    const source = readFileSync(resolve(__dirname, "./DashboardWorkspace.tsx"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(source).not.toMatch(/recordUserMessage/);
    expect(source).toMatch(/const askTalk = useCallback\(\s*\(text: string\) =>\s*askOnHome\(/);
  });
});
