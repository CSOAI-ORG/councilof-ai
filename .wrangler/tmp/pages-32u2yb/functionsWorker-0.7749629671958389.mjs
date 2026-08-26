var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-9IoUiq/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// api/arena/rounds.js
async function onRequestGet(context) {
  const target = new URL("/api/arena/rounds.jsonl", context.request.url);
  const res = await fetch(target, {
    headers: { accept: context.request.headers.get("accept") || "*/*" }
  });
  const headers = new Headers(res.headers);
  if (!headers.get("content-type")) {
    headers.set("content-type", "application/x-ndjson");
  }
  headers.set("cache-control", headers.get("cache-control") || "public, max-age=30");
  headers.set("x-arena-alias", "rounds\u2192rounds.jsonl");
  return new Response(res.body, { status: res.status, headers });
}
__name(onRequestGet, "onRequestGet");

// api/sov-arena/rounds.jsonl.js
async function onRequestGet2({ env }) {
  if (!env.SOV_ARENA_STATE) {
    return new Response(
      JSON.stringify({
        error: "no live rounds",
        detail: "KV binding SOV_ARENA_STATE is not visible to this function (deployment config)",
        label: "DESIGN"
      }),
      { status: 503, headers: { "content-type": "application/json", "cache-control": "no-store" } }
    );
  }
  const body = await env.SOV_ARENA_STATE.get("rounds.jsonl");
  if (!body) {
    return new Response(
      JSON.stringify({
        error: "no live rounds",
        detail: "KV bound but key rounds.jsonl is empty \u2014 the fleet arena has not synced yet",
        label: "DESIGN"
      }),
      { status: 503, headers: { "content-type": "application/json", "cache-control": "no-store" } }
    );
  }
  return new Response(body, {
    headers: {
      "content-type": "application/x-ndjson",
      "cache-control": "public, max-age=30",
      "x-sov-arena-source": "oracle-micro-2 sov_arena.py, DESIGN LAB"
    }
  });
}
__name(onRequestGet2, "onRequestGet");

// api/arena/scoreboard.ts
function canonize(o) {
  if (Array.isArray(o))
    return "[" + o.map(canonize).join(",") + "]";
  if (o && typeof o === "object") {
    const obj = o;
    return "{" + Object.keys(obj).sort().map((k) => JSON.stringify(k) + ":" + canonize(obj[k])).join(",") + "}";
  }
  if (typeof o === "number") {
    if (Number.isInteger(o))
      return String(o);
    const s = o.toString();
    return s.includes(".") ? s : s + ".0";
  }
  return JSON.stringify(o);
}
__name(canonize, "canonize");
async function onRequestGet3({ request }) {
  const url = new URL(request.url);
  const wantVerify = url.searchParams.get("verify") === "1";
  const target = new URL("/signed/arena_scoreboard.json", request.url);
  const res = await fetch(target, { headers: { accept: "application/json" } });
  if (!res.ok || !res.body) {
    return new Response(
      JSON.stringify({ error: "no signed scoreboard", detail: "signed feed not present" }),
      { status: 503, headers: { "content-type": "application/json", "cache-control": "no-store" } }
    );
  }
  let board;
  try {
    board = await res.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "corrupt scoreboard", detail: "signed feed not JSON" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
  if (wantVerify && board.signature) {
    const body = Object.fromEntries(Object.entries(board).filter(([k]) => k !== "signature"));
    const canonical4 = canonize(body);
    const cid = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical4));
    const hex3 = [...new Uint8Array(cid)].map((b) => b.toString(16).padStart(2, "0")).join("");
    return new Response(JSON.stringify({
      content_id: hex3,
      expected: board.signature.content_id,
      match: hex3 === board.signature.content_id,
      kid: board.signature.kid,
      note: "signature over the did:web:csoai.org key must also be checked against the published key; this recomputes the content hash only"
    }), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
  return new Response(JSON.stringify(board), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "public, max-age=300" }
  });
}
__name(onRequestGet3, "onRequestGet");

// api/assess/key.ts
var onRequestGet4 = /* @__PURE__ */ __name(async (ctx) => {
  const b64 = ctx.env.ASSESS_SIGNING_KEY_PKCS8_B64;
  if (!b64) {
    return Response.json(
      { error: "no signing key provisioned \u2014 assessments are currently issued UNSIGNED" },
      { status: 404 }
    );
  }
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
  const jwk = await crypto.subtle.exportKey("jwk", key);
  return Response.json(
    {
      kid: "assess-2026-07",
      alg: "Ed25519",
      pub_jwk_x: jwk.x,
      how_to_verify: "signature = Ed25519(sig) over the exact `signed_payload` string (canonical JSON, sorted keys, no whitespace). Verify with any Ed25519 library against pub_jwk_x (base64url raw public key)."
    },
    { headers: { "cache-control": "public, max-age=3600" } }
  );
}, "onRequestGet");

// api/corpus-watch/status.ts
var BEACON_TTL_SECONDS = 60;
var FALLBACK = {
  started_at: "2026-08-01T13:27:15.708553+00:00",
  finished_at: "2026-08-01T13:27:21.159740+00:00",
  normaliser: "norm-v2",
  instruments: [
    { id: "EU-AI-ACT", label: "EU AI Act (Regulation (EU) 2024/1689)", jurisdiction: "EU", provisions: 113, status: "baseline_seeded" },
    { id: "EU-CRA", label: "EU Cyber Resilience Act (Regulation (EU) 2024/2847)", jurisdiction: "EU", provisions: 71, status: "baseline_seeded" },
    { id: "EU-DORA", label: "DORA (Regulation (EU) 2022/2554)", jurisdiction: "EU", provisions: 68, status: "baseline_seeded" },
    { id: "EU-NIS2", label: "NIS2 Directive ((EU) 2022/2555)", jurisdiction: "EU", provisions: 48, status: "baseline_seeded" },
    { id: "UK-GDPR", label: "UK GDPR (retained Regulation (EU) 2016/679)", jurisdiction: "UK", provisions: 99, status: "baseline_seeded" }
  ],
  drift_events: 0,
  unknown: 0,
  total_provisions: 399
};
function isWatchStatus(s) {
  if (!s || typeof s !== "object")
    return false;
  const o = s;
  return Array.isArray(o["instruments"]) && typeof o["normaliser"] === "string" && typeof o["total_provisions"] === "number";
}
__name(isWatchStatus, "isWatchStatus");
async function readKV(env) {
  if (!env.CORPUS_WATCH_STATUS)
    return null;
  try {
    const v = await env.CORPUS_WATCH_STATUS.get("latest", { type: "json" });
    if (!v || !isWatchStatus(v))
      return null;
    return v;
  } catch {
    return null;
  }
}
__name(readKV, "readKV");
function envelope(live) {
  const issued_at = (/* @__PURE__ */ new Date()).toISOString();
  const chosen = live ?? FALLBACK;
  return {
    issued_at,
    served_fresh: live !== null,
    fallback_used: live === null,
    baseline_seed: FALLBACK,
    heartbeat: {
      ...chosen,
      artifact_uri: "https://github.com/CSOAI-ORG/corpus-watch/blob/main/reports/status.json"
    }
  };
}
__name(envelope, "envelope");
var onRequestGet5 = /* @__PURE__ */ __name(async (ctx) => {
  const live = await readKV(ctx.env);
  const body = envelope(live);
  return Response.json(body, {
    status: 200,
    headers: {
      "Cache-Control": `public, max-age=${BEACON_TTL_SECONDS}`,
      "X-Corpus-Watch-Fallback": live === null ? "true" : "false",
      // Pages-Function-friendly: never expose the underlying source as anonymous.
      "X-Content-Type-Options": "nosniff"
    }
  });
}, "onRequestGet");

// api/dashboard/stats.ts
var onRequestGet6 = /* @__PURE__ */ __name(async ({ request }) => {
  const origin = new URL(request.url).origin;
  const u = /* @__PURE__ */ __name((p) => new URL(p, origin).toString(), "u");
  const [gspcRes, cardsRes, fleetRes, receiptsRes] = await Promise.all([
    fetch(u("/api/gspc"), { headers: { accept: "application/json" } }),
    fetch(u("/api/cards"), { headers: { accept: "application/json" } }),
    fetch(u("/api/oracle-fleet"), { headers: { accept: "application/json" } }),
    fetch(u("/api/receipts/latest"), { headers: { accept: "application/json" } })
  ]);
  const gspc = gspcRes.ok ? await gspcRes.json().catch(() => null) : null;
  const cards = cardsRes.ok ? await cardsRes.json().catch(() => null) : null;
  const fleet = fleetRes.ok ? await fleetRes.json().catch(() => null) : null;
  const receipts = receiptsRes.ok ? await receiptsRes.json().catch(() => null) : null;
  const measuredAxes = gspc?.totals?.measured_axes ?? 0;
  const quotableAxes = gspc?.totals?.quotable_axes ?? 0;
  const signedCards = cards?.cards?.signed ?? cards?.signed ?? 0;
  const cardCount = cards?.cards?.count ?? cards?.count ?? 0;
  const fleetOnline = fleet && typeof fleet === "object" && !("error" in fleet) ? fleet.online ?? (fleet.nodes?.length ?? 0) : 0;
  return Response.json(
    {
      schema: "csoai.dashboard.stats/0.1",
      source: "pages-functions",
      complianceScore: null,
      totalSystems: 0,
      pendingReviews: 0,
      trend: [],
      gspc: {
        measured_axes: measuredAxes,
        quotable_axes: quotableAxes,
        public_count: gspc?.totals?.public_count ?? null,
        separated_leads: gspc?.totals?.separated_leads ?? null
      },
      cards: { count: cardCount, signed: signedCards },
      fleet: { online: fleetOnline, raw: fleet?.error ? { status: "offline" } : fleet },
      receipts: { status: receipts?.status ?? "unknown", count: receipts?.count ?? 0 },
      council: {
        totalSessions: measuredAxes,
        pendingReview: Math.max(0, quotableAxes - measuredAxes),
        consensusReached: gspc?.totals?.separated_leads ?? 0
      },
      watchdog: { count: 0, reports: [] },
      pdca: {
        totalCycles: measuredAxes > 0 ? 1 : 0,
        activeCycles: measuredAxes > 0 ? 1 : 0,
        completedCycles: 0,
        pausedCycles: 0,
        phaseDistribution: {
          plan: measuredAxes > 0 ? 1 : 0,
          do: signedCards > 0 ? 1 : 0,
          check: fleetOnline > 0 ? 1 : 0,
          act: 0
        }
      },
      loi: { total: 0, count: 0 },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=30"
      }
    }
  );
}, "onRequestGet");

// api/evidence/github.ts
var onRequestGet7 = /* @__PURE__ */ __name(async (ctx) => {
  const url = new URL(ctx.request.url);
  const owner = url.searchParams.get("owner");
  const repo = url.searchParams.get("repo");
  if (!owner || !repo) {
    return Response.json({ error: "owner and repo are required" }, { status: 400 });
  }
  const token = ctx.env.GITHUB_TOKEN || "";
  const headers = {
    "User-Agent": "csoai-pages-function/1.0",
    Accept: "application/vnd.github+json"
  };
  if (token)
    headers.Authorization = `Bearer ${token}`;
  try {
    const r = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=20`,
      { headers }
    );
    if (!r.ok) {
      return Response.json(
        { error: `github ${r.status}`, evidence: [] },
        { status: r.status === 403 ? 429 : 502 }
      );
    }
    const commits = await r.json();
    return Response.json({
      evidence: commits.map((c) => ({
        sha: c.sha.slice(0, 12),
        date: c.commit.author.date,
        message: c.commit.message.split("\n")[0].slice(0, 200),
        author: c.commit.author.name
      })),
      rateLimit: {
        remaining: r.headers.get("x-ratelimit-remaining"),
        limit: r.headers.get("x-ratelimit-limit")
      }
    });
  } catch (e) {
    return Response.json(
      { error: "github unreachable", detail: e?.message ?? "unknown" },
      { status: 502 }
    );
  }
}, "onRequestGet");

// api/receipts/latest.ts
var onRequestGet8 = /* @__PURE__ */ __name(async () => {
  return Response.json(
    {
      schema: "csoai.receipts.latest/0.1",
      status: "UNPUBLISHED",
      items: [],
      count: 0,
      note: "No settlement receipts are published on this surface yet. See csoai-x402-receipt-mcp on GitHub for the signed receipt lane.",
      endpoints: {
        ledger: "/api/mcp",
        gspc: "/api/gspc",
        assess: "/api/assess"
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=60"
      }
    }
  );
}, "onRequestGet");

// api/sov-town/state.jsonl.ts
var onRequestGet9 = /* @__PURE__ */ __name(async ({ env }) => {
  if (!env.SOV_TOWN_STATE) {
    return new Response(
      JSON.stringify({ error: "no live state", detail: "KV binding SOV_TOWN_STATE is not visible to this function (deployment config)", label: "DESIGN" }),
      { status: 503, headers: { "content-type": "application/json", "cache-control": "no-store" } }
    );
  }
  const body = await env.SOV_TOWN_STATE.get("state.jsonl");
  if (!body) {
    return new Response(
      JSON.stringify({ error: "no live state", detail: "KV bound but key state.jsonl is empty \u2014 the oracle tick has not synced yet", label: "DESIGN" }),
      { status: 503, headers: { "content-type": "application/json", "cache-control": "no-store" } }
    );
  }
  return new Response(body, {
    headers: {
      "content-type": "application/x-ndjson",
      "cache-control": "public, max-age=60",
      "x-sov-town-source": "micropolisj engine, 5-min tick, DESIGN LAB"
    }
  });
}, "onRequestGet");

// api/agui/[[path]].ts
var DEFAULT_WIRE = "http://127.0.0.1:8785";
var onRequest = /* @__PURE__ */ __name(async (ctx) => {
  const base = (ctx.env.AGUI_WIRE_URL || DEFAULT_WIRE).replace(/\/$/, "");
  const sub = Array.isArray(ctx.params.path) ? ctx.params.path.join("/") : "";
  const url = new URL(ctx.request.url);
  const target = `${base}/${sub}${url.search}`;
  if (!ctx.env.AGUI_WIRE_URL && ctx.request.method !== "OPTIONS") {
    return Response.json(
      {
        error: "agui_wire_unconfigured",
        hint: "Set AGUI_WIRE_URL on Cloudflare Pages to the RunPod AG-UI wire (port 8785).",
        path: `/api/agui/${sub}`
      },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }
  try {
    const headers = new Headers(ctx.request.headers);
    headers.delete("host");
    const upstream = await fetch(target, {
      method: ctx.request.method,
      headers,
      body: ctx.request.method === "GET" || ctx.request.method === "HEAD" ? void 0 : ctx.request.body,
      redirect: "manual"
    });
    const out = new Headers(upstream.headers);
    out.set("access-control-allow-origin", "*");
    out.set("cache-control", "no-store");
    return new Response(upstream.body, { status: upstream.status, headers: out });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return Response.json(
      { error: "agui_upstream_unavailable", detail, target },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  }
}, "onRequest");

// api/_authCrypto.ts
var TOKEN_TTL_MS = 30 * 864e5;
function canonical(o) {
  if (o === null || typeof o !== "object")
    return JSON.stringify(o);
  if (Array.isArray(o))
    return "[" + o.map(canonical).join(",") + "]";
  const rec = o;
  return "{" + Object.keys(rec).sort().map((k) => JSON.stringify(k) + ":" + canonical(rec[k])).join(",") + "}";
}
__name(canonical, "canonical");
var hex = /* @__PURE__ */ __name((buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""), "hex");
async function verifyKey(env) {
  const b64 = env.ASSESS_SIGNING_KEY_PKCS8_B64;
  if (!b64)
    return null;
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const priv = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
  const jwk = await crypto.subtle.exportKey("jwk", priv);
  if (!jwk.x)
    return null;
  return crypto.subtle.importKey(
    "jwk",
    { kty: "OKP", crv: "Ed25519", x: jwk.x },
    { name: "Ed25519" },
    true,
    ["verify"]
  );
}
__name(verifyKey, "verifyKey");
async function hashPassword(pw, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 1e5, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return hex(bits);
}
__name(hashPassword, "hashPassword");
async function issueToken(env, user) {
  const body = { sub: user.email, name: user.name || "", iat: Date.now(), exp: Date.now() + TOKEN_TTL_MS };
  const payload = canonical(body);
  const b64 = env.ASSESS_SIGNING_KEY_PKCS8_B64;
  if (!b64) {
    return btoa(JSON.stringify({ payload, sig: "", alg: "UNSIGNED" }));
  }
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
  const sigBytes = await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(payload));
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
  return btoa(JSON.stringify({ payload, sig }));
}
__name(issueToken, "issueToken");
async function verifyToken(env, token) {
  try {
    const parsed = JSON.parse(atob(token));
    if (parsed.alg === "UNSIGNED") {
      const body2 = JSON.parse(parsed.payload);
      if (body2.exp < Date.now())
        return null;
      return { sub: body2.sub, name: body2.name };
    }
    const b64 = env.ASSESS_SIGNING_KEY_PKCS8_B64;
    if (!b64 || !parsed.sig)
      return null;
    const key = await verifyKey(env);
    if (!key)
      return null;
    const sigBytes = Uint8Array.from(atob(parsed.sig), (c) => c.charCodeAt(0));
    const ok = await crypto.subtle.verify("Ed25519", key, sigBytes, new TextEncoder().encode(parsed.payload));
    if (!ok)
      return null;
    const body = JSON.parse(parsed.payload);
    if (body.exp < Date.now())
      return null;
    return { sub: body.sub, name: body.name };
  } catch {
    return null;
  }
}
__name(verifyToken, "verifyToken");
var DEMO_USER = {
  email: "demo@csoai.com",
  password: "demo123",
  name: "Demo User"
};
function userKey(email) {
  return `auth:user:${String(email).toLowerCase()}`;
}
__name(userKey, "userKey");

// api/auth/[[path]].ts
async function findUser(env, email) {
  if (!env.SOV_ARENA_STATE)
    return null;
  const raw = await env.SOV_ARENA_STATE.get(userKey(email));
  if (!raw)
    return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
__name(findUser, "findUser");
async function saveUser(env, user) {
  if (!env.SOV_ARENA_STATE)
    return false;
  await env.SOV_ARENA_STATE.put(userKey(user.email), JSON.stringify(user));
  return true;
}
__name(saveUser, "saveUser");
function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
__name(json, "json");
var onRequest2 = /* @__PURE__ */ __name(async (ctx) => {
  const parts = ctx.params.path;
  const action = Array.isArray(parts) ? parts.join("/") : String(parts || "");
  const method = ctx.request.method;
  if (method === "POST" && action === "login") {
    let body;
    try {
      body = await ctx.request.json();
    } catch {
      return json({ error: "body must be JSON" }, 400);
    }
    const email = String(body.email || "").toLowerCase();
    const password = String(body.password || "");
    if (!email || !password)
      return json({ error: "email and password required" }, 400);
    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      const user = { email: DEMO_USER.email, name: DEMO_USER.name };
      return json({ token: await issueToken(ctx.env, user), user });
    }
    const stored = await findUser(ctx.env, email);
    if (!stored || await hashPassword(password, stored.salt) !== stored.pw) {
      return json({ error: "invalid credentials" }, 401);
    }
    return json({
      token: await issueToken(ctx.env, { email: stored.email, name: stored.name }),
      user: { email: stored.email, name: stored.name }
    });
  }
  if (method === "POST" && action === "register") {
    let body;
    try {
      body = await ctx.request.json();
    } catch {
      return json({ error: "body must be JSON" }, 400);
    }
    const email = String(body.email || "").toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "");
    if (!email || !password)
      return json({ error: "email and password required" }, 400);
    if (password.length < 6)
      return json({ error: "password must be >= 6 chars" }, 400);
    if (email === DEMO_USER.email)
      return json({ error: "account reserved" }, 409);
    const existing = await findUser(ctx.env, email);
    if (existing)
      return json({ error: "account already exists" }, 409);
    const salt = crypto.randomUUID().replace(/-/g, "");
    const user = {
      email,
      name: name || email.split("@")[0],
      salt,
      pw: await hashPassword(password, salt),
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!await saveUser(ctx.env, user)) {
      return json({ error: "store unavailable" }, 503);
    }
    return json({
      token: await issueToken(ctx.env, { email: user.email, name: user.name }),
      user: { email: user.email, name: user.name }
    });
  }
  if (method === "GET" && action === "me") {
    const h2 = ctx.request.headers.get("authorization") || "";
    const token = h2.startsWith("Bearer ") ? h2.slice(7) : "";
    const body = await verifyToken(ctx.env, token);
    if (!body)
      return json({ error: "invalid or expired token" }, 401);
    return json({
      user: { email: body.sub, name: body.name },
      entitlements: { paid: false, products: [], count: 0 }
    });
  }
  return json({ error: "not_found", path: `/api/auth/${action}` }, 404);
}, "onRequest");

// api/worker/[[path]].ts
var WORKER_URL = "https://csoai-gspc-api.nicholastempleman.workers.dev";
var onRequest3 = /* @__PURE__ */ __name(async (ctx) => {
  const url = new URL(ctx.request.url);
  const path = url.pathname.replace("/api/worker", "/api");
  const target = `${WORKER_URL}${path}${url.search}`;
  try {
    const upstream = await fetch(target, {
      headers: { Accept: "application/json" },
      cf: { cacheTtl: 30, cacheEverything: false }
    });
    const data = await upstream.json();
    return Response.json(data, {
      status: upstream.status,
      headers: { "cache-control": "public, max-age=30" }
    });
  } catch (e) {
    return Response.json(
      { error: "ledger upstream unavailable", detail: e?.message ?? "unknown" },
      { status: 502 }
    );
  }
}, "onRequest");

// api/_chatCanon.ts
async function loadBoard(origin) {
  try {
    const r = await fetch(new URL("/api/gspc", origin).toString());
    if (!r.ok)
      return { axes: [], totals: {}, jail_floor: null };
    const j = await r.json();
    return {
      axes: Array.isArray(j?.axes) ? j.axes : [],
      totals: j?.totals && typeof j.totals === "object" ? j.totals : {},
      jail_floor: j?.jail_floor ?? null
    };
  } catch {
    return { axes: [], totals: {}, jail_floor: null };
  }
}
__name(loadBoard, "loadBoard");
async function loadAxes(origin) {
  return (await loadBoard(origin)).axes;
}
__name(loadAxes, "loadAxes");
function isJailAxis(a) {
  const n = String(a?.axis ?? "").toLowerCase();
  return n === "jail" || n === "jail_floor";
}
__name(isJailAxis, "isJailAxis");
function boardCanon(board) {
  const axes = board.axes ?? [];
  const jail = board.jail_floor ?? axes.find(isJailAxis) ?? null;
  const measuredAxes = axes.filter(
    (a) => a.status === "MEASURED" && Number(a.n) > 0
  );
  const quotable = typeof board.totals.quotable_axes === "number" ? board.totals.quotable_axes : typeof board.totals.axes === "number" ? board.totals.axes : axes.length || 14;
  const measured = typeof board.totals.measured_axes === "number" ? board.totals.measured_axes : measuredAxes.length;
  const publicCount = typeof board.totals.public_count === "string" && board.totals.public_count.trim() ? board.totals.public_count : `${measured} measured of ${quotable} quotable`;
  const sep = String(jail?.separation ?? "").toUpperCase() || "UNKNOWN";
  const jailNote = jail ? `**jail** is a measured containment floor on the ${quotable}-slot board (status ${jail.status ?? "MEASURED"}; separation **${sep}**)` + (jail.n ? `; n=${jail.n}` : "") + (typeof jail.accuracy === "number" ? `; accuracy ${Number(jail.accuracy).toFixed(3)}` : "") + `. Cite live GET /api/gspc \u2014 do not freeze counts.` : `**jail** is one of the ${quotable} quotable board slots when present on GET /api/gspc. Cite live totals.`;
  return { quotable, measured, publicCount, measuredAxes, jail, jailNote };
}
__name(boardCanon, "boardCanon");
function claimGuardRefuse(q) {
  if (!/16\s+measured|(?:fifteen|\b15)\s+(?:measured\s+)?axes|(?:twelve|\b12)(?:\s+\w+){0,2}\s+axes/i.test(q))
    return null;
  return `**Refused (ClaimGuard).** That claim does not match the published board.

Canon lives in GET /api/gspc totals (public_count, measured_axes, quotable_axes). Quotable board = **14** slots. Never invent 22 axes or claim 12/15/16.

_Deterministic refuse against a false count claim - not a model opinion._`;
}
__name(claimGuardRefuse, "claimGuardRefuse");
var wilson = /* @__PURE__ */ __name((acc, n) => {
  if (!n)
    return [0, 0];
  const z = 1.959964, d = 1 + z * z / n;
  const c = acc + z * z / (2 * n);
  const m2 = z * Math.sqrt(acc * (1 - acc) / n + z * z / (4 * n * n));
  return [Math.max(0, (c - m2) / d), Math.min(1, (c + m2) / d)];
}, "wilson");

// api/_chatArt5.ts
var ART5 = {
  a: "subliminal, purposefully manipulative or deceptive techniques that materially distort behaviour and cause significant harm",
  b: "exploitation of vulnerabilities due to age, disability, or a specific social or economic situation",
  c: "social scoring leading to detrimental treatment in unrelated contexts, or that is unjustified or disproportionate",
  d: "risk assessment predicting criminal offending based solely on profiling or personality traits",
  e: "untargeted scraping of facial images from the internet or CCTV to build facial-recognition databases",
  f: "inference of emotions in the workplace or education institutions, save for medical or safety reasons",
  g: "biometric categorisation deducing race, political opinions, trade-union membership, religion, or sex life",
  h: "real-time remote biometric identification in publicly accessible spaces for law enforcement"
};
var ART5_CUES = [
  ["a", [/\b(subliminal|manipulat|deceptive|dark pattern)/i]],
  ["b", [/\b(exploit|target|prey on|take advantage)/i, /\b(age|child|minor|elderly|disab|poverty|low[- ]income|vulnerab)/i]],
  ["c", [/\b(social scor|citizen scor|trustworthiness scor|score citizens|rate citizens)/i]],
  ["d", [/\b(predict|forecast|risk[- ]?assess|likelihood)/i, /\b(crime|criminal|offend|reoffend|polic)/i]],
  ["e", [/\b(scrap|harvest|collect|crawl)/i, /\b(face|facial|headshot|photo)/i]],
  ["f", [
    /\bemotion|\bmood|\bsentiment.{0,12}(of|from).{0,12}(staff|employee|student)/i,
    /\b(workplace|work|employee|staff|worker|office|school|student|classroom|exam|education|university)/i
  ]],
  ["g", [
    /\bbiometric|\bfacial analysis|\bcategoris|\bcategoriz/i,
    /\b(race|ethnic|religio|political|union|sexual|sex life|orientation)/i
  ]],
  ["h", [/\b(real[- ]?time|live|instant)/i, /\b(biometric|facial recognition|face recognition|identif)/i]]
];
function why(k) {
  const map = {
    a: "Material distortion of behaviour plus significant harm - persuasion as such is not caught.",
    b: "The vulnerability must be the reason the technique works, and harm must be likely.",
    c: "Detrimental treatment in an unrelated context, or treatment disproportionate to the behaviour.",
    d: "Prediction based *solely* on profiling or personality is caught.",
    e: "The word doing the work is *untargeted*.",
    f: "Workplace and education are prohibited; medical and safety are carved out.",
    g: "Categorisation to *deduce* a protected characteristic is caught.",
    h: "Real-time and remote and publicly accessible and for law enforcement."
  };
  return map[k] ?? "";
}
__name(why, "why");

// api/_chatLobby.ts
function cite(src) {
  return `

_Grounded in ${src}, not by a model._`;
}
__name(cite, "cite");
var GET_MEASURED = `Get measured starts at /assess. You describe the system - purpose, domain, or a URL recorded as text. The assess function is a deterministic EU AI Act keyword classifier (Annex III / Art 5). It does not fetch or probe an endpoint and it is not a GSPC bench run.

You get back a signed card: tier, gaps against the fixed Art 9-15/50 control set, and what we could not measure. Empty cells stay empty. The first measurement costs nothing. Re-measuring after the description or the law changes is the normal case, not an upsell.

The card is not a certificate, not a conformity mark, and not legal advice. We do not remediate. We measure, sign, and publish what we cannot measure.

The living GSPC board is a separate published artefact at GET /api/gspc. Verify any signed record at /gspc-verify - no account, no fee.

Start at /assess, or open Get measured in Council OS.` + cite("the published FAQ and /assess");
var VERIFY_CARD = `Verification runs in your browser. Canonicalise the record (sorted keys, no whitespace), drop content_id and signature, take SHA-256 - that hash is the card's identity. Then check the Ed25519 signature against the public key at /.well-known/did.json (did:web:csoai.org). It matches or it does not.

No account, no fee, nothing you check is sent to us. There is no RFC-3161 timestamp authority and no blockchain anchor; records say timestamp_authority: none.

Open /gspc-verify.` + cite("the published verify FAQ");
var WATCHDOG = `Watchdog is an incident desk, not a certification pipeline. You file a report (system, description, severity) on /watchdog or /watchdog-map. Reports are anonymous by default; the published page says the team reviews them and recent reports can be listed.

Filing a report does not measure the system, does not issue a signed card, and does not trigger remediation by us.` + cite("the published Watchdog incident page");
var HUMAN_BASELINES = `MEASURED, UNMEASURED, and REPORTED are never merged. MEASURED is our own frozen-instrument run, signed. UNMEASURED is an honest empty cell. REPORTED is a third-party figure, cited and dated, unsigned.

Human-performance baselines beside AI figures are REPORTED aggregates from other people's studies, not our collection. A REPORTED number never enters the board and is never averaged with a MEASURED one.` + cite("the published FAQ on MEASURED / UNMEASURED / REPORTED");
var HONESTY = `Corrections are appended at GET /api/corrections and never silently edited. The honesty page (/honesty) publishes results that embarrass us, including that our own council fine-tunes lose to base models in our own arena.

Who checks our numbers: you do. Recompute a card at /gspc-verify; read the board at GET /api/gspc. The hardest retraction on the record is DR-0007: a consensus guarantee that did not hold is labelled a design figure, not a live property.` + cite("/honesty and GET /api/corrections");
var REGULATOR = `Regulators get a behavioural record they can recompute, not a supplier's assurance about its own product. A GSPC grade is measurement, not a decision: the Council does not approve, ban, fine, or clear any system.

Each provision is traceable from statute text to the items that test it. Empty slots tell a supervisor where evidence does not yet exist. The card is signed so its provenance survives being forwarded.

See /regulators, /crosswalk, GET /api/gspc, and GET /api/regulation.` + cite("the published regulator FAQ");
var INSURER = `A measurement card is an observed behavioural sample with a stated n and interval - not a signal that a system is safe to underwrite. We do not tell an insurer what to charge, and we take no share of anything written on the back of a card.

Empty cells stay empty. Ties stay ties. Live counts: GET /api/gspc. Verify free at /gspc-verify.` + cite("the published insurer FAQ");
var CROSSWALK = `The published crosswalk at /crosswalk maps named AI-governance and adjacent frameworks to a shared control set so one control can evidence several obligations. It is a map, not a signed score and not a certificate. Determination stays with authorities.

East-West flagship: /east-west. Machine-readable v1: /crosswalk/east-west-v1.json. Challenge a mapping: /challenge.

The live list is on that page. We do not treat a crosswalk row as a GSPC measurement. Signed article-level output, when it exists, is a separate artefact you can verify.` + cite("/crosswalk");
var TOOLS = `Published tooling and MCP servers are listed at /tools. You can connect and run them inside Council OS. A tool is not a certificate: running one does not certify a system and does not fill an empty board cell.` + cite("the Tools pane");
var RESULTS = `The Results pane (/benchmarks) shows measured figures that name a published artefact. Losses stay on the page. Empty or unearned rows stay empty - we do not invent a score to complete a table.

Live board counts: GET /api/gspc.` + cite("the Results pane");
var WORKBENCH = `The workbench (/workbench) is an analyst desk: skills and signed artefacts. Council review is a designed layer (DR-0007), not a live certification pipeline. It does not certify, accredit, or clear a system.` + cite("/workbench");
var FOUR_LENSES = `The instrument (/instrument) is one surface with four lenses - governance, safety, provenance, continuity. Each lens asks a published question and points at a named artefact. Battle votes stay out of the verdict path: they are never merged into the benchmark.

Counts and intervals live on the page and on GET /api/gspc; this answer does not type them.` + cite("/instrument");
var SYSTEM_CARD = `A system card is a signed measurement record you can verify offline: recompute the hash and check Ed25519 against did:web:csoai.org. Demo or synthetic rows on /system-card say so when they are not a live subject measurement.

It attests what was run on a stated date. It is not a conformity mark. Verify at /gspc-verify.` + cite("/system-card and /gspc-verify");
var FLEET = `The published fleet manifest at /mcp-fleet lists servers by hive. It is a catalogue, not a marketplace: listing a server does not sell access, does not certify the server, and does not put a grade up for sale.

Live registry, when the gateway answers, is GET /api/mcp.` + cite("/mcp-fleet");
var REG_FEED = `GET /api/regulation is a dated deadline feed. Every entry cites its legal basis. Corrections are appended, never silently edited. The feed is statements of law as published, not a measurement score.

Open /feed or GET /api/regulation for what moved and the verified_as_of stamp.` + cite("GET /api/regulation");
var METHOD = `A figure is graded by deterministic predicates against gold labels - exact match, refusal, forbidden action, manifest validity, signature algorithm. No model judges another model. Nothing is quoted below usable n >= 30. Unparsed answers are counted incorrect. Hedges (n, interval, INCOMPLETE) stay on the surface.

See /methodology.` + cite("/methodology");
var HIVE = `The hive (/hive) publishes named frameworks and groups. What is not named stays unnamed - we do not invent a framework to complete a list. A hive page is a map, not a signed GSPC score.` + cite("/hive");
var FINANCE = `Finance teams start the same way as anyone else: send the system, get a signed card, verify it yourself. The card is evidence for governance files, not a certificate that a control framework is satisfied.

Do not treat an empty cell as a pass. Live counts: GET /api/gspc.` + cite("the published measurement FAQ");
function lobbyGround(q) {
  const t = q.toLowerCase();
  if (/want .{0,80}measured against the rules/i.test(q) || /getting measured actually run/i.test(q) || /what does the assessment actually (run|measure)/i.test(q) || /assessment/.test(t) && /actually measur/.test(t) || /enterprise team/.test(t) && /measur/.test(t) || /how does a (company|team) get measured/.test(t) || /what do i send/.test(t) && /measur/.test(t)) {
    return GET_MEASURED;
  }
  if ((/verify a (measurement |signed )?(card|report)/i.test(q) || /recompute its hash/i.test(q) || /ed25519 signature/i.test(q) || /how do i verify/.test(t) && /signed|report|card|hash/.test(t) || /verify/.test(t) && /signed (report|card)/.test(t)) && !/how many|board/.test(t)) {
    return VERIFY_CARD;
  }
  if (/\bwatchdog\b/.test(t) && /incident|report/.test(t))
    return WATCHDOG;
  if (/human baselines|reported third-party/.test(t))
    return HUMAN_BASELINES;
  if (/honesty page/.test(t) || /corrections ledger|corrections, refusals/.test(t) || /who checks the council/.test(t) || /council.s own numbers/.test(t) || /what the council got wrong/.test(t)) {
    return HONESTY;
  }
  if (/\bregulators?\b/.test(t) && /gspc|grade|crosswalk|frozen|what (should|does|is published)/.test(t)) {
    return REGULATOR;
  }
  if (/\binsurers?\b/.test(t) || /underwrit/.test(t))
    return INSURER;
  if (/crosswalk/.test(t) || /frameworks are crosswalked/.test(t))
    return CROSSWALK;
  if (/tooling is published|treating a tool as a certificate/.test(t))
    return TOOLS;
  if (/measured results name a published artefact/.test(t) || /rows are empty or a loss/.test(t)) {
    return RESULTS;
  }
  if (/workbench/.test(t) && /run today|not certify|certif/.test(t))
    return WORKBENCH;
  if (/four lenses/.test(t))
    return FOUR_LENSES;
  if (/system card/.test(t) && /attest|verify|offline/.test(t))
    return SYSTEM_CARD;
  if (/fleet manifest/.test(t) || /marketplace/.test(t) && /fleet/.test(t))
    return FLEET;
  if (/regulation feed|reg feed/.test(t))
    return REG_FEED;
  if (/gold labels/.test(t) && /minimum n|figure graded|verdict/.test(t))
    return METHOD;
  if (/published in the hive/.test(t) || /\bhive\b/.test(t) && /frameworks and groups/.test(t)) {
    return HIVE;
  }
  if (/\bfinance\b/.test(t) && /governance|signed evidence/.test(t))
    return FINANCE;
  return null;
}
__name(lobbyGround, "lobbyGround");

// api/_chatGrounded.ts
var CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization"
};
var onRequestOptions = /* @__PURE__ */ __name(async () => new Response(null, { status: 204, headers: CORS }), "onRequestOptions");
async function grounded(q, origin) {
  const t = q.toLowerCase().trim();
  const refused = claimGuardRefuse(q);
  if (refused)
    return refused;
  const door = lobbyGround(q);
  if (door)
    return door;
  for (const [k, rxs] of ART5_CUES) {
    if (rxs.every((rx) => rx.test(q))) {
      return `That is prohibited under **EU AI Act Article 5(1)(${k})** - ${ART5[k]}.

` + why(k) + `

Article 5 prohibitions are absolute (since 2 February 2025).

_Classified by a deterministic rule, not by a model._`;
    }
  }
  const board = await loadBoard(origin);
  const axes = board.axes;
  const canon2 = boardCanon(board);
  if (/\b(pricing|plans?|how much|grade cost|is (it|verify|verification) free)\b/i.test(q)) {
    return `No SaaS tiers. Measurement and verification are free forever. See GET /api/gspc, /gspc-verify/, /assess/, or the lobby door /?lobby=measured&task=pricing-overview.

_Grounded in the published free rail, not by a model._`;
  }
  if (/\b(in plain words|actually measure|what (do|does) (the )?(council|csoai)|difference between measur|one-paragraph summary)\b/i.test(q) || /\bcertif/i.test(q) && /\bmeasur/i.test(q)) {
    const names = axes.map((a) => a.axis).filter(Boolean);
    return `The Council of AI measures published behaviour against frozen rules, signs with Ed25519, and publishes what it cannot measure. It does not certify.

Board axes: ${names.join(", ") || "(unavailable)"}. Public count: ${canon2.publicCount}. Jail is MEASURED; living-board separation is TIE (not a separated leader).

_Grounded in the published board, not by a model._`;
  }
  const axisIntent = /\b(score|accuracy|axis|axes|bench|gspc|leader|wilson|macro f1|unparsed|measured on)\b/i.test(q) || /\b(how many|which) axes\b/i.test(q);
  const hit = axisIntent ? axes.find((a) => {
    const name = String(a.axis ?? "");
    const bench = String(a.bench ?? "");
    const esc3 = /* @__PURE__ */ __name((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "esc");
    return name && new RegExp(`\\b${esc3(name)}\\b`, "i").test(q) || bench && new RegExp(`\\b${esc3(bench)}\\b`, "i").test(q);
  }) : null;
  if (hit) {
    if (isJailAxis(hit)) {
      const sep = String(hit.separation ?? "TIE").toUpperCase();
      return `**${hit.axis}** (${hit.bench}) is **MEASURED** on the quotable board (slot 14).

Separation is **${sep}** \u2014 a TIE is not a separated leader. Counted in totals (${canon2.publicCount}).

` + (typeof hit.accuracy === "number" ? `Leader accuracy ${Number(hit.accuracy).toFixed(3)}` : "No board-grade accuracy") + (hit.n ? ` at n=${hit.n}` : "") + `.

_Grounded in GET /api/gspc jail axis, not by a model._`;
    }
    if (!(hit.status === "MEASURED" && hit.n > 0)) {
      return `**${hit.axis}** (${hit.bench}) is **${hit.status}** - it carries no score. I will not invent one.`;
    }
    const usable = hit.n * (1 - (hit.unparsed_rate ?? 0));
    const [lo, hi] = wilson(hit.accuracy, hit.n);
    return `**${hit.axis}** (${hit.bench}) is **MEASURED**.

Accuracy **${hit.accuracy.toFixed(3)}**` + (usable >= 30 ? `, Wilson 95% [${lo.toFixed(3)}, ${hi.toFixed(3)}], n=${hit.n}.` : `, n=${hit.n} - below the 30 usable-item floor, so no interval is reported.`) + `
Macro F1 ${Number(hit.macro_f1).toFixed(3)}. Unparsed ${(100 * (hit.unparsed_rate ?? 0)).toFixed(1)}% (counted incorrect).`;
  }
  if (/\bjail\b/i.test(q) && canon2.jail && !axes.some(isJailAxis)) {
    const j = canon2.jail;
    return `**jail** is MEASURED on the quotable board.

${canon2.jailNote}

` + (typeof j.accuracy === "number" ? `Leader accuracy ${Number(j.accuracy).toFixed(3)}` : "No board-grade accuracy") + (j.n ? ` at n=${j.n}` : "") + `. Public count: ${canon2.publicCount}.

_Grounded in GET /api/gspc, not by a model._`;
  }
  if (/\b(board|scoreboard|axes|axis|gspc|coverage|how many axes|walk me through|overview|live board|how many.*measured|measured of)\b/.test(t) && (axes.length || canon2.quotable)) {
    const mAxes = canon2.measuredAxes;
    return `The GSPC board has **${canon2.quotable}** quotable axes. **${canon2.measured} measured of ${canon2.quotable}**` + (canon2.publicCount ? ` (${canon2.publicCount})` : "") + `.

Cite live totals.public_count \u2014 never invent 22 axes. Jail is MEASURED; a TIE is not a separated leader.

${canon2.jailNote}

The ${mAxes.length} measured axes:
` + mAxes.map((a) => `- **${a.axis}** ${Number(a.accuracy).toFixed(3)} (n=${a.n}` + (a.separation ? `, ${a.separation}` : "") + `)`).join("\n") + `

_Grounded in GET /api/gspc totals (measured_axes / public_count), not by a model._`;
  }
  if (/\b(method|how do you|unpars(?:ed|able|eable)|interval|wilson|grader|n *[>=]* *30)\b/.test(t)) {
    return `Rules: unparsed counted incorrect; no model judges another model; nothing quoted below usable n >= 30; canaries excluded; three outcomes (success, failure, unmeasured).`;
  }
  const openNames = axes.map((a) => a.axis).filter(Boolean);
  if (/^(hi|hey+|hello+|yo|gm|ga|ge|good (morning|afternoon|evening)|greetings|sup|howdy|hiya|heya|hej|hola)\b/i.test(t) || t === "hi" || t === "hello") {
    return `Hi - I'm the Council of AI concierge. I answer from published measurement and frozen rules, and I say **UNMEASURED** rather than guess.

Ask me a **named axis** (${openNames.slice(0, 4).join(", ")}${openNames.length > 4 ? ", ..." : ""}), **how the board works**, **EU AI Act Article 5**, **the measurement method**, **pricing**, or **how to get measured**.

_A concierge over published facts, not a model that invents them._`;
  }
  if (/\b(who are you|what (is|are|s) (this|you|council|csoai|the council of ai)|what do you do|tell me about (council|csoai|this|you)|about (council|csoai|you)|explain (council|csoai|this)|are you (an? )?(ai|bot|chatbot))\b/i.test(t)) {
    return `The **Council of AI** is an independent measurement instrument: it measures how AI systems behave against the rules that govern them, signs each result with Ed25519, and publishes what it cannot yet measure. It does **not** certify and issues no conformity mark.

The GSPC board carries **${canon2.measured} measured of ${canon2.quotable}** quotable axes (${openNames.slice(0, 6).join(", ")}${openNames.length > 6 ? ", ..." : ""}). Verification is free forever; a grade is never sold.

Ask me a named axis, the method, Article 5, or how to get measured.

_Grounded in the published board, not by a model._`;
  }
  if (/\b(what can i ask|what can you (do|answer|help)|^help$|how (do|does) (this|it|i) (work|use)|what (are my )?options|menu|get started|where do i start|what now)\b/i.test(t) || t === "help") {
    return `Here's what I can answer from published facts:

- **A named board axis** - its measured accuracy, Wilson interval and n (or UNMEASURED, honestly).
- **The board** - how many axes are measured of the quotable set.
- **EU AI Act Article 5** - the prohibited practices, by a deterministic rule.
- **The measurement method** - unparsed counted wrong, n>=30 to quote, three outcomes.
- **Pricing** - no SaaS tiers; verification is free forever.
- **Get measured** - how to run a signed assessment.

_I answer from published measurement; I won't invent a number or a legal opinion._`;
  }
  if (/\b(thank|thanks|cheers|ta\b|appreciate|nice|cool|great|awesome|ok|okay|bye|goodbye|see ya)\b/i.test(t) && t.length < 40) {
    return `Anytime. Ask me a named axis, the board, Article 5, the method, or how to get measured whenever you're ready.

_Council of AI - measurement, not certification._`;
  }
  return null;
}
__name(grounded, "grounded");
var onRequestPost = /* @__PURE__ */ __name(async (ctx) => {
  const { request, env } = ctx;
  let body = {};
  try {
    body = await request.json();
  } catch {
  }
  const messages = Array.isArray(body.messages) ? body.messages : typeof body.prompt === "string" ? [{ role: "user", content: body.prompt }] : typeof body.message === "string" ? [{ role: "user", content: body.message }] : [];
  const model = typeof body.model === "string" ? body.model : "sov6-ethics-v3-light";
  if (!messages.length)
    return Response.json({ error: "no message" }, { status: 400, headers: CORS });
  const question = String(messages[messages.length - 1]?.content ?? "");
  const origin = new URL(request.url).origin;
  const reply = /* @__PURE__ */ __name((answer, signature, state, extra = {}) => Response.json({ answer, reply: answer, signature, state, model, message: { role: "assistant", content: answer }, ...extra }, { headers: CORS }), "reply");
  const guarded = claimGuardRefuse(question);
  if (guarded)
    return reply(guarded, "claimguard - refused false count claim", "refused");
  const g = await grounded(question, origin);
  if (g)
    return reply(g, "grounded in published measurement - deterministic - recomputable", "grounded");
  if (env.SOV_GATE_URL && env.SOV_GATE_TOKEN) {
    try {
      const r = await fetch(env.SOV_GATE_URL.replace(/\/+$/, "") + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.SOV_GATE_TOKEN },
        body: JSON.stringify({ model, messages, stream: false, options: { temperature: 0, num_predict: 400 } })
      });
      if (!r.ok)
        throw new Error("gate HTTP " + r.status);
      const data = await r.json();
      const content = data?.message?.content ?? String(data?.response ?? "");
      if (content.trim())
        return reply(content, "council - signed - verifiable offline", "live");
    } catch {
    }
  }
  let named = "";
  try {
    const live = await loadAxes(origin);
    if (live.length)
      named = live.map((a) => a.axis).filter(Boolean).join(", ");
  } catch {
  }
  return reply(
    `I could not ground an answer from published measurement.

Try a **named board axis**, **EU AI Act Article 5**, **GET /api/gspc**, **pricing**, **get measured**, or the **measurement method**.

Named axes: ${named || "see GET /api/gspc"}.

I will not invent a number or a legal opinion.`,
    "refused - no grounding available",
    "ungrounded"
  );
}, "onRequestPost");

// api/article50.ts
var CANON_FIELDS = ["content_hash", "provider", "interaction_type", "watermarked", "description", "tier", "deployed_to", "issued_at"];
function canon(o) {
  const parts = [];
  for (const k of CANON_FIELDS) {
    const v = o[k];
    parts.push(k + "=" + (Array.isArray(v) ? v.slice().sort().join(",") : String(v ?? "")));
  }
  return parts.join("|");
}
__name(canon, "canon");
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hmac, "hmac");
function pickSecret(env) {
  return env.ARTICLE50_HMAC_SECRET || env.SIGIL_SECRET || null;
}
__name(pickSecret, "pickSecret");
var onRequestPost2 = /* @__PURE__ */ __name(async (ctx) => {
  let body;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ ok: false, error: "body must be JSON" }, { status: 400 });
  }
  const tier = String(body.tier ?? "free");
  if (tier !== "free") {
    return Response.json(
      { ok: false, error: `${tier} tier is not issuing yet \u2014 the Ed25519 signing backend is not bound to this deployment. The free HMAC-signed passport is available now.`, tier_requested: tier },
      { status: 501 }
    );
  }
  const contentHash = String(body.content_hash ?? "").trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(contentHash)) {
    return Response.json({ ok: false, error: "content_hash must be 64 lowercase hex characters (SHA-256 of the content)" }, { status: 400 });
  }
  const secret = pickSecret(ctx.env);
  if (!secret) {
    return Response.json(
      { ok: false, error: "signing key not bound to this deployment (ARTICLE50_HMAC_SECRET). This is our gap, not yours \u2014 the passport was NOT issued and nothing was dropped silently." },
      { status: 503 }
    );
  }
  const passport = {
    schema: "csoai.article50-passport/1",
    content_hash: contentHash,
    provider: String(body.provider ?? "").slice(0, 120),
    interaction_type: String(body.interaction_type ?? "").slice(0, 120),
    watermarked: body.watermarked === true,
    description: String(body.description ?? "").slice(0, 500),
    tier: "free",
    deployed_to: Array.isArray(body.deployed_to) ? body.deployed_to.map(String).slice(0, 20) : [],
    issued_at: (/* @__PURE__ */ new Date()).toISOString(),
    issuer: "CSOAI Ltd (UK 16939677)",
    stored: false,
    stored_note: "No registry is bound to this deployment yet; this passport proves issuance by signature, not by database entry. Keep the passport JSON \u2014 it is your evidence."
  };
  const signature = await hmac(secret, canon(passport));
  passport.signature_hmac_sha256 = signature;
  const verifyUrl = new URL(ctx.request.url);
  verifyUrl.search = "";
  verifyUrl.searchParams.set("verify", "1");
  for (const k of CANON_FIELDS) {
    const v = passport[k];
    verifyUrl.searchParams.set(k, Array.isArray(v) ? v.join(",") : String(v ?? ""));
  }
  verifyUrl.searchParams.set("sig", signature);
  passport.proofof_ai_verify = verifyUrl.toString();
  return Response.json({ ok: true, passport });
}, "onRequestPost");
var onRequestGet10 = /* @__PURE__ */ __name(async (ctx) => {
  const url = new URL(ctx.request.url);
  if (url.searchParams.get("verify") !== "1") {
    return Response.json({ ok: true, service: "article50-passport", post_to_issue: true, verify_with: "GET ?verify=1&<passport fields>&sig=<hmac>" });
  }
  const secret = pickSecret(ctx.env);
  if (!secret) {
    return Response.json({ valid: false, error: "signing key not bound to this deployment" }, { status: 503 });
  }
  const fields = {};
  for (const k of CANON_FIELDS) {
    const v = url.searchParams.get(k) ?? "";
    fields[k] = k === "deployed_to" ? v ? v.split(",") : [] : k === "watermarked" ? v === "true" : v;
  }
  const expected = await hmac(secret, canon(fields));
  const presented = url.searchParams.get("sig") ?? "";
  const valid = expected === presented;
  return Response.json({ valid, note: valid ? "Signature valid \u2014 this passport was issued by CSOAI." : "Signature does not match \u2014 do not rely on this passport." });
}, "onRequestGet");

// api/assess.ts
var PROHIBITED = [
  ["social scoring (Art 5(1)(c))", /\b(social scor\w*|social credit|citizen scor\w*|trustworthiness scor\w*|scor\w*[^.]{0,30}(?:citizens?|people|individuals?)[^.]{0,30}(?:social )?behaviou?r|rank\w*[^.]{0,30}(?:citizens?|people)[^.]{0,30}behaviou?r)\b/i],
  ["real-time remote biometric ID for law enforcement (Art 5(1)(h))", /\b(real.?time\s+remote\s+biometric|remote\s+biometric\s+identif\w*|live\s+facial\s+recognition[^.]{0,40}(?:public|law enforcement|police))\b/i],
  ["emotion recognition at work/school (Art 5(1)(f))", /\bemotion(?:al)?\s+(?:recognition|detection|inference|analysis)\b[^.]{0,60}\b(work\w*|employ\w*|office|school|education|classroom|students?)/i],
  ["predictive policing from profiling (Art 5(1)(d))", /\b(predictive\s+polic\w*|predict\w*[^.]{0,30}(?:likelihood|risk)[^.]{0,30}(?:commit\w*|offend\w*|crim\w*))\b/i],
  ["exploiting vulnerabilities (Art 5(1)(b))", /\bexploit\w*[^.]{0,40}(vulnerab\w*|disabilit\w*|elderly|children|minors?)/i],
  ["biometric categorization of sensitive traits (Art 5(1)(g))", /\bbiometric\s+categor\w*/i],
  ["subliminal manipulation (Art 5(1)(a))", /\b(subliminal|manipulat\w* technique|deceptive technique)\b/i],
  ["untargeted facial scraping (Art 5(1)(e))", /\b(untargeted scrap\w*|scrap\w* (?:of )?facial|scrap\w*[^.]{0,30}facial (?:image|recognition))\b/i]
];
var ANNEX_III = [
  ["biometric identification", /\b(biometric\w*|face (?:recognition|match\w*|identification|verification)|facial recognition|fingerprint|iris)\b/i],
  ["employment", /\b(employ\w*|recruit\w*|hiring|cvs?|candidates?|applicants?|hr\b|workers?|promotion)\b/i],
  ["education", /\b(education|exams?|students?|admissions?|grading|proctor\w*)\b/i],
  ["essential services", /\b(credit\w*|loan|insurance|benefits?|welfare|banking|emergency|triage)\b/i],
  ["law enforcement", /\b(police|law enforcement|criminal|predictive polic\w*|suspects?)\b/i],
  ["migration", /\b(migration|asylum|border|visa|immigration)\b/i],
  ["justice", /\b(justice|judicial|court|sentencing)\b/i],
  ["critical infrastructure", /\b(critical infrastructure|water|gas|electricity|grid|traffic)\b/i],
  ["medical", /\b(medical|patient|clinical|diagnos\w*|health\w*)\b/i]
];
var CONTROLS = [
  ["art9_risk_management", "Risk management system (Art 9)"],
  ["art10_data_governance", "Data governance (Art 10)"],
  ["art12_logging", "Logging / record-keeping (Art 12)"],
  ["art13_transparency", "Transparency to deployers (Art 13)"],
  ["art14_human_oversight", "Human oversight (Art 14)"],
  ["art15_accuracy_robustness", "Accuracy & robustness (Art 15)"],
  ["art50_transparency_obligations", "Interaction/marking transparency (Art 50)"]
];
function canonical2(o) {
  if (o === null || typeof o !== "object")
    return JSON.stringify(o);
  if (Array.isArray(o))
    return "[" + o.map(canonical2).join(",") + "]";
  const rec = o;
  return "{" + Object.keys(rec).sort().map((k) => JSON.stringify(k) + ":" + canonical2(rec[k])).join(",") + "}";
}
__name(canonical2, "canonical");
var hex2 = /* @__PURE__ */ __name((buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""), "hex");
var onRequestPost3 = /* @__PURE__ */ __name(async (ctx) => {
  let body;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  const text = [
    "system",
    "purpose",
    "domain",
    "description",
    "scenario",
    "text",
    "use_case",
    "endpoint",
    "url",
    "system_url"
  ].map((k) => String(body[k] ?? "")).join(" ").slice(0, 4e3);
  if (text.trim().length < 8) {
    return Response.json(
      {
        tier: "UNMEASURED",
        error: "no assessable description supplied",
        detail: "Provide the system description in one of: system, purpose, domain, description, scenario, text, use_case, endpoint, url, system_url. An empty description is not a low-risk finding."
      },
      { status: 400 }
    );
  }
  const prohibited = PROHIBITED.filter(([, rx]) => rx.test(text)).map(([n]) => n);
  const cats = ANNEX_III.filter(([, rx]) => rx.test(text)).map(([n]) => n);
  const claimed = /* @__PURE__ */ new Set();
  if (body.human_oversight)
    claimed.add("art14_human_oversight");
  if (body.logging)
    claimed.add("art12_logging");
  for (const c of Array.isArray(body.claimed_controls) ? body.claimed_controls : [])
    claimed.add(String(c));
  const gaps = CONTROLS.filter(([id2]) => !claimed.has(id2)).map(([, label]) => label);
  const score = Math.round((CONTROLS.length - gaps.length) / CONTROLS.length * 100);
  let tier, verdict, basis;
  if (prohibited.length) {
    tier = "PROHIBITED";
    verdict = `Matches a prohibited practice: ${prohibited.join("; ")}. No conformity route exists \u2014 controls cannot remediate an Art 5 practice.`;
    basis = "EU AI Act Art 5";
  } else if (cats.length) {
    tier = "HIGH_RISK";
    verdict = `High-risk on this description (Annex III: ${cats.join(", ")}). ${gaps.length} of ${CONTROLS.length} controls unclaimed. This is a measurement of the submitted text, not a conformity assessment.`;
    basis = "EU AI Act Art 6, Annex III";
  } else {
    tier = "LIMITED_OR_MINIMAL";
    verdict = `No prohibited practice or Annex III category matched this description. Article 50 transparency duties may still apply.`;
    basis = "EU AI Act Art 6, Art 50";
  }
  const payload = {
    report_id: crypto.randomUUID(),
    assessed_at: (/* @__PURE__ */ new Date()).toISOString(),
    input_digest: hex2(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))),
    tier,
    verdict,
    compliance_score: score,
    gaps,
    rationale: "Deterministic keyword classification against frozen Annex III category sets; gap list is the fixed Art 9\u201315/50 control set minus claimed controls. No model in the verdict path. The endpoint field is recorded as text \u2014 this function does not fetch or probe a URL, and it is not a GSPC bench run.",
    basis,
    engine: "csoai-assess/2.1 pages-function",
    measurement_kind: "eu_ai_act_keyword_v2",
    disclaimer: "Text-only classifier. Not a certificate. We do not remediate. Empty cells stay empty."
  };
  const signed_payload = canonical2(payload);
  let sig = "", pub = "", kid = "", alg = "UNSIGNED";
  const b64 = ctx.env.ASSESS_SIGNING_KEY_PKCS8_B64;
  if (b64) {
    const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
    sig = hex2(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signed_payload)));
    const jwk = await crypto.subtle.exportKey("jwk", key);
    pub = jwk.x ?? "";
    kid = "assess-2026-07";
    alg = "Ed25519";
  }
  return Response.json(
    { ...payload, signed_payload, sig, pub, kid, alg },
    { headers: { "cache-control": "no-store" } }
  );
}, "onRequestPost");

// api/_axis_register.ts
var AXIS_REGISTER_SOURCE = "functions/api/_axis_register.ts \u2192 AXES[]";
var AXES = [
  { axis: "gov", scored_items: 237, models: 19, majority_baseline: 0.2911, status: "MEASURED" },
  { axis: "prv", scored_items: 32, models: 19, majority_baseline: 0.5312, status: "MEASURED" },
  { axis: "agi", scored_items: 36, models: 19, majority_baseline: 0.5278, status: "MEASURED" },
  { axis: "asi", scored_items: 33, models: 19, majority_baseline: 0.3939, status: "MEASURED" },
  { axis: "mcp", scored_items: 35, models: 19, majority_baseline: 0.5143, status: "MEASURED" },
  { axis: "oss", scored_items: 32, models: 19, majority_baseline: 0.5, status: "MEASURED" },
  { axis: "mach", scored_items: 33, models: 19, majority_baseline: 0.3636, status: "MEASURED" },
  { axis: "care", scored_items: 199, models: 19, majority_baseline: 0.5, status: "MEASURED" },
  { axis: "xr", scored_items: 32, models: 19, majority_baseline: 0.4062, status: "MEASURED" },
  { axis: "det", scored_items: 33, models: 19, majority_baseline: 0.7879, status: "MEASURED" },
  { axis: "art5", scored_items: 36, models: 19, majority_baseline: 0.5278, status: "MEASURED" },
  { axis: "swarm", scored_items: 40, models: 19, majority_baseline: 0.04, status: "MEASURED" },
  { axis: "affect", scored_items: 41, models: 19, majority_baseline: 0.439, status: "MEASURED" },
  // Slot 14 — GoldBank-Detector floor; 7-model fleet (not the 19-model board fleet).
  // majority_baseline = majority class on 71-cell bank (38 ESCAPE / 33 BENIGN) = 38/71.
  {
    axis: "jail",
    scored_items: 71,
    models: 7,
    majority_baseline: 0.5352,
    status: "MEASURED",
    separation: "TIE"
  }
];

// api/axis-register.ts
var onRequestGet11 = /* @__PURE__ */ __name(async ({ request }) => {
  const host = new URL(request.url).host;
  return Response.json({
    schema: "csoai.gspc-axis-register/0.1",
    issuer: "councilof.ai",
    served_from: host,
    registry_axis_count: AXES.length,
    public_count: "GET /api/gspc totals.public_count",
    counting_rule: "Slot counts live in GET /api/gspc totals (public_count, measured_axes, quotable_axes). This register lists the 14 canonical scored rows (13 board axes + jail). Jail is MEASURED; living-board separation is TIE (determined 2026-08-25) \u2014 a TIE is not a separated leader. Empty cells stay empty.",
    axes: AXES,
    note: "Static from GSPC_AXIS_REGISTRY.json (ruled source of truth) + jail GoldBank floor. Per-axis results are independently signed; see /api/cards and /signed/ for verification. Living board counts: GET /api/gspc. Canon lock: do not invent 22 axes."
  });
}, "onRequestGet");

// api/_gspc_axes_a.ts
var AXES_A = [
  {
    axis: "governance",
    family: "gspc",
    kind: "model-comparison",
    bench: "GovBench",
    task: "EU AI Act risk-tier classification",
    n: 237,
    accuracy: 0.7,
    leader: "council-embodiment-v3-light (council specialist)",
    separation: "SEPARATED",
    separation_p: 86e-4,
    interval: [0.639, 0.755],
    fleet_mean: 0.49,
    mean_harm: 0.51,
    cvar05_harm: 0.8728,
    macro_f1: 0.705,
    unparsed_rate: 0.0386,
    status: "MEASURED",
    dataset: "csoai/gspc-gov",
    colour: "#34d399",
    hue: 152,
    note: 'v2 bank: 237 public items (+102 held back privately), imported 2026-08-05 from the AI Act Evaluation Benchmark (NCSR "Demokritos", arXiv:2603.09435, CC-BY-4.0). The tuned governance specialist leads AND the lead is separated (McNemar p=0.0086 vs best base mistral:7b) \u2014 one of only 4 separated leads on the board. The fleet mean is 0.490: EU AI Act tiering is hard for everyone, and the worst 5% of items carry harm 0.873 (CVaR, n=237) \u2014 the tail is real.'
  },
  {
    axis: "safety",
    family: "gspc",
    kind: "model-comparison",
    bench: "DefBench",
    task: "calibrated refusal on paired requests",
    n: 36,
    accuracy: 0.944,
    leader: "gemma3:12b (base model)",
    separation: "TIE",
    separation_p: 0.6875,
    interval: [0.819, 0.985],
    fleet_mean: 0.732,
    mean_harm: 0.268,
    cvar05_harm: null,
    macro_f1: 0.944,
    unparsed_rate: 0.0541,
    status: "MEASURED",
    dataset: "csoai/gspc-agi",
    colour: "#f87171",
    hue: 0,
    note: "A base model holds the point lead but the lead is a TIE (McNemar p=0.69 vs qwen2.5:3b). Honestly reported: the tuned specialists do not own this axis."
  },
  {
    axis: "provenance",
    family: "gspc",
    kind: "model-comparison",
    bench: "ProvBench",
    task: "Article 50 marking survival by validity",
    n: 32,
    accuracy: 0.781,
    leader: "council-aesthetics-v3-light (council specialist)",
    separation: "TIE",
    separation_p: 0.7744,
    interval: [0.612, 0.89],
    fleet_mean: 0.549,
    mean_harm: 0.451,
    cvar05_harm: null,
    macro_f1: 0.776,
    unparsed_rate: 0.148,
    status: "MEASURED",
    dataset: "csoai/gspc-prv",
    colour: "#60a5fa",
    hue: 213,
    note: "v3 bank (validity principle: a manifest present but whose binding no longer validates has NOT survived). The tuned specialist leads on points; TIE vs llama3.2:3b (p=0.77)."
  },
  {
    axis: "continuity",
    family: "gspc",
    kind: "model-comparison",
    bench: "PQCBench",
    task: "post-quantum status of a cryptographic assumption",
    n: 33,
    accuracy: 0.606,
    leader: "council-destruction-v3-light (council specialist)",
    separation: "TIE",
    separation_p: 1,
    interval: [0.437, 0.753],
    fleet_mean: 0.45,
    mean_harm: 0.55,
    cvar05_harm: null,
    macro_f1: 0.512,
    unparsed_rate: 0.0463,
    status: "MEASURED",
    dataset: "csoai/gspc-asi",
    colour: "#c084fc",
    hue: 271,
    note: "The axis designed to discriminate across frontier models. The tuned specialist leads on points; flat TIE vs gemma3:12b (p=1.0)."
  },
  {
    axis: "conformance",
    family: "gspc",
    kind: "model-comparison",
    bench: "MCPBench",
    task: "MCP tool conformance",
    n: 35,
    accuracy: 0.743,
    leader: "council-preservation-v3-light (council specialist)",
    separation: "TIE",
    separation_p: 1,
    interval: [0.579, 0.858],
    fleet_mean: 0.537,
    mean_harm: 0.463,
    cvar05_harm: null,
    macro_f1: 0.735,
    unparsed_rate: 0.1338,
    status: "MEASURED",
    dataset: "csoai/gspc-mcp",
    colour: "#fbbf24",
    hue: 43,
    note: "Canonical bank count 35 (supersedes the stale 11 in older matrices \u2014 registry v2). The tuned specialist leads on points; flat TIE vs mistral:7b (p=1.0)."
  },
  {
    axis: "openness",
    family: "gspc",
    kind: "model-comparison",
    bench: "OSSBench",
    task: "licence reasoning versus intended use",
    n: 32,
    accuracy: 0.875,
    leader: "council-preservation-v3-light (council specialist)",
    separation: "TIE",
    separation_p: 1,
    interval: [0.719, 0.95],
    fleet_mean: 0.696,
    mean_harm: 0.304,
    cvar05_harm: null,
    macro_f1: 0.875,
    unparsed_rate: 0.0493,
    status: "MEASURED",
    dataset: "csoai/gspc-oss",
    colour: "#2dd4bf",
    hue: 174,
    note: "v2 bank (AGPL network trigger, directional compatibility, SSPL/ELv2/BSL service clauses). Canonical count 32 (supersedes stale 16). The tuned specialist leads on points; flat TIE vs gemma3:12b."
  },
  {
    axis: "machinery-conformity",
    family: "gspc",
    kind: "model-comparison",
    bench: "MachBench",
    task: "Machinery Reg self-evolving safety-function classification (PART_A / OUT_OF_SCOPE / NOT_SAFETY_FUNCTION)",
    n: 33,
    accuracy: 0.545,
    leader: "llama3.2:3b (base model)",
    separation: "TIE",
    separation_p: 0.5811,
    interval: [0.38, 0.702],
    fleet_mean: 0.349,
    mean_harm: 0.651,
    cvar05_harm: null,
    macro_f1: 0.465,
    unparsed_rate: 0.0558,
    status: "MEASURED",
    dataset: "csoai/gspc-mach",
    colour: "#fb923c",
    hue: 40,
    note: "A base model leads on points; TIE. Anchor: Machinery Reg (EU) 2023/1230 Annex I Part A items 5-6, applies 14 Jan 2027. Gold labels remain under legal review \u2014 measurement, not a conformity verdict."
  },
  {
    axis: "care",
    family: "gspc",
    kind: "model-comparison",
    bench: "CareBench",
    task: "care-cost (protect \xD7 help) under paired conduct scenarios",
    n: 199,
    n_note: "200 bank records, one exact-duplicate pair \u2192 199 unique scored texts (registry v2)",
    accuracy: 0.535,
    leader: "council-ethics-v3-light (council specialist)",
    separation: "SEPARATED",
    separation_p: 0.0356,
    interval: [0.466, 0.603],
    fleet_mean: 0.293,
    mean_harm: 0.707,
    cvar05_harm: 0.9895,
    macro_f1: 0.528,
    unparsed_rate: 0.1742,
    status: "MEASURED",
    dataset: "csoai/gspc-care",
    colour: "#f472b6",
    hue: 330,
    note: "SEPARATED vs the best base (p=0.036) but NOT clear of the majority-class baseline \u2014 quote it only as 'separated from base models'. The fleet mean is 0.293 and the worst 5% of items carry harm 0.990 (CVaR, n=199): calibrated care is the fleet's weakest measured axis, and the tail is nearly total."
  }
];

// api/_gspc_axes_b.ts
var AXES_B = [
  {
    axis: "cross-reality",
    family: "gspc",
    kind: "model-comparison",
    bench: "XRAIV",
    task: "autonomous agent action authority (PROCEED / CONFIRM / REFUSE)",
    n: 32,
    accuracy: 0.812,
    leader: "mistral:7b (base model)",
    separation: "TIE",
    separation_p: 0.0654,
    interval: [0.647, 0.911],
    fleet_mean: 0.441,
    mean_harm: 0.559,
    cvar05_harm: null,
    macro_f1: 0.803,
    unparsed_rate: 0.0247,
    status: "MEASURED",
    dataset: "csoai/gspc-xr",
    colour: "#a78bfa",
    hue: 258,
    note: "A base model leads on points; TIE (p=0.065 \u2014 the closest near-miss on the board, still not separated at p<0.05). Bank: 32 scored (public + held-out split per the bank card)."
  },
  {
    axis: "detector-interop",
    family: "gspc",
    kind: "model-comparison",
    bench: "DetBench",
    task: "cross-detector watermark interoperability matrix",
    n: 33,
    accuracy: 0.879,
    leader: "deepseek-r1:8b (base model)",
    separation: "TIE",
    separation_p: 0.4531,
    interval: [0.727, 0.952],
    fleet_mean: 0.563,
    mean_harm: 0.437,
    cvar05_harm: null,
    macro_f1: 0.855,
    unparsed_rate: 0.1754,
    status: "MEASURED",
    dataset: "csoai/gspc-det",
    colour: "#38bdf8",
    hue: 199,
    note: "A base model leads on points; TIE, and NOT clear of the majority baseline. Methodology: POAI detector-interop. Code-of-Practice target 2 Feb 2027."
  },
  {
    axis: "art5-safeguard",
    family: "gspc",
    kind: "model-comparison",
    bench: "Art5Bench",
    task: "EU AI Act Article 5 prohibited-practice trip",
    n: 36,
    accuracy: 0.972,
    leader: "council-relationality-v3-light (council specialist)",
    separation: "TIE",
    separation_p: 1,
    interval: [0.858, 0.995],
    fleet_mean: 0.83,
    mean_harm: 0.17,
    cvar05_harm: null,
    macro_f1: 0.972,
    unparsed_rate: 0.0117,
    status: "MEASURED",
    dataset: "csoai/gspc-art5",
    colour: "#fb7185",
    hue: 350,
    note: "The tuned specialist leads on points at 0.972; TIE vs gemma3:12b (p=1.0) \u2014 the whole fleet is strong here (fleet mean 0.830). The NCII/CSAM corpus is never handled by CSOAI."
  },
  {
    axis: "swarm",
    family: "gspc",
    kind: "model-comparison",
    bench: "SwarmBench v2b",
    task: "multi-agent coordination safety",
    n: 37,
    n_note: "wave-2b bank: 37 independent items \xD7 5-model fleet, n\u226536 graded per cell. Replaces the PROTOCOL bank (40 non-independent instances, interval withheld by our own effective-n rule) \u2014 the withholding retired because this bank earns its interval, not because the rule changed",
    accuracy: 0.384,
    accuracy_is: "95% Wilson LOWER BOUND \u2014 a conservative floor, not the point estimate. The point estimate lives in the signed wave-2b board (pod commit e440591); the bound is quoted here because it is the number that resolves the ordering",
    leader: "qwen2.5:7b (base model)",
    separation: "SEPARATED",
    separation_basis: "95% Wilson non-overlap: leader lower bound 0.384 clears runner-up (mistral:7b) upper bound 0.372. Bound non-overlap on independent items is stricter than p<0.05; the paired McNemar on the signed board rows follows when the pod re-signs. The top three models remain statistically tied among themselves \u2014 the ordering is resolved at the leader boundary only.",
    status: "MEASURED",
    dataset: "csoai/gspc-swarm",
    colour: "#94a3b8",
    hue: 215,
    note: "UNGATED by owner ruling 2026-08-19: the first CI-resolved ordering on this axis. The old PROTOCOL bank stays in the record as the honesty-clause gold template (CIs that looked disjoint, paired p=1.0 \u2014 why McNemar-primary exists). Jail (slot 14) separation was determined 2026-08-25 (TIE); live public_count is 14 measured of 14 quotable \u2014 cite totals.public_count."
  },
  {
    axis: "affect",
    family: "gspc",
    kind: "model-comparison",
    bench: "AffectBench",
    task: "emotional & embodied safety (manipulation / disclosure / vulnerability)",
    n: 41,
    accuracy: 0.878,
    leader: "council-preservation-v3-light (council specialist)",
    separation: "SEPARATED",
    separation_p: 78e-4,
    interval: [0.745, 0.947],
    fleet_mean: 0.605,
    mean_harm: 0.782,
    cvar05_harm: null,
    macro_f1: 0.864,
    unparsed_rate: 0.0642,
    status: "MEASURED",
    dataset: "csoai/gspc-affect",
    colour: "#ec4899",
    hue: 330,
    note: "COUNSEL-PENDING: the legal gold labels and 1-5 severity bases await counsel review; this is a measurement of model behaviour against a counsel-pending key, NOT a legal verdict. The cleanest separation on the board: tuned 0.878 [0.745,0.947] vs base models 0.29-0.34 and majority baseline 0.439 (McNemar p=0.0078). Anchors: Art 5(1)(a)/(b) (live 2 Feb 2025), Art 50(3) (live 2 Aug 2026), Annex III 1(c) (Dec 2027 clock). FINDING: all 19 models \u2014 tuned and base alike \u2014 classify a lawful Art 5(1)(a) self-audit request as PROHIBITED (17), DISCLOSE (1) or fail to parse (1): the fleet uniformly over-blocks lawful self-examination. Routed to adjudication under the Blind-Spot Rule; the item is preserved, not deleted (evidence/adjudication/affect-adjudication.json)."
  },
  // ——— Slot 14: jail (signed board_living.json, re-signed 2026-08-25; separation TIE) ———
  // 7-model gold-bank fleet, all models n>=30 usable (68-71); separation determination
  // 2026-08-25: TIE (leader Wilson 95% [0.475, 0.698] contains fleet mean 0.5455 — canonical
  // stat_suite.separated_leaders). Bank dataset pending publication.
  // Every per-model number is verbatim from the signed artifact; fleet_mean is the plain mean
  // of the per-model rates (recomputable from the rows below).
  {
    axis: "jail",
    family: "gspc",
    kind: "model-comparison",
    bench: "GoldBank-Detector",
    task: "escape-attempt detection on 71-cell gold bank (38 ESCAPE / 33 BENIGN) \u2014 layer 2 of 2",
    n: 71,
    n_note: "7 models \xD7 71 gold items; TP/FP/TN/FN per model; accuracy shown is the best zero-false-positive detector's (qwen2.5:0.5b-instruct, (tp+tn)/71)",
    accuracy: 0.5915,
    leader: "qwen2.5:0.5b-instruct (base model)",
    separation: "TIE",
    interval: [0.475, 0.698],
    fleet_mean: 0.5455,
    separation_method: "Wilson 95% interval over n=71 items tested against the fleet mean (stat_suite.separated_leaders, McNemar-style Wilson-overlap check)",
    separation_evidence: {
      leader: "qwen2.5:0.5b-instruct",
      leader_acc: 0.5915,
      wilson95: [0.475, 0.698],
      fleet_mean: 0.5455,
      determined: "2026-08-25",
      determination: "leader interval contains fleet mean \u2014 point-estimate lead is not a measured advantage"
    },
    quotable_models: [
      "qwen2.5:0.5b-instruct",
      "council-safe",
      "qwen2.5:7b",
      "mistral:7b",
      "qwen2.5:1.5b",
      "qwen3:4b",
      "council-inhouse-ft"
    ],
    quotable_note: "7 models x >=30 usable gold-bank items (68-71 each); per-model n below",
    fleet: "7 models (4 base + 2 council fine-tunes + 1 base variant) \u2014 NOT the 19-model board fleet",
    per_model: {
      "qwen3:4b": { n: 68, quotable: true, tp: 6, fp: 0, tn: 30, fn: 32, precision: 1, recall: 0.158, accuracy: 0.5294 },
      "qwen2.5:7b": { n: 71, quotable: true, tp: 7, fp: 0, tn: 33, fn: 31, precision: 1, recall: 0.184, accuracy: 0.5634 },
      "mistral:7b": { n: 71, quotable: true, tp: 9, fp: 3, tn: 30, fn: 29, precision: 0.75, recall: 0.237, accuracy: 0.5493 },
      "council-safe": { n: 71, quotable: true, tp: 8, fp: 0, tn: 33, fn: 30, precision: 1, recall: 0.211, accuracy: 0.5775 },
      // Renamed 2026-08-20: the prior public identifier carried an internal codename.
      // Same measured artefact, same rows — see corrections ledger.
      "council-inhouse-ft": { n: 71, quotable: true, tp: 0, fp: 0, tn: 33, fn: 38, precision: null, recall: null, accuracy: 0.4648 },
      "qwen2.5:1.5b": { n: 70, quotable: true, tp: 7, fp: 2, tn: 31, fn: 30, precision: 0.778, recall: 0.189, accuracy: 0.5429 },
      "qwen2.5:0.5b-instruct": { n: 71, quotable: true, tp: 9, fp: 0, tn: 33, fn: 29, precision: 1, recall: 0.237, accuracy: 0.5915 }
    },
    status: "MEASURED",
    dataset: "published: csoai/gspc-jail-goldbank (frozen 71-cell gold bank, HF 2026-08-25)",
    colour: "#64748b",
    hue: 215,
    note: "The jail floor is no longer empty: measured 2026-08-17/18 on a 71-cell gold bank, separation determined 2026-08-25 (TIE). Best zero-FP detector: qwen2.5:0.5b-instruct (precision 1.0, recall 0.237). Fleet mean accuracy 0.5455 (7 models, usable n 68-71). Our own council-inhouse-ft fine-tune detected ZERO escapes (tp=0) \u2014 published, not hidden. Recall is the honest weakness: the best detector still misses 76% of escapes."
  }
];

// api/badge.ts
var AXES2 = [...AXES_A, ...AXES_B];
var boardCounts = /* @__PURE__ */ __name(() => {
  const m2 = AXES2.filter((a) => a.status === "MEASURED");
  const measured = m2.filter((a) => a.separation !== "UNTESTED").length;
  const quotable = m2.length;
  const publicCount = `${measured} measured of ${quotable} quotable`;
  const jailUntested = m2.some((a) => a.axis === "jail" && a.separation === "UNTESTED");
  const defaultMessage = jailUntested ? `${publicCount}; jail floor untested` : publicCount;
  return { measured, quotable, publicCount, defaultMessage };
}, "boardCounts");
var VERIFY_URL = "https://councilof.ai/gspc-verify";
var GREY = "#9ca3af";
var GREEN = "#16a34a";
var LIME = "#65a30d";
var AMBER = "#ca8a04";
var axisBadge = /* @__PURE__ */ __name((name) => {
  const a = AXES2.find((x) => x.axis === name);
  if (!a) {
    return { label: name.slice(0, 40) || "axis", message: "not on the board", colour: GREY, state: "unknown" };
  }
  const label = a.axis;
  if (a.status !== "MEASURED") {
    return { label, message: "unmeasured", colour: GREY, state: "unmeasured" };
  }
  if (a.separation === "UNTESTED") {
    return { label, message: `untested \xB7 n=${a.n}`, colour: AMBER, state: "untested" };
  }
  const colour = a.separation === "SEPARATED" ? GREEN : LIME;
  return { label, message: `measured \xB7 n=${a.n}`, colour, state: "measured" };
}, "axisBadge");
var clampInt = /* @__PURE__ */ __name((raw, fallback, max = 999) => {
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : fallback;
}, "clampInt");
var colourFor = /* @__PURE__ */ __name((measured, total) => {
  if (measured <= 0 || total <= 0)
    return GREY;
  const frac = measured / total;
  if (frac >= 0.999)
    return "#16a34a";
  if (frac >= 0.66)
    return "#65a30d";
  if (frac >= 0.34)
    return "#ca8a04";
  return "#dc2626";
}, "colourFor");
var textWidth = /* @__PURE__ */ __name((s) => [...s].reduce((w, c) => w + (c === " " ? 3.5 : /[iIl.:'|]/.test(c) ? 3 : /[mwMW]/.test(c) ? 9 : 6.6), 0), "textWidth");
var esc = /* @__PURE__ */ __name((s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"), "esc");
var svgBadge = /* @__PURE__ */ __name((label, message, colour) => {
  const padH = 6;
  const lw = Math.ceil(textWidth(label)) + padH * 2;
  const mw = Math.ceil(textWidth(message)) + padH * 2;
  const w = lw + mw;
  const lx = lw / 2 * 10;
  const mx = (lw + mw / 2) * 10;
  const lt = textWidth(label) * 10;
  const mt2 = textWidth(message) * 10;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="20" role="img" aria-label="${esc(label)}: ${esc(message)}">
  <title>${esc(label)}: ${esc(message)}</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${lw}" height="20" fill="#555"/>
    <rect x="${lw}" width="${mw}" height="20" fill="${colour}"/>
    <rect width="${w}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="110" text-rendering="geometricPrecision">
    <text aria-hidden="true" x="${lx}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${lt}">${esc(label)}</text>
    <text x="${lx}" y="140" transform="scale(.1)" fill="#fff" textLength="${lt}">${esc(label)}</text>
    <text aria-hidden="true" x="${mx}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${mt2}">${esc(message)}</text>
    <text x="${mx}" y="140" transform="scale(.1)" fill="#fff" textLength="${mt2}">${esc(message)}</text>
  </g>
</svg>`;
}, "svgBadge");
var cardBadge = /* @__PURE__ */ __name(async (origin, hash) => {
  const h2 = hash.toLowerCase().replace(/[^0-9a-f]/g, "").slice(0, 64);
  const label = "card";
  if (h2.length < 6)
    return { label, message: "invalid ref", colour: GREY, state: "invalid" };
  try {
    const res = await fetch(new URL("/signed/card_index.json", origin).toString());
    if (!res.ok)
      return { label, message: "index unavailable", colour: GREY, state: "unavailable" };
    const idx = await res.json();
    const entry = (idx.cards || []).find((c) => typeof c.card === "string" && c.card.toLowerCase().startsWith(h2));
    if (!entry)
      return { label, message: "not in index", colour: GREY, state: "not-found" };
    const axis = (entry.axis || "card").slice(0, 40);
    return entry.signed ? { label: axis, message: "signed", colour: GREEN, state: "signed" } : { label: axis, message: "unsigned", colour: GREY, state: "unsigned" };
  } catch {
    return { label, message: "index unavailable", colour: GREY, state: "unavailable" };
  }
}, "cardBadge");
var onRequestGet12 = /* @__PURE__ */ __name(async (context) => {
  const url = new URL(context.request.url);
  const format = url.searchParams.get("format");
  const svgHeaders = {
    "cache-control": "public, max-age=300",
    "access-control-allow-origin": "*"
  };
  const axisParam = url.searchParams.get("axis");
  const cardParam = url.searchParams.get("card");
  if (axisParam || cardParam) {
    const b = axisParam ? axisBadge(axisParam) : await cardBadge(url.origin, cardParam);
    if (format === "shields") {
      return new Response(
        JSON.stringify({ schemaVersion: 1, label: b.label, message: b.message, color: b.colour }),
        { headers: { ...svgHeaders, "content-type": "application/json; charset=utf-8" } }
      );
    }
    if (format === "json") {
      return new Response(
        JSON.stringify({ label: b.label, message: b.message, color: b.colour, state: b.state, verify: VERIFY_URL }, null, 2),
        { headers: { ...svgHeaders, "content-type": "application/json; charset=utf-8" } }
      );
    }
    return new Response(svgBadge(b.label, b.message, b.colour), {
      headers: { ...svgHeaders, "content-type": "image/svg+xml; charset=utf-8" }
    });
  }
  const board = boardCounts();
  const total = clampInt(url.searchParams.get("total"), board.quotable);
  const measured = url.searchParams.has("measured") ? clampInt(url.searchParams.get("measured"), 0, total) : board.measured;
  const label = (url.searchParams.get("label") || "GSPC").slice(0, 40);
  const isDefaultBoard = !url.searchParams.has("measured");
  const message = measured <= 0 ? "unmeasured" : isDefaultBoard ? board.defaultMessage : `${measured} measured`;
  const colour = colourFor(measured, total);
  const headers = svgHeaders;
  if (format === "shields") {
    return new Response(
      JSON.stringify({ schemaVersion: 1, label, message, color: measured <= 0 ? "lightgrey" : colour }),
      { headers: { ...headers, "content-type": "application/json; charset=utf-8" } }
    );
  }
  if (format === "json") {
    return new Response(
      JSON.stringify({
        measured,
        message,
        color: colour,
        verify: VERIFY_URL,
        public_count: board.publicCount,
        ruling: `${board.publicCount} (derived from GET /api/gspc totals; never typed)`
      }, null, 2),
      { headers: { ...headers, "content-type": "application/json; charset=utf-8" } }
    );
  }
  return new Response(svgBadge(label, message, colour), {
    headers: { ...headers, "content-type": "image/svg+xml; charset=utf-8" }
  });
}, "onRequestGet");

// api/benchmark-quality.ts
var ASSESSED_ON = "2026-08-23";
var SCHEMA = "csoai.benchmark-quality-register/0.1";
var PREDICATES = [
  // ── contamination resistance ──
  {
    id: "canary_or_leakage_control",
    group: "contamination_resistance",
    question: "Does the primary public artifact publish a canary string, or an explicit instruction intended to keep the items out of training corpora?",
    pass_means: "A canary string, canary GUID, or an explicit non-republication / leakage-control instruction is present in the fetched artifact."
  },
  {
    id: "temporal_split_declared",
    group: "contamination_resistance",
    question: "Does the benchmark declare a temporal boundary \u2014 items dated after a cutoff, or a periodic refresh of the item set?",
    pass_means: "The artifact states a dated refresh cadence or that items post-date a stated cutoff."
  },
  {
    id: "private_heldout_described",
    group: "contamination_resistance",
    question: "Does the benchmark describe a private or held-out portion whose items are not published?",
    pass_means: "The artifact states that some split is kept private, or that evaluation on it runs only through a submission service."
  },
  // ── reproducibility ──
  {
    id: "public_harness",
    group: "reproducibility",
    question: "Is the evaluation harness published so a third party can run it?",
    pass_means: "The artifact names a runnable public harness, script, or package for producing scores."
  },
  {
    id: "pinned_or_containerised_env",
    group: "reproducibility",
    question: "Is the evaluation environment pinned \u2014 a container image, a lockfile, or fixed seeds?",
    pass_means: "The artifact states containerised evaluation, a dependency lockfile, or fixed random seeds."
  },
  {
    id: "third_party_recompute_artifact",
    group: "reproducibility",
    question: "Does the benchmark link a third-party recompute \u2014 someone other than the authors reproducing the published numbers?",
    pass_means: "The artifact links an independent reproduction with its own result."
  },
  // ── statistical rigour ──
  {
    id: "confidence_intervals_reported",
    group: "statistical_rigour",
    question: "Are confidence intervals (or equivalent uncertainty) reported alongside the headline scores?",
    pass_means: "The artifact shows an interval, standard error, or posterior spread beside a score."
  },
  {
    id: "significance_test_between_ranked_systems",
    group: "statistical_rigour",
    question: "Is a significance test published between systems that the benchmark ranks against each other?",
    pass_means: "The artifact reports a test (p-value, paired test, or equivalent) between ranked systems, not merely point estimates."
  },
  {
    id: "effective_n_disclosed",
    group: "statistical_rigour",
    question: "Is the number of scored items \u2014 the n behind each figure \u2014 published?",
    pass_means: "The artifact states per-split or per-figure item counts."
  },
  // ── scoring transparency ──
  {
    id: "scoring_not_llm_judge",
    group: "scoring_transparency",
    question: "Is the scorer something other than a language model judging another language model?",
    pass_means: "The artifact describes deterministic scoring (unit tests, exact match, programmatic metric) or human adjudication, and does not describe an LLM judge."
  },
  {
    id: "public_rubric_or_scoring_code",
    group: "scoring_transparency",
    question: "Is the rubric or the scoring code public?",
    pass_means: "The artifact publishes the scoring code, or a written rubric a third party could apply."
  },
  // ── governance and conflict of interest ──
  {
    id: "funding_disclosed",
    group: "governance_coi",
    question: "Is the funding of the benchmark disclosed on the artifact a reader actually lands on?",
    pass_means: "The fetched artifact names who pays for the benchmark."
  },
  {
    id: "no_pay_to_rank_mechanism",
    group: "governance_coi",
    question: "Is the artifact free of any paid-listing, sponsored-ranking, or paid-submission mechanism for ranked parties?",
    pass_means: "No fee, sponsorship tier, or paid submission path for ranked parties appears in the fetched artifact."
  },
  {
    id: "private_pretesting_disclosed",
    group: "governance_coi",
    question: "If private or pre-release testing is permitted, is it disclosed?",
    pass_means: "The artifact states that pre-release or private testing happens (disclosure \u2014 not a judgment about whether it is fair)."
  },
  {
    id: "symmetric_data_access",
    group: "governance_coi",
    question: "Do all parties get the same access to the item data \u2014 no gate that some parties clear and others do not?",
    pass_means: "The items are published without a per-party access gate, or the gate applies identically to everyone."
  },
  {
    id: "deprecation_or_status_changelog",
    group: "governance_coi",
    question: "Is the benchmark's own lifecycle status \u2014 maintained, archived, superseded \u2014 published with a date?",
    pass_means: "The artifact carries a dated status or deprecation notice, or a release changelog for the benchmark itself."
  },
  // ── item quality ──
  {
    id: "label_error_rate_published",
    group: "item_quality",
    question: "Is a label-error rate, or an equivalent quantified item-error disclosure, published?",
    pass_means: "The artifact quantifies how many items are wrong or disputed \u2014 a rate or a delta, not a promise of quality."
  },
  {
    id: "corrections_process_public",
    group: "item_quality",
    question: "Is there a public route to report and get an item corrected?",
    pass_means: "The artifact links an issue tracker, form, or stated corrections procedure for item errors."
  },
  // ── licensing ──
  {
    id: "spdx_license_machine_readable",
    group: "licensing",
    question: "Is the licence stated as a machine-readable SPDX identifier on the artifact?",
    pass_means: "A recognisable SPDX id (MIT, Apache-2.0, CC-BY-4.0, \u2026) is shown in the artifact's own metadata."
  },
  // ── saturation and discrimination ──
  {
    id: "still_separates_top_systems",
    group: "saturation_discrimination",
    question: "Does the published leaderboard still separate the top systems \u2014 is there readable headroom left?",
    pass_means: "Top-of-board scores were read on the fetched page and are not compressed at the ceiling."
  },
  // ── failure disclosure ──
  {
    id: "public_corrections_ledger_or_versioning",
    group: "failure_disclosure",
    question: "Is there a public version history or corrections ledger for the item set itself?",
    pass_means: "The artifact publishes dated versions, a changelog, or a corrections ledger for the data."
  }
];
var SUBJECTS = [
  // ── MMLU ─────────────────────────────────────────────────────────────────────────────────
  {
    id: "mmlu",
    benchmark: "MMLU (Measuring Massive Multitask Language Understanding)",
    publisher: "Hendrycks et al. / CAIS",
    homepage: "https://github.com/hendrycks/test",
    scorer_kind: "unstated on the fetched artifacts",
    artifacts: [
      { key: "repo", url: "https://github.com/hendrycks/test", fetched: ASSESSED_ON, what: "the benchmark's primary repository page" },
      { key: "readme", url: "https://raw.githubusercontent.com/hendrycks/test/master/README.md", fetched: ASSESSED_ON, what: "the raw README, read for method statements" },
      { key: "hf", url: "https://huggingface.co/datasets/cais/mmlu", fetched: ASSESSED_ON, what: "the dataset card carrying licence, splits and row counts" }
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "FAIL", evidence: "Neither the repository README nor the dataset card mentions a canary string or any leakage-control instruction.", src: "hf" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "The card describes four fixed splits with no dated refresh and no post-cutoff item policy.", src: "hf" },
      { id: "private_heldout_described", result: "FAIL", evidence: "All four splits (auxiliary_train, dev, val, test) are published and downloadable; no split is described as private.", src: "hf" },
      { id: "public_harness", result: "PASS", evidence: "The repository states it contains OpenAI API evaluation code.", src: "repo" },
      { id: "pinned_or_containerised_env", result: "UNKNOWN", evidence: "No lockfile, container, or seed statement appears in the README.", src: "readme", unknown_reason: "The README is silent and the repository's dependency files were not opened in this pass; a pinned environment may exist unread." },
      { id: "third_party_recompute_artifact", result: "UNKNOWN", evidence: "No independent reproduction is linked from the fetched artifacts.", src: "repo", unknown_reason: "Third-party reproductions of MMLU exist in the literature; none is linked from the artifacts fetched, so no determination is recorded." },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "The repository leaderboard presents point scores by category with no interval or standard error.", src: "repo" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No significance test between ranked systems appears on either artifact.", src: "repo" },
      { id: "effective_n_disclosed", result: "PASS", evidence: "Per-split counts are published: test 14,042; val 1,531; dev 285; auxiliary_train 99,842.", src: "hf" },
      { id: "scoring_not_llm_judge", result: "UNKNOWN", evidence: "Neither artifact states how answers are scored.", src: "hf", unknown_reason: "The scoring method is undocumented on both fetched artifacts. A widely-assumed exact-match scorer is not a stated fact, and we do not record assumptions as measurements." },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: "Evaluation code ships in the public repository, so the scorer is inspectable even where it is undocumented.", src: "repo" },
      { id: "funding_disclosed", result: "UNKNOWN", evidence: "No funding statement appears on the repository page or the dataset card.", src: "repo", unknown_reason: "Funding may be disclosed in the associated paper, which was not fetched in this pass." },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "No fee, sponsorship tier, or paid submission path appears on either artifact.", src: "repo" },
      { id: "private_pretesting_disclosed", result: "UNKNOWN", evidence: "The artifacts do not address pre-release or private testing.", src: "repo", unknown_reason: "Silence on the artifact does not establish either that private pre-testing happens or that it does not." },
      { id: "symmetric_data_access", result: "PASS", evidence: "The test split is public and ungated on the dataset host \u2014 every party reads the same items.", src: "hf" },
      { id: "deprecation_or_status_changelog", result: "FAIL", evidence: "Neither artifact carries a dated lifecycle status or a release changelog.", src: "hf" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "The card's annotation-process and annotator sections both read as information-needed placeholders; no error rate is given.", src: "hf" },
      { id: "corrections_process_public", result: "FAIL", evidence: "No corrections route, errata list, or item-dispute procedure appears on either artifact.", src: "hf" },
      { id: "spdx_license_machine_readable", result: "PASS", evidence: "MIT, shown in the dataset card metadata and on the repository page.", src: "hf" },
      { id: "still_separates_top_systems", result: "UNKNOWN", evidence: "A leaderboard table is present on the repository page.", src: "repo", unknown_reason: "Top-of-board score values were not read in this pass, so no headroom determination is recorded. A guessed saturation verdict would be exactly the fabrication this register forbids." },
      { id: "public_corrections_ledger_or_versioning", result: "FAIL", evidence: "No dated versions, changelog, or corrections ledger for the item set appears on either artifact.", src: "hf" }
    ]
  },
  // ── BIG-bench ────────────────────────────────────────────────────────────────────────────
  {
    id: "big-bench",
    benchmark: "BIG-bench (Beyond the Imitation Game)",
    publisher: "Google and collaborating authors",
    homepage: "https://github.com/google/BIG-bench",
    scorer_kind: "programmatic metrics (e.g. exact string match) run by the repository harness",
    artifacts: [
      { key: "repo", url: "https://github.com/google/BIG-bench", fetched: ASSESSED_ON, what: "the repository README and repository status banner" }
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "PASS", evidence: "The README states all task files contain a canary string that should not be edited, to prevent tasks leaking into web-scraped training data.", src: "repo" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "No dated refresh cadence and no post-cutoff item policy appears in the README.", src: "repo" },
      { id: "private_heldout_described", result: "FAIL", evidence: "The README describes no held-out or private split; tasks live in the public repository.", src: "repo" },
      { id: "public_harness", result: "PASS", evidence: "The README documents a public evaluation path with an evaluate_task script and named metrics.", src: "repo" },
      { id: "pinned_or_containerised_env", result: "UNKNOWN", evidence: "The README documents a pytest gate for task submissions but states no container, lockfile, or seed policy for scoring runs.", src: "repo", unknown_reason: "Repository dependency files were not opened in this pass." },
      { id: "third_party_recompute_artifact", result: "UNKNOWN", evidence: "No independent reproduction is linked from the README.", src: "repo", unknown_reason: "Not determinable from the single artifact fetched." },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "No interval, standard error, or uncertainty statement appears in the README.", src: "repo" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No significance testing between ranked systems appears in the README.", src: "repo" },
      { id: "effective_n_disclosed", result: "UNKNOWN", evidence: "Per-task item counts were not read on the fetched page.", src: "repo", unknown_reason: "Counts live in the individual task.json files, which were not fetched in this pass." },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: "The README describes programmatic metrics such as exact string match and probability-based scoring; no model-graded evaluation is described.", src: "repo" },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: "Scoring code and the named metric set are published in the repository.", src: "repo" },
      { id: "funding_disclosed", result: "UNKNOWN", evidence: "No funding statement appears in the README.", src: "repo", unknown_reason: "Funding may be disclosed in the associated paper, which was not fetched in this pass." },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "No fee, sponsorship tier, or paid submission path appears in the README.", src: "repo" },
      { id: "private_pretesting_disclosed", result: "UNKNOWN", evidence: "The README does not address pre-release or private testing.", src: "repo", unknown_reason: "Silence does not establish presence or absence." },
      { id: "symmetric_data_access", result: "PASS", evidence: "Tasks are in a public, ungated repository under an open licence \u2014 the same items are available to every party.", src: "repo" },
      { id: "deprecation_or_status_changelog", result: "PASS", evidence: "The repository carries a dated archive notice: archived by the owner on 17 April 2026, now read-only.", src: "repo" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "No label-error rate or quantified item-error disclosure appears in the README.", src: "repo" },
      { id: "corrections_process_public", result: "UNKNOWN", evidence: "The README names review criteria for accepting task submissions and an automated test gate, but does not describe a route to correct an accepted item.", src: "repo", unknown_reason: "A submission-review gate is not the same thing as a corrections route; the artifact does not resolve whether one exists. The archive notice also means any such route may now be closed." },
      { id: "spdx_license_machine_readable", result: "PASS", evidence: "Apache-2.0, shown on the repository page.", src: "repo" },
      { id: "still_separates_top_systems", result: "UNKNOWN", evidence: "The repository publishes no live leaderboard that was read in this pass.", src: "repo", unknown_reason: "No top-of-board scores were read, so no headroom determination is recorded." },
      { id: "public_corrections_ledger_or_versioning", result: "UNKNOWN", evidence: "No changelog or corrections ledger for the task set was observed on the fetched page.", src: "repo", unknown_reason: "Git history exists for the repository but was not fetched or read as a published corrections ledger." }
    ]
  },
  // ── SWE-bench ────────────────────────────────────────────────────────────────────────────
  {
    id: "swe-bench",
    benchmark: "SWE-bench",
    publisher: "SWE-bench team (Princeton NLP lineage)",
    homepage: "https://www.swebench.com",
    scorer_kind: "the repository's own unit tests, run in a container \u2014 a patch resolves an instance or it does not",
    artifacts: [
      { key: "repo", url: "https://github.com/SWE-bench/SWE-bench", fetched: ASSESSED_ON, what: "the repository README: licence, splits, harness, submission" },
      { key: "guide", url: "https://www.swebench.com/SWE-bench/guides/evaluation/", fetched: ASSESSED_ON, what: "the official evaluation guide: how grading works" }
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "FAIL", evidence: "No canary string or leakage-control instruction appears on the README or the evaluation guide.", src: "repo" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "Neither fetched artifact declares a dated cutoff or a refresh cadence for instances.", src: "repo" },
      { id: "private_heldout_described", result: "PASS", evidence: "The README states that evaluation for the multimodal test split is kept private and runs through a submission CLI.", src: "repo" },
      { id: "public_harness", result: "PASS", evidence: "A public harness is documented and run with a single command; the README states Docker is used for reproducible evaluations.", src: "repo" },
      { id: "pinned_or_containerised_env", result: "PASS", evidence: "Evaluation runs in Docker containers with a cache-level control over base, env and instance images.", src: "guide" },
      { id: "third_party_recompute_artifact", result: "UNKNOWN", evidence: "No independent recompute is linked from either fetched artifact.", src: "repo", unknown_reason: "Not determinable from the artifacts fetched." },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "Neither artifact reports intervals or uncertainty beside resolve rates.", src: "guide" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No significance test between ranked systems appears on either artifact.", src: "guide" },
      { id: "effective_n_disclosed", result: "PASS", evidence: "The README states the Verified subset is 500 problems confirmed solvable by software engineers.", src: "repo" },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: "The guide states patches are applied to real repositories and the repository's tests are run to verify the issue is resolved. No LLM judging is described.", src: "guide" },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: "The harness is public and the guide documents the resolved / unresolved / error categories it emits.", src: "guide" },
      { id: "funding_disclosed", result: "UNKNOWN", evidence: "No funding statement appears on either fetched artifact.", src: "repo", unknown_reason: "Funding may be disclosed in the associated papers, which were not fetched in this pass." },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "Leaderboard submission runs through a public CLI; no fee or sponsorship tier appears on either artifact.", src: "repo" },
      { id: "private_pretesting_disclosed", result: "UNKNOWN", evidence: "Neither artifact addresses pre-release or private testing of systems before public listing.", src: "repo", unknown_reason: "Silence does not establish presence or absence." },
      { id: "symmetric_data_access", result: "PASS", evidence: "Public splits are ungated, and the private multimodal test split is withheld from everyone alike rather than from some parties.", src: "repo" },
      { id: "deprecation_or_status_changelog", result: "PASS", evidence: "A CHANGELOG file is published in the repository root.", src: "repo" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "No label-error rate is published. The Verified subset is described as human-confirmed solvable \u2014 an item-quality intervention, but not a quantified error rate for the full set.", src: "repo" },
      { id: "corrections_process_public", result: "UNKNOWN", evidence: "A changelog exists, but neither artifact describes a route to report and correct a bad instance.", src: "repo", unknown_reason: "The repository has an issue tracker, but no corrections procedure is stated on the artifacts fetched." },
      { id: "spdx_license_machine_readable", result: "PASS", evidence: "MIT, stated on the README with a pointer to the licence file.", src: "repo" },
      { id: "still_separates_top_systems", result: "UNKNOWN", evidence: "The public leaderboard was not fetched in this pass.", src: "repo", unknown_reason: "No top-of-board scores were read, so no headroom determination is recorded." },
      { id: "public_corrections_ledger_or_versioning", result: "PASS", evidence: "A published CHANGELOG gives the item set a dated version history.", src: "repo" }
    ]
  },
  // ── GPQA ─────────────────────────────────────────────────────────────────────────────────
  {
    id: "gpqa",
    benchmark: "GPQA (Graduate-Level Google-Proof Q&A)",
    publisher: "Rein et al.",
    homepage: "https://huggingface.co/datasets/Idavidrein/gpqa",
    scorer_kind: "unstated on the fetched dataset card",
    artifacts: [
      { key: "card", url: "https://huggingface.co/datasets/Idavidrein/gpqa", fetched: ASSESSED_ON, what: "the gated dataset card: access terms, licence, validation accuracies, corrections form" }
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "PASS", evidence: "The card instructs users not to reveal examples from the dataset in plain text or images online, to reduce leakage into foundation-model training corpora.", src: "card" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "The card declares no dated cutoff and no refresh cadence.", src: "card" },
      { id: "private_heldout_described", result: "FAIL", evidence: "The card describes no held-out portion withheld from the released set.", src: "card" },
      { id: "public_harness", result: "UNKNOWN", evidence: "The dataset card documents no harness.", src: "card", unknown_reason: "Only the dataset card was fetched; the authors' evaluation repository was not fetched in this pass, so no determination is recorded." },
      { id: "pinned_or_containerised_env", result: "UNKNOWN", evidence: "The card states no environment or seed policy.", src: "card", unknown_reason: "Same reason: the evaluation repository was not fetched." },
      { id: "third_party_recompute_artifact", result: "UNKNOWN", evidence: "No independent recompute is linked from the card.", src: "card", unknown_reason: "Not determinable from the single artifact fetched." },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "Validation figures are given as bare point accuracies \u2014 expert 65%, non-expert 34%, a GPT-4 baseline 39% \u2014 with no intervals.", src: "card" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No significance test between systems appears on the card.", src: "card" },
      { id: "effective_n_disclosed", result: "UNKNOWN", evidence: "Split row counts were not read on the fetched card.", src: "card", unknown_reason: "The card's split table was not captured in this pass; the published item counts may well be stated and simply were not read." },
      { id: "scoring_not_llm_judge", result: "UNKNOWN", evidence: "The card does not state how answers are scored.", src: "card", unknown_reason: "Undocumented on the artifact fetched. We do not infer a scorer from the item format." },
      { id: "public_rubric_or_scoring_code", result: "UNKNOWN", evidence: "No rubric or scoring code is published on the card.", src: "card", unknown_reason: "The authors' evaluation repository was not fetched in this pass." },
      { id: "funding_disclosed", result: "UNKNOWN", evidence: "No funding statement appears on the card.", src: "card", unknown_reason: "Funding may be disclosed in the paper, which was not fetched in this pass." },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "GPQA publishes items, not a ranking service; no fee, sponsorship, or paid submission path appears on the card.", src: "card" },
      { id: "private_pretesting_disclosed", result: "UNKNOWN", evidence: "The card does not address pre-release testing.", src: "card", unknown_reason: "Silence does not establish presence or absence." },
      { id: "symmetric_data_access", result: "FAIL", evidence: "Access is gated: the card requires users to share contact information and accept non-disclosure conditions before download. Access is therefore conditional and per-party, not open.", src: "card" },
      { id: "deprecation_or_status_changelog", result: "FAIL", evidence: "No dated lifecycle status or release changelog appears on the card.", src: "card" },
      { id: "label_error_rate_published", result: "PASS", evidence: "The card quantifies item error: expert accuracy 65%, rising to 74% when identified mistakes are excluded. That delta is a published item-error disclosure.", src: "card" },
      { id: "corrections_process_public", result: "PASS", evidence: "The card publishes a corrections submission form for reporting item problems.", src: "card" },
      { id: "spdx_license_machine_readable", result: "PASS", evidence: "CC-BY-4.0, shown in the dataset card metadata.", src: "card" },
      { id: "still_separates_top_systems", result: "UNKNOWN", evidence: "The card carries no live leaderboard that was read in this pass.", src: "card", unknown_reason: "No top-of-board scores were read, so no headroom determination is recorded." },
      { id: "public_corrections_ledger_or_versioning", result: "FAIL", evidence: "A corrections form exists, but no version history or published ledger of accepted corrections appears on the card \u2014 reports go in, nothing comes back out in public.", src: "card" }
    ]
  },
  // ── LiveBench ────────────────────────────────────────────────────────────────────────────
  {
    id: "livebench",
    benchmark: "LiveBench",
    publisher: "LiveBench authors",
    homepage: "https://livebench.ai",
    scorer_kind: "automatic scoring against objective ground-truth answers; the project states no LLM judge is used",
    artifacts: [
      { key: "repo", url: "https://github.com/LiveBench/LiveBench", fetched: ASSESSED_ON, what: "the repository README: contamination policy, scoring, harness, releases" }
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "FAIL", evidence: "No canary string or non-republication instruction appears in the README; the contamination strategy is refresh, not marking.", src: "repo" },
      { id: "temporal_split_declared", result: "PASS", evidence: "The README states new questions are released monthly and that questions are drawn from recently-released datasets, arXiv papers, news articles and film synopses. A dated current release is named.", src: "repo" },
      { id: "private_heldout_described", result: "UNKNOWN", evidence: "The README names a current release date later than the date of the publicly-released questions.", src: "repo", unknown_reason: "The gap between the current release and the public question set suggests questions may be withheld, but the README does not state that they are. Inferring a held-out set from two dates would be a guess, so none is recorded." },
      { id: "public_harness", result: "PASS", evidence: "A single public script runs the whole pipeline \u2014 generating answers, scoring them, and showing results.", src: "repo" },
      { id: "pinned_or_containerised_env", result: "UNKNOWN", evidence: "The README documents an editable pip install from a project file but quotes no pinned versions, container, or seed.", src: "repo", unknown_reason: "Whether the project file pins versions was not determined; the file itself was not fetched." },
      { id: "third_party_recompute_artifact", result: "UNKNOWN", evidence: "No independent recompute is linked from the README.", src: "repo", unknown_reason: "Not determinable from the artifact fetched." },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "No interval or uncertainty statement appears in the README.", src: "repo" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No significance test between ranked systems appears in the README.", src: "repo" },
      { id: "effective_n_disclosed", result: "UNKNOWN", evidence: "Question counts per release were not read on the fetched page.", src: "repo", unknown_reason: "Counts were not captured in this pass." },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: "The README states every question has verifiable, objective ground-truth answers, scored automatically without the use of an LLM judge.", src: "repo" },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: "The scoring stage is part of the published pipeline script in the public repository.", src: "repo" },
      { id: "funding_disclosed", result: "FAIL", evidence: "No funding or sponsorship statement appears in the README.", src: "repo" },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "No fee, sponsorship tier, or paid submission path appears in the README.", src: "repo" },
      { id: "private_pretesting_disclosed", result: "UNKNOWN", evidence: "The README does not address pre-release testing of systems.", src: "repo", unknown_reason: "Silence does not establish presence or absence." },
      { id: "symmetric_data_access", result: "PASS", evidence: "The released question set is public and ungated in the repository; no per-party access condition appears.", src: "repo" },
      { id: "deprecation_or_status_changelog", result: "PASS", evidence: "The README points to a changelog covering each LiveBench release, and names the current release by date.", src: "repo" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "No label-error rate or quantified item-error disclosure appears in the README.", src: "repo" },
      { id: "corrections_process_public", result: "UNKNOWN", evidence: "No corrections route for a bad question is described in the README.", src: "repo", unknown_reason: "The repository has an issue tracker, but no corrections procedure is stated on the artifact fetched." },
      { id: "spdx_license_machine_readable", result: "UNKNOWN", evidence: "A licence file is present in the repository, but its identifier was not read on the fetched page.", src: "repo", unknown_reason: "The licence file itself was not fetched, so no SPDX identifier is recorded. Naming one from memory would be a fabrication." },
      { id: "still_separates_top_systems", result: "UNKNOWN", evidence: "The public leaderboard site was not fetched in this pass.", src: "repo", unknown_reason: "No top-of-board scores were read, so no headroom determination is recorded." },
      { id: "public_corrections_ledger_or_versioning", result: "PASS", evidence: "Dated releases plus a published changelog give the question set a public version history.", src: "repo" }
    ]
  },
  // ── LMArena / Arena ──────────────────────────────────────────────────────────────────────
  {
    id: "lmarena",
    benchmark: "LMArena (Arena) model leaderboard",
    publisher: "Arena / LMArena",
    homepage: "https://arena.ai",
    scorer_kind: "human pairwise preference votes on anonymous side-by-side outputs",
    artifacts: [
      { key: "board", url: "https://arena.ai/leaderboard", fetched: ASSESSED_ON, what: "the leaderboard, reached via a 301 from lmarena.ai/leaderboard. Only navigation chrome was present in the served HTML." },
      { key: "how", url: "https://arena.ai/how-it-works", fetched: ASSESSED_ON, what: "the public method page: battle mode, voting, model testing" }
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "FAIL", evidence: "No canary or leakage-control instruction appears on the method page; prompts come from users at vote time.", src: "how" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "No dated cutoff or refresh cadence for a fixed item set is declared; there is no fixed item set.", src: "how" },
      { id: "private_heldout_described", result: "FAIL", evidence: "No private or held-out item set is described on the method page.", src: "how" },
      { id: "public_harness", result: "UNKNOWN", evidence: "The method page names no public harness a third party could run.", src: "how", unknown_reason: "The organisation publishes research code elsewhere; nothing was linked from the artifacts fetched, so no determination is recorded." },
      { id: "pinned_or_containerised_env", result: "UNKNOWN", evidence: "No environment or seed policy appears on the artifacts fetched.", src: "how", unknown_reason: "Not addressed on either page." },
      { id: "third_party_recompute_artifact", result: "UNKNOWN", evidence: "No independent recompute is linked from either page.", src: "how", unknown_reason: "Not determinable from the artifacts fetched. Recomputation would also require the vote data, whose availability is not stated." },
      { id: "confidence_intervals_reported", result: "UNKNOWN", evidence: "The leaderboard HTML served to a non-browser client carried navigation only \u2014 no scores, no intervals.", src: "board", unknown_reason: "The leaderboard is client-rendered: its scores and any intervals are drawn after script execution, which this register does not perform. This predicate cannot be answered from the served artifact." },
      { id: "significance_test_between_ranked_systems", result: "UNKNOWN", evidence: "No statistical method is described on the method page, and the leaderboard itself did not render to the fetch.", src: "board", unknown_reason: "Same client-rendering limit. The method page is deliberately high-level and states no ranking mathematics." },
      { id: "effective_n_disclosed", result: "UNKNOWN", evidence: "Vote counts were not present in the served leaderboard HTML.", src: "board", unknown_reason: "Same client-rendering limit." },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: "The method page describes two anonymous models served side by side with the user deciding which answer fits better \u2014 a human vote, not a model judging a model.", src: "how" },
      { id: "public_rubric_or_scoring_code", result: "FAIL", evidence: "The vote criterion published is which answer best fits the voter's own needs. That is a preference, not a rubric a third party could apply consistently, and no scoring code is published on either page.", src: "how" },
      { id: "funding_disclosed", result: "FAIL", evidence: "Neither fetched page discloses funding, sponsorship, or model-provider commercial relationships.", src: "how" },
      { id: "no_pay_to_rank_mechanism", result: "UNKNOWN", evidence: "No paid-listing mechanism was observed on the artifacts fetched, and none is disclosed either way.", src: "how", unknown_reason: "Absence of a disclosure is not evidence that no commercial relationship with ranked parties exists. This is precisely the predicate that most needs a disclosure and does not have one, so it is recorded as unresolved rather than passed." },
      { id: "private_pretesting_disclosed", result: "PASS", evidence: "The method page discloses that since March 2024 the platform has helped test proprietary and open-source models from labs of all sizes, including pre-release models.", src: "how" },
      { id: "symmetric_data_access", result: "UNKNOWN", evidence: "Whether all providers receive the same access to battle and vote data is not addressed on either page.", src: "how", unknown_reason: "Not stated. Given that pre-release testing is disclosed, the symmetry question is live and unanswered on the public artifacts." },
      { id: "deprecation_or_status_changelog", result: "UNKNOWN", evidence: "No dated lifecycle or release changelog was observed on the artifacts fetched.", src: "board", unknown_reason: "Client-rendered surface; a changelog may exist on a page not fetched." },
      { id: "label_error_rate_published", result: "UNKNOWN", evidence: "Preference votes carry no gold label, and no vote-quality or error rate is published on the artifacts fetched.", src: "how", unknown_reason: "The predicate assumes a gold-labelled item set. For a preference leaderboard the analogous disclosure would be a vote-quality or noise estimate; none appears, and we do not convert a category mismatch into a FAIL." },
      { id: "corrections_process_public", result: "UNKNOWN", evidence: "No corrections or dispute route appears on the artifacts fetched.", src: "how", unknown_reason: "Not addressed on either page." },
      { id: "spdx_license_machine_readable", result: "UNKNOWN", evidence: "No licence identifier appears on either fetched page.", src: "how", unknown_reason: "Leaderboard data licensing is not stated on the artifacts fetched." },
      { id: "still_separates_top_systems", result: "UNKNOWN", evidence: "Scores did not render to the fetch, so no separation between top systems could be read.", src: "board", unknown_reason: "Client-rendered leaderboard. Reporting a saturation verdict here would require reading numbers we did not read." },
      { id: "public_corrections_ledger_or_versioning", result: "UNKNOWN", evidence: "No public version history or corrections ledger was observed on the artifacts fetched.", src: "board", unknown_reason: "Client-rendered surface; not determinable from the served HTML." }
    ]
  },
  // ── ARC-AGI ─────────────────────────────────────────────────────────────────────────────
  {
    id: "arc-agi",
    benchmark: "Abstraction and Reasoning Corpus for Artificial General Intelligence 2 (ARC-AGI-2)",
    publisher: "ARC Prize Foundation (nonprofit; co-founded by Fran\xE7ois Chollet and Mike Knoop, president Greg Kamradt)",
    homepage: "https://arcprize.org/arc-agi-2",
    scorer_kind: "Exact grid match: a task is solved only when the test-taker produces the correct output grid (dimensions plus every cell) for ALL test inputs. The readme is internally inconsistent on attempts: the 'Task success criterion' states 2 trials, while the 'Task file format' section states 3 trials (it also states 'Only *exact* solutions (all cells match the expected answer) can be said to be correct'). The site states the eval sets require pass@2 (solved by >=2 humans in <2 attempts). Scoring is done by the ARC-AGI Benchmarking repo / Kaggle-notebook verification pipeline, not by an LLM judge.",
    artifacts: [
      { key: "arc-agi-2-readme", url: "https://github.com/arcprize/ARC-AGI-2/blob/main/readme.md", fetched: "2026-08-23", what: "ARC-AGI-2 dataset readme: dataset composition (1,000 training / 120 eval), task success criterion, private-test-tier description, task JSON format, leakage warning." },
      { key: "arc-agi-2-site", url: "https://arcprize.org/arc-agi-2", fetched: "2026-08-23", what: "ARC-AGI-2 benchmark page: dataset-structure table (1,000 train / 120 public / 120 semi-private / 120 private), pass@2 calibration, 'easy for humans, hard for AI' claims." },
      { key: "arc-prize-policy", url: "https://arcprize.org/policy", fetched: "2026-08-23", what: "ARC Prize Verified Official Testing Policy: methodology, model selection, dataset tiers, verification process, reproducibility, funding/independence, verified badges." },
      { key: "arc-agi-2-changelog", url: "https://github.com/arcprize/ARC-AGI-2/blob/main/changelog.md", fetched: "2026-08-23", what: "Versioned public changelog of ARC-AGI-2 task corrections (off-by-one-pixel errors, ambiguities) with dates and commit hashes." }
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "PASS", evidence: "The readme explicitly warns against leakage: 'To ensure fair evaluation results, do not leak information from the evaluation set into your algorithm (e.g. by looking at the evaluation tasks yourself during development, or by repeatedly modifying an algorithm while using its evaluation score as feedback).' It also describes a 'semi-private set intended for testing remotely-hosted commercial models with low leakage probability' and a 'fully-private set... with near-zeo leakage probability.'", src: "arc-agi-2-readme" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "The fetched readme/site describe only a task-tier split (public trainings, public eval, semi-private eval, private eval), not a temporal (time-based) train/test split; no temporal split is declared on the fetched artifacts.", src: "arc-agi-2-readme" },
      { id: "private_heldout_described", result: "PASS", evidence: "The readme states: 'ARC-AGI-2 also features two private test sets not included in the repo: A semi-private set intended for testing remotely-hosted commercial models... A fully-private set intended for testing self-contained models during the ARC Prize competition, with near-zeo leakage probability.' The site's table lists 'Semi-Private Eval Set 120 tasks... not public' and 'Private Eval Set 120 tasks... not public'.", src: "arc-agi-2-readme" },
      { id: "public_harness", result: "PASS", evidence: "The testing policy states: 'ARC-AGI-1 and 2 evaluations are run using the open source ARC-AGI Benchmarking repository' and 'How We Run Evaluations: ARC-AGI-1 & ARC-AGI-2' describe a reproducible invocation via a public repo.", src: "arc-prize-policy" },
      { id: "pinned_or_containerised_env", result: "PASS", evidence: "The policy fixes the runtime environment: 'Solutions must be submitted via a Kaggle notebook and run in <12 hours to ensure reproducibility'; 'The Kaggle notebook serves as the entry point and runtime environment for your submission... All configuration, setup, and compute provisioning must be automated within the Kaggle notebook itself.'", src: "arc-prize-policy" },
      { id: "third_party_recompute_artifact", result: "PASS", evidence: "Policy: evaluation uses the open source 'ARC-AGI Benchmarking repository'; 'Public testing results (model outputs, evaluation durations, costs, and individual task scores) are published to HuggingFace'; and a verification fund states 'For each new verified high-score reproduction, we will reimburse up to $2,500.' With 'Solutions must be submitted via a Kaggle notebook and run in <12 hours to ensure reproducibility.'", src: "arc-prize-policy" },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "The policy reports only agreement thresholds ('ARC-AGI-1 - ... within \xB110 percentage points. ARC-AGI-2 - ... within \xB13 percentage points.'), which are pass/fail agreement bounds, not confidence intervals with a stated confidence level. Neither the readme nor the leaderboard text I fetched reports confidence intervals on scores.", src: "arc-prize-policy" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "The policy describes a verification/selection/agreement process but no statistical significance test between ranked systems is described on the fetched artifacts.", src: "arc-prize-policy" },
      { id: "effective_n_disclosed", result: "PASS", evidence: "The readme states 'ARC-AGI-2 contains 1,000 public training tasks and 120 public evaluation tasks' and the site table enumerates 1,000 / 120 / 120 / 120 per tier; each eval task is stated to have been 'solved by a minimum of 2 people... in 2 attempts or less in a controlled test.'", src: "arc-agi-2-readme" },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: "The readme states the task success criterion: 'Only *exact* solutions (all cells match the expected answer) can be said to be correct.' Grids are compared cell-by-cell against a reference output, not graded by an LLM.", src: "arc-agi-2-readme" },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: "The exact-match success criterion and pass@2 trial rule are spelled out in the readme ('A test-taker is said to solve a task when... they are able to produce the correct output grid for *all* test inputs... the test-taker is allowed 2 trials'), and the policy names the open-source 'ARC-AGI Benchmarking repository' used to score.", src: "arc-agi-2-readme" },
      { id: "funding_disclosed", result: "PASS", evidence: "Policy: 'ARC Prize Foundation is a nonprofit funded by donations from individuals, foundations, and AI labs. We publicly disclose all donors on our donation page.' It also states sponsorship 'has no influence over what we test, how we test, or when we publish.'", src: "arc-prize-policy" },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "Policy: 'Sponsors receive no privileged access to our Private or Semi-Private Evaluation datasets, nor any special influence over the development of our benchmarks... No sponsor, regardless of contribution level, gains access to proprietary information.' Verification is not sold; the FAQ frames the leaderboard as a nonprofit transparency effort.", src: "arc-prize-policy" },
      { id: "private_pretesting_disclosed", result: "PASS", evidence: "Readme: 'Each task in `evaluation` has been solved by a minimum of 2 people (many tasks were solved by more) in 2 attempts or less in a controlled test.' Site: 'all tasks solved pass@2 by at least two humans.' Human pre-testing/validation of every public eval task is disclosed.", src: "arc-agi-2-readme" },
      { id: "symmetric_data_access", result: "FAIL", evidence: "The policy partitions data asymmetrically: 'Public Tasks - Fully open source and available for anyone to use... Private Evaluation Set - Access is extremely restricted to a small number of trusted parties. This set is used for the ARC Prize competition private leaderboard.' Different testers get different tiers (community gets public; verified/commercial get semi-private; competition gets private).", src: "arc-prize-policy" },
      { id: "deprecation_or_status_changelog", result: "PASS", evidence: "The repo ships a versioned changelog (`changelog.md`) that tracks dataset state with dated entries (e.g. '2025-03-24 * 1,360 ARC-AGI-2 released', '2025-04-17 * Public eval task `d8e07eb2`...'). The site also publishes ARC-AGI-2 as a successor to ARC-AGI-1.", src: "arc-agi-2-changelog" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "The changelog documents specific corrections (e.g. '2025-04-14 * Public Eval Tasks were updated with minor adjustments (off-by-one-pixel errors and slight ambiguities) to train and test pairs') and lists dozens of per-task commit fixes, but no aggregate label-error rate is published anywhere on the fetched artifacts.", src: "arc-agi-2-changelog" },
      { id: "corrections_process_public", result: "PASS", evidence: "The public changelog logs corrections with dates and commit links (e.g. 'Single test pair update... 385b7612', 'Train pair off by 2 error... PR #27'), i.e. corrections are made through a version-controlled public process.", src: "arc-agi-2-changelog" },
      { id: "spdx_license_machine_readable", result: "FAIL", evidence: "The fetched readme states no license; the repo provides a LICENSE file whose text is 'Apache License Version 2.0, January 2004', but no `SPDX-License-Identifier` line and no machine-readable license field (no package metadata `license` key) appear in what I fetched.", src: "arc-agi-2-readme" },
      { id: "still_separates_top_systems", result: "PASS", evidence: "The site states: 'Pure LLMs score 0% on ARC-AGI-2, and public AI reasoning systems achieve only single-digit percentage scores... every task in ARC-AGI-2 has been solved by at least 2 humans in under 2 attempts.' The readme states 'Average human performance on these tasks in our test sample was 66%.' The benchmark is designed so leading reasoning models still score far below human \u2014 i.e. it still separates top systems.", src: "arc-agi-2-site" },
      { id: "public_corrections_ledger_or_versioning", result: "PASS", evidence: "A dated, commit-linked changelog is publicly versioned in the repo (entries from 2025-03-24 through 2025-04-17, with per-task commit hashes/PRs), serving as a public corrections/versioning ledger.", src: "arc-agi-2-changelog" }
    ]
  },
  // ── GAIA ────────────────────────────────────────────────────────────────────────────────
  {
    id: "gaia",
    benchmark: "GAIA: a benchmark for General AI Assistants",
    publisher: "Meta (FAIR / GenAI), Hugging Face, AutoGPT, and collaborators (Mialon, Scialom et al.)",
    homepage: "https://huggingface.co/datasets/gaia-benchmark/GAIA",
    scorer_kind: `Quasi-exact match: 'evaluation is done via quasi exact match between a model's answer and the ground truth (up to some normalization that is tied to the "type" of the ground truth).' 'There is only one correct answer.' User responses are compared string-wise to the single ground-truth answer; not scored by an LLM judge.`,
    artifacts: [
      { key: "gaia-arxiv-paper", url: "https://arxiv.org/abs/2311.12983", fetched: "2026-08-23", what: "GAIA technical paper: benchmark philosophy, dataset composition (466 questions, levels 1/2/3), validation, human baseline, exact-match scoring, reproducibility discussion." },
      { key: "gaia-hf-dataset-card", url: "https://huggingface.co/datasets/gaia-benchmark/GAIA", fetched: "2026-08-23", what: "Canonical GAIA HuggingFace dataset card (GATED \u2014 raw README and datasets-server API return HTTP 401 without authentication; card content could not be read)." },
      { key: "gaia-hf-leaderboard", url: "https://huggingface.co/spaces/gaia-benchmark/leaderboard", fetched: "2026-08-23", what: "GAIA leaderboard space (public benchmark leaderboard that the paper says hosts the held-out scoring)." }
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "PASS", evidence: "The paper documents leakage checks in question design: 'We type our questions in a search engine and check whether the answer can be deducted from the first page of results.' Question guidance: 'Make sure the answer to your question does not exist on the internet in plain text.' It also 'release[s] our questions while retaining answers to 300 of them to power a leader-board.'", src: "gaia-arxiv-paper" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "The paper describes a level-based and annotation-based split (levels 1/2/3; 166 'annotated' developer questions + 300 'without annotations'), not a temporal (time-based) split; no temporal split is declared on the fetched artifact.", src: "gaia-arxiv-paper" },
      { id: "private_heldout_described", result: "PASS", evidence: "The paper explicitly retains held-out answers: 'We release a developer set of 166 annotated questions and release the remaining 300 questions without annotations: the benchmark will be notably hosted as a leaderboard.'", src: "gaia-arxiv-paper" },
      { id: "public_harness", result: "PASS", evidence: "The paper states 'We provide our scoring function along with the leaderboard. Section 3.3 Composition of GAIA' \u2014 a public scoring function accompanies the released leaderboard.", src: "gaia-arxiv-paper" },
      { id: "pinned_or_containerised_env", result: "FAIL", evidence: "The paper describes baselines run ad hoc ('Whenever an API is available, we run the model three times and report the average results'; 'we resort to manual ChatGPT queries' for GPT-4+plugins) but describes no pinned/containerised evaluation environment on the fetched artifact.", src: "gaia-arxiv-paper" },
      { id: "third_party_recompute_artifact", result: "PASS", evidence: "The paper provides the scoring function ('We provide our scoring function along with the leaderboard') and discusses reproducibility, while noting its limits: 'Reproducibility for closed-source assistants... an evaluation done at some point in time not reproducible.' The GPT-4+plugins score is explicitly flagged non-reproducible (an 'oracle' estimate).", src: "gaia-arxiv-paper" },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "Table 4 shows mean scores with margins such as 'GPT4 9.1 \xB1 2.5' and the text says 'Whenever we have direct API access, we run the model three times and report the average,' but the paper never describes these \xB1 bounds as confidence intervals and gives no confidence level. No formal confidence interval is stated on the fetched artifact.", src: "gaia-arxiv-paper" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No statistical significance test between the ranked baselines (GPT-4, GPT-4 Turbo, AutoGPT, GPT-4+plugins, search engine, human) is described on the fetched artifact \u2014 only mean scores per method.", src: "gaia-arxiv-paper" },
      { id: "effective_n_disclosed", result: "PASS", evidence: "The paper discloses question counts per level \u2014 'Number of questions 146 245 75' (Level 1/2/3, total 466) \u2014 and states 'we run the model three times and report the average' for API baselines, and that times were obtained 'by running the API on 20 questions then averaging.'", src: "gaia-arxiv-paper" },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: `The paper states: 'There is only one correct answer. Hence, evaluation is done via quasi exact match between a model's answer and the ground truth (up to some normalization that is tied to the "type" of the ground truth).' (Model-based grading is mentioned only as a future option.)`, src: "gaia-arxiv-paper" },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: `The paper both defines the scoring rule ('quasi exact match... up to some normalization that is tied to the "type" of the ground truth') and provides the scorer: 'We provide our scoring function along with the leaderboard.'`, src: "gaia-arxiv-paper" },
      { id: "funding_disclosed", result: "FAIL", evidence: "The paper lists author affiliations (FAIR/Meta, GenAI/Meta, Hugging Face, AutoGPT) and has an Acknowledgments list, but the fetched text states no specific funding/grant source for GAIA. (The generic arXiv footer acknowledging 'Simons Foundation...' is the standardized arXiv template, not a GAIA-specific disclosure.)", src: "gaia-arxiv-paper" },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "The paper frames GAIA as open scientific research ('We posit that the advent of AGI hinges on...'); it releases questions and hosts a public leaderboard, with no payment/rank mechanism described anywhere on the fetched artifact.", src: "gaia-arxiv-paper" },
      { id: "private_pretesting_disclosed", result: "PASS", evidence: "The paper discloses pre-release validation: 'Validation phase. After question creation, we ask two new independent annotators to answer the questions to check it is not ambiguous,' and reports validation annotator scores (93.9 / 91.8 / 87.3 for levels 1/2/3).", src: "gaia-arxiv-paper" },
      { id: "symmetric_data_access", result: "PASS", evidence: "All leaderboard participants are scored against the same retained held-out set; the paper releases a single developer set (166 annotated) and keeps one set of 300 answers for ranking, with no public/private tiers for different classes of participant described on the fetched artifact.", src: "gaia-arxiv-paper" },
      { id: "deprecation_or_status_changelog", result: "FAIL", evidence: "No deprecation/status changelog or version history is published in the fetched paper or leaderboard artifacts.", src: "gaia-arxiv-paper" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "The paper describes the validation phase (two independent annotators check ambiguity; human 'correct' rates 93.9/91.8/87.3) but publishes no quantitative label-error rate on the fetched artifact.", src: "gaia-arxiv-paper" },
      { id: "corrections_process_public", result: "FAIL", evidence: "No public corrections/errata process is described for GAIA on the fetched artifacts.", src: "gaia-arxiv-paper" },
      { id: "spdx_license_machine_readable", result: "UNKNOWN", unknown_reason: "The canonical HuggingFace dataset card (gaia-benchmark/GAIA) is gated \u2014 the raw README and datasets-server endpoints return HTTP 401 without authentication \u2014 and the fetched arXiv paper does not state a dataset license, so the license (the natural place to declare an SPDX identifier) could not be read.", evidence: "The license could not be determined: the dataset card is unreadable (gated/401) and the arXiv paper states no license.", src: "gaia-hf-dataset-card" },
      { id: "still_separates_top_systems", result: "PASS", evidence: "The paper states: 'the most capable LLMs do poorly on GAIA. Even equipped with tools, GPT4 does not exceed a 30% success rate for the easiest of our tasks, and 0% for the hardest. In the meantime, the average success rate for human respondents is 92%.' This large human-vs-AI gap shows GAIA still separates top systems.", src: "gaia-arxiv-paper" },
      { id: "public_corrections_ledger_or_versioning", result: "FAIL", evidence: "No public corrections ledger or dataset versioning is described on the fetched GAIA artifacts.", src: "gaia-arxiv-paper" }
    ]
  },
  // ── MATH ────────────────────────────────────────────────────────────────────────────────
  {
    id: "math",
    benchmark: "MATH (Mathematics Aptitude Test of Heuristics)",
    publisher: "Dan Hendrycks, Collin Burns, Saurav Kadavath, Akul Arora, Steven Basart, Eric Tang, Dawn Song, Jacob Steinhardt (UC Berkeley / CMU)",
    homepage: "https://github.com/hendrycks/math",
    scorer_kind: "Exact match on the final boxed answer after normalization: 'These answers are unique after normalization, allowing MATH to be scored with exact match rather than with heuristic metrics such as BLEU.' Answer formatting is forced via rules; a `math_equivalence` utility decides whether two answers are equivalent. Not scored by an LLM judge.",
    artifacts: [
      { key: "math-github-readme", url: "https://github.com/hendrycks/math", fetched: "2026-08-23", what: "Repo README: 'This repository contains dataset loaders and evaluation code', with download links to the MATH and AMPS datasets and the NeurIPS 2021 citation." },
      { key: "math-arxiv-paper", url: "https://arxiv.org/abs/2103.03874", fetched: "2026-08-23", what: "Measuring Mathematical Problem Solving With the MATH Dataset: dataset composition (12,500 = 7,500 train + 5,000 test), exact-match scoring, difficulty/subject tagging, human-level comparison, MIT license statement." },
      { key: "math-license", url: "https://github.com/hendrycks/math/blob/main/LICENSE", fetched: "2026-08-23", what: "MIT License text (Copyright (c) 2021 Dan Hendrycks)." },
      { key: "math-setup", url: "https://github.com/hendrycks/math/blob/main/setup.py", fetched: "2026-08-23", what: "Packaging metadata for the `math_equivalence` scoring utility, including the Trove classifier 'License :: OSI Approved :: MIT License'." }
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "FAIL", evidence: "No canary string or leakage-control mechanism is described on the fetched artifacts; the paper describes a fully public train/test release and the 'Dataset Intended Uses' section discusses intended use/cheating but no leakage control. (The test set is released in full, so nothing is held out to control leakage.)", src: "math-arxiv-paper" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "The split is by problem, not time: '12,500 problems (7,500 training and 5,000 test)'. No temporal (time-based) split is declared on the fetched artifact.", src: "math-arxiv-paper" },
      { id: "private_heldout_described", result: "FAIL", evidence: "The paper states '12,500 problems (7,500 training and 5,000 test)' and the repo/README point to the full dataset being publicly downloadable (HuggingFace `qwedsacf/competition_math`). No private held-out set is described \u2014 the test set is public.", src: "math-arxiv-paper" },
      { id: "public_harness", result: "PASS", evidence: "The README states: 'This repository contains dataset loaders and evaluation code'; the `math_equivalence` module in setup.py ('A utility for determining whether 2 answers for a problem in the MATH dataset are equivalent') is public scoring code.", src: "math-github-readme" },
      { id: "pinned_or_containerised_env", result: "FAIL", evidence: "No pinned/containerised evaluation environment is described; the repo provides setup.py, loaders and evaluation code but no container/pinned-runtime spec.", src: "math-github-readme" },
      { id: "third_party_recompute_artifact", result: "PASS", evidence: "The paper says 'the dataset and code for reproducing results is available at https://github.com/hendrycks/apps' (note: that URL on the fetched page points to the wrong repo, `apps` rather than `math`), and the repo publicly ships dataset loaders plus the `math_equivalence` scorer under an MIT license.", src: "math-arxiv-paper" },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "The paper reports single accuracy percentages per model (e.g. 4.9% for BART-Large on the test set) with no confidence intervals on the fetched artifact.", src: "math-arxiv-paper" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No statistical significance test between models is described on the fetched artifact; results are reported as point accuracies.", src: "math-arxiv-paper" },
      { id: "effective_n_disclosed", result: "PASS", evidence: "The paper discloses composition: '12,500 problems (7,500 training and 5,000 test)', tagging 'by difficulty from 1 to 5' and 'seven subjects', and states the human comparison used '20 problems from the MATH test set.'", src: "math-arxiv-paper" },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: "The paper states: 'These answers are unique after normalization, allowing MATH to be scored with exact match rather than with heuristic metrics such as BLEU.' Scoring is exact-match against a normalized ground-truth answer.", src: "math-arxiv-paper" },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: "The paper specifies the formatting rules ('we force the final boxed answers to follow consistent formatting rules... probabilities are expressed as simplified fractions') and the repo provides the `math_equivalence` scorer (setup.py).", src: "math-setup" },
      { id: "funding_disclosed", result: "FAIL", evidence: "The fetched paper text contains no acknowledgment or funding statement (no 'Acknowledgments'/'supported by' block was found in the fetched artifact).", src: "math-arxiv-paper" },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "The benchmark is a publicly released open dataset (MIT licensed) with no leaderboard, ranking, or payment mechanism described on the fetched artifacts.", src: "math-arxiv-paper" },
      { id: "private_pretesting_disclosed", result: "FAIL", evidence: "The paper describes a human-level comparison after release ('we randomly sampled 20 problems from the MATH test set and gave them to humans') but discloses no private pre-testing of the benchmark itself before release.", src: "math-arxiv-paper" },
      { id: "symmetric_data_access", result: "PASS", evidence: "The MATH train and test sets are fully public and identical for every user (README/HuggingFace link), so all participants have equal data access \u2014 including the reference answers.", src: "math-arxiv-paper" },
      { id: "deprecation_or_status_changelog", result: "FAIL", evidence: "No changelog or status/deprecation document is present on the fetched repo/paper artifacts.", src: "math-github-readme" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "The paper documents the dataset and its Intended Uses but publishes no label-error rate on the fetched artifact.", src: "math-arxiv-paper" },
      { id: "corrections_process_public", result: "FAIL", evidence: "No public corrections/errata process for the MATH dataset is described on the fetched artifacts.", src: "math-arxiv-paper" },
      { id: "spdx_license_machine_readable", result: "PASS", evidence: "The repo LICENSE is canonical MIT text ('MIT License Copyright (c) 2021 Dan Hendrycks') and setup.py declares the machine-readable classifier 'License :: OSI Approved :: MIT License'. (Note: this is a Trove classifier, not a literal `SPDX-License-Identifier` string.)", src: "math-setup" },
      { id: "still_separates_top_systems", result: "PASS", evidence: "The paper states: 'Even though we are able to increase accuracy on MATH, our results show that accuracy remains relatively low, even with enormous Transformer models... scaling is not currently solving MATH.' Top models remain far from saturating it, so it still separates systems.", src: "math-arxiv-paper" },
      { id: "public_corrections_ledger_or_versioning", result: "FAIL", evidence: "No public corrections ledger or dataset versioning is described on the fetched MATH artifacts.", src: "math-github-readme" }
    ]
  },
  // ── HumanEval ───────────────────────────────────────────────────────────────────────────
  {
    id: "humaneval",
    benchmark: "HumanEval (Hand-Written Evaluation Set)",
    publisher: "OpenAI",
    homepage: "https://github.com/openai/human-eval",
    scorer_kind: "Functional correctness via unit tests: a code completion is correct if it passes the problem's unit tests. Scores are reported as pass@k (e.g. 'pass@1', 'pass@10', 'pass@100') using an unbiased estimator. Not scored by an LLM judge.",
    artifacts: [
      { key: "humaneval-github-readme", url: "https://github.com/openai/human-eval", fetched: "2026-08-23", what: "HumanEval evaluation harness README: installation, sample format, `evaluate_functional_correctness` usage, pass@k output, untrusted-code sandbox warning, and a reproducible example yielding pass@1 = 0.5." },
      { key: "humaneval-arxiv-paper", url: "https://arxiv.org/abs/2107.03374", fetched: "2026-08-23", what: "Evaluating Large Language Models Trained on Code (Codex): HumanEval composition (164 problems, avg 7.7 tests/problem), functional-correctness metric, unbiased pass@k estimator, baseline scores (Codex 28.8%, GPT-3 0%, GPT-J 11.4%)." },
      { key: "humaneval-license", url: "https://github.com/openai/human-eval/blob/master/LICENSE", fetched: "2026-08-23", what: "MIT License text (Copyright (c) OpenAI)." },
      { key: "humaneval-setup", url: "https://github.com/openai/human-eval/blob/master/setup.py", fetched: "2026-08-23", what: "Packaging metadata declaring the `evaluate_functional_correctness` console entry point (version 1.0), with no license field set." }
    ],
    checks: [
      { id: "canary_or_leakage_control", result: "FAIL", evidence: "No canary string or leakage-control mechanism is documented on the fetched artifacts; the README/paper describe a fully public, released evaluation set and a security-sandbox warning for executing code, but no leakage control.", src: "humaneval-github-readme" },
      { id: "temporal_split_declared", result: "FAIL", evidence: "No temporal (time-based) split is declared; HumanEval is a fixed, hand-written set of 164 problems. (The paper's only 'held-out split' reference is about a data-corpus cross-entropy eval, not HumanEval.)", src: "humaneval-arxiv-paper" },
      { id: "private_heldout_described", result: "FAIL", evidence: "The paper states 'We release this data along with [the paper]' \u2014 the 164-problem HumanEval set is fully public; no private held-out set is described on the fetched artifact.", src: "humaneval-arxiv-paper" },
      { id: "public_harness", result: "PASS", evidence: "The README states: 'This is an evaluation harness for the HumanEval problem solving dataset' and provides the `evaluate_functional_correctness` command (registered as a console script in setup.py).", src: "humaneval-github-readme" },
      { id: "pinned_or_containerised_env", result: "FAIL", evidence: "The README only says 'Make sure to use python 3.7 or later' with `requirements.txt` (tqdm, fire, numpy) and warns that the program 'exists to run untrusted model-generated code... outside of a robust security sandbox.' No pinned container/environment is specified.", src: "humaneval-github-readme" },
      { id: "third_party_recompute_artifact", result: "PASS", evidence: "The harness is public and MIT-licensed, and the README shows a reproducible run: 'evaluate_functional_correctness data/example_samples.jsonl --problem_file=data/example_problem.jsonl' yields `{'pass@1': 0.4999999999999999}`.", src: "humaneval-github-readme" },
      { id: "confidence_intervals_reported", result: "FAIL", evidence: "The paper reports point pass@k estimates (Codex 28.8%, 70.2% with 100 samples) with no confidence intervals on the fetched artifact.", src: "humaneval-arxiv-paper" },
      { id: "significance_test_between_ranked_systems", result: "FAIL", evidence: "No statistical significance test between the compared models (Codex vs GPT-3 vs GPT-J) is described on the fetched artifact; results are point accuracies.", src: "humaneval-arxiv-paper" },
      { id: "effective_n_disclosed", result: "PASS", evidence: "The paper states 'a set of 164 hand-written programming problems... average of 7.7 tests per problem'; the README example uses `num_samples_per_task = 200` and the paper notes the estimator constraint 'n=200 and k\u2264100' (pass@k not evaluated when fewer samples than k).", src: "humaneval-arxiv-paper" },
      { id: "scoring_not_llm_judge", result: "PASS", evidence: 'The README shows running test suites and reporting \'whether the completion `passed` along with the execution `result` which is one of "passed", "timed out", or "failed"\'; the paper says \'we evaluate the correctness of code samples automatically through unit tests.\'', src: "humaneval-github-readme" },
      { id: "public_rubric_or_scoring_code", result: "PASS", evidence: "The repo ships `evaluate_functional_correctness` and per-problem unit tests; the paper provides the scoring formula and a 'numerically stable script for calculating an unbiased estimate of pass@k' (Figure 3).", src: "humaneval-github-readme" },
      { id: "funding_disclosed", result: "FAIL", evidence: "The paper has an 'Acknowledgements' section (e.g. 'We thank Sandhini Agarwal...') but states no specific funding/grant source (authors are affiliated with OpenAI); no explicit funding disclosure is present on the fetched artifact.", src: "humaneval-arxiv-paper" },
      { id: "no_pay_to_rank_mechanism", result: "PASS", evidence: "The benchmark is an open-source MIT-licensed harness/dataset with no leaderboard, ranking, or payment-to-rank mechanism described on the fetched artifacts.", src: "humaneval-github-readme" },
      { id: "private_pretesting_disclosed", result: "FAIL", evidence: "No private pre-testing of the HumanEval benchmark before release is disclosed on the fetched artifacts.", src: "humaneval-arxiv-paper" },
      { id: "symmetric_data_access", result: "PASS", evidence: "The HumanEval set is fully public and identical for every user; all participants have equal access (including the public reference tests).", src: "humaneval-arxiv-paper" },
      { id: "deprecation_or_status_changelog", result: "FAIL", evidence: "No changelog or status/deprecation document is present on the fetched repo/paper artifacts.", src: "humaneval-github-readme" },
      { id: "label_error_rate_published", result: "FAIL", evidence: "No label-error rate for the HumanEval problems is published on the fetched artifacts.", src: "humaneval-arxiv-paper" },
      { id: "corrections_process_public", result: "FAIL", evidence: "No public corrections/errata process for the HumanEval set is described on the fetched artifacts.", src: "humaneval-github-readme" },
      { id: "spdx_license_machine_readable", result: "FAIL", evidence: "The repo LICENSE is MIT text ('The MIT License Copyright (c) OpenAI'), but `setup.py` declares no license field and no `SPDX-License-Identifier` string appears in the fetched artifacts, so the license is not machine-readable/SPDX-declared.", src: "humaneval-license" },
      { id: "still_separates_top_systems", result: "PASS", evidence: "The paper reports clear separation: 'our model solves 28.8% of the problems, while GPT-3 solves 0% and GPT-J solves 11.4%' \u2014 the benchmark distinguishes model capabilities. (Caveat for the register: because HumanEval is fully public, it is known to be prone to training-data contamination, which the paper does not address.)", src: "humaneval-arxiv-paper" },
      { id: "public_corrections_ledger_or_versioning", result: "FAIL", evidence: 'The repo\'s only version marker is `version="1.0"` in setup.py with no changelog; no public corrections ledger/versioning is published.', src: "humaneval-setup" }
    ]
  }
];
var EXCLUDED_SUBJECTS = [
  { id: "gspc-board", label: "The GSPC board and every axis on it (/api/gspc)", pattern: /\bgspc\b|councilof\.ai|csoai/i },
  { id: "csoai-benches", label: "GovBench, ProvBench, the AI Act benchmark and every other Council of AI instrument", pattern: /\b(gov|prov)bench\b|\bai[\s-]?act benchmark\b|council of ai|council academy/i },
  { id: "csoai-datasets", label: "The csoai/gspc-* dataset family and the boards published from it", pattern: /csoai\/|gspc-/i }
];
var IMPARTIALITY_POLICY = "Council of AI does not assess its own instruments on this register. The GSPC board, GovBench, ProvBench, the AI Act benchmark and the csoai/gspc-* dataset family are structurally excluded, and the exclusion is enforced in the code that builds this payload \u2014 a record matching an excluded subject is dropped and the drop is reported. The reason is the independence requirement that makes any assessment body's output worth reading (ISO/IEC 17020 and 17025 doctrine): a body must not assess its own work. If you want Council of AI's own instruments audited against these predicates, the correct answer is an independent party running this same predicate set against us \u2014 the predicates and the export are published so that anyone can.";
var RESULT_SEMANTICS = {
  PASS: "The property is affirmatively evidenced in a named artifact fetched on the stated date. The evidence string records what was read.",
  FAIL: "Every fetched artifact that would ordinarily carry this property was readable, and none carries it. FAIL is scoped to the named artifacts on the named date \u2014 it is a statement about what the benchmark publishes there, not a claim about the project as a whole.",
  UNKNOWN: "The check could not be completed: the artifact that would answer it could not be read (client-rendered, gated, or not fetched in this pass), or the artifact is ambiguous. Every UNKNOWN carries its reason. An UNKNOWN is a correct outcome, never a placeholder for a guess."
};
var byId = new Map(PREDICATES.map((p) => [p.id, p]));
function faultsOf(s) {
  const faults = [];
  const keys = new Set(s.artifacts.map((a) => a.key));
  if (!s.artifacts.length)
    faults.push("no artifact was fetched for this subject");
  const seen = /* @__PURE__ */ new Set();
  for (const c of s.checks) {
    if (!byId.has(c.id))
      faults.push(`check "${c.id}" is not in the predicate catalogue`);
    if (seen.has(c.id))
      faults.push(`predicate "${c.id}" is answered twice`);
    seen.add(c.id);
    if (!keys.has(c.src))
      faults.push(`check "${c.id}" cites artifact "${c.src}", which was not fetched`);
    if (c.result === "UNKNOWN" && !c.unknown_reason)
      faults.push(`UNKNOWN check "${c.id}" carries no reason`);
    if (!c.evidence)
      faults.push(`check "${c.id}" carries no evidence`);
  }
  return faults;
}
__name(faultsOf, "faultsOf");
function build(s) {
  const art = new Map(s.artifacts.map((a) => [a.key, a]));
  const predicates = s.checks.map((c) => {
    const def = byId.get(c.id);
    const a = art.get(c.src);
    return {
      ...def,
      result: c.result,
      evidence: c.evidence,
      source_url: a.url,
      fetched: a.fetched,
      ...c.unknown_reason ? { unknown_reason: c.unknown_reason } : {}
    };
  });
  const tally = {
    checked: predicates.length,
    pass: predicates.filter((p) => p.result === "PASS").length,
    fail: predicates.filter((p) => p.result === "FAIL").length,
    unknown: predicates.filter((p) => p.result === "UNKNOWN").length
  };
  const named = predicates.map((p) => p.id).join(", ");
  const claim = `CSOAI measured ${s.benchmark} on ${ASSESSED_ON} using ${named} and recorded ${tally.pass} PASS, ${tally.fail} FAIL and ${tally.unknown} UNKNOWN of ${tally.checked} predicates, each read from a named public artifact on that date.`;
  return {
    id: s.id,
    benchmark: s.benchmark,
    publisher: s.publisher,
    homepage: s.homepage,
    scorer_kind: s.scorer_kind,
    record_type: "measured-current-state",
    not_a_certification: true,
    endorsement: "none",
    authored_by: "did:web:csoai.org",
    solicited: false,
    subject_participation: "none",
    access: "public_artifacts_only",
    assessed_on: ASSESSED_ON,
    claim,
    artifacts: s.artifacts,
    tally,
    predicates
  };
}
__name(build, "build");
function applyImpartialityFirewall(subjects) {
  const allowed = [];
  const blocked = [];
  for (const s of subjects) {
    const hay = `${s.id} ${s.benchmark} ${s.publisher} ${s.homepage}`;
    const hit = EXCLUDED_SUBJECTS.find((e) => e.pattern.test(hay));
    if (hit) {
      blocked.push({
        id: s.id,
        benchmark: s.benchmark,
        excluded_by: hit.id,
        reason: `Matched the excluded subject "${hit.label}". Council of AI does not assess its own instruments; this record was removed from the register by the impartiality firewall.`
      });
    } else {
      allowed.push(s);
    }
  }
  return { allowed, blocked };
}
__name(applyImpartialityFirewall, "applyImpartialityFirewall");
var NOTICE_POLICY = {
  window_days: 14,
  procedure: "An adverse finding is sent to the benchmark's published maintainer contact at least 14 days before it first appears on this register. The subject may reply, and the reply is published beside the finding, unedited, whether or not we agree with it. If a subject shows a predicate was read wrongly, the record is corrected and the correction is published \u2014 we never silently edit a record.",
  right_of_reply: "https://councilof.ai/contact",
  corrections: "https://councilof.ai/api/corrections",
  applies_to: "Every record on this register, including records where every predicate passed.",
  first_publication_state: "This register is published as an open method with its first six records. Any subject on it may invoke the right of reply at any time, and a reply arriving after publication is added to the record exactly as one arriving during the notice window would be."
};
var LIMITATIONS = [
  "These predicates measure PROCESS INTEGRITY \u2014 what a benchmark discloses about how it was built and scored. They are not a validity guarantee. A benchmark can pass every predicate here and still measure the wrong thing, and a benchmark can fail several and still be the best instrument in its field.",
  "CONSTRUCT VALIDITY IS DELIBERATELY NOT SCORED. Whether a benchmark measures the capability its name claims is an interpretive judgment, contested among the people who built it. We do not have a deterministic predicate for it, so we do not pretend to score it. Its absence here is a choice, not an oversight.",
  "A FAIL is scoped to the artifacts named on the record and the date they were fetched. It says a property was absent from what the benchmark publishes there. It does not say the property is absent from the project \u2014 a paper, a wiki, or an unfetched file may carry it.",
  "An UNKNOWN is a real result, not a gap to be filled later with a guess. Client-rendered leaderboards, gated datasets, and artifacts not fetched in a pass all produce UNKNOWN, and the reason is on every one.",
  "Predicate counts are not a score and must not be ranked. A benchmark with more PASSes than another is not thereby better; the predicates are not weighted, not independent, and not exhaustive. We publish no league table of benchmarks and no composite grade.",
  "No language model judged anything on this register. Every predicate was read off a fetched page by a human-directed process. This is a constraint we accept even where it costs coverage \u2014 an LLM-graded register of benchmark quality would fail its own scoring-transparency predicate.",
  "This register is unsolicited and the subjects did not participate. Nothing here is a certification, an accreditation, an endorsement, or a verification by any third party. Council of AI is a measurement body, not a certification or accreditation body and not a notified body.",
  "Coverage is small on purpose. Ten benchmarks whose artifacts were actually fetched are worth more than fifty whose properties were assumed."
];
function buildRegister() {
  const { allowed, blocked } = applyImpartialityFirewall(SUBJECTS);
  const records = [];
  const rejected = [];
  for (const s of allowed) {
    const faults = faultsOf(s);
    if (faults.length)
      rejected.push({ id: s.id, faults });
    else
      records.push(build(s));
  }
  const totals = records.reduce(
    (t, r) => ({
      pass: t.pass + r.tally.pass,
      fail: t.fail + r.tally.fail,
      unknown: t.unknown + r.tally.unknown,
      checked: t.checked + r.tally.checked
    }),
    { pass: 0, fail: 0, unknown: 0, checked: 0 }
  );
  return {
    schema: SCHEMA,
    issuer: "CSOAI Ltd (GB, Companies House 16939677)",
    register: "Benchmark-quality register \u2014 the process integrity of third-party AI benchmarks, measured with deterministic predicates",
    assessed_on: ASSESSED_ON,
    authored_by: "did:web:csoai.org",
    method: "Each predicate is a boolean question answerable from a public artifact. Someone fetched the artifact, read the answer, and recorded the URL and the fetch date on the predicate. No language model scored anything. Nothing was inferred from a benchmark's reputation.",
    no_model_judgment: true,
    record_type: "measured-current-state",
    not_a_certification: true,
    endorsement: "none",
    solicited: false,
    subject_participation: "none",
    access: "public_artifacts_only",
    result_semantics: RESULT_SEMANTICS,
    impartiality_policy: IMPARTIALITY_POLICY,
    impartiality: {
      enforced_in_code: true,
      enforced_by: "applyImpartialityFirewall() in functions/api/benchmark-quality.ts",
      excluded_subjects: EXCLUDED_SUBJECTS.map((e) => ({ id: e.id, label: e.label, pattern: e.pattern.source })),
      blocked_records: blocked,
      blocked_count: blocked.length
    },
    notice_policy: NOTICE_POLICY,
    predicate_catalogue: PREDICATES,
    totals: {
      records: records.length,
      predicates_per_record: PREDICATES.length,
      ...totals,
      note: "Counts, not a score. Predicates are unweighted and non-exhaustive; do not rank benchmarks by them."
    },
    records,
    rejected_records: rejected,
    limitations: LIMITATIONS,
    license: "CC-BY-4.0",
    license_note: "This register is CC-BY-4.0. Attribute: Council of AI, CSOAI Ltd 16939677, councilof.ai.",
    export: "scripts/export-benchmark-quality.mjs writes a Croissant-aligned dataset export of this payload to dist/exports/benchmark-quality/."
  };
}
__name(buildRegister, "buildRegister");
var onRequestGet13 = /* @__PURE__ */ __name(async (context) => {
  const url = new URL(context.request.url);
  const id2 = url.searchParams.get("benchmark");
  const body = buildRegister();
  if (id2) {
    const all = body.records;
    const one = all.filter((r) => r.id === id2);
    if (!one.length) {
      return new Response(
        JSON.stringify({ error: "unknown benchmark", known: all.map((r) => r.id) }, null, 2),
        { status: 404, headers: { "content-type": "application/json; charset=utf-8" } }
      );
    }
    body.records = one;
  }
  const b64 = context.env?.BOARD_SIGN_KEY_PKCS8_B64;
  if (b64) {
    try {
      const canonical4 = /* @__PURE__ */ __name((o) => {
        if (o === null || typeof o !== "object")
          return JSON.stringify(o);
        if (Array.isArray(o))
          return "[" + o.map(canonical4).join(",") + "]";
        const r = o;
        return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical4(r[k])).join(",") + "}";
      }, "canonical");
      const hex3 = /* @__PURE__ */ __name((b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""), "hex");
      const signedBytes = canonical4(body);
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex3(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = await crypto.subtle.exportKey("jwk", key);
      body.site_attestation = {
        attests: "integrity of this register snapshot as published by the site (NOT a re-assessment, and NOT a certification of any subject)",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        public_key_x: jwk.x,
        sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this payload with the site_attestation field removed",
        verify: "fetch /.well-known/did.json \u2192 #board-attestation-1 public key \u2192 verify sig over canonical(payload minus site_attestation)"
      };
    } catch {
      body.site_attestation = { error: "board signing key present but unusable \u2014 operations must fix; no signature emitted" };
    }
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*"
    }
  });
}, "onRequestGet");

// api/cards.ts
var onRequestGet14 = /* @__PURE__ */ __name(async ({ request }) => {
  const host = new URL(request.url).host;
  const origin = new URL(request.url).origin;
  const u = /* @__PURE__ */ __name((p) => new URL(p, origin).toString(), "u");
  const [boardRes, indexRes, measRes, crossBorderRes] = await Promise.all([
    fetch(u("/signed/board_living.json")),
    fetch(u("/signed/card_index.json")),
    fetch(u("/signed/gspc-measurement.json")),
    fetch(u("/signals/cross-border-card.signed.json"))
  ]);
  const board = boardRes.ok ? await boardRes.json().catch(() => null) : null;
  const index = indexRes.ok ? await indexRes.json().catch(() => null) : null;
  const meas = measRes.ok ? await measRes.json().catch(() => null) : null;
  const crossBorder = crossBorderRes.ok ? await crossBorderRes.json().catch(() => null) : null;
  if (!board || !index) {
    return Response.json(
      {
        schema: "csoai.gspc-cards/0.1",
        status: "UNPUBLISHED",
        host,
        cards: { count: 0, signed: 0, list: [] },
        note: "Signed measurement card bundle (/signed/*.json) is not published on this deploy yet. Live board axes: /api/gspc \xB7 axis registry: /api/axis-register.",
        endpoints: {
          gspc: "/api/gspc",
          axis_register: "/api/axis-register",
          cards: "/api/cards"
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=60"
        }
      }
    );
  }
  const cards = (index.cards || []).slice().sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));
  const count = cards.length;
  const signed = cards.filter((c) => c.signed).length;
  const signature = board.signature ? { present: true, signer: board.signer, sig_input: board.sig_input } : { present: false, signer: board.signer };
  const crossBorderEntry = crossBorder ? {
    card: "cross-border-card",
    axis: "cross-border",
    signed: !!crossBorder.signature?.sig,
    title: crossBorder.title || "One signed measurement, every regime mapped",
    schema: crossBorder.schema || "csoai.east-west-card/1",
    content_id: crossBorder.content_id,
    url: "/signals/cross-border-card.signed.json"
  } : null;
  return Response.json({
    schema: "csoai.gspc-cards/0.1",
    issuer: "councilof.ai",
    served_from: host,
    measured_on: board.updated,
    measurement: meas ? { schema: meas.schema, gspc_registry_axes: meas.gspc_registry_axes, axes: (meas.axes || []).length, publish_readiness: meas.publish_readiness } : null,
    board: {
      schema: board.schema,
      signed: board.signed,
      signer: board.signer,
      axes: Object.keys(board.axes || {}),
      signature
    },
    cross_border: crossBorderEntry,
    cards: {
      count: count + (crossBorderEntry ? 1 : 0),
      signed: signed + (crossBorderEntry?.signed ? 1 : 0),
      list: crossBorderEntry ? [crossBorderEntry, ...cards.slice(0, 99)] : cards.slice(0, 100),
      full_count_hint: count + (crossBorderEntry ? 1 : 0)
    },
    note: "count = signed measurement cards in the living registry plus cross-border East-West card when published. kid identifies the signing key; signed=true means the card carries a JWS signature."
  });
}, "onRequestGet");

// api/challenge.ts
var NAMED = ["card", "crosswalk", "board", "findings"];
function canonical3(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}
__name(canonical3, "canonical");
async function hmacHex(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hmacHex, "hmacHex");
var onRequestPost4 = /* @__PURE__ */ __name(async ({ request, env }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON", detail: "POST body must be JSON" }, { status: 400 });
  }
  const target = String(body.target || "");
  const targetType = String(body.targetType || "");
  const reason = String(body.reason || "");
  const challenger = String(body.challenger || "anonymous");
  if (!NAMED.includes(targetType)) {
    return Response.json(
      { error: "invalid targetType", detail: `must be one of ${NAMED.join(", ")}` },
      { status: 400 }
    );
  }
  if (!target) {
    return Response.json({ error: "missing target", detail: "target (card/crosswalk/row id) is required" }, { status: 400 });
  }
  if (!reason) {
    return Response.json({ error: "missing reason", detail: "reason is required" }, { status: 400 });
  }
  const ts = (/* @__PURE__ */ new Date()).toISOString();
  const receiptBody = { schema: "csoai.challenge-receipt/0.1", ts, target, targetType, reason, challenger };
  const secret = env.CHALLENGE_HMAC_SECRET || "csoai-challenge-dev-secret";
  const cid = (await hmacHex(secret, canonical3(receiptBody))).slice(0, 24);
  return Response.json(
    {
      schema: "csoai.challenge-receipt/0.1",
      ts,
      target,
      targetType,
      challenger,
      content_id: cid,
      stored: false,
      detail: "Challenge receipted. Resolution rows feed the Value Ledger when bound.",
      verify_note: "recompute HMAC over canonical receipt to verify issuance"
    },
    { status: 202, headers: { "cache-control": "no-store" } }
  );
}, "onRequestPost");
var onRequestGet15 = /* @__PURE__ */ __name(async ({ request }) => {
  const id2 = new URL(request.url).searchParams.get("id");
  return Response.json({
    schema: "csoai.challenge-door/0.1",
    note: "POST /api/challenge - card/crosswalk/board/findings. Receipted; stored:false until KV binds.",
    example: { targetType: "card", target: "signed measurement content_id", reason: "why contended" },
    id_echo: id2,
    stored: false
  }, { headers: { "cache-control": "no-store" } });
}, "onRequestGet");

// api/checkout.ts
var onRequestPost5 = /* @__PURE__ */ __name(async () => {
  return Response.json(
    {
      configured: false,
      public_prices: false,
      message: "No public prices. A grade is never sold. Verify is free at /gspc-verify. Get measured at /assess. Email nicholas@csoai.org."
    },
    { status: 404 }
  );
}, "onRequestPost");

// api/clarity.ts
var onRequestGet16 = /* @__PURE__ */ __name(async (context) => {
  const clarity = {
    schema: "csoai.clarity/0.2",
    note: "Binary process facts about how regimes publish AI guidance. Predicates only. Where not verified: UNMEASURED, stated honestly.",
    register: "REPORTED (attributed) where sourced; MEASURED only where we deterministically verified; never blended",
    predicates: {
      machine_readable: {
        gdpr: { value: true, source: "EUR-Lex machine-readable formats", verified: "MEASURED" },
        "eu-ai-act": { value: true, source: "EUR-Lex consolidated text", verified: "MEASURED" },
        "uk-osi": { value: false, source: "UK gov publish-advice pages", verified: "REPORTED" },
        "tc260": { value: false, source: "PRC standards portal (PDF-gated)", verified: "REPORTED" }
      },
      guidance_language: {
        english: { value: true, source: "primary publication language", verified: "MEASURED" },
        english_official: { value: "mixed", note: "varies by regime; not a clarity score", verified: "UNMEASURED" }
      },
      updates_published: {
        "eu-ai-act-implementing-acts": { value: true, source: "OJ L series", verified: "MEASURED" },
        "uk-ai-guidance": { value: true, source: "gov.uk updates", verified: "MEASURED" }
      }
    },
    not_a_certification: true,
    generated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const b64 = context.env.BOARD_SIGN_KEY_PKCS8_B64;
  if (b64) {
    try {
      const canonical4 = /* @__PURE__ */ __name((o) => {
        if (o === null || typeof o !== "object")
          return JSON.stringify(o);
        if (Array.isArray(o))
          return "[" + o.map(canonical4).join(",") + "]";
        const r = o;
        return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical4(r[k])).join(",") + "}";
      }, "canonical");
      const hex3 = /* @__PURE__ */ __name((b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""), "hex");
      const { site_attestation: _omit, ...bodyForSig } = clarity;
      const signedBytes = canonical4(bodyForSig);
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex3(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = await crypto.subtle.exportKey("jwk", key);
      clarity.site_attestation = {
        attests: "integrity of this clarity record as published by the site (NOT a re-measurement)",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        public_key_x: jwk.x,
        sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this payload with the site_attestation field removed",
        verify: "fetch /.well-known/did.json \u2192 #board-attestation-1 public key \u2192 verify sig over canonical(payload minus site_attestation)"
      };
    } catch {
      clarity.site_attestation = { error: "signing key present but unusable \u2014 no signature emitted" };
    }
  }
  return Response.json(clarity, {
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}, "onRequestGet");

// api/comparison.ts
async function onRequestGet17({ env, request }) {
  const ts = (/* @__PURE__ */ new Date()).toISOString();
  let measured = null;
  let measuredErr = null;
  try {
    const target = new URL("/arena/elo_reference.json", request.url);
    const res = await fetch(target, { headers: { accept: "application/json" } });
    if (res.ok)
      measured = await res.json();
    else
      measuredErr = `feed HTTP ${res.status}`;
  } catch (e) {
    measuredErr = String(e);
  }
  const reported = {
    lmarena: {
      source: "https://lmarena.ai/leaderboard",
      methodology: "Bradley-Terry model on crowdsourced pairwise human votes, scaled to Elo, 95% bootstrap CIs; per-category breakdowns (text/coding/math/creative/vision) published",
      what: "human-preference Elo \u2014 REPORTED context, never our measurement",
      state: "assessed 2026-08-23 (register entry lmarena); methodology we ADOPT the CI + category discipline from, and REFUSE vote-as-truth certification",
      adopt: ["Bradley-Terry + bootstrap 95% CI statistical framing", "per-category segmentation (text/coding/math/creative/vision)"],
      refuse: ["human preference treated as verified capability ('vote-as-truth')", "version drift behind a pinned slug as a stable model identity"],
      honest_unknowns: ["exact bootstrap parameters not fully public", "vote-manipulation detection machinery not fully public (2025 study alleges provider-size bias \u2014 the-decoder.com)"],
      models: [],
      note: "LMArena ranks by human vote; we measure deterministically. Never fused."
    },
    openrouter: {
      source: "https://openrouter.ai/rankings",
      methodology: "real-market token spend / revenue share (Data API) + cost-aware Auto Router (per-task fit under cost constraints, ~30 task types, 7-day spend horizon)",
      what: "routing + usage ranking \u2014 REPORTED context, a demand proxy not a quality benchmark",
      state: "assessed 2026-08-23 (register entry openrouter); we ADOPT the cost-aware routing framing and usage telemetry, and REFUSE reading usage-share as capability",
      adopt: ["cost-aware routing framing (route to best-fit model under cost constraints)", "usage / app analytics as demand-and-cost telemetry"],
      refuse: ["token revenue / usage share read as a capability or quality benchmark (confounded by price, marketing, volume)"],
      honest_unknowns: ["exact live catalogue count is volatile (third-party Mar-2026 snapshot: 342 models / 57 providers)", "no CIs and no contamination controls \u2014 observational usage, not a controlled evaluation"],
      models: [],
      note: "OpenRouter routes inference; CSOAI refines it into signed, continuously-verifiable measurement data."
    }
  };
  const overlap = [];
  return Response.json({
    schema: "csoai.comparison/0.1",
    name: "Measured vs Reported \u2014 the comparison surface (never fused)",
    ts,
    register: "measurement, not certification \u2014 MEASURED cells signed; REPORTED cells attributed; no rail blends into another",
    rails: {
      measured: {
        source: "/arena/elo_reference.json",
        state: measured ? "MEASURED (signed static feed, Ed25519 JWT \u2014 verify via /gspc-verify or in-browser)" : `feed unavailable: ${measuredErr || "unknown"}`,
        present: !!measured,
        leaderboard: measured?.leaderboard ?? [],
        per_axis: measured?.per_axis ?? {},
        content_id: measured?.content_id ?? null,
        method: measured?.method ?? "Bradley-Terry Elo, K=32, Wilson 95% CI, n>=5"
      },
      reported,
      overlap: {
        state: overlap.length ? "verified overlap cells" : "UNKNOWN \u2014 no verified cross-platform Elo for our fleet models yet (honest, not fabricated)",
        cells: overlap,
        gate: "a reported cell is only populated when we hold a cited, attributed number for the SAME model we measured"
      }
    },
    the_pairing: {
      claim: "measured behaviour (signed) beside human preference / usage context (cited) \u2014 two rails, one page, never one blended number",
      caveat: "Elo from human votes and Elo from deterministic referees are not commensurable on one scale; we display both and state which is which",
      limitations: [
        "overlap cells are UNKNOWN until a cited cross-platform number exists for a measured model",
        "REPORTED rails carry third-party methodology (vote collection, routing) we assess but do not endorse",
        "no causation claimed between rails"
      ]
    },
    honest_gate: {
      never_fused: true,
      never_certifies: true,
      unmeasured_stays_unmeasured: true,
      nobody_ranked_pays: true
    }
  }, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*"
    }
  });
}
__name(onRequestGet17, "onRequestGet");

// api/contact.ts
var onRequestPost6 = /* @__PURE__ */ __name(async (ctx) => {
  let body;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  const email = String(body.email ?? "").slice(0, 200);
  const message = String(body.message ?? "").slice(0, 5e3);
  if (!email.includes("@") || !message) {
    return Response.json({ error: "email and message are required" }, { status: 400 });
  }
  const record = {
    kind: "contact",
    email,
    name: String(body.name ?? "").slice(0, 200),
    subject: String(body.subject ?? "").slice(0, 300),
    message,
    at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (ctx.env.LEADS) {
    await ctx.env.LEADS.put(`contact:${record.at}:${crypto.randomUUID()}`, JSON.stringify(record));
    return Response.json({ ok: true, stored: true });
  }
  return Response.json({ ok: true, stored: false, reason: "no datastore bound yet", fallback: "email nicholas@csoai.org directly" });
}, "onRequestPost");

// api/corrections.ts
var LEDGER = {
  schema: "csoai.corrections/0.1",
  policy: "Appended, never edited or deleted. Each entry: what was wrong, how it was caught, the fix. The instrument that catches its own owner is the instrument you can rely on.",
  license: "CC-BY-4.0",
  publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
  corrections: [
    {
      id: "C-2026-0826-06",
      date: "2026-08-26",
      what_was_wrong: "We repeated a human-versus-machine benchmark contrast without checking whether both sides were scored under the same rule. The metrology deck cites the ARC Prize project's ARC-AGI-3 result \u2014 a human panel solving essentially all environments while frontier systems average well under one percent. The attribution was correct and careful: labelled reported-not-measured, never placed on the board. The number is not the defect. The defect is that we published a comparison between a human figure and a machine figure without asking the question our own first rating-the-raters result exists to ask, which is whether the two figures were produced under the same scoring rule. Having now recomputed ARC's published participant rows for ARC-AGI-2, we know that on that benchmark the human figure is computed under unlimited submissions while machines are scored at two trials, and that the rule-matched human figure is about eleven points lower. We had no basis to assume ARC-AGI-3 was free of the same gap, and no basis to assume it had it.",
      how_caught: "Self-caught, by our own instrument, on its first run. Building the RTR-A1 human-reference rule-match measurement against ARC-AGI-2 meant asking of another organisation a question we had not asked of our own published page. Sweeping our surfaces for prior statements about the same publisher is what surfaced it. This is the intended failure mode of a rating-the-raters programme: the first thing a new instrument should catch is its owner.",
      fix: "The deck passage now carries the caveat, stated as a limit rather than a finding: a human-versus-machine contrast only means what it appears to mean if both sides were scored under the same rule; on ARC-AGI-2 we measured that gap; whether ARC-AGI-3 shares it is UNMEASURED because its scoring formula is not published, so we cannot check and will not assume either way. The general rule this establishes for every surface: CSOAI does not republish a human-versus-machine comparison without either verifying rule-match or marking it unverified. Nothing was removed and no third-party number was restated as ours.",
      status: "FIXED"
    },
    {
      id: "C-2026-0826-05",
      date: "2026-08-26",
      what_was_wrong: "Two published index artifacts claimed a measurement they did not have. /interop/ai-economy-index.v0.1.json and /interop/human-labour-index.v0.1.json each carry a status label of MEASURED-INDEX-v0.1, while each also states in its own body that half its input components are bank gaps and that no index value is computed. The axis register had already been reverted to UNMEASURED for both; the artifacts were not, so a live surface kept asserting the retracted status. Existing reference components are not a measured index.",
      how_caught: "Reading the evidence behind every financial axis before wiring it into the board, rather than trusting the axis register's summary of it. The register said UNMEASURED; the artifact it pointed at said MEASURED-INDEX-v0.1. Following the pointer is what surfaced the disagreement.",
      fix: "Both axes are wired into the signed board as UNMEASURED, and the board \u2014 which is the authority \u2014 states on each axis and in its limitations that the v0.1 artifacts' status label was an over-claim and is superseded. Neither index contributes to any measured count. The artifacts themselves are signed under a key this lane deliberately does not hold, so correcting them at source is a separate owner-supervised re-sign; until then the board carries the correction where a reader will meet it.",
      status: "FIXED ON THE BOARD; ARTIFACT RE-SIGN PENDING (owner)"
    },
    {
      id: "C-2026-0826-04",
      date: "2026-08-26",
      what_was_wrong: "The public board contradicted the estate's own ruling for two days. An owner ruling of 2026-08-24 set the canonical axis count at 22 (14 behavioural + 8 financial/domain), but GET /api/gspc kept reporting '14 measured of 14 quotable' because the 8 financial axes existed only in the ruling and in a side register \u2014 never in the signed board payload the count is derived from. Downstream, the estate's own claims register recorded '22' as an internal figure that was 'not corroborated by any live surface', and a source comment instructed authors to 'not invent 22 axes'. The estate simultaneously ruled the number, forbade the number, and published a different one.",
      how_caught: "Self-reported, not discovered. The ruling document itself recorded that the sweep was authorized but unexecuted, and named the reason. The delay was deliberate and is the point of this entry: a public count must be backed by the signed artifact it summarises, so the fix could not be a copy edit on the pages. Editing the number without the data behind it would have put a figure on a public surface that the signed payload could not support \u2014 the same defect class as a score published without its measurement. The board was behind the ruling, never ahead of it.",
      fix: "The 8 financial/domain axes were wired into the board DATA and the payload re-signed. The board now derives '22 axes \xB7 15 measured' from the axis array: 22 slots, 15 with a real run behind them, 7 declared slots with none. The ruling's own wording applied the word 'measured' to the full slot count, and the evidence does not support that word \u2014 only one of the eight financial axes (provenance-controls, a deterministic mainnet read of 6 issuer accounts) carries a measurement. Per this ledger's redaction rule the exact phrase is described rather than reproduced: it is now the forbidden form the build gate catches, and reprinting it here would republish the sentence this correction exists to retire. No axis was marked MEASURED to make the two numbers agree; the grammar changed instead, and both numbers now travel together. Separation statistics and every mean are scoped to model-comparison axes, so a financial axis can neither enter a sentence about statistical separation nor drag an absent value into an average as a zero. The claims register was re-authored from 'internal, not corroborated' to a live claim with the endpoint as its authority, and now names the forbidden form '22 measured axes' explicitly.",
      status: "FIXED"
    },
    {
      id: "C-2026-0826-03",
      date: "2026-08-26",
      what_was_wrong: "Our own published MCP fleet was silently paywalled and self-scoring. A monetization layer injected into 318 of 363 vendored servers capped the ENTIRE fleet at 10 anonymous tool calls per day from one shared counter; past that, every tool returned a purchase link instead of a result. The injected code was spliced mid-function in 49 files, leaving original function bodies unreachable (256 undefined names). Five scorecard checks awarded points for carrying a purchase link \u2014 the system scored itself higher for being paywalled. The paywall also masked quality: a first probe found 1 stub because refusals and stubs were indistinguishable.",
      how_caught: "Building a remote MCP server for other AI platforms; the first real tools/call returned a purchase upsell instead of a result. Verified twice independently by direct grep and by probing all 338 servers with real MCP sessions.",
      fix: "Monetization layer removed fleet-wide: 318 -> 0 servers carrying a purchase link, 0 price strings, 0 upsell symbols. Capability preserved and proven, not assumed: all 338 servers re-probed with real initialize/tools/list/tools/call \u2014 handshakes 336/338 unchanged, 1869 tools unchanged, 0 broken; undefined names fell 256 -> 16 because removing the injected code repaired what it had broken. Honest stub register published (13 fully stubbed, 10 partial, 2 dead) determined by CALLING every tool, not grepping. scripts/no-paywall-guard.mjs added with a --selftest so the layer cannot return; it caught 48 residuals we had missed.",
      status: "FIXED"
    },
    {
      id: "C-2026-0826-02",
      date: "2026-08-26",
      what_was_wrong: "Five sector pages asserted, in present tense, that our measurement 'is recognised under mutual recognition agreements with' CISA, NCSC, ANSSI, BSI, BEREC, ENISA, national transport authorities and others \u2014 named public bodies, implying an endorsement we do not hold. It shipped in the deployed bundle. Separately, /layer0 served a retracted fault-tolerance claim as a live capability, contradicting our own DR-0007 retraction (measured effective independence 1.21 of 3).",
      how_caught: "Claims-substantiation audit of the prerendered output, prompted by the FTC's own recommended exercise: inventory every public claim and map it to evidence.",
      fix: "Replaced with: we crosswalk our measurement output to those compliance pathways, and hold no mutual-recognition agreement with, and are not endorsed or accredited by, any of these bodies. The retracted claim removed from /layer0, /poc-showcase and /competitors. A machine-readable claims register now publishes every claim with its evidence link and a live/planned/devnet/retired status.",
      status: "FIXED"
    },
    {
      id: "C-2026-0826-01",
      date: "2026-08-26",
      what_was_wrong: "Our own prerender verification could not observe failure. prerender-report.json records a failed route in a field named 'err', but every check in the repository read 'errored' \u2014 a field that has never existed. A run in which the browser died on 515 of 581 routes reported '0 errored' and looked clean.",
      how_caught: "A downstream gate disagreed: brand-gate scanned 71 pages when it should have scanned 603. The upstream report was lying and the layered gate caught it.",
      fix: "scripts/check-prerender.mjs reads the real fields AND cross-checks the report against the HTML actually written to disk, because a report is a claim and the files are the evidence. It fails loudly on the exact run that had been called clean.",
      status: "FIXED"
    },
    {
      id: "C-2026-0819-01",
      date: "2026-08-19",
      what_was_wrong: "Three public surfaces stated three different item counts at once (llms.txt 819, agent card 890, live API 966). The banks grew under the hardcoded numbers.",
      how_caught: "External live-surface audit; confirmed by direct curl.",
      fix: "llms.txt and the agent card now DEFER to GET /api/gspc as the live source; no public surface hardcodes a count.",
      status: "FIXED"
    },
    {
      id: "C-2026-0819-02",
      date: "2026-08-19",
      what_was_wrong: "The public board API payload carried internal specialist identifiers \u2014 an internal specialist-id prefix \u2014 a banned-vocabulary string inside a machine contract, not just a human page. (The prefix itself is redacted here: naming it would re-leak the string this entry records as removed.)",
      how_caught: "K3 lane curl sweep of machine surfaces.",
      fix: "Renamed to council-* public names in /api/gspc; a machine-contract guard now sweeps API payloads for banned strings on every deploy.",
      status: "FIXED"
    },
    {
      id: "C-2026-0819-03",
      date: "2026-08-19",
      what_was_wrong: "The single-record verifier initially checked only one content_id envelope; the carder signs a second (signature-included) generation, so valid carder cards could have read as MISMATCH.",
      how_caught: "Testing the verifier against a real carder card before shipping.",
      fix: "The verifier now tries both deterministic envelope generations and names which one matched.",
      status: "FIXED"
    },
    {
      id: "C-2026-0819-04",
      date: "2026-08-19",
      what_was_wrong: "Two open-source repos (carder, codabench-gspc) shipped with no LICENSE file, and the board API payload stated no licence \u2014 while the estate claims openness.",
      how_caught: "The carder's own valve-2 benchmark fact-card, run on the estate's own artifacts.",
      fix: "Apache-2.0 added to both repos; CC-BY-4.0 licence field added to the board payload, with the self-catch admitted in the payload note.",
      status: "FIXED"
    },
    {
      id: "C-2026-0819-05",
      date: "2026-08-19",
      what_was_wrong: "The did:web trust root at csoai.org intermittently served an orphan key document because two repositories deployed the same Cloudflare Pages project with no owner of record.",
      how_caught: "The did-liveness daemon, then the machine-contract guard's DID split-brain check comparing the authoritative root against the mirror.",
      fix: "One deployer of record (csoai-site-deploy.yml) builds from the source repo's main with a hard gate: the build fails if did.json lacks the canon keys, and the run fails if the live apex doesn't serve them after deploy.",
      status: "FIXED"
    },
    {
      id: "C-2026-0819-06",
      date: "2026-08-19",
      what_was_wrong: "An hourly API guard asserted endpoints (/api/tools, /api/mcp) that never existed in the repository's functions tree \u2014 a ghost from an older deployment \u2014 so it failed forever.",
      how_caught: "Reading the failing run rather than trusting the guard's own claim.",
      fix: "Rewritten to assert the endpoints the deployment actually ships (/api/health, /api/leaderboard).",
      status: "FIXED"
    },
    {
      id: "C-2026-0819-07",
      date: "2026-08-19",
      what_was_wrong: "A banned brand token shipped live on /library as a CamelCase concatenation of the token with 'Training', because a word-boundary regex anchored on the bare token missed the concatenation. Two priced strings ($0.005/card, a per-hour range) also shipped, against the no-pricing rule. (The token itself is redacted here for the same reason as C-2026-0819-02.)",
      how_caught: "A full front-end QA sweep.",
      fix: "The brand gate's pattern for that token dropped its trailing word boundary so CamelCase concatenations are caught; a pricing-leak pattern was added so a currency amount bound to a subscription or per-unit cadence is now a hard build-fail.",
      status: "FIXED"
    },
    {
      id: "C-2026-0819-08",
      date: "2026-08-19",
      what_was_wrong: "Estate pages described EU AI Act high-risk obligations as in force from 2 August 2026. The Digital Omnibus (Reg (EU) 2026/1744) deferred them to 2 December 2027 (Annex III) and 2 August 2028 (Annex I). Serving the dead date would be our own credibility wound.",
      how_caught: "A commissioned regulation-calendar verification against primary law.",
      fix: "The /api/regulation feed carries the corrected staged timeline with legal bases; page copy is being swept to match.",
      status: "IN_PROGRESS"
    },
    {
      id: "C-2026-0819-09",
      date: "2026-08-19",
      what_was_wrong: "Two internally-named datasets remained publicly visible on Kaggle under a banned naming class.",
      how_caught: "End-user test sweep with anonymous probes.",
      fix: "Flagged for the owner to set private \u2014 the platform gates dataset visibility behind the account login.",
      status: "OPEN"
    },
    {
      id: "C-2026-0819-10",
      date: "2026-08-19",
      what_was_wrong: "The estate's own date-correction fix (C-08) initially ALSO mis-stated the GPAI date \u2014 a follow-on error that moved GPAI duties from 2 Aug 2025 to 2026 while correcting the high-risk date. A correction that introduces a new error is the worst kind.",
      how_caught: "Self-audit of the fix against the EU official page (digital-strategy.ec.europa.eu) \u2014 the estate caught its own owner mid-correction.",
      fix: "GPAI 2 Aug 2025 restored; Article 50 2 Aug 2026 and high-risk 2 Dec 2027 (Annex III) / 2 Aug 2028 (Annex I) stated distinctly. This entry is that admission, appended not edited.",
      status: "FIXED"
    },
    {
      id: "C-2026-0819-11",
      date: "2026-08-19",
      what_was_wrong: "mcp.json advertised three server URLs on csoai.org/api/* \u2014 every one returned 404 because the API is served from councilof.ai, and one route (corpus-watch) pointed at a non-existent path.",
      how_caught: "End-user MCP handshake test \u2014 a real JSON-RPC initialize probe against the advertised endpoints.",
      fix: "mcp.json now advertises councilof.ai URLs and the real /api/corpus-watch/status route; the advertised endpoints were verified 200/JSON-RPC-responsive after the fix.",
      status: "FIXED"
    },
    {
      id: "C-2026-0819-12",
      date: "2026-08-19",
      what_was_wrong: "A measurement wave was queued with sample=24, below the harness's 30-usable-item threshold \u2014 all 8 jobs returned UNMEASURED (honestly, but wasted a full wave).",
      how_caught: "Reading the signed board's status_note ('no model reached 30 usable items') rather than assuming the bank size was the constraint.",
      fix: "Requeued at sample=30; all 8/8 came back MEASURED and signed. The threshold is now documented in the job-spec contract.",
      status: "FIXED"
    },
    {
      id: "C-2026-0819-13",
      date: "2026-08-19",
      what_was_wrong: "Two measure-chain daemons ran simultaneously after a restart race, double-logging jobs; the restart script's pkill pattern matched its own command line and killed its own launch.",
      how_caught: "Duplicate 'daemon start' markers in the log; the self-kill was traced to the unanchored pkill pattern.",
      fix: "Anchored process pattern (^python3 /workspace/measure_chain.py) in the restart script; single-daemon verified after relaunch."
    },
    {
      id: "C-2026-0820-01",
      date: "2026-08-20",
      what_was_wrong: "Multiple live public surfaces (index.html JSON-LD, GSPCVerify, Insurers, AgentRegistry, Methodology, Agents, ProvBench, measure.html, and the provbench pack) stated measurement cards are 'anchored with OpenTimestamps' / RFC-3161 / 'Bitcoin block 954857, independently verifiable' as a present capability. The only anchor implemented is Ed25519 + SHA-256 hash-chain; verify.ts checks no timestamp proof and no .ots/Rekor artifact exists.",
      how_caught: "Internal honesty audit of anchoring claims vs implementation.",
      fix: "OTS/RFC-3161/Bitcoin claims demoted to roadmap wording across all surfaces; provbench pack corrected; the ML-DSA 'built, not shipped' discipline applied to OpenTimestamps.",
      status: "FIXED"
    },
    {
      id: "C-2026-0822-01",
      date: "2026-08-22",
      what_was_wrong: "The homepage industry grid still said '15-slot instrument' while the scoreboard, API and canon say '14-slot board, 13 measured of 14' (16 GSPC axes, 13 quotable + jail floor per the GSPC ruling). A crawler reading the grid would see 15 slots \u2014 the exact internal-count inconsistency the count-gating canon exists to prevent.",
      how_caught: "Text audit of live surfaces against canon (machine-contract style sweep of the homepage and fleet-sweep pages).",
      fix: "Killed both stale 15-slot references in NewHome-v3 (section comment + industry-grid subtitle) to '14-slot / 13 measured of 14'; verified 0 x '15-slot' remains. (PR #284.)",
      status: "FIXED"
    }
  ],
  signature: {
    id: "aa7a8211d3671330e0dcacf1a719125f9cb09dd4ba80272fc1fac617e652f367",
    signer: "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38",
    signature: "dff4ab2c4e1c8d80c9022330343f43145af4673a0a214cf24c9e2964d204f917aa8bdcbf6bc76fec8db0ff828524f057078e087fa53d4281b448bbce44e5ac00",
    sig_input: "sha256(Python json.dumps(canonical LEDGER minus signature fields, sort_keys=True, separators=(',',':')) \u2014 ensure_ascii escapes non-ASCII as \\uXXXX)",
    key_source: "did:web:csoai.org (estate signing key d4cb0eaa)",
    note: "SIGNED 2026-08-22 (re-issue: 15th entry \u2014 15-slot canon fix) - verify by recomputing canonical JSON and checking Ed25519 against did.json. Every append re-issues the signature; a stale signature is a published defect, never a silent edit."
  }
};
function canonJson(obj) {
  const j = /* @__PURE__ */ __name((o) => {
    if (Array.isArray(o))
      return "[" + o.map(j).join(",") + "]";
    if (o !== null && typeof o === "object") {
      const r = {};
      for (const k of Object.keys(o).sort())
        r[k] = o[k];
      return "{" + Object.keys(r).map((k) => JSON.stringify(k) + ":" + j(r[k])).join(",") + "}";
    }
    return JSON.stringify(o);
  }, "j");
  return j(obj).replace(/[\u0080-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}
__name(canonJson, "canonJson");
async function sha256Hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
var onRequestGet18 = /* @__PURE__ */ __name(async () => {
  const body = { ...LEDGER };
  delete body.signature;
  const canonical4 = canonJson(body);
  const cid = await sha256Hex(canonical4);
  const embeddedId = LEDGER.signature?.id ?? null;
  const signatureState = embeddedId && cid === embeddedId ? "VALID" : "STALE";
  const out = signatureState === "VALID" ? LEDGER : { ...LEDGER, signature_state: "STALE", note: "Signature is stale because the ledger was appended after signing. Re-issue the signature (gen-reg-feed.mjs) - a stale signature is a published defect, never a silent edit." };
  return new Response(JSON.stringify(out, null, 2), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*"
    }
  });
}, "onRequestGet");

// ../public/signed/gspc-board.signed.json
var gspc_board_signed_default = {
  schema: "csoai.gspc-axes/0.5",
  issuer: "CSOAI Ltd (GB, Companies House 16939677)",
  doi: "10.5281/zenodo.21991104",
  doi_note: "GSPC Methodology and the Frozen Corpus Anchor (the canonical methodology record \u2014 one citable spine, HB.0). Supersedes the stale 21755656 (an unrelated EAT-benchmark dataset).",
  measured_on: {
    model: "13 canonical axes: 19-model fleet (8 tuned council specialists + 6 base models + frontier cross-lab models). Jail (slot 14): 7-model fleet \u2014 smaller, stated on the axis, never conflated with the board fleet.",
    endpoint: "A100 \xB7 local Ollama (board v2) \xB7 OpenRouter (cross-lab models) \xB7 3090 pod (jail)",
    date: "2026-08-12 (13 canonical axes) \xB7 2026-08-18 (jail)",
    grading: "deterministic grading on 15,580 per-item rows (0 transport errors) \u2014 reproducible from csoai-static-deploy2 bb15589c with agents-repo/agents/board_v2.py",
    note: "GSPC (Governance \xB7 Safety \xB7 Provenance \xB7 Continuity) board. Slot counts live in totals (public_count, measured_axes, quotable_axes) and are derived, never typed. The measured canonical axes used the same fleet, same rows, same grader. Per-axis numbers show the board LEADER (whoever leads \u2014 tuned or base), its Wilson interval where n is honestly independent, and whether the lead is statistically separated (McNemar p<0.05) or a TIE. fleet_mean and mean_harm show the fleet, not the leader. Separation test and per-axis canonical counts: agents-repo/arena-real-runs/SEPARATION_TEST_2026-08-13.md and GSPC_AXIS_REGISTRY.json v2. Jail carries its per-model rows verbatim from the signed living board; its separation is TIE (determined 2026-08-25) \u2014 a TIE is not a separated leader. slot15 and human-vs-ai are measured in-lane only \u2014 see measured_in_lane, not the board.",
    living_stamp: {
      source: "board_living.json (csoai.gspc-living/0.1, boards-v2 + gold-run-3090)",
      updated: "2026-08-18T03:22:16Z",
      signed: true,
      signer: "8f9a00a28cfc76e36029fe805f3e421958f4d7d42c4f114865918a1001313912",
      signature: "bd199fd34a80b6352be727160c2fef34e6f66ca412baeba5b03dbe097a100afd89b037f5806c2924bc54cc27f75c09aa52762e016481ffafe1fab026e3c62f06",
      sig_input: "sha256(canonical board minus signature fields, sort_keys)"
    }
  },
  note: "Measurement, not certification. Every score is a measured run on a published, frozen split; the harness is public and anyone can recompute and challenge it. unparsed_rate is the share of responses no label could be read from \u2014 reported as UNMEASURED, never scored as a wrong answer. A TIE means the leader's point-estimate lead is not statistically separated; we do not count ties as wins.",
  totals: {
    axes: 22,
    measured_axes: 15,
    unmeasured_axes: 7,
    quotable_axes: 15,
    public_count: "22 axes \xB7 15 measured",
    count_grammar: "22 axes are on the board; 15 of them carry a measurement and 7 are declared slots with no run behind them. The larger number counts slots, the smaller counts measurements \u2014 quote both or quote the smaller. A published slot exists so the gap is visible; it is not evidence of anything having been measured.",
    by_family: {
      gspc: {
        axes: 14,
        measured: 14,
        note: "The 14 behavioural axes: a model fleet answers a frozen bank, graded deterministically."
      },
      financial: {
        axes: 8,
        measured: 1,
        note: "The 8 financial/domain axes (ADR-001). One is measured \u2014 provenance-controls, from a deterministic mainnet read of 6 issuer accounts. The other seven are declared slots with no run. None of the eight is a model comparison, so none has a leader, an accuracy or a separation determination, and none contributes to any mean below."
      }
    },
    sweep_note: "Swept 2026-08-26 under ADR-001. The 8 financial/domain axes were ruled in on 2026-08-24 but were absent from this payload until now, so this endpoint reported 14 \u2014 the un-swept state. The ruling applied the word 'measured' to the full slot count; the evidence supports 22 axes and 15 measurements, and the evidence wins. No axis was marked MEASURED to close that gap.",
    license: "CC-BY-4.0",
    license_note: "Board data is CC-BY-4.0 (attribute: Council of AI, CSOAI Ltd 16939677, councilof.ai). Our own valve-2 bench-card flagged the payload's missing licence field \u2014 fixed same day.",
    items: 893,
    items_note: "items sums each axis's n. The n of the one measured financial axis counts ISSUER ACCOUNTS, not bank items, and declared slots contribute 0 because nothing was measured. Read items as 'rows behind the board', not as a single comparable sample.",
    comparison_axes: 14,
    separated_leads: 4,
    ties: 10,
    untested_separations: 0,
    separation_scope_note: "Separation asks whether a leader's lead over a fleet is statistically real, so it applies only to the model-comparison axes. The financial axes have no fleet and no leader: they are not counted as untested, because no separation test is applicable to them.",
    mean_macro_f1: 0.7528,
    mean_accuracy: 0.7318,
    mean_fleet_mean: 0.5447,
    mean_harm: 0.4877,
    mean_unparsed_rate: 0.0813,
    mean_note: "Means are over MEASURED MODEL-COMPARISON axes that carry the field. mean_accuracy averages the per-axis LEADERS; mean_fleet_mean averages each axis's measured fleet \u2014 the difference is selection, not skill. mean_harm is the severity-weighted failure mass the mean accuracy hides; it exists only for the measured board-v2 axes. No financial axis enters any of these means: an axis with no accuracy contributes nothing rather than a zero."
  },
  bank_host: "https://huggingface.co/datasets/",
  bank_note: "Every axis WITH a frozen bank carries dataset_url \u2014 the bank resolved to a fetchable URL, so a stranger can retrieve the split without knowing where we host it. Added 2026-08-26 after our own rater-transparency axis measured this payload as carrying zero resolvable URLs. The financial axes have no HuggingFace bank: the measured one carries evidence_url to its signed run, and a declared slot with nothing behind it carries no link at all rather than one that resolves to nothing.",
  axes: [
    {
      axis: "governance",
      family: "gspc",
      kind: "model-comparison",
      bench: "GovBench",
      task: "EU AI Act risk-tier classification",
      n: 237,
      accuracy: 0.7,
      leader: "council-embodiment-v3-light (council specialist)",
      separation: "SEPARATED",
      separation_p: 86e-4,
      interval: [
        0.639,
        0.755
      ],
      fleet_mean: 0.49,
      mean_harm: 0.51,
      cvar05_harm: 0.8728,
      macro_f1: 0.705,
      unparsed_rate: 0.0386,
      status: "MEASURED",
      dataset: "csoai/gspc-gov",
      colour: "#34d399",
      hue: 152,
      note: 'v2 bank: 237 public items (+102 held back privately), imported 2026-08-05 from the AI Act Evaluation Benchmark (NCSR "Demokritos", arXiv:2603.09435, CC-BY-4.0). The tuned governance specialist leads AND the lead is separated (McNemar p=0.0086 vs best base mistral:7b) \u2014 one of only 4 separated leads on the board. The fleet mean is 0.490: EU AI Act tiering is hard for everyone, and the worst 5% of items carry harm 0.873 (CVaR, n=237) \u2014 the tail is real.',
      dataset_url: "https://huggingface.co/datasets/csoai/gspc-gov"
    },
    {
      axis: "safety",
      family: "gspc",
      kind: "model-comparison",
      bench: "DefBench",
      task: "calibrated refusal on paired requests",
      n: 36,
      accuracy: 0.944,
      leader: "gemma3:12b (base model)",
      separation: "TIE",
      separation_p: 0.6875,
      interval: [
        0.819,
        0.985
      ],
      fleet_mean: 0.732,
      mean_harm: 0.268,
      cvar05_harm: null,
      macro_f1: 0.944,
      unparsed_rate: 0.0541,
      status: "MEASURED",
      dataset: "csoai/gspc-agi",
      colour: "#f87171",
      hue: 0,
      note: "A base model holds the point lead but the lead is a TIE (McNemar p=0.69 vs qwen2.5:3b). Honestly reported: the tuned specialists do not own this axis.",
      dataset_url: "https://huggingface.co/datasets/csoai/gspc-agi"
    },
    {
      axis: "provenance",
      family: "gspc",
      kind: "model-comparison",
      bench: "ProvBench",
      task: "Article 50 marking survival by validity",
      n: 32,
      accuracy: 0.781,
      leader: "council-aesthetics-v3-light (council specialist)",
      separation: "TIE",
      separation_p: 0.7744,
      interval: [
        0.612,
        0.89
      ],
      fleet_mean: 0.549,
      mean_harm: 0.451,
      cvar05_harm: null,
      macro_f1: 0.776,
      unparsed_rate: 0.148,
      status: "MEASURED",
      dataset: "csoai/gspc-prv",
      colour: "#60a5fa",
      hue: 213,
      note: "v3 bank (validity principle: a manifest present but whose binding no longer validates has NOT survived). The tuned specialist leads on points; TIE vs llama3.2:3b (p=0.77).",
      dataset_url: "https://huggingface.co/datasets/csoai/gspc-prv"
    },
    {
      axis: "continuity",
      family: "gspc",
      kind: "model-comparison",
      bench: "PQCBench",
      task: "post-quantum status of a cryptographic assumption",
      n: 33,
      accuracy: 0.606,
      leader: "council-destruction-v3-light (council specialist)",
      separation: "TIE",
      separation_p: 1,
      interval: [
        0.437,
        0.753
      ],
      fleet_mean: 0.45,
      mean_harm: 0.55,
      cvar05_harm: null,
      macro_f1: 0.512,
      unparsed_rate: 0.0463,
      status: "MEASURED",
      dataset: "csoai/gspc-asi",
      colour: "#c084fc",
      hue: 271,
      note: "The axis designed to discriminate across frontier models. The tuned specialist leads on points; flat TIE vs gemma3:12b (p=1.0).",
      dataset_url: "https://huggingface.co/datasets/csoai/gspc-asi"
    },
    {
      axis: "conformance",
      family: "gspc",
      kind: "model-comparison",
      bench: "MCPBench",
      task: "MCP tool conformance",
      n: 35,
      accuracy: 0.743,
      leader: "council-preservation-v3-light (council specialist)",
      separation: "TIE",
      separation_p: 1,
      interval: [
        0.579,
        0.858
      ],
      fleet_mean: 0.537,
      mean_harm: 0.463,
      cvar05_harm: null,
      macro_f1: 0.735,
      unparsed_rate: 0.1338,
      status: "MEASURED",
      dataset: "csoai/gspc-mcp",
      colour: "#fbbf24",
      hue: 43,
      note: "Canonical bank count 35 (supersedes the stale 11 in older matrices \u2014 registry v2). The tuned specialist leads on points; flat TIE vs mistral:7b (p=1.0).",
      dataset_url: "https://huggingface.co/datasets/csoai/gspc-mcp"
    },
    {
      axis: "openness",
      family: "gspc",
      kind: "model-comparison",
      bench: "OSSBench",
      task: "licence reasoning versus intended use",
      n: 32,
      accuracy: 0.875,
      leader: "council-preservation-v3-light (council specialist)",
      separation: "TIE",
      separation_p: 1,
      interval: [
        0.719,
        0.95
      ],
      fleet_mean: 0.696,
      mean_harm: 0.304,
      cvar05_harm: null,
      macro_f1: 0.875,
      unparsed_rate: 0.0493,
      status: "MEASURED",
      dataset: "csoai/gspc-oss",
      colour: "#2dd4bf",
      hue: 174,
      note: "v2 bank (AGPL network trigger, directional compatibility, SSPL/ELv2/BSL service clauses). Canonical count 32 (supersedes stale 16). The tuned specialist leads on points; flat TIE vs gemma3:12b.",
      dataset_url: "https://huggingface.co/datasets/csoai/gspc-oss"
    },
    {
      axis: "machinery-conformity",
      family: "gspc",
      kind: "model-comparison",
      bench: "MachBench",
      task: "Machinery Reg self-evolving safety-function classification (PART_A / OUT_OF_SCOPE / NOT_SAFETY_FUNCTION)",
      n: 33,
      accuracy: 0.545,
      leader: "llama3.2:3b (base model)",
      separation: "TIE",
      separation_p: 0.5811,
      interval: [
        0.38,
        0.702
      ],
      fleet_mean: 0.349,
      mean_harm: 0.651,
      cvar05_harm: null,
      macro_f1: 0.465,
      unparsed_rate: 0.0558,
      status: "MEASURED",
      dataset: "csoai/gspc-mach",
      colour: "#fb923c",
      hue: 40,
      note: "A base model leads on points; TIE. Anchor: Machinery Reg (EU) 2023/1230 Annex I Part A items 5-6, applies 14 Jan 2027. Gold labels remain under legal review \u2014 measurement, not a conformity verdict.",
      dataset_url: "https://huggingface.co/datasets/csoai/gspc-mach"
    },
    {
      axis: "care",
      family: "gspc",
      kind: "model-comparison",
      bench: "CareBench",
      task: "care-cost (protect \xD7 help) under paired conduct scenarios",
      n: 199,
      n_note: "200 bank records, one exact-duplicate pair \u2192 199 unique scored texts (registry v2)",
      accuracy: 0.535,
      leader: "council-ethics-v3-light (council specialist)",
      separation: "SEPARATED",
      separation_p: 0.0356,
      interval: [
        0.466,
        0.603
      ],
      fleet_mean: 0.293,
      mean_harm: 0.707,
      cvar05_harm: 0.9895,
      macro_f1: 0.528,
      unparsed_rate: 0.1742,
      status: "MEASURED",
      dataset: "csoai/gspc-care",
      colour: "#f472b6",
      hue: 330,
      note: "SEPARATED vs the best base (p=0.036) but NOT clear of the majority-class baseline \u2014 quote it only as 'separated from base models'. The fleet mean is 0.293 and the worst 5% of items carry harm 0.990 (CVaR, n=199): calibrated care is the fleet's weakest measured axis, and the tail is nearly total.",
      dataset_url: "https://huggingface.co/datasets/csoai/gspc-care"
    },
    {
      axis: "cross-reality",
      family: "gspc",
      kind: "model-comparison",
      bench: "XRAIV",
      task: "autonomous agent action authority (PROCEED / CONFIRM / REFUSE)",
      n: 32,
      accuracy: 0.812,
      leader: "mistral:7b (base model)",
      separation: "TIE",
      separation_p: 0.0654,
      interval: [
        0.647,
        0.911
      ],
      fleet_mean: 0.441,
      mean_harm: 0.559,
      cvar05_harm: null,
      macro_f1: 0.803,
      unparsed_rate: 0.0247,
      status: "MEASURED",
      dataset: "csoai/gspc-xr",
      colour: "#a78bfa",
      hue: 258,
      note: "A base model leads on points; TIE (p=0.065 \u2014 the closest near-miss on the board, still not separated at p<0.05). Bank: 32 scored (public + held-out split per the bank card).",
      dataset_url: "https://huggingface.co/datasets/csoai/gspc-xr"
    },
    {
      axis: "detector-interop",
      family: "gspc",
      kind: "model-comparison",
      bench: "DetBench",
      task: "cross-detector watermark interoperability matrix",
      n: 33,
      accuracy: 0.879,
      leader: "deepseek-r1:8b (base model)",
      separation: "TIE",
      separation_p: 0.4531,
      interval: [
        0.727,
        0.952
      ],
      fleet_mean: 0.563,
      mean_harm: 0.437,
      cvar05_harm: null,
      macro_f1: 0.855,
      unparsed_rate: 0.1754,
      status: "MEASURED",
      dataset: "csoai/gspc-det",
      colour: "#38bdf8",
      hue: 199,
      note: "A base model leads on points; TIE, and NOT clear of the majority baseline. Methodology: POAI detector-interop. Code-of-Practice target 2 Feb 2027.",
      dataset_url: "https://huggingface.co/datasets/csoai/gspc-det"
    },
    {
      axis: "art5-safeguard",
      family: "gspc",
      kind: "model-comparison",
      bench: "Art5Bench",
      task: "EU AI Act Article 5 prohibited-practice trip",
      n: 36,
      accuracy: 0.972,
      leader: "council-relationality-v3-light (council specialist)",
      separation: "TIE",
      separation_p: 1,
      interval: [
        0.858,
        0.995
      ],
      fleet_mean: 0.83,
      mean_harm: 0.17,
      cvar05_harm: null,
      macro_f1: 0.972,
      unparsed_rate: 0.0117,
      status: "MEASURED",
      dataset: "csoai/gspc-art5",
      colour: "#fb7185",
      hue: 350,
      note: "The tuned specialist leads on points at 0.972; TIE vs gemma3:12b (p=1.0) \u2014 the whole fleet is strong here (fleet mean 0.830). The NCII/CSAM corpus is never handled by CSOAI.",
      dataset_url: "https://huggingface.co/datasets/csoai/gspc-art5"
    },
    {
      axis: "swarm",
      family: "gspc",
      kind: "model-comparison",
      bench: "SwarmBench v2b",
      task: "multi-agent coordination safety",
      n: 37,
      n_note: "wave-2b bank: 37 independent items \xD7 5-model fleet, n\u226536 graded per cell. Replaces the PROTOCOL bank (40 non-independent instances, interval withheld by our own effective-n rule) \u2014 the withholding retired because this bank earns its interval, not because the rule changed",
      accuracy: 0.384,
      accuracy_is: "95% Wilson LOWER BOUND \u2014 a conservative floor, not the point estimate. The point estimate lives in the signed wave-2b board (pod commit e440591); the bound is quoted here because it is the number that resolves the ordering",
      leader: "qwen2.5:7b (base model)",
      separation: "SEPARATED",
      separation_basis: "95% Wilson non-overlap: leader lower bound 0.384 clears runner-up (mistral:7b) upper bound 0.372. Bound non-overlap on independent items is stricter than p<0.05; the paired McNemar on the signed board rows follows when the pod re-signs. The top three models remain statistically tied among themselves \u2014 the ordering is resolved at the leader boundary only.",
      status: "MEASURED",
      dataset: "csoai/gspc-swarm",
      colour: "#94a3b8",
      hue: 215,
      note: "UNGATED by owner ruling 2026-08-19: the first CI-resolved ordering on this axis. The old PROTOCOL bank stays in the record as the honesty-clause gold template (CIs that looked disjoint, paired p=1.0 \u2014 why McNemar-primary exists). Jail (slot 14) separation was determined 2026-08-25 (TIE); live public_count is 14 measured of 14 quotable \u2014 cite totals.public_count.",
      dataset_url: "https://huggingface.co/datasets/csoai/gspc-swarm"
    },
    {
      axis: "affect",
      family: "gspc",
      kind: "model-comparison",
      bench: "AffectBench",
      task: "emotional & embodied safety (manipulation / disclosure / vulnerability)",
      n: 41,
      accuracy: 0.878,
      leader: "council-preservation-v3-light (council specialist)",
      separation: "SEPARATED",
      separation_p: 78e-4,
      interval: [
        0.745,
        0.947
      ],
      fleet_mean: 0.605,
      mean_harm: 0.782,
      cvar05_harm: null,
      macro_f1: 0.864,
      unparsed_rate: 0.0642,
      status: "MEASURED",
      dataset: "csoai/gspc-affect",
      colour: "#ec4899",
      hue: 330,
      note: "COUNSEL-PENDING: the legal gold labels and 1-5 severity bases await counsel review; this is a measurement of model behaviour against a counsel-pending key, NOT a legal verdict. The cleanest separation on the board: tuned 0.878 [0.745,0.947] vs base models 0.29-0.34 and majority baseline 0.439 (McNemar p=0.0078). Anchors: Art 5(1)(a)/(b) (live 2 Feb 2025), Art 50(3) (live 2 Aug 2026), Annex III 1(c) (Dec 2027 clock). FINDING: all 19 models \u2014 tuned and base alike \u2014 classify a lawful Art 5(1)(a) self-audit request as PROHIBITED (17), DISCLOSE (1) or fail to parse (1): the fleet uniformly over-blocks lawful self-examination. Routed to adjudication under the Blind-Spot Rule; the item is preserved, not deleted (evidence/adjudication/affect-adjudication.json).",
      dataset_url: "https://huggingface.co/datasets/csoai/gspc-affect"
    },
    {
      axis: "jail",
      family: "gspc",
      kind: "model-comparison",
      bench: "GoldBank-Detector",
      task: "escape-attempt detection on 71-cell gold bank (38 ESCAPE / 33 BENIGN) \u2014 layer 2 of 2",
      n: 71,
      n_note: "7 models \xD7 71 gold items; TP/FP/TN/FN per model; accuracy shown is the best zero-false-positive detector's (qwen2.5:0.5b-instruct, (tp+tn)/71)",
      accuracy: 0.5915,
      leader: "qwen2.5:0.5b-instruct (base model)",
      separation: "TIE",
      interval: [
        0.475,
        0.698
      ],
      fleet_mean: 0.5455,
      separation_method: "Wilson 95% interval over n=71 items tested against the fleet mean (stat_suite.separated_leaders, McNemar-style Wilson-overlap check)",
      separation_evidence: {
        leader: "qwen2.5:0.5b-instruct",
        leader_acc: 0.5915,
        wilson95: [
          0.475,
          0.698
        ],
        fleet_mean: 0.5455,
        determined: "2026-08-25",
        determination: "leader interval contains fleet mean \u2014 point-estimate lead is not a measured advantage"
      },
      quotable_models: [
        "qwen2.5:0.5b-instruct",
        "council-safe",
        "qwen2.5:7b",
        "mistral:7b",
        "qwen2.5:1.5b",
        "qwen3:4b",
        "council-inhouse-ft"
      ],
      quotable_note: "7 models x >=30 usable gold-bank items (68-71 each); per-model n below",
      fleet: "7 models (4 base + 2 council fine-tunes + 1 base variant) \u2014 NOT the 19-model board fleet",
      per_model: {
        "qwen3:4b": {
          n: 68,
          quotable: true,
          tp: 6,
          fp: 0,
          tn: 30,
          fn: 32,
          precision: 1,
          recall: 0.158,
          accuracy: 0.5294
        },
        "qwen2.5:7b": {
          n: 71,
          quotable: true,
          tp: 7,
          fp: 0,
          tn: 33,
          fn: 31,
          precision: 1,
          recall: 0.184,
          accuracy: 0.5634
        },
        "mistral:7b": {
          n: 71,
          quotable: true,
          tp: 9,
          fp: 3,
          tn: 30,
          fn: 29,
          precision: 0.75,
          recall: 0.237,
          accuracy: 0.5493
        },
        "council-safe": {
          n: 71,
          quotable: true,
          tp: 8,
          fp: 0,
          tn: 33,
          fn: 30,
          precision: 1,
          recall: 0.211,
          accuracy: 0.5775
        },
        "council-inhouse-ft": {
          n: 71,
          quotable: true,
          tp: 0,
          fp: 0,
          tn: 33,
          fn: 38,
          precision: null,
          recall: null,
          accuracy: 0.4648
        },
        "qwen2.5:1.5b": {
          n: 70,
          quotable: true,
          tp: 7,
          fp: 2,
          tn: 31,
          fn: 30,
          precision: 0.778,
          recall: 0.189,
          accuracy: 0.5429
        },
        "qwen2.5:0.5b-instruct": {
          n: 71,
          quotable: true,
          tp: 9,
          fp: 0,
          tn: 33,
          fn: 29,
          precision: 1,
          recall: 0.237,
          accuracy: 0.5915
        }
      },
      status: "MEASURED",
      dataset: "published: csoai/gspc-jail-goldbank (frozen 71-cell gold bank, HF 2026-08-25)",
      colour: "#64748b",
      hue: 215,
      note: "The jail floor is no longer empty: measured 2026-08-17/18 on a 71-cell gold bank, separation determined 2026-08-25 (TIE). Best zero-FP detector: qwen2.5:0.5b-instruct (precision 1.0, recall 0.237). Fleet mean accuracy 0.5455 (7 models, usable n 68-71). Our own council-inhouse-ft fine-tune detected ZERO escapes (tp=0) \u2014 published, not hidden. Recall is the honest weakness: the best detector still misses 76% of escapes.",
      dataset_url: "https://huggingface.co/datasets/published: csoai/gspc-jail-goldbank (frozen 71-cell gold bank, HF 2026-08-25)"
    },
    {
      axis: "provenance-controls",
      family: "financial",
      kind: "deterministic-facts",
      bench: "ChainFacts",
      task: "on-chain issuer control facts (allowlisting / freeze capability / identity domain)",
      n: 6,
      n_unit: "issuer accounts (not bank items)",
      n_note: "6 tokenised instruments read directly from their mainnet issuer accounts. This is an instrument count, not a bank-item count, and must never be pooled with the GSPC banks' n.",
      status: "MEASURED",
      evidence_url: "/interop/financial-measure-run-v2.json",
      coverage: "6 of the 16 instruments named in the registry",
      coverage_note: "The registry NAMES 16 instruments and this axis COVERS 6. The other 10 have no locatable public issuer address and were never attested \u2014 the gap is scope, not decay. Nothing measured here is stale: all 6 were re-verified against live mainnet with zero flag drift, and every attestation transaction still validates.",
      carrier: "attestation carrier is DEVNET; the facts are read from MAINNET. Mainnet attestation is PLANNED, not live.",
      colour: "#fbbf24",
      hue: 43,
      note: "MEASURED for on-chain control facts only, and only those \u2014 one axis family over six instruments. Deterministic: the rubric reads account-root flags (RequireAuth, NoFreeze, GlobalFreeze) and the declared Domain off the public ledger and decodes them; there is no model, no judgement, no score and no ranking. Measured 2026-08-25 across 6 issuers (RLUSD, Ondo OUSG, OpenEden TBILL, Archax abrdn MMF, Braza USDB, Braza BBRL); a stranger re-runs the fetch and compares. Signed run v0.2, content_id 29369542cb537f38. Findings: 3 of 6 enforce allowlisting, 6 of 6 retain issuer freeze capability, 6 of 6 declare an identity domain. TWO BOUNDARIES THAT ARE PART OF THE MEASUREMENT, NOT CAVEATS ON IT. First, the facts are read from mainnet but the attestations are carried on DEVNET \u2014 mainnet attestation is PLANNED and not live, and nothing is attested on any Ethereum chain. Second, THE RISK VERDICT IS UNMEASURED: what these facts imply about an instrument's safety, solvency or creditworthiness needs counsel and is not measured here. This is not a rating, not advice, not a ranking, and not an endorsement of any named instrument. Supersedes the v0.1 run."
    },
    {
      axis: "reserve-attestation",
      family: "financial",
      kind: "declared-slot",
      bench: "\u2014",
      task: "is a third-party reserve attestation publicly published and current? (deterministic Y/N + date)",
      n: 0,
      n_unit: "nothing measured",
      status: "UNMEASURED",
      evidence_url: "/interop/financial-axes.json",
      colour: "#a3a3a3",
      hue: 0,
      note: "Slot declared, rubric written, NO RUN. The rubric is deterministic and the intended inputs are named (issuer disclosures + RWA.xyz API), but nothing has been fetched, graded or signed, so there is no number and none is shown. Published as an open slot so the gap is public rather than quietly missing."
    },
    {
      axis: "regulatory-framework",
      family: "financial",
      kind: "declared-slot",
      bench: "\u2014",
      task: "is the governing regime declared and confirmable (MiCA / UCITS / Reg D / BVI)? (deterministic Y/N)",
      n: 0,
      n_unit: "nothing measured",
      status: "UNMEASURED",
      evidence_url: "/interop/financial-axes.json",
      colour: "#a3a3a3",
      hue: 0,
      note: "Slot declared, rubric written, NO RUN. Intended inputs: RWA.xyz issuer metadata crosswalked against /api/locale. Declaring a regime is not complying with it, and this axis would only ever measure whether the declaration is present and confirmable \u2014 never whether it is satisfied. That distinction is why the slot is published before it is measured."
    },
    {
      axis: "distribution-integrity",
      family: "financial",
      kind: "declared-slot",
      bench: "\u2014",
      task: "represented-vs-distributed classification and holder count",
      n: 0,
      n_unit: "nothing measured",
      status: "UNMEASURED",
      evidence_url: "/interop/financial-axes.json",
      colour: "#a3a3a3",
      hue: 0,
      note: "Slot declared, rubric written, NO RUN. Intended to flag deterministically where the represented supply greatly exceeds the distributed supply. The chain reads this needs are the same class as provenance-controls' and are achievable; they have not been run."
    },
    {
      axis: "custody-disclosure",
      family: "financial",
      kind: "declared-slot",
      bench: "\u2014",
      task: "are a custodian and an auditor named and confirmable? (deterministic Y/N)",
      n: 0,
      n_unit: "nothing measured",
      status: "UNMEASURED",
      evidence_url: "/interop/financial-axes.json",
      colour: "#a3a3a3",
      hue: 0,
      note: "Slot declared, rubric written, NO RUN. Measures disclosure presence only \u2014 that a custodian and auditor are named and the naming is confirmable \u2014 never the quality of either."
    },
    {
      axis: "ai-economy-index",
      family: "financial",
      kind: "declared-slot",
      bench: "\u2014",
      task: "deterministic index over cited public AI-economy series (compute price, investment, adoption, sector output)",
      n: 0,
      n_unit: "nothing measured \u2014 2 of 4 input components exist, no index computed",
      status: "UNMEASURED",
      evidence_url: "/interop/ai-economy-index.v0.1.json",
      colour: "#a3a3a3",
      hue: 0,
      note: "CANDIDATE slot, UNMEASURED. Partial bank: the EU enterprise AI-adoption components are live from a real Eurostat fetch (isoc_eb_ai, 2026-08-25; all-enterprise adoption 13.48% in 2024). Compute-price, AI-investment and sector-output series are BANK GAPS \u2014 stated, not filled. With half the inputs missing, no index is computed and no index value is published. CORRECTION: the linked v0.1 artifact still carries a status label of MEASURED-INDEX-v0.1. That label was an over-claim, is superseded by this UNMEASURED status, and the board is the authority. Reference components existing is not an index being measured."
    },
    {
      axis: "human-labour-index",
      family: "financial",
      kind: "declared-slot",
      bench: "\u2014",
      task: "deterministic index over cited public labour series (employment, hours, wages, displacement)",
      n: 0,
      n_unit: "nothing measured \u2014 2 of 4 input components exist, no index computed",
      status: "UNMEASURED",
      evidence_url: "/interop/human-labour-index.v0.1.json",
      colour: "#a3a3a3",
      hue: 0,
      note: "CANDIDATE slot, UNMEASURED. Partial bank: EU participation and unemployment components are live from a real fetch (2024: participation 57.58%, unemployment 5.92%). Displacement indicators, wage series and worker-hours-by-AI-exposure are BANK GAPS \u2014 stated, not filled. No index is computed and none is published. CORRECTION: as with ai-economy-index, the linked v0.1 artifact still carries a MEASURED-INDEX-v0.1 status label. That was an over-claim; this UNMEASURED status supersedes it."
    },
    {
      axis: "humanoid-labour-index",
      family: "financial",
      kind: "declared-slot",
      bench: "\u2014",
      task: "deterministic index over cited deployment / utilisation series (installed fleet, hours worked, safety incidents)",
      n: 0,
      n_unit: "nothing measured \u2014 no input bank exists at all",
      status: "UNMEASURED",
      colour: "#a3a3a3",
      hue: 0,
      note: "CANDIDATE slot, UNMEASURED, and the emptiest of the eight: there is NO input bank and no live surface. No authoritative public machine series exists for installed humanoid fleet, hours worked or safety-incident rates per deployment. The only available data is vendor self-report, which is not stranger-recomputable and so cannot ground a measurement. A deployment registry is the prerequisite and is NOT BUILT. Carries no evidence_url because there is no evidence to link."
    }
  ],
  measured_in_lane: [
    {
      axis: "slot15",
      bench: "Slot15-Honesty",
      task: "reserved-axis honesty: refuses to fabricate an instrument",
      n: 35,
      n_note: "6 models \xD7 36 items; per-model n varies (9\u201335) where responses were unparseable",
      accuracy: 0.3333,
      leader: "qwen2.5:7b (base model)",
      separation: "UNTESTED",
      fleet_mean: 0.1543,
      fleet: "6 models \u2014 NOT the 19-model board fleet",
      per_model: {
        "qwen3:4b": {
          n: 33,
          honest: 4,
          fabricated: 29,
          honesty_rate: 0.1212
        },
        "qwen2.5:7b": {
          n: 9,
          honest: 3,
          fabricated: 6,
          honesty_rate: 0.3333
        },
        "mistral:7b": {
          n: 35,
          honest: 5,
          fabricated: 30,
          honesty_rate: 0.1429
        },
        "council-safe": {
          n: 35,
          honest: 5,
          fabricated: 30,
          honesty_rate: 0.1429
        },
        "qwen2.5:1.5b": {
          n: 30,
          honest: 3,
          fabricated: 27,
          honesty_rate: 0.1
        },
        "qwen2.5:0.5b-instruct": {
          n: 35,
          honest: 3,
          fabricated: 32,
          honesty_rate: 0.0857
        }
      },
      status: "MEASURED",
      dataset: "pending publication (f2-measure, 3090 pod)",
      colour: "#eab308",
      hue: 48,
      note: "Slot-15 now has a name: instrument-honesty. Asked about an instrument that does not exist, does the model say so \u2014 or fabricate one? Every model measured fabricates most of the time (honesty rates 0.086\u20130.333; fleet mean 0.154). The best model is honest one time in three. This axis measures the failure mode this measurement body exists to counter."
    },
    {
      axis: "human-vs-ai",
      bench: "Colosseum-Pairs",
      task: "human-vs-AI pairwise alignment probes",
      n: 35,
      n_note: "6 models \xD7 36 items; per-model n varies (32\u201335) where responses were unparseable",
      accuracy: 1,
      leader: "qwen3:4b (base model)",
      separation: "UNTESTED",
      fleet_mean: 0.8498,
      fleet: "6 models \u2014 NOT the 19-model board fleet",
      per_model: {
        "qwen3:4b": {
          n: 35,
          aligned: 35,
          alignment_rate: 1
        },
        "qwen2.5:7b": {
          n: 35,
          aligned: 35,
          alignment_rate: 1
        },
        "mistral:7b": {
          n: 35,
          aligned: 35,
          alignment_rate: 1
        },
        "council-safe": {
          n: 32,
          aligned: 8,
          alignment_rate: 0.25
        },
        "qwen2.5:1.5b": {
          n: 35,
          aligned: 33,
          alignment_rate: 0.9429
        },
        "qwen2.5:0.5b-instruct": {
          n: 32,
          aligned: 29,
          alignment_rate: 0.9062
        }
      },
      status: "MEASURED",
      dataset: "pending publication (f2-measure, 3090 pod)",
      colour: "#4ade80",
      hue: 142,
      note: "Three base models align with the human key on every probe (1.0). Our own council-safe fine-tune aligns on 8 of 32 (0.25) \u2014 misaligned 3-to-1 against the humans it was tuned to serve. Published, not hidden: the instrument catches its own maker first."
    }
  ],
  domains: [
    {
      domain: "cross-border",
      title: "Cross-Border / East-West Bridge Governance",
      schema: "csoai.gspc-domains/cross-border/1.0",
      axes: 6,
      status: "SCAFFOLD",
      crosswalk: "/crosswalk/",
      crosswalk_v1: "/crosswalk/east-west-v1.json",
      east_west: "/east-west/",
      challenge: "/challenge/",
      card: "/signals/cross-border-card.signed.json",
      note: "One signed measurement mapped across EU/UK/US/IL/CN regimes. Scores free to verify; determination stays with authorities."
    }
  ],
  limitations: [
    "4 of the 14 measured model-comparison axes show a statistically separated leader (McNemar p<0.05 on discordant items): governance, care, swarm, affect. 10 are statistical ties \u2014 a point-estimate lead is not a measured advantage. This fraction is over the behavioural axes only; the financial axes are not model comparisons and are not in its denominator.",
    "22 axes are on the board and 15 carry a measurement. The 7 declared slots (reserve-attestation, regulatory-framework, distribution-integrity, custody-disclosure, and the three candidate indices) have NO run behind them \u2014 they are published so the gap is visible, and must never be quoted as measured. See totals.count_grammar.",
    "The one measured financial axis, provenance-controls, measures on-chain CONTROL FACTS only \u2014 which flags an issuer account carries \u2014 for ONE axis family over SIX instruments. What those facts imply about an instrument's risk, solvency or creditworthiness is UNMEASURED and needs counsel. It is not a rating, not investment advice, not a ranking, and not an endorsement of any named instrument.",
    "Rail honesty on provenance-controls: the issuer facts are read from MAINNET, but the attestations are carried on DEVNET. XRPL mainnet attestation is PLANNED, not live, and nothing is attested on any Ethereum chain \u2014 the EVM-side attestation backend is NOT BUILT. Coverage is 6 of the 16 instruments the registry names; the other 10 have no locatable public issuer address and were never attested. That gap is scope, not staleness: all 6 re-verified against live mainnet with zero flag drift.",
    "Two candidate indices (ai-economy-index, human-labour-index) have partial input banks whose linked v0.1 artifacts still carry a status label of MEASURED-INDEX-v0.1. That label was an over-claim and is superseded: both axes are UNMEASURED here, and this board is the authority. Reference components existing is not an index being measured.",
    "Jail (slot 14) separation determination 2026-08-25: TIE \u2014 the leader's Wilson 95% interval [0.475, 0.698] contains the fleet mean 0.5455, so the point-estimate lead is not a measured advantage. Measured on a 7-model gold-bank fleet (all models n\u226530 usable, 68\u201371), not the 19-model board fleet; the gold bank is published (csoai/gspc-jail-goldbank, HF 2026-08-25).",
    "jail's fleet accuracy 0.5455 is the mean of per-model accuracies across 7 models x 71 gold cells (usable n 68\u201371); the leader accuracy 0.5915 is the best zero-false-positive detector's (tp+tn)/71. Best precision 1.0, best recall 0.237 \u2014 the best detector still misses 3 of 4 escapes.",
    "measured_in_lane (slot15 instrument-honesty, human-vs-ai) is the internal 16-slot living-board convention: 6-model fleet, no separation test, served for honesty only. NOT board-quotable until the reconciliation gate opens (owner-gated); never counted in totals.",
    "care is separated from base models but NOT clear of the majority-class baseline; detector-interop and swarm leaders are also not clear of baseline. Quote accordingly.",
    "swarm is a protocol bank (3 unique prompts, 40 scored instances): its instances are not independent, so no interval is shown and its numbers carry an effective-n caveat.",
    "affect's legal gold labels and severity bases are COUNSEL-PENDING: the numbers measure model behaviour against a counsel-pending key and are not legal verdicts.",
    "Scores describe measured runs on frozen splits on a date. They do not describe a system's compliance with anything.",
    "CSOAI is a measurement body, not a certification or accreditation body, and not a notified body."
  ],
  custody_attestation: {
    attests: "integrity of this board snapshot as produced by GET /api/gspc on the stated date. NOT a re-measurement, and NOT a claim about any axis's status beyond what the payload states.",
    signer: "did:web:csoai.org#gspc-board-22axis-2026",
    custody: "3-party MPC (Coinbase cb-mpc, Ed25519 additive), owner's own Oracle tenancy",
    custody_note: "The signing key does not exist as a whole number anywhere: it exists only as 3 shares, and producing this signature required all 3 to run the protocol together. Withholding one share makes signing fail. This key was generated new inside the custody and is NOT the estate signing key.",
    parties: 3,
    alg: "Ed25519",
    keyid: "sha256:51dd13decb9932423495dd378484fe2b43d7304d69d6526fad10251b88216ab7",
    public_key_hex: "d573a7219c0d645091e9f640cb5bbfe71429d43ac168568665a7a260d01e0d2c",
    content_id: "0c7e851074cec32b6ebecc2c4c2fc0c89b8a817fbd0c8760251be602808b1684",
    sig_b64: "6HsFTazQ5T2oixjcJcaVsnMvJDpQ7VxmrQs5MRgQpLsNaoPJfwOURmvJaRJkKqZs4K8ABBwhNYqXjxbbWyVKCQ==",
    sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this payload with the custody_attestation field removed; content_id is sha256 of exactly those bytes",
    verify: "node scripts/gspc-board-verify.mjs <this file>  \u2014 needs no estate code, see the script header"
  }
};

// api/_gspc_axes_fin.ts
var AXES_FIN = [
  {
    axis: "provenance-controls",
    family: "financial",
    kind: "deterministic-facts",
    bench: "ChainFacts",
    task: "on-chain issuer control facts (allowlisting / freeze capability / identity domain)",
    n: 6,
    n_unit: "issuer accounts (not bank items)",
    n_note: "6 tokenised instruments read directly from their mainnet issuer accounts. This is an instrument count, not a bank-item count, and must never be pooled with the GSPC banks' n.",
    status: "MEASURED",
    // No separation field: there is no fleet and no leader, so no separation test is
    // APPLICABLE. That is a different fact from a test not yet run (UNTESTED).
    evidence_url: "/interop/financial-measure-run-v2.json",
    coverage: "6 of the 16 instruments named in the registry",
    coverage_note: "The registry NAMES 16 instruments and this axis COVERS 6. The other 10 have no locatable public issuer address and were never attested \u2014 the gap is scope, not decay. Nothing measured here is stale: all 6 were re-verified against live mainnet with zero flag drift, and every attestation transaction still validates.",
    carrier: "attestation carrier is DEVNET; the facts are read from MAINNET. Mainnet attestation is PLANNED, not live.",
    colour: "#fbbf24",
    hue: 43,
    note: "MEASURED for on-chain control facts only, and only those \u2014 one axis family over six instruments. Deterministic: the rubric reads account-root flags (RequireAuth, NoFreeze, GlobalFreeze) and the declared Domain off the public ledger and decodes them; there is no model, no judgement, no score and no ranking. Measured 2026-08-25 across 6 issuers (RLUSD, Ondo OUSG, OpenEden TBILL, Archax abrdn MMF, Braza USDB, Braza BBRL); a stranger re-runs the fetch and compares. Signed run v0.2, content_id 29369542cb537f38. Findings: 3 of 6 enforce allowlisting, 6 of 6 retain issuer freeze capability, 6 of 6 declare an identity domain. TWO BOUNDARIES THAT ARE PART OF THE MEASUREMENT, NOT CAVEATS ON IT. First, the facts are read from mainnet but the attestations are carried on DEVNET \u2014 mainnet attestation is PLANNED and not live, and nothing is attested on any Ethereum chain. Second, THE RISK VERDICT IS UNMEASURED: what these facts imply about an instrument's safety, solvency or creditworthiness needs counsel and is not measured here. This is not a rating, not advice, not a ranking, and not an endorsement of any named instrument. Supersedes the v0.1 run."
  },
  {
    axis: "reserve-attestation",
    family: "financial",
    kind: "declared-slot",
    bench: "\u2014",
    task: "is a third-party reserve attestation publicly published and current? (deterministic Y/N + date)",
    n: 0,
    n_unit: "nothing measured",
    status: "UNMEASURED",
    evidence_url: "/interop/financial-axes.json",
    colour: "#a3a3a3",
    hue: 0,
    note: "Slot declared, rubric written, NO RUN. The rubric is deterministic and the intended inputs are named (issuer disclosures + RWA.xyz API), but nothing has been fetched, graded or signed, so there is no number and none is shown. Published as an open slot so the gap is public rather than quietly missing."
  },
  {
    axis: "regulatory-framework",
    family: "financial",
    kind: "declared-slot",
    bench: "\u2014",
    task: "is the governing regime declared and confirmable (MiCA / UCITS / Reg D / BVI)? (deterministic Y/N)",
    n: 0,
    n_unit: "nothing measured",
    status: "UNMEASURED",
    evidence_url: "/interop/financial-axes.json",
    colour: "#a3a3a3",
    hue: 0,
    note: "Slot declared, rubric written, NO RUN. Intended inputs: RWA.xyz issuer metadata crosswalked against /api/locale. Declaring a regime is not complying with it, and this axis would only ever measure whether the declaration is present and confirmable \u2014 never whether it is satisfied. That distinction is why the slot is published before it is measured."
  },
  {
    axis: "distribution-integrity",
    family: "financial",
    kind: "declared-slot",
    bench: "\u2014",
    task: "represented-vs-distributed classification and holder count",
    n: 0,
    n_unit: "nothing measured",
    status: "UNMEASURED",
    evidence_url: "/interop/financial-axes.json",
    colour: "#a3a3a3",
    hue: 0,
    note: "Slot declared, rubric written, NO RUN. Intended to flag deterministically where the represented supply greatly exceeds the distributed supply. The chain reads this needs are the same class as provenance-controls' and are achievable; they have not been run."
  },
  {
    axis: "custody-disclosure",
    family: "financial",
    kind: "declared-slot",
    bench: "\u2014",
    task: "are a custodian and an auditor named and confirmable? (deterministic Y/N)",
    n: 0,
    n_unit: "nothing measured",
    status: "UNMEASURED",
    evidence_url: "/interop/financial-axes.json",
    colour: "#a3a3a3",
    hue: 0,
    note: "Slot declared, rubric written, NO RUN. Measures disclosure presence only \u2014 that a custodian and auditor are named and the naming is confirmable \u2014 never the quality of either."
  },
  {
    axis: "ai-economy-index",
    family: "financial",
    kind: "declared-slot",
    bench: "\u2014",
    task: "deterministic index over cited public AI-economy series (compute price, investment, adoption, sector output)",
    n: 0,
    n_unit: "nothing measured \u2014 2 of 4 input components exist, no index computed",
    status: "UNMEASURED",
    evidence_url: "/interop/ai-economy-index.v0.1.json",
    colour: "#a3a3a3",
    hue: 0,
    note: "CANDIDATE slot, UNMEASURED. Partial bank: the EU enterprise AI-adoption components are live from a real Eurostat fetch (isoc_eb_ai, 2026-08-25; all-enterprise adoption 13.48% in 2024). Compute-price, AI-investment and sector-output series are BANK GAPS \u2014 stated, not filled. With half the inputs missing, no index is computed and no index value is published. CORRECTION: the linked v0.1 artifact still carries a status label of MEASURED-INDEX-v0.1. That label was an over-claim, is superseded by this UNMEASURED status, and the board is the authority. Reference components existing is not an index being measured."
  },
  {
    axis: "human-labour-index",
    family: "financial",
    kind: "declared-slot",
    bench: "\u2014",
    task: "deterministic index over cited public labour series (employment, hours, wages, displacement)",
    n: 0,
    n_unit: "nothing measured \u2014 2 of 4 input components exist, no index computed",
    status: "UNMEASURED",
    evidence_url: "/interop/human-labour-index.v0.1.json",
    colour: "#a3a3a3",
    hue: 0,
    note: "CANDIDATE slot, UNMEASURED. Partial bank: EU participation and unemployment components are live from a real fetch (2024: participation 57.58%, unemployment 5.92%). Displacement indicators, wage series and worker-hours-by-AI-exposure are BANK GAPS \u2014 stated, not filled. No index is computed and none is published. CORRECTION: as with ai-economy-index, the linked v0.1 artifact still carries a MEASURED-INDEX-v0.1 status label. That was an over-claim; this UNMEASURED status supersedes it."
  },
  {
    axis: "humanoid-labour-index",
    family: "financial",
    kind: "declared-slot",
    bench: "\u2014",
    task: "deterministic index over cited deployment / utilisation series (installed fleet, hours worked, safety incidents)",
    n: 0,
    n_unit: "nothing measured \u2014 no input bank exists at all",
    status: "UNMEASURED",
    colour: "#a3a3a3",
    hue: 0,
    note: "CANDIDATE slot, UNMEASURED, and the emptiest of the eight: there is NO input bank and no live surface. No authoritative public machine series exists for installed humanoid fleet, hours worked or safety-incident rates per deployment. The only available data is vendor self-report, which is not stranger-recomputable and so cannot ground a measurement. A deployment registry is the prerequisite and is NOT BUILT. Carries no evidence_url because there is no evidence to link."
  }
];

// api/counters.ts
var counter = /* @__PURE__ */ __name((id2, name, count, kind, source, as_of, as_of_field, note) => ({
  id: id2,
  name,
  count,
  kind,
  status: count != null ? "PUBLISHED" : "UNPUBLISHED",
  source,
  as_of,
  as_of_field,
  note
}), "counter");
var SRC_BOARD = "public/signed/gspc-board.signed.json";
var SRC_AXES = "functions/api/_gspc_axes_{a,b,fin}.ts (the arrays /api/gspc derives from)";
var boardTotals = gspc_board_signed_default.totals ?? {};
var boardMeasuredOn = gspc_board_signed_default.measured_on?.date ?? null;
var LIVE_AXES = [...AXES_A, ...AXES_B, ...AXES_FIN];
var liveAxisSlots = LIVE_AXES.length;
var liveMeasuredAxes = LIVE_AXES.filter((a) => a.status === "MEASURED").length;
var boardAgrees = boardTotals.axes === liveAxisSlots && boardTotals.measured_axes === liveMeasuredAxes;
var COUNTERS = [
  counter(
    "gspc_measured_axes",
    "GSPC measured axes",
    liveMeasuredAxes,
    "measured",
    SRC_AXES + " \u2192 filter(status === 'MEASURED').length",
    boardMeasuredOn,
    "measured_on.date",
    "Board slots with a real graded run behind them. This is the number to quote if you quote only one. as_of is the signed board's measurement stamp, verbatim \u2014 it is a date of record, not an instant, and not when this response was served."
  ),
  counter(
    "gspc_axis_slots",
    "GSPC axis slots (declared, not measured)",
    liveAxisSlots,
    "declared",
    SRC_AXES + " \u2192 length",
    boardMeasuredOn,
    "measured_on.date",
    "A count of SLOTS. A slot is published so a gap is visible; it is not evidence that anything was measured. Never quote this number alone \u2014 quote it beside gspc_measured_axes, or quote /api/gspc totals.public_count, which carries both."
  ),
  counter(
    "axis_register_rows",
    "Axis register rows (canonical scored rows)",
    AXES.length,
    "catalogued",
    AXIS_REGISTER_SOURCE + ".length",
    null,
    null,
    "Rows bundled in the register that /api/axis-register serves, counted from the array. This module carries NO timestamp of any kind, so as_of and as_of_field are both null. The board's measurement date is a neighbouring source's date, not this one's, and the deploy time is nobody's measurement time. Unknown stays null. NOTE: register rows are not board slots and the two are never added \u2014 see counting_rule on /api/axis-register."
  ),
  counter(
    "verify_page_executions",
    "Verify-page executions (free, zero-auth)",
    null,
    "unmeasured",
    null,
    null,
    null,
    "No counter exists behind this anywhere in this repo, so any number would be invented. Verification is free, zero-auth and unlogged by design; counting it would mean instrumenting it. UNPUBLISHED is the honest answer and it is the whole answer."
  ),
  counter(
    "watch_desk_reads",
    "Watch-desk reads",
    null,
    "unmeasured",
    null,
    null,
    null,
    "Not measured and not published. No telemetry and no per-user data is collected on this surface, so there is nothing to count. UNPUBLISHED, not zero \u2014 zero would be a claim."
  )
];
var onRequestGet19 = /* @__PURE__ */ __name(async () => {
  const body = {
    schema: "csoai.wave1-counters/0.2",
    wave: 1,
    contract: {
      derivation: "Every count below is derived from a committed artifact in THIS repo, in-process. Nothing is fetched to serve this response and no count is typed by hand.",
      freshness: "There is no new Date() in this endpoint. as_of is read OUT OF the artifact and as_of_field names the key it came from. Two calls any interval apart return a byte-identical payload; if they ever differ, this endpoint has the defect it was rebuilt to remove.",
      freshness_self_test: "curl -s http://localhost:8799/api/counters | jq -S '[.counters[]|{id,as_of_field,as_of}]' > /tmp/a; sleep 5; curl -s http://localhost:8799/api/counters | jq -S '[.counters[]|{id,as_of_field,as_of}]' > /tmp/b; diff /tmp/a /tmp/b && echo IDENTICAL",
      freshness_self_test_warning: "Confirm as_of is PRESENT and non-null on at least one counter before trusting that diff. A check that reads a field which does not exist compares null to null and passes for every input, forever. This repo has shipped that defect twice.",
      kinds: {
        measured: "A run happened against a frozen bank or source and was graded.",
        declared: "A slot published so a gap is visible. No run behind it.",
        catalogued: "Listed in a register. Nothing was contacted and nothing was run.",
        unmeasured: "It exists and we have not measured it \u2014 stated, not implied."
      },
      never_sum: "Kinds are never added together. A declared slot is not a measurement and a register row is not a board slot.",
      unpublished_rule: "UNPUBLISHED means no source exists, not that a fetch failed. Null is never replaced with zero, with a plausible-looking value, or with a figure from another estate.",
      aggregate_authority: "/api/state is the one surface a lane quotes for a count. This endpoint is a Wave-1 public-utility subset of it and must agree with it by construction \u2014 both derive from the same committed artifacts. Doctrine: council-os/QUOTING-NUMBERS.md."
    },
    counters: COUNTERS,
    board_crosscheck: {
      note: "The axis counters above are derived live from the axis arrays; the signed board is a snapshot of that same computation. Both are computed and compared here so drift is published rather than silently inherited by whichever surface a reader opened.",
      live_source: SRC_AXES,
      signed_source: SRC_BOARD,
      live_axis_slots: liveAxisSlots,
      live_measured_axes: liveMeasuredAxes,
      signed_axis_slots: boardTotals.axes ?? null,
      signed_measured_axes: boardTotals.measured_axes ?? null,
      signed_snapshot_agrees: boardAgrees,
      on_disagreement: "If signed_snapshot_agrees is false, NEITHER number is quotable until the snapshot is re-derived and re-signed. Do not pick the one you prefer."
    },
    note: "Aggregate-only. NO telemetry, NO per-user data, NO fabricated counts. Measurement, not a ranking, and never a certification."
  };
  return new Response(JSON.stringify(body, null, 1), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // The payload is deterministic for a given deploy, so a cache cannot make it stale
      // in the way a serve-time stamp could. The old `no-store` existed to keep a
      // clock-following field fresh; there is no such field left to keep fresh.
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*"
    }
  });
}, "onRequestGet");

// api/cross.ts
var AXIS_LAW = {
  gov: { obligation: "high-risk classification + conformity (Annex III use-cases)", instrument: "EU AI Act Art 6 / Annex III" },
  art5: { obligation: "prohibited-practice prohibition", instrument: "EU AI Act Art 5" },
  det: { obligation: "synthetic-content marking + detection interop", instrument: "EU AI Act Art 50" },
  prv: { obligation: "data governance + automated-decision rights", instrument: "GDPR Art 22 / EU AI Act Art 10" },
  mach: { obligation: "safety-component conformity assessment", instrument: "EU Machinery Reg 2023/1230" },
  mcp: { obligation: "interoperability + technical documentation", instrument: "EU AI Act Art 11 / Annex IV" },
  oss: { obligation: "GPAI transparency (systemic-risk carve-out)", instrument: "EU AI Act Art 53\u201355" },
  care: { obligation: "vulnerability protection (Art 5 exploitation ban)", instrument: "EU AI Act Art 5(1)(b)" },
  affect: { obligation: "emotion-recognition disclosure", instrument: "EU AI Act Art 50 / Art 5 workplace ban" },
  agi: { obligation: "systemic-risk safety + incident reporting", instrument: "EU AI Act Art 55 / Commitment 9" },
  asi: { obligation: "continuity / systemic-risk mitigation", instrument: "EU AI Act Art 55" },
  xr: { obligation: "synthetic-human disclosure (cross-reality)", instrument: "EU AI Act Art 50" },
  swarm: { obligation: "multi-agent oversight (human oversight duty)", instrument: "EU AI Act Art 14" }
};
var onRequestGet20 = /* @__PURE__ */ __name(async (ctx) => {
  const origin = new URL(ctx.request.url).origin;
  const grab = /* @__PURE__ */ __name(async (p) => {
    try {
      return await (await fetch(origin + p)).json();
    } catch {
      return null;
    }
  }, "grab");
  const [board, reg, rep] = await Promise.all([grab("/api/gspc"), grab("/api/regulation"), grab("/api/reported")]);
  const axes = board?.axes ?? [];
  const regByInstr = {};
  for (const d of reg?.deadlines ?? [])
    regByInstr[d.instrument] = d;
  const rows = axes.map((a) => {
    const law = AXIS_LAW[a.axis];
    const penalty = law?.instrument?.startsWith("EU AI Act") ? reg?.penalty_tiers_eu_ai_act?.most_obligations_incl_art50_and_gpai ?? null : null;
    return {
      axis: a.axis,
      measured_ai: {
        leader: a.leader,
        accuracy: a.accuracy,
        accuracy_is: a.accuracy_is ?? "point estimate",
        separation: a.separation,
        n: a.n,
        state: a.status === "MEASURED" ? "MEASURED (signed)" : a.status
      },
      regulation: law ? { obligation: law.obligation, instrument: law.instrument, penalty_exposure: penalty } : { note: "no single governing instrument mapped for this axis" },
      divergence: law ? `The instrument (${law.instrument}) requires ${law.obligation}. Measured leader ${a.leader} scores ${(a.accuracy * 100).toFixed(1)}%${a.accuracy_is ? " (" + a.accuracy_is + ")" : ""} on the frozen split; separation ${a.separation}. Whether that clears the obligation is a legal question, not a measured one \u2014 this cell states the gap, it does not certify.` : null
    };
  });
  const body = {
    schema: "csoai.cross/0.1",
    what: "The divergence layer. NOT one fused gap number \u2014 regulation and a bond price are not commensurable on one scale. Conformance to the in-force provision is the deterministic axis; the measured-AI result and the human baseline are reported ALONGSIDE as context, each labelled by data state. It composes; it does not fuse.",
    legs: {
      regulation: { source: "/api/regulation", state: "statement of law, cited", present: !!reg },
      measured_ai: { source: "/api/gspc", state: "MEASURED (signed board)", present: !!board },
      human_baseline: { source: "/api/reported", state: "REPORTED (cited third-party)", present: !!rep, note: "CAPABILITY-LEVEL baselines (ARC-AGI/GAIA/GPQA), not yet per-axis \u2014 stated, not hidden. REPORTED context only: human labels carry inherent noise (literature ~63.5% mean agreement), so the human leg is never deterministically SCORED \u2014 it is reported with its source, never fused into a measured cell." },
      market_data: { state: "NOT PRESENT \u2014 a live index/market leg would be a fourth REPORTED leg contingent on a real cited source; it is not fabricated here" }
    },
    east_west: "Jurisdictional divergence (EU \xB7 US states \xB7 China \xB7 Korea \xB7 Japan \xB7 Australia) lives in /api/regulation \u2014 the same measured-AI number carries different obligations and penalties across regimes.",
    human_baselines_sample: (rep?.entries ?? rep?.reported ?? []).slice(0, 5),
    rows,
    honest_gate: "This cross composes live feeds and is signed at the edge with #board-attestation-1 \u2014 the SAME key and mechanism as /api/gspc. The signature attests the INTEGRITY of this composed payload as served; it does not re-attest the underlying legs (each carries its own data-state and, where present, its own signature). No key \u2192 no signature field.",
    license: "CC-BY-4.0",
    publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)"
  };
  const b64 = ctx.env?.BOARD_SIGN_KEY_PKCS8_B64;
  if (b64) {
    try {
      const canonical4 = /* @__PURE__ */ __name((o) => {
        if (o === null || typeof o !== "object")
          return JSON.stringify(o);
        if (Array.isArray(o))
          return "[" + o.map(canonical4).join(",") + "]";
        const r = o;
        return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical4(r[k])).join(",") + "}";
      }, "canonical");
      const hex3 = /* @__PURE__ */ __name((b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""), "hex");
      const signedBytes = canonical4(body);
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex3(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = await crypto.subtle.exportKey("jwk", key);
      body.signature = {
        attests: "integrity of this composed divergence payload as published by the site (NOT a re-attestation of the underlying legs)",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        public_key_x: jwk.x,
        sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this payload with the signature field removed",
        verify: "fetch /.well-known/did.json \u2192 #board-attestation-1 public key \u2192 recompute canonical JSON and verify Ed25519 against did.json"
      };
    } catch {
      body.signature = { error: "signing key present but unusable \u2014 operations must fix; no signature emitted" };
    }
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" }
  });
}, "onRequestGet");

// api/east-west-bench.ts
var onRequestGet21 = /* @__PURE__ */ __name(async ({ request }) => {
  const ts = (/* @__PURE__ */ new Date()).toISOString();
  let marketSnapshot = null;
  let marketFetchNote = null;
  try {
    const target = new URL("/arena/east-west-market.json", request.url);
    const res = await fetch(target, { headers: { accept: "application/json" } });
    if (res.ok)
      marketSnapshot = await res.json();
    else
      marketFetchNote = `snapshot HTTP ${res.status}`;
  } catch (e) {
    marketFetchNote = String(e);
  }
  const marketRows = Array.isArray(marketSnapshot?.rows) ? marketSnapshot.rows : null;
  return Response.json({
    schema: "csoai.east-west.pair-gap/0.1",
    name: "East-West bench \u2014 the measured trust gauge: East-vs-West pair-gap (regulation \xD7 measured-AI \xD7 market context, composed never fused)",
    ts,
    register: "measurement, not certification \u2014 displayed side by side, never blended",
    // RAIL 1: EAST-vs-WEST AI regulation-adherence (MEASURED, signed chain)
    east_vs_west: {
      bench: "gspc-art5 cross-lab (guarded Art-5 scenarios)",
      n: 38,
      source_card: "2f1e8da6\u2026 (signed)",
      west_block_rate: { value: 0, ci: [0, 11.4], label: "Western models (gpt-4o-mini, claude-haiku-4.5, gemini-2.5-flash, llama-3.3-70b, grok-4.5, mistral-small)" },
      east_block_rate: { value: 23.3, ci: [11.8, 40.9], label: "Eastern models (deepseek-chat-v3.1 \u2014 fails Art-5 exception clauses, 28/36 77.8%)" },
      separation: "the bench separates labs \u2014 deepseek-chat-v3.1 fails the exception clauses the bench was built to discriminate",
      quotable_gate: "CX-5: quotable as behaviour measurement with CIs + chain; not an accuracy benchmark from run rows alone"
    },
    // RAIL 2: LIVE REGULATION (the feed the bench measures against)
    regulation: {
      feed: "/api/regulation",
      instruments: "19 instruments, verified + signed (estate-chain-1 envelope)",
      high_risk: "EU AI Act Annex III: 2 Dec 2027 (Digital Omnibus Reg (EU) 2026/1744)"
    },
    // INSURER-DEFENSIBILITY (2026-08-20 research, cited):
    // - Parametric adoption limited by basis risk + product complexity (BIS FSI-IAIS
    //   Insights No 62) → triggers must be pre-disclosed, transparent, official closes.
    // - Descartes Underwriting wrote parametric cover to $140M for data centers —
    //   insurers already buy parametric on AI infrastructure; this extends to AI
    //   regulation risk.
    // - Academic: NO significant market reaction to the EU AI Act's introduction →
    //   markets don't price AI regulation → the paired instrument is novel.
    // - The market rail is a signed surface: RFC 3161 timestamps (FreeTSA) + point-in-
    //   time snapshots on the Ed25519 h3k cards, so no look-ahead bias is possible.
    insurer_defensibility: {
      basis_risk: "triggers use third-party official index closes (HSI/CSI/Nasdaq/AIQ official values), not our computed values \u2014 like a weather station in parametric weather cover",
      double_trigger: "payout when (a) signed regulation-adherence divergence exceeds X AND (b) East-AI-index relative drawdown vs West exceeds Y \u2014 formula pre-disclosed",
      timestamping: "RFC 3161 (FreeTSA) + point-in-time snapshots on signed cards \u2014 audit-standard, no look-ahead bias",
      citations: ["BIS FSI-IAIS Insights No 62 (basis risk)", "Descartes Underwriting $140M data-center parametric", "Do Investors Trust in AI Investments of European Companies? (no EU AI Act market reaction)", "qu3ry.net credentialed trigger observations"]
    },
    // RAIL 3: LIVE MARKET (the index the AI companies trade on — live pull, timestamped)
    market: marketRows ? { as_of: marketSnapshot?.as_of ?? ts, source: "yfinance live pull (Yahoo Finance), static snapshot /arena/east-west-market.json", rows: marketRows } : {
      as_of: ts,
      source: `yfinance live pull (Yahoo Finance) \u2014 snapshot /arena/east-west-market.json not readable (${marketFetchNote ?? "unknown"})`,
      rows: [
        { index: "Hang Seng (^HSI)", side: "east", last: null, note: "snapshot not published this deploy" },
        { index: "S&P 500 (^GSPC)", side: "west", last: null, note: "snapshot not published this deploy" }
      ]
    },
    // RAIL 4: HUMAN BASELINES (REPORTED — published aggregates, attributed)
    human: {
      rail: "/api/reported",
      entries: ["arc-agi-3-human-gap", "gaia-human-gap", "gpqa-diamond-expertise-gap", "human-or-not-detection", "colonoscopy-deskilling"],
      note: "published human aggregates, REPORTED state with attribution \u2014 never blended into MEASURED cells"
    },
    // The pairing (displayed, never fused — per the provision-conformance reframe)
    the_pairing: {
      claim: "A signed provision-conformance receipt for a defined task, with market state and human baseline reported ALONGSIDE as adjacent axes \u2014 never fused into one number",
      caveat: "regulation states what is permitted; market data states what is priced. They are not commensurable on one scale \u2014 so conformance is measured deterministically and market/human context is reported beside it, with confidence intervals",
      limitations: ["deterministic predicates confined to the provision-conformance axis", "human and market rails are REPORTED context with CIs, not deterministically scored", "no causation claimed between rails"]
    },
    signature_envelope: {
      schema: "csoai.signed-surface/0.1",
      kid: "did:web:csoai.org#estate-chain-1",
      note: "recompute content_id at /gspc-verify \u2014 the bench is a signed surface like the board"
    }
  }, {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" }
  });
}, "onRequestGet");

// api/eunomia-data.ts
var onRequestGet22 = /* @__PURE__ */ __name(async (context) => {
  const url = new URL(context.request.url);
  const key = url.searchParams.has("key") ? "keyed" : "public";
  const wantsGate = url.searchParams.get("x402") === "1";
  const paid = url.searchParams.get("x402") === "paid" || context.request.headers.get("x-payment") != null;
  const origin = url.origin;
  const fines = [
    { actor: "Clearview AI", jurisdiction: "EU/UK/IT", regime: "GDPR", amount: ">\u20AC100M", status: "cumulative (multi-MSA)" },
    { actor: "FTC (US)", jurisdiction: "US", regime: "FTC Act / ECOA", amount: "~$85M", status: "order (partly suspended)" },
    { actor: "UK ICO", jurisdiction: "UK", regime: "UK GDPR", amount: "~\xA317M", status: "AI-adjacent" },
    { actor: "OpenAI", jurisdiction: "IT", regime: "GDPR", amount: "\u20AC15M", status: "annulled (Mar 2025)" },
    { actor: "EU AI Act (GPAI / Art 101)", jurisdiction: "EU", regime: "EU AI Act", amount: "\u20AC0", status: "FIRST-FINE WATCH" }
  ];
  const deadlines = [
    { name: "Texas AI systems registration portal", date: "2026-09-01", note: "state AI disclosure" },
    { name: "DRCF (UK) AI disclosure", date: "2026-09-02", note: "Digital Regulation Cooperation Forum" },
    { name: "EU AI Act Art 50(2) transparency grace ends", date: "2026-12-02", note: "GPAI transparency" },
    { name: "Korea AI Act grace period ends", date: "2027-01-22", note: "Korea AI Basic Act" },
    { name: "Illinois AI audits (265 ILCS)", date: "2028-01-01", note: "state AI audit" }
  ];
  const gate = {
    kind: "x402",
    price_usd: 0.02,
    per: "query",
    pay_url: `${origin}/api/eunomia-data?x402=1`,
    settle_mcp: "https://github.com/CSOAI-ORG/csoai-coinbase-x402-receipt-mcp",
    data_only: true
  };
  if (wantsGate && !paid) {
    return new Response(
      JSON.stringify({
        lane: "commercial-data",
        schema: "csoai.eunomia-data/0.1",
        gate,
        payment_required: {
          amount_usd: 0.02,
          instruction: "Complete x402 settlement via settle_mcp, then retry with ?x402=paid"
        }
      }, null, 2),
      {
        status: 402,
        headers: { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "no-store" }
      }
    );
  }
  return new Response(
    JSON.stringify({
      lane: "commercial-data",
      schema: "csoai.eunomia-data/0.1",
      note: "x402 DATA product \u2014 never scores, never ranked. Regulators/public free (R8) via /first-fine-watch.",
      signer: "did:web:csoai.org#estate-chain-1",
      key_mode: key,
      gate,
      data: paid || !wantsGate ? { fines, deadlines } : void 0,
      preview: !paid && !wantsGate
    }, null, 2),
    {
      headers: { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "public, max-age=300" }
    }
  );
}, "onRequestGet");

// api/evidence-pack.ts
var onRequestGet23 = /* @__PURE__ */ __name(async () => {
  const ts = (/* @__PURE__ */ new Date()).toISOString();
  return Response.json({
    schema: "csoai.insurability-evidence-pack/0.1",
    ts,
    purpose: "signed underwriting evidence input + drift rail \u2014 reframed per insurer-evidence research (not a parametric trigger; aiSure-style triggers are business-metric SLAs, and this pack supplies the 'prediction vs outcome' baseline data those SLAs require)",
    // CLASS 1: SYSTEM TRANSPARENCY — what was measured, how, by what method
    system_transparency: {
      what_is_measured: "AI system behaviour against in-force regulatory provisions (deterministic predicates, never LLM-as-judge)",
      board: "GET /api/gspc \u2014 public_count derived from totals (measured_axes of quotable_axes); every score with item count + CI where quotable (n>=30)",
      methodology: "GET /api/regulation + /methodology \u2014 provision-version-pinned, quarterly re-verified + on amendment",
      verify: "GET /gspc-verify \u2014 60-second in-browser Ed25519 verification, no account, no fee"
    },
    // CLASS 2: DATA LINEAGE — where every figure came from
    data_lineage: {
      measured_cells: "deterministic fleet runs on frozen splits \u2014 signed, re-runnable from the published harness",
      reported_figures: "GET /api/reported \u2014 published aggregates with attribution + timestamp (REPORTED state, never blended into MEASURED)",
      regulation: "version-pinned consolidated text (GET /api/regulation versions map) \u2014 a wrong date is a published correction, never a silent edit",
      market: "GET /api/east-west-bench \u2014 AI-theme index rail (AIQ/CHAT/BOTZ vs KWEB/CSI-930713), timestamped, point-in-time snapshots + RFC 3161 (roadmap)"
    },
    // CLASS 3: ACTIVE CONTROLS — the estate's own evidence-generation is instrumented
    active_controls: {
      signing_chain: "Ed25519 (estate-chain-1, published did:web:csoai.org) + SHA-256 hash-chain \u2014 every card GATED\u2192SIGNED\u2192TIME-ANCHORED",
      watchdog: "external dead-man's switch (10-min) \u2014 chain death/env-wipe/key-loss self-heals; boot-time fail-fast assertions",
      corrections_ledger: "GET /api/corrections \u2014 the estate publishes when it was wrong; 13 real self-caught corrections, signed, appended-never-edited",
      drift_detection: "daily reg-watch re-hashes provisions; measurement records go stale when the underlying text changes \u2014 re-attest on amendment"
    },
    // CLASS 4: NAMED ACCOUNTABILITY OWNERS
    named_owners: {
      measurement_director: "Nicholas Templeman, Founder \u2014 CSOAI Ltd (UK Companies House 16939677)",
      signing_key: "estate-chain-1 (did:web:csoai.org#estate-chain-1) \u2014 key custody documented, verified against live did.json",
      professional_indemnity: "\xA35M PI cover (CHPR5355800XB) \u2014 advertised for managing-agent due diligence",
      contact: "nicholas@csoai.org (right-of-reply within 14 days; corrections appended, never hidden)"
    },
    // THE BUNDLE — what an underwriter receives in one signed artifact
    bundle: [
      "the signed measurement receipt (h3k card, Ed25519, 60s verify)",
      "this evidence pack (the four classes, signed)",
      "the version-pinned provision text the receipt cites",
      "the control crosswalk (13 axes \xD7 8 frameworks) with methodology",
      "the corrections ledger excerpt (the honesty gate, signed)"
    ],
    // HONEST LIMITS (never overclaim)
    limitations: [
      "measurement, not certification \u2014 no SOC 2 Type II / ISO 42001 yet (roadmap: gap assessment first)",
      "insurers today accept evidence packages (AIUC-1-style), not raw signed cards \u2014 this pack is the mapping into those categories",
      "market rail is dev-grade (yfinance) pending the licensed feed swap",
      "no live human-baseline capture pipeline yet \u2014 human figures are published aggregates, attributed"
    ],
    signature_envelope: {
      schema: "csoai.signed-surface/0.1",
      kid: "did:web:csoai.org#estate-chain-1",
      note: "recompute content_id at /gspc-verify \u2014 the evidence pack is a signed surface like the board"
    }
  }, {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=1800", "access-control-allow-origin": "*" }
  });
}, "onRequestGet");

// api/feed.xml.ts
var ITEMS = [
  {
    title: "GSPC board: 14 measured of 14 quotable \u2014 jail separation MEASURED (TIE)",
    link: "https://councilof.ai/api/gspc",
    date: "Tue, 25 Aug 2026 17:10:00 GMT",
    desc: "Live public_count is now 14 measured of 14 quotable. Jail status MEASURED; separation TIE (n=71); untested_separations=0. Cite live totals.public_count \u2014 do not invent 22 axes. Historical RSS items below keep their sitting-day wording."
  },
  {
    title: "The carder is live: deterministic fact-cards, and it caught us first",
    link: "https://github.com/CSOAI-ORG/carder",
    date: "Wed, 19 Aug 2026 13:30:00 GMT",
    desc: "One engine, four valves (datasets / benchmarks / leaderboards / models). Pilot on our own 29 datasets found 14 missing machine-readable licences and near-empty cards \u2014 all fixed same day, verified by re-card: 29/29 GREEN. Valve 2 then flagged our own repos' missing LICENSE files and the board API's missing licence field \u2014 also fixed same day. Right-of-reply pipeline shipped: no third-party card publishes without a token. Own assets first, always."
  },
  {
    title: "/insurers \u2014 the evidence pack an underwriter can verify",
    link: "https://councilof.ai/insurers",
    date: "Wed, 19 Aug 2026 12:00:00 GMT",
    desc: "Card anatomy, offline curl verification, severity tails (CVaR@5% where n\u2265100), drift via reg-watch, and the honesty gate. No pricing; verification free forever."
  },
  {
    title: "Verify one record, in your browser, with a shareable permalink",
    link: "https://councilof.ai/gspc-verify",
    date: "Wed, 19 Aug 2026 12:30:00 GMT",
    desc: "Paste any estate record: content_id recomputed (both envelope generations), Ed25519 checked against the published did.json keys via WebCrypto. Tested against a real card (PASS) and a tampered copy (FAIL). Unsigned records get an honest 'hash checked only' \u2014 never a fake pass."
  },
  {
    title: "Swarm ungated: the first CI-resolved ordering on the swarm axis",
    link: "https://councilof.ai/api/gspc",
    date: "Tue, 19 Aug 2026 11:30:00 GMT",
    desc: "Owner ruling 19 Aug 2026: the wave-2b bank (37 independent items, 5-model fleet, n\u226536/cell) resolves the swarm ordering \u2014 qwen2.5:7b's 95% lower bound (0.384) clears the runner-up's upper bound (0.372). Separated leads: 4 of 14. The retired PROTOCOL bank stays in the record as the honesty-clause example. Jail remains the board's only untested separation, so the public count stays 13 measured of 14."
  },
  {
    title: "Arena feed live: 2,900+ signed AI-vs-AI rounds streaming",
    link: "https://councilof.ai/api/sov-arena/rounds.jsonl",
    date: "Wed, 19 Aug 2026 09:30:00 GMT",
    desc: "The live arena evidence feed is public: NDJSON rounds with per-model scores. Honest 503 when no live state \u2014 never a fabricated round."
  },
  {
    title: "REPORTED \u2014 the third data state, published",
    link: "https://councilof.ai/api/reported",
    date: "Wed, 19 Aug 2026 08:00:00 GMT",
    desc: "Third-party figures, cited + timestamped ('reported by source, not measured here'), unsigned, never mixed with MEASURED. Five entries at launch."
  },
  {
    title: "The Measurement/Remediation Firewall Charter",
    link: "https://councilof.ai/firewall-charter",
    date: "Wed, 19 Aug 2026 08:00:00 GMT",
    desc: "Seven published commitments: never operate the fixer; re-measurement free and unpurchasable; ranked-never-pay; signing-key isolation; disclosed-never-preferred affiliates; engagement fills the funnel, only sealed measurement fills the board; corrections appended, never edited."
  },
  {
    title: "Regulation-change detector live (daily)",
    link: "https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/reg-watch.mjs",
    date: "Tue, 18 Aug 2026 23:00:00 GMT",
    desc: "EU AI Act, GDPR, Machinery Reg, DPA 2018, DUAA watched at their official sources; provision-change events emitted for the recurrency loop."
  },
  {
    title: "SITTING 1: the GSPC 14-slot board \u2014 13 measured of 14",
    link: "https://councilof.ai/api/gspc",
    date: "Tue, 18 Aug 2026 12:00:00 GMT",
    desc: "Jail (slot 14) promoted from the signed living board: 7-model fleet, separation untested, stated honestly. 3 of 13 canonical axes carry a separated leader; ties are ties."
  }
];
var esc2 = /* @__PURE__ */ __name((s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), "esc");
var onRequestGet24 = /* @__PURE__ */ __name(async () => {
  const items = ITEMS.map(
    (i) => `    <item>
      <title>${esc2(i.title)}</title>
      <link>${esc2(i.link)}</link>
      <pubDate>${i.date}</pubDate>
      <guid isPermaLink="false">${esc2(i.link)}#${i.date.replace(/[^0-9]/g, "")}</guid>
      <description>${esc2(i.desc)}</description>
    </item>`
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Council of AI \u2014 state changes</title>
    <link>https://councilof.ai/</link>
    <description>MEASURED boards, REPORTED context, regulation-change events and corrections from the independent AI-measurement body. Measurement, not certification. Verification free forever.</description>
    <language>en-gb</language>
${items}
  </channel>
</rss>`;
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=1800",
      "access-control-allow-origin": "*"
    }
  });
}, "onRequestGet");

// api/fulfill.ts
var onRequestGet25 = /* @__PURE__ */ __name(async () => {
  return Response.json(
    {
      configured: false,
      public_prices: false,
      message: "No public prices. A grade is never sold. Verify is free at /gspc-verify. Get measured at /assess. Email nicholas@csoai.org."
    },
    { status: 404 }
  );
}, "onRequestGet");

// api/_gspc_types.ts
var MEASURED_ON = {
  model: "13 canonical axes: 19-model fleet (8 tuned council specialists + 6 base models + frontier cross-lab models). Jail (slot 14): 7-model fleet \u2014 smaller, stated on the axis, never conflated with the board fleet.",
  endpoint: "A100 \xB7 local Ollama (board v2) \xB7 OpenRouter (cross-lab models) \xB7 3090 pod (jail)",
  date: "2026-08-12 (13 canonical axes) \xB7 2026-08-18 (jail)",
  grading: "deterministic grading on 15,580 per-item rows (0 transport errors) \u2014 reproducible from csoai-static-deploy2 bb15589c with agents-repo/agents/board_v2.py",
  note: "GSPC (Governance \xB7 Safety \xB7 Provenance \xB7 Continuity) board. Slot counts live in totals (public_count, measured_axes, quotable_axes) and are derived, never typed. The measured canonical axes used the same fleet, same rows, same grader. Per-axis numbers show the board LEADER (whoever leads \u2014 tuned or base), its Wilson interval where n is honestly independent, and whether the lead is statistically separated (McNemar p<0.05) or a TIE. fleet_mean and mean_harm show the fleet, not the leader. Separation test and per-axis canonical counts: agents-repo/arena-real-runs/SEPARATION_TEST_2026-08-13.md and GSPC_AXIS_REGISTRY.json v2. Jail carries its per-model rows verbatim from the signed living board; its separation is TIE (determined 2026-08-25) \u2014 a TIE is not a separated leader. slot15 and human-vs-ai are measured in-lane only \u2014 see measured_in_lane, not the board.",
  living_stamp: {
    source: "board_living.json (csoai.gspc-living/0.1, boards-v2 + gold-run-3090)",
    updated: "2026-08-18T03:22:16Z",
    signed: true,
    signer: "8f9a00a28cfc76e36029fe805f3e421958f4d7d42c4f114865918a1001313912",
    signature: "bd199fd34a80b6352be727160c2fef34e6f66ca412baeba5b03dbe097a100afd89b037f5806c2924bc54cc27f75c09aa52762e016481ffafe1fab026e3c62f06",
    sig_input: "sha256(canonical board minus signature fields, sort_keys)"
  }
};

// api/_gspc_lane.ts
var MEASURED_IN_LANE = [
  {
    axis: "slot15",
    bench: "Slot15-Honesty",
    task: "reserved-axis honesty: refuses to fabricate an instrument",
    n: 35,
    n_note: "6 models \xD7 36 items; per-model n varies (9\u201335) where responses were unparseable",
    accuracy: 0.3333,
    leader: "qwen2.5:7b (base model)",
    separation: "UNTESTED",
    fleet_mean: 0.1543,
    fleet: "6 models \u2014 NOT the 19-model board fleet",
    per_model: {
      "qwen3:4b": { n: 33, honest: 4, fabricated: 29, honesty_rate: 0.1212 },
      "qwen2.5:7b": { n: 9, honest: 3, fabricated: 6, honesty_rate: 0.3333 },
      "mistral:7b": { n: 35, honest: 5, fabricated: 30, honesty_rate: 0.1429 },
      "council-safe": { n: 35, honest: 5, fabricated: 30, honesty_rate: 0.1429 },
      "qwen2.5:1.5b": { n: 30, honest: 3, fabricated: 27, honesty_rate: 0.1 },
      "qwen2.5:0.5b-instruct": { n: 35, honest: 3, fabricated: 32, honesty_rate: 0.0857 }
    },
    status: "MEASURED",
    dataset: "pending publication (f2-measure, 3090 pod)",
    colour: "#eab308",
    hue: 48,
    note: "Slot-15 now has a name: instrument-honesty. Asked about an instrument that does not exist, does the model say so \u2014 or fabricate one? Every model measured fabricates most of the time (honesty rates 0.086\u20130.333; fleet mean 0.154). The best model is honest one time in three. This axis measures the failure mode this measurement body exists to counter."
  },
  {
    axis: "human-vs-ai",
    bench: "Colosseum-Pairs",
    task: "human-vs-AI pairwise alignment probes",
    n: 35,
    n_note: "6 models \xD7 36 items; per-model n varies (32\u201335) where responses were unparseable",
    accuracy: 1,
    leader: "qwen3:4b (base model)",
    separation: "UNTESTED",
    fleet_mean: 0.8498,
    fleet: "6 models \u2014 NOT the 19-model board fleet",
    per_model: {
      "qwen3:4b": { n: 35, aligned: 35, alignment_rate: 1 },
      "qwen2.5:7b": { n: 35, aligned: 35, alignment_rate: 1 },
      "mistral:7b": { n: 35, aligned: 35, alignment_rate: 1 },
      "council-safe": { n: 32, aligned: 8, alignment_rate: 0.25 },
      "qwen2.5:1.5b": { n: 35, aligned: 33, alignment_rate: 0.9429 },
      "qwen2.5:0.5b-instruct": { n: 32, aligned: 29, alignment_rate: 0.9062 }
    },
    status: "MEASURED",
    dataset: "pending publication (f2-measure, 3090 pod)",
    colour: "#4ade80",
    hue: 142,
    note: "Three base models align with the human key on every probe (1.0). Our own council-safe fine-tune aligns on 8 of 32 (0.25) \u2014 misaligned 3-to-1 against the humans it was tuned to serve. Published, not hidden: the instrument catches its own maker first."
  }
];

// api/gspc.ts
var AXES3 = [...AXES_A, ...AXES_B, ...AXES_FIN];
var round = /* @__PURE__ */ __name((x, p = 4) => Math.round(x * 10 ** p) / 10 ** p, "round");
var onRequestGet26 = /* @__PURE__ */ __name(async (context) => {
  const url = new URL(context.request.url);
  const axis = url.searchParams.get("axis");
  const selected = axis ? AXES3.filter((a) => a.axis === axis) : AXES3;
  if (axis && selected.length === 0) {
    return new Response(
      JSON.stringify({ error: "unknown axis", known: AXES3.map((a) => a.axis) }, null, 2),
      { status: 404, headers: { "content-type": "application/json; charset=utf-8" } }
    );
  }
  const items = selected.reduce((s, a) => s + a.n, 0);
  const measuredSlots = selected.filter((a) => a.status === "MEASURED");
  const comparisonSlots = measuredSlots.filter((a) => a.kind === "model-comparison");
  const measuredCount = comparisonSlots.filter((a) => a.separation !== "UNTESTED").length;
  const separatedNames = comparisonSlots.filter((a) => a.separation === "SEPARATED").map((a) => a.axis);
  const tieCount = comparisonSlots.filter((a) => a.separation === "TIE").length;
  const BANK_HOST = "https://huggingface.co/datasets/";
  const withResolvableBank = /* @__PURE__ */ __name((a) => a && typeof a.dataset === "string" && a.dataset ? { ...a, dataset_url: BANK_HOST + a.dataset } : a, "withResolvableBank");
  const body = {
    schema: "csoai.gspc-axes/0.5",
    issuer: "CSOAI Ltd (GB, Companies House 16939677)",
    doi: "10.5281/zenodo.21991104",
    doi_note: "GSPC Methodology and the Frozen Corpus Anchor (the canonical methodology record \u2014 one citable spine, HB.0). Supersedes the stale 21755656 (an unrelated EAT-benchmark dataset).",
    measured_on: MEASURED_ON,
    note: "Measurement, not certification. Every score is a measured run on a published, frozen split; the harness is public and anyone can recompute and challenge it. unparsed_rate is the share of responses no label could be read from \u2014 reported as UNMEASURED, never scored as a wrong answer. A TIE means the leader's point-estimate lead is not statistically separated; we do not count ties as wins.",
    totals: (() => {
      const m2 = selected.filter((a) => a.status === "MEASURED");
      const cmp = m2.filter((a) => a.kind === "model-comparison");
      const avg = /* @__PURE__ */ __name((f) => {
        const vals = cmp.map(f).filter((v) => typeof v === "number");
        return vals.length ? round(vals.reduce((s, v) => s + v, 0) / vals.length) : null;
      }, "avg");
      const measured = m2.length;
      const unmeasured = selected.length - measured;
      const bySelectedFamily = /* @__PURE__ */ __name((fam) => {
        const all = selected.filter((a) => a.family === fam);
        return { axes: all.length, measured: all.filter((a) => a.status === "MEASURED").length };
      }, "bySelectedFamily");
      return {
        axes: selected.length,
        measured_axes: measured,
        unmeasured_axes: unmeasured,
        // Retained for consumers that read it. Under the swept canon we quote only
        // what we measured, so quotable_axes == measured_axes by construction.
        quotable_axes: measured,
        public_count: `${selected.length} axes \xB7 ${measured} measured`,
        count_grammar: `${selected.length} axes are on the board; ${measured} of them carry a measurement and ${unmeasured} are declared slots with no run behind them. The larger number counts slots, the smaller counts measurements \u2014 quote both or quote the smaller. A published slot exists so the gap is visible; it is not evidence of anything having been measured.`,
        by_family: {
          gspc: {
            ...bySelectedFamily("gspc"),
            note: "The 14 behavioural axes: a model fleet answers a frozen bank, graded deterministically."
          },
          financial: {
            ...bySelectedFamily("financial"),
            note: "The 8 financial/domain axes (ADR-001). One is measured \u2014 provenance-controls, from a deterministic mainnet read of 6 issuer accounts. The other seven are declared slots with no run. None of the eight is a model comparison, so none has a leader, an accuracy or a separation determination, and none contributes to any mean below."
          }
        },
        sweep_note: "Swept 2026-08-26 under ADR-001. The 8 financial/domain axes were ruled in on 2026-08-24 but were absent from this payload until now, so this endpoint reported 14 \u2014 the un-swept state. The ruling applied the word 'measured' to the full slot count; the evidence supports 22 axes and 15 measurements, and the evidence wins. No axis was marked MEASURED to close that gap.",
        license: "CC-BY-4.0",
        license_note: "Board data is CC-BY-4.0 (attribute: Council of AI, CSOAI Ltd 16939677, councilof.ai). Our own valve-2 bench-card flagged the payload's missing licence field \u2014 fixed same day.",
        items,
        items_note: "items sums each axis's n. The n of the one measured financial axis counts ISSUER ACCOUNTS, not bank items, and declared slots contribute 0 because nothing was measured. Read items as 'rows behind the board', not as a single comparable sample.",
        // Separation stats are over model-comparison axes ONLY — see comparison_axes.
        comparison_axes: cmp.length,
        separated_leads: cmp.filter((a) => a.separation === "SEPARATED").length,
        ties: cmp.filter((a) => a.separation === "TIE").length,
        untested_separations: cmp.filter((a) => a.separation === "UNTESTED").length,
        separation_scope_note: "Separation asks whether a leader's lead over a fleet is statistically real, so it applies only to the model-comparison axes. The financial axes have no fleet and no leader: they are not counted as untested, because no separation test is applicable to them.",
        mean_macro_f1: avg((a) => a.macro_f1),
        mean_accuracy: avg((a) => a.accuracy),
        mean_fleet_mean: avg((a) => a.fleet_mean),
        mean_harm: avg((a) => a.mean_harm),
        mean_unparsed_rate: avg((a) => a.unparsed_rate),
        mean_note: "Means are over MEASURED MODEL-COMPARISON axes that carry the field. mean_accuracy averages the per-axis LEADERS; mean_fleet_mean averages each axis's measured fleet \u2014 the difference is selection, not skill. mean_harm is the severity-weighted failure mass the mean accuracy hides; it exists only for the measured board-v2 axes. No financial axis enters any of these means: an axis with no accuracy contributes nothing rather than a zero."
      };
    })(),
    bank_host: BANK_HOST,
    bank_note: "Every axis WITH a frozen bank carries dataset_url \u2014 the bank resolved to a fetchable URL, so a stranger can retrieve the split without knowing where we host it. Added 2026-08-26 after our own rater-transparency axis measured this payload as carrying zero resolvable URLs. The financial axes have no HuggingFace bank: the measured one carries evidence_url to its signed run, and a declared slot with nothing behind it carries no link at all rather than one that resolves to nothing.",
    axes: selected.map(withResolvableBank),
    // In the payload for honesty; NOT the board. See the note on each entry.
    measured_in_lane: axis ? void 0 : MEASURED_IN_LANE,
    domains: [
      {
        domain: "cross-border",
        title: "Cross-Border / East-West Bridge Governance",
        schema: "csoai.gspc-domains/cross-border/1.0",
        axes: 6,
        status: "SCAFFOLD",
        crosswalk: "/crosswalk/",
        crosswalk_v1: "/crosswalk/east-west-v1.json",
        east_west: "/east-west/",
        challenge: "/challenge/",
        card: "/signals/cross-border-card.signed.json",
        note: "One signed measurement mapped across EU/UK/US/IL/CN regimes. Scores free to verify; determination stays with authorities."
      }
    ],
    limitations: [
      `${separatedNames.length} of the ${measuredCount} measured model-comparison axes show a statistically separated leader (McNemar p<0.05 on discordant items): ${separatedNames.join(", ") || "none"}. ${tieCount} are statistical ties \u2014 a point-estimate lead is not a measured advantage. This fraction is over the behavioural axes only; the financial axes are not model comparisons and are not in its denominator.`,
      "22 axes are on the board and 15 carry a measurement. The 7 declared slots (reserve-attestation, regulatory-framework, distribution-integrity, custody-disclosure, and the three candidate indices) have NO run behind them \u2014 they are published so the gap is visible, and must never be quoted as measured. See totals.count_grammar.",
      "The one measured financial axis, provenance-controls, measures on-chain CONTROL FACTS only \u2014 which flags an issuer account carries \u2014 for ONE axis family over SIX instruments. What those facts imply about an instrument's risk, solvency or creditworthiness is UNMEASURED and needs counsel. It is not a rating, not investment advice, not a ranking, and not an endorsement of any named instrument.",
      "Rail honesty on provenance-controls: the issuer facts are read from MAINNET, but the attestations are carried on DEVNET. XRPL mainnet attestation is PLANNED, not live, and nothing is attested on any Ethereum chain \u2014 the EVM-side attestation backend is NOT BUILT. Coverage is 6 of the 16 instruments the registry names; the other 10 have no locatable public issuer address and were never attested. That gap is scope, not staleness: all 6 re-verified against live mainnet with zero flag drift.",
      "Two candidate indices (ai-economy-index, human-labour-index) have partial input banks whose linked v0.1 artifacts still carry a status label of MEASURED-INDEX-v0.1. That label was an over-claim and is superseded: both axes are UNMEASURED here, and this board is the authority. Reference components existing is not an index being measured.",
      "Jail (slot 14) separation determination 2026-08-25: TIE \u2014 the leader's Wilson 95% interval [0.475, 0.698] contains the fleet mean 0.5455, so the point-estimate lead is not a measured advantage. Measured on a 7-model gold-bank fleet (all models n\u226530 usable, 68\u201371), not the 19-model board fleet; the gold bank is published (csoai/gspc-jail-goldbank, HF 2026-08-25).",
      "jail's fleet accuracy 0.5455 is the mean of per-model accuracies across 7 models x 71 gold cells (usable n 68\u201371); the leader accuracy 0.5915 is the best zero-false-positive detector's (tp+tn)/71. Best precision 1.0, best recall 0.237 \u2014 the best detector still misses 3 of 4 escapes.",
      "measured_in_lane (slot15 instrument-honesty, human-vs-ai) is the internal 16-slot living-board convention: 6-model fleet, no separation test, served for honesty only. NOT board-quotable until the reconciliation gate opens (owner-gated); never counted in totals.",
      "care is separated from base models but NOT clear of the majority-class baseline; detector-interop and swarm leaders are also not clear of baseline. Quote accordingly.",
      "swarm is a protocol bank (3 unique prompts, 40 scored instances): its instances are not independent, so no interval is shown and its numbers carry an effective-n caveat.",
      "affect's legal gold labels and severity bases are COUNSEL-PENDING: the numbers measure model behaviour against a counsel-pending key and are not legal verdicts.",
      "Scores describe measured runs on frozen splits on a date. They do not describe a system's compliance with anything.",
      "CSOAI is a measurement body, not a certification or accreditation body, and not a notified body."
    ]
  };
  const b64 = context.env?.BOARD_SIGN_KEY_PKCS8_B64;
  if (b64) {
    try {
      const canonical4 = /* @__PURE__ */ __name((o) => {
        if (o === null || typeof o !== "object")
          return JSON.stringify(o);
        if (Array.isArray(o))
          return "[" + o.map(canonical4).join(",") + "]";
        const r = o;
        return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical4(r[k])).join(",") + "}";
      }, "canonical");
      const hex3 = /* @__PURE__ */ __name((b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""), "hex");
      const signedBytes = canonical4(body);
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex3(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = await crypto.subtle.exportKey("jwk", key);
      body.site_attestation = {
        attests: "integrity of this board snapshot as published by the site (NOT a re-measurement)",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        // The public key is echoed for transparency, but a stranger anchors trust
        // on the SAME key as published independently in /.well-known/did.json — the
        // payload never vouches for its own key.
        public_key_x: jwk.x,
        sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this payload with the site_attestation field removed",
        verify: "fetch /.well-known/did.json \u2192 #board-attestation-1 public key \u2192 verify sig over canonical(payload minus site_attestation)"
      };
    } catch {
      body.site_attestation = { error: "board signing key present but unusable \u2014 operations must fix; no signature emitted" };
    }
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*"
    }
  });
}, "onRequestGet");

// api/health.js
function onRequestGet27() {
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "councilof.ai",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      endpoints: [
        "/api/mcp",
        "/api/tools",
        "/api/gspc",
        "/api/assess",
        "/api/health",
        "/api/receipts/latest",
        "/api/dorado",
        "/api/evidence-pack"
      ]
    }),
    {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
    }
  );
}
__name(onRequestGet27, "onRequestGet");

// api/interop-bulk.ts
var SURFACES = [
  "/interop/attestation-corpus.json",
  "/interop/financial-measure-run-v2.json",
  "/interop/mcp-security-scorecard.json",
  "/interop/rwa-attest-index.json",
  "/interop/eas-attestation-batch.json"
];
var onRequestGet28 = /* @__PURE__ */ __name(async (ctx) => {
  const url = new URL(ctx.request.url);
  const surface = String(url.searchParams.get("surface") ?? "");
  if (!SURFACES.includes(surface)) {
    return Response.json({ error: "unknown surface", surfaces: SURFACES }, { status: 400 });
  }
  const wantsGate = url.searchParams.get("x402") === "1";
  const paidHeader = ctx.request.headers.get("x-payment") != null;
  if (wantsGate && !paidHeader) {
    return Response.json(
      {
        schema: "csoai.interop-bulk/0.1",
        payment_required: {
          kind: "x402",
          amount: 0.02,
          per: "bulk-fetch",
          instruction: "Settle via the estate x402 receipt MCP (or provider:'meta' on /api/checkout), then retry with the x-payment header + invoice id.",
          settle_mcp: "https://github.com/CSOAI-ORG/csoai-coinbase-x402-receipt-mcp"
        }
      },
      { status: 402 }
    );
  }
  const base = new URL(ctx.request.url).origin;
  return Response.json(
    {
      schema: "csoai.interop-bulk/0.1",
      surface,
      free: true,
      artifacts: [base + surface.replace("/interop/", "/interop/")],
      note: "Trust engine free forever; bulk/replay metered only. Measurement, not certification."
    },
    { status: 200 }
  );
}, "onRequestGet");

// api/lead.ts
var onRequestPost7 = /* @__PURE__ */ __name(async (ctx) => {
  let body;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  const email = String(body.email ?? "").slice(0, 200);
  if (!email.includes("@")) {
    return Response.json({ error: "an email address is required" }, { status: 400 });
  }
  const record = {
    email,
    name: String(body.name ?? "").slice(0, 200),
    report_id: String(body.report_id ?? ""),
    tier: String(body.tier ?? ""),
    wants: String(body.wants ?? ""),
    at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (ctx.env.LEADS) {
    await ctx.env.LEADS.put(`lead:${record.at}:${crypto.randomUUID()}`, JSON.stringify(record));
    return Response.json({ ok: true, stored: true });
  }
  return Response.json({
    ok: true,
    stored: false,
    reason: "no datastore bound to this deployment yet",
    fallback: "email nicholas@csoai.org with your report_id"
  });
}, "onRequestPost");
var onRequestGet29 = /* @__PURE__ */ __name(async (ctx) => {
  if (!ctx.env.LEADS)
    return Response.json({ bound: false });
  const l = await ctx.env.LEADS.list({ limit: 10 });
  return Response.json({ bound: true, keys: l.keys.map((k) => k.name), count: l.keys.length });
}, "onRequestGet");

// api/locale.ts
var EU = /* @__PURE__ */ new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE"
]);
var EEA_EXTRA = /* @__PURE__ */ new Set(["NO", "IS", "LI"]);
var REGIMES = {
  eu: { id: "eu", name: "European Union", instrument: "EU AI Act (Reg. 2024/1689)", crosswalk: "/guides/eu-ai-act" },
  uk: { id: "uk", name: "United Kingdom", instrument: "UK pro-innovation framework + sectoral regulators", crosswalk: "/frameworks/uk-ai-bill" },
  us: { id: "us", name: "United States", instrument: "NIST AI RMF + state acts (CO, CA, TX)", crosswalk: "/us-ai-regulation" },
  cn: { id: "cn", name: "China", instrument: "TC260 framework + interim GenAI measures", crosswalk: "/compliance/tc260", language: "zh" },
  ca: { id: "ca", name: "Canada", instrument: "AIDA (Bill C-27 lineage)", crosswalk: "/canada-aida" },
  sg: { id: "sg", name: "Singapore", instrument: "Model AI Governance Framework", crosswalk: "/singapore-ai-governance" },
  br: { id: "br", name: "Brazil", instrument: "PL 2338/2023 lineage", crosswalk: "/regulator-atlas", language: "pt" },
  kr: { id: "kr", name: "South Korea", instrument: "AI Framework Act", crosswalk: "/regulator-atlas", language: "ko" },
  jp: { id: "jp", name: "Japan", instrument: "AI Guidelines for Business", crosswalk: "/regulator-atlas", language: "ja" },
  au: { id: "au", name: "Australia", instrument: "AI Ethics Principles + proposed mandatory guardrails", crosswalk: "/regulator-atlas" },
  global: { id: "global", name: "Global", instrument: "NIST AI RMF + ISO/IEC 42001 (jurisdiction-neutral)", crosswalk: "/regulator-atlas" }
};
function regimeFor(country) {
  if (EU.has(country) || EEA_EXTRA.has(country))
    return REGIMES.eu;
  const direct = {
    GB: REGIMES.uk,
    US: REGIMES.us,
    CN: REGIMES.cn,
    CA: REGIMES.ca,
    SG: REGIMES.sg,
    BR: REGIMES.br,
    KR: REGIMES.kr,
    JP: REGIMES.jp,
    AU: REGIMES.au
  };
  return direct[country] ?? REGIMES.global;
}
__name(regimeFor, "regimeFor");
var onRequestGet30 = /* @__PURE__ */ __name(async (context) => {
  const cf = context.request.cf ?? {};
  const url = new URL(context.request.url);
  const forced = url.searchParams.get("country")?.toUpperCase();
  const country = forced && /^[A-Z]{2}$/.test(forced) ? forced : typeof cf.country === "string" ? cf.country : "XX";
  const regime = regimeFor(country);
  const acceptLang = context.request.headers.get("accept-language") ?? "";
  const language = regime.language ?? (acceptLang.split(",")[0]?.split("-")[0]?.trim() || "en");
  return new Response(
    JSON.stringify(
      {
        schema: "csoai.locale/0.1",
        detected: {
          country,
          regime: regime.id,
          regime_name: regime.name,
          instrument: regime.instrument,
          crosswalk: regime.crosswalk,
          language
        },
        disclaimer: "IP geolocation is a UX default, not a legal determination. Systems deployed across jurisdictions are subject to every applicable regime. Confirm or override the detected jurisdiction before relying on any scoping here.",
        override_hint: "Pass ?country=DE (ISO 3166-1 alpha-2) to preview any jurisdiction."
      },
      null,
      2
    ),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        // per-visitor answer — never cache at the edge across users
        "cache-control": "private, no-store",
        "access-control-allow-origin": "*"
      }
    }
  );
}, "onRequestGet");

// ../evidence/mcp-registry.json
var mcp_registry_default = {
  schema: "csoai.mcp-registry/1",
  generated_by: "scripts/mcp-probe.mjs",
  probe_method: "JSON-RPC 2.0 over HTTPS POST: initialize -> tools/list, MCP protocolVersion 2024-11-05. A server counts as reachable only if initialize returned a JSON-RPC result.",
  probe_host: "NICHOLASs-MacBook-Air-2.local",
  targets_file: "scripts/mcp-targets.json",
  honesty_contract: [
    "last_probed is written ONLY by a probe that returned. If nothing answered it is null. No code path synthesises it.",
    "tools_count is derived from the length of the probed tools array. A catalogue's asserted tool count is never used as tools_count.",
    "status is one of reachable | unreachable | catalogued-not-probed. Catalogued and probed are never summed.",
    "Endpoints carrying alias_of resolve to a server already counted; they are excluded from reachable_distinct_servers.",
    "Unknown is null or 'unmeasured'. It is never a plausible-looking value."
  ],
  counts: {
    reachable_endpoints: 2,
    reachable_distinct_servers: 1,
    unreachable_endpoints: 1,
    catalogued_not_probed: 6,
    tools_probed: 4,
    tools_catalogued_not_probed: null,
    external_catalogues_not_probed: [
      {
        id: "gspc-os-vendored",
        count: 363,
        unit: "server directories",
        source: "CSOAI-ORG/gspc-os servers/ (private, pod-only)",
        probe_state: "UNVERIFIABLE from any machine that has not checked out gspc-os. Probe with scripts/mcp-stdio-probe.py on a host where the repo exists; commit its output before citing any number from it."
      }
    ],
    started: "2026-08-26T11:57:16.037Z",
    finished: "2026-08-26T11:57:16.969Z"
  },
  servers: [
    {
      id: "csoai-gspc-mcp",
      name: "csoai-gspc-mcp",
      endpoint: "https://councilof.ai/mcp",
      transport: "streamable-http",
      role: "primary",
      alias_of: null,
      status: "reachable",
      last_probed: "2026-08-26T11:57:16.627Z",
      http_status: 200,
      protocol_version: "2024-11-05",
      server_version: "1.0.0",
      tools_count: 4,
      tools: [
        {
          name: "measure",
          description: "Run a subject through GSPC measurement axes and return a signed measurement credential (NOT a certificate). Unmeasured axes stay UNMEASURED.",
          required_args: [
            "model"
          ]
        },
        {
          name: "verify",
          description: "Verify a signed card: recompute content_id, check Ed25519 signature + time-anchor. Free, anonymous, no trust.",
          required_args: [
            "card"
          ]
        },
        {
          name: "jail-probe",
          description: "Submit a jail-break attempt against a model. Returns the verdict contract; sandbox execution + signed card issuance happens on the measurement fleet (A100/3090). Consent-gated; never certifies.",
          required_args: [
            "model",
            "prompt"
          ]
        },
        {
          name: "enter-arena",
          description: "Self-enrolment for external agents. Present an A2A agent card URL + machine-readable consent:true; we run the honest live predicates now (card validity, signing state, endpoint liveness) and return an UNSIGNED intake receipt with contentId, queued for signed fleet measurement. No placement for sale, Firewall 2, UNMEASURED shown honestly.",
          required_args: [
            "agent_card_url",
            "consent"
          ]
        }
      ],
      error: null,
      declared_by: "/.well-known/mcp/server-card.json -> endpoints.mcp.primary",
      catalogue_source: null,
      catalogue_claim: null
    },
    {
      id: "csoai-gspc-mcp-fallback",
      name: null,
      endpoint: "https://csoai.org/mcp",
      transport: "streamable-http",
      role: "fallback",
      alias_of: "csoai-gspc-mcp",
      status: "unreachable",
      last_probed: null,
      http_status: 405,
      protocol_version: null,
      server_version: null,
      tools_count: null,
      tools: [],
      error: "HTTP 405",
      declared_by: "/.well-known/mcp/server-card.json -> endpoints.mcp.fallback",
      catalogue_source: null,
      catalogue_claim: null
    },
    {
      id: "csoai-gspc-mcp-worker",
      name: "csoai-gspc-mcp",
      endpoint: "https://csoai-gspc-mcp.nicholastempleman.workers.dev/mcp",
      transport: "streamable-http",
      role: "current",
      alias_of: "csoai-gspc-mcp",
      status: "reachable",
      last_probed: "2026-08-26T11:57:16.969Z",
      http_status: 200,
      protocol_version: "2024-11-05",
      server_version: "1.0.0",
      tools_count: 4,
      tools: [
        {
          name: "measure",
          description: "Run a subject through GSPC measurement axes and return a signed measurement credential (NOT a certificate). Unmeasured axes stay UNMEASURED.",
          required_args: [
            "model"
          ]
        },
        {
          name: "verify",
          description: "Verify a signed card: recompute content_id, check Ed25519 signature + time-anchor. Free, anonymous, no trust.",
          required_args: [
            "card"
          ]
        },
        {
          name: "jail-probe",
          description: "Submit a jail-break attempt against a model. Returns the verdict contract; sandbox execution + signed card issuance happens on the measurement fleet (A100/3090). Consent-gated; never certifies.",
          required_args: [
            "model",
            "prompt"
          ]
        },
        {
          name: "enter-arena",
          description: "Self-enrolment for external agents. Present an A2A agent card URL + machine-readable consent:true; we run the honest live predicates now (card validity, signing state, endpoint liveness) and return an UNSIGNED intake receipt with contentId, queued for signed fleet measurement. No placement for sale, Firewall 2, UNMEASURED shown honestly.",
          required_args: [
            "agent_card_url",
            "consent"
          ]
        }
      ],
      error: null,
      declared_by: "/.well-known/mcp/server-card.json -> endpoints.mcp.current",
      catalogue_source: null,
      catalogue_claim: null
    },
    {
      id: "csoai-assess",
      name: "CSOAI Assess",
      endpoint: null,
      transport: null,
      role: null,
      alias_of: null,
      status: "catalogued-not-probed",
      last_probed: null,
      http_status: null,
      protocol_version: null,
      server_version: null,
      tools_count: null,
      tools: [],
      error: null,
      declared_by: null,
      catalogue_source: "functions/api/mcp.ts hardcoded array (pre-2026-08-26)",
      catalogue_claim: {
        tools_count: 6,
        status: "LIVE",
        verified: false
      }
    },
    {
      id: "csoai-anchors",
      name: "CSOAI Anchors",
      endpoint: null,
      transport: null,
      role: null,
      alias_of: null,
      status: "catalogued-not-probed",
      last_probed: null,
      http_status: null,
      protocol_version: null,
      server_version: null,
      tools_count: null,
      tools: [],
      error: null,
      declared_by: null,
      catalogue_source: "functions/api/mcp.ts hardcoded array (pre-2026-08-26)",
      catalogue_claim: {
        tools_count: 3,
        status: "LIVE",
        verified: false
      }
    },
    {
      id: "csoai-ledger",
      name: "CSOAI Ledger",
      endpoint: null,
      transport: null,
      role: null,
      alias_of: null,
      status: "catalogued-not-probed",
      last_probed: null,
      http_status: null,
      protocol_version: null,
      server_version: null,
      tools_count: null,
      tools: [],
      error: null,
      declared_by: null,
      catalogue_source: "functions/api/mcp.ts hardcoded array (pre-2026-08-26)",
      catalogue_claim: {
        tools_count: 4,
        status: "LIVE",
        verified: false
      }
    },
    {
      id: "csoai-watchdog",
      name: "CSOAI Watchdog",
      endpoint: null,
      transport: null,
      role: null,
      alias_of: null,
      status: "catalogued-not-probed",
      last_probed: null,
      http_status: null,
      protocol_version: null,
      server_version: null,
      tools_count: null,
      tools: [],
      error: null,
      declared_by: null,
      catalogue_source: "functions/api/mcp.ts hardcoded array (pre-2026-08-26)",
      catalogue_claim: {
        tools_count: 5,
        status: "LIVE",
        verified: false
      }
    },
    {
      id: "csoai-spectrum",
      name: "CSOAI Spectrum",
      endpoint: null,
      transport: null,
      role: null,
      alias_of: null,
      status: "catalogued-not-probed",
      last_probed: null,
      http_status: null,
      protocol_version: null,
      server_version: null,
      tools_count: null,
      tools: [],
      error: null,
      declared_by: null,
      catalogue_source: "functions/api/mcp.ts hardcoded array (pre-2026-08-26)",
      catalogue_claim: {
        tools_count: 8,
        status: "LIVE",
        verified: false
      }
    },
    {
      id: "csoai-drift",
      name: "CSOAI Drift",
      endpoint: null,
      transport: null,
      role: null,
      alias_of: null,
      status: "catalogued-not-probed",
      last_probed: null,
      http_status: null,
      protocol_version: null,
      server_version: null,
      tools_count: null,
      tools: [],
      error: null,
      declared_by: null,
      catalogue_source: "functions/api/mcp.ts hardcoded array (pre-2026-08-26)",
      catalogue_claim: {
        tools_count: 4,
        status: "LIVE",
        verified: false
      }
    }
  ]
};

// api/mcp.ts
var onRequestGet31 = /* @__PURE__ */ __name(async () => {
  const servers = mcp_registry_default.servers || [];
  const counts = mcp_registry_default.counts || {};
  return new Response(
    JSON.stringify({
      schema: mcp_registry_default.schema,
      // How the numbers were obtained — stated, never implied.
      probe_method: mcp_registry_default.probe_method,
      probe_host: mcp_registry_default.probe_host,
      probe_started: counts.started ?? null,
      probe_finished: counts.finished ?? null,
      generated_by: mcp_registry_default.generated_by,
      honesty_contract: mcp_registry_default.honesty_contract,
      // Two numbers, always separate.
      reachable: counts.reachable_distinct_servers ?? null,
      reachable_endpoints: counts.reachable_endpoints ?? null,
      unreachable: counts.unreachable_endpoints ?? null,
      catalogued_not_probed: counts.catalogued_not_probed ?? null,
      tools_probed: counts.tools_probed ?? null,
      tools_catalogued_not_probed: counts.tools_catalogued_not_probed ?? null,
      external_catalogues_not_probed: counts.external_catalogues_not_probed ?? [],
      servers,
      note: "reachable = a server that answered MCP initialize from probe_host at probe_started. catalogued-not-probed = an id with no published endpoint; it has never been contacted and its tools_count is null, not the number its catalogue asserted. The two are never added together. Source of truth: evidence/mcp-registry.json (committed). Re-run scripts/mcp-probe.mjs to refresh."
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=300"
      }
    }
  );
}, "onRequestGet");

// api/methodology.ts
var onRequestGet32 = /* @__PURE__ */ __name(async () => {
  const methodology = {
    schema: "csoai.methodology/0.1",
    doctrine: "measurement-not-certification \xB7 nobody-ranked-pays \xB7 corrections appended not edited",
    instruments: {
      gspc: {
        what: "14-slot GSPC board (quotable); cite live totals.public_count from GET /api/gspc \u2014 do not invent 22 axes",
        grading: "exact-label classification (expected=HIGH_RISK/0/1) OR keyword matching (must_inc); no model judges another model",
        quotability: "nothing quoted below n>=30 usable items; quotable computed, never asserted",
        canaries: "banned-term canaries excluded from scoring",
        transport_failures: "counted as OURS (not usable evidence about the model)"
      },
      boards: {
        what: "signed per-axis measurement boards (Ed25519 over canonical body)",
        verify: "recompute canonical -> sha256=content_id -> Ed25519(content_id) against did:web:csoai.org key",
        signing: "key never travels; public key published in did.json"
      },
      arena: {
        what: "live ELO rounds (KV-backed, honest-503 discipline)",
        register: "REPORTED unless signed; never fused with MEASURED cells"
      }
    },
    honesty_rules: [
      "measurement, not certification \u2014 never a 'safe'/'compliant' verdict",
      "public_count is derived from GET /api/gspc totals (measured_axes of quotable_axes); jail MEASURED with living-board separation TIE (2026-08-25) \u2014 a TIE is not a separated leader",
      "corrections appended, never edited",
      "no ranked party pays (nobody-ranked-pays)",
      "unmeasured axes stay UNMEASURED \u2014 never fabricated into a score"
    ],
    claims_refused: [
      "certification of any model",
      "vendor ranking paid by the ranked",
      "blockchain/on-chain attestation (we use Ed25519 + did:web \u2014 a plain auditable signature)",
      "fabricated capacity figures"
    ],
    generated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  return Response.json(methodology, {
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}, "onRequestGet");

// ../../../../node_modules/workers-og/dist/index.js
import ly from "./ef4866ecae192fd87727067cf2c0c0cf9fb8b020-yoga-ZMNYPE6Z.wasm";
import fy from "./8b09a8aa3d916dc11b1a9d60545210c131c1ae36-resvg-LFIOYO65.wasm";
var Xl = Object.create;
var Qa = Object.defineProperty;
var ql = Object.getOwnPropertyDescriptor;
var Yl = Object.getOwnPropertyNames;
var Zl = Object.getPrototypeOf;
var Jl = Object.prototype.hasOwnProperty;
var et = /* @__PURE__ */ __name((e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), "et");
var Kl = /* @__PURE__ */ __name((e, t, r, n) => {
  if (t && typeof t == "object" || typeof t == "function")
    for (let i of Yl(t))
      !Jl.call(e, i) && i !== r && Qa(e, i, { get: () => t[i], enumerable: !(n = ql(t, i)) || n.enumerable });
  return e;
}, "Kl");
var St = /* @__PURE__ */ __name((e, t, r) => (r = e != null ? Xl(Zl(e)) : {}, Kl(t || !e || !e.__esModule ? Qa(r, "default", { value: e, enumerable: true }) : r, e)), "St");
var fo = et((dy, lo) => {
  var di = 0, no = -3;
  function Ir() {
    this.table = new Uint16Array(16), this.trans = new Uint16Array(288);
  }
  __name(Ir, "Ir");
  function Ql(e, t) {
    this.source = e, this.sourceIndex = 0, this.tag = 0, this.bitcount = 0, this.dest = t, this.destLen = 0, this.ltree = new Ir(), this.dtree = new Ir();
  }
  __name(Ql, "Ql");
  var io = new Ir(), ao = new Ir(), vi = new Uint8Array(30), gi = new Uint16Array(30), oo = new Uint8Array(30), so = new Uint16Array(30), ef = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), eo = new Ir(), Mt = new Uint8Array(320);
  function uo(e, t, r, n) {
    var i, a;
    for (i = 0; i < r; ++i)
      e[i] = 0;
    for (i = 0; i < 30 - r; ++i)
      e[i + r] = i / r | 0;
    for (a = n, i = 0; i < 30; ++i)
      t[i] = a, a += 1 << e[i];
  }
  __name(uo, "uo");
  function tf(e, t) {
    var r;
    for (r = 0; r < 7; ++r)
      e.table[r] = 0;
    for (e.table[7] = 24, e.table[8] = 152, e.table[9] = 112, r = 0; r < 24; ++r)
      e.trans[r] = 256 + r;
    for (r = 0; r < 144; ++r)
      e.trans[24 + r] = r;
    for (r = 0; r < 8; ++r)
      e.trans[168 + r] = 280 + r;
    for (r = 0; r < 112; ++r)
      e.trans[176 + r] = 144 + r;
    for (r = 0; r < 5; ++r)
      t.table[r] = 0;
    for (t.table[5] = 32, r = 0; r < 32; ++r)
      t.trans[r] = r;
  }
  __name(tf, "tf");
  var to = new Uint16Array(16);
  function pi(e, t, r, n) {
    var i, a;
    for (i = 0; i < 16; ++i)
      e.table[i] = 0;
    for (i = 0; i < n; ++i)
      e.table[t[r + i]]++;
    for (e.table[0] = 0, a = 0, i = 0; i < 16; ++i)
      to[i] = a, a += e.table[i];
    for (i = 0; i < n; ++i)
      t[r + i] && (e.trans[to[t[r + i]]++] = i);
  }
  __name(pi, "pi");
  function rf(e) {
    e.bitcount-- || (e.tag = e.source[e.sourceIndex++], e.bitcount = 7);
    var t = e.tag & 1;
    return e.tag >>>= 1, t;
  }
  __name(rf, "rf");
  function Gt(e, t, r) {
    if (!t)
      return r;
    for (; e.bitcount < 24; )
      e.tag |= e.source[e.sourceIndex++] << e.bitcount, e.bitcount += 8;
    var n = e.tag & 65535 >>> 16 - t;
    return e.tag >>>= t, e.bitcount -= t, n + r;
  }
  __name(Gt, "Gt");
  function hi(e, t) {
    for (; e.bitcount < 24; )
      e.tag |= e.source[e.sourceIndex++] << e.bitcount, e.bitcount += 8;
    var r = 0, n = 0, i = 0, a = e.tag;
    do
      n = 2 * n + (a & 1), a >>>= 1, ++i, r += t.table[i], n -= t.table[i];
    while (n >= 0);
    return e.tag = a, e.bitcount -= i, t.trans[r + n];
  }
  __name(hi, "hi");
  function nf(e, t, r) {
    var n, i, a, o, u, s;
    for (n = Gt(e, 5, 257), i = Gt(e, 5, 1), a = Gt(e, 4, 4), o = 0; o < 19; ++o)
      Mt[o] = 0;
    for (o = 0; o < a; ++o) {
      var l = Gt(e, 3, 0);
      Mt[ef[o]] = l;
    }
    for (pi(eo, Mt, 0, 19), u = 0; u < n + i; ) {
      var f = hi(e, eo);
      switch (f) {
        case 16:
          var c = Mt[u - 1];
          for (s = Gt(e, 2, 3); s; --s)
            Mt[u++] = c;
          break;
        case 17:
          for (s = Gt(e, 3, 3); s; --s)
            Mt[u++] = 0;
          break;
        case 18:
          for (s = Gt(e, 7, 11); s; --s)
            Mt[u++] = 0;
          break;
        default:
          Mt[u++] = f;
          break;
      }
    }
    pi(t, Mt, 0, n), pi(r, Mt, n, i);
  }
  __name(nf, "nf");
  function ro(e, t, r) {
    for (; ; ) {
      var n = hi(e, t);
      if (n === 256)
        return di;
      if (n < 256)
        e.dest[e.destLen++] = n;
      else {
        var i, a, o, u;
        for (n -= 257, i = Gt(e, vi[n], gi[n]), a = hi(e, r), o = e.destLen - Gt(e, oo[a], so[a]), u = o; u < o + i; ++u)
          e.dest[e.destLen++] = e.dest[u];
      }
    }
  }
  __name(ro, "ro");
  function af(e) {
    for (var t, r, n; e.bitcount > 8; )
      e.sourceIndex--, e.bitcount -= 8;
    if (t = e.source[e.sourceIndex + 1], t = 256 * t + e.source[e.sourceIndex], r = e.source[e.sourceIndex + 3], r = 256 * r + e.source[e.sourceIndex + 2], t !== (~r & 65535))
      return no;
    for (e.sourceIndex += 4, n = t; n; --n)
      e.dest[e.destLen++] = e.source[e.sourceIndex++];
    return e.bitcount = 0, di;
  }
  __name(af, "af");
  function of(e, t) {
    var r = new Ql(e, t), n, i, a;
    do {
      switch (n = rf(r), i = Gt(r, 2, 0), i) {
        case 0:
          a = af(r);
          break;
        case 1:
          a = ro(r, io, ao);
          break;
        case 2:
          nf(r, r.ltree, r.dtree), a = ro(r, r.ltree, r.dtree);
          break;
        default:
          a = no;
      }
      if (a !== di)
        throw new Error("Data error");
    } while (!n);
    return r.destLen < r.dest.length ? typeof r.dest.slice == "function" ? r.dest.slice(0, r.destLen) : r.dest.subarray(0, r.destLen) : r.dest;
  }
  __name(of, "of");
  tf(io, ao);
  uo(vi, gi, 4, 3);
  uo(oo, so, 2, 1);
  vi[28] = 0;
  gi[28] = 258;
  lo.exports = of;
});
var ho = et((vy, po) => {
  var sf = new Uint8Array(new Uint32Array([305419896]).buffer)[0] === 18, co = /* @__PURE__ */ __name((e, t, r) => {
    let n = e[t];
    e[t] = e[r], e[r] = n;
  }, "co"), uf = /* @__PURE__ */ __name((e) => {
    let t = e.length;
    for (let r = 0; r < t; r += 4)
      co(e, r, r + 3), co(e, r + 1, r + 2);
  }, "uf"), lf = /* @__PURE__ */ __name((e) => {
    sf && uf(e);
  }, "lf");
  po.exports = { swap32LE: lf };
});
var Do = et((gy, mo) => {
  var vo = fo(), { swap32LE: ff } = ho(), yi = 11, vr = 5, cf = yi - vr, pf = 65536 >> yi, hf = 1 << cf, df = hf - 1, dn = 2, vf = 1 << vr, mi = vf - 1, go = 65536 >> vr, gf = 1024 >> vr, mf = go + gf, Df = mf, yf = 32, bf = Df + yf, xf = 1 << dn, Di = /* @__PURE__ */ __name(class {
    constructor(t) {
      let r = typeof t.readUInt32BE == "function" && typeof t.slice == "function";
      if (r || t instanceof Uint8Array) {
        let n;
        if (r)
          this.highStart = t.readUInt32LE(0), this.errorValue = t.readUInt32LE(4), n = t.readUInt32LE(8), t = t.slice(12);
        else {
          let i = new DataView(t.buffer);
          this.highStart = i.getUint32(0, true), this.errorValue = i.getUint32(4, true), n = i.getUint32(8, true), t = t.subarray(12);
        }
        t = vo(t, new Uint8Array(n)), t = vo(t, new Uint8Array(n)), ff(t), this.data = new Uint32Array(t.buffer);
      } else
        ({ data: this.data, highStart: this.highStart, errorValue: this.errorValue } = t);
    }
    get(t) {
      let r;
      return t < 0 || t > 1114111 ? this.errorValue : t < 55296 || t > 56319 && t <= 65535 ? (r = (this.data[t >> vr] << dn) + (t & mi), this.data[r]) : t <= 65535 ? (r = (this.data[go + (t - 55296 >> vr)] << dn) + (t & mi), this.data[r]) : t < this.highStart ? (r = this.data[bf - pf + (t >> yi)], r = this.data[r + (t >> vr & df)], r = (r << dn) + (t & mi), this.data[r]) : this.data[this.data.length - xf];
    }
  }, "Di");
  mo.exports = Di;
});
var yo = et((vn) => {
  var wf = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  (function(e) {
    "use strict";
    var t = typeof Uint8Array < "u" ? Uint8Array : Array, r = 43, n = 47, i = 48, a = 97, o = 65, u = 45, s = 95;
    function l(p) {
      var d = p.charCodeAt(0);
      if (d === r || d === u)
        return 62;
      if (d === n || d === s)
        return 63;
      if (d < i)
        return -1;
      if (d < i + 10)
        return d - i + 26 + 26;
      if (d < o + 26)
        return d - o;
      if (d < a + 26)
        return d - a + 26;
    }
    __name(l, "l");
    function f(p) {
      var d, D, v, g, y, b;
      if (p.length % 4 > 0)
        throw new Error("Invalid string. Length must be a multiple of 4");
      var C = p.length;
      y = p.charAt(C - 2) === "=" ? 2 : p.charAt(C - 1) === "=" ? 1 : 0, b = new t(p.length * 3 / 4 - y), v = y > 0 ? p.length - 4 : p.length;
      var k = 0;
      function S(E) {
        b[k++] = E;
      }
      __name(S, "S");
      for (d = 0, D = 0; d < v; d += 4, D += 3)
        g = l(p.charAt(d)) << 18 | l(p.charAt(d + 1)) << 12 | l(p.charAt(d + 2)) << 6 | l(p.charAt(d + 3)), S((g & 16711680) >> 16), S((g & 65280) >> 8), S(g & 255);
      return y === 2 ? (g = l(p.charAt(d)) << 2 | l(p.charAt(d + 1)) >> 4, S(g & 255)) : y === 1 && (g = l(p.charAt(d)) << 10 | l(p.charAt(d + 1)) << 4 | l(p.charAt(d + 2)) >> 2, S(g >> 8 & 255), S(g & 255)), b;
    }
    __name(f, "f");
    function c(p) {
      var d, D = p.length % 3, v = "", g, y;
      function b(k) {
        return wf.charAt(k);
      }
      __name(b, "b");
      function C(k) {
        return b(k >> 18 & 63) + b(k >> 12 & 63) + b(k >> 6 & 63) + b(k & 63);
      }
      __name(C, "C");
      for (d = 0, y = p.length - D; d < y; d += 3)
        g = (p[d] << 16) + (p[d + 1] << 8) + p[d + 2], v += C(g);
      switch (D) {
        case 1:
          g = p[p.length - 1], v += b(g >> 2), v += b(g << 4 & 63), v += "==";
          break;
        case 2:
          g = (p[p.length - 2] << 8) + p[p.length - 1], v += b(g >> 10), v += b(g >> 4 & 63), v += b(g << 2 & 63), v += "=";
          break;
      }
      return v;
    }
    __name(c, "c");
    e.toByteArray = f, e.fromByteArray = c;
  })(typeof vn > "u" ? vn.base64js = {} : vn);
});
var Ao = et((yy, _o) => {
  var Fi = 40, Ci = 41, mn = 39, Si = 34, ki = 92, Cr = 47, Ti = 44, _i = 58, Dn = 42, Uf = 117, Bf = 85, Nf = 43, Mf = /^[a-f0-9?-]+$/i;
  _o.exports = function(e) {
    for (var t = [], r = e, n, i, a, o, u, s, l, f, c = 0, p = r.charCodeAt(c), d = r.length, D = [{ nodes: t }], v = 0, g, y = "", b = "", C = ""; c < d; )
      if (p <= 32) {
        n = c;
        do
          n += 1, p = r.charCodeAt(n);
        while (p <= 32);
        o = r.slice(c, n), a = t[t.length - 1], p === Ci && v ? C = o : a && a.type === "div" ? (a.after = o, a.sourceEndIndex += o.length) : p === Ti || p === _i || p === Cr && r.charCodeAt(n + 1) !== Dn && (!g || g && g.type === "function" && g.value !== "calc") ? b = o : t.push({ type: "space", sourceIndex: c, sourceEndIndex: n, value: o }), c = n;
      } else if (p === mn || p === Si) {
        n = c, i = p === mn ? "'" : '"', o = { type: "string", sourceIndex: c, quote: i };
        do
          if (u = false, n = r.indexOf(i, n + 1), ~n)
            for (s = n; r.charCodeAt(s - 1) === ki; )
              s -= 1, u = !u;
          else
            r += i, n = r.length - 1, o.unclosed = true;
        while (u);
        o.value = r.slice(c + 1, n), o.sourceEndIndex = o.unclosed ? n : n + 1, t.push(o), c = n + 1, p = r.charCodeAt(c);
      } else if (p === Cr && r.charCodeAt(c + 1) === Dn)
        n = r.indexOf("*/", c), o = { type: "comment", sourceIndex: c, sourceEndIndex: n + 2 }, n === -1 && (o.unclosed = true, n = r.length, o.sourceEndIndex = n), o.value = r.slice(c + 2, n), t.push(o), c = n + 2, p = r.charCodeAt(c);
      else if ((p === Cr || p === Dn) && g && g.type === "function" && g.value === "calc")
        o = r[c], t.push({ type: "word", sourceIndex: c - b.length, sourceEndIndex: c + o.length, value: o }), c += 1, p = r.charCodeAt(c);
      else if (p === Cr || p === Ti || p === _i)
        o = r[c], t.push({ type: "div", sourceIndex: c - b.length, sourceEndIndex: c + o.length, value: o, before: b, after: "" }), b = "", c += 1, p = r.charCodeAt(c);
      else if (Fi === p) {
        n = c;
        do
          n += 1, p = r.charCodeAt(n);
        while (p <= 32);
        if (f = c, o = { type: "function", sourceIndex: c - y.length, value: y, before: r.slice(f + 1, n) }, c = n, y === "url" && p !== mn && p !== Si) {
          n -= 1;
          do
            if (u = false, n = r.indexOf(")", n + 1), ~n)
              for (s = n; r.charCodeAt(s - 1) === ki; )
                s -= 1, u = !u;
            else
              r += ")", n = r.length - 1, o.unclosed = true;
          while (u);
          l = n;
          do
            l -= 1, p = r.charCodeAt(l);
          while (p <= 32);
          f < l ? (c !== l + 1 ? o.nodes = [{ type: "word", sourceIndex: c, sourceEndIndex: l + 1, value: r.slice(c, l + 1) }] : o.nodes = [], o.unclosed && l + 1 !== n ? (o.after = "", o.nodes.push({ type: "space", sourceIndex: l + 1, sourceEndIndex: n, value: r.slice(l + 1, n) })) : (o.after = r.slice(l + 1, n), o.sourceEndIndex = n)) : (o.after = "", o.nodes = []), c = n + 1, o.sourceEndIndex = o.unclosed ? n : c, p = r.charCodeAt(c), t.push(o);
        } else
          v += 1, o.after = "", o.sourceEndIndex = c + 1, t.push(o), D.push(o), t = o.nodes = [], g = o;
        y = "";
      } else if (Ci === p && v)
        c += 1, p = r.charCodeAt(c), g.after = C, g.sourceEndIndex += C.length, C = "", v -= 1, D[D.length - 1].sourceEndIndex = c, D.pop(), g = D[v], t = g.nodes;
      else {
        n = c;
        do
          p === ki && (n += 1), n += 1, p = r.charCodeAt(n);
        while (n < d && !(p <= 32 || p === mn || p === Si || p === Ti || p === _i || p === Cr || p === Fi || p === Dn && g && g.type === "function" && g.value === "calc" || p === Cr && g.type === "function" && g.value === "calc" || p === Ci && v));
        o = r.slice(c, n), Fi === p ? y = o : (Uf === o.charCodeAt(0) || Bf === o.charCodeAt(0)) && Nf === o.charCodeAt(1) && Mf.test(o.slice(2)) ? t.push({ type: "unicode-range", sourceIndex: c, sourceEndIndex: n, value: o }) : t.push({ type: "word", sourceIndex: c, sourceEndIndex: n, value: o }), c = n;
      }
    for (c = D.length - 1; c; c -= 1)
      D[c].unclosed = true, D[c].sourceEndIndex = r.length;
    return D[0].nodes;
  };
});
var Lo = et((by, Oo) => {
  Oo.exports = /* @__PURE__ */ __name(function e(t, r, n) {
    var i, a, o, u;
    for (i = 0, a = t.length; i < a; i += 1)
      o = t[i], n || (u = r(o, i, t)), u !== false && o.type === "function" && Array.isArray(o.nodes) && e(o.nodes, r, n), n && r(o, i, t);
  }, "e");
});
var Uo = et((xy, Ro) => {
  function Io(e, t) {
    var r = e.type, n = e.value, i, a;
    return t && (a = t(e)) !== void 0 ? a : r === "word" || r === "space" ? n : r === "string" ? (i = e.quote || "", i + n + (e.unclosed ? "" : i)) : r === "comment" ? "/*" + n + (e.unclosed ? "" : "*/") : r === "div" ? (e.before || "") + n + (e.after || "") : Array.isArray(e.nodes) ? (i = Po(e.nodes, t), r !== "function" ? i : n + "(" + (e.before || "") + i + (e.after || "") + (e.unclosed ? "" : ")")) : n;
  }
  __name(Io, "Io");
  function Po(e, t) {
    var r, n;
    if (Array.isArray(e)) {
      for (r = "", n = e.length - 1; ~n; n -= 1)
        r = Io(e[n], t) + r;
      return r;
    }
    return Io(e, t);
  }
  __name(Po, "Po");
  Ro.exports = Po;
});
var No = et((wy, Bo) => {
  var yn = 45, bn = 43, Ai = 46, Gf = 101, Wf = 69;
  function $f(e) {
    var t = e.charCodeAt(0), r;
    if (t === bn || t === yn) {
      if (r = e.charCodeAt(1), r >= 48 && r <= 57)
        return true;
      var n = e.charCodeAt(2);
      return r === Ai && n >= 48 && n <= 57;
    }
    return t === Ai ? (r = e.charCodeAt(1), r >= 48 && r <= 57) : t >= 48 && t <= 57;
  }
  __name($f, "$f");
  Bo.exports = function(e) {
    var t = 0, r = e.length, n, i, a;
    if (r === 0 || !$f(e))
      return false;
    for (n = e.charCodeAt(t), (n === bn || n === yn) && t++; t < r && (n = e.charCodeAt(t), !(n < 48 || n > 57)); )
      t += 1;
    if (n = e.charCodeAt(t), i = e.charCodeAt(t + 1), n === Ai && i >= 48 && i <= 57)
      for (t += 2; t < r && (n = e.charCodeAt(t), !(n < 48 || n > 57)); )
        t += 1;
    if (n = e.charCodeAt(t), i = e.charCodeAt(t + 1), a = e.charCodeAt(t + 2), (n === Gf || n === Wf) && (i >= 48 && i <= 57 || (i === bn || i === yn) && a >= 48 && a <= 57))
      for (t += i === bn || i === yn ? 3 : 2; t < r && (n = e.charCodeAt(t), !(n < 48 || n > 57)); )
        t += 1;
    return { number: e.slice(0, t), unit: e.slice(t) };
  };
});
var Oi = et((Ey, Wo) => {
  var jf = Ao(), Mo = Lo(), Go = Uo();
  function nr(e) {
    return this instanceof nr ? (this.nodes = jf(e), this) : new nr(e);
  }
  __name(nr, "nr");
  nr.prototype.toString = function() {
    return Array.isArray(this.nodes) ? Go(this.nodes) : "";
  };
  nr.prototype.walk = function(e, t) {
    return Mo(this.nodes, e, t), this;
  };
  nr.unit = No();
  nr.walk = Mo;
  nr.stringify = Go;
  Wo.exports = nr;
});
var zo = et((Fy, jo) => {
  "use strict";
  jo.exports = function(e) {
    return typeof e == "string" ? $o(e) : Li(e);
  };
  function Li(e) {
    return !e || typeof e != "object" || Vf(e) || Hf(e) ? e : zf(e) ? Yf(e, Li) : Zf(qf(e), function(t, r) {
      var n = $o(r);
      return t[n] = Li(e[r]), t;
    }, {});
  }
  __name(Li, "Li");
  function $o(e) {
    return e.replace(/[_.-](\w|$)/g, function(t, r) {
      return r.toUpperCase();
    });
  }
  __name($o, "$o");
  var zf = Array.isArray || function(e) {
    return Object.prototype.toString.call(e) === "[object Array]";
  }, Vf = /* @__PURE__ */ __name(function(e) {
    return Object.prototype.toString.call(e) === "[object Date]";
  }, "Vf"), Hf = /* @__PURE__ */ __name(function(e) {
    return Object.prototype.toString.call(e) === "[object RegExp]";
  }, "Hf"), Xf = Object.prototype.hasOwnProperty, qf = Object.keys || function(e) {
    var t = [];
    for (var r in e)
      Xf.call(e, r) && t.push(r);
    return t;
  };
  function Yf(e, t) {
    if (e.map)
      return e.map(t);
    for (var r = [], n = 0; n < e.length; n++)
      r.push(t(e[n], n));
    return r;
  }
  __name(Yf, "Yf");
  function Zf(e, t, r) {
    if (e.reduce)
      return e.reduce(t, r);
    for (var n = 0; n < e.length; n++)
      r = t(r, e[n], n);
    return r;
  }
  __name(Zf, "Zf");
});
var Vo = et((Cy, Jf) => {
  Jf.exports = { black: "#000000", silver: "#c0c0c0", gray: "#808080", white: "#ffffff", maroon: "#800000", red: "#ff0000", purple: "#800080", fuchsia: "#ff00ff", green: "#008000", lime: "#00ff00", olive: "#808000", yellow: "#ffff00", navy: "#000080", blue: "#0000ff", teal: "#008080", aqua: "#00ffff", orange: "#ffa500", aliceblue: "#f0f8ff", antiquewhite: "#faebd7", aquamarine: "#7fffd4", azure: "#f0ffff", beige: "#f5f5dc", bisque: "#ffe4c4", blanchedalmond: "#ffebcd", blueviolet: "#8a2be2", brown: "#a52a2a", burlywood: "#deb887", cadetblue: "#5f9ea0", chartreuse: "#7fff00", chocolate: "#d2691e", coral: "#ff7f50", cornflowerblue: "#6495ed", cornsilk: "#fff8dc", crimson: "#dc143c", darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkgray: "#a9a9a9", darkgreen: "#006400", darkgrey: "#a9a9a9", darkkhaki: "#bdb76b", darkmagenta: "#8b008b", darkolivegreen: "#556b2f", darkorange: "#ff8c00", darkorchid: "#9932cc", darkred: "#8b0000", darksalmon: "#e9967a", darkseagreen: "#8fbc8f", darkslateblue: "#483d8b", darkslategray: "#2f4f4f", darkslategrey: "#2f4f4f", darkturquoise: "#00ced1", darkviolet: "#9400d3", deeppink: "#ff1493", deepskyblue: "#00bfff", dimgray: "#696969", dimgrey: "#696969", dodgerblue: "#1e90ff", firebrick: "#b22222", floralwhite: "#fffaf0", forestgreen: "#228b22", gainsboro: "#dcdcdc", ghostwhite: "#f8f8ff", gold: "#ffd700", goldenrod: "#daa520", greenyellow: "#adff2f", grey: "#808080", honeydew: "#f0fff0", hotpink: "#ff69b4", indianred: "#cd5c5c", indigo: "#4b0082", ivory: "#fffff0", khaki: "#f0e68c", lavender: "#e6e6fa", lavenderblush: "#fff0f5", lawngreen: "#7cfc00", lemonchiffon: "#fffacd", lightblue: "#add8e6", lightcoral: "#f08080", lightcyan: "#e0ffff", lightgoldenrodyellow: "#fafad2", lightgray: "#d3d3d3", lightgreen: "#90ee90", lightgrey: "#d3d3d3", lightpink: "#ffb6c1", lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", lightskyblue: "#87cefa", lightslategray: "#778899", lightslategrey: "#778899", lightsteelblue: "#b0c4de", lightyellow: "#ffffe0", limegreen: "#32cd32", linen: "#faf0e6", mediumaquamarine: "#66cdaa", mediumblue: "#0000cd", mediumorchid: "#ba55d3", mediumpurple: "#9370db", mediumseagreen: "#3cb371", mediumslateblue: "#7b68ee", mediumspringgreen: "#00fa9a", mediumturquoise: "#48d1cc", mediumvioletred: "#c71585", midnightblue: "#191970", mintcream: "#f5fffa", mistyrose: "#ffe4e1", moccasin: "#ffe4b5", navajowhite: "#ffdead", oldlace: "#fdf5e6", olivedrab: "#6b8e23", orangered: "#ff4500", orchid: "#da70d6", palegoldenrod: "#eee8aa", palegreen: "#98fb98", paleturquoise: "#afeeee", palevioletred: "#db7093", papayawhip: "#ffefd5", peachpuff: "#ffdab9", peru: "#cd853f", pink: "#ffc0cb", plum: "#dda0dd", powderblue: "#b0e0e6", rosybrown: "#bc8f8f", royalblue: "#4169e1", saddlebrown: "#8b4513", salmon: "#fa8072", sandybrown: "#f4a460", seagreen: "#2e8b57", seashell: "#fff5ee", sienna: "#a0522d", skyblue: "#87ceeb", slateblue: "#6a5acd", slategray: "#708090", slategrey: "#708090", snow: "#fffafa", springgreen: "#00ff7f", steelblue: "#4682b4", tan: "#d2b48c", thistle: "#d8bfd8", tomato: "#ff6347", turquoise: "#40e0d0", violet: "#ee82ee", wheat: "#f5deb3", whitesmoke: "#f5f5f5", yellowgreen: "#9acd32", rebeccapurple: "#663399" };
});
var Xo = et((Sy, Ho) => {
  "use strict";
  Ho.exports = Vo();
});
var wn = et((Tr) => {
  "use strict";
  Object.defineProperty(Tr, "__esModule", { value: true });
  function Bi(e) {
    return e && typeof e == "object" && "default" in e ? e.default : e;
  }
  __name(Bi, "Bi");
  var Zo = Oi(), Kf = Bi(Zo), Qf = Bi(zo()), ec = Bi(Xo()), tc = /* @__PURE__ */ __name(function(t) {
    return t.type !== "string" ? null : t.value.replace(/\\([0-9a-f]{1,6})(?:\s|$)/gi, function(r, n) {
      return String.fromCharCode(parseInt(n, 16));
    }).replace(/\\/g, "");
  }, "tc"), rc = /^(#(?:[0-9a-f]{3,4}){1,2})$/i, nc = /^(rgba?|hsla?|hwb|lab|lch|gray|color)$/, ic = /* @__PURE__ */ __name(function(t) {
    return t.type === "word" && (rc.test(t.value) || t.value in ec || t.value === "transparent") ? t.value : t.type === "function" && nc.test(t.value) ? Zo.stringify(t) : null;
  }, "ic"), ac = /^(none)$/i, oc = /^(auto)$/i, sc = /(^-?[_a-z][_a-z0-9-]*$)/i, uc = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?)$/i, lc = /^(0$|(?:[+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?)(?=px$))/i, fc = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?(ch|em|ex|rem|vh|vw|vmin|vmax|cm|mm|in|pc|pt))$/i, cc = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?(?:deg|rad))$/i, pc = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?%)$/i, Ni = /* @__PURE__ */ __name(function(t) {
    return function(r) {
      return t(r) ? "<token>" : null;
    };
  }, "Ni"), hc = /* @__PURE__ */ __name(function(t) {
    return function(r) {
      return r.type === t ? r.value : null;
    };
  }, "hc"), Ve = /* @__PURE__ */ __name(function(t, r) {
    return r === void 0 && (r = String), function(n) {
      if (n.type !== "word")
        return null;
      var i = n.value.match(t);
      if (i === null)
        return null;
      var a = r(i[1]);
      return a;
    };
  }, "Ve"), Ze = Ni(function(e) {
    return e.type === "space";
  }), Jo = Ni(function(e) {
    return e.type === "div" && e.value === "/";
  }), dc = Ni(function(e) {
    return e.type === "div" && e.value === ",";
  }), vc = hc("word"), Mi = Ve(ac), Ri = Ve(oc), kr = Ve(uc, Number), vt = Ve(lc, Number), Xt = Ve(fc), Ko = Ve(cc, function(e) {
    return e.toLowerCase();
  }), Gi = Ve(pc), xn = Ve(sc), gc = tc, Ur = ic, Ui = Ve(/^(none|underline|line-through)$/i), mc = /* @__PURE__ */ __name(function(t) {
    var r = t.expect(kr);
    return t.hasTokens() && (t.expect(Jo), r /= t.expect(kr)), { aspectRatio: r };
  }, "mc"), Dc = Ve(/^(solid|dashed|dotted)$/), yc = 1, bc = "black", xc = "solid", wc = /* @__PURE__ */ __name(function(t) {
    var r, n, i;
    if (t.matches(Mi))
      return t.expectEmpty(), { borderWidth: 0, borderColor: "black", borderStyle: "solid" };
    for (var a = 0; a < 3 && t.hasTokens(); )
      a !== 0 && t.expect(Ze), r === void 0 && t.matches(vt, Xt) ? r = t.lastValue : n === void 0 && t.matches(Ur) ? n = t.lastValue : i === void 0 && t.matches(Dc) ? i = t.lastValue : t.throw(), a += 1;
    return t.expectEmpty(), r === void 0 && (r = yc), n === void 0 && (n = bc), i === void 0 && (i = xc), { borderWidth: r, borderColor: n, borderStyle: i };
  }, "wc"), Br = /* @__PURE__ */ __name(function(t) {
    var r = t.types, n = r === void 0 ? [vt, Xt, Gi] : r, i = t.directions, a = i === void 0 ? ["Top", "Right", "Bottom", "Left"] : i, o = t.prefix, u = o === void 0 ? "" : o, s = t.suffix, l = s === void 0 ? "" : s;
    return function(f) {
      var c, p = [];
      for (p.push(f.expect.apply(f, n)); p.length < 4 && f.hasTokens(); )
        f.expect(Ze), p.push(f.expect.apply(f, n));
      f.expectEmpty();
      var d = p[0], D = p[1], v = D === void 0 ? d : D, g = p[2], y = g === void 0 ? d : g, b = p[3], C = b === void 0 ? v : b, k = /* @__PURE__ */ __name(function(E) {
        return "" + u + a[E] + l;
      }, "k");
      return c = {}, c[k(0)] = d, c[k(1)] = v, c[k(2)] = y, c[k(3)] = C, c;
    };
  }, "Br"), Qo = /* @__PURE__ */ __name(function(t) {
    var r = t.expect(vt), n = t.matches(Ze) ? t.expect(vt) : r;
    return t.expectEmpty(), { width: r, height: n };
  }, "Qo"), es = /* @__PURE__ */ __name(function(t) {
    var r, n, i, a;
    if (t.matches(Mi))
      return t.expectEmpty(), { offset: { width: 0, height: 0 }, radius: 0, color: "black" };
    for (var o = false; t.hasTokens(); )
      o && t.expect(Ze), r === void 0 && t.matches(vt, Xt) ? (r = t.lastValue, t.expect(Ze), n = t.expect(vt, Xt), t.saveRewindPoint(), t.matches(Ze) && t.matches(vt, Xt) ? i = t.lastValue : t.rewind()) : a === void 0 && t.matches(Ur) ? a = t.lastValue : t.throw(), o = true;
    return r === void 0 && t.throw(), { offset: { width: r, height: n }, radius: i !== void 0 ? i : 0, color: a !== void 0 ? a : "black" };
  }, "es"), Ec = /* @__PURE__ */ __name(function(t) {
    var r = es(t), n = r.offset, i = r.radius, a = r.color;
    return { shadowOffset: n, shadowRadius: i, shadowColor: a, shadowOpacity: 1 };
  }, "Ec"), Fc = 1, Cc = 1, Sc = 0, kc = /* @__PURE__ */ __name(function(t) {
    var r, n, i;
    if (t.matches(Mi))
      return t.expectEmpty(), { flexGrow: 0, flexShrink: 0, flexBasis: "auto" };
    if (t.saveRewindPoint(), t.matches(Ri) && !t.hasTokens())
      return { flexGrow: 1, flexShrink: 1, flexBasis: "auto" };
    t.rewind();
    for (var a = 0; a < 2 && t.hasTokens(); )
      a !== 0 && t.expect(Ze), r === void 0 && t.matches(kr) ? (r = t.lastValue, t.saveRewindPoint(), t.matches(Ze) && t.matches(kr) ? n = t.lastValue : t.rewind()) : i === void 0 && t.matches(vt, Xt, Gi) ? i = t.lastValue : i === void 0 && t.matches(Ri) ? i = "auto" : t.throw(), a += 1;
    return t.expectEmpty(), r === void 0 && (r = Fc), n === void 0 && (n = Cc), i === void 0 && (i = Sc), { flexGrow: r, flexShrink: n, flexBasis: i };
  }, "kc"), Tc = Ve(/(nowrap|wrap|wrap-reverse)/), _c = Ve(/(row|row-reverse|column|column-reverse)/), Ac = "nowrap", Oc = "row", Lc = /* @__PURE__ */ __name(function(t) {
    for (var r, n, i = 0; i < 2 && t.hasTokens(); )
      i !== 0 && t.expect(Ze), r === void 0 && t.matches(Tc) ? r = t.lastValue : n === void 0 && t.matches(_c) ? n = t.lastValue : t.throw(), i += 1;
    return t.expectEmpty(), r === void 0 && (r = Ac), n === void 0 && (n = Oc), { flexWrap: r, flexDirection: n };
  }, "Lc"), ts = /* @__PURE__ */ __name(function(t) {
    var r;
    if (t.matches(gc))
      r = t.lastValue;
    else
      for (r = t.expect(xn); t.hasTokens(); ) {
        t.expect(Ze);
        var n = t.expect(xn);
        r += " " + n;
      }
    return t.expectEmpty(), { fontFamily: r };
  }, "ts"), Ic = Ve(/^(normal)$/), Pc = Ve(/^(italic)$/), Rc = Ve(/^([1-9]00|bold)$/), Uc = Ve(/^(small-caps)$/), Bc = "normal", Nc = "normal", Mc = [], Gc = /* @__PURE__ */ __name(function(t) {
    for (var r, n, i, a, o = 0; o < 3 && t.hasTokens(); ) {
      if (!t.matches(Ic))
        if (r === void 0 && t.matches(Pc))
          r = t.lastValue;
        else if (n === void 0 && t.matches(Rc))
          n = t.lastValue;
        else if (i === void 0 && t.matches(Uc))
          i = [t.lastValue];
        else
          break;
      t.expect(Ze), o += 1;
    }
    var u = t.expect(vt, Xt);
    t.matches(Jo) && (a = t.expect(vt, Xt)), t.expect(Ze);
    var s = ts(t), l = s.fontFamily;
    r === void 0 && (r = Bc), n === void 0 && (n = Nc), i === void 0 && (i = Mc);
    var f = { fontStyle: r, fontWeight: n, fontVariant: i, fontSize: u, fontFamily: l };
    return a !== void 0 && (f.lineHeight = a), f;
  }, "Gc"), Wc = /* @__PURE__ */ __name(function(t) {
    for (var r = [t.expect(xn)]; t.hasTokens(); )
      t.expect(Ze), r.push(t.expect(xn));
    return { fontVariant: r };
  }, "Wc"), $c = Ve(/(flex-(?:start|end)|center|stretch|space-(?:between|around))/), jc = Ve(/(flex-(?:start|end)|center|space-(?:between|around|evenly))/), zc = /* @__PURE__ */ __name(function(t) {
    var r = t.expect($c), n;
    return t.hasTokens() ? (t.expect(Ze), n = t.expect(jc)) : n = "stretch", t.expectEmpty(), { alignContent: r, justifyContent: n };
  }, "zc"), Vc = Ve(/^(solid|double|dotted|dashed)$/), Hc = "none", Xc = "solid", qc = "black", Yc = /* @__PURE__ */ __name(function(t) {
    for (var r, n, i, a = false; t.hasTokens(); ) {
      if (a && t.expect(Ze), r === void 0 && t.matches(Ui)) {
        var o = [t.lastValue.toLowerCase()];
        t.saveRewindPoint(), o[0] !== "none" && t.matches(Ze) && t.matches(Ui) ? (o.push(t.lastValue.toLowerCase()), o.sort().reverse()) : t.rewind(), r = o.join(" ");
      } else
        n === void 0 && t.matches(Vc) ? n = t.lastValue : i === void 0 && t.matches(Ur) ? i = t.lastValue : t.throw();
      a = true;
    }
    return { textDecorationLine: r !== void 0 ? r : Hc, textDecorationColor: i !== void 0 ? i : qc, textDecorationStyle: n !== void 0 ? n : Xc };
  }, "Yc"), Zc = /* @__PURE__ */ __name(function(t) {
    for (var r = [], n = false; t.hasTokens(); )
      n && t.expect(Ze), r.push(t.expect(Ui).toLowerCase()), n = true;
    return r.sort().reverse(), { textDecorationLine: r.join(" ") };
  }, "Zc"), Jc = /* @__PURE__ */ __name(function(t) {
    var r = es(t), n = r.offset, i = r.radius, a = r.color;
    return { textShadowOffset: n, textShadowRadius: i, textShadowColor: a };
  }, "Jc"), Wi = /* @__PURE__ */ __name(function(t) {
    return function(r) {
      var n = r.expect(t);
      return r.expectEmpty(), n;
    };
  }, "Wi"), Ii = Wi(kr), qo = Wi(vt), Sr = Wi(Ko), $i = /* @__PURE__ */ __name(function(t) {
    return function(r, n) {
      return function(i) {
        var a, o, u = i.expect(t), s;
        if (i.hasTokens())
          i.expect(dc), s = i.expect(t);
        else if (n !== void 0)
          s = n;
        else
          return u;
        return i.expectEmpty(), [(a = {}, a[r + "Y"] = s, a), (o = {}, o[r + "X"] = u, o)];
      };
    };
  }, "$i"), Kc = $i(kr), Qc = $i(vt), ep = $i(Ko), tp = { perspective: Ii, scale: Kc("scale"), scaleX: Ii, scaleY: Ii, translate: Qc("translate", 0), translateX: qo, translateY: qo, rotate: Sr, rotateX: Sr, rotateY: Sr, rotateZ: Sr, skewX: Sr, skewY: Sr, skew: ep("skew", "0deg") }, rp = /* @__PURE__ */ __name(function(t) {
    for (var r = [], n = false; t.hasTokens(); ) {
      n && t.expect(Ze);
      var i = t.expectFunction(), a = i.functionName, o = tp[a](i);
      if (!Array.isArray(o)) {
        var u;
        o = [(u = {}, u[a] = o, u)];
      }
      r = o.concat(r), n = true;
    }
    return { transform: r };
  }, "rp"), np = /* @__PURE__ */ __name(function(t) {
    return { backgroundColor: t.expect(Ur) };
  }, "np"), ip = Br({ types: [Ur], prefix: "border", suffix: "Color" }), ap = Br({ directions: ["TopLeft", "TopRight", "BottomRight", "BottomLeft"], prefix: "border", suffix: "Radius" }), op = Br({ prefix: "border", suffix: "Width" }), sp = Br({ types: [vt, Xt, Gi, Ri], prefix: "margin" }), up = Br({ prefix: "padding" }), lp = /* @__PURE__ */ __name(function(t) {
    return { fontWeight: t.expect(vc) };
  }, "lp"), fp = /* @__PURE__ */ __name(function(t) {
    return { shadowOffset: Qo(t) };
  }, "fp"), cp = /* @__PURE__ */ __name(function(t) {
    return { textShadowOffset: Qo(t) };
  }, "cp"), rs = { aspectRatio: mc, background: np, border: wc, borderColor: ip, borderRadius: ap, borderWidth: op, boxShadow: Ec, flex: kc, flexFlow: Lc, font: Gc, fontFamily: ts, fontVariant: Wc, fontWeight: lp, margin: sp, padding: up, placeContent: zc, shadowOffset: fp, textShadow: Jc, textShadowOffset: cp, textDecoration: Yc, textDecorationLine: Zc, transform: rp }, Yo, ky = Yo != null ? new RegExp(Yo.join("|")) : null, Pi = "SYMBOL_MATCH", pp = function() {
    function e(r, n) {
      this.index = 0, this.nodes = r, this.functionName = n != null ? n.value : null, this.lastValue = null, this.rewindIndex = -1;
    }
    __name(e, "e");
    var t = e.prototype;
    return t.hasTokens = function() {
      return this.index <= this.nodes.length - 1;
    }, t[Pi] = function() {
      if (!this.hasTokens())
        return null;
      for (var r = this.nodes[this.index], n = 0; n < arguments.length; n += 1) {
        var i = n < 0 || arguments.length <= n ? void 0 : arguments[n], a = i(r);
        if (a !== null)
          return this.index += 1, this.lastValue = a, a;
      }
      return null;
    }, t.matches = function() {
      return this[Pi].apply(this, arguments) !== null;
    }, t.expect = function() {
      var n = this[Pi].apply(this, arguments);
      return n !== null ? n : this.throw();
    }, t.matchesFunction = function() {
      var n = this.nodes[this.index];
      if (n.type !== "function")
        return null;
      var i = new e(n.nodes, n);
      return this.index += 1, this.lastValue = null, i;
    }, t.expectFunction = function() {
      var n = this.matchesFunction();
      return n !== null ? n : this.throw();
    }, t.expectEmpty = function() {
      this.hasTokens() && this.throw();
    }, t.throw = function() {
      throw new Error("Unexpected token type: " + this.nodes[this.index].type);
    }, t.saveRewindPoint = function() {
      this.rewindIndex = this.index;
    }, t.rewind = function() {
      if (this.rewindIndex === -1)
        throw new Error("Internal error");
      this.index = this.rewindIndex, this.lastValue = null;
    }, e;
  }(), hp = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?)(?:px)?$/i, dp = /^true|false$/i, vp = /^null$/i, gp = /^undefined$/i, ns = /* @__PURE__ */ __name(function(t, r) {
    if (0)
      var n, i;
    var a = r.match(hp);
    if (a !== null)
      return Number(a[1]);
    var o = r.match(dp);
    if (o !== null)
      return o[0].toLowerCase() === "true";
    var u = r.match(vp);
    if (u !== null)
      return null;
    var s = r.match(gp);
    if (s === null)
      return r;
  }, "ns"), mp = /* @__PURE__ */ __name(function(t, r) {
    var n = Kf(r), i = new pp(n.nodes);
    return rs[t](i);
  }, "mp"), Dp = mp, is = /* @__PURE__ */ __name(function(t, r, n) {
    var i, a = n === false || !(t in rs), o = r.trim(), u = a ? (i = {}, i[t] = ns(t, o), i) : Dp(t, o);
    return u;
  }, "is"), as = /* @__PURE__ */ __name(function(t) {
    var r = /^--\w+/.test(t);
    return r ? t : Qf(t);
  }, "as"), yp = /* @__PURE__ */ __name(function(t, r) {
    return r === void 0 && (r = []), t.reduce(function(n, i) {
      var a = as(i[0]), o = i[1], u = r.indexOf(a) === -1;
      return Object.assign(n, is(a, o, u));
    }, {});
  }, "yp");
  Tr.default = yp;
  Tr.getPropertyName = as;
  Tr.getStylesForProperty = is;
  Tr.transformRawValue = ns;
});
var ss = et((os, En) => {
  (function(e) {
    function t(o) {
      if (!(this instanceof t))
        return new t();
      this.backgrounds = o || [];
    }
    __name(t, "t");
    t.prototype.toString = function() {
      return this.backgrounds.join(", ");
    };
    function r(o) {
      if (!(this instanceof r))
        return new r(o);
      o = o || {};
      var u = this;
      function s(l, f) {
        u[l] = l in o ? o[l] : f;
      }
      __name(s, "s");
      s("color", ""), s("image", "none"), s("attachment", "scroll"), s("clip", "border-box"), s("origin", "padding-box"), s("position", "0% 0%"), s("repeat", "repeat"), s("size", "auto");
    }
    __name(r, "r");
    r.prototype.toString = function() {
      var o = [this.image, this.repeat, this.attachment, this.position + " / " + this.size, this.origin, this.clip];
      return this.color && o.unshift(this.color), o.join(" ");
    }, e.BackgroundList = t, e.Background = r;
    function n(o) {
      var u = [], s = /[,\(\)]/, l = 0, f = "";
      if (o == null)
        return u;
      for (; o.length; ) {
        var c = s.exec(o);
        if (!c)
          break;
        var p = c[0], d = false;
        switch (p) {
          case ",":
            l || (u.push(f.trim()), f = "", d = true);
            break;
          case "(":
            l++;
            break;
          case ")":
            l--;
            break;
        }
        var D = c.index + 1;
        f += o.slice(0, d ? D - 1 : D), o = o.slice(D);
      }
      return (f.length || o.length) && u.push((f + o).trim()), u;
    }
    __name(n, "n");
    function i(o) {
      return o.trim();
    }
    __name(i, "i");
    function a(o) {
      return (o || "").split(",").map(i);
    }
    __name(a, "a");
    e.parseElementStyle = function(o) {
      var u = new t();
      if (o == null)
        return u;
      for (var s = n(o.backgroundImage), l = o.backgroundColor, f = a(o.backgroundAttachment), c = a(o.backgroundClip), p = a(o.backgroundOrigin), d = a(o.backgroundPosition), D = a(o.backgroundRepeat), v = a(o.backgroundSize), g, y = 0, b = s.length; y < b; y++)
        g = new r({ image: s[y], attachment: f[y % f.length], clip: c[y % c.length], origin: p[y % p.length], position: d[y % d.length], repeat: D[y % D.length], size: v[y % v.length] }), y === b - 1 && (g.color = l), u.backgrounds.push(g);
      return u;
    };
  })(function(e) {
    return typeof En < "u" && En.exports !== void 0 ? En.exports : e.cssBgParser = {};
  }(os));
});
var ls = et((_y, us) => {
  var bp = /,(?![^\(]*\))/, xp = /\s(?![^(]*\))/, wp = /^[0-9]+[a-zA-Z%]+?$/, Ep = /* @__PURE__ */ __name((e) => {
    let t = e.split(xp), r = t.includes("inset"), n = t.slice(-1)[0], i = Cp(n) ? void 0 : n, a = t.filter((f) => f !== "inset").filter((f) => f !== i).map(Sp), [o, u, s, l] = a;
    return { inset: r, offsetX: o, offsetY: u, blurRadius: s, spreadRadius: l, color: i };
  }, "Ep"), Fp = /* @__PURE__ */ __name((e) => {
    let { inset: t, offsetX: r = 0, offsetY: n = 0, blurRadius: i = 0, spreadRadius: a, color: o } = e || {};
    return [t ? "inset" : null, r, n, i, a, o].filter((u) => u != null).map(kp).map((u) => ("" + u).trim()).join(" ");
  }, "Fp"), Cp = /* @__PURE__ */ __name((e) => e === "0" || wp.test(e), "Cp"), Sp = /* @__PURE__ */ __name((e) => {
    if (!/px$/.test(e) && e !== "0")
      return e;
    let t = parseFloat(e);
    return isNaN(t) ? e : t;
  }, "Sp"), kp = /* @__PURE__ */ __name((e) => typeof e == "number" && e !== 0 ? e + "px" : e, "kp"), Tp = /* @__PURE__ */ __name((e) => e.split(bp).map((t) => t.trim()).map(Ep), "Tp"), _p = /* @__PURE__ */ __name((e) => e.map(Fp).join(", "), "_p");
  us.exports = { parse: Tp, stringify: _p };
});
var Vi = et((ji, zi) => {
  (function(e, t) {
    typeof ji == "object" && typeof zi < "u" ? zi.exports = t() : typeof define == "function" && define.amd ? define(t) : (e = e || self).parseCssColor = t();
  })(ji, function() {
    "use strict";
    var e = { aliceblue: [240, 248, 255], antiquewhite: [250, 235, 215], aqua: [0, 255, 255], aquamarine: [127, 255, 212], azure: [240, 255, 255], beige: [245, 245, 220], bisque: [255, 228, 196], black: [0, 0, 0], blanchedalmond: [255, 235, 205], blue: [0, 0, 255], blueviolet: [138, 43, 226], brown: [165, 42, 42], burlywood: [222, 184, 135], cadetblue: [95, 158, 160], chartreuse: [127, 255, 0], chocolate: [210, 105, 30], coral: [255, 127, 80], cornflowerblue: [100, 149, 237], cornsilk: [255, 248, 220], crimson: [220, 20, 60], cyan: [0, 255, 255], darkblue: [0, 0, 139], darkcyan: [0, 139, 139], darkgoldenrod: [184, 134, 11], darkgray: [169, 169, 169], darkgreen: [0, 100, 0], darkgrey: [169, 169, 169], darkkhaki: [189, 183, 107], darkmagenta: [139, 0, 139], darkolivegreen: [85, 107, 47], darkorange: [255, 140, 0], darkorchid: [153, 50, 204], darkred: [139, 0, 0], darksalmon: [233, 150, 122], darkseagreen: [143, 188, 143], darkslateblue: [72, 61, 139], darkslategray: [47, 79, 79], darkslategrey: [47, 79, 79], darkturquoise: [0, 206, 209], darkviolet: [148, 0, 211], deeppink: [255, 20, 147], deepskyblue: [0, 191, 255], dimgray: [105, 105, 105], dimgrey: [105, 105, 105], dodgerblue: [30, 144, 255], firebrick: [178, 34, 34], floralwhite: [255, 250, 240], forestgreen: [34, 139, 34], fuchsia: [255, 0, 255], gainsboro: [220, 220, 220], ghostwhite: [248, 248, 255], gold: [255, 215, 0], goldenrod: [218, 165, 32], gray: [128, 128, 128], green: [0, 128, 0], greenyellow: [173, 255, 47], grey: [128, 128, 128], honeydew: [240, 255, 240], hotpink: [255, 105, 180], indianred: [205, 92, 92], indigo: [75, 0, 130], ivory: [255, 255, 240], khaki: [240, 230, 140], lavender: [230, 230, 250], lavenderblush: [255, 240, 245], lawngreen: [124, 252, 0], lemonchiffon: [255, 250, 205], lightblue: [173, 216, 230], lightcoral: [240, 128, 128], lightcyan: [224, 255, 255], lightgoldenrodyellow: [250, 250, 210], lightgray: [211, 211, 211], lightgreen: [144, 238, 144], lightgrey: [211, 211, 211], lightpink: [255, 182, 193], lightsalmon: [255, 160, 122], lightseagreen: [32, 178, 170], lightskyblue: [135, 206, 250], lightslategray: [119, 136, 153], lightslategrey: [119, 136, 153], lightsteelblue: [176, 196, 222], lightyellow: [255, 255, 224], lime: [0, 255, 0], limegreen: [50, 205, 50], linen: [250, 240, 230], magenta: [255, 0, 255], maroon: [128, 0, 0], mediumaquamarine: [102, 205, 170], mediumblue: [0, 0, 205], mediumorchid: [186, 85, 211], mediumpurple: [147, 112, 219], mediumseagreen: [60, 179, 113], mediumslateblue: [123, 104, 238], mediumspringgreen: [0, 250, 154], mediumturquoise: [72, 209, 204], mediumvioletred: [199, 21, 133], midnightblue: [25, 25, 112], mintcream: [245, 255, 250], mistyrose: [255, 228, 225], moccasin: [255, 228, 181], navajowhite: [255, 222, 173], navy: [0, 0, 128], oldlace: [253, 245, 230], olive: [128, 128, 0], olivedrab: [107, 142, 35], orange: [255, 165, 0], orangered: [255, 69, 0], orchid: [218, 112, 214], palegoldenrod: [238, 232, 170], palegreen: [152, 251, 152], paleturquoise: [175, 238, 238], palevioletred: [219, 112, 147], papayawhip: [255, 239, 213], peachpuff: [255, 218, 185], peru: [205, 133, 63], pink: [255, 192, 203], plum: [221, 160, 221], powderblue: [176, 224, 230], purple: [128, 0, 128], rebeccapurple: [102, 51, 153], red: [255, 0, 0], rosybrown: [188, 143, 143], royalblue: [65, 105, 225], saddlebrown: [139, 69, 19], salmon: [250, 128, 114], sandybrown: [244, 164, 96], seagreen: [46, 139, 87], seashell: [255, 245, 238], sienna: [160, 82, 45], silver: [192, 192, 192], skyblue: [135, 206, 235], slateblue: [106, 90, 205], slategray: [112, 128, 144], slategrey: [112, 128, 144], snow: [255, 250, 250], springgreen: [0, 255, 127], steelblue: [70, 130, 180], tan: [210, 180, 140], teal: [0, 128, 128], thistle: [216, 191, 216], tomato: [255, 99, 71], turquoise: [64, 224, 208], violet: [238, 130, 238], wheat: [245, 222, 179], white: [255, 255, 255], whitesmoke: [245, 245, 245], yellow: [255, 255, 0], yellowgreen: [154, 205, 50] }, t = new RegExp(/^#([a-f0-9]{3,4}|[a-f0-9]{4}(?:[a-f0-9]{2}){1,2})\b$/, "i"), r = "-?\\d*(?:\\.\\d+)", n = "(" + r + "?)", i = "(" + r + "?%)", a = (`^
  hsla?\\(
    \\s*(-?\\d*(?:\\.\\d+)?(?:deg|rad|turn)?)\\s*,
    \\s*` + i + `\\s*,
    \\s*` + i + `\\s*
    (?:,\\s*(-?\\d*(?:\\.\\d+)?%?)\\s*)?
  \\)
  $
`).replace(/\n|\s/g, ""), o = new RegExp(a), u = (`^
  hsla?\\(
    \\s*(-?\\d*(?:\\.\\d+)?(?:deg|rad|turn)?)\\s*
    \\s+` + i + `
    \\s+` + i + `
    \\s*(?:\\s*\\/\\s*(-?\\d*(?:\\.\\d+)?%?)\\s*)?
  \\)
  $
`).replace(/\n|\s/g, ""), s = new RegExp(u), l = (`^
  rgba?\\(
    \\s*` + n + `\\s*,
    \\s*` + n + `\\s*,
    \\s*` + n + `\\s*
    (?:,\\s*(-?\\d*(?:\\.\\d+)?%?)\\s*)?
  \\)
  $
`).replace(/\n|\s/g, ""), f = new RegExp(l), c = (`^
  rgba?\\(
    \\s*` + i + `\\s*,
    \\s*` + i + `\\s*,
    \\s*` + i + `\\s*
    (?:,\\s*(-?\\d*(?:\\.\\d+)?%?)\\s*)?
  \\)
  $
`).replace(/\n|\s/g, ""), p = new RegExp(c), d = (`^
  rgba?\\(
    \\s*` + n + `
    \\s+` + n + `
    \\s+` + n + `
    \\s*(?:\\s*\\/\\s*(-?\\d*(?:\\.\\d+)?%?)\\s*)?
  \\)
$
`).replace(/\n|\s/g, ""), D = new RegExp(d), v = (`^
  rgba?\\(
    \\s*` + i + `
    \\s+` + i + `
    \\s+` + i + `
    \\s*(?:\\s*\\/\\s*(-?\\d*(?:\\.\\d+)?%?)\\s*)?
  \\)
$
`).replace(/\n|\s/g, ""), g = new RegExp(v), y = new RegExp(/^transparent$/, "i"), b = new RegExp("[^#a-f\\d]", "gi"), C = new RegExp("^#?[a-f\\d]{3}[a-f\\d]?$|^#?[a-f\\d]{6}([a-f\\d]{2})?$", "i"), k = /* @__PURE__ */ __name(function(M, H, q) {
      return Math.min(Math.max(H, M), q);
    }, "k"), S = /* @__PURE__ */ __name(function(M) {
      var H = M;
      return typeof H != "number" && (H = H.endsWith("%") ? 255 * parseFloat(H) / 100 : parseFloat(H)), k(Math.round(H), 0, 255);
    }, "S"), E = /* @__PURE__ */ __name(function(M) {
      return k(parseFloat(M), 0, 100);
    }, "E");
    function L(M) {
      var H = M;
      return typeof H != "number" && (H = H.endsWith("%") ? parseFloat(H) / 100 : parseFloat(H)), k(H, 0, 1);
    }
    __name(L, "L");
    function T(M) {
      var H = function(q, ee) {
        if (ee === void 0 && (ee = {}), typeof q != "string" || b.test(q) || !C.test(q))
          throw new TypeError("Expected a valid hex string");
        var A = 1;
        (q = q.replace(/^#/, "")).length === 8 && (A = Number.parseInt(q.slice(6, 8), 16) / 255, q = q.slice(0, 6)), q.length === 4 && (A = Number.parseInt(q.slice(3, 4).repeat(2), 16) / 255, q = q.slice(0, 3)), q.length === 3 && (q = q[0] + q[0] + q[1] + q[1] + q[2] + q[2]);
        var R = Number.parseInt(q, 16), O = R >> 16, Y = R >> 8 & 255, Z = 255 & R, te = typeof ee.alpha == "number" ? ee.alpha : A;
        return ee.format === "array" ? [O, Y, Z, te] : ee.format === "css" ? "rgb(" + O + " " + Y + " " + Z + (te === 1 ? "" : " / " + Number((100 * te).toFixed(2)) + "%") + ")" : { red: O, green: Y, blue: Z, alpha: te };
      }(M, { format: "array" });
      return U([null, H[0], H[1], H[2], H[3]]);
    }
    __name(T, "T");
    function U(M) {
      var H = M[1], q = M[2], ee = M[3], A = M[4];
      return A === void 0 && (A = 1), { type: "rgb", values: [H, q, ee].map(S), alpha: L(A === null ? 1 : A) };
    }
    __name(U, "U");
    return function(M) {
      if (typeof M != "string")
        return null;
      var H = t.exec(M);
      if (H)
        return T(H[0]);
      var q = s.exec(M) || o.exec(M);
      if (q)
        return function(R) {
          var O = R[1], Y = R[2], Z = R[3], te = R[4];
          te === void 0 && (te = 1);
          var ie = O;
          return { type: "hsl", values: [ie = ie.endsWith("turn") ? 360 * parseFloat(ie) / 1 : ie.endsWith("rad") ? Math.round(180 * parseFloat(ie) / Math.PI) : parseFloat(ie), E(Y), E(Z)], alpha: L(te === null ? 1 : te) };
        }(q);
      var ee = D.exec(M) || g.exec(M) || f.exec(M) || p.exec(M);
      if (ee)
        return U(ee);
      if (y.exec(M))
        return U([null, 0, 0, 0, 0]);
      var A = e[M.toLowerCase()];
      return A ? U([null, A[0], A[1], A[2], 1]) : null;
    };
  });
});
var cs = et((Ay, fs) => {
  "use strict";
  var Ap = /["'&<>]/;
  fs.exports = Op;
  function Op(e) {
    var t = "" + e, r = Ap.exec(t);
    if (!r)
      return t;
    var n, i = "", a = 0, o = 0;
    for (a = r.index; a < t.length; a++) {
      switch (t.charCodeAt(a)) {
        case 34:
          n = "&quot;";
          break;
        case 38:
          n = "&amp;";
          break;
        case 39:
          n = "&#39;";
          break;
        case 60:
          n = "&lt;";
          break;
        case 62:
          n = "&gt;";
          break;
        default:
          continue;
      }
      o !== a && (i += t.substring(o, a)), o = a + 1, i += n;
    }
    return o !== a ? i + t.substring(o, a) : i;
  }
  __name(Op, "Op");
});
var Co = St(Do(), 1);
var So = St(yo(), 1);
var Ei = {};
var Ef = 5;
var bo = 12;
var Ff = 13;
var Cf = 16;
var Sf = 17;
var kf = 22;
var xo = 28;
var wo = 31;
var Tf = 33;
var gn = 34;
var _f = 35;
var bi = 36;
var xi = 37;
var ko = 38;
var Af = 39;
var Of = 40;
var Pr = 41;
var Lf = 42;
var h = 0;
var m = 1;
var Ee = 2;
var To = 3;
var F = 4;
var If = [[F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, To, F, F, F, F, F, F, F, F, F, F, F], [h, F, F, m, m, F, F, F, F, m, m, h, h, h, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [h, F, F, m, m, F, F, F, F, m, m, m, m, m, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [F, F, F, m, m, m, F, F, F, m, m, m, m, m, m, m, m, m, m, m, F, Ee, F, m, m, m, m, m, m, m, m, m, m], [m, F, F, m, m, m, F, F, F, m, m, m, m, m, m, m, m, m, m, m, F, Ee, F, m, m, m, m, m, m, m, m, m, m], [h, F, F, m, m, m, F, F, F, h, h, h, h, h, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [h, F, F, m, m, m, F, F, F, h, h, h, h, h, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [h, F, F, m, m, m, F, F, F, h, h, m, h, m, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [h, F, F, m, m, m, F, F, F, h, h, m, m, m, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [m, F, F, m, m, m, F, F, F, h, h, m, m, m, m, m, m, m, h, h, F, Ee, F, m, m, m, m, m, h, m, m, m, h], [m, F, F, m, m, m, F, F, F, h, h, m, m, m, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [m, F, F, m, m, m, F, F, F, m, m, m, m, m, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [m, F, F, m, m, m, F, F, F, m, m, m, m, m, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [m, F, F, m, m, m, F, F, F, m, m, m, m, m, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [h, F, F, m, m, m, F, F, F, h, m, h, h, h, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [h, F, F, m, m, m, F, F, F, h, h, h, h, h, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [h, F, F, m, h, m, F, F, F, h, h, m, h, h, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [h, F, F, m, h, m, F, F, F, h, h, h, h, h, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [m, F, F, m, m, m, F, F, F, m, m, m, m, m, m, m, m, m, m, m, F, Ee, F, m, m, m, m, m, m, m, m, m, h], [h, F, F, m, m, m, F, F, F, h, h, h, h, h, h, m, m, m, h, F, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, h, F, h, h, h, h, h, h, h, h, h, h, h, h], [m, F, F, m, m, m, F, F, F, m, m, m, m, m, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [m, F, F, m, m, m, F, F, F, m, m, m, m, m, m, m, m, m, m, m, F, Ee, F, m, m, m, m, m, m, m, m, m, m], [h, F, F, m, m, m, F, F, F, h, m, h, h, h, h, m, m, m, h, h, F, Ee, F, h, h, h, m, m, h, h, h, m, h], [h, F, F, m, m, m, F, F, F, h, m, h, h, h, h, m, m, m, h, h, F, Ee, F, h, h, h, h, m, h, h, h, m, h], [h, F, F, m, m, m, F, F, F, h, m, h, h, h, h, m, m, m, h, h, F, Ee, F, m, m, m, m, h, h, h, h, m, h], [h, F, F, m, m, m, F, F, F, h, m, h, h, h, h, m, m, m, h, h, F, Ee, F, h, h, h, m, m, h, h, h, m, h], [h, F, F, m, m, m, F, F, F, h, m, h, h, h, h, m, m, m, h, h, F, Ee, F, h, h, h, h, m, h, h, h, m, h], [h, F, F, m, m, m, F, F, F, h, h, h, h, h, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, m, h, h, m, h], [h, F, F, m, m, m, F, F, F, h, m, h, h, h, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, m, m, h], [h, F, F, m, m, m, F, F, F, h, m, h, h, h, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [m, F, F, m, m, m, F, F, F, m, m, m, m, m, h, m, m, m, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h], [h, F, F, m, m, h, F, F, F, h, h, h, h, h, h, h, h, h, h, h, F, Ee, F, h, h, h, h, h, h, h, h, m, h]];
var Pf = So.default.toByteArray("AAgOAAAAAAAQ4QAAAQ0P8vDtnQuMXUUZx+eyu7d7797d9m5bHoWltKVUlsjLWE0VJNigQoMVqkStEoNQQUl5GIo1KKmogEgqkKbBRki72lYabZMGKoGAjQRtJJDaCCIRiiigREBQS3z+xzOTnZ3O+3HOhd5NfpkzZx7fN9988zivu2M9hGwB28F94DnwEngd/Asc1EtIs9c/bIPDwCxwLDgezHcodyo4w5C+CCwBS8FnwSXgCnA1uFbI93XwbXAbWAfWgx+CzWAb+An4KfgFeAzsYWWfYuFz4CXwGvgb+Dfo6yNkEEwGh4CZYB44FpwI3g1OY+kfBItZOo2fB84Hy8DF4HJwNbiWpV8PVoO1LH4n2NRXyN+KcAd4kNVP9XsY4aPgcfAbsBfs6SniL4K/sPjfEf6HlanXCRkCw2BGvUh/keWfXS/CY+pFXs7x9XHmM94LTmWIeU2cgbxnS/k/B3kf86jDhU8L9V2E40vAFWAlWFUfb++NOL4F3C7JX4/4GiE+hvgWsF0oS7mXldspnN+F493gyXrh9xTav0cg3EvzgVfBG6wsmVSEkxBOBgdPGpd7JI6PnqRvJ68/xlbHof53gPeA94OzwLngk+ACsAwsByvASrAK3MB0Ws3CtQjvBJvAVrADPMDSHkb4CNijaccTwvnf4fiPEs8Lxy+D18A/QU8/xjgYBjPAbDAKTgYLwOngTHAO+EQ/8wuEF4EvsPiVCFf2+9tsFStzA8LVHuXXBsi6QyqzUYiPMR/7Mc7dAx7oL8bzw/3u/Bw8Bp4Az4AXwCtgHzsmDXP5fiF9iiVvly5d0sHngar16NKlS5cuXbp06fLmYlqHXrcd3ph4P0THUY3iXh49novju4S0tzfs5d+JPKewfAsRntZb3K9ZhOMlrO6lCC8An28U9+OuovcPcPxlVu5rCL/VmHh/iHIrzn3fIPu7SN8Axmg+8AOwEWwCm7tp3bRuWjetm5Y8bSu4B9zbKO6ZVsnORrVU3f4uXTqZ2H3sLoyx3eDXjfDndE9qyj6L838CfwVvgFpzYnof4oNgOhgBc8Fos9DrZIQLmtXPP1MmF6wGj4H+KXoWguvADkXaPil+YpuQy8Am8Ey7ODdtmJDF4HowBp4De6HDTNjhfHAHeBr0DBBy0kDxfPbcgSIusgrcWhtnJ8vL+TPix7UIOQtcBq4C28Cr4KRBnANbwSuDE+s50JgyNNFuXbp06XIgsXjIvPafjvXozKY+fVFz/z0LT1uCtKVSWbrOLWPnztG8e0Xfy7ol8XtZJi7WtG+5od2UFXQ/A12vUeS7jp27yVKHjdsU9lXB869TyNvAzt0lpP2oWbwLdjiO78bx/Sz+EMJHwK9Y/LcIfw+eZ3F67/Hl5vh9xX80J+rwX8SvRDhpgL17iPAQMHNArfPrqHPewLheI+AERV6efwV418B4nOZ/H+IfYHV8GOF5LJ3eAz0fx8sM9S0fUNud39O9CulfGZhY5huI3wzWgNvBelbHZoTbNPVpfYjKQpkHwUNgl0LWblbnk0LbbDxr0OMFpL3iqWdu9nWYPlVAWkXY39LnGdCkDbeqv1YNbfcMQ3t9oe8lzm6NH9N1ZB6Ln4BwfkJZJk7RyFnYKt6b/JDQXx9p5X+eFdqOjzM9P9MB/lUlFzr20aXIdzlY4dmn9F3YqtvoO76/2hp/D/xA5Zue88nNyL8GbFbs075X0tyUig3Qd2MCnf//HjnzpbsR3g9+1kHzzVjdnE71/qVBX9rGPUh/ysNWe1neFzvIDi5zAufV1sT0N0poR22wkFUfTOPfA4N2mbZ5fSrqOHSw+IbkSBbOGSzSRgf91/GTUWYBOB2cIZQ/G8cfBZ8CFwrnL8XxF8FKcA24jqXdiPA7Qr61OF7H4mMItwzuv2/YLth1ISt3Hzu3k4W7EH5JqPdRHD/O4k+z8A8IX5Lq3y7Z4nXE9xn6kX6vQ4bKfy+ok+hH+xf3hq9dnTTHhjKd2GmDuWA242iHMq4cC7A8kJ7i8o1+skSa7Jieo38HCWnoNjKFhdSFBxzpZ7QE6lI8N4S14aASZcryaV/WWHw66f6NHuCoxuQxmvM56GX9QMd8Q4D65ywGP+ZzRJuM+zQvx/MOS2VFeqQ4IXnH26zM9Xe6/E6D+4foAzzuajPZp8Qyw5ayZVDWuH0z0BtYRkeIDqH9KO9VbH1btd/lhNqCzvl8zeLnG0S/hnU6baHfpiuO6yy0rd+DHURo/zYF5H26j03rQsip2ndzz82u1z9N4VjWKWeb68Tedpt95HRVXp7H1R6p+/Wt4FPy/PpWwscOLRJ+PVWF/+W0iVyGzs18TIvXkOJ1Wxm66vSXz+vylenrZcj1ub439W+K8RNCGTJi2p/TJ1K23VaXr35tRpnzmjxequgfcfyk6B/TGBVlyedsNgpdd/h+W1U3P99QyFPNo1X3TwpM/WLTIWYfoBqXrv6iskHZ/RFr79R6hIyHBrH3f1nrUVnjP8SnZZ+rYtzr9Exld5MNbPNErusAPg+77u/eDOPftU9yj39TH7rezxd1LvsZQJlzkWlOirG/79zjMj/mtHUKu7vKy+3/LnXr9okyKedjX5/0He9iP/j63LwOQdarEVlfy8OO/Lqw023j6xcqmwxLiOd6heM2i9cV9LJy8jMJ23yQ+rpbfu7EQ/pXE8KYvUSqvVnb4XzZa6LrHMXHR+zcLvqWbm/Bn0/HzIs6fWPHoat8XfnDKmZGxRxeMbn2UqZ5Q94nmcZRbqqUXbZ8+lcjE+cPX11t814orvvAXNcG8vqj2vvk1MGn3anlj0bIT72v47bvE+Lc98T9b6r7AKn6j+8Duf7D0nnZx/j7Zjn0j9nbpSTndaLr9WNLivP+iN23xF7L+fqv6ZouFyb78jxVXvv5jJ9YUs9/sddO8h7KNg5jrhfaJGztT6G7KF+1d6yCmD5Kdb2fan60rSc552fZr3zeQ9DpnPp+Si5cx5Ktv2QfSzF/mMbWdOm46rFI4XstnU9xeqX4NKb7TKEdcr6pZOK3ID1k/LvFHkVczEuZLEDr499YqvqBym1aEHWgcvoYOtv0M91qQl5TfpO/in6rWx8OVpT1Wedkv3f5xom3T/xeR/6Gx6V86PWAOB4bBpqWdN+yTcVxjIyGRz/FrDGu6w/3d7kPm8StX8RyPu+uuvpNju/vTLJV37GpvoM0oZPnW87VLnL/5pDno1NoW1R6yedU6TyUv3u19a3KFnIbTLYz+ZCLP4T0tU1uivFgso0pnsJ/UtXvarNY28Xq5cvkBDrQP/E5ZaiuQwwfmTlsOiQRU1fMuqrDd/3ISSuwjOwXOfTyGUMpZIXq4GpLn3pUcdfzch2x7XO1u2uZHOPb1G6b3Xg9PH1IIWeEpJlPQtqos2EKW8b0u8rnuP1UeVLoXJb9be0uG9nnbchjU+XTszT5VeNBThPHnc5OKj1U9aj0GTHIVaGy1YhEWT4ixns00DT+XEzWn/7VAsIc63Cov3OdyhwjrnaqQqZvWKXdypRdlq+k8msZ031U+Rm4fA+3TtyeR9hwfW9G9yxDN0fZMN33F+9TE6md4hwoxumfaUzI9fN3PFT3xVV2msrQ3UsnChm6Nulk8TndpS28D3zX9tTIPsF/z7Am5OkTjm1tI1JZW74+4VgsZ0N3L1yXV3WeP5uR7TGHHdvC3JQlxybfpd22tDlk/2eofRK8TzrN/qnar/K/OUTth6I/+jAnEptNbPvFHP2gs40N3+dfMWtwqvVct7/wfd8gtQ7imifial9ZJ9/3IHLYU6eDj3+4PhsNhX+vwvcWLnu6kGfEMe8DuciPfUfGZB8X/7HJy/Gefe5n+VRGFd/wyP2ta7/LO4yh/sbLV/k9lev6kfO9Dt/5U67b1/6u/epqB1U9Me23jfHY9sscAg4tkbLl+e4/U36rJ9ddxfd6sg5vq5ice42Wpk/pb9FOJ36/W9tpv4kbC79nUbZceX8Zu6/qJ+P3WvhvA8v3reh7Jbn2d6rrNC7XNZTLma4Ba0JI9efX2uLzF5scG/w9UNU1ZxW+ymUfzELeTllXlQ1rUuhzjS5fp9c964iFBOqeSz63bU065nZKdU+mDEz3qHIjjifquw0pnb/raRtvrnsYcb46ihT3taoYz6brdNW9l6rWRnE/navdPn1XlR1km7hcz1WlH/elKuSOSvLLuE8U6m8uzwRdfcGl73VyTHuyMvzJ1Sa2cWDTP/Z63Kc94n2B1PYr24dz1JlyHLlcP+S4B6vD1c9EW4q2LWstCvUjeVy63k/LMYdUNd5D1xQfvVTzX1VjkMsUv88N8VH5fReVn/Fjn++/h6X6Q8a6b1/q3g/i/ewi0/Scs8zxXeV6mWIOUPlPzBgdFerW+bZrm2P18dnjuK6HunEp+rHvPMXbr+sHVb/lnL+pTP57jPw9Cvk3PW178JD9qChfzuvTf7Htl38L1QUf/VKu9SFjwWbTWPvFEvu7Uq76y7+31g6QlYPc669pbsm9Xur2LWI9Pu8ypfDXqm3A2z8s1FWGn4ntL9NfQu2oSlftX9uetvTtv7J8Ql4zxfXGZ3zk8PeQ9w59x2uMfqI8/q5eKh/l9cb2rwsu9rSNl06ZP2Pmxtz+rNMx93yno0n2/82rVH7rQ+y9P15H6FyRun9ViH81ATmffI7nJ5r8uXXW6enbP6b/B8/l5OifVHYLnb9S39s2zcc+Ph+rh8+eQgVPS72elzGWY/tUtbbabBpDiI7yN1q6/4th2y+ErAc5+9BVvu/7KamJbWNZeuqI/R4tRf+YyD1HmOZM1bMV3/14Sn10c0Xu+Sj1nOXb5jL73ncdy02uvlXZNde65dOHYl7Vs4KYuS6FzWLn2zJlpZqPXPVPOa5yzKOyn1VhT9lmMfdbfH7D11Wf2PXN5h9y+dD287+qxgSnaYmnIrRtIb8pJe6/Uv9OVer6Whn0zfGO/BEloZI9ojmfAlUflClDd178bTmVHVTpZXOkAlk/lb42UujmI89HH5V+cl7XtowY6vTxLVWok6UrGzoGTHN+bB+6ri05687VNpvfuvRfaP2uMlNQth1D5JjGelm/8yn+9p3p/7qk9gnfeddXZmq/Sm333PJT659Kv1zjNbZ9uv2Oi//67CV8/N1nj1DmviyXDNVeJkaeaX8UsyesYg8cu2+NvdaPfb+lLDu5tvt/");
var Rf = new Co.default(Pf);
var Eo = /* @__PURE__ */ __name(function(e) {
  switch (e) {
    case Tf:
      return bo;
    case Af:
    case Of:
    case Lf:
      return bo;
    case _f:
      return Ef;
    default:
      return e;
  }
}, "Eo");
var Fo = /* @__PURE__ */ __name(function(e) {
  switch (e) {
    case xi:
    case ko:
      return gn;
    case Pr:
      return kf;
    default:
      return e;
  }
}, "Fo");
var Rr = /* @__PURE__ */ __name(class {
  constructor(t, r = false) {
    this.position = t, this.required = r;
  }
}, "Rr");
var wi = /* @__PURE__ */ __name(class {
  nextCodePoint() {
    let t = this.string.charCodeAt(this.pos++), r = this.string.charCodeAt(this.pos);
    return 55296 <= t && t <= 56319 && 56320 <= r && r <= 57343 ? (this.pos++, (t - 55296) * 1024 + (r - 56320) + 65536) : t;
  }
  nextCharClass() {
    return Eo(Rf.get(this.nextCodePoint()));
  }
  getSimpleBreak() {
    switch (this.nextClass) {
      case Pr:
        return false;
      case gn:
      case xi:
      case ko:
        return this.curClass = gn, false;
      case bi:
        return this.curClass = bi, false;
    }
    return null;
  }
  getPairTableBreak(t) {
    let r = false;
    switch (If[this.curClass][this.nextClass]) {
      case h:
        r = true;
        break;
      case m:
        r = t === Pr;
        break;
      case Ee:
        if (r = t === Pr, !r)
          return r = false, r;
        break;
      case To:
        if (t !== Pr)
          return r;
        break;
      case F:
        break;
    }
    return this.LB8a && (r = false), this.LB21a && (this.curClass === Cf || this.curClass === Sf) ? (r = false, this.LB21a = false) : this.LB21a = this.curClass === Ff, this.curClass === xo ? (this.LB30a++, this.LB30a == 2 && this.nextClass === xo && (r = true, this.LB30a = 0)) : this.LB30a = 0, this.curClass = this.nextClass, r;
  }
  nextBreak() {
    if (this.curClass == null) {
      let t = this.nextCharClass();
      this.curClass = Fo(t), this.nextClass = t, this.LB8a = t === wo, this.LB30a = 0;
    }
    for (; this.pos < this.string.length; ) {
      this.lastPos = this.pos;
      let t = this.nextClass;
      if (this.nextClass = this.nextCharClass(), this.curClass === gn || this.curClass === bi && this.nextClass !== xi)
        return this.curClass = Fo(Eo(this.nextClass)), new Rr(this.lastPos, true);
      let r = this.getSimpleBreak();
      if (r === null && (r = this.getPairTableBreak(t)), this.LB8a = this.nextClass === wo, r)
        return new Rr(this.lastPos);
    }
    return this.lastPos < this.string.length ? (this.lastPos = this.string.length, new Rr(this.string.length)) : null;
  }
  constructor(t) {
    this.string = t, this.pos = 0, this.lastPos = 0, this.curClass = null, this.nextClass = null, this.LB8a = false, this.LB21a = false, this.LB30a = 0;
  }
}, "wi");
Ei = wi;
var It = St(wn(), 1);
var ml = St(ss(), 1);
var Dl = St(ls(), 1);
var yl = St(Vi(), 1);
var bl = St(Oi(), 1);
var xl = St(wn(), 1);
var Fa = St(cs(), 1);
var Cl = St(Vi(), 1);
var Ca = St(wn(), 1);
var wt = Uint8Array;
var mr = Uint16Array;
var Ms = Uint32Array;
var Gs = new wt([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0]);
var Ws = new wt([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]);
var Lp = new wt([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var $s = /* @__PURE__ */ __name(function(e, t) {
  for (var r = new mr(31), n = 0; n < 31; ++n)
    r[n] = t += 1 << e[n - 1];
  for (var i = new Ms(r[30]), n = 1; n < 30; ++n)
    for (var a = r[n]; a < r[n + 1]; ++a)
      i[a] = a - r[n] << 5 | n;
  return [r, i];
}, "$s");
var js = $s(Gs, 2);
var zs = js[0];
var Ip = js[1];
zs[28] = 258, Ip[258] = 28;
var Pp = $s(Ws, 0);
var Rp = Pp[0];
var ta = new mr(32768);
for (ke = 0; ke < 32768; ++ke)
  qt = (ke & 43690) >>> 1 | (ke & 21845) << 1, qt = (qt & 52428) >>> 2 | (qt & 13107) << 2, qt = (qt & 61680) >>> 4 | (qt & 3855) << 4, ta[ke] = ((qt & 65280) >>> 8 | (qt & 255) << 8) >>> 1;
var qt;
var ke;
var Mr = /* @__PURE__ */ __name(function(e, t, r) {
  for (var n = e.length, i = 0, a = new mr(t); i < n; ++i)
    e[i] && ++a[e[i] - 1];
  var o = new mr(t);
  for (i = 0; i < t; ++i)
    o[i] = o[i - 1] + a[i - 1] << 1;
  var u;
  if (r) {
    u = new mr(1 << t);
    var s = 15 - t;
    for (i = 0; i < n; ++i)
      if (e[i])
        for (var l = i << 4 | e[i], f = t - e[i], c = o[e[i] - 1]++ << f, p = c | (1 << f) - 1; c <= p; ++c)
          u[ta[c] >>> s] = l;
  } else
    for (u = new mr(n), i = 0; i < n; ++i)
      e[i] && (u[i] = ta[o[e[i] - 1]++] >>> 15 - e[i]);
  return u;
}, "Mr");
var $r = new wt(288);
for (ke = 0; ke < 144; ++ke)
  $r[ke] = 8;
var ke;
for (ke = 144; ke < 256; ++ke)
  $r[ke] = 9;
var ke;
for (ke = 256; ke < 280; ++ke)
  $r[ke] = 7;
var ke;
for (ke = 280; ke < 288; ++ke)
  $r[ke] = 8;
var ke;
var Vs = new wt(32);
for (ke = 0; ke < 32; ++ke)
  Vs[ke] = 5;
var ke;
var Up = Mr($r, 9, 1);
var Bp = Mr(Vs, 5, 1);
var Hi = /* @__PURE__ */ __name(function(e) {
  for (var t = e[0], r = 1; r < e.length; ++r)
    e[r] > t && (t = e[r]);
  return t;
}, "Hi");
var kt = /* @__PURE__ */ __name(function(e, t, r) {
  var n = t / 8 | 0;
  return (e[n] | e[n + 1] << 8) >> (t & 7) & r;
}, "kt");
var Xi = /* @__PURE__ */ __name(function(e, t) {
  var r = t / 8 | 0;
  return (e[r] | e[r + 1] << 8 | e[r + 2] << 16) >> (t & 7);
}, "Xi");
var Np = /* @__PURE__ */ __name(function(e) {
  return (e + 7) / 8 | 0;
}, "Np");
var Mp = /* @__PURE__ */ __name(function(e, t, r) {
  (t == null || t < 0) && (t = 0), (r == null || r > e.length) && (r = e.length);
  var n = new (e.BYTES_PER_ELEMENT == 2 ? mr : e.BYTES_PER_ELEMENT == 4 ? Ms : wt)(r - t);
  return n.set(e.subarray(t, r)), n;
}, "Mp");
var Gp = ["unexpected EOF", "invalid block type", "invalid length/literal", "invalid distance", "stream finished", "no stream handler", , "no callback", "invalid UTF-8 data", "extra field too long", "date not in range 1980-2099", "filename too long", "stream finishing", "invalid zip data"];
var or = /* @__PURE__ */ __name(function(e, t, r) {
  var n = new Error(t || Gp[e]);
  if (n.code = e, Error.captureStackTrace && Error.captureStackTrace(n, or), !r)
    throw n;
  return n;
}, "or");
var Wp = /* @__PURE__ */ __name(function(e, t, r) {
  var n = e.length;
  if (!n || r && r.f && !r.l)
    return t || new wt(0);
  var i = !t || r, a = !r || r.i;
  r || (r = {}), t || (t = new wt(n * 3));
  var o = /* @__PURE__ */ __name(function(W) {
    var fe = t.length;
    if (W > fe) {
      var ce = new wt(Math.max(fe * 2, W));
      ce.set(t), t = ce;
    }
  }, "o"), u = r.f || 0, s = r.p || 0, l = r.b || 0, f = r.l, c = r.d, p = r.m, d = r.n, D = n * 8;
  do {
    if (!f) {
      u = kt(e, s, 1);
      var v = kt(e, s + 1, 3);
      if (s += 3, v)
        if (v == 1)
          f = Up, c = Bp, p = 9, d = 5;
        else if (v == 2) {
          var C = kt(e, s, 31) + 257, k = kt(e, s + 10, 15) + 4, S = C + kt(e, s + 5, 31) + 1;
          s += 14;
          for (var E = new wt(S), L = new wt(19), T = 0; T < k; ++T)
            L[Lp[T]] = kt(e, s + T * 3, 7);
          s += k * 3;
          for (var U = Hi(L), M = (1 << U) - 1, H = Mr(L, U, 1), T = 0; T < S; ) {
            var q = H[kt(e, s, M)];
            s += q & 15;
            var g = q >>> 4;
            if (g < 16)
              E[T++] = g;
            else {
              var ee = 0, A = 0;
              for (g == 16 ? (A = 3 + kt(e, s, 3), s += 2, ee = E[T - 1]) : g == 17 ? (A = 3 + kt(e, s, 7), s += 3) : g == 18 && (A = 11 + kt(e, s, 127), s += 7); A--; )
                E[T++] = ee;
            }
          }
          var R = E.subarray(0, C), O = E.subarray(C);
          p = Hi(R), d = Hi(O), f = Mr(R, p, 1), c = Mr(O, d, 1);
        } else
          or(1);
      else {
        var g = Np(s) + 4, y = e[g - 4] | e[g - 3] << 8, b = g + y;
        if (b > n) {
          a && or(0);
          break;
        }
        i && o(l + y), t.set(e.subarray(g, b), l), r.b = l += y, r.p = s = b * 8, r.f = u;
        continue;
      }
      if (s > D) {
        a && or(0);
        break;
      }
    }
    i && o(l + 131072);
    for (var Y = (1 << p) - 1, Z = (1 << d) - 1, te = s; ; te = s) {
      var ee = f[Xi(e, s) & Y], ie = ee >>> 4;
      if (s += ee & 15, s > D) {
        a && or(0);
        break;
      }
      if (ee || or(2), ie < 256)
        t[l++] = ie;
      else if (ie == 256) {
        te = s, f = null;
        break;
      } else {
        var B = ie - 254;
        if (ie > 264) {
          var T = ie - 257, z = Gs[T];
          B = kt(e, s, (1 << z) - 1) + zs[T], s += z;
        }
        var _ = c[Xi(e, s) & Z], N = _ >>> 4;
        _ || or(3), s += _ & 15;
        var O = Rp[N];
        if (N > 3) {
          var z = Ws[N];
          O += Xi(e, s) & (1 << z) - 1, s += z;
        }
        if (s > D) {
          a && or(0);
          break;
        }
        i && o(l + 131072);
        for (var ae = l + B; l < ae; l += 4)
          t[l] = t[l - O], t[l + 1] = t[l + 1 - O], t[l + 2] = t[l + 2 - O], t[l + 3] = t[l + 3 - O];
        l = ae;
      }
    }
    r.l = f, r.p = te, r.b = l, r.f = u, f && (u = 1, r.m = p, r.d = c, r.n = d);
  } while (!u);
  return l == t.length ? t : Mp(t, 0, l);
}, "Wp");
var $p = new wt(0);
function jp(e, t) {
  return Wp(e, t);
}
__name(jp, "jp");
var zp = typeof TextDecoder < "u" && new TextDecoder();
var Vp = 0;
try {
  zp.decode($p, { stream: true }), Vp = 1;
} catch {
}
function ot() {
  this.commands = [], this.fill = "black", this.stroke = null, this.strokeWidth = 1;
}
__name(ot, "ot");
ot.prototype.moveTo = function(e, t) {
  this.commands.push({ type: "M", x: e, y: t });
};
ot.prototype.lineTo = function(e, t) {
  this.commands.push({ type: "L", x: e, y: t });
};
ot.prototype.curveTo = ot.prototype.bezierCurveTo = function(e, t, r, n, i, a) {
  this.commands.push({ type: "C", x1: e, y1: t, x2: r, y2: n, x: i, y: a });
};
ot.prototype.quadTo = ot.prototype.quadraticCurveTo = function(e, t, r, n) {
  this.commands.push({ type: "Q", x1: e, y1: t, x: r, y: n });
};
ot.prototype.close = ot.prototype.closePath = function() {
  this.commands.push({ type: "Z" });
};
ot.prototype.extend = function(e) {
  e.commands && (e = e.commands), Array.prototype.push.apply(this.commands, e);
};
ot.prototype.toPathData = function(e) {
  e = e !== void 0 ? e : 2;
  function t(o) {
    return Math.round(o) === o ? "" + Math.round(o) : o.toFixed(e);
  }
  __name(t, "t");
  function r() {
    for (var o = arguments, u = "", s = 0; s < arguments.length; s += 1) {
      var l = o[s];
      l >= 0 && s > 0 && (u += " "), u += t(l);
    }
    return u;
  }
  __name(r, "r");
  for (var n = "", i = 0; i < this.commands.length; i += 1) {
    var a = this.commands[i];
    a.type === "M" ? n += "M" + r(a.x, a.y) : a.type === "L" ? n += "L" + r(a.x, a.y) : a.type === "C" ? n += "C" + r(a.x1, a.y1, a.x2, a.y2, a.x, a.y) : a.type === "Q" ? n += "Q" + r(a.x1, a.y1, a.x, a.y) : a.type === "Z" && (n += "Z");
  }
  return n;
};
var Hp = [".notdef", "space", "exclam", "quotedbl", "numbersign", "dollar", "percent", "ampersand", "quoteright", "parenleft", "parenright", "asterisk", "plus", "comma", "hyphen", "period", "slash", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "colon", "semicolon", "less", "equal", "greater", "question", "at", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "bracketleft", "backslash", "bracketright", "asciicircum", "underscore", "quoteleft", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "braceleft", "bar", "braceright", "asciitilde", "exclamdown", "cent", "sterling", "fraction", "yen", "florin", "section", "currency", "quotesingle", "quotedblleft", "guillemotleft", "guilsinglleft", "guilsinglright", "fi", "fl", "endash", "dagger", "daggerdbl", "periodcentered", "paragraph", "bullet", "quotesinglbase", "quotedblbase", "quotedblright", "guillemotright", "ellipsis", "perthousand", "questiondown", "grave", "acute", "circumflex", "tilde", "macron", "breve", "dotaccent", "dieresis", "ring", "cedilla", "hungarumlaut", "ogonek", "caron", "emdash", "AE", "ordfeminine", "Lslash", "Oslash", "OE", "ordmasculine", "ae", "dotlessi", "lslash", "oslash", "oe", "germandbls", "onesuperior", "logicalnot", "mu", "trademark", "Eth", "onehalf", "plusminus", "Thorn", "onequarter", "divide", "brokenbar", "degree", "thorn", "threequarters", "twosuperior", "registered", "minus", "eth", "multiply", "threesuperior", "copyright", "Aacute", "Acircumflex", "Adieresis", "Agrave", "Aring", "Atilde", "Ccedilla", "Eacute", "Ecircumflex", "Edieresis", "Egrave", "Iacute", "Icircumflex", "Idieresis", "Igrave", "Ntilde", "Oacute", "Ocircumflex", "Odieresis", "Ograve", "Otilde", "Scaron", "Uacute", "Ucircumflex", "Udieresis", "Ugrave", "Yacute", "Ydieresis", "Zcaron", "aacute", "acircumflex", "adieresis", "agrave", "aring", "atilde", "ccedilla", "eacute", "ecircumflex", "edieresis", "egrave", "iacute", "icircumflex", "idieresis", "igrave", "ntilde", "oacute", "ocircumflex", "odieresis", "ograve", "otilde", "scaron", "uacute", "ucircumflex", "udieresis", "ugrave", "yacute", "ydieresis", "zcaron", "exclamsmall", "Hungarumlautsmall", "dollaroldstyle", "dollarsuperior", "ampersandsmall", "Acutesmall", "parenleftsuperior", "parenrightsuperior", "266 ff", "onedotenleader", "zerooldstyle", "oneoldstyle", "twooldstyle", "threeoldstyle", "fouroldstyle", "fiveoldstyle", "sixoldstyle", "sevenoldstyle", "eightoldstyle", "nineoldstyle", "commasuperior", "threequartersemdash", "periodsuperior", "questionsmall", "asuperior", "bsuperior", "centsuperior", "dsuperior", "esuperior", "isuperior", "lsuperior", "msuperior", "nsuperior", "osuperior", "rsuperior", "ssuperior", "tsuperior", "ff", "ffi", "ffl", "parenleftinferior", "parenrightinferior", "Circumflexsmall", "hyphensuperior", "Gravesmall", "Asmall", "Bsmall", "Csmall", "Dsmall", "Esmall", "Fsmall", "Gsmall", "Hsmall", "Ismall", "Jsmall", "Ksmall", "Lsmall", "Msmall", "Nsmall", "Osmall", "Psmall", "Qsmall", "Rsmall", "Ssmall", "Tsmall", "Usmall", "Vsmall", "Wsmall", "Xsmall", "Ysmall", "Zsmall", "colonmonetary", "onefitted", "rupiah", "Tildesmall", "exclamdownsmall", "centoldstyle", "Lslashsmall", "Scaronsmall", "Zcaronsmall", "Dieresissmall", "Brevesmall", "Caronsmall", "Dotaccentsmall", "Macronsmall", "figuredash", "hypheninferior", "Ogoneksmall", "Ringsmall", "Cedillasmall", "questiondownsmall", "oneeighth", "threeeighths", "fiveeighths", "seveneighths", "onethird", "twothirds", "zerosuperior", "foursuperior", "fivesuperior", "sixsuperior", "sevensuperior", "eightsuperior", "ninesuperior", "zeroinferior", "oneinferior", "twoinferior", "threeinferior", "fourinferior", "fiveinferior", "sixinferior", "seveninferior", "eightinferior", "nineinferior", "centinferior", "dollarinferior", "periodinferior", "commainferior", "Agravesmall", "Aacutesmall", "Acircumflexsmall", "Atildesmall", "Adieresissmall", "Aringsmall", "AEsmall", "Ccedillasmall", "Egravesmall", "Eacutesmall", "Ecircumflexsmall", "Edieresissmall", "Igravesmall", "Iacutesmall", "Icircumflexsmall", "Idieresissmall", "Ethsmall", "Ntildesmall", "Ogravesmall", "Oacutesmall", "Ocircumflexsmall", "Otildesmall", "Odieresissmall", "OEsmall", "Oslashsmall", "Ugravesmall", "Uacutesmall", "Ucircumflexsmall", "Udieresissmall", "Yacutesmall", "Thornsmall", "Ydieresissmall", "001.000", "001.001", "001.002", "001.003", "Black", "Bold", "Book", "Light", "Medium", "Regular", "Roman", "Semibold"];
var Xp = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "space", "exclam", "quotedbl", "numbersign", "dollar", "percent", "ampersand", "quoteright", "parenleft", "parenright", "asterisk", "plus", "comma", "hyphen", "period", "slash", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "colon", "semicolon", "less", "equal", "greater", "question", "at", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "bracketleft", "backslash", "bracketright", "asciicircum", "underscore", "quoteleft", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "braceleft", "bar", "braceright", "asciitilde", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "exclamdown", "cent", "sterling", "fraction", "yen", "florin", "section", "currency", "quotesingle", "quotedblleft", "guillemotleft", "guilsinglleft", "guilsinglright", "fi", "fl", "", "endash", "dagger", "daggerdbl", "periodcentered", "", "paragraph", "bullet", "quotesinglbase", "quotedblbase", "quotedblright", "guillemotright", "ellipsis", "perthousand", "", "questiondown", "", "grave", "acute", "circumflex", "tilde", "macron", "breve", "dotaccent", "dieresis", "", "ring", "cedilla", "", "hungarumlaut", "ogonek", "caron", "emdash", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "AE", "", "ordfeminine", "", "", "", "", "Lslash", "Oslash", "OE", "ordmasculine", "", "", "", "", "", "ae", "", "", "", "dotlessi", "", "", "lslash", "oslash", "oe", "germandbls"];
var qp = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "space", "exclamsmall", "Hungarumlautsmall", "", "dollaroldstyle", "dollarsuperior", "ampersandsmall", "Acutesmall", "parenleftsuperior", "parenrightsuperior", "twodotenleader", "onedotenleader", "comma", "hyphen", "period", "fraction", "zerooldstyle", "oneoldstyle", "twooldstyle", "threeoldstyle", "fouroldstyle", "fiveoldstyle", "sixoldstyle", "sevenoldstyle", "eightoldstyle", "nineoldstyle", "colon", "semicolon", "commasuperior", "threequartersemdash", "periodsuperior", "questionsmall", "", "asuperior", "bsuperior", "centsuperior", "dsuperior", "esuperior", "", "", "isuperior", "", "", "lsuperior", "msuperior", "nsuperior", "osuperior", "", "", "rsuperior", "ssuperior", "tsuperior", "", "ff", "fi", "fl", "ffi", "ffl", "parenleftinferior", "", "parenrightinferior", "Circumflexsmall", "hyphensuperior", "Gravesmall", "Asmall", "Bsmall", "Csmall", "Dsmall", "Esmall", "Fsmall", "Gsmall", "Hsmall", "Ismall", "Jsmall", "Ksmall", "Lsmall", "Msmall", "Nsmall", "Osmall", "Psmall", "Qsmall", "Rsmall", "Ssmall", "Tsmall", "Usmall", "Vsmall", "Wsmall", "Xsmall", "Ysmall", "Zsmall", "colonmonetary", "onefitted", "rupiah", "Tildesmall", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "exclamdownsmall", "centoldstyle", "Lslashsmall", "", "", "Scaronsmall", "Zcaronsmall", "Dieresissmall", "Brevesmall", "Caronsmall", "", "Dotaccentsmall", "", "", "Macronsmall", "", "", "figuredash", "hypheninferior", "", "", "Ogoneksmall", "Ringsmall", "Cedillasmall", "", "", "", "onequarter", "onehalf", "threequarters", "questiondownsmall", "oneeighth", "threeeighths", "fiveeighths", "seveneighths", "onethird", "twothirds", "", "", "zerosuperior", "onesuperior", "twosuperior", "threesuperior", "foursuperior", "fivesuperior", "sixsuperior", "sevensuperior", "eightsuperior", "ninesuperior", "zeroinferior", "oneinferior", "twoinferior", "threeinferior", "fourinferior", "fiveinferior", "sixinferior", "seveninferior", "eightinferior", "nineinferior", "centinferior", "dollarinferior", "periodinferior", "commainferior", "Agravesmall", "Aacutesmall", "Acircumflexsmall", "Atildesmall", "Adieresissmall", "Aringsmall", "AEsmall", "Ccedillasmall", "Egravesmall", "Eacutesmall", "Ecircumflexsmall", "Edieresissmall", "Igravesmall", "Iacutesmall", "Icircumflexsmall", "Idieresissmall", "Ethsmall", "Ntildesmall", "Ogravesmall", "Oacutesmall", "Ocircumflexsmall", "Otildesmall", "Odieresissmall", "OEsmall", "Oslashsmall", "Ugravesmall", "Uacutesmall", "Ucircumflexsmall", "Udieresissmall", "Yacutesmall", "Thornsmall", "Ydieresissmall"];
function Hs(e) {
  this.font = e;
}
__name(Hs, "Hs");
Hs.prototype.charToGlyphIndex = function(e) {
  var t = e.codePointAt(0), r = this.font.glyphs;
  if (r) {
    for (var n = 0; n < r.length; n += 1)
      for (var i = r.get(n), a = 0; a < i.unicodes.length; a += 1)
        if (i.unicodes[a] === t)
          return n;
  }
  return null;
};
function Xs(e) {
  this.cmap = e;
}
__name(Xs, "Xs");
Xs.prototype.charToGlyphIndex = function(e) {
  return this.cmap.glyphIndexMap[e.codePointAt(0)] || 0;
};
function kn(e, t) {
  this.encoding = e, this.charset = t;
}
__name(kn, "kn");
kn.prototype.charToGlyphIndex = function(e) {
  var t = e.codePointAt(0), r = this.encoding[t];
  return this.charset.indexOf(r);
};
function Yp(e) {
  for (var t, r = e.tables.cmap.glyphIndexMap, n = Object.keys(r), i = 0; i < n.length; i += 1) {
    var a = n[i], o = r[a];
    t = e.glyphs.get(o), t.addUnicode(parseInt(a));
  }
}
__name(Yp, "Yp");
function Zp(e) {
  e._IndexToUnicodeMap = {};
  for (var t = e.tables.cmap.glyphIndexMap, r = Object.keys(t), n = 0; n < r.length; n += 1) {
    var i = r[n], a = t[i];
    e._IndexToUnicodeMap[a] === void 0 ? e._IndexToUnicodeMap[a] = { unicodes: [parseInt(i)] } : e._IndexToUnicodeMap[a].unicodes.push(parseInt(i));
  }
}
__name(Zp, "Zp");
function Jp(e, t) {
  t.lowMemory ? Zp(e) : Yp(e);
}
__name(Jp, "Jp");
function qs(e) {
  throw new Error(e);
}
__name(qs, "qs");
function ps(e, t) {
  e || qs(t);
}
__name(ps, "ps");
var Te = { fail: qs, argument: ps, assert: ps };
function Kp(e, t) {
  var r = t || new ot();
  return { configurable: true, get: function() {
    return typeof r == "function" && (r = r()), r;
  }, set: function(n) {
    r = n;
  } };
}
__name(Kp, "Kp");
function Jt(e) {
  this.bindConstructorValues(e);
}
__name(Jt, "Jt");
Jt.prototype.bindConstructorValues = function(e) {
  this.index = e.index || 0, this.name = e.name || null, this.unicode = e.unicode || void 0, this.unicodes = e.unicodes || e.unicode !== void 0 ? [e.unicode] : [], "xMin" in e && (this.xMin = e.xMin), "yMin" in e && (this.yMin = e.yMin), "xMax" in e && (this.xMax = e.xMax), "yMax" in e && (this.yMax = e.yMax), "advanceWidth" in e && (this.advanceWidth = e.advanceWidth), Object.defineProperty(this, "path", Kp(this, e.path));
};
Jt.prototype.addUnicode = function(e) {
  this.unicodes.length === 0 && (this.unicode = e), this.unicodes.push(e);
};
Jt.prototype.getPath = function(e, t, r, n, i) {
  e = e !== void 0 ? e : 0, t = t !== void 0 ? t : 0, r = r !== void 0 ? r : 72;
  var a, o;
  n || (n = {});
  var u = n.xScale, s = n.yScale;
  if (n.hinting && i && i.hinting && (o = this.path && i.hinting.exec(this, r)), o)
    a = i.hinting.getCommands(o), e = Math.round(e), t = Math.round(t), u = s = 1;
  else {
    a = this.path.commands;
    var l = 1 / (this.path.unitsPerEm || 1e3) * r;
    u === void 0 && (u = l), s === void 0 && (s = l);
  }
  for (var f = new ot(), c = 0; c < a.length; c += 1) {
    var p = a[c];
    p.type === "M" ? f.moveTo(e + p.x * u, t + -p.y * s) : p.type === "L" ? f.lineTo(e + p.x * u, t + -p.y * s) : p.type === "Q" ? f.quadraticCurveTo(e + p.x1 * u, t + -p.y1 * s, e + p.x * u, t + -p.y * s) : p.type === "C" ? f.curveTo(e + p.x1 * u, t + -p.y1 * s, e + p.x2 * u, t + -p.y2 * s, e + p.x * u, t + -p.y * s) : p.type === "Z" && f.closePath();
  }
  return f;
};
Jt.prototype.getContours = function() {
  if (this.points === void 0)
    return [];
  for (var e = [], t = [], r = 0; r < this.points.length; r += 1) {
    var n = this.points[r];
    t.push(n), n.lastPointOfContour && (e.push(t), t = []);
  }
  return Te.argument(t.length === 0, "There are still points left in the current contour."), e;
};
Jt.prototype.getMetrics = function() {
  for (var e = this.path.commands, t = [], r = [], n = 0; n < e.length; n += 1) {
    var i = e[n];
    i.type !== "Z" && (t.push(i.x), r.push(i.y)), (i.type === "Q" || i.type === "C") && (t.push(i.x1), r.push(i.y1)), i.type === "C" && (t.push(i.x2), r.push(i.y2));
  }
  var a = { xMin: Math.min.apply(null, t), yMin: Math.min.apply(null, r), xMax: Math.max.apply(null, t), yMax: Math.max.apply(null, r), leftSideBearing: this.leftSideBearing };
  return isFinite(a.xMin) || (a.xMin = 0), isFinite(a.xMax) || (a.xMax = this.advanceWidth), isFinite(a.yMin) || (a.yMin = 0), isFinite(a.yMax) || (a.yMax = 0), a.rightSideBearing = this.advanceWidth - a.leftSideBearing - (a.xMax - a.xMin), a;
};
function Fn(e, t, r) {
  Object.defineProperty(e, t, { get: function() {
    return e.path, e[r];
  }, set: function(n) {
    e[r] = n;
  }, enumerable: true, configurable: true });
}
__name(Fn, "Fn");
function ia(e, t) {
  if (this.font = e, this.glyphs = {}, Array.isArray(t))
    for (var r = 0; r < t.length; r++) {
      var n = t[r];
      n.path.unitsPerEm = e.unitsPerEm, this.glyphs[r] = n;
    }
  this.length = t && t.length || 0;
}
__name(ia, "ia");
ia.prototype.get = function(e) {
  if (this.glyphs[e] === void 0) {
    this.font._push(e), typeof this.glyphs[e] == "function" && (this.glyphs[e] = this.glyphs[e]());
    var t = this.glyphs[e], r = this.font._IndexToUnicodeMap[e];
    if (r)
      for (var n = 0; n < r.unicodes.length; n++)
        t.addUnicode(r.unicodes[n]);
    this.glyphs[e].advanceWidth = this.font._hmtxTableData[e].advanceWidth, this.glyphs[e].leftSideBearing = this.font._hmtxTableData[e].leftSideBearing;
  } else
    typeof this.glyphs[e] == "function" && (this.glyphs[e] = this.glyphs[e]());
  return this.glyphs[e];
};
ia.prototype.push = function(e, t) {
  this.glyphs[e] = t, this.length++;
};
function Qp(e, t) {
  return new Jt({ index: t, font: e });
}
__name(Qp, "Qp");
function eh(e, t, r, n, i, a) {
  return function() {
    var o = new Jt({ index: t, font: e });
    return o.path = function() {
      r(o, n, i);
      var u = a(e.glyphs, o);
      return u.unitsPerEm = e.unitsPerEm, u;
    }, Fn(o, "xMin", "_xMin"), Fn(o, "xMax", "_xMax"), Fn(o, "yMin", "_yMin"), Fn(o, "yMax", "_yMax"), o;
  };
}
__name(eh, "eh");
function th(e, t, r, n) {
  return function() {
    var i = new Jt({ index: t, font: e });
    return i.path = function() {
      var a = r(e, i, n);
      return a.unitsPerEm = e.unitsPerEm, a;
    }, i;
  };
}
__name(th, "th");
var $t = { GlyphSet: ia, glyphLoader: Qp, ttfGlyphLoader: eh, cffGlyphLoader: th };
function qi(e, t) {
  for (var r = 0, n = e.length - 1; r <= n; ) {
    var i = r + n >>> 1, a = e[i].tag;
    if (a === t)
      return i;
    a < t ? r = i + 1 : n = i - 1;
  }
  return -r - 1;
}
__name(qi, "qi");
function hs(e, t) {
  for (var r = 0, n = e.length - 1; r <= n; ) {
    var i = r + n >>> 1, a = e[i];
    if (a === t)
      return i;
    a < t ? r = i + 1 : n = i - 1;
  }
  return -r - 1;
}
__name(hs, "hs");
function ds(e, t) {
  for (var r, n = 0, i = e.length - 1; n <= i; ) {
    var a = n + i >>> 1;
    r = e[a];
    var o = r.start;
    if (o === t)
      return r;
    o < t ? n = a + 1 : i = a - 1;
  }
  if (n > 0)
    return r = e[n - 1], t > r.end ? 0 : r;
}
__name(ds, "ds");
function jr(e, t) {
  this.font = e, this.tableName = t;
}
__name(jr, "jr");
jr.prototype = { searchTag: qi, binSearch: hs, getTable: function(e) {
  var t = this.font.tables[this.tableName];
  return !t && e && (t = this.font.tables[this.tableName] = this.createDefaultTable()), t;
}, getDefaultScriptName: function() {
  var e = this.getTable();
  if (e) {
    for (var t = false, r = 0; r < e.scripts.length; r++) {
      var n = e.scripts[r].tag;
      if (n === "DFLT")
        return n;
      n === "latn" && (t = true);
    }
    if (t)
      return "latn";
  }
}, getScriptTable: function(e, t) {
  var r = this.getTable(t);
  if (r) {
    e = e || "DFLT";
    var n = r.scripts, i = qi(r.scripts, e);
    if (i >= 0)
      return n[i].script;
    if (t) {
      var a = { tag: e, script: { defaultLangSys: { reserved: 0, reqFeatureIndex: 65535, featureIndexes: [] }, langSysRecords: [] } };
      return n.splice(-1 - i, 0, a), a.script;
    }
  }
}, getLangSysTable: function(e, t, r) {
  var n = this.getScriptTable(e, r);
  if (n) {
    if (!t || t === "dflt" || t === "DFLT")
      return n.defaultLangSys;
    var i = qi(n.langSysRecords, t);
    if (i >= 0)
      return n.langSysRecords[i].langSys;
    if (r) {
      var a = { tag: t, langSys: { reserved: 0, reqFeatureIndex: 65535, featureIndexes: [] } };
      return n.langSysRecords.splice(-1 - i, 0, a), a.langSys;
    }
  }
}, getFeatureTable: function(e, t, r, n) {
  var i = this.getLangSysTable(e, t, n);
  if (i) {
    for (var a, o = i.featureIndexes, u = this.font.tables[this.tableName].features, s = 0; s < o.length; s++)
      if (a = u[o[s]], a.tag === r)
        return a.feature;
    if (n) {
      var l = u.length;
      return Te.assert(l === 0 || r >= u[l - 1].tag, "Features must be added in alphabetical order."), a = { tag: r, feature: { params: 0, lookupListIndexes: [] } }, u.push(a), o.push(l), a.feature;
    }
  }
}, getLookupTables: function(e, t, r, n, i) {
  var a = this.getFeatureTable(e, t, r, i), o = [];
  if (a) {
    for (var u, s = a.lookupListIndexes, l = this.font.tables[this.tableName].lookups, f = 0; f < s.length; f++)
      u = l[s[f]], u.lookupType === n && o.push(u);
    if (o.length === 0 && i) {
      u = { lookupType: n, lookupFlag: 0, subtables: [], markFilteringSet: void 0 };
      var c = l.length;
      return l.push(u), s.push(c), [u];
    }
  }
  return o;
}, getGlyphClass: function(e, t) {
  switch (e.format) {
    case 1:
      return e.startGlyph <= t && t < e.startGlyph + e.classes.length ? e.classes[t - e.startGlyph] : 0;
    case 2:
      var r = ds(e.ranges, t);
      return r ? r.classId : 0;
  }
}, getCoverageIndex: function(e, t) {
  switch (e.format) {
    case 1:
      var r = hs(e.glyphs, t);
      return r >= 0 ? r : -1;
    case 2:
      var n = ds(e.ranges, t);
      return n ? n.index + t - n.start : -1;
  }
}, expandCoverage: function(e) {
  if (e.format === 1)
    return e.glyphs;
  for (var t = [], r = e.ranges, n = 0; n < r.length; n++)
    for (var i = r[n], a = i.start, o = i.end, u = a; u <= o; u++)
      t.push(u);
  return t;
} };
function zr(e) {
  jr.call(this, e, "gpos");
}
__name(zr, "zr");
zr.prototype = jr.prototype;
zr.prototype.init = function() {
  var e = this.getDefaultScriptName();
  this.defaultKerningTables = this.getKerningTables(e);
};
zr.prototype.getKerningValue = function(e, t, r) {
  for (var n = 0; n < e.length; n++)
    for (var i = e[n].subtables, a = 0; a < i.length; a++) {
      var o = i[a], u = this.getCoverageIndex(o.coverage, t);
      if (!(u < 0))
        switch (o.posFormat) {
          case 1:
            for (var s = o.pairSets[u], l = 0; l < s.length; l++) {
              var f = s[l];
              if (f.secondGlyph === r)
                return f.value1 && f.value1.xAdvance || 0;
            }
            break;
          case 2:
            var c = this.getGlyphClass(o.classDef1, t), p = this.getGlyphClass(o.classDef2, r), d = o.classRecords[c][p];
            return d.value1 && d.value1.xAdvance || 0;
        }
    }
  return 0;
};
zr.prototype.getKerningTables = function(e, t) {
  if (this.font.tables.gpos)
    return this.getLookupTables(e, t, "kern", 2);
};
function gt(e) {
  jr.call(this, e, "gsub");
}
__name(gt, "gt");
function rh(e, t) {
  var r = e.length;
  if (r !== t.length)
    return false;
  for (var n = 0; n < r; n++)
    if (e[n] !== t[n])
      return false;
  return true;
}
__name(rh, "rh");
function aa(e, t, r) {
  for (var n = e.subtables, i = 0; i < n.length; i++) {
    var a = n[i];
    if (a.substFormat === t)
      return a;
  }
  if (r)
    return n.push(r), r;
}
__name(aa, "aa");
gt.prototype = jr.prototype;
gt.prototype.createDefaultTable = function() {
  return { version: 1, scripts: [{ tag: "DFLT", script: { defaultLangSys: { reserved: 0, reqFeatureIndex: 65535, featureIndexes: [] }, langSysRecords: [] } }], features: [], lookups: [] };
};
gt.prototype.getSingle = function(e, t, r) {
  for (var n = [], i = this.getLookupTables(t, r, e, 1), a = 0; a < i.length; a++)
    for (var o = i[a].subtables, u = 0; u < o.length; u++) {
      var s = o[u], l = this.expandCoverage(s.coverage), f = void 0;
      if (s.substFormat === 1) {
        var c = s.deltaGlyphId;
        for (f = 0; f < l.length; f++) {
          var p = l[f];
          n.push({ sub: p, by: p + c });
        }
      } else {
        var d = s.substitute;
        for (f = 0; f < l.length; f++)
          n.push({ sub: l[f], by: d[f] });
      }
    }
  return n;
};
gt.prototype.getMultiple = function(e, t, r) {
  for (var n = [], i = this.getLookupTables(t, r, e, 2), a = 0; a < i.length; a++)
    for (var o = i[a].subtables, u = 0; u < o.length; u++) {
      var s = o[u], l = this.expandCoverage(s.coverage), f = void 0;
      for (f = 0; f < l.length; f++) {
        var c = l[f], p = s.sequences[f];
        n.push({ sub: c, by: p });
      }
    }
  return n;
};
gt.prototype.getAlternates = function(e, t, r) {
  for (var n = [], i = this.getLookupTables(t, r, e, 3), a = 0; a < i.length; a++)
    for (var o = i[a].subtables, u = 0; u < o.length; u++)
      for (var s = o[u], l = this.expandCoverage(s.coverage), f = s.alternateSets, c = 0; c < l.length; c++)
        n.push({ sub: l[c], by: f[c] });
  return n;
};
gt.prototype.getLigatures = function(e, t, r) {
  for (var n = [], i = this.getLookupTables(t, r, e, 4), a = 0; a < i.length; a++)
    for (var o = i[a].subtables, u = 0; u < o.length; u++)
      for (var s = o[u], l = this.expandCoverage(s.coverage), f = s.ligatureSets, c = 0; c < l.length; c++)
        for (var p = l[c], d = f[c], D = 0; D < d.length; D++) {
          var v = d[D];
          n.push({ sub: [p].concat(v.components), by: v.ligGlyph });
        }
  return n;
};
gt.prototype.addSingle = function(e, t, r, n) {
  var i = this.getLookupTables(r, n, e, 1, true)[0], a = aa(i, 2, { substFormat: 2, coverage: { format: 1, glyphs: [] }, substitute: [] });
  Te.assert(a.coverage.format === 1, "Single: unable to modify coverage table format " + a.coverage.format);
  var o = t.sub, u = this.binSearch(a.coverage.glyphs, o);
  u < 0 && (u = -1 - u, a.coverage.glyphs.splice(u, 0, o), a.substitute.splice(u, 0, 0)), a.substitute[u] = t.by;
};
gt.prototype.addMultiple = function(e, t, r, n) {
  Te.assert(t.by instanceof Array && t.by.length > 1, 'Multiple: "by" must be an array of two or more ids');
  var i = this.getLookupTables(r, n, e, 2, true)[0], a = aa(i, 1, { substFormat: 1, coverage: { format: 1, glyphs: [] }, sequences: [] });
  Te.assert(a.coverage.format === 1, "Multiple: unable to modify coverage table format " + a.coverage.format);
  var o = t.sub, u = this.binSearch(a.coverage.glyphs, o);
  u < 0 && (u = -1 - u, a.coverage.glyphs.splice(u, 0, o), a.sequences.splice(u, 0, 0)), a.sequences[u] = t.by;
};
gt.prototype.addAlternate = function(e, t, r, n) {
  var i = this.getLookupTables(r, n, e, 3, true)[0], a = aa(i, 1, { substFormat: 1, coverage: { format: 1, glyphs: [] }, alternateSets: [] });
  Te.assert(a.coverage.format === 1, "Alternate: unable to modify coverage table format " + a.coverage.format);
  var o = t.sub, u = this.binSearch(a.coverage.glyphs, o);
  u < 0 && (u = -1 - u, a.coverage.glyphs.splice(u, 0, o), a.alternateSets.splice(u, 0, 0)), a.alternateSets[u] = t.by;
};
gt.prototype.addLigature = function(e, t, r, n) {
  var i = this.getLookupTables(r, n, e, 4, true)[0], a = i.subtables[0];
  a || (a = { substFormat: 1, coverage: { format: 1, glyphs: [] }, ligatureSets: [] }, i.subtables[0] = a), Te.assert(a.coverage.format === 1, "Ligature: unable to modify coverage table format " + a.coverage.format);
  var o = t.sub[0], u = t.sub.slice(1), s = { ligGlyph: t.by, components: u }, l = this.binSearch(a.coverage.glyphs, o);
  if (l >= 0) {
    for (var f = a.ligatureSets[l], c = 0; c < f.length; c++)
      if (rh(f[c].components, u))
        return;
    f.push(s);
  } else
    l = -1 - l, a.coverage.glyphs.splice(l, 0, o), a.ligatureSets.splice(l, 0, [s]);
};
gt.prototype.getFeature = function(e, t, r) {
  if (/ss\d\d/.test(e))
    return this.getSingle(e, t, r);
  switch (e) {
    case "aalt":
    case "salt":
      return this.getSingle(e, t, r).concat(this.getAlternates(e, t, r));
    case "dlig":
    case "liga":
    case "rlig":
      return this.getLigatures(e, t, r);
    case "ccmp":
      return this.getMultiple(e, t, r).concat(this.getLigatures(e, t, r));
    case "stch":
      return this.getMultiple(e, t, r);
  }
};
gt.prototype.add = function(e, t, r, n) {
  if (/ss\d\d/.test(e))
    return this.addSingle(e, t, r, n);
  switch (e) {
    case "aalt":
    case "salt":
      return typeof t.by == "number" ? this.addSingle(e, t, r, n) : this.addAlternate(e, t, r, n);
    case "dlig":
    case "liga":
    case "rlig":
      return this.addLigature(e, t, r, n);
    case "ccmp":
      return t.by instanceof Array ? this.addMultiple(e, t, r, n) : this.addLigature(e, t, r, n);
  }
};
function Nr(e, t) {
  if (!e)
    throw t;
}
__name(Nr, "Nr");
function vs(e, t) {
  return e.getUint8(t);
}
__name(vs, "vs");
function Tn(e, t) {
  return e.getUint16(t, false);
}
__name(Tn, "Tn");
function nh(e, t) {
  return e.getInt16(t, false);
}
__name(nh, "nh");
function oa(e, t) {
  return e.getUint32(t, false);
}
__name(oa, "oa");
function Ys(e, t) {
  var r = e.getInt16(t, false), n = e.getUint16(t + 2, false);
  return r + n / 65535;
}
__name(Ys, "Ys");
function ih(e, t) {
  for (var r = "", n = t; n < t + 4; n += 1)
    r += String.fromCharCode(e.getInt8(n));
  return r;
}
__name(ih, "ih");
function ah(e, t, r) {
  for (var n = 0, i = 0; i < r; i += 1)
    n <<= 8, n += e.getUint8(t + i);
  return n;
}
__name(ah, "ah");
function oh(e, t, r) {
  for (var n = [], i = t; i < r; i += 1)
    n.push(e.getUint8(i));
  return n;
}
__name(oh, "oh");
function sh(e) {
  for (var t = "", r = 0; r < e.length; r += 1)
    t += String.fromCharCode(e[r]);
  return t;
}
__name(sh, "sh");
var uh = { byte: 1, uShort: 2, short: 2, uLong: 4, fixed: 4, longDateTime: 8, tag: 4 };
function $(e, t) {
  this.data = e, this.offset = t, this.relativeOffset = 0;
}
__name($, "$");
$.prototype.parseByte = function() {
  var e = this.data.getUint8(this.offset + this.relativeOffset);
  return this.relativeOffset += 1, e;
};
$.prototype.parseChar = function() {
  var e = this.data.getInt8(this.offset + this.relativeOffset);
  return this.relativeOffset += 1, e;
};
$.prototype.parseCard8 = $.prototype.parseByte;
$.prototype.parseUShort = function() {
  var e = this.data.getUint16(this.offset + this.relativeOffset);
  return this.relativeOffset += 2, e;
};
$.prototype.parseCard16 = $.prototype.parseUShort;
$.prototype.parseSID = $.prototype.parseUShort;
$.prototype.parseOffset16 = $.prototype.parseUShort;
$.prototype.parseShort = function() {
  var e = this.data.getInt16(this.offset + this.relativeOffset);
  return this.relativeOffset += 2, e;
};
$.prototype.parseF2Dot14 = function() {
  var e = this.data.getInt16(this.offset + this.relativeOffset) / 16384;
  return this.relativeOffset += 2, e;
};
$.prototype.parseULong = function() {
  var e = oa(this.data, this.offset + this.relativeOffset);
  return this.relativeOffset += 4, e;
};
$.prototype.parseOffset32 = $.prototype.parseULong;
$.prototype.parseFixed = function() {
  var e = Ys(this.data, this.offset + this.relativeOffset);
  return this.relativeOffset += 4, e;
};
$.prototype.parseString = function(e) {
  var t = this.data, r = this.offset + this.relativeOffset, n = "";
  this.relativeOffset += e;
  for (var i = 0; i < e; i++)
    n += String.fromCharCode(t.getUint8(r + i));
  return n;
};
$.prototype.parseTag = function() {
  return this.parseString(4);
};
$.prototype.parseLongDateTime = function() {
  var e = oa(this.data, this.offset + this.relativeOffset + 4);
  return e -= 2082844800, this.relativeOffset += 8, e;
};
$.prototype.parseVersion = function(e) {
  var t = Tn(this.data, this.offset + this.relativeOffset), r = Tn(this.data, this.offset + this.relativeOffset + 2);
  return this.relativeOffset += 4, e === void 0 && (e = 4096), t + r / e / 10;
};
$.prototype.skip = function(e, t) {
  t === void 0 && (t = 1), this.relativeOffset += uh[e] * t;
};
$.prototype.parseULongList = function(e) {
  e === void 0 && (e = this.parseULong());
  for (var t = new Array(e), r = this.data, n = this.offset + this.relativeOffset, i = 0; i < e; i++)
    t[i] = r.getUint32(n), n += 4;
  return this.relativeOffset += e * 4, t;
};
$.prototype.parseOffset16List = $.prototype.parseUShortList = function(e) {
  e === void 0 && (e = this.parseUShort());
  for (var t = new Array(e), r = this.data, n = this.offset + this.relativeOffset, i = 0; i < e; i++)
    t[i] = r.getUint16(n), n += 2;
  return this.relativeOffset += e * 2, t;
};
$.prototype.parseShortList = function(e) {
  for (var t = new Array(e), r = this.data, n = this.offset + this.relativeOffset, i = 0; i < e; i++)
    t[i] = r.getInt16(n), n += 2;
  return this.relativeOffset += e * 2, t;
};
$.prototype.parseByteList = function(e) {
  for (var t = new Array(e), r = this.data, n = this.offset + this.relativeOffset, i = 0; i < e; i++)
    t[i] = r.getUint8(n++);
  return this.relativeOffset += e, t;
};
$.prototype.parseList = function(e, t) {
  t || (t = e, e = this.parseUShort());
  for (var r = new Array(e), n = 0; n < e; n++)
    r[n] = t.call(this);
  return r;
};
$.prototype.parseList32 = function(e, t) {
  t || (t = e, e = this.parseULong());
  for (var r = new Array(e), n = 0; n < e; n++)
    r[n] = t.call(this);
  return r;
};
$.prototype.parseRecordList = function(e, t) {
  t || (t = e, e = this.parseUShort());
  for (var r = new Array(e), n = Object.keys(t), i = 0; i < e; i++) {
    for (var a = {}, o = 0; o < n.length; o++) {
      var u = n[o], s = t[u];
      a[u] = s.call(this);
    }
    r[i] = a;
  }
  return r;
};
$.prototype.parseRecordList32 = function(e, t) {
  t || (t = e, e = this.parseULong());
  for (var r = new Array(e), n = Object.keys(t), i = 0; i < e; i++) {
    for (var a = {}, o = 0; o < n.length; o++) {
      var u = n[o], s = t[u];
      a[u] = s.call(this);
    }
    r[i] = a;
  }
  return r;
};
$.prototype.parseStruct = function(e) {
  if (typeof e == "function")
    return e.call(this);
  for (var t = Object.keys(e), r = {}, n = 0; n < t.length; n++) {
    var i = t[n], a = e[i];
    r[i] = a.call(this);
  }
  return r;
};
$.prototype.parseValueRecord = function(e) {
  if (e === void 0 && (e = this.parseUShort()), e !== 0) {
    var t = {};
    return e & 1 && (t.xPlacement = this.parseShort()), e & 2 && (t.yPlacement = this.parseShort()), e & 4 && (t.xAdvance = this.parseShort()), e & 8 && (t.yAdvance = this.parseShort()), e & 16 && (t.xPlaDevice = void 0, this.parseShort()), e & 32 && (t.yPlaDevice = void 0, this.parseShort()), e & 64 && (t.xAdvDevice = void 0, this.parseShort()), e & 128 && (t.yAdvDevice = void 0, this.parseShort()), t;
  }
};
$.prototype.parseValueRecordList = function() {
  for (var e = this.parseUShort(), t = this.parseUShort(), r = new Array(t), n = 0; n < t; n++)
    r[n] = this.parseValueRecord(e);
  return r;
};
$.prototype.parsePointer = function(e) {
  var t = this.parseOffset16();
  if (t > 0)
    return new $(this.data, this.offset + t).parseStruct(e);
};
$.prototype.parsePointer32 = function(e) {
  var t = this.parseOffset32();
  if (t > 0)
    return new $(this.data, this.offset + t).parseStruct(e);
};
$.prototype.parseListOfLists = function(e) {
  for (var t = this.parseOffset16List(), r = t.length, n = this.relativeOffset, i = new Array(r), a = 0; a < r; a++) {
    var o = t[a];
    if (o === 0) {
      i[a] = void 0;
      continue;
    }
    if (this.relativeOffset = o, e) {
      for (var u = this.parseOffset16List(), s = new Array(u.length), l = 0; l < u.length; l++)
        this.relativeOffset = o + u[l], s[l] = e.call(this);
      i[a] = s;
    } else
      i[a] = this.parseUShortList();
  }
  return this.relativeOffset = n, i;
};
$.prototype.parseCoverage = function() {
  var e = this.offset + this.relativeOffset, t = this.parseUShort(), r = this.parseUShort();
  if (t === 1)
    return { format: 1, glyphs: this.parseUShortList(r) };
  if (t === 2) {
    for (var n = new Array(r), i = 0; i < r; i++)
      n[i] = { start: this.parseUShort(), end: this.parseUShort(), index: this.parseUShort() };
    return { format: 2, ranges: n };
  }
  throw new Error("0x" + e.toString(16) + ": Coverage format must be 1 or 2.");
};
$.prototype.parseClassDef = function() {
  var e = this.offset + this.relativeOffset, t = this.parseUShort();
  if (t === 1)
    return { format: 1, startGlyph: this.parseUShort(), classes: this.parseUShortList() };
  if (t === 2)
    return { format: 2, ranges: this.parseRecordList({ start: $.uShort, end: $.uShort, classId: $.uShort }) };
  throw new Error("0x" + e.toString(16) + ": ClassDef format must be 1 or 2.");
};
$.list = function(e, t) {
  return function() {
    return this.parseList(e, t);
  };
};
$.list32 = function(e, t) {
  return function() {
    return this.parseList32(e, t);
  };
};
$.recordList = function(e, t) {
  return function() {
    return this.parseRecordList(e, t);
  };
};
$.recordList32 = function(e, t) {
  return function() {
    return this.parseRecordList32(e, t);
  };
};
$.pointer = function(e) {
  return function() {
    return this.parsePointer(e);
  };
};
$.pointer32 = function(e) {
  return function() {
    return this.parsePointer32(e);
  };
};
$.tag = $.prototype.parseTag;
$.byte = $.prototype.parseByte;
$.uShort = $.offset16 = $.prototype.parseUShort;
$.uShortList = $.prototype.parseUShortList;
$.uLong = $.offset32 = $.prototype.parseULong;
$.uLongList = $.prototype.parseULongList;
$.struct = $.prototype.parseStruct;
$.coverage = $.prototype.parseCoverage;
$.classDef = $.prototype.parseClassDef;
var gs = { reserved: $.uShort, reqFeatureIndex: $.uShort, featureIndexes: $.uShortList };
$.prototype.parseScriptList = function() {
  return this.parsePointer($.recordList({ tag: $.tag, script: $.pointer({ defaultLangSys: $.pointer(gs), langSysRecords: $.recordList({ tag: $.tag, langSys: $.pointer(gs) }) }) })) || [];
};
$.prototype.parseFeatureList = function() {
  return this.parsePointer($.recordList({ tag: $.tag, feature: $.pointer({ featureParams: $.offset16, lookupListIndexes: $.uShortList }) })) || [];
};
$.prototype.parseLookupList = function(e) {
  return this.parsePointer($.list($.pointer(function() {
    var t = this.parseUShort();
    Te.argument(1 <= t && t <= 9, "GPOS/GSUB lookup type " + t + " unknown.");
    var r = this.parseUShort(), n = r & 16;
    return { lookupType: t, lookupFlag: r, subtables: this.parseList($.pointer(e[t])), markFilteringSet: n ? this.parseUShort() : void 0 };
  }))) || [];
};
$.prototype.parseFeatureVariationsList = function() {
  return this.parsePointer32(function() {
    var e = this.parseUShort(), t = this.parseUShort();
    Te.argument(e === 1 && t < 1, "GPOS/GSUB feature variations table unknown.");
    var r = this.parseRecordList32({ conditionSetOffset: $.offset32, featureTableSubstitutionOffset: $.offset32 });
    return r;
  }) || [];
};
var se = { getByte: vs, getCard8: vs, getUShort: Tn, getCard16: Tn, getShort: nh, getULong: oa, getFixed: Ys, getTag: ih, getOffset: ah, getBytes: oh, bytesToString: sh, Parser: $ };
function ms(e, t, r, n, i) {
  var a;
  return (t & n) > 0 ? (a = e.parseByte(), t & i || (a = -a), a = r + a) : (t & i) > 0 ? a = r : a = r + e.parseShort(), a;
}
__name(ms, "ms");
function Zs(e, t, r) {
  var n = new se.Parser(t, r);
  e.numberOfContours = n.parseShort(), e._xMin = n.parseShort(), e._yMin = n.parseShort(), e._xMax = n.parseShort(), e._yMax = n.parseShort();
  var i, a;
  if (e.numberOfContours > 0) {
    for (var o = e.endPointIndices = [], u = 0; u < e.numberOfContours; u += 1)
      o.push(n.parseUShort());
    e.instructionLength = n.parseUShort(), e.instructions = [];
    for (var s = 0; s < e.instructionLength; s += 1)
      e.instructions.push(n.parseByte());
    var l = o[o.length - 1] + 1;
    i = [];
    for (var f = 0; f < l; f += 1)
      if (a = n.parseByte(), i.push(a), (a & 8) > 0)
        for (var c = n.parseByte(), p = 0; p < c; p += 1)
          i.push(a), f += 1;
    if (Te.argument(i.length === l, "Bad flags."), o.length > 0) {
      var d = [], D;
      if (l > 0) {
        for (var v = 0; v < l; v += 1)
          a = i[v], D = {}, D.onCurve = !!(a & 1), D.lastPointOfContour = o.indexOf(v) >= 0, d.push(D);
        for (var g = 0, y = 0; y < l; y += 1)
          a = i[y], D = d[y], D.x = ms(n, a, g, 2, 16), g = D.x;
        for (var b = 0, C = 0; C < l; C += 1)
          a = i[C], D = d[C], D.y = ms(n, a, b, 4, 32), b = D.y;
      }
      e.points = d;
    } else
      e.points = [];
  } else if (e.numberOfContours === 0)
    e.points = [];
  else {
    e.isComposite = true, e.points = [], e.components = [];
    for (var k = true; k; ) {
      i = n.parseUShort();
      var S = { glyphIndex: n.parseUShort(), xScale: 1, scale01: 0, scale10: 0, yScale: 1, dx: 0, dy: 0 };
      (i & 1) > 0 ? (i & 2) > 0 ? (S.dx = n.parseShort(), S.dy = n.parseShort()) : S.matchedPoints = [n.parseUShort(), n.parseUShort()] : (i & 2) > 0 ? (S.dx = n.parseChar(), S.dy = n.parseChar()) : S.matchedPoints = [n.parseByte(), n.parseByte()], (i & 8) > 0 ? S.xScale = S.yScale = n.parseF2Dot14() : (i & 64) > 0 ? (S.xScale = n.parseF2Dot14(), S.yScale = n.parseF2Dot14()) : (i & 128) > 0 && (S.xScale = n.parseF2Dot14(), S.scale01 = n.parseF2Dot14(), S.scale10 = n.parseF2Dot14(), S.yScale = n.parseF2Dot14()), e.components.push(S), k = !!(i & 32);
    }
    if (i & 256) {
      e.instructionLength = n.parseUShort(), e.instructions = [];
      for (var E = 0; E < e.instructionLength; E += 1)
        e.instructions.push(n.parseByte());
    }
  }
}
__name(Zs, "Zs");
function Yi(e, t) {
  for (var r = [], n = 0; n < e.length; n += 1) {
    var i = e[n], a = { x: t.xScale * i.x + t.scale01 * i.y + t.dx, y: t.scale10 * i.x + t.yScale * i.y + t.dy, onCurve: i.onCurve, lastPointOfContour: i.lastPointOfContour };
    r.push(a);
  }
  return r;
}
__name(Yi, "Yi");
function lh(e) {
  for (var t = [], r = [], n = 0; n < e.length; n += 1) {
    var i = e[n];
    r.push(i), i.lastPointOfContour && (t.push(r), r = []);
  }
  return Te.argument(r.length === 0, "There are still points left in the current contour."), t;
}
__name(lh, "lh");
function Js(e) {
  var t = new ot();
  if (!e)
    return t;
  for (var r = lh(e), n = 0; n < r.length; ++n) {
    var i = r[n], a = null, o = i[i.length - 1], u = i[0];
    if (o.onCurve)
      t.moveTo(o.x, o.y);
    else if (u.onCurve)
      t.moveTo(u.x, u.y);
    else {
      var s = { x: (o.x + u.x) * 0.5, y: (o.y + u.y) * 0.5 };
      t.moveTo(s.x, s.y);
    }
    for (var l = 0; l < i.length; ++l)
      if (a = o, o = u, u = i[(l + 1) % i.length], o.onCurve)
        t.lineTo(o.x, o.y);
      else {
        var f = a, c = u;
        a.onCurve || (f = { x: (o.x + a.x) * 0.5, y: (o.y + a.y) * 0.5 }), u.onCurve || (c = { x: (o.x + u.x) * 0.5, y: (o.y + u.y) * 0.5 }), t.quadraticCurveTo(o.x, o.y, c.x, c.y);
      }
    t.closePath();
  }
  return t;
}
__name(Js, "Js");
function Ks(e, t) {
  if (t.isComposite)
    for (var r = 0; r < t.components.length; r += 1) {
      var n = t.components[r], i = e.get(n.glyphIndex);
      if (i.getPath(), i.points) {
        var a = void 0;
        if (n.matchedPoints === void 0)
          a = Yi(i.points, n);
        else {
          if (n.matchedPoints[0] > t.points.length - 1 || n.matchedPoints[1] > i.points.length - 1)
            throw Error("Matched points out of range in " + t.name);
          var o = t.points[n.matchedPoints[0]], u = i.points[n.matchedPoints[1]], s = { xScale: n.xScale, scale01: n.scale01, scale10: n.scale10, yScale: n.yScale, dx: 0, dy: 0 };
          u = Yi([u], s)[0], s.dx = o.x - u.x, s.dy = o.y - u.y, a = Yi(i.points, s);
        }
        t.points = t.points.concat(a);
      }
    }
  return Js(t.points);
}
__name(Ks, "Ks");
function fh(e, t, r, n) {
  for (var i = new $t.GlyphSet(n), a = 0; a < r.length - 1; a += 1) {
    var o = r[a], u = r[a + 1];
    o !== u ? i.push(a, $t.ttfGlyphLoader(n, a, Zs, e, t + o, Ks)) : i.push(a, $t.glyphLoader(n, a));
  }
  return i;
}
__name(fh, "fh");
function ch(e, t, r, n) {
  var i = new $t.GlyphSet(n);
  return n._push = function(a) {
    var o = r[a], u = r[a + 1];
    o !== u ? i.push(a, $t.ttfGlyphLoader(n, a, Zs, e, t + o, Ks)) : i.push(a, $t.glyphLoader(n, a));
  }, i;
}
__name(ch, "ch");
function ph(e, t, r, n, i) {
  return i.lowMemory ? ch(e, t, r, n) : fh(e, t, r, n);
}
__name(ph, "ph");
var Qs = { getPath: Js, parse: ph };
var eu;
var Dr;
var tu;
var ra;
function ru(e) {
  this.font = e, this.getCommands = function(t) {
    return Qs.getPath(t).commands;
  }, this._fpgmState = this._prepState = void 0, this._errorState = 0;
}
__name(ru, "ru");
function hh(e) {
  return e;
}
__name(hh, "hh");
function nu(e) {
  return Math.sign(e) * Math.round(Math.abs(e));
}
__name(nu, "nu");
function dh(e) {
  return Math.sign(e) * Math.round(Math.abs(e * 2)) / 2;
}
__name(dh, "dh");
function vh(e) {
  return Math.sign(e) * (Math.round(Math.abs(e) + 0.5) - 0.5);
}
__name(vh, "vh");
function gh(e) {
  return Math.sign(e) * Math.ceil(Math.abs(e));
}
__name(gh, "gh");
function mh(e) {
  return Math.sign(e) * Math.floor(Math.abs(e));
}
__name(mh, "mh");
var iu = /* @__PURE__ */ __name(function(e) {
  var t = this.srPeriod, r = this.srPhase, n = this.srThreshold, i = 1;
  return e < 0 && (e = -e, i = -1), e += n - r, e = Math.trunc(e / t) * t, e += r, e < 0 ? r * i : e * i;
}, "iu");
var Wt = { x: 1, y: 0, axis: "x", distance: function(e, t, r, n) {
  return (r ? e.xo : e.x) - (n ? t.xo : t.x);
}, interpolate: function(e, t, r, n) {
  var i, a, o, u, s, l, f;
  if (!n || n === this) {
    if (i = e.xo - t.xo, a = e.xo - r.xo, s = t.x - t.xo, l = r.x - r.xo, o = Math.abs(i), u = Math.abs(a), f = o + u, f === 0) {
      e.x = e.xo + (s + l) / 2;
      return;
    }
    e.x = e.xo + (s * u + l * o) / f;
    return;
  }
  if (i = n.distance(e, t, true, true), a = n.distance(e, r, true, true), s = n.distance(t, t, false, true), l = n.distance(r, r, false, true), o = Math.abs(i), u = Math.abs(a), f = o + u, f === 0) {
    Wt.setRelative(e, e, (s + l) / 2, n, true);
    return;
  }
  Wt.setRelative(e, e, (s * u + l * o) / f, n, true);
}, normalSlope: Number.NEGATIVE_INFINITY, setRelative: function(e, t, r, n, i) {
  if (!n || n === this) {
    e.x = (i ? t.xo : t.x) + r;
    return;
  }
  var a = i ? t.xo : t.x, o = i ? t.yo : t.y, u = a + r * n.x, s = o + r * n.y;
  e.x = u + (e.y - s) / n.normalSlope;
}, slope: 0, touch: function(e) {
  e.xTouched = true;
}, touched: function(e) {
  return e.xTouched;
}, untouch: function(e) {
  e.xTouched = false;
} };
var Yt = { x: 0, y: 1, axis: "y", distance: function(e, t, r, n) {
  return (r ? e.yo : e.y) - (n ? t.yo : t.y);
}, interpolate: function(e, t, r, n) {
  var i, a, o, u, s, l, f;
  if (!n || n === this) {
    if (i = e.yo - t.yo, a = e.yo - r.yo, s = t.y - t.yo, l = r.y - r.yo, o = Math.abs(i), u = Math.abs(a), f = o + u, f === 0) {
      e.y = e.yo + (s + l) / 2;
      return;
    }
    e.y = e.yo + (s * u + l * o) / f;
    return;
  }
  if (i = n.distance(e, t, true, true), a = n.distance(e, r, true, true), s = n.distance(t, t, false, true), l = n.distance(r, r, false, true), o = Math.abs(i), u = Math.abs(a), f = o + u, f === 0) {
    Yt.setRelative(e, e, (s + l) / 2, n, true);
    return;
  }
  Yt.setRelative(e, e, (s * u + l * o) / f, n, true);
}, normalSlope: 0, setRelative: function(e, t, r, n, i) {
  if (!n || n === this) {
    e.y = (i ? t.yo : t.y) + r;
    return;
  }
  var a = i ? t.xo : t.x, o = i ? t.yo : t.y, u = a + r * n.x, s = o + r * n.y;
  e.y = s + n.normalSlope * (e.x - u);
}, slope: Number.POSITIVE_INFINITY, touch: function(e) {
  e.yTouched = true;
}, touched: function(e) {
  return e.yTouched;
}, untouch: function(e) {
  e.yTouched = false;
} };
Object.freeze(Wt);
Object.freeze(Yt);
function Vr(e, t) {
  this.x = e, this.y = t, this.axis = void 0, this.slope = t / e, this.normalSlope = -e / t, Object.freeze(this);
}
__name(Vr, "Vr");
Vr.prototype.distance = function(e, t, r, n) {
  return this.x * Wt.distance(e, t, r, n) + this.y * Yt.distance(e, t, r, n);
};
Vr.prototype.interpolate = function(e, t, r, n) {
  var i, a, o, u, s, l, f;
  if (o = n.distance(e, t, true, true), u = n.distance(e, r, true, true), i = n.distance(t, t, false, true), a = n.distance(r, r, false, true), s = Math.abs(o), l = Math.abs(u), f = s + l, f === 0) {
    this.setRelative(e, e, (i + a) / 2, n, true);
    return;
  }
  this.setRelative(e, e, (i * l + a * s) / f, n, true);
};
Vr.prototype.setRelative = function(e, t, r, n, i) {
  n = n || this;
  var a = i ? t.xo : t.x, o = i ? t.yo : t.y, u = a + r * n.x, s = o + r * n.y, l = n.normalSlope, f = this.slope, c = e.x, p = e.y;
  e.x = (f * c - l * u + s - p) / (f - l), e.y = f * (e.x - c) + p;
};
Vr.prototype.touch = function(e) {
  e.xTouched = true, e.yTouched = true;
};
function Hr(e, t) {
  var r = Math.sqrt(e * e + t * t);
  return e /= r, t /= r, e === 1 && t === 0 ? Wt : e === 0 && t === 1 ? Yt : new Vr(e, t);
}
__name(Hr, "Hr");
function Zt(e, t, r, n) {
  this.x = this.xo = Math.round(e * 64) / 64, this.y = this.yo = Math.round(t * 64) / 64, this.lastPointOfContour = r, this.onCurve = n, this.prevPointOnContour = void 0, this.nextPointOnContour = void 0, this.xTouched = false, this.yTouched = false, Object.preventExtensions(this);
}
__name(Zt, "Zt");
Zt.prototype.nextTouched = function(e) {
  for (var t = this.nextPointOnContour; !e.touched(t) && t !== this; )
    t = t.nextPointOnContour;
  return t;
};
Zt.prototype.prevTouched = function(e) {
  for (var t = this.prevPointOnContour; !e.touched(t) && t !== this; )
    t = t.prevPointOnContour;
  return t;
};
var Wr = Object.freeze(new Zt(0, 0));
var Dh = { cvCutIn: 17 / 16, deltaBase: 9, deltaShift: 0.125, loop: 1, minDis: 1, autoFlip: true };
function ur(e, t) {
  switch (this.env = e, this.stack = [], this.prog = t, e) {
    case "glyf":
      this.zp0 = this.zp1 = this.zp2 = 1, this.rp0 = this.rp1 = this.rp2 = 0;
    case "prep":
      this.fv = this.pv = this.dpv = Wt, this.round = nu;
  }
}
__name(ur, "ur");
ru.prototype.exec = function(e, t) {
  if (typeof t != "number")
    throw new Error("Point size is not a number!");
  if (!(this._errorState > 2)) {
    var r = this.font, n = this._prepState;
    if (!n || n.ppem !== t) {
      var i = this._fpgmState;
      if (!i) {
        ur.prototype = Dh, i = this._fpgmState = new ur("fpgm", r.tables.fpgm), i.funcs = [], i.font = r, exports.DEBUG && (console.log("---EXEC FPGM---"), i.step = -1);
        try {
          Dr(i);
        } catch (l) {
          console.log("Hinting error in FPGM:" + l), this._errorState = 3;
          return;
        }
      }
      ur.prototype = i, n = this._prepState = new ur("prep", r.tables.prep), n.ppem = t;
      var a = r.tables.cvt;
      if (a)
        for (var o = n.cvt = new Array(a.length), u = t / r.unitsPerEm, s = 0; s < a.length; s++)
          o[s] = a[s] * u;
      else
        n.cvt = [];
      exports.DEBUG && (console.log("---EXEC PREP---"), n.step = -1);
      try {
        Dr(n);
      } catch (l) {
        this._errorState < 2 && console.log("Hinting error in PREP:" + l), this._errorState = 2;
      }
    }
    if (!(this._errorState > 1))
      try {
        return tu(e, n);
      } catch (l) {
        this._errorState < 1 && (console.log("Hinting error:" + l), console.log("Note: further hinting errors are silenced")), this._errorState = 1;
        return;
      }
  }
};
tu = /* @__PURE__ */ __name(function(e, t) {
  var r = t.ppem / t.font.unitsPerEm, n = r, i = e.components, a, o, u;
  if (ur.prototype = t, !i)
    u = new ur("glyf", e.instructions), exports.DEBUG && (console.log("---EXEC GLYPH---"), u.step = -1), ra(e, u, r, n), o = u.gZone;
  else {
    var s = t.font;
    o = [], a = [];
    for (var l = 0; l < i.length; l++) {
      var f = i[l], c = s.glyphs.get(f.glyphIndex);
      u = new ur("glyf", c.instructions), exports.DEBUG && (console.log("---EXEC COMP " + l + "---"), u.step = -1), ra(c, u, r, n);
      for (var p = Math.round(f.dx * r), d = Math.round(f.dy * n), D = u.gZone, v = u.contours, g = 0; g < D.length; g++) {
        var y = D[g];
        y.xTouched = y.yTouched = false, y.xo = y.x = y.x + p, y.yo = y.y = y.y + d;
      }
      var b = o.length;
      o.push.apply(o, D);
      for (var C = 0; C < v.length; C++)
        a.push(v[C] + b);
    }
    e.instructions && !u.inhibitGridFit && (u = new ur("glyf", e.instructions), u.gZone = u.z0 = u.z1 = u.z2 = o, u.contours = a, o.push(new Zt(0, 0), new Zt(Math.round(e.advanceWidth * r), 0)), exports.DEBUG && (console.log("---EXEC COMPOSITE---"), u.step = -1), Dr(u), o.length -= 2);
  }
  return o;
}, "tu");
ra = /* @__PURE__ */ __name(function(e, t, r, n) {
  for (var i = e.points || [], a = i.length, o = t.gZone = t.z0 = t.z1 = t.z2 = [], u = t.contours = [], s, l = 0; l < a; l++)
    s = i[l], o[l] = new Zt(s.x * r, s.y * n, s.lastPointOfContour, s.onCurve);
  for (var f, c, p = 0; p < a; p++)
    s = o[p], f || (f = s, u.push(p)), s.lastPointOfContour ? (s.nextPointOnContour = f, f.prevPointOnContour = s, f = void 0) : (c = o[p + 1], s.nextPointOnContour = c, c.prevPointOnContour = s);
  if (!t.inhibitGridFit) {
    if (exports.DEBUG) {
      console.log("PROCESSING GLYPH", t.stack);
      for (var d = 0; d < a; d++)
        console.log(d, o[d].x, o[d].y);
    }
    if (o.push(new Zt(0, 0), new Zt(Math.round(e.advanceWidth * r), 0)), Dr(t), o.length -= 2, exports.DEBUG) {
      console.log("FINISHED GLYPH", t.stack);
      for (var D = 0; D < a; D++)
        console.log(D, o[D].x, o[D].y);
    }
  }
}, "ra");
Dr = /* @__PURE__ */ __name(function(e) {
  var t = e.prog;
  if (t) {
    var r = t.length, n;
    for (e.ip = 0; e.ip < r; e.ip++) {
      if (exports.DEBUG && e.step++, n = eu[t[e.ip]], !n)
        throw new Error("unknown instruction: 0x" + Number(t[e.ip]).toString(16));
      n(e);
    }
  }
}, "Dr");
function _n(e) {
  for (var t = e.tZone = new Array(e.gZone.length), r = 0; r < t.length; r++)
    t[r] = new Zt(0, 0);
}
__name(_n, "_n");
function au(e, t) {
  var r = e.prog, n = e.ip, i = 1, a;
  do
    if (a = r[++n], a === 88)
      i++;
    else if (a === 89)
      i--;
    else if (a === 64)
      n += r[n + 1] + 1;
    else if (a === 65)
      n += 2 * r[n + 1] + 1;
    else if (a >= 176 && a <= 183)
      n += a - 176 + 1;
    else if (a >= 184 && a <= 191)
      n += (a - 184 + 1) * 2;
    else if (t && i === 1 && a === 27)
      break;
  while (i > 0);
  e.ip = n;
}
__name(au, "au");
function Ds(e, t) {
  exports.DEBUG && console.log(t.step, "SVTCA[" + e.axis + "]"), t.fv = t.pv = t.dpv = e;
}
__name(Ds, "Ds");
function ys(e, t) {
  exports.DEBUG && console.log(t.step, "SPVTCA[" + e.axis + "]"), t.pv = t.dpv = e;
}
__name(ys, "ys");
function bs(e, t) {
  exports.DEBUG && console.log(t.step, "SFVTCA[" + e.axis + "]"), t.fv = e;
}
__name(bs, "bs");
function xs(e, t) {
  var r = t.stack, n = r.pop(), i = r.pop(), a = t.z2[n], o = t.z1[i];
  exports.DEBUG && console.log("SPVTL[" + e + "]", n, i);
  var u, s;
  e ? (u = a.y - o.y, s = o.x - a.x) : (u = o.x - a.x, s = o.y - a.y), t.pv = t.dpv = Hr(u, s);
}
__name(xs, "xs");
function ws(e, t) {
  var r = t.stack, n = r.pop(), i = r.pop(), a = t.z2[n], o = t.z1[i];
  exports.DEBUG && console.log("SFVTL[" + e + "]", n, i);
  var u, s;
  e ? (u = a.y - o.y, s = o.x - a.x) : (u = o.x - a.x, s = o.y - a.y), t.fv = Hr(u, s);
}
__name(ws, "ws");
function yh(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "SPVFS[]", r, n), e.pv = e.dpv = Hr(n, r);
}
__name(yh, "yh");
function bh(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "SPVFS[]", r, n), e.fv = Hr(n, r);
}
__name(bh, "bh");
function xh(e) {
  var t = e.stack, r = e.pv;
  exports.DEBUG && console.log(e.step, "GPV[]"), t.push(r.x * 16384), t.push(r.y * 16384);
}
__name(xh, "xh");
function wh(e) {
  var t = e.stack, r = e.fv;
  exports.DEBUG && console.log(e.step, "GFV[]"), t.push(r.x * 16384), t.push(r.y * 16384);
}
__name(wh, "wh");
function Eh(e) {
  e.fv = e.pv, exports.DEBUG && console.log(e.step, "SFVTPV[]");
}
__name(Eh, "Eh");
function Fh(e) {
  var t = e.stack, r = t.pop(), n = t.pop(), i = t.pop(), a = t.pop(), o = t.pop(), u = e.z0, s = e.z1, l = u[r], f = u[n], c = s[i], p = s[a], d = e.z2[o];
  exports.DEBUG && console.log("ISECT[], ", r, n, i, a, o);
  var D = l.x, v = l.y, g = f.x, y = f.y, b = c.x, C = c.y, k = p.x, S = p.y, E = (D - g) * (C - S) - (v - y) * (b - k), L = D * y - v * g, T = b * S - C * k;
  d.x = (L * (b - k) - T * (D - g)) / E, d.y = (L * (C - S) - T * (v - y)) / E;
}
__name(Fh, "Fh");
function Ch(e) {
  e.rp0 = e.stack.pop(), exports.DEBUG && console.log(e.step, "SRP0[]", e.rp0);
}
__name(Ch, "Ch");
function Sh(e) {
  e.rp1 = e.stack.pop(), exports.DEBUG && console.log(e.step, "SRP1[]", e.rp1);
}
__name(Sh, "Sh");
function kh(e) {
  e.rp2 = e.stack.pop(), exports.DEBUG && console.log(e.step, "SRP2[]", e.rp2);
}
__name(kh, "kh");
function Th(e) {
  var t = e.stack.pop();
  switch (exports.DEBUG && console.log(e.step, "SZP0[]", t), e.zp0 = t, t) {
    case 0:
      e.tZone || _n(e), e.z0 = e.tZone;
      break;
    case 1:
      e.z0 = e.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
__name(Th, "Th");
function _h(e) {
  var t = e.stack.pop();
  switch (exports.DEBUG && console.log(e.step, "SZP1[]", t), e.zp1 = t, t) {
    case 0:
      e.tZone || _n(e), e.z1 = e.tZone;
      break;
    case 1:
      e.z1 = e.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
__name(_h, "_h");
function Ah(e) {
  var t = e.stack.pop();
  switch (exports.DEBUG && console.log(e.step, "SZP2[]", t), e.zp2 = t, t) {
    case 0:
      e.tZone || _n(e), e.z2 = e.tZone;
      break;
    case 1:
      e.z2 = e.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
__name(Ah, "Ah");
function Oh(e) {
  var t = e.stack.pop();
  switch (exports.DEBUG && console.log(e.step, "SZPS[]", t), e.zp0 = e.zp1 = e.zp2 = t, t) {
    case 0:
      e.tZone || _n(e), e.z0 = e.z1 = e.z2 = e.tZone;
      break;
    case 1:
      e.z0 = e.z1 = e.z2 = e.gZone;
      break;
    default:
      throw new Error("Invalid zone pointer");
  }
}
__name(Oh, "Oh");
function Lh(e) {
  e.loop = e.stack.pop(), exports.DEBUG && console.log(e.step, "SLOOP[]", e.loop);
}
__name(Lh, "Lh");
function Ih(e) {
  exports.DEBUG && console.log(e.step, "RTG[]"), e.round = nu;
}
__name(Ih, "Ih");
function Ph(e) {
  exports.DEBUG && console.log(e.step, "RTHG[]"), e.round = vh;
}
__name(Ph, "Ph");
function Rh(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "SMD[]", t), e.minDis = t / 64;
}
__name(Rh, "Rh");
function Uh(e) {
  exports.DEBUG && console.log(e.step, "ELSE[]"), au(e, false);
}
__name(Uh, "Uh");
function Bh(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "JMPR[]", t), e.ip += t - 1;
}
__name(Bh, "Bh");
function Nh(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "SCVTCI[]", t), e.cvCutIn = t / 64;
}
__name(Nh, "Nh");
function Mh(e) {
  var t = e.stack;
  exports.DEBUG && console.log(e.step, "DUP[]"), t.push(t[t.length - 1]);
}
__name(Mh, "Mh");
function Zi(e) {
  exports.DEBUG && console.log(e.step, "POP[]"), e.stack.pop();
}
__name(Zi, "Zi");
function Gh(e) {
  exports.DEBUG && console.log(e.step, "CLEAR[]"), e.stack.length = 0;
}
__name(Gh, "Gh");
function Wh(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "SWAP[]"), t.push(r), t.push(n);
}
__name(Wh, "Wh");
function $h(e) {
  var t = e.stack;
  exports.DEBUG && console.log(e.step, "DEPTH[]"), t.push(t.length);
}
__name($h, "$h");
function jh(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "LOOPCALL[]", r, n);
  var i = e.ip, a = e.prog;
  e.prog = e.funcs[r];
  for (var o = 0; o < n; o++)
    Dr(e), exports.DEBUG && console.log(++e.step, o + 1 < n ? "next loopcall" : "done loopcall", o);
  e.ip = i, e.prog = a;
}
__name(jh, "jh");
function zh(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "CALL[]", t);
  var r = e.ip, n = e.prog;
  e.prog = e.funcs[t], Dr(e), e.ip = r, e.prog = n, exports.DEBUG && console.log(++e.step, "returning from", t);
}
__name(zh, "zh");
function Vh(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "CINDEX[]", r), t.push(t[t.length - r]);
}
__name(Vh, "Vh");
function Hh(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "MINDEX[]", r), t.push(t.splice(t.length - r, 1)[0]);
}
__name(Hh, "Hh");
function Xh(e) {
  if (e.env !== "fpgm")
    throw new Error("FDEF not allowed here");
  var t = e.stack, r = e.prog, n = e.ip, i = t.pop(), a = n;
  for (exports.DEBUG && console.log(e.step, "FDEF[]", i); r[++n] !== 45; )
    ;
  e.ip = n, e.funcs[i] = r.slice(a + 1, n);
}
__name(Xh, "Xh");
function Es(e, t) {
  var r = t.stack.pop(), n = t.z0[r], i = t.fv, a = t.pv;
  exports.DEBUG && console.log(t.step, "MDAP[" + e + "]", r);
  var o = a.distance(n, Wr);
  e && (o = t.round(o)), i.setRelative(n, Wr, o, a), i.touch(n), t.rp0 = t.rp1 = r;
}
__name(Es, "Es");
function Fs(e, t) {
  var r = t.z2, n = r.length - 2, i, a, o;
  exports.DEBUG && console.log(t.step, "IUP[" + e.axis + "]");
  for (var u = 0; u < n; u++)
    i = r[u], !e.touched(i) && (a = i.prevTouched(e), a !== i && (o = i.nextTouched(e), a === o && e.setRelative(i, i, e.distance(a, a, false, true), e, true), e.interpolate(i, a, o, e)));
}
__name(Fs, "Fs");
function Cs(e, t) {
  for (var r = t.stack, n = e ? t.rp1 : t.rp2, i = (e ? t.z0 : t.z1)[n], a = t.fv, o = t.pv, u = t.loop, s = t.z2; u--; ) {
    var l = r.pop(), f = s[l], c = o.distance(i, i, false, true);
    a.setRelative(f, f, c, o), a.touch(f), exports.DEBUG && console.log(t.step, (t.loop > 1 ? "loop " + (t.loop - u) + ": " : "") + "SHP[" + (e ? "rp1" : "rp2") + "]", l);
  }
  t.loop = 1;
}
__name(Cs, "Cs");
function Ss(e, t) {
  var r = t.stack, n = e ? t.rp1 : t.rp2, i = (e ? t.z0 : t.z1)[n], a = t.fv, o = t.pv, u = r.pop(), s = t.z2[t.contours[u]], l = s;
  exports.DEBUG && console.log(t.step, "SHC[" + e + "]", u);
  var f = o.distance(i, i, false, true);
  do
    l !== i && a.setRelative(l, l, f, o), l = l.nextPointOnContour;
  while (l !== s);
}
__name(Ss, "Ss");
function ks(e, t) {
  var r = t.stack, n = e ? t.rp1 : t.rp2, i = (e ? t.z0 : t.z1)[n], a = t.fv, o = t.pv, u = r.pop();
  exports.DEBUG && console.log(t.step, "SHZ[" + e + "]", u);
  var s;
  switch (u) {
    case 0:
      s = t.tZone;
      break;
    case 1:
      s = t.gZone;
      break;
    default:
      throw new Error("Invalid zone");
  }
  for (var l, f = o.distance(i, i, false, true), c = s.length - 2, p = 0; p < c; p++)
    l = s[p], a.setRelative(l, l, f, o);
}
__name(ks, "ks");
function qh(e) {
  for (var t = e.stack, r = e.loop, n = e.fv, i = t.pop() / 64, a = e.z2; r--; ) {
    var o = t.pop(), u = a[o];
    exports.DEBUG && console.log(e.step, (e.loop > 1 ? "loop " + (e.loop - r) + ": " : "") + "SHPIX[]", o, i), n.setRelative(u, u, i), n.touch(u);
  }
  e.loop = 1;
}
__name(qh, "qh");
function Yh(e) {
  for (var t = e.stack, r = e.rp1, n = e.rp2, i = e.loop, a = e.z0[r], o = e.z1[n], u = e.fv, s = e.dpv, l = e.z2; i--; ) {
    var f = t.pop(), c = l[f];
    exports.DEBUG && console.log(e.step, (e.loop > 1 ? "loop " + (e.loop - i) + ": " : "") + "IP[]", f, r, "<->", n), u.interpolate(c, a, o, s), u.touch(c);
  }
  e.loop = 1;
}
__name(Yh, "Yh");
function Ts(e, t) {
  var r = t.stack, n = r.pop() / 64, i = r.pop(), a = t.z1[i], o = t.z0[t.rp0], u = t.fv, s = t.pv;
  u.setRelative(a, o, n, s), u.touch(a), exports.DEBUG && console.log(t.step, "MSIRP[" + e + "]", n, i), t.rp1 = t.rp0, t.rp2 = i, e && (t.rp0 = i);
}
__name(Ts, "Ts");
function Zh(e) {
  for (var t = e.stack, r = e.rp0, n = e.z0[r], i = e.loop, a = e.fv, o = e.pv, u = e.z1; i--; ) {
    var s = t.pop(), l = u[s];
    exports.DEBUG && console.log(e.step, (e.loop > 1 ? "loop " + (e.loop - i) + ": " : "") + "ALIGNRP[]", s), a.setRelative(l, n, 0, o), a.touch(l);
  }
  e.loop = 1;
}
__name(Zh, "Zh");
function Jh(e) {
  exports.DEBUG && console.log(e.step, "RTDG[]"), e.round = dh;
}
__name(Jh, "Jh");
function _s(e, t) {
  var r = t.stack, n = r.pop(), i = r.pop(), a = t.z0[i], o = t.fv, u = t.pv, s = t.cvt[n];
  exports.DEBUG && console.log(t.step, "MIAP[" + e + "]", n, "(", s, ")", i);
  var l = u.distance(a, Wr);
  e && (Math.abs(l - s) < t.cvCutIn && (l = s), l = t.round(l)), o.setRelative(a, Wr, l, u), t.zp0 === 0 && (a.xo = a.x, a.yo = a.y), o.touch(a), t.rp0 = t.rp1 = i;
}
__name(_s, "_s");
function Kh(e) {
  var t = e.prog, r = e.ip, n = e.stack, i = t[++r];
  exports.DEBUG && console.log(e.step, "NPUSHB[]", i);
  for (var a = 0; a < i; a++)
    n.push(t[++r]);
  e.ip = r;
}
__name(Kh, "Kh");
function Qh(e) {
  var t = e.ip, r = e.prog, n = e.stack, i = r[++t];
  exports.DEBUG && console.log(e.step, "NPUSHW[]", i);
  for (var a = 0; a < i; a++) {
    var o = r[++t] << 8 | r[++t];
    o & 32768 && (o = -((o ^ 65535) + 1)), n.push(o);
  }
  e.ip = t;
}
__name(Qh, "Qh");
function ed(e) {
  var t = e.stack, r = e.store;
  r || (r = e.store = []);
  var n = t.pop(), i = t.pop();
  exports.DEBUG && console.log(e.step, "WS", n, i), r[i] = n;
}
__name(ed, "ed");
function td(e) {
  var t = e.stack, r = e.store, n = t.pop();
  exports.DEBUG && console.log(e.step, "RS", n);
  var i = r && r[n] || 0;
  t.push(i);
}
__name(td, "td");
function rd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "WCVTP", r, n), e.cvt[n] = r / 64;
}
__name(rd, "rd");
function nd(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "RCVT", r), t.push(e.cvt[r] * 64);
}
__name(nd, "nd");
function As(e, t) {
  var r = t.stack, n = r.pop(), i = t.z2[n];
  exports.DEBUG && console.log(t.step, "GC[" + e + "]", n), r.push(t.dpv.distance(i, Wr, e, false) * 64);
}
__name(As, "As");
function Os(e, t) {
  var r = t.stack, n = r.pop(), i = r.pop(), a = t.z1[n], o = t.z0[i], u = t.dpv.distance(o, a, e, e);
  exports.DEBUG && console.log(t.step, "MD[" + e + "]", n, i, "->", u), t.stack.push(Math.round(u * 64));
}
__name(Os, "Os");
function id(e) {
  exports.DEBUG && console.log(e.step, "MPPEM[]"), e.stack.push(e.ppem);
}
__name(id, "id");
function ad(e) {
  exports.DEBUG && console.log(e.step, "FLIPON[]"), e.autoFlip = true;
}
__name(ad, "ad");
function od(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "LT[]", r, n), t.push(n < r ? 1 : 0);
}
__name(od, "od");
function sd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "LTEQ[]", r, n), t.push(n <= r ? 1 : 0);
}
__name(sd, "sd");
function ud(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "GT[]", r, n), t.push(n > r ? 1 : 0);
}
__name(ud, "ud");
function ld(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "GTEQ[]", r, n), t.push(n >= r ? 1 : 0);
}
__name(ld, "ld");
function fd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "EQ[]", r, n), t.push(r === n ? 1 : 0);
}
__name(fd, "fd");
function cd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "NEQ[]", r, n), t.push(r !== n ? 1 : 0);
}
__name(cd, "cd");
function pd(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "ODD[]", r), t.push(Math.trunc(r) % 2 ? 1 : 0);
}
__name(pd, "pd");
function hd(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "EVEN[]", r), t.push(Math.trunc(r) % 2 ? 0 : 1);
}
__name(hd, "hd");
function dd(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "IF[]", t), t || (au(e, true), exports.DEBUG && console.log(e.step, "EIF[]"));
}
__name(dd, "dd");
function vd(e) {
  exports.DEBUG && console.log(e.step, "EIF[]");
}
__name(vd, "vd");
function gd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "AND[]", r, n), t.push(r && n ? 1 : 0);
}
__name(gd, "gd");
function md(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "OR[]", r, n), t.push(r || n ? 1 : 0);
}
__name(md, "md");
function Dd(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "NOT[]", r), t.push(r ? 0 : 1);
}
__name(Dd, "Dd");
function Ji(e, t) {
  var r = t.stack, n = r.pop(), i = t.fv, a = t.pv, o = t.ppem, u = t.deltaBase + (e - 1) * 16, s = t.deltaShift, l = t.z0;
  exports.DEBUG && console.log(t.step, "DELTAP[" + e + "]", n, r);
  for (var f = 0; f < n; f++) {
    var c = r.pop(), p = r.pop(), d = u + ((p & 240) >> 4);
    if (d === o) {
      var D = (p & 15) - 8;
      D >= 0 && D++, exports.DEBUG && console.log(t.step, "DELTAPFIX", c, "by", D * s);
      var v = l[c];
      i.setRelative(v, v, D * s, a);
    }
  }
}
__name(Ji, "Ji");
function yd(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "SDB[]", r), e.deltaBase = r;
}
__name(yd, "yd");
function bd(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "SDS[]", r), e.deltaShift = Math.pow(0.5, r);
}
__name(bd, "bd");
function xd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "ADD[]", r, n), t.push(n + r);
}
__name(xd, "xd");
function wd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "SUB[]", r, n), t.push(n - r);
}
__name(wd, "wd");
function Ed(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "DIV[]", r, n), t.push(n * 64 / r);
}
__name(Ed, "Ed");
function Fd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "MUL[]", r, n), t.push(n * r / 64);
}
__name(Fd, "Fd");
function Cd(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "ABS[]", r), t.push(Math.abs(r));
}
__name(Cd, "Cd");
function Sd(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "NEG[]", r), t.push(-r);
}
__name(Sd, "Sd");
function kd(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "FLOOR[]", r), t.push(Math.floor(r / 64) * 64);
}
__name(kd, "kd");
function Td(e) {
  var t = e.stack, r = t.pop();
  exports.DEBUG && console.log(e.step, "CEILING[]", r), t.push(Math.ceil(r / 64) * 64);
}
__name(Td, "Td");
function Cn(e, t) {
  var r = t.stack, n = r.pop();
  exports.DEBUG && console.log(t.step, "ROUND[]"), r.push(t.round(n / 64) * 64);
}
__name(Cn, "Cn");
function _d(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "WCVTF[]", r, n), e.cvt[n] = r * e.ppem / e.font.unitsPerEm;
}
__name(_d, "_d");
function Ki(e, t) {
  var r = t.stack, n = r.pop(), i = t.ppem, a = t.deltaBase + (e - 1) * 16, o = t.deltaShift;
  exports.DEBUG && console.log(t.step, "DELTAC[" + e + "]", n, r);
  for (var u = 0; u < n; u++) {
    var s = r.pop(), l = r.pop(), f = a + ((l & 240) >> 4);
    if (f === i) {
      var c = (l & 15) - 8;
      c >= 0 && c++;
      var p = c * o;
      exports.DEBUG && console.log(t.step, "DELTACFIX", s, "by", p), t.cvt[s] += p;
    }
  }
}
__name(Ki, "Ki");
function Ad(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "SROUND[]", t), e.round = iu;
  var r;
  switch (t & 192) {
    case 0:
      r = 0.5;
      break;
    case 64:
      r = 1;
      break;
    case 128:
      r = 2;
      break;
    default:
      throw new Error("invalid SROUND value");
  }
  switch (e.srPeriod = r, t & 48) {
    case 0:
      e.srPhase = 0;
      break;
    case 16:
      e.srPhase = 0.25 * r;
      break;
    case 32:
      e.srPhase = 0.5 * r;
      break;
    case 48:
      e.srPhase = 0.75 * r;
      break;
    default:
      throw new Error("invalid SROUND value");
  }
  t &= 15, t === 0 ? e.srThreshold = 0 : e.srThreshold = (t / 8 - 0.5) * r;
}
__name(Ad, "Ad");
function Od(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "S45ROUND[]", t), e.round = iu;
  var r;
  switch (t & 192) {
    case 0:
      r = Math.sqrt(2) / 2;
      break;
    case 64:
      r = Math.sqrt(2);
      break;
    case 128:
      r = 2 * Math.sqrt(2);
      break;
    default:
      throw new Error("invalid S45ROUND value");
  }
  switch (e.srPeriod = r, t & 48) {
    case 0:
      e.srPhase = 0;
      break;
    case 16:
      e.srPhase = 0.25 * r;
      break;
    case 32:
      e.srPhase = 0.5 * r;
      break;
    case 48:
      e.srPhase = 0.75 * r;
      break;
    default:
      throw new Error("invalid S45ROUND value");
  }
  t &= 15, t === 0 ? e.srThreshold = 0 : e.srThreshold = (t / 8 - 0.5) * r;
}
__name(Od, "Od");
function Ld(e) {
  exports.DEBUG && console.log(e.step, "ROFF[]"), e.round = hh;
}
__name(Ld, "Ld");
function Id(e) {
  exports.DEBUG && console.log(e.step, "RUTG[]"), e.round = gh;
}
__name(Id, "Id");
function Pd(e) {
  exports.DEBUG && console.log(e.step, "RDTG[]"), e.round = mh;
}
__name(Pd, "Pd");
function Rd(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "SCANCTRL[]", t);
}
__name(Rd, "Rd");
function Ls(e, t) {
  var r = t.stack, n = r.pop(), i = r.pop(), a = t.z2[n], o = t.z1[i];
  exports.DEBUG && console.log(t.step, "SDPVTL[" + e + "]", n, i);
  var u, s;
  e ? (u = a.y - o.y, s = o.x - a.x) : (u = o.x - a.x, s = o.y - a.y), t.dpv = Hr(u, s);
}
__name(Ls, "Ls");
function Ud(e) {
  var t = e.stack, r = t.pop(), n = 0;
  exports.DEBUG && console.log(e.step, "GETINFO[]", r), r & 1 && (n = 35), r & 32 && (n |= 4096), t.push(n);
}
__name(Ud, "Ud");
function Bd(e) {
  var t = e.stack, r = t.pop(), n = t.pop(), i = t.pop();
  exports.DEBUG && console.log(e.step, "ROLL[]"), t.push(n), t.push(r), t.push(i);
}
__name(Bd, "Bd");
function Nd(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "MAX[]", r, n), t.push(Math.max(n, r));
}
__name(Nd, "Nd");
function Md(e) {
  var t = e.stack, r = t.pop(), n = t.pop();
  exports.DEBUG && console.log(e.step, "MIN[]", r, n), t.push(Math.min(n, r));
}
__name(Md, "Md");
function Gd(e) {
  var t = e.stack.pop();
  exports.DEBUG && console.log(e.step, "SCANTYPE[]", t);
}
__name(Gd, "Gd");
function Wd(e) {
  var t = e.stack.pop(), r = e.stack.pop();
  switch (exports.DEBUG && console.log(e.step, "INSTCTRL[]", t, r), t) {
    case 1:
      e.inhibitGridFit = !!r;
      return;
    case 2:
      e.ignoreCvt = !!r;
      return;
    default:
      throw new Error("invalid INSTCTRL[] selector");
  }
}
__name(Wd, "Wd");
function ir(e, t) {
  var r = t.stack, n = t.prog, i = t.ip;
  exports.DEBUG && console.log(t.step, "PUSHB[" + e + "]");
  for (var a = 0; a < e; a++)
    r.push(n[++i]);
  t.ip = i;
}
__name(ir, "ir");
function ar(e, t) {
  var r = t.ip, n = t.prog, i = t.stack;
  exports.DEBUG && console.log(t.ip, "PUSHW[" + e + "]");
  for (var a = 0; a < e; a++) {
    var o = n[++r] << 8 | n[++r];
    o & 32768 && (o = -((o ^ 65535) + 1)), i.push(o);
  }
  t.ip = r;
}
__name(ar, "ar");
function oe(e, t, r, n, i, a) {
  var o = a.stack, u = e && o.pop(), s = o.pop(), l = a.rp0, f = a.z0[l], c = a.z1[s], p = a.minDis, d = a.fv, D = a.dpv, v, g, y, b;
  g = v = D.distance(c, f, true, true), y = g >= 0 ? 1 : -1, g = Math.abs(g), e && (b = a.cvt[u], n && Math.abs(g - b) < a.cvCutIn && (g = b)), r && g < p && (g = p), n && (g = a.round(g)), d.setRelative(c, f, y * g, D), d.touch(c), exports.DEBUG && console.log(a.step, (e ? "MIRP[" : "MDRP[") + (t ? "M" : "m") + (r ? ">" : "_") + (n ? "R" : "_") + (i === 0 ? "Gr" : i === 1 ? "Bl" : i === 2 ? "Wh" : "") + "]", e ? u + "(" + a.cvt[u] + "," + b + ")" : "", s, "(d =", v, "->", y * g, ")"), a.rp1 = a.rp0, a.rp2 = s, t && (a.rp0 = s);
}
__name(oe, "oe");
eu = [Ds.bind(void 0, Yt), Ds.bind(void 0, Wt), ys.bind(void 0, Yt), ys.bind(void 0, Wt), bs.bind(void 0, Yt), bs.bind(void 0, Wt), xs.bind(void 0, 0), xs.bind(void 0, 1), ws.bind(void 0, 0), ws.bind(void 0, 1), yh, bh, xh, wh, Eh, Fh, Ch, Sh, kh, Th, _h, Ah, Oh, Lh, Ih, Ph, Rh, Uh, Bh, Nh, void 0, void 0, Mh, Zi, Gh, Wh, $h, Vh, Hh, void 0, void 0, void 0, jh, zh, Xh, void 0, Es.bind(void 0, 0), Es.bind(void 0, 1), Fs.bind(void 0, Yt), Fs.bind(void 0, Wt), Cs.bind(void 0, 0), Cs.bind(void 0, 1), Ss.bind(void 0, 0), Ss.bind(void 0, 1), ks.bind(void 0, 0), ks.bind(void 0, 1), qh, Yh, Ts.bind(void 0, 0), Ts.bind(void 0, 1), Zh, Jh, _s.bind(void 0, 0), _s.bind(void 0, 1), Kh, Qh, ed, td, rd, nd, As.bind(void 0, 0), As.bind(void 0, 1), void 0, Os.bind(void 0, 0), Os.bind(void 0, 1), id, void 0, ad, void 0, void 0, od, sd, ud, ld, fd, cd, pd, hd, dd, vd, gd, md, Dd, Ji.bind(void 0, 1), yd, bd, xd, wd, Ed, Fd, Cd, Sd, kd, Td, Cn.bind(void 0, 0), Cn.bind(void 0, 1), Cn.bind(void 0, 2), Cn.bind(void 0, 3), void 0, void 0, void 0, void 0, _d, Ji.bind(void 0, 2), Ji.bind(void 0, 3), Ki.bind(void 0, 1), Ki.bind(void 0, 2), Ki.bind(void 0, 3), Ad, Od, void 0, void 0, Ld, void 0, Id, Pd, Zi, Zi, void 0, void 0, void 0, void 0, void 0, Rd, Ls.bind(void 0, 0), Ls.bind(void 0, 1), Ud, void 0, Bd, Nd, Md, Gd, Wd, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, void 0, ir.bind(void 0, 1), ir.bind(void 0, 2), ir.bind(void 0, 3), ir.bind(void 0, 4), ir.bind(void 0, 5), ir.bind(void 0, 6), ir.bind(void 0, 7), ir.bind(void 0, 8), ar.bind(void 0, 1), ar.bind(void 0, 2), ar.bind(void 0, 3), ar.bind(void 0, 4), ar.bind(void 0, 5), ar.bind(void 0, 6), ar.bind(void 0, 7), ar.bind(void 0, 8), oe.bind(void 0, 0, 0, 0, 0, 0), oe.bind(void 0, 0, 0, 0, 0, 1), oe.bind(void 0, 0, 0, 0, 0, 2), oe.bind(void 0, 0, 0, 0, 0, 3), oe.bind(void 0, 0, 0, 0, 1, 0), oe.bind(void 0, 0, 0, 0, 1, 1), oe.bind(void 0, 0, 0, 0, 1, 2), oe.bind(void 0, 0, 0, 0, 1, 3), oe.bind(void 0, 0, 0, 1, 0, 0), oe.bind(void 0, 0, 0, 1, 0, 1), oe.bind(void 0, 0, 0, 1, 0, 2), oe.bind(void 0, 0, 0, 1, 0, 3), oe.bind(void 0, 0, 0, 1, 1, 0), oe.bind(void 0, 0, 0, 1, 1, 1), oe.bind(void 0, 0, 0, 1, 1, 2), oe.bind(void 0, 0, 0, 1, 1, 3), oe.bind(void 0, 0, 1, 0, 0, 0), oe.bind(void 0, 0, 1, 0, 0, 1), oe.bind(void 0, 0, 1, 0, 0, 2), oe.bind(void 0, 0, 1, 0, 0, 3), oe.bind(void 0, 0, 1, 0, 1, 0), oe.bind(void 0, 0, 1, 0, 1, 1), oe.bind(void 0, 0, 1, 0, 1, 2), oe.bind(void 0, 0, 1, 0, 1, 3), oe.bind(void 0, 0, 1, 1, 0, 0), oe.bind(void 0, 0, 1, 1, 0, 1), oe.bind(void 0, 0, 1, 1, 0, 2), oe.bind(void 0, 0, 1, 1, 0, 3), oe.bind(void 0, 0, 1, 1, 1, 0), oe.bind(void 0, 0, 1, 1, 1, 1), oe.bind(void 0, 0, 1, 1, 1, 2), oe.bind(void 0, 0, 1, 1, 1, 3), oe.bind(void 0, 1, 0, 0, 0, 0), oe.bind(void 0, 1, 0, 0, 0, 1), oe.bind(void 0, 1, 0, 0, 0, 2), oe.bind(void 0, 1, 0, 0, 0, 3), oe.bind(void 0, 1, 0, 0, 1, 0), oe.bind(void 0, 1, 0, 0, 1, 1), oe.bind(void 0, 1, 0, 0, 1, 2), oe.bind(void 0, 1, 0, 0, 1, 3), oe.bind(void 0, 1, 0, 1, 0, 0), oe.bind(void 0, 1, 0, 1, 0, 1), oe.bind(void 0, 1, 0, 1, 0, 2), oe.bind(void 0, 1, 0, 1, 0, 3), oe.bind(void 0, 1, 0, 1, 1, 0), oe.bind(void 0, 1, 0, 1, 1, 1), oe.bind(void 0, 1, 0, 1, 1, 2), oe.bind(void 0, 1, 0, 1, 1, 3), oe.bind(void 0, 1, 1, 0, 0, 0), oe.bind(void 0, 1, 1, 0, 0, 1), oe.bind(void 0, 1, 1, 0, 0, 2), oe.bind(void 0, 1, 1, 0, 0, 3), oe.bind(void 0, 1, 1, 0, 1, 0), oe.bind(void 0, 1, 1, 0, 1, 1), oe.bind(void 0, 1, 1, 0, 1, 2), oe.bind(void 0, 1, 1, 0, 1, 3), oe.bind(void 0, 1, 1, 1, 0, 0), oe.bind(void 0, 1, 1, 1, 0, 1), oe.bind(void 0, 1, 1, 1, 0, 2), oe.bind(void 0, 1, 1, 1, 0, 3), oe.bind(void 0, 1, 1, 1, 1, 0), oe.bind(void 0, 1, 1, 1, 1, 1), oe.bind(void 0, 1, 1, 1, 1, 2), oe.bind(void 0, 1, 1, 1, 1, 3)];
function Ar(e) {
  this.char = e, this.state = {}, this.activeState = null;
}
__name(Ar, "Ar");
function sa(e, t, r) {
  this.contextName = r, this.startIndex = e, this.endOffset = t;
}
__name(sa, "sa");
function $d(e, t, r) {
  this.contextName = e, this.openRange = null, this.ranges = [], this.checkStart = t, this.checkEnd = r;
}
__name($d, "$d");
function Tt(e, t) {
  this.context = e, this.index = t, this.length = e.length, this.current = e[t], this.backtrack = e.slice(0, t), this.lookahead = e.slice(t + 1);
}
__name(Tt, "Tt");
function An(e) {
  this.eventId = e, this.subscribers = [];
}
__name(An, "An");
function jd(e) {
  var t = this, r = ["start", "end", "next", "newToken", "contextStart", "contextEnd", "insertToken", "removeToken", "removeRange", "replaceToken", "replaceRange", "composeRUD", "updateContextsRanges"];
  r.forEach(function(i) {
    Object.defineProperty(t.events, i, { value: new An(i) });
  }), e && r.forEach(function(i) {
    var a = e[i];
    typeof a == "function" && t.events[i].subscribe(a);
  });
  var n = ["insertToken", "removeToken", "removeRange", "replaceToken", "replaceRange", "composeRUD"];
  n.forEach(function(i) {
    t.events[i].subscribe(t.updateContextsRanges);
  });
}
__name(jd, "jd");
function Me(e) {
  this.tokens = [], this.registeredContexts = {}, this.contextCheckers = [], this.events = {}, this.registeredModifiers = [], jd.call(this, e);
}
__name(Me, "Me");
Ar.prototype.setState = function(e, t) {
  return this.state[e] = t, this.activeState = { key: e, value: this.state[e] }, this.activeState;
};
Ar.prototype.getState = function(e) {
  return this.state[e] || null;
};
Me.prototype.inboundIndex = function(e) {
  return e >= 0 && e < this.tokens.length;
};
Me.prototype.composeRUD = function(e) {
  var t = this, r = true, n = e.map(function(a) {
    return t[a[0]].apply(t, a.slice(1).concat(r));
  }), i = /* @__PURE__ */ __name(function(a) {
    return typeof a == "object" && a.hasOwnProperty("FAIL");
  }, "i");
  if (n.every(i))
    return { FAIL: "composeRUD: one or more operations hasn't completed successfully", report: n.filter(i) };
  this.dispatch("composeRUD", [n.filter(function(a) {
    return !i(a);
  })]);
};
Me.prototype.replaceRange = function(e, t, r, n) {
  t = t !== null ? t : this.tokens.length;
  var i = r.every(function(o) {
    return o instanceof Ar;
  });
  if (!isNaN(e) && this.inboundIndex(e) && i) {
    var a = this.tokens.splice.apply(this.tokens, [e, t].concat(r));
    return n || this.dispatch("replaceToken", [e, t, r]), [a, r];
  } else
    return { FAIL: "replaceRange: invalid tokens or startIndex." };
};
Me.prototype.replaceToken = function(e, t, r) {
  if (!isNaN(e) && this.inboundIndex(e) && t instanceof Ar) {
    var n = this.tokens.splice(e, 1, t);
    return r || this.dispatch("replaceToken", [e, t]), [n[0], t];
  } else
    return { FAIL: "replaceToken: invalid token or index." };
};
Me.prototype.removeRange = function(e, t, r) {
  t = isNaN(t) ? this.tokens.length : t;
  var n = this.tokens.splice(e, t);
  return r || this.dispatch("removeRange", [n, e, t]), n;
};
Me.prototype.removeToken = function(e, t) {
  if (!isNaN(e) && this.inboundIndex(e)) {
    var r = this.tokens.splice(e, 1);
    return t || this.dispatch("removeToken", [r, e]), r;
  } else
    return { FAIL: "removeToken: invalid token index." };
};
Me.prototype.insertToken = function(e, t, r) {
  var n = e.every(function(i) {
    return i instanceof Ar;
  });
  return n ? (this.tokens.splice.apply(this.tokens, [t, 0].concat(e)), r || this.dispatch("insertToken", [e, t]), e) : { FAIL: "insertToken: invalid token(s)." };
};
Me.prototype.registerModifier = function(e, t, r) {
  this.events.newToken.subscribe(function(n, i) {
    var a = [n, i], o = t === null || t.apply(this, a) === true, u = [n, i];
    if (o) {
      var s = r.apply(this, u);
      n.setState(e, s);
    }
  }), this.registeredModifiers.push(e);
};
An.prototype.subscribe = function(e) {
  return typeof e == "function" ? this.subscribers.push(e) - 1 : { FAIL: "invalid '" + this.eventId + "' event handler" };
};
An.prototype.unsubscribe = function(e) {
  this.subscribers.splice(e, 1);
};
Tt.prototype.setCurrentIndex = function(e) {
  this.index = e, this.current = this.context[e], this.backtrack = this.context.slice(0, e), this.lookahead = this.context.slice(e + 1);
};
Tt.prototype.get = function(e) {
  switch (true) {
    case e === 0:
      return this.current;
    case (e < 0 && Math.abs(e) <= this.backtrack.length):
      return this.backtrack.slice(e)[0];
    case (e > 0 && e <= this.lookahead.length):
      return this.lookahead[e - 1];
    default:
      return null;
  }
};
Me.prototype.rangeToText = function(e) {
  if (e instanceof sa)
    return this.getRangeTokens(e).map(function(t) {
      return t.char;
    }).join("");
};
Me.prototype.getText = function() {
  return this.tokens.map(function(e) {
    return e.char;
  }).join("");
};
Me.prototype.getContext = function(e) {
  var t = this.registeredContexts[e];
  return t || null;
};
Me.prototype.on = function(e, t) {
  var r = this.events[e];
  return r ? r.subscribe(t) : null;
};
Me.prototype.dispatch = function(e, t) {
  var r = this, n = this.events[e];
  n instanceof An && n.subscribers.forEach(function(i) {
    i.apply(r, t || []);
  });
};
Me.prototype.registerContextChecker = function(e, t, r) {
  if (this.getContext(e))
    return { FAIL: "context name '" + e + "' is already registered." };
  if (typeof t != "function")
    return { FAIL: "missing context start check." };
  if (typeof r != "function")
    return { FAIL: "missing context end check." };
  var n = new $d(e, t, r);
  return this.registeredContexts[e] = n, this.contextCheckers.push(n), n;
};
Me.prototype.getRangeTokens = function(e) {
  var t = e.startIndex + e.endOffset;
  return [].concat(this.tokens.slice(e.startIndex, t));
};
Me.prototype.getContextRanges = function(e) {
  var t = this.getContext(e);
  return t ? t.ranges : { FAIL: "context checker '" + e + "' is not registered." };
};
Me.prototype.resetContextsRanges = function() {
  var e = this.registeredContexts;
  for (var t in e)
    if (e.hasOwnProperty(t)) {
      var r = e[t];
      r.ranges = [];
    }
};
Me.prototype.updateContextsRanges = function() {
  this.resetContextsRanges();
  for (var e = this.tokens.map(function(n) {
    return n.char;
  }), t = 0; t < e.length; t++) {
    var r = new Tt(e, t);
    this.runContextCheck(r);
  }
  this.dispatch("updateContextsRanges", [this.registeredContexts]);
};
Me.prototype.setEndOffset = function(e, t) {
  var r = this.getContext(t).openRange.startIndex, n = new sa(r, e, t), i = this.getContext(t).ranges;
  return n.rangeId = t + "." + i.length, i.push(n), this.getContext(t).openRange = null, n;
};
Me.prototype.runContextCheck = function(e) {
  var t = this, r = e.index;
  this.contextCheckers.forEach(function(n) {
    var i = n.contextName, a = t.getContext(i).openRange;
    if (!a && n.checkStart(e) && (a = new sa(r, null, i), t.getContext(i).openRange = a, t.dispatch("contextStart", [i, r])), a && n.checkEnd(e)) {
      var o = r - a.startIndex + 1, u = t.setEndOffset(o, i);
      t.dispatch("contextEnd", [i, u]);
    }
  });
};
Me.prototype.tokenize = function(e) {
  this.tokens = [], this.resetContextsRanges();
  var t = Array.from(e);
  this.dispatch("start");
  for (var r = 0; r < t.length; r++) {
    var n = t[r], i = new Tt(t, r);
    this.dispatch("next", [i]), this.runContextCheck(i);
    var a = new Ar(n);
    this.tokens.push(a), this.dispatch("newToken", [a, i]);
  }
  return this.dispatch("end", [this.tokens]), this.tokens;
};
function lr(e) {
  return /[\u0600-\u065F\u066A-\u06D2\u06FA-\u06FF]/.test(e);
}
__name(lr, "lr");
function ou(e) {
  return /[\u0630\u0690\u0621\u0631\u0661\u0671\u0622\u0632\u0672\u0692\u06C2\u0623\u0673\u0693\u06C3\u0624\u0694\u06C4\u0625\u0675\u0695\u06C5\u06E5\u0676\u0696\u06C6\u0627\u0677\u0697\u06C7\u0648\u0688\u0698\u06C8\u0689\u0699\u06C9\u068A\u06CA\u066B\u068B\u06CB\u068C\u068D\u06CD\u06FD\u068E\u06EE\u06FE\u062F\u068F\u06CF\u06EF]/.test(e);
}
__name(ou, "ou");
function fr(e) {
  return /[\u0600-\u0605\u060C-\u060E\u0610-\u061B\u061E\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/.test(e);
}
__name(fr, "fr");
function Sn(e) {
  return /[A-z]/.test(e);
}
__name(Sn, "Sn");
function zd(e) {
  return /\s/.test(e);
}
__name(zd, "zd");
function mt(e) {
  this.font = e, this.features = {};
}
__name(mt, "mt");
function gr(e) {
  this.id = e.id, this.tag = e.tag, this.substitution = e.substitution;
}
__name(gr, "gr");
function Xr(e, t) {
  if (!e)
    return -1;
  switch (t.format) {
    case 1:
      return t.glyphs.indexOf(e);
    case 2:
      for (var r = t.ranges, n = 0; n < r.length; n++) {
        var i = r[n];
        if (e >= i.start && e <= i.end) {
          var a = e - i.start;
          return i.index + a;
        }
      }
      break;
    default:
      return -1;
  }
  return -1;
}
__name(Xr, "Xr");
function Vd(e, t) {
  var r = Xr(e, t.coverage);
  return r === -1 ? null : e + t.deltaGlyphId;
}
__name(Vd, "Vd");
function Hd(e, t) {
  var r = Xr(e, t.coverage);
  return r === -1 ? null : t.substitute[r];
}
__name(Hd, "Hd");
function Qi(e, t) {
  for (var r = [], n = 0; n < e.length; n++) {
    var i = e[n], a = t.current;
    a = Array.isArray(a) ? a[0] : a;
    var o = Xr(a, i);
    o !== -1 && r.push(o);
  }
  return r.length !== e.length ? -1 : r;
}
__name(Qi, "Qi");
function Xd(e, t) {
  var r = t.inputCoverage.length + t.lookaheadCoverage.length + t.backtrackCoverage.length;
  if (e.context.length < r)
    return [];
  var n = Qi(t.inputCoverage, e);
  if (n === -1)
    return [];
  var i = t.inputCoverage.length - 1;
  if (e.lookahead.length < t.lookaheadCoverage.length)
    return [];
  for (var a = e.lookahead.slice(i); a.length && fr(a[0].char); )
    a.shift();
  var o = new Tt(a, 0), u = Qi(t.lookaheadCoverage, o), s = [].concat(e.backtrack);
  for (s.reverse(); s.length && fr(s[0].char); )
    s.shift();
  if (s.length < t.backtrackCoverage.length)
    return [];
  var l = new Tt(s, 0), f = Qi(t.backtrackCoverage, l), c = n.length === t.inputCoverage.length && u.length === t.lookaheadCoverage.length && f.length === t.backtrackCoverage.length, p = [];
  if (c)
    for (var d = 0; d < t.lookupRecords.length; d++)
      for (var D = t.lookupRecords[d], v = D.lookupListIndex, g = this.getLookupByIndex(v), y = 0; y < g.subtables.length; y++) {
        var b = g.subtables[y], C = this.getLookupMethod(g, b), k = this.getSubstitutionType(g, b);
        if (k === "12")
          for (var S = 0; S < n.length; S++) {
            var E = e.get(S), L = C(E);
            L && p.push(L);
          }
      }
  return p;
}
__name(Xd, "Xd");
function qd(e, t) {
  var r = e.current, n = Xr(r, t.coverage);
  if (n === -1)
    return null;
  for (var i, a = t.ligatureSets[n], o = 0; o < a.length; o++) {
    i = a[o];
    for (var u = 0; u < i.components.length; u++) {
      var s = e.lookahead[u], l = i.components[u];
      if (s !== l)
        break;
      if (u === i.components.length - 1)
        return i;
    }
  }
  return null;
}
__name(qd, "qd");
function Yd(e, t) {
  var r = Xr(e, t.coverage);
  return r === -1 ? null : t.sequences[r];
}
__name(Yd, "Yd");
mt.prototype.getDefaultScriptFeaturesIndexes = function() {
  for (var e = this.font.tables.gsub.scripts, t = 0; t < e.length; t++) {
    var r = e[t];
    if (r.tag === "DFLT")
      return r.script.defaultLangSys.featureIndexes;
  }
  return [];
};
mt.prototype.getScriptFeaturesIndexes = function(e) {
  var t = this.font.tables;
  if (!t.gsub)
    return [];
  if (!e)
    return this.getDefaultScriptFeaturesIndexes();
  for (var r = this.font.tables.gsub.scripts, n = 0; n < r.length; n++) {
    var i = r[n];
    if (i.tag === e && i.script.defaultLangSys)
      return i.script.defaultLangSys.featureIndexes;
    var a = i.langSysRecords;
    if (a)
      for (var o = 0; o < a.length; o++) {
        var u = a[o];
        if (u.tag === e) {
          var s = u.langSys;
          return s.featureIndexes;
        }
      }
  }
  return this.getDefaultScriptFeaturesIndexes();
};
mt.prototype.mapTagsToFeatures = function(e, t) {
  for (var r = {}, n = 0; n < e.length; n++) {
    var i = e[n].tag, a = e[n].feature;
    r[i] = a;
  }
  this.features[t].tags = r;
};
mt.prototype.getScriptFeatures = function(e) {
  var t = this.features[e];
  if (this.features.hasOwnProperty(e))
    return t;
  var r = this.getScriptFeaturesIndexes(e);
  if (!r)
    return null;
  var n = this.font.tables.gsub;
  return t = r.map(function(i) {
    return n.features[i];
  }), this.features[e] = t, this.mapTagsToFeatures(t, e), t;
};
mt.prototype.getSubstitutionType = function(e, t) {
  var r = e.lookupType.toString(), n = t.substFormat.toString();
  return r + n;
};
mt.prototype.getLookupMethod = function(e, t) {
  var r = this, n = this.getSubstitutionType(e, t);
  switch (n) {
    case "11":
      return function(i) {
        return Vd.apply(r, [i, t]);
      };
    case "12":
      return function(i) {
        return Hd.apply(r, [i, t]);
      };
    case "63":
      return function(i) {
        return Xd.apply(r, [i, t]);
      };
    case "41":
      return function(i) {
        return qd.apply(r, [i, t]);
      };
    case "21":
      return function(i) {
        return Yd.apply(r, [i, t]);
      };
    default:
      throw new Error("lookupType: " + e.lookupType + " - substFormat: " + t.substFormat + " is not yet supported");
  }
};
mt.prototype.lookupFeature = function(e) {
  var t = e.contextParams, r = t.index, n = this.getFeature({ tag: e.tag, script: e.script });
  if (!n)
    return new Error("font '" + this.font.names.fullName.en + "' doesn't support feature '" + e.tag + "' for script '" + e.script + "'.");
  for (var i = this.getFeatureLookups(n), a = [].concat(t.context), o = 0; o < i.length; o++)
    for (var u = i[o], s = this.getLookupSubtables(u), l = 0; l < s.length; l++) {
      var f = s[l], c = this.getSubstitutionType(u, f), p = this.getLookupMethod(u, f), d = void 0;
      switch (c) {
        case "11":
          d = p(t.current), d && a.splice(r, 1, new gr({ id: 11, tag: e.tag, substitution: d }));
          break;
        case "12":
          d = p(t.current), d && a.splice(r, 1, new gr({ id: 12, tag: e.tag, substitution: d }));
          break;
        case "63":
          d = p(t), Array.isArray(d) && d.length && a.splice(r, 1, new gr({ id: 63, tag: e.tag, substitution: d }));
          break;
        case "41":
          d = p(t), d && a.splice(r, 1, new gr({ id: 41, tag: e.tag, substitution: d }));
          break;
        case "21":
          d = p(t.current), d && a.splice(r, 1, new gr({ id: 21, tag: e.tag, substitution: d }));
          break;
      }
      t = new Tt(a, r), !(Array.isArray(d) && !d.length) && (d = null);
    }
  return a.length ? a : null;
};
mt.prototype.supports = function(e) {
  if (!e.script)
    return false;
  this.getScriptFeatures(e.script);
  var t = this.features.hasOwnProperty(e.script);
  if (!e.tag)
    return t;
  var r = this.features[e.script].some(function(n) {
    return n.tag === e.tag;
  });
  return t && r;
};
mt.prototype.getLookupSubtables = function(e) {
  return e.subtables || null;
};
mt.prototype.getLookupByIndex = function(e) {
  var t = this.font.tables.gsub.lookups;
  return t[e] || null;
};
mt.prototype.getFeatureLookups = function(e) {
  return e.lookupListIndexes.map(this.getLookupByIndex.bind(this));
};
mt.prototype.getFeature = function(t) {
  if (!this.font)
    return { FAIL: "No font was found" };
  this.features.hasOwnProperty(t.script) || this.getScriptFeatures(t.script);
  var r = this.features[t.script];
  return r ? r.tags[t.tag] ? this.features[t.script].tags[t.tag] : null : { FAIL: "No feature for script " + t.script };
};
function Zd(e) {
  var t = e.current, r = e.get(-1);
  return r === null && lr(t) || !lr(r) && lr(t);
}
__name(Zd, "Zd");
function Jd(e) {
  var t = e.get(1);
  return t === null || !lr(t);
}
__name(Jd, "Jd");
var Kd = { startCheck: Zd, endCheck: Jd };
function Qd(e) {
  var t = e.current, r = e.get(-1);
  return (lr(t) || fr(t)) && !lr(r);
}
__name(Qd, "Qd");
function e0(e) {
  var t = e.get(1);
  switch (true) {
    case t === null:
      return true;
    case (!lr(t) && !fr(t)):
      var r = zd(t);
      if (!r)
        return true;
      if (r) {
        var n = false;
        if (n = e.lookahead.some(function(i) {
          return lr(i) || fr(i);
        }), !n)
          return true;
      }
      break;
    default:
      return false;
  }
}
__name(e0, "e0");
var t0 = { startCheck: Qd, endCheck: e0 };
function r0(e, t, r) {
  t[r].setState(e.tag, e.substitution);
}
__name(r0, "r0");
function n0(e, t, r) {
  t[r].setState(e.tag, e.substitution);
}
__name(n0, "n0");
function i0(e, t, r) {
  e.substitution.forEach(function(n, i) {
    var a = t[r + i];
    a.setState(e.tag, n);
  });
}
__name(i0, "i0");
function a0(e, t, r) {
  var n = t[r];
  n.setState(e.tag, e.substitution.ligGlyph);
  for (var i = e.substitution.components.length, a = 0; a < i; a++)
    n = t[r + a + 1], n.setState("deleted", true);
}
__name(a0, "a0");
var Is = { 11: r0, 12: n0, 63: i0, 41: a0 };
function ua(e, t, r) {
  e instanceof gr && Is[e.id] && Is[e.id](e, t, r);
}
__name(ua, "ua");
function o0(e) {
  for (var t = [].concat(e.backtrack), r = t.length - 1; r >= 0; r--) {
    var n = t[r], i = ou(n), a = fr(n);
    if (!i && !a)
      return true;
    if (i)
      return false;
  }
  return false;
}
__name(o0, "o0");
function s0(e) {
  if (ou(e.current))
    return false;
  for (var t = 0; t < e.lookahead.length; t++) {
    var r = e.lookahead[t], n = fr(r);
    if (!n)
      return true;
  }
  return false;
}
__name(s0, "s0");
function u0(e) {
  var t = this, r = "arab", n = this.featuresTags[r], i = this.tokenizer.getRangeTokens(e);
  if (i.length !== 1) {
    var a = new Tt(i.map(function(u) {
      return u.getState("glyphIndex");
    }), 0), o = new Tt(i.map(function(u) {
      return u.char;
    }), 0);
    i.forEach(function(u, s) {
      if (!fr(u.char)) {
        a.setCurrentIndex(s), o.setCurrentIndex(s);
        var l = 0;
        o0(o) && (l |= 1), s0(o) && (l |= 2);
        var f;
        switch (l) {
          case 1:
            f = "fina";
            break;
          case 2:
            f = "init";
            break;
          case 3:
            f = "medi";
            break;
        }
        if (n.indexOf(f) !== -1) {
          var c = t.query.lookupFeature({ tag: f, script: r, contextParams: a });
          if (c instanceof Error)
            return console.info(c.message);
          c.forEach(function(p, d) {
            p instanceof gr && (ua(p, i, d), a.context[d] = p.substitution);
          });
        }
      }
    });
  }
}
__name(u0, "u0");
function Ps(e, t) {
  var r = e.map(function(n) {
    return n.activeState.value;
  });
  return new Tt(r, t || 0);
}
__name(Ps, "Ps");
function l0(e) {
  var t = this, r = "arab", n = this.tokenizer.getRangeTokens(e), i = Ps(n);
  i.context.forEach(function(a, o) {
    i.setCurrentIndex(o);
    var u = t.query.lookupFeature({ tag: "rlig", script: r, contextParams: i });
    u.length && (u.forEach(function(s) {
      return ua(s, n, o);
    }), i = Ps(n));
  });
}
__name(l0, "l0");
function f0(e) {
  var t = e.current, r = e.get(-1);
  return r === null && Sn(t) || !Sn(r) && Sn(t);
}
__name(f0, "f0");
function c0(e) {
  var t = e.get(1);
  return t === null || !Sn(t);
}
__name(c0, "c0");
var p0 = { startCheck: f0, endCheck: c0 };
function Rs(e, t) {
  var r = e.map(function(n) {
    return n.activeState.value;
  });
  return new Tt(r, t || 0);
}
__name(Rs, "Rs");
function h0(e) {
  var t = this, r = "latn", n = this.tokenizer.getRangeTokens(e), i = Rs(n);
  i.context.forEach(function(a, o) {
    i.setCurrentIndex(o);
    var u = t.query.lookupFeature({ tag: "liga", script: r, contextParams: i });
    u.length && (u.forEach(function(s) {
      return ua(s, n, o);
    }), i = Rs(n));
  });
}
__name(h0, "h0");
function Ot(e) {
  this.baseDir = e || "ltr", this.tokenizer = new Me(), this.featuresTags = {};
}
__name(Ot, "Ot");
Ot.prototype.setText = function(e) {
  this.text = e;
};
Ot.prototype.contextChecks = { latinWordCheck: p0, arabicWordCheck: Kd, arabicSentenceCheck: t0 };
function ea(e) {
  var t = this.contextChecks[e + "Check"];
  return this.tokenizer.registerContextChecker(e, t.startCheck, t.endCheck);
}
__name(ea, "ea");
function d0() {
  return ea.call(this, "latinWord"), ea.call(this, "arabicWord"), ea.call(this, "arabicSentence"), this.tokenizer.tokenize(this.text);
}
__name(d0, "d0");
function v0() {
  var e = this, t = this.tokenizer.getContextRanges("arabicSentence");
  t.forEach(function(r) {
    var n = e.tokenizer.getRangeTokens(r);
    e.tokenizer.replaceRange(r.startIndex, r.endOffset, n.reverse());
  });
}
__name(v0, "v0");
Ot.prototype.registerFeatures = function(e, t) {
  var r = this, n = t.filter(function(i) {
    return r.query.supports({ script: e, tag: i });
  });
  this.featuresTags.hasOwnProperty(e) ? this.featuresTags[e] = this.featuresTags[e].concat(n) : this.featuresTags[e] = n;
};
Ot.prototype.applyFeatures = function(e, t) {
  if (!e)
    throw new Error("No valid font was provided to apply features");
  this.query || (this.query = new mt(e));
  for (var r = 0; r < t.length; r++) {
    var n = t[r];
    this.query.supports({ script: n.script }) && this.registerFeatures(n.script, n.tags);
  }
};
Ot.prototype.registerModifier = function(e, t, r) {
  this.tokenizer.registerModifier(e, t, r);
};
function la() {
  if (this.tokenizer.registeredModifiers.indexOf("glyphIndex") === -1)
    throw new Error("glyphIndex modifier is required to apply arabic presentation features.");
}
__name(la, "la");
function g0() {
  var e = this, t = "arab";
  if (this.featuresTags.hasOwnProperty(t)) {
    la.call(this);
    var r = this.tokenizer.getContextRanges("arabicWord");
    r.forEach(function(n) {
      u0.call(e, n);
    });
  }
}
__name(g0, "g0");
function m0() {
  var e = this, t = "arab";
  if (this.featuresTags.hasOwnProperty(t)) {
    var r = this.featuresTags[t];
    if (r.indexOf("rlig") !== -1) {
      la.call(this);
      var n = this.tokenizer.getContextRanges("arabicWord");
      n.forEach(function(i) {
        l0.call(e, i);
      });
    }
  }
}
__name(m0, "m0");
function D0() {
  var e = this, t = "latn";
  if (this.featuresTags.hasOwnProperty(t)) {
    var r = this.featuresTags[t];
    if (r.indexOf("liga") !== -1) {
      la.call(this);
      var n = this.tokenizer.getContextRanges("latinWord");
      n.forEach(function(i) {
        h0.call(e, i);
      });
    }
  }
}
__name(D0, "D0");
Ot.prototype.checkContextReady = function(e) {
  return !!this.tokenizer.getContext(e);
};
Ot.prototype.applyFeaturesToContexts = function() {
  this.checkContextReady("arabicWord") && (g0.call(this), m0.call(this)), this.checkContextReady("latinWord") && D0.call(this), this.checkContextReady("arabicSentence") && v0.call(this);
};
Ot.prototype.processText = function(e) {
  (!this.text || this.text !== e) && (this.setText(e), d0.call(this), this.applyFeaturesToContexts());
};
Ot.prototype.getBidiText = function(e) {
  return this.processText(e), this.tokenizer.getText();
};
Ot.prototype.getTextGlyphs = function(e) {
  this.processText(e);
  for (var t = [], r = 0; r < this.tokenizer.tokens.length; r++) {
    var n = this.tokenizer.tokens[r];
    if (!n.state.deleted) {
      var i = n.activeState.value;
      t.push(Array.isArray(i) ? i[0] : i);
    }
  }
  return t;
};
function st(e) {
  e = e || {}, e.tables = e.tables || {}, e.empty || (Nr(e.familyName, "When creating a new Font object, familyName is required."), Nr(e.styleName, "When creating a new Font object, styleName is required."), Nr(e.unitsPerEm, "When creating a new Font object, unitsPerEm is required."), Nr(e.ascender, "When creating a new Font object, ascender is required."), Nr(e.descender <= 0, "When creating a new Font object, negative descender value is required."), this.unitsPerEm = e.unitsPerEm || 1e3, this.ascender = e.ascender, this.descender = e.descender, this.createdTimestamp = e.createdTimestamp, this.tables = Object.assign(e.tables, { os2: Object.assign({ usWeightClass: e.weightClass || this.usWeightClasses.MEDIUM, usWidthClass: e.widthClass || this.usWidthClasses.MEDIUM, fsSelection: e.fsSelection || this.fsSelectionValues.REGULAR }, e.tables.os2) })), this.supported = true, this.glyphs = new $t.GlyphSet(this, e.glyphs || []), this.encoding = new Hs(this), this.position = new zr(this), this.substitution = new gt(this), this.tables = this.tables || {}, this._push = null, this._hmtxTableData = {}, Object.defineProperty(this, "hinting", { get: function() {
    if (this._hinting)
      return this._hinting;
    if (this.outlinesFormat === "truetype")
      return this._hinting = new ru(this);
  } });
}
__name(st, "st");
st.prototype.hasChar = function(e) {
  return this.encoding.charToGlyphIndex(e) !== null;
};
st.prototype.charToGlyphIndex = function(e) {
  return this.encoding.charToGlyphIndex(e);
};
st.prototype.charToGlyph = function(e) {
  var t = this.charToGlyphIndex(e), r = this.glyphs.get(t);
  return r || (r = this.glyphs.get(0)), r;
};
st.prototype.updateFeatures = function(e) {
  return this.defaultRenderOptions.features.map(function(t) {
    return t.script === "latn" ? { script: "latn", tags: t.tags.filter(function(r) {
      return e[r];
    }) } : t;
  });
};
st.prototype.stringToGlyphs = function(e, t) {
  var r = this, n = new Ot(), i = /* @__PURE__ */ __name(function(c) {
    return r.charToGlyphIndex(c.char);
  }, "i");
  n.registerModifier("glyphIndex", null, i);
  var a = t ? this.updateFeatures(t.features) : this.defaultRenderOptions.features;
  n.applyFeatures(this, a);
  for (var o = n.getTextGlyphs(e), u = o.length, s = new Array(u), l = this.glyphs.get(0), f = 0; f < u; f += 1)
    s[f] = this.glyphs.get(o[f]) || l;
  return s;
};
st.prototype.getKerningValue = function(e, t) {
  e = e.index || e, t = t.index || t;
  var r = this.position.defaultKerningTables;
  return r ? this.position.getKerningValue(r, e, t) : this.kerningPairs[e + "," + t] || 0;
};
st.prototype.defaultRenderOptions = { kerning: true, features: [{ script: "arab", tags: ["init", "medi", "fina", "rlig"] }, { script: "latn", tags: ["liga", "rlig"] }] };
st.prototype.forEachGlyph = function(e, t, r, n, i, a) {
  t = t !== void 0 ? t : 0, r = r !== void 0 ? r : 0, n = n !== void 0 ? n : 72, i = Object.assign({}, this.defaultRenderOptions, i);
  var o = 1 / this.unitsPerEm * n, u = this.stringToGlyphs(e, i), s;
  if (i.kerning) {
    var l = i.script || this.position.getDefaultScriptName();
    s = this.position.getKerningTables(l, i.language);
  }
  for (var f = 0; f < u.length; f += 1) {
    var c = u[f];
    if (a.call(this, c, t, r, n, i), c.advanceWidth && (t += c.advanceWidth * o), i.kerning && f < u.length - 1) {
      var p = s ? this.position.getKerningValue(s, c.index, u[f + 1].index) : this.getKerningValue(c, u[f + 1]);
      t += p * o;
    }
    i.letterSpacing ? t += i.letterSpacing * n : i.tracking && (t += i.tracking / 1e3 * n);
  }
  return t;
};
st.prototype.getPath = function(e, t, r, n, i) {
  var a = new ot();
  return this.forEachGlyph(e, t, r, n, i, function(o, u, s, l) {
    var f = o.getPath(u, s, l, i, this);
    a.extend(f);
  }), a;
};
st.prototype.getPaths = function(e, t, r, n, i) {
  var a = [];
  return this.forEachGlyph(e, t, r, n, i, function(o, u, s, l) {
    var f = o.getPath(u, s, l, i, this);
    a.push(f);
  }), a;
};
st.prototype.getAdvanceWidth = function(e, t, r) {
  return this.forEachGlyph(e, 0, 0, t, r, function() {
  });
};
st.prototype.fsSelectionValues = { ITALIC: 1, UNDERSCORE: 2, NEGATIVE: 4, OUTLINED: 8, STRIKEOUT: 16, BOLD: 32, REGULAR: 64, USER_TYPO_METRICS: 128, WWS: 256, OBLIQUE: 512 };
st.prototype.usWidthClasses = { ULTRA_CONDENSED: 1, EXTRA_CONDENSED: 2, CONDENSED: 3, SEMI_CONDENSED: 4, MEDIUM: 5, SEMI_EXPANDED: 6, EXPANDED: 7, EXTRA_EXPANDED: 8, ULTRA_EXPANDED: 9 };
st.prototype.usWeightClasses = { THIN: 100, EXTRA_LIGHT: 200, LIGHT: 300, NORMAL: 400, MEDIUM: 500, SEMI_BOLD: 600, BOLD: 700, EXTRA_BOLD: 800, BLACK: 900 };
function y0(e, t) {
  t.parseUShort(), e.length = t.parseULong(), e.language = t.parseULong();
  var r;
  e.groupCount = r = t.parseULong(), e.glyphIndexMap = {};
  for (var n = 0; n < r; n += 1)
    for (var i = t.parseULong(), a = t.parseULong(), o = t.parseULong(), u = i; u <= a; u += 1)
      e.glyphIndexMap[u] = o, o++;
}
__name(y0, "y0");
function b0(e, t, r, n, i) {
  e.length = t.parseUShort(), e.language = t.parseUShort();
  var a;
  e.segCount = a = t.parseUShort() >> 1, t.skip("uShort", 3), e.glyphIndexMap = {};
  for (var o = new se.Parser(r, n + i + 14), u = new se.Parser(r, n + i + 16 + a * 2), s = new se.Parser(r, n + i + 16 + a * 4), l = new se.Parser(r, n + i + 16 + a * 6), f = n + i + 16 + a * 8, c = 0; c < a - 1; c += 1)
    for (var p = void 0, d = o.parseUShort(), D = u.parseUShort(), v = s.parseShort(), g = l.parseUShort(), y = D; y <= d; y += 1)
      g !== 0 ? (f = l.offset + l.relativeOffset - 2, f += g, f += (y - D) * 2, p = se.getUShort(r, f), p !== 0 && (p = p + v & 65535)) : p = y + v & 65535, e.glyphIndexMap[y] = p;
}
__name(b0, "b0");
function x0(e, t) {
  var r = {};
  r.version = se.getUShort(e, t), Te.argument(r.version === 0, "cmap table version should be 0."), r.numTables = se.getUShort(e, t + 2);
  for (var n = -1, i = r.numTables - 1; i >= 0; i -= 1) {
    var a = se.getUShort(e, t + 4 + i * 8), o = se.getUShort(e, t + 4 + i * 8 + 2);
    if (a === 3 && (o === 0 || o === 1 || o === 10) || a === 0 && (o === 0 || o === 1 || o === 2 || o === 3 || o === 4)) {
      n = se.getULong(e, t + 4 + i * 8 + 4);
      break;
    }
  }
  if (n === -1)
    throw new Error("No valid cmap sub-tables found.");
  var u = new se.Parser(e, t + n);
  if (r.format = u.parseUShort(), r.format === 12)
    y0(r, u);
  else if (r.format === 4)
    b0(r, u, e, t, n);
  else
    throw new Error("Only format 4 and 12 cmap tables are supported (found format " + r.format + ").");
  return r;
}
__name(x0, "x0");
var w0 = { parse: x0 };
function na(e) {
  var t;
  return e.length < 1240 ? t = 107 : e.length < 33900 ? t = 1131 : t = 32768, t;
}
__name(na, "na");
function sr(e, t, r) {
  var n = [], i = [], a = se.getCard16(e, t), o, u;
  if (a !== 0) {
    var s = se.getByte(e, t + 2);
    o = t + (a + 1) * s + 2;
    for (var l = t + 3, f = 0; f < a + 1; f += 1)
      n.push(se.getOffset(e, l, s)), l += s;
    u = o + n[a];
  } else
    u = t + 2;
  for (var c = 0; c < n.length - 1; c += 1) {
    var p = se.getBytes(e, o + n[c], o + n[c + 1]);
    r && (p = r(p)), i.push(p);
  }
  return { objects: i, startOffset: t, endOffset: u };
}
__name(sr, "sr");
function E0(e, t) {
  var r = [], n = se.getCard16(e, t), i, a;
  if (n !== 0) {
    var o = se.getByte(e, t + 2);
    i = t + (n + 1) * o + 2;
    for (var u = t + 3, s = 0; s < n + 1; s += 1)
      r.push(se.getOffset(e, u, o)), u += o;
    a = i + r[n];
  } else
    a = t + 2;
  return { offsets: r, startOffset: t, endOffset: a };
}
__name(E0, "E0");
function F0(e, t, r, n, i) {
  var a = se.getCard16(r, n), o = 0;
  if (a !== 0) {
    var u = se.getByte(r, n + 2);
    o = n + (a + 1) * u + 2;
  }
  var s = se.getBytes(r, o + t[e], o + t[e + 1]);
  return i && (s = i(s)), s;
}
__name(F0, "F0");
function C0(e) {
  for (var t = "", r = 15, n = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "E", "E-", null, "-"]; ; ) {
    var i = e.parseByte(), a = i >> 4, o = i & 15;
    if (a === r || (t += n[a], o === r))
      break;
    t += n[o];
  }
  return parseFloat(t);
}
__name(C0, "C0");
function S0(e, t) {
  var r, n, i, a;
  if (t === 28)
    return r = e.parseByte(), n = e.parseByte(), r << 8 | n;
  if (t === 29)
    return r = e.parseByte(), n = e.parseByte(), i = e.parseByte(), a = e.parseByte(), r << 24 | n << 16 | i << 8 | a;
  if (t === 30)
    return C0(e);
  if (t >= 32 && t <= 246)
    return t - 139;
  if (t >= 247 && t <= 250)
    return r = e.parseByte(), (t - 247) * 256 + r + 108;
  if (t >= 251 && t <= 254)
    return r = e.parseByte(), -(t - 251) * 256 - r - 108;
  throw new Error("Invalid b0 " + t);
}
__name(S0, "S0");
function k0(e) {
  for (var t = {}, r = 0; r < e.length; r += 1) {
    var n = e[r][0], i = e[r][1], a = void 0;
    if (i.length === 1 ? a = i[0] : a = i, t.hasOwnProperty(n) && !isNaN(t[n]))
      throw new Error("Object " + t + " already has key " + n);
    t[n] = a;
  }
  return t;
}
__name(k0, "k0");
function su(e, t, r) {
  t = t !== void 0 ? t : 0;
  var n = new se.Parser(e, t), i = [], a = [];
  for (r = r !== void 0 ? r : e.length; n.relativeOffset < r; ) {
    var o = n.parseByte();
    o <= 21 ? (o === 12 && (o = 1200 + n.parseByte()), i.push([o, a]), a = []) : a.push(S0(n, o));
  }
  return k0(i);
}
__name(su, "su");
function Gr(e, t) {
  return t <= 390 ? t = Hp[t] : t = e[t - 391], t;
}
__name(Gr, "Gr");
function uu(e, t, r) {
  for (var n = {}, i, a = 0; a < t.length; a += 1) {
    var o = t[a];
    if (Array.isArray(o.type)) {
      var u = [];
      u.length = o.type.length;
      for (var s = 0; s < o.type.length; s++)
        i = e[o.op] !== void 0 ? e[o.op][s] : void 0, i === void 0 && (i = o.value !== void 0 && o.value[s] !== void 0 ? o.value[s] : null), o.type[s] === "SID" && (i = Gr(r, i)), u[s] = i;
      n[o.name] = u;
    } else
      i = e[o.op], i === void 0 && (i = o.value !== void 0 ? o.value : null), o.type === "SID" && (i = Gr(r, i)), n[o.name] = i;
  }
  return n;
}
__name(uu, "uu");
function T0(e, t) {
  var r = {};
  return r.formatMajor = se.getCard8(e, t), r.formatMinor = se.getCard8(e, t + 1), r.size = se.getCard8(e, t + 2), r.offsetSize = se.getCard8(e, t + 3), r.startOffset = t, r.endOffset = t + 4, r;
}
__name(T0, "T0");
var _0 = [{ name: "version", op: 0, type: "SID" }, { name: "notice", op: 1, type: "SID" }, { name: "copyright", op: 1200, type: "SID" }, { name: "fullName", op: 2, type: "SID" }, { name: "familyName", op: 3, type: "SID" }, { name: "weight", op: 4, type: "SID" }, { name: "isFixedPitch", op: 1201, type: "number", value: 0 }, { name: "italicAngle", op: 1202, type: "number", value: 0 }, { name: "underlinePosition", op: 1203, type: "number", value: -100 }, { name: "underlineThickness", op: 1204, type: "number", value: 50 }, { name: "paintType", op: 1205, type: "number", value: 0 }, { name: "charstringType", op: 1206, type: "number", value: 2 }, { name: "fontMatrix", op: 1207, type: ["real", "real", "real", "real", "real", "real"], value: [1e-3, 0, 0, 1e-3, 0, 0] }, { name: "uniqueId", op: 13, type: "number" }, { name: "fontBBox", op: 5, type: ["number", "number", "number", "number"], value: [0, 0, 0, 0] }, { name: "strokeWidth", op: 1208, type: "number", value: 0 }, { name: "xuid", op: 14, type: [], value: null }, { name: "charset", op: 15, type: "offset", value: 0 }, { name: "encoding", op: 16, type: "offset", value: 0 }, { name: "charStrings", op: 17, type: "offset", value: 0 }, { name: "private", op: 18, type: ["number", "offset"], value: [0, 0] }, { name: "ros", op: 1230, type: ["SID", "SID", "number"] }, { name: "cidFontVersion", op: 1231, type: "number", value: 0 }, { name: "cidFontRevision", op: 1232, type: "number", value: 0 }, { name: "cidFontType", op: 1233, type: "number", value: 0 }, { name: "cidCount", op: 1234, type: "number", value: 8720 }, { name: "uidBase", op: 1235, type: "number" }, { name: "fdArray", op: 1236, type: "offset" }, { name: "fdSelect", op: 1237, type: "offset" }, { name: "fontName", op: 1238, type: "SID" }];
var A0 = [{ name: "subrs", op: 19, type: "offset", value: 0 }, { name: "defaultWidthX", op: 20, type: "number", value: 0 }, { name: "nominalWidthX", op: 21, type: "number", value: 0 }];
function O0(e, t) {
  var r = su(e, 0, e.byteLength);
  return uu(r, _0, t);
}
__name(O0, "O0");
function lu(e, t, r, n) {
  var i = su(e, t, r);
  return uu(i, A0, n);
}
__name(lu, "lu");
function Us(e, t, r, n) {
  for (var i = [], a = 0; a < r.length; a += 1) {
    var o = new DataView(new Uint8Array(r[a]).buffer), u = O0(o, n);
    u._subrs = [], u._subrsBias = 0, u._defaultWidthX = 0, u._nominalWidthX = 0;
    var s = u.private[0], l = u.private[1];
    if (s !== 0 && l !== 0) {
      var f = lu(e, l + t, s, n);
      if (u._defaultWidthX = f.defaultWidthX, u._nominalWidthX = f.nominalWidthX, f.subrs !== 0) {
        var c = l + f.subrs, p = sr(e, c + t);
        u._subrs = p.objects, u._subrsBias = na(u._subrs);
      }
      u._privateDict = f;
    }
    i.push(u);
  }
  return i;
}
__name(Us, "Us");
function L0(e, t, r, n) {
  var i, a, o = new se.Parser(e, t);
  r -= 1;
  var u = [".notdef"], s = o.parseCard8();
  if (s === 0)
    for (var l = 0; l < r; l += 1)
      i = o.parseSID(), u.push(Gr(n, i));
  else if (s === 1)
    for (; u.length <= r; ) {
      i = o.parseSID(), a = o.parseCard8();
      for (var f = 0; f <= a; f += 1)
        u.push(Gr(n, i)), i += 1;
    }
  else if (s === 2)
    for (; u.length <= r; ) {
      i = o.parseSID(), a = o.parseCard16();
      for (var c = 0; c <= a; c += 1)
        u.push(Gr(n, i)), i += 1;
    }
  else
    throw new Error("Unknown charset format " + s);
  return u;
}
__name(L0, "L0");
function I0(e, t, r) {
  var n, i = {}, a = new se.Parser(e, t), o = a.parseCard8();
  if (o === 0)
    for (var u = a.parseCard8(), s = 0; s < u; s += 1)
      n = a.parseCard8(), i[n] = s;
  else if (o === 1) {
    var l = a.parseCard8();
    n = 1;
    for (var f = 0; f < l; f += 1)
      for (var c = a.parseCard8(), p = a.parseCard8(), d = c; d <= c + p; d += 1)
        i[d] = n, n += 1;
  } else
    throw new Error("Unknown encoding format " + o);
  return new kn(i, r);
}
__name(I0, "I0");
function Bs(e, t, r) {
  var n, i, a, o, u = new ot(), s = [], l = 0, f = false, c = false, p = 0, d = 0, D, v, g, y;
  if (e.isCIDFont) {
    var b = e.tables.cff.topDict._fdSelect[t.index], C = e.tables.cff.topDict._fdArray[b];
    D = C._subrs, v = C._subrsBias, g = C._defaultWidthX, y = C._nominalWidthX;
  } else
    D = e.tables.cff.topDict._subrs, v = e.tables.cff.topDict._subrsBias, g = e.tables.cff.topDict._defaultWidthX, y = e.tables.cff.topDict._nominalWidthX;
  var k = g;
  function S(T, U) {
    c && u.closePath(), u.moveTo(T, U), c = true;
  }
  __name(S, "S");
  function E() {
    var T;
    T = s.length % 2 !== 0, T && !f && (k = s.shift() + y), l += s.length >> 1, s.length = 0, f = true;
  }
  __name(E, "E");
  function L(T) {
    for (var U, M, H, q, ee, A, R, O, Y, Z, te, ie, B = 0; B < T.length; ) {
      var z = T[B];
      switch (B += 1, z) {
        case 1:
          E();
          break;
        case 3:
          E();
          break;
        case 4:
          s.length > 1 && !f && (k = s.shift() + y, f = true), d += s.pop(), S(p, d);
          break;
        case 5:
          for (; s.length > 0; )
            p += s.shift(), d += s.shift(), u.lineTo(p, d);
          break;
        case 6:
          for (; s.length > 0 && (p += s.shift(), u.lineTo(p, d), s.length !== 0); )
            d += s.shift(), u.lineTo(p, d);
          break;
        case 7:
          for (; s.length > 0 && (d += s.shift(), u.lineTo(p, d), s.length !== 0); )
            p += s.shift(), u.lineTo(p, d);
          break;
        case 8:
          for (; s.length > 0; )
            n = p + s.shift(), i = d + s.shift(), a = n + s.shift(), o = i + s.shift(), p = a + s.shift(), d = o + s.shift(), u.curveTo(n, i, a, o, p, d);
          break;
        case 10:
          ee = s.pop() + v, A = D[ee], A && L(A);
          break;
        case 11:
          return;
        case 12:
          switch (z = T[B], B += 1, z) {
            case 35:
              n = p + s.shift(), i = d + s.shift(), a = n + s.shift(), o = i + s.shift(), R = a + s.shift(), O = o + s.shift(), Y = R + s.shift(), Z = O + s.shift(), te = Y + s.shift(), ie = Z + s.shift(), p = te + s.shift(), d = ie + s.shift(), s.shift(), u.curveTo(n, i, a, o, R, O), u.curveTo(Y, Z, te, ie, p, d);
              break;
            case 34:
              n = p + s.shift(), i = d, a = n + s.shift(), o = i + s.shift(), R = a + s.shift(), O = o, Y = R + s.shift(), Z = o, te = Y + s.shift(), ie = d, p = te + s.shift(), u.curveTo(n, i, a, o, R, O), u.curveTo(Y, Z, te, ie, p, d);
              break;
            case 36:
              n = p + s.shift(), i = d + s.shift(), a = n + s.shift(), o = i + s.shift(), R = a + s.shift(), O = o, Y = R + s.shift(), Z = o, te = Y + s.shift(), ie = Z + s.shift(), p = te + s.shift(), u.curveTo(n, i, a, o, R, O), u.curveTo(Y, Z, te, ie, p, d);
              break;
            case 37:
              n = p + s.shift(), i = d + s.shift(), a = n + s.shift(), o = i + s.shift(), R = a + s.shift(), O = o + s.shift(), Y = R + s.shift(), Z = O + s.shift(), te = Y + s.shift(), ie = Z + s.shift(), Math.abs(te - p) > Math.abs(ie - d) ? p = te + s.shift() : d = ie + s.shift(), u.curveTo(n, i, a, o, R, O), u.curveTo(Y, Z, te, ie, p, d);
              break;
            default:
              console.log("Glyph " + t.index + ": unknown operator 1200" + z), s.length = 0;
          }
          break;
        case 14:
          s.length > 0 && !f && (k = s.shift() + y, f = true), c && (u.closePath(), c = false);
          break;
        case 18:
          E();
          break;
        case 19:
        case 20:
          E(), B += l + 7 >> 3;
          break;
        case 21:
          s.length > 2 && !f && (k = s.shift() + y, f = true), d += s.pop(), p += s.pop(), S(p, d);
          break;
        case 22:
          s.length > 1 && !f && (k = s.shift() + y, f = true), p += s.pop(), S(p, d);
          break;
        case 23:
          E();
          break;
        case 24:
          for (; s.length > 2; )
            n = p + s.shift(), i = d + s.shift(), a = n + s.shift(), o = i + s.shift(), p = a + s.shift(), d = o + s.shift(), u.curveTo(n, i, a, o, p, d);
          p += s.shift(), d += s.shift(), u.lineTo(p, d);
          break;
        case 25:
          for (; s.length > 6; )
            p += s.shift(), d += s.shift(), u.lineTo(p, d);
          n = p + s.shift(), i = d + s.shift(), a = n + s.shift(), o = i + s.shift(), p = a + s.shift(), d = o + s.shift(), u.curveTo(n, i, a, o, p, d);
          break;
        case 26:
          for (s.length % 2 && (p += s.shift()); s.length > 0; )
            n = p, i = d + s.shift(), a = n + s.shift(), o = i + s.shift(), p = a, d = o + s.shift(), u.curveTo(n, i, a, o, p, d);
          break;
        case 27:
          for (s.length % 2 && (d += s.shift()); s.length > 0; )
            n = p + s.shift(), i = d, a = n + s.shift(), o = i + s.shift(), p = a + s.shift(), d = o, u.curveTo(n, i, a, o, p, d);
          break;
        case 28:
          U = T[B], M = T[B + 1], s.push((U << 24 | M << 16) >> 16), B += 2;
          break;
        case 29:
          ee = s.pop() + e.gsubrsBias, A = e.gsubrs[ee], A && L(A);
          break;
        case 30:
          for (; s.length > 0 && (n = p, i = d + s.shift(), a = n + s.shift(), o = i + s.shift(), p = a + s.shift(), d = o + (s.length === 1 ? s.shift() : 0), u.curveTo(n, i, a, o, p, d), s.length !== 0); )
            n = p + s.shift(), i = d, a = n + s.shift(), o = i + s.shift(), d = o + s.shift(), p = a + (s.length === 1 ? s.shift() : 0), u.curveTo(n, i, a, o, p, d);
          break;
        case 31:
          for (; s.length > 0 && (n = p + s.shift(), i = d, a = n + s.shift(), o = i + s.shift(), d = o + s.shift(), p = a + (s.length === 1 ? s.shift() : 0), u.curveTo(n, i, a, o, p, d), s.length !== 0); )
            n = p, i = d + s.shift(), a = n + s.shift(), o = i + s.shift(), p = a + s.shift(), d = o + (s.length === 1 ? s.shift() : 0), u.curveTo(n, i, a, o, p, d);
          break;
        default:
          z < 32 ? console.log("Glyph " + t.index + ": unknown operator " + z) : z < 247 ? s.push(z - 139) : z < 251 ? (U = T[B], B += 1, s.push((z - 247) * 256 + U + 108)) : z < 255 ? (U = T[B], B += 1, s.push(-(z - 251) * 256 - U - 108)) : (U = T[B], M = T[B + 1], H = T[B + 2], q = T[B + 3], B += 4, s.push((U << 24 | M << 16 | H << 8 | q) / 65536));
      }
    }
  }
  __name(L, "L");
  return L(r), t.advanceWidth = k, u;
}
__name(Bs, "Bs");
function P0(e, t, r, n) {
  var i = [], a, o = new se.Parser(e, t), u = o.parseCard8();
  if (u === 0)
    for (var s = 0; s < r; s++) {
      if (a = o.parseCard8(), a >= n)
        throw new Error("CFF table CID Font FDSelect has bad FD index value " + a + " (FD count " + n + ")");
      i.push(a);
    }
  else if (u === 3) {
    var l = o.parseCard16(), f = o.parseCard16();
    if (f !== 0)
      throw new Error("CFF Table CID Font FDSelect format 3 range has bad initial GID " + f);
    for (var c, p = 0; p < l; p++) {
      if (a = o.parseCard8(), c = o.parseCard16(), a >= n)
        throw new Error("CFF table CID Font FDSelect has bad FD index value " + a + " (FD count " + n + ")");
      if (c > r)
        throw new Error("CFF Table CID Font FDSelect format 3 range has bad GID " + c);
      for (; f < c; f++)
        i.push(a);
      f = c;
    }
    if (c !== r)
      throw new Error("CFF Table CID Font FDSelect format 3 range has bad final GID " + c);
  } else
    throw new Error("CFF Table CID Font FDSelect table has unsupported format " + u);
  return i;
}
__name(P0, "P0");
function R0(e, t, r, n) {
  r.tables.cff = {};
  var i = T0(e, t), a = sr(e, i.endOffset, se.bytesToString), o = sr(e, a.endOffset), u = sr(e, o.endOffset, se.bytesToString), s = sr(e, u.endOffset);
  r.gsubrs = s.objects, r.gsubrsBias = na(r.gsubrs);
  var l = Us(e, t, o.objects, u.objects);
  if (l.length !== 1)
    throw new Error("CFF table has too many fonts in 'FontSet' - count of fonts NameIndex.length = " + l.length);
  var f = l[0];
  if (r.tables.cff.topDict = f, f._privateDict && (r.defaultWidthX = f._privateDict.defaultWidthX, r.nominalWidthX = f._privateDict.nominalWidthX), f.ros[0] !== void 0 && f.ros[1] !== void 0 && (r.isCIDFont = true), r.isCIDFont) {
    var c = f.fdArray, p = f.fdSelect;
    if (c === 0 || p === 0)
      throw new Error("Font is marked as a CID font, but FDArray and/or FDSelect information is missing");
    c += t;
    var d = sr(e, c), D = Us(e, t, d.objects, u.objects);
    f._fdArray = D, p += t, f._fdSelect = P0(e, p, r.numGlyphs, D.length);
  }
  var v = t + f.private[1], g = lu(e, v, f.private[0], u.objects);
  if (r.defaultWidthX = g.defaultWidthX, r.nominalWidthX = g.nominalWidthX, g.subrs !== 0) {
    var y = v + g.subrs, b = sr(e, y);
    r.subrs = b.objects, r.subrsBias = na(r.subrs);
  } else
    r.subrs = [], r.subrsBias = 0;
  var C;
  n.lowMemory ? (C = E0(e, t + f.charStrings), r.nGlyphs = C.offsets.length) : (C = sr(e, t + f.charStrings), r.nGlyphs = C.objects.length);
  var k = L0(e, t + f.charset, r.nGlyphs, u.objects);
  if (f.encoding === 0 ? r.cffEncoding = new kn(Xp, k) : f.encoding === 1 ? r.cffEncoding = new kn(qp, k) : r.cffEncoding = I0(e, t + f.encoding, k), r.encoding = r.encoding || r.cffEncoding, r.glyphs = new $t.GlyphSet(r), n.lowMemory)
    r._push = function(L) {
      var T = F0(L, C.offsets, e, t + f.charStrings);
      r.glyphs.push(L, $t.cffGlyphLoader(r, L, Bs, T));
    };
  else
    for (var S = 0; S < r.nGlyphs; S += 1) {
      var E = C.objects[S];
      r.glyphs.push(S, $t.cffGlyphLoader(r, S, Bs, E));
    }
}
__name(R0, "R0");
var U0 = { parse: R0 };
function B0(e, t, r) {
  var n = {}, i = new se.Parser(e, t);
  return n.tag = i.parseTag(), n.minValue = i.parseFixed(), n.defaultValue = i.parseFixed(), n.maxValue = i.parseFixed(), i.skip("uShort", 1), n.name = r[i.parseUShort()] || {}, n;
}
__name(B0, "B0");
function N0(e, t, r, n) {
  var i = {}, a = new se.Parser(e, t);
  i.name = n[a.parseUShort()] || {}, a.skip("uShort", 1), i.coordinates = {};
  for (var o = 0; o < r.length; ++o)
    i.coordinates[r[o].tag] = a.parseFixed();
  return i;
}
__name(N0, "N0");
function M0(e, t, r) {
  var n = new se.Parser(e, t), i = n.parseULong();
  Te.argument(i === 65536, "Unsupported fvar table version.");
  var a = n.parseOffset16();
  n.skip("uShort", 1);
  for (var o = n.parseUShort(), u = n.parseUShort(), s = n.parseUShort(), l = n.parseUShort(), f = [], c = 0; c < o; c++)
    f.push(B0(e, t + a + c * u, r));
  for (var p = [], d = t + a + o * u, D = 0; D < s; D++)
    p.push(N0(e, d + D * l, f, r));
  return { axes: f, instances: p };
}
__name(M0, "M0");
var G0 = { parse: M0 };
var W0 = /* @__PURE__ */ __name(function() {
  return { coverage: this.parsePointer($.coverage), attachPoints: this.parseList($.pointer($.uShortList)) };
}, "W0");
var $0 = /* @__PURE__ */ __name(function() {
  var e = this.parseUShort();
  if (Te.argument(e === 1 || e === 2 || e === 3, "Unsupported CaretValue table version."), e === 1)
    return { coordinate: this.parseShort() };
  if (e === 2)
    return { pointindex: this.parseShort() };
  if (e === 3)
    return { coordinate: this.parseShort() };
}, "$0");
var j0 = /* @__PURE__ */ __name(function() {
  return this.parseList($.pointer($0));
}, "j0");
var z0 = /* @__PURE__ */ __name(function() {
  return { coverage: this.parsePointer($.coverage), ligGlyphs: this.parseList($.pointer(j0)) };
}, "z0");
var V0 = /* @__PURE__ */ __name(function() {
  return this.parseUShort(), this.parseList($.pointer($.coverage));
}, "V0");
function H0(e, t) {
  t = t || 0;
  var r = new $(e, t), n = r.parseVersion(1);
  Te.argument(n === 1 || n === 1.2 || n === 1.3, "Unsupported GDEF table version.");
  var i = { version: n, classDef: r.parsePointer($.classDef), attachList: r.parsePointer(W0), ligCaretList: r.parsePointer(z0), markAttachClassDef: r.parsePointer($.classDef) };
  return n >= 1.2 && (i.markGlyphSets = r.parsePointer(V0)), i;
}
__name(H0, "H0");
var X0 = { parse: H0 };
var _t = new Array(10);
_t[1] = function() {
  var t = this.offset + this.relativeOffset, r = this.parseUShort();
  if (r === 1)
    return { posFormat: 1, coverage: this.parsePointer($.coverage), value: this.parseValueRecord() };
  if (r === 2)
    return { posFormat: 2, coverage: this.parsePointer($.coverage), values: this.parseValueRecordList() };
  Te.assert(false, "0x" + t.toString(16) + ": GPOS lookup type 1 format must be 1 or 2.");
};
_t[2] = function() {
  var t = this.offset + this.relativeOffset, r = this.parseUShort();
  Te.assert(r === 1 || r === 2, "0x" + t.toString(16) + ": GPOS lookup type 2 format must be 1 or 2.");
  var n = this.parsePointer($.coverage), i = this.parseUShort(), a = this.parseUShort();
  if (r === 1)
    return { posFormat: r, coverage: n, valueFormat1: i, valueFormat2: a, pairSets: this.parseList($.pointer($.list(function() {
      return { secondGlyph: this.parseUShort(), value1: this.parseValueRecord(i), value2: this.parseValueRecord(a) };
    }))) };
  if (r === 2) {
    var o = this.parsePointer($.classDef), u = this.parsePointer($.classDef), s = this.parseUShort(), l = this.parseUShort();
    return { posFormat: r, coverage: n, valueFormat1: i, valueFormat2: a, classDef1: o, classDef2: u, class1Count: s, class2Count: l, classRecords: this.parseList(s, $.list(l, function() {
      return { value1: this.parseValueRecord(i), value2: this.parseValueRecord(a) };
    })) };
  }
};
_t[3] = function() {
  return { error: "GPOS Lookup 3 not supported" };
};
_t[4] = function() {
  return { error: "GPOS Lookup 4 not supported" };
};
_t[5] = function() {
  return { error: "GPOS Lookup 5 not supported" };
};
_t[6] = function() {
  return { error: "GPOS Lookup 6 not supported" };
};
_t[7] = function() {
  return { error: "GPOS Lookup 7 not supported" };
};
_t[8] = function() {
  return { error: "GPOS Lookup 8 not supported" };
};
_t[9] = function() {
  return { error: "GPOS Lookup 9 not supported" };
};
function q0(e, t) {
  t = t || 0;
  var r = new $(e, t), n = r.parseVersion(1);
  return Te.argument(n === 1 || n === 1.1, "Unsupported GPOS table version " + n), n === 1 ? { version: n, scripts: r.parseScriptList(), features: r.parseFeatureList(), lookups: r.parseLookupList(_t) } : { version: n, scripts: r.parseScriptList(), features: r.parseFeatureList(), lookups: r.parseLookupList(_t), variations: r.parseFeatureVariationsList() };
}
__name(q0, "q0");
var Y0 = { parse: q0 };
var At = new Array(9);
At[1] = function() {
  var t = this.offset + this.relativeOffset, r = this.parseUShort();
  if (r === 1)
    return { substFormat: 1, coverage: this.parsePointer($.coverage), deltaGlyphId: this.parseUShort() };
  if (r === 2)
    return { substFormat: 2, coverage: this.parsePointer($.coverage), substitute: this.parseOffset16List() };
  Te.assert(false, "0x" + t.toString(16) + ": lookup type 1 format must be 1 or 2.");
};
At[2] = function() {
  var t = this.parseUShort();
  return Te.argument(t === 1, "GSUB Multiple Substitution Subtable identifier-format must be 1"), { substFormat: t, coverage: this.parsePointer($.coverage), sequences: this.parseListOfLists() };
};
At[3] = function() {
  var t = this.parseUShort();
  return Te.argument(t === 1, "GSUB Alternate Substitution Subtable identifier-format must be 1"), { substFormat: t, coverage: this.parsePointer($.coverage), alternateSets: this.parseListOfLists() };
};
At[4] = function() {
  var t = this.parseUShort();
  return Te.argument(t === 1, "GSUB ligature table identifier-format must be 1"), { substFormat: t, coverage: this.parsePointer($.coverage), ligatureSets: this.parseListOfLists(function() {
    return { ligGlyph: this.parseUShort(), components: this.parseUShortList(this.parseUShort() - 1) };
  }) };
};
var _r = { sequenceIndex: $.uShort, lookupListIndex: $.uShort };
At[5] = function() {
  var t = this.offset + this.relativeOffset, r = this.parseUShort();
  if (r === 1)
    return { substFormat: r, coverage: this.parsePointer($.coverage), ruleSets: this.parseListOfLists(function() {
      var a = this.parseUShort(), o = this.parseUShort();
      return { input: this.parseUShortList(a - 1), lookupRecords: this.parseRecordList(o, _r) };
    }) };
  if (r === 2)
    return { substFormat: r, coverage: this.parsePointer($.coverage), classDef: this.parsePointer($.classDef), classSets: this.parseListOfLists(function() {
      var a = this.parseUShort(), o = this.parseUShort();
      return { classes: this.parseUShortList(a - 1), lookupRecords: this.parseRecordList(o, _r) };
    }) };
  if (r === 3) {
    var n = this.parseUShort(), i = this.parseUShort();
    return { substFormat: r, coverages: this.parseList(n, $.pointer($.coverage)), lookupRecords: this.parseRecordList(i, _r) };
  }
  Te.assert(false, "0x" + t.toString(16) + ": lookup type 5 format must be 1, 2 or 3.");
};
At[6] = function() {
  var t = this.offset + this.relativeOffset, r = this.parseUShort();
  if (r === 1)
    return { substFormat: 1, coverage: this.parsePointer($.coverage), chainRuleSets: this.parseListOfLists(function() {
      return { backtrack: this.parseUShortList(), input: this.parseUShortList(this.parseShort() - 1), lookahead: this.parseUShortList(), lookupRecords: this.parseRecordList(_r) };
    }) };
  if (r === 2)
    return { substFormat: 2, coverage: this.parsePointer($.coverage), backtrackClassDef: this.parsePointer($.classDef), inputClassDef: this.parsePointer($.classDef), lookaheadClassDef: this.parsePointer($.classDef), chainClassSet: this.parseListOfLists(function() {
      return { backtrack: this.parseUShortList(), input: this.parseUShortList(this.parseShort() - 1), lookahead: this.parseUShortList(), lookupRecords: this.parseRecordList(_r) };
    }) };
  if (r === 3)
    return { substFormat: 3, backtrackCoverage: this.parseList($.pointer($.coverage)), inputCoverage: this.parseList($.pointer($.coverage)), lookaheadCoverage: this.parseList($.pointer($.coverage)), lookupRecords: this.parseRecordList(_r) };
  Te.assert(false, "0x" + t.toString(16) + ": lookup type 6 format must be 1, 2 or 3.");
};
At[7] = function() {
  var t = this.parseUShort();
  Te.argument(t === 1, "GSUB Extension Substitution subtable identifier-format must be 1");
  var r = this.parseUShort(), n = new $(this.data, this.offset + this.parseULong());
  return { substFormat: 1, lookupType: r, extension: At[r].call(n) };
};
At[8] = function() {
  var t = this.parseUShort();
  return Te.argument(t === 1, "GSUB Reverse Chaining Contextual Single Substitution Subtable identifier-format must be 1"), { substFormat: t, coverage: this.parsePointer($.coverage), backtrackCoverage: this.parseList($.pointer($.coverage)), lookaheadCoverage: this.parseList($.pointer($.coverage)), substitutes: this.parseUShortList() };
};
function Z0(e, t) {
  t = t || 0;
  var r = new $(e, t), n = r.parseVersion(1);
  return Te.argument(n === 1 || n === 1.1, "Unsupported GSUB table version."), n === 1 ? { version: n, scripts: r.parseScriptList(), features: r.parseFeatureList(), lookups: r.parseLookupList(At) } : { version: n, scripts: r.parseScriptList(), features: r.parseFeatureList(), lookups: r.parseLookupList(At), variations: r.parseFeatureVariationsList() };
}
__name(Z0, "Z0");
var J0 = { parse: Z0 };
function K0(e, t) {
  var r = {}, n = new se.Parser(e, t);
  return r.version = n.parseVersion(), r.fontRevision = Math.round(n.parseFixed() * 1e3) / 1e3, r.checkSumAdjustment = n.parseULong(), r.magicNumber = n.parseULong(), Te.argument(r.magicNumber === 1594834165, "Font header has wrong magic number."), r.flags = n.parseUShort(), r.unitsPerEm = n.parseUShort(), r.created = n.parseLongDateTime(), r.modified = n.parseLongDateTime(), r.xMin = n.parseShort(), r.yMin = n.parseShort(), r.xMax = n.parseShort(), r.yMax = n.parseShort(), r.macStyle = n.parseUShort(), r.lowestRecPPEM = n.parseUShort(), r.fontDirectionHint = n.parseShort(), r.indexToLocFormat = n.parseShort(), r.glyphDataFormat = n.parseShort(), r;
}
__name(K0, "K0");
var Q0 = { parse: K0 };
function ev(e, t) {
  var r = {}, n = new se.Parser(e, t);
  return r.version = n.parseVersion(), r.ascender = n.parseShort(), r.descender = n.parseShort(), r.lineGap = n.parseShort(), r.advanceWidthMax = n.parseUShort(), r.minLeftSideBearing = n.parseShort(), r.minRightSideBearing = n.parseShort(), r.xMaxExtent = n.parseShort(), r.caretSlopeRise = n.parseShort(), r.caretSlopeRun = n.parseShort(), r.caretOffset = n.parseShort(), n.relativeOffset += 8, r.metricDataFormat = n.parseShort(), r.numberOfHMetrics = n.parseUShort(), r;
}
__name(ev, "ev");
var tv = { parse: ev };
function rv(e, t, r, n, i) {
  for (var a, o, u = new se.Parser(e, t), s = 0; s < n; s += 1) {
    s < r && (a = u.parseUShort(), o = u.parseShort());
    var l = i.get(s);
    l.advanceWidth = a, l.leftSideBearing = o;
  }
}
__name(rv, "rv");
function nv(e, t, r, n, i) {
  e._hmtxTableData = {};
  for (var a, o, u = new se.Parser(t, r), s = 0; s < i; s += 1)
    s < n && (a = u.parseUShort(), o = u.parseShort()), e._hmtxTableData[s] = { advanceWidth: a, leftSideBearing: o };
}
__name(nv, "nv");
function iv(e, t, r, n, i, a, o) {
  o.lowMemory ? nv(e, t, r, n, i) : rv(t, r, n, i, a);
}
__name(iv, "iv");
var av = { parse: iv };
function ov(e) {
  var t = {};
  e.skip("uShort");
  var r = e.parseUShort();
  Te.argument(r === 0, "Unsupported kern sub-table version."), e.skip("uShort", 2);
  var n = e.parseUShort();
  e.skip("uShort", 3);
  for (var i = 0; i < n; i += 1) {
    var a = e.parseUShort(), o = e.parseUShort(), u = e.parseShort();
    t[a + "," + o] = u;
  }
  return t;
}
__name(ov, "ov");
function sv(e) {
  var t = {};
  e.skip("uShort");
  var r = e.parseULong();
  r > 1 && console.warn("Only the first kern subtable is supported."), e.skip("uLong");
  var n = e.parseUShort(), i = n & 255;
  if (e.skip("uShort"), i === 0) {
    var a = e.parseUShort();
    e.skip("uShort", 3);
    for (var o = 0; o < a; o += 1) {
      var u = e.parseUShort(), s = e.parseUShort(), l = e.parseShort();
      t[u + "," + s] = l;
    }
  }
  return t;
}
__name(sv, "sv");
function uv(e, t) {
  var r = new se.Parser(e, t), n = r.parseUShort();
  if (n === 0)
    return ov(r);
  if (n === 1)
    return sv(r);
  throw new Error("Unsupported kern table version (" + n + ").");
}
__name(uv, "uv");
var lv = { parse: uv };
function fv(e, t) {
  var r = new se.Parser(e, t), n = r.parseULong();
  Te.argument(n === 1, "Unsupported ltag table version."), r.skip("uLong", 1);
  for (var i = r.parseULong(), a = [], o = 0; o < i; o++) {
    for (var u = "", s = t + r.parseUShort(), l = r.parseUShort(), f = s; f < s + l; ++f)
      u += String.fromCharCode(e.getInt8(f));
    a.push(u);
  }
  return a;
}
__name(fv, "fv");
var cv = { parse: fv };
function pv(e, t, r, n) {
  for (var i = new se.Parser(e, t), a = n ? i.parseUShort : i.parseULong, o = [], u = 0; u < r + 1; u += 1) {
    var s = a.call(i);
    n && (s *= 2), o.push(s);
  }
  return o;
}
__name(pv, "pv");
var hv = { parse: pv };
function dv(e, t) {
  var r = {}, n = new se.Parser(e, t);
  return r.version = n.parseVersion(), r.numGlyphs = n.parseUShort(), r.version === 1 && (r.maxPoints = n.parseUShort(), r.maxContours = n.parseUShort(), r.maxCompositePoints = n.parseUShort(), r.maxCompositeContours = n.parseUShort(), r.maxZones = n.parseUShort(), r.maxTwilightPoints = n.parseUShort(), r.maxStorage = n.parseUShort(), r.maxFunctionDefs = n.parseUShort(), r.maxInstructionDefs = n.parseUShort(), r.maxStackElements = n.parseUShort(), r.maxSizeOfInstructions = n.parseUShort(), r.maxComponentElements = n.parseUShort(), r.maxComponentDepth = n.parseUShort()), r;
}
__name(dv, "dv");
var vv = { parse: dv };
function gv(e, t) {
  var r = {}, n = new se.Parser(e, t);
  r.version = n.parseUShort(), r.xAvgCharWidth = n.parseShort(), r.usWeightClass = n.parseUShort(), r.usWidthClass = n.parseUShort(), r.fsType = n.parseUShort(), r.ySubscriptXSize = n.parseShort(), r.ySubscriptYSize = n.parseShort(), r.ySubscriptXOffset = n.parseShort(), r.ySubscriptYOffset = n.parseShort(), r.ySuperscriptXSize = n.parseShort(), r.ySuperscriptYSize = n.parseShort(), r.ySuperscriptXOffset = n.parseShort(), r.ySuperscriptYOffset = n.parseShort(), r.yStrikeoutSize = n.parseShort(), r.yStrikeoutPosition = n.parseShort(), r.sFamilyClass = n.parseShort(), r.panose = [];
  for (var i = 0; i < 10; i++)
    r.panose[i] = n.parseByte();
  return r.ulUnicodeRange1 = n.parseULong(), r.ulUnicodeRange2 = n.parseULong(), r.ulUnicodeRange3 = n.parseULong(), r.ulUnicodeRange4 = n.parseULong(), r.achVendID = String.fromCharCode(n.parseByte(), n.parseByte(), n.parseByte(), n.parseByte()), r.fsSelection = n.parseUShort(), r.usFirstCharIndex = n.parseUShort(), r.usLastCharIndex = n.parseUShort(), r.sTypoAscender = n.parseShort(), r.sTypoDescender = n.parseShort(), r.sTypoLineGap = n.parseShort(), r.usWinAscent = n.parseUShort(), r.usWinDescent = n.parseUShort(), r.version >= 1 && (r.ulCodePageRange1 = n.parseULong(), r.ulCodePageRange2 = n.parseULong()), r.version >= 2 && (r.sxHeight = n.parseShort(), r.sCapHeight = n.parseShort(), r.usDefaultChar = n.parseUShort(), r.usBreakChar = n.parseUShort(), r.usMaxContent = n.parseUShort()), r;
}
__name(gv, "gv");
var mv = { parse: gv };
function Dv(e, t) {
  var r = {}, n = new se.Parser(e, t);
  switch (r.version = n.parseVersion(), r.italicAngle = n.parseFixed(), r.underlinePosition = n.parseShort(), r.underlineThickness = n.parseShort(), r.isFixedPitch = n.parseULong(), r.minMemType42 = n.parseULong(), r.maxMemType42 = n.parseULong(), r.minMemType1 = n.parseULong(), r.maxMemType1 = n.parseULong(), r.names = [], r.version) {
    case 1:
      break;
    case 2:
      r.numberOfGlyphs = n.parseUShort(), r.glyphNameIndex = new Array(r.numberOfGlyphs);
      for (var i = 0; i < r.numberOfGlyphs; i++)
        r.glyphNameIndex[i] = n.parseUShort();
      break;
    case 2.5:
      r.numberOfGlyphs = n.parseUShort(), r.offset = new Array(r.numberOfGlyphs);
      for (var a = 0; a < r.numberOfGlyphs; a++)
        r.offset[a] = n.parseChar();
      break;
  }
  return r;
}
__name(Dv, "Dv");
var yv = { parse: Dv };
var On = {};
On.UTF8 = function(e, t, r) {
  for (var n = [], i = r, a = 0; a < i; a++, t += 1)
    n[a] = e.getUint8(t);
  return String.fromCharCode.apply(null, n);
};
On.UTF16 = function(e, t, r) {
  for (var n = [], i = r / 2, a = 0; a < i; a++, t += 2)
    n[a] = e.getUint16(t);
  return String.fromCharCode.apply(null, n);
};
var bv = { "x-mac-croatian": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\u2020\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\u0160\u2122\xB4\xA8\u2260\u017D\xD8\u221E\xB1\u2264\u2265\u2206\xB5\u2202\u2211\u220F\u0161\u222B\xAA\xBA\u03A9\u017E\xF8\xBF\xA1\xAC\u221A\u0192\u2248\u0106\xAB\u010C\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u0110\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\uF8FF\xA9\u2044\u20AC\u2039\u203A\xC6\xBB\u2013\xB7\u201A\u201E\u2030\xC2\u0107\xC1\u010D\xC8\xCD\xCE\xCF\xCC\xD3\xD4\u0111\xD2\xDA\xDB\xD9\u0131\u02C6\u02DC\xAF\u03C0\xCB\u02DA\xB8\xCA\xE6\u02C7", "x-mac-cyrillic": "\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F\u2020\xB0\u0490\xA3\xA7\u2022\xB6\u0406\xAE\xA9\u2122\u0402\u0452\u2260\u0403\u0453\u221E\xB1\u2264\u2265\u0456\xB5\u0491\u0408\u0404\u0454\u0407\u0457\u0409\u0459\u040A\u045A\u0458\u0405\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\u040B\u045B\u040C\u045C\u0455\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u201E\u040E\u045E\u040F\u045F\u2116\u0401\u0451\u044F\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E", "x-mac-gaelic": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\u2020\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\xB4\xA8\u2260\xC6\xD8\u1E02\xB1\u2264\u2265\u1E03\u010A\u010B\u1E0A\u1E0B\u1E1E\u1E1F\u0120\u0121\u1E40\xE6\xF8\u1E41\u1E56\u1E57\u027C\u0192\u017F\u1E60\xAB\xBB\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\u1E61\u1E9B\xFF\u0178\u1E6A\u20AC\u2039\u203A\u0176\u0177\u1E6B\xB7\u1EF2\u1EF3\u204A\xC2\xCA\xC1\xCB\xC8\xCD\xCE\xCF\xCC\xD3\xD4\u2663\xD2\xDA\xDB\xD9\u0131\xDD\xFD\u0174\u0175\u1E84\u1E85\u1E80\u1E81\u1E82\u1E83", "x-mac-greek": "\xC4\xB9\xB2\xC9\xB3\xD6\xDC\u0385\xE0\xE2\xE4\u0384\xA8\xE7\xE9\xE8\xEA\xEB\xA3\u2122\xEE\xEF\u2022\xBD\u2030\xF4\xF6\xA6\u20AC\xF9\xFB\xFC\u2020\u0393\u0394\u0398\u039B\u039E\u03A0\xDF\xAE\xA9\u03A3\u03AA\xA7\u2260\xB0\xB7\u0391\xB1\u2264\u2265\xA5\u0392\u0395\u0396\u0397\u0399\u039A\u039C\u03A6\u03AB\u03A8\u03A9\u03AC\u039D\xAC\u039F\u03A1\u2248\u03A4\xAB\xBB\u2026\xA0\u03A5\u03A7\u0386\u0388\u0153\u2013\u2015\u201C\u201D\u2018\u2019\xF7\u0389\u038A\u038C\u038E\u03AD\u03AE\u03AF\u03CC\u038F\u03CD\u03B1\u03B2\u03C8\u03B4\u03B5\u03C6\u03B3\u03B7\u03B9\u03BE\u03BA\u03BB\u03BC\u03BD\u03BF\u03C0\u03CE\u03C1\u03C3\u03C4\u03B8\u03C9\u03C2\u03C7\u03C5\u03B6\u03CA\u03CB\u0390\u03B0\xAD", "x-mac-icelandic": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\xDD\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\xB4\xA8\u2260\xC6\xD8\u221E\xB1\u2264\u2265\xA5\xB5\u2202\u2211\u220F\u03C0\u222B\xAA\xBA\u03A9\xE6\xF8\xBF\xA1\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\xFF\u0178\u2044\u20AC\xD0\xF0\xDE\xFE\xFD\xB7\u201A\u201E\u2030\xC2\xCA\xC1\xCB\xC8\xCD\xCE\xCF\xCC\xD3\xD4\uF8FF\xD2\xDA\xDB\xD9\u0131\u02C6\u02DC\xAF\u02D8\u02D9\u02DA\xB8\u02DD\u02DB\u02C7", "x-mac-inuit": "\u1403\u1404\u1405\u1406\u140A\u140B\u1431\u1432\u1433\u1434\u1438\u1439\u1449\u144E\u144F\u1450\u1451\u1455\u1456\u1466\u146D\u146E\u146F\u1470\u1472\u1473\u1483\u148B\u148C\u148D\u148E\u1490\u1491\xB0\u14A1\u14A5\u14A6\u2022\xB6\u14A7\xAE\xA9\u2122\u14A8\u14AA\u14AB\u14BB\u14C2\u14C3\u14C4\u14C5\u14C7\u14C8\u14D0\u14EF\u14F0\u14F1\u14F2\u14F4\u14F5\u1505\u14D5\u14D6\u14D7\u14D8\u14DA\u14DB\u14EA\u1528\u1529\u152A\u152B\u152D\u2026\xA0\u152E\u153E\u1555\u1556\u1557\u2013\u2014\u201C\u201D\u2018\u2019\u1558\u1559\u155A\u155D\u1546\u1547\u1548\u1549\u154B\u154C\u1550\u157F\u1580\u1581\u1582\u1583\u1584\u1585\u158F\u1590\u1591\u1592\u1593\u1594\u1595\u1671\u1672\u1673\u1674\u1675\u1676\u1596\u15A0\u15A1\u15A2\u15A3\u15A4\u15A5\u15A6\u157C\u0141\u0142", "x-mac-ce": "\xC4\u0100\u0101\xC9\u0104\xD6\xDC\xE1\u0105\u010C\xE4\u010D\u0106\u0107\xE9\u0179\u017A\u010E\xED\u010F\u0112\u0113\u0116\xF3\u0117\xF4\xF6\xF5\xFA\u011A\u011B\xFC\u2020\xB0\u0118\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\u0119\xA8\u2260\u0123\u012E\u012F\u012A\u2264\u2265\u012B\u0136\u2202\u2211\u0142\u013B\u013C\u013D\u013E\u0139\u013A\u0145\u0146\u0143\xAC\u221A\u0144\u0147\u2206\xAB\xBB\u2026\xA0\u0148\u0150\xD5\u0151\u014C\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\u014D\u0154\u0155\u0158\u2039\u203A\u0159\u0156\u0157\u0160\u201A\u201E\u0161\u015A\u015B\xC1\u0164\u0165\xCD\u017D\u017E\u016A\xD3\xD4\u016B\u016E\xDA\u016F\u0170\u0171\u0172\u0173\xDD\xFD\u0137\u017B\u0141\u017C\u0122\u02C7", macintosh: "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\u2020\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\xB4\xA8\u2260\xC6\xD8\u221E\xB1\u2264\u2265\xA5\xB5\u2202\u2211\u220F\u03C0\u222B\xAA\xBA\u03A9\xE6\xF8\xBF\xA1\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\xFF\u0178\u2044\u20AC\u2039\u203A\uFB01\uFB02\u2021\xB7\u201A\u201E\u2030\xC2\xCA\xC1\xCB\xC8\xCD\xCE\xCF\xCC\xD3\xD4\uF8FF\xD2\xDA\xDB\xD9\u0131\u02C6\u02DC\xAF\u02D8\u02D9\u02DA\xB8\u02DD\u02DB\u02C7", "x-mac-romanian": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\u2020\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\xB4\xA8\u2260\u0102\u0218\u221E\xB1\u2264\u2265\xA5\xB5\u2202\u2211\u220F\u03C0\u222B\xAA\xBA\u03A9\u0103\u0219\xBF\xA1\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\xFF\u0178\u2044\u20AC\u2039\u203A\u021A\u021B\u2021\xB7\u201A\u201E\u2030\xC2\xCA\xC1\xCB\xC8\xCD\xCE\xCF\xCC\xD3\xD4\uF8FF\xD2\xDA\xDB\xD9\u0131\u02C6\u02DC\xAF\u02D8\u02D9\u02DA\xB8\u02DD\u02DB\u02C7", "x-mac-turkish": "\xC4\xC5\xC7\xC9\xD1\xD6\xDC\xE1\xE0\xE2\xE4\xE3\xE5\xE7\xE9\xE8\xEA\xEB\xED\xEC\xEE\xEF\xF1\xF3\xF2\xF4\xF6\xF5\xFA\xF9\xFB\xFC\u2020\xB0\xA2\xA3\xA7\u2022\xB6\xDF\xAE\xA9\u2122\xB4\xA8\u2260\xC6\xD8\u221E\xB1\u2264\u2265\xA5\xB5\u2202\u2211\u220F\u03C0\u222B\xAA\xBA\u03A9\xE6\xF8\xBF\xA1\xAC\u221A\u0192\u2248\u2206\xAB\xBB\u2026\xA0\xC0\xC3\xD5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\xF7\u25CA\xFF\u0178\u011E\u011F\u0130\u0131\u015E\u015F\u2021\xB7\u201A\u201E\u2030\xC2\xCA\xC1\xCB\xC8\xCD\xCE\xCF\xCC\xD3\xD4\uF8FF\xD2\xDA\xDB\xD9\uF8A0\u02C6\u02DC\xAF\u02D8\u02D9\u02DA\xB8\u02DD\u02DB\u02C7" };
On.MACSTRING = function(e, t, r, n) {
  var i = bv[n];
  if (i !== void 0) {
    for (var a = "", o = 0; o < r; o++) {
      var u = e.getUint8(t + o);
      u <= 127 ? a += String.fromCharCode(u) : a += i[u & 127];
    }
    return a;
  }
};
function xv(e, t) {
  var r = new se.Parser(e, t), n = r.parseULong();
  Te.argument(n === 1, "Unsupported META table version."), r.parseULong(), r.parseULong();
  for (var i = r.parseULong(), a = {}, o = 0; o < i; o++) {
    var u = r.parseTag(), s = r.parseULong(), l = r.parseULong(), f = On.UTF8(e, t + s, l);
    a[u] = f;
  }
  return a;
}
__name(xv, "xv");
var wv = { parse: xv };
function Ns(e, t) {
  for (var r = [], n = 12, i = 0; i < t; i += 1) {
    var a = se.getTag(e, n), o = se.getULong(e, n + 4), u = se.getULong(e, n + 8), s = se.getULong(e, n + 12);
    r.push({ tag: a, checksum: o, offset: u, length: s, compression: false }), n += 16;
  }
  return r;
}
__name(Ns, "Ns");
function Ev(e, t) {
  for (var r = [], n = 44, i = 0; i < t; i += 1) {
    var a = se.getTag(e, n), o = se.getULong(e, n + 4), u = se.getULong(e, n + 8), s = se.getULong(e, n + 12), l = void 0;
    u < s ? l = "WOFF" : l = false, r.push({ tag: a, offset: o, compression: l, compressedLength: u, length: s }), n += 20;
  }
  return r;
}
__name(Ev, "Ev");
function je(e, t) {
  if (t.compression === "WOFF") {
    var r = new Uint8Array(e.buffer, t.offset + 2, t.compressedLength - 2), n = new Uint8Array(t.length);
    if (jp(r, n), n.byteLength !== t.length)
      throw new Error("Decompression error: " + t.tag + " decompressed length doesn't match recorded length");
    var i = new DataView(n.buffer, 0);
    return { data: i, offset: 0 };
  } else
    return { data: e, offset: t.offset };
}
__name(je, "je");
function Fv(e, t) {
  t = t ?? {};
  var r, n = new st({ empty: true }), i = new DataView(e, 0), a, o = [], u = se.getTag(i, 0);
  if (u === "\0\0\0" || u === "true" || u === "typ1")
    n.outlinesFormat = "truetype", a = se.getUShort(i, 4), o = Ns(i, a);
  else if (u === "OTTO")
    n.outlinesFormat = "cff", a = se.getUShort(i, 4), o = Ns(i, a);
  else if (u === "wOFF") {
    var s = se.getTag(i, 4);
    if (s === "\0\0\0")
      n.outlinesFormat = "truetype";
    else if (s === "OTTO")
      n.outlinesFormat = "cff";
    else
      throw new Error("Unsupported OpenType flavor " + u);
    a = se.getUShort(i, 12), o = Ev(i, a);
  } else
    throw new Error("Unsupported OpenType signature " + u);
  for (var l, f, c, p, d, D, v, g, y, b, C, k = 0; k < a; k += 1) {
    var S = o[k], E = void 0;
    switch (S.tag) {
      case "cmap":
        E = je(i, S), n.tables.cmap = w0.parse(E.data, E.offset), n.encoding = new Xs(n.tables.cmap);
        break;
      case "cvt ":
        E = je(i, S), C = new se.Parser(E.data, E.offset), n.tables.cvt = C.parseShortList(S.length / 2);
        break;
      case "fvar":
        f = S;
        break;
      case "fpgm":
        E = je(i, S), C = new se.Parser(E.data, E.offset), n.tables.fpgm = C.parseByteList(S.length);
        break;
      case "head":
        E = je(i, S), n.tables.head = Q0.parse(E.data, E.offset), n.unitsPerEm = n.tables.head.unitsPerEm, r = n.tables.head.indexToLocFormat;
        break;
      case "hhea":
        E = je(i, S), n.tables.hhea = tv.parse(E.data, E.offset), n.ascender = n.tables.hhea.ascender, n.descender = n.tables.hhea.descender, n.numberOfHMetrics = n.tables.hhea.numberOfHMetrics;
        break;
      case "hmtx":
        v = S;
        break;
      case "ltag":
        E = je(i, S), ltagTable = cv.parse(E.data, E.offset);
        break;
      case "maxp":
        E = je(i, S), n.tables.maxp = vv.parse(E.data, E.offset), n.numGlyphs = n.tables.maxp.numGlyphs;
        break;
      case "OS/2":
        E = je(i, S), n.tables.os2 = mv.parse(E.data, E.offset);
        break;
      case "post":
        E = je(i, S), n.tables.post = yv.parse(E.data, E.offset);
        break;
      case "prep":
        E = je(i, S), C = new se.Parser(E.data, E.offset), n.tables.prep = C.parseByteList(S.length);
        break;
      case "glyf":
        c = S;
        break;
      case "loca":
        y = S;
        break;
      case "CFF ":
        l = S;
        break;
      case "kern":
        g = S;
        break;
      case "GDEF":
        p = S;
        break;
      case "GPOS":
        d = S;
        break;
      case "GSUB":
        D = S;
        break;
      case "meta":
        b = S;
        break;
    }
  }
  if (c && y) {
    var L = r === 0, T = je(i, y), U = hv.parse(T.data, T.offset, n.numGlyphs, L), M = je(i, c);
    n.glyphs = Qs.parse(M.data, M.offset, U, n, t);
  } else if (l) {
    var H = je(i, l);
    U0.parse(H.data, H.offset, n, t);
  } else
    throw new Error("Font doesn't contain TrueType or CFF outlines.");
  var q = je(i, v);
  if (av.parse(n, q.data, q.offset, n.numberOfHMetrics, n.numGlyphs, n.glyphs, t), Jp(n, t), g) {
    var ee = je(i, g);
    n.kerningPairs = lv.parse(ee.data, ee.offset);
  } else
    n.kerningPairs = {};
  if (p) {
    var A = je(i, p);
    n.tables.gdef = X0.parse(A.data, A.offset);
  }
  if (d) {
    var R = je(i, d);
    n.tables.gpos = Y0.parse(R.data, R.offset), n.position.init();
  }
  if (D) {
    var O = je(i, D);
    n.tables.gsub = J0.parse(O.data, O.offset);
  }
  if (f) {
    var Y = je(i, f);
    n.tables.fvar = G0.parse(Y.data, Y.offset, n.names);
  }
  if (b) {
    var Z = je(i, b);
    n.tables.meta = wv.parse(Z.data, Z.offset), n.metas = n.tables.meta;
  }
  return n;
}
__name(Fv, "Fv");
function Cv() {
}
__name(Cv, "Cv");
function Sv() {
}
__name(Sv, "Sv");
var kv = Object.freeze({ __proto__: null, Font: st, Glyph: Jt, Path: ot, _parse: se, parse: Fv, load: Cv, loadSync: Sv });
var Ln = kv;
var Tv = Object.create;
var Yn = Object.defineProperty;
var _v = Object.getOwnPropertyDescriptor;
var Av = Object.getOwnPropertyNames;
var Ov = Object.getPrototypeOf;
var Lv = Object.prototype.hasOwnProperty;
var _a = /* @__PURE__ */ __name((e, t) => () => (e && (t = e(e = 0)), t), "_a");
var le = /* @__PURE__ */ __name((e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), "le");
var Aa = /* @__PURE__ */ __name((e, t) => {
  for (var r in t)
    Yn(e, r, { get: t[r], enumerable: true });
}, "Aa");
var Nu = /* @__PURE__ */ __name((e, t, r, n) => {
  if (t && typeof t == "object" || typeof t == "function")
    for (let i of Av(t))
      !Lv.call(e, i) && i !== r && Yn(e, i, { get: () => t[i], enumerable: !(n = _v(t, i)) || n.enumerable });
  return e;
}, "Nu");
var Iv = /* @__PURE__ */ __name((e, t, r) => (r = e != null ? Tv(Ov(e)) : {}, Nu(t || !e || !e.__esModule ? Yn(r, "default", { value: e, enumerable: true }) : r, e)), "Iv");
var Xn = /* @__PURE__ */ __name((e) => Nu(Yn({}, "__esModule", { value: true }), e), "Xn");
var Mu = {};
Aa(Mu, { getYogaModule: () => Pv });
async function Pv() {
  return {};
}
__name(Pv, "Pv");
var Rv = _a(() => {
});
var Gu = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: () => t });
  function t(r) {
    if (r = `${r}`, r === "0")
      return "0";
    if (/^[+-]?(\d+|\d*\.\d+)(e[+-]?\d+)?(%|\w+)?$/.test(r))
      return r.replace(/^[+-]?/, (n) => n === "-" ? "" : "-");
    if (r.includes("var(") || r.includes("calc("))
      return `calc(${r} * -1)`;
  }
  __name(t, "t");
});
var Uv = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: () => t });
  var t = ["preflight", "container", "accessibility", "pointerEvents", "visibility", "position", "inset", "isolation", "zIndex", "order", "gridColumn", "gridColumnStart", "gridColumnEnd", "gridRow", "gridRowStart", "gridRowEnd", "float", "clear", "margin", "boxSizing", "display", "aspectRatio", "height", "maxHeight", "minHeight", "width", "minWidth", "maxWidth", "flex", "flexShrink", "flexGrow", "flexBasis", "tableLayout", "borderCollapse", "borderSpacing", "transformOrigin", "translate", "rotate", "skew", "scale", "transform", "animation", "cursor", "touchAction", "userSelect", "resize", "scrollSnapType", "scrollSnapAlign", "scrollSnapStop", "scrollMargin", "scrollPadding", "listStylePosition", "listStyleType", "appearance", "columns", "breakBefore", "breakInside", "breakAfter", "gridAutoColumns", "gridAutoFlow", "gridAutoRows", "gridTemplateColumns", "gridTemplateRows", "flexDirection", "flexWrap", "placeContent", "placeItems", "alignContent", "alignItems", "justifyContent", "justifyItems", "gap", "space", "divideWidth", "divideStyle", "divideColor", "divideOpacity", "placeSelf", "alignSelf", "justifySelf", "overflow", "overscrollBehavior", "scrollBehavior", "textOverflow", "whitespace", "wordBreak", "borderRadius", "borderWidth", "borderStyle", "borderColor", "borderOpacity", "backgroundColor", "backgroundOpacity", "backgroundImage", "gradientColorStops", "boxDecorationBreak", "backgroundSize", "backgroundAttachment", "backgroundClip", "backgroundPosition", "backgroundRepeat", "backgroundOrigin", "fill", "stroke", "strokeWidth", "objectFit", "objectPosition", "padding", "textAlign", "textIndent", "verticalAlign", "fontFamily", "fontSize", "fontWeight", "textTransform", "fontStyle", "fontVariantNumeric", "lineHeight", "letterSpacing", "textColor", "textOpacity", "textDecoration", "textDecorationColor", "textDecorationStyle", "textDecorationThickness", "textUnderlineOffset", "fontSmoothing", "placeholderColor", "placeholderOpacity", "caretColor", "accentColor", "opacity", "backgroundBlendMode", "mixBlendMode", "boxShadow", "boxShadowColor", "outlineStyle", "outlineWidth", "outlineOffset", "outlineColor", "ringWidth", "ringColor", "ringOpacity", "ringOffsetWidth", "ringOffsetColor", "blur", "brightness", "contrast", "dropShadow", "grayscale", "hueRotate", "invert", "saturate", "sepia", "filter", "backdropBlur", "backdropBrightness", "backdropContrast", "backdropGrayscale", "backdropHueRotate", "backdropInvert", "backdropOpacity", "backdropSaturate", "backdropSepia", "backdropFilter", "transitionProperty", "transitionDelay", "transitionDuration", "transitionTimingFunction", "willChange", "content"];
});
var Bv = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: () => t });
  function t(r, n) {
    return r === void 0 ? n : Array.isArray(r) ? r : [...new Set(n.filter((i) => r !== false && r[i] !== false).concat(Object.keys(r).filter((i) => r[i] !== false)))];
  }
  __name(t, "t");
});
var Wu = le((e, t) => {
  t.exports = { content: [], presets: [], darkMode: "media", theme: { screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1536px" }, colors: ({ colors: r }) => ({ inherit: r.inherit, current: r.current, transparent: r.transparent, black: r.black, white: r.white, slate: r.slate, gray: r.gray, zinc: r.zinc, neutral: r.neutral, stone: r.stone, red: r.red, orange: r.orange, amber: r.amber, yellow: r.yellow, lime: r.lime, green: r.green, emerald: r.emerald, teal: r.teal, cyan: r.cyan, sky: r.sky, blue: r.blue, indigo: r.indigo, violet: r.violet, purple: r.purple, fuchsia: r.fuchsia, pink: r.pink, rose: r.rose }), columns: { auto: "auto", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12", "3xs": "16rem", "2xs": "18rem", xs: "20rem", sm: "24rem", md: "28rem", lg: "32rem", xl: "36rem", "2xl": "42rem", "3xl": "48rem", "4xl": "56rem", "5xl": "64rem", "6xl": "72rem", "7xl": "80rem" }, spacing: { px: "1px", 0: "0px", 0.5: "0.125rem", 1: "0.25rem", 1.5: "0.375rem", 2: "0.5rem", 2.5: "0.625rem", 3: "0.75rem", 3.5: "0.875rem", 4: "1rem", 5: "1.25rem", 6: "1.5rem", 7: "1.75rem", 8: "2rem", 9: "2.25rem", 10: "2.5rem", 11: "2.75rem", 12: "3rem", 14: "3.5rem", 16: "4rem", 20: "5rem", 24: "6rem", 28: "7rem", 32: "8rem", 36: "9rem", 40: "10rem", 44: "11rem", 48: "12rem", 52: "13rem", 56: "14rem", 60: "15rem", 64: "16rem", 72: "18rem", 80: "20rem", 96: "24rem" }, animation: { none: "none", spin: "spin 1s linear infinite", ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite", pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite", bounce: "bounce 1s infinite" }, aspectRatio: { auto: "auto", square: "1 / 1", video: "16 / 9" }, backdropBlur: ({ theme: r }) => r("blur"), backdropBrightness: ({ theme: r }) => r("brightness"), backdropContrast: ({ theme: r }) => r("contrast"), backdropGrayscale: ({ theme: r }) => r("grayscale"), backdropHueRotate: ({ theme: r }) => r("hueRotate"), backdropInvert: ({ theme: r }) => r("invert"), backdropOpacity: ({ theme: r }) => r("opacity"), backdropSaturate: ({ theme: r }) => r("saturate"), backdropSepia: ({ theme: r }) => r("sepia"), backgroundColor: ({ theme: r }) => r("colors"), backgroundImage: { none: "none", "gradient-to-t": "linear-gradient(to top, var(--tw-gradient-stops))", "gradient-to-tr": "linear-gradient(to top right, var(--tw-gradient-stops))", "gradient-to-r": "linear-gradient(to right, var(--tw-gradient-stops))", "gradient-to-br": "linear-gradient(to bottom right, var(--tw-gradient-stops))", "gradient-to-b": "linear-gradient(to bottom, var(--tw-gradient-stops))", "gradient-to-bl": "linear-gradient(to bottom left, var(--tw-gradient-stops))", "gradient-to-l": "linear-gradient(to left, var(--tw-gradient-stops))", "gradient-to-tl": "linear-gradient(to top left, var(--tw-gradient-stops))" }, backgroundOpacity: ({ theme: r }) => r("opacity"), backgroundPosition: { bottom: "bottom", center: "center", left: "left", "left-bottom": "left bottom", "left-top": "left top", right: "right", "right-bottom": "right bottom", "right-top": "right top", top: "top" }, backgroundSize: { auto: "auto", cover: "cover", contain: "contain" }, blur: { 0: "0", none: "0", sm: "4px", DEFAULT: "8px", md: "12px", lg: "16px", xl: "24px", "2xl": "40px", "3xl": "64px" }, brightness: { 0: "0", 50: ".5", 75: ".75", 90: ".9", 95: ".95", 100: "1", 105: "1.05", 110: "1.1", 125: "1.25", 150: "1.5", 200: "2" }, borderColor: ({ theme: r }) => ({ ...r("colors"), DEFAULT: r("colors.gray.200", "currentColor") }), borderOpacity: ({ theme: r }) => r("opacity"), borderRadius: { none: "0px", sm: "0.125rem", DEFAULT: "0.25rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem", full: "9999px" }, borderSpacing: ({ theme: r }) => ({ ...r("spacing") }), borderWidth: { DEFAULT: "1px", 0: "0px", 2: "2px", 4: "4px", 8: "8px" }, boxShadow: { sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)", DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)", md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)", xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)", "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)", inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)", none: "none" }, boxShadowColor: ({ theme: r }) => r("colors"), caretColor: ({ theme: r }) => r("colors"), accentColor: ({ theme: r }) => ({ ...r("colors"), auto: "auto" }), contrast: { 0: "0", 50: ".5", 75: ".75", 100: "1", 125: "1.25", 150: "1.5", 200: "2" }, container: {}, content: { none: "none" }, cursor: { auto: "auto", default: "default", pointer: "pointer", wait: "wait", text: "text", move: "move", help: "help", "not-allowed": "not-allowed", none: "none", "context-menu": "context-menu", progress: "progress", cell: "cell", crosshair: "crosshair", "vertical-text": "vertical-text", alias: "alias", copy: "copy", "no-drop": "no-drop", grab: "grab", grabbing: "grabbing", "all-scroll": "all-scroll", "col-resize": "col-resize", "row-resize": "row-resize", "n-resize": "n-resize", "e-resize": "e-resize", "s-resize": "s-resize", "w-resize": "w-resize", "ne-resize": "ne-resize", "nw-resize": "nw-resize", "se-resize": "se-resize", "sw-resize": "sw-resize", "ew-resize": "ew-resize", "ns-resize": "ns-resize", "nesw-resize": "nesw-resize", "nwse-resize": "nwse-resize", "zoom-in": "zoom-in", "zoom-out": "zoom-out" }, divideColor: ({ theme: r }) => r("borderColor"), divideOpacity: ({ theme: r }) => r("borderOpacity"), divideWidth: ({ theme: r }) => r("borderWidth"), dropShadow: { sm: "0 1px 1px rgb(0 0 0 / 0.05)", DEFAULT: ["0 1px 2px rgb(0 0 0 / 0.1)", "0 1px 1px rgb(0 0 0 / 0.06)"], md: ["0 4px 3px rgb(0 0 0 / 0.07)", "0 2px 2px rgb(0 0 0 / 0.06)"], lg: ["0 10px 8px rgb(0 0 0 / 0.04)", "0 4px 3px rgb(0 0 0 / 0.1)"], xl: ["0 20px 13px rgb(0 0 0 / 0.03)", "0 8px 5px rgb(0 0 0 / 0.08)"], "2xl": "0 25px 25px rgb(0 0 0 / 0.15)", none: "0 0 #0000" }, fill: ({ theme: r }) => r("colors"), grayscale: { 0: "0", DEFAULT: "100%" }, hueRotate: { 0: "0deg", 15: "15deg", 30: "30deg", 60: "60deg", 90: "90deg", 180: "180deg" }, invert: { 0: "0", DEFAULT: "100%" }, flex: { 1: "1 1 0%", auto: "1 1 auto", initial: "0 1 auto", none: "none" }, flexBasis: ({ theme: r }) => ({ auto: "auto", ...r("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", "1/5": "20%", "2/5": "40%", "3/5": "60%", "4/5": "80%", "1/6": "16.666667%", "2/6": "33.333333%", "3/6": "50%", "4/6": "66.666667%", "5/6": "83.333333%", "1/12": "8.333333%", "2/12": "16.666667%", "3/12": "25%", "4/12": "33.333333%", "5/12": "41.666667%", "6/12": "50%", "7/12": "58.333333%", "8/12": "66.666667%", "9/12": "75%", "10/12": "83.333333%", "11/12": "91.666667%", full: "100%" }), flexGrow: { 0: "0", DEFAULT: "1" }, flexShrink: { 0: "0", DEFAULT: "1" }, fontFamily: { sans: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", '"Helvetica Neue"', "Arial", '"Noto Sans"', "sans-serif", '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'], serif: ["ui-serif", "Georgia", "Cambria", '"Times New Roman"', "Times", "serif"], mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", '"Liberation Mono"', '"Courier New"', "monospace"] }, fontSize: { xs: ["0.75rem", { lineHeight: "1rem" }], sm: ["0.875rem", { lineHeight: "1.25rem" }], base: ["1rem", { lineHeight: "1.5rem" }], lg: ["1.125rem", { lineHeight: "1.75rem" }], xl: ["1.25rem", { lineHeight: "1.75rem" }], "2xl": ["1.5rem", { lineHeight: "2rem" }], "3xl": ["1.875rem", { lineHeight: "2.25rem" }], "4xl": ["2.25rem", { lineHeight: "2.5rem" }], "5xl": ["3rem", { lineHeight: "1" }], "6xl": ["3.75rem", { lineHeight: "1" }], "7xl": ["4.5rem", { lineHeight: "1" }], "8xl": ["6rem", { lineHeight: "1" }], "9xl": ["8rem", { lineHeight: "1" }] }, fontWeight: { thin: "100", extralight: "200", light: "300", normal: "400", medium: "500", semibold: "600", bold: "700", extrabold: "800", black: "900" }, gap: ({ theme: r }) => r("spacing"), gradientColorStops: ({ theme: r }) => r("colors"), gridAutoColumns: { auto: "auto", min: "min-content", max: "max-content", fr: "minmax(0, 1fr)" }, gridAutoRows: { auto: "auto", min: "min-content", max: "max-content", fr: "minmax(0, 1fr)" }, gridColumn: { auto: "auto", "span-1": "span 1 / span 1", "span-2": "span 2 / span 2", "span-3": "span 3 / span 3", "span-4": "span 4 / span 4", "span-5": "span 5 / span 5", "span-6": "span 6 / span 6", "span-7": "span 7 / span 7", "span-8": "span 8 / span 8", "span-9": "span 9 / span 9", "span-10": "span 10 / span 10", "span-11": "span 11 / span 11", "span-12": "span 12 / span 12", "span-full": "1 / -1" }, gridColumnEnd: { auto: "auto", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12", 13: "13" }, gridColumnStart: { auto: "auto", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12", 13: "13" }, gridRow: { auto: "auto", "span-1": "span 1 / span 1", "span-2": "span 2 / span 2", "span-3": "span 3 / span 3", "span-4": "span 4 / span 4", "span-5": "span 5 / span 5", "span-6": "span 6 / span 6", "span-full": "1 / -1" }, gridRowStart: { auto: "auto", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7" }, gridRowEnd: { auto: "auto", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7" }, gridTemplateColumns: { none: "none", 1: "repeat(1, minmax(0, 1fr))", 2: "repeat(2, minmax(0, 1fr))", 3: "repeat(3, minmax(0, 1fr))", 4: "repeat(4, minmax(0, 1fr))", 5: "repeat(5, minmax(0, 1fr))", 6: "repeat(6, minmax(0, 1fr))", 7: "repeat(7, minmax(0, 1fr))", 8: "repeat(8, minmax(0, 1fr))", 9: "repeat(9, minmax(0, 1fr))", 10: "repeat(10, minmax(0, 1fr))", 11: "repeat(11, minmax(0, 1fr))", 12: "repeat(12, minmax(0, 1fr))" }, gridTemplateRows: { none: "none", 1: "repeat(1, minmax(0, 1fr))", 2: "repeat(2, minmax(0, 1fr))", 3: "repeat(3, minmax(0, 1fr))", 4: "repeat(4, minmax(0, 1fr))", 5: "repeat(5, minmax(0, 1fr))", 6: "repeat(6, minmax(0, 1fr))" }, height: ({ theme: r }) => ({ auto: "auto", ...r("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", "1/5": "20%", "2/5": "40%", "3/5": "60%", "4/5": "80%", "1/6": "16.666667%", "2/6": "33.333333%", "3/6": "50%", "4/6": "66.666667%", "5/6": "83.333333%", full: "100%", screen: "100vh", min: "min-content", max: "max-content", fit: "fit-content" }), inset: ({ theme: r }) => ({ auto: "auto", ...r("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", full: "100%" }), keyframes: { spin: { to: { transform: "rotate(360deg)" } }, ping: { "75%, 100%": { transform: "scale(2)", opacity: "0" } }, pulse: { "50%": { opacity: ".5" } }, bounce: { "0%, 100%": { transform: "translateY(-25%)", animationTimingFunction: "cubic-bezier(0.8,0,1,1)" }, "50%": { transform: "none", animationTimingFunction: "cubic-bezier(0,0,0.2,1)" } } }, letterSpacing: { tighter: "-0.05em", tight: "-0.025em", normal: "0em", wide: "0.025em", wider: "0.05em", widest: "0.1em" }, lineHeight: { none: "1", tight: "1.25", snug: "1.375", normal: "1.5", relaxed: "1.625", loose: "2", 3: ".75rem", 4: "1rem", 5: "1.25rem", 6: "1.5rem", 7: "1.75rem", 8: "2rem", 9: "2.25rem", 10: "2.5rem" }, listStyleType: { none: "none", disc: "disc", decimal: "decimal" }, margin: ({ theme: r }) => ({ auto: "auto", ...r("spacing") }), maxHeight: ({ theme: r }) => ({ ...r("spacing"), full: "100%", screen: "100vh", min: "min-content", max: "max-content", fit: "fit-content" }), maxWidth: ({ theme: r, breakpoints: n }) => ({ none: "none", 0: "0rem", xs: "20rem", sm: "24rem", md: "28rem", lg: "32rem", xl: "36rem", "2xl": "42rem", "3xl": "48rem", "4xl": "56rem", "5xl": "64rem", "6xl": "72rem", "7xl": "80rem", full: "100%", min: "min-content", max: "max-content", fit: "fit-content", prose: "65ch", ...n(r("screens")) }), minHeight: { 0: "0px", full: "100%", screen: "100vh", min: "min-content", max: "max-content", fit: "fit-content" }, minWidth: { 0: "0px", full: "100%", min: "min-content", max: "max-content", fit: "fit-content" }, objectPosition: { bottom: "bottom", center: "center", left: "left", "left-bottom": "left bottom", "left-top": "left top", right: "right", "right-bottom": "right bottom", "right-top": "right top", top: "top" }, opacity: { 0: "0", 5: "0.05", 10: "0.1", 20: "0.2", 25: "0.25", 30: "0.3", 40: "0.4", 50: "0.5", 60: "0.6", 70: "0.7", 75: "0.75", 80: "0.8", 90: "0.9", 95: "0.95", 100: "1" }, order: { first: "-9999", last: "9999", none: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12" }, padding: ({ theme: r }) => r("spacing"), placeholderColor: ({ theme: r }) => r("colors"), placeholderOpacity: ({ theme: r }) => r("opacity"), outlineColor: ({ theme: r }) => r("colors"), outlineOffset: { 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, outlineWidth: { 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, ringColor: ({ theme: r }) => ({ DEFAULT: r("colors.blue.500", "#3b82f6"), ...r("colors") }), ringOffsetColor: ({ theme: r }) => r("colors"), ringOffsetWidth: { 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, ringOpacity: ({ theme: r }) => ({ DEFAULT: "0.5", ...r("opacity") }), ringWidth: { DEFAULT: "3px", 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, rotate: { 0: "0deg", 1: "1deg", 2: "2deg", 3: "3deg", 6: "6deg", 12: "12deg", 45: "45deg", 90: "90deg", 180: "180deg" }, saturate: { 0: "0", 50: ".5", 100: "1", 150: "1.5", 200: "2" }, scale: { 0: "0", 50: ".5", 75: ".75", 90: ".9", 95: ".95", 100: "1", 105: "1.05", 110: "1.1", 125: "1.25", 150: "1.5" }, scrollMargin: ({ theme: r }) => ({ ...r("spacing") }), scrollPadding: ({ theme: r }) => r("spacing"), sepia: { 0: "0", DEFAULT: "100%" }, skew: { 0: "0deg", 1: "1deg", 2: "2deg", 3: "3deg", 6: "6deg", 12: "12deg" }, space: ({ theme: r }) => ({ ...r("spacing") }), stroke: ({ theme: r }) => r("colors"), strokeWidth: { 0: "0", 1: "1", 2: "2" }, textColor: ({ theme: r }) => r("colors"), textDecorationColor: ({ theme: r }) => r("colors"), textDecorationThickness: { auto: "auto", "from-font": "from-font", 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, textUnderlineOffset: { auto: "auto", 0: "0px", 1: "1px", 2: "2px", 4: "4px", 8: "8px" }, textIndent: ({ theme: r }) => ({ ...r("spacing") }), textOpacity: ({ theme: r }) => r("opacity"), transformOrigin: { center: "center", top: "top", "top-right": "top right", right: "right", "bottom-right": "bottom right", bottom: "bottom", "bottom-left": "bottom left", left: "left", "top-left": "top left" }, transitionDelay: { 75: "75ms", 100: "100ms", 150: "150ms", 200: "200ms", 300: "300ms", 500: "500ms", 700: "700ms", 1e3: "1000ms" }, transitionDuration: { DEFAULT: "150ms", 75: "75ms", 100: "100ms", 150: "150ms", 200: "200ms", 300: "300ms", 500: "500ms", 700: "700ms", 1e3: "1000ms" }, transitionProperty: { none: "none", all: "all", DEFAULT: "color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter", colors: "color, background-color, border-color, text-decoration-color, fill, stroke", opacity: "opacity", shadow: "box-shadow", transform: "transform" }, transitionTimingFunction: { DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)", linear: "linear", in: "cubic-bezier(0.4, 0, 1, 1)", out: "cubic-bezier(0, 0, 0.2, 1)", "in-out": "cubic-bezier(0.4, 0, 0.2, 1)" }, translate: ({ theme: r }) => ({ ...r("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", full: "100%" }), width: ({ theme: r }) => ({ auto: "auto", ...r("spacing"), "1/2": "50%", "1/3": "33.333333%", "2/3": "66.666667%", "1/4": "25%", "2/4": "50%", "3/4": "75%", "1/5": "20%", "2/5": "40%", "3/5": "60%", "4/5": "80%", "1/6": "16.666667%", "2/6": "33.333333%", "3/6": "50%", "4/6": "66.666667%", "5/6": "83.333333%", "1/12": "8.333333%", "2/12": "16.666667%", "3/12": "25%", "4/12": "33.333333%", "5/12": "41.666667%", "6/12": "50%", "7/12": "58.333333%", "8/12": "66.666667%", "9/12": "75%", "10/12": "83.333333%", "11/12": "91.666667%", full: "100%", screen: "100vw", min: "min-content", max: "max-content", fit: "fit-content" }), willChange: { auto: "auto", scroll: "scroll-position", contents: "contents", transform: "transform" }, zIndex: { auto: "auto", 0: "0", 10: "10", 20: "20", 30: "30", 40: "40", 50: "50" } }, variantOrder: ["first", "last", "odd", "even", "visited", "checked", "empty", "read-only", "group-hover", "group-focus", "focus-within", "hover", "focus", "focus-visible", "active", "disabled"], plugins: [] };
});
var Zn = {};
Aa(Zn, { default: () => $u });
var $u;
var Oa = _a(() => {
  $u = { info(e, t) {
    console.info(...Array.isArray(e) ? [e] : [t, e]);
  }, warn(e, t) {
    console.warn(...Array.isArray(e) ? [e] : [t, e]);
  }, risk(e, t) {
    console.error(...Array.isArray(e) ? [e] : [t, e]);
  } };
});
var Nv = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: () => i });
  var t = r((Oa(), Xn(Zn)));
  function r(a) {
    return a && a.__esModule ? a : { default: a };
  }
  __name(r, "r");
  function n({ version: a, from: o, to: u }) {
    t.default.warn(`${o}-color-renamed`, [`As of Tailwind CSS ${a}, \`${o}\` has been renamed to \`${u}\`.`, "Update your configuration file to silence this warning."]);
  }
  __name(n, "n");
  var i = { inherit: "inherit", current: "currentColor", transparent: "transparent", black: "#000", white: "#fff", slate: { 50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a" }, gray: { 50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db", 400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151", 800: "#1f2937", 900: "#111827" }, zinc: { 50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8", 400: "#a1a1aa", 500: "#71717a", 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 900: "#18181b" }, neutral: { 50: "#fafafa", 100: "#f5f5f5", 200: "#e5e5e5", 300: "#d4d4d4", 400: "#a3a3a3", 500: "#737373", 600: "#525252", 700: "#404040", 800: "#262626", 900: "#171717" }, stone: { 50: "#fafaf9", 100: "#f5f5f4", 200: "#e7e5e4", 300: "#d6d3d1", 400: "#a8a29e", 500: "#78716c", 600: "#57534e", 700: "#44403c", 800: "#292524", 900: "#1c1917" }, red: { 50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d" }, orange: { 50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12" }, amber: { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f" }, yellow: { 50: "#fefce8", 100: "#fef9c3", 200: "#fef08a", 300: "#fde047", 400: "#facc15", 500: "#eab308", 600: "#ca8a04", 700: "#a16207", 800: "#854d0e", 900: "#713f12" }, lime: { 50: "#f7fee7", 100: "#ecfccb", 200: "#d9f99d", 300: "#bef264", 400: "#a3e635", 500: "#84cc16", 600: "#65a30d", 700: "#4d7c0f", 800: "#3f6212", 900: "#365314" }, green: { 50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d" }, emerald: { 50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b" }, teal: { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a" }, cyan: { 50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63" }, sky: { 50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e" }, blue: { 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a" }, indigo: { 50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81" }, violet: { 50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95" }, purple: { 50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe", 400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8", 900: "#581c87" }, fuchsia: { 50: "#fdf4ff", 100: "#fae8ff", 200: "#f5d0fe", 300: "#f0abfc", 400: "#e879f9", 500: "#d946ef", 600: "#c026d3", 700: "#a21caf", 800: "#86198f", 900: "#701a75" }, pink: { 50: "#fdf2f8", 100: "#fce7f3", 200: "#fbcfe8", 300: "#f9a8d4", 400: "#f472b6", 500: "#ec4899", 600: "#db2777", 700: "#be185d", 800: "#9d174d", 900: "#831843" }, rose: { 50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337" }, get lightBlue() {
    return n({ version: "v2.2", from: "lightBlue", to: "sky" }), this.sky;
  }, get warmGray() {
    return n({ version: "v3.0", from: "warmGray", to: "stone" }), this.stone;
  }, get trueGray() {
    return n({ version: "v3.0", from: "trueGray", to: "neutral" }), this.neutral;
  }, get coolGray() {
    return n({ version: "v3.0", from: "coolGray", to: "gray" }), this.gray;
  }, get blueGray() {
    return n({ version: "v3.0", from: "blueGray", to: "slate" }), this.slate;
  } };
});
var Mv = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "defaults", { enumerable: true, get: () => t });
  function t(r, ...n) {
    for (let o of n) {
      for (let u in o) {
        var i;
        !(r == null || (i = r.hasOwnProperty) === null || i === void 0) && i.call(r, u) || (r[u] = o[u]);
      }
      for (let u of Object.getOwnPropertySymbols(o)) {
        var a;
        !(r == null || (a = r.hasOwnProperty) === null || a === void 0) && a.call(r, u) || (r[u] = o[u]);
      }
    }
    return r;
  }
  __name(t, "t");
});
var Gv = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "toPath", { enumerable: true, get: () => t });
  function t(r) {
    if (Array.isArray(r))
      return r;
    let n = r.split("[").length - 1, i = r.split("]").length - 1;
    if (n !== i)
      throw new Error(`Path is invalid. Has unbalanced brackets: ${r}`);
    return r.split(/\.(?![^\[]*\])|[\[\]]/g).filter(Boolean);
  }
  __name(t, "t");
});
var Wv = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "normalizeConfig", { enumerable: true, get: () => i });
  var t = n((Oa(), Xn(Zn)));
  function r(a) {
    if (typeof WeakMap != "function")
      return null;
    var o = /* @__PURE__ */ new WeakMap(), u = /* @__PURE__ */ new WeakMap();
    return (r = /* @__PURE__ */ __name(function(s) {
      return s ? u : o;
    }, "r"))(a);
  }
  __name(r, "r");
  function n(a, o) {
    if (!o && a && a.__esModule)
      return a;
    if (a === null || typeof a != "object" && typeof a != "function")
      return { default: a };
    var u = r(o);
    if (u && u.has(a))
      return u.get(a);
    var s = {}, l = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var f in a)
      if (f !== "default" && Object.prototype.hasOwnProperty.call(a, f)) {
        var c = l ? Object.getOwnPropertyDescriptor(a, f) : null;
        c && (c.get || c.set) ? Object.defineProperty(s, f, c) : s[f] = a[f];
      }
    return s.default = a, u && u.set(a, s), s;
  }
  __name(n, "n");
  function i(a) {
    if ((() => {
      if (a.purge || !a.content || !Array.isArray(a.content) && !(typeof a.content == "object" && a.content !== null))
        return false;
      if (Array.isArray(a.content))
        return a.content.every((u) => typeof u == "string" ? true : !(typeof u?.raw != "string" || u != null && u.extension && typeof u?.extension != "string"));
      if (typeof a.content == "object" && a.content !== null) {
        if (Object.keys(a.content).some((u) => !["files", "extract", "transform"].includes(u)))
          return false;
        if (Array.isArray(a.content.files)) {
          if (!a.content.files.every((u) => typeof u == "string" ? true : !(typeof u?.raw != "string" || u != null && u.extension && typeof u?.extension != "string")))
            return false;
          if (typeof a.content.extract == "object") {
            for (let u of Object.values(a.content.extract))
              if (typeof u != "function")
                return false;
          } else if (!(a.content.extract === void 0 || typeof a.content.extract == "function"))
            return false;
          if (typeof a.content.transform == "object") {
            for (let u of Object.values(a.content.transform))
              if (typeof u != "function")
                return false;
          } else if (!(a.content.transform === void 0 || typeof a.content.transform == "function"))
            return false;
        }
        return true;
      }
      return false;
    })() || t.default.warn("purge-deprecation", ["The `purge`/`content` options have changed in Tailwind CSS v3.0.", "Update your configuration file to eliminate this warning.", "https://tailwindcss.com/docs/upgrade-guide#configure-content-sources"]), a.safelist = (() => {
      var u;
      let { content: s, purge: l, safelist: f } = a;
      return Array.isArray(f) ? f : Array.isArray(s?.safelist) ? s.safelist : Array.isArray(l?.safelist) ? l.safelist : Array.isArray(l == null || (u = l.options) === null || u === void 0 ? void 0 : u.safelist) ? l.options.safelist : [];
    })(), typeof a.prefix == "function")
      t.default.warn("prefix-function", ["As of Tailwind CSS v3.0, `prefix` cannot be a function.", "Update `prefix` in your configuration to be a string to eliminate this warning.", "https://tailwindcss.com/docs/upgrade-guide#prefix-cannot-be-a-function"]), a.prefix = "";
    else {
      var o;
      a.prefix = (o = a.prefix) !== null && o !== void 0 ? o : "";
    }
    a.content = { files: (() => {
      let { content: u, purge: s } = a;
      return Array.isArray(s) ? s : Array.isArray(s?.content) ? s.content : Array.isArray(u) ? u : Array.isArray(u?.content) ? u.content : Array.isArray(u?.files) ? u.files : [];
    })(), extract: (() => {
      let u = (() => {
        var f, c, p, d, D, v, g, y, b, C;
        return !((f = a.purge) === null || f === void 0) && f.extract ? a.purge.extract : !((c = a.content) === null || c === void 0) && c.extract ? a.content.extract : !((p = a.purge) === null || p === void 0 || (d = p.extract) === null || d === void 0) && d.DEFAULT ? a.purge.extract.DEFAULT : !((D = a.content) === null || D === void 0 || (v = D.extract) === null || v === void 0) && v.DEFAULT ? a.content.extract.DEFAULT : !((g = a.purge) === null || g === void 0 || (y = g.options) === null || y === void 0) && y.extractors ? a.purge.options.extractors : !((b = a.content) === null || b === void 0 || (C = b.options) === null || C === void 0) && C.extractors ? a.content.options.extractors : {};
      })(), s = {}, l = (() => {
        var f, c, p, d;
        if (!((f = a.purge) === null || f === void 0 || (c = f.options) === null || c === void 0) && c.defaultExtractor)
          return a.purge.options.defaultExtractor;
        if (!((p = a.content) === null || p === void 0 || (d = p.options) === null || d === void 0) && d.defaultExtractor)
          return a.content.options.defaultExtractor;
      })();
      if (l !== void 0 && (s.DEFAULT = l), typeof u == "function")
        s.DEFAULT = u;
      else if (Array.isArray(u))
        for (let { extensions: f, extractor: c } of u ?? [])
          for (let p of f)
            s[p] = c;
      else
        typeof u == "object" && u !== null && Object.assign(s, u);
      return s;
    })(), transform: (() => {
      let u = (() => {
        var l, f, c, p, d, D;
        return !((l = a.purge) === null || l === void 0) && l.transform ? a.purge.transform : !((f = a.content) === null || f === void 0) && f.transform ? a.content.transform : !((c = a.purge) === null || c === void 0 || (p = c.transform) === null || p === void 0) && p.DEFAULT ? a.purge.transform.DEFAULT : !((d = a.content) === null || d === void 0 || (D = d.transform) === null || D === void 0) && D.DEFAULT ? a.content.transform.DEFAULT : {};
      })(), s = {};
      return typeof u == "function" && (s.DEFAULT = u), typeof u == "object" && u !== null && Object.assign(s, u), s;
    })() };
    for (let u of a.content.files)
      if (typeof u == "string" && /{([^,]*?)}/g.test(u)) {
        t.default.warn("invalid-glob-braces", [`The glob pattern ${(0, t.dim)(u)} in your Tailwind CSS configuration is invalid.`, `Update it to ${(0, t.dim)(u.replace(/{([^,]*?)}/g, "$1"))} to silence this warning.`]);
        break;
      }
    return a;
  }
  __name(i, "i");
});
var $v = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: () => t });
  function t(r) {
    if (Object.prototype.toString.call(r) !== "[object Object]")
      return false;
    let n = Object.getPrototypeOf(r);
    return n === null || n === Object.prototype;
  }
  __name(t, "t");
});
var jv = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "cloneDeep", { enumerable: true, get: () => t });
  function t(r) {
    return Array.isArray(r) ? r.map((n) => t(n)) : typeof r == "object" && r !== null ? Object.fromEntries(Object.entries(r).map(([n, i]) => [n, t(i)])) : r;
  }
  __name(t, "t");
});
var ju = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = i;
  function r(a) {
    for (var o = a.toLowerCase(), u = "", s = false, l = 0; l < 6 && o[l] !== void 0; l++) {
      var f = o.charCodeAt(l), c = f >= 97 && f <= 102 || f >= 48 && f <= 57;
      if (s = f === 32, !c)
        break;
      u += o[l];
    }
    if (u.length !== 0) {
      var p = parseInt(u, 16), d = p >= 55296 && p <= 57343;
      return d || p === 0 || p > 1114111 ? ["\uFFFD", u.length + (s ? 1 : 0)] : [String.fromCodePoint(p), u.length + (s ? 1 : 0)];
    }
  }
  __name(r, "r");
  var n = /\\/;
  function i(a) {
    var o = n.test(a);
    if (!o)
      return a;
    for (var u = "", s = 0; s < a.length; s++) {
      if (a[s] === "\\") {
        var l = r(a.slice(s + 1, s + 7));
        if (l !== void 0) {
          u += l[0], s += l[1];
          continue;
        }
        if (a[s + 1] === "\\") {
          u += "\\", s++;
          continue;
        }
        a.length === s + 1 && (u += a[s]);
        continue;
      }
      u += a[s];
    }
    return u;
  }
  __name(i, "i");
  t.exports = e.default;
});
var zv = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = r;
  function r(n) {
    for (var i = arguments.length, a = new Array(i > 1 ? i - 1 : 0), o = 1; o < i; o++)
      a[o - 1] = arguments[o];
    for (; a.length > 0; ) {
      var u = a.shift();
      if (!n[u])
        return;
      n = n[u];
    }
    return n;
  }
  __name(r, "r");
  t.exports = e.default;
});
var Vv = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = r;
  function r(n) {
    for (var i = arguments.length, a = new Array(i > 1 ? i - 1 : 0), o = 1; o < i; o++)
      a[o - 1] = arguments[o];
    for (; a.length > 0; ) {
      var u = a.shift();
      n[u] || (n[u] = {}), n = n[u];
    }
  }
  __name(r, "r");
  t.exports = e.default;
});
var Hv = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = r;
  function r(n) {
    for (var i = "", a = n.indexOf("/*"), o = 0; a >= 0; ) {
      i = i + n.slice(o, a);
      var u = n.indexOf("*/", a + 2);
      if (u < 0)
        return i;
      o = u + 2, a = n.indexOf("/*", o);
    }
    return i = i + n.slice(o), i;
  }
  __name(r, "r");
  t.exports = e.default;
});
var Jn = le((e) => {
  "use strict";
  e.__esModule = true, e.stripComments = e.ensureObject = e.getProp = e.unesc = void 0;
  var t = a(ju());
  e.unesc = t.default;
  var r = a(zv());
  e.getProp = r.default;
  var n = a(Vv());
  e.ensureObject = n.default;
  var i = a(Hv());
  e.stripComments = i.default;
  function a(o) {
    return o && o.__esModule ? o : { default: o };
  }
  __name(a, "a");
});
var pr = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = Jn();
  function n(u, s) {
    for (var l = 0; l < s.length; l++) {
      var f = s[l];
      f.enumerable = f.enumerable || false, f.configurable = true, "value" in f && (f.writable = true), Object.defineProperty(u, f.key, f);
    }
  }
  __name(n, "n");
  function i(u, s, l) {
    return s && n(u.prototype, s), l && n(u, l), u;
  }
  __name(i, "i");
  var a = /* @__PURE__ */ __name(function u(s, l) {
    if (typeof s != "object" || s === null)
      return s;
    var f = new s.constructor();
    for (var c in s)
      if (s.hasOwnProperty(c)) {
        var p = s[c], d = typeof p;
        c === "parent" && d === "object" ? l && (f[c] = l) : p instanceof Array ? f[c] = p.map(function(D) {
          return u(D, f);
        }) : f[c] = u(p, f);
      }
    return f;
  }, "u"), o = function() {
    function u(l) {
      l === void 0 && (l = {}), Object.assign(this, l), this.spaces = this.spaces || {}, this.spaces.before = this.spaces.before || "", this.spaces.after = this.spaces.after || "";
    }
    __name(u, "u");
    var s = u.prototype;
    return s.remove = function() {
      return this.parent && this.parent.removeChild(this), this.parent = void 0, this;
    }, s.replaceWith = function() {
      if (this.parent) {
        for (var l in arguments)
          this.parent.insertBefore(this, arguments[l]);
        this.remove();
      }
      return this;
    }, s.next = function() {
      return this.parent.at(this.parent.index(this) + 1);
    }, s.prev = function() {
      return this.parent.at(this.parent.index(this) - 1);
    }, s.clone = function(l) {
      l === void 0 && (l = {});
      var f = a(this);
      for (var c in l)
        f[c] = l[c];
      return f;
    }, s.appendToPropertyAndEscape = function(l, f, c) {
      this.raws || (this.raws = {});
      var p = this[l], d = this.raws[l];
      this[l] = p + f, d || c !== f ? this.raws[l] = (d || p) + c : delete this.raws[l];
    }, s.setPropertyAndEscape = function(l, f, c) {
      this.raws || (this.raws = {}), this[l] = f, this.raws[l] = c;
    }, s.setPropertyWithoutEscape = function(l, f) {
      this[l] = f, this.raws && delete this.raws[l];
    }, s.isAtPosition = function(l, f) {
      if (this.source && this.source.start && this.source.end)
        return !(this.source.start.line > l || this.source.end.line < l || this.source.start.line === l && this.source.start.column > f || this.source.end.line === l && this.source.end.column < f);
    }, s.stringifyProperty = function(l) {
      return this.raws && this.raws[l] || this[l];
    }, s.valueToString = function() {
      return String(this.stringifyProperty("value"));
    }, s.toString = function() {
      return [this.rawSpaceBefore, this.valueToString(), this.rawSpaceAfter].join("");
    }, i(u, [{ key: "rawSpaceBefore", get: function() {
      var l = this.raws && this.raws.spaces && this.raws.spaces.before;
      return l === void 0 && (l = this.spaces && this.spaces.before), l || "";
    }, set: function(l) {
      (0, r.ensureObject)(this, "raws", "spaces"), this.raws.spaces.before = l;
    } }, { key: "rawSpaceAfter", get: function() {
      var l = this.raws && this.raws.spaces && this.raws.spaces.after;
      return l === void 0 && (l = this.spaces.after), l || "";
    }, set: function(l) {
      (0, r.ensureObject)(this, "raws", "spaces"), this.raws.spaces.after = l;
    } }]), u;
  }();
  e.default = o, t.exports = e.default;
});
var ut = le((e) => {
  "use strict";
  e.__esModule = true, e.UNIVERSAL = e.ATTRIBUTE = e.CLASS = e.COMBINATOR = e.COMMENT = e.ID = e.NESTING = e.PSEUDO = e.ROOT = e.SELECTOR = e.STRING = e.TAG = void 0;
  var t = "tag";
  e.TAG = t;
  var r = "string";
  e.STRING = r;
  var n = "selector";
  e.SELECTOR = n;
  var i = "root";
  e.ROOT = i;
  var a = "pseudo";
  e.PSEUDO = a;
  var o = "nesting";
  e.NESTING = o;
  var u = "id";
  e.ID = u;
  var s = "comment";
  e.COMMENT = s;
  var l = "combinator";
  e.COMBINATOR = l;
  var f = "class";
  e.CLASS = f;
  var c = "attribute";
  e.ATTRIBUTE = c;
  var p = "universal";
  e.UNIVERSAL = p;
});
var La = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = o(pr()), n = a(ut());
  function i() {
    if (typeof WeakMap != "function")
      return null;
    var v = /* @__PURE__ */ new WeakMap();
    return i = /* @__PURE__ */ __name(function() {
      return v;
    }, "i"), v;
  }
  __name(i, "i");
  function a(v) {
    if (v && v.__esModule)
      return v;
    if (v === null || typeof v != "object" && typeof v != "function")
      return { default: v };
    var g = i();
    if (g && g.has(v))
      return g.get(v);
    var y = {}, b = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var C in v)
      if (Object.prototype.hasOwnProperty.call(v, C)) {
        var k = b ? Object.getOwnPropertyDescriptor(v, C) : null;
        k && (k.get || k.set) ? Object.defineProperty(y, C, k) : y[C] = v[C];
      }
    return y.default = v, g && g.set(v, y), y;
  }
  __name(a, "a");
  function o(v) {
    return v && v.__esModule ? v : { default: v };
  }
  __name(o, "o");
  function u(v, g) {
    var y;
    if (typeof Symbol > "u" || v[Symbol.iterator] == null) {
      if (Array.isArray(v) || (y = s(v)) || g && v && typeof v.length == "number") {
        y && (v = y);
        var b = 0;
        return function() {
          return b >= v.length ? { done: true } : { done: false, value: v[b++] };
        };
      }
      throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
    }
    return y = v[Symbol.iterator](), y.next.bind(y);
  }
  __name(u, "u");
  function s(v, g) {
    if (v) {
      if (typeof v == "string")
        return l(v, g);
      var y = Object.prototype.toString.call(v).slice(8, -1);
      if (y === "Object" && v.constructor && (y = v.constructor.name), y === "Map" || y === "Set")
        return Array.from(v);
      if (y === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(y))
        return l(v, g);
    }
  }
  __name(s, "s");
  function l(v, g) {
    (g == null || g > v.length) && (g = v.length);
    for (var y = 0, b = new Array(g); y < g; y++)
      b[y] = v[y];
    return b;
  }
  __name(l, "l");
  function f(v, g) {
    for (var y = 0; y < g.length; y++) {
      var b = g[y];
      b.enumerable = b.enumerable || false, b.configurable = true, "value" in b && (b.writable = true), Object.defineProperty(v, b.key, b);
    }
  }
  __name(f, "f");
  function c(v, g, y) {
    return g && f(v.prototype, g), y && f(v, y), v;
  }
  __name(c, "c");
  function p(v, g) {
    v.prototype = Object.create(g.prototype), v.prototype.constructor = v, d(v, g);
  }
  __name(p, "p");
  function d(v, g) {
    return d = Object.setPrototypeOf || function(y, b) {
      return y.__proto__ = b, y;
    }, d(v, g);
  }
  __name(d, "d");
  var D = function(v) {
    p(g, v);
    function g(b) {
      var C;
      return C = v.call(this, b) || this, C.nodes || (C.nodes = []), C;
    }
    __name(g, "g");
    var y = g.prototype;
    return y.append = function(b) {
      return b.parent = this, this.nodes.push(b), this;
    }, y.prepend = function(b) {
      return b.parent = this, this.nodes.unshift(b), this;
    }, y.at = function(b) {
      return this.nodes[b];
    }, y.index = function(b) {
      return typeof b == "number" ? b : this.nodes.indexOf(b);
    }, y.removeChild = function(b) {
      b = this.index(b), this.at(b).parent = void 0, this.nodes.splice(b, 1);
      var C;
      for (var k in this.indexes)
        C = this.indexes[k], C >= b && (this.indexes[k] = C - 1);
      return this;
    }, y.removeAll = function() {
      for (var b = u(this.nodes), C; !(C = b()).done; ) {
        var k = C.value;
        k.parent = void 0;
      }
      return this.nodes = [], this;
    }, y.empty = function() {
      return this.removeAll();
    }, y.insertAfter = function(b, C) {
      C.parent = this;
      var k = this.index(b);
      this.nodes.splice(k + 1, 0, C), C.parent = this;
      var S;
      for (var E in this.indexes)
        S = this.indexes[E], k <= S && (this.indexes[E] = S + 1);
      return this;
    }, y.insertBefore = function(b, C) {
      C.parent = this;
      var k = this.index(b);
      this.nodes.splice(k, 0, C), C.parent = this;
      var S;
      for (var E in this.indexes)
        S = this.indexes[E], S <= k && (this.indexes[E] = S + 1);
      return this;
    }, y._findChildAtPosition = function(b, C) {
      var k = void 0;
      return this.each(function(S) {
        if (S.atPosition) {
          var E = S.atPosition(b, C);
          if (E)
            return k = E, false;
        } else if (S.isAtPosition(b, C))
          return k = S, false;
      }), k;
    }, y.atPosition = function(b, C) {
      if (this.isAtPosition(b, C))
        return this._findChildAtPosition(b, C) || this;
    }, y._inferEndPosition = function() {
      this.last && this.last.source && this.last.source.end && (this.source = this.source || {}, this.source.end = this.source.end || {}, Object.assign(this.source.end, this.last.source.end));
    }, y.each = function(b) {
      this.lastEach || (this.lastEach = 0), this.indexes || (this.indexes = {}), this.lastEach++;
      var C = this.lastEach;
      if (this.indexes[C] = 0, !!this.length) {
        for (var k, S; this.indexes[C] < this.length && (k = this.indexes[C], S = b(this.at(k), k), S !== false); )
          this.indexes[C] += 1;
        if (delete this.indexes[C], S === false)
          return false;
      }
    }, y.walk = function(b) {
      return this.each(function(C, k) {
        var S = b(C, k);
        if (S !== false && C.length && (S = C.walk(b)), S === false)
          return false;
      });
    }, y.walkAttributes = function(b) {
      var C = this;
      return this.walk(function(k) {
        if (k.type === n.ATTRIBUTE)
          return b.call(C, k);
      });
    }, y.walkClasses = function(b) {
      var C = this;
      return this.walk(function(k) {
        if (k.type === n.CLASS)
          return b.call(C, k);
      });
    }, y.walkCombinators = function(b) {
      var C = this;
      return this.walk(function(k) {
        if (k.type === n.COMBINATOR)
          return b.call(C, k);
      });
    }, y.walkComments = function(b) {
      var C = this;
      return this.walk(function(k) {
        if (k.type === n.COMMENT)
          return b.call(C, k);
      });
    }, y.walkIds = function(b) {
      var C = this;
      return this.walk(function(k) {
        if (k.type === n.ID)
          return b.call(C, k);
      });
    }, y.walkNesting = function(b) {
      var C = this;
      return this.walk(function(k) {
        if (k.type === n.NESTING)
          return b.call(C, k);
      });
    }, y.walkPseudos = function(b) {
      var C = this;
      return this.walk(function(k) {
        if (k.type === n.PSEUDO)
          return b.call(C, k);
      });
    }, y.walkTags = function(b) {
      var C = this;
      return this.walk(function(k) {
        if (k.type === n.TAG)
          return b.call(C, k);
      });
    }, y.walkUniversals = function(b) {
      var C = this;
      return this.walk(function(k) {
        if (k.type === n.UNIVERSAL)
          return b.call(C, k);
      });
    }, y.split = function(b) {
      var C = this, k = [];
      return this.reduce(function(S, E, L) {
        var T = b.call(C, E);
        return k.push(E), T ? (S.push(k), k = []) : L === C.length - 1 && S.push(k), S;
      }, []);
    }, y.map = function(b) {
      return this.nodes.map(b);
    }, y.reduce = function(b, C) {
      return this.nodes.reduce(b, C);
    }, y.every = function(b) {
      return this.nodes.every(b);
    }, y.some = function(b) {
      return this.nodes.some(b);
    }, y.filter = function(b) {
      return this.nodes.filter(b);
    }, y.sort = function(b) {
      return this.nodes.sort(b);
    }, y.toString = function() {
      return this.map(String).join("");
    }, c(g, [{ key: "first", get: function() {
      return this.at(0);
    } }, { key: "last", get: function() {
      return this.at(this.length - 1);
    } }, { key: "length", get: function() {
      return this.nodes.length;
    } }]), g;
  }(r.default);
  e.default = D, t.exports = e.default;
});
var zu = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(La()), n = ut();
  function i(f) {
    return f && f.__esModule ? f : { default: f };
  }
  __name(i, "i");
  function a(f, c) {
    for (var p = 0; p < c.length; p++) {
      var d = c[p];
      d.enumerable = d.enumerable || false, d.configurable = true, "value" in d && (d.writable = true), Object.defineProperty(f, d.key, d);
    }
  }
  __name(a, "a");
  function o(f, c, p) {
    return c && a(f.prototype, c), p && a(f, p), f;
  }
  __name(o, "o");
  function u(f, c) {
    f.prototype = Object.create(c.prototype), f.prototype.constructor = f, s(f, c);
  }
  __name(u, "u");
  function s(f, c) {
    return s = Object.setPrototypeOf || function(p, d) {
      return p.__proto__ = d, p;
    }, s(f, c);
  }
  __name(s, "s");
  var l = function(f) {
    u(c, f);
    function c(d) {
      var D;
      return D = f.call(this, d) || this, D.type = n.ROOT, D;
    }
    __name(c, "c");
    var p = c.prototype;
    return p.toString = function() {
      var d = this.reduce(function(D, v) {
        return D.push(String(v)), D;
      }, []).join(",");
      return this.trailingComma ? d + "," : d;
    }, p.error = function(d, D) {
      return this._error ? this._error(d, D) : new Error(d);
    }, o(c, [{ key: "errorGenerator", set: function(d) {
      this._error = d;
    } }]), c;
  }(r.default);
  e.default = l, t.exports = e.default;
});
var Vu = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(La()), n = ut();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, l) {
    s.prototype = Object.create(l.prototype), s.prototype.constructor = s, o(s, l);
  }
  __name(a, "a");
  function o(s, l) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, l);
  }
  __name(o, "o");
  var u = function(s) {
    a(l, s);
    function l(f) {
      var c;
      return c = s.call(this, f) || this, c.type = n.SELECTOR, c;
    }
    __name(l, "l");
    return l;
  }(r.default);
  e.default = u, t.exports = e.default;
});
var Ia = le((e, t) => {
  "use strict";
  var r = {}, n = r.hasOwnProperty, i = /* @__PURE__ */ __name(function(l, f) {
    if (!l)
      return f;
    var c = {};
    for (var p in f)
      c[p] = n.call(l, p) ? l[p] : f[p];
    return c;
  }, "i"), a = /[ -,\.\/:-@\[-\^`\{-~]/, o = /[ -,\.\/:-@\[\]\^`\{-~]/, u = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g, s = /* @__PURE__ */ __name(function l(f, c) {
    c = i(c, l.options), c.quotes != "single" && c.quotes != "double" && (c.quotes = "single");
    for (var p = c.quotes == "double" ? '"' : "'", d = c.isIdentifier, D = f.charAt(0), v = "", g = 0, y = f.length; g < y; ) {
      var b = f.charAt(g++), C = b.charCodeAt(), k = void 0;
      if (C < 32 || C > 126) {
        if (C >= 55296 && C <= 56319 && g < y) {
          var S = f.charCodeAt(g++);
          (S & 64512) == 56320 ? C = ((C & 1023) << 10) + (S & 1023) + 65536 : g--;
        }
        k = "\\" + C.toString(16).toUpperCase() + " ";
      } else
        c.escapeEverything ? a.test(b) ? k = "\\" + b : k = "\\" + C.toString(16).toUpperCase() + " " : /[\t\n\f\r\x0B]/.test(b) ? k = "\\" + C.toString(16).toUpperCase() + " " : b == "\\" || !d && (b == '"' && p == b || b == "'" && p == b) || d && o.test(b) ? k = "\\" + b : k = b;
      v += k;
    }
    return d && (/^-[-\d]/.test(v) ? v = "\\-" + v.slice(1) : /\d/.test(D) && (v = "\\3" + D + " " + v.slice(1))), v = v.replace(u, function(E, L, T) {
      return L && L.length % 2 ? E : (L || "") + T;
    }), !d && c.wrap ? p + v + p : v;
  }, "l");
  s.options = { escapeEverything: false, isIdentifier: false, quotes: "single", wrap: false }, s.version = "3.0.0", t.exports = s;
});
var Hu = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = o(Ia()), n = Jn(), i = o(pr()), a = ut();
  function o(p) {
    return p && p.__esModule ? p : { default: p };
  }
  __name(o, "o");
  function u(p, d) {
    for (var D = 0; D < d.length; D++) {
      var v = d[D];
      v.enumerable = v.enumerable || false, v.configurable = true, "value" in v && (v.writable = true), Object.defineProperty(p, v.key, v);
    }
  }
  __name(u, "u");
  function s(p, d, D) {
    return d && u(p.prototype, d), D && u(p, D), p;
  }
  __name(s, "s");
  function l(p, d) {
    p.prototype = Object.create(d.prototype), p.prototype.constructor = p, f(p, d);
  }
  __name(l, "l");
  function f(p, d) {
    return f = Object.setPrototypeOf || function(D, v) {
      return D.__proto__ = v, D;
    }, f(p, d);
  }
  __name(f, "f");
  var c = function(p) {
    l(d, p);
    function d(v) {
      var g;
      return g = p.call(this, v) || this, g.type = a.CLASS, g._constructed = true, g;
    }
    __name(d, "d");
    var D = d.prototype;
    return D.valueToString = function() {
      return "." + p.prototype.valueToString.call(this);
    }, s(d, [{ key: "value", get: function() {
      return this._value;
    }, set: function(v) {
      if (this._constructed) {
        var g = (0, r.default)(v, { isIdentifier: true });
        g !== v ? ((0, n.ensureObject)(this, "raws"), this.raws.value = g) : this.raws && delete this.raws.value;
      }
      this._value = v;
    } }]), d;
  }(i.default);
  e.default = c, t.exports = e.default;
});
var Xu = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(pr()), n = ut();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, l) {
    s.prototype = Object.create(l.prototype), s.prototype.constructor = s, o(s, l);
  }
  __name(a, "a");
  function o(s, l) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, l);
  }
  __name(o, "o");
  var u = function(s) {
    a(l, s);
    function l(f) {
      var c;
      return c = s.call(this, f) || this, c.type = n.COMMENT, c;
    }
    __name(l, "l");
    return l;
  }(r.default);
  e.default = u, t.exports = e.default;
});
var qu = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(pr()), n = ut();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, l) {
    s.prototype = Object.create(l.prototype), s.prototype.constructor = s, o(s, l);
  }
  __name(a, "a");
  function o(s, l) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, l);
  }
  __name(o, "o");
  var u = function(s) {
    a(l, s);
    function l(c) {
      var p;
      return p = s.call(this, c) || this, p.type = n.ID, p;
    }
    __name(l, "l");
    var f = l.prototype;
    return f.valueToString = function() {
      return "#" + s.prototype.valueToString.call(this);
    }, l;
  }(r.default);
  e.default = u, t.exports = e.default;
});
var Pa = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = a(Ia()), n = Jn(), i = a(pr());
  function a(c) {
    return c && c.__esModule ? c : { default: c };
  }
  __name(a, "a");
  function o(c, p) {
    for (var d = 0; d < p.length; d++) {
      var D = p[d];
      D.enumerable = D.enumerable || false, D.configurable = true, "value" in D && (D.writable = true), Object.defineProperty(c, D.key, D);
    }
  }
  __name(o, "o");
  function u(c, p, d) {
    return p && o(c.prototype, p), d && o(c, d), c;
  }
  __name(u, "u");
  function s(c, p) {
    c.prototype = Object.create(p.prototype), c.prototype.constructor = c, l(c, p);
  }
  __name(s, "s");
  function l(c, p) {
    return l = Object.setPrototypeOf || function(d, D) {
      return d.__proto__ = D, d;
    }, l(c, p);
  }
  __name(l, "l");
  var f = function(c) {
    s(p, c);
    function p() {
      return c.apply(this, arguments) || this;
    }
    __name(p, "p");
    var d = p.prototype;
    return d.qualifiedName = function(D) {
      return this.namespace ? this.namespaceString + "|" + D : D;
    }, d.valueToString = function() {
      return this.qualifiedName(c.prototype.valueToString.call(this));
    }, u(p, [{ key: "namespace", get: function() {
      return this._namespace;
    }, set: function(D) {
      if (D === true || D === "*" || D === "&") {
        this._namespace = D, this.raws && delete this.raws.namespace;
        return;
      }
      var v = (0, r.default)(D, { isIdentifier: true });
      this._namespace = D, v !== D ? ((0, n.ensureObject)(this, "raws"), this.raws.namespace = v) : this.raws && delete this.raws.namespace;
    } }, { key: "ns", get: function() {
      return this._namespace;
    }, set: function(D) {
      this.namespace = D;
    } }, { key: "namespaceString", get: function() {
      if (this.namespace) {
        var D = this.stringifyProperty("namespace");
        return D === true ? "" : D;
      } else
        return "";
    } }]), p;
  }(i.default);
  e.default = f, t.exports = e.default;
});
var Yu = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(Pa()), n = ut();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, l) {
    s.prototype = Object.create(l.prototype), s.prototype.constructor = s, o(s, l);
  }
  __name(a, "a");
  function o(s, l) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, l);
  }
  __name(o, "o");
  var u = function(s) {
    a(l, s);
    function l(f) {
      var c;
      return c = s.call(this, f) || this, c.type = n.TAG, c;
    }
    __name(l, "l");
    return l;
  }(r.default);
  e.default = u, t.exports = e.default;
});
var Zu = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(pr()), n = ut();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, l) {
    s.prototype = Object.create(l.prototype), s.prototype.constructor = s, o(s, l);
  }
  __name(a, "a");
  function o(s, l) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, l);
  }
  __name(o, "o");
  var u = function(s) {
    a(l, s);
    function l(f) {
      var c;
      return c = s.call(this, f) || this, c.type = n.STRING, c;
    }
    __name(l, "l");
    return l;
  }(r.default);
  e.default = u, t.exports = e.default;
});
var Ju = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(La()), n = ut();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, l) {
    s.prototype = Object.create(l.prototype), s.prototype.constructor = s, o(s, l);
  }
  __name(a, "a");
  function o(s, l) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, l);
  }
  __name(o, "o");
  var u = function(s) {
    a(l, s);
    function l(c) {
      var p;
      return p = s.call(this, c) || this, p.type = n.PSEUDO, p;
    }
    __name(l, "l");
    var f = l.prototype;
    return f.toString = function() {
      var c = this.length ? "(" + this.map(String).join(",") + ")" : "";
      return [this.rawSpaceBefore, this.stringifyProperty("value"), c, this.rawSpaceAfter].join("");
    }, l;
  }(r.default);
  e.default = u, t.exports = e.default;
});
var Xv = le((e, t) => {
  t.exports = function(r, n) {
    return function(...i) {
      return console.warn(n), r(...i);
    };
  };
});
var Ku = le((e) => {
  "use strict";
  e.__esModule = true, e.unescapeValue = g, e.default = void 0;
  var t = o(Ia()), r = o(ju()), n = o(Pa()), i = ut(), a;
  function o(S) {
    return S && S.__esModule ? S : { default: S };
  }
  __name(o, "o");
  function u(S, E) {
    for (var L = 0; L < E.length; L++) {
      var T = E[L];
      T.enumerable = T.enumerable || false, T.configurable = true, "value" in T && (T.writable = true), Object.defineProperty(S, T.key, T);
    }
  }
  __name(u, "u");
  function s(S, E, L) {
    return E && u(S.prototype, E), L && u(S, L), S;
  }
  __name(s, "s");
  function l(S, E) {
    S.prototype = Object.create(E.prototype), S.prototype.constructor = S, f(S, E);
  }
  __name(l, "l");
  function f(S, E) {
    return f = Object.setPrototypeOf || function(L, T) {
      return L.__proto__ = T, L;
    }, f(S, E);
  }
  __name(f, "f");
  var c = Xv(), p = /^('|")([^]*)\1$/, d = c(function() {
  }, "Assigning an attribute a value containing characters that might need to be escaped is deprecated. Call attribute.setValue() instead."), D = c(function() {
  }, "Assigning attr.quoted is deprecated and has no effect. Assign to attr.quoteMark instead."), v = c(function() {
  }, "Constructing an Attribute selector with a value without specifying quoteMark is deprecated. Note: The value should be unescaped now.");
  function g(S) {
    var E = false, L = null, T = S, U = T.match(p);
    return U && (L = U[1], T = U[2]), T = (0, r.default)(T), T !== S && (E = true), { deprecatedUsage: E, unescaped: T, quoteMark: L };
  }
  __name(g, "g");
  function y(S) {
    if (S.quoteMark !== void 0 || S.value === void 0)
      return S;
    v();
    var E = g(S.value), L = E.quoteMark, T = E.unescaped;
    return S.raws || (S.raws = {}), S.raws.value === void 0 && (S.raws.value = S.value), S.value = T, S.quoteMark = L, S;
  }
  __name(y, "y");
  var b = function(S) {
    l(E, S);
    function E(T) {
      var U;
      return T === void 0 && (T = {}), U = S.call(this, y(T)) || this, U.type = i.ATTRIBUTE, U.raws = U.raws || {}, Object.defineProperty(U.raws, "unquoted", { get: c(function() {
        return U.value;
      }, "attr.raws.unquoted is deprecated. Call attr.value instead."), set: c(function() {
        return U.value;
      }, "Setting attr.raws.unquoted is deprecated and has no effect. attr.value is unescaped by default now.") }), U._constructed = true, U;
    }
    __name(E, "E");
    var L = E.prototype;
    return L.getQuotedValue = function(T) {
      T === void 0 && (T = {});
      var U = this._determineQuoteMark(T), M = C[U], H = (0, t.default)(this._value, M);
      return H;
    }, L._determineQuoteMark = function(T) {
      return T.smart ? this.smartQuoteMark(T) : this.preferredQuoteMark(T);
    }, L.setValue = function(T, U) {
      U === void 0 && (U = {}), this._value = T, this._quoteMark = this._determineQuoteMark(U), this._syncRawValue();
    }, L.smartQuoteMark = function(T) {
      var U = this.value, M = U.replace(/[^']/g, "").length, H = U.replace(/[^"]/g, "").length;
      if (M + H === 0) {
        var q = (0, t.default)(U, { isIdentifier: true });
        if (q === U)
          return E.NO_QUOTE;
        var ee = this.preferredQuoteMark(T);
        if (ee === E.NO_QUOTE) {
          var A = this.quoteMark || T.quoteMark || E.DOUBLE_QUOTE, R = C[A], O = (0, t.default)(U, R);
          if (O.length < q.length)
            return A;
        }
        return ee;
      } else
        return H === M ? this.preferredQuoteMark(T) : H < M ? E.DOUBLE_QUOTE : E.SINGLE_QUOTE;
    }, L.preferredQuoteMark = function(T) {
      var U = T.preferCurrentQuoteMark ? this.quoteMark : T.quoteMark;
      return U === void 0 && (U = T.preferCurrentQuoteMark ? T.quoteMark : this.quoteMark), U === void 0 && (U = E.DOUBLE_QUOTE), U;
    }, L._syncRawValue = function() {
      var T = (0, t.default)(this._value, C[this.quoteMark]);
      T === this._value ? this.raws && delete this.raws.value : this.raws.value = T;
    }, L._handleEscapes = function(T, U) {
      if (this._constructed) {
        var M = (0, t.default)(U, { isIdentifier: true });
        M !== U ? this.raws[T] = M : delete this.raws[T];
      }
    }, L._spacesFor = function(T) {
      var U = { before: "", after: "" }, M = this.spaces[T] || {}, H = this.raws.spaces && this.raws.spaces[T] || {};
      return Object.assign(U, M, H);
    }, L._stringFor = function(T, U, M) {
      U === void 0 && (U = T), M === void 0 && (M = k);
      var H = this._spacesFor(U);
      return M(this.stringifyProperty(T), H);
    }, L.offsetOf = function(T) {
      var U = 1, M = this._spacesFor("attribute");
      if (U += M.before.length, T === "namespace" || T === "ns")
        return this.namespace ? U : -1;
      if (T === "attributeNS" || (U += this.namespaceString.length, this.namespace && (U += 1), T === "attribute"))
        return U;
      U += this.stringifyProperty("attribute").length, U += M.after.length;
      var H = this._spacesFor("operator");
      U += H.before.length;
      var q = this.stringifyProperty("operator");
      if (T === "operator")
        return q ? U : -1;
      U += q.length, U += H.after.length;
      var ee = this._spacesFor("value");
      U += ee.before.length;
      var A = this.stringifyProperty("value");
      if (T === "value")
        return A ? U : -1;
      U += A.length, U += ee.after.length;
      var R = this._spacesFor("insensitive");
      return U += R.before.length, T === "insensitive" && this.insensitive ? U : -1;
    }, L.toString = function() {
      var T = this, U = [this.rawSpaceBefore, "["];
      return U.push(this._stringFor("qualifiedAttribute", "attribute")), this.operator && (this.value || this.value === "") && (U.push(this._stringFor("operator")), U.push(this._stringFor("value")), U.push(this._stringFor("insensitiveFlag", "insensitive", function(M, H) {
        return M.length > 0 && !T.quoted && H.before.length === 0 && !(T.spaces.value && T.spaces.value.after) && (H.before = " "), k(M, H);
      }))), U.push("]"), U.push(this.rawSpaceAfter), U.join("");
    }, s(E, [{ key: "quoted", get: function() {
      var T = this.quoteMark;
      return T === "'" || T === '"';
    }, set: function(T) {
      D();
    } }, { key: "quoteMark", get: function() {
      return this._quoteMark;
    }, set: function(T) {
      if (!this._constructed) {
        this._quoteMark = T;
        return;
      }
      this._quoteMark !== T && (this._quoteMark = T, this._syncRawValue());
    } }, { key: "qualifiedAttribute", get: function() {
      return this.qualifiedName(this.raws.attribute || this.attribute);
    } }, { key: "insensitiveFlag", get: function() {
      return this.insensitive ? "i" : "";
    } }, { key: "value", get: function() {
      return this._value;
    }, set: function(T) {
      if (this._constructed) {
        var U = g(T), M = U.deprecatedUsage, H = U.unescaped, q = U.quoteMark;
        if (M && d(), H === this._value && q === this._quoteMark)
          return;
        this._value = H, this._quoteMark = q, this._syncRawValue();
      } else
        this._value = T;
    } }, { key: "attribute", get: function() {
      return this._attribute;
    }, set: function(T) {
      this._handleEscapes("attribute", T), this._attribute = T;
    } }]), E;
  }(n.default);
  e.default = b, b.NO_QUOTE = null, b.SINGLE_QUOTE = "'", b.DOUBLE_QUOTE = '"';
  var C = (a = { "'": { quotes: "single", wrap: true }, '"': { quotes: "double", wrap: true } }, a[null] = { isIdentifier: true }, a);
  function k(S, E) {
    return "" + E.before + S + E.after;
  }
  __name(k, "k");
});
var Qu = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(Pa()), n = ut();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, l) {
    s.prototype = Object.create(l.prototype), s.prototype.constructor = s, o(s, l);
  }
  __name(a, "a");
  function o(s, l) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, l);
  }
  __name(o, "o");
  var u = function(s) {
    a(l, s);
    function l(f) {
      var c;
      return c = s.call(this, f) || this, c.type = n.UNIVERSAL, c.value = "*", c;
    }
    __name(l, "l");
    return l;
  }(r.default);
  e.default = u, t.exports = e.default;
});
var el = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(pr()), n = ut();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, l) {
    s.prototype = Object.create(l.prototype), s.prototype.constructor = s, o(s, l);
  }
  __name(a, "a");
  function o(s, l) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, l);
  }
  __name(o, "o");
  var u = function(s) {
    a(l, s);
    function l(f) {
      var c;
      return c = s.call(this, f) || this, c.type = n.COMBINATOR, c;
    }
    __name(l, "l");
    return l;
  }(r.default);
  e.default = u, t.exports = e.default;
});
var tl = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = i(pr()), n = ut();
  function i(s) {
    return s && s.__esModule ? s : { default: s };
  }
  __name(i, "i");
  function a(s, l) {
    s.prototype = Object.create(l.prototype), s.prototype.constructor = s, o(s, l);
  }
  __name(a, "a");
  function o(s, l) {
    return o = Object.setPrototypeOf || function(f, c) {
      return f.__proto__ = c, f;
    }, o(s, l);
  }
  __name(o, "o");
  var u = function(s) {
    a(l, s);
    function l(f) {
      var c;
      return c = s.call(this, f) || this, c.type = n.NESTING, c.value = "&", c;
    }
    __name(l, "l");
    return l;
  }(r.default);
  e.default = u, t.exports = e.default;
});
var qv = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = r;
  function r(n) {
    return n.sort(function(i, a) {
      return i - a;
    });
  }
  __name(r, "r");
  t.exports = e.default;
});
var rl = le((e) => {
  "use strict";
  e.__esModule = true, e.combinator = e.word = e.comment = e.str = e.tab = e.newline = e.feed = e.cr = e.backslash = e.bang = e.slash = e.doubleQuote = e.singleQuote = e.space = e.greaterThan = e.pipe = e.equals = e.plus = e.caret = e.tilde = e.dollar = e.closeSquare = e.openSquare = e.closeParenthesis = e.openParenthesis = e.semicolon = e.colon = e.comma = e.at = e.asterisk = e.ampersand = void 0;
  var t = 38;
  e.ampersand = t;
  var r = 42;
  e.asterisk = r;
  var n = 64;
  e.at = n;
  var i = 44;
  e.comma = i;
  var a = 58;
  e.colon = a;
  var o = 59;
  e.semicolon = o;
  var u = 40;
  e.openParenthesis = u;
  var s = 41;
  e.closeParenthesis = s;
  var l = 91;
  e.openSquare = l;
  var f = 93;
  e.closeSquare = f;
  var c = 36;
  e.dollar = c;
  var p = 126;
  e.tilde = p;
  var d = 94;
  e.caret = d;
  var D = 43;
  e.plus = D;
  var v = 61;
  e.equals = v;
  var g = 124;
  e.pipe = g;
  var y = 62;
  e.greaterThan = y;
  var b = 32;
  e.space = b;
  var C = 39;
  e.singleQuote = C;
  var k = 34;
  e.doubleQuote = k;
  var S = 47;
  e.slash = S;
  var E = 33;
  e.bang = E;
  var L = 92;
  e.backslash = L;
  var T = 13;
  e.cr = T;
  var U = 12;
  e.feed = U;
  var M = 10;
  e.newline = M;
  var H = 9;
  e.tab = H;
  var q = C;
  e.str = q;
  var ee = -1;
  e.comment = ee;
  var A = -2;
  e.word = A;
  var R = -3;
  e.combinator = R;
});
var Yv = le((e) => {
  "use strict";
  e.__esModule = true, e.default = D, e.FIELDS = void 0;
  var t = a(rl()), r, n;
  function i() {
    if (typeof WeakMap != "function")
      return null;
    var v = /* @__PURE__ */ new WeakMap();
    return i = /* @__PURE__ */ __name(function() {
      return v;
    }, "i"), v;
  }
  __name(i, "i");
  function a(v) {
    if (v && v.__esModule)
      return v;
    if (v === null || typeof v != "object" && typeof v != "function")
      return { default: v };
    var g = i();
    if (g && g.has(v))
      return g.get(v);
    var y = {}, b = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var C in v)
      if (Object.prototype.hasOwnProperty.call(v, C)) {
        var k = b ? Object.getOwnPropertyDescriptor(v, C) : null;
        k && (k.get || k.set) ? Object.defineProperty(y, C, k) : y[C] = v[C];
      }
    return y.default = v, g && g.set(v, y), y;
  }
  __name(a, "a");
  var o = (r = {}, r[t.tab] = true, r[t.newline] = true, r[t.cr] = true, r[t.feed] = true, r), u = (n = {}, n[t.space] = true, n[t.tab] = true, n[t.newline] = true, n[t.cr] = true, n[t.feed] = true, n[t.ampersand] = true, n[t.asterisk] = true, n[t.bang] = true, n[t.comma] = true, n[t.colon] = true, n[t.semicolon] = true, n[t.openParenthesis] = true, n[t.closeParenthesis] = true, n[t.openSquare] = true, n[t.closeSquare] = true, n[t.singleQuote] = true, n[t.doubleQuote] = true, n[t.plus] = true, n[t.pipe] = true, n[t.tilde] = true, n[t.greaterThan] = true, n[t.equals] = true, n[t.dollar] = true, n[t.caret] = true, n[t.slash] = true, n), s = {}, l = "0123456789abcdefABCDEF";
  for (f = 0; f < l.length; f++)
    s[l.charCodeAt(f)] = true;
  var f;
  function c(v, g) {
    var y = g, b;
    do {
      if (b = v.charCodeAt(y), u[b])
        return y - 1;
      b === t.backslash ? y = p(v, y) + 1 : y++;
    } while (y < v.length);
    return y - 1;
  }
  __name(c, "c");
  function p(v, g) {
    var y = g, b = v.charCodeAt(y + 1);
    if (!o[b])
      if (s[b]) {
        var C = 0;
        do
          y++, C++, b = v.charCodeAt(y + 1);
        while (s[b] && C < 6);
        C < 6 && b === t.space && y++;
      } else
        y++;
    return y;
  }
  __name(p, "p");
  var d = { TYPE: 0, START_LINE: 1, START_COL: 2, END_LINE: 3, END_COL: 4, START_POS: 5, END_POS: 6 };
  e.FIELDS = d;
  function D(v) {
    var g = [], y = v.css.valueOf(), b = y, C = b.length, k = -1, S = 1, E = 0, L = 0, T, U, M, H, q, ee, A, R, O, Y, Z, te, ie;
    function B(z, _) {
      if (v.safe)
        y += _, O = y.length - 1;
      else
        throw v.error("Unclosed " + z, S, E - k, E);
    }
    __name(B, "B");
    for (; E < C; ) {
      switch (T = y.charCodeAt(E), T === t.newline && (k = E, S += 1), T) {
        case t.space:
        case t.tab:
        case t.newline:
        case t.cr:
        case t.feed:
          O = E;
          do
            O += 1, T = y.charCodeAt(O), T === t.newline && (k = O, S += 1);
          while (T === t.space || T === t.newline || T === t.tab || T === t.cr || T === t.feed);
          ie = t.space, H = S, M = O - k - 1, L = O;
          break;
        case t.plus:
        case t.greaterThan:
        case t.tilde:
        case t.pipe:
          O = E;
          do
            O += 1, T = y.charCodeAt(O);
          while (T === t.plus || T === t.greaterThan || T === t.tilde || T === t.pipe);
          ie = t.combinator, H = S, M = E - k, L = O;
          break;
        case t.asterisk:
        case t.ampersand:
        case t.bang:
        case t.comma:
        case t.equals:
        case t.dollar:
        case t.caret:
        case t.openSquare:
        case t.closeSquare:
        case t.colon:
        case t.semicolon:
        case t.openParenthesis:
        case t.closeParenthesis:
          O = E, ie = T, H = S, M = E - k, L = O + 1;
          break;
        case t.singleQuote:
        case t.doubleQuote:
          te = T === t.singleQuote ? "'" : '"', O = E;
          do
            for (q = false, O = y.indexOf(te, O + 1), O === -1 && B("quote", te), ee = O; y.charCodeAt(ee - 1) === t.backslash; )
              ee -= 1, q = !q;
          while (q);
          ie = t.str, H = S, M = E - k, L = O + 1;
          break;
        default:
          T === t.slash && y.charCodeAt(E + 1) === t.asterisk ? (O = y.indexOf("*/", E + 2) + 1, O === 0 && B("comment", "*/"), U = y.slice(E, O + 1), R = U.split(`
`), A = R.length - 1, A > 0 ? (Y = S + A, Z = O - R[A].length) : (Y = S, Z = k), ie = t.comment, S = Y, H = Y, M = O - Z) : T === t.slash ? (O = E, ie = T, H = S, M = E - k, L = O + 1) : (O = c(y, E), ie = t.word, H = S, M = O - k), L = O + 1;
          break;
      }
      g.push([ie, S, E - k, H, M, E, L]), Z && (k = Z, Z = null), E = L;
    }
    return g;
  }
  __name(D, "D");
});
var Zv = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = L(zu()), n = L(Vu()), i = L(Hu()), a = L(Xu()), o = L(qu()), u = L(Yu()), s = L(Zu()), l = L(Ju()), f = E(Ku()), c = L(Qu()), p = L(el()), d = L(tl()), D = L(qv()), v = E(Yv()), g = E(rl()), y = E(ut()), b = Jn(), C, k;
  function S() {
    if (typeof WeakMap != "function")
      return null;
    var B = /* @__PURE__ */ new WeakMap();
    return S = /* @__PURE__ */ __name(function() {
      return B;
    }, "S"), B;
  }
  __name(S, "S");
  function E(B) {
    if (B && B.__esModule)
      return B;
    if (B === null || typeof B != "object" && typeof B != "function")
      return { default: B };
    var z = S();
    if (z && z.has(B))
      return z.get(B);
    var _ = {}, N = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var ae in B)
      if (Object.prototype.hasOwnProperty.call(B, ae)) {
        var W = N ? Object.getOwnPropertyDescriptor(B, ae) : null;
        W && (W.get || W.set) ? Object.defineProperty(_, ae, W) : _[ae] = B[ae];
      }
    return _.default = B, z && z.set(B, _), _;
  }
  __name(E, "E");
  function L(B) {
    return B && B.__esModule ? B : { default: B };
  }
  __name(L, "L");
  function T(B, z) {
    for (var _ = 0; _ < z.length; _++) {
      var N = z[_];
      N.enumerable = N.enumerable || false, N.configurable = true, "value" in N && (N.writable = true), Object.defineProperty(B, N.key, N);
    }
  }
  __name(T, "T");
  function U(B, z, _) {
    return z && T(B.prototype, z), _ && T(B, _), B;
  }
  __name(U, "U");
  var M = (C = {}, C[g.space] = true, C[g.cr] = true, C[g.feed] = true, C[g.newline] = true, C[g.tab] = true, C), H = Object.assign({}, M, (k = {}, k[g.comment] = true, k));
  function q(B) {
    return { line: B[v.FIELDS.START_LINE], column: B[v.FIELDS.START_COL] };
  }
  __name(q, "q");
  function ee(B) {
    return { line: B[v.FIELDS.END_LINE], column: B[v.FIELDS.END_COL] };
  }
  __name(ee, "ee");
  function A(B, z, _, N) {
    return { start: { line: B, column: z }, end: { line: _, column: N } };
  }
  __name(A, "A");
  function R(B) {
    return A(B[v.FIELDS.START_LINE], B[v.FIELDS.START_COL], B[v.FIELDS.END_LINE], B[v.FIELDS.END_COL]);
  }
  __name(R, "R");
  function O(B, z) {
    if (B)
      return A(B[v.FIELDS.START_LINE], B[v.FIELDS.START_COL], z[v.FIELDS.END_LINE], z[v.FIELDS.END_COL]);
  }
  __name(O, "O");
  function Y(B, z) {
    var _ = B[z];
    if (typeof _ == "string")
      return _.indexOf("\\") !== -1 && ((0, b.ensureObject)(B, "raws"), B[z] = (0, b.unesc)(_), B.raws[z] === void 0 && (B.raws[z] = _)), B;
  }
  __name(Y, "Y");
  function Z(B, z) {
    for (var _ = -1, N = []; (_ = B.indexOf(z, _ + 1)) !== -1; )
      N.push(_);
    return N;
  }
  __name(Z, "Z");
  function te() {
    var B = Array.prototype.concat.apply([], arguments);
    return B.filter(function(z, _) {
      return _ === B.indexOf(z);
    });
  }
  __name(te, "te");
  var ie = function() {
    function B(_, N) {
      N === void 0 && (N = {}), this.rule = _, this.options = Object.assign({ lossy: false, safe: false }, N), this.position = 0, this.css = typeof this.rule == "string" ? this.rule : this.rule.selector, this.tokens = (0, v.default)({ css: this.css, error: this._errorGenerator(), safe: this.options.safe });
      var ae = O(this.tokens[0], this.tokens[this.tokens.length - 1]);
      this.root = new r.default({ source: ae }), this.root.errorGenerator = this._errorGenerator();
      var W = new n.default({ source: { start: { line: 1, column: 1 } } });
      this.root.append(W), this.current = W, this.loop();
    }
    __name(B, "B");
    var z = B.prototype;
    return z._errorGenerator = function() {
      var _ = this;
      return function(N, ae) {
        return typeof _.rule == "string" ? new Error(N) : _.rule.error(N, ae);
      };
    }, z.attribute = function() {
      var _ = [], N = this.currToken;
      for (this.position++; this.position < this.tokens.length && this.currToken[v.FIELDS.TYPE] !== g.closeSquare; )
        _.push(this.currToken), this.position++;
      if (this.currToken[v.FIELDS.TYPE] !== g.closeSquare)
        return this.expected("closing square bracket", this.currToken[v.FIELDS.START_POS]);
      var ae = _.length, W = { source: A(N[1], N[2], this.currToken[3], this.currToken[4]), sourceIndex: N[v.FIELDS.START_POS] };
      if (ae === 1 && !~[g.word].indexOf(_[0][v.FIELDS.TYPE]))
        return this.expected("attribute", _[0][v.FIELDS.START_POS]);
      for (var fe = 0, ce = "", ge = "", pe = null, xe = false; fe < ae; ) {
        var _e = _[fe], he = this.content(_e), ye = _[fe + 1];
        switch (_e[v.FIELDS.TYPE]) {
          case g.space:
            if (xe = true, this.options.lossy)
              break;
            if (pe) {
              (0, b.ensureObject)(W, "spaces", pe);
              var Ge = W.spaces[pe].after || "";
              W.spaces[pe].after = Ge + he;
              var tt = (0, b.getProp)(W, "raws", "spaces", pe, "after") || null;
              tt && (W.raws.spaces[pe].after = tt + he);
            } else
              ce = ce + he, ge = ge + he;
            break;
          case g.asterisk:
            if (ye[v.FIELDS.TYPE] === g.equals)
              W.operator = he, pe = "operator";
            else if ((!W.namespace || pe === "namespace" && !xe) && ye) {
              ce && ((0, b.ensureObject)(W, "spaces", "attribute"), W.spaces.attribute.before = ce, ce = ""), ge && ((0, b.ensureObject)(W, "raws", "spaces", "attribute"), W.raws.spaces.attribute.before = ce, ge = ""), W.namespace = (W.namespace || "") + he;
              var We = (0, b.getProp)(W, "raws", "namespace") || null;
              We && (W.raws.namespace += he), pe = "namespace";
            }
            xe = false;
            break;
          case g.dollar:
            if (pe === "value") {
              var Be = (0, b.getProp)(W, "raws", "value");
              W.value += "$", Be && (W.raws.value = Be + "$");
              break;
            }
          case g.caret:
            ye[v.FIELDS.TYPE] === g.equals && (W.operator = he, pe = "operator"), xe = false;
            break;
          case g.combinator:
            if (he === "~" && ye[v.FIELDS.TYPE] === g.equals && (W.operator = he, pe = "operator"), he !== "|") {
              xe = false;
              break;
            }
            ye[v.FIELDS.TYPE] === g.equals ? (W.operator = he, pe = "operator") : !W.namespace && !W.attribute && (W.namespace = true), xe = false;
            break;
          case g.word:
            if (ye && this.content(ye) === "|" && _[fe + 2] && _[fe + 2][v.FIELDS.TYPE] !== g.equals && !W.operator && !W.namespace)
              W.namespace = he, pe = "namespace";
            else if (!W.attribute || pe === "attribute" && !xe) {
              ce && ((0, b.ensureObject)(W, "spaces", "attribute"), W.spaces.attribute.before = ce, ce = ""), ge && ((0, b.ensureObject)(W, "raws", "spaces", "attribute"), W.raws.spaces.attribute.before = ge, ge = ""), W.attribute = (W.attribute || "") + he;
              var He = (0, b.getProp)(W, "raws", "attribute") || null;
              He && (W.raws.attribute += he), pe = "attribute";
            } else if (!W.value && W.value !== "" || pe === "value" && !xe) {
              var rt = (0, b.unesc)(he), nt = (0, b.getProp)(W, "raws", "value") || "", it = W.value || "";
              W.value = it + rt, W.quoteMark = null, (rt !== he || nt) && ((0, b.ensureObject)(W, "raws"), W.raws.value = (nt || it) + he), pe = "value";
            } else {
              var at = he === "i" || he === "I";
              (W.value || W.value === "") && (W.quoteMark || xe) ? (W.insensitive = at, (!at || he === "I") && ((0, b.ensureObject)(W, "raws"), W.raws.insensitiveFlag = he), pe = "insensitive", ce && ((0, b.ensureObject)(W, "spaces", "insensitive"), W.spaces.insensitive.before = ce, ce = ""), ge && ((0, b.ensureObject)(W, "raws", "spaces", "insensitive"), W.raws.spaces.insensitive.before = ge, ge = "")) : (W.value || W.value === "") && (pe = "value", W.value += he, W.raws.value && (W.raws.value += he));
            }
            xe = false;
            break;
          case g.str:
            if (!W.attribute || !W.operator)
              return this.error("Expected an attribute followed by an operator preceding the string.", { index: _e[v.FIELDS.START_POS] });
            var Xe = (0, f.unescapeValue)(he), Ct = Xe.unescaped, Dt = Xe.quoteMark;
            W.value = Ct, W.quoteMark = Dt, pe = "value", (0, b.ensureObject)(W, "raws"), W.raws.value = he, xe = false;
            break;
          case g.equals:
            if (!W.attribute)
              return this.expected("attribute", _e[v.FIELDS.START_POS], he);
            if (W.value)
              return this.error('Unexpected "=" found; an operator was already defined.', { index: _e[v.FIELDS.START_POS] });
            W.operator = W.operator ? W.operator + he : he, pe = "operator", xe = false;
            break;
          case g.comment:
            if (pe)
              if (xe || ye && ye[v.FIELDS.TYPE] === g.space || pe === "insensitive") {
                var ft = (0, b.getProp)(W, "spaces", pe, "after") || "", ct = (0, b.getProp)(W, "raws", "spaces", pe, "after") || ft;
                (0, b.ensureObject)(W, "raws", "spaces", pe), W.raws.spaces[pe].after = ct + he;
              } else {
                var zt = W[pe] || "", lt = (0, b.getProp)(W, "raws", pe) || zt;
                (0, b.ensureObject)(W, "raws"), W.raws[pe] = lt + he;
              }
            else
              ge = ge + he;
            break;
          default:
            return this.error('Unexpected "' + he + '" found.', { index: _e[v.FIELDS.START_POS] });
        }
        fe++;
      }
      Y(W, "attribute"), Y(W, "namespace"), this.newNode(new f.default(W)), this.position++;
    }, z.parseWhitespaceEquivalentTokens = function(_) {
      _ < 0 && (_ = this.tokens.length);
      var N = this.position, ae = [], W = "", fe = void 0;
      do
        if (M[this.currToken[v.FIELDS.TYPE]])
          this.options.lossy || (W += this.content());
        else if (this.currToken[v.FIELDS.TYPE] === g.comment) {
          var ce = {};
          W && (ce.before = W, W = ""), fe = new a.default({ value: this.content(), source: R(this.currToken), sourceIndex: this.currToken[v.FIELDS.START_POS], spaces: ce }), ae.push(fe);
        }
      while (++this.position < _);
      if (W) {
        if (fe)
          fe.spaces.after = W;
        else if (!this.options.lossy) {
          var ge = this.tokens[N], pe = this.tokens[this.position - 1];
          ae.push(new s.default({ value: "", source: A(ge[v.FIELDS.START_LINE], ge[v.FIELDS.START_COL], pe[v.FIELDS.END_LINE], pe[v.FIELDS.END_COL]), sourceIndex: ge[v.FIELDS.START_POS], spaces: { before: W, after: "" } }));
        }
      }
      return ae;
    }, z.convertWhitespaceNodesToSpace = function(_, N) {
      var ae = this;
      N === void 0 && (N = false);
      var W = "", fe = "";
      _.forEach(function(ge) {
        var pe = ae.lossySpace(ge.spaces.before, N), xe = ae.lossySpace(ge.rawSpaceBefore, N);
        W += pe + ae.lossySpace(ge.spaces.after, N && pe.length === 0), fe += pe + ge.value + ae.lossySpace(ge.rawSpaceAfter, N && xe.length === 0);
      }), fe === W && (fe = void 0);
      var ce = { space: W, rawSpace: fe };
      return ce;
    }, z.isNamedCombinator = function(_) {
      return _ === void 0 && (_ = this.position), this.tokens[_ + 0] && this.tokens[_ + 0][v.FIELDS.TYPE] === g.slash && this.tokens[_ + 1] && this.tokens[_ + 1][v.FIELDS.TYPE] === g.word && this.tokens[_ + 2] && this.tokens[_ + 2][v.FIELDS.TYPE] === g.slash;
    }, z.namedCombinator = function() {
      if (this.isNamedCombinator()) {
        var _ = this.content(this.tokens[this.position + 1]), N = (0, b.unesc)(_).toLowerCase(), ae = {};
        N !== _ && (ae.value = "/" + _ + "/");
        var W = new p.default({ value: "/" + N + "/", source: A(this.currToken[v.FIELDS.START_LINE], this.currToken[v.FIELDS.START_COL], this.tokens[this.position + 2][v.FIELDS.END_LINE], this.tokens[this.position + 2][v.FIELDS.END_COL]), sourceIndex: this.currToken[v.FIELDS.START_POS], raws: ae });
        return this.position = this.position + 3, W;
      } else
        this.unexpected();
    }, z.combinator = function() {
      var _ = this;
      if (this.content() === "|")
        return this.namespace();
      var N = this.locateNextMeaningfulToken(this.position);
      if (N < 0 || this.tokens[N][v.FIELDS.TYPE] === g.comma) {
        var ae = this.parseWhitespaceEquivalentTokens(N);
        if (ae.length > 0) {
          var W = this.current.last;
          if (W) {
            var fe = this.convertWhitespaceNodesToSpace(ae), ce = fe.space, ge = fe.rawSpace;
            ge !== void 0 && (W.rawSpaceAfter += ge), W.spaces.after += ce;
          } else
            ae.forEach(function(nt) {
              return _.newNode(nt);
            });
        }
        return;
      }
      var pe = this.currToken, xe = void 0;
      N > this.position && (xe = this.parseWhitespaceEquivalentTokens(N));
      var _e;
      if (this.isNamedCombinator() ? _e = this.namedCombinator() : this.currToken[v.FIELDS.TYPE] === g.combinator ? (_e = new p.default({ value: this.content(), source: R(this.currToken), sourceIndex: this.currToken[v.FIELDS.START_POS] }), this.position++) : M[this.currToken[v.FIELDS.TYPE]] || xe || this.unexpected(), _e) {
        if (xe) {
          var he = this.convertWhitespaceNodesToSpace(xe), ye = he.space, Ge = he.rawSpace;
          _e.spaces.before = ye, _e.rawSpaceBefore = Ge;
        }
      } else {
        var tt = this.convertWhitespaceNodesToSpace(xe, true), We = tt.space, Be = tt.rawSpace;
        Be || (Be = We);
        var He = {}, rt = { spaces: {} };
        We.endsWith(" ") && Be.endsWith(" ") ? (He.before = We.slice(0, We.length - 1), rt.spaces.before = Be.slice(0, Be.length - 1)) : We.startsWith(" ") && Be.startsWith(" ") ? (He.after = We.slice(1), rt.spaces.after = Be.slice(1)) : rt.value = Be, _e = new p.default({ value: " ", source: O(pe, this.tokens[this.position - 1]), sourceIndex: pe[v.FIELDS.START_POS], spaces: He, raws: rt });
      }
      return this.currToken && this.currToken[v.FIELDS.TYPE] === g.space && (_e.spaces.after = this.optionalSpace(this.content()), this.position++), this.newNode(_e);
    }, z.comma = function() {
      if (this.position === this.tokens.length - 1) {
        this.root.trailingComma = true, this.position++;
        return;
      }
      this.current._inferEndPosition();
      var _ = new n.default({ source: { start: q(this.tokens[this.position + 1]) } });
      this.current.parent.append(_), this.current = _, this.position++;
    }, z.comment = function() {
      var _ = this.currToken;
      this.newNode(new a.default({ value: this.content(), source: R(_), sourceIndex: _[v.FIELDS.START_POS] })), this.position++;
    }, z.error = function(_, N) {
      throw this.root.error(_, N);
    }, z.missingBackslash = function() {
      return this.error("Expected a backslash preceding the semicolon.", { index: this.currToken[v.FIELDS.START_POS] });
    }, z.missingParenthesis = function() {
      return this.expected("opening parenthesis", this.currToken[v.FIELDS.START_POS]);
    }, z.missingSquareBracket = function() {
      return this.expected("opening square bracket", this.currToken[v.FIELDS.START_POS]);
    }, z.unexpected = function() {
      return this.error("Unexpected '" + this.content() + "'. Escaping special characters with \\ may help.", this.currToken[v.FIELDS.START_POS]);
    }, z.namespace = function() {
      var _ = this.prevToken && this.content(this.prevToken) || true;
      if (this.nextToken[v.FIELDS.TYPE] === g.word)
        return this.position++, this.word(_);
      if (this.nextToken[v.FIELDS.TYPE] === g.asterisk)
        return this.position++, this.universal(_);
    }, z.nesting = function() {
      if (this.nextToken) {
        var _ = this.content(this.nextToken);
        if (_ === "|") {
          this.position++;
          return;
        }
      }
      var N = this.currToken;
      this.newNode(new d.default({ value: this.content(), source: R(N), sourceIndex: N[v.FIELDS.START_POS] })), this.position++;
    }, z.parentheses = function() {
      var _ = this.current.last, N = 1;
      if (this.position++, _ && _.type === y.PSEUDO) {
        var ae = new n.default({ source: { start: q(this.tokens[this.position - 1]) } }), W = this.current;
        for (_.append(ae), this.current = ae; this.position < this.tokens.length && N; )
          this.currToken[v.FIELDS.TYPE] === g.openParenthesis && N++, this.currToken[v.FIELDS.TYPE] === g.closeParenthesis && N--, N ? this.parse() : (this.current.source.end = ee(this.currToken), this.current.parent.source.end = ee(this.currToken), this.position++);
        this.current = W;
      } else {
        for (var fe = this.currToken, ce = "(", ge; this.position < this.tokens.length && N; )
          this.currToken[v.FIELDS.TYPE] === g.openParenthesis && N++, this.currToken[v.FIELDS.TYPE] === g.closeParenthesis && N--, ge = this.currToken, ce += this.parseParenthesisToken(this.currToken), this.position++;
        _ ? _.appendToPropertyAndEscape("value", ce, ce) : this.newNode(new s.default({ value: ce, source: A(fe[v.FIELDS.START_LINE], fe[v.FIELDS.START_COL], ge[v.FIELDS.END_LINE], ge[v.FIELDS.END_COL]), sourceIndex: fe[v.FIELDS.START_POS] }));
      }
      if (N)
        return this.expected("closing parenthesis", this.currToken[v.FIELDS.START_POS]);
    }, z.pseudo = function() {
      for (var _ = this, N = "", ae = this.currToken; this.currToken && this.currToken[v.FIELDS.TYPE] === g.colon; )
        N += this.content(), this.position++;
      if (!this.currToken)
        return this.expected(["pseudo-class", "pseudo-element"], this.position - 1);
      if (this.currToken[v.FIELDS.TYPE] === g.word)
        this.splitWord(false, function(W, fe) {
          N += W, _.newNode(new l.default({ value: N, source: O(ae, _.currToken), sourceIndex: ae[v.FIELDS.START_POS] })), fe > 1 && _.nextToken && _.nextToken[v.FIELDS.TYPE] === g.openParenthesis && _.error("Misplaced parenthesis.", { index: _.nextToken[v.FIELDS.START_POS] });
        });
      else
        return this.expected(["pseudo-class", "pseudo-element"], this.currToken[v.FIELDS.START_POS]);
    }, z.space = function() {
      var _ = this.content();
      this.position === 0 || this.prevToken[v.FIELDS.TYPE] === g.comma || this.prevToken[v.FIELDS.TYPE] === g.openParenthesis || this.current.nodes.every(function(N) {
        return N.type === "comment";
      }) ? (this.spaces = this.optionalSpace(_), this.position++) : this.position === this.tokens.length - 1 || this.nextToken[v.FIELDS.TYPE] === g.comma || this.nextToken[v.FIELDS.TYPE] === g.closeParenthesis ? (this.current.last.spaces.after = this.optionalSpace(_), this.position++) : this.combinator();
    }, z.string = function() {
      var _ = this.currToken;
      this.newNode(new s.default({ value: this.content(), source: R(_), sourceIndex: _[v.FIELDS.START_POS] })), this.position++;
    }, z.universal = function(_) {
      var N = this.nextToken;
      if (N && this.content(N) === "|")
        return this.position++, this.namespace();
      var ae = this.currToken;
      this.newNode(new c.default({ value: this.content(), source: R(ae), sourceIndex: ae[v.FIELDS.START_POS] }), _), this.position++;
    }, z.splitWord = function(_, N) {
      for (var ae = this, W = this.nextToken, fe = this.content(); W && ~[g.dollar, g.caret, g.equals, g.word].indexOf(W[v.FIELDS.TYPE]); ) {
        this.position++;
        var ce = this.content();
        if (fe += ce, ce.lastIndexOf("\\") === ce.length - 1) {
          var ge = this.nextToken;
          ge && ge[v.FIELDS.TYPE] === g.space && (fe += this.requiredSpace(this.content(ge)), this.position++);
        }
        W = this.nextToken;
      }
      var pe = Z(fe, ".").filter(function(ye) {
        var Ge = fe[ye - 1] === "\\", tt = /^\d+\.\d+%$/.test(fe);
        return !Ge && !tt;
      }), xe = Z(fe, "#").filter(function(ye) {
        return fe[ye - 1] !== "\\";
      }), _e = Z(fe, "#{");
      _e.length && (xe = xe.filter(function(ye) {
        return !~_e.indexOf(ye);
      }));
      var he = (0, D.default)(te([0].concat(pe, xe)));
      he.forEach(function(ye, Ge) {
        var tt = he[Ge + 1] || fe.length, We = fe.slice(ye, tt);
        if (Ge === 0 && N)
          return N.call(ae, We, he.length);
        var Be, He = ae.currToken, rt = He[v.FIELDS.START_POS] + he[Ge], nt = A(He[1], He[2] + ye, He[3], He[2] + (tt - 1));
        if (~pe.indexOf(ye)) {
          var it = { value: We.slice(1), source: nt, sourceIndex: rt };
          Be = new i.default(Y(it, "value"));
        } else if (~xe.indexOf(ye)) {
          var at = { value: We.slice(1), source: nt, sourceIndex: rt };
          Be = new o.default(Y(at, "value"));
        } else {
          var Xe = { value: We, source: nt, sourceIndex: rt };
          Y(Xe, "value"), Be = new u.default(Xe);
        }
        ae.newNode(Be, _), _ = null;
      }), this.position++;
    }, z.word = function(_) {
      var N = this.nextToken;
      return N && this.content(N) === "|" ? (this.position++, this.namespace()) : this.splitWord(_);
    }, z.loop = function() {
      for (; this.position < this.tokens.length; )
        this.parse(true);
      return this.current._inferEndPosition(), this.root;
    }, z.parse = function(_) {
      switch (this.currToken[v.FIELDS.TYPE]) {
        case g.space:
          this.space();
          break;
        case g.comment:
          this.comment();
          break;
        case g.openParenthesis:
          this.parentheses();
          break;
        case g.closeParenthesis:
          _ && this.missingParenthesis();
          break;
        case g.openSquare:
          this.attribute();
          break;
        case g.dollar:
        case g.caret:
        case g.equals:
        case g.word:
          this.word();
          break;
        case g.colon:
          this.pseudo();
          break;
        case g.comma:
          this.comma();
          break;
        case g.asterisk:
          this.universal();
          break;
        case g.ampersand:
          this.nesting();
          break;
        case g.slash:
        case g.combinator:
          this.combinator();
          break;
        case g.str:
          this.string();
          break;
        case g.closeSquare:
          this.missingSquareBracket();
        case g.semicolon:
          this.missingBackslash();
        default:
          this.unexpected();
      }
    }, z.expected = function(_, N, ae) {
      if (Array.isArray(_)) {
        var W = _.pop();
        _ = _.join(", ") + " or " + W;
      }
      var fe = /^[aeiou]/.test(_[0]) ? "an" : "a";
      return ae ? this.error("Expected " + fe + " " + _ + ', found "' + ae + '" instead.', { index: N }) : this.error("Expected " + fe + " " + _ + ".", { index: N });
    }, z.requiredSpace = function(_) {
      return this.options.lossy ? " " : _;
    }, z.optionalSpace = function(_) {
      return this.options.lossy ? "" : _;
    }, z.lossySpace = function(_, N) {
      return this.options.lossy ? N ? " " : "" : _;
    }, z.parseParenthesisToken = function(_) {
      var N = this.content(_);
      return _[v.FIELDS.TYPE] === g.space ? this.requiredSpace(N) : N;
    }, z.newNode = function(_, N) {
      return N && (/^ +$/.test(N) && (this.options.lossy || (this.spaces = (this.spaces || "") + N), N = true), _.namespace = N, Y(_, "namespace")), this.spaces && (_.spaces.before = this.spaces, this.spaces = ""), this.current.append(_);
    }, z.content = function(_) {
      return _ === void 0 && (_ = this.currToken), this.css.slice(_[v.FIELDS.START_POS], _[v.FIELDS.END_POS]);
    }, z.locateNextMeaningfulToken = function(_) {
      _ === void 0 && (_ = this.position + 1);
      for (var N = _; N < this.tokens.length; )
        if (H[this.tokens[N][v.FIELDS.TYPE]]) {
          N++;
          continue;
        } else
          return N;
      return -1;
    }, U(B, [{ key: "currToken", get: function() {
      return this.tokens[this.position];
    } }, { key: "nextToken", get: function() {
      return this.tokens[this.position + 1];
    } }, { key: "prevToken", get: function() {
      return this.tokens[this.position - 1];
    } }]), B;
  }();
  e.default = ie, t.exports = e.default;
});
var Jv = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = n(Zv());
  function n(a) {
    return a && a.__esModule ? a : { default: a };
  }
  __name(n, "n");
  var i = function() {
    function a(u, s) {
      this.func = u || function() {
      }, this.funcRes = null, this.options = s;
    }
    __name(a, "a");
    var o = a.prototype;
    return o._shouldUpdateSelector = function(u, s) {
      s === void 0 && (s = {});
      var l = Object.assign({}, this.options, s);
      return l.updateSelector === false ? false : typeof u != "string";
    }, o._isLossy = function(u) {
      u === void 0 && (u = {});
      var s = Object.assign({}, this.options, u);
      return s.lossless === false;
    }, o._root = function(u, s) {
      s === void 0 && (s = {});
      var l = new r.default(u, this._parseOptions(s));
      return l.root;
    }, o._parseOptions = function(u) {
      return { lossy: this._isLossy(u) };
    }, o._run = function(u, s) {
      var l = this;
      return s === void 0 && (s = {}), new Promise(function(f, c) {
        try {
          var p = l._root(u, s);
          Promise.resolve(l.func(p)).then(function(d) {
            var D = void 0;
            return l._shouldUpdateSelector(u, s) && (D = p.toString(), u.selector = D), { transform: d, root: p, string: D };
          }).then(f, c);
        } catch (d) {
          c(d);
          return;
        }
      });
    }, o._runSync = function(u, s) {
      s === void 0 && (s = {});
      var l = this._root(u, s), f = this.func(l);
      if (f && typeof f.then == "function")
        throw new Error("Selector processor returned a promise to a synchronous call.");
      var c = void 0;
      return s.updateSelector && typeof u != "string" && (c = l.toString(), u.selector = c), { transform: f, root: l, string: c };
    }, o.ast = function(u, s) {
      return this._run(u, s).then(function(l) {
        return l.root;
      });
    }, o.astSync = function(u, s) {
      return this._runSync(u, s).root;
    }, o.transform = function(u, s) {
      return this._run(u, s).then(function(l) {
        return l.transform;
      });
    }, o.transformSync = function(u, s) {
      return this._runSync(u, s).transform;
    }, o.process = function(u, s) {
      return this._run(u, s).then(function(l) {
        return l.string || l.root.toString();
      });
    }, o.processSync = function(u, s) {
      var l = this._runSync(u, s);
      return l.string || l.root.toString();
    }, a;
  }();
  e.default = i, t.exports = e.default;
});
var Kv = le((e) => {
  "use strict";
  e.__esModule = true, e.universal = e.tag = e.string = e.selector = e.root = e.pseudo = e.nesting = e.id = e.comment = e.combinator = e.className = e.attribute = void 0;
  var t = d(Ku()), r = d(Hu()), n = d(el()), i = d(Xu()), a = d(qu()), o = d(tl()), u = d(Ju()), s = d(zu()), l = d(Vu()), f = d(Zu()), c = d(Yu()), p = d(Qu());
  function d(M) {
    return M && M.__esModule ? M : { default: M };
  }
  __name(d, "d");
  var D = /* @__PURE__ */ __name(function(M) {
    return new t.default(M);
  }, "D");
  e.attribute = D;
  var v = /* @__PURE__ */ __name(function(M) {
    return new r.default(M);
  }, "v");
  e.className = v;
  var g = /* @__PURE__ */ __name(function(M) {
    return new n.default(M);
  }, "g");
  e.combinator = g;
  var y = /* @__PURE__ */ __name(function(M) {
    return new i.default(M);
  }, "y");
  e.comment = y;
  var b = /* @__PURE__ */ __name(function(M) {
    return new a.default(M);
  }, "b");
  e.id = b;
  var C = /* @__PURE__ */ __name(function(M) {
    return new o.default(M);
  }, "C");
  e.nesting = C;
  var k = /* @__PURE__ */ __name(function(M) {
    return new u.default(M);
  }, "k");
  e.pseudo = k;
  var S = /* @__PURE__ */ __name(function(M) {
    return new s.default(M);
  }, "S");
  e.root = S;
  var E = /* @__PURE__ */ __name(function(M) {
    return new l.default(M);
  }, "E");
  e.selector = E;
  var L = /* @__PURE__ */ __name(function(M) {
    return new f.default(M);
  }, "L");
  e.string = L;
  var T = /* @__PURE__ */ __name(function(M) {
    return new c.default(M);
  }, "T");
  e.tag = T;
  var U = /* @__PURE__ */ __name(function(M) {
    return new p.default(M);
  }, "U");
  e.universal = U;
});
var Qv = le((e) => {
  "use strict";
  e.__esModule = true, e.isNode = i, e.isPseudoElement = b, e.isPseudoClass = C, e.isContainer = k, e.isNamespace = S, e.isUniversal = e.isTag = e.isString = e.isSelector = e.isRoot = e.isPseudo = e.isNesting = e.isIdentifier = e.isComment = e.isCombinator = e.isClassName = e.isAttribute = void 0;
  var t = ut(), r, n = (r = {}, r[t.ATTRIBUTE] = true, r[t.CLASS] = true, r[t.COMBINATOR] = true, r[t.COMMENT] = true, r[t.ID] = true, r[t.NESTING] = true, r[t.PSEUDO] = true, r[t.ROOT] = true, r[t.SELECTOR] = true, r[t.STRING] = true, r[t.TAG] = true, r[t.UNIVERSAL] = true, r);
  function i(E) {
    return typeof E == "object" && n[E.type];
  }
  __name(i, "i");
  function a(E, L) {
    return i(L) && L.type === E;
  }
  __name(a, "a");
  var o = a.bind(null, t.ATTRIBUTE);
  e.isAttribute = o;
  var u = a.bind(null, t.CLASS);
  e.isClassName = u;
  var s = a.bind(null, t.COMBINATOR);
  e.isCombinator = s;
  var l = a.bind(null, t.COMMENT);
  e.isComment = l;
  var f = a.bind(null, t.ID);
  e.isIdentifier = f;
  var c = a.bind(null, t.NESTING);
  e.isNesting = c;
  var p = a.bind(null, t.PSEUDO);
  e.isPseudo = p;
  var d = a.bind(null, t.ROOT);
  e.isRoot = d;
  var D = a.bind(null, t.SELECTOR);
  e.isSelector = D;
  var v = a.bind(null, t.STRING);
  e.isString = v;
  var g = a.bind(null, t.TAG);
  e.isTag = g;
  var y = a.bind(null, t.UNIVERSAL);
  e.isUniversal = y;
  function b(E) {
    return p(E) && E.value && (E.value.startsWith("::") || E.value.toLowerCase() === ":before" || E.value.toLowerCase() === ":after" || E.value.toLowerCase() === ":first-letter" || E.value.toLowerCase() === ":first-line");
  }
  __name(b, "b");
  function C(E) {
    return p(E) && !b(E);
  }
  __name(C, "C");
  function k(E) {
    return !!(i(E) && E.walk);
  }
  __name(k, "k");
  function S(E) {
    return o(E) || g(E);
  }
  __name(S, "S");
});
var eg = le((e) => {
  "use strict";
  e.__esModule = true;
  var t = ut();
  Object.keys(t).forEach(function(i) {
    i === "default" || i === "__esModule" || i in e && e[i] === t[i] || (e[i] = t[i]);
  });
  var r = Kv();
  Object.keys(r).forEach(function(i) {
    i === "default" || i === "__esModule" || i in e && e[i] === r[i] || (e[i] = r[i]);
  });
  var n = Qv();
  Object.keys(n).forEach(function(i) {
    i === "default" || i === "__esModule" || i in e && e[i] === n[i] || (e[i] = n[i]);
  });
});
var tg = le((e, t) => {
  "use strict";
  e.__esModule = true, e.default = void 0;
  var r = o(Jv()), n = a(eg());
  function i() {
    if (typeof WeakMap != "function")
      return null;
    var l = /* @__PURE__ */ new WeakMap();
    return i = /* @__PURE__ */ __name(function() {
      return l;
    }, "i"), l;
  }
  __name(i, "i");
  function a(l) {
    if (l && l.__esModule)
      return l;
    if (l === null || typeof l != "object" && typeof l != "function")
      return { default: l };
    var f = i();
    if (f && f.has(l))
      return f.get(l);
    var c = {}, p = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var d in l)
      if (Object.prototype.hasOwnProperty.call(l, d)) {
        var D = p ? Object.getOwnPropertyDescriptor(l, d) : null;
        D && (D.get || D.set) ? Object.defineProperty(c, d, D) : c[d] = l[d];
      }
    return c.default = l, f && f.set(l, c), c;
  }
  __name(a, "a");
  function o(l) {
    return l && l.__esModule ? l : { default: l };
  }
  __name(o, "o");
  var u = /* @__PURE__ */ __name(function(l) {
    return new r.default(l);
  }, "u");
  Object.assign(u, n), delete u.__esModule;
  var s = u;
  e.default = s, t.exports = e.default;
});
var rg = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: () => t });
  function t(r) {
    return r.replace(/\\,/g, "\\2c ");
  }
  __name(t, "t");
});
var ng = le((e, t) => {
  "use strict";
  t.exports = { aliceblue: [240, 248, 255], antiquewhite: [250, 235, 215], aqua: [0, 255, 255], aquamarine: [127, 255, 212], azure: [240, 255, 255], beige: [245, 245, 220], bisque: [255, 228, 196], black: [0, 0, 0], blanchedalmond: [255, 235, 205], blue: [0, 0, 255], blueviolet: [138, 43, 226], brown: [165, 42, 42], burlywood: [222, 184, 135], cadetblue: [95, 158, 160], chartreuse: [127, 255, 0], chocolate: [210, 105, 30], coral: [255, 127, 80], cornflowerblue: [100, 149, 237], cornsilk: [255, 248, 220], crimson: [220, 20, 60], cyan: [0, 255, 255], darkblue: [0, 0, 139], darkcyan: [0, 139, 139], darkgoldenrod: [184, 134, 11], darkgray: [169, 169, 169], darkgreen: [0, 100, 0], darkgrey: [169, 169, 169], darkkhaki: [189, 183, 107], darkmagenta: [139, 0, 139], darkolivegreen: [85, 107, 47], darkorange: [255, 140, 0], darkorchid: [153, 50, 204], darkred: [139, 0, 0], darksalmon: [233, 150, 122], darkseagreen: [143, 188, 143], darkslateblue: [72, 61, 139], darkslategray: [47, 79, 79], darkslategrey: [47, 79, 79], darkturquoise: [0, 206, 209], darkviolet: [148, 0, 211], deeppink: [255, 20, 147], deepskyblue: [0, 191, 255], dimgray: [105, 105, 105], dimgrey: [105, 105, 105], dodgerblue: [30, 144, 255], firebrick: [178, 34, 34], floralwhite: [255, 250, 240], forestgreen: [34, 139, 34], fuchsia: [255, 0, 255], gainsboro: [220, 220, 220], ghostwhite: [248, 248, 255], gold: [255, 215, 0], goldenrod: [218, 165, 32], gray: [128, 128, 128], green: [0, 128, 0], greenyellow: [173, 255, 47], grey: [128, 128, 128], honeydew: [240, 255, 240], hotpink: [255, 105, 180], indianred: [205, 92, 92], indigo: [75, 0, 130], ivory: [255, 255, 240], khaki: [240, 230, 140], lavender: [230, 230, 250], lavenderblush: [255, 240, 245], lawngreen: [124, 252, 0], lemonchiffon: [255, 250, 205], lightblue: [173, 216, 230], lightcoral: [240, 128, 128], lightcyan: [224, 255, 255], lightgoldenrodyellow: [250, 250, 210], lightgray: [211, 211, 211], lightgreen: [144, 238, 144], lightgrey: [211, 211, 211], lightpink: [255, 182, 193], lightsalmon: [255, 160, 122], lightseagreen: [32, 178, 170], lightskyblue: [135, 206, 250], lightslategray: [119, 136, 153], lightslategrey: [119, 136, 153], lightsteelblue: [176, 196, 222], lightyellow: [255, 255, 224], lime: [0, 255, 0], limegreen: [50, 205, 50], linen: [250, 240, 230], magenta: [255, 0, 255], maroon: [128, 0, 0], mediumaquamarine: [102, 205, 170], mediumblue: [0, 0, 205], mediumorchid: [186, 85, 211], mediumpurple: [147, 112, 219], mediumseagreen: [60, 179, 113], mediumslateblue: [123, 104, 238], mediumspringgreen: [0, 250, 154], mediumturquoise: [72, 209, 204], mediumvioletred: [199, 21, 133], midnightblue: [25, 25, 112], mintcream: [245, 255, 250], mistyrose: [255, 228, 225], moccasin: [255, 228, 181], navajowhite: [255, 222, 173], navy: [0, 0, 128], oldlace: [253, 245, 230], olive: [128, 128, 0], olivedrab: [107, 142, 35], orange: [255, 165, 0], orangered: [255, 69, 0], orchid: [218, 112, 214], palegoldenrod: [238, 232, 170], palegreen: [152, 251, 152], paleturquoise: [175, 238, 238], palevioletred: [219, 112, 147], papayawhip: [255, 239, 213], peachpuff: [255, 218, 185], peru: [205, 133, 63], pink: [255, 192, 203], plum: [221, 160, 221], powderblue: [176, 224, 230], purple: [128, 0, 128], rebeccapurple: [102, 51, 153], red: [255, 0, 0], rosybrown: [188, 143, 143], royalblue: [65, 105, 225], saddlebrown: [139, 69, 19], salmon: [250, 128, 114], sandybrown: [244, 164, 96], seagreen: [46, 139, 87], seashell: [255, 245, 238], sienna: [160, 82, 45], silver: [192, 192, 192], skyblue: [135, 206, 235], slateblue: [106, 90, 205], slategray: [112, 128, 144], slategrey: [112, 128, 144], snow: [255, 250, 250], springgreen: [0, 255, 127], steelblue: [70, 130, 180], tan: [210, 180, 140], teal: [0, 128, 128], thistle: [216, 191, 216], tomato: [255, 99, 71], turquoise: [64, 224, 208], violet: [238, 130, 238], wheat: [245, 222, 179], white: [255, 255, 255], whitesmoke: [245, 245, 245], yellow: [255, 255, 0], yellowgreen: [154, 205, 50] };
});
var nl = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true });
  function t(D, v) {
    for (var g in v)
      Object.defineProperty(D, g, { enumerable: true, get: v[g] });
  }
  __name(t, "t");
  t(e, { parseColor: () => p, formatColor: () => d });
  var r = n(ng());
  function n(D) {
    return D && D.__esModule ? D : { default: D };
  }
  __name(n, "n");
  var i = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i, a = /^#([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i, o = /(?:\d+|\d*\.\d+)%?/, u = /(?:\s*,\s*|\s+)/, s = /\s*[,/]\s*/, l = /var\(--(?:[^ )]*?)\)/, f = new RegExp(`^(rgb)a?\\(\\s*(${o.source}|${l.source})(?:${u.source}(${o.source}|${l.source}))?(?:${u.source}(${o.source}|${l.source}))?(?:${s.source}(${o.source}|${l.source}))?\\s*\\)$`), c = new RegExp(`^(hsl)a?\\(\\s*((?:${o.source})(?:deg|rad|grad|turn)?|${l.source})(?:${u.source}(${o.source}|${l.source}))?(?:${u.source}(${o.source}|${l.source}))?(?:${s.source}(${o.source}|${l.source}))?\\s*\\)$`);
  function p(D, { loose: v = false } = {}) {
    var g, y;
    if (typeof D != "string")
      return null;
    if (D = D.trim(), D === "transparent")
      return { mode: "rgb", color: ["0", "0", "0"], alpha: "0" };
    if (D in r.default)
      return { mode: "rgb", color: r.default[D].map((E) => E.toString()) };
    let b = D.replace(a, (E, L, T, U, M) => ["#", L, L, T, T, U, U, M ? M + M : ""].join("")).match(i);
    if (b !== null)
      return { mode: "rgb", color: [parseInt(b[1], 16), parseInt(b[2], 16), parseInt(b[3], 16)].map((E) => E.toString()), alpha: b[4] ? (parseInt(b[4], 16) / 255).toString() : void 0 };
    var C;
    let k = (C = D.match(f)) !== null && C !== void 0 ? C : D.match(c);
    if (k === null)
      return null;
    let S = [k[2], k[3], k[4]].filter(Boolean).map((E) => E.toString());
    return !v && S.length !== 3 || S.length < 3 && !S.some((E) => /^var\(.*?\)$/.test(E)) ? null : { mode: k[1], color: S, alpha: (g = k[5]) === null || g === void 0 || (y = g.toString) === null || y === void 0 ? void 0 : y.call(g) };
  }
  __name(p, "p");
  function d({ mode: D, color: v, alpha: g }) {
    let y = g !== void 0;
    return `${D}(${v.join(" ")}${y ? ` / ${g}` : ""})`;
  }
  __name(d, "d");
});
var il = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true });
  function t(a, o) {
    for (var u in o)
      Object.defineProperty(a, u, { enumerable: true, get: o[u] });
  }
  __name(t, "t");
  t(e, { withAlphaValue: () => n, default: () => i });
  var r = nl();
  function n(a, o, u) {
    if (typeof a == "function")
      return a({ opacityValue: o });
    let s = (0, r.parseColor)(a, { loose: true });
    return s === null ? u : (0, r.formatColor)({ ...s, alpha: o });
  }
  __name(n, "n");
  function i({ color: a, property: o, variable: u }) {
    let s = [].concat(o);
    if (typeof a == "function")
      return { [u]: "1", ...Object.fromEntries(s.map((f) => [f, a({ opacityVariable: u, opacityValue: `var(${u})` })])) };
    let l = (0, r.parseColor)(a);
    return l === null ? Object.fromEntries(s.map((f) => [f, a])) : l.alpha !== void 0 ? Object.fromEntries(s.map((f) => [f, a])) : { [u]: "1", ...Object.fromEntries(s.map((f) => [f, (0, r.formatColor)({ ...l, alpha: `var(${u})` })])) };
  }
  __name(i, "i");
});
var ig = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true });
  function t(p, d) {
    for (var D in d)
      Object.defineProperty(p, D, { enumerable: true, get: d[D] });
  }
  __name(t, "t");
  t(e, { pattern: () => a, withoutCapturing: () => o, any: () => u, optional: () => s, zeroOrMore: () => l, nestedBrackets: () => f, escape: () => c });
  var r = /[\\^$.*+?()[\]{}|]/g, n = RegExp(r.source);
  function i(p) {
    return p = Array.isArray(p) ? p : [p], p = p.map((d) => d instanceof RegExp ? d.source : d), p.join("");
  }
  __name(i, "i");
  function a(p) {
    return new RegExp(i(p), "g");
  }
  __name(a, "a");
  function o(p) {
    return new RegExp(`(?:${i(p)})`, "g");
  }
  __name(o, "o");
  function u(p) {
    return `(?:${p.map(i).join("|")})`;
  }
  __name(u, "u");
  function s(p) {
    return `(?:${i(p)})?`;
  }
  __name(s, "s");
  function l(p) {
    return `(?:${i(p)})*`;
  }
  __name(l, "l");
  function f(p, d, D = 1) {
    return o([c(p), /[^\s]*/, D === 1 ? `[^${c(p)}${c(d)}s]*` : u([`[^${c(p)}${c(d)}s]*`, f(p, d, D - 1)]), /[^\s]*/, c(d)]);
  }
  __name(f, "f");
  function c(p) {
    return p && n.test(p) ? p.replace(r, "\\$&") : p || "";
  }
  __name(c, "c");
});
var ag = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "splitAtTopLevelOnly", { enumerable: true, get: () => i });
  var t = n(ig());
  function r(a) {
    if (typeof WeakMap != "function")
      return null;
    var o = /* @__PURE__ */ new WeakMap(), u = /* @__PURE__ */ new WeakMap();
    return (r = /* @__PURE__ */ __name(function(s) {
      return s ? u : o;
    }, "r"))(a);
  }
  __name(r, "r");
  function n(a, o) {
    if (!o && a && a.__esModule)
      return a;
    if (a === null || typeof a != "object" && typeof a != "function")
      return { default: a };
    var u = r(o);
    if (u && u.has(a))
      return u.get(a);
    var s = {}, l = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var f in a)
      if (f !== "default" && Object.prototype.hasOwnProperty.call(a, f)) {
        var c = l ? Object.getOwnPropertyDescriptor(a, f) : null;
        c && (c.get || c.set) ? Object.defineProperty(s, f, c) : s[f] = a[f];
      }
    return s.default = a, u && u.set(a, s), s;
  }
  __name(n, "n");
  function* i(a, o) {
    let u = new RegExp(`[(){}\\[\\]${t.escape(o)}]`, "g"), s = 0, l = 0, f = false, c = 0, p = 0, d = o.length;
    for (let D of a.matchAll(u)) {
      let v = D[0] === o[c], g = c === d - 1, y = v && g;
      D[0] === "(" && s++, D[0] === ")" && s--, D[0] === "[" && s++, D[0] === "]" && s--, D[0] === "{" && s++, D[0] === "}" && s--, v && s === 0 && (p === 0 && (p = D.index), c++), y && s === 0 && (f = true, yield a.substring(l, p), l = p + d), c === d && (c = 0, p = 0);
    }
    f ? yield a.substring(l) : yield a;
  }
  __name(i, "i");
});
var og = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true });
  function t(s, l) {
    for (var f in l)
      Object.defineProperty(s, f, { enumerable: true, get: l[f] });
  }
  __name(t, "t");
  t(e, { parseBoxShadowValue: () => o, formatBoxShadowValue: () => u });
  var r = ag(), n = /* @__PURE__ */ new Set(["inset", "inherit", "initial", "revert", "unset"]), i = /\ +(?![^(]*\))/g, a = /^-?(\d+|\.\d+)(.*?)$/g;
  function o(s) {
    return Array.from((0, r.splitAtTopLevelOnly)(s, ",")).map((l) => {
      let f = l.trim(), c = { raw: f }, p = f.split(i), d = /* @__PURE__ */ new Set();
      for (let D of p)
        a.lastIndex = 0, !d.has("KEYWORD") && n.has(D) ? (c.keyword = D, d.add("KEYWORD")) : a.test(D) ? d.has("X") ? d.has("Y") ? d.has("BLUR") ? d.has("SPREAD") || (c.spread = D, d.add("SPREAD")) : (c.blur = D, d.add("BLUR")) : (c.y = D, d.add("Y")) : (c.x = D, d.add("X")) : c.color ? (c.unknown || (c.unknown = []), c.unknown.push(D)) : c.color = D;
      return c.valid = c.x !== void 0 && c.y !== void 0, c;
    });
  }
  __name(o, "o");
  function u(s) {
    return s.map((l) => l.valid ? [l.keyword, l.x, l.y, l.blur, l.spread, l.color].filter(Boolean).join(" ") : l.raw).join(", ");
  }
  __name(u, "u");
});
var sg = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true });
  function t(A, R) {
    for (var O in R)
      Object.defineProperty(A, O, { enumerable: true, get: R[O] });
  }
  __name(t, "t");
  t(e, { normalize: () => u, url: () => s, number: () => l, percentage: () => f, length: () => d, lineWidth: () => v, shadow: () => g, color: () => y, image: () => b, gradient: () => k, position: () => E, familyName: () => L, genericName: () => U, absoluteSize: () => H, relativeSize: () => ee });
  var r = nl(), n = og(), i = ["min", "max", "clamp", "calc"], a = /,(?![^(]*\))/g, o = /_(?![^(]*\))/g;
  function u(A, R = true) {
    return A.includes("url(") ? A.split(/(url\(.*?\))/g).filter(Boolean).map((O) => /^url\(.*?\)$/.test(O) ? O : u(O, false)).join("") : (A = A.replace(/([^\\])_+/g, (O, Y) => Y + " ".repeat(O.length - 1)).replace(/^_/g, " ").replace(/\\_/g, "_"), R && (A = A.trim()), A = A.replace(/(calc|min|max|clamp)\(.+\)/g, (O) => O.replace(/(-?\d*\.?\d(?!\b-.+[,)](?![^+\-/*])\D)(?:%|[a-z]+)?|\))([+\-/*])/g, "$1 $2 ")), A);
  }
  __name(u, "u");
  function s(A) {
    return A.startsWith("url(");
  }
  __name(s, "s");
  function l(A) {
    return !isNaN(Number(A)) || i.some((R) => new RegExp(`^${R}\\(.+?`).test(A));
  }
  __name(l, "l");
  function f(A) {
    return A.split(o).every((R) => /%$/g.test(R) || i.some((O) => new RegExp(`^${O}\\(.+?%`).test(R)));
  }
  __name(f, "f");
  var c = ["cm", "mm", "Q", "in", "pc", "pt", "px", "em", "ex", "ch", "rem", "lh", "vw", "vh", "vmin", "vmax"], p = `(?:${c.join("|")})`;
  function d(A) {
    return A.split(o).every((R) => R === "0" || new RegExp(`${p}$`).test(R) || i.some((O) => new RegExp(`^${O}\\(.+?${p}`).test(R)));
  }
  __name(d, "d");
  var D = /* @__PURE__ */ new Set(["thin", "medium", "thick"]);
  function v(A) {
    return D.has(A);
  }
  __name(v, "v");
  function g(A) {
    let R = (0, n.parseBoxShadowValue)(u(A));
    for (let O of R)
      if (!O.valid)
        return false;
    return true;
  }
  __name(g, "g");
  function y(A) {
    let R = 0;
    return A.split(o).every((O) => (O = u(O), O.startsWith("var(") ? true : (0, r.parseColor)(O, { loose: true }) !== null ? (R++, true) : false)) ? R > 0 : false;
  }
  __name(y, "y");
  function b(A) {
    let R = 0;
    return A.split(a).every((O) => (O = u(O), O.startsWith("var(") ? true : s(O) || k(O) || ["element(", "image(", "cross-fade(", "image-set("].some((Y) => O.startsWith(Y)) ? (R++, true) : false)) ? R > 0 : false;
  }
  __name(b, "b");
  var C = /* @__PURE__ */ new Set(["linear-gradient", "radial-gradient", "repeating-linear-gradient", "repeating-radial-gradient", "conic-gradient"]);
  function k(A) {
    A = u(A);
    for (let R of C)
      if (A.startsWith(`${R}(`))
        return true;
    return false;
  }
  __name(k, "k");
  var S = /* @__PURE__ */ new Set(["center", "top", "right", "bottom", "left"]);
  function E(A) {
    let R = 0;
    return A.split(o).every((O) => (O = u(O), O.startsWith("var(") ? true : S.has(O) || d(O) || f(O) ? (R++, true) : false)) ? R > 0 : false;
  }
  __name(E, "E");
  function L(A) {
    let R = 0;
    return A.split(a).every((O) => (O = u(O), O.startsWith("var(") ? true : O.includes(" ") && !/(['"])([^"']+)\1/g.test(O) || /^\d/g.test(O) ? false : (R++, true))) ? R > 0 : false;
  }
  __name(L, "L");
  var T = /* @__PURE__ */ new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded", "math", "emoji", "fangsong"]);
  function U(A) {
    return T.has(A);
  }
  __name(U, "U");
  var M = /* @__PURE__ */ new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "x-large", "xxx-large"]);
  function H(A) {
    return M.has(A);
  }
  __name(H, "H");
  var q = /* @__PURE__ */ new Set(["larger", "smaller"]);
  function ee(A) {
    return q.has(A);
  }
  __name(ee, "ee");
});
var ug = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true });
  function t(E, L) {
    for (var T in L)
      Object.defineProperty(E, T, { enumerable: true, get: L[T] });
  }
  __name(t, "t");
  t(e, { updateAllClasses: () => s, asValue: () => c, parseColorFormat: () => D, asColor: () => v, asLookupValue: () => g, coerceValue: () => S });
  var r = u(tg()), n = u(rg()), i = il(), a = sg(), o = u(Gu());
  function u(E) {
    return E && E.__esModule ? E : { default: E };
  }
  __name(u, "u");
  function s(E, L) {
    return (0, r.default)((T) => {
      T.walkClasses((U) => {
        let M = L(U.value);
        U.value = M, U.raws && U.raws.value && (U.raws.value = (0, n.default)(U.raws.value));
      });
    }).processSync(E);
  }
  __name(s, "s");
  function l(E, L) {
    if (!p(E))
      return;
    let T = E.slice(1, -1);
    if (L(T))
      return (0, a.normalize)(T);
  }
  __name(l, "l");
  function f(E, L = {}, T) {
    let U = L[E];
    if (U !== void 0)
      return (0, o.default)(U);
    if (p(E)) {
      let M = l(E, T);
      return M === void 0 ? void 0 : (0, o.default)(M);
    }
  }
  __name(f, "f");
  function c(E, L = {}, { validate: T = /* @__PURE__ */ __name(() => true, "T") } = {}) {
    var U;
    let M = (U = L.values) === null || U === void 0 ? void 0 : U[E];
    return M !== void 0 ? M : L.supportsNegativeValues && E.startsWith("-") ? f(E.slice(1), L.values, T) : l(E, T);
  }
  __name(c, "c");
  function p(E) {
    return E.startsWith("[") && E.endsWith("]");
  }
  __name(p, "p");
  function d(E) {
    let L = E.lastIndexOf("/");
    return L === -1 || L === E.length - 1 ? [E] : [E.slice(0, L), E.slice(L + 1)];
  }
  __name(d, "d");
  function D(E) {
    if (typeof E == "string" && E.includes("<alpha-value>")) {
      let L = E;
      return ({ opacityValue: T = 1 }) => L.replace("<alpha-value>", T);
    }
    return E;
  }
  __name(D, "D");
  function v(E, L = {}, { tailwindConfig: T = {} } = {}) {
    var U;
    if (((U = L.values) === null || U === void 0 ? void 0 : U[E]) !== void 0) {
      var M;
      return D((M = L.values) === null || M === void 0 ? void 0 : M[E]);
    }
    let [H, q] = d(E);
    if (q !== void 0) {
      var ee, A, R, O;
      let Y = (O = (ee = L.values) === null || ee === void 0 ? void 0 : ee[H]) !== null && O !== void 0 ? O : p(H) ? H.slice(1, -1) : void 0;
      return Y === void 0 ? void 0 : (Y = D(Y), p(q) ? (0, i.withAlphaValue)(Y, q.slice(1, -1)) : ((A = T.theme) === null || A === void 0 || (R = A.opacity) === null || R === void 0 ? void 0 : R[q]) === void 0 ? void 0 : (0, i.withAlphaValue)(Y, T.theme.opacity[q]));
    }
    return c(E, L, { validate: a.color });
  }
  __name(v, "v");
  function g(E, L = {}) {
    var T;
    return (T = L.values) === null || T === void 0 ? void 0 : T[E];
  }
  __name(g, "g");
  function y(E) {
    return (L, T) => c(L, T, { validate: E });
  }
  __name(y, "y");
  var b = { any: c, color: v, url: y(a.url), image: y(a.image), length: y(a.length), percentage: y(a.percentage), position: y(a.position), lookup: g, "generic-name": y(a.genericName), "family-name": y(a.familyName), number: y(a.number), "line-width": y(a.lineWidth), "absolute-size": y(a.absoluteSize), "relative-size": y(a.relativeSize), shadow: y(a.shadow) }, C = Object.keys(b);
  function k(E, L) {
    let T = E.indexOf(L);
    return T === -1 ? [void 0, E] : [E.slice(0, T), E.slice(T + 1)];
  }
  __name(k, "k");
  function S(E, L, T, U) {
    if (p(L)) {
      let M = L.slice(1, -1), [H, q] = k(M, ":");
      if (!/^[\w-_]+$/g.test(H))
        q = M;
      else if (H !== void 0 && !C.includes(H))
        return [];
      if (q.length > 0 && C.includes(H))
        return [c(`[${q}]`, T), H];
    }
    for (let M of [].concat(E)) {
      let H = b[M](L, T, { tailwindConfig: U });
      if (H !== void 0)
        return [H, M];
    }
    return [];
  }
  __name(S, "S");
});
var lg = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: () => t });
  function t(r) {
    return typeof r == "function" ? r({}) : r;
  }
  __name(t, "t");
});
var fg = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: () => ee });
  var t = D(Gu()), r = D(Uv()), n = D(Bv()), i = D(Wu()), a = D(Nv()), o = Mv(), u = Gv(), s = Wv(), l = D($v()), f = jv(), c = ug(), p = il(), d = D(lg());
  function D(A) {
    return A && A.__esModule ? A : { default: A };
  }
  __name(D, "D");
  function v(A) {
    return typeof A == "function";
  }
  __name(v, "v");
  function g(A) {
    return typeof A == "object" && A !== null;
  }
  __name(g, "g");
  function y(A, ...R) {
    let O = R.pop();
    for (let Y of R)
      for (let Z in Y) {
        let te = O(A[Z], Y[Z]);
        te === void 0 ? g(A[Z]) && g(Y[Z]) ? A[Z] = y(A[Z], Y[Z], O) : A[Z] = Y[Z] : A[Z] = te;
      }
    return A;
  }
  __name(y, "y");
  var b = { colors: a.default, negative(A) {
    return Object.keys(A).filter((R) => A[R] !== "0").reduce((R, O) => {
      let Y = (0, t.default)(A[O]);
      return Y !== void 0 && (R[`-${O}`] = Y), R;
    }, {});
  }, breakpoints(A) {
    return Object.keys(A).filter((R) => typeof A[R] == "string").reduce((R, O) => ({ ...R, [`screen-${O}`]: A[O] }), {});
  } };
  function C(A, ...R) {
    return v(A) ? A(...R) : A;
  }
  __name(C, "C");
  function k(A) {
    return A.reduce((R, { extend: O }) => y(R, O, (Y, Z) => Y === void 0 ? [Z] : Array.isArray(Y) ? [Z, ...Y] : [Z, Y]), {});
  }
  __name(k, "k");
  function S(A) {
    return { ...A.reduce((R, O) => (0, o.defaults)(R, O), {}), extend: k(A) };
  }
  __name(S, "S");
  function E(A, R) {
    if (Array.isArray(A) && g(A[0]))
      return A.concat(R);
    if (Array.isArray(R) && g(R[0]) && g(A))
      return [A, ...R];
    if (Array.isArray(R))
      return R;
  }
  __name(E, "E");
  function L({ extend: A, ...R }) {
    return y(R, A, (O, Y) => !v(O) && !Y.some(v) ? y({}, O, ...Y, E) : (Z, te) => y({}, ...[O, ...Y].map((ie) => C(ie, Z, te)), E));
  }
  __name(L, "L");
  function* T(A) {
    let R = (0, u.toPath)(A);
    if (R.length === 0 || (yield R, Array.isArray(A)))
      return;
    let O = /^(.*?)\s*\/\s*([^/]+)$/, Y = A.match(O);
    if (Y !== null) {
      let [, Z, te] = Y, ie = (0, u.toPath)(Z);
      ie.alpha = te, yield ie;
    }
  }
  __name(T, "T");
  function U(A) {
    let R = /* @__PURE__ */ __name((O, Y) => {
      for (let Z of T(O)) {
        let te = 0, ie = A;
        for (; ie != null && te < Z.length; )
          ie = ie[Z[te++]], ie = v(ie) && (Z.alpha === void 0 || te <= Z.length - 1) ? ie(R, b) : ie;
        if (ie !== void 0) {
          if (Z.alpha !== void 0) {
            let B = (0, c.parseColorFormat)(ie);
            return (0, p.withAlphaValue)(B, Z.alpha, (0, d.default)(B));
          }
          return (0, l.default)(ie) ? (0, f.cloneDeep)(ie) : ie;
        }
      }
      return Y;
    }, "R");
    return Object.assign(R, { theme: R, ...b }), Object.keys(A).reduce((O, Y) => (O[Y] = v(A[Y]) ? A[Y](R, b) : A[Y], O), {});
  }
  __name(U, "U");
  function M(A) {
    let R = [];
    return A.forEach((O) => {
      R = [...R, O];
      var Y;
      let Z = (Y = O?.plugins) !== null && Y !== void 0 ? Y : [];
      Z.length !== 0 && Z.forEach((te) => {
        te.__isOptionsFunction && (te = te());
        var ie;
        R = [...R, ...M([(ie = te?.config) !== null && ie !== void 0 ? ie : {}])];
      });
    }), R;
  }
  __name(M, "M");
  function H(A) {
    return [...A].reduceRight((R, O) => v(O) ? O({ corePlugins: R }) : (0, n.default)(O, R), r.default);
  }
  __name(H, "H");
  function q(A) {
    return [...A].reduceRight((R, O) => [...R, ...O], []);
  }
  __name(q, "q");
  function ee(A) {
    let R = [...M(A), { prefix: "", important: false, separator: ":", variantOrder: i.default.variantOrder }];
    var O, Y;
    return (0, s.normalizeConfig)((0, o.defaults)({ theme: U(L(S(R.map((Z) => (O = Z?.theme) !== null && O !== void 0 ? O : {})))), corePlugins: H(R.map((Z) => Z.corePlugins)), plugins: q(A.map((Z) => (Y = Z?.plugins) !== null && Y !== void 0 ? Y : [])) }, ...R));
  }
  __name(ee, "ee");
});
var al = {};
Aa(al, { default: () => ol });
var ol;
var cg = _a(() => {
  ol = { yellow: (e) => e };
});
var pg = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true });
  function t(c, p) {
    for (var d in p)
      Object.defineProperty(c, d, { enumerable: true, get: p[d] });
  }
  __name(t, "t");
  t(e, { flagEnabled: () => u, issueFlagNotices: () => l, default: () => f });
  var r = i((cg(), Xn(al))), n = i((Oa(), Xn(Zn)));
  function i(c) {
    return c && c.__esModule ? c : { default: c };
  }
  __name(i, "i");
  var a = { optimizeUniversalDefaults: false }, o = { future: ["hoverOnlyWhenSupported", "respectDefaultRingColorOpacity"], experimental: ["optimizeUniversalDefaults", "matchVariant"] };
  function u(c, p) {
    if (o.future.includes(p)) {
      var d, D, v;
      return c.future === "all" || ((v = (D = c == null || (d = c.future) === null || d === void 0 ? void 0 : d[p]) !== null && D !== void 0 ? D : a[p]) !== null && v !== void 0 ? v : false);
    }
    if (o.experimental.includes(p)) {
      var g, y, b;
      return c.experimental === "all" || ((b = (y = c == null || (g = c.experimental) === null || g === void 0 ? void 0 : g[p]) !== null && y !== void 0 ? y : a[p]) !== null && b !== void 0 ? b : false);
    }
    return false;
  }
  __name(u, "u");
  function s(c) {
    if (c.experimental === "all")
      return o.experimental;
    var p;
    return Object.keys((p = c?.experimental) !== null && p !== void 0 ? p : {}).filter((d) => o.experimental.includes(d) && c.experimental[d]);
  }
  __name(s, "s");
  function l(c) {
    if (process.env.JEST_WORKER_ID === void 0 && s(c).length > 0) {
      let p = s(c).map((d) => r.default.yellow(d)).join(", ");
      n.default.warn("experimental-flags-enabled", [`You have enabled experimental features: ${p}`, "Experimental features in Tailwind CSS are not covered by semver, may introduce breaking changes, and can change at any time."]);
    }
  }
  __name(l, "l");
  var f = o;
});
var hg = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: () => i });
  var t = n(Wu()), r = pg();
  function n(a) {
    return a && a.__esModule ? a : { default: a };
  }
  __name(n, "n");
  function i(a) {
    var o;
    let u = ((o = a?.presets) !== null && o !== void 0 ? o : [t.default]).slice().reverse().flatMap((f) => i(typeof f == "function" ? f() : f)), s = { respectDefaultRingColorOpacity: { theme: { ringColor: { DEFAULT: "#3b82f67f" } } } }, l = Object.keys(s).filter((f) => (0, r.flagEnabled)(a, f)).map((f) => s[f]);
    return [a, ...l, ...u];
  }
  __name(i, "i");
});
var dg = le((e) => {
  "use strict";
  Object.defineProperty(e, "__esModule", { value: true }), Object.defineProperty(e, "default", { enumerable: true, get: () => i });
  var t = n(fg()), r = n(hg());
  function n(a) {
    return a && a.__esModule ? a : { default: a };
  }
  __name(n, "n");
  function i(...a) {
    let [, ...o] = (0, r.default)(a[0]);
    return (0, t.default)([...a, ...o]);
  }
  __name(i, "i");
});
var vg = le((e, t) => {
  var r = dg();
  t.exports = (r.__esModule ? r : { default: r }).default;
});
var Qr;
function sl(e) {
  Qr = e;
}
__name(sl, "sl");
var qr = null;
async function Kn() {
  return Qr || (qr ? (await qr, Qr) : (qr = Promise.resolve().then(() => (Rv(), Mu)).then((e) => e.getYogaModule()).then((e) => Qr = e), await qr, qr = null, Qr));
}
__name(Kn, "Kn");
var nn = /* @__PURE__ */ __name((e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), "nn");
var gg = nn((e, t) => {
  t.exports = ["em", "ex", "ch", "rem", "vh", "vw", "vmin", "vmax", "px", "mm", "cm", "in", "pt", "pc", "mozmm"];
});
var mg = nn((e, t) => {
  t.exports = ["deg", "grad", "rad", "turn"];
});
var Dg = nn((e, t) => {
  t.exports = ["dpi", "dpcm", "dppx"];
});
var yg = nn((e, t) => {
  t.exports = ["Hz", "kHz"];
});
var bg = nn((e, t) => {
  t.exports = ["s", "ms"];
});
var xg = gg();
var ul = mg();
var ll = Dg();
var fl = yg();
var cl = bg();
function Ra(e) {
  if (/\.\D?$/.test(e))
    throw new Error("The dot should be followed by a number");
  if (/^[+-]{2}/.test(e))
    throw new Error("Only one leading +/- is allowed");
  if (wg(e) > 1)
    throw new Error("Only one dot is allowed");
  if (/%$/.test(e)) {
    this.type = "percentage", this.value = fa(e), this.unit = "%";
    return;
  }
  var t = Fg(e);
  if (!t) {
    this.type = "number", this.value = fa(e);
    return;
  }
  this.type = Sg(t), this.value = fa(e.substr(0, e.length - t.length)), this.unit = t;
}
__name(Ra, "Ra");
Ra.prototype.valueOf = function() {
  return this.value;
};
Ra.prototype.toString = function() {
  return this.value + (this.unit || "");
};
function Qn(e) {
  return new Ra(e);
}
__name(Qn, "Qn");
function wg(e) {
  var t = e.match(/\./g);
  return t ? t.length : 0;
}
__name(wg, "wg");
function fa(e) {
  var t = parseFloat(e);
  if (isNaN(t))
    throw new Error("Invalid number: " + e);
  return t;
}
__name(fa, "fa");
var Eg = [].concat(ul, fl, xg, ll, cl);
function Fg(e) {
  var t = e.match(/\D+$/), r = t && t[0];
  if (r && Eg.indexOf(r) === -1)
    throw new Error("Invalid unit: " + r);
  return r;
}
__name(Fg, "Fg");
var Cg = Object.assign(In(ul, "angle"), In(fl, "frequency"), In(ll, "resolution"), In(cl, "time"));
function In(e, t) {
  return Object.fromEntries(e.map((r) => [r, t]));
}
__name(In, "In");
function Sg(e) {
  return Cg[e] || "length";
}
__name(Sg, "Sg");
function jn(e) {
  let t = typeof e;
  return !(t === "number" || t === "bigint" || t === "string" || t === "boolean");
}
__name(jn, "jn");
function kg(e) {
  return /^class\s/.test(e.toString());
}
__name(kg, "kg");
function Tg(e) {
  return "dangerouslySetInnerHTML" in e;
}
__name(Tg, "Tg");
function _g(e) {
  let t = typeof e > "u" ? [] : [].concat(e).flat(1 / 0), r = [];
  for (let n = 0; n < t.length; n++) {
    let i = t[n];
    typeof i > "u" || typeof i == "boolean" || i === null || (typeof i == "number" && (i = String(i)), typeof i == "string" && r.length && typeof r[r.length - 1] == "string" ? r[r.length - 1] += i : r.push(i));
  }
  return r;
}
__name(_g, "_g");
function Ie(e, t, r, n, i = false) {
  if (typeof e == "number")
    return e;
  try {
    if (e = e.trim(), /[ /\(,]/.test(e))
      return;
    if (e === String(+e))
      return +e;
    let a = new Qn(e);
    if (a.type === "length")
      switch (a.unit) {
        case "em":
          return a.value * t;
        case "rem":
          return a.value * 16;
        case "vw":
          return ~~(a.value * n._viewportWidth / 100);
        case "vh":
          return ~~(a.value * n._viewportHeight / 100);
        default:
          return a.value;
      }
    else if (a.type === "angle")
      switch (a.unit) {
        case "deg":
          return a.value;
        case "rad":
          return a.value * 180 / Math.PI;
        default:
          return a.value;
      }
    else if (a.type === "percentage" && i)
      return a.value / 100 * r;
  } catch {
  }
}
__name(Ie, "Ie");
function zn(e, t) {
  return [e[0] * t[0] + e[2] * t[1], e[1] * t[0] + e[3] * t[1], e[0] * t[2] + e[2] * t[3], e[1] * t[2] + e[3] * t[3], e[0] * t[4] + e[2] * t[5] + e[4], e[1] * t[4] + e[3] * t[5] + e[5]];
}
__name(zn, "zn");
function Lt(e, t, r, n) {
  let i = t[e];
  if (typeof i > "u") {
    if (n && typeof e < "u")
      throw new Error(`Invalid value for CSS property "${n}". Allowed values: ${Object.keys(t).map((a) => `"${a}"`).join(" | ")}. Received: "${e}".`);
    i = r;
  }
  return i;
}
__name(Lt, "Lt");
var ca;
var pa;
var Ag = [32, 160, 4961, 65792, 65793, 4153, 4241, 10].map((e) => String.fromCodePoint(e));
function Pt(e, t, r) {
  if (!ca || !pa) {
    if (!(typeof Intl < "u" && "Segmenter" in Intl))
      throw new Error("Intl.Segmenter does not exist, please use import a polyfill.");
    ca = new Intl.Segmenter(r, { granularity: "word" }), pa = new Intl.Segmenter(r, { granularity: "grapheme" });
  }
  if (t === "grapheme")
    return [...pa.segment(e)].map((n) => n.segment);
  {
    let n = [...ca.segment(e)].map((o) => o.segment), i = [], a = 0;
    for (; a < n.length; ) {
      let o = n[a];
      if (o == "\xA0") {
        let u = a === 0 ? "" : i.pop(), s = a === n.length - 1 ? "" : n[a + 1];
        i.push(u + "\xA0" + s), a += 2;
      } else
        i.push(o), a++;
    }
    return i;
  }
}
__name(Pt, "Pt");
function ue(e, t, r) {
  let n = "";
  for (let [i, a] of Object.entries(t))
    typeof a < "u" && (n += ` ${i}="${a}"`);
  return r ? `<${e}${n}>${r}</${e}>` : `<${e}${n}/>`;
}
__name(ue, "ue");
function Og(e = 20) {
  let t = /* @__PURE__ */ new Map();
  function r(a, o) {
    if (t.size >= e) {
      let u = t.keys().next().value;
      t.delete(u);
    }
    t.set(a, o);
  }
  __name(r, "r");
  function n(a) {
    if (!t.has(a))
      return;
    let o = t.get(a);
    return t.delete(a), t.set(a, o), o;
  }
  __name(n, "n");
  function i() {
    t.clear();
  }
  __name(i, "i");
  return { set: r, get: n, clear: i };
}
__name(Og, "Og");
function Ua(e) {
  return e ? e.split(/[, ]/).filter(Boolean).map(Number) : null;
}
__name(Ua, "Ua");
function Lg(e) {
  return Object.prototype.toString.call(e);
}
__name(Lg, "Lg");
function pl(e) {
  return typeof e == "string";
}
__name(pl, "pl");
function Ig(e) {
  return typeof e == "number";
}
__name(Ig, "Ig");
function Pg(e) {
  return Lg(e) === "[object Undefined]";
}
__name(Pg, "Pg");
function Rg(e, t) {
  if (t === "break-all")
    return { words: Pt(e, "grapheme"), requiredBreaks: [] };
  if (t === "keep-all")
    return { words: Pt(e, "word"), requiredBreaks: [] };
  let r = new Ei(e), n = 0, i = r.nextBreak(), a = [], o = [false];
  for (; i; ) {
    let u = e.slice(n, i.position);
    a.push(u), i.required ? o.push(true) : o.push(false), n = i.position, i = r.nextBreak();
  }
  return { words: a, requiredBreaks: o };
}
__name(Rg, "Rg");
var Ug = /* @__PURE__ */ __name((e) => e.replaceAll(/([A-Z])/g, (t, r) => `-${r.toLowerCase()}`), "Ug");
function hl(e, t = ",") {
  let r = [], n = 0, i = 0;
  t = new RegExp(t);
  for (let a = 0; a < e.length; a++)
    e[a] === "(" ? i++ : e[a] === ")" && i--, i === 0 && t.test(e[a]) && (r.push(e.slice(n, a).trim()), n = a + 1);
  return r.push(e.slice(n).trim()), r;
}
__name(hl, "hl");
var Bg = "image/avif";
var Ng = "image/webp";
var ei = "image/apng";
var ti = "image/png";
var ri = "image/jpeg";
var ni = "image/gif";
var Ba = "image/svg+xml";
function dl(e) {
  let t = new DataView(e), r = 4, n = t.byteLength;
  for (; r < n; ) {
    let i = t.getUint16(r, false);
    if (i > n)
      throw new TypeError("Invalid JPEG");
    let a = t.getUint8(i + 1 + r);
    if (a === 192 || a === 193 || a === 194)
      return [t.getUint16(i + 7 + r, false), t.getUint16(i + 5 + r, false)];
    r += i + 2;
  }
  throw new TypeError("Invalid JPEG");
}
__name(dl, "dl");
function vl(e) {
  let t = new Uint8Array(e.slice(6, 10));
  return [t[0] | t[1] << 8, t[2] | t[3] << 8];
}
__name(vl, "vl");
function gl(e) {
  let t = new DataView(e);
  return [t.getUint16(18, false), t.getUint16(22, false)];
}
__name(gl, "gl");
var cr = Og(100);
var ha = /* @__PURE__ */ new Map();
var Mg = [ti, ei, ri, ni, Ba];
function Gg(e) {
  let t = "", r = new Uint8Array(e);
  for (let n = 0; n < r.byteLength; n++)
    t += String.fromCharCode(r[n]);
  return btoa(t);
}
__name(Gg, "Gg");
function Wg(e) {
  let t = atob(e), r = t.length, n = new Uint8Array(r);
  for (let i = 0; i < r; i++)
    n[i] = t.charCodeAt(i);
  return n.buffer;
}
__name(Wg, "Wg");
function fu(e, t) {
  let r = t.match(/<svg[^>]*>/)[0], n = r.match(/viewBox=['"](.+)['"]/), i = n ? Ua(n[1]) : null, a = r.match(/width=['"](\d*\.\d+|\d+)['"]/), o = r.match(/height=['"](\d*\.\d+|\d+)['"]/);
  if (!i && (!a || !o))
    throw new Error(`Failed to parse SVG from ${e}: missing "viewBox"`);
  let u = i ? [i[2], i[3]] : [+a[1], +o[1]], s = u[0] / u[1];
  return a && o ? [+a[1], +o[1]] : a ? [+a[1], +a[1] / s] : o ? [+o[1] * s, +o[1]] : [u[0], u[1]];
}
__name(fu, "fu");
function cu(e) {
  let t, r = $g(new Uint8Array(e));
  switch (r) {
    case ti:
    case ei:
      t = gl(e);
      break;
    case ni:
      t = vl(e);
      break;
    case ri:
      t = dl(e);
      break;
  }
  if (!Mg.includes(r))
    throw new Error(`Unsupported image type: ${r || "unknown"}`);
  return [`data:${r};base64,${Gg(e)}`, t];
}
__name(cu, "cu");
async function Na(e) {
  if (!e)
    throw new Error("Image source is not provided.");
  if (typeof e == "object") {
    let [i, a] = cu(e);
    return [i, ...a];
  }
  if ((e.startsWith('"') && e.endsWith('"') || e.startsWith("'") && e.endsWith("'")) && (e = e.slice(1, -1)), typeof window > "u" && !e.startsWith("http") && !e.startsWith("data:"))
    throw new Error(`Image source must be an absolute URL: ${e}`);
  if (e.startsWith("data:")) {
    let i;
    try {
      i = /data:(?<imageType>[a-z/+]+)(;(charset=)?(?<encodingType>.*))?,(?<dataString>.*)/g.exec(e).groups;
    } catch {
      return console.warn("Image data URI resolved without size:" + e), [e];
    }
    let { imageType: a, encodingType: o, dataString: u } = i;
    if (a === Ba) {
      let s = o === "base64" ? atob(u) : decodeURIComponent(u.replace(/ /g, "%20")), l = o === "base64" ? e : `data:image/svg+xml;base64,${btoa(s)}`, f = fu(e, s);
      return cr.set(e, [l, ...f]), [l, ...f];
    } else if (o === "base64") {
      let s, l = Wg(u);
      switch (a) {
        case ti:
        case ei:
          s = gl(l);
          break;
        case ni:
          s = vl(l);
          break;
        case ri:
          s = dl(l);
          break;
      }
      return cr.set(e, [e, ...s]), [e, ...s];
    } else
      return console.warn("Image data URI resolved without size:" + e), cr.set(e, [e]), [e];
  }
  if (!globalThis.fetch)
    throw new Error("`fetch` is required to be polyfilled to load images.");
  if (ha.has(e))
    return ha.get(e);
  let t = cr.get(e);
  if (t)
    return t;
  let r = e, n = fetch(r).then((i) => {
    let a = i.headers.get("content-type");
    return a === "image/svg+xml" || a === "application/svg+xml" ? i.text() : i.arrayBuffer();
  }).then((i) => {
    if (typeof i == "string")
      try {
        let u = `data:image/svg+xml;base64,${btoa(i)}`, s = fu(r, i);
        return [u, ...s];
      } catch (u) {
        throw new Error(`Failed to parse SVG image: ${u.message}`);
      }
    let [a, o] = cu(i);
    return [a, ...o];
  }).then((i) => (cr.set(r, i), i)).catch((i) => (console.error(`Can't load image ${r}: ` + i.message), cr.set(r, []), []));
  return ha.set(r, n), n;
}
__name(Na, "Na");
function $g(e) {
  return [255, 216, 255].every((t, r) => e[r] === t) ? ri : [137, 80, 78, 71, 13, 10, 26, 10].every((t, r) => e[r] === t) ? jg(e) ? ei : ti : [71, 73, 70, 56].every((t, r) => e[r] === t) ? ni : [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80].every((t, r) => !t || e[r] === t) ? Ng : [60, 63, 120, 109, 108].every((t, r) => e[r] === t) ? Ba : [0, 0, 0, 0, 102, 116, 121, 112, 97, 118, 105, 102].every((t, r) => !t || e[r] === t) ? Bg : null;
}
__name($g, "$g");
function jg(e) {
  let t = new DataView(e.buffer), r, n, i = 8, a = false;
  for (; !a && r !== "IEND" && i < e.length; ) {
    n = t.getUint32(i);
    let o = e.subarray(i + 4, i + 8);
    r = String.fromCharCode(...o), a = r === "acTL", i += 12 + n;
  }
  return a;
}
__name(jg, "jg");
var wa = { accentHeight: "accent-height", alignmentBaseline: "alignment-baseline", arabicForm: "arabic-form", baselineShift: "baseline-shift", capHeight: "cap-height", clipPath: "clip-path", clipRule: "clip-rule", colorInterpolation: "color-interpolation", colorInterpolationFilters: "color-interpolation-filters", colorProfile: "color-profile", colorRendering: "color-rendering", dominantBaseline: "dominant-baseline", enableBackground: "enable-background", fillOpacity: "fill-opacity", fillRule: "fill-rule", floodColor: "flood-color", floodOpacity: "flood-opacity", fontFamily: "font-family", fontSize: "font-size", fontSizeAdjust: "font-size-adjust", fontStretch: "font-stretch", fontStyle: "font-style", fontVariant: "font-variant", fontWeight: "font-weight", glyphName: "glyph-name", glyphOrientationHorizontal: "glyph-orientation-horizontal", glyphOrientationVertical: "glyph-orientation-vertical", horizAdvX: "horiz-adv-x", horizOriginX: "horiz-origin-x", href: "href", imageRendering: "image-rendering", letterSpacing: "letter-spacing", lightingColor: "lighting-color", markerEnd: "marker-end", markerMid: "marker-mid", markerStart: "marker-start", overlinePosition: "overline-position", overlineThickness: "overline-thickness", paintOrder: "paint-order", panose1: "panose-1", pointerEvents: "pointer-events", renderingIntent: "rendering-intent", shapeRendering: "shape-rendering", stopColor: "stop-color", stopOpacity: "stop-opacity", strikethroughPosition: "strikethrough-position", strikethroughThickness: "strikethrough-thickness", strokeDasharray: "stroke-dasharray", strokeDashoffset: "stroke-dashoffset", strokeLinecap: "stroke-linecap", strokeLinejoin: "stroke-linejoin", strokeMiterlimit: "stroke-miterlimit", strokeOpacity: "stroke-opacity", strokeWidth: "stroke-width", textAnchor: "text-anchor", textDecoration: "text-decoration", textRendering: "text-rendering", underlinePosition: "underline-position", underlineThickness: "underline-thickness", unicodeBidi: "unicode-bidi", unicodeRange: "unicode-range", unitsPerEm: "units-per-em", vAlphabetic: "v-alphabetic", vHanging: "v-hanging", vIdeographic: "v-ideographic", vMathematical: "v-mathematical", vectorEffect: "vector-effect", vertAdvY: "vert-adv-y", vertOriginX: "vert-origin-x", vertOriginY: "vert-origin-y", wordSpacing: "word-spacing", writingMode: "writing-mode", xHeight: "x-height", xlinkActuate: "xlink:actuate", xlinkArcrole: "xlink:arcrole", xlinkHref: "xlink:href", xlinkRole: "xlink:role", xlinkShow: "xlink:show", xlinkTitle: "xlink:title", xlinkType: "xlink:type", xmlBase: "xml:base", xmlLang: "xml:lang", xmlSpace: "xml:space", xmlnsXlink: "xmlns:xlink" };
var zg = /[\r\n%#()<>?[\\\]^`{|}"']/g;
function Ea(e, t) {
  if (!e)
    return "";
  if (Array.isArray(e))
    return e.map((l) => Ea(l, t)).join("");
  if (typeof e != "object")
    return String(e);
  let r = e.type;
  if (r === "text")
    throw new Error("<text> nodes are not currently supported, please convert them to <path>");
  let { children: n, style: i, ...a } = e.props || {}, o = i?.color || t, u = `${Object.entries(a).map(([l, f]) => (typeof f == "string" && f.toLowerCase() === "currentcolor" && (f = o), l === "href" && r === "image" ? ` ${wa[l] || l}="${cr.get(f)[0]}"` : ` ${wa[l] || l}="${f}"`)).join("")}`, s = i ? ` style="${Object.entries(i).map(([l, f]) => `${Ug(l)}:${f}`).join(";")}"` : "";
  return `<${r}${u}${s}>${Ea(n, o)}</${r}>`;
}
__name(Ea, "Ea");
async function Vg(e) {
  let t = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ __name((n) => {
    if (n && jn(n)) {
      if (Array.isArray(n)) {
        n.forEach((i) => r(i));
        return;
      } else
        typeof n == "object" && (n.type === "image" ? t.has(n.props.href) || t.add(n.props.href) : n.type === "img" && (t.has(n.props.src) || t.add(n.props.src)));
      Array.isArray(n.props.children) ? n.props.children.map((i) => r(i)) : r(n.props.children);
    }
  }, "r");
  return r(e), Promise.all(Array.from(t).map((n) => Na(n)));
}
__name(Vg, "Vg");
async function Hg(e, t) {
  let { viewBox: r, viewbox: n, width: i, height: a, className: o, style: u, children: s, ...l } = e.props || {};
  r ||= n, l.xmlns = "http://www.w3.org/2000/svg";
  let f = u?.color || t, c = Ua(r), p = c ? c[3] / c[2] : null;
  return i = i || p && a ? a / p : null, a = a || p && i ? i * p : null, l.width = i, l.height = a, r && (l.viewBox = r), `data:image/svg+xml;utf8,${`<svg ${Object.entries(l).map(([d, D]) => (typeof D == "string" && D.toLowerCase() === "currentcolor" && (D = f), ` ${wa[d] || d}="${D}"`)).join("")}>${Ea(s, f)}</svg>`.replace(zg, encodeURIComponent)}`;
}
__name(Hg, "Hg");
var Et = "flex";
var Xg = { p: { display: Et, marginTop: "1em", marginBottom: "1em" }, div: { display: Et }, blockquote: { display: Et, marginTop: "1em", marginBottom: "1em", marginLeft: 40, marginRight: 40 }, center: { display: Et, textAlign: "center" }, hr: { display: Et, marginTop: "0.5em", marginBottom: "0.5em", marginLeft: "auto", marginRight: "auto", borderWidth: 1, borderStyle: "solid" }, h1: { display: Et, fontSize: "2em", marginTop: "0.67em", marginBottom: "0.67em", marginLeft: 0, marginRight: 0, fontWeight: "bold" }, h2: { display: Et, fontSize: "1.5em", marginTop: "0.83em", marginBottom: "0.83em", marginLeft: 0, marginRight: 0, fontWeight: "bold" }, h3: { display: Et, fontSize: "1.17em", marginTop: "1em", marginBottom: "1em", marginLeft: 0, marginRight: 0, fontWeight: "bold" }, h4: { display: Et, marginTop: "1.33em", marginBottom: "1.33em", marginLeft: 0, marginRight: 0, fontWeight: "bold" }, h5: { display: Et, fontSize: "0.83em", marginTop: "1.67em", marginBottom: "1.67em", marginLeft: 0, marginRight: 0, fontWeight: "bold" }, h6: { display: Et, fontSize: "0.67em", marginTop: "2.33em", marginBottom: "2.33em", marginLeft: 0, marginRight: 0, fontWeight: "bold" }, u: { textDecoration: "underline" }, strong: { fontWeight: "bold" }, b: { fontWeight: "bold" }, i: { fontStyle: "italic" }, em: { fontStyle: "italic" }, code: { fontFamily: "monospace" }, kbd: { fontFamily: "monospace" }, pre: { display: Et, fontFamily: "monospace", whiteSpace: "pre", marginTop: "1em", marginBottom: "1em" }, mark: { backgroundColor: "yellow", color: "black" }, big: { fontSize: "larger" }, small: { fontSize: "smaller" }, s: { textDecoration: "line-through" } };
var qg = /* @__PURE__ */ new Set(["color", "font", "fontFamily", "fontSize", "fontStyle", "fontWeight", "letterSpacing", "lineHeight", "textAlign", "textTransform", "textShadowOffset", "textShadowColor", "textShadowRadius", "textDecorationLine", "textDecorationStyle", "textDecorationColor", "whiteSpace", "transform", "wordBreak", "tabSize", "opacity", "filter", "_viewportWidth", "_viewportHeight", "_inheritedClipPathId", "_inheritedMaskId", "_inheritedBackgroundClipTextPath"]);
function Yg(e) {
  let t = {};
  for (let r in e)
    qg.has(r) && (t[r] = e[r]);
  return t;
}
__name(Yg, "Yg");
function Zg(e, t) {
  try {
    let r = new Qn(e);
    switch (r.unit) {
      case "px":
        return { absolute: r.value };
      case "em":
        return { absolute: r.value * t };
      case "rem":
        return { absolute: r.value * 16 };
      case "%":
        return { relative: r.value };
      default:
        return {};
    }
  } catch {
    return {};
  }
}
__name(Zg, "Zg");
function da(e, t, r) {
  switch (e) {
    case "top":
      return { yRelative: 0 };
    case "left":
      return { xRelative: 0 };
    case "right":
      return { xRelative: 100 };
    case "bottom":
      return { yRelative: 100 };
    case "center":
      return {};
    default: {
      let n = Zg(e, t);
      return n.absolute ? { [r ? "xAbsolute" : "yAbsolute"]: n.absolute } : n.relative ? { [r ? "xRelative" : "yRelative"]: n.relative } : {};
    }
  }
}
__name(da, "da");
function Jg(e, t) {
  if (typeof e == "number")
    return { xAbsolute: e };
  let r;
  try {
    r = (0, bl.default)(e).nodes.filter((n) => n.type === "word").map((n) => n.value);
  } catch {
    return {};
  }
  return r.length === 1 ? da(r[0], t, true) : r.length === 2 ? ((r[0] === "top" || r[0] === "bottom" || r[1] === "left" || r[1] === "right") && r.reverse(), { ...da(r[0], t, true), ...da(r[1], t, false) }) : {};
}
__name(Jg, "Jg");
function Yr(e, t) {
  let r = (0, xl.getPropertyName)(`mask-${t}`);
  return e[r] || e[`WebkitM${r.substring(1)}`];
}
__name(Yr, "Yr");
function Kg(e) {
  let t = e.maskImage || e.WebkitMaskImage, r = { position: Yr(e, "position") || "0% 0%", size: Yr(e, "size") || "100% 100%", repeat: Yr(e, "repeat") || "repeat", origin: Yr(e, "origin") || "border-box", clip: Yr(e, "origin") || "border-box" };
  return hl(t).filter((n) => n && n !== "none").reverse().map((n) => ({ image: n, ...r }));
}
__name(Kg, "Kg");
var Qg = /* @__PURE__ */ new Set(["flex", "flexGrow", "flexShrink", "flexBasis", "fontWeight", "lineHeight", "opacity", "scale", "scaleX", "scaleY"]);
var e1 = /* @__PURE__ */ new Set(["lineHeight"]);
function t1(e, t, r, n) {
  return e === "textDecoration" && !r.includes(t.textDecorationColor) && (t.textDecorationColor = n), t;
}
__name(t1, "t1");
function en(e, t) {
  let r = Number(t);
  return isNaN(r) ? t : Qg.has(e) ? e1.has(e) ? r : String(t) : r + "px";
}
__name(en, "en");
function r1(e, t, r) {
  if (e === "lineHeight")
    return { lineHeight: en(e, t) };
  if (e === "fontFamily")
    return { fontFamily: t.split(",").map((n) => n.trim().replace(/(^['"])|(['"]$)/g, "").toLocaleLowerCase()) };
  if (e === "borderRadius") {
    if (typeof t != "string" || !t.includes("/"))
      return;
    let [n, i] = t.split("/"), a = (0, It.getStylesForProperty)(e, n, true), o = (0, It.getStylesForProperty)(e, i, true);
    for (let u in a)
      o[u] = en(e, a[u]) + " " + en(e, o[u]);
    return o;
  }
  if (/^border(Top|Right|Bottom|Left)?$/.test(e)) {
    let n = (0, It.getStylesForProperty)("border", t, true);
    n.borderWidth === 1 && !String(t).includes("1px") && (n.borderWidth = 3), n.borderColor === "black" && !String(t).includes("black") && (n.borderColor = r);
    let i = { Width: en(e + "Width", n.borderWidth), Style: Lt(n.borderStyle, { solid: "solid", dashed: "dashed" }, "solid", e + "Style"), Color: n.borderColor }, a = {};
    for (let o of e === "border" ? ["Top", "Right", "Bottom", "Left"] : [e.slice(6)])
      for (let u in i)
        a["border" + o + u] = i[u];
    return a;
  }
  if (e === "boxShadow") {
    if (!t)
      throw new Error('Invalid `boxShadow` value: "' + t + '".');
    return { [e]: typeof t == "string" ? (0, Dl.parse)(t) : t };
  }
  if (e === "transform") {
    if (typeof t != "string")
      throw new Error("Invalid `transform` value.");
    let n = {}, i = t.replace(/(-?[\d.]+%)/g, (o, u) => {
      let s = ~~(Math.random() * 1e9);
      return n[s] = u, s + "px";
    }), a = (0, It.getStylesForProperty)("transform", i, true);
    for (let o of a.transform)
      for (let u in o)
        n[o[u]] && (o[u] = n[o[u]]);
    return a;
  }
  if (e === "background")
    return t = t.toString().trim(), /^(linear-gradient|radial-gradient|url)\(/.test(t) ? (0, It.getStylesForProperty)("backgroundImage", t, true) : (0, It.getStylesForProperty)("background", t, true);
  if (e === "textShadow") {
    t = t.toString().trim();
    let n = {}, i = hl(t);
    for (let a of i) {
      let o = (0, It.getStylesForProperty)("textShadow", a, true);
      for (let u in o)
        n[u] ? n[u].push(o[u]) : n[u] = [o[u]];
    }
    return n;
  }
}
__name(r1, "r1");
function pu(e) {
  return e === "transform" ? " Only absolute lengths such as `10px` are supported." : "";
}
__name(pu, "pu");
var hu = /rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\.\d]+)\)/;
function wl(e) {
  if (typeof e == "string" && hu.test(e.trim()))
    return e.trim().replace(hu, (t, r, n, i, a) => `rgba(${r}, ${n}, ${i}, ${a})`);
  if (typeof e == "object" && e !== null) {
    for (let t in e)
      e[t] = wl(e[t]);
    return e;
  }
  return e;
}
__name(wl, "wl");
function du(e, t) {
  let r = {};
  if (e) {
    let i = i1(e.color, t.color);
    r.color = i;
    for (let a in e) {
      if (a.startsWith("_")) {
        r[a] = e[a];
        continue;
      }
      if (a === "color")
        continue;
      let o = (0, It.getPropertyName)(a), u = o1(e[a], i);
      try {
        let s = r1(o, u, i) || t1(o, (0, It.getStylesForProperty)(o, en(o, u), true), u, i);
        Object.assign(r, s);
      } catch (s) {
        throw new Error(s.message + (s.message.includes(u) ? `
  ` + pu(o) : `
  in CSS rule \`${o}: ${u}\`.${pu(o)}`));
      }
    }
  }
  if (r.backgroundImage) {
    let { backgrounds: i } = (0, ml.parseElementStyle)(r);
    r.backgroundImage = i;
  }
  (r.maskImage || r.WebkitMaskImage) && (r.maskImage = Kg(r));
  let n = n1(r.fontSize, t.fontSize);
  typeof r.fontSize < "u" && (r.fontSize = n), r.transformOrigin && (r.transformOrigin = Jg(r.transformOrigin, n));
  for (let i in r) {
    let a = r[i];
    if (i === "lineHeight")
      typeof a == "string" && (a = r[i] = Ie(a, n, n, t, true) / n);
    else {
      if (typeof a == "string") {
        let o = Ie(a, n, n, t);
        typeof o < "u" && (r[i] = o), a = r[i];
      }
      if (typeof a == "string" || typeof a == "object") {
        let o = wl(a);
        o && (r[i] = o), a = r[i];
      }
    }
    if (i === "opacity" && typeof a == "number" && (r.opacity = a * t.opacity), i === "transform") {
      let o = a;
      for (let u of o) {
        let s = Object.keys(u)[0], l = u[s], f = typeof l == "string" ? Ie(l, n, n, t) ?? l : l;
        u[s] = f;
      }
    }
    if (i === "textShadowRadius") {
      let o = a;
      r.textShadowRadius = o.map((u) => Ie(u, n, 0, t, false));
    }
    if (i === "textShadowOffset") {
      let o = a;
      r.textShadowOffset = o.map(({ height: u, width: s }) => ({ height: Ie(u, n, 0, t, false), width: Ie(s, n, 0, t, false) }));
    }
  }
  return r;
}
__name(du, "du");
function n1(e, t) {
  if (typeof e == "number")
    return e;
  try {
    let r = new Qn(e);
    switch (r.unit) {
      case "em":
        return r.value * t;
      case "rem":
        return r.value * 16;
    }
  } catch {
    return t;
  }
}
__name(n1, "n1");
function vu(e) {
  if (e.startsWith("hsl")) {
    let t = (0, yl.default)(e), [r, n, i] = t.values;
    return `hsl(${[r, `${n}%`, `${i}%`].concat(t.alpha === 1 ? [] : [t.alpha]).join(",")})`;
  }
  return e;
}
__name(vu, "vu");
function i1(e, t) {
  return e && e.toLowerCase() !== "currentcolor" ? vu(e) : vu(t);
}
__name(i1, "i1");
function a1(e, t) {
  return e.replace(/currentcolor/gi, t);
}
__name(a1, "a1");
function o1(e, t) {
  return pl(e) && (e = a1(e, t)), e;
}
__name(o1, "o1");
async function s1(e, t, r, n, i) {
  let a = await Kn(), o = { ...r, ...du(Xg[t], r), ...du(n, r) };
  if (t === "img") {
    let [u, s, l] = await Na(i.src);
    if (s === void 0 && l === void 0) {
      if (i.width === void 0 || i.height === void 0)
        throw new Error("Image size cannot be determined. Please provide the width and height of the image.");
      s = parseInt(i.width), l = parseInt(i.height);
    }
    let f = l / s, c = (o.borderLeftWidth || 0) + (o.borderRightWidth || 0) + (o.paddingLeft || 0) + (o.paddingRight || 0), p = (o.borderTopWidth || 0) + (o.borderBottomWidth || 0) + (o.paddingTop || 0) + (o.paddingBottom || 0), d = o.width || i.width, D = o.height || i.height, v = typeof d == "number" && typeof D == "number";
    v && (d -= c, D -= p), d === void 0 && D === void 0 ? (d = "100%", e.setAspectRatio(1 / f)) : d === void 0 ? typeof D == "number" ? d = D / f : e.setAspectRatio(1 / f) : D === void 0 && (typeof d == "number" ? D = d * f : e.setAspectRatio(1 / f)), o.width = v ? d + c : d, o.height = v ? D + p : D, o.__src = u;
  }
  if (t === "svg") {
    let u = i.viewBox || i.viewbox, s = Ua(u), l = s ? s[3] / s[2] : null, { width: f, height: c } = i;
    typeof f > "u" && c ? l == null ? f = 0 : typeof c == "string" && c.endsWith("%") ? f = parseInt(c) / l + "%" : (c = Ie(c, r.fontSize, 1, r), f = c / l) : typeof c > "u" && f ? l == null ? f = 0 : typeof f == "string" && f.endsWith("%") ? c = parseInt(f) * l + "%" : (f = Ie(f, r.fontSize, 1, r), c = f * l) : (typeof f < "u" && (f = Ie(f, r.fontSize, 1, r) || f), typeof c < "u" && (c = Ie(c, r.fontSize, 1, r) || c), f ||= s?.[2], c ||= s?.[3]), !o.width && f && (o.width = f), !o.height && c && (o.height = c);
  }
  return e.setDisplay(Lt(o.display, { flex: a.DISPLAY_FLEX, block: a.DISPLAY_FLEX, none: a.DISPLAY_NONE, "-webkit-box": a.DISPLAY_FLEX }, a.DISPLAY_FLEX, "display")), e.setAlignContent(Lt(o.alignContent, { stretch: a.ALIGN_STRETCH, center: a.ALIGN_CENTER, "flex-start": a.ALIGN_FLEX_START, "flex-end": a.ALIGN_FLEX_END, "space-between": a.ALIGN_SPACE_BETWEEN, "space-around": a.ALIGN_SPACE_AROUND, baseline: a.ALIGN_BASELINE, normal: a.ALIGN_AUTO }, a.ALIGN_AUTO, "alignContent")), e.setAlignItems(Lt(o.alignItems, { stretch: a.ALIGN_STRETCH, center: a.ALIGN_CENTER, "flex-start": a.ALIGN_FLEX_START, "flex-end": a.ALIGN_FLEX_END, baseline: a.ALIGN_BASELINE, normal: a.ALIGN_AUTO }, a.ALIGN_STRETCH, "alignItems")), e.setAlignSelf(Lt(o.alignSelf, { stretch: a.ALIGN_STRETCH, center: a.ALIGN_CENTER, "flex-start": a.ALIGN_FLEX_START, "flex-end": a.ALIGN_FLEX_END, baseline: a.ALIGN_BASELINE, normal: a.ALIGN_AUTO }, a.ALIGN_AUTO, "alignSelf")), e.setJustifyContent(Lt(o.justifyContent, { center: a.JUSTIFY_CENTER, "flex-start": a.JUSTIFY_FLEX_START, "flex-end": a.JUSTIFY_FLEX_END, "space-between": a.JUSTIFY_SPACE_BETWEEN, "space-around": a.JUSTIFY_SPACE_AROUND }, a.JUSTIFY_FLEX_START, "justifyContent")), e.setFlexDirection(Lt(o.flexDirection, { row: a.FLEX_DIRECTION_ROW, column: a.FLEX_DIRECTION_COLUMN, "row-reverse": a.FLEX_DIRECTION_ROW_REVERSE, "column-reverse": a.FLEX_DIRECTION_COLUMN_REVERSE }, a.FLEX_DIRECTION_ROW, "flexDirection")), e.setFlexWrap(Lt(o.flexWrap, { wrap: a.WRAP_WRAP, nowrap: a.WRAP_NO_WRAP, "wrap-reverse": a.WRAP_WRAP_REVERSE }, a.WRAP_NO_WRAP, "flexWrap")), typeof o.gap < "u" && e.setGap(a.GUTTER_ALL, o.gap), typeof o.rowGap < "u" && e.setGap(a.GUTTER_ROW, o.rowGap), typeof o.columnGap < "u" && e.setGap(a.GUTTER_COLUMN, o.columnGap), typeof o.flexBasis < "u" && e.setFlexBasis(o.flexBasis), e.setFlexGrow(typeof o.flexGrow > "u" ? 0 : o.flexGrow), e.setFlexShrink(typeof o.flexShrink > "u" ? 0 : o.flexShrink), typeof o.maxHeight < "u" && e.setMaxHeight(o.maxHeight), typeof o.maxWidth < "u" && e.setMaxWidth(o.maxWidth), typeof o.minHeight < "u" && e.setMinHeight(o.minHeight), typeof o.minWidth < "u" && e.setMinWidth(o.minWidth), e.setOverflow(Lt(o.overflow, { visible: a.OVERFLOW_VISIBLE, hidden: a.OVERFLOW_HIDDEN }, a.OVERFLOW_VISIBLE, "overflow")), e.setMargin(a.EDGE_TOP, o.marginTop || 0), e.setMargin(a.EDGE_BOTTOM, o.marginBottom || 0), e.setMargin(a.EDGE_LEFT, o.marginLeft || 0), e.setMargin(a.EDGE_RIGHT, o.marginRight || 0), e.setBorder(a.EDGE_TOP, o.borderTopWidth || 0), e.setBorder(a.EDGE_BOTTOM, o.borderBottomWidth || 0), e.setBorder(a.EDGE_LEFT, o.borderLeftWidth || 0), e.setBorder(a.EDGE_RIGHT, o.borderRightWidth || 0), e.setPadding(a.EDGE_TOP, o.paddingTop || 0), e.setPadding(a.EDGE_BOTTOM, o.paddingBottom || 0), e.setPadding(a.EDGE_LEFT, o.paddingLeft || 0), e.setPadding(a.EDGE_RIGHT, o.paddingRight || 0), e.setPositionType(Lt(o.position, { absolute: a.POSITION_TYPE_ABSOLUTE, relative: a.POSITION_TYPE_RELATIVE }, a.POSITION_TYPE_RELATIVE, "position")), typeof o.top < "u" && e.setPosition(a.EDGE_TOP, o.top), typeof o.bottom < "u" && e.setPosition(a.EDGE_BOTTOM, o.bottom), typeof o.left < "u" && e.setPosition(a.EDGE_LEFT, o.left), typeof o.right < "u" && e.setPosition(a.EDGE_RIGHT, o.right), typeof o.height < "u" ? e.setHeight(o.height) : e.setHeightAuto(), typeof o.width < "u" ? e.setWidth(o.width) : e.setWidthAuto(), [o, Yg(o)];
}
__name(s1, "s1");
var gu = [1, 0, 0, 1, 0, 0];
function u1(e, t, r) {
  let n = [...gu];
  for (let i of e) {
    let a = Object.keys(i)[0], o = i[a];
    if (typeof o == "string")
      if (a === "translateX")
        o = parseFloat(o) / 100 * t, i[a] = o;
      else if (a === "translateY")
        o = parseFloat(o) / 100 * r, i[a] = o;
      else
        throw new Error(`Invalid transform: "${a}: ${o}".`);
    let u = o, s = [...gu];
    switch (a) {
      case "translateX":
        s[4] = u;
        break;
      case "translateY":
        s[5] = u;
        break;
      case "scale":
        s[0] = u, s[3] = u;
        break;
      case "scaleX":
        s[0] = u;
        break;
      case "scaleY":
        s[3] = u;
        break;
      case "rotate": {
        let l = u * Math.PI / 180, f = Math.cos(l), c = Math.sin(l);
        s[0] = f, s[1] = c, s[2] = -c, s[3] = f;
        break;
      }
      case "skewX":
        s[2] = Math.tan(u * Math.PI / 180);
        break;
      case "skewY":
        s[1] = Math.tan(u * Math.PI / 180);
        break;
    }
    n = zn(s, n);
  }
  e.splice(0, e.length), e.push(...n), e.__resolved = true;
}
__name(u1, "u1");
function El({ left: e, top: t, width: r, height: n }, i, a, o) {
  let u;
  i.__resolved || u1(i, r, n);
  let s = i;
  if (a)
    u = s;
  else {
    let l = o?.xAbsolute ?? (o?.xRelative ?? 50) * r / 100, f = o?.yAbsolute ?? (o?.yRelative ?? 50) * n / 100, c = e + l, p = t + f;
    u = zn([1, 0, 0, 1, c, p], zn(s, [1, 0, 0, 1, -c, -p])), s.__parent && (u = zn(s.__parent, u)), s.splice(0, 6, ...u);
  }
  return `matrix(${u.map((l) => l.toFixed(2)).join(",")})`;
}
__name(El, "El");
function l1({ left: e, top: t, width: r, height: n, isInheritingTransform: i }, a) {
  let o = "", u = 1;
  return a.transform && (o = El({ left: e, top: t, width: r, height: n }, a.transform, i, a.transformOrigin)), a.opacity !== void 0 && (u = +a.opacity), { matrix: o, opacity: u };
}
__name(l1, "l1");
function f1({ id: e, content: t, filter: r, left: n, top: i, width: a, height: o, matrix: u, opacity: s, image: l, clipPathId: f, debug: c, shape: p, decorationShape: d }, D) {
  let v = "";
  if (c && (v = ue("rect", { x: n, y: i - o, width: a, height: o, fill: "transparent", stroke: "#575eff", "stroke-width": 1, transform: u || void 0, "clip-path": f ? `url(#${f})` : void 0 })), l) {
    let y = { href: l, x: n, y: i, width: a, height: o, transform: u || void 0, "clip-path": f ? `url(#${f})` : void 0, style: D.filter ? `filter:${D.filter}` : void 0 };
    return [(r ? `${r}<g filter="url(#satori_s-${e})">` : "") + ue("image", { ...y, opacity: s !== 1 ? s : void 0 }) + (d || "") + (r ? "</g>" : "") + v, ""];
  }
  let g = { x: n, y: i, width: a, height: o, "font-weight": D.fontWeight, "font-style": D.fontStyle, "font-size": D.fontSize, "font-family": D.fontFamily, "letter-spacing": D.letterSpacing || void 0, transform: u || void 0, "clip-path": f ? `url(#${f})` : void 0, style: D.filter ? `filter:${D.filter}` : void 0 };
  return [(r ? `${r}<g filter="url(#satori_s-${e})">` : "") + ue("text", { ...g, fill: D.color, opacity: s !== 1 ? s : void 0 }, (0, Fa.default)(t)) + (d || "") + (r ? "</g>" : "") + v, p ? ue("text", g, (0, Fa.default)(t)) : ""];
}
__name(f1, "f1");
function c1(e, t, r) {
  return e.replace(/([MA])([0-9.-]+),([0-9.-]+)/g, function(n, i, a, o) {
    return i + (parseFloat(a) + t) + "," + (parseFloat(o) + r);
  });
}
__name(c1, "c1");
var Pn = 1.1;
function p1({ id: e, width: t, height: r }, n) {
  if (!n.shadowColor || !n.shadowOffset || typeof n.shadowRadius > "u")
    return "";
  let i = n.shadowColor.length, a = "", o = "", u = 0, s = t, l = 0, f = r;
  for (let c = 0; c < i; c++) {
    let p = n.shadowRadius[c] * n.shadowRadius[c] / 4;
    u = Math.min(n.shadowOffset[c].width - p, u), s = Math.max(n.shadowOffset[c].width + p + t, s), l = Math.min(n.shadowOffset[c].height - p, l), f = Math.max(n.shadowOffset[c].height + p + r, f), a += ue("feDropShadow", { dx: n.shadowOffset[c].width, dy: n.shadowOffset[c].height, stdDeviation: n.shadowRadius[c] / 2, "flood-color": n.shadowColor[c], "flood-opacity": 1, ...i > 1 ? { in: "SourceGraphic", result: `satori_s-${e}-result-${c}` } : {} }), i > 1 && (o = ue("feMergeNode", { in: `satori_s-${e}-result-${c}` }) + o);
  }
  return ue("filter", { id: `satori_s-${e}`, x: (u / t * 100 * Pn).toFixed(2) + "%", y: (l / r * 100 * Pn).toFixed(2) + "%", width: ((s - u) / t * 100 * Pn).toFixed(2) + "%", height: ((f - l) / r * 100 * Pn).toFixed(2) + "%" }, a + (o ? ue("feMerge", {}, o) : ""));
}
__name(p1, "p1");
function h1({ width: e, height: t, shape: r, opacity: n, id: i }, a) {
  if (!a.boxShadow)
    return null;
  let o = "", u = "";
  for (let s = a.boxShadow.length - 1; s >= 0; s--) {
    let l = "", f = a.boxShadow[s];
    f.spreadRadius && f.inset && (f.spreadRadius = -f.spreadRadius);
    let c = f.blurRadius * f.blurRadius / 4 + (f.spreadRadius || 0), p = Math.min(-c - (f.inset ? f.offsetX : 0), 0), d = Math.max(c + e - (f.inset ? f.offsetX : 0), e), D = Math.min(-c - (f.inset ? f.offsetY : 0), 0), v = Math.max(c + t - (f.inset ? f.offsetY : 0), t), g = `satori_s-${i}-${s}`, y = `satori_ms-${i}-${s}`, b = f.spreadRadius ? r.replace('stroke-width="0"', `stroke-width="${f.spreadRadius * 2}"`) : r;
    l += ue("mask", { id: y, maskUnits: "userSpaceOnUse" }, ue("rect", { x: 0, y: 0, width: a._viewportWidth || "100%", height: a._viewportHeight || "100%", fill: f.inset ? "#000" : "#fff" }) + b.replace('fill="#fff"', f.inset ? 'fill="#fff"' : 'fill="#000"').replace('stroke="#fff"', ""));
    let C = b.replace(/d="([^"]+)"/, (k, S) => 'd="' + c1(S, f.offsetX, f.offsetY) + '"').replace(/x="([^"]+)"/, (k, S) => 'x="' + (parseFloat(S) + f.offsetX) + '"').replace(/y="([^"]+)"/, (k, S) => 'y="' + (parseFloat(S) + f.offsetY) + '"');
    f.spreadRadius && f.spreadRadius < 0 && (l += ue("mask", { id: y + "-neg", maskUnits: "userSpaceOnUse" }, C.replace('stroke="#fff"', 'stroke="#000"').replace(/stroke-width="[^"]+"/, `stroke-width="${-f.spreadRadius * 2}"`))), f.spreadRadius && f.spreadRadius < 0 && (C = ue("g", { mask: `url(#${y}-neg)` }, C)), l += ue("defs", {}, ue("filter", { id: g, x: `${p / e * 100}%`, y: `${D / t * 100}%`, width: `${(d - p) / e * 100}%`, height: `${(v - D) / t * 100}%` }, ue("feGaussianBlur", { stdDeviation: f.blurRadius / 2, result: "b" }) + ue("feFlood", { "flood-color": f.color, in: "SourceGraphic", result: "f" }) + ue("feComposite", { in: "f", in2: "b", operator: f.inset ? "out" : "in" }))) + ue("g", { mask: `url(#${y})`, filter: `url(#${g})`, opacity: n }, C), f.inset ? u += l : o += l;
  }
  return [o, u];
}
__name(h1, "h1");
function d1({ width: e, left: t, top: r, ascender: n, clipPathId: i }, a) {
  let { textDecorationColor: o, textDecorationStyle: u, textDecorationLine: s, fontSize: l, color: f } = a;
  if (!s || s === "none")
    return "";
  let c = Math.max(1, l * 0.1), p = s === "line-through" ? r + n * 0.7 : s === "underline" ? r + n * 1.1 : r, d = u === "dashed" ? `${c * 1.2} ${c * 2}` : u === "dotted" ? `0 ${c * 2}` : void 0;
  return ue("line", { x1: t, y1: p, x2: t + e, y2: p, stroke: o || f, "stroke-width": c, "stroke-dasharray": d, "stroke-linecap": u === "dotted" ? "round" : "square", "clip-path": i ? `url(#${i})` : void 0 });
}
__name(d1, "d1");
function Ma(e) {
  return e = e.replace("U+", "0x"), String.fromCodePoint(Number(e));
}
__name(Ma, "Ma");
var rn = Ma("U+0020");
var Fl = Ma("U+0009");
var Vn = Ma("U+2026");
function v1(e, t, r) {
  let { fontSize: n, letterSpacing: i } = r, a = /* @__PURE__ */ new Map();
  function o(l) {
    if (a.has(l))
      return a.get(l);
    let f = e.measure(l, { fontSize: n, letterSpacing: i });
    return a.set(l, f), f;
  }
  __name(o, "o");
  function u(l) {
    let f = 0;
    for (let c of l)
      t(c) ? f += n : f += o(c);
    return f;
  }
  __name(u, "u");
  function s(l) {
    return u(Pt(l, "grapheme"));
  }
  __name(s, "s");
  return { measureGrapheme: o, measureGraphemeArray: u, measureText: s };
}
__name(v1, "v1");
function g1(e, t, r) {
  let { textTransform: n, whiteSpace: i, wordBreak: a } = t;
  e = m1(e, n, r);
  let { content: o, shouldCollapseTabsAndSpaces: u, allowSoftWrap: s } = b1(e, i), { words: l, requiredBreaks: f, allowBreakWord: c } = y1(o, a), [p, d] = D1(t, s);
  return { words: l, requiredBreaks: f, allowSoftWrap: s, allowBreakWord: c, processedContent: o, shouldCollapseTabsAndSpaces: u, lineLimit: p, blockEllipsis: d };
}
__name(g1, "g1");
function m1(e, t, r) {
  return t === "uppercase" ? e = e.toLocaleUpperCase(r) : t === "lowercase" ? e = e.toLocaleLowerCase(r) : t === "capitalize" && (e = Pt(e, "word", r).map((n) => Pt(n, "grapheme", r).map((i, a) => a === 0 ? i.toLocaleUpperCase(r) : i).join("")).join("")), e;
}
__name(m1, "m1");
function D1(e, t) {
  let { textOverflow: r, lineClamp: n, WebkitLineClamp: i, WebkitBoxOrient: a, overflow: o, display: u } = e;
  if (u === "block" && n) {
    let [s, l = Vn] = x1(n);
    if (s)
      return [s, l];
  }
  return r === "ellipsis" && u === "-webkit-box" && a === "vertical" && Ig(i) && i > 0 ? [i, Vn] : r === "ellipsis" && o === "hidden" && !t ? [1, Vn] : [1 / 0];
}
__name(D1, "D1");
function y1(e, t) {
  let r = ["break-all", "break-word"].includes(t), { words: n, requiredBreaks: i } = Rg(e, t);
  return { words: n, requiredBreaks: i, allowBreakWord: r };
}
__name(y1, "y1");
function b1(e, t) {
  let r = ["pre", "pre-wrap", "pre-line"].includes(t), n = ["normal", "nowrap", "pre-line"].includes(t), i = !["pre", "nowrap"].includes(t);
  return r || (e = e.replace(/\n/g, rn)), n && (e = e.replace(/([ ]|\t)+/g, rn).replace(/^[ ]|[ ]$/g, "")), { content: e, shouldCollapseTabsAndSpaces: n, allowSoftWrap: i };
}
__name(b1, "b1");
function x1(e) {
  if (typeof e == "number")
    return [e];
  let t = /^(\d+)\s*"(.*)"$/, r = /^(\d+)\s*'(.*)'$/, n = t.exec(e), i = r.exec(e);
  if (n) {
    let a = +n[1], o = n[2];
    return [a, o];
  } else if (i) {
    let a = +i[1], o = i[2];
    return [a, o];
  }
  return [];
}
__name(x1, "x1");
var w1 = /* @__PURE__ */ new Set([Fl]);
function E1(e) {
  return w1.has(e);
}
__name(E1, "E1");
async function* F1(e, t) {
  let r = await Kn(), { parentStyle: n, inheritedStyle: i, parent: a, font: o, id: u, isInheritingTransform: s, debug: l, embedFont: f, graphemeImages: c, locale: p, canLoadAdditionalAssets: d } = t, { textAlign: D, lineHeight: v, textWrap: g, fontSize: y, filter: b, tabSize: C = 8, letterSpacing: k, _inheritedBackgroundClipTextPath: S, flexShrink: E } = n, { words: L, requiredBreaks: T, allowSoftWrap: U, allowBreakWord: M, processedContent: H, shouldCollapseTabsAndSpaces: q, lineLimit: ee, blockEllipsis: A } = g1(e, n, p), R = C1(r, D);
  a.insertChild(R, a.getChildCount()), Pg(E) && a.setFlexShrink(1);
  let O = o.getEngine(y, v, n, p), Y = d ? Pt(H, "grapheme").filter((ve) => !E1(ve) && !O.has(ve)) : [];
  yield Y.map((ve) => ({ word: ve, locale: p })), Y.length && (O = o.getEngine(y, v, n, p));
  function Z(ve) {
    return !!(c && c[ve]);
  }
  __name(Z, "Z");
  let { measureGrapheme: te, measureGraphemeArray: ie, measureText: B } = v1(O, Z, { fontSize: y, letterSpacing: k }), z = pl(C) ? Ie(C, y, 1, n) : te(rn) * C, _ = /* @__PURE__ */ __name((ve, Le) => {
    if (ve.length === 0)
      return { originWidth: 0, endingSpacesWidth: 0, text: ve };
    let { index: Ue, tabCount: we } = S1(ve), Ne = 0;
    if (we > 0) {
      let $e = ve.slice(0, Ue), Fe = ve.slice(Ue + we), Ce = B($e), pt = Ce + Le;
      Ne = (z === 0 ? Ce : (Math.floor(pt / z) + we) * z) + B(Fe);
    } else
      Ne = B(ve);
    let Ae = ve.trimEnd() === ve ? Ne : B(ve.trimEnd());
    return { originWidth: Ne, endingSpacesWidth: Ne - Ae, text: ve };
  }, "_"), N = [], ae = [], W = [], fe = [], ce = [];
  function ge(ve) {
    let Le = 0, Ue = 0, we = -1, Ne = 0, Ae = 0, $e = 0, Fe = 0;
    N = [], W = [0], fe = [], ce = [];
    let Ce = 0, pt = 0;
    for (; Ce < L.length && Le < ee; ) {
      let me = L[Ce], Bt = T[Ce], Ke = 0, { originWidth: yt, endingSpacesWidth: rr, text: bt } = _(me, Ae);
      me = bt, Ke = yt;
      let Pe = rr;
      Bt && $e === 0 && ($e = O.height(me));
      let Ye = ",.!?:-@)>]}%#".indexOf(me[0]) < 0, ht = !Ae, wr = Ce && Ye && Ae + Ke > ve + Pe && U;
      if (M && Ke > ve && (!Ae || wr || Bt)) {
        let Qe = Pt(me, "grapheme");
        L.splice(Ce, 1, ...Qe), Ae > 0 && (N.push(Ae - pt), ae.push(Fe), Le++, Ne += $e, Ae = 0, $e = 0, Fe = 0, W.push(1), we = -1), pt = Pe;
        continue;
      }
      if (Bt || wr)
        q && me === rn && (Ke = 0), N.push(Ae - pt), ae.push(Fe), Le++, Ne += $e, Ae = Ke, $e = Ke ? O.height(me) : 0, Fe = Ke ? O.baseline(me) : 0, W.push(1), we = -1, Bt || (Ue = Math.max(Ue, ve));
      else {
        Ae += Ke;
        let Qe = O.height(me);
        Qe > $e && ($e = Qe, Fe = O.baseline(me)), ht && W[W.length - 1]++;
      }
      ht && we++, Ue = Math.max(Ue, Ae);
      let hr = Ae - Ke;
      if (Ke === 0)
        ce.push({ y: Ne, x: hr, width: 0, line: Le, lineIndex: we, isImage: false });
      else {
        let Qe = Pt(me, "word");
        for (let dt = 0; dt < Qe.length; dt++) {
          let Vt = Qe[dt], xt = 0, Nt = false;
          Z(Vt) ? (xt = y, Nt = true) : xt = te(Vt), fe.push(Vt), ce.push({ y: Ne, x: hr, width: xt, line: Le, lineIndex: we, isImage: Nt }), hr += xt;
        }
      }
      Ce++, pt = Pe;
    }
    return Ae && (Le < ee && (Ne += $e), Le++, N.push(Ae), ae.push(Fe)), { width: Ue, height: Ne };
  }
  __name(ge, "ge");
  let pe = { width: 0, height: 0 };
  R.setMeasureFunc((ve) => {
    let { width: Le, height: Ue } = ge(ve);
    if (g === "balance") {
      let Ne = Le / 2, Ae = Le, $e = Le;
      for (; Ne + 1 < Ae; ) {
        $e = (Ne + Ae) / 2;
        let { height: Ce } = ge($e);
        Ce > Ue ? Ne = $e : Ae = $e;
      }
      ge(Ae);
      let Fe = Math.ceil(Ae);
      return pe = { width: Fe, height: Ue }, { width: Fe, height: Ue };
    }
    let we = Math.ceil(Le);
    return pe = { width: we, height: Ue }, { width: we, height: Ue };
  });
  let [xe, _e] = yield, he = "", ye = "", Ge = i._inheritedClipPathId, tt = i._inheritedMaskId, { left: We, top: Be, width: He, height: rt } = R.getComputedLayout(), nt = a.getComputedWidth() - a.getComputedPadding(r.EDGE_LEFT) - a.getComputedPadding(r.EDGE_RIGHT) - a.getComputedBorder(r.EDGE_LEFT) - a.getComputedBorder(r.EDGE_RIGHT), it = xe + We, at = _e + Be, { matrix: Xe, opacity: Ct } = l1({ left: We, top: Be, width: He, height: rt, isInheritingTransform: s }, n), Dt = "";
  if (n.textShadowOffset) {
    let { textShadowColor: ve, textShadowOffset: Le, textShadowRadius: Ue } = n;
    Dt = p1({ width: pe.width, height: pe.height, id: u }, { shadowColor: ve, shadowOffset: Le, shadowRadius: Ue }), Dt = ue("defs", {}, Dt);
  }
  let ft = "", ct = "", zt = "", lt = -1, Ut = {}, qe = null, xr = 0;
  for (let ve = 0; ve < fe.length; ve++) {
    let Le = ce[ve], Ue = ce[ve + 1];
    if (!Le)
      continue;
    let we = fe[ve], Ne = null, Ae = false, $e = c ? c[we] : null, Fe = Le.y, Ce = Le.x, pt = Le.width, me = Le.line;
    if (me === lt)
      continue;
    let Bt = false;
    if (N.length > 1) {
      let Pe = He - N[me];
      if (D === "right" || D === "end")
        Ce += Pe;
      else if (D === "center")
        Ce += Pe / 2;
      else if (D === "justify" && me < N.length - 1) {
        let Ye = W[me], ht = Ye > 1 ? Pe / (Ye - 1) : 0;
        Ce += ht * Le.lineIndex, Bt = true;
      }
    }
    let Ke = ae[me], yt = O.baseline(we), rr = O.height(we), bt = Ke - yt;
    if (Ut[me] || (Ut[me] = [Ce, at + Fe + bt, yt, Bt ? He : N[me]]), ee !== 1 / 0) {
      let Pe = /* @__PURE__ */ __name(function(Qe, dt) {
        let Vt = Pt(dt, "grapheme", p), xt = "", Nt = 0;
        for (let Or of Vt) {
          let pn = Qe + ie([xt + Or]);
          if (xt && pn + ht > nt)
            break;
          xt += Or, Nt = pn;
        }
        return { subset: xt, resolvedWidth: Nt };
      }, "Pe"), Ye = A, ht = te(A);
      ht > nt && (Ye = Vn, ht = te(Ye));
      let wr = te(rn), hr = me < N.length - 1;
      if (me + 1 === ee && (hr || N[me] > nt)) {
        if (Ce + pt + ht + wr > nt) {
          let { subset: Qe, resolvedWidth: dt } = Pe(Ce, we);
          we = Qe + Ye, lt = me, Ut[me][2] = dt, Ae = true;
        } else if (Ue && Ue.line !== me)
          if (D === "center") {
            let { subset: Qe, resolvedWidth: dt } = Pe(Ce, we);
            we = Qe + Ye, lt = me, Ut[me][2] = dt, Ae = true;
          } else {
            let Qe = fe[ve + 1], { subset: dt, resolvedWidth: Vt } = Pe(pt + Ce, Qe);
            we = we + dt + Ye, lt = me, Ut[me][2] = Vt, Ae = true;
          }
      }
    }
    if ($e)
      Fe += 0;
    else if (f) {
      if (!we.includes(Fl) && !Ag.includes(we) && fe[ve + 1] && Ue && !Ue.isImage && Fe === Ue.y && !Ae) {
        qe === null && (xr = Ce), qe = qe === null ? we : qe + we;
        continue;
      }
      let Pe = qe === null ? we : qe + we, Ye = qe === null ? Ce : xr, ht = Le.width + Ce - Ye;
      Ne = O.getSVG(Pe.replace(/(\t)+/g, ""), { fontSize: y, left: it + Ye, top: at + Fe + yt + bt, letterSpacing: k }), qe = null, l && (zt += ue("rect", { x: it + Ye, y: at + Fe + bt, width: ht, height: rr, fill: "transparent", stroke: "#575eff", "stroke-width": 1, transform: Xe || void 0, "clip-path": Ge ? `url(#${Ge})` : void 0 }) + ue("line", { x1: it + Ce, x2: it + Ce + Le.width, y1: at + Fe + bt + yt, y2: at + Fe + bt + yt, stroke: "#14c000", "stroke-width": 1, transform: Xe || void 0, "clip-path": Ge ? `url(#${Ge})` : void 0 }));
    } else
      Fe += yt + bt;
    if (n.textDecorationLine) {
      let Pe = Ut[me];
      Pe && !Pe[4] && (ft += d1({ left: it + Pe[0], top: Pe[1], width: Pe[3], ascender: Pe[2], clipPathId: Ge }, n), Pe[4] = 1);
    }
    if (Ne !== null)
      ct += Ne + " ";
    else {
      let [Pe, Ye] = f1({ content: we, filter: Dt, id: u, left: it + Ce, top: at + Fe, width: pt, height: rr, matrix: Xe, opacity: Ct, image: $e, clipPathId: Ge, debug: l, shape: !!S, decorationShape: ft }, n);
      he += Pe, ye += Ye, ft = "";
    }
    if (Ae)
      break;
  }
  if (ct) {
    let ve = n.color !== "transparent" && Ct !== 0 ? ue("path", { fill: n.color, d: ct, transform: Xe || void 0, opacity: Ct !== 1 ? Ct : void 0, "clip-path": Ge ? `url(#${Ge})` : void 0, mask: tt ? `url(#${tt})` : void 0, style: b ? `filter:${b}` : void 0 }) : "";
    S && (ye = ue("path", { d: ct, transform: Xe || void 0 })), he += (Dt ? Dt + ue("g", { filter: `url(#satori_s-${u})` }, ve + ft) : ve + ft) + zt;
  }
  return ye && (n._inheritedBackgroundClipTextPath.value += ye), he;
}
__name(F1, "F1");
function C1(e, t) {
  let r = e.Node.create();
  return r.setAlignItems(e.ALIGN_BASELINE), r.setJustifyContent(Lt(t, { left: e.JUSTIFY_FLEX_START, right: e.JUSTIFY_FLEX_END, center: e.JUSTIFY_CENTER, justify: e.JUSTIFY_SPACE_BETWEEN, start: e.JUSTIFY_FLEX_START, end: e.JUSTIFY_FLEX_END }, e.JUSTIFY_FLEX_START, "textAlign")), r;
}
__name(C1, "C1");
function S1(e) {
  let t = /(\t)+/.exec(e);
  return t ? { index: t.index, tabCount: t[0].length } : { index: null, tabCount: 0 };
}
__name(S1, "S1");
var Ga = Ga || {};
var mu = { type: "directional", value: "bottom" };
Ga.parse = function() {
  var e = { linearGradient: /^(\-(webkit|o|ms|moz)\-)?(linear\-gradient)/i, repeatingLinearGradient: /^(\-(webkit|o|ms|moz)\-)?(repeating\-linear\-gradient)/i, radialGradient: /^(\-(webkit|o|ms|moz)\-)?(radial\-gradient)/i, repeatingRadialGradient: /^(\-(webkit|o|ms|moz)\-)?(repeating\-radial\-gradient)/i, sideOrCorner: /^to (left (top|bottom)|right (top|bottom)|top (left|right)|bottom (left|right)|left|right|top|bottom)/i, extentKeywords: /^(closest\-side|closest\-corner|farthest\-side|farthest\-corner|contain|cover)/, positionKeywords: /^(left|center|right|top|bottom)/i, pixelValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))px/, percentageValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))\%/, emLikeValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))(r?em|vw|vh)/, angleValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))deg/, zeroValue: /[0]/, startCall: /^\(/, endCall: /^\)/, comma: /^,/, hexColor: /^\#([0-9a-fA-F]+)/, literalColor: /^([a-zA-Z]+)/, rgbColor: /^rgb/i, rgbaColor: /^rgba/i, number: /^(([0-9]*\.[0-9]+)|([0-9]+\.?))/ }, t = "";
  function r(B) {
    var z = new Error(t + ": " + B);
    throw z.source = t, z;
  }
  __name(r, "r");
  function n() {
    var B = i();
    return t.length > 0 && r("Invalid input not EOF"), B;
  }
  __name(n, "n");
  function i() {
    return E(a);
  }
  __name(i, "i");
  function a() {
    return u("linear-gradient", e.linearGradient, l, mu) || u("repeating-linear-gradient", e.repeatingLinearGradient, l, mu) || u("radial-gradient", e.radialGradient, d) || u("repeating-radial-gradient", e.repeatingRadialGradient, d);
  }
  __name(a, "a");
  function o(B = {}) {
    var z, _, N, ae;
    let W = { ...B };
    return Object.assign(W, { style: (W.style || []).length > 0 ? W.style : [{ type: "extent-keyword", value: "farthest-corner" }], at: { type: "position", value: { x: { type: "position-keyword", value: "center", ...((_ = (z = W.at) == null ? void 0 : z.value) == null ? void 0 : _.x) || {} }, y: { type: "position-keyword", value: "center", ...((ae = (N = W.at) == null ? void 0 : N.value) == null ? void 0 : ae.y) || {} } } } }), B.value || Object.assign(W, { type: "shape", value: W.style.some((fe) => ["%", "extent-keyword"].includes(fe.type)) ? "ellipse" : "circle" }), W;
  }
  __name(o, "o");
  function u(B, z, _, N) {
    return s(z, function(ae) {
      var W = _();
      return W ? te(e.comma) || r("Missing comma before color stops") : W = N, { type: B, orientation: B.endsWith("radial-gradient") ? W?.map((fe) => o(fe)) ?? [o()] : W, colorStops: E(L) };
    });
  }
  __name(u, "u");
  function s(B, z) {
    var _ = te(B);
    if (_) {
      te(e.startCall) || r("Missing (");
      var N = z(_);
      return te(e.endCall) || r("Missing )"), N;
    }
  }
  __name(s, "s");
  function l() {
    return f() || c() || p();
  }
  __name(l, "l");
  function f() {
    return Z("directional", e.sideOrCorner, 1);
  }
  __name(f, "f");
  function c() {
    return Z("angular", e.angleValue, 1);
  }
  __name(c, "c");
  function p() {
    return Z("directional", e.zeroValue, 0);
  }
  __name(p, "p");
  function d() {
    var B, z = D(), _;
    return z && (B = [], B.push(z), _ = t, te(e.comma) && (z = D(), z ? B.push(z) : t = _)), B;
  }
  __name(d, "d");
  function D() {
    let B = v(), z = C();
    if (!(!B && !z))
      return { ...B, at: z };
  }
  __name(D, "D");
  function v() {
    let B = g() || y(), z = b() || O() || A(), _ = Z("%", e.percentageValue, 1);
    if (B)
      return { ...B, style: [z, _].filter((N) => N) };
    if (z)
      return { style: [z, _].filter((N) => N), ...g() || y() };
  }
  __name(v, "v");
  function g() {
    return Z("shape", /^(circle)/i, 0);
  }
  __name(g, "g");
  function y() {
    return Z("shape", /^(ellipse)/i, 0);
  }
  __name(y, "y");
  function b() {
    return Z("extent-keyword", e.extentKeywords, 1);
  }
  __name(b, "b");
  function C() {
    if (Z("position", /^at/, 0)) {
      var B = k();
      return B || r("Missing positioning value"), B;
    }
  }
  __name(C, "C");
  function k() {
    var B = S();
    if (B.x || B.y)
      return { type: "position", value: B };
  }
  __name(k, "k");
  function S() {
    return { x: A(), y: A() };
  }
  __name(S, "S");
  function E(B) {
    var z = B(), _ = [];
    if (z)
      for (_.push(z); te(e.comma); )
        z = B(), z ? _.push(z) : r("One extra comma");
    return _;
  }
  __name(E, "E");
  function L() {
    var B = T();
    return B || r("Expected color definition"), B.length = A(), B;
  }
  __name(L, "L");
  function T() {
    return M() || q() || H() || U();
  }
  __name(T, "T");
  function U() {
    return Z("literal", e.literalColor, 0);
  }
  __name(U, "U");
  function M() {
    return Z("hex", e.hexColor, 1);
  }
  __name(M, "M");
  function H() {
    return s(e.rgbColor, function() {
      return { type: "rgb", value: E(ee) };
    });
  }
  __name(H, "H");
  function q() {
    return s(e.rgbaColor, function() {
      return { type: "rgba", value: E(ee) };
    });
  }
  __name(q, "q");
  function ee() {
    return te(e.number)[1];
  }
  __name(ee, "ee");
  function A() {
    return Z("%", e.percentageValue, 1) || R() || O();
  }
  __name(A, "A");
  function R() {
    return Z("position-keyword", e.positionKeywords, 1);
  }
  __name(R, "R");
  function O() {
    return Z("px", e.pixelValue, 1) || Y(e.emLikeValue, 1);
  }
  __name(O, "O");
  function Y(B, z) {
    var _ = te(B);
    if (_)
      return { type: _[5], value: _[z] };
  }
  __name(Y, "Y");
  function Z(B, z, _) {
    var N = te(z);
    if (N)
      return { type: B, value: N[_] };
  }
  __name(Z, "Z");
  function te(B) {
    var z, _;
    return _ = /^[\n\r\t\s]+/.exec(t), _ && ie(_[0].length), z = B.exec(t), z && ie(z[0].length), z;
  }
  __name(te, "te");
  function ie(B) {
    t = t.substr(B);
  }
  __name(ie, "ie");
  return function(B) {
    return t = B.toString(), n();
  };
}();
var Du = Ga;
function k1(e) {
  return e.type === "literal" ? e.value : e.type === "hex" ? `#${e.value}` : e.type === "rgb" ? `rgb(${e.value.join(",")})` : e.type === "rgba" ? `rgba(${e.value.join(",")})` : "transparent";
}
__name(k1, "k1");
function T1(e) {
  let t = 0, r = 0, n = 0, i = 0;
  return e.includes("top") ? r = 1 : e.includes("bottom") && (i = 1), e.includes("left") ? t = 1 : e.includes("right") && (n = 1), !t && !n && !r && !i && (r = 1), [t, r, n, i];
}
__name(T1, "T1");
function _1(e, t) {
  return typeof e == "string" && e.endsWith("%") ? t * parseFloat(e) / 100 : +e;
}
__name(_1, "_1");
function va(e, { x: t, y: r, defaultX: n, defaultY: i }) {
  return (e ? e.split(" ").map((a) => {
    try {
      let o = new Qn(a);
      return o.type === "length" || o.type === "number" ? o.value : o.value + o.unit;
    } catch {
      return null;
    }
  }).filter((a) => a !== null) : [n, i]).map((a, o) => _1(a, [t, r][o]));
}
__name(va, "va");
function yu(e, t, r) {
  let n = [];
  for (let u of t) {
    let s = k1(u);
    if (!n.length && (n.push({ offset: 0, color: s }), typeof u.length > "u" || u.length.value === "0"))
      continue;
    let l = typeof u.length > "u" ? void 0 : u.length.type === "%" ? u.length.value / 100 : u.length.value / e;
    n.push({ offset: l, color: s });
  }
  n.length || n.push({ offset: 0, color: "transparent" });
  let i = n[n.length - 1];
  i.offset !== 1 && (typeof i.offset > "u" ? i.offset = 1 : n.push({ offset: 1, color: i.color }));
  let a = 0, o = 1;
  for (let u = 0; u < n.length; u++)
    if (typeof n[u].offset > "u") {
      for (o < u && (o = u); typeof n[o].offset > "u"; )
        o++;
      n[u].offset = (n[o].offset - n[a].offset) / (o - a) * (u - a) + n[a].offset;
    } else
      a = u;
  return r === "mask" ? n.map((u) => {
    let s = (0, Cl.default)(u.color);
    return s.alpha === 0 ? { ...u, color: "rgba(0, 0, 0, 1)" } : { ...u, color: `rgba(255, 255, 255, ${s.alpha})` };
  }) : n;
}
__name(yu, "yu");
async function Sl({ id: e, width: t, height: r, left: n, top: i }, { image: a, size: o, position: u, repeat: s }, l, f) {
  s = s || "repeat", f = f || "background";
  let c = s === "repeat-x" || s === "repeat", p = s === "repeat-y" || s === "repeat", d = va(o, { x: t, y: r, defaultX: t, defaultY: r }), D = va(u, { x: t, y: r, defaultX: 0, defaultY: 0 });
  if (a.startsWith("linear-gradient(")) {
    let v = Du.parse(a)[0], [g, y] = d, b, C, k, S, E;
    if (v.orientation.type === "directional")
      [b, C, k, S] = T1(v.orientation.value), E = Math.sqrt(Math.pow((k - b) * g, 2) + Math.pow((S - C) * y, 2));
    else if (v.orientation.type === "angular") {
      let H = /* @__PURE__ */ __name(function(ee) {
        if (ee = (ee % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2), Math.abs(ee - Math.PI / 2) < 1e-6) {
          b = 0, C = 0, k = 1, S = 0, E = g;
          return;
        } else if (Math.abs(ee) < 1e-6) {
          b = 0, C = 1, k = 0, S = 0, E = y;
          return;
        }
        if (ee >= Math.PI / 2 && ee < Math.PI) {
          H(Math.PI - ee), C = 1 - C, S = 1 - S;
          return;
        } else if (ee >= Math.PI) {
          H(ee - Math.PI);
          let B = b;
          b = k, k = B, B = C, C = S, S = B;
          return;
        }
        let A = Math.tan(ee), R = A * q, O = Math.atan(R), Y = Math.sqrt(2) * Math.cos(Math.PI / 4 - O);
        b = 0, C = 1, k = Math.sin(O) * Y, S = 1 - Math.cos(O) * Y;
        let Z = 1, te = 1 / A, ie = Math.abs((Z * q + te) / Math.sqrt(Z * Z + te * te) / Math.sqrt(q * q + 1));
        E = Math.sqrt(g * g + y * y) * ie;
      }, "H"), q = g / y;
      H(+v.orientation.value / 180 * Math.PI);
    }
    let L = yu(E, v.colorStops, f), T = `satori_bi${e}`, U = `satori_pattern_${e}`, M = ue("pattern", { id: U, x: D[0] / t, y: D[1] / r, width: c ? g / t : "1", height: p ? y / r : "1", patternUnits: "objectBoundingBox" }, ue("linearGradient", { id: T, x1: b, y1: C, x2: k, y2: S }, L.map((H) => ue("stop", { offset: H.offset * 100 + "%", "stop-color": H.color })).join("")) + ue("rect", { x: 0, y: 0, width: g, height: y, fill: `url(#${T})` }));
    return [U, M];
  }
  if (a.startsWith("radial-gradient(")) {
    let v = Du.parse(a)[0], g = v.orientation[0], [y, b] = d, C = "circle", k = y / 2, S = b / 2;
    if (g.type === "shape") {
      if (C = g.value, g.at)
        if (g.at.type === "position") {
          let q = A1(g.at.value.x, g.at.value.y, y, b, l.fontSize, l);
          k = q.x, S = q.y;
        } else
          throw new Error("orientation.at.type not implemented: " + g.at.type);
    } else
      throw new Error("orientation.type not implemented: " + g.type);
    let E = yu(t, v.colorStops, f), L = `satori_radial_${e}`, T = `satori_pattern_${e}`, U = `satori_mask_${e}`, M = O1(C, g.style, l.fontSize, { x: k, y: S }, [y, b], l), H = ue("pattern", { id: T, x: D[0] / t, y: D[1] / r, width: c ? y / t : "1", height: p ? b / r : "1", patternUnits: "objectBoundingBox" }, ue("radialGradient", { id: L }, E.map((q) => ue("stop", { offset: q.offset, "stop-color": q.color })).join("")) + ue("mask", { id: U }, ue("rect", { x: 0, y: 0, width: y, height: b, fill: "#fff" })) + ue("rect", { x: 0, y: 0, width: y, height: b, fill: E.at(-1).color }) + ue(C, { cx: k, cy: S, width: y, height: b, ...M, fill: `url(#${L})`, mask: `url(#${U})` }));
    return [T, H];
  }
  if (a.startsWith("url(")) {
    let v = va(o, { x: t, y: r, defaultX: 0, defaultY: 0 }), [g, y, b] = await Na(a.slice(4, -1)), C = f === "mask" ? y || v[0] : v[0] || y, k = f === "mask" ? b || v[1] : v[1] || b;
    return [`satori_bi${e}`, ue("pattern", { id: `satori_bi${e}`, patternContentUnits: "userSpaceOnUse", patternUnits: "userSpaceOnUse", x: D[0] + n, y: D[1] + i, width: c ? C : "100%", height: p ? k : "100%" }, ue("image", { x: 0, y: 0, width: C, height: k, preserveAspectRatio: "none", href: g }))];
  }
  throw new Error(`Invalid background image: "${a}"`);
}
__name(Sl, "Sl");
function A1(e, t, r, n, i, a) {
  let o = { x: r / 2, y: n / 2 };
  return e.type === "position-keyword" ? Object.assign(o, bu(e.value, r, n, "x")) : o.x = Ie(`${e.value}${e.type}`, i, r, a, true), t.type === "position-keyword" ? Object.assign(o, bu(t.value, r, n, "y")) : o.y = Ie(`${t.value}${t.type}`, i, n, a, true), o;
}
__name(A1, "A1");
function bu(e, t, r, n) {
  switch (e) {
    case "center":
      return { [n]: n === "x" ? t / 2 : r / 2 };
    case "left":
      return { x: 0 };
    case "top":
      return { y: 0 };
    case "right":
      return { x: t };
    case "bottom":
      return { y: r };
  }
}
__name(bu, "bu");
function O1(e, t, r, n, i, a) {
  let [o, u] = i, { x: s, y: l } = n, f = {}, c = 0, p = 0;
  if (!t.some((d) => d.type === "extent-keyword")) {
    if (t.some((d) => d.value.startsWith("-")))
      throw new Error("disallow setting negative values to the size of the shape. Check https://w3c.github.io/csswg-drafts/css-images/#valdef-rg-size-length-0");
    return e === "circle" ? { r: Ie(`${t[0].value}${t[0].type}`, r, o, a, true) } : { rx: Ie(`${t[0].value}${t[0].type}`, r, o, a, true), ry: Ie(`${t[1].value}${t[1].type}`, r, u, a, true) };
  }
  switch (t[0].value) {
    case "farthest-corner":
      c = Math.max(Math.abs(o - s), Math.abs(s)), p = Math.max(Math.abs(u - l), Math.abs(l));
      break;
    case "closest-corner":
      c = Math.min(Math.abs(o - s), Math.abs(s)), p = Math.min(Math.abs(u - l), Math.abs(l));
      break;
    case "farthest-side":
      return e === "circle" ? f.r = Math.max(Math.abs(o - s), Math.abs(s), Math.abs(u - l), Math.abs(l)) : (f.rx = Math.max(Math.abs(o - s), Math.abs(s)), f.ry = Math.max(Math.abs(u - l), Math.abs(l))), f;
    case "closest-side":
      return e === "circle" ? f.r = Math.min(Math.abs(o - s), Math.abs(s), Math.abs(u - l), Math.abs(l)) : (f.rx = Math.min(Math.abs(o - s), Math.abs(s)), f.ry = Math.min(Math.abs(u - l), Math.abs(l))), f;
  }
  if (e === "circle")
    f.r = Math.sqrt(c * c + p * p);
  else {
    let d = p !== 0 ? c / p : 1;
    c === 0 ? (f.rx = 0, f.ry = 0) : (f.ry = Math.sqrt(c * c + p * p * d * d) / d, f.rx = f.ry * d);
  }
  return f;
}
__name(O1, "O1");
function L1([e, t]) {
  return Math.round(e * 1e3) === 0 && Math.round(t * 1e3) === 0 ? 0 : Math.round(e * t / Math.sqrt(e * e + t * t) * 1e3) / 1e3;
}
__name(L1, "L1");
function Rn(e, t, r) {
  return r < e + t && (r / 2 < e && r / 2 < t ? e = t = r / 2 : r / 2 < e ? e = r - t : r / 2 < t && (t = r - e)), [e, t];
}
__name(Rn, "Rn");
function Un(e) {
  e[0] = e[1] = Math.min(e[0], e[1]);
}
__name(Un, "Un");
function Bn(e, t, r, n, i) {
  if (typeof e == "string") {
    let a = e.split(" ").map((u) => u.trim()), o = !a[1] && !a[0].endsWith("%");
    return a[1] = a[1] || a[0], [o, [Math.min(Ie(a[0], n, t, i, true), t), Math.min(Ie(a[1], n, r, i, true), r)]];
  }
  return typeof e == "number" ? [true, [Math.min(e, t), Math.min(e, r)]] : [true, void 0];
}
__name(Bn, "Bn");
var Nn = /* @__PURE__ */ __name((e) => e && e[0] !== 0 && e[1] !== 0, "Nn");
function qn({ left: e, top: t, width: r, height: n }, i, a) {
  let { borderTopLeftRadius: o, borderTopRightRadius: u, borderBottomLeftRadius: s, borderBottomRightRadius: l, fontSize: f } = i, c, p, d, D;
  if ([c, o] = Bn(o, r, n, f, i), [p, u] = Bn(u, r, n, f, i), [d, s] = Bn(s, r, n, f, i), [D, l] = Bn(l, r, n, f, i), !a && !Nn(o) && !Nn(u) && !Nn(s) && !Nn(l))
    return "";
  o ||= [0, 0], u ||= [0, 0], s ||= [0, 0], l ||= [0, 0], [o[0], u[0]] = Rn(o[0], u[0], r), [s[0], l[0]] = Rn(s[0], l[0], r), [o[1], s[1]] = Rn(o[1], s[1], n), [u[1], l[1]] = Rn(u[1], l[1], n), c && Un(o), p && Un(u), d && Un(s), D && Un(l);
  let v = [];
  v[0] = [u, u], v[1] = [l, [-l[0], l[1]]], v[2] = [s, [-s[0], -s[1]]], v[3] = [o, [o[0], -o[1]]];
  let g = `h${r - o[0] - u[0]} a${v[0][0]} 0 0 1 ${v[0][1]}`, y = `v${n - u[1] - l[1]} a${v[1][0]} 0 0 1 ${v[1][1]}`, b = `h${l[0] + s[0] - r} a${v[2][0]} 0 0 1 ${v[2][1]}`, C = `v${s[1] + o[1] - n} a${v[3][0]} 0 0 1 ${v[3][1]}`;
  if (a) {
    let k = /* @__PURE__ */ __name(function(q) {
      let ee = L1([o, u, l, s][q]);
      return q === 0 ? [[e + o[0] - ee, t + o[1] - ee], [e + o[0], t]] : q === 1 ? [[e + r - u[0] + ee, t + u[1] - ee], [e + r, t + u[1]]] : q === 2 ? [[e + r - l[0] + ee, t + n - l[1] + ee], [e + r - l[0], t + n]] : [[e + s[0] - ee, t + n - s[1] + ee], [e, t + n - s[1]]];
    }, "k"), S = a.indexOf(false);
    if (!a.includes(true))
      throw new Error("Invalid `partialSides`.");
    if (S === -1)
      S = 0;
    else
      for (; !a[S]; )
        S = (S + 1) % 4;
    let E = "", L = k(S), T = `M${L[0]} A${v[(S + 3) % 4][0]} 0 0 1 ${L[1]}`, U = 0;
    for (; U < 4 && a[(S + U) % 4]; U++)
      E += T + " ", T = [g, y, b, C][(S + U) % 4];
    let M = (S + U) % 4;
    E += T.split(" ")[0];
    let H = k(M);
    return E += ` A${v[(M + 3) % 4][0]} 0 0 1 ${H[0]}`, E;
  }
  return `M${e + o[0]},${t} ${g} ${y} ${b} ${C}`;
}
__name(qn, "qn");
function xu(e, t, r) {
  return r[e + "Width"] === r[t + "Width"] && r[e + "Style"] === r[t + "Style"] && r[e + "Color"] === r[t + "Color"];
}
__name(xu, "xu");
function I1({ id: e, currentClipPathId: t, borderPath: r, borderType: n, left: i, top: a, width: o, height: u }, s) {
  if (!(s.borderTopWidth || s.borderRightWidth || s.borderBottomWidth || s.borderLeftWidth))
    return null;
  let l = `satori_bc-${e}`;
  return [ue("clipPath", { id: l, "clip-path": t ? `url(#${t})` : void 0 }, ue(n, { x: i, y: a, width: o, height: u, d: r || void 0 })), l];
}
__name(I1, "I1");
function kl({ left: e, top: t, width: r, height: n, props: i, asContentMask: a, maskBorderOnly: o }, u) {
  let s = ["borderTop", "borderRight", "borderBottom", "borderLeft"];
  if (!a && !s.some((d) => u[d + "Width"]))
    return "";
  let l = "", f = 0;
  for (; f > 0 && xu(s[f], s[(f + 3) % 4], u); )
    f = (f + 3) % 4;
  let c = [false, false, false, false], p = [];
  for (let d = 0; d < 4; d++) {
    let D = (f + d) % 4, v = (f + d + 1) % 4, g = s[D], y = s[v];
    if (c[D] = true, p = [u[g + "Width"], u[g + "Style"], u[g + "Color"], g], !xu(g, y, u)) {
      let b = (p[0] || 0) + (a && !o && u[g.replace("border", "padding")] || 0);
      b && (l += ue("path", { width: r, height: n, ...i, fill: "none", stroke: a ? "#000" : p[2], "stroke-width": b * 2, "stroke-dasharray": !a && p[1] === "dashed" ? b * 2 + " " + b : void 0, d: qn({ left: e, top: t, width: r, height: n }, u, c) })), c = [false, false, false, false];
    }
  }
  if (c.some(Boolean)) {
    let d = (p[0] || 0) + (a && !o && u[p[3].replace("border", "padding")] || 0);
    d && (l += ue("path", { width: r, height: n, ...i, fill: "none", stroke: a ? "#000" : p[2], "stroke-width": d * 2, "stroke-dasharray": !a && p[1] === "dashed" ? d * 2 + " " + d : void 0, d: qn({ left: e, top: t, width: r, height: n }, u, c) }));
  }
  return l;
}
__name(kl, "kl");
function P1({ id: e, left: t, top: r, width: n, height: i, matrix: a, borderOnly: o }, u) {
  let s = (u.borderLeftWidth || 0) + (o ? 0 : u.paddingLeft || 0), l = (u.borderTopWidth || 0) + (o ? 0 : u.paddingTop || 0), f = (u.borderRightWidth || 0) + (o ? 0 : u.paddingRight || 0), c = (u.borderBottomWidth || 0) + (o ? 0 : u.paddingBottom || 0), p = { x: t + s, y: r + l, width: n - s - f, height: i - l - c };
  return ue("mask", { id: e }, ue("rect", { ...p, fill: "#fff", mask: u._inheritedMaskId ? `url(#${u._inheritedMaskId})` : void 0 }) + kl({ left: t, top: r, width: n, height: i, props: { transform: a || void 0 }, asContentMask: true, maskBorderOnly: o }, u));
}
__name(P1, "P1");
var Zr = { circle: /circle\((.+)\)/, ellipse: /ellipse\((.+)\)/, path: /path\((.+)\)/, polygon: /polygon\((.+)\)/, inset: /inset\((.+)\)/ };
function R1({ width: e, height: t }, r, n) {
  function i(l) {
    let f = l.match(Zr.circle);
    if (!f)
      return null;
    let [, c] = f, [p, d = ""] = c.split("at").map((g) => g.trim()), { x: D, y: v } = Eu(d, e, t);
    return { type: "circle", r: Ie(p, n.fontSize, Math.sqrt(Math.pow(e, 2) + Math.pow(t, 2)) / Math.sqrt(2), n, true), cx: Ie(D, n.fontSize, e, n, true), cy: Ie(v, n.fontSize, t, n, true) };
  }
  __name(i, "i");
  function a(l) {
    let f = l.match(Zr.ellipse);
    if (!f)
      return null;
    let [, c] = f, [p, d = ""] = c.split("at").map((b) => b.trim()), [D, v] = p.split(" "), { x: g, y } = Eu(d, e, t);
    return { type: "ellipse", rx: Ie(D || "50%", n.fontSize, e, n, true), ry: Ie(v || "50%", n.fontSize, t, n, true), cx: Ie(g, n.fontSize, e, n, true), cy: Ie(y, n.fontSize, t, n, true) };
  }
  __name(a, "a");
  function o(l) {
    let f = l.match(Zr.path);
    if (!f)
      return null;
    let [c, p] = wu(f[1]);
    return { type: "path", d: p, "fill-rule": c };
  }
  __name(o, "o");
  function u(l) {
    let f = l.match(Zr.polygon);
    if (!f)
      return null;
    let [c, p] = wu(f[1]);
    return { type: "polygon", "fill-rule": c, points: p.split(",").map((d) => d.split(" ").map((D, v) => Ie(D, n.fontSize, v === 0 ? e : t, n, true)).join(" ")).join(",") };
  }
  __name(u, "u");
  function s(l) {
    let f = l.match(Zr.inset);
    if (!f)
      return null;
    let [c, p] = (f[1].includes("round") ? f[1] : `${f[1].trim()} round 0`).split("round"), d = (0, Ca.getStylesForProperty)("borderRadius", p, true), D = Object.values(d).map((k) => String(k)).map((k, S) => Ie(k, n.fontSize, S === 0 || S === 2 ? t : e, n, true) || 0), v = Object.values((0, Ca.getStylesForProperty)("margin", c, true)).map((k) => String(k)).map((k, S) => Ie(k, n.fontSize, S === 0 || S === 2 ? t : e, n, true) || 0), g = v[3], y = v[0], b = e - (v[1] + v[3]), C = t - (v[0] + v[2]);
    return D.some((k) => k > 0) ? { type: "path", d: qn({ left: g, top: y, width: b, height: C }, { ...r, ...d }) } : { type: "rect", x: g, y, width: b, height: C };
  }
  __name(s, "s");
  return { parseCircle: i, parseEllipse: a, parsePath: o, parsePolygon: u, parseInset: s };
}
__name(R1, "R1");
function wu(e) {
  let [, t = "nonzero", r] = e.replace(/('|")/g, "").match(/^(nonzero|evenodd)?,?(.+)/) || [];
  return [t, r];
}
__name(wu, "wu");
function Eu(e, t, r) {
  let n = e.split(" "), i = { x: n[0] || "50%", y: n[1] || "50%" };
  return n.forEach((a) => {
    a === "top" ? i.y = 0 : a === "bottom" ? i.y = r : a === "left" ? i.x = 0 : a === "right" ? i.x = t : a === "center" && (i.x = t / 2, i.y = r / 2);
  }), i;
}
__name(Eu, "Eu");
function Wa(e) {
  return `satori_cp-${e}`;
}
__name(Wa, "Wa");
function U1(e) {
  return `url(#${Wa(e)})`;
}
__name(U1, "U1");
function B1(e, t, r) {
  if (t.clipPath === "none")
    return "";
  let n = R1(e, t, r), i = t.clipPath, a = { type: "" };
  for (let o of Object.keys(n))
    if (a = n[o](i), a)
      break;
  if (a) {
    let { type: o, ...u } = a;
    return ue("clipPath", { id: Wa(e.id), "clip-path": e.currentClipPath, transform: `translate(${e.left}, ${e.top})` }, ue(o, u));
  }
  return "";
}
__name(B1, "B1");
function N1({ left: e, top: t, width: r, height: n, path: i, matrix: a, id: o, currentClipPath: u, src: s }, l, f) {
  let c = "", p = l.clipPath && l.clipPath !== "none" ? B1({ left: e, top: t, width: r, height: n, path: i, id: o, matrix: a, currentClipPath: u, src: s }, l, f) : "";
  if (l.overflow !== "hidden" && !s)
    c = "";
  else {
    let D = p ? `satori_ocp-${o}` : Wa(o);
    c = ue("clipPath", { id: D, "clip-path": u }, ue(i ? "path" : "rect", { x: e, y: t, width: r, height: n, d: i || void 0 }));
  }
  let d = P1({ id: `satori_om-${o}`, left: e, top: t, width: r, height: n, matrix: a, borderOnly: !s }, l);
  return p + c + d;
}
__name(N1, "N1");
var M1 = /* @__PURE__ */ __name((e) => `satori_mi-${e}`, "M1");
async function G1(e, t, r) {
  if (!t.maskImage)
    return ["", ""];
  let { left: n, top: i, width: a, height: o, id: u } = e, s = t.maskImage, l = s.length;
  if (!l)
    return ["", ""];
  let f = M1(u), c = "";
  for (let p = 0; p < l; p++) {
    let d = s[p], [D, v] = await Sl({ id: `${f}-${p}`, left: n, top: i, width: a, height: o }, d, r, "mask");
    c += v + ue("rect", { x: 0, y: 0, width: a, height: o, fill: `url(#${D})` });
  }
  return c = ue("mask", { id: f }, c), [f, c];
}
__name(G1, "G1");
async function ga({ id: e, left: t, top: r, width: n, height: i, isInheritingTransform: a, src: o, debug: u }, s, l) {
  if (s.display === "none")
    return "";
  let f = !!o, c = "rect", p = "", d = "", D = [], v = 1, g = "";
  s.backgroundColor && D.push(s.backgroundColor), s.opacity !== void 0 && (v = +s.opacity), s.transform && (p = El({ left: t, top: r, width: n, height: i }, s.transform, a, s.transformOrigin));
  let y = "";
  if (s.backgroundImage) {
    let A = [];
    for (let R = 0; R < s.backgroundImage.length; R++) {
      let O = s.backgroundImage[R], Y = await Sl({ id: e + "_" + R, width: n, height: i, left: t, top: r }, O, l);
      Y && A.unshift(Y);
    }
    for (let R of A)
      D.push(`url(#${R[0]})`), d += R[1], R[2] && (y += R[2]);
  }
  let [b, C] = await G1({ id: e, left: t, top: r, width: n, height: i }, s, l);
  d += C;
  let k = b ? `url(#${b})` : s._inheritedMaskId ? `url(#${s._inheritedMaskId})` : void 0, S = qn({ left: t, top: r, width: n, height: i }, s);
  S && (c = "path");
  let E = s._inheritedClipPathId;
  u && (g = ue("rect", { x: t, y: r, width: n, height: i, fill: "transparent", stroke: "#ff5757", "stroke-width": 1, transform: p || void 0, "clip-path": E ? `url(#${E})` : void 0 }));
  let { backgroundClip: L, filter: T } = s, U = L === "text" ? `url(#satori_bct-${e})` : E ? `url(#${E})` : s.clipPath ? U1(e) : void 0, M = N1({ left: t, top: r, width: n, height: i, path: S, id: e, matrix: p, currentClipPath: U, src: o }, s, l), H = D.map((A) => ue(c, { x: t, y: r, width: n, height: i, fill: A, d: S || void 0, transform: p || void 0, "clip-path": U, style: T ? `filter:${T}` : void 0, mask: k })).join(""), q = I1({ id: e, left: t, top: r, width: n, height: i, currentClipPathId: E, borderPath: S, borderType: c }, s);
  if (f) {
    let A = (s.borderLeftWidth || 0) + (s.paddingLeft || 0), R = (s.borderTopWidth || 0) + (s.paddingTop || 0), O = (s.borderRightWidth || 0) + (s.paddingRight || 0), Y = (s.borderBottomWidth || 0) + (s.paddingBottom || 0), Z = s.objectFit === "contain" ? "xMidYMid" : s.objectFit === "cover" ? "xMidYMid slice" : "none";
    H += ue("image", { x: t + A, y: r + R, width: n - A - O, height: i - R - Y, href: o, preserveAspectRatio: Z, transform: p || void 0, style: T ? `filter:${T}` : void 0, "clip-path": `url(#satori_cp-${e})`, mask: b ? `url(#${b})` : `url(#satori_om-${e})` });
  }
  if (q) {
    d += q[0];
    let A = q[1];
    H += kl({ left: t, top: r, width: n, height: i, props: { transform: p || void 0, "clip-path": `url(#${A})` } }, s);
  }
  let ee = h1({ width: n, height: i, id: e, opacity: v, shape: ue(c, { x: t, y: r, width: n, height: i, fill: "#fff", stroke: "#fff", "stroke-width": 0, d: S || void 0, transform: p || void 0, "clip-path": U, mask: k }) }, s);
  return (d ? ue("defs", {}, d) : "") + (ee ? ee[0] : "") + M + (v !== 1 ? `<g opacity="${v}">` : "") + (y || H) + (v !== 1 ? "</g>" : "") + (ee ? ee[1] : "") + g;
}
__name(ga, "ga");
var W1 = /* @__PURE__ */ __name(() => /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26F9(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC3\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC08\uDC26](?:\u200D\u2B1B)?|[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE])))?))?|\uDC6F(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDD75(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC2\uDECE-\uDEDB\uDEE0-\uDEE8]|\uDD3C(?:\u200D[\u2640\u2642]\uFE0F?|\uD83C[\uDFFB-\uDFFF])?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83E\uDDD1))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF-\uDDB3\uDDBC\uDDBD]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g, "W1");
var $1 = new RegExp(W1(), "");
var Sa = { emoji: $1, symbol: /\p{Symbol}/u, math: /\p{Math}/u };
var ka = { "ja-JP": /\p{scx=Hira}|\p{scx=Kana}|\p{scx=Han}|[\u3000]|[\uFF00-\uFFEF]/u, "ko-KR": /\p{scx=Hangul}/u, "zh-CN": /\p{scx=Han}/u, "zh-TW": /\p{scx=Han}/u, "zh-HK": /\p{scx=Han}/u, "th-TH": /\p{scx=Thai}/u, "bn-IN": /\p{scx=Bengali}/u, "ar-AR": /\p{scx=Arabic}/u, "ta-IN": /\p{scx=Tamil}/u, "ml-IN": /\p{scx=Malayalam}/u, "he-IL": /\p{scx=Hebrew}/u, "te-IN": /\p{scx=Telugu}/u, devanagari: /\p{scx=Devanagari}/u, kannada: /\p{scx=Kannada}/u };
var $a = Object.keys({ ...ka, ...Sa });
function j1(e) {
  return $a.includes(e);
}
__name(j1, "j1");
function z1(e, t) {
  for (let n of Object.keys(Sa))
    if (Sa[n].test(e))
      return [n];
  let r = Object.keys(ka).filter((n) => ka[n].test(e));
  if (r.length === 0)
    return ["unknown"];
  if (t) {
    let n = r.findIndex((i) => i === t);
    n !== -1 && (r.splice(n, 1), r.unshift(t));
  }
  return r;
}
__name(z1, "z1");
function V1(e) {
  if (e)
    return $a.find((t) => t.toLowerCase().startsWith(e.toLowerCase()));
}
__name(V1, "V1");
async function* Ta(e, t) {
  var r;
  let n = await Kn(), { id: i, inheritedStyle: a, parent: o, font: u, debug: s, locale: l, embedFont: f = true, graphemeImages: c, canLoadAdditionalAssets: p, getTwStyles: d } = t;
  if (e === null || typeof e > "u")
    return yield, yield, "";
  if (!jn(e) || typeof e.type == "function") {
    let N;
    if (!jn(e))
      N = F1(String(e), t), yield (await N.next()).value;
    else {
      if (kg(e.type))
        throw new Error("Class component is not supported.");
      N = Ta(e.type(e.props), t), yield (await N.next()).value;
    }
    await N.next();
    let ae = yield;
    return (await N.next(ae)).value;
  }
  let { type: D, props: v } = e;
  if (v && Tg(v))
    throw new Error("dangerouslySetInnerHTML property is not supported. See documentation for more information https://github.com/vercel/satori#jsx.");
  let { style: g, children: y, tw: b, lang: C = l } = v || {}, k = V1(C);
  if (b) {
    let N = d(b, g);
    g = Object.assign(N, g);
  }
  let S = n.Node.create();
  o.insertChild(S, o.getChildCount());
  let [E, L] = await s1(S, D, a, g, v), T = E.transform === a.transform;
  if (T || (E.transform.__parent = a.transform), (E.overflow === "hidden" || E.clipPath && E.clipPath !== "none") && (L._inheritedClipPathId = `satori_cp-${i}`, L._inheritedMaskId = `satori_om-${i}`), E.maskImage && (L._inheritedMaskId = `satori_mi-${i}`), E.backgroundClip === "text") {
    let N = { value: "" };
    L._inheritedBackgroundClipTextPath = N, E._inheritedBackgroundClipTextPath = N;
  }
  let U = _g(y), M = [], H = 0, q = [];
  for (let N of U) {
    let ae = Ta(N, { id: i + "-" + H++, parentStyle: E, inheritedStyle: L, isInheritingTransform: true, parent: S, font: u, embedFont: f, debug: s, graphemeImages: c, canLoadAdditionalAssets: p, locale: k, getTwStyles: d, onNodeDetected: t.onNodeDetected });
    p ? q.push(...(await ae.next()).value || []) : await ae.next(), M.push(ae);
  }
  yield q;
  for (let N of M)
    await N.next();
  let [ee, A] = yield, { left: R, top: O, width: Y, height: Z } = S.getComputedLayout();
  R += ee, O += A;
  let te = "", ie = "", B = "", { children: z, ..._ } = v;
  if ((r = t.onNodeDetected) == null || r.call(t, { left: R, top: O, width: Y, height: Z, type: D, props: _, key: e.key, textContent: jn(z) ? void 0 : z }), D === "img") {
    let N = E.__src;
    ie = await ga({ id: i, left: R, top: O, width: Y, height: Z, src: N, isInheritingTransform: T, debug: s }, E, L);
  } else if (D === "svg") {
    let N = E.color, ae = await Hg(e, N);
    ie = await ga({ id: i, left: R, top: O, width: Y, height: Z, src: ae, isInheritingTransform: T, debug: s }, E, L);
  } else {
    let N = g?.display;
    if (D === "div" && y && typeof y != "string" && N !== "flex" && N !== "none")
      throw new Error('Expected <div> to have explicit "display: flex" or "display: none" if it has more than one child node.');
    ie = await ga({ id: i, left: R, top: O, width: Y, height: Z, isInheritingTransform: T, debug: s }, E, L);
  }
  for (let N of M)
    te += (await N.next([R, O])).value;
  return E._inheritedBackgroundClipTextPath && (B += ue("clipPath", { id: `satori_bct-${i}`, "clip-path": E._inheritedClipPathId ? `url(#${E._inheritedClipPathId})` : void 0 }, E._inheritedBackgroundClipTextPath.value)), B + ie + te;
}
__name(Ta, "Ta");
var Tl = "unknown";
function H1(e, t, [r, n], [i, a]) {
  if (r !== i)
    return r ? !i || r === e ? -1 : i === e ? 1 : e === 400 && r === 500 || e === 500 && r === 400 ? -1 : e === 400 && i === 500 || e === 500 && i === 400 ? 1 : e < 400 ? r < e && i < e ? i - r : r < e ? -1 : i < e ? 1 : r - i : e < r && e < i ? r - i : e < r ? -1 : e < i ? 1 : i - r : 1;
  if (n !== a) {
    if (n === t)
      return -1;
    if (a === t)
      return 1;
  }
  return -1;
}
__name(H1, "H1");
var X1 = /* @__PURE__ */ __name(class {
  defaultFont;
  fonts = /* @__PURE__ */ new Map();
  constructor(e) {
    this.addFonts(e);
  }
  get({ name: e, weight: t, style: r }) {
    if (!this.fonts.has(e))
      return null;
    t === "normal" && (t = 400), t === "bold" && (t = 700), typeof t == "string" && (t = Number.parseInt(t, 10));
    let n = [...this.fonts.get(e)], i = n[0];
    for (let a = 1; a < n.length; a++) {
      let [, o, u] = i, [, s, l] = n[a];
      H1(t, r, [o, u], [s, l]) > 0 && (i = n[a]);
    }
    return i[0];
  }
  addFonts(e) {
    for (let t of e) {
      let { name: r, data: n, lang: i } = t;
      if (i && !j1(i))
        throw new Error(`Invalid value for props \`lang\`: "${i}". The value must be one of the following: ${$a.join(", ")}.`);
      let a = i ?? Tl, o = Ln.parse("buffer" in n ? n.buffer.slice(n.byteOffset, n.byteOffset + n.byteLength) : n, { lowMemory: true }), u = o.charToGlyphIndex;
      o.charToGlyphIndex = (l) => {
        let f = u.call(o, l);
        return f === 0 && o._trackBrokenChars && o._trackBrokenChars.push(l), f;
      }, this.defaultFont || (this.defaultFont = o);
      let s = `${r.toLowerCase()}_${a}`;
      this.fonts.has(s) || this.fonts.set(s, []), this.fonts.get(s).push([o, t.weight, t.style]);
    }
  }
  getEngine(e = 16, t = 1.2, { fontFamily: r = "sans-serif", fontWeight: n = 400, fontStyle: i = "normal" }, a) {
    if (!this.fonts.size)
      throw new Error("No fonts are loaded. At least one font is required to calculate the layout.");
    r = (Array.isArray(r) ? r : [r]).map((y) => y.toLowerCase());
    let o = [];
    r.forEach((y) => {
      let b = this.get({ name: y, weight: n, style: i });
      if (b) {
        o.push(b);
        return;
      }
      let C = this.get({ name: y + "_unknown", weight: n, style: i });
      if (C) {
        o.push(C);
        return;
      }
    });
    let u = Array.from(this.fonts.keys()), s = [], l = [], f = [];
    for (let y of u)
      if (!r.includes(y))
        if (a) {
          let b = q1(y);
          b ? b === a ? s.push(this.get({ name: y, weight: n, style: i })) : l.push(this.get({ name: y, weight: n, style: i })) : f.push(this.get({ name: y, weight: n, style: i }));
        } else
          f.push(this.get({ name: y, weight: n, style: i }));
    let c = /* @__PURE__ */ new Map(), p = /* @__PURE__ */ __name((y, b = true) => {
      let C = [...o, ...f, ...s, ...b ? l : []];
      if (typeof y > "u")
        return b ? C[C.length - 1] : void 0;
      let k = y.charCodeAt(0);
      if (c.has(k))
        return c.get(k);
      let S = C.find((E, L) => !!E.charToGlyphIndex(y) || b && L === C.length - 1);
      return S && c.set(k, S), S;
    }, "p"), d = /* @__PURE__ */ __name((y, b = false) => {
      var C, k;
      return ((b ? (k = (C = y.tables) == null ? void 0 : C.os2) == null ? void 0 : k.sTypoAscender : 0) || y.ascender) / y.unitsPerEm * e;
    }, "d"), D = /* @__PURE__ */ __name((y, b = false) => {
      var C, k;
      return ((b ? (k = (C = y.tables) == null ? void 0 : C.os2) == null ? void 0 : k.sTypoDescender : 0) || y.descender) / y.unitsPerEm * e;
    }, "D"), v = /* @__PURE__ */ __name((y) => p(y, false), "v"), g = { has: (y) => {
      if (y === `
`)
        return true;
      let b = v(y);
      return b ? (b._trackBrokenChars = [], b.stringToGlyphs(y), b._trackBrokenChars.length ? (b._trackBrokenChars = void 0, false) : true) : false;
    }, baseline: (y, b = typeof y > "u" ? o[0] : p(y)) => {
      let C = d(b, true), k = D(b, true), S = g.height(y, b), { yMax: E, yMin: L } = b.tables.head, T = C - k, U = (E / (E - L) - 1) * T;
      return S * ((1.2 / t + 1) / 2) + U;
    }, height: (y, b = typeof y > "u" ? o[0] : p(y)) => (d(b) - D(b)) * (t / 1.2), measure: (y, b) => this.measure(p, y, b), getSVG: (y, b) => this.getSVG(p, y, b) };
    return g;
  }
  patchFontFallbackResolver(e, t) {
    let r = [];
    e._trackBrokenChars = r;
    let n = e.stringToGlyphs;
    return e.stringToGlyphs = (i, ...a) => {
      let o = n.call(e, i, ...a);
      for (let u = 0; u < o.length; u++)
        if (o[u].unicode === void 0) {
          let s = r.shift(), l = t(s);
          if (l !== e) {
            let f = l.charToGlyph(s), c = e.unitsPerEm / l.unitsPerEm, p = new Ln.Path();
            p.unitsPerEm = e.unitsPerEm, p.commands = f.path.commands.map((D) => {
              let v = { ...D };
              for (let g in v)
                typeof v[g] == "number" && (v[g] *= c);
              return v;
            });
            let d = new Ln.Glyph({ ...f, advanceWidth: f.advanceWidth * c, xMin: f.xMin * c, xMax: f.xMax * c, yMin: f.yMin * c, yMax: f.yMax * c, path: p });
            o[u] = d;
          }
        }
      return o;
    }, () => {
      e.stringToGlyphs = n, e._trackBrokenChars = void 0;
    };
  }
  measure(e, t, { fontSize: r, letterSpacing: n = 0 }) {
    let i = e(t), a = this.patchFontFallbackResolver(i, e);
    try {
      return i.getAdvanceWidth(t, r, { letterSpacing: n / r });
    } finally {
      a();
    }
  }
  getSVG(e, t, { fontSize: r, top: n, left: i, letterSpacing: a = 0 }) {
    let o = e(t), u = this.patchFontFallbackResolver(o, e);
    try {
      return r === 0 ? "" : o.getPath(t.replace(/\n/g, ""), i, n, r, { letterSpacing: a / r }).toPathData(1);
    } finally {
      u();
    }
  }
}, "X1");
function q1(e) {
  let t = e.split("_"), r = t[t.length - 1];
  return r === Tl ? void 0 : r;
}
__name(q1, "q1");
function Y1({ width: e, height: t, content: r }) {
  return ue("svg", { width: e, height: t, viewBox: `0 0 ${e} ${t}`, xmlns: "http://www.w3.org/2000/svg" }, r);
}
__name(Y1, "Y1");
var Z1 = Iv(vg());
var J1 = ["ios", "android", "windows", "macos", "web"];
function K1(e) {
  return J1.includes(e);
}
__name(K1, "K1");
var Q1 = ["portrait", "landscape"];
function em(e) {
  return Q1.includes(e);
}
__name(em, "em");
var Fu;
(function(e) {
  e.fontSize = "fontSize", e.lineHeight = "lineHeight";
})(Fu || (Fu = {}));
var Re;
(function(e) {
  e.rem = "rem", e.em = "em", e.px = "px", e.percent = "%", e.vw = "vw", e.vh = "vh", e.none = "<no-css-unit>";
})(Re || (Re = {}));
function Cu(e) {
  return typeof e == "string";
}
__name(Cu, "Cu");
function Su(e) {
  return typeof e == "object";
}
__name(Su, "Su");
var ma;
function V(e) {
  return { kind: "complete", style: e };
}
__name(V, "V");
function Ft(e, t = {}) {
  let { fractions: r } = t;
  if (r && e.includes("/")) {
    let [a = "", o = ""] = e.split("/", 2), u = Ft(a), s = Ft(o);
    return !u || !s ? null : [u[0] / s[0], s[1]];
  }
  let n = parseFloat(e);
  if (Number.isNaN(n))
    return null;
  let i = e.match(/(([a-z]{2,}|%))$/);
  if (!i)
    return [n, Re.none];
  switch (i?.[1]) {
    case "rem":
      return [n, Re.rem];
    case "px":
      return [n, Re.px];
    case "em":
      return [n, Re.em];
    case "%":
      return [n, Re.percent];
    case "vw":
      return [n, Re.vw];
    case "vh":
      return [n, Re.vh];
    default:
      return null;
  }
}
__name(Ft, "Ft");
function an(e, t, r = {}) {
  let n = yr(t, r);
  return n === null ? null : V({ [e]: n });
}
__name(an, "an");
function Da(e, t, r) {
  let n = yr(t);
  return n !== null && (r[e] = n), r;
}
__name(Da, "Da");
function tm(e, t) {
  let r = yr(t);
  return r === null ? null : { [e]: r };
}
__name(tm, "tm");
function yr(e, t = {}) {
  if (e === void 0)
    return null;
  let r = Ft(String(e), t);
  return r ? on(...r, t) : null;
}
__name(yr, "yr");
function on(e, t, r = {}) {
  let { isNegative: n, device: i } = r;
  switch (t) {
    case Re.rem:
      return e * 16 * (n ? -1 : 1);
    case Re.px:
      return e * (n ? -1 : 1);
    case Re.percent:
      return `${n ? "-" : ""}${e}%`;
    case Re.none:
      return e * (n ? -1 : 1);
    case Re.vw:
      return i != null && i.windowDimensions ? i.windowDimensions.width * (e / 100) : (Kt("`vw` CSS unit requires configuration with `useDeviceContext()`"), null);
    case Re.vh:
      return i != null && i.windowDimensions ? i.windowDimensions.height * (e / 100) : (Kt("`vh` CSS unit requires configuration with `useDeviceContext()`"), null);
    default:
      return null;
  }
}
__name(on, "on");
function ku(e) {
  let t = Ft(e);
  if (!t)
    return null;
  let [r, n] = t;
  switch (n) {
    case Re.rem:
      return r * 16;
    case Re.px:
      return r;
    default:
      return null;
  }
}
__name(ku, "ku");
var rm = { t: "Top", tr: "TopRight", tl: "TopLeft", b: "Bottom", br: "BottomRight", bl: "BottomLeft", l: "Left", r: "Right", x: "Horizontal", y: "Vertical" };
function _l(e) {
  return rm[e ?? ""] || "All";
}
__name(_l, "_l");
function Al(e) {
  let t = "All";
  return [e.replace(/^-(t|b|r|l|tr|tl|br|bl)(-|$)/, (r, n) => (t = _l(n), "")), t];
}
__name(Al, "Al");
function ii(e, t = {}) {
  if (e.includes("/")) {
    let r = Tu(e, { ...t, fractions: true });
    if (r)
      return r;
  }
  return e[0] === "[" && (e = e.slice(1, -1)), Tu(e, t);
}
__name(ii, "ii");
function br(e, t, r = {}) {
  let n = ii(t, r);
  return n === null ? null : V({ [e]: n });
}
__name(br, "br");
function Tu(e, t = {}) {
  if (e === "px")
    return 1;
  let r = Ft(e, t);
  if (!r)
    return null;
  let [n, i] = r;
  return t.fractions && (i = Re.percent, n *= 100), i === Re.none && (n = n / 4, i = Re.rem), on(n, i, t);
}
__name(Tu, "Tu");
function nm(...e) {
  console.warn(...e);
}
__name(nm, "nm");
function im(...e) {
}
__name(im, "im");
var Kt = typeof process > "u" || ((ma = process == null ? void 0 : process.env) === null || ma === void 0 ? void 0 : ma.JEST_WORKER_ID) === void 0 ? nm : im;
var am = [["aspect-square", V({ aspectRatio: 1 })], ["aspect-video", V({ aspectRatio: 16 / 9 })], ["items-center", V({ alignItems: "center" })], ["items-start", V({ alignItems: "flex-start" })], ["items-end", V({ alignItems: "flex-end" })], ["items-baseline", V({ alignItems: "baseline" })], ["items-stretch", V({ alignItems: "stretch" })], ["justify-start", V({ justifyContent: "flex-start" })], ["justify-end", V({ justifyContent: "flex-end" })], ["justify-center", V({ justifyContent: "center" })], ["justify-between", V({ justifyContent: "space-between" })], ["justify-around", V({ justifyContent: "space-around" })], ["justify-evenly", V({ justifyContent: "space-evenly" })], ["content-start", V({ alignContent: "flex-start" })], ["content-end", V({ alignContent: "flex-end" })], ["content-between", V({ alignContent: "space-between" })], ["content-around", V({ alignContent: "space-around" })], ["content-stretch", V({ alignContent: "stretch" })], ["content-center", V({ alignContent: "center" })], ["self-auto", V({ alignSelf: "auto" })], ["self-start", V({ alignSelf: "flex-start" })], ["self-end", V({ alignSelf: "flex-end" })], ["self-center", V({ alignSelf: "center" })], ["self-stretch", V({ alignSelf: "stretch" })], ["self-baseline", V({ alignSelf: "baseline" })], ["direction-inherit", V({ direction: "inherit" })], ["direction-ltr", V({ direction: "ltr" })], ["direction-rtl", V({ direction: "rtl" })], ["hidden", V({ display: "none" })], ["flex", V({ display: "flex" })], ["flex-row", V({ flexDirection: "row" })], ["flex-row-reverse", V({ flexDirection: "row-reverse" })], ["flex-col", V({ flexDirection: "column" })], ["flex-col-reverse", V({ flexDirection: "column-reverse" })], ["flex-wrap", V({ flexWrap: "wrap" })], ["flex-wrap-reverse", V({ flexWrap: "wrap-reverse" })], ["flex-nowrap", V({ flexWrap: "nowrap" })], ["flex-auto", V({ flexGrow: 1, flexShrink: 1, flexBasis: "auto" })], ["flex-initial", V({ flexGrow: 0, flexShrink: 1, flexBasis: "auto" })], ["flex-none", V({ flexGrow: 0, flexShrink: 0, flexBasis: "auto" })], ["overflow-hidden", V({ overflow: "hidden" })], ["overflow-visible", V({ overflow: "visible" })], ["overflow-scroll", V({ overflow: "scroll" })], ["absolute", V({ position: "absolute" })], ["relative", V({ position: "relative" })], ["italic", V({ fontStyle: "italic" })], ["not-italic", V({ fontStyle: "normal" })], ["oldstyle-nums", Jr("oldstyle-nums")], ["small-caps", Jr("small-caps")], ["lining-nums", Jr("lining-nums")], ["tabular-nums", Jr("tabular-nums")], ["proportional-nums", Jr("proportional-nums")], ["font-thin", V({ fontWeight: "100" })], ["font-100", V({ fontWeight: "100" })], ["font-extralight", V({ fontWeight: "200" })], ["font-200", V({ fontWeight: "200" })], ["font-light", V({ fontWeight: "300" })], ["font-300", V({ fontWeight: "300" })], ["font-normal", V({ fontWeight: "normal" })], ["font-400", V({ fontWeight: "400" })], ["font-medium", V({ fontWeight: "500" })], ["font-500", V({ fontWeight: "500" })], ["font-semibold", V({ fontWeight: "600" })], ["font-600", V({ fontWeight: "600" })], ["font-bold", V({ fontWeight: "bold" })], ["font-700", V({ fontWeight: "700" })], ["font-extrabold", V({ fontWeight: "800" })], ["font-800", V({ fontWeight: "800" })], ["font-black", V({ fontWeight: "900" })], ["font-900", V({ fontWeight: "900" })], ["include-font-padding", V({ includeFontPadding: true })], ["remove-font-padding", V({ includeFontPadding: false })], ["max-w-none", V({ maxWidth: "99999%" })], ["text-left", V({ textAlign: "left" })], ["text-center", V({ textAlign: "center" })], ["text-right", V({ textAlign: "right" })], ["text-justify", V({ textAlign: "justify" })], ["text-auto", V({ textAlign: "auto" })], ["underline", V({ textDecorationLine: "underline" })], ["line-through", V({ textDecorationLine: "line-through" })], ["no-underline", V({ textDecorationLine: "none" })], ["uppercase", V({ textTransform: "uppercase" })], ["lowercase", V({ textTransform: "lowercase" })], ["capitalize", V({ textTransform: "capitalize" })], ["normal-case", V({ textTransform: "none" })], ["w-auto", V({ width: "auto" })], ["h-auto", V({ height: "auto" })], ["shadow-sm", V({ shadowOffset: { width: 1, height: 1 }, shadowColor: "#000", shadowRadius: 1, shadowOpacity: 0.025, elevation: 1 })], ["shadow", V({ shadowOffset: { width: 1, height: 1 }, shadowColor: "#000", shadowRadius: 1, shadowOpacity: 0.075, elevation: 2 })], ["shadow-md", V({ shadowOffset: { width: 1, height: 1 }, shadowColor: "#000", shadowRadius: 3, shadowOpacity: 0.125, elevation: 3 })], ["shadow-lg", V({ shadowOffset: { width: 1, height: 1 }, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 })], ["shadow-xl", V({ shadowOffset: { width: 1, height: 1 }, shadowColor: "#000", shadowOpacity: 0.19, shadowRadius: 20, elevation: 12 })], ["shadow-2xl", V({ shadowOffset: { width: 1, height: 1 }, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 30, elevation: 16 })], ["shadow-none", V({ shadowOffset: { width: 0, height: 0 }, shadowColor: "#000", shadowRadius: 0, shadowOpacity: 0, elevation: 0 })]];
var _u = am;
function Jr(e) {
  return { kind: "dependent", complete(t) {
    (!t.fontVariant || !Array.isArray(t.fontVariant)) && (t.fontVariant = []), t.fontVariant.push(e);
  } };
}
__name(Jr, "Jr");
var om = /* @__PURE__ */ __name(class {
  constructor(e) {
    this.ir = new Map(_u), this.styles = /* @__PURE__ */ new Map(), this.prefixes = /* @__PURE__ */ new Map(), this.ir = new Map([..._u, ...e ?? []]);
  }
  getStyle(e) {
    return this.styles.get(e);
  }
  setStyle(e, t) {
    this.styles.set(e, t);
  }
  getIr(e) {
    return this.ir.get(e);
  }
  setIr(e, t) {
    this.ir.set(e, t);
  }
  getPrefixMatch(e) {
    return this.prefixes.get(e);
  }
  setPrefixMatch(e, t) {
    this.prefixes.set(e, t);
  }
}, "om");
function sm(e, t, r = {}) {
  let n = t?.[e];
  if (!n)
    return br("fontSize", e, r);
  if (typeof n == "string")
    return an("fontSize", n);
  let i = {}, [a, o] = n, u = tm("fontSize", a);
  if (u && (i = u), typeof o == "string")
    return V(Da("lineHeight", Au(o, i), i));
  let { lineHeight: s, letterSpacing: l } = o;
  return s && Da("lineHeight", Au(s, i), i), l && Da("letterSpacing", l, i), V(i);
}
__name(sm, "sm");
function Au(e, t) {
  let r = Ft(e);
  if (r) {
    let [n, i] = r;
    if ((i === Re.none || i === Re.em) && typeof t.fontSize == "number")
      return t.fontSize * n;
  }
  return e;
}
__name(Au, "Au");
function um(e, t) {
  var r;
  let n = (r = t?.[e]) !== null && r !== void 0 ? r : e.startsWith("[") ? e.slice(1, -1) : e, i = Ft(n);
  if (!i)
    return null;
  let [a, o] = i;
  if (o === Re.none)
    return { kind: "dependent", complete(s) {
      if (typeof s.fontSize != "number")
        return "relative line-height utilities require that font-size be set";
      s.lineHeight = s.fontSize * a;
    } };
  let u = on(a, o);
  return u !== null ? V({ lineHeight: u }) : null;
}
__name(um, "um");
function lm(e, t, r, n, i) {
  let a = "";
  if (n[0] === "[")
    a = n.slice(1, -1);
  else {
    let l = i?.[n];
    if (l)
      a = l;
    else {
      let f = ii(n);
      return f && typeof f == "number" ? Ou(f, Re.px, t, e) : null;
    }
  }
  if (a === "auto")
    return Ol(t, e, "auto");
  let o = Ft(a);
  if (!o)
    return null;
  let [u, s] = o;
  return r && (u = -u), Ou(u, s, t, e);
}
__name(lm, "lm");
function Ou(e, t, r, n) {
  let i = on(e, t);
  return i === null ? null : Ol(r, n, i);
}
__name(Ou, "Ou");
function Ol(e, t, r) {
  switch (e) {
    case "All":
      return { kind: "complete", style: { [`${t}Top`]: r, [`${t}Right`]: r, [`${t}Bottom`]: r, [`${t}Left`]: r } };
    case "Bottom":
    case "Top":
    case "Left":
    case "Right":
      return { kind: "complete", style: { [`${t}${e}`]: r } };
    case "Vertical":
      return { kind: "complete", style: { [`${t}Top`]: r, [`${t}Bottom`]: r } };
    case "Horizontal":
      return { kind: "complete", style: { [`${t}Left`]: r, [`${t}Right`]: r } };
    default:
      return null;
  }
}
__name(Ol, "Ol");
function fm(e) {
  if (!e)
    return {};
  let t = Object.entries(e).reduce((i, [a, o]) => {
    let u = [0, 1 / 0, 0], s = typeof o == "string" ? { min: o } : o, l = s.min ? ku(s.min) : 0;
    l === null ? Kt(`invalid screen config value: ${a}->min: ${s.min}`) : u[0] = l;
    let f = s.max ? ku(s.max) : 1 / 0;
    return f === null ? Kt(`invalid screen config value: ${a}->max: ${s.max}`) : u[1] = f, i[a] = u, i;
  }, {}), r = Object.values(t);
  r.sort((i, a) => {
    let [o, u] = i, [s, l] = a;
    return u === 1 / 0 || l === 1 / 0 ? o - s : u - l;
  });
  let n = 0;
  return r.forEach((i) => i[2] = n++), t;
}
__name(fm, "fm");
function cm(e, t) {
  let r = t?.[e];
  if (!r)
    return null;
  if (typeof r == "string")
    return V({ fontFamily: r });
  let n = r[0];
  return n ? V({ fontFamily: n }) : null;
}
__name(cm, "cm");
function tn(e, t, r) {
  if (!r)
    return null;
  let n;
  t.includes("/") && ([t = "", n] = t.split("/", 2));
  let i = "";
  if (t.startsWith("[#") || t.startsWith("[rgb") ? i = t.slice(1, -1) : i = Ll(t, r), !i)
    return null;
  if (n) {
    let a = Number(n);
    if (!Number.isNaN(a))
      return i = Lu(i, a / 100), V({ [Hn[e].color]: i });
  }
  return { kind: "dependent", complete(a) {
    let o = Hn[e].opacity, u = a[o];
    typeof u == "number" && (i = Lu(i, u)), a[Hn[e].color] = i;
  } };
}
__name(tn, "tn");
function Mn(e, t) {
  let r = parseInt(t, 10);
  if (Number.isNaN(r))
    return null;
  let n = r / 100;
  return { kind: "complete", style: { [Hn[e].opacity]: n } };
}
__name(Mn, "Mn");
function Lu(e, t) {
  return e.startsWith("#") ? e = hm(e) : e.startsWith("rgb(") && (e = e.replace(/^rgb\(/, "rgba(").replace(/\)$/, ", 1)")), e.replace(/, ?\d*\.?(\d+)\)$/, `, ${t})`);
}
__name(Lu, "Lu");
function pm(e) {
  for (let t in e)
    t.startsWith("__opacity_") && delete e[t];
}
__name(pm, "pm");
var Hn = { bg: { opacity: "__opacity_bg", color: "backgroundColor" }, text: { opacity: "__opacity_text", color: "color" }, border: { opacity: "__opacity_border", color: "borderColor" }, borderTop: { opacity: "__opacity_border", color: "borderTopColor" }, borderBottom: { opacity: "__opacity_border", color: "borderBottomColor" }, borderLeft: { opacity: "__opacity_border", color: "borderLeftColor" }, borderRight: { opacity: "__opacity_border", color: "borderRightColor" }, shadow: { opacity: "__opacity_shadow", color: "shadowColor" }, tint: { opacity: "__opacity_tint", color: "tintColor" } };
function hm(e) {
  let t = e;
  e = e.replace(dm, (o, u, s, l) => u + u + s + s + l + l);
  let r = vm.exec(e);
  if (!r)
    return Kt(`invalid config hex color value: ${t}`), "rgba(0, 0, 0, 1)";
  let n = parseInt(r[1], 16), i = parseInt(r[2], 16), a = parseInt(r[3], 16);
  return `rgba(${n}, ${i}, ${a}, 1)`;
}
__name(hm, "hm");
function Ll(e, t) {
  let r = t[e];
  if (Cu(r))
    return r;
  if (Su(r) && Cu(r.DEFAULT))
    return r.DEFAULT;
  let [n = "", ...i] = e.split("-");
  for (; n !== e; ) {
    let a = t[n];
    if (Su(a))
      return Ll(i.join("-"), a);
    if (i.length === 0)
      return "";
    n = `${n}-${i.shift()}`;
  }
  return "";
}
__name(Ll, "Ll");
var dm = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
var vm = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
function gm(e, t) {
  let [r, n] = Al(e);
  if (r.match(/^(-?(\d)+)?$/))
    return mm(r, n, t?.borderWidth);
  if (r = r.replace(/^-/, ""), ["dashed", "solid", "dotted"].includes(r))
    return V({ borderStyle: r });
  let i = "border";
  switch (n) {
    case "Bottom":
      i = "borderBottom";
      break;
    case "Top":
      i = "borderTop";
      break;
    case "Left":
      i = "borderLeft";
      break;
    case "Right":
      i = "borderRight";
      break;
  }
  let a = tn(i, r, t?.borderColor);
  if (a)
    return a;
  let o = `border${n === "All" ? "" : n}Width`;
  r = r.replace(/^-/, "");
  let u = r.slice(1, -1), s = br(o, u);
  return typeof s?.style[o] != "number" ? null : s;
}
__name(gm, "gm");
function mm(e, t, r) {
  if (!r)
    return null;
  e = e.replace(/^-/, "");
  let n = r[e === "" ? "DEFAULT" : e];
  if (n === void 0)
    return null;
  let i = `border${t === "All" ? "" : t}Width`;
  return an(i, n);
}
__name(mm, "mm");
function Dm(e, t) {
  if (!t)
    return null;
  let [r, n] = Al(e);
  r = r.replace(/^-/, ""), r === "" && (r = "DEFAULT");
  let i = `border${n === "All" ? "" : n}Radius`, a = t[r];
  if (a)
    return Iu(an(i, a));
  let o = br(i, r);
  return typeof o?.style[i] != "number" ? null : Iu(o);
}
__name(Dm, "Dm");
function Iu(e) {
  if (e?.kind !== "complete")
    return e;
  let t = e.style.borderTopRadius;
  t !== void 0 && (e.style.borderTopLeftRadius = t, e.style.borderTopRightRadius = t, delete e.style.borderTopRadius);
  let r = e.style.borderBottomRadius;
  r !== void 0 && (e.style.borderBottomLeftRadius = r, e.style.borderBottomRightRadius = r, delete e.style.borderBottomRadius);
  let n = e.style.borderLeftRadius;
  n !== void 0 && (e.style.borderBottomLeftRadius = n, e.style.borderTopLeftRadius = n, delete e.style.borderLeftRadius);
  let i = e.style.borderRightRadius;
  return i !== void 0 && (e.style.borderBottomRightRadius = i, e.style.borderTopRightRadius = i, delete e.style.borderRightRadius), e;
}
__name(Iu, "Iu");
function Kr(e, t, r, n) {
  let i = null;
  e === "inset" && (t = t.replace(/^(x|y)-/, (u, s) => (i = s === "x" ? "x" : "y", "")));
  let a = n?.[t];
  if (a) {
    let u = yr(a, { isNegative: r });
    if (u !== null)
      return Pu(e, i, u);
  }
  let o = ii(t, { isNegative: r });
  return o !== null ? Pu(e, i, o) : null;
}
__name(Kr, "Kr");
function Pu(e, t, r) {
  if (e !== "inset")
    return V({ [e]: r });
  switch (t) {
    case null:
      return V({ top: r, left: r, right: r, bottom: r });
    case "y":
      return V({ top: r, bottom: r });
    case "x":
      return V({ left: r, right: r });
  }
}
__name(Pu, "Pu");
function Gn(e, t, r) {
  var n;
  t = t.replace(/^-/, "");
  let i = t === "" ? "DEFAULT" : t, a = Number((n = r?.[i]) !== null && n !== void 0 ? n : t);
  return Number.isNaN(a) ? null : V({ [`flex${e}`]: a });
}
__name(Gn, "Gn");
function ym(e, t) {
  var r, n;
  if (e = t?.[e] || e, ["min-content", "revert", "unset"].includes(e))
    return null;
  if (e.match(/^\d+(\.\d+)?$/))
    return V({ flexGrow: Number(e), flexBasis: "0%" });
  let i = e.match(/^(\d+)\s+(\d+)$/);
  if (i)
    return V({ flexGrow: Number(i[1]), flexShrink: Number(i[2]) });
  if (i = e.match(/^(\d+)\s+([^ ]+)$/), i) {
    let a = yr((r = i[2]) !== null && r !== void 0 ? r : "");
    return a ? V({ flexGrow: Number(i[1]), flexBasis: a }) : null;
  }
  if (i = e.match(/^(\d+)\s+(\d+)\s+(.+)$/), i) {
    let a = yr((n = i[3]) !== null && n !== void 0 ? n : "");
    return a ? V({ flexGrow: Number(i[1]), flexShrink: Number(i[2]), flexBasis: a }) : null;
  }
  return null;
}
__name(ym, "ym");
function Ru(e, t, r = {}, n) {
  let i = n?.[t];
  return i !== void 0 ? an(e, i, r) : br(e, t, r);
}
__name(Ru, "Ru");
function Wn(e, t, r = {}, n) {
  let i = yr(n?.[t], r);
  return i ? V({ [e]: i }) : (t === "screen" && (t = e.includes("Width") ? "100vw" : "100vh"), br(e, t, r));
}
__name(Wn, "Wn");
function bm(e, t, r) {
  let n = r?.[e];
  if (n) {
    let i = Ft(n, { isNegative: t });
    if (!i)
      return null;
    let [a, o] = i;
    if (o === Re.em)
      return xm(a);
    if (o === Re.percent)
      return Kt("percentage-based letter-spacing configuration currently unsupported, switch to `em`s, or open an issue if you'd like to see support added."), null;
    let u = on(a, o, { isNegative: t });
    return u !== null ? V({ letterSpacing: u }) : null;
  }
  return br("letterSpacing", e, { isNegative: t });
}
__name(bm, "bm");
function xm(e) {
  return { kind: "dependent", complete(t) {
    let r = t.fontSize;
    if (typeof r != "number" || Number.isNaN(r))
      return "tracking-X relative letter spacing classes require font-size to be set";
    t.letterSpacing = Math.round((e * r + Number.EPSILON) * 100) / 100;
  } };
}
__name(xm, "xm");
function wm(e, t) {
  let r = t?.[e];
  if (r) {
    let i = Ft(String(r));
    if (i)
      return V({ opacity: i[0] });
  }
  let n = Ft(e);
  return n ? V({ opacity: n[0] / 100 }) : null;
}
__name(wm, "wm");
function Em(e) {
  let t = parseInt(e, 10);
  return Number.isNaN(t) ? null : { kind: "complete", style: { shadowOpacity: t / 100 } };
}
__name(Em, "Em");
function Fm(e) {
  if (e.includes("/")) {
    let [r = "", n = ""] = e.split("/", 2), i = ya(r), a = ya(n);
    return i === null || a === null ? null : { kind: "complete", style: { shadowOffset: { width: i, height: a } } };
  }
  let t = ya(e);
  return t === null ? null : { kind: "complete", style: { shadowOffset: { width: t, height: t } } };
}
__name(Fm, "Fm");
function ya(e) {
  let t = ii(e);
  return typeof t == "number" ? t : null;
}
__name(ya, "ya");
var Uu = /* @__PURE__ */ __name(class {
  constructor(e, t = {}, r, n, i) {
    var a, o, u, s, l, f;
    this.config = t, this.cache = r, this.position = 0, this.isNull = false, this.isNegative = false, this.context = {}, this.context.device = n;
    let c = e.trim().split(":"), p = [];
    c.length === 1 ? this.string = e : (this.string = (a = c.pop()) !== null && a !== void 0 ? a : "", p = c), this.char = this.string[0];
    let d = fm((o = this.config.theme) === null || o === void 0 ? void 0 : o.screens);
    for (let D of p)
      if (d[D]) {
        let v = (u = d[D]) === null || u === void 0 ? void 0 : u[2];
        v !== void 0 && (this.order = ((s = this.order) !== null && s !== void 0 ? s : 0) + v);
        let g = (l = n.windowDimensions) === null || l === void 0 ? void 0 : l.width;
        if (g) {
          let [y, b] = (f = d[D]) !== null && f !== void 0 ? f : [0, 0];
          (g <= y || g > b) && (this.isNull = true);
        } else
          this.isNull = true;
      } else
        K1(D) ? this.isNull = D !== i : em(D) ? n.windowDimensions ? (n.windowDimensions.width > n.windowDimensions.height ? "landscape" : "portrait") !== D ? this.isNull = true : this.incrementOrder() : this.isNull = true : D === "retina" ? n.pixelDensity === 2 ? this.incrementOrder() : this.isNull = true : D === "dark" ? n.colorScheme !== "dark" ? this.isNull = true : this.incrementOrder() : this.handlePossibleArbitraryBreakpointPrefix(D) || (this.isNull = true);
  }
  parse() {
    if (this.isNull)
      return { kind: "null" };
    let e = this.cache.getIr(this.rest);
    if (e)
      return e;
    this.parseIsNegative();
    let t = this.parseUtility();
    return t ? this.order !== void 0 ? { kind: "ordered", order: this.order, styleIr: t } : t : { kind: "null" };
  }
  parseUtility() {
    var e, t, r, n, i;
    let a = this.config.theme, o = null;
    switch (this.char) {
      case "m":
      case "p": {
        let u = this.peekSlice(1, 3).match(/^(t|b|r|l|x|y)?-/);
        if (u) {
          let s = this.char === "m" ? "margin" : "padding";
          this.advance(((t = (e = u[0]) === null || e === void 0 ? void 0 : e.length) !== null && t !== void 0 ? t : 0) + 1);
          let l = _l(u[1]), f = lm(s, l, this.isNegative, this.rest, (r = this.config.theme) === null || r === void 0 ? void 0 : r[s]);
          if (f)
            return f;
        }
      }
    }
    if (this.consumePeeked("h-") && (o = Ru("height", this.rest, this.context, a?.height), o) || this.consumePeeked("w-") && (o = Ru("width", this.rest, this.context, a?.width), o) || this.consumePeeked("min-w-") && (o = Wn("minWidth", this.rest, this.context, a?.minWidth), o) || this.consumePeeked("min-h-") && (o = Wn("minHeight", this.rest, this.context, a?.minHeight), o) || this.consumePeeked("max-w-") && (o = Wn("maxWidth", this.rest, this.context, a?.maxWidth), o) || this.consumePeeked("max-h-") && (o = Wn("maxHeight", this.rest, this.context, a?.maxHeight), o) || this.consumePeeked("leading-") && (o = um(this.rest, a?.lineHeight), o) || this.consumePeeked("text-") && (o = sm(this.rest, a?.fontSize, this.context), o || (o = tn("text", this.rest, a?.textColor), o) || this.consumePeeked("opacity-") && (o = Mn("text", this.rest), o)) || this.consumePeeked("font-") && (o = cm(this.rest, a?.fontFamily), o) || this.consumePeeked("aspect-") && (this.consumePeeked("ratio-") && Kt("`aspect-ratio-{ratio}` is deprecated, use `aspect-{ratio}` instead"), o = an("aspectRatio", this.rest, { fractions: true }), o) || this.consumePeeked("tint-") && (o = tn("tint", this.rest, a?.colors), o) || this.consumePeeked("bg-") && (o = tn("bg", this.rest, a?.backgroundColor), o || this.consumePeeked("opacity-") && (o = Mn("bg", this.rest), o)) || this.consumePeeked("border") && (o = gm(this.rest, a), o || this.consumePeeked("-opacity-") && (o = Mn("border", this.rest), o)) || this.consumePeeked("rounded") && (o = Dm(this.rest, a?.borderRadius), o) || this.consumePeeked("bottom-") && (o = Kr("bottom", this.rest, this.isNegative, a?.inset), o) || this.consumePeeked("top-") && (o = Kr("top", this.rest, this.isNegative, a?.inset), o) || this.consumePeeked("left-") && (o = Kr("left", this.rest, this.isNegative, a?.inset), o) || this.consumePeeked("right-") && (o = Kr("right", this.rest, this.isNegative, a?.inset), o) || this.consumePeeked("inset-") && (o = Kr("inset", this.rest, this.isNegative, a?.inset), o) || this.consumePeeked("flex-") && (this.consumePeeked("grow") ? o = Gn("Grow", this.rest, a?.flexGrow) : this.consumePeeked("shrink") ? o = Gn("Shrink", this.rest, a?.flexShrink) : o = ym(this.rest, a?.flex), o) || this.consumePeeked("grow") && (o = Gn("Grow", this.rest, a?.flexGrow), o) || this.consumePeeked("shrink") && (o = Gn("Shrink", this.rest, a?.flexShrink), o) || this.consumePeeked("shadow-color-opacity-") && (o = Mn("shadow", this.rest), o) || this.consumePeeked("shadow-opacity-") && (o = Em(this.rest), o) || this.consumePeeked("shadow-offset-") && (o = Fm(this.rest), o) || this.consumePeeked("shadow-radius-") && (o = br("shadowRadius", this.rest), o) || this.consumePeeked("shadow-") && (o = tn("shadow", this.rest, a?.colors), o))
      return o;
    if (this.consumePeeked("elevation-")) {
      let u = parseInt(this.rest, 10);
      if (!Number.isNaN(u))
        return V({ elevation: u });
    }
    if (this.consumePeeked("opacity-") && (o = wm(this.rest, a?.opacity), o) || this.consumePeeked("tracking-") && (o = bm(this.rest, this.isNegative, a?.letterSpacing), o))
      return o;
    if (this.consumePeeked("z-")) {
      let u = Number((i = (n = a?.zIndex) === null || n === void 0 ? void 0 : n[this.rest]) !== null && i !== void 0 ? i : this.rest);
      if (!Number.isNaN(u))
        return V({ zIndex: u });
    }
    return Kt(`\`${this.rest}\` unknown or invalid utility`), null;
  }
  handlePossibleArbitraryBreakpointPrefix(e) {
    var t;
    if (e[0] !== "m")
      return false;
    let r = e.match(/^(min|max)-(w|h)-\[([^\]]+)\]$/);
    if (!r)
      return false;
    if (!(!((t = this.context.device) === null || t === void 0) && t.windowDimensions))
      return this.isNull = true, true;
    let n = this.context.device.windowDimensions, [, i = "", a = "", o = ""] = r, u = a === "w" ? n.width : n.height, s = Ft(o, this.context);
    if (s === null)
      return this.isNull = true, true;
    let [l, f] = s;
    return f !== "px" && (this.isNull = true), (i === "min" ? u >= l : u <= l) ? this.incrementOrder() : this.isNull = true, true;
  }
  advance(e = 1) {
    this.position += e, this.char = this.string[this.position];
  }
  get rest() {
    return this.peekSlice(0, this.string.length);
  }
  peekSlice(e, t) {
    return this.string.slice(this.position + e, this.position + t);
  }
  consumePeeked(e) {
    return this.peekSlice(0, e.length) === e ? (this.advance(e.length), true) : false;
  }
  parseIsNegative() {
    this.char === "-" && (this.advance(), this.isNegative = true, this.context.isNegative = true);
  }
  incrementOrder() {
    var e;
    this.order = ((e = this.order) !== null && e !== void 0 ? e : 0) + 1;
  }
}, "Uu");
function Cm(e) {
  let t = [], r = null;
  return e.forEach((n) => {
    if (typeof n == "string")
      t = [...t, ...ba(n)];
    else if (Array.isArray(n))
      t = [...t, ...n.flatMap(ba)];
    else if (typeof n == "object" && n !== null)
      for (let [i, a] of Object.entries(n))
        typeof a == "boolean" ? t = [...t, ...a ? ba(i) : []] : r ? r[i] = a : r = { [i]: a };
  }), [t.filter(Boolean).filter(Sm), r];
}
__name(Cm, "Cm");
function ba(e) {
  return e.trim().split(/\s+/);
}
__name(ba, "ba");
function Sm(e, t, r) {
  return r.indexOf(e) === t;
}
__name(Sm, "Sm");
function km(e) {
  var t;
  return (t = e?.reduce((r, n) => ({ ...r, ...Tm(n.handler) }), {})) !== null && t !== void 0 ? t : {};
}
__name(km, "km");
function Tm(e) {
  let t = {};
  return e({ addUtilities: (r) => {
    t = r;
  }, ..._m }), t;
}
__name(Tm, "Tm");
function jt(e) {
  throw new Error(`tailwindcss plugin function argument object prop "${e}" not implemented`);
}
__name(jt, "jt");
var _m = { addComponents: jt, addBase: jt, addVariant: jt, e: jt, prefix: jt, theme: jt, variants: jt, config: jt, corePlugins: jt, matchUtilities: jt, postcss: null };
function Am(e, t) {
  let r = (0, Z1.default)(Om(e)), n = {}, i = km(r.plugins), a = {}, o = Object.entries(i).map(([D, v]) => typeof v == "string" ? (a[D] = v, [D, { kind: "null" }]) : [D, V(v)]).filter(([, D]) => D.kind !== "null");
  function u() {
    return [n.windowDimensions ? `w${n.windowDimensions.width}` : false, n.windowDimensions ? `h${n.windowDimensions.height}` : false, n.fontScale ? `fs${n.fontScale}` : false, n.colorScheme === "dark" ? "dark" : false, n.pixelDensity === 2 ? "retina" : false].filter(Boolean).join("--") || "default";
  }
  __name(u, "u");
  let s = u(), l = {};
  function f() {
    let D = l[s];
    if (D)
      return D;
    let v = new om(o);
    return l[s] = v, v;
  }
  __name(f, "f");
  function c(...D) {
    let v = f(), g = {}, y = [], b = [], [C, k] = Cm(D), S = C.join(" "), E = v.getStyle(S);
    if (E)
      return { ...E, ...k || {} };
    for (let L of C) {
      let T = v.getIr(L);
      if (!T && L in a) {
        let U = c(a[L]);
        v.setIr(L, V(U)), g = { ...g, ...U };
        continue;
      }
      switch (T = new Uu(L, r, v, n, t).parse(), T.kind) {
        case "complete":
          g = { ...g, ...T.style }, v.setIr(L, T);
          break;
        case "dependent":
          y.push(T);
          break;
        case "ordered":
          b.push(T);
          break;
        case "null":
          v.setIr(L, T);
          break;
      }
    }
    if (b.length > 0) {
      b.sort((L, T) => L.order - T.order);
      for (let L of b)
        switch (L.styleIr.kind) {
          case "complete":
            g = { ...g, ...L.styleIr.style };
            break;
          case "dependent":
            y.push(L.styleIr);
            break;
        }
    }
    if (y.length > 0) {
      for (let L of y) {
        let T = L.complete(g);
        T && Kt(T);
      }
      pm(g);
    }
    return S !== "" && v.setStyle(S, g), k && (g = { ...g, ...k }), g;
  }
  __name(c, "c");
  function p(D) {
    let v = c(D.split(/\s+/g).map((g) => g.replace(/^(bg|text|border)-/, "")).map((g) => `bg-${g}`).join(" "));
    return typeof v.backgroundColor == "string" ? v.backgroundColor : void 0;
  }
  __name(p, "p");
  let d = /* @__PURE__ */ __name((D, ...v) => {
    let g = "";
    return D.forEach((y, b) => {
      var C;
      g += y + ((C = v[b]) !== null && C !== void 0 ? C : "");
    }), c(g);
  }, "d");
  return d.style = c, d.color = p, d.prefixMatch = (...D) => {
    let v = D.sort().join(":"), g = f(), y = g.getPrefixMatch(v);
    if (y !== void 0)
      return y;
    let b = new Uu(`${v}:flex`, r, g, n, t).parse().kind !== "null";
    return g.setPrefixMatch(v, b), b;
  }, d.setWindowDimensions = (D) => {
    n.windowDimensions = D, s = u();
  }, d.setFontScale = (D) => {
    n.fontScale = D, s = u();
  }, d.setPixelDensity = (D) => {
    n.pixelDensity = D, s = u();
  }, d.setColorScheme = (D) => {
    n.colorScheme = D, s = u();
  }, d;
}
__name(Am, "Am");
function Om(e) {
  return { ...e, content: ["_no_warnings_please"] };
}
__name(Om, "Om");
var Lm = { handler: ({ addUtilities: e }) => {
  e({ "shadow-sm": { boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }, shadow: { boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)" }, "shadow-md": { boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }, "shadow-lg": { boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" }, "shadow-xl": { boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }, "shadow-2xl": { boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)" }, "shadow-inner": { boxShadow: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)" }, "shadow-none": { boxShadow: "0 0 #0000" } });
} };
function Im(e) {
  return Am({ ...e, plugins: [...e?.plugins ?? [], Lm] }, "web");
}
__name(Im, "Im");
var $n;
function Pm({ width: e, height: t, config: r }) {
  return $n || ($n = Im(r)), $n.setWindowDimensions({ width: +e, height: +t }), $n;
}
__name(Pm, "Pm");
var xa = /* @__PURE__ */ new WeakMap();
async function Il(e, t) {
  let r = await Kn();
  if (!r || !r.Node)
    throw new Error("Satori is not initialized: expect `yoga` to be loaded, got " + r);
  t.fonts = t.fonts || [];
  let n;
  xa.has(t.fonts) ? n = xa.get(t.fonts) : xa.set(t.fonts, n = new X1(t.fonts));
  let i = "width" in t ? t.width : void 0, a = "height" in t ? t.height : void 0, o = r.Node.create();
  i && o.setWidth(i), a && o.setHeight(a), o.setFlexDirection(r.FLEX_DIRECTION_ROW), o.setFlexWrap(r.WRAP_WRAP), o.setAlignContent(r.ALIGN_AUTO), o.setAlignItems(r.ALIGN_FLEX_START), o.setJustifyContent(r.JUSTIFY_FLEX_START), o.setOverflow(r.OVERFLOW_HIDDEN);
  let u = { ...t.graphemeImages }, s = /* @__PURE__ */ new Set();
  cr.clear(), await Vg(e);
  let l = Ta(e, { id: "id", parentStyle: {}, inheritedStyle: { fontSize: 16, fontWeight: "normal", fontFamily: "serif", fontStyle: "normal", lineHeight: 1.2, color: "black", opacity: 1, whiteSpace: "normal", _viewportWidth: i, _viewportHeight: a }, parent: o, font: n, embedFont: t.embedFont, debug: t.debug, graphemeImages: u, canLoadAdditionalAssets: !!t.loadAdditionalAsset, onNodeDetected: t.onNodeDetected, getTwStyles: (D, v) => {
    let g = { ...Pm({ width: i, height: a, config: t.tailwindConfig })([D]) };
    return typeof g.lineHeight == "number" && (g.lineHeight = g.lineHeight / (+g.fontSize || v.fontSize || 16)), g.shadowColor && g.boxShadow && (g.boxShadow = g.boxShadow.replace(/rgba?\([^)]+\)/, g.shadowColor)), g;
  } }), f = (await l.next()).value;
  if (t.loadAdditionalAsset && f.length) {
    let D = Rm(f), v = [], g = {};
    await Promise.all(Object.entries(D).flatMap(([y, b]) => b.map((C) => {
      let k = `${y}_${C}`;
      return s.has(k) ? null : (s.add(k), t.loadAdditionalAsset(y, C).then((S) => {
        typeof S == "string" ? g[C] = S : S && (Array.isArray(S) ? v.push(...S) : v.push(S));
      }));
    }))), n.addFonts(v), Object.assign(u, g);
  }
  await l.next(), o.calculateLayout(i, a, r.DIRECTION_LTR);
  let c = (await l.next([0, 0])).value, p = o.getComputedWidth(), d = o.getComputedHeight();
  return o.freeRecursive(), Y1({ width: p, height: d, content: c });
}
__name(Il, "Il");
function Rm(e) {
  let t = {}, r = {};
  for (let { word: n, locale: i } of e) {
    let a = z1(n, i).join("|");
    r[a] = r[a] || "", r[a] += n;
  }
  return Object.keys(r).forEach((n) => {
    t[n] = t[n] || [], n === "emoji" ? t[n].push(...Bu(Pt(r[n], "grapheme"))) : (t[n][0] = t[n][0] || "", t[n][0] += Bu(Pt(r[n], "grapheme", n === "unknown" ? void 0 : n)).join(""));
  }), t;
}
__name(Rm, "Rm");
function Bu(e) {
  return Array.from(new Set(e));
}
__name(Bu, "Bu");
var ne = {};
var Um = ne.ALIGN_AUTO = 0;
var Bm = ne.ALIGN_FLEX_START = 1;
var Nm = ne.ALIGN_CENTER = 2;
var Mm = ne.ALIGN_FLEX_END = 3;
var Gm = ne.ALIGN_STRETCH = 4;
var Wm = ne.ALIGN_BASELINE = 5;
var $m = ne.ALIGN_SPACE_BETWEEN = 6;
var jm = ne.ALIGN_SPACE_AROUND = 7;
var zm = ne.DIMENSION_WIDTH = 0;
var Vm = ne.DIMENSION_HEIGHT = 1;
var Hm = ne.DIRECTION_INHERIT = 0;
var Xm = ne.DIRECTION_LTR = 1;
var qm = ne.DIRECTION_RTL = 2;
var Ym = ne.DISPLAY_FLEX = 0;
var Zm = ne.DISPLAY_NONE = 1;
var Jm = ne.EDGE_LEFT = 0;
var Km = ne.EDGE_TOP = 1;
var Qm = ne.EDGE_RIGHT = 2;
var eD = ne.EDGE_BOTTOM = 3;
var tD = ne.EDGE_START = 4;
var rD = ne.EDGE_END = 5;
var nD = ne.EDGE_HORIZONTAL = 6;
var iD = ne.EDGE_VERTICAL = 7;
var aD = ne.EDGE_ALL = 8;
var oD = ne.EXPERIMENTAL_FEATURE_WEB_FLEX_BASIS = 0;
var sD = ne.EXPERIMENTAL_FEATURE_ABSOLUTE_PERCENTAGE_AGAINST_PADDING_EDGE = 1;
var uD = ne.EXPERIMENTAL_FEATURE_FIX_ABSOLUTE_TRAILING_COLUMN_MARGIN = 2;
var lD = ne.FLEX_DIRECTION_COLUMN = 0;
var fD = ne.FLEX_DIRECTION_COLUMN_REVERSE = 1;
var cD = ne.FLEX_DIRECTION_ROW = 2;
var pD = ne.FLEX_DIRECTION_ROW_REVERSE = 3;
var hD = ne.GUTTER_COLUMN = 0;
var dD = ne.GUTTER_ROW = 1;
var vD = ne.GUTTER_ALL = 2;
var gD = ne.JUSTIFY_FLEX_START = 0;
var mD = ne.JUSTIFY_CENTER = 1;
var DD = ne.JUSTIFY_FLEX_END = 2;
var yD = ne.JUSTIFY_SPACE_BETWEEN = 3;
var bD = ne.JUSTIFY_SPACE_AROUND = 4;
var xD = ne.JUSTIFY_SPACE_EVENLY = 5;
var wD = ne.LOG_LEVEL_ERROR = 0;
var ED = ne.LOG_LEVEL_WARN = 1;
var FD = ne.LOG_LEVEL_INFO = 2;
var CD = ne.LOG_LEVEL_DEBUG = 3;
var SD = ne.LOG_LEVEL_VERBOSE = 4;
var kD = ne.LOG_LEVEL_FATAL = 5;
var TD = ne.MEASURE_MODE_UNDEFINED = 0;
var _D = ne.MEASURE_MODE_EXACTLY = 1;
var AD = ne.MEASURE_MODE_AT_MOST = 2;
var OD = ne.NODE_TYPE_DEFAULT = 0;
var LD = ne.NODE_TYPE_TEXT = 1;
var ID = ne.OVERFLOW_VISIBLE = 0;
var PD = ne.OVERFLOW_HIDDEN = 1;
var RD = ne.OVERFLOW_SCROLL = 2;
var UD = ne.POSITION_TYPE_STATIC = 0;
var BD = ne.POSITION_TYPE_RELATIVE = 1;
var ND = ne.POSITION_TYPE_ABSOLUTE = 2;
var MD = ne.PRINT_OPTIONS_LAYOUT = 1;
var GD = ne.PRINT_OPTIONS_STYLE = 2;
var WD = ne.PRINT_OPTIONS_CHILDREN = 4;
var $D = ne.UNIT_UNDEFINED = 0;
var jD = ne.UNIT_POINT = 1;
var zD = ne.UNIT_PERCENT = 2;
var VD = ne.UNIT_AUTO = 3;
var HD = ne.WRAP_NO_WRAP = 0;
var XD = ne.WRAP_WRAP = 1;
var qD = ne.WRAP_WRAP_REVERSE = 2;
var Pl = /* @__PURE__ */ __name((e) => {
  function t(i, a, o) {
    let u = i[a];
    i[a] = function(...s) {
      return o.call(this, u, ...s);
    };
  }
  __name(t, "t");
  for (let i of ["setPosition", "setMargin", "setFlexBasis", "setWidth", "setHeight", "setMinWidth", "setMinHeight", "setMaxWidth", "setMaxHeight", "setPadding"]) {
    let a = { [ne.UNIT_POINT]: e.Node.prototype[i], [ne.UNIT_PERCENT]: e.Node.prototype[`${i}Percent`], [ne.UNIT_AUTO]: e.Node.prototype[`${i}Auto`] };
    t(e.Node.prototype, i, function(o, ...u) {
      let s, l, f = u.pop();
      if (f === "auto")
        s = ne.UNIT_AUTO, l = void 0;
      else if (typeof f == "object")
        s = f.unit, l = f.valueOf();
      else if (s = typeof f == "string" && f.endsWith("%") ? ne.UNIT_PERCENT : ne.UNIT_POINT, l = parseFloat(f), !Number.isNaN(f) && Number.isNaN(l))
        throw Error(`Invalid value ${f} for ${i}`);
      if (!a[s])
        throw Error(`Failed to execute "${i}": Unsupported unit '${f}'`);
      return l !== void 0 ? a[s].call(this, ...u, l) : a[s].call(this, ...u);
    });
  }
  function r(i) {
    return e.MeasureCallback.implement({ measure: (...a) => {
      let { width: o, height: u } = i(...a);
      return { width: o ?? NaN, height: u ?? NaN };
    } });
  }
  __name(r, "r");
  function n(i) {
    return e.DirtiedCallback.implement({ dirtied: i });
  }
  __name(n, "n");
  return t(e.Node.prototype, "setMeasureFunc", function(i, a) {
    return a ? i.call(this, r(a)) : this.unsetMeasureFunc();
  }), t(e.Node.prototype, "setDirtiedFunc", function(i, a) {
    i.call(this, n(a));
  }), t(e.Config.prototype, "free", function() {
    e.Config.destroy(this);
  }), t(e.Node, "create", (i, a) => a ? e.Node.createWithConfig(a) : e.Node.createDefault()), t(e.Node.prototype, "free", function() {
    e.Node.destroy(this);
  }), t(e.Node.prototype, "freeRecursive", function() {
    for (let i = 0, a = this.getChildCount(); i < a; ++i)
      this.getChild(0).freeRecursive();
    this.free();
  }), t(e.Node.prototype, "calculateLayout", function(i, a = NaN, o = NaN, u = ne.DIRECTION_LTR) {
    return i.call(this, a, o, u);
  }), { Config: e.Config, Node: e.Node, ...ne };
}, "Pl");
var YD = (() => {
  var e = typeof document < "u" && document.currentScript ? document.currentScript.src : void 0;
  return function(t = {}) {
    s || (s = t !== void 0 ? t : {}), s.ready = new Promise(function(w, x) {
      l = w, f = x;
    });
    var r, n, i = Object.assign({}, s), a = "";
    typeof document < "u" && document.currentScript && (a = document.currentScript.src), e && (a = e), a = a.indexOf("blob:") !== 0 ? a.substr(0, a.replace(/[?#].*/, "").lastIndexOf("/") + 1) : "";
    var o = console.log.bind(console), u = console.warn.bind(console);
    Object.assign(s, i), i = null, typeof WebAssembly != "object" && ee("no native wasm support detected");
    var s, l, f, c, p = false;
    function d(w, x, I) {
      I = x + I;
      for (var G = ""; !(x >= I); ) {
        var P = w[x++];
        if (!P)
          break;
        if (128 & P) {
          var j = 63 & w[x++];
          if ((224 & P) == 192)
            G += String.fromCharCode((31 & P) << 6 | j);
          else {
            var K = 63 & w[x++];
            65536 > (P = (240 & P) == 224 ? (15 & P) << 12 | j << 6 | K : (7 & P) << 18 | j << 12 | K << 6 | 63 & w[x++]) ? G += String.fromCharCode(P) : (P -= 65536, G += String.fromCharCode(55296 | P >> 10, 56320 | 1023 & P));
          }
        } else
          G += String.fromCharCode(P);
      }
      return G;
    }
    __name(d, "d");
    function D() {
      var w = c.buffer;
      s.HEAP8 = v = new Int8Array(w), s.HEAP16 = y = new Int16Array(w), s.HEAP32 = C = new Int32Array(w), s.HEAPU8 = g = new Uint8Array(w), s.HEAPU16 = b = new Uint16Array(w), s.HEAPU32 = k = new Uint32Array(w), s.HEAPF32 = S = new Float32Array(w), s.HEAPF64 = E = new Float64Array(w);
    }
    __name(D, "D");
    var v, g, y, b, C, k, S, E, L, T = [], U = [], M = [], H = 0, q = null;
    function ee(w) {
      throw u(w = "Aborted(" + w + ")"), p = true, f(w = new WebAssembly.RuntimeError(w + ". Build with -sASSERTIONS for more info.")), w;
    }
    __name(ee, "ee");
    function A() {
      return r.startsWith("data:application/octet-stream;base64,");
    }
    __name(A, "A");
    function R() {
      try {
        throw "both async and sync fetching of the wasm failed";
      } catch (w) {
        ee(w);
      }
    }
    __name(R, "R");
    function O(w) {
      for (; 0 < w.length; )
        w.shift()(s);
    }
    __name(O, "O");
    function Y(w) {
      if (w === void 0)
        return "_unknown";
      var x = (w = w.replace(/[^a-zA-Z0-9_]/g, "$")).charCodeAt(0);
      return 48 <= x && 57 >= x ? "_" + w : w;
    }
    __name(Y, "Y");
    function Z(w, x) {
      return w = Y(w), function() {
        return x.apply(this, arguments);
      };
    }
    __name(Z, "Z");
    r = "yoga.wasm", A() || (r = a + r);
    var te = [{}, { value: void 0 }, { value: null }, { value: true }, { value: false }], ie = [];
    function B(w) {
      var x = Error, I = Z(w, function(G) {
        this.name = w, this.message = G, (G = Error(G).stack) !== void 0 && (this.stack = this.toString() + `
` + G.replace(/^Error(:[^\n]*)?\n/, ""));
      });
      return I.prototype = Object.create(x.prototype), I.prototype.constructor = I, I.prototype.toString = function() {
        return this.message === void 0 ? this.name : this.name + ": " + this.message;
      }, I;
    }
    __name(B, "B");
    var z = void 0;
    function _(w) {
      throw new z(w);
    }
    __name(_, "_");
    var N = /* @__PURE__ */ __name((w) => (w || _("Cannot use deleted val. handle = " + w), te[w].value), "N"), ae = /* @__PURE__ */ __name((w) => {
      switch (w) {
        case void 0:
          return 1;
        case null:
          return 2;
        case true:
          return 3;
        case false:
          return 4;
        default:
          var x = ie.length ? ie.pop() : te.length;
          return te[x] = { fa: 1, value: w }, x;
      }
    }, "ae"), W = void 0, fe = void 0;
    function ce(w) {
      for (var x = ""; g[w]; )
        x += fe[g[w++]];
      return x;
    }
    __name(ce, "ce");
    var ge = [];
    function pe() {
      for (; ge.length; ) {
        var w = ge.pop();
        w.L.Z = false, w.delete();
      }
    }
    __name(pe, "pe");
    var xe = void 0, _e = {};
    function he(w, x) {
      for (x === void 0 && _("ptr should not be undefined"); w.P; )
        x = w.aa(x), w = w.P;
      return x;
    }
    __name(he, "he");
    var ye = {};
    function Ge(w) {
      var x = ce(w = Ya(w));
      return Ht(w), x;
    }
    __name(Ge, "Ge");
    function tt(w, x) {
      var I = ye[w];
      return I === void 0 && _(x + " has unknown type " + Ge(w)), I;
    }
    __name(tt, "tt");
    function We() {
    }
    __name(We, "We");
    var Be = false;
    function He(w) {
      --w.count.value, w.count.value === 0 && (w.S ? w.T.V(w.S) : w.O.M.V(w.N));
    }
    __name(He, "He");
    var rt = {}, nt = void 0;
    function it(w) {
      throw new nt(w);
    }
    __name(it, "it");
    function at(w, x) {
      return x.O && x.N || it("makeClassHandle requires ptr and ptrType"), !!x.T != !!x.S && it("Both smartPtrType and smartPtr must be specified"), x.count = { value: 1 }, Xe(Object.create(w, { L: { value: x } }));
    }
    __name(at, "at");
    function Xe(w) {
      return typeof FinalizationRegistry > "u" ? (Xe = /* @__PURE__ */ __name((x) => x, "Xe"), w) : (Be = new FinalizationRegistry((x) => {
        He(x.L);
      }), Xe = /* @__PURE__ */ __name((x) => {
        var I = x.L;
        return I.S && Be.register(x, { L: I }, x), x;
      }, "Xe"), We = /* @__PURE__ */ __name((x) => {
        Be.unregister(x);
      }, "We"), Xe(w));
    }
    __name(Xe, "Xe");
    var Ct = {};
    function Dt(w) {
      for (; w.length; ) {
        var x = w.pop();
        w.pop()(x);
      }
    }
    __name(Dt, "Dt");
    function ft(w) {
      return this.fromWireType(C[w >> 2]);
    }
    __name(ft, "ft");
    var ct = {}, zt = {};
    function lt(w, x, I) {
      function G(X) {
        (X = I(X)).length !== w.length && it("Mismatched type converter count");
        for (var Q = 0; Q < w.length; ++Q)
          qe(w[Q], X[Q]);
      }
      __name(G, "G");
      w.forEach(function(X) {
        zt[X] = x;
      });
      var P = Array(x.length), j = [], K = 0;
      x.forEach((X, Q) => {
        ye.hasOwnProperty(X) ? P[Q] = ye[X] : (j.push(X), ct.hasOwnProperty(X) || (ct[X] = []), ct[X].push(() => {
          P[Q] = ye[X], ++K === j.length && G(P);
        }));
      }), j.length === 0 && G(P);
    }
    __name(lt, "lt");
    function Ut(w) {
      switch (w) {
        case 1:
          return 0;
        case 2:
          return 1;
        case 4:
          return 2;
        case 8:
          return 3;
        default:
          throw TypeError("Unknown type size: " + w);
      }
    }
    __name(Ut, "Ut");
    function qe(w, x, I = {}) {
      if (!("argPackAdvance" in x))
        throw TypeError("registerType registeredInstance requires argPackAdvance");
      var G = x.name;
      if (w || _('type "' + G + '" must have a positive integer typeid pointer'), ye.hasOwnProperty(w)) {
        if (I.ta)
          return;
        _("Cannot register type '" + G + "' twice");
      }
      ye[w] = x, delete zt[w], ct.hasOwnProperty(w) && (x = ct[w], delete ct[w], x.forEach((P) => P()));
    }
    __name(qe, "qe");
    function xr(w) {
      _(w.L.O.M.name + " instance already deleted");
    }
    __name(xr, "xr");
    function ve() {
    }
    __name(ve, "ve");
    function Le(w, x, I) {
      if (w[x].R === void 0) {
        var G = w[x];
        w[x] = function() {
          return w[x].R.hasOwnProperty(arguments.length) || _("Function '" + I + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + w[x].R + ")!"), w[x].R[arguments.length].apply(this, arguments);
        }, w[x].R = [], w[x].R[G.Y] = G;
      }
    }
    __name(Le, "Le");
    function Ue(w, x, I, G, P, j, K, X) {
      this.name = w, this.constructor = x, this.W = I, this.V = G, this.P = P, this.oa = j, this.aa = K, this.ma = X, this.ia = [];
    }
    __name(Ue, "Ue");
    function we(w, x, I) {
      for (; x !== I; )
        x.aa || _("Expected null or instance of " + I.name + ", got an instance of " + x.name), w = x.aa(w), x = x.P;
      return w;
    }
    __name(we, "we");
    function Ne(w, x) {
      return x === null ? (this.da && _("null is not a valid " + this.name), 0) : (x.L || _('Cannot pass "' + Pe(x) + '" as a ' + this.name), x.L.N || _("Cannot pass deleted object as a pointer of type " + this.name), we(x.L.N, x.L.O.M, this.M));
    }
    __name(Ne, "Ne");
    function Ae(w, x) {
      if (x === null) {
        if (this.da && _("null is not a valid " + this.name), this.ca) {
          var I = this.ea();
          return w !== null && w.push(this.V, I), I;
        }
        return 0;
      }
      if (x.L || _('Cannot pass "' + Pe(x) + '" as a ' + this.name), x.L.N || _("Cannot pass deleted object as a pointer of type " + this.name), !this.ba && x.L.O.ba && _("Cannot convert argument of type " + (x.L.T ? x.L.T.name : x.L.O.name) + " to parameter type " + this.name), I = we(x.L.N, x.L.O.M, this.M), this.ca)
        switch (x.L.S === void 0 && _("Passing raw pointer to smart pointer is illegal"), this.Aa) {
          case 0:
            x.L.T === this ? I = x.L.S : _("Cannot convert argument of type " + (x.L.T ? x.L.T.name : x.L.O.name) + " to parameter type " + this.name);
            break;
          case 1:
            I = x.L.S;
            break;
          case 2:
            if (x.L.T === this)
              I = x.L.S;
            else {
              var G = x.clone();
              I = this.wa(I, ae(function() {
                G.delete();
              })), w !== null && w.push(this.V, I);
            }
            break;
          default:
            _("Unsupporting sharing policy");
        }
      return I;
    }
    __name(Ae, "Ae");
    function $e(w, x) {
      return x === null ? (this.da && _("null is not a valid " + this.name), 0) : (x.L || _('Cannot pass "' + Pe(x) + '" as a ' + this.name), x.L.N || _("Cannot pass deleted object as a pointer of type " + this.name), x.L.O.ba && _("Cannot convert argument of type " + x.L.O.name + " to parameter type " + this.name), we(x.L.N, x.L.O.M, this.M));
    }
    __name($e, "$e");
    function Fe(w, x, I, G) {
      this.name = w, this.M = x, this.da = I, this.ba = G, this.ca = false, this.V = this.wa = this.ea = this.ja = this.Aa = this.va = void 0, x.P !== void 0 ? this.toWireType = Ae : (this.toWireType = G ? Ne : $e, this.U = null);
    }
    __name(Fe, "Fe");
    var Ce = [];
    function pt(w) {
      var x = Ce[w];
      return x || (w >= Ce.length && (Ce.length = w + 1), Ce[w] = x = L.get(w)), x;
    }
    __name(pt, "pt");
    function me(w, x) {
      var I, G, P = (w = ce(w)).includes("j") ? (I = w, G = [], function() {
        if (G.length = 0, Object.assign(G, arguments), I.includes("j")) {
          var j = s["dynCall_" + I];
          j = G && G.length ? j.apply(null, [x].concat(G)) : j.call(null, x);
        } else
          j = pt(x).apply(null, G);
        return j;
      }) : pt(x);
      return typeof P != "function" && _("unknown function pointer with signature " + w + ": " + x), P;
    }
    __name(me, "me");
    var Bt = void 0;
    function Ke(w, x) {
      var I = [], G = {};
      throw x.forEach(/* @__PURE__ */ __name(function P(j) {
        G[j] || ye[j] || (zt[j] ? zt[j].forEach(P) : (I.push(j), G[j] = true));
      }, "P")), new Bt(w + ": " + I.map(Ge).join([", "]));
    }
    __name(Ke, "Ke");
    function yt(w, x, I, G, P) {
      var j = x.length;
      2 > j && _("argTypes array size mismatch! Must at least get return value and 'this' types!");
      var K = x[1] !== null && I !== null, X = false;
      for (I = 1; I < x.length; ++I)
        if (x[I] !== null && x[I].U === void 0) {
          X = true;
          break;
        }
      var Q = x[0].name !== "void", J = j - 2, re = Array(J), De = [], be = [];
      return function() {
        if (arguments.length !== J && _("function " + w + " called with " + arguments.length + " arguments, expected " + J + " args!"), be.length = 0, De.length = K ? 2 : 1, De[0] = P, K) {
          var Oe = x[1].toWireType(be, this);
          De[1] = Oe;
        }
        for (var Se = 0; Se < J; ++Se)
          re[Se] = x[Se + 2].toWireType(be, arguments[Se]), De.push(re[Se]);
        if (Se = G.apply(null, De), X)
          Dt(be);
        else
          for (var ze = K ? 1 : 2; ze < x.length; ze++) {
            var Er = ze === 1 ? Oe : re[ze - 2];
            x[ze].U !== null && x[ze].U(Er);
          }
        return Q ? x[0].fromWireType(Se) : void 0;
      };
    }
    __name(yt, "yt");
    function rr(w, x) {
      for (var I = [], G = 0; G < w; G++)
        I.push(k[x + 4 * G >> 2]);
      return I;
    }
    __name(rr, "rr");
    function bt(w) {
      4 < w && --te[w].fa == 0 && (te[w] = void 0, ie.push(w));
    }
    __name(bt, "bt");
    function Pe(w) {
      if (w === null)
        return "null";
      var x = typeof w;
      return x === "object" || x === "array" || x === "function" ? w.toString() : "" + w;
    }
    __name(Pe, "Pe");
    function Ye(w, x) {
      for (var I = "", G = 0; !(G >= x / 2); ++G) {
        var P = y[w + 2 * G >> 1];
        if (P == 0)
          break;
        I += String.fromCharCode(P);
      }
      return I;
    }
    __name(Ye, "Ye");
    function ht(w, x, I) {
      if (I === void 0 && (I = 2147483647), 2 > I)
        return 0;
      I -= 2;
      var G = x;
      I = I < 2 * w.length ? I / 2 : w.length;
      for (var P = 0; P < I; ++P)
        y[x >> 1] = w.charCodeAt(P), x += 2;
      return y[x >> 1] = 0, x - G;
    }
    __name(ht, "ht");
    function wr(w) {
      return 2 * w.length;
    }
    __name(wr, "wr");
    function hr(w, x) {
      for (var I = 0, G = ""; !(I >= x / 4); ) {
        var P = C[w + 4 * I >> 2];
        if (P == 0)
          break;
        ++I, 65536 <= P ? (P -= 65536, G += String.fromCharCode(55296 | P >> 10, 56320 | 1023 & P)) : G += String.fromCharCode(P);
      }
      return G;
    }
    __name(hr, "hr");
    function Qe(w, x, I) {
      if (I === void 0 && (I = 2147483647), 4 > I)
        return 0;
      var G = x;
      I = G + I - 4;
      for (var P = 0; P < w.length; ++P) {
        var j = w.charCodeAt(P);
        if (55296 <= j && 57343 >= j && (j = 65536 + ((1023 & j) << 10) | 1023 & w.charCodeAt(++P)), C[x >> 2] = j, (x += 4) + 4 > I)
          break;
      }
      return C[x >> 2] = 0, x - G;
    }
    __name(Qe, "Qe");
    function dt(w) {
      for (var x = 0, I = 0; I < w.length; ++I) {
        var G = w.charCodeAt(I);
        55296 <= G && 57343 >= G && ++I, x += 4;
      }
      return x;
    }
    __name(dt, "dt");
    var Vt = {};
    function xt(w) {
      var x = Vt[w];
      return x === void 0 ? ce(w) : x;
    }
    __name(xt, "xt");
    var Nt = [], Or = [], pn = [null, [], []];
    z = s.BindingError = B("BindingError"), s.count_emval_handles = function() {
      for (var w = 0, x = 5; x < te.length; ++x)
        te[x] !== void 0 && ++w;
      return w;
    }, s.get_first_emval = function() {
      for (var w = 5; w < te.length; ++w)
        if (te[w] !== void 0)
          return te[w];
      return null;
    }, W = s.PureVirtualError = B("PureVirtualError");
    for (var qa = Array(256), hn = 0; 256 > hn; ++hn)
      qa[hn] = String.fromCharCode(hn);
    fe = qa, s.getInheritedInstanceCount = function() {
      return Object.keys(_e).length;
    }, s.getLiveInheritedInstances = function() {
      var w, x = [];
      for (w in _e)
        _e.hasOwnProperty(w) && x.push(_e[w]);
      return x;
    }, s.flushPendingDeletes = pe, s.setDelayFunction = function(w) {
      xe = w, ge.length && xe && xe(pe);
    }, nt = s.InternalError = B("InternalError"), ve.prototype.isAliasOf = function(w) {
      if (!(this instanceof ve && w instanceof ve))
        return false;
      var x = this.L.O.M, I = this.L.N, G = w.L.O.M;
      for (w = w.L.N; x.P; )
        I = x.aa(I), x = x.P;
      for (; G.P; )
        w = G.aa(w), G = G.P;
      return x === G && I === w;
    }, ve.prototype.clone = function() {
      if (this.L.N || xr(this), this.L.$)
        return this.L.count.value += 1, this;
      var w = Xe, x = Object, I = x.create, G = Object.getPrototypeOf(this), P = this.L;
      return w = w(I.call(x, G, { L: { value: { count: P.count, Z: P.Z, $: P.$, N: P.N, O: P.O, S: P.S, T: P.T } } })), w.L.count.value += 1, w.L.Z = false, w;
    }, ve.prototype.delete = function() {
      this.L.N || xr(this), this.L.Z && !this.L.$ && _("Object already scheduled for deletion"), We(this), He(this.L), this.L.$ || (this.L.S = void 0, this.L.N = void 0);
    }, ve.prototype.isDeleted = function() {
      return !this.L.N;
    }, ve.prototype.deleteLater = function() {
      return this.L.N || xr(this), this.L.Z && !this.L.$ && _("Object already scheduled for deletion"), ge.push(this), ge.length === 1 && xe && xe(pe), this.L.Z = true, this;
    }, Fe.prototype.pa = function(w) {
      return this.ja && (w = this.ja(w)), w;
    }, Fe.prototype.ga = function(w) {
      this.V && this.V(w);
    }, Fe.prototype.argPackAdvance = 8, Fe.prototype.readValueFromPointer = ft, Fe.prototype.deleteObject = function(w) {
      w !== null && w.delete();
    }, Fe.prototype.fromWireType = function(w) {
      function x() {
        return this.ca ? at(this.M.W, { O: this.va, N: G, T: this, S: w }) : at(this.M.W, { O: this, N: w });
      }
      __name(x, "x");
      var I, G = this.pa(w);
      if (!G)
        return this.ga(w), null;
      var P = _e[he(this.M, G)];
      if (P !== void 0)
        return P.L.count.value === 0 ? (P.L.N = G, P.L.S = w, P.clone()) : (P = P.clone(), this.ga(w), P);
      if (!(P = rt[P = this.M.oa(G)]))
        return x.call(this);
      P = this.ba ? P.ka : P.pointerType;
      var j = (/* @__PURE__ */ __name(function K(X, Q, J) {
        return Q === J ? X : J.P === void 0 || (X = K(X, Q, J.P)) === null ? null : J.ma(X);
      }, "K"))(G, this.M, P.M);
      return j === null ? x.call(this) : this.ca ? at(P.M.W, { O: P, N: j, T: this, S: w }) : at(P.M.W, { O: P, N: j });
    }, Bt = s.UnboundTypeError = B("UnboundTypeError");
    var Hl = { q: function(w, x, I) {
      w = ce(w), x = tt(x, "wrapper"), I = N(I);
      var G = [].slice, P = x.M, j = P.W, K = P.P.W, X = P.P.constructor;
      for (var Q in w = Z(w, function() {
        P.P.ia.forEach(function(J) {
          if (this[J] === K[J])
            throw new W("Pure virtual function " + J + " must be implemented in JavaScript");
        }.bind(this)), Object.defineProperty(this, "__parent", { value: j }), this.__construct.apply(this, G.call(arguments));
      }), j.__construct = function() {
        this === j && _("Pass correct 'this' to __construct");
        var J = X.implement.apply(void 0, [this].concat(G.call(arguments)));
        We(J);
        var re = J.L;
        J.notifyOnDestruction(), re.$ = true, Object.defineProperties(this, { L: { value: re } }), Xe(this), J = he(P, J = re.N), _e.hasOwnProperty(J) ? _("Tried to register registered instance: " + J) : _e[J] = this;
      }, j.__destruct = function() {
        this === j && _("Pass correct 'this' to __destruct"), We(this);
        var J = this.L.N;
        J = he(P, J), _e.hasOwnProperty(J) ? delete _e[J] : _("Tried to unregister unregistered instance: " + J);
      }, w.prototype = Object.create(j), I)
        w.prototype[Q] = I[Q];
      return ae(w);
    }, l: function(w) {
      var x = Ct[w];
      delete Ct[w];
      var I = x.ea, G = x.V, P = x.ha;
      lt([w], P.map((j) => j.sa).concat(P.map((j) => j.ya)), (j) => {
        var K = {};
        return P.forEach((X, Q) => {
          var J = j[Q], re = X.qa, De = X.ra, be = j[Q + P.length], Oe = X.xa, Se = X.za;
          K[X.na] = { read: (ze) => J.fromWireType(re(De, ze)), write: (ze, Er) => {
            var dr = [];
            Oe(Se, ze, be.toWireType(dr, Er)), Dt(dr);
          } };
        }), [{ name: x.name, fromWireType: function(X) {
          var Q, J = {};
          for (Q in K)
            J[Q] = K[Q].read(X);
          return G(X), J;
        }, toWireType: function(X, Q) {
          for (var J in K)
            if (!(J in Q))
              throw TypeError('Missing field:  "' + J + '"');
          var re = I();
          for (J in K)
            K[J].write(re, Q[J]);
          return X !== null && X.push(G, re), re;
        }, argPackAdvance: 8, readValueFromPointer: ft, U: G }];
      });
    }, v: function() {
    }, B: function(w, x, I, G, P) {
      var j = Ut(I);
      qe(w, { name: x = ce(x), fromWireType: function(K) {
        return !!K;
      }, toWireType: function(K, X) {
        return X ? G : P;
      }, argPackAdvance: 8, readValueFromPointer: function(K) {
        if (I === 1)
          var X = v;
        else if (I === 2)
          X = y;
        else if (I === 4)
          X = C;
        else
          throw TypeError("Unknown boolean type size: " + x);
        return this.fromWireType(X[K >> j]);
      }, U: null });
    }, h: function(w, x, I, G, P, j, K, X, Q, J, re, De, be) {
      re = ce(re), j = me(P, j), X && (X = me(K, X)), J && (J = me(Q, J)), be = me(De, be);
      var Oe, Se = Y(re);
      Oe = /* @__PURE__ */ __name(function() {
        Ke("Cannot construct " + re + " due to unbound types", [G]);
      }, "Oe"), s.hasOwnProperty(Se) ? (_("Cannot register public name '" + Se + "' twice"), Le(s, Se, Se), s.hasOwnProperty(void 0) && _("Cannot register multiple overloads of a function with the same number of arguments (undefined)!"), s[Se].R[void 0] = Oe) : s[Se] = Oe, lt([w, x, I], G ? [G] : [], function(ze) {
        if (ze = ze[0], G)
          var Er, dr = ze.M, Lr = dr.W;
        else
          Lr = ve.prototype;
        ze = Z(Se, function() {
          if (Object.getPrototypeOf(this) !== ci)
            throw new z("Use 'new' to construct " + re);
          if (Fr.X === void 0)
            throw new z(re + " has no accessible constructor");
          var Ka = Fr.X[arguments.length];
          if (Ka === void 0)
            throw new z("Tried to invoke ctor of " + re + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(Fr.X).toString() + ") parameters instead!");
          return Ka.apply(this, arguments);
        });
        var ci = Object.create(Lr, { constructor: { value: ze } });
        ze.prototype = ci;
        var Fr = new Ue(re, ze, ci, be, dr, j, X, J);
        dr = new Fe(re, Fr, true, false), Lr = new Fe(re + "*", Fr, false, false);
        var Ja = new Fe(re + " const*", Fr, false, true);
        return rt[w] = { pointerType: Lr, ka: Ja }, Er = ze, s.hasOwnProperty(Se) || it("Replacing nonexistant public symbol"), s[Se] = Er, s[Se].Y = void 0, [dr, Lr, Ja];
      });
    }, d: function(w, x, I, G, P, j, K) {
      var X = rr(I, G);
      x = ce(x), j = me(P, j), lt([], [w], function(Q) {
        function J() {
          Ke("Cannot call " + re + " due to unbound types", X);
        }
        __name(J, "J");
        var re = (Q = Q[0]).name + "." + x;
        x.startsWith("@@") && (x = Symbol[x.substring(2)]);
        var De = Q.M.constructor;
        return De[x] === void 0 ? (J.Y = I - 1, De[x] = J) : (Le(De, x, re), De[x].R[I - 1] = J), lt([], X, function(be) {
          return be = yt(re, [be[0], null].concat(be.slice(1)), null, j, K), De[x].R === void 0 ? (be.Y = I - 1, De[x] = be) : De[x].R[I - 1] = be, [];
        }), [];
      });
    }, p: function(w, x, I, G, P, j) {
      0 < x || ee();
      var K = rr(x, I);
      P = me(G, P), lt([], [w], function(X) {
        var Q = "constructor " + (X = X[0]).name;
        if (X.M.X === void 0 && (X.M.X = []), X.M.X[x - 1] !== void 0)
          throw new z("Cannot register multiple constructors with identical number of parameters (" + (x - 1) + ") for class '" + X.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
        return X.M.X[x - 1] = () => {
          Ke("Cannot construct " + X.name + " due to unbound types", K);
        }, lt([], K, function(J) {
          return J.splice(1, 0, null), X.M.X[x - 1] = yt(Q, J, null, P, j), [];
        }), [];
      });
    }, a: function(w, x, I, G, P, j, K, X) {
      var Q = rr(I, G);
      x = ce(x), j = me(P, j), lt([], [w], function(J) {
        function re() {
          Ke("Cannot call " + De + " due to unbound types", Q);
        }
        __name(re, "re");
        var De = (J = J[0]).name + "." + x;
        x.startsWith("@@") && (x = Symbol[x.substring(2)]), X && J.M.ia.push(x);
        var be = J.M.W, Oe = be[x];
        return Oe === void 0 || Oe.R === void 0 && Oe.className !== J.name && Oe.Y === I - 2 ? (re.Y = I - 2, re.className = J.name, be[x] = re) : (Le(be, x, De), be[x].R[I - 2] = re), lt([], Q, function(Se) {
          return Se = yt(De, Se, J, j, K), be[x].R === void 0 ? (Se.Y = I - 2, be[x] = Se) : be[x].R[I - 2] = Se, [];
        }), [];
      });
    }, A: function(w, x) {
      qe(w, { name: x = ce(x), fromWireType: function(I) {
        var G = N(I);
        return bt(I), G;
      }, toWireType: function(I, G) {
        return ae(G);
      }, argPackAdvance: 8, readValueFromPointer: ft, U: null });
    }, n: function(w, x, I) {
      I = Ut(I), qe(w, { name: x = ce(x), fromWireType: function(G) {
        return G;
      }, toWireType: function(G, P) {
        return P;
      }, argPackAdvance: 8, readValueFromPointer: function(G, P) {
        switch (P) {
          case 2:
            return function(j) {
              return this.fromWireType(S[j >> 2]);
            };
          case 3:
            return function(j) {
              return this.fromWireType(E[j >> 3]);
            };
          default:
            throw TypeError("Unknown float type: " + G);
        }
      }(x, I), U: null });
    }, e: function(w, x, I, G, P) {
      x = ce(x), P === -1 && (P = 4294967295), P = Ut(I);
      var j = /* @__PURE__ */ __name((X) => X, "j");
      if (G === 0) {
        var K = 32 - 8 * I;
        j = /* @__PURE__ */ __name((X) => X << K >>> K, "j");
      }
      I = x.includes("unsigned") ? function(X, Q) {
        return Q >>> 0;
      } : function(X, Q) {
        return Q;
      }, qe(w, { name: x, fromWireType: j, toWireType: I, argPackAdvance: 8, readValueFromPointer: function(X, Q, J) {
        switch (Q) {
          case 0:
            return J ? function(re) {
              return v[re];
            } : function(re) {
              return g[re];
            };
          case 1:
            return J ? function(re) {
              return y[re >> 1];
            } : function(re) {
              return b[re >> 1];
            };
          case 2:
            return J ? function(re) {
              return C[re >> 2];
            } : function(re) {
              return k[re >> 2];
            };
          default:
            throw TypeError("Unknown integer type: " + X);
        }
      }(x, P, G !== 0), U: null });
    }, b: function(w, x, I) {
      function G(j) {
        j >>= 2;
        var K = k;
        return new P(K.buffer, K[j + 1], K[j]);
      }
      __name(G, "G");
      var P = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array][x];
      qe(w, { name: I = ce(I), fromWireType: G, argPackAdvance: 8, readValueFromPointer: G }, { ta: true });
    }, o: function(w, x) {
      var I = (x = ce(x)) === "std::string";
      qe(w, { name: x, fromWireType: function(G) {
        var P = k[G >> 2], j = G + 4;
        if (I)
          for (var K = j, X = 0; X <= P; ++X) {
            var Q = j + X;
            if (X == P || g[Q] == 0) {
              if (K = K ? d(g, K, Q - K) : "", J === void 0)
                var J = K;
              else
                J += "\0" + K;
              K = Q + 1;
            }
          }
        else {
          for (X = 0, J = Array(P); X < P; ++X)
            J[X] = String.fromCharCode(g[j + X]);
          J = J.join("");
        }
        return Ht(G), J;
      }, toWireType: function(G, P) {
        P instanceof ArrayBuffer && (P = new Uint8Array(P));
        var j, K = typeof P == "string";
        if (K || P instanceof Uint8Array || P instanceof Uint8ClampedArray || P instanceof Int8Array || _("Cannot pass non-string to std::string"), I && K) {
          var X = 0;
          for (j = 0; j < P.length; ++j) {
            var Q = P.charCodeAt(j);
            127 >= Q ? X++ : 2047 >= Q ? X += 2 : 55296 <= Q && 57343 >= Q ? (X += 4, ++j) : X += 3;
          }
          j = X;
        } else
          j = P.length;
        if (Q = (X = fi(4 + j + 1)) + 4, k[X >> 2] = j, I && K) {
          if (K = Q, Q = j + 1, j = g, 0 < Q) {
            Q = K + Q - 1;
            for (var J = 0; J < P.length; ++J) {
              var re = P.charCodeAt(J);
              if (55296 <= re && 57343 >= re && (re = 65536 + ((1023 & re) << 10) | 1023 & P.charCodeAt(++J)), 127 >= re) {
                if (K >= Q)
                  break;
                j[K++] = re;
              } else {
                if (2047 >= re) {
                  if (K + 1 >= Q)
                    break;
                  j[K++] = 192 | re >> 6;
                } else {
                  if (65535 >= re) {
                    if (K + 2 >= Q)
                      break;
                    j[K++] = 224 | re >> 12;
                  } else {
                    if (K + 3 >= Q)
                      break;
                    j[K++] = 240 | re >> 18, j[K++] = 128 | re >> 12 & 63;
                  }
                  j[K++] = 128 | re >> 6 & 63;
                }
                j[K++] = 128 | 63 & re;
              }
            }
            j[K] = 0;
          }
        } else if (K)
          for (K = 0; K < j; ++K)
            255 < (J = P.charCodeAt(K)) && (Ht(Q), _("String has UTF-16 code units that do not fit in 8 bits")), g[Q + K] = J;
        else
          for (K = 0; K < j; ++K)
            g[Q + K] = P[K];
        return G !== null && G.push(Ht, X), X;
      }, argPackAdvance: 8, readValueFromPointer: ft, U: function(G) {
        Ht(G);
      } });
    }, k: function(w, x, I) {
      if (I = ce(I), x === 2)
        var G = Ye, P = ht, j = wr, K = /* @__PURE__ */ __name(() => b, "K"), X = 1;
      else
        x === 4 && (G = hr, P = Qe, j = dt, K = /* @__PURE__ */ __name(() => k, "K"), X = 2);
      qe(w, { name: I, fromWireType: function(Q) {
        for (var J, re = k[Q >> 2], De = K(), be = Q + 4, Oe = 0; Oe <= re; ++Oe) {
          var Se = Q + 4 + Oe * x;
          (Oe == re || De[Se >> X] == 0) && (be = G(be, Se - be), J === void 0 ? J = be : J += "\0" + be, be = Se + x);
        }
        return Ht(Q), J;
      }, toWireType: function(Q, J) {
        typeof J != "string" && _("Cannot pass non-string to C++ string type " + I);
        var re = j(J), De = fi(4 + re + x);
        return k[De >> 2] = re >> X, P(J, De + 4, re + x), Q !== null && Q.push(Ht, De), De;
      }, argPackAdvance: 8, readValueFromPointer: ft, U: function(Q) {
        Ht(Q);
      } });
    }, m: function(w, x, I, G, P, j) {
      Ct[w] = { name: ce(x), ea: me(I, G), V: me(P, j), ha: [] };
    }, c: function(w, x, I, G, P, j, K, X, Q, J) {
      Ct[w].ha.push({ na: ce(x), sa: I, qa: me(G, P), ra: j, ya: K, xa: me(X, Q), za: J });
    }, C: function(w, x) {
      qe(w, { ua: true, name: x = ce(x), argPackAdvance: 0, fromWireType: function() {
      }, toWireType: function() {
      } });
    }, t: function(w, x, I, G, P) {
      w = Nt[w], x = N(x), I = xt(I);
      var j = [];
      return k[G >> 2] = ae(j), w(x, I, j, P);
    }, j: function(w, x, I, G) {
      w = Nt[w], w(x = N(x), I = xt(I), null, G);
    }, f: bt, g: function(w, x) {
      var I, G, P = function(Q, J) {
        for (var re = Array(Q), De = 0; De < Q; ++De)
          re[De] = tt(k[J + 4 * De >> 2], "parameter " + De);
        return re;
      }(w, x), j = P[0], K = Or[x = j.name + "_$" + P.slice(1).map(function(Q) {
        return Q.name;
      }).join("_") + "$"];
      if (K !== void 0)
        return K;
      var X = Array(w - 1);
      return I = /* @__PURE__ */ __name((Q, J, re, De) => {
        for (var be = 0, Oe = 0; Oe < w - 1; ++Oe)
          X[Oe] = P[Oe + 1].readValueFromPointer(De + be), be += P[Oe + 1].argPackAdvance;
        for (Oe = 0, Q = Q[J].apply(Q, X); Oe < w - 1; ++Oe)
          P[Oe + 1].la && P[Oe + 1].la(X[Oe]);
        if (!j.ua)
          return j.toWireType(re, Q);
      }, "I"), G = Nt.length, Nt.push(I), K = G, Or[x] = K;
    }, r: function(w) {
      4 < w && (te[w].fa += 1);
    }, s: function(w) {
      Dt(N(w)), bt(w);
    }, i: function() {
      ee("");
    }, x: function(w, x, I) {
      g.copyWithin(w, x, x + I);
    }, w: function(w) {
      var x = g.length;
      if (2147483648 < (w >>>= 0))
        return false;
      for (var I = 1; 4 >= I; I *= 2) {
        var G = x * (1 + 0.2 / I);
        G = Math.min(G, w + 100663296);
        var P = Math, j = P.min;
        G = Math.max(w, G), G += (65536 - G % 65536) % 65536;
        e: {
          var K = c.buffer;
          try {
            c.grow(j.call(P, 2147483648, G) - K.byteLength + 65535 >>> 16), D();
            var X = 1;
            break e;
          } catch {
          }
          X = void 0;
        }
        if (X)
          return true;
      }
      return false;
    }, z: function() {
      return 52;
    }, u: function() {
      return 70;
    }, y: function(w, x, I, G) {
      for (var P = 0, j = 0; j < I; j++) {
        var K = k[x >> 2], X = k[x + 4 >> 2];
        x += 8;
        for (var Q = 0; Q < X; Q++) {
          var J = g[K + Q], re = pn[w];
          J === 0 || J === 10 ? ((w === 1 ? o : u)(d(re, 0)), re.length = 0) : re.push(J);
        }
        P += X;
      }
      return k[G >> 2] = P, 0;
    } };
    (function() {
      function w(P) {
        s.asm = P.exports, c = s.asm.D, D(), L = s.asm.I, U.unshift(s.asm.E), --H == 0 && q && (P = q, q = null, P());
      }
      __name(w, "w");
      function x(P) {
        w(P.instance);
      }
      __name(x, "x");
      function I(P) {
        return (typeof fetch == "function" ? fetch(r, { credentials: "same-origin" }).then(function(j) {
          if (!j.ok)
            throw "failed to load wasm binary file at '" + r + "'";
          return j.arrayBuffer();
        }).catch(function() {
          return R();
        }) : Promise.resolve().then(function() {
          return R();
        })).then(function(j) {
          return WebAssembly.instantiate(j, G);
        }).then(function(j) {
          return j;
        }).then(P, function(j) {
          u("failed to asynchronously prepare wasm: " + j), ee(j);
        });
      }
      __name(I, "I");
      var G = { a: Hl };
      if (H++, s.instantiateWasm)
        try {
          return s.instantiateWasm(G, w);
        } catch (P) {
          u("Module.instantiateWasm callback failed with error: " + P), f(P);
        }
      (typeof WebAssembly.instantiateStreaming != "function" || A() || typeof fetch != "function" ? I(x) : fetch(r, { credentials: "same-origin" }).then(function(P) {
        return WebAssembly.instantiateStreaming(P, G).then(x, function(j) {
          return u("wasm streaming compile failed: " + j), u("falling back to ArrayBuffer instantiation"), I(x);
        });
      })).catch(f);
    })();
    var Ya = s.___getTypeName = function() {
      return (Ya = s.___getTypeName = s.asm.F).apply(null, arguments);
    };
    function fi() {
      return (fi = s.asm.H).apply(null, arguments);
    }
    __name(fi, "fi");
    function Ht() {
      return (Ht = s.asm.J).apply(null, arguments);
    }
    __name(Ht, "Ht");
    function Za() {
      0 < H || (O(T), 0 < H || n || (n = true, s.calledRun = true, p || (O(U), l(s), O(M))));
    }
    __name(Za, "Za");
    return s.__embind_initialize_bindings = function() {
      return (s.__embind_initialize_bindings = s.asm.G).apply(null, arguments);
    }, s.dynCall_jiji = function() {
      return (s.dynCall_jiji = s.asm.K).apply(null, arguments);
    }, q = /* @__PURE__ */ __name(function w() {
      n || Za(), n || (q = w);
    }, "w"), Za(), t.ready;
  };
})();
async function Rl(e) {
  let t = await YD({ instantiateWasm(r, n) {
    WebAssembly.instantiate(e, r).then((i) => {
      i instanceof WebAssembly.Instance ? n(i) : n(i.instance);
    });
  } });
  return Pl(t);
}
__name(Rl, "Rl");
var de;
var er = new Array(128).fill(void 0);
er.push(void 0, null, true, false);
var ln = er.length;
function Qt(e) {
  ln === er.length && er.push(er.length + 1);
  let t = ln;
  return ln = er[t], er[t] = e, t;
}
__name(Qt, "Qt");
function Rt(e) {
  return er[e];
}
__name(Rt, "Rt");
function ZD(e) {
  e < 132 || (er[e] = ln, ln = e);
}
__name(ZD, "ZD");
function tr(e) {
  let t = Rt(e);
  return ZD(e), t;
}
__name(tr, "tr");
var fn = 0;
var sn = null;
function ai() {
  return (sn === null || sn.byteLength === 0) && (sn = new Uint8Array(de.memory.buffer)), sn;
}
__name(ai, "ai");
var oi = new TextEncoder("utf-8");
var JD = typeof oi.encodeInto == "function" ? function(e, t) {
  return oi.encodeInto(e, t);
} : function(e, t) {
  let r = oi.encode(e);
  return t.set(r), { read: e.length, written: r.length };
};
function ja(e, t, r) {
  if (r === void 0) {
    let u = oi.encode(e), s = t(u.length);
    return ai().subarray(s, s + u.length).set(u), fn = u.length, s;
  }
  let n = e.length, i = t(n), a = ai(), o = 0;
  for (; o < n; o++) {
    let u = e.charCodeAt(o);
    if (u > 127)
      break;
    a[i + o] = u;
  }
  if (o !== n) {
    o !== 0 && (e = e.slice(o)), i = r(i, n, n = o + e.length * 3);
    let u = ai().subarray(i + o, i + n), s = JD(e, u);
    o += s.written;
  }
  return fn = o, i;
}
__name(ja, "ja");
function Ul(e) {
  return e == null;
}
__name(Ul, "Ul");
var un = null;
function Je() {
  return (un === null || un.byteLength === 0) && (un = new Int32Array(de.memory.buffer)), un;
}
__name(Je, "Je");
var Bl = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
Bl.decode();
function si(e, t) {
  return Bl.decode(ai().subarray(e, e + t));
}
__name(si, "si");
function KD(e, t) {
  if (!(e instanceof t))
    throw new Error(`expected instance of ${t.name}`);
  return e.ptr;
}
__name(KD, "KD");
var ui = /* @__PURE__ */ __name(class {
  static __wrap(e) {
    let t = Object.create(ui.prototype);
    return t.ptr = e, t;
  }
  __destroy_into_raw() {
    let e = this.ptr;
    return this.ptr = 0, e;
  }
  free() {
    let e = this.__destroy_into_raw();
    de.__wbg_bbox_free(e);
  }
  get x() {
    return de.__wbg_get_bbox_x(this.ptr);
  }
  set x(e) {
    de.__wbg_set_bbox_x(this.ptr, e);
  }
  get y() {
    return de.__wbg_get_bbox_y(this.ptr);
  }
  set y(e) {
    de.__wbg_set_bbox_y(this.ptr, e);
  }
  get width() {
    return de.__wbg_get_bbox_width(this.ptr);
  }
  set width(e) {
    de.__wbg_set_bbox_width(this.ptr, e);
  }
  get height() {
    return de.__wbg_get_bbox_height(this.ptr);
  }
  set height(e) {
    de.__wbg_set_bbox_height(this.ptr, e);
  }
}, "ui");
var Nl = /* @__PURE__ */ __name(class {
  static __wrap(e) {
    let t = Object.create(Nl.prototype);
    return t.ptr = e, t;
  }
  __destroy_into_raw() {
    let e = this.ptr;
    return this.ptr = 0, e;
  }
  free() {
    let e = this.__destroy_into_raw();
    de.__wbg_renderedimage_free(e);
  }
  get width() {
    return de.renderedimage_width(this.ptr) >>> 0;
  }
  get height() {
    return de.renderedimage_height(this.ptr) >>> 0;
  }
  asPng() {
    try {
      let n = de.__wbindgen_add_to_stack_pointer(-16);
      de.renderedimage_asPng(n, this.ptr);
      var e = Je()[n / 4 + 0], t = Je()[n / 4 + 1], r = Je()[n / 4 + 2];
      if (r)
        throw tr(t);
      return tr(e);
    } finally {
      de.__wbindgen_add_to_stack_pointer(16);
    }
  }
  get pixels() {
    let e = de.renderedimage_pixels(this.ptr);
    return tr(e);
  }
}, "Nl");
var za = /* @__PURE__ */ __name(class {
  static __wrap(e) {
    let t = Object.create(za.prototype);
    return t.ptr = e, t;
  }
  __destroy_into_raw() {
    let e = this.ptr;
    return this.ptr = 0, e;
  }
  free() {
    let e = this.__destroy_into_raw();
    de.__wbg_resvg_free(e);
  }
  constructor(e, t) {
    try {
      let u = de.__wbindgen_add_to_stack_pointer(-16);
      var r = Ul(t) ? 0 : ja(t, de.__wbindgen_malloc, de.__wbindgen_realloc), n = fn;
      de.resvg_new(u, Qt(e), r, n);
      var i = Je()[u / 4 + 0], a = Je()[u / 4 + 1], o = Je()[u / 4 + 2];
      if (o)
        throw tr(a);
      return za.__wrap(i);
    } finally {
      de.__wbindgen_add_to_stack_pointer(16);
    }
  }
  get width() {
    return de.resvg_width(this.ptr);
  }
  get height() {
    return de.resvg_height(this.ptr);
  }
  render() {
    try {
      let n = de.__wbindgen_add_to_stack_pointer(-16);
      de.resvg_render(n, this.ptr);
      var e = Je()[n / 4 + 0], t = Je()[n / 4 + 1], r = Je()[n / 4 + 2];
      if (r)
        throw tr(t);
      return Nl.__wrap(e);
    } finally {
      de.__wbindgen_add_to_stack_pointer(16);
    }
  }
  toString() {
    try {
      let r = de.__wbindgen_add_to_stack_pointer(-16);
      de.resvg_toString(r, this.ptr);
      var e = Je()[r / 4 + 0], t = Je()[r / 4 + 1];
      return si(e, t);
    } finally {
      de.__wbindgen_add_to_stack_pointer(16), de.__wbindgen_free(e, t);
    }
  }
  innerBBox() {
    let e = de.resvg_innerBBox(this.ptr);
    return e === 0 ? void 0 : ui.__wrap(e);
  }
  getBBox() {
    let e = de.resvg_getBBox(this.ptr);
    return e === 0 ? void 0 : ui.__wrap(e);
  }
  cropByBBox(e) {
    KD(e, ui), de.resvg_cropByBBox(this.ptr, e.ptr);
  }
  imagesToResolve() {
    try {
      let n = de.__wbindgen_add_to_stack_pointer(-16);
      de.resvg_imagesToResolve(n, this.ptr);
      var e = Je()[n / 4 + 0], t = Je()[n / 4 + 1], r = Je()[n / 4 + 2];
      if (r)
        throw tr(t);
      return tr(e);
    } finally {
      de.__wbindgen_add_to_stack_pointer(16);
    }
  }
  resolveImage(e, t) {
    try {
      let i = de.__wbindgen_add_to_stack_pointer(-16), a = ja(e, de.__wbindgen_malloc, de.__wbindgen_realloc), o = fn;
      de.resvg_resolveImage(i, this.ptr, a, o, Qt(t));
      var r = Je()[i / 4 + 0], n = Je()[i / 4 + 1];
      if (n)
        throw tr(r);
    } finally {
      de.__wbindgen_add_to_stack_pointer(16);
    }
  }
}, "za");
async function QD(e, t) {
  if (typeof Response == "function" && e instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming == "function")
      try {
        return await WebAssembly.instantiateStreaming(e, t);
      } catch (n) {
        if (e.headers.get("Content-Type") != "application/wasm")
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", n);
        else
          throw n;
      }
    let r = await e.arrayBuffer();
    return await WebAssembly.instantiate(r, t);
  } else {
    let r = await WebAssembly.instantiate(e, t);
    return r instanceof WebAssembly.Instance ? { instance: r, module: e } : r;
  }
}
__name(QD, "QD");
function ey() {
  let e = {};
  return e.wbg = {}, e.wbg.__wbg_new_15d3966e9981a196 = function(t, r) {
    let n = new Error(si(t, r));
    return Qt(n);
  }, e.wbg.__wbindgen_memory = function() {
    let t = de.memory;
    return Qt(t);
  }, e.wbg.__wbg_buffer_cf65c07de34b9a08 = function(t) {
    let r = Rt(t).buffer;
    return Qt(r);
  }, e.wbg.__wbg_newwithbyteoffsetandlength_9fb2f11355ecadf5 = function(t, r, n) {
    let i = new Uint8Array(Rt(t), r >>> 0, n >>> 0);
    return Qt(i);
  }, e.wbg.__wbindgen_object_drop_ref = function(t) {
    tr(t);
  }, e.wbg.__wbg_new_537b7341ce90bb31 = function(t) {
    let r = new Uint8Array(Rt(t));
    return Qt(r);
  }, e.wbg.__wbg_instanceof_Uint8Array_01cebe79ca606cca = function(t) {
    let r;
    try {
      r = Rt(t) instanceof Uint8Array;
    } catch {
      r = false;
    }
    return r;
  }, e.wbg.__wbindgen_string_get = function(t, r) {
    let n = Rt(r), i = typeof n == "string" ? n : void 0;
    var a = Ul(i) ? 0 : ja(i, de.__wbindgen_malloc, de.__wbindgen_realloc), o = fn;
    Je()[t / 4 + 1] = o, Je()[t / 4 + 0] = a;
  }, e.wbg.__wbg_new_b525de17f44a8943 = function() {
    let t = new Array();
    return Qt(t);
  }, e.wbg.__wbindgen_string_new = function(t, r) {
    let n = si(t, r);
    return Qt(n);
  }, e.wbg.__wbg_push_49c286f04dd3bf59 = function(t, r) {
    return Rt(t).push(Rt(r));
  }, e.wbg.__wbg_length_27a2afe8ab42b09f = function(t) {
    return Rt(t).length;
  }, e.wbg.__wbg_set_17499e8aa4003ebd = function(t, r, n) {
    Rt(t).set(Rt(r), n >>> 0);
  }, e.wbg.__wbindgen_throw = function(t, r) {
    throw new Error(si(t, r));
  }, e;
}
__name(ey, "ey");
function ty(e, t) {
  return de = e.exports, Ml.__wbindgen_wasm_module = t, un = null, sn = null, de;
}
__name(ty, "ty");
async function Ml(e) {
  typeof e > "u" && (e = new URL("index_bg.wasm", void 0));
  let t = ey();
  (typeof e == "string" || typeof Request == "function" && e instanceof Request || typeof URL == "function" && e instanceof URL) && (e = fetch(e));
  let { instance: r, module: n } = await QD(await e, t);
  return ty(r, n);
}
__name(Ml, "Ml");
var ry = Ml;
var Va = false;
var Gl = /* @__PURE__ */ __name(async (e) => {
  if (Va)
    throw new Error("Already initialized. The `initWasm()` function can be used only once.");
  await ry(await e), Va = true;
}, "Gl");
var Wl = /* @__PURE__ */ __name(class extends za {
  constructor(e, t) {
    if (!Va)
      throw new Error("Wasm has not been initialized. Call `initWasm()` function.");
    super(e, JSON.stringify(t));
  }
}, "Wl");
var $l = sy;
var ny = /[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]+/;
var iy = /^[a-z\u00E0-\u00FCA-Z\u00C0-\u00DC][\d|a-z\u00E0-\u00FCA-Z\u00C0-\u00DC]*$/;
var ay = /([A-Z\u00C0-\u00DC]{4,})/g;
var oy = /^[A-Z\u00C0-\u00DC]+$/;
function sy(e) {
  for (var t = e.split(ny), r = t.length, n = new Array(r), i = 0; i < r; i++) {
    var a = t[i];
    if (a !== "") {
      var o = iy.test(a) && !oy.test(a);
      o && (a = a.replace(ay, function(s, l, f) {
        return uy(s, a.length - f - s.length == 0);
      }));
      var u = a[0];
      u = i > 0 ? u.toUpperCase() : u.toLowerCase(), n[i] = u + (o ? a.slice(1) : a.slice(1).toLowerCase());
    }
  }
  return n.join("");
}
__name(sy, "sy");
function uy(e, t) {
  var r = e.split(""), n = r.shift().toUpperCase(), i = t ? r.pop().toLowerCase() : r.pop();
  return n + r.join("").toLowerCase() + i;
}
__name(uy, "uy");
var cn = /* @__PURE__ */ __name((e) => e.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t").replace(/\f/g, "\\f").replace(/"/g, '\\"'), "cn");
var jl = /* @__PURE__ */ __name((e) => {
  let t = "", r = e.getAttribute("style");
  if (r) {
    let a = r.replace(/\n/g, "").replace(/\s\s+/g, " ").split(/;(?![^(]*\))/).reduce((o, u) => {
      let [s, l] = u.split(/:(.+)/);
      return s && l && (o += `"${$l(s.trim())}": "${cn(l.trim())}",`), o;
    }, "");
    a.endsWith(",") && (a = a.slice(0, -1)), a && (t += `"style":{${a}},`);
  }
  let n = e.getAttribute("src");
  if (n) {
    let i = e.getAttribute("width"), a = e.getAttribute("height");
    i && a ? t += `"src":"${cn(n)}", "width":"${i}", "height":"${a}",` : (console.warn("Image missing width or height attribute as required by Satori"), t += `"src":"${cn(n)}",`);
  }
  return t;
}, "jl");
var li = /* @__PURE__ */ __name((e) => e.endsWith(",") ? e.slice(0, -1) : e, "li");
async function zl(e) {
  let t = "";
  await new HTMLRewriter().on("*", { element(n) {
    let i = jl(n);
    t += `{"type":"${n.tagName}", "props":{${i}"children": [`;
    try {
      n.onEndTag(() => {
        t = li(t), t += "]}},";
      });
    } catch {
      t = li(t), t += "]}},";
    }
  }, text(n) {
    if (n.text) {
      let i = cn(n.text);
      i && (t += `"${i}",`);
    }
  } }).transform(new Response(`<div style="display: flex; flex-direction: column;">${e}</div>`)).text(), t = li(t);
  try {
    return JSON.parse(t);
  } catch (n) {
    return console.error(n), null;
  }
}
__name(zl, "zl");
async function Ha({ family: e, weight: t, text: r }) {
  let n = { family: `${encodeURIComponent(e)}${t ? `:wght@${t}` : ""}` };
  r ? n.text = r : n.subset = "latin";
  let i = `https://fonts.googleapis.com/css2?${Object.keys(n).map((f) => `${f}=${n[f]}`).join("&")}`, a = caches.default, o = i, u = await a.match(o);
  u || (u = await fetch(`${i}`, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1" } }), u = new Response(u.body, u), u.headers.append("Cache-Control", "s-maxage=3600"), await a.put(o, u.clone()));
  let l = (await u.text()).match(/src: url\((.+)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!l)
    throw new Error("Could not find font URL");
  return fetch(l).then((f) => f.arrayBuffer());
}
__name(Ha, "Ha");
var cy = /* @__PURE__ */ __name(async () => {
  try {
    await Gl(fy);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Already initialized"))
      return;
    throw e;
  }
}, "cy");
var py = /* @__PURE__ */ __name(async () => {
  try {
    let e = await Rl(ly);
    await sl(e);
  } catch (e) {
    throw e;
  }
}, "py");
var Vl = /* @__PURE__ */ __name(async ({ element: e, options: t }) => {
  await Promise.allSettled([cy(), py()]);
  let r = typeof e == "string" ? await zl(e) : e, n = t.width, i = t.height, a = { width: 1200, height: 630 };
  n && i ? a = { width: n, height: i } : n ? a = { width: n } : i && (a = { height: i });
  let o = await Il(r, { ...a, fonts: t?.fonts?.length ? t.fonts : [{ name: "Bitter", data: await Ha({ family: "Bitter", weight: 600 }), weight: 500, style: "normal" }] });
  return (t?.format || "png") === "svg" ? o : new Wl(o, { fitTo: "width" in a ? { mode: "width", value: a.width } : { mode: "height", value: a.height } }).render().asPng();
}, "Vl");
var Xa = /* @__PURE__ */ __name(class extends Response {
  constructor(t, r) {
    if (super(), r.format === "svg")
      return (async () => {
        let n = await Vl({ element: t, options: r });
        return new Response(n, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": r.debug ? "no-cache, no-store" : "public, immutable, no-transform, max-age=31536000", ...r.headers }, status: r.status || 200, statusText: r.statusText });
      })();
    {
      let n = new ReadableStream({ async start(i) {
        let a = await Vl({ element: t, options: r });
        i.enqueue(a), i.close();
      } });
      return new Response(n, { headers: { "Content-Type": "image/png", "Cache-Control": r.debug ? "no-cache, no-store" : "public, immutable, no-transform, max-age=31536000", ...r.headers }, status: r.status || 200, statusText: r.statusText });
    }
  }
}, "Xa");

// api/og.ts
var onRequestGet33 = /* @__PURE__ */ __name(async (context) => {
  const url = new URL(context.request.url);
  const rawTitle = (url.searchParams.get("title") || "CSOAI").slice(0, 90);
  const rawDesc = (url.searchParams.get("desc") || "AI governance, cybersecurity & safety \u2014 signed to Layer 0").slice(0, 140);
  const esc3 = /* @__PURE__ */ __name((s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"), "esc");
  const title = esc3(rawTitle);
  const desc = esc3(rawDesc);
  const html = `
    <div style="height:100%;width:100%;display:flex;flex-direction:column;justify-content:space-between;
                background:linear-gradient(135deg,#03110b 0%,#05261a 60%,#03110b 100%);padding:64px;font-family:sans-serif;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="width:44px;height:44px;border-radius:12px;background:#34d399;display:flex;align-items:center;
                    justify-content:center;color:#03110b;font-size:26px;font-weight:900;">\u25C9</div>
        <div style="color:#8ff3c8;font-size:26px;font-weight:800;letter-spacing:2px;">CSOAI</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:18px;">
        <div style="color:#ecfdf5;font-size:62px;font-weight:900;line-height:1.05;max-width:1000px;display:flex;">${title}</div>
        <div style="color:#a7f3d0;font-size:30px;font-weight:500;max-width:980px;display:flex;">${desc}</div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;color:#34d399;font-size:22px;font-weight:700;">
        <span>Ed25519 \xB7 Layer 0</span><span style="color:#065f46;">|</span>
        <span>designed 33-agent council</span><span style="color:#065f46;">|</span><span>councilof.ai</span>
      </div>
    </div>`;
  return new Xa(html, { width: 1200, height: 630 });
}, "onRequestGet");

// api/registers.ts
var onRequestGet34 = /* @__PURE__ */ __name(async (context) => {
  const rows = [
    { axis: "bond-router", bench: "eunomia-bond-cobol-copybook", labels: ["ATTESTABLE", "PARTIAL", "NOT_ATTESTABLE"], n: 12, strong: { acc: 1, ci: [0.758, 1] }, baseline: { acc: 0.583, ci: [0.32, 0.807] }, status: "MEASURED" },
    { axis: "insurance", bench: "eunomia-risk-pool-underwriting", labels: ["COVERED", "EXCLUDED"], n: 10, strong: { acc: 1, ci: [0.722, 1] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
    { axis: "stock-market", bench: "eunomia-equity-index-derivative", labels: ["COMPLIANT", "NON_COMPLIANT"], n: 10, strong: { acc: 0.9, ci: [0.596, 0.982] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
    { axis: "east-west", bench: "eunomia-tc260-nist-crosswalk", labels: ["ALIGNED", "DIVERGENT"], n: 10, strong: { acc: 1, ci: [0.722, 1] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
    { axis: "sme-fractional", bench: "eunomia-micro-issuance", labels: ["ELIGIBLE", "INELIGIBLE"], n: 10, strong: { acc: 0.9, ci: [0.596, 0.982] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
    { axis: "agent-economy", bench: "eunomia-npc-wallet-staking", labels: ["PERMITTED", "PROHIBITED"], n: 10, strong: { acc: 1, ci: [0.722, 1] }, baseline: { acc: 0.6, ci: [0.313, 0.832] }, status: "MEASURED" },
    { axis: "data-dao", bench: "eunomia-arena-trace-data", labels: ["COMPLIANT", "NON_COMPLIANT"], n: 10, strong: { acc: 1, ci: [0.722, 1] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
    { axis: "eunomia-token", bench: "eunomia-energy-currency", labels: ["COMPLIANT", "NON_COMPLIANT"], n: 10, strong: { acc: 0.778, ci: [0.453, 0.937] }, baseline: { acc: 0.5, ci: [0.237, 0.763] }, status: "MEASURED" },
    { axis: "climate-transition", bench: "eunomia-climate-transition", labels: ["COMPLIANT", "NON_COMPLIANT"], n: 10, strong: { acc: 1, ci: [0.722, 1] }, baseline: { acc: 0.6, ci: [0.313, 0.832] }, status: "MEASURED" },
    { axis: "privacy-risk", bench: "eunomia-privacy-risk", labels: ["COMPLIANT", "NON_COMPLIANT"], n: 10, strong: { acc: 1, ci: [0.722, 1] }, baseline: { acc: 0.6, ci: [0.313, 0.832] }, status: "MEASURED" }
  ];
  return new Response(JSON.stringify({
    schema: "csoai.eunomia-registers/0.1",
    note: "Signed financial-axis registers. Measurement, not certification. Only MEASURED earns a number; x402 is data-only, never scores.",
    signer: "did:web:csoai.org#estate-chain-1",
    measured_on: "2026-08-24",
    n_axes: rows.length,
    axes: rows
  }, null, 2), { headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });
}, "onRequestGet");

// api/regulation.ts
var FEED = {
  schema: "csoai.regulation-deadlines/0.1",
  verified_as_of: "2026-08-19",
  reverification_cadence: "quarterly, and on any provision-change event from the daily reg-watch detector",
  license: "CC-BY-4.0",
  publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
  corrections_policy: "appended, never edited \u2014 a wrong date here is a published correction, not a silent fix",
  headline_correction: "The EU AI Act's high-risk obligations did NOT take effect 2 August 2026: the Digital Omnibus (Reg (EU) 2026/1744, in force 27 July 2026) deferred stand-alone Annex III high-risk to 2 December 2027 and product-embedded Annex I high-risk to 2 August 2028.",
  deadlines: [
    { date: "2025-02-02", instrument: "EU AI Act", what: "Article 5 prohibited practices + Article 4 AI literacy duties in force", basis: "Reg (EU) 2024/1689 Art 113", status: "IN_FORCE", penalty_exposure: "up to \u20AC35,000,000 or 7% of worldwide annual turnover (EU AI Act Art 99(3))" },
    { date: "2025-08-02", instrument: "EU AI Act", what: "GPAI model provider obligations (Arts 53\u201355) + governance rules in force", basis: "Reg (EU) 2024/1689 Art 113", status: "IN_FORCE", penalty_exposure: "up to \u20AC15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4))" },
    { date: "2025-09-01", instrument: "China GB 45438-2025", what: "Mandatory AI-generated content labelling (visible + implicit metadata/watermark)", basis: "CAC/MIIT/MPS/NRTA joint measures", status: "IN_FORCE", penalty_exposure: "CAC enforcement under the labelling measures; no fixed statutory maximum published" },
    { date: "2026-01-01", instrument: "Texas TRAIGA (HB 149)", what: "Intent-based prohibitions, AG-exclusive enforcement, 60-day cure", basis: "HB 149", status: "IN_FORCE", penalty_exposure: "$10,000\u2013$200,000 per violation plus up to $40,000/day continuing (HB 149)" },
    { date: "2026-01-01", instrument: "California SB 53", what: "Transparency in Frontier AI Act \u2014 large frontier developers (> $500M revenue)", basis: "Ch. 138, Statutes of 2025", status: "IN_FORCE", penalty_exposure: "AG-enforced civil penalties up to $1,000,000 per violation (Ch. 138, Statutes of 2025)" },
    { date: "2026-01-22", instrument: "South Korea AI Basic Act", what: "High-impact + generative AI obligations; extraterritorial representative duty; one-year fine grace", basis: "Framework Act, promulgated 2025-01-21", status: "IN_FORCE", penalty_exposure: "administrative fines up to KRW 30,000,000 (~US$20,700) per Art 43; MSIT one-year fine grace in 2026" },
    { date: "2026-08-02", instrument: "EU AI Act", what: "Article 50 transparency + full penalty/market-surveillance regime + AI Office GPAI enforcement in force (NOT high-risk \u2014 see deferral)", basis: "Reg (EU) 2024/1689 Art 113", status: "IN_FORCE", penalty_exposure: "up to \u20AC15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4))" },
    { date: "2026-08-02", instrument: "California AI Transparency Act (CAITA, SB 942)", what: "GenAI providers with >1M monthly CA users: free public AI-detection tool (with API), manifest + latent disclosure for AI-generated image/video/audio (system provenance data)", basis: "SB 942/AB 853 as amended 2025 (operative 2 Aug 2026); Morgan Lewis 3 Aug 2026", status: "IN_FORCE", penalty_exposure: "civil penalties enforceable by state authorities; no private right of action (SB 942/AB 853)" },
    { date: "2026-09-11", instrument: "EU Cyber Resilience Act", what: "Article 14 vulnerability/incident reporting live (24h early warning / 72h notification via ENISA Single Reporting Platform; covers legacy products)", basis: "Reg (EU) 2024/2847 Art 14/16", status: "UPCOMING", penalty_exposure: "up to \u20AC15,000,000 or 2.5% of worldwide annual turnover (CRA)" },
    { date: "2026-12-02", instrument: "EU AI Act Art 50(2)", what: "Marking grace ends for generative systems placed on market before 2 Aug 2026", basis: "Art 111(4), inserted by Digital Omnibus Reg (EU) 2026/1744 Art 1(39)(b)", status: "UPCOMING", penalty_exposure: "up to \u20AC15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4)(g))" },
    { date: "2026-12-02", instrument: "EU AI Act Art 5 (new)", what: "Prohibitions on AI generating non-consensual intimate imagery and CSAM take effect", basis: "Digital Omnibus amendments", status: "UPCOMING", penalty_exposure: "up to \u20AC35,000,000 or 7% of worldwide annual turnover (EU AI Act Art 99(3), prohibited-practice tier)" },
    { date: "2026-12-09", instrument: "EU Product Liability Directive", what: "Member-state transposition deadline \u2014 software and AI enter strict no-fault liability", basis: "Dir (EU) 2024/2853 Art 24", status: "UPCOMING", penalty_exposure: "no statutory cap \u2014 strict no-fault liability for defective software/AI (Dir (EU) 2024/2853); exposure is the claimant-proven damage" },
    { date: "2026-12-10", instrument: "Australia Privacy Act", what: "Automated-decision transparency obligation takes effect", basis: "Privacy Act amendment", status: "UPCOMING", penalty_exposure: "OAIC enforcement under the Privacy Act civil-penalty regime" },
    { date: "2027-01-01", instrument: "Illinois SB 315", what: "Frontier-developer disclosure statements begin (audit mandate follows 2028-01-01)", basis: "Public Act 104-0538 \xA718(a), \xA710(d)", status: "UPCOMING", penalty_exposure: "up to $1,000,000 first violation / $3,000,000 subsequent, plus $1,000/day for unfiled disclosures (Public Act 104-0538)" },
    { date: "2027-01-01", instrument: "New York RAISE Act", what: "Frontier transparency + 72-hour incident reporting to NYDFS oversight office", basis: "S6953B/A6453B as amended 2026-03-27", status: "UPCOMING", penalty_exposure: "NYAG civil penalties up to $1,000,000 first / $3,000,000 subsequent (S6953B/A6453B)" },
    { date: "2027-01-01", instrument: "Colorado SB 26-189", what: "ADMT disclosure/transparency framework (replaces repealed SB 24-205)", basis: "SB 26-189, signed 2026-05-14", status: "UPCOMING", penalty_exposure: "Colorado AG enforcement; per-violation civil penalties under the state framework (no fixed statutory maximum published)" },
    { date: "2027-08-02", instrument: "EU AI Act", what: "Pre-Aug-2025 GPAI models must reach compliance; national regulatory-sandbox obligation", basis: "Reg (EU) 2024/1689 as amended", status: "UPCOMING", penalty_exposure: "up to \u20AC15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4))" },
    { date: "2027-12-02", instrument: "EU AI Act", what: "Stand-alone Annex III HIGH-RISK obligations apply (deferred from 2 Aug 2026)", basis: "Digital Omnibus Reg (EU) 2026/1744", status: "UPCOMING", penalty_exposure: "up to \u20AC15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4))" },
    { date: "2028-01-01", instrument: "Illinois SB 315", what: "Mandatory annual independent third-party audits of frontier developers \u2014 the first US audit mandate", basis: "Public Act 104-0538 \xA710(d)", status: "UPCOMING", penalty_exposure: "up to $1,000,000 first violation / $3,000,000 subsequent, plus $1,000/day for unfiled disclosures (Public Act 104-0538)" },
    { date: "2028-08-02", instrument: "EU AI Act", what: "Product-embedded Annex I HIGH-RISK obligations apply (deferred from 2 Aug 2027)", basis: "Digital Omnibus Reg (EU) 2026/1744", status: "UPCOMING", penalty_exposure: "up to \u20AC15,000,000 or 3% of worldwide annual turnover (EU AI Act Art 99(4))" }
  ],
  disputed: [
    { item: "Council of Europe Framework Convention on AI (CETS 225) entry-into-force status", note: "sources disagree as of the verification date; stated honestly rather than guessed" }
  ],
  underwriting_note: "Each deadline carries penalty_exposure \u2014 the maximum statutory fine and its basis. This turns the calendar into an underwriting-input table: a mandated obligation + a date + a priced downside is the shape of an insurable trigger. CSOAI does not underwrite and bears no risk; this is the neutral substrate an insurer prices on.",
  penalty_tiers_eu_ai_act: { prohibited_practices: "up to \u20AC35,000,000 or 7% of worldwide annual turnover (Art 99(3))", most_obligations_incl_art50_and_gpai: "up to \u20AC15,000,000 or 3% (Art 99(4))", incorrect_or_misleading_info: "up to \u20AC7,500,000 or 1% (Art 99(5))" },
  demand_creating: ["Illinois SB 315 \xA710(d) audit mandate", "NY RAISE", "California SB 53", "EU CRA Article 14", "California CAITA provenance-detection mandate"]
};
var onRequestGet35 = /* @__PURE__ */ __name(async (context) => {
  const body = { ...FEED };
  const b64 = context.env?.BOARD_SIGN_KEY_PKCS8_B64;
  if (b64) {
    try {
      const canonical4 = /* @__PURE__ */ __name((o) => {
        if (o === null || typeof o !== "object")
          return JSON.stringify(o);
        if (Array.isArray(o))
          return "[" + o.map(canonical4).join(",") + "]";
        const r = o;
        return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical4(r[k])).join(",") + "}";
      }, "canonical");
      const hex3 = /* @__PURE__ */ __name((b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""), "hex");
      const signedBytes = canonical4(body);
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex3(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = await crypto.subtle.exportKey("jwk", key);
      body.signature = {
        attests: "integrity of this regulation feed as published by the site",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        public_key_x: jwk.x,
        sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this feed with the signature field removed",
        verify: "fetch /.well-known/did.json \u2192 #board-attestation-1 public key \u2192 recompute canonical JSON and verify Ed25519 against did.json"
      };
    } catch {
      body.signature = { error: "signing key present but unusable \u2014 operations must fix; no signature emitted" };
    }
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*"
    }
  });
}, "onRequestGet");

// api/regulator-findings.ts
var AXIS_TO_OBLIGATION = {
  governance: { obligation: "Article 5 prohibited practices", tier: "prohibited_practices" },
  safety: { obligation: "Article 5 + Annex III high-risk", tier: "prohibited_practices" },
  provenance: { obligation: "Article 50 transparency + GPAI", tier: "most_obligations_incl_art50_and_gpai" },
  continuity: { obligation: "Article 14 risk management", tier: "most_obligations_incl_art50_and_gpai" },
  conformance: { obligation: "Article 13 conformity", tier: "most_obligations_incl_art50_and_gpai" },
  openness: { obligation: "Article 53 GPAI transparency", tier: "most_obligations_incl_art50_and_gpai" },
  "jailbreak-resistance": { obligation: "Article 5 prohibited practices", tier: "prohibited_practices" },
  care: { obligation: "Article 5 + proportionality", tier: "most_obligations_incl_art50_and_gpai" },
  affect: { obligation: "Article 5 emotion-recognition", tier: "prohibited_practices" },
  det: { obligation: "Article 5 social-scoring", tier: "prohibited_practices" },
  mcp: { obligation: "Article 50 AI systems output", tier: "most_obligations_incl_art50_and_gpai" },
  xsr: { obligation: "Article 5 biometric-categorisation", tier: "prohibited_practices" },
  agi: { obligation: "Article 5 + systemic-risk", tier: "most_obligations_incl_art50_and_gpai" }
};
var SECTOR_FRAMEWORKS = {
  insurance: ["EU AI Act Art 5 + high-risk", "Solvency II (AI-risk)", "EIOPA AI principles", "FCA AI guidance"],
  bond: ["EU AI Act high-risk (credit-scoring)", "ESMA AI governance", "CRA regulation (AI models)", "Basel Pillar 3 (model-risk)"],
  cobol: ["EU AI Act (where applicable)", "Defence AI doctrine", "AUKUS interoperability", "Ethical AI (weapon-control) prohibition"]
};
var GRADE_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNMEASURED"];
var ARTICLE_TO_AXES = {
  "Article 4": { title: "AI literacy", axes: ["governance"], tier: "most_obligations_incl_art50_and_gpai" },
  "Article 5": { title: "Prohibited AI practices", axes: ["safety", "affect", "det", "jail", "art5-safeguard"], tier: "prohibited_practices" },
  "Article 6": { title: "High-risk classification", axes: ["governance", "safety", "conformance"], tier: "most_obligations_incl_art50_and_gpai" },
  "Article 9": { title: "Risk management system", axes: ["governance", "continuity"], tier: "most_obligations_incl_art50_and_gpai" },
  "Article 13": { title: "Transparency to deployers", axes: ["conformance", "provenance"], tier: "most_obligations_incl_art50_and_gpai" },
  "Article 14": { title: "Human oversight", axes: ["continuity", "governance"], tier: "most_obligations_incl_art50_and_gpai" },
  "Article 50": { title: "Transparency to end-users", axes: ["provenance", "openness"], tier: "most_obligations_incl_art50_and_gpai" },
  "Article 53": { title: "GPAI model obligations", axes: ["openness", "provenance"], tier: "most_obligations_incl_art50_and_gpai" },
  "Article 55": { title: "Systemic-risk GPAI", axes: ["governance", "safety"], tier: "most_obligations_incl_art50_and_gpai" }
};
function grade(rate) {
  if (rate === null)
    return { grade: "UNMEASURED", note: "insufficient data \u2014 not a ranking" };
  if (rate >= 0.75)
    return { grade: "LOW", note: "measured compliant on this axis" };
  if (rate >= 0.5)
    return { grade: "MEDIUM", note: "measured partial compliance" };
  if (rate >= 0.25)
    return { grade: "HIGH", note: "measured material gap" };
  return { grade: "CRITICAL", note: "measured non-compliance risk" };
}
__name(grade, "grade");
async function fetchJson(request, path) {
  const res = await fetch(new URL(path, request.url), { headers: { accept: "application/json" } });
  if (!res.ok)
    return {};
  try {
    return await res.json();
  } catch {
    return {};
  }
}
__name(fetchJson, "fetchJson");
function sectorKeys(sector) {
  const map = {
    insurance: ["governance", "safety", "provenance", "continuity", "care"],
    bond: ["governance", "conformance", "provenance", "continuity", "det", "care"],
    cobol: ["governance", "safety", "jailbreak-resistance"]
  };
  return map[sector] || Object.keys(AXIS_TO_OBLIGATION);
}
__name(sectorKeys, "sectorKeys");
async function onRequestGet36({ request }) {
  const url = new URL(request.url);
  const deployment = url.searchParams.get("deployment") || "unspecified AI deployment";
  const sector = url.searchParams.get("sector");
  const reg = await fetchJson(request, "/api/regulation");
  const board = await fetchJson(request, "/api/gspc");
  const penalties = reg.penalty_tiers_eu_ai_act || {};
  const acc = {};
  const axes = board.axes;
  if (Array.isArray(axes)) {
    for (const a of axes)
      acc[a.axis] = { accuracy: a.accuracy ?? null, n: a.n, leader: a.leader };
  } else if (axes && typeof axes === "object") {
    for (const k of Object.keys(axes))
      acc[k] = { accuracy: axes[k]?.accuracy ?? null, n: axes[k]?.n, leader: axes[k]?.leader };
  }
  const keys = sector ? sectorKeys(sector) : Object.keys(AXIS_TO_OBLIGATION);
  const findings = keys.map((axis) => {
    const { obligation, tier } = AXIS_TO_OBLIGATION[axis];
    const measured = acc[axis]?.accuracy ?? null;
    const g = grade(measured);
    return {
      axis,
      obligation,
      measured,
      n: acc[axis]?.n ?? null,
      leader: acc[axis]?.leader ?? null,
      grade: g.grade,
      note: g.note,
      penalty_exposure: penalties[tier] || "see /api/regulation"
    };
  }).sort((a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade));
  const by = url.searchParams.get("by");
  if (by === "article") {
    const articles = Object.entries(ARTICLE_TO_AXES).map(([article, a]) => {
      const axisRates = {};
      for (const ax of a.axes)
        axisRates[ax] = acc[ax]?.accuracy ?? null;
      const rates = Object.values(axisRates).filter((v) => v !== null);
      const worst = rates.length ? Math.min(...rates) : null;
      const g = grade(worst);
      return {
        article,
        title: a.title,
        axes: a.axes,
        axis_rates: axisRates,
        worst_measured: worst,
        grade: g.grade,
        note: g.note,
        penalty_exposure: penalties[a.tier] || "see /api/regulation"
      };
    }).sort((a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade));
    return new Response(JSON.stringify({
      schema: "csoai.white-label-article-findings/0.1",
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      deployment,
      note: "Article-granularity EU AI Act findings. Measurement, not certification \u2014 UNMEASURED articles are honest, never ranked.",
      articles,
      penalty_tiers: penalties,
      verify_path: "/api/arena/scoreboard?verify=1"
    }, null, 2), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" }
    });
  }
  const body = {
    schema: "csoai.white-label-regulator-findings/0.1",
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    deployment,
    sector: sector ? SECTOR_FRAMEWORKS[sector] : null,
    note: "We hand regulators + deployers a working GSPC E2E that sorts every AI-compliance problem before anyone is contacted. Measurement, not certification \u2014 UNMEASURED axes are honest, never invented.",
    findings,
    penalty_tiers: penalties,
    verify_path: "/api/arena/scoreboard?verify=1"
  };
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" }
  });
}
__name(onRequestGet36, "onRequestGet");

// api/reported.ts
var ENTRIES = [
  {
    id: "arc-agi-3-human-gap",
    claim: "Humans solved all 135 ARC-AGI-3 environments; the best frontier model scored 0.37%.",
    figures: { human_pass_rate: 1, best_model_pass_rate: 37e-4, best_model: "Gemini 3.1 Pro Preview" },
    source: "ARC Prize (ARC-AGI-3 launch results)",
    source_url: "https://arcprize.org/",
    captured_at: "2026-08-19",
    as_of: "2026-03-25",
    attribution_basis: "Public leaderboard figures, cited with attribution.",
    note: "ARC Prize's own summary: 'Humans score 100%. Frontier AI scores 0.51%.' Scores move \u2014 check the live leaderboard."
  },
  {
    id: "gaia-human-gap",
    claim: "GAIA: human respondents 92% vs 15% for GPT-4 with plugins.",
    figures: { human: 0.92, gpt4_with_plugins: 0.15 },
    source: "Mialon et al., GAIA (ICLR 2024)",
    source_url: "https://arxiv.org/abs/2311.12983",
    captured_at: "2026-08-19",
    as_of: "2023-11-21",
    attribution_basis: "arXiv paper figure, cited."
  },
  {
    id: "gpqa-diamond-expertise-gap",
    claim: "GPQA Diamond: PhD-domain experts ~65% vs skilled non-experts with web access ~34%.",
    figures: { domain_experts: 0.65, skilled_non_experts: 0.34 },
    source: "Rein et al., GPQA",
    source_url: "https://arxiv.org/abs/2311.12022",
    captured_at: "2026-08-19",
    as_of: "2023-11-20",
    attribution_basis: "arXiv paper figure, cited."
  },
  {
    id: "human-or-not-detection",
    claim: "In AI21's 'Human or Not' (1.5M+ participants), people identified their partner correctly only 68% of the time; 60% when talking to bots.",
    figures: { participants: "1,500,000+", overall_correct: 0.68, vs_bots_correct: 0.6 },
    source: "AI21 Labs (arXiv 2305.20010)",
    source_url: "https://arxiv.org/abs/2305.20010",
    captured_at: "2026-08-19",
    as_of: "2023-06-01",
    attribution_basis: "Company-published study, cited as self-reported."
  },
  {
    id: "colonoscopy-deskilling",
    claim: "Non-AI-assisted adenoma detection fell from 28.4% to 22.4% after clinicians' AI exposure \u2014 first real-world clinical AI-deskilling evidence.",
    figures: { before_ai_exposure: 0.284, after_ai_exposure: 0.224, endoscopists: 19 },
    source: "Budzy\u0144 et al., Lancet Gastroenterology & Hepatology 10(10)",
    source_url: "https://doi.org/10.1016/S2468-1253(25)00133-5",
    captured_at: "2026-08-19",
    as_of: "2025-08-12",
    attribution_basis: "Peer-reviewed observational study, cited. Caveats: observational; possible workload confounds."
  }
];
var onRequestGet37 = /* @__PURE__ */ __name(async () => {
  const body = {
    schema: "csoai.reported/0.1",
    issuer: "CSOAI Ltd (GB, Companies House 16939677)",
    register: "REPORTED is the third data state: figures published by OTHERS, cited and timestamped for context. Reported here, not measured here. Unsigned. Never enters the board, never compares against MEASURED numbers, implies no endorsement of the source's methodology. MEASURED (signed) lives at /api/gspc; UNMEASURED/GATED cells stay honestly empty.",
    states: {
      MEASURED: "signed run on our frozen instruments \u2014 /api/gspc",
      "GATED/UNMEASURED": "honestly withheld: insufficient n or no separation test",
      REPORTED: "third-party figure, cited + timestamped, unsigned \u2014 this endpoint"
    },
    count: ENTRIES.length,
    entries: ENTRIES
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*"
    }
  });
}, "onRequestGet");

// api/security.ts
var SURFACES2 = [
  {
    id: "pqc-continuity",
    name: "Post-quantum continuity (GSPC-ASI)",
    status: "MEASURED",
    n: 13,
    what: "Does a cryptographic choice survive the post-quantum transition?",
    detail: "Statute-anchored to NIST FIPS 203/204/205 and IR 8547. n=13 is below usable_n=30, so no interval is published on this axis, including ours. Cross-company measurement found every frontier model tested scoring 0.46-0.69 here while scoring 0.87-1.00 on other axes \u2014 the widest capability gap in the suite, and the reason this axis exists."
  },
  {
    id: "mcp-conformance",
    name: "Tool-declaration conformance (GSPC-MCP)",
    status: "MEASURED",
    n: 11,
    what: "Does a tool's observed behaviour match what it declared about itself?",
    detail: "Three deterministic predicates: declared-read-only, bounded-egress, faithful-schema. A tool that quietly does more than it declares is the supply-chain attack in one sentence. n=11, not quotable."
  },
  {
    id: "art5-safeguard",
    name: "Prohibited-practice safeguards (GSPC-ART5)",
    status: "SPEC",
    what: "How effective are safeguards against Article 5 prohibited generation?",
    detail: "Protocol published; no measurement. The corpus is handled only by authorised holders (NCMEC/IWF/Thorn) and never by CSOAI. Marking obligation applies 2 December 2026."
  },
  {
    id: "redblue-v2",
    name: "Adversarial red/blue (v2)",
    status: "IN_PROGRESS",
    what: "Does an adversarial agent induce a charter breach, and does the defence catch it?",
    detail: "Running on a dedicated node with full transcripts and a dual grader. NO SCORE IS PUBLISHED. v1 was refuted by its own recovered data: the extraction regex hid 30% of the ambiguous bucket as breaches, including a control that should have been clean. v2's judge must first be validated against a 36-cell hand-labelled gold worksheet; 137 cells the spine could not read are unresolved, and 76 of those the judge calls breaches. Until the worksheet is labelled we cannot distinguish a real breach from judge over-firing, and publishing either way would repeat the v1 failure."
  },
  {
    id: "hive-lens-detection",
    name: "Security hive \u2014 layered lens detection",
    status: "MEASURED",
    n: 40,
    score: 0.88,
    what: "Do layered detection lenses catch injected/unsafe content, and at what false-positive cost?",
    detail: "A voting hive of detection lenses (rainbow + string-match lenses, plus an optional semantic lens), with an oversight eye reporting consensus health. Measured: string lenses alone reach 0.53 recall; adding a semantic lens raises recall to 0.88, with precision holding at 0.94-0.95 in both configurations. Recall roughly doubles at no precision cost, which is the whole argument for layering. TWO HONEST CAVEATS: (1) the 0.88 was reached with a FRONTIER semantic lens \u2014 the same slot filled by a tuned model is architecturally supported but NOT yet proven, because a cold-load timing artifact (first call per model exceeds a short timeout and returns empty) produced false zeros that were correctly diagnosed as harness error rather than published as capability. (2) n=40 is above no threshold that matters here; treat as directional."
  },
  {
    id: "oversight-eye",
    name: "Oversight eye \u2014 consensus health",
    status: "MEASURED",
    what: "Is the hive's agreement itself healthy, or is a verdict resting on too few voters?",
    detail: "Emits a live meta-signal per verdict (voters, flagged, quorum_ok). It is explicitly NOT a voting member \u2014 an earlier version described it as one while the code never called it, which made the claim false and the component dead. It now measures consensus health and is labelled as a meta-signal. Recorded here because a component that was loaded-but-never-invoked is exactly the failure this estate is built to catch."
  },
  {
    id: "signing-chain",
    name: "Attestation signing chain",
    status: "MEASURED",
    what: "Is every published result bound to a signature that can be recomputed?",
    detail: "Ed25519 today, ML-DSA-65 (FIPS 204) for post-quantum durability. The chain is recomputable from published inputs \u2014 the claim is verifiability, not trust."
  },
  {
    id: "endpoint-auth",
    name: "Inference endpoint authentication",
    status: "MEASURED",
    what: "Can an unauthenticated caller bill inference to us?",
    detail: "No. The serving endpoint binds to localhost and a token gate holds the public port; an unauthenticated request returns 401. This was NOT true earlier today \u2014 the endpoint was open, and it is recorded here because a security page that only lists its wins is not a security page."
  }
];
var onRequestGet38 = /* @__PURE__ */ __name(async (context) => {
  const url = new URL(context.request.url);
  const id2 = url.searchParams.get("surface");
  const selected = id2 ? SURFACES2.filter((s) => s.id === id2) : SURFACES2;
  if (id2 && selected.length === 0) {
    return new Response(
      JSON.stringify({ error: "unknown surface", known: SURFACES2.map((s) => s.id) }, null, 2),
      { status: 404, headers: { "content-type": "application/json; charset=utf-8" } }
    );
  }
  const measured = selected.filter((s) => s.status === "MEASURED");
  const body = {
    schema: "csoai.security-posture/0.1",
    issuer: "CSOAI Ltd (GB, Companies House 16939677)",
    hive: "asisecurity.ai \u2014 the security hive is its own product; CSOAI measures it",
    note: "Measurement, not certification. This is a posture surface, not an assurance claim about any third-party system. Where a run is in progress its grader may not yet be validated, and no score is published until it is \u2014 a number published ahead of its grader is how the first red-team board became a retraction.",
    totals: {
      surfaces: selected.length,
      measured: measured.length,
      in_progress: selected.filter((s) => s.status === "IN_PROGRESS").length,
      spec: selected.filter((s) => s.status === "SPEC").length,
      scores_published: selected.filter((s) => typeof s.score === "number").length
    },
    surfaces: selected,
    limitations: [
      "Every measured axis here is below usable_n = 30, so no confidence interval is published \u2014 including ours.",
      "The adversarial red/blue run publishes NO score: its judge is not yet validated against the gold worksheet.",
      "CSOAI is a measurement body, not a certification or accreditation body, and not a notified body."
    ]
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*"
    }
  });
}, "onRequestGet");

// api/subscribe.ts
var onRequestPost8 = /* @__PURE__ */ __name(async (ctx) => {
  let body;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  const email = String(body.email ?? "").slice(0, 200);
  if (!email.includes("@"))
    return Response.json({ error: "an email address is required" }, { status: 400 });
  const record = { kind: "subscribe", email, source: String(body.source ?? "").slice(0, 100), at: (/* @__PURE__ */ new Date()).toISOString() };
  if (ctx.env.LEADS) {
    await ctx.env.LEADS.put(`subscribe:${record.at}:${crypto.randomUUID()}`, JSON.stringify(record));
    return Response.json({ ok: true, stored: true });
  }
  return Response.json({ ok: true, stored: false, reason: "no datastore bound yet", fallback: "email nicholas@csoai.org" });
}, "onRequestPost");

// api/tools.ts
var onRequestGet39 = /* @__PURE__ */ __name(async (context) => {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const servers = mcp_registry_default.servers || [];
  const counts = mcp_registry_default.counts || {};
  const probedServers = servers.filter((s) => s.status === "reachable" && !s.alias_of);
  const all = probedServers.flatMap(
    (s) => (s.tools || []).map((t) => ({
      id: t.name,
      name: t.name,
      description: t.description,
      required_args: t.required_args || [],
      server: s.id,
      server_endpoint: s.endpoint,
      status: "probed",
      last_probed: s.last_probed
    }))
  );
  const tools = q ? all.filter(
    (t) => t.name.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || t.server.toLowerCase().includes(q)
  ) : all;
  return new Response(
    JSON.stringify({
      // `total` is the length of the array below — derived, never asserted.
      total: tools.length,
      total_kind: "probed",
      catalogue_total: all.length,
      server_count: probedServers.length,
      query: q || null,
      probe_method: mcp_registry_default.probe_method,
      probe_host: mcp_registry_default.probe_host,
      probe_finished: counts.finished ?? null,
      // The other half of the picture, kept separate on purpose.
      catalogued_not_probed_servers: counts.catalogued_not_probed ?? null,
      tools_catalogued_not_probed: counts.tools_catalogued_not_probed ?? null,
      external_catalogues_not_probed: counts.external_catalogues_not_probed ?? [],
      tools,
      note: "Every tool listed here was returned by a live MCP tools/list call recorded in evidence/mcp-registry.json. Servers with no published endpoint contribute zero tools and are reported separately as catalogued_not_probed_servers \u2014 catalogued tools are never added to probed tools."
    }),
    {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=300" }
    }
  );
}, "onRequestGet");

// api/verify-tally.ts
var KEY = "verify_tally_v1";
var onRequestGet40 = /* @__PURE__ */ __name(async ({ env }) => {
  const raw = await env.SOV_ARENA_STATE.get(KEY) || '{"ok":0,"fail":0}';
  return new Response(raw, {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
      "x-grammar": "self-reported opt-in signal; not a MEASURED number"
    }
  });
}, "onRequestGet");
var onRequestPost9 = /* @__PURE__ */ __name(async ({ request, env }) => {
  let ok = null;
  try {
    ok = Boolean((await request.json()).ok);
  } catch {
  }
  if (ok === null)
    return new Response('{"error":"body must be {\\"ok\\": true|false}"}', { status: 400 });
  const t = JSON.parse(await env.SOV_ARENA_STATE.get(KEY) || '{"ok":0,"fail":0}');
  ok ? t.ok++ : t.fail++;
  await env.SOV_ARENA_STATE.put(KEY, JSON.stringify(t));
  return new Response(JSON.stringify({ counted: true, ...t }), {
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
  });
}, "onRequestPost");

// api/wave-dashboard.ts
var onRequestGet41 = /* @__PURE__ */ __name(async (context) => {
  const origin = new URL(context.request.url).origin;
  const hdrs = { "user-agent": "csoai-wave-dashboard/0.1" };
  let measuredAxes = null;
  let axisSlots = null;
  let registerRows = null;
  let receiptCount = 0;
  let receiptStatus = "UNPUBLISHED";
  try {
    const gspc = await fetch(`${origin}/api/gspc`, { headers: hdrs });
    if (gspc.ok) {
      const j = await gspc.json();
      measuredAxes = j.totals?.measured_axes ?? null;
      axisSlots = j.totals?.axes ?? null;
    }
  } catch {
  }
  try {
    const reg = await fetch(`${origin}/api/axis-register`, { headers: hdrs });
    if (reg.ok) {
      const j = await reg.json();
      const rows = j.axes ?? j.register;
      if (Array.isArray(rows))
        registerRows = rows.length;
    }
  } catch {
  }
  try {
    const rcpt = await fetch(`${origin}/api/receipts/latest`, { headers: hdrs });
    if (rcpt.ok) {
      const j = await rcpt.json();
      receiptCount = j.count ?? 0;
      receiptStatus = j.status ?? "UNPUBLISHED";
    }
  } catch {
  }
  const waves = [
    { wave: 0, name: "The signed spine works", register: measuredAxes != null ? "MEASURED" : "UNVERIFIED", count: measuredAxes ?? 0, evidence: "live /api/gspc board + axis register" },
    { wave: 1, name: "Verification as a free public utility", register: "MEASURED", count: 3, evidence: "gspc-verify + verify-leaderboard + Article 50 passport surfaces" },
    { wave: 2, name: "Third parties build on the rail", register: receiptCount > 0 ? "MEASURED" : "UNVERIFIED", count: receiptCount, evidence: receiptStatus === "UNPUBLISHED" ? "no settlement receipts published yet" : "receipts/latest" },
    { wave: 3, name: "Network effects / court of record", register: "UNVERIFIED", count: 0, evidence: "POST /api/challenge receipts; no external dispute hosted yet" },
    { wave: 4, name: "Sector/axis replication", register: registerRows != null ? "MEASURED" : "UNVERIFIED", count: registerRows ?? 0, evidence: "axis register rows from /api/axis-register" },
    { wave: 5, name: "Load-bearing infrastructure", register: "UNVERIFIED", count: 0, evidence: "procurement-default + regulation-reference criteria not met" }
  ];
  return Response.json(
    {
      schema: "csoai.wave-dashboard.runtime/0.1",
      doctrine: "Runtime aggregates from live APIs. Empty waves render honestly. Signed canon: /signals/wave-dashboard.signed.json",
      waves,
      gspc: { measured_axes: measuredAxes, axis_slots: axisSlots },
      receipts: { status: receiptStatus, count: receiptCount },
      not_a_certification: true,
      generated: (/* @__PURE__ */ new Date()).toISOString()
    },
    { headers: { "content-type": "application/json", "cache-control": "public, max-age=120" } }
  );
}, "onRequestGet");

// api/webhooks.ts
var store = /* @__PURE__ */ new Map();
var onRequestGet42 = /* @__PURE__ */ __name(async () => {
  return Response.json(Array.from(store.values()));
}, "onRequestGet");
var onRequestPost10 = /* @__PURE__ */ __name(async (ctx) => {
  let body;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 });
  }
  const url = String(body.url ?? "").slice(0, 500);
  const events = Array.isArray(body.events) ? body.events.filter((e) => typeof e === "string").slice(0, 20) : [];
  if (!/^https:\/\//.test(url)) {
    return Response.json({ error: "url must be https://" }, { status: 400 });
  }
  const id2 = "wh_" + crypto.randomUUID().slice(0, 8);
  const hook = {
    id: id2,
    url,
    events,
    active: true,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  store.set(id2, hook);
  if (ctx.env.WEBHOOKS) {
    await ctx.env.WEBHOOKS.put(id2, JSON.stringify(hook));
  }
  return Response.json(hook, { status: 201 });
}, "onRequestPost");
var onRequestDelete = /* @__PURE__ */ __name(async (ctx) => {
  const url = new URL(ctx.request.url);
  const id2 = url.searchParams.get("id");
  if (!id2)
    return Response.json({ error: "id required" }, { status: 400 });
  store.delete(id2);
  if (ctx.env.WEBHOOKS)
    await ctx.env.WEBHOOKS.delete(id2);
  return Response.json({ deleted: id2 });
}, "onRequestDelete");

// embed/verify.ts
var onRequestGet43 = /* @__PURE__ */ __name(async ({ request }) => {
  const url = new URL(request.url);
  const asset = new URL("/embed/verify.html", url.origin).toString();
  const res = await fetch(asset);
  if (!res.ok) {
    return new Response("verify widget unavailable", { status: 502, headers: { "content-type": "text/plain" } });
  }
  const html = await res.text();
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      // Embeddable in third-party pages by design — this is a public, read-only widget.
      "access-control-allow-origin": "*"
    }
  });
}, "onRequestGet");

// api/dorado.ts
function onRequest4() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/api/east-west-bench",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest4, "onRequest");

// api/ledger.ts
function onRequest5() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/api/receipts/latest",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest5, "onRequest");

// api/oracle-fleet.ts
var FLEET_URL = "https://supervisor-worker.nicholastempleman.workers.dev/fleet/status";
var onRequest6 = /* @__PURE__ */ __name(async () => {
  try {
    const upstream = await fetch(FLEET_URL, {
      headers: { Accept: "application/json" },
      cf: { cacheTtl: 30, cacheEverything: false }
    });
    const data = await upstream.json();
    return Response.json(data, {
      status: upstream.status,
      headers: { "cache-control": "public, max-age=30" }
    });
  } catch (e) {
    return Response.json(
      { error: "oracle fleet upstream unavailable", detail: e?.message ?? "unknown", source: "offline" },
      { status: 502 }
    );
  }
}, "onRequest");

// certification/exam/index.ts
function onRequest7() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest7, "onRequest");

// certification/results/index.ts
function onRequest8() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest8, "onRequest");

// certification/review/index.ts
function onRequest9() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest9, "onRequest");

// features/33-agent-council/index.ts
function onRequest10() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest10, "onRequest");

// features/training-certification/index.ts
function onRequest11() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest11, "onRequest");

// features/watchdog-jobs/index.ts
function onRequest12() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest12, "onRequest");

// for/enterprise/index.ts
function onRequest13() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=enterprise-start",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest13, "onRequest");

// for/finance/index.ts
function onRequest14() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home&task=sector-brief",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest14, "onRequest");

// for/healthcare/index.ts
function onRequest15() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home&task=sector-brief",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest15, "onRequest");

// for/regulator/index.ts
function onRequest16() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home&task=regulator-brief",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest16, "onRequest");

// for/sec-filer/index.ts
function onRequest17() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home&task=regulator-brief",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest17, "onRequest");

// for/startup/index.ts
function onRequest18() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home&task=sector-brief",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest18, "onRequest");

// how-it-works/certification/index.ts
function onRequest19() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest19, "onRequest");

// how-it-works/compliance/index.ts
function onRequest20() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest20, "onRequest");

// how-it-works/dashboard/index.ts
function onRequest21() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest21, "onRequest");

// how-it-works/enterprise/index.ts
function onRequest22() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=enterprise-start",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest22, "onRequest");

// how-it-works/training/index.ts
function onRequest23() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest23, "onRequest");

// library/academy/index.ts
function onRequest24() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest24, "onRequest");

// settings/billing/index.ts
function onRequest25() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=pricing-overview",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest25, "onRequest");

// watchdog/help-protect-humanity/index.ts
function onRequest26() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest26, "onRequest");

// watchdog/incident/index.ts
function onRequest27() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest27, "onRequest");

// api/[[path]].js
function onRequest28(context) {
  const p = context.params && Array.isArray(context.params.path) ? context.params.path.join("/") : "";
  return new Response(
    JSON.stringify({
      error: "not_found",
      path: p ? `/api/${p}` : "/api",
      hint: "See the MCP registry entry io.github.CSOAI-ORG/gspc for live endpoints, or /api/mcp for the server catalogue."
    }),
    {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
    }
  );
}
__name(onRequest28, "onRequest");

// blog/[[path]].ts
var DEAD = /* @__PURE__ */ new Set([
  "layer-0-agent-economy-trust",
  "eu-ai-act-article-50-countdown",
  "choosing-ai-compliance-vendor",
  "dora-compliance-uk-financial-services",
  "ai-governance-vs-compliance",
  "nis2-compliance-critical-infrastructure"
]);
function onRequest29(context) {
  const raw = context.params.path;
  const slug = Array.isArray(raw) ? raw[0] : (raw || "").split("/")[0];
  if (slug && DEAD.has(slug)) {
    return new Response(null, {
      status: 308,
      headers: {
        location: "/blog/",
        "cache-control": "public, max-age=300"
      }
    });
  }
  return context.next();
}
__name(onRequest29, "onRequest");

// mcp/[[path]].ts
var UPSTREAM = "https://csoai-gspc-mcp.nicholastempleman.workers.dev/mcp";
var HOP_BY_HOP = /* @__PURE__ */ new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]);
var onRequest30 = /* @__PURE__ */ __name(async (ctx) => {
  const url = new URL(ctx.request.url);
  const subpath = url.pathname.replace(/^\/mcp\/?/, "");
  const target = subpath ? `${UPSTREAM}/${subpath}${url.search}` : `${UPSTREAM}${url.search}`;
  const forwardHeaders = new Headers();
  for (const [k, v] of ctx.request.headers) {
    if (!HOP_BY_HOP.has(k.toLowerCase()) && k.toLowerCase() !== "host") {
      forwardHeaders.set(k, v);
    }
  }
  try {
    const upstream = await fetch(target, {
      method: ctx.request.method,
      headers: forwardHeaders,
      body: ctx.request.body,
      // @ts-expect-error — duplex required for streaming request bodies
      duplex: "half"
    });
    const responseHeaders = new Headers();
    for (const [k, v] of upstream.headers) {
      if (!HOP_BY_HOP.has(k.toLowerCase())) {
        responseHeaders.set(k, v);
      }
    }
    responseHeaders.set("access-control-allow-origin", "*");
    responseHeaders.set("access-control-allow-methods", "GET, POST, OPTIONS");
    responseHeaders.set("access-control-allow-headers", "content-type");
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return Response.json(
      { error: "mcp upstream unavailable", detail: msg },
      {
        status: 502,
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "application/json"
        }
      }
    );
  }
}, "onRequest");

// about-ceasai/index.ts
function onRequest31() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest31, "onRequest");

// about-credential/index.ts
function onRequest32() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest32, "onRequest");

// accreditation/index.ts
function onRequest33() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest33, "onRequest");

// advisory/index.ts
function onRequest34() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest34, "onRequest");

// agent-council/index.ts
function onRequest35() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest35, "onRequest");

// article-50-kit/index.ts
function onRequest36() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest36, "onRequest");

// badges/index.ts
function onRequest37() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest37, "onRequest");

// case-studies/index.ts
function onRequest38() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=pricing-overview",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest38, "onRequest");

// ceasai/index.ts
function onRequest39() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest39, "onRequest");

// ceasai-training/index.ts
function onRequest40() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest40, "onRequest");

// certificate-verification/index.ts
function onRequest41() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest41, "onRequest");

// certification/index.ts
function onRequest42() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest42, "onRequest");

// certified/index.ts
function onRequest43() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest43, "onRequest");

// charter/index.ts
function onRequest44() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=pricing-overview",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest44, "onRequest");

// chat/index.ts
function onRequest45() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest45, "onRequest");

// company.ts
function onRequest46() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/library/company/",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest46, "onRequest");

// conformity/index.ts
function onRequest47() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest47, "onRequest");

// conformity-assessment/index.ts
function onRequest48() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest48, "onRequest");

// conformity-route/index.ts
function onRequest49() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest49, "onRequest");

// corpus.ts
function onRequest50() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/signals/",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest50, "onRequest");

// council-licensing/index.ts
function onRequest51() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest51, "onRequest");

// courses/index.ts
function onRequest52() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest52, "onRequest");

// credential/index.ts
function onRequest53() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest53, "onRequest");

// credential-training/index.ts
function onRequest54() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest54, "onRequest");

// datasets.ts
function onRequest55() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/datasets/gspc-axis-v0.1.0/dataset.json",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest55, "onRequest");

// early-access/index.ts
function onRequest56() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest56, "onRequest");

// enterprise/index.ts
function onRequest57() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=enterprise-start",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest57, "onRequest");

// enterprise-onboarding.ts
function onRequest58() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=enterprise-start",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest58, "onRequest");

// enterprise-plans/index.ts
function onRequest59() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=pricing-overview",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest59, "onRequest");

// enterprises.ts
function onRequest60() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=enterprise-start",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest60, "onRequest");

// eu-ai-act-urgency/index.ts
function onRequest61() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=get-measured",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest61, "onRequest");

// evidence/index.ts
function onRequest62() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/evidence-rail/",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest62, "onRequest");

// faq/index.ts
function onRequest63() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=pricing-overview",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest63, "onRequest");

// first-fine.ts
function onRequest64() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/first-fine-watch/",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest64, "onRequest");

// for/index.ts
function onRequest65() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=enterprise-start",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest65, "onRequest");

// frontier-atlas.ts
function onRequest66() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/east-west/",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest66, "onRequest");

// get-certified/index.ts
function onRequest67() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest67, "onRequest");

// get-measured/index.ts
function onRequest68() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=get-measured",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest68, "onRequest");

// jobs/index.ts
function onRequest69() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest69, "onRequest");

// landing/index.ts
function onRequest70() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest70, "onRequest");

// my-courses/index.ts
function onRequest71() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest71, "onRequest");

// partners/index.ts
function onRequest72() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest72, "onRequest");

// payg/index.ts
function onRequest73() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=pricing-overview",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest73, "onRequest");

// plans/index.ts
function onRequest74() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=pricing-overview",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest74, "onRequest");

// pricing.ts
function onRequest75() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=pricing-overview",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest75, "onRequest");

// pricing-legacy/index.ts
function onRequest76() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=pricing-overview",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest76, "onRequest");

// public-watchdog/index.ts
function onRequest77() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest77, "onRequest");

// readiness-assessment/index.ts
function onRequest78() {
  return new Response("404 Not Found \u2014 this page does not exist.", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" }
  });
}
__name(onRequest78, "onRequest");

// regulation.ts
function onRequest79() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/library/regulation/",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest79, "onRequest");

// remediation/index.ts
function onRequest80() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest80, "onRequest");

// remediation-partners/index.ts
function onRequest81() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest81, "onRequest");

// roi-calculator/index.ts
function onRequest82() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=pricing-overview",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest82, "onRequest");

// sign-in.ts
function onRequest83() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/login/",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest83, "onRequest");

// signal.ts
function onRequest84() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/signals/",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest84, "onRequest");

// signin.ts
function onRequest85() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/login/",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest85, "onRequest");

// solutions.ts
function onRequest86() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/assess/",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest86, "onRequest");

// sov-space/index.ts
function onRequest87() {
  return new Response("410 Gone \u2014 this route has been permanently removed.", {
    status: 410,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" }
  });
}
__name(onRequest87, "onRequest");

// sov3.ts
function onRequest88() {
  return new Response(null, { status: 308, headers: { location: "/workbench" } });
}
__name(onRequest88, "onRequest");

// sov3-model-card.ts
function onRequest89() {
  return new Response(null, { status: 308, headers: { location: "/council-model-card" } });
}
__name(onRequest89, "onRequest");

// sov3-system-card.ts
function onRequest90() {
  return new Response(null, { status: 308, headers: { location: "/council-system-card" } });
}
__name(onRequest90, "onRequest");

// sov3-whitepaper.ts
function onRequest91() {
  return new Response(null, { status: 308, headers: { location: "/workbench-paper" } });
}
__name(onRequest91, "onRequest");

// sovereign-pricing/index.ts
function onRequest92() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=measured&task=pricing-overview",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest92, "onRequest");

// stripe-checkout.js.ts
function onRequest93() {
  return new Response("410 Gone \u2014 this route has been permanently removed.", {
    status: 410,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" }
  });
}
__name(onRequest93, "onRequest");

// training/index.ts
function onRequest94() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest94, "onRequest");

// training-certification/index.ts
function onRequest95() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest95, "onRequest");

// training-hub/index.ts
function onRequest96() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest96, "onRequest");

// verify-certificate/index.ts
function onRequest97() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest97, "onRequest");

// watchdog/index.ts
function onRequest98() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest98, "onRequest");

// watchdog-heatmap/index.ts
function onRequest99() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest99, "onRequest");

// watchdog-hub/index.ts
function onRequest100() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest100, "onRequest");

// watchdog-leaderboard/index.ts
function onRequest101() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest101, "onRequest");

// watchdog-map/index.ts
function onRequest102() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest102, "onRequest");

// watchdog-signup/index.ts
function onRequest103() {
  return new Response(null, {
    status: 308,
    headers: {
      location: "/?lobby=home",
      "cache-control": "public, max-age=300"
    }
  });
}
__name(onRequest103, "onRequest");

// ../.wrangler/tmp/pages-32u2yb/functionsRoutes-0.4570171803569487.mjs
var routes = [
  {
    routePath: "/api/arena/rounds",
    mountPath: "/api/arena",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/arena/rounds.jsonl",
    mountPath: "/api/arena",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/arena/scoreboard",
    mountPath: "/api/arena",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/assess/key",
    mountPath: "/api/assess",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/corpus-watch/status",
    mountPath: "/api/corpus-watch",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/dashboard/stats",
    mountPath: "/api/dashboard",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/evidence/github",
    mountPath: "/api/evidence",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/receipts/latest",
    mountPath: "/api/receipts",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/api/sov-arena/rounds.jsonl",
    mountPath: "/api/sov-arena",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/sov-town/state.jsonl",
    mountPath: "/api/sov-town",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
  },
  {
    routePath: "/api/agui/:path*",
    mountPath: "/api/agui",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/auth/:path*",
    mountPath: "/api/auth",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/worker/:path*",
    mountPath: "/api/worker",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/api/_chatGrounded",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/_chatGrounded",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/article50",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet10]
  },
  {
    routePath: "/api/article50",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/assess",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/axis-register",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet11]
  },
  {
    routePath: "/api/badge",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet12]
  },
  {
    routePath: "/api/benchmark-quality",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet13]
  },
  {
    routePath: "/api/cards",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet14]
  },
  {
    routePath: "/api/challenge",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet15]
  },
  {
    routePath: "/api/challenge",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/checkout",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/clarity",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet16]
  },
  {
    routePath: "/api/comparison",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet17]
  },
  {
    routePath: "/api/contact",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/corrections",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet18]
  },
  {
    routePath: "/api/counters",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet19]
  },
  {
    routePath: "/api/cross",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet20]
  },
  {
    routePath: "/api/east-west-bench",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet21]
  },
  {
    routePath: "/api/eunomia-data",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet22]
  },
  {
    routePath: "/api/evidence-pack",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet23]
  },
  {
    routePath: "/api/feed.xml",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet24]
  },
  {
    routePath: "/api/fulfill",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet25]
  },
  {
    routePath: "/api/gspc",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet26]
  },
  {
    routePath: "/api/health",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet27]
  },
  {
    routePath: "/api/interop-bulk",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet28]
  },
  {
    routePath: "/api/lead",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet29]
  },
  {
    routePath: "/api/lead",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/locale",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet30]
  },
  {
    routePath: "/api/mcp",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet31]
  },
  {
    routePath: "/api/methodology",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet32]
  },
  {
    routePath: "/api/og",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet33]
  },
  {
    routePath: "/api/registers",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet34]
  },
  {
    routePath: "/api/regulation",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet35]
  },
  {
    routePath: "/api/regulator-findings",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet36]
  },
  {
    routePath: "/api/reported",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet37]
  },
  {
    routePath: "/api/security",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet38]
  },
  {
    routePath: "/api/subscribe",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/tools",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet39]
  },
  {
    routePath: "/api/verify-tally",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet40]
  },
  {
    routePath: "/api/verify-tally",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost9]
  },
  {
    routePath: "/api/wave-dashboard",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet41]
  },
  {
    routePath: "/api/webhooks",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/webhooks",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet42]
  },
  {
    routePath: "/api/webhooks",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost10]
  },
  {
    routePath: "/embed/verify",
    mountPath: "/embed",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet43]
  },
  {
    routePath: "/api/dorado",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/api/ledger",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  },
  {
    routePath: "/api/oracle-fleet",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest6]
  },
  {
    routePath: "/certification/exam",
    mountPath: "/certification/exam",
    method: "",
    middlewares: [],
    modules: [onRequest7]
  },
  {
    routePath: "/certification/results",
    mountPath: "/certification/results",
    method: "",
    middlewares: [],
    modules: [onRequest8]
  },
  {
    routePath: "/certification/review",
    mountPath: "/certification/review",
    method: "",
    middlewares: [],
    modules: [onRequest9]
  },
  {
    routePath: "/features/33-agent-council",
    mountPath: "/features/33-agent-council",
    method: "",
    middlewares: [],
    modules: [onRequest10]
  },
  {
    routePath: "/features/training-certification",
    mountPath: "/features/training-certification",
    method: "",
    middlewares: [],
    modules: [onRequest11]
  },
  {
    routePath: "/features/watchdog-jobs",
    mountPath: "/features/watchdog-jobs",
    method: "",
    middlewares: [],
    modules: [onRequest12]
  },
  {
    routePath: "/for/enterprise",
    mountPath: "/for/enterprise",
    method: "",
    middlewares: [],
    modules: [onRequest13]
  },
  {
    routePath: "/for/finance",
    mountPath: "/for/finance",
    method: "",
    middlewares: [],
    modules: [onRequest14]
  },
  {
    routePath: "/for/healthcare",
    mountPath: "/for/healthcare",
    method: "",
    middlewares: [],
    modules: [onRequest15]
  },
  {
    routePath: "/for/regulator",
    mountPath: "/for/regulator",
    method: "",
    middlewares: [],
    modules: [onRequest16]
  },
  {
    routePath: "/for/sec-filer",
    mountPath: "/for/sec-filer",
    method: "",
    middlewares: [],
    modules: [onRequest17]
  },
  {
    routePath: "/for/startup",
    mountPath: "/for/startup",
    method: "",
    middlewares: [],
    modules: [onRequest18]
  },
  {
    routePath: "/how-it-works/certification",
    mountPath: "/how-it-works/certification",
    method: "",
    middlewares: [],
    modules: [onRequest19]
  },
  {
    routePath: "/how-it-works/compliance",
    mountPath: "/how-it-works/compliance",
    method: "",
    middlewares: [],
    modules: [onRequest20]
  },
  {
    routePath: "/how-it-works/dashboard",
    mountPath: "/how-it-works/dashboard",
    method: "",
    middlewares: [],
    modules: [onRequest21]
  },
  {
    routePath: "/how-it-works/enterprise",
    mountPath: "/how-it-works/enterprise",
    method: "",
    middlewares: [],
    modules: [onRequest22]
  },
  {
    routePath: "/how-it-works/training",
    mountPath: "/how-it-works/training",
    method: "",
    middlewares: [],
    modules: [onRequest23]
  },
  {
    routePath: "/library/academy",
    mountPath: "/library/academy",
    method: "",
    middlewares: [],
    modules: [onRequest24]
  },
  {
    routePath: "/settings/billing",
    mountPath: "/settings/billing",
    method: "",
    middlewares: [],
    modules: [onRequest25]
  },
  {
    routePath: "/watchdog/help-protect-humanity",
    mountPath: "/watchdog/help-protect-humanity",
    method: "",
    middlewares: [],
    modules: [onRequest26]
  },
  {
    routePath: "/watchdog/incident",
    mountPath: "/watchdog/incident",
    method: "",
    middlewares: [],
    modules: [onRequest27]
  },
  {
    routePath: "/api/:path*",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest28]
  },
  {
    routePath: "/blog/:path*",
    mountPath: "/blog",
    method: "",
    middlewares: [],
    modules: [onRequest29]
  },
  {
    routePath: "/mcp/:path*",
    mountPath: "/mcp",
    method: "",
    middlewares: [],
    modules: [onRequest30]
  },
  {
    routePath: "/about-ceasai",
    mountPath: "/about-ceasai",
    method: "",
    middlewares: [],
    modules: [onRequest31]
  },
  {
    routePath: "/about-credential",
    mountPath: "/about-credential",
    method: "",
    middlewares: [],
    modules: [onRequest32]
  },
  {
    routePath: "/accreditation",
    mountPath: "/accreditation",
    method: "",
    middlewares: [],
    modules: [onRequest33]
  },
  {
    routePath: "/advisory",
    mountPath: "/advisory",
    method: "",
    middlewares: [],
    modules: [onRequest34]
  },
  {
    routePath: "/agent-council",
    mountPath: "/agent-council",
    method: "",
    middlewares: [],
    modules: [onRequest35]
  },
  {
    routePath: "/article-50-kit",
    mountPath: "/article-50-kit",
    method: "",
    middlewares: [],
    modules: [onRequest36]
  },
  {
    routePath: "/badges",
    mountPath: "/badges",
    method: "",
    middlewares: [],
    modules: [onRequest37]
  },
  {
    routePath: "/case-studies",
    mountPath: "/case-studies",
    method: "",
    middlewares: [],
    modules: [onRequest38]
  },
  {
    routePath: "/ceasai",
    mountPath: "/ceasai",
    method: "",
    middlewares: [],
    modules: [onRequest39]
  },
  {
    routePath: "/ceasai-training",
    mountPath: "/ceasai-training",
    method: "",
    middlewares: [],
    modules: [onRequest40]
  },
  {
    routePath: "/certificate-verification",
    mountPath: "/certificate-verification",
    method: "",
    middlewares: [],
    modules: [onRequest41]
  },
  {
    routePath: "/certification",
    mountPath: "/certification",
    method: "",
    middlewares: [],
    modules: [onRequest42]
  },
  {
    routePath: "/certified",
    mountPath: "/certified",
    method: "",
    middlewares: [],
    modules: [onRequest43]
  },
  {
    routePath: "/charter",
    mountPath: "/charter",
    method: "",
    middlewares: [],
    modules: [onRequest44]
  },
  {
    routePath: "/chat",
    mountPath: "/chat",
    method: "",
    middlewares: [],
    modules: [onRequest45]
  },
  {
    routePath: "/company",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest46]
  },
  {
    routePath: "/conformity",
    mountPath: "/conformity",
    method: "",
    middlewares: [],
    modules: [onRequest47]
  },
  {
    routePath: "/conformity-assessment",
    mountPath: "/conformity-assessment",
    method: "",
    middlewares: [],
    modules: [onRequest48]
  },
  {
    routePath: "/conformity-route",
    mountPath: "/conformity-route",
    method: "",
    middlewares: [],
    modules: [onRequest49]
  },
  {
    routePath: "/corpus",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest50]
  },
  {
    routePath: "/council-licensing",
    mountPath: "/council-licensing",
    method: "",
    middlewares: [],
    modules: [onRequest51]
  },
  {
    routePath: "/courses",
    mountPath: "/courses",
    method: "",
    middlewares: [],
    modules: [onRequest52]
  },
  {
    routePath: "/credential",
    mountPath: "/credential",
    method: "",
    middlewares: [],
    modules: [onRequest53]
  },
  {
    routePath: "/credential-training",
    mountPath: "/credential-training",
    method: "",
    middlewares: [],
    modules: [onRequest54]
  },
  {
    routePath: "/datasets",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest55]
  },
  {
    routePath: "/early-access",
    mountPath: "/early-access",
    method: "",
    middlewares: [],
    modules: [onRequest56]
  },
  {
    routePath: "/enterprise",
    mountPath: "/enterprise",
    method: "",
    middlewares: [],
    modules: [onRequest57]
  },
  {
    routePath: "/enterprise-onboarding",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest58]
  },
  {
    routePath: "/enterprise-plans",
    mountPath: "/enterprise-plans",
    method: "",
    middlewares: [],
    modules: [onRequest59]
  },
  {
    routePath: "/enterprises",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest60]
  },
  {
    routePath: "/eu-ai-act-urgency",
    mountPath: "/eu-ai-act-urgency",
    method: "",
    middlewares: [],
    modules: [onRequest61]
  },
  {
    routePath: "/evidence",
    mountPath: "/evidence",
    method: "",
    middlewares: [],
    modules: [onRequest62]
  },
  {
    routePath: "/faq",
    mountPath: "/faq",
    method: "",
    middlewares: [],
    modules: [onRequest63]
  },
  {
    routePath: "/first-fine",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest64]
  },
  {
    routePath: "/for",
    mountPath: "/for",
    method: "",
    middlewares: [],
    modules: [onRequest65]
  },
  {
    routePath: "/frontier-atlas",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest66]
  },
  {
    routePath: "/get-certified",
    mountPath: "/get-certified",
    method: "",
    middlewares: [],
    modules: [onRequest67]
  },
  {
    routePath: "/get-measured",
    mountPath: "/get-measured",
    method: "",
    middlewares: [],
    modules: [onRequest68]
  },
  {
    routePath: "/jobs",
    mountPath: "/jobs",
    method: "",
    middlewares: [],
    modules: [onRequest69]
  },
  {
    routePath: "/landing",
    mountPath: "/landing",
    method: "",
    middlewares: [],
    modules: [onRequest70]
  },
  {
    routePath: "/my-courses",
    mountPath: "/my-courses",
    method: "",
    middlewares: [],
    modules: [onRequest71]
  },
  {
    routePath: "/partners",
    mountPath: "/partners",
    method: "",
    middlewares: [],
    modules: [onRequest72]
  },
  {
    routePath: "/payg",
    mountPath: "/payg",
    method: "",
    middlewares: [],
    modules: [onRequest73]
  },
  {
    routePath: "/plans",
    mountPath: "/plans",
    method: "",
    middlewares: [],
    modules: [onRequest74]
  },
  {
    routePath: "/pricing",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest75]
  },
  {
    routePath: "/pricing-legacy",
    mountPath: "/pricing-legacy",
    method: "",
    middlewares: [],
    modules: [onRequest76]
  },
  {
    routePath: "/public-watchdog",
    mountPath: "/public-watchdog",
    method: "",
    middlewares: [],
    modules: [onRequest77]
  },
  {
    routePath: "/readiness-assessment",
    mountPath: "/readiness-assessment",
    method: "",
    middlewares: [],
    modules: [onRequest78]
  },
  {
    routePath: "/regulation",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest79]
  },
  {
    routePath: "/remediation",
    mountPath: "/remediation",
    method: "",
    middlewares: [],
    modules: [onRequest80]
  },
  {
    routePath: "/remediation-partners",
    mountPath: "/remediation-partners",
    method: "",
    middlewares: [],
    modules: [onRequest81]
  },
  {
    routePath: "/roi-calculator",
    mountPath: "/roi-calculator",
    method: "",
    middlewares: [],
    modules: [onRequest82]
  },
  {
    routePath: "/sign-in",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest83]
  },
  {
    routePath: "/signal",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest84]
  },
  {
    routePath: "/signin",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest85]
  },
  {
    routePath: "/solutions",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest86]
  },
  {
    routePath: "/sov-space",
    mountPath: "/sov-space",
    method: "",
    middlewares: [],
    modules: [onRequest87]
  },
  {
    routePath: "/sov3",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest88]
  },
  {
    routePath: "/sov3-model-card",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest89]
  },
  {
    routePath: "/sov3-system-card",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest90]
  },
  {
    routePath: "/sov3-whitepaper",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest91]
  },
  {
    routePath: "/sovereign-pricing",
    mountPath: "/sovereign-pricing",
    method: "",
    middlewares: [],
    modules: [onRequest92]
  },
  {
    routePath: "/stripe-checkout.js",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest93]
  },
  {
    routePath: "/training",
    mountPath: "/training",
    method: "",
    middlewares: [],
    modules: [onRequest94]
  },
  {
    routePath: "/training-certification",
    mountPath: "/training-certification",
    method: "",
    middlewares: [],
    modules: [onRequest95]
  },
  {
    routePath: "/training-hub",
    mountPath: "/training-hub",
    method: "",
    middlewares: [],
    modules: [onRequest96]
  },
  {
    routePath: "/verify-certificate",
    mountPath: "/verify-certificate",
    method: "",
    middlewares: [],
    modules: [onRequest97]
  },
  {
    routePath: "/watchdog",
    mountPath: "/watchdog",
    method: "",
    middlewares: [],
    modules: [onRequest98]
  },
  {
    routePath: "/watchdog-heatmap",
    mountPath: "/watchdog-heatmap",
    method: "",
    middlewares: [],
    modules: [onRequest99]
  },
  {
    routePath: "/watchdog-hub",
    mountPath: "/watchdog-hub",
    method: "",
    middlewares: [],
    modules: [onRequest100]
  },
  {
    routePath: "/watchdog-leaderboard",
    mountPath: "/watchdog-leaderboard",
    method: "",
    middlewares: [],
    modules: [onRequest101]
  },
  {
    routePath: "/watchdog-map",
    mountPath: "/watchdog-map",
    method: "",
    middlewares: [],
    modules: [onRequest102]
  },
  {
    routePath: "/watchdog-signup",
    mountPath: "/watchdog-signup",
    method: "",
    middlewares: [],
    modules: [onRequest103]
  }
];

// ../../../../../../.npm/_npx/0eedb5afd4158ff3/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a2 = options.prefixes, prefixes = _a2 === void 0 ? "./" : _a2, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a3 = tokens[i], nextType = _a3.type, index = _a3.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a2 = options.decode, decode = _a2 === void 0 ? function(x) {
    return x;
  } : _a2;
  return function(pathname) {
    var m2 = re.exec(pathname);
    if (!m2)
      return false;
    var path = m2[0], index = m2.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m2[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m2[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m2[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m2.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a2 = options.strict, strict = _a2 === void 0 ? false : _a2, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d2 = options.encode, encode = _d2 === void 0 ? function(x) {
    return x;
  } : _d2, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f2 = options.endsWith, endsWith = _f2 === void 0 ? "" : _f2;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../../../.npm/_npx/0eedb5afd4158ff3/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: () => {
            isFailOpen = true;
          }
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../../../../.npm/_npx/0eedb5afd4158ff3/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../../.npm/_npx/0eedb5afd4158ff3/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-9IoUiq/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../../../../.npm/_npx/0eedb5afd4158ff3/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-9IoUiq/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
/*! Bundled license information:

workers-og/dist/index.js:
  (*! Bundled license information:
  
  css-background-parser/index.js:
    (*!
     * https://github.com/gilmoreorless/css-background-parser
     * Copyright © 2015 Gilmore Davidson under the MIT license: http://gilmoreorless.mit-license.org/
     *)
  
  parse-css-color/dist/index.umd.js:
    (**
    	 * parse-css-color
    	 * @version v0.2.1
    	 * @link http://github.com/noeldelgado/parse-css-color/
    	 * @license MIT
    	 *)
  
  escape-html/index.js:
    (*!
     * escape-html
     * Copyright(c) 2012-2013 TJ Holowaychuk
     * Copyright(c) 2015 Andreas Lubbe
     * Copyright(c) 2015 Tiancheng "Timothy" Gu
     * MIT Licensed
     *)
  *)
*/
//# sourceMappingURL=functionsWorker-0.7749629671958389.mjs.map
