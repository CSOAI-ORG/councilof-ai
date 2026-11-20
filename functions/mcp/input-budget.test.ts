/**
 * Structure budgets on the MCP doors (functions/mcp/_input_budget.ts).
 *
 * The 28 MiB byte cap bounds bytes. These cases fit under it and still reach JSON.parse, the SDK's
 * request schema or a quadratic parser on master: too many tokens, too deep, or a card or capsule
 * sent as a JSON string, which is one token to the door's scan and is parsed again by its handler.
 * Each is refused before any network read (signing anchors, capsule index) or tool work, and one
 * 20 MiB string, the wire contract, is still answered. The handlers are shared, so /api/a2a holds
 * the same bound.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";
import { sharedToolResult, verifyToolResult } from "./_handlers";
import { measurementToolResult } from "./_measurement";
import { onRequestPost as a2aPost } from "../api/a2a";

const ORIGIN = "https://councilof.ai";
afterEach(() => vi.unstubAllGlobals());

function offline() {
  const network = vi.fn(async () => {
    throw new TypeError("offline test: no network");
  });
  vi.stubGlobal("fetch", network);
  return network;
}
async function post(door: string, body: string) {
  const res = await onRequest({
    request: new Request(`${ORIGIN}${door}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body,
    }),
  });
  return { status: res.status, cacheControl: res.headers.get("cache-control"), message: JSON.parse(await res.text()) };
}
const toolCall = (name: string, args: string) =>
  `{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"${name}","arguments":${args}}}`;
const values = (n: number) => Array(n).fill("0").join(",");
/** A card shape with exactly n array elements plus object members. */
const cardText = (n: number) =>
  JSON.stringify({ id: "a".repeat(64), pubkey: "00", signature: "00", body: { values: Array(n - 5).fill(0) } });
/** A capsule shape with exactly n array elements plus object members. */
const capsuleText = (n: number) =>
  JSON.stringify({ schema: "csoai.measurement-capsule/0.2", kind: "x", v: Array(n - 3).fill(0) });
const deepText = (levels: number) => '{"a":'.repeat(levels) + "0" + "}".repeat(levels);

describe("the door bounds structure before JSON.parse, not only bytes", () => {
  it.each(["/mcp", "/mcp/free"])("%s refuses 25,001 values in 125 KB and still answers one 20 MiB string", async (door) => {
    const network = offline();
    const wide = await post(door, toolCall("verify_card", `{"card":{"values":[${values(25_001)}]}}`));
    expect(wide.status).toBe(413);
    expect(wide.cacheControl).toBe("no-store");
    expect(wide.message.error.code).toBe(-32600);
    expect(network).not.toHaveBeenCalled();

    const b64 = "A".repeat(4 * Math.ceil((20 * 1024 * 1024) / 3));
    const long = await post(door, toolCall("verify_card", `{"card":"${b64}"}`));
    expect(long.status).toBe(200);
    expect(long.message.result.structuredContent.state).toBe("UNCHECKABLE");
  });

  it("refuses 100,000 levels of nesting at the door", async () => {
    const network = offline();
    const deep = await post("/mcp/free", toolCall("verify_card", `{"card":${deepText(100_000)}}`));
    expect(deep.status).toBe(413);
    expect(deep.message.error.code).toBe(-32600);
    expect(network).not.toHaveBeenCalled();
  });

  it("bounds initialize as well as tools/call: 13,000 capability keys are refused before the SDK schema", async () => {
    offline();
    const keys = Array.from({ length: 13_000 }, (_, i) => `"k${i}":0`).join(",");
    const init = await post(
      "/mcp",
      `{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18",` +
        `"clientInfo":{"name":"budget","version":"1"},"capabilities":{"experimental":{${keys}}}}}`,
    );
    expect(init.status).toBe(413);
    expect(init.message.error.code).toBe(-32600);
    expect(JSON.stringify(init.message).length).toBeLessThan(1_000);
  });
});

describe("a card sent as a JSON string is bounded before it is parsed", () => {
  it.each(["/mcp", "/mcp/free"])("%s verifies 10,000 elements and refuses 10,001 before fetching anchors", async (door) => {
    const network = offline();
    const at = await post(door, toolCall("verify_card", JSON.stringify({ card: cardText(10_000) })));
    expect(at.message.result.structuredContent.reasons).not.toContain("input_budget_exceeded");
    expect(network).toHaveBeenCalled();

    network.mockClear();
    const over = await post(door, toolCall("verify_card", JSON.stringify({ card: cardText(10_001) })));
    expect(over.status).toBe(200);
    expect(over.message.result.isError).toBe(false);
    expect(over.message.result.structuredContent).toMatchObject({
      state: "UNCHECKABLE",
      reasons: ["input_budget_exceeded"],
    });
    expect(network).not.toHaveBeenCalled();
  });

  it("the shared handler and the verify alias refuse the same card as an object or a string", async () => {
    const network = offline();
    const card = JSON.parse(cardText(10_001));
    for (const input of [card, cardText(10_001)]) {
      const shared = await sharedToolResult("verify_card", { card: input }, ORIGIN);
      expect(shared.structuredContent).toMatchObject({ state: "UNCHECKABLE", reasons: ["input_budget_exceeded"] });
      const alias = await verifyToolResult({ card: input }, ORIGIN);
      expect(alias.structuredContent).toMatchObject({ state: "UNCHECKABLE", reasons: ["input_budget_exceeded"] });
    }
    expect(network).not.toHaveBeenCalled();
  });
});

describe("a capsule is bounded before the lexical parse", () => {
  it.each(["/mcp", "/mcp/free"])("%s reads 10,000 elements and refuses 10,001 before any index fetch", async (door) => {
    const network = offline();
    const at = await post(door, toolCall("verify_capsule", JSON.stringify({ capsule_json: capsuleText(10_000) })));
    expect(at.message.result.structuredContent.state).not.toBe("UNCHECKABLE");
    expect(network).toHaveBeenCalled();

    network.mockClear();
    const over = await post(door, toolCall("verify_capsule", JSON.stringify({ capsule_json: capsuleText(10_001) })));
    expect(over.message.result.isError).toBe(false);
    expect(over.message.result.structuredContent).toMatchObject({
      state: "UNCHECKABLE",
      doctrine: "measurement, not endorsement",
      reasons: ["input_budget_exceeded"],
    });
    expect(network).not.toHaveBeenCalled();
  });

  it("refuses 65 levels and 10,001 object keys, as text or as an object, in the shared handler", async () => {
    const network = offline();
    const keys = Object.fromEntries(Array.from({ length: 10_001 }, (_, i) => [`k${i}`, 0]));
    for (const capsule_json of [deepText(65), JSON.parse(deepText(65)), JSON.stringify(keys), keys]) {
      const result = await measurementToolResult("verify_capsule", { capsule_json }, ORIGIN);
      expect(result.structuredContent).toMatchObject({ state: "UNCHECKABLE", reasons: ["input_budget_exceeded"] });
    }
    expect(network).not.toHaveBeenCalled();
  });

  it("/api/a2a runs the same handler and refuses the same capsule", async () => {
    const network = offline();
    const res = await a2aPost({
      request: new Request(`${ORIGIN}/api/a2a`, {
        method: "POST",
        headers: { "content-type": "application/json", "a2a-version": "1.0" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 7,
          method: "SendMessage",
          params: {
            message: {
              messageId: "m-budget",
              role: "ROLE_USER",
              parts: [{ data: { skill: "verify_capsule", input: { capsule_json: capsuleText(10_001) } }, mediaType: "application/json" }],
            },
          },
        }),
      }),
    } as never);
    const body = (await res.json()) as { result: { message: { parts: Array<{ data?: { result?: { structuredContent?: unknown } } }> } } };
    const result = body.result.message.parts.find((p) => p.data?.result)?.data?.result;
    expect(result?.structuredContent).toMatchObject({ state: "UNCHECKABLE", reasons: ["input_budget_exceeded"] });
    expect(network).not.toHaveBeenCalled();
  });
});
