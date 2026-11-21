import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from "jose";
import { onRequestPost } from "./contact";
import { readContactReview } from "./private/contact-review";

/** Entire synthetic journey. No remote Cloudflare, email, actual customer or credentials. */
const issuer = "https://csoai-test.cloudflareaccess.com";
const audience = "test-contact-journey-aud";
let privateKey: Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];
let publicKeySet: JWTVerifyGetKey;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256", { extractable: true });
  privateKey = pair.privateKey;
  const publicJwk = await exportJWK(pair.publicKey);
  publicJwk.kid = "journey-synthetic-key";
  publicJwk.alg = "RS256";
  publicKeySet = createLocalJWKSet({ keys: [publicJwk] });
});
afterEach(() => vi.unstubAllGlobals());

async function signedOperatorToken(email = "reviewer@example.org") {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "RS256", kid: "journey-synthetic-key" })
    .setIssuer(issuer).setAudience(audience).setIssuedAt(now)
    .setExpirationTime(now + 300).sign(privateKey);
}
function makeStore() {
  const entries = new Map<string, string>();
  const kv = {
    put: vi.fn(async (key: string, raw: string, options: any) => {
      expect(options.expirationTtl).toBe(30 * 24 * 60 * 60);
      entries.set(key, raw);
    }),
    get: vi.fn(async (key: string) => entries.get(key) ?? null),
    list: vi.fn(async ({ prefix, limit }: { prefix: string; limit: number }) => ({
      keys: [...entries.keys()].filter(k => k.startsWith(prefix)).slice(0, limit).map(name => ({ name })),
      list_complete: true,
    })),
  };
  return { kv, entries };
}
const data = {
  name: "Synthetic Buyer",
  email: "synthetic-buyer@example.org",
  subject: "Evidence review scope",
  message: "Please scope a reproducible public artifact review.",
  website: "",
  turnstile_token: "synthetic-turnstile-one-use",
};
const url = "https://councilof.ai/api/contact";
function submit(env: any) {
  const request = new Request(url, {
    method: "POST",
    headers: { origin: "https://councilof.ai", "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return onRequestPost({ request, env } as any) as Promise<Response>;
}
function setupSiteverify(result: unknown = { success: true, hostname: "councilof.ai", action: "contact_enquiry" }) {
  vi.stubGlobal("fetch", vi.fn(async (input: unknown, init: any) => {
    expect(input).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const verification = new URLSearchParams(String(init.body));
    expect(verification.get("response")).toBe(data.turnstile_token);
    expect(verification.get("secret")).toBe("synthetic-secret-never-published");
    return Response.json(result);
  }));
}

describe("synthetic buyer -> protected KV -> operator receipt", () => {
  it("traces one verified stored snapshot to a real signed operator read, with no public PII", async () => {
    setupSiteverify();
    const { kv, entries } = makeStore();
    const env = {
      LEADS: kv,
      CONTACT_TURNSTILE_SECRET: "synthetic-secret-never-published",
      LEADS_OPERATOR_ACCESS_ISSUER: issuer,
      LEADS_OPERATOR_ACCESS_AUD: audience,
      LEADS_OPERATOR_EMAILS: "reviewer@example.org",
    };

    const submitted = await submit(env);
    expect(submitted.status).toBe(202);
    const acknowledgement: any = await submitted.json();
    expect(acknowledgement.stored).toBe(true);
    expect(acknowledgement.notification_state).toBe("NOT_SENT");
    expect(acknowledgement.receipt_id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(JSON.stringify(acknowledgement)).not.toContain(data.email);
    expect(kv.put).toHaveBeenCalledTimes(1);
    const [storedKey, rawRecord] = kv.put.mock.calls[0];
    expect(storedKey).toContain(acknowledgement.receipt_id);
    expect(rawRecord).not.toContain(data.turnstile_token);
    expect(rawRecord).not.toContain("synthetic-secret-never-published");
    expect(entries.size).toBe(1);

    const endpoint = "https://councilof.ai/api/private/contact-review";
    const unauth = await readContactReview(new Request(endpoint), env, publicKeySet);
    expect(unauth.status).toBe(401);
    expect(kv.list).not.toHaveBeenCalled();
    expect(kv.get).not.toHaveBeenCalled();

    const token = await signedOperatorToken();
    const auth = { "cf-access-jwt-assertion": token };
    const listed = await readContactReview(new Request(endpoint, { headers: auth }), env, publicKeySet);
    expect(listed.status).toBe(200);
    const pointers: any = await listed.json();
    expect(pointers.state).toBe("KEYS_ONLY");
    expect(pointers.keys).toEqual([storedKey]);
    expect(JSON.stringify(pointers)).not.toContain(data.email);
    expect(kv.list).toHaveBeenCalledWith({ prefix: "contact:", limit: 15 });

    const fetched = await readContactReview(
      new Request(endpoint + "?key=" + encodeURIComponent(storedKey), { headers: auth }), env, publicKeySet,
    );
    expect(fetched.status).toBe(200);
    expect(fetched.headers.get("cache-control")).toContain("no-store");
    const privateResult: any = await fetched.json();
    expect(privateResult.state).toBe("READ");
    expect(privateResult.record.email).toBe(data.email);
    expect(privateResult.record.message).toBe(data.message);
    expect(privateResult.record.notification_state).toBe("NOT_CONFIGURED");
    expect(privateResult.record.id).toBe(acknowledgement.receipt_id);
    expect(privateResult.record).not.toHaveProperty("turnstile_token");
  });

  it("does not persist or show a buyer record when Siteverify denies the challenge", async () => {
    setupSiteverify({ success: false, hostname: "councilof.ai", action: "contact_enquiry" });
    const { kv, entries } = makeStore();
    const env = { LEADS: kv, CONTACT_TURNSTILE_SECRET: "synthetic-secret-never-published" };
    const rejected = await submit(env);
    expect(rejected.status).toBe(403);
    expect((await rejected.json() as any).stored).toBe(false);
    expect(kv.put).not.toHaveBeenCalled();
    expect(entries.size).toBe(0);
  });
});
