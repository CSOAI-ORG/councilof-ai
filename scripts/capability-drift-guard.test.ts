import { afterEach, expect, it, vi } from "vitest";
import { mcpListRequest, observed } from "./capability-drift-guard.mjs";
import { onRequest } from "../functions/mcp/[[path]]";

afterEach(() => vi.unstubAllGlobals());

it("the real MCP mount accepts the capability drift probe as modern JSON", async () => {
  const network = vi.fn(async () => {
    throw new Error("unexpected network");
  });
  vi.stubGlobal("fetch", network);
  const response = await onRequest({
    request: new Request("https://councilof.ai/mcp", mcpListRequest()),
    env: {},
    params: {},
    waitUntil: () => {},
  } as never);
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  const mcp = await response.json();
  expect(mcp.result.resultType).toBe("complete");
  const result = observed({ mcp });
  expect(result.mcp.size).toBe(12);
  expect(result.mcp.has("commission_card")).toBe(true);
  expect(result.mcp.has("witness_hash")).toBe(false);
  expect(network).not.toHaveBeenCalled();
});
