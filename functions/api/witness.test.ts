import { afterEach, describe, expect, it, vi } from "vitest";
import { CSOAI_LID } from "./_x402";
import { onRequestGet as witnessGet, onRequestPost as witnessPost } from "./witness";
import { onRequestGet as status } from "./witness/status";
import { ATTESTS, VERDICT_RE, derTimeStampReq, guardTarget, kvKey, parseTimeStampResp, robotsAllows, tlv } from "./_witness";
import { ESTATE_PAY_TO } from "./_x402_config";
import { sha256Hex } from "../_lib/cardSign";

const ORIGIN = "https://councilof.ai";
const SHA = "a".repeat(64);
const CARD = "c".repeat(64);
const MERKLE = "m".repeat(64);
const ctx = (path: string, env: Record<string, unknown> = {}, headers: Record<string, string> = {}, init: RequestInit = {}) =>
  ({ request: new Request(ORIGIN + path, { headers, ...init }), env, params: {} }) as never;
const receipt = btoa(JSON.stringify({ x402Version: 1, scheme: "exact", network: "base", payload: {} }));

type Entry = Record<string, unknown>;
function fakeKv(seed: Record<string, Entry> = {}) {
  const store = new Map<string, string>(Object.entries(seed).map(([k, v]) => [k, JSON.stringify(v)]));
  const puts: string[] = [];
  return {
    store,
    puts,
    get: async (k: string, type?: string) => {
      const v = store.get(k);
      if (v == null) return null;
      return type === "json" ? JSON.parse(v) : v;
    },
    put: async (k: string, v: string) => {
      store.set(k, v);
      puts.push(k);
    },
  };
}

/** A minimal TimeStampResp the parser accepts: status INTEGER + a token carrying digest and nonce. */
function tsaReply(req: Uint8Array, statusCode = 0): Uint8Array {
  // find the OCTET STRING(32) messageImprint in the request, then the INTEGER nonce after it
  let i = 0;
  while (!(req[i] === 0x04 && req[i + 1] === 0x20)) i++;
  const digest = req.slice(i + 2, i + 34);
  const nonceLen = req[i + 35];
  const nonce = req.slice(i + 36, i + 36 + nonceLen);
  const statusInfo = tlv(0x30, tlv(0x02, Uint8Array.from([statusCode])));
  const token = tlv(0x30, Uint8Array.from([...tlv(0x04, digest), ...tlv(0x02, nonce)]));
  return tlv(0x30, Uint8Array.from([...statusInfo, ...token]));
}

type Stub = {
  robots?: string | number; // text, or an HTTP status
  target?: { status?: number; body?: string; headers?: Record<string, string>; redirected?: boolean; url?: string; bodyHead?: string };
  tsa?: "ok" | number | "down";
  root?: Record<string, unknown>;
  sidecar?: Record<string, unknown>;
};
const calls: string[] = [];
function stub(o: Stub = {}) {
  calls.length = 0;
  vi.stubGlobal("fetch", async (u: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    calls.push(url.host + url.pathname);
    if (url.host === "f.example") return new Response(JSON.stringify(url.pathname.endsWith("/verify") ? { isValid: true } : { success: true, transaction: "0xtx", network: "base", payer: "0xp" }));
    if (url.host === "freetsa.org") {
      if (o.tsa === "down") throw new TypeError("fetch failed");
      if (typeof o.tsa === "number") return new Response("nope", { status: o.tsa });
      return new Response(tsaReply(new Uint8Array(init!.body as ArrayBuffer)), { status: 200, headers: { "content-type": "application/timestamp-reply" } });
    }
    if (url.host === "example.org" && url.pathname === "/robots.txt") {
      if (typeof o.robots === "number") return new Response("", { status: o.robots });
      return new Response(o.robots ?? "User-agent: *\nDisallow: /private/\n", { status: 200 });
    }
    if (url.host === "example.org") {
      const t = o.target || {};
      const body = new TextEncoder().encode(t.body ?? "public bytes");
      const headers = new Headers({ "content-type": "text/plain", "content-length": String(body.byteLength), etag: '"e1"', ...(t.headers || {}) });
      // a plain object so `redirected` / `url` (read-only on Response) can be shaped
      return { status: t.status ?? 200, headers, redirected: !!t.redirected, url: t.url || url.toString(), arrayBuffer: async () => body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) } as unknown as Response;
    }
    if (url.host === "councilof.ai" && url.pathname === "/root.json") return new Response(JSON.stringify(o.root ?? { as_of: "2026-09-02T08:07:00Z", merkle_root: MERKLE, card_sha256: [CARD] }));
    if (url.host === "councilof.ai" && url.pathname === "/interop/root-witness-latest.json") return new Response(JSON.stringify(o.sidecar ?? { artifact: { merkle_root: MERKLE }, witnesses: { rekor: { status: "WITNESSED", logIndex: 2684053226, url: "https://rekor.sigstore.dev/api/v1/log/entries?logIndex=2684053226" }, ots: { status: "STAMPED_PENDING_BITCOIN", url: "https://councilof.ai/interop/root-x.json.ots" } } }));
    return new Response("nope", { status: 404 });
  });
}
afterEach(() => vi.unstubAllGlobals());

describe("_witness helpers", () => {
  it("robots.txt: our group wins over *, longest rule wins, Allow beats Disallow on a tie, no group = allowed", () => {
    const txt = "User-agent: *\nDisallow: /\n\nUser-agent: csoai-witness\nDisallow: /private/\nAllow: /private/open\n";
    expect(robotsAllows(txt, "csoai-witness", "/public/a.json")).toMatchObject({ group: "agent", allowed: true });
    expect(robotsAllows(txt, "csoai-witness", "/private/x")).toMatchObject({ group: "agent", allowed: false, rule: "Disallow: /private/" });
    expect(robotsAllows(txt, "csoai-witness", "/private/open/y")).toMatchObject({ allowed: true, rule: "Allow: /private/open" });
    expect(robotsAllows("User-agent: *\nDisallow: /\n", "csoai-witness", "/anything")).toMatchObject({ group: "*", allowed: false });
    expect(robotsAllows("User-agent: googlebot\nDisallow: /\n", "csoai-witness", "/x")).toMatchObject({ group: "none", allowed: true });
    expect(robotsAllows("User-agent: *\nDisallow: /*.pdf$\n", "csoai-witness", "/a/b.pdf").allowed).toBe(false);
    expect(robotsAllows("User-agent: *\nDisallow:\n", "csoai-witness", "/a").allowed).toBe(true);
  });

  it("target guard: https public hostnames only — never http, an IP, a private name, credentials or an odd port", () => {
    expect(guardTarget("https://example.org/a?b=1#frag")).toMatchObject({ ok: true });
    for (const bad of ["http://example.org/", "https://10.0.0.1/", "https://[::1]/", "https://localhost/", "https://box.internal/", "https://u:p@example.org/", "https://example.org:8443/", "not a url", "https://intranet/"]) {
      expect(guardTarget(bad).ok, bad).toBe(false);
    }
  });

  it("RFC-3161: the request is DER with the SHA-256 OID and the digest; the parser accepts granted and refuses the rest", () => {
    const digest = Uint8Array.from({ length: 32 }, (_, i) => i);
    const nonce = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]);
    const req = derTimeStampReq(digest, nonce);
    expect(req[0]).toBe(0x30);
    const hex = [...req].map((b) => b.toString(16).padStart(2, "0")).join("");
    expect(hex).toContain("0609608648016503040201"); // id-sha256
    expect(hex).toContain("0420" + [...digest].map((b) => b.toString(16).padStart(2, "0")).join(""));
    expect(hex.endsWith("0101ff")).toBe(true); // certReq TRUE
    expect(parseTimeStampResp(tsaReply(req), digest, nonce)).toMatchObject({ ok: true, status: 0 });
    expect(parseTimeStampResp(tsaReply(req, 2), digest, nonce)).toMatchObject({ ok: false, status: 2 });
    expect(parseTimeStampResp(tsaReply(req), Uint8Array.from({ length: 32 }, () => 9), nonce).reason).toMatch(/messageImprint/);
    expect(parseTimeStampResp(new TextEncoder().encode("<html>"), digest, nonce).ok).toBe(false);
  });

  it("the attests line passes the verdict gate", () => {
    expect(VERDICT_RE.test(ATTESTS)).toBe(false);
  });
});

describe("/api/witness — doors", () => {
  it("400: bad sha, a verdict word in the label, nothing to hash, a non-https url", async () => {
    stub();
    expect((await witnessGet(ctx("/api/witness?sha256=zz"))).status).toBe(400);
    expect((await witnessGet(ctx(`/api/witness?sha256=${SHA}&label=certified+clean`))).status).toBe(400);
    expect((await witnessGet(ctx("/api/witness"))).status).toBe(400);
    expect((await witnessGet(ctx("/api/witness?url=http://example.org/x"))).status).toBe(400);
  });

  it("402: complete challenge, PAYMENT-REQUIRED header, free preview says exactly what will happen, no legal-presumption claim, no amount in prose", async () => {
    stub();
    const r = await witnessGet(ctx(`/api/witness?sha256=${SHA}&label=my+release`));
    expect(r.status).toBe(402);
    expect(r.headers.get("PAYMENT-REQUIRED")).toBeTruthy();
    const b = await r.json();
    expect(b.accepts[0]).toMatchObject({ scheme: "exact", network: "eip155:8453", payTo: ESTATE_PAY_TO, extra: { name: "USD Coin", version: "2" } });
    expect(b.csoai.preview).toMatchObject({ sha256: SHA, label: "my release", target: null });
    expect(b.csoai.preview.what_happens).toHaveLength(5);
    expect(b.csoai.preview.presumption).toMatch(/no legal presumption/);
    expect(b.csoai.preview.leaf.attests).toBe(ATTESTS);
    expect(b.csoai.rail.mode).toBe("challenge-only");
    expect(b.csoai.never).toContain("a certificate");
    const prose = JSON.stringify({ ...b, accepts: undefined });
    expect(prose).not.toMatch(/[£$€]\s?\d/);
    // The board lid is a fixed, reviewed sentence carried verbatim in every 402
    // challenge (owner ruling, #1159). It contains "22 axes measured" — a board count,
    // not a verdict on this digest — and ends "not a certificate". Scan the whole body
    // with ONLY that constant excised, so any other verdict word still fails.
    const proseNoLid = prose.split(JSON.stringify(CSOAI_LID).slice(1, -1)).join("");
    expect(VERDICT_RE.test(proseNoLid)).toBe(false);
  });

  it("POST: the body is hashed server-side and never echoed", async () => {
    stub();
    const body = "hello world — these bytes are mine";
    const r = await witnessPost(ctx("/api/witness?label=doc", {}, { "content-type": "text/plain" }, { method: "POST", body }));
    expect(r.status).toBe(402);
    const text = await r.text();
    expect(JSON.parse(text).csoai.preview.sha256).toBe(await sha256Hex(new TextEncoder().encode(body)));
    expect(text).not.toContain("these bytes are mine");
    expect((await witnessPost(ctx("/api/witness", {}, {}, { method: "POST", body: "" }))).status).toBe(400);
    expect((await witnessPost(ctx("/api/witness", {}, { "content-length": String(5 * 1024 * 1024) }, { method: "POST", body: "x" }))).status).toBe(413);
  });
});

describe("/api/witness — url= is fetched once, honestly", () => {
  it("robots.txt Disallow for our agent → UNCHECKABLE, the resource is never requested, nothing charged", async () => {
    stub({ robots: "User-agent: csoai-witness\nDisallow: /\n" });
    const r = await witnessGet(ctx("/api/witness?url=https://example.org/report.pdf", { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": receipt }));
    expect(r.status).toBe(422);
    const b = await r.json();
    expect(b.status).toBe("UNCHECKABLE");
    expect(b.reason).toMatch(/robots\.txt Disallow: \//);
    expect(calls).toContain("example.org/robots.txt");
    expect(calls).not.toContain("example.org/report.pdf");
    expect(calls.some((c) => c.startsWith("f.example"))).toBe(false);
  });

  it("401 / bot-check page / redirect into sign-in → UNCHECKABLE (never bypassed)", async () => {
    stub({ target: { status: 401, headers: { "www-authenticate": "Basic" } } });
    expect((await (await witnessGet(ctx("/api/witness?url=https://example.org/x"))).json()).reason).toMatch(/access wall/);
    stub({ target: { status: 503, body: "<html>Just a moment... cf-chl</html>" } });
    expect((await (await witnessGet(ctx("/api/witness?url=https://example.org/x"))).json()).reason).toMatch(/bot-check/);
    stub({ target: { status: 200, redirected: true, url: "https://example.org/login?next=/x" } });
    expect((await (await witnessGet(ctx("/api/witness?url=https://example.org/x"))).json()).reason).toMatch(/sign-in wall/);
    stub({ target: { status: 404 } });
    expect((await (await witnessGet(ctx("/api/witness?url=https://example.org/x"))).json()).reason).toMatch(/HTTP 404/);
  });

  it("200 → the digest of the bytes we were shown, a header subset, robots evidence; the bytes are not returned", async () => {
    stub({ robots: 404, target: { body: "the public report" } });
    const r = await witnessGet(ctx(`/api/witness?url=https://example.org/report.txt&sha256=${SHA}`));
    expect(r.status).toBe(402);
    const text = await r.text();
    const p = JSON.parse(text).csoai.preview;
    expect(p.sha256).toBe(await sha256Hex(new TextEncoder().encode("the public report")));
    expect(p.supplied_sha256_matches).toBe(false);
    expect(p.target).toMatchObject({ http_status: 200, bytes: 17, redirected: false, robots: { http_status: 404, group: "none", allowed: true } });
    expect(p.target.headers).toMatchObject({ "content-type": "text/plain", etag: '"e1"' });
    expect(p.target.url_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(text).not.toContain("the public report");
    expect(text).not.toContain("https://example.org/report.txt");
  });
});

describe("/api/witness — rail: fail-closed queue, dedupe, paid path", () => {
  it("503 NOT_YET with a receipt and no WITNESS_KV — the facilitator is never called", async () => {
    stub();
    const r = await witnessGet(ctx(`/api/witness?sha256=${SHA}`, { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": receipt }));
    expect(r.status).toBe(503);
    expect(await r.json()).toMatchObject({ status: "NOT_YET", reason: "WITNESS_KV not bound" });
    expect(calls.some((c) => c.startsWith("f.example"))).toBe(false);
  });

  it("dedupe: a digest already queued returns its state, no 402, no settlement", async () => {
    stub();
    const kv = fakeKv({ [kvKey(SHA)]: { schema: "csoai.witness-entry/0.1", sha256: SHA, label: "x", url: "https://secret.example/private", url_hash: "u".repeat(64), status: "queued", queued_at: "t", rfc3161_tsa: "https://freetsa.org/tsr", rfc3161_status: "TIMESTAMPED", rfc3161_token: "AA==", rfc3161_token_sha256: "t".repeat(64), payment_ref: "0xold" } });
    const r = await witnessGet(ctx(`/api/witness?sha256=${SHA}`, { WITNESS_KV: kv, X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": receipt }));
    expect(r.status).toBe(200);
    const text = await r.text();
    expect(JSON.parse(text)).toMatchObject({ status: "queued", already: true, payment_ref: "0xold" });
    expect(text).not.toContain("secret.example"); // the URL never leaves the queue
    expect(calls.some((c) => c.startsWith("f.example"))).toBe(false);
    expect(kv.puts).toEqual([]);
  });

  it("paid: settle → RFC-3161 reply over the digest → queued in KV with the settle ref; X-PAYMENT-RESPONSE echoed", async () => {
    stub({ tsa: "ok" });
    const kv = fakeKv();
    const r = await witnessGet(ctx(`/api/witness?sha256=${SHA}&label=release+1.2`, { WITNESS_KV: kv, X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": receipt }));
    expect(r.status).toBe(200);
    expect(r.headers.get("x-payment-response")).toBeTruthy();
    const b = await r.json();
    expect(b).toMatchObject({ status: "queued", sha256: SHA, label: "release 1.2", payment_ref: "0xtx", rfc3161: { tsa: "https://freetsa.org/tsr", status: "TIMESTAMPED" } });
    expect(b.rfc3161.token_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(b.status_url).toBe(`${ORIGIN}/api/witness/status?sha256=${SHA}`);
    expect(kv.puts).toEqual([kvKey(SHA)]);
    const stored = JSON.parse(kv.store.get(kvKey(SHA))!);
    expect(stored).toMatchObject({ schema: "csoai.witness-entry/0.1", status: "queued", url: null, payer: "0xp", network: "base" });
    // the stored reply is the DER the TSA returned, base64 — a stranger can `openssl ts -reply` it
    const reply = Uint8Array.from(atob(stored.rfc3161_token), (c) => c.charCodeAt(0));
    expect(reply[0]).toBe(0x30);
    expect(await sha256Hex(reply)).toBe(stored.rfc3161_token_sha256);
    expect(calls).toContain("freetsa.org/tsr");
  });

  it("paid, TSA down or refusing: still queued, rfc3161 UNCHECKABLE with the reason", async () => {
    stub({ tsa: 500 });
    let kv = fakeKv();
    let b = await (await witnessGet(ctx(`/api/witness?sha256=${SHA}`, { WITNESS_KV: kv, X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": receipt }))).json();
    expect(b).toMatchObject({ status: "queued", rfc3161: { status: "UNCHECKABLE", reason: "TSA HTTP 500", token_b64: null } });
    stub({ tsa: "down" });
    kv = fakeKv();
    b = await (await witnessGet(ctx(`/api/witness?sha256=${SHA}`, { WITNESS_KV: kv, X402_FACILITATOR_URL: "https://f.example", RFC3161_TSA_URL: "https://freetsa.org/tsr" }, { "x-payment": receipt }))).json();
    expect(b.rfc3161).toMatchObject({ status: "UNCHECKABLE", reason: expect.stringMatching(/unreachable/) });
    expect(kv.puts).toHaveLength(1);
  });

  it("paid with url=: the queue keeps the URL for the buyer's record; the public view carries only url_hash", async () => {
    stub({ tsa: "ok", target: { body: "bytes" } });
    const kv = fakeKv();
    const r = await witnessGet(ctx("/api/witness?url=https://example.org/data.csv", { WITNESS_KV: kv, X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": receipt }));
    const text = await r.text();
    expect(r.status, text).toBe(200);
    const b = JSON.parse(text);
    expect(b.sha256).toBe(await sha256Hex(new TextEncoder().encode("bytes")));
    expect(b.http_status).toBe(200);
    expect(b.url_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(text).not.toContain("example.org/data.csv");
    expect(JSON.parse(kv.store.get(kvKey(b.sha256))!).url).toBe("https://example.org/data.csv");
  });
});

describe("/api/witness/status — free", () => {
  const witnessedEntry = { schema: "csoai.witness-entry/0.1", sha256: SHA, label: "x", url: "https://example.org/x", url_hash: "u".repeat(64), fetched_at: "2026-09-02T08:00:00Z", http_status: 200, headers: null, payment_ref: "0xtx", rfc3161_tsa: "https://freetsa.org/tsr", rfc3161_status: "TIMESTAMPED", rfc3161_token: "AA==", rfc3161_token_sha256: "t".repeat(64), status: "witnessed", queued_at: "2026-09-02T08:00:01Z", witnessed: { root_as_of: "2026-09-02T08:07:00Z", merkle_root: MERKLE, card_sha256: CARD, card_url: "/cards/cccccccccccccccc.json", proof_url: `/api/proof?sha=${CARD}` } };

  it("503 without KV, 400 on a bad sha, 404 unknown with the way to queue", async () => {
    stub();
    expect((await status(ctx(`/api/witness/status?sha256=${SHA}`))).status).toBe(503);
    expect((await status(ctx("/api/witness/status?sha256=nope", { WITNESS_KV: fakeKv() }))).status).toBe(400);
    const r = await status(ctx(`/api/witness/status?sha256=${SHA}`, { WITNESS_KV: fakeKv() }));
    expect(r.status).toBe(404);
    expect(await r.json()).toMatchObject({ status: "unknown", queue: `${ORIGIN}/api/witness?sha256=${SHA}` });
  });

  it("queued → the timestamp and the next-root note; witnessed → root, card, proof, anchors from the sidecar, live inclusion check", async () => {
    stub();
    const kvQ = fakeKv({ [kvKey(SHA)]: { ...witnessedEntry, status: "queued", witnessed: null } });
    let b = await (await status(ctx(`/api/witness/status?sha256=${SHA}`, { WITNESS_KV: kvQ }))).json();
    expect(b).toMatchObject({ status: "queued", rfc3161: { status: "TIMESTAMPED", token_b64: "AA==" } });
    expect(b.next_root).toMatch(/hourly/);
    expect(JSON.stringify(b)).not.toContain("example.org/x");

    const kvW = fakeKv({ [kvKey(SHA)]: witnessedEntry });
    const r = await status(ctx(`/api/witness/status?sha256=${SHA}`, { WITNESS_KV: kvW }));
    expect(r.status).toBe(200);
    b = await r.json();
    expect(b.root).toMatchObject({ first_merkle_root: MERKLE, live_merkle_root: MERKLE, card_in_live_root: true });
    expect(b.card).toMatchObject({ sha256: CARD, url: `${ORIGIN}/cards/cccccccccccccccc.json`, inclusion_free: `${ORIGIN}/api/proof?sha=${CARD}` });
    expect(b.anchors.rekor).toMatchObject({ logIndex: 2684053226 });
    expect(b.anchors.ots.status).toBe("STAMPED_PENDING_BITCOIN");
    expect(b.presumption).toMatch(/no legal presumption/);
    expect(VERDICT_RE.test(JSON.stringify(b))).toBe(false);
  });

  it("witnessed but the sidecar is for another root and nothing was recorded → anchors PENDING, never invented", async () => {
    stub({ sidecar: { artifact: { merkle_root: "z".repeat(64) }, witnesses: { rekor: { logIndex: 1 } } }, root: { as_of: "t", merkle_root: "n".repeat(64), card_sha256: [] } });
    const b = await (await status(ctx(`/api/witness/status?sha256=${SHA}`, { WITNESS_KV: fakeKv({ [kvKey(SHA)]: witnessedEntry }) }))).json();
    expect(b.anchors).toMatchObject({ status: "PENDING" });
    expect(b.root.card_in_live_root).toBe(false);
    const rec = { ...witnessedEntry, witnessed: { ...witnessedEntry.witnessed, anchors: { rekor: { logIndex: 42 } } } };
    const b2 = await (await status(ctx(`/api/witness/status?sha256=${SHA}`, { WITNESS_KV: fakeKv({ [kvKey(SHA)]: rec }) }))).json();
    expect(b2.anchors).toMatchObject({ source: "recorded at first inclusion", rekor: { logIndex: 42 } });
  });
});
