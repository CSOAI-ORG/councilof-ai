// CSOAI Layer 0 + A2A gateway — mountable Express router implementing the protocol
// (CSOAI_Layer0_A2A_Protocol.md §3-§6). Real Ed25519 signing/verification + a policy
// gate + envelope routing. Mount in server.js:  import a2a from "./a2a.js"; app.use(a2a);
//
// Keys: set CSOAI_SIGNING_KEY to a base64 PKCS8 Ed25519 private key. If unset, a keypair
// is generated at boot (fine for dev; persist for prod so signatures stay verifiable).

import express from "express";
import crypto from "node:crypto";

const router = express.Router();

// ---- key material ----
let priv, pub;
try {
  if (process.env.CSOAI_SIGNING_KEY) {
    priv = crypto.createPrivateKey({ key: Buffer.from(process.env.CSOAI_SIGNING_KEY, "base64"), format: "der", type: "pkcs8" });
    pub = crypto.createPublicKey(priv);
  } else {
    ({ privateKey: priv, publicKey: pub } = crypto.generateKeyPairSync("ed25519"));
  }
} catch { ({ privateKey: priv, publicKey: pub } = crypto.generateKeyPairSync("ed25519")); }

const KID = "did:csoai:gate#key-1";
const pubB64 = pub.export({ format: "der", type: "spki" }).toString("base64");

// ---- canonical JSON (stable key order) for signing ----
function canon(obj) {
  if (Array.isArray(obj)) return "[" + obj.map(canon).join(",") + "]";
  if (obj && typeof obj === "object")
    return "{" + Object.keys(obj).sort().map((k) => JSON.stringify(k) + ":" + canon(obj[k])).join(",") + "}";
  return JSON.stringify(obj);
}
function signBytes(buf) { return crypto.sign(null, buf, priv).toString("base64"); }
function verifyBytes(buf, sigB64, pubKey) {
  try { return crypto.verify(null, buf, pubKey, Buffer.from(sigB64, "base64")); } catch { return false; }
}
const blake = (s) => "sha256:" + crypto.createHash("sha256").update(s).digest("hex"); // sha256 stand-in for blake3

// ---- §3 the gate: allow | allow-with-conditions | deny | escalate ----
const DENY_ACTIONS = new Set((process.env.A2A_DENY || "").split(",").filter(Boolean));
const ESCALATE_ACTIONS = new Set(["model.deploy.high-risk", "data.export.cross-region", "funds.transfer"]);
function decide({ action, identity }) {
  if (!identity) return { state: "deny", reason: "no identity (control A)", controls: ["A"] };
  if (DENY_ACTIONS.has(action)) return { state: "deny", reason: "policy deny (control C)", controls: ["A", "C"] };
  if (ESCALATE_ACTIONS.has(action)) return { state: "escalate", reason: "human review (control G)", controls: ["A", "C", "G"] };
  return { state: "allow", controls: ["A", "C", "F"], conditions: [] };
}

router.get("/api/a2a/key", (_req, res) => res.json({ kid: KID, alg: "Ed25519", publicKey: pubB64 }));

// decision endpoint used by the @csoai/layer0 adapter
router.post("/api/gate", express.json(), (req, res) => {
  const { action, identity } = req.body || {};
  res.json({ ...decide({ action, identity }), nonce: crypto.randomBytes(12).toString("hex"), ts: new Date().toISOString() });
});

// build + sign an A2A envelope (server-side helper, also exposed)
function makeEnvelope({ from, to, intent, action, payload, decision }) {
  const env = {
    v: "csoai.a2a/0.1",
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    from, to, intent, action, payload,
    policy: { decision: decision.state, controls: decision.controls, conditions: decision.conditions || [] },
    episode: { hash: blake(canon({ from, to, action, payload })), anchor: process.env.SOV_ANCHOR || "bitcoin:block/954857" },
  };
  env.sig = { alg: "Ed25519", kid: KID, value: signBytes(Buffer.from(canon(env))) };
  return env;
}

// §6 verify an inbound envelope offline (sig + optional peer key)
router.post("/api/a2a/verify", express.json({ limit: "256kb" }), (req, res) => {
  const env = req.body || {};
  const sig = env.sig; if (!sig) return res.status(400).json({ valid: false, error: "no sig" });
  const peerKeyB64 = req.body.__peerKey || pubB64; // default: our own gate key
  let peer; try { peer = crypto.createPublicKey({ key: Buffer.from(peerKeyB64, "base64"), format: "der", type: "spki" }); } catch { return res.status(400).json({ valid: false, error: "bad key" }); }
  const unsigned = { ...env }; delete unsigned.sig; delete unsigned.__peerKey;
  const valid = verifyBytes(Buffer.from(canon(unsigned)), sig.value, peer);
  res.json({ valid, party: env.from?.party || null, controls: env.policy?.controls || [], anchor: env.episode?.anchor || null });
});

// §6 policy-check + sign + (optionally) forward to a peer endpoint — the Gate as a hop
router.post("/api/a2a/route", express.json({ limit: "256kb" }), async (req, res) => {
  const { from, to, intent = "request", action, payload, identity } = req.body || {};
  const decision = decide({ action, identity });
  if (decision.state === "deny") return res.status(403).json({ error: "denied", decision });
  const env = makeEnvelope({ from, to, intent, action, payload, decision });
  if (decision.state === "escalate") return res.json({ status: "escalated", envelope: env, decision }); // hold for human (control G)
  let forwarded = null;
  if (to?.endpoint && /^https:\/\//.test(to.endpoint)) {
    try {
      const r = await fetch(to.endpoint, { method: "POST", headers: { "Content-Type": "application/json", "X-CSOAI-A2A": "1" }, body: JSON.stringify(env) });
      forwarded = { status: r.status };
    } catch { forwarded = { status: 0, failed: true }; }
  }
  res.json({ status: "routed", envelope: env, forwarded });
});

export default router;
