import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet } from "./proof";

const ORIGIN = "https://councilof.ai";
const LEAF = "a".repeat(64);
const ROOT_HASH = "b".repeat(64);
// The clock is pinned inside the launch period, so the asserted amount does not flip when the launch
// amount ends (2027-01-11T00:00:00Z since owner ruling #16, functions/api/_x402.ts X402_LAUNCH_CAMPAIGN).
const context = (path: string) =>
  ({ request: new Request(ORIGIN + path), env: { X402_PROMO_NOW: "2026-09-26T00:00:00Z" }, params: {} }) as never;

afterEach(() => vi.unstubAllGlobals());

describe("/api/proof buyer description", () => {
  it("describes the paid bundle and free signed root in its 402 without reading or settling", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);

    const response = await onRequestGet(context("/api/proof?bundle=1"));
    expect(response.status).toBe(402);
    expect(response.headers.get("payment-required")).toBeTruthy();
    const challenge = await response.json();

    expect(challenge.csoai.per).toBe("proof-bundle");
    expect(challenge.csoai.deliverable).toContain("Available inclusion proofs");
    expect(challenge.csoai.deliverable).toContain("full root signature envelope is free at /root.json");
    expect(challenge.csoai.deliverable).toContain("/api/proof?sha=<64-hex>");
    expect(challenge.csoai.deliverable).not.toContain("one inclusion proof for the given leaf");
    expect(challenge.csoai.bazaar_note).toContain("may trigger Bazaar catalog processing");
    expect(challenge.csoai.bazaar_note).toContain("Catalog inclusion requires separate public readback");
    expect(challenge.csoai.bazaar_note).not.toContain("CDP indexes after first settled payment");
    expect(challenge.csoai.free.one_inclusion).toBe("/api/proof?sha=<64-hex>");
    expect(challenge.resource.url).toBe(ORIGIN + "/api/proof?bundle=1");
    expect(challenge.accepts[0].amount).toBe("10000");
    expect(challenge.extensions.bazaar.info.input).toMatchObject({
      type: "http", method: "GET", queryParams: { bundle: "1" },
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("keeps the one-leaf proof free and bound to the root count", async () => {
    const fetcher = vi.fn(async (input: string) => {
      const path = new URL(input).pathname;
      if (path === "/root.json") {
        return new Response(JSON.stringify({
          as_of: "2026-09-24T00:00:00Z",
          card_sha256: [LEAF],
          card_count: 1,
          merkle_root: ROOT_HASH,
        }));
      }
      if (path === "/proofs/" + LEAF.slice(0, 16) + ".json") {
        return new Response(JSON.stringify({
          sha256: LEAF, index: 0, proof: [], merkle_root: ROOT_HASH,
          card_count: 999,
        }));
      }
      return new Response("unexpected", { status: 404 });
    });
    vi.stubGlobal("fetch", fetcher);

    const response = await onRequestGet(context("/api/proof?sha=" + LEAF));
    expect(response.status).toBe(200);
    expect(response.headers.get("payment-required")).toBeNull();
    const proof = await response.json();
    expect(proof).toMatchObject({
      kind: "inclusion", free: true, sha256: LEAF,
      index: 0, merkle_root: ROOT_HASH, card_count: 1,
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
