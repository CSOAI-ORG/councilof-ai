// CSOAI Auth + Entitlement — dependency-free, signed with the SAME Ed25519 spine as the
// rest of the app (a2a.js/assess.js/payments.js). No Stripe, no external auth service required.
//
// POST /api/auth/register { email, password, name } -> { token, user }
// POST /api/auth/login    { email, password }       -> { token, user }
// GET  /api/auth/me       (Bearer token)            -> { user, entitlements }
//
// Tokens are Ed25519-signed JSON (stateless, verifiable by any surface with the pubkey).
// Entitlement source of truth = the signed Paddle certificates in certs.jsonl (email-linked),
// so a paid customer unlocks deep reports whether or not a full account store is present.
// Mount:  import auth from "./auth.js"; app.use(auth);

import express from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { canon, signBytes, verifyBytes, KID, pubB64 } from "./a2a.js";

const router = express.Router();

// reconstruct the app's Ed25519 public key object from the shared spine's base64 DER
const PUBKEY = crypto.createPublicKey({ key: Buffer.from(pubB64, "base64"), format: "der", type: "spki" });
const USER_STORE = process.env.USER_STORE || path.join(process.cwd(), "users.jsonl");
const CERT_STORE = process.env.CERT_STORE || path.join(process.cwd(), "certs.jsonl");
const TOKEN_TTL_MS = 30 * 864e5; // 30 days

// ---- password hashing: scrypt with per-user salt (no external dep) ----
function hashPw(pw, salt) { return crypto.scryptSync(pw, salt, 32).toString("hex"); }
function readUsers() {
  try { return fs.readFileSync(USER_STORE, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse); }
  catch { return []; }
}
function findUser(email) { return readUsers().find((u) => u.email === String(email).toLowerCase()); }

// ---- Ed25519-signed stateless token ----
function issueToken(user) {
  const body = { sub: user.email, name: user.name || "", iat: Date.now(), exp: Date.now() + TOKEN_TTL_MS };
  const payload = canon(body);
  const sig = signBytes(Buffer.from(payload));
  return Buffer.from(JSON.stringify({ payload, sig })).toString("base64");
}
function verifyToken(token) {
  try {
    const { payload, sig } = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    if (!verifyBytes(Buffer.from(payload), sig, PUBKEY)) return null;
    const body = JSON.parse(payload);
    if (body.exp < Date.now()) return null;
    return body;
  } catch { return null; }
}

// ---- entitlements: derived from signed certs for this email ----
function entitlementsFor(email) {
  const e = String(email || "").toLowerCase();
  let certs = [];
  try {
    certs = fs.readFileSync(CERT_STORE, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse)
      .filter((c) => String(c.customer_email || "").toLowerCase() === e && new Date(c.expires_at) > new Date());
  } catch { /* no certs yet */ }
  return { paid: certs.length > 0, products: [...new Set(certs.map((c) => c.product_id))], count: certs.length };
}

router.post("/api/auth/register", (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  if (String(password).length < 6) return res.status(400).json({ error: "password must be >= 6 chars" });
  if (findUser(email)) return res.status(409).json({ error: "account already exists" });
  const salt = crypto.randomBytes(16).toString("hex");
  const user = { email: String(email).toLowerCase(), name: name || "", salt, pw: hashPw(password, salt), created_at: new Date().toISOString() };
  try { fs.appendFileSync(USER_STORE, JSON.stringify(user) + "\n"); } catch (e) { return res.status(500).json({ error: "store unavailable" }); }
  const pub = { email: user.email, name: user.name };
  res.json({ token: issueToken(user), user: pub });
});

router.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  const user = findUser(email);
  if (!user || hashPw(password, user.salt) !== user.pw) return res.status(401).json({ error: "invalid credentials" });
  res.json({ token: issueToken(user), user: { email: user.email, name: user.name } });
});

router.get("/api/auth/me", (req, res) => {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  const body = verifyToken(token);
  if (!body) return res.status(401).json({ error: "invalid or expired token" });
  res.json({ user: { email: body.sub, name: body.name }, entitlements: entitlementsFor(body.sub) });
});

export { verifyToken, entitlementsFor, issueToken };
export default router;
