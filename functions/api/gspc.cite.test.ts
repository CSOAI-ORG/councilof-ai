import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { onRequestGet } from "./gspc";
import { onRequestGet as axisAlias } from "./gspc/axis/[axis]";

/**
 * Lane verify-and-cite (30 Sep 2026). GET /api/gspc?axis=X&format=cite publishes a sha256 and a
 * url; the promise is that `curl -s <url> | shasum -a 256` reproduces the sha256. These tests
 * hold that promise on the served bytes, through a cache that actually stores, the way the edge
 * does — so a cite that hashed a different serialisation than the url serves fails here.
 */

type Ctx = Parameters<typeof onRequestGet>[0];

let store: Map<string, Response>;
beforeEach(() => {
  store = new Map();
  (globalThis as unknown as { caches: unknown }).caches = {
    default: {
      match: async (req: Request) => store.get(req.url)?.clone(),
      put: async (req: Request, res: Response) => void store.set(req.url, res),
    },
  };
});

const pending: Promise<unknown>[] = [];
const ctx = (url: string, env: Record<string, unknown> = {}, params: Record<string, string> = {}): Ctx =>
  ({ request: new Request(url), env, params, waitUntil: (p: Promise<unknown>) => void pending.push(p) }) as unknown as Ctx;
const settle = async () => { await Promise.all(pending.splice(0)); };
const sha = (b: ArrayBuffer) => createHash("sha256").update(Buffer.from(b)).digest("hex");

async function boardKey(): Promise<string> {
  const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const der = await crypto.subtle.exportKey("pkcs8", kp.privateKey);
  return Buffer.from(der).toString("base64");
}

describe("GET /api/gspc?format=cite", () => {
  it("names the axis alias and a sha256 the alias bytes reproduce", async () => {
    const cite = await onRequestGet(ctx("https://councilof.ai/api/gspc?axis=governance&format=cite"));
    expect(cite.status).toBe(200);
    expect(cite.headers.get("cache-control")).toBe("no-store");
    const block = await cite.json();
    await settle();
    expect(block.schema).toBe("csoai.gspc-cite/0.1");
    expect(block.url).toBe("https://councilof.ai/api/gspc/axis/governance");
    expect(block.sha256).toMatch(/^[0-9a-f]{64}$/);

    const served = await axisAlias(ctx(block.url, {}, { axis: "governance" }) as never);
    expect(served.status).toBe(200);
    const bytes = await served.arrayBuffer();
    expect(sha(bytes)).toBe(block.sha256);
    expect(bytes.byteLength).toBe(block.bytes);
  });

  it("the alias serves the same bytes as the query form, including on a cold cache", async () => {
    const a = await (await onRequestGet(ctx("https://councilof.ai/api/gspc?axis=governance"))).arrayBuffer();
    store.clear();
    const b = await (await axisAlias(ctx("https://councilof.ai/api/gspc/axis/governance", {}, { axis: "governance" }) as never)).arrayBuffer();
    expect(sha(b)).toBe(sha(a));
  });

  it("copies public_count and measured_on verbatim from the cited bytes", async () => {
    const block = await (await onRequestGet(ctx("https://councilof.ai/api/gspc?axis=governance&format=cite"))).json();
    const board = await (await onRequestGet(ctx("https://councilof.ai/api/gspc?axis=governance"))).json();
    expect(block.public_count).toBe(board.totals.public_count);
    expect(block.measured_on).toBe(board.measured_on.date);
    expect(block.text).toContain(block.url);
    expect(block.text).toContain(block.sha256);
  });

  it("with no board key, says the signature is ABSENT rather than inventing one", async () => {
    const block = await (await onRequestGet(ctx("https://councilof.ai/api/gspc?axis=governance&format=cite"))).json();
    expect(block.site_attestation.state).toBe("ABSENT");
    expect(block.text).toMatch(/site_attestation: absent/);
  });

  it("with a board key, carries the signer and the signature the cited bytes hold", async () => {
    const env = { BOARD_SIGN_KEY_PKCS8_B64: await boardKey() };
    const block = await (await onRequestGet(ctx("https://councilof.ai/api/gspc?axis=governance&format=cite", env))).json();
    await settle();
    const served = await axisAlias(ctx(block.url, env, { axis: "governance" }) as never);
    const bytes = await served.arrayBuffer();
    expect(sha(bytes)).toBe(block.sha256);
    const board = JSON.parse(Buffer.from(bytes).toString("utf8"));
    expect(block.site_attestation.state).toBe("SIGNED");
    expect(block.site_attestation.signer).toBe("did:web:csoai.org#board-attestation-1");
    expect(block.site_attestation.sig).toBe(board.site_attestation.sig);
  });

  it("keeps the methodology DOI but labels it by the board's own status", async () => {
    const block = await (await onRequestGet(ctx("https://councilof.ai/api/gspc?format=cite"))).json();
    const board = await (await onRequestGet(ctx("https://councilof.ai/api/gspc"))).json();
    expect(block.url).toBe("https://councilof.ai/api/gspc");
    expect(block.methodology_doi.doi).toBe(board.doi);
    expect(block.methodology_doi.status).toBe(board.doi_status ?? "not stated by the board");
    if (board.doi_status === "UNAVAILABLE") expect(block.methodology_doi.note).toMatch(/does not currently resolve/);
  });

  it("an unknown axis is a 404 on the cite, the alias and the query form alike", async () => {
    const c = await onRequestGet(ctx("https://councilof.ai/api/gspc?axis=no-such-axis&format=cite"));
    const a = await axisAlias(ctx("https://councilof.ai/api/gspc/axis/no-such-axis", {}, { axis: "no-such-axis" }) as never);
    const q = await onRequestGet(ctx("https://councilof.ai/api/gspc?axis=no-such-axis"));
    expect([c.status, a.status, q.status]).toEqual([404, 404, 404]);
    expect((await c.json()).error).toBe("unknown axis");
  });

  it("the alias passes format=cite through", async () => {
    const r = await axisAlias(ctx("https://councilof.ai/api/gspc/axis/governance?format=cite", {}, { axis: "governance" }) as never);
    const block = await r.json();
    expect(block.url).toBe("https://councilof.ai/api/gspc/axis/governance");
  });
});
