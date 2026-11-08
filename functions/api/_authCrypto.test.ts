import { describe, expect, it, vi } from "vitest";
import { canonical, hashPassword, issueToken, verifyToken } from "./_authCrypto";
import { onRequest } from "./auth/[[path]]";

async function signingKey(): Promise<string> {
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  return Buffer.from(
    await crypto.subtle.exportKey("pkcs8", pair.privateKey),
  ).toString("base64");
}

async function signedClaims(
  keyBase64: string,
  claims: Record<string, unknown>,
): Promise<string> {
  const der = Uint8Array.from(atob(keyBase64), (character) =>
    character.charCodeAt(0),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "Ed25519" },
    false,
    ["sign"],
  );
  const payload = canonical(claims);
  const signature = new Uint8Array(
    await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(payload)),
  );
  const sig = btoa(String.fromCharCode(...signature));
  return btoa(JSON.stringify({ payload, sig }));
}

describe("Council OS auth tokens", () => {
  it("never issues or accepts an unsigned session", async () => {
    expect(
      await issueToken({}, { email: "person@example.test", name: "Person" }),
    ).toBeNull();

    const forged = btoa(
      JSON.stringify({
        alg: "UNSIGNED",
        sig: "",
        payload: JSON.stringify({
          schema: "csoai.auth-token/0.1",
          iss: "https://councilof.ai",
          aud: "council-os",
          sub: "attacker@example.test",
          name: "Attacker",
          iat: Date.now(),
          exp: Date.now() + 60_000,
        }),
      }),
    );
    expect(await verifyToken({}, forged)).toBeNull();
    expect(
      await verifyToken(
        { ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey() },
        forged,
      ),
    ).toBeNull();
  });

  it("round-trips only a scoped Ed25519-signed session", async () => {
    const env = { ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey() };
    const token = await issueToken(env, {
      email: "person@example.test",
      name: "Person",
    });
    expect(token).toBeTypeOf("string");
    expect(await verifyToken(env, token!)).toEqual({
      sub: "person@example.test",
      name: "Person",
    });

    const envelope = JSON.parse(atob(token!));
    envelope.payload = envelope.payload.replace(
      "person@example.test",
      "attacker@example.test",
    );
    expect(await verifyToken(env, btoa(JSON.stringify(envelope)))).toBeNull();
  });

  it("rejects signed sessions outside the schema, issuer, audience, or time bounds", async () => {
    const keyBase64 = await signingKey();
    const env = { ASSESS_SIGNING_KEY_PKCS8_B64: keyBase64 };
    const now = Date.now();
    const valid = {
      schema: "csoai.auth-token/0.1",
      iss: "https://councilof.ai",
      aud: "council-os",
      sub: "person@example.test",
      name: "Person",
      iat: now,
      exp: now + 60_000,
    };
    const invalidClaims = [
      { ...valid, schema: "attacker.auth-token/0.1" },
      { ...valid, iss: "https://attacker.example" },
      { ...valid, aud: "attacker-service" },
      { ...valid, iat: now - 120_000, exp: now - 1 },
      { ...valid, iat: now + 120_000, exp: now + 180_000 },
      { ...valid, exp: now + 30 * 86_400_000 + 1 },
    ];

    for (const claims of invalidClaims) {
      expect(
        await verifyToken(env, await signedClaims(keyBase64, claims)),
      ).toBeNull();
    }
  });

  it("rejects the retired demo credentials even with DEMO_LOGIN_ENABLED set", async () => {
    const get = vi.fn(async () => null);
    const response = await onRequest({
      params: { path: ["login"] },
      env: {
        ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey(),
        DEMO_LOGIN_ENABLED: "1",
        SOV_ARENA_STATE: { get, put: vi.fn() },
      },
      request: new Request("https://councilof.ai/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "demo@csoai.com", password: "demo123" }),
      }),
    } as never);
    expect(response.status).toBe(401);
    expect(await response.json()).not.toHaveProperty("token");
  });

  it("refuses to register the retired demo address", async () => {
    const put = vi.fn(async () => undefined);
    const response = await onRequest({
      params: { path: ["register"] },
      env: {
        ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey(),
        SOV_ARENA_STATE: { get: vi.fn(async () => null), put },
      },
      request: new Request("https://councilof.ai/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "Demo@CSOAI.com", password: "demo123" }),
      }),
    } as never);
    expect(response.status).toBe(409);
    expect(put).not.toHaveBeenCalled();
  });

  it("fails login closed when the session signing key is unavailable", async () => {
    const response = await onRequest({
      params: { path: ["login"] },
      env: { DEMO_LOGIN_ENABLED: "1" },
      request: new Request("https://councilof.ai/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "demo@csoai.com", password: "demo123" }),
      }),
    } as never);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "authentication signing is unavailable; no session was issued",
    });
  });

  it("does not create an account when no signed session can be issued", async () => {
    const get = vi.fn(async () => null);
    const put = vi.fn(async () => undefined);
    const response = await onRequest({
      params: { path: ["register"] },
      env: { SOV_ARENA_STATE: { get, put } },
      request: new Request("https://councilof.ai/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "person@example.test",
          password: "strong-password",
        }),
      }),
    } as never);
    expect(response.status).toBe(503);
    expect(get).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });
});

const SIGNING_UNAVAILABLE = {
  error: "authentication signing is unavailable; no session was issued",
};

function claimsFor(name: string, now = Date.now()) {
  return {
    schema: "csoai.auth-token/0.1",
    iss: "https://councilof.ai",
    aud: "council-os",
    sub: "person@example.test",
    name,
    iat: now,
    exp: now + 60_000,
  };
}

function registerRequest(env: Record<string, unknown>, email = "person@example.test") {
  return onRequest({
    params: { path: ["register"] },
    env,
    request: new Request("https://councilof.ai/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "strong-password", name: "Person" }),
    }),
  } as never);
}

const isAsciiWire = (token: string) => /^[\x00-\x7f]*$/.test(atob(token));

describe("auth foundation: Unicode-safe envelope", () => {
  it("still verifies independently built legacy Latin-1 envelopes exactly", async () => {
    const keyBase64 = await signingKey();
    const env = { ASSESS_SIGNING_KEY_PKCS8_B64: keyBase64 };
    for (const name of ["Person", "José", "Ã©"]) {
      const legacy = await signedClaims(keyBase64, claimsFor(name));
      expect(await verifyToken(env, legacy)).toEqual({ sub: "person@example.test", name });
    }
  });

  it("issues ASCII-only wire tokens for CJK, emoji, mixed Latin-1 + astral, and escapes", async () => {
    const env = { ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey() };
    const names = [
      "José",
      "Ã©",
      "山田太郎",
      "🙂 Person 🚀",
      "Zoë 𝔘𝔫𝔦 ẞ 😀",
      "literal \\u00e9 and \\ud83d",
      'quote " and \\ backslash',
      "line\nbreak\ttab",
    ];
    for (const name of names) {
      const token = await issueToken(env, { email: "person@example.test", name });
      expect(token).toBeTypeOf("string");
      expect(isAsciiWire(token!)).toBe(true);
      const envelope = JSON.parse(atob(token!));
      expect(JSON.parse(envelope.payload).name).toBe(name);
      expect(envelope.payload).toBe(canonical(JSON.parse(envelope.payload)));
      expect(await verifyToken(env, token!)).toEqual({ sub: "person@example.test", name });
    }
  });

  it("keeps ASCII-only tokens byte-identical to the previous wire format (frozen clock)", async () => {
    const keyBase64 = await signingKey();
    const env = { ASSESS_SIGNING_KEY_PKCS8_B64: keyBase64 };
    const now = 1_760_000_000_000;
    const spy = vi.spyOn(Date, "now").mockReturnValue(now);
    try {
      const token = await issueToken(env, { email: "person@example.test", name: "Person" });
      const expected = await signedClaims(keyBase64, {
        ...claimsFor("Person", now),
        exp: now + 30 * 86_400_000,
      });
      // Ed25519 is deterministic, so the same claims give the same bytes.
      expect(token).toBe(expected);
    } finally {
      spy.mockRestore();
    }
  });

  it("rejects Unicode tampering and out-of-scope issuers", async () => {
    const keyBase64 = await signingKey();
    const env = { ASSESS_SIGNING_KEY_PKCS8_B64: keyBase64 };
    const token = await issueToken(env, { email: "person@example.test", name: "山田太郎" });
    const envelope = JSON.parse(atob(token!));
    envelope.payload = envelope.payload.replace("山田", "田山");
    const tampered = btoa(JSON.stringify(envelope).replace(/[^\x00-\x7f]/g, (c) =>
      "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")));
    expect(await verifyToken(env, tampered)).toBeNull();
    for (const iss of ["https://api.csoai.org", "https://api-server.councilof.ai"]) {
      const forged = await signedClaims(keyBase64, { ...claimsFor("José"), iss });
      expect(await verifyToken(env, forged)).toBeNull();
    }
    const wrongAud = await signedClaims(keyBase64, { ...claimsFor("José"), aud: "api-server" });
    expect(await verifyToken(env, wrongAud)).toBeNull();
  });
});

describe("auth foundation: single issuance clock", () => {
  it("issues exactly a 30-day lifetime even when the clock advances during issuance", async () => {
    const env = { ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey() };
    let t = 1_760_000_000_000;
    const spy = vi.spyOn(Date, "now").mockImplementation(() => t++);
    try {
      const token = await issueToken(env, { email: "person@example.test", name: "Person" });
      const body = JSON.parse(JSON.parse(atob(token!)).payload);
      expect(body.exp - body.iat).toBe(30 * 86_400_000);
      expect(await verifyToken(env, token!)).toEqual({ sub: "person@example.test", name: "Person" });
    } finally {
      spy.mockRestore();
    }
  });
});

describe("auth foundation: register signs before it writes", () => {
  it("returns a deterministic 503 with zero KV writes for missing, malformed, or throwing signing", async () => {
    const cases: Array<[string, Record<string, unknown>, (() => void) | null]> = [
      ["missing", {}, null],
      ["malformed", { ASSESS_SIGNING_KEY_PKCS8_B64: "not-a-key" }, null],
      ["malformed-der", { ASSESS_SIGNING_KEY_PKCS8_B64: btoa("garbage-der-bytes") }, null],
      ["throwing-sign", { ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey() }, () => {
        vi.spyOn(crypto.subtle, "sign").mockRejectedValue(new Error("sign failed"));
      }],
    ];
    for (const [, env, arrange] of cases) {
      const put = vi.fn(async () => undefined);
      arrange?.();
      try {
        const response = await registerRequest({
          ...env,
          SOV_ARENA_STATE: { get: vi.fn(async () => null), put },
        });
        expect(response.status).toBe(503);
        expect(await response.json()).toEqual(SIGNING_UNAVAILABLE);
        expect(put).not.toHaveBeenCalled();
      } finally {
        vi.restoreAllMocks();
      }
    }
  });

  it("returns no token or success when the KV put fails", async () => {
    const put = vi.fn(async () => {
      throw new Error("kv write failed");
    });
    const response = await registerRequest({
      ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey(),
      SOV_ARENA_STATE: { get: vi.fn(async () => null), put },
    });
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).not.toHaveProperty("token");
    expect(body).not.toHaveProperty("user");
    expect(put).toHaveBeenCalledTimes(1);
  });

  it("registers a Unicode name with one awaited write and a verifiable ASCII token", async () => {
    const env = { ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey() };
    let settled = false;
    const rows=new Map<string,string>();
    const put = vi.fn(async(key:string,value:string) => {
      await new Promise((r) => setTimeout(r, 5));
      settled = true;
      rows.set(key,value);
    });
    const response = await onRequest({
      params: { path: ["register"] },
      env: { ...env, SOV_ARENA_STATE: { get: vi.fn(async(key:string) => rows.get(key)??null), put } },
      request: new Request("https://councilof.ai/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "person@example.test", password: "strong-password", name: "山田 🙂" }),
      }),
    } as never);
    expect(response.status).toBe(200);
    expect(settled).toBe(true);
    expect(put).toHaveBeenCalledTimes(1);
    const { token, user } = await response.json();
    expect(user).toEqual({ email: "person@example.test", name: "山田 🙂" });
    expect(isAsciiWire(token)).toBe(true);
    expect(await verifyToken(env,token)).toEqual({sub:"person@example.test",name:"山田 🙂",account_generation:expect.stringMatching(/^[a-f0-9]{64}$/)});
  });

  it("returns 503 without a token when the put records the account and then throws", async () => {
    const attempted: string[] = [];
    const put = vi.fn(async (key: string, value: string) => {
      attempted.push(key, value);
      throw new Error("kv write not confirmed");
    });
    const response = await registerRequest({
      ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey(),
      SOV_ARENA_STATE: { get: vi.fn(async () => null), put },
    });
    expect(attempted.length).toBe(2);
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).toEqual({ error: "account store write could not be confirmed; no session was returned" });
    expect(body).not.toHaveProperty("token");
    expect(body).not.toHaveProperty("user");
  });

  it("fails login with an exact 503 when the password matches but signing rejects", async () => {
    const salt = "fixturesalt";
    const pw = await hashPassword("strong-password", salt);
    const stored = { email: "person@example.test", name: "Person", salt, pw, created_at: "2026-10-14T00:00:00.000Z" };
    const put = vi.fn();
    const sign = vi.spyOn(crypto.subtle, "sign").mockRejectedValue(new Error("sign failed"));
    try {
      const response = await onRequest({
        params: { path: ["login"] },
        env: {
          ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey(),
          SOV_ARENA_STATE: { get: vi.fn(async () => JSON.stringify(stored)), put },
        },
        request: new Request("https://councilof.ai/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "person@example.test", password: "strong-password" }),
        }),
      } as never);
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual(SIGNING_UNAVAILABLE);
      expect(sign).toHaveBeenCalled();
      expect(put).not.toHaveBeenCalled();
    } finally {
      vi.restoreAllMocks();
    }
  });

  it("rejects a wrong password with exactly 401 and no token", async () => {
    const salt = "fixturesalt";
    const pw = await hashPassword("strong-password", salt);
    const stored = { email: "person@example.test", name: "Person", salt, pw, created_at: "2026-10-14T00:00:00.000Z" };
    const response = await onRequest({
      params: { path: ["login"] },
      env: {
        ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey(),
        SOV_ARENA_STATE: { get: vi.fn(async () => JSON.stringify(stored)), put: vi.fn() },
      },
      request: new Request("https://councilof.ai/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "person@example.test", password: "wrong-password" }),
      }),
    } as never);
    expect(response.status).toBe(401);
    expect(await response.json()).not.toHaveProperty("token");
  });
});

describe("legacy password login preserves one exact account incarnation without KV upgrade writes", () => {
  const email = "legacy-incarnation@example.test", password = "synthetic-strong-password";
  const requestFor = (action: string, body?: unknown, token?: string) => new Request(
    "https://councilof.ai/api/auth/" + action, {
      method: body === undefined ? "GET" : action === "profile" ? "PUT" : "POST",
      headers: { ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(token ? { authorization: "Bearer " + token } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const invoke = (env: unknown, action: string, body?: unknown, token?: string) =>
    onRequest({ params: { path: [action] }, env, request: requestFor(action, body, token) } as never);
  async function fixture(extra: Record<string, unknown> = {}) {
    const salt = "synthetic-incarnation-salt";
    const account = { email, name: "Original name", salt, pw: await hashPassword(password, salt),
      created_at: "2026-11-01T00:00:00.000Z", retained_unknown: { value: true }, ...extra };
    const original = JSON.stringify(account), rows = new Map([[email, original]]);
    const get = vi.fn(async () => rows.get(email) ?? null);
    const put = vi.fn(async (_key: string, raw: string) => { rows.set(email, raw); });
    const env = { ASSESS_SIGNING_KEY_PKCS8_B64: await signingKey(), SOV_ARENA_STATE: { get, put } };
    return { account, original, rows, get, put, env };
  }

  it("keeps a purchase commitment usable between two overlapping legacy logins without an upgrade write", async () => {
    const f = await fixture();
    const buyer = await import("./_buyer_purchase");
    const { buyerNonce } = await import("../../shared/buyerPurchase");
    let ready!: () => void, release!: (raw: string) => void, reads = 0;
    const secondCaptured = new Promise<void>(resolve => { ready = resolve; });
    f.get.mockImplementation(async () => {
      if (++reads === 2) {
        ready();
        return new Promise<string>(resolve => { release = resolve; });
      }
      return f.rows.get(email) ?? null;
    });
    f.put.mockRejectedValue(new Error("a login must not invoke an uncertain KV upgrade"));
    const first = invoke(f.env, "login", { email, password });
    const second = invoke(f.env, "login", { email, password });
    await secondCaptured;
    const firstResponse = await first;
    expect(firstResponse.status).toBe(200);
    const firstToken = (await firstResponse.json()).token;
    const purchaseRequest = new Request("https://councilof.ai/api/proof?bundle=1", {
      headers: { authorization: "Bearer " + firstToken },
    });
    const originalOwner = await buyer.currentBuyer(f.env, purchaseRequest);
    const commitment = await buyer.prepareBuyerRequest(originalOwner, purchaseRequest, purchaseRequest.url);
    release(f.original);
    const secondResponse = await second;
    expect(secondResponse.status).toBe(200);
    const secondToken = (await secondResponse.json()).token;
    const current = await buyer.currentBuyer(f.env, new Request(purchaseRequest.url, {
      headers: { authorization: "Bearer " + secondToken },
    }));
    expect(current).toEqual(originalOwner);
    expect(await buyerNonce(current.owner_hash, commitment.request, commitment.seed)).toBe(commitment.nonce);
    expect((await invoke(f.env, "me", undefined, firstToken)).status).toBe(200);
    expect(f.put).not.toHaveBeenCalled();
    expect(f.rows.get(email)).toBe(f.original);
  });

  it("never restores a former incarnation when its delayed login overlaps a same-email registration", async () => {
    const f = await fixture(), buyer = await import("./_buyer_purchase");
    let ready!: () => void, release!: (raw: string) => void, reads = 0;
    const captured = new Promise<void>(resolve => { ready = resolve; });
    f.get.mockImplementation(async () => {
      if (++reads === 1) {
        ready();
        return new Promise<string>(resolve => { release = resolve; });
      }
      return f.rows.get(email) ?? null;
    });
    const oldLogin = invoke(f.env, "login", { email, password });
    await captured;
    f.rows.delete(email); // Existing account deletion/recreation, not a login mutation.
    const registration = await invoke(f.env, "register", { email, password, name: "New incarnation" });
    expect(registration.status).toBe(200);
    const newToken = (await registration.json()).token, newRaw = f.rows.get(email)!;
    const newOwner = await buyer.currentBuyer(f.env, new Request("https://councilof.ai/api/proof", {
      headers: { authorization: "Bearer " + newToken },
    }));
    release(f.original);
    const stale = await oldLogin;
    expect(stale.status).toBe(200); // Its old snapshot cannot grant access to the current account.
    const oldToken = (await stale.json()).token;
    expect((await invoke(f.env, "me", undefined, oldToken)).status).toBe(401);
    await expect(buyer.currentBuyer(f.env, new Request("https://councilof.ai/api/proof", {
      headers: { authorization: "Bearer " + oldToken },
    }))).rejects.toThrow(/lifecycle changed/);
    expect(f.rows.get(email)).toBe(newRaw);
    expect(f.put).toHaveBeenCalledTimes(1); // Only the explicit new registration wrote.
    expect((await verifyToken(f.env, oldToken))?.account_generation).not.toBe(newOwner.generation);
  });

  it("keeps the legacy lifecycle through a normal profile-name edit", async () => {
    const f = await fixture(), buyer = await import("./_buyer_purchase");
    const login = await invoke(f.env, "login", { email, password });
    const token = (await login.json()).token;
    const bearer = new Request("https://councilof.ai/api/proof", { headers: { authorization: "Bearer " + token } });
    const before = await buyer.currentBuyer(f.env, bearer);
    const edit = await invoke(f.env, "profile", { name: "Changed name" }, token);
    expect(edit.status).toBe(200);
    expect((await invoke(f.env, "me", undefined, token)).status).toBe(200);
    expect(await buyer.currentBuyer(f.env, bearer)).toEqual(before);
    expect(JSON.parse(f.rows.get(email)!).account_generation).toBeUndefined();
    expect(f.put).toHaveBeenCalledTimes(1); // The requested profile write, never a login upgrade.
  });

  it.each([null, "invalid", "A".repeat(64)])("refuses an explicit malformed generation instead of deriving around it: %s", async generation => {
    const f = await fixture({ account_generation: generation });
    const response = await invoke(f.env, "login", { email, password });
    expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty("token");
    expect(f.put).not.toHaveBeenCalled();
    expect(f.rows.get(email)).toBe(f.original);
  });

  it("uses a valid stored generation without replacing it with a derived identity", async () => {
    const generation = "c".repeat(64), f = await fixture({ account_generation: generation });
    const response = await invoke(f.env, "login", { email, password });
    expect(response.status).toBe(200);
    expect((await verifyToken(f.env, (await response.json()).token))?.account_generation).toBe(generation);
    expect(f.put).not.toHaveBeenCalled();
    expect(f.rows.get(email)).toBe(f.original);
  });
});
