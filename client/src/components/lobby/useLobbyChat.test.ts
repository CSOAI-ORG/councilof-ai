import { describe, expect, it } from "vitest";
import {
  matchAxisFactQuestion,
  matchGuardedActionIntent,
  matchSafeMcpReadIntent,
  runSafeMcpRead,
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
          state: "runtime_observed",
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
        state: "unreachable",
        text: "POST /mcp answered HTTP 503",
      }),
    );

    expect(reply.state).toBe("unreachable");
    expect(reply.text).toMatch(/no cached value was substituted/i);
    expect(reply.text).toMatch(/no write, payment, signature/i);
  });
});
