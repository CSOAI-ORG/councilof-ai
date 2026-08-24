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
 * demo@csoai.com / demo123 always works. Registered users persist in SOV_ARENA_STATE KV.
 */

import {
  type AuthEnv,
  type StoredUser,
  DEMO_USER,
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

async function saveUser(env: AuthEnv, user: StoredUser): Promise<boolean> {
  if (!env.SOV_ARENA_STATE) return false;
  await env.SOV_ARENA_STATE.put(userKey(user.email), JSON.stringify(user));
  return true;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export const onRequest: PagesFunction<AuthEnv> = async (ctx) => {
  const parts = ctx.params.path;
  const action = Array.isArray(parts) ? parts.join("/") : String(parts || "");
  const method = ctx.request.method;

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

    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      const user = { email: DEMO_USER.email, name: DEMO_USER.name };
      return json({ token: await issueToken(ctx.env, user), user });
    }

    const stored = await findUser(ctx.env, email);
    if (!stored || (await hashPassword(password, stored.salt)) !== stored.pw) {
      return json({ error: "invalid credentials" }, 401);
    }
    return json({
      token: await issueToken(ctx.env, { email: stored.email, name: stored.name }),
      user: { email: stored.email, name: stored.name },
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
    if (email === DEMO_USER.email) return json({ error: "account reserved" }, 409);

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
    if (!(await saveUser(ctx.env, user))) {
      return json({ error: "store unavailable" }, 503);
    }
    return json({
      token: await issueToken(ctx.env, { email: user.email, name: user.name }),
      user: { email: user.email, name: user.name },
    });
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
