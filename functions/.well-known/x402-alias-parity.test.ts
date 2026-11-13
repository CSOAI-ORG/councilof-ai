import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as slashless from "./x402";
import * as directoryIndex from "./x402/index";
import { onRequestGet as manifestGet } from "./x402.json";

const ORIGIN = "https://councilof.ai";
const ENV = { X402_PROMO_NOW: "2026-09-26T00:00:00Z" };
type Handler = (context: unknown) => Response | Promise<Response>;

async function call(handler: unknown, path: string, method = "GET"): Promise<Response> {
  expect(typeof handler, `${method} handler for ${path}`).toBe("function");
  return (handler as Handler)({
    request: new Request(`${ORIGIN}${path}`, { method }),
    env: ENV,
    params: {},
  });
}

// A missing re-export compiled into an undefined Pages route binding and stopped the whole
// production Worker at startup. Exercise both public aliases, including the directory index
// that Pages chooses for the slash route, against the canonical manifest rather than a copy.
describe.each([
  ["/.well-known/x402", slashless],
  ["/.well-known/x402/", directoryIndex],
] as const)("x402 discovery alias %s", (path, route) => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-11T00:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("exports callable GET and HEAD handlers without a catch-all method handler", () => {
    expect(typeof route.onRequestGet).toBe("function");
    expect(typeof route.onRequestHead).toBe("function");
    expect(route).not.toHaveProperty("onRequest");
  });

  it("returns the canonical discovery manifest and headers at 200", async () => {
    const expected = await call(manifestGet, "/.well-known/x402.json");
    const actual = await call(route.onRequestGet, path);
    expect(actual.status).toBe(200);
    expect(actual.status).toBe(expected.status);
    expect([...actual.headers.entries()]).toEqual([...expected.headers.entries()]);
    const body = await actual.text();
    expect(body).toBe(await expected.text());
    const manifest = JSON.parse(body);
    expect(manifest.schema).toBe("csoai.x402/0.2");
    expect(manifest.resources.length).toBeGreaterThan(20);
  });

  it("answers HEAD with the GET status and headers and no response body", async () => {
    const get = await call(manifestGet, "/.well-known/x402.json");
    const head = await call(route.onRequestHead, path, "HEAD");
    expect(head.status).toBe(200);
    expect(head.status).toBe(get.status);
    expect([...head.headers.entries()]).toEqual([...get.headers.entries()]);
    expect(await head.text()).toBe("");
  });
});
