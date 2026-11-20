import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";
import { measurementToolResult } from "./_measurement";

afterEach(() => vi.unstubAllGlobals());
function capsule(shape: "wide" | "deep") {
  let value: unknown = Array(10_001).fill(null);
  if (shape === "deep") {
    value = 1;
    for (let n = 0; n < 70; n++) value = { value };
  }
  return {
    schema: "csoai.measurement-capsule/0.2",
    kind: "measurement.a2a_card_signature",
    value,
  };
}

describe("capsule coercion preserves request budgets and exact JSON text", () => {
  it.each(["wide", "deep"] as const)(
    "rejects %s capsule JSON text on both actual MCP doors",
    async (shape) => {
      const network = vi.fn(() => {
        throw new Error("No index should be fetched");
      });
      vi.stubGlobal("fetch", network);
      for (const door of ["/mcp", "/mcp/free"]) {
        const response = await onRequest({
          request: new Request(`https://councilof.ai${door}`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              accept: "application/json",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "capsule-budget",
              method: "tools/call",
              params: {
                name: "verify_capsule",
                arguments: { capsule_json: JSON.stringify(capsule(shape)) },
              },
            }),
          }),
        });
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({
          result: {
            isError: false,
            structuredContent: {
              state: "UNCHECKABLE",
              reasons: ["input_budget_exceeded"],
            },
          },
        });
      }
      expect(network).not.toHaveBeenCalled();
    },
  );

  it.each(["wide", "deep"] as const)(
    "applies the same %s limit to an object reaching the shared handler",
    async (shape) => {
      const result = await measurementToolResult(
        "verify_capsule",
        { capsule_json: capsule(shape) },
        "https://councilof.ai",
      );
      expect(result.structuredContent).toMatchObject({
        state: "UNCHECKABLE",
        reasons: ["input_budget_exceeded"],
      });
    },
  );
});
