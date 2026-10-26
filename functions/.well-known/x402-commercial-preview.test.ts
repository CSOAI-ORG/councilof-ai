import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as manifest } from "./x402.json";
import { onRequestGet as evidenceBundle } from "../api/evidence-bundle";
afterEach(() => vi.unstubAllGlobals());
describe("existing evidence-bundle preview discovery", () => {
  it("points to the same-product free preview accepted by the real handler", async () => {
    const origin = "https://councilof.ai";
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.origin === origin && url.pathname === "/cards-bundle.json") {
        return new Response(JSON.stringify({ cards: {}, merkle_root: null, as_of: null }), { headers: { "content-type": "application/json" } });
      }
      throw new Error(`Unexpected network request in an offline test: ${url}`);
    }));
    const env = { X402_PROMO_NOW: "2026-10-11T00:00:00Z" };
    const response = await (manifest as unknown as (c: unknown) => Promise<Response>)({ request: new Request(`${origin}/.well-known/x402.json`), env });
    const doc = await response.json() as { resources: Array<{ url: string; free_preview?: string }> };
    const resource = doc.resources.find(r => new URL(r.url).pathname === "/api/evidence-bundle");
    expect(resource?.free_preview).toBe(`${origin}/api/evidence-bundle?obligation=article-50`);
    expect(new URL(resource!.url).searchParams.get("bundle")).toBe("1");
    const result = await (evidenceBundle as unknown as (c: unknown) => Promise<Response>)({ request: new Request(resource!.free_preview!), env });
    const preview = await result.json() as { kind: string; relevant_signed_cards: number; obligation: { id: string } };
    expect(result.status).toBe(200);
    expect(preview.kind).toBe("preview");
    expect(preview.obligation.id).toBe("article-50");
    expect(preview.relevant_signed_cards).toBe(0);
  });
});
