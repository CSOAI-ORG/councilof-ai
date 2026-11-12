import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { askInUnifiedPane, askOnHome, CANDIDATE_INTAKE_LIVE, paneForTool } from "./DashboardWorkspace";
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

  // 6 Oct 2026: the first question typed on the start screen never got an answer. askTalk recorded
  // it as a chat turn, which swapped the canvas away from the TalkPanel, whose unmount aborted
  // POST /api/agui/run. The question now goes to the TalkPanel, to the workspace History (an "ask"
  // activity entry) and, under talkOwnsHome (#2834), to session history.
  it("sends a home question to the TalkPanel and to History", () => {
    const talk = { ask: vi.fn() };
    const record = vi.fn();
    const keepInChat = vi.fn();
    const taken = askOnHome("  what does the board say  ", {
      activePane: false,
      hasConversation: false,
      talk,
      record,
      keepInChat,
    });
    expect(taken).toBe(true);
    expect(talk.ask).toHaveBeenCalledWith("what does the board say");
    expect(record).toHaveBeenCalledWith({ kind: "ask", label: "what does the board say" });
    expect(keepInChat).toHaveBeenCalledWith("what does the board say");
    // History is written before the run starts, never after the panel could have unmounted.
    expect(keepInChat.mock.invocationCallOrder[0]).toBeLessThan(talk.ask.mock.invocationCallOrder[0]);
  });

  it("leaves pane commands and busy canvases to the lobby chat", () => {
    const talk = { ask: vi.fn() };
    const record = vi.fn();
    const keepInChat = vi.fn();
    const ctx = { talk, record, keepInChat };
    expect(askOnHome("show the board", { activePane: false, hasConversation: false, ...ctx })).toBe(false);
    expect(askOnHome("what does the board say", { activePane: true, hasConversation: false, ...ctx })).toBe(false);
    expect(askOnHome("what does the board say", { activePane: false, hasConversation: true, ...ctx })).toBe(false);
    expect(askOnHome("what does the board say", { activePane: false, hasConversation: false, talk: null, record, keepInChat })).toBe(false);
    expect(talk.ask).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
    expect(keepInChat).not.toHaveBeenCalled();
  });

  it("routes every free-text entry point through the one AskHost and preserves explicit pane commands", () => {
    const open = vi.fn();
    const record = vi.fn();
    expect(askInUnifiedPane("  what does the board say  ", "server-thread-1", open, record)).toBe(true);
    expect(open).toHaveBeenCalledWith("what does the board say", "server-thread-1");
    expect(record).toHaveBeenCalledWith({ kind: "ask", label: "what does the board say" });
    expect(askInUnifiedPane("show the board", null, open, record)).toBe(false);
    expect(askInUnifiedPane("   ", null, open, record)).toBe(false);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("removes the second home TalkPanel and mirrors the Ask lifecycle into the same history rail", () => {
    const source = readFileSync(resolve(__dirname, "./DashboardWorkspace.tsx"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(source).toContain("ASK_RUN_STARTED");
    expect(source).toContain("ASK_RUN_SETTLED");
    expect(source).toContain("ASK_THREAD_SELECT");
    expect(source).toContain("chat.recordUserMessage(detail.question, detail.threadId)");
    expect(source).toContain("chat.recordCouncilMessage(detail.text, detail.status, detail.threadId)");
    expect(source).toContain("talk={null}");
    expect(source).not.toContain("talkOwnsHome");
    expect(source).not.toContain("<TalkPanel");
  });

  it("keeps the Ask host on the selected AG-UI thread and records the real run lifecycle", () => {
    const host = readFileSync(resolve(__dirname, "./ask/AskHost.tsx"), "utf8");
    const pane = readFileSync(resolve(__dirname, "./ask/AskPane.tsx"), "utf8");
    const talk = readFileSync(resolve(__dirname, "./talk/TalkPanel.tsx"), "utf8");
    expect(host).toContain("ASK_THREAD_SELECT");
    expect(host).toContain("ASK_RUN_STARTED");
    expect(pane).toContain("ASK_RUN_SETTLED");
    expect(pane).toContain("onRunStarted=");
    expect(pane).toContain("onRunSettled=");
    expect(talk).toContain("onRunStarted?.(text, sessionThread)");
    expect(talk).toContain("onRunSettled?.(final, sessionThread)");
    expect(talk).toContain("setThreadId: (threadId: string | null)");
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
