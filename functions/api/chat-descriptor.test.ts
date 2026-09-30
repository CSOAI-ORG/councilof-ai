/**
 * GET /api/chat used to fall through to the /api catch-all 404. It now answers with a descriptor
 * naming the one answerer and its five skins. Each skin's endpoint must exist as a Function file.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { CHAT_SKINS, chatDescriptor, onRequestGet } from "./chat";

const ROOT = resolve(__dirname, "../..");
const FILES: Record<string, string> = {
  chat: "functions/api/chat.ts",
  mcp: "functions/mcp/[[path]].ts",
  a2a: "functions/api/a2a.ts",
  agui: "functions/api/agui/[[path]].ts",
  a2ui: "functions/api/a2ui/[[path]].ts",
};

describe("GET /api/chat descriptor", () => {
  it("lists exactly the five skins, in order", async () => {
    const res = await onRequestGet({ request: new Request("https://councilof.ai/api/chat") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skins).toEqual(["chat", "mcp", "a2a", "agui", "a2ui"]);
    expect(Object.keys(body.surfaces)).toEqual([...CHAT_SKINS]);
    expect(body.name).toBe("Ask the Council");
  });
  it.each([...CHAT_SKINS])("skin %s is served by a Function that exists", (k) => {
    expect(existsSync(resolve(ROOT, FILES[k]))).toBe(true);
  });
  it("names the requesting origin and types no count or certification word", () => {
    const d = chatDescriptor("https://example.test");
    const text = JSON.stringify(d);
    expect(d.surfaces.chat.endpoint).toBe("https://example.test/api/chat");
    expect(d.surfaces.mcp.endpoint).toBe("https://example.test/mcp/free");
    expect(text).not.toMatch(/\b\d+ (?:axes|axis|tools)\b/);
    expect(text).not.toMatch(/\bcertified\b|\bcompliant\b/i);
  });
});

describe("/api catch-all 404 hint", () => {
  it("points at the real doors and labels /api/mcp as a census of other servers", async () => {
    // @ts-ignore -- plain JS module
    const mod = await import("./[[path]].js");
    const res = await mod.onRequest({ request: new Request("https://councilof.ai/api/nope"), params: { path: ["nope"] } });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.hint).toBe(mod.NOT_FOUND_HINT);
    expect(body.hint).toMatch(/\/openapi\.json/);
    expect(body.hint).toMatch(/\/mcp\/free/);
    expect(body.hint).toMatch(/GET \/api\/chat/);
    expect(body.hint).not.toMatch(/server catalogue/);
  });
});
