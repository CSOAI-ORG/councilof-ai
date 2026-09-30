/**
 * /api/xl — the free, verbatim proxy of the signed cross-ledger daily record.
 *
 * Real bytes, not invented shapes: the record and its signed wrapper are the REAL 2026-09-26 v2 files
 * from csoai/cross-ledger-supply (saved under functions/_lib/reach/__fixtures__/, their Ed25519
 * signature verifies under the pinned board key), served through a mocked fetch.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { onRequestGet, onRequestHead } from "./xl";

const FX = join(dirname(fileURLToPath(import.meta.url)), "../_lib/reach/__fixtures__");
const REC = new Uint8Array(readFileSync(join(FX, "xl-daily-2026-09-26.json")));
const SIG = new Uint8Array(readFileSync(join(FX, "xl-daily-2026-09-26.signed.json")));
const sha = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
const HF = "https://huggingface.co";
const DS = `${HF}/datasets/csoai/cross-ledger-supply/resolve/main`;
const TREE = `${HF}/api/datasets/csoai/cross-ledger-supply/tree/main`;
const REC_URL = `${DS}/xl-daily/2026-09-26/v2/xl-daily-2026-09-26.json`;
const SIG_URL = `${DS}/xl-daily/2026-09-26/v2/xl-daily-2026-09-26.signed.json`;

type Route = () => Response;
let routes: Map<string, Route>;
const ok = (b: Uint8Array | string) => () => new Response(b as BodyInit, { status: 200 });
const tree = (items: { type: string; path: string }[]) => () => new Response(JSON.stringify(items), { status: 200 });

beforeEach(() => {
  routes = new Map<string, Route>([
    [`${TREE}/xl-daily`, tree([{ type: "directory", path: "xl-daily/2026-09-25" }, { type: "directory", path: "xl-daily/2026-09-26" }, { type: "file", path: "xl-daily/README.md" }])],
    // the newest day carries a re-derivation: v2 wins over the bare day and over v1
    [`${TREE}/xl-daily/2026-09-26`, tree([{ type: "directory", path: "xl-daily/2026-09-26/assets" }, { type: "directory", path: "xl-daily/2026-09-26/v1" }, { type: "directory", path: "xl-daily/2026-09-26/v2" }, { type: "file", path: "xl-daily/2026-09-26/xl-daily-2026-09-26.json" }])],
    [REC_URL, ok(REC)],
    [SIG_URL, ok(SIG)],
  ]);
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const h = routes.get(url);
    return h ? h() : new Response("not found", { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

const ctx = (qs = "", headers: Record<string, string> = {}, method = "GET") => ({
  request: new Request(`https://councilof.ai/api/xl${qs}`, { method, headers }),
  env: {},
  waitUntil: () => undefined,
});
const bytes = async (r: Response) => new Uint8Array(await r.arrayBuffer());

describe("/api/xl serves the signed record verbatim", () => {
  it("200 with the published bytes unchanged, pinned by the signed wrapper", async () => {
    const r = await onRequestGet(ctx());
    expect(r.status).toBe(200);
    const body = await bytes(r);
    expect(Buffer.from(body).equals(Buffer.from(REC))).toBe(true);
    const wrapper = JSON.parse(Buffer.from(SIG).toString("utf8"));
    expect(r.headers.get("x-csoai-record-sha256")).toBe(sha(REC));
    expect(wrapper.payload.artifact.sha256).toBe(sha(body));
    expect(r.headers.get("etag")).toBe(`"sha256-${sha(REC)}"`);
    expect(r.headers.get("x-csoai-signature")).toBe("VERIFIES");
    expect(r.headers.get("x-csoai-signer")).toBe("did:web:csoai.org#board-attestation-1");
    expect(r.headers.get("x-csoai-record-date")).toBe("2026-09-26");
    expect(r.headers.get("x-csoai-record-version")).toBe("v2");
    expect(r.headers.get("x-csoai-source")).toBe(REC_URL);
    expect(r.headers.get("x-csoai-signed-wrapper")).toBe(SIG_URL);
    expect(r.headers.get("content-type")).toMatch(/^application\/json/);
    expect(r.headers.get("access-control-allow-origin")).toBe("*");
    expect(r.headers.get("last-modified")).toBe(new Date(JSON.parse(Buffer.from(REC).toString("utf8")).as_of).toUTCString());
    expect(r.headers.get("link")).toContain('rel="corrections"');
  });

  it("?part=signed serves the signed wrapper verbatim", async () => {
    const r = await onRequestGet(ctx("?part=signed"));
    expect(r.status).toBe(200);
    expect(Buffer.from(await bytes(r)).equals(Buffer.from(SIG))).toBe(true);
    expect(r.headers.get("etag")).toBe(`"sha256-${sha(SIG)}"`);
    expect(r.headers.get("x-csoai-record-sha256")).toBe(sha(REC));
    expect(r.headers.get("x-csoai-part")).toBe("signed");
  });

  it("?date= serves that day; a day with no vN directory is v1 at the day root", async () => {
    routes.set(`${TREE}/xl-daily/2026-09-25`, tree([{ type: "file", path: "xl-daily/2026-09-25/xl-daily-2026-09-25.json" }]));
    // The 26 Sep bytes stand in at the 25 Sep path: the signature check is on the bytes, not the URL.
    routes.set(`${DS}/xl-daily/2026-09-25/xl-daily-2026-09-25.json`, ok(REC));
    routes.set(`${DS}/xl-daily/2026-09-25/xl-daily-2026-09-25.signed.json`, ok(SIG));
    const r = await onRequestGet(ctx("?date=2026-09-25"));
    expect(r.status).toBe(200);
    expect(r.headers.get("x-csoai-record-version")).toBe("v1");
    expect(r.headers.get("x-csoai-source")).toBe(`${DS}/xl-daily/2026-09-25/xl-daily-2026-09-25.json`);
  });

  it("free: no payment challenge, whatever the request carries", async () => {
    for (const h of [{}, { "x-payment": "anything" }, { "payment-signature": "anything" }]) {
      const r = await onRequestGet(ctx("", h));
      expect(r.status).toBe(200);
      expect(r.headers.get("payment-required")).toBeNull();
      expect(r.headers.get("x-csoai-access")).toBe("free");
    }
  });

  it("If-None-Match with the sha256 ETag -> 304 with no body", async () => {
    const r = await onRequestGet(ctx("", { "if-none-match": `"sha256-${sha(REC)}"` }));
    expect(r.status).toBe(304);
    expect((await bytes(r)).length).toBe(0);
  });

  it("HEAD answers GET's status and headers with no body", async () => {
    const r = await onRequestHead(ctx("", {}, "HEAD"));
    expect(r.status).toBe(200);
    expect(r.headers.get("x-csoai-record-sha256")).toBe(sha(REC));
    expect((await bytes(r)).length).toBe(0);
  });
});

describe("/api/xl never serves bytes nobody signed (must-fail controls)", () => {
  it("one digit changed in the record -> 503, and the altered value is not served", async () => {
    const text = Buffer.from(REC).toString("utf8");
    expect(text).toContain("88304342264");
    routes.set(REC_URL, ok(text.replace("88304342264", "88304342265")));
    const r = await onRequestGet(ctx());
    expect(r.status).toBe(503);
    expect(r.headers.get("retry-after")).toBeTruthy();
    expect(await r.text()).not.toContain("88304342265");
  });

  it("a trailing byte appended to the record -> 503 (the raw bytes are pinned, not just the parsed JSON)", async () => {
    routes.set(REC_URL, ok(new Uint8Array([...REC, 0x0a])));
    expect((await onRequestGet(ctx())).status).toBe(503);
  });

  it("one bit flipped in the signature -> 503, for the record and for ?part=signed", async () => {
    const w = JSON.parse(Buffer.from(SIG).toString("utf8"));
    const s: string = w.signature.sig_ed25519;
    w.signature.sig_ed25519 = (s[0] === "0" ? "1" : "0") + s.slice(1);
    routes.set(SIG_URL, ok(JSON.stringify(w)));
    expect((await onRequestGet(ctx())).status).toBe(503);
    expect((await onRequestGet(ctx("?part=signed"))).status).toBe(503);
  });

  it("the source is down -> 503 with Retry-After, never an empty 200", async () => {
    routes.set(REC_URL, () => new Response("bad gateway", { status: 502 }));
    const r = await onRequestGet(ctx());
    expect(r.status).toBe(503);
    expect(r.headers.get("retry-after")).toBeTruthy();
    expect(JSON.parse(await r.text()).state).toBe("SOURCE_UNAVAILABLE");
  });

  it("the network throws -> 503", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("connect ECONNRESET"); }));
    expect((await onRequestGet(ctx())).status).toBe(503);
  });
});

describe("/api/xl request shapes", () => {
  it("a date with no published record -> 404 (absence is not a finding)", async () => {
    const r = await onRequestGet(ctx("?date=2026-01-01"));
    expect(r.status).toBe(404);
    expect(JSON.parse(await r.text()).state).toBe("NOT_IN_PUBLISHED_RECORDS");
  });

  it("malformed date or part -> 400, and nothing is fetched", async () => {
    expect((await onRequestGet(ctx("?date=28-09-2026"))).status).toBe(400);
    expect((await onRequestGet(ctx("?part=proofs"))).status).toBe(400);
    expect((globalThis.fetch as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBe(0);
  });

  it("a non-GET method -> 405 with Allow", async () => {
    const r = await onRequestGet(ctx("", {}, "POST"));
    expect(r.status).toBe(405);
    expect(r.headers.get("allow")).toBe("GET, HEAD");
  });
});
