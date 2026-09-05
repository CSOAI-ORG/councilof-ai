import { describe, expect, it } from "vitest";
import {
  CHAT_SESSION_KEY,
  clearChatSession,
  matchAxisFactQuestion,
  matchGuardedActionIntent,
  matchSafeMcpReadIntent,
  readChatSession,
  runSafeMcpRead,
  runGspcStreamRead,
  wantsGspcStream,
  writeChatSession,
} from "./useLobbyChat";
import { GspcStreamError } from "@/lib/aguiGspcRead";
import { snapshotFromGspcPayload } from "@/lib/aguiGspcStream";

describe("in-chat GSPC board observations", () => {
  it("keeps explicit board reads separate from pane commands and actions", () => {
    for (const prompt of [
      "Show me the live GSPC board",
      "Read the GSPC board in chat",
      "Refresh the live GSPC board",
      "Can you show the live board?",
    ]) {
      expect(wantsGspcStream(prompt), prompt).toBe(true);
    }
    for (const prompt of [
      "Open the board",
      "Call board_totals",
      "What is AG-UI?",
      "Update the live GSPC board",
      "Show the live board and deploy it",
    ]) {
      expect(wantsGspcStream(prompt), prompt).toBe(false);
    }
  });

  it("retains the structured observation and never invents a signature", async () => {
    const observation = {
      observedAt: "2026-09-05T03:00:00.000Z",
      snapshot: snapshotFromGspcPayload({ axes: [] }),
    };
    const reply = await runGspcStreamRead(async () => observation);
    expect(reply.gspc).toEqual(observation);
    expect(reply.state).toBe("runtime_observed");
    expect(reply.provenance).toContain("GET /api/agui/gspc-state");
    expect(reply.signature).toBeUndefined();
  });

  it("keeps failed and incomplete reads retryable without an observation", async () => {
    for (const state of ["unchecked", "unreachable"] as const) {
      const reply = await runGspcStreamRead(async () => {
        throw new GspcStreamError("Read failed", state);
      });
      expect(reply).toMatchObject({ state, boardRead: true });
      expect(reply.gspc).toBeUndefined();
      expect(reply.signature).toBeUndefined();
    }
  });
});

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
      matchSafeMcpReadIntent(
        "What does the published safety measurement show?",
      ),
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
    expect(
      matchGuardedActionIntent("What does commission_card do?"),
    ).toBeNull();
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

describe("lobby chat browser-session history", () => {
  function memoryStore(seed?: string) {
    const values = new Map<string, string>();
    if (seed !== undefined) values.set(CHAT_SESSION_KEY, seed);
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
  }

  it("restores a valid local session and rejects a broken active id", () => {
    const store = memoryStore(
      JSON.stringify({
        activeId: "missing",
        threads: [
          {
            id: "t1",
            title: "Show the board",
            startedAt: "2026-09-05T00:00:00.000Z",
            turns: [
              {
                role: "user",
                text: "Show the board",
                at: "2026-09-05T00:00:00.000Z",
              },
            ],
          },
        ],
      }),
    );
    const restored = readChatSession(store);
    expect(restored.threads).toHaveLength(1);
    expect(restored.activeId).toBeNull();
  });

  it("persists and clears the bounded session without a server", () => {
    const store = memoryStore();
    const snapshot = {
      activeId: "t1",
      threads: [
        {
          id: "t1",
          title: "Show the board",
          startedAt: "2026-09-05T00:00:00.000Z",
          turns: [
            {
              role: "user" as const,
              text: "Show the board",
              at: "2026-09-05T00:00:00.000Z",
            },
          ],
        },
      ],
    };
    writeChatSession(snapshot, store);
    expect(readChatSession(store)).toEqual(snapshot);
    clearChatSession(store);
    expect(readChatSession(store)).toEqual({ threads: [], activeId: null });
  });

  it("fails closed on malformed stored content", () => {
    expect(readChatSession(memoryStore("not json"))).toEqual({
      threads: [],
      activeId: null,
    });
  });

  it("restores exact board observations but discards an untrusted source URL", () => {
    const observation = {
      observedAt: "2026-09-05T03:00:00.000Z",
      snapshot: snapshotFromGspcPayload({ axes: [] }),
    };
    const turn = {
      role: "council" as const,
      text: "Board read",
      at: observation.observedAt,
      boardRead: true,
      gspc: observation,
    };
    const store = memoryStore();
    const session = {
      activeId: "t1",
      threads: [
        {
          id: "t1",
          title: "Board",
          startedAt: observation.observedAt,
          turns: [turn],
        },
      ],
    };
    writeChatSession(session, store);
    expect(readChatSession(store).threads[0].turns[0].gspc).toEqual(
      observation,
    );
    observation.snapshot.endpoint = "https://untrusted.example/collect";
    writeChatSession(session, store);
    const restored = readChatSession(store).threads[0].turns[0];
    expect(restored.gspc).toBeUndefined();
    expect(restored.boardRead).toBe(true);
  });
});
