/**
 * /interop/x402.json is the estate-level x402 index named as live discovery metadata in
 * docs/interop/CIRCLE-AGENTSTACK-MANIFEST-2026-09-06.md and docs/interop/X402-FOUNDATION-APPLICATION.md.
 * It answered 404 on 2026-10-13 because no route ever served it. The route now exists
 * (./x402.json.ts) and must stay a VIEW of the one catalog source, never a copy:
 *
 *   - 200 + the csoai.x402-catalog schema, free (a discovery index is never behind a 402);
 *   - byte-for-byte the same body GET /api/x402 returns — one source, nothing to drift;
 *   - HEAD answers what GET answers with no body (the ratchet in functions/api/_head.coverage.test.ts).
 */
import { describe, expect, it } from "vitest";
import { onRequestGet as index, onRequestHead as indexHead } from "./x402.json";
import { onRequestGet as catalog } from "../api/x402";

const ctx = (path: string) =>
  ({ request: new Request("https://councilof.ai" + path), env: {}, params: {} }) as never;

describe("/interop/x402.json — the estate-level x402 index", () => {
  it("answers 200 with the machine catalog body", async () => {
    const r = await index(ctx("/interop/x402.json"));
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toContain("application/json");
    const body = (await r.json()) as {
      schema: string;
      resources: { resource: string; free_preview: string }[];
      invariants: Record<string, string>;
    };
    expect(body.schema).toBe("csoai.x402-catalog/0.3");
    expect(Array.isArray(body.resources)).toBe(true);
    expect(body.resources.length).toBeGreaterThanOrEqual(25);
    for (const entry of body.resources) {
      expect(typeof entry.resource, "a catalog entry names a URL and nothing else").toBe("string");
      expect(typeof entry.free_preview).toBe("string");
    }
    expect(body.invariants.no_public_price).toContain("402 challenge");
  });

  it("is byte-for-byte the /api/x402 catalog — one source, no second copy to drift", async () => {
    const fromIndex = await (await index(ctx("/interop/x402.json"))).text();
    const fromApi = await (await catalog(ctx("/api/x402"))).text();
    expect(fromIndex).toBe(fromApi);
  });

  it("answers HEAD with 200 and no body", async () => {
    const h = await indexHead(ctx("/interop/x402.json"));
    expect(h.status).toBe(200);
    expect(await h.text()).toBe("");
  });
});
