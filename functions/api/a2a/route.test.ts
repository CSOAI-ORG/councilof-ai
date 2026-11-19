// POST /api/a2a/route — the body cap and the signed scope sentence.
//
// Until 2026-11-16 this door signed whatever it was sent: an unauthenticated caller's `from`,
// `to` and `payload` came back under the deployment's signature with nothing in the signed bytes
// saying they were unverified, and a 300 KiB body was signed and echoed. These tests hold the
// two fixes: a 64 KiB cap, and a scope sentence the signature covers.
import { describe, expect, it } from "vitest";
import { onRequestPost as route, MAX_ROUTE_BODY_BYTES, ENVELOPE_SCOPE } from "./route";
import { onRequestPost as verify } from "./verify";
import { decideGate, loadKey, makeEnvelope } from "../../_lib/layer0";

type Ctx = Parameters<typeof route>[0];

async function testEnv(): Promise<{ LAYER0_SIGN_KEY_PKCS8_B64: string }> {
  // A throwaway key, generated here for the test only. It is never published and never reused.
  const kp = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", kp.privateKey);
  return { LAYER0_SIGN_KEY_PKCS8_B64: btoa(String.fromCharCode(...new Uint8Array(pkcs8))) };
}
const post = (body: unknown, env: Record<string, unknown>) =>
  route({
    request: new Request("https://councilof.ai/api/a2a/route", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    env,
  } as unknown as Ctx);
const isValid = async (envelope: unknown, env: Record<string, unknown>): Promise<boolean> => {
  const res = await verify({
    request: new Request("https://councilof.ai/api/a2a/verify", { method: "POST", body: JSON.stringify(envelope) }),
    env,
  } as unknown as Parameters<typeof verify>[0]);
  return ((await res.json()) as { valid: boolean }).valid;
};
const OK = { from: { party: "did:example:probe" }, to: { party: "nobody" }, action: "probe.read", payload: { probe: true } };

describe("POST /api/a2a/route — bounded input, and a signature that says what it covers", () => {
  it("signs the scope sentence into the envelope and the verifier accepts it", async () => {
    const env = await testEnv();
    const res = await post(OK, env);
    expect(res.status).toBe(200);
    const { envelope } = (await res.json()) as { envelope: { scope: string } };
    expect(envelope.scope).toBe(ENVELOPE_SCOPE);
    expect(envelope.scope).toMatch(/caller-supplied and were not verified/);
    expect(envelope.scope).toMatch(/Not a certification/);
    expect(await isValid(envelope, env)).toBe(true);
  });

  it("the scope is covered by the signature: changing or removing it fails verification", async () => {
    const env = await testEnv();
    const { envelope } = (await (await post(OK, env)).json()) as { envelope: Record<string, unknown> };
    expect(await isValid({ ...envelope, scope: "CSOAI certifies this party." }, env)).toBe(false);
    const { scope: _dropped, ...without } = envelope;
    expect(await isValid(without, env)).toBe(false);
  });

  it("refuses a body over the cap with 413 and signs nothing", async () => {
    const env = await testEnv();
    const res = await post({ ...OK, payload: { pad: "x".repeat(MAX_ROUTE_BODY_BYTES) } }, env);
    expect(res.status).toBe(413);
    expect(((await res.json()) as { envelope?: unknown }).envelope).toBeUndefined();
  });

  it("counts bytes, not characters", async () => {
    const env = await testEnv();
    const res = await post({ ...OK, payload: { pad: "€".repeat(Math.ceil(MAX_ROUTE_BODY_BYTES / 3)) } }, env);
    expect(res.status).toBe(413);
  });

  it("refuses on a declared content-length over the cap before reading the body", async () => {
    const env = await testEnv();
    let read = false;
    const request = {
      headers: new Headers({ "content-length": String(MAX_ROUTE_BODY_BYTES + 1) }),
      text: async () => {
        read = true;
        return "{}";
      },
    };
    const res = await route({ request, env } as unknown as Ctx);
    expect(res.status).toBe(413);
    expect(read).toBe(false);
  });

  it("still signs an ordinary body just under the cap", async () => {
    const env = await testEnv();
    const res = await post({ ...OK, payload: { pad: "x".repeat(MAX_ROUTE_BODY_BYTES - 1024) } }, env);
    expect(res.status).toBe(200);
  });

  it("refuses a body that is not a JSON object", async () => {
    const env = await testEnv();
    for (const body of ["not json", "[1,2]", "null", '"text"', "7"]) {
      expect((await post(body, env)).status, body).toBe(400);
    }
  });

  it("keeps the gate and the honest 503: no envelope for a denial or a missing key", async () => {
    const env = await testEnv();
    for (const body of [{ action: "probe.read" }, { ...OK, action: "art5.social_scoring" }]) {
      const res = await post(body, env);
      expect(res.status).toBe(403);
      expect(((await res.json()) as { envelope?: unknown }).envelope).toBeUndefined();
    }
    const unsigned = await post(OK, {});
    expect(unsigned.status).toBe(503);
    expect(((await unsigned.json()) as { envelope?: unknown }).envelope).toBeUndefined();
  });

  it("makeEnvelope without a scope is unchanged for its other caller (/api/gate)", async () => {
    const env = await testEnv();
    const loaded = await loadKey(env);
    const e = await makeEnvelope({
      from: OK.from,
      to: OK.to,
      action: OK.action,
      payload: OK.payload,
      decision: decideGate({ action: OK.action, identity: "did:example:probe" }),
      privateKey: loaded.keys!.privateKey,
      signKid: "kid",
      episodeAnchor: "anchor",
    });
    expect(Object.keys(e)).toEqual(["v", "id", "ts", "from", "to", "intent", "action", "payload", "policy", "episode", "sig"]);
  });
});
