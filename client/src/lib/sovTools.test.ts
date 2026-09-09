import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../../functions/mcp/[[path]]";
import { callTool } from "./sovTools";

const ORIGIN = "https://councilof.ai";

afterEach(() => vi.unstubAllGlobals());

describe("Council UI tool execution", () => {
  it("does not present an SDK tool error as a successful result", async () => {
    const network = vi.fn(
      async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response> => {
        const request =
          input instanceof Request
            ? input
            : new Request(new URL(String(input), ORIGIN), init);
        return onRequest({
          request,
          env: {},
          params: {},
          waitUntil: () => {},
        } as never);
      },
    );
    vi.stubGlobal("fetch", network);

    const result = await callTool("commission_card", {});

    expect(result).toMatchObject({
      ok: false,
      state: "runtime_observed",
    });
    expect(result.text).toMatch(
      /input validation error.*required property "subject"/i,
    );
    expect(network).toHaveBeenCalledTimes(1);
  });
});
