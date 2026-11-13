import { describe, expect, it } from "vitest";
import {
  matchAxisFactQuestion,
  matchGuardedActionIntent,
  matchSafeMcpReadIntent,
  runSafeMcpRead,
  appendAskUserTurn,
  appendAskCouncilTurn,
} from "./useLobbyChat";

describe("lobby chat axis evidence intent", () => {
  it("keeps ordinary named-axis questions in chat", () => {
    expect(
      matchAxisFactQuestion("What does the published safety measurement show?")
        ?.axis,
    ).toBe("safety");
    expect(matchAxisFactQuestion("Explain the care result")?.axis).toBe("care");
  });

  it("leaves explicit navigation commands to the pane router", () => {
    expect(matchAxisFactQuestion("Open the safety axis")).toBeNull();
    expect(matchAxisFactQuestion("Can you show me the care board?")).toBeNull();
  });

  it("does not invent an axis from unrelated prose", () => {
    expect(matchAxisFactQuestion("What does the homepage show?")).toBeNull();
    expect(matchAxisFactQuestion("Is this safe to publish?")).toBeNull();
  });
});

describe("lobby chat MCP read routing", () => {
  it("maps only explicit evidence reads onto the existing free MCP tools", () => {
    expect(matchSafeMcpReadIntent("How many axis are measured?")).toEqual({
      name: "board_totals",
      args: {},
    });
    expect(matchSafeMcpReadIntent("Call board_totals")).toEqual({
      name: "board_totals",
      args: {},
    });
    expect(
      matchSafeMcpReadIntent("What does the published safety measurement show?"),
    ).toEqual({ name: "get_axis", args: { axis: "safety" } });
    expect(matchSafeMcpReadIntent("List the latest signed cards")).toEqual({
      name: "list_cards",
      args: { limit: 5 },
    });
    expect(matchSafeMcpReadIntent("What is the current public root?")).toEqual({
      name: "get_root",
      args: {},
    });
  });

  it("never maps paid or mutating requests to automatic MCP execution", () => {
    for (const request of [
      "Commission a card for model/example",
      "Call commission_card for model/example",
      "Pay the x402 challenge",
      "Witness this hash",
      "Deploy this fix",
      "Delete the board totals",
      "Send the report to the regulator",
      "Sign this in the background",
    ]) {
      expect(matchSafeMcpReadIntent(request), request).toBeNull();
    }
  });

  it("routes guarded actions to an existing review pane without executing", () => {
    expect(
      matchGuardedActionIntent("Commission a card for model/example")?.tab.id,
    ).toBe("measured");
    expect(matchGuardedActionIntent("Deploy this fix")?.tab.id).toBe("tools");
    expect(
      matchGuardedActionIntent("I want you to send this to the regulator")?.tab
        .id,
    ).toBe("tools");
    expect(matchGuardedActionIntent("Call commission_card")?.tab.id).toBe(
      "measured",
    );
    expect(matchGuardedActionIntent("What does commission_card do?")).toBeNull();
  });

  it("calls the existing MCP runtime and labels execution separately from evidence", async () => {
    const calls: Array<[string, Record<string, unknown>]> = [];
    const reply = await runSafeMcpRead(
      { name: "get_root", args: {} },
      async (name, args) => {
        calls.push([name, args]);
        return {
          ok: true,
          text: "VALID — public-root merkle abc123. Not GSPC.",
        };
      },
    );

    expect(calls).toEqual([["get_root", {}]]);
    expect(reply.state).toBe("runtime_observed");
    expect(reply.signature).toContain("POST /mcp · tools/call · get_root");
    expect(reply.text).toMatch(/execution only/i);
    expect(reply.text).toMatch(/did not write to the board/i);
  });

  it("fails closed and substitutes no remembered value", async () => {
    const reply = await runSafeMcpRead(
      { name: "list_cards", args: { limit: 5 } },
      async () => ({
        ok: false,
        text: "POST /mcp answered HTTP 503",
      }),
    );

    expect(reply.state).toBe("unreachable");
    expect(reply.text).toMatch(/no cached value was substituted/i);
    expect(reply.text).toMatch(/no write, payment, signature/i);
  });
});

describe("unified Ask history bridge", () => {
  it("creates a named session thread bound to the AG-UI server thread id", () => {
    const result = appendAskUserTurn([], null, "  What does the board show?  ", "server-thread-1", "2026-11-12T02:00:00.000Z", "session-thread-1");
    expect(result.threads).toHaveLength(1);
    expect(result.threads[0].id).toBe("session-thread-1");
    expect(result.threads[0].title).toBe("What does the board show?");
    expect(result.threads[0].remoteThreadId).toBe("server-thread-1");
    expect(result.threads[0].turns).toEqual([{ role: "user", text: "What does the board show?", at: "2026-11-12T02:00:00.000Z" }]);
  });

  it("appends the real assistant result to the same thread, not another selected thread", () => {
    const first = appendAskUserTurn([], null, "First question", "thread-a", "2026-11-12T02:00:00.000Z");
    const second = appendAskUserTurn(first.threads, null, "Second question", "thread-b", "2026-11-12T02:01:00.000Z");
    const result = appendAskCouncilTurn(second.threads, "The published board says 34 results.", "done", "thread-a", "2026-11-12T02:00:05.000Z");
    expect(result.find((t) => t.remoteThreadId === "thread-a")?.turns.map((t) => t.role)).toEqual(["user", "council"]);
    expect(result.find((t) => t.remoteThreadId === "thread-b")?.turns.map((t) => t.role)).toEqual(["user"]);
  });

  it("does not fabricate a reply for an unknown thread or an empty result", () => {
    const first = appendAskUserTurn([], null, "Question", "thread-a", "2026-11-12T02:00:00.000Z");
    expect(appendAskCouncilTurn(first.threads, "answer", "done", "thread-unknown")).toBe(first.threads);
    expect(appendAskCouncilTurn(first.threads, "   ", "done", "thread-a")).toBe(first.threads);
  });
});
