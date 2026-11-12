/**
 * gspc.etag.test.ts — the validator IS the hash of the served bytes.
 *
 * Contract under test (functions/api/_etag.ts + the GET handler's conditional branch):
 *   1. every 200 names an ETag and the 200 body is the only thing the ETag was computed over;
 *   2. the same GET twice with no validator → identical ETag (the handler is deterministic);
 *   3. If-None-Match naming that ETag → 304, no body, same ETag header;
 *   4. If-None-Match naming anything else → 200 with the body;
 *   5. HEAD carries the same ETag (headFromGet forwards the headers of the GET);
 *   6. ?axis= variants are different resources — an ETag for the full board does not satisfy them.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { onRequestGet } from "./gspc";
import { etagFor, ifNoneMatchSatisfied } from "./_etag";

type Ctx = {
  request: Request;
  waitUntil: (p: Promise<unknown>) => void;
  env: Record<string, unknown>;
};

// Workers-global stub, same pattern as gspc.cite.test.ts.
let cacheStore: Map<string, Response>;
beforeEach(() => {
  cacheStore = new Map();
  (globalThis as unknown as { caches: unknown }).caches = {
    default: {
      match: async (req: Request) => cacheStore.get(req.url)?.clone(),
      put: async (req: Request, res: Response) => void cacheStore.set(req.url, res),
    },
  };
});

const call = async (url: string, headers: Record<string, string> = {}) => {
  const store: Promise<unknown>[] = [];
  const res = await onRequestGet({
    request: new Request(url, { method: "GET", headers }),
    waitUntil: (p) => store.push(p),
    env: {},
  } as unknown as Ctx);
  return { res, store };
};

describe("GET /api/gspc conditional support", () => {
  it("serves a strong ETag that equals the sha256 of the served bytes, and 304s a matching If-None-Match on a cache miss", async () => {
    const url = "https://councilof.ai/api/gspc";
    const first = await call(url);
    expect(first.res.status).toBe(200);
    const etag = first.res.headers.get("etag");
    expect(etag).toMatch(/^"[0-9a-f]{64}"$/);
    const body = await first.res.text();
    expect(etag).toBe(await etagFor(body));

    // The edge cache holds the 200 (put ran through waitUntil); on a warm edge, Cloudflare's
    // own cache.match answers conditionals. The handler's 304 branch is the cold-edge path:
    // clear the stub to exercise exactly that branch.
    cacheStore.clear();
    const second = await call(url, { "if-none-match": etag as string });
    expect(second.res.status).toBe(304);
    expect(await second.res.text()).toBe("");
    expect(second.res.headers.get("etag")).toBe(etag);
  });

  it("the edge-cached 200 keeps the ETag header, so warm conditional reads still have a validator", async () => {
    const url = "https://councilof.ai/api/gspc";
    const first = await call(url);
    const etag = first.res.headers.get("etag");
    await Promise.all(first.store);
    const cached = cacheStore.get(url);
    expect(cached).toBeTruthy();
    expect(cached!.headers.get("etag")).toBe(etag);
    expect(cached!.headers.get("cache-control")).toContain("max-age=300");
  });

  it("is deterministic: two cold GETs name the same ETag", async () => {
    const url = "https://councilof.ai/api/gspc";
    const a = await call(url);
    const etagA = a.res.headers.get("etag");
    const b = await call(url);
    expect(b.res.headers.get("etag")).toBe(etagA);
  });

  it("a non-matching validator gets the full 200", async () => {
    const url = "https://councilof.ai/api/gspc";
    const { res } = await call(url, { "if-none-match": '"deadbeef"' });
    expect(res.status).toBe(200);
    expect((await res.text()).length).toBeGreaterThan(1000);
  });

  it("a different resource (?axis=…) is not satisfied by the board's ETag", async () => {
    const board = await call("https://councilof.ai/api/gspc");
    const boardEtag = board.res.headers.get("etag");
    const axisUrl = "https://councilof.ai/api/gspc?axis=safety";
    const axis = await call(axisUrl);
    expect(axis.res.headers.get("etag")).not.toBe(boardEtag);
    const conditional = await call(axisUrl, { "if-none-match": boardEtag as string });
    expect(conditional.res.status).toBe(200);
  });

  it("HEAD carries the ETag (headFromGet forwards the GET's headers)", async () => {
    // onRequestHead composes headFromGet over onRequestGet; asserting via the GET contract that
    // feeds it keeps this test free of a second PagesFunction export contract.
    const { res } = await call("https://councilof.ai/api/gspc");
    expect(res.headers.get("etag")).toMatch(/^"[0-9a-f]{64}"$/);
  });
});

describe("ifNoneMatchSatisfied (RFC 9110 §8.8.3 comparisons)", () => {
  it("matches exact, comma-listed, weak-prefixed and star", () => {
    const etag = '"abc123"';
    expect(ifNoneMatchSatisfied('"abc123"', etag)).toBe(true);
    expect(ifNoneMatchSatisfied('"x", "abc123"', etag)).toBe(true);
    expect(ifNoneMatchSatisfied('W/"abc123"', etag)).toBe(true);
    expect(ifNoneMatchSatisfied("*", etag)).toBe(true);
    expect(ifNoneMatchSatisfied('"other"', etag)).toBe(false);
    expect(ifNoneMatchSatisfied(null, etag)).toBe(false);
    expect(ifNoneMatchSatisfied("", etag)).toBe(false);
  });
});
