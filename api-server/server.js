// CSOAI Governance API — production scaffold for the CSOAI GCP VM ("csoai hive").
// Turns the front-end demo-mode tools into live services:
//   • GitHub OAuth + real evidence collection (branch protection, signed commits)
//   • HMAC-signed webhook delivery with retry
//   • Real group-fairness computation (bias harness)
//   • Sovereign Town signed-feed export (closes SOV_EXPORT_BASE)
// No secrets in code — everything via environment variables (see .env.example).
//
// NOTE ON STORAGE: this scaffold keeps OAuth tokens and webhook registrations in
// memory so it runs with zero external dependencies. For production persistence,
// swap the two Maps below for Firestore / Postgres / the VM's local KV. Marked TODO.

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "node:crypto";
import net from "node:net";
import a2a from "./a2a.js"; // Layer 0 + A2A gateway (/api/gate, /api/a2a/*)
import assess from "./assess.js"; // EU AI Act signed assessment (/api/assess)
import payments from "./payments.js";
import auth from "./auth.js"; // signed auth + entitlement (/api/auth/*) // Paddle checkout + signed-cert webhook (/api/checkout, /api/paddle/*)

const PORT = process.env.PORT || 8080;
const APP_ORIGIN = process.env.APP_ORIGIN || "https://councilof.ai";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  "https://councilof.ai,https://www.councilof.ai,https://csoai.org,https://csoai-v2-app.vercel.app")
  .split(",").map((s) => s.trim());
const GH_ID = process.env.GITHUB_CLIENT_ID || "";
const GH_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const GH_CALLBACK = process.env.GITHUB_CALLBACK_URL || "https://api.csoai.org/api/oauth/github/callback";
const WEBHOOK_SECRET = process.env.WEBHOOK_SIGNING_SECRET || crypto.randomBytes(32).toString("hex");
const SOV_FEED = process.env.SOV_EXPORT_BASE || "https://proofof-site.vercel.app/sovereign-town";

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "256kb" }));
app.use(cors({
  origin(origin, cb) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error("Origin not allowed"));
  },
  credentials: true,
}));
app.use(rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }));

// Layer 0 + A2A gateway routes (Ed25519 envelopes, Sovereign Gate decisions, verify/route)
app.use(a2a);
app.use(assess);
app.use(payments);
app.use(auth);

// ---- in-memory stores (TODO: persist) ----
const tokens = new Map();      // connectionId -> { provider, token, createdAt }
const oauthState = new Map();  // state -> expiresAt
const webhooks = new Map();    // id -> { id, url, events, active, secret }

const now = () => Date.now();
setInterval(() => { for (const [s, exp] of oauthState) if (exp < now()) oauthState.delete(s); }, 60_000).unref?.();

function pingTcp(urlLike) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlLike);
      const port = Number(u.port) || (u.protocol.startsWith("postgres") ? 5432 : u.protocol.startsWith("redis") ? 6379 : 0);
      if (!u.hostname || !port) return resolve({ ok: false, error: "bad url" });
      const s = net.connect({ host: u.hostname, port, timeout: 800 }, () => {
        s.end();
        resolve({ ok: true });
      });
      s.on("error", (e) => resolve({ ok: false, error: e.message }));
      s.on("timeout", () => {
        s.destroy();
        resolve({ ok: false, error: "timeout" });
      });
    } catch (e) {
      resolve({ ok: false, error: String(e && e.message ? e.message : e) });
    }
  });
}

// ---------------------------------------------------------------- health (liveness)
// Tokens/webhooks are in-memory Maps. Postgres/Redis are composed beside us
// but this process does not open them yet — their own healthchecks cover them.
// A down store is reported; it does not take the API out of rotation.
app.get("/api/health", async (_req, res) => {
  const out = { ok: true, service: "csoai-api", storage: "memory", ts: new Date().toISOString() };
  if (process.env.DATABASE_URL) out.postgres = await pingTcp(process.env.DATABASE_URL);
  if (process.env.REDIS_URL) out.redis = await pingTcp(process.env.REDIS_URL);
  res.status(200).json(out);
});

// ---------------------------------------------------------------- GitHub OAuth
app.get("/api/oauth/github/start", (req, res) => {
  if (!GH_ID) return res.status(503).json({ error: "GITHUB_CLIENT_ID not configured" });
  const state = crypto.randomBytes(16).toString("hex");
  oauthState.set(state, now() + 10 * 60_000);
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", GH_ID);
  url.searchParams.set("redirect_uri", GH_CALLBACK);
  url.searchParams.set("scope", "repo read:org");
  url.searchParams.set("state", state);
  res.redirect(url.toString());
});

app.get("/api/oauth/github/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!state || !oauthState.has(String(state))) return res.status(400).send("Invalid state");
  oauthState.delete(String(state));
  try {
    const r = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: GH_ID, client_secret: GH_SECRET, code, redirect_uri: GH_CALLBACK }),
    });
    const data = await r.json();
    if (!data.access_token) return res.status(400).send("Token exchange failed");
    const connectionId = crypto.randomBytes(16).toString("hex");
    tokens.set(connectionId, { provider: "github", token: data.access_token, createdAt: now() });
    // hand the connection id back to the SPA (front-end stores it, sends as header)
    res.redirect(`${APP_ORIGIN}/evidence?connected=github&cid=${connectionId}`);
  } catch (e) {
    res.status(500).send("OAuth error");
  }
});

// ---------------------------------------------------------------- evidence (real)
app.get("/api/evidence/github", async (req, res) => {
  const cid = req.header("x-csoai-connection") || req.query.cid;
  const rec = tokens.get(String(cid));
  if (!rec) return res.status(401).json({ error: "Not connected. Start at /api/oauth/github/start" });
  const owner = String(req.query.owner || "");
  const repo = String(req.query.repo || "");
  if (!owner || !repo) return res.status(400).json({ error: "owner and repo required" });
  const gh = (path) => fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    headers: { Authorization: `Bearer ${rec.token}`, Accept: "application/vnd.github+json", "User-Agent": "csoai-api" },
  });
  try {
    const evidence = [];
    const bp = await gh(`/branches/main/protection`);
    evidence.push({
      control: "Change management",
      framework: "ISO 42001 8.3",
      item: bp.status === 200 ? "Branch protection enabled on main" : "No branch protection on main",
      status: bp.status === 200 ? "pass" : "fail",
      collectedAt: new Date().toISOString(),
    });
    const commits = await gh(`/commits?per_page=20`);
    if (commits.status === 200) {
      const list = await commits.json();
      const signed = list.filter((c) => c.commit?.verification?.verified).length;
      evidence.push({
        control: "Traceability / signed commits",
        framework: "EU AI Act Art 12",
        item: `${signed}/${list.length} recent commits cryptographically verified`,
        status: signed > 0 ? "pass" : "warn",
        collectedAt: new Date().toISOString(),
      });
    }
    res.json({ source: "github", repo: `${owner}/${repo}`, evidence });
  } catch (e) {
    res.status(502).json({ error: "GitHub fetch failed" });
  }
});

// ---------------------------------------------------------------- webhooks (HMAC-signed)
function sign(body, secret) {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}
async function deliver(hook, event, payload) {
  const body = JSON.stringify({ event, payload, ts: new Date().toISOString() });
  const sig = sign(body, hook.secret || WEBHOOK_SECRET);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(hook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSOAI-Event": event, "X-CSOAI-Signature": sig },
        body,
      });
      return { status: r.status, attempt };
    } catch {
      await new Promise((res) => setTimeout(res, attempt * 500)); // backoff
    }
  }
  return { status: 0, attempt: 3, failed: true };
}

app.get("/api/webhooks", (_req, res) => res.json([...webhooks.values()].map(({ secret, ...h }) => h)));
app.post("/api/webhooks", (req, res) => {
  const { url, events } = req.body || {};
  if (!/^https:\/\//.test(url || "")) return res.status(400).json({ error: "https url required" });
  const id = "wh_" + crypto.randomBytes(6).toString("hex");
  const secret = crypto.randomBytes(24).toString("hex");
  webhooks.set(id, { id, url, events: events || [], active: true, secret });
  res.json({ id, url, events: events || [], active: true, secret }); // secret shown once
});
app.delete("/api/webhooks/:id", (req, res) => { webhooks.delete(req.params.id); res.json({ ok: true }); });
app.post("/api/webhooks/emit", async (req, res) => {
  const { event, payload } = req.body || {};
  const targets = [...webhooks.values()].filter((h) => h.active && (h.events.length === 0 || h.events.includes(event)));
  const results = await Promise.all(targets.map((h) => deliver(h, event, payload).then((r) => ({ id: h.id, ...r }))));
  res.json({ event, delivered: results });
});

// ---------------------------------------------------------------- fairness harness (real computation)
app.post("/api/fairness/run", (req, res) => {
  // body: { rows: [{ group, yTrue: 0|1, yPred: 0|1 }, ...] }
  const rows = (req.body && req.body.rows) || [];
  if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ error: "rows[] required" });
  const groups = [...new Set(rows.map((r) => r.group))];
  const stat = (g) => {
    const gr = rows.filter((r) => r.group === g);
    const sel = gr.filter((r) => r.yPred === 1).length / gr.length;
    const pos = gr.filter((r) => r.yTrue === 1);
    const tpr = pos.length ? pos.filter((r) => r.yPred === 1).length / pos.length : 0;
    return { group: g, n: gr.length, selectionRate: sel, tpr };
  };
  const s = groups.map(stat);
  const sels = s.map((x) => x.selectionRate);
  const tprs = s.map((x) => x.tpr);
  const round = (n) => Math.round(n * 1000) / 1000;
  res.json({
    groups: s.map((x) => ({ ...x, selectionRate: round(x.selectionRate), tpr: round(x.tpr) })),
    metrics: {
      demographic_parity_difference: round(Math.max(...sels) - Math.min(...sels)),
      equal_opportunity_difference: round(Math.max(...tprs) - Math.min(...tprs)),
      disparate_impact_ratio: round(Math.min(...sels) / (Math.max(...sels) || 1)),
    },
  });
});

// ---------------------------------------------------------------- Sovereign Town export (task #3)
app.get("/api/sovereign-town/export", async (_req, res) => {
  try {
    const [status, anchor] = await Promise.all([
      fetch(`${SOV_FEED}/status.json`, { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      fetch(`${SOV_FEED}/anchor.json`, { cache: "no-store" }).then((r) => r.json()).catch(() => null),
    ]);
    res.json({ source: SOV_FEED, exportedAt: new Date().toISOString(), status, anchor });
  } catch {
    res.status(502).json({ error: "feed unavailable" });
  }
});

// ---------------------------------------------------------------- MCP fleet
// Streams the live MCP deployment manifest (216 servers). Set GITHUB_TOKEN for the
// private manifest, or MCP_MANIFEST_URL to point at any hosted copy.
let _mcpCache = { at: 0, data: null };
app.get("/api/mcp", async (_req, res) => {
  if (_mcpCache.data && Date.now() - _mcpCache.at < 300_000) return res.json(_mcpCache.data);
  const url = process.env.MCP_MANIFEST_URL || "https://raw.githubusercontent.com/CSOAI-ORG/clawd-workspace/main/MCP_DEPLOYMENT_MANIFEST.json";
  try {
    const r = await fetch(url, { headers: process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "User-Agent": "csoai-api" } : { "User-Agent": "csoai-api" } });
    const m = await r.json();
    const servers = (m.deployable_servers || []).map((s) => ({
      name: s.name, hive: s.hive, language: s.language,
      ready: !!s.deployment_ready, auth: !!s.has_auth_middleware, version: s.version,
      l0: s.deployment_ready ? "L0-3" : s.has_auth_middleware ? "L0-1" : "L0-0",
    }));
    const out = { total: m.total_servers ?? servers.length, hives: m.hive_count, generated_at: m.generated_at, servers };
    _mcpCache = { at: Date.now(), data: out };
    res.json(out);
  } catch { res.status(502).json({ error: "manifest unavailable" }); }
});

app.use((_req, res) => res.status(404).json({ error: "not found" }));
app.listen(PORT, () => console.log(`csoai-api listening on :${PORT}`));
