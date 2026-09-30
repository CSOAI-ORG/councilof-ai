import { describe, expect, it, vi, beforeEach } from "vitest";
import { onRequestGet } from "./summary";

describe("/api/summary — shape (network is mocked)", () => {
  beforeEach(() => {
    // The endpoint reads at request time from the live site; in unit tests
    // we mock all fetches to return shape-only data so the JSON contract
    // is exercised without touching the network.
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const body = (extra: object) => ({ ok: true, json: async () => extra });
      if (url.endsWith("/root.json")) return body({ card_count: 311, as_of: "2026-09-15T07:13:43Z" }) as any;
      if (url.endsWith("/api/gspc")) return body({ totals: { public_count: "22 axis · 22 measured" } }) as any;
      if (url.endsWith("/interop/mcp-trust/latest.json")) return body({ counts: { total: 500, auth_challenged_401_403: 207 }, as_of: "2026-09-14T10:38:01Z" }) as any;
      if (url.endsWith("/interop/x402-trust/latest.json")) return body({ counts: { total: 100 }, as_of: "2026-09-15T05:07:32Z" }) as any;
      if (url.endsWith("/api/coverage-truth")) return body({ summary: { indexed_total: 500 } }) as any;
      return { ok: false, status: 404, json: async () => ({}) } as any;
    }));
  });

  it("returns the media-summary schema", async () => {
    const res = await (onRequestGet as unknown as Function)({
      request: new Request("https://councilof.ai/api/summary"),
      env: {},
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schema).toBe("csoai.media-summary/0.1");
  });

  it("identifies CSOAI Ltd, UK Companies House 16939677", async () => {
    const res = await (onRequestGet as unknown as Function)({
      request: new Request("https://councilof.ai/api/summary"),
      env: {},
    });
    const body = await res.json();
    expect(body.entity.registration).toBe("Companies House 16939677");
    expect(body.entity.jurisdiction).toBe("United Kingdom");
  });

  it("pulls counts from live endpoints into the headline block", async () => {
    const res = await (onRequestGet as unknown as Function)({
      request: new Request("https://councilof.ai/api/summary"),
      env: {},
    });
    const body = await res.json();
    expect(body.headline.signed_cards.value).toBe(311);
    expect(body.headline.mcp_servers_probed.value).toBe(500);
    expect(body.headline.mcp_auth_challenged.value).toBe(207);
    expect(body.headline.x402_payment_doors.value).toBe(100);
  });

  it("names every canonical artifact", async () => {
    const res = await (onRequestGet as unknown as Function)({
      request: new Request("https://councilof.ai/api/summary"),
      env: {},
    });
    const body = await res.json();
    expect(body.canonical_artifacts.board).toMatch(/\/api\/gspc/);
    expect(body.canonical_artifacts.root).toMatch(/\/root\.json/);
    expect(body.canonical_artifacts.verification_cli).toContain("csoai_verify");
    // The ledger is /corrections/; /refutation-ledger is a page of experiments (audit 2026-09-28 #12).
    expect(body.canonical_artifacts.corrections_ledger).toBe("https://councilof.ai/corrections/");
    expect(JSON.stringify(body)).not.toMatch(/@councilof\.ai/);
  });

  it("states the doctrine explicitly", async () => {
    const res = await (onRequestGet as unknown as Function)({
      request: new Request("https://councilof.ai/api/summary"),
      env: {},
    });
    const body = await res.json();
    expect(body.doctrine.certification).toMatch(/never/i);
    expect(body.doctrine.verification).toContain("did:web:csoai.org#board-attestation-1");
  });

  it("discloses the AI-assisted drafting party", async () => {
    const res = await (onRequestGet as unknown as Function)({
      request: new Request("https://councilof.ai/api/summary"),
      env: {},
    });
    const body = await res.json();
    expect(body.entity.aidisclosure).toContain("Anthropic");
  });
});
