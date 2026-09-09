import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../../functions/mcp/[[path]]";
import { MCP_REQUEST_TIMEOUT_MS } from "./mcpHttp";
import { callTool } from "./sovTools";

const ORIGIN = "https://councilof.ai";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

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

  it("makes a timed-out paid call explicitly unknown and never echoes its authorization", async () => {
    vi.useFakeTimers();
    const network = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(init.signal?.reason),
            { once: true },
          );
        }),
    );
    vi.stubGlobal("fetch", network);
    const authorization = "test-only-payment-authorization";
    const pending = callTool("commission_card", {
      subject: "model/example",
      x_payment: authorization,
    });
    await vi.advanceTimersByTimeAsync(MCP_REQUEST_TIMEOUT_MS);
    const result = await pending;

    expect(result).toMatchObject({ ok: false, state: "unreachable" });
    expect(result.text).toMatch(/delivery and settlement are unknown/i);
    expect(result.text).toMatch(/before signing or retrying/i);
    expect(result.text).not.toContain(authorization);
    expect(network).toHaveBeenCalledTimes(1);
  });

  it("makes any failed paid transport explicitly unknown and never suggests a blind retry", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("connection reset"))));
    const authorization = "test-only-network-failure-authorization";
    const result = await callTool("commission_card", {
      subject: "model/example",
      x_payment: authorization,
    });

    expect(result).toMatchObject({ ok: false, state: "unreachable" });
    expect(result.text).toMatch(/delivery and settlement are unknown/i);
    expect(result.text).toMatch(/inspect .* before signing or retrying/i);
    expect(result.text).not.toMatch(/check your connection and try again/i);
    expect(result.text).not.toContain(authorization);
  });
});
