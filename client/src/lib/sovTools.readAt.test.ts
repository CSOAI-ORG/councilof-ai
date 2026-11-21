/**
 * listTools dates each "ok" listing by the time the door answered (read_at). A cached listing keeps
 * the read_at of the read it came from: a count shown with it is dated by the read, not the render.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ mcpRpc: vi.fn() }));
vi.mock("./mcpHttp", () => ({ mcpRpc: mocks.mcpRpc, mcpRpcEndpoints: {} }));
vi.mock("./buyerPurchases", () => ({ purchaseSessionSnapshot: () => ({ readable: false, token: null }), samePurchaseSession: () => true }));

import { listTools } from "./sovTools";

describe("listTools read_at", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-21T06:37:12.000Z"));
    mocks.mcpRpc.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("stamps an ok listing with the time the door answered, and the cached listing keeps it", async () => {
    mocks.mcpRpc.mockResolvedValue({ result: { tools: [{ name: "board_totals", description: "" }] } });
    const first = await listTools("/mcp/free");
    expect(first.state).toBe("ok");
    if (first.state !== "ok") return;
    expect(first.tools).toHaveLength(1);
    expect(first.read_at).toBe("2026-11-21T06:37:12.000Z");

    vi.setSystemTime(new Date("2026-11-21T06:37:40.000Z"));
    const second = await listTools("/mcp/free");
    expect(mocks.mcpRpc).toHaveBeenCalledTimes(1);
    expect(second.state === "ok" && second.read_at).toBe("2026-11-21T06:37:12.000Z");
  });

  it("an unreachable door carries a reason and no read_at", async () => {
    mocks.mcpRpc.mockResolvedValue({ error: { message: "nope" } });
    const r = await listTools("/mcp");
    expect(r).toEqual({ state: "unreachable", reason: "nope" });
  });
});
