import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet } from "./proof";

const call = (url: string, headers: Record<string, string> = {}) =>
  (onRequestGet as unknown as (c: unknown) => Promise<Response>)({
    request: new Request(url, { headers }),
    env: {},
  });

afterEach(() => vi.unstubAllGlobals());

describe("/api/proof directory compatibility", () => {
  it("sends the bare URL to the existing paid bundle URL without touching payment or root state", async () => {
    const fetch = vi.fn(() => { throw new Error("bare alias must not fetch"); });
    vi.stubGlobal("fetch", fetch);
    const response = await call("https://councilof.ai/api/proof");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://councilof.ai/api/proof?bundle=1");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps the canonical bundle as an x402 challenge", async () => {
    const fetch = vi.fn(() => { throw new Error("unpaid bundle must not fetch evidence"); });
    vi.stubGlobal("fetch", fetch);
    const response = await call("https://councilof.ai/api/proof?bundle=1");
    expect(response.status).toBe(402);
    expect(response.headers.get("location")).toBeNull();
    const body = await response.json() as { resource?: { url?: string } };
    expect(body.resource?.url).toBe("https://councilof.ai/api/proof?bundle=1");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps a named inclusion free after adding the bare redirect", async () => {
    const sha = "a".repeat(64);
    const fetch = vi.fn((input: string) => {
      const path = new URL(input).pathname;
      if (path === "/root.json") return Promise.resolve(new Response(JSON.stringify({ card_sha256: [sha], card_count: 1, merkle_root: "b".repeat(64) })));
      if (path === `/proofs/${sha.slice(0, 16)}.json`) return Promise.resolve(new Response(JSON.stringify({ sha256: sha, index: 0, proof: [] })));
      throw new Error(`unexpected fetch ${path}`);
    });
    vi.stubGlobal("fetch", fetch);
    const response = await call(`https://councilof.ai/api/proof?sha=${sha}`);
    expect(response.status).toBe(200);
    const body = await response.json() as { kind?: string; free?: boolean; card_count?: number };
    expect(body).toMatchObject({ kind: "inclusion", free: true, card_count: 1 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not treat an incoming payment header on the bare URL as a settlement", async () => {
    const fetch = vi.fn(() => { throw new Error("bare alias must not fetch"); });
    vi.stubGlobal("fetch", fetch);
    const response = await call("https://councilof.ai/api/proof", { "x-payment": "untrusted" });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://councilof.ai/api/proof?bundle=1");
    expect(fetch).not.toHaveBeenCalled();
  });
});
