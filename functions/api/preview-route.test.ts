import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * GET /api/<door>/preview — the free preview + price scaffold surface (x402 REVENUE-NOW repair).
 * The dispatcher is the /api/* catch-all, functions/api/[[path]].js. Bracketed filenames are
 * legal on disk but trip some resolvers when named literally in an import specifier, so it is
 * loaded from a computed specifier.
 */
const load = () =>
  import("./" + "[[path]]" + ".js") as unknown as Promise<{
    onRequest: (ctx: unknown) => Promise<Response>;
  }>;

const call = async (path: string[], url: string, method = "GET") => {
  const mod = await load();
  return mod.onRequest({
    params: { path },
    request: new Request(url, { method }),
    env: {},
  });
};

afterEach(() => vi.unstubAllGlobals());

describe("free preview routes return the full payload shape with live free data", () => {
  it("serves the door's free slice and points at the paid resource (gate params stripped)", async () => {
    const seen: string[] = [];
    vi.stubGlobal("fetch", async (input: string | URL | Request) => {
      seen.push(String(input instanceof Request ? input.url : input));
      return new Response(JSON.stringify({ kind: "preview", relevant_signed_cards: 2 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    const r = await call(
      ["rwa", "evidence", "preview"],
      "https://councilof.ai/api/rwa/evidence/preview?asset=RLUSD",
    );
    expect(r.status).toBe(200);
    const b = (await r.json()) as any;
    expect(b.kind).toBe("preview");
    expect(b.relevant_signed_cards).toBe(2);
    expect(b.buy.resource).toBe("https://councilof.ai/api/rwa/evidence?asset=RLUSD");
    expect(b.buy.notice).toMatch(/never grades/i);
    expect(seen).toEqual(["https://councilof.ai/api/rwa/evidence?asset=RLUSD&preview=1"]);
  });

  it("keeps paid-tier selectors on the buy link while the free slice stays free", async () => {
    const seen: string[] = [];
    vi.stubGlobal("fetch", async (input: string | URL | Request) => {
      seen.push(String(input instanceof Request ? input.url : input));
      return new Response(JSON.stringify({ count: 3 }), { status: 200 });
    });
    const r = await call(
      ["receipts", "batch", "preview"],
      "https://councilof.ai/api/receipts/batch/preview?from=2026-01-01T00:00:00Z&to=2026-02-01T00:00:00Z",
    );
    expect(r.status).toBe(200);
    const b = (await r.json()) as any;
    expect(b.kind).toBe("preview");
    expect(b.buy.resource).toContain("from=2026-01-01");
    expect(seen[0]).toContain("preview=1");
    expect(seen[0]).not.toContain("bundle=");
  });

  it("lifts a 402 challenge into a 200 preview carrying the challenge's live free data", async () => {
    vi.stubGlobal("fetch", async () =>
      new Response(
        JSON.stringify({
          x402Version: 2,
          resource: { url: "https://councilof.ai/api/request-attestation?subject=qwen3" },
          accepts: [{ amount: "10000" }],
          csoai: { schema: "csoai.request-attestation/0.2", preview: { subject: "qwen3", signed_cards_on_file: 1 } },
        }),
        { status: 402 },
      ),
    );
    const r = await call(
      ["request-attestation", "preview"],
      "https://councilof.ai/api/request-attestation/preview?subject=qwen3",
    );
    expect(r.status).toBe(200);
    const b = (await r.json()) as any;
    expect(b.kind).toBe("preview");
    expect(b.state).toBe("PREVIEW_FROM_CHALLENGE");
    expect(b.preview).toMatchObject({ subject: "qwen3", signed_cards_on_file: 1 });
    expect(b.buy.resource).toBe("https://councilof.ai/api/request-attestation?subject=qwen3");
  });

  it("states input requirements instead of failing when the door validates its input", async () => {
    vi.stubGlobal("fetch", async () =>
      new Response(
        JSON.stringify({ error: "bad_request", reason: "pass sha=<64-hex> for one free inclusion, or bundle=1 for x402" }),
        { status: 400 },
      ),
    );
    const r = await call(["proof", "preview"], "https://councilof.ai/api/proof/preview");
    expect(r.status).toBe(200);
    const b = (await r.json()) as any;
    expect(b.state).toBe("INPUT_REQUIRED");
    expect(b.upstream_status).toBe(400);
    expect(String(b.upstream.reason)).toContain("sha=");
    expect(b.buy.resource).toBe("https://councilof.ai/api/proof");
  });

  it("an unknown /api/**/preview still answers the real 404 the catch-all owns", async () => {
    const r = await call(["spec", "drift", "preview"], "https://councilof.ai/api/spec/drift/preview");
    expect(r.status).toBe(404);
    const b = (await r.json()) as any;
    expect(b.error).toBe("not_found");
  });
});
