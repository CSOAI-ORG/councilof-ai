import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { canonical, issueToken } from "../_authCrypto";
import { relayCompanyCase } from "./[[path]]";

const ROOT = "https://councilof.ai/api/meok-library/cases";
const ID = "case_" + "a".repeat(64);
const encoder = new TextEncoder();
let env: { ASSESS_SIGNING_KEY_PKCS8_B64: string; MEOK_LIBRARY_GATEWAY_ORIGIN: string };
let token: string;
const payload = { request: "Look up GSPC evidence", request_id: "request_001" };

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]) as CryptoKeyPair;
  env = {
    ASSESS_SIGNING_KEY_PKCS8_B64: Buffer.from(await crypto.subtle.exportKey("pkcs8", pair.privateKey)).toString("base64"),
    MEOK_LIBRARY_GATEWAY_ORIGIN: "https://api.meok.ai",
  };
  token = (await issueToken(env, { email: "owner@example.test", name: "Owner" }))!;
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

function request(options: { url?: string; method?: string; body?: BodyInit; headers?: Record<string, string>; signal?: AbortSignal } = {}): Request {
  const method = options.method || "POST";
  const init: RequestInit & { duplex?: "half" } = {
    method, headers: { authorization: "Bearer " + token, "content-type": "application/json", ...options.headers },
    ...(method === "POST" ? { body: options.body ?? JSON.stringify(payload), duplex: "half" as const } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  };
  return new Request(options.url || (method === "GET" ? ROOT + "/" + ID : ROOT), init);
}
function reply(raw = '{"schema":"meok.library-case/1","saved":false}', status = 202, headers: Record<string, string> = {}): Response {
  return new Response(raw, { status, headers: { "content-type": "application/json", ...headers } });
}
function transport(response: Response | Promise<Response> = reply()) {
  const mocked = vi.fn(() => Promise.resolve(response));
  vi.stubGlobal("fetch", mocked);
  return mocked;
}
async function signedClaims(extra: Record<string, unknown>): Promise<string> {
  const claims = {
    schema: "csoai.auth-token/0.1", iss: "https://councilof.ai", aud: "council-os",
    sub: "owner@example.test", name: "Owner", iat: Date.now(), exp: Date.now() + 60000, ...extra,
  };
  const privateKey = await crypto.subtle.importKey("pkcs8",
    Uint8Array.from(atob(env.ASSESS_SIGNING_KEY_PKCS8_B64), c => c.charCodeAt(0)),
    { name: "Ed25519" }, false, ["sign"]);
  const body = canonical(claims);
  const sig = Buffer.from(await crypto.subtle.sign("Ed25519", privateKey, encoder.encode(body))).toString("base64");
  return btoa(JSON.stringify({ payload: body, sig }));
}

describe("Company gateway transport boundary", () => {
  it.each([undefined, "", "http://api.meok.ai", "https://api.meok.ai/", "https://api.meok.ai:443",
    "https://api.meok.ai.evil.test", "https://user@api.meok.ai", "https://api.meok.ai?x=1", " https://api.meok.ai"])(
    "does not dispatch for uninstalled or invalid origin %s", async origin => {
      const fetcher = transport();
      const response = await relayCompanyCase(request(), { ...env, MEOK_LIBRARY_GATEWAY_ORIGIN: origin });
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: "private_library_connection_unavailable", saved: false });
      expect(fetcher).not.toHaveBeenCalled();
    });
  it.each(["", "Bearer nope", "Basic abc", "Bearer a b", "Bearer " + "a".repeat(8193)])(
    "rejects invalid authorization before dispatch %s", async authorization => {
      const fetcher = transport();
      expect((await relayCompanyCase(request({ headers: { authorization } }), env)).status).toBe(401);
      expect(fetcher).not.toHaveBeenCalled();
    });
  it("keeps a valid long session authenticated but unavailable for this receiver, without dispatch", async () => {
    const longToken = (await issueToken(env, { email: "owner@example.test", name: "O".repeat(1500) }))!;
    expect(longToken.length + 7).toBeGreaterThan(2000);
    expect(longToken.length + 7).toBeLessThanOrEqual(8192);
    const fetcher = transport();
    const response = await relayCompanyCase(request({ headers: { authorization: "Bearer " + longToken } }), env);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "private_library_connection_unavailable", saved: false });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([{ iss: "https://evil.test" }, { aud: "another-app" }, { schema: "other/1" }, { exp: 1 }])(
    "rejects cryptographically signed but invalid claims %j", async claims => {
      const fetcher = transport();
      const response = await relayCompanyCase(request({ headers: { authorization: "Bearer " + await signedClaims(claims) } }), env);
      expect(response.status).toBe(401);
      expect(fetcher).not.toHaveBeenCalled();
    });
  it.each([
    ROOT + "?x=1", ROOT + "?x=1&x=2", ROOT + "/", ROOT + "/https://evil.test",
    ROOT + "/" + ID + "/extra", ROOT + "/case_" + "a".repeat(63), ROOT + "/case_" + "a".repeat(65),
    ROOT + "/case_" + "g".repeat(64), ROOT + "/case_" + "A".repeat(64),
    ROOT + "/%2f" + ID, ROOT.replace("meok-library", "Meok-library"),
  ])("rejects noncanonical route %s", async url => {
    const fetcher = transport();
    expect((await relayCompanyCase(request({ url, method: "GET" }), env)).status).toBe(404);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(["PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])("does not dispatch %s", async method => {
    const fetcher = transport();
    expect((await relayCompanyCase(request({ method, url: ROOT }), env)).status).toBe(404);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects cross-origin browser requests", async () => {
    const fetcher = transport();
    expect((await relayCompanyCase(request({ headers: { origin: "https://evil.test" } }), env)).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("forwards original bytes once to the fixed receiver and strips caller authority", async () => {
    const fetcher = transport();
    const raw = ' { "request_id" : "request_001", "request" : "GSPC \\u00e9 evidence" }\r\n';
    const response = await relayCompanyCase(request({ body: raw, headers: {
      cookie: "private=secret", origin: "https://councilof.ai", "x-owner": "someone", "x-base-id": "other",
      "x-reviewer": "admin", "x-gateway-url": "https://evil.test", "x-forwarded-host": "evil.test",
    } }), env);
    expect(response.status).toBe(202);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.meok.ai/api/meok-library/cases");
    expect(init.redirect).toBe("manual");
    expect(init.cache).toBe("no-store");
    expect(init.credentials).toBe("omit");
    expect(init.body).toBeInstanceOf(Uint8Array);
    expect(Array.from(init.body as Uint8Array)).toEqual(Array.from(encoder.encode(raw)));
    expect(Object.fromEntries(new Headers(init.headers).entries())).toEqual({
      authorization: "Bearer " + token, accept: "application/json",
      "accept-encoding": "identity", "content-type": "application/json",
    });
  });
  it("forwards GET only to the exact case without a body", async () => {
    const fetcher = transport(reply('{"schema":"meok.library-case/1","saved":true}', 200));
    expect((await relayCompanyCase(request({ method: "GET" }), env)).status).toBe(200);
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.meok.ai/api/meok-library/cases/" + ID);
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
  });
  it.each([
    '{"request":"GSPC","request_id":"short"}', '{"request":"","request_id":"request_001"}',
    '{"request":"GSPC","request_id":"request_001","owner":"admin"}', '{"request":1,"request_id":"request_001"}',
    '{"request":"\\ud800","request_id":"request_001"}', '[]', 'not json',
    JSON.stringify({ request: "a".repeat(2001), request_id: "request_001" }),
  ])("rejects invalid request body %s", async body => {
    const fetcher = transport();
    expect((await relayCompanyCase(request({ body }), env)).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(["text/plain", "application/json; charset=iso-8859-1"])("rejects request media type %s", async type => {
    const fetcher = transport();
    expect((await relayCompanyCase(request({ headers: { "content-type": type } }), env)).status).toBe(415);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects invalid UTF-8 without dispatch", async () => {
    const fetcher = transport();
    expect((await relayCompanyCase(request({ body: new Uint8Array([0xff]) }), env)).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([8192, 8193])("bounds actual multibyte request bytes at %i despite a false length header", async size => {
    const core = JSON.stringify({ request: "GSPC " + "é".repeat(1000), request_id: "request_001" });
    const raw = core + " ".repeat(size - encoder.encode(core).length);
    const fetcher = transport();
    const response = await relayCompanyCase(request({ body: raw, headers: { "content-length": "1" } }), env);
    expect(response.status).toBe(size === 8192 ? 202 : 413);
    expect(fetcher).toHaveBeenCalledTimes(size === 8192 ? 1 : 0);
    if (size === 8192) expect((fetcher.mock.calls[0] as unknown as [string, RequestInit])[1].body).toEqual(encoder.encode(raw));
  });
  it.each([200, 202, 400, 401, 403, 404, 409, 413, 415, 429, 503])(
    "preserves exact response bytes and status %i without unsafe headers", async status => {
      const raw = status < 300
        ? ' { "schema":"meok.library-case/1", "saved":' + (status === 200) + ', "note":"é \\u263a" }\r\n'
        : ' { "error" : "private_unavailable", "saved":false, "outcome_unknown":true, "retry_post":false }\r\n';
      transport(reply(raw, status, { "set-cookie": "secret=x", location: "https://evil.test", "x-private": "secret" }));
      const response = await relayCompanyCase(request(), env);
      expect(response.status).toBe(status);
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(encoder.encode(raw));
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-private")).toBeNull();
      expect(response.headers.get("cache-control")).toBe("no-store");
    });
  it.each([524288, 524289])("bounds actual chunked response bytes at %i despite a false length header", async size => {
    // Build the exact requested size independently of JSON spelling.
    const base = encoder.encode('{"schema":"meok.library-case/1","saved":false}');
    const data = new Uint8Array(size).fill(32); data.set(base);
    const body = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(data.slice(0, 100)); c.enqueue(data.slice(100)); c.close(); } });
    const fetcher = transport(new Response(body, { status: 202, headers: { "content-type": "application/json", "content-length": "1" } }));
    const response = await relayCompanyCase(request(), env);
    expect(response.status).toBe(size === 524288 ? 202 : 503);
    if (size === 524288) expect(new Uint8Array(await response.arrayBuffer())).toEqual(data);
    else expect(await response.json()).toMatchObject({ saved: false, outcome_unknown: true, retry_post: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([301, 302, 307, 308, 500, 502, 504])("does not replay or follow upstream status %i", async status => {
    const fetcher = transport(reply("{}", status, { location: "https://evil.test" }));
    const response = await relayCompanyCase(request(), env);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ saved: false, outcome_unknown: true, retry_post: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([
    reply("not json"), reply("[]"), reply('{"schema":"meok.library-case/1","saved":true}', 202),
    reply('{"schema":"meok.library-case/1","saved":false}', 200),
    reply('{"error":"oops","saved":true}', 503),
    reply('{"error":"oops","saved":false,"outcome_unknown":true}', 503),
    reply("{}", 202, { "content-type": "text/html" }),
  ])("keeps malformed responses uncertain without retry", async upstream => {
    const fetcher = transport(upstream);
    const response = await relayCompanyCase(request(), env);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ saved: false, outcome_unknown: true, retry_post: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("rejects unexpectedly redirected responses even when fetch returns 200", async () => {
    const upstream = reply(); Object.defineProperty(upstream, "redirected", { value: true });
    const fetcher = transport(upstream);
    expect((await relayCompanyCase(request(), env)).status).toBe(503);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("returns GET transport failures without POST uncertainty or recovery writes", async () => {
    const fetcher = vi.fn(() => Promise.reject(new Error("must not be exposed")));
    vi.stubGlobal("fetch", fetcher);
    const response = await relayCompanyCase(request({ method: "GET" }), env);
    expect(await response.json()).toEqual({ error: "private_library_connection_unavailable", saved: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("one total deadline and no replay", () => {
  it("does not restart the deadline when request reading finishes", async () => {
    vi.useFakeTimers();
    let open: ReadableStreamDefaultController<Uint8Array> | undefined;
    const pull = vi.fn();
    const body = new ReadableStream<Uint8Array>({ start(c) { open = c; }, pull }, { highWaterMark: 0 });
    const fetcher = transport(new Promise<Response>(() => {}));
    const pending = relayCompanyCase(request({ body }), env);
    await vi.waitUntil(() => pull.mock.calls.length > 0);
    await vi.advanceTimersByTimeAsync(20000);
    open!.enqueue(encoder.encode(JSON.stringify(payload))); open!.close();
    await vi.waitUntil(() => fetcher.mock.calls.length === 1);
    await vi.advanceTimersByTimeAsync(5000);
    const response = await pending;
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ outcome_unknown: true, retry_post: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("settles a hung fetch and ignores late success", async () => {
    vi.useFakeTimers();
    let resolve: (response: Response) => void = () => {};
    const fetcher = transport(new Promise<Response>(r => { resolve = r; }));
    const pending = relayCompanyCase(request(), env);
    await vi.waitUntil(() => fetcher.mock.calls.length === 1);
    await vi.advanceTimersByTimeAsync(25000);
    const response = await pending;
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ saved: false, outcome_unknown: true, retry_post: false });
    resolve(reply('{"schema":"meok.library-case/1","saved":true}', 200));
    await vi.advanceTimersByTimeAsync(1);
    expect(response.status).toBe(503);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("includes a stalled request read and uncooperative cancellation in the total deadline", async () => {
    vi.useFakeTimers();
    const pull = vi.fn();
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const body = new ReadableStream<Uint8Array>({ pull, cancel }, { highWaterMark: 0 });
    const fetcher = transport();
    const pending = relayCompanyCase(request({ body }), env);
    await vi.waitUntil(() => pull.mock.calls.length > 0);
    await vi.advanceTimersByTimeAsync(25000);
    const response = await pending;
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "private_library_connection_unavailable", saved: false });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("includes stalled response reads and uncooperative cancellation in the same total deadline", async () => {
    vi.useFakeTimers();
    const pull = vi.fn();
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const body = new ReadableStream<Uint8Array>({ pull, cancel }, { highWaterMark: 0 });
    const fetcher = transport(new Response(body, { status: 202, headers: { "content-type": "application/json" } }));
    const pending = relayCompanyCase(request(), env);
    await vi.waitUntil(() => pull.mock.calls.length > 0);
    await vi.advanceTimersByTimeAsync(25000);
    const response = await pending;
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ saved: false, outcome_unknown: true, retry_post: false });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("settles caller abort without waiting for a fetch that ignores its signal", async () => {
    vi.useFakeTimers();
    const caller = new AbortController();
    const fetcher = transport(new Promise<Response>(() => {}));
    const pending = relayCompanyCase(request({ signal: caller.signal }), env);
    await vi.waitUntil(() => fetcher.mock.calls.length === 1);
    caller.abort();
    const response = await pending;
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ outcome_unknown: true, retry_post: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("does not dispatch an already-aborted request", async () => {
    const caller = new AbortController(); caller.abort();
    const fetcher = transport();
    expect((await relayCompanyCase(request({ signal: caller.signal }), env)).status).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
// Node fetch mocks establish transport invariants, not production wire acceptance.
// Receiver qualification must exercise the real edge/Tunnel before its origin is installed.
