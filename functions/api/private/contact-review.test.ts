import { beforeAll, describe, expect, it, vi } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from "jose";
import { onRequestHead, readContactReview } from "./contact-review";

const issuer = "https://csoai-test.cloudflareaccess.com";
const audience = "test-contact-operator-app";
const keyName = "contact:2026-11-21T01:30:00.000Z:4c6a4ca0-197b-423d-8341-1f77d6eb40ba";
const stored = {
  kind: "contact", id: "4c6a4ca0-197b-423d-8341-1f77d6eb40ba",
  at: "2026-11-21T01:30:00.000Z", name: "Example Person",
  email: "buyer@example.org", subject: "Public artifact", message: "Please scope a review",
  notification_state: "NOT_CONFIGURED", source: "councilof.ai/contact",
  confidential_extra: "never echo this",
};

let privateKey: Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];
let localKeys: JWTVerifyGetKey;

beforeAll(async () => {
  const keys = await generateKeyPair("RS256", { extractable: true });
  privateKey = keys.privateKey;
  const pub = await exportJWK(keys.publicKey);
  pub.kid = "operator-test-key";
  pub.alg = "RS256";
  pub.use = "sig";
  localKeys = createLocalJWKSet({ keys: [pub] });
});

async function token(override: { iss?: string; aud?: string; email?: string; exp?: number } = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ email: override.email ?? "operator@example.org" })
    .setProtectedHeader({ alg: "RS256", kid: "operator-test-key" })
    .setIssuer(override.iss ?? issuer).setAudience(override.aud ?? audience)
    .setIssuedAt(now).setExpirationTime(override.exp ?? now + 300)
    .sign(privateKey);
}
function env(kv: any = { list: vi.fn(), get: vi.fn() }, changes: Record<string, unknown> = {}) {
  return {
    LEADS: kv, LEADS_OPERATOR_ACCESS_ISSUER: issuer,
    LEADS_OPERATOR_ACCESS_AUD: audience, LEADS_OPERATOR_EMAILS: "operator@example.org",
    ...changes,
  };
}
async function read(
  query = "", settings: any = env(), assertion?: string,
) {
  return readContactReview(
    new Request("https://councilof.ai/api/private/contact-review" + query, {
      headers: assertion ? { "cf-access-jwt-assertion": assertion } : {},
    }), settings, localKeys,
  );
}

describe("private operator contact-review API", () => {
  it("fails closed without complete Access configuration, without touching KV", async () => {
    const kv = { list: vi.fn(), get: vi.fn() };
    const response = await read("", env(kv, { LEADS_OPERATOR_EMAILS: "" }), await token());
    expect(response.status).toBe(503);
    expect(kv.list).not.toHaveBeenCalled();
    expect(kv.get).not.toHaveBeenCalled();
    expect((await response.json()).state).toBe("UNAVAILABLE_OR_UNAUTHORIZED");
  });

  it("HEAD on the operator route denies anonymous access without reading LEADS or exposing a body", async () => {
    const kv = { list: vi.fn(), get: vi.fn() };
    const response = await onRequestHead({
      request: new Request("https://councilof.ai/api/private/contact-review", { method: "HEAD" }),
      env: env(kv),
    } as any);
    expect(response.status).toBe(401);
    expect(await response.text()).toBe("");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(kv.list).not.toHaveBeenCalled();
    expect(kv.get).not.toHaveBeenCalled();
  });

  it("rejects missing/forged tokens and does not trust user email headers", async () => {
    expect((await read()).status).toBe(401);
    expect((await read("", env(), "x.y.z")).status).toBe(401);
    const tampered = (await token()).slice(0, -3) + "aaa";
    expect((await read("", env(), tampered)).status).toBe(401);
  });

  it("rejects wrong issuer, audience, expiry and a non-allowlisted identity", async () => {
    expect((await read("", env(), await token({ iss: "https://other.cloudflareaccess.com" }))).status).toBe(401);
    expect((await read("", env(), await token({ aud: "other-app" }))).status).toBe(401);
    expect((await read("", env(), await token({ exp: Math.floor(Date.now() / 1000) - 60 }))).status).toBe(401);
    expect((await read("", env(), await token({ email: "not-operator@example.org" }))).status).toBe(403);
  });

  it("returns contact pointers only, never private content, on the list view", async () => {
    const kv = {
      list: vi.fn().mockResolvedValue({
        keys: [{ name: keyName }, { name: "subscribe:2026-11-21T01:30:00Z:other" }],
        list_complete: true,
      }), get: vi.fn(),
    };
    const response = await read("", env(kv), await token());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const body = await response.json() as any;
    expect(body.state).toBe("KEYS_ONLY");
    expect(body.keys).toEqual([keyName]);
    expect(body.records_read).toBe(false);
    expect(JSON.stringify(body)).not.toContain(stored.email);
    expect(kv.list).toHaveBeenCalledWith({ prefix: "contact:", limit: 15 });
    expect(kv.get).not.toHaveBeenCalled();
  });

  it("returns only whitelisted fields for an exact contact key", async () => {
    const kv = { list: vi.fn(), get: vi.fn().mockResolvedValue(JSON.stringify(stored)) };
    const response = await read("?key=" + encodeURIComponent(keyName), env(kv), await token());
    expect(response.status).toBe(200);
    const body = await response.json() as any;
    expect(body.record.email).toBe(stored.email);
    expect(body.record.notification_state).toBe("NOT_CONFIGURED");
    expect(body.record.confidential_extra).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("never echo this");
    expect(kv.get).toHaveBeenCalledWith(keyName);
    expect(kv.list).not.toHaveBeenCalled();
  });

  it("rejects malformed queries without reads or cross-namespace retrieval", async () => {
    const kv = { list: vi.fn(), get: vi.fn() };
    expect((await read("?key=lead%3Asecret", env(kv), await token())).status).toBe(400);
    expect((await read("?key=foo&cursor=bar", env(kv), await token())).status).toBe(400);
    expect((await read("?unapproved=1", env(kv), await token())).status).toBe(400);
    expect(kv.list).not.toHaveBeenCalled();
    expect(kv.get).not.toHaveBeenCalled();
  });

  it("distinguishes unreadable records, missing keys and storage errors", async () => {
    const kv = { list: vi.fn(), get: vi.fn().mockResolvedValueOnce("{invalid").mockResolvedValueOnce(null).mockRejectedValueOnce(Error("storage failed")) };
    expect((await read("?key=" + encodeURIComponent(keyName), env(kv), await token())).status).toBe(422);
    expect((await read("?key=" + encodeURIComponent(keyName), env(kv), await token())).status).toBe(404);
    expect((await read("?key=" + encodeURIComponent(keyName), env(kv), await token())).status).toBe(503);
  });
});
