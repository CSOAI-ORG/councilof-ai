/**
 * /api/auth/* — signed login on Cloudflare Pages (same-origin apex).
 *
 * NOT GCP. NOT api.csoai.org (never deployed). RunPod + Oracle stay for compute;
 * this function is the auth spine for Council OS / DSH.
 *
 * POST /api/auth/login    { email, password } -> { token, user }
 * POST /api/auth/register { email, password, name? } -> { token, user }
 * GET  /api/auth/me       Authorization: Bearer <token> -> { user, entitlements }
 * GET  /api/auth/profile  Authorization: Bearer <token> -> { user, visibility }
 * PUT  /api/auth/profile  { name } + Bearer token -> confirmed private profile
 *
 * There is no demo or shared login. Only registered users (SOV_ARENA_STATE KV) can sign in.
 */

import {
  type AuthEnv,
  type StoredUser,
  RESERVED_EMAILS,
  canonical,
  hashPassword,
  issueToken,
  verifyToken,
  userKey,
} from "../_authCrypto";

async function findUser(env: AuthEnv, email: string): Promise<StoredUser | null> {
  if (!env.SOV_ARENA_STATE) return null;
  const raw = await env.SOV_ARENA_STATE.get(userKey(email));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function authenticatedSession(
  env: AuthEnv,
  user: { email: string; name: string },
): Promise<Response> {
  const token = await signedSession(env, user);
  return token ? json({ token, user }) : signingUnavailable();
}

function signingUnavailable(): Response {
  return json({ error: "authentication signing is unavailable; no session was issued" }, 503);
}

/** Missing, malformed, or throwing signing material all mean: no session. */
async function signedSession(
  env: AuthEnv,
  user: { email: string; name: string },
): Promise<string | null> {
  try {
    return await issueToken(env, user);
  } catch {
    return null;
  }
}


type StoredAccount = StoredUser & Record<string, unknown>;
type OwnerResult = { account: StoredAccount; key: string } | { response: Response };

const MAX_PROFILE_BODY_BYTES = 4096;

function isJsonValue(value: unknown, depth = 0): boolean {
  if (depth > 64) return false;
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every((item) => isJsonValue(item, depth + 1));
  if (typeof value !== "object") return false;
  return Object.values(value).every((item) => isJsonValue(item, depth + 1));
}

/** Validate the existing StoredUser shape; do not invent a new account schema. */
function storedAccount(raw: string | null, subject: string): StoredAccount | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
    const row = value as Record<string, unknown>;
    if (
      row.email !== subject ||
      typeof row.name !== "string" ||
      typeof row.salt !== "string" ||
      row.salt.length === 0 ||
      typeof row.pw !== "string" ||
      !/^[a-f0-9]{64}$/i.test(row.pw) ||
      typeof row.created_at !== "string" ||
      !Number.isFinite(Date.parse(row.created_at)) ||
      !isJsonValue(row)
    ) return null;
    return row as StoredAccount;
  } catch {
    return null;
  }
}

async function signedSubject(env: AuthEnv, request: Request): Promise<string | Response> {
  const h = request.headers.get("authorization") || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  const body = await verifyToken(env, token);
  return body ? body.sub : json({ error: "invalid or expired token" }, 401);
}

/** The only lookup key comes from the verified token, never the request body. */
async function currentOwner(env: AuthEnv, subject: string): Promise<OwnerResult> {
  if (!env.SOV_ARENA_STATE) return { response: json({ error: "account store unavailable" }, 503) };
  const key = userKey(subject);
  try {
    const raw = await env.SOV_ARENA_STATE.get(key);
    if (raw === null) return { response: json({ error: "account unavailable" }, 401) };
    const account = storedAccount(raw, subject);
    return account
      ? { account, key }
      : { response: json({ error: "account store record is invalid" }, 503) };
  } catch {
    return { response: json({ error: "account store unavailable" }, 503) };
  }
}

async function profileName(request: Request): Promise<{ name: string } | { response: Response }> {
  const mediaType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (mediaType !== "application/json") {
    return { response: json({ error: "content-type must be application/json" }, 415) };
  }
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared)))) {
    return { response: json({ error: "invalid content-length" }, 400) };
  }
  if (declared !== null && Number(declared) > MAX_PROFILE_BODY_BYTES) {
    return { response: json({ error: "profile body is too large" }, 413) };
  }

  // Bound the actual stream too; content-length is not a trusted size limit.
  const reader = request.body?.getReader();
  if (!reader) return { response: json({ error: "body must be JSON" }, 400) };
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_PROFILE_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        return { response: json({ error: "profile body is too large" }, 413) };
      }
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const value: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return { response: json({ error: "only name may be updated" }, 400) };
    }
    const body = value as Record<string, unknown>;
    if (Object.keys(body).length !== 1 || typeof body.name !== "string") {
      return { response: json({ error: "only name may be updated" }, 400) };
    }
    const name = body.name.trim();
    if (/[\x00-\x1f\x7f]/.test(body.name) || name.length < 1 || name.length > 120) {
      return { response: json({ error: "name must be 1 to 120 characters without control characters" }, 400) };
    }
    return { name };
  } catch {
    return { response: json({ error: "body must be valid UTF-8 JSON" }, 400) };
  } finally {
    reader.releaseLock();
  }
}

function writeUnconfirmed(): Response {
  return json({
    error: "profile write could not be confirmed; reopen before retrying",
    state: "write_unconfirmed",
  }, 503);
}

export const onRequest: PagesFunction<AuthEnv> = async (ctx) => {
  const parts = ctx.params.path;
  const action = Array.isArray(parts) ? parts.join("/") : String(parts || "");
  const method = ctx.request.method;

  if (
    method === "POST" &&
    (action === "login" || action === "register") &&
    !ctx.env.ASSESS_SIGNING_KEY_PKCS8_B64
  )
    return json(
      {
        error: "authentication signing is unavailable; no session was issued",
      },
      503,
    );

  if (method === "POST" && action === "login") {
    let body: { email?: string; password?: string };
    try {
      body = await ctx.request.json();
    } catch {
      return json({ error: "body must be JSON" }, 400);
    }
    const email = String(body.email || "").toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) return json({ error: "email and password required" }, 400);

    if (RESERVED_EMAILS.has(email)) return json({ error: "invalid credentials" }, 401);

    const stored = await findUser(ctx.env, email);
    if (!stored || (await hashPassword(password, stored.salt)) !== stored.pw) {
      return json({ error: "invalid credentials" }, 401);
    }
    return authenticatedSession(ctx.env, {
      email: stored.email,
      name: stored.name,
    });
  }

  if (method === "POST" && action === "register") {
    let body: { email?: string; password?: string; name?: string };
    try {
      body = await ctx.request.json();
    } catch {
      return json({ error: "body must be JSON" }, 400);
    }
    const email = String(body.email || "").toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "");
    if (!email || !password) return json({ error: "email and password required" }, 400);
    if (password.length < 6) return json({ error: "password must be >= 6 chars" }, 400);
    if (RESERVED_EMAILS.has(email)) return json({ error: "account reserved" }, 409);

    const existing = await findUser(ctx.env, email);
    if (existing) return json({ error: "account already exists" }, 409);

    const salt = crypto.randomUUID().replace(/-/g, "");
    const user: StoredUser = {
      email,
      name: name || email.split("@")[0],
      salt,
      pw: await hashPassword(password, salt),
      created_at: new Date().toISOString(),
    };
    if (!ctx.env.SOV_ARENA_STATE) return json({ error: "store unavailable" }, 503);
    const sessionUser = { email: user.email, name: user.name };
    // Sign first: if no valid session can be issued, nothing is written.
    const token = await signedSession(ctx.env, sessionUser);
    if (!token) return signingUnavailable();
    // KV is eventually consistent; this is not an atomic uniqueness check and
    // there is no rollback. A failed write returns no token and no success.
    try {
      await ctx.env.SOV_ARENA_STATE.put(userKey(user.email), JSON.stringify(user));
    } catch {
      return json({ error: "account store write could not be confirmed; no session was returned" }, 503);
    }
    return json({ token, user: sessionUser });
  }

  if (
    (method === "GET" && (action === "me" || action === "profile")) ||
    (method === "PUT" && action === "profile")
  ) {
    const subject = await signedSubject(ctx.env, ctx.request);
    if (subject instanceof Response) return subject;

    const input = method === "PUT" ? await profileName(ctx.request) : null;
    if (input && "response" in input) return input.response;
    const owner = await currentOwner(ctx.env, subject);
    if ("response" in owner) return owner.response;
    const user = { email: owner.account.email, name: owner.account.name };

    if (method === "GET") {
      return action === "profile"
        ? json({ user, visibility: "private" })
        : json({
            user,
            entitlements: { paid: false, products: [] as string[], count: 0 },
          });
    }

    // Preserve credentials and every unknown JSON field; only name can change.
    if (!input || !("name" in input)) return json({ error: "name required" }, 400);
    const updated: StoredAccount = { ...owner.account, name: input.name };
    const expected = canonical(updated);
    // KV is eventually consistent, with no CAS or rollback here. One write and
    // one matching full-record readback confirm only what this request observed.
    // A stale read or any attempted-write error must not invite a blind retry.
    try {
      await ctx.env.SOV_ARENA_STATE!.put(owner.key, JSON.stringify(updated));
      const readback = storedAccount(await ctx.env.SOV_ARENA_STATE!.get(owner.key), subject);
      if (!readback || canonical(readback) !== expected) return writeUnconfirmed();
    } catch {
      return writeUnconfirmed();
    }
    return json({
      user: { email: updated.email, name: updated.name },
      visibility: "private",
      saved: true,
    });
  }

  return json({ error: "not_found", path: `/api/auth/${action}` }, 404);
};
