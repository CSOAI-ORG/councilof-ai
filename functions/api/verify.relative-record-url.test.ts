/**
 * verify.relative-record-url.test.ts — the estate's own indexes name records root-relative
 * ("/signed/cards/<sha>.json" is every card_url in public/signed/card_index.json, 335 of 335,
 * read 2026-11-18), and /api/verify refused that exact string as UNCHECKABLE "only
 * https://councilof.ai/ … records are fetched" (live, 2026-11-18 06:36Z). The door must accept
 * what the estate hands out, and still refuse everything the host allowlist refuses.
 *
 * fetch is stubbed to serve the repo's own public/ tree, as verify.truth.test.ts does, so every
 * verdict here is computed from committed bytes and no network.
 */
import { existsSync, readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequestGet, onRequestPost, resolveEstateRecordUrl } from "./verify";

const PUB = new URL("../../public/", import.meta.url).pathname;
const index = JSON.parse(readFileSync(PUB + "signed/card_index.json", "utf8")) as { cards: { card_url: string }[] };
// The first card_url of the signed card index, exactly as the index publishes it.
const CARD_PATH = index.cards[0].card_url;
const CARD_ABS = "https://councilof.ai" + CARD_PATH;

const calls: string[] = [];
function serveFromPublic(input: RequestInfo | URL): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  calls.push(url);
  const u = new URL(url);
  const p = PUB + u.pathname.replace(/^\//, "");
  if (existsSync(p)) return Promise.resolve(new Response(readFileSync(p), { status: 200 }));
  return Promise.resolve(new Response("not found", { status: 404 }));
}

beforeEach(() => { calls.length = 0; vi.stubGlobal("fetch", vi.fn(serveFromPublic)); });
afterEach(() => vi.unstubAllGlobals());

const post = async (body: unknown, origin = "https://councilof.ai") =>
  (onRequestPost as any)({ request: new Request(origin + "/api/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }) }) as Promise<Response>;
const get = async (recordUrl: string, origin = "https://councilof.ai") =>
  (onRequestGet as any)({ request: new Request(origin + "/api/verify?record_url=" + encodeURIComponent(recordUrl)) }) as Promise<Response>;

describe("resolveEstateRecordUrl", () => {
  it("resolves a root-relative path against the request origin when that origin is on the allowlist", () => {
    expect(resolveEstateRecordUrl("/signed/cards/x.json", "https://councilof.ai")).toBe("https://councilof.ai/signed/cards/x.json");
    expect(resolveEstateRecordUrl("/signed/cards/x.json", "https://csoai.org")).toBe("https://csoai.org/signed/cards/x.json");
  });
  it("resolves against councilof.ai when the request origin is not an estate origin (preview, localhost)", () => {
    expect(resolveEstateRecordUrl("/signed/cards/x.json", "http://127.0.0.1:8788")).toBe("https://councilof.ai/signed/cards/x.json");
    expect(resolveEstateRecordUrl("/signed/cards/x.json", "https://abc123.councilof-ai.pages.dev")).toBe("https://councilof.ai/signed/cards/x.json");
  });
  it("leaves everything that is not a root-relative path exactly as given", () => {
    for (const s of ["//evil.example/x.json", "https://evil.example/x.json", "signed/cards/x.json", "https://councilof.ai/root.json", "{\"a\":1}", ""]) {
      expect(resolveEstateRecordUrl(s, "https://councilof.ai")).toBe(s);
    }
  });
});

describe("/api/verify accepts the estate's own root-relative record paths", () => {
  it("the card index's card_url is accepted and gives the same verdict as the absolute URL", async () => {
    expect(CARD_PATH).toMatch(/^\/signed\/cards\/[0-9a-f]{64}\.json$/);
    const rel = await (await post({ record_url: CARD_PATH })).json();
    const abs = await (await post({ record_url: CARD_ABS })).json();
    expect(rel.state).not.toBe("UNCHECKABLE");
    expect(rel.state).toBe(abs.state);
    expect(rel.fetched?.sha256).toBe(abs.fetched?.sha256);
    expect(rel.record_url).toBe(CARD_ABS);
    expect(rel.record_url_as_given).toBe(CARD_PATH);
    expect(abs.record_url_as_given).toBeUndefined();
    expect(calls).toContain(CARD_ABS);
  });
  it("GET ?record_url=<root-relative> is the same door", async () => {
    const r = await get(CARD_PATH);
    const b = await r.json();
    expect(r.status).toBe(200);
    expect(b.record_url).toBe(CARD_ABS);
    expect(b.state).not.toBe("UNCHECKABLE");
  });
  it("POST {card: <root-relative>} resolves the same way", async () => {
    const rel = await (await post({ card: CARD_PATH })).json();
    const abs = await (await post({ card: CARD_ABS })).json();
    expect(rel.state).not.toBe("UNCHECKABLE");
    expect(rel.state).toBe(abs.state);
    expect(calls.filter((u) => u === CARD_ABS).length).toBe(2);
  });
  it("a scheme-relative or off-estate URL is still refused, and nothing is fetched", async () => {
    for (const bad of ["//evil.example/x.json", "https://evil.example/x.json", "signed/cards/x.json"]) {
      const r = await post({ record_url: bad });
      const b = await r.json();
      expect(r.status).toBe(400);
      expect(b.state).toBe("UNCHECKABLE");
      expect(b.record_url).toBe(bad);
    }
    expect(calls).toEqual([]);
  });
});
