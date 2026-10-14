/**
 * /api/auth/* — signed login on Cloudflare Pages (same-origin apex).
 *
 * NOT GCP. NOT api.csoai.org (never deployed). RunPod + Oracle stay for compute;
 * this function is the auth spine for Council OS / DSH.
 *
 * POST /api/auth/login    { email, password } -> { token, user }
 * POST /api/auth/register { email, password, name? } -> { token, user }
 * GET  /api/auth/me       Authorization: Bearer <token> -> { user, entitlements }
 *
 * There is no demo or shared login. Only registered users (SOV_ARENA_STATE KV) can sign in.
 */

import {
  type AuthEnv,
  type StoredUser,
  RESERVED_EMAILS,
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
      return json({ error: "account store write failed; no account or session was created" }, 503);
    }
    return json({ token, user: sessionUser });
  }

  if (method === "GET" && action === "me") {
    const h = ctx.request.headers.get("authorization") || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    const body = await verifyToken(ctx.env, token);
    if (!body) return json({ error: "invalid or expired token" }, 401);
    return json({
      user: { email: body.sub, name: body.name },
      entitlements: { paid: false, products: [] as string[], count: 0 },
    });
  }

  return json({ error: "not_found", path: `/api/auth/${action}` }, 404);
};
