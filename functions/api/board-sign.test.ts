// /api/board-sign, both caller routes, against throwaway keys and no network.
//
// Pod-token route (narrowed 13 Oct 2026): the fixtures under __fixtures__/board-sign-static/ are
// the public records that route signed on 11 and 13 Oct 2026, byte for byte. Each test first
// proves the fixture is real (its published signature verifies under the board's public key) and
// only then asks the narrowed route to sign the same payload. A rule that refused any of them
// would stop the next daily x402 release or the next weekly census.
//
// OIDC route: a throwaway RSA key signs RS256 tokens and fetch is stubbed for the one JWKS URL.
// These are the first cases in the repo where an OIDC token is accepted. They pin today's
// acceptance rule (unchanged by this step) and show the strict rule is observed, not enforced.
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { onRequestPost, staticRouteVerdict, strictVerdict } from "./board-sign";
import { canonicalBytes, verifyLeaf } from "../_lib/cardSign";

const b64 = (u: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(u)));
const hexToBytes = (h: string) => Uint8Array.from(h.match(/.{2}/g)!.map((x) => parseInt(x, 16)));
const toHex = (u: ArrayBuffer) => [...new Uint8Array(u)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256Hex = async (bytes: Uint8Array) => toHex(await crypto.subtle.digest("SHA-256", bytes));

// The board's public key. Same pin as scripts/rulings/ruling-lib.mjs BOARD_KEY_HEX.
const BOARD_KEY_HEX = "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170";

type SignedRecord = { payload: Record<string, unknown>; signature: { sig_ed25519: string; payload_sha256: string; signer_auth?: string } };
const fixture = (name: string) => JSON.parse(readFileSync(new URL(`./__fixtures__/board-sign-static/${name}`, import.meta.url), "utf8"));
const reachFixture = (name: string) => JSON.parse(readFileSync(new URL(`../_lib/reach/__fixtures__/${name}`, import.meta.url), "utf8"));

// The four records the pod-token route really signed (Hugging Face, fetched 13 Oct 2026).
const REAL_ACCEPTED: { file: string; shape: string; source: string }[] = [
  { file: "x402-release-2026-10-13.signed.json", shape: "x402-release", source: "datasets/csoai/x402-bazaar-conformance release-2026-10-13.signed.json" },
  { file: "mcp-remote-census-record-2026-10-11.signed.json", shape: "census-record", source: "datasets/csoai/mcp-remote-census record.2026-10-11.signed.json" },
  { file: "hf-mcp-spaces-census-record-2026-10-11.signed.json", shape: "census-record", source: "datasets/csoai/hf-mcp-spaces-census record.2026-10-11.signed.json" },
  { file: "a2a-card-census-record-2026-10-11.signed.json", shape: "census-record", source: "datasets/csoai/a2a-card-census record.2026-10-11.signed.json" },
];
const realX402 = () => fixture("x402-release-2026-10-13.signed.json") as SignedRecord;
const realCensus = () => fixture("mcp-remote-census-record-2026-10-11.signed.json") as SignedRecord;

async function keypair() {
  const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", kp.privateKey);
  return { pub: kp.publicKey, pkcs8b64: b64(pkcs8) };
}

const POD = "pod-token-for-tests-0123456789abcdefghijklmnopqrstuvwxyz";
const RECENT_KEY = "boardsign:static:recent";

function fakeKv(opts: { getThrows?: boolean; putThrows?: boolean; seed?: unknown; rawSeed?: string } = {}) {
  const store = new Map<string, string>();
  if (opts.seed !== undefined) store.set(RECENT_KEY, JSON.stringify(opts.seed));
  if (opts.rawSeed !== undefined) store.set(RECENT_KEY, opts.rawSeed);
  const calls = { get: 0, put: 0 };
  return {
    store,
    calls,
    async get(key: string, o?: unknown) {
      calls.get++;
      if (opts.getThrows) throw new Error("kv get refused");
      const v = store.get(key);
      if (v === undefined) return null;
      const type = typeof o === "string" ? o : (o as { type?: string } | undefined)?.type;
      return type === "json" ? JSON.parse(v) : v;
    },
    async put(key: string, value: string) {
      calls.put++;
      if (opts.putThrows) throw new Error("kv put refused");
      store.set(key, value);
    },
  };
}

type Env = Record<string, unknown>;

/** Calls the handler. Deferred work handed to waitUntil is collected in `pending` when given. */
function call(env: Env, bearer: string | null, body: unknown, pending?: Promise<unknown>[]) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (bearer !== null) headers.authorization = `Bearer ${bearer}`;
  const request = new Request("https://councilof.ai/api/board-sign", { method: "POST", headers, body: JSON.stringify(body) });
  const waitUntil = (p: Promise<unknown>) => {
    if (pending) pending.push(p);
  };
  return (onRequestPost as unknown as (ctx: { request: Request; env: Env; waitUntil: (p: Promise<unknown>) => void }) => Promise<Response>)({ request, env, waitUntil });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/api/board-sign caller paths", () => {
  it("signs for the pod token and the signature verifies over the canonical preimage", async () => {
    const { pub, pkcs8b64 } = await keypair();
    // The payload production signed at 2026-10-13T01:28:20Z (the daily x402 release sidecar).
    const real = realX402();
    const payload = real.payload;
    const r = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD }, POD, { payload });
    expect(r.status).toBe(200);
    const j = (await r.json()) as { sig_ed25519: string; payload_sha256: string; signer_auth: string; did: string; caller: { route: string; strict: unknown } };
    expect(j.signer_auth).toBe("pod-token");
    expect(j.did).toBe("did:web:csoai.org#board-attestation-1");
    expect(j.caller.route).toBe("pod-token");
    expect(j.caller.strict).toBeNull();
    const bytes = canonicalBytes(payload);
    const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((b) => b.toString(16).padStart(2, "0")).join("");
    expect(j.payload_sha256).toBe(digest);
    // the preimage here is the one production hashed on 13 Oct: same digest as the public record
    expect(j.payload_sha256).toBe(real.signature.payload_sha256);
    expect(await crypto.subtle.verify({ name: "Ed25519" }, pub, hexToBytes(j.sig_ed25519), bytes)).toBe(true);
    // control: the same signature must NOT verify over a different preimage
    expect(await crypto.subtle.verify({ name: "Ed25519" }, pub, hexToBytes(j.sig_ed25519), canonicalBytes({ ...payload, rows: 3084 }))).toBe(false);
  });

  it("rejects a wrong pod token, an absent bearer, and an unset pod secret", async () => {
    const { pkcs8b64 } = await keypair();
    expect((await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD }, POD + "x", { payload: { a: 1 } })).status).toBe(401);
    expect((await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD }, null, { payload: { a: 1 } })).status).toBe(401);
    expect((await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64 }, POD, { payload: { a: 1 } })).status).toBe(401);
    expect((await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: "short" }, "short", { payload: { a: 1 } })).status).toBe(401);
    // a real, signable payload does not rescue a wrong token
    expect((await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD }, POD + "x", { payload: realX402().payload })).status).toBe(401);
  });

  it("routes a JWT-shaped bearer to OIDC only, even when it equals the pod token", async () => {
    const { pkcs8b64 } = await keypair();
    const jwtShaped = "aaaa.bbbb.cccc";
    const r = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: jwtShaped }, jwtShaped, { payload: { a: 1 } });
    expect(r.status).toBe(401);
    expect(((await r.json()) as { reason: string }).reason).toBe("OIDC rejected");
  });

  it("still refuses a never-sign label on the pod path", async () => {
    const { pkcs8b64 } = await keypair();
    const r = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD }, POD, { payload: { label: "THIN" } });
    expect(r.status).toBe(422);
    // and a payload of the right shape does not get a labelled value past the firewall
    const labelled = { ...realX402().payload, signer: "THIN" };
    expect(staticRouteVerdict(labelled).ok).toBe(true);
    expect((await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD }, POD, { payload: labelled })).status).toBe(422);
  });
});

describe("pod-token route: the four records it really signed are still signed", () => {
  for (const f of REAL_ACCEPTED) {
    it(`${f.source}`, async () => {
      const real = fixture(f.file) as SignedRecord;
      // 1. The fixture is the real record: production signed it by this route, and the published
      //    signature verifies under the board key over the canonical payload.
      expect(real.signature.signer_auth).toBe("pod-token");
      const authentic = await verifyLeaf(real.payload, real.signature.payload_sha256, real.signature.sig_ed25519, BOARD_KEY_HEX);
      expect(authentic).toEqual({ sha_ok: true, sig_ok: true });
      // 2. The rule accepts it, as the shape it is.
      const verdict = staticRouteVerdict(real.payload);
      expect(verdict.reason).toBeNull();
      expect(verdict).toMatchObject({ ok: true, shape: f.shape, artifact_path: (real.payload.artifact as { path: string }).path });
      // 3. The route signs it, over the same preimage production hashed.
      const { pub, pkcs8b64 } = await keypair();
      const r = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD }, POD, { payload: real.payload });
      expect(r.status).toBe(200);
      const j = (await r.json()) as { sig_ed25519: string; payload_sha256: string; signer_auth: string };
      expect(j.signer_auth).toBe("pod-token");
      expect(j.payload_sha256).toBe(real.signature.payload_sha256);
      expect(await crypto.subtle.verify({ name: "Ed25519" }, pub, hexToBytes(j.sig_ed25519), canonicalBytes(real.payload))).toBe(true);
    });
  }

  it("accepts next week's and tomorrow's dates, and all three census datasets", () => {
    const x = realX402().payload;
    const tomorrow = { ...x, artifact: { ...(x.artifact as object), path: "datasets/csoai/x402-bazaar-conformance/release-2026-10-14.json" } };
    expect(staticRouteVerdict(tomorrow)).toMatchObject({ ok: true, shape: "x402-release" });
    const c = realCensus().payload;
    for (const repo of ["mcp-remote-census", "hf-mcp-spaces-census", "a2a-card-census"]) {
      const next = { ...c, artifact: { ...(c.artifact as object), path: `datasets/csoai/${repo}/record.2026-10-18.json` } };
      expect(staticRouteVerdict(next)).toMatchObject({ ok: true, shape: "census-record" });
    }
  });
});

describe("pod-token route: everything else is refused with 403 and no signature", () => {
  const refused = fixture("refused-real-records.json") as { records: { kind: string; source: string; payload: Record<string, unknown>; sig_ed25519: string }[] };

  async function expectRefused(payload: unknown) {
    const { pkcs8b64 } = await keypair();
    const kv = fakeKv();
    const pending: Promise<unknown>[] = [];
    const r = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD, WITNESS_KV: kv }, POD, { payload }, pending);
    await Promise.all(pending);
    expect(r.status).toBe(403);
    const j = (await r.json()) as Record<string, unknown>;
    expect(j.error).toBe("forbidden");
    expect(j.reason).toBe("the pod-token route signs only the daily x402 release sidecar and the weekly census sidecars");
    expect(typeof j.detail).toBe("string");
    expect(j.static_route).toEqual({ state: "narrowed" });
    expect(j.sig_ed25519).toBeUndefined();
    expect(j.payload_sha256).toBeUndefined();
    // a refusal is not recorded as a use
    expect(kv.calls.put).toBe(0);
    return j;
  }

  // Real board-signed records of the three kinds the brief names. Each really was signed by the
  // board key (checked here), and each is refused on this route from now on.
  for (const kind of ["card", "root", "corrections-attestation"]) {
    it(`a real ${kind} payload`, async () => {
      const rec = refused.records.find((x) => x.kind === kind)!;
      const bytes = canonicalBytes(rec.payload);
      const authentic = await verifyLeaf(rec.payload, await sha256Hex(bytes), rec.sig_ed25519, BOARD_KEY_HEX);
      expect(authentic).toEqual({ sha_ok: true, sig_ok: true });
      expect(staticRouteVerdict(rec.payload).ok).toBe(false);
      await expectRefused(rec.payload);
    });
  }

  it("an arbitrary object and an unlabelled object", async () => {
    await expectRefused({ schema: "csoai.test/0", n: 261, z: "last", a: { y: 1, x: 2 } });
    await expectRefused({ a: 1 });
    await expectRefused({ artifact: realX402().payload.artifact, rows: 1 });
    await expectRefused([realX402().payload]);
  });

  it("real sidecars of other producers (same schema label, other paths, other keys)", async () => {
    // Two real pod-token records already in the repo: the cross-ledger daily and the capsule index.
    for (const name of ["xl-daily-2026-09-26.signed.json", "mi-2026-09-26.signed.json"]) {
      const real = reachFixture(name) as SignedRecord;
      expect(real.payload.schema).toBe("csoai.signed-artifact/0.1");
      const j = await expectRefused(real.payload);
      expect(j.detail).toBe("payload.artifact.path is not a dated x402 release or weekly census record");
    }
  });

  it("a card or an attestation riding under a sidecar label", async () => {
    const x = realX402().payload;
    // card fields a reader counts on (id, status, n) added beside a valid sidecar
    expect((await expectRefused({ ...x, status: "MEASURED", n: 30, id: "a".repeat(64) })).detail).toMatch(/3 top-level key\(s\) the x402-release sidecar does not use/);
    expect((await expectRefused({ ...x, kind: "gspc.measurement-card" })).detail).toMatch(/does not use \(first: kind\)/);
    // census fields on an x402 path, and x402 fields on a census path
    expect((await expectRefused({ ...x, read_state: "EXHAUSTED" })).detail).toMatch(/first: read_state/);
    expect((await expectRefused({ ...realCensus().payload, headline: {} })).detail).toMatch(/first: headline/);
  });

  it("a path that is not exactly a dated record of the four datasets", async () => {
    const x = realX402().payload;
    const withPath = (path: unknown) => ({ ...x, artifact: { ...(x.artifact as object), path } });
    for (const path of [
      "datasets/csoai/x402-bazaar-conformance/release-latest.json",
      "datasets/csoai/x402-bazaar-conformance/release-2026-10-13.json.ots",
      "datasets/csoai/x402-bazaar-conformance/release-2026-10-13.json\n",
      "datasets/csoai/x402-bazaar-conformance/../gspc-cards/release-2026-10-13.json",
      "hf://datasets/csoai/x402-bazaar-conformance/release-2026-10-13.json",
      "datasets/csoai/x402-bazaar-conformance/record.2026-10-13.json",
      "datasets/csoai/mcp-remote-census/release-2026-10-13.json",
      "datasets/csoai/cross-ledger-supply/record.2026-10-13.json",
      "datasets/other/mcp-remote-census/record.2026-10-13.json",
      "measurements/x402-activity/2026-10-12/x402-activity-2026-10-12.json",
      "public/root.json",
      "",
      17,
      null,
    ]) {
      expect(staticRouteVerdict(withPath(path)).ok, String(path)).toBe(false);
    }
    await expectRefused(withPath("public/root.json"));
  });

  it("an artifact block that is not exactly path, sha256, schema, as_of", async () => {
    const x = realX402().payload;
    const a = x.artifact as Record<string, unknown>;
    expect((await expectRefused({ ...x, artifact: { ...a, note: "extra" } })).detail).toBe("payload.artifact must have exactly the keys as_of, path, schema, sha256");
    const { as_of: _dropped, ...missing } = a;
    expect((await expectRefused({ ...x, artifact: missing })).detail).toBe("payload.artifact must have exactly the keys as_of, path, schema, sha256");
    expect((await expectRefused({ ...x, artifact: { ...a, sha256: "NOT-A-DIGEST" } })).detail).toBe("payload.artifact.sha256 is not 64 lowercase hex characters");
    expect((await expectRefused({ ...x, artifact: { ...a, schema: "" } })).detail).toBe("payload.artifact.schema and payload.artifact.as_of must be non-empty strings");
    expect((await expectRefused({ ...x, artifact: [a] })).detail).toBe("payload.artifact is not an object");
    expect((await expectRefused({ ...x, schema: "csoai.signed-artifact/0.2" })).detail).toBe("payload.schema is not csoai.signed-artifact/0.1");
  });
});

describe("pod-token route: each use leaves a best-effort line, and signing never depends on it", () => {
  it("records the census signature it just made, and the no-bearer 401 shows it", async () => {
    const { pkcs8b64 } = await keypair();
    const kv = fakeKv();
    const env = { BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD, WITNESS_KV: kv };
    const pending: Promise<unknown>[] = [];
    const real = realCensus();
    const r = await call(env, POD, { payload: real.payload }, pending);
    expect(r.status).toBe(200);
    const j = (await r.json()) as { payload_sha256: string; signed_at: string };
    expect(pending.length).toBe(1);
    await Promise.all(pending);
    const stored = JSON.parse(kv.store.get(RECENT_KEY)!);
    expect(stored).toEqual([
      { signed_at: j.signed_at, payload_sha256: real.signature.payload_sha256, artifact_path: "datasets/csoai/mcp-remote-census/record.2026-10-11.json" },
    ]);
    // The proof read after deploy: POST with no bearer.
    const probe = await call(env, null, {});
    expect(probe.status).toBe(401);
    const p = (await probe.json()) as { error: string; reason: string; static_route: { state: string; signs_only: string[]; recent: unknown; recent_state: string } };
    expect(p.reason).toBe("bearer required (GitHub OIDC JWT or the pod caller token)");
    expect(p.static_route.state).toBe("narrowed");
    expect(p.static_route.signs_only).toEqual(["x402-release", "census-record"]);
    expect(p.static_route.recent_state).toBe("READ");
    expect(p.static_route.recent).toEqual(stored);
  });

  it("keeps the newest 20, newest first, and drops malformed lines", async () => {
    const { pkcs8b64 } = await keypair();
    const old = Array.from({ length: 25 }, (_, i) => ({ signed_at: `2026-10-${String(i + 1).padStart(2, "0")}T01:28:00.000Z`, payload_sha256: String(i).padStart(64, "0"), artifact_path: `p${i}` }));
    const kv = fakeKv({ seed: [{ junk: true }, "text", null, ...old] });
    const pending: Promise<unknown>[] = [];
    const r = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD, WITNESS_KV: kv }, POD, { payload: realX402().payload }, pending);
    expect(r.status).toBe(200);
    await Promise.all(pending);
    const stored = JSON.parse(kv.store.get(RECENT_KEY)!) as { artifact_path: string }[];
    expect(stored.length).toBe(20);
    expect(stored[0].artifact_path).toBe("datasets/csoai/x402-bazaar-conformance/release-2026-10-13.json");
    expect(stored.slice(1).map((e) => e.artifact_path)).toEqual(old.slice(0, 19).map((e) => e.artifact_path));
  });

  it("keeps the list when the read fails, and replaces a value that is not JSON", async () => {
    const { pkcs8b64 } = await keypair();
    const payload = realX402().payload;
    // read fails: nothing is written, so an existing list is not truncated to one line
    const failing = fakeKv({ getThrows: true });
    let pending: Promise<unknown>[] = [];
    expect((await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD, WITNESS_KV: failing }, POD, { payload }, pending)).status).toBe(200);
    await Promise.all(pending);
    expect(failing.calls.put).toBe(0);
    // damaged value: replaced by a list holding this use
    const damaged = fakeKv({ rawSeed: "{not json" });
    pending = [];
    expect((await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD, WITNESS_KV: damaged }, POD, { payload }, pending)).status).toBe(200);
    await Promise.all(pending);
    const stored = JSON.parse(damaged.store.get(RECENT_KEY)!) as { artifact_path: string }[];
    expect(stored.map((e) => e.artifact_path)).toEqual(["datasets/csoai/x402-bazaar-conformance/release-2026-10-13.json"]);
    // and the 401 says UNREADABLE for a damaged value rather than showing an empty list
    const probe = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, WITNESS_KV: fakeKv({ rawSeed: "{not json" }) }, null, {});
    expect(((await probe.json()) as { static_route: unknown }).static_route).toMatchObject({ recent: null, recent_state: "UNREADABLE" });
  });

  it("still signs when the store refuses the write, refuses the read, hangs, or is not bound", async () => {
    const { pub, pkcs8b64 } = await keypair();
    const payload = realX402().payload;
    const hang = { calls: { get: 0, put: 0 }, get: () => new Promise(() => undefined), put: () => new Promise(() => undefined) };
    for (const kv of [fakeKv({ putThrows: true }), fakeKv({ getThrows: true }), hang, undefined]) {
      const pending: Promise<unknown>[] = [];
      const r = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD, WITNESS_KV: kv }, POD, { payload }, pending);
      expect(r.status).toBe(200);
      const j = (await r.json()) as { sig_ed25519: string };
      expect(await crypto.subtle.verify({ name: "Ed25519" }, pub, hexToBytes(j.sig_ed25519), canonicalBytes(payload))).toBe(true);
      // the deferred write never rejects (a rejection here would be an unhandled error in the runtime)
      if (kv !== hang) await Promise.all(pending);
    }
  });

  it("still signs when the runtime has no waitUntil, or waitUntil throws", async () => {
    const { pkcs8b64 } = await keypair();
    const payload = realX402().payload;
    const mk = () => new Request("https://councilof.ai/api/board-sign", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${POD}` }, body: JSON.stringify({ payload }) });
    const env = { BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD, WITNESS_KV: fakeKv() };
    const handler = onRequestPost as unknown as (ctx: unknown) => Promise<Response>;
    expect((await handler({ request: mk(), env })).status).toBe(200);
    expect((await handler({ request: mk(), env, waitUntil: () => { throw new Error("no waitUntil here"); } })).status).toBe(200);
  });

  it("the no-bearer 401 stays a 401 when the list cannot be read, and says so", async () => {
    const { pkcs8b64 } = await keypair();
    const unreadable = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD, WITNESS_KV: fakeKv({ getThrows: true }) }, null, {});
    expect(unreadable.status).toBe(401);
    expect(((await unreadable.json()) as { static_route: unknown }).static_route).toMatchObject({ state: "narrowed", recent: null, recent_state: "UNREADABLE" });
    const unbound = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD }, null, {});
    expect(unbound.status).toBe(401);
    expect(((await unbound.json()) as { static_route: unknown }).static_route).toMatchObject({ state: "narrowed", recent: null, recent_state: "STORE_NOT_BOUND" });
    const empty = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD, WITNESS_KV: fakeKv() }, null, {});
    expect(((await empty.json()) as { static_route: unknown }).static_route).toMatchObject({ state: "narrowed", recent: [], recent_state: "READ" });
  });
});

// ------------------------------------------------------------------------------------------
// GitHub OIDC route.
// ------------------------------------------------------------------------------------------
const ISS = "https://token.actions.githubusercontent.com";
const AUD = "https://councilof.ai/api/board-sign";
const REPO = "CSOAI-ORG/councilof-ai";
const JWKS_URL = `${ISS}/.well-known/jwks`;
const KID = "throwaway-test-kid-1";
const wfRef = (file: string, ref = "refs/heads/master") => `${REPO}/.github/workflows/${file}@${ref}`;

const b64url = (input: string | Uint8Array) => {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function rsaKey(kid = KID) {
  const kp = (await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const jwk = { ...((await crypto.subtle.exportKey("jwk", kp.publicKey)) as Record<string, unknown>), kid, alg: "RS256", use: "sig" };
  return { priv: kp.privateKey, jwk };
}

async function mint(priv: CryptoKey, claims: Record<string, unknown>, header: Record<string, unknown> = { alg: "RS256", typ: "JWT", kid: KID }) {
  const head = b64url(JSON.stringify(header));
  const body = b64url(JSON.stringify(claims));
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", priv, new TextEncoder().encode(`${head}.${body}`));
  return `${head}.${body}.${b64url(new Uint8Array(sig))}`;
}

/** Stubs global fetch: answers the one JWKS URL, throws on anything else. Returns the call list. */
function stubJwks(keys: unknown[]) {
  const seen: string[] = [];
  vi.stubGlobal("fetch", async (input: unknown) => {
    const url = String(input);
    seen.push(url);
    if (url !== JWKS_URL) throw new Error(`unexpected network call in a unit test: ${url}`);
    return new Response(JSON.stringify({ keys }), { status: 200, headers: { "content-type": "application/json" } });
  });
  return seen;
}

const nowS = () => Math.floor(Date.now() / 1000);
/** Claims of a token GitHub mints for a job of `file` at `ref` (field names per the GitHub OIDC reference). */
function claimsFor(file = "public-root.yml", ref = "refs/heads/master", over: Record<string, unknown> = {}) {
  return {
    iss: ISS,
    aud: AUD,
    sub: `repo:${REPO}:ref:${ref}`,
    repository: REPO,
    repository_id: "1154282848",
    repository_owner: "CSOAI-ORG",
    repository_owner_id: "260596236",
    job_workflow_ref: wfRef(file, ref),
    workflow_ref: wfRef(file, ref),
    workflow: file.replace(/\.yml$/, ""),
    ref,
    ref_type: "branch",
    sha: "8c89bfccf83cf70200dfd7f1bb36bed30a18c81a",
    event_name: "workflow_dispatch",
    run_id: "18460000001",
    run_attempt: "1",
    iat: nowS() - 5,
    nbf: nowS() - 5,
    exp: nowS() + 300,
    ...over,
  };
}

type OidcReply = {
  error?: string;
  reason?: string;
  detail?: string;
  sig_ed25519?: string;
  payload_sha256?: string;
  signer_auth?: string;
  caller?: { route: string; job_workflow_ref: string | null; workflow_ref: string | null; ref: string | null; sha: string | null; event_name: string | null; run_id: string | null; run_attempt: string | null; strict: { pass: boolean; reason: string | null } | null };
};

describe("OIDC route: a real-shaped token is accepted (first passing cases)", () => {
  it("signs for public-root.yml at master, echoes the verified claims, and touches no store", async () => {
    const { pub, pkcs8b64 } = await keypair();
    const { priv, jwk } = await rsaKey();
    const seen = stubJwks([jwk]);
    const kv = fakeKv();
    const pending: Promise<unknown>[] = [];
    const claims = claimsFor("public-root.yml");
    // a card payload: the OIDC route is not narrowed
    const payload = { schema: "csoai.gspc-axes/0.5", kind: "gspc.coverage-card/0.1", axis: "fin-1", n: 0, status: "UNMEASURED" };
    const r = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD, WITNESS_KV: kv }, await mint(priv, claims), { payload }, pending);
    expect(r.status).toBe(200);
    const j = (await r.json()) as OidcReply;
    expect(j.signer_auth).toBe("github-oidc");
    expect(await crypto.subtle.verify({ name: "Ed25519" }, pub, hexToBytes(j.sig_ed25519!), canonicalBytes(payload))).toBe(true);
    expect(j.payload_sha256).toBe(await sha256Hex(canonicalBytes(payload)));
    expect(j.caller).toMatchObject({
      route: "github-oidc",
      job_workflow_ref: claims.job_workflow_ref,
      workflow_ref: claims.workflow_ref,
      ref: "refs/heads/master",
      sha: claims.sha,
      event_name: "workflow_dispatch",
      run_id: "18460000001",
      run_attempt: "1",
      strict: { pass: true, reason: null },
    });
    // exactly one network call, to the JWKS URL; and no store read, write or deferred work
    expect(seen).toEqual([JWKS_URL]);
    expect(kv.calls).toEqual({ get: 0, put: 0 });
    expect(pending.length).toBe(0);
  });

  it("the caller echo is outside the signed bytes", async () => {
    const { pub, pkcs8b64 } = await keypair();
    const { priv, jwk } = await rsaKey();
    stubJwks([jwk]);
    const payload = { schema: "csoai.gspc-axes/0.5", n: 0 };
    const a = (await (await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64 }, await mint(priv, claimsFor("public-root.yml")), { payload })).json()) as OidcReply;
    const b = (await (await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64 }, await mint(priv, claimsFor("hf-fin-shells.yml", "refs/heads/master", { run_id: "18460000002" })), { payload })).json()) as OidcReply;
    expect(a.caller!.run_id).not.toBe(b.caller!.run_id);
    // Ed25519 is deterministic: two different callers, one payload, one identical signature
    expect(a.sig_ed25519).toBe(b.sig_ed25519);
    expect(await crypto.subtle.verify({ name: "Ed25519" }, pub, hexToBytes(a.sig_ed25519!), canonicalBytes(payload))).toBe(true);
  });

  it("today's acceptance rule is unchanged: each token it admitted is still admitted, with the strict verdict only reported", async () => {
    const { pkcs8b64 } = await keypair();
    const { priv, jwk } = await rsaKey();
    stubJwks([jwk]);
    const payload = { schema: "csoai.gspc-axes/0.5", n: 0 };
    const land = "refs/heads/runpod/land-1";
    const cases: { name: string; claims: Record<string, unknown>; strictPass: boolean; why?: RegExp }[] = [
      { name: "hf-fin-shells.yml at master", claims: claimsFor("hf-fin-shells.yml"), strictPass: true },
      { name: "hf-fin-shells-measure.yml at master", claims: claimsFor("hf-fin-shells-measure.yml"), strictPass: true },
      { name: "hf-fin-shells-attest.yml at master", claims: claimsFor("hf-fin-shells-attest.yml"), strictPass: true },
      { name: "card run on a landing branch", claims: claimsFor("hf-fin-shells-measure.yml", land), strictPass: false, why: /^job_workflow_ref/ },
      { name: "other.yml on a branch named x/public-root", claims: claimsFor("other.yml", "refs/heads/x/public-root"), strictPass: false, why: /^job_workflow_ref/ },
      { name: "hf-fin-shells-x.yml at master", claims: claimsFor("hf-fin-shells-x.yml"), strictPass: false, why: /^job_workflow_ref/ },
      { name: "hf-inference-mill.yml at master", claims: claimsFor("hf-inference-mill.yml"), strictPass: false, why: /^job_workflow_ref/ },
      { name: "auto-eat-sign.yml at master", claims: claimsFor("auto-eat-sign.yml"), strictPass: false, why: /^job_workflow_ref/ },
      { name: "only the workflow name", claims: claimsFor("public-root.yml", "refs/heads/master", { job_workflow_ref: undefined, workflow_ref: undefined, workflow: "public-root" }), strictPass: false, why: /^job_workflow_ref/ },
      { name: "no exp", claims: claimsFor("public-root.yml", "refs/heads/master", { exp: undefined }), strictPass: false, why: /^exp/ },
      { name: "the bare-site audience", claims: claimsFor("public-root.yml", "refs/heads/master", { aud: "https://councilof.ai" }), strictPass: false, why: /^aud/ },
      { name: "the repository-URL audience", claims: claimsFor("public-root.yml", "refs/heads/master", { aud: "https://github.com/CSOAI-ORG/councilof-ai" }), strictPass: false, why: /^aud/ },
      { name: "an audience list", claims: claimsFor("public-root.yml", "refs/heads/master", { aud: ["https://example.org", AUD] }), strictPass: false, why: /^aud/ },
    ];
    for (const c of cases) {
      const r = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64 }, await mint(priv, c.claims), { payload });
      expect(r.status, c.name).toBe(200);
      const j = (await r.json()) as OidcReply;
      expect(j.signer_auth, c.name).toBe("github-oidc");
      expect(j.caller!.strict!.pass, c.name).toBe(c.strictPass);
      if (c.why) expect(j.caller!.strict!.reason, c.name).toMatch(c.why);
    }
  });

  it("an OIDC caller is not narrowed: it may sign a card, and a sidecar", async () => {
    const { pkcs8b64 } = await keypair();
    const { priv, jwk } = await rsaKey();
    stubJwks([jwk]);
    const tokenFor = () => mint(priv, claimsFor("hf-fin-shells-measure.yml"));
    const refused = fixture("refused-real-records.json") as { records: { kind: string; payload: Record<string, unknown> }[] };
    for (const rec of refused.records) {
      expect((await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64 }, await tokenFor(), { payload: rec.payload })).status, rec.kind).toBe(200);
    }
    expect((await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64 }, await tokenFor(), { payload: realX402().payload })).status).toBe(200);
    // the THIN firewall holds on this route too
    expect((await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64 }, await tokenFor(), { payload: { label: "THIN" } })).status).toBe(422);
  });
});

describe("OIDC route: each check still rejects", () => {
  async function rejected(build: (k: { priv: CryptoKey; jwk: Record<string, unknown> }) => Promise<{ token: string; keys?: unknown[] }>) {
    const { pkcs8b64 } = await keypair();
    const k = await rsaKey();
    const { token, keys } = await build(k);
    const seen = stubJwks(keys ?? [k.jwk]);
    const r = await call({ BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, BOARD_SIGN_POD_TOKEN: POD }, token, { payload: { schema: "csoai.gspc-axes/0.5", n: 0 } });
    const j = (await r.json()) as OidcReply;
    expect(r.status).toBe(401);
    expect(j.reason).toBe("OIDC rejected");
    expect(j.sig_ed25519).toBeUndefined();
    return { detail: j.detail, seen };
  }

  it("alg other than RS256", async () => {
    const out = await rejected(async ({ priv }) => ({ token: await mint(priv, claimsFor(), { alg: "PS256", typ: "JWT", kid: KID }) }));
    expect(out.detail).toBe("alg");
    expect(out.seen).toEqual([]);
    expect((await rejected(async ({ priv }) => ({ token: await mint(priv, claimsFor(), { alg: "none", typ: "JWT", kid: KID }) }))).detail).toBe("alg");
  });

  it("wrong issuer", async () => {
    const out = await rejected(async ({ priv }) => ({ token: await mint(priv, claimsFor("public-root.yml", "refs/heads/master", { iss: "https://token.actions.githubusercontent.com.example.org" })) }));
    expect(out.detail).toBe("iss");
    expect(out.seen).toEqual([]);
  });

  it("wrong audience", async () => {
    expect((await rejected(async ({ priv }) => ({ token: await mint(priv, claimsFor("public-root.yml", "refs/heads/master", { aud: "https://example.org/api/board-sign" })) }))).detail).toBe("aud");
    expect((await rejected(async ({ priv }) => ({ token: await mint(priv, claimsFor("public-root.yml", "refs/heads/master", { aud: undefined })) }))).detail).toBe("aud");
  });

  it("another repository, including a fork that kept the name", async () => {
    expect((await rejected(async ({ priv }) => ({ token: await mint(priv, claimsFor("public-root.yml", "refs/heads/master", { repository: "someone-else/councilof-ai" })) }))).detail).toBe("repo");
    expect((await rejected(async ({ priv }) => ({ token: await mint(priv, claimsFor("public-root.yml", "refs/heads/master", { repository: "CSOAI-ORG/councilof-ai-fork" })) }))).detail).toBe("repo");
  });

  it("a workflow outside the allow-list", async () => {
    const out = await rejected(async ({ priv }) => ({ token: await mint(priv, claimsFor("deploy.yml")) }));
    expect(out.detail).toBe("workflow");
    expect(out.seen).toEqual([]);
  });

  it("an expired token", async () => {
    const out = await rejected(async ({ priv }) => ({ token: await mint(priv, claimsFor("public-root.yml", "refs/heads/master", { exp: nowS() - 120 })) }));
    expect(out.detail).toBe("exp");
    expect(out.seen).toEqual([]);
  });

  it("a signature from another key, and a payload altered after signing", async () => {
    const other = await rsaKey();
    const wrongKey = await rejected(async () => ({ token: await mint(other.priv, claimsFor()) }));
    expect(wrongKey.detail).toBe("sig");
    expect(wrongKey.seen).toEqual([JWKS_URL]);
    const altered = await rejected(async ({ priv }) => {
      const [h, , s] = (await mint(priv, claimsFor("deploy.yml"))).split(".");
      // swap in claims that pass every claim check, under the signature made for other claims
      return { token: `${h}.${b64url(JSON.stringify(claimsFor("public-root.yml")))}.${s}` };
    });
    expect(altered.detail).toBe("sig");
  });

  it("a key id the issuer does not publish", async () => {
    const out = await rejected(async ({ priv }) => ({ token: await mint(priv, claimsFor(), { alg: "RS256", typ: "JWT", kid: "some-other-kid" }) }));
    expect(out.detail).toBe("kid");
    expect(out.seen).toEqual([JWKS_URL]);
  });
});

describe("strictVerdict (the rule a later step enforces; pure)", () => {
  const good = (file = "public-root.yml", over: Record<string, unknown> = {}) => claimsFor(file, "refs/heads/master", over);

  it("passes each of the four workflow files at refs/heads/master", () => {
    for (const f of ["public-root.yml", "hf-fin-shells.yml", "hf-fin-shells-measure.yml", "hf-fin-shells-attest.yml"]) {
      expect(strictVerdict(good(f)), f).toEqual({ pass: true, reason: null });
    }
    // GitHub sends the ids as strings; a number with the same digits reads the same
    expect(strictVerdict(good("public-root.yml", { repository_id: 1154282848, repository_owner_id: 260596236 })).pass).toBe(true);
  });

  it("would refuse a landing-branch ref, even for an allowed file", () => {
    expect(strictVerdict(claimsFor("hf-fin-shells-measure.yml", "refs/heads/runpod/land-1"))).toEqual({
      pass: false,
      reason: "job_workflow_ref is not one of the four signing workflow files at refs/heads/master",
    });
    // the workflow file at master, but the run's own ref is elsewhere
    expect(strictVerdict(good("public-root.yml", { ref: "refs/heads/runpod/land-1" })).reason).toBe("ref is not refs/heads/master");
    expect(strictVerdict(good("public-root.yml", { ref: "refs/tags/master" })).pass).toBe(false);
    expect(strictVerdict(good("public-root.yml", { ref: "refs/pull/1/merge" })).pass).toBe(false);
  });

  it("would refuse a branch named x/public-root running other.yml", () => {
    expect(strictVerdict(claimsFor("other.yml", "refs/heads/x/public-root")).pass).toBe(false);
  });

  it("would refuse a file whose name only contains an allowed name", () => {
    for (const f of ["hf-fin-shells-x.yml", "public-root-watcher.yml", "public-root-candidate-upgrade.yml", "xpublic-root.yml", "public-root.yaml", "hf-inference-mill.yml", "auto-eat-sign.yml"]) {
      expect(strictVerdict(good(f)).pass, f).toBe(false);
    }
    // an allowed file path, but in another repository's workflow directory or with a suffix
    expect(strictVerdict(good("public-root.yml", { job_workflow_ref: `someone/else/.github/workflows/public-root.yml@refs/heads/master` })).pass).toBe(false);
    expect(strictVerdict(good("public-root.yml", { job_workflow_ref: `${wfRef("public-root.yml")}x` })).pass).toBe(false);
    expect(strictVerdict(good("public-root.yml", { workflow_ref: wfRef("deploy.yml") })).reason).toBe(
      "workflow_ref is not one of the four signing workflow files at refs/heads/master",
    );
  });

  it("would refuse a token that names only the workflow", () => {
    expect(strictVerdict({ iss: ISS, aud: AUD, repository: REPO, workflow: "public-root", ref: "refs/heads/master", exp: nowS() + 300 }).pass).toBe(false);
    expect(strictVerdict(good("public-root.yml", { workflow_ref: undefined })).pass).toBe(false);
  });

  it("would refuse a missing or non-numeric exp", () => {
    expect(strictVerdict(good("public-root.yml", { exp: undefined })).reason).toBe("exp is missing or not a number");
    expect(strictVerdict(good("public-root.yml", { exp: String(nowS() + 300) })).reason).toBe("exp is missing or not a number");
  });

  it("would refuse any audience but the one signer URL, and any other repository or owner id", () => {
    expect(strictVerdict(good("public-root.yml", { aud: "https://councilof.ai" })).reason).toBe("aud is not exactly https://councilof.ai/api/board-sign");
    expect(strictVerdict(good("public-root.yml", { aud: [AUD] })).pass).toBe(false);
    expect(strictVerdict(good("public-root.yml", { repository_id: "1154282849" })).reason).toBe("repository_id is not this repository");
    expect(strictVerdict(good("public-root.yml", { repository_id: undefined })).pass).toBe(false);
    expect(strictVerdict(good("public-root.yml", { repository_owner_id: "1" })).reason).toBe("repository_owner_id is not this organisation");
    expect(strictVerdict({}).pass).toBe(false);
  });
});
