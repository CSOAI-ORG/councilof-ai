import { beforeAll, describe, expect, it, vi } from "vitest";
import { hashPassword, issueToken, userKey } from "../_authCrypto";
import { onRequest } from "./[[path]]";

const EMAIL = "owner@example.test";
const OTHER = "other@example.test";
let signingKeyBase64: string;

beforeAll(async () => {
  // Throwaway local signing fixture; no deployed key or external provider.
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  signingKeyBase64 = Buffer.from(
    await crypto.subtle.exportKey("pkcs8", pair.privateKey),
  ).toString("base64");
});

function storedAccount() {
  return {
    email: EMAIL,
    name: "Stored owner",
    salt: "fixture-salt",
    pw: "a".repeat(64),
    created_at: "2026-10-14T00:00:00.000Z",
    id: "existing-id",
    role: "existing-role",
    verified: false,
    custody: { mode: "existing", subject: EMAIL },
    entitlements: { paid: false, products: [] },
    future_field: { nested: [null, true, { keep: "exact value" }] },
  };
}

async function fixture(subject = EMAIL) {
  const account = storedAccount();
  const rows = new Map<string, string>([[userKey(EMAIL), JSON.stringify(account)]]);
  const get = vi.fn(async (key: string): Promise<string | null> => rows.get(key) ?? null);
  const put = vi.fn(async (key: string, value: string): Promise<void> => {
    rows.set(key, value);
  });
  const env = {
    ASSESS_SIGNING_KEY_PKCS8_B64: signingKeyBase64,
    SOV_ARENA_STATE: { get, put },
  };
  const token = await issueToken(
    { ASSESS_SIGNING_KEY_PKCS8_B64: signingKeyBase64 },
    { email: subject, name: "Old token name" },
  );
  if (!token) throw new Error("local signing fixture failed");
  return { env, account, rows, get, put, token };
}

function request(
  env: Record<string, unknown>,
  token: string,
  action = "profile",
  method = "GET",
  body?: BodyInit,
  extraHeaders: Record<string, string> = {},
  query = "",
) {
  const headers = {
    authorization: "Bearer " + token,
    ...(body === undefined ? {} : { "content-type": "application/json" }),
    ...extraHeaders,
  };
  return onRequest({
    params: { path: [action] },
    env,
    request: new Request("https://councilof.ai/api/auth/" + action + query, {
      method,
      headers,
      body,
    }),
  } as never);
}

async function putName(f: Awaited<ReturnType<typeof fixture>>, value: unknown) {
  return request(f.env, f.token, "profile", "PUT", JSON.stringify(value));
}

async function expectFailure(response: Response, status: number, unconfirmed = false) {
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const body = await response.json();
  expect(body).not.toHaveProperty("saved");
  expect(body).not.toHaveProperty("user");
  expect(body).not.toHaveProperty("token");
  if (unconfirmed) expect(body.state).toBe("write_unconfirmed");
  else expect(body).not.toHaveProperty("state");
}

describe("owner-only private profile API", () => {
  it("reopens the current stored name without leaking credentials or unknown fields", async () => {
    const f = await fixture();
    const response = await request(f.env, f.token);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      user: { email: EMAIL, name: "Stored owner" },
      visibility: "private",
    });
    expect(f.get.mock.calls).toEqual([[userKey(EMAIL)]]);
    expect(f.put).not.toHaveBeenCalled();
  });

  it("/me keeps its original response shape while reading the current owner record", async () => {
    const f = await fixture();
    f.rows.set(userKey(EMAIL), JSON.stringify({ ...f.account, name: "Changed after token issue" }));
    const response = await request(f.env, f.token, "me");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: { email: EMAIL, name: "Changed after token issue" },
      entitlements: { paid: false, products: [], count: 0 },
    });
    expect(f.get.mock.calls).toEqual([[userKey(EMAIL)]]);
    expect(f.put).not.toHaveBeenCalled();
  });

  it("rejects missing, malformed and tampered tokens before any account access", async () => {
    const f = await fixture();
    const envelope = JSON.parse(atob(f.token));
    envelope.payload = envelope.payload.replace(EMAIL, OTHER);
    const tampered = btoa(JSON.stringify(envelope));
    for (const token of ["", "not-a-token", tampered]) {
      await expectFailure(await request(f.env, token), 401);
      await expectFailure(await request(f.env, token, "profile", "PUT", '{"name":"New"}'), 401);
    }
    expect(f.get).not.toHaveBeenCalled();
    expect(f.put).not.toHaveBeenCalled();
  });

  it("derives the lookup only from the signed subject, ignoring a requested other owner", async () => {
    const f = await fixture(OTHER);
    await expectFailure(
      await request(f.env, f.token, "profile", "GET", undefined, {}, "?email=" + EMAIL),
      401,
    );
    await expectFailure(await putName(f, { name: "New", email: EMAIL }), 400);
    expect(f.get.mock.calls).toEqual([[userKey(OTHER)]]);
    expect(f.rows.get(userKey(EMAIL))).toBe(JSON.stringify(f.account));
    expect(f.put).not.toHaveBeenCalled();
  });

  it("fails both profile reads and /me closed without a usable store", async () => {
    for (const action of ["profile", "me"]) {
      const f = await fixture();
      await expectFailure(
        await request({ ASSESS_SIGNING_KEY_PKCS8_B64: signingKeyBase64 }, f.token, action),
        503,
      );
      f.get.mockRejectedValue(new Error("store unavailable"));
      await expectFailure(await request(f.env, f.token, action), 503);
      await expectFailure(await putName(f, { name: "New" }), 503);
      await expectFailure(await request(
        { ASSESS_SIGNING_KEY_PKCS8_B64: signingKeyBase64 }, f.token,
        "profile", "PUT", '{"name":"New"}',
      ), 503);
      expect(f.put).not.toHaveBeenCalled();
    }
  });

  it("never writes a missing, malformed, wrong-subject or incomplete stored account", async () => {
    const invalidRows: Array<[string | null, number]> = [
      [null, 401],
      ["", 503],
      ["not-json", 503],
      ["null", 503],
      ["[]", 503],
      [JSON.stringify({ ...storedAccount(), email: OTHER }), 503],
      [JSON.stringify({ ...storedAccount(), name: 12 }), 503],
      [JSON.stringify({ ...storedAccount(), salt: "" }), 503],
      [JSON.stringify({ ...storedAccount(), pw: "not-a-digest" }), 503],
      [JSON.stringify({ ...storedAccount(), created_at: "not-a-date" }), 503],
      [JSON.stringify(storedAccount()).replace('"future_field":', '"overflow":1e400,"future_field":'), 503],
    ];
    for (const [raw, status] of invalidRows) {
      const f = await fixture();
      f.get.mockResolvedValue(raw);
      await expectFailure(await request(f.env, f.token), status);
      await expectFailure(await request(f.env, f.token, "me"), status);
      await expectFailure(await putName(f, { name: "New" }), status);
      expect(f.put).not.toHaveBeenCalled();
    }
  });

  it("confirms a Unicode name only after the entire preserved record is read back", async () => {
    const f = await fixture();
    const response = await putName(f, { name: "  山田 🙂  " });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: { email: EMAIL, name: "山田 🙂" },
      visibility: "private",
      saved: true,
    });
    expect(f.put).toHaveBeenCalledTimes(1);
    expect(f.put.mock.calls[0][0]).toBe(userKey(EMAIL));
    expect(JSON.parse(f.put.mock.calls[0][1])).toEqual({ ...f.account, name: "山田 🙂" });
    expect(f.get.mock.calls).toEqual([[userKey(EMAIL)], [userKey(EMAIL)]]);

    // Reopen uses the server record even with the original token's old name.
    const reopened = await request(f.env, f.token);
    expect(await reopened.json()).toEqual({
      user: { email: EMAIL, name: "山田 🙂" },
      visibility: "private",
    });
  });

  it("accepts full-record semantic equality without requiring JSON key order", async () => {
    const f = await fixture();
    f.get.mockImplementation(async () => {
      if (f.get.mock.calls.length === 1) return JSON.stringify(f.account);
      const updated = JSON.parse(f.rows.get(userKey(EMAIL))!);
      return JSON.stringify(Object.fromEntries(Object.entries(updated).reverse()));
    });
    const response = await putName(f, { name: "New" });
    expect(response.status).toBe(200);
    expect(await response.json()).toHaveProperty("saved", true);
    expect(f.put).toHaveBeenCalledTimes(1);
  });

  it("rejects any protected or unknown input key rather than merging it", async () => {
    const f = await fixture();
    const protectedFields = {
      email: OTHER,
      id: "new-id",
      role: "admin",
      verified: true,
      custody: { mode: "new" },
      entitlements: { paid: true },
      salt: "new-salt",
      pw: "b".repeat(64),
      created_at: "2027-01-01T00:00:00.000Z",
      future_field: { replaced: true },
      schema: "new-schema",
      __proto__: null,
    };
    for (const [key, value] of Object.entries(protectedFields)) {
      await expectFailure(await putName(f, { name: "New", [key]: value }), 400);
    }
    // JSON can carry an own __proto__ key; it is also rejected.
    await expectFailure(
      await request(f.env, f.token, "profile", "PUT", '{"name":"New","__proto__":{"admin":true}}'),
      400,
    );
    expect(f.get).not.toHaveBeenCalled();
    expect(f.put).not.toHaveBeenCalled();
  });

  it("bounds names after trimming in UTF-16 units and refuses ASCII controls", async () => {
    for (const value of [null, [], {}, { name: 5 }, { name: "" }, { name: "   " },
      { name: "x".repeat(121) }, { name: "🙂".repeat(61) },
      { name: "line\nbreak" }, { name: "\tName" }, { name: "Name\u007f" }]) {
      const f = await fixture();
      await expectFailure(await putName(f, value), 400);
      expect(f.put).not.toHaveBeenCalled();
    }
    for (const name of ["x".repeat(120), "🙂".repeat(60)]) {
      const f = await fixture();
      const response = await putName(f, { name });
      expect(response.status).toBe(200);
      expect((await response.json()).user.name).toBe(name);
    }
  });

  it("bounds declared and actual JSON body bytes without trusting content-length", async () => {
    const f = await fixture();
    await expectFailure(
      await request(f.env, f.token, "profile", "PUT", '{"name":"New"}', { "content-length": "4097" }),
      413,
    );
    await expectFailure(
      await request(f.env, f.token, "profile", "PUT", '{"name":"New"}', { "content-length": "invalid" }),
      400,
    );
    await expectFailure(
      await request(f.env, f.token, "profile", "PUT", '{"name":"New"}' + " ".repeat(4096)),
      413,
    );
    await expectFailure(
      await request(f.env, f.token, "profile", "PUT", '{"name":"New"}' + " ".repeat(4096), { "content-length": "1" }),
      413,
    );
    expect(f.put).not.toHaveBeenCalled();
    const exact = '{"name":"New"}'.padEnd(4096, " ");
    const response = await request(f.env, f.token, "profile", "PUT", exact);
    expect(response.status).toBe(200);
    expect(f.put).toHaveBeenCalledTimes(1);
  });

  it("refuses wrong media types, malformed JSON and invalid UTF-8 before a write", async () => {
    const f = await fixture();
    await expectFailure(
      await request(f.env, f.token, "profile", "PUT", '{"name":"New"}', { "content-type": "text/plain" }),
      415,
    );
    await expectFailure(await request(f.env, f.token, "profile", "PUT", "{"), 400);
    await expectFailure(
      await request(f.env, f.token, "profile", "PUT", new Uint8Array([0xff, 0xfe])),
      400,
    );
    expect(f.put).not.toHaveBeenCalled();
  });

  it("fails a throwing body stream closed before any account write", async () => {
    const f = await fixture();
    const body = new ReadableStream<Uint8Array>({
      start(controller) { controller.error(new Error("body read failed")); },
    });
    // Node requires duplex for a stream fixture; the API itself uses standard Request.
    const streamed = new Request("https://councilof.ai/api/auth/profile", {
      method: "PUT",
      headers: { authorization: "Bearer " + f.token, "content-type": "application/json" },
      body,
      duplex: "half",
    } as RequestInit);
    const response = await onRequest({
      params: { path: ["profile"] }, env: f.env, request: streamed,
    } as never);
    await expectFailure(response, 400);
    expect(f.get).not.toHaveBeenCalled();
    expect(f.put).not.toHaveBeenCalled();
  });

  it("reports stale, absent, malformed, mismatched or throwing readback as write_unconfirmed", async () => {
    const readbacks: Array<string | null | Error> = [
      JSON.stringify(storedAccount()),
      null,
      "{",
      JSON.stringify({ ...storedAccount(), name: "New", email: OTHER }),
      JSON.stringify({ ...storedAccount(), name: "New", pw: "b".repeat(64) }),
      JSON.stringify({ ...storedAccount(), name: "New", future_field: { lost: true } }),
      new Error("readback failed"),
    ];
    for (const raw of readbacks) {
      const f = await fixture();
      f.get.mockImplementation(async () => {
        if (f.get.mock.calls.length === 1) return JSON.stringify(f.account);
        if (raw instanceof Error) throw raw;
        return raw;
      });
      await expectFailure(await putName(f, { name: "New" }), 503, true);
      expect(f.put).toHaveBeenCalledTimes(1);
      expect(f.get).toHaveBeenCalledTimes(2);
    }
  });

  it("reports an attempted put error as unconfirmed even when the write took effect", async () => {
    for (const commitBeforeThrow of [false, true]) {
      const f = await fixture();
      f.put.mockImplementation(async (key, value) => {
        if (commitBeforeThrow) f.rows.set(key, value);
        throw new Error("write result unknown");
      });
      await expectFailure(await putName(f, { name: "New" }), 503, true);
      expect(f.put).toHaveBeenCalledTimes(1);
      expect(f.get).toHaveBeenCalledTimes(1);
      expect(JSON.parse(f.rows.get(userKey(EMAIL))!).name).toBe(commitBeforeThrow ? "New" : f.account.name);
    }
  });

  it("keeps login/register signing-unavailable failures and wrong-password rejection", async () => {
    const f = await fixture();
    for (const action of ["login", "register"]) {
      const response = await request(
        { SOV_ARENA_STATE: f.env.SOV_ARENA_STATE },
        "",
        action,
        "POST",
        JSON.stringify({ email: EMAIL, password: "wrong-password" }),
      );
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        error: "authentication signing is unavailable; no session was issued",
      });
    }
    const salt = "fixture-password-salt";
    f.rows.set(userKey(EMAIL), JSON.stringify({
      ...f.account,
      salt,
      pw: await hashPassword("correct-password", salt),
    }));
    const response = await request(
      f.env, "", "login", "POST", JSON.stringify({ email: EMAIL, password: "wrong-password" }),
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "invalid credentials" });
    expect(f.put).not.toHaveBeenCalled();
  });
});
