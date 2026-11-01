/**
 * layer0 — the CSOAI Layer-0 Sovereign Gate and the A2A envelope, as served on Pages.
 *
 * This is the PUBLIC gateway: the same three paths the @csoai/layer0 client calls
 * (/api/gate, /api/a2a/route, /api/a2a/verify) plus the public key (/api/a2a/key).
 *
 * WHY A PUBLIC COPY AND NOT A PROXY
 * The canonical product lives in the estate's own service. A public site cannot depend on a
 * laptop being online, so the gate's POLICY is re-expressed here, and the re-expression is
 * checked against the canonical one by a parity test (functions/_lib/layer0.parity.test.ts).
 * If the two ever disagree, the parity test is red and the disagreement is visible rather than
 * silently shipped.
 *
 * THE KEY
 * Only /api/a2a/route signs, and it signs with an Ed25519 key held in a Pages secret
 * (LAYER0_SIGN_KEY_PKCS8_B64). The public half is DERIVED from that same secret, so the two
 * can never drift apart, and the kid is published so a verifier knows which key to use.
 *
 * When the key is absent, this module does NOT generate one. The estate's rule is that an
 * unsigned artefact is honest and a fabricated signature is not: a self-signed envelope nobody
 * can verify is worse than no envelope, because it looks like an attestation. So /api/a2a/route
 * refuses with 503 and says why, and /api/a2a/key says the key is unpublished. Turning signing
 * on is a deliberate act: set the Pages secret.
 *
 * No key material is imported by this file. The caller passes the PKCS8 in, and it never leaves
 * the runtime.
 *
 * Doctrine: measurement, not certification. The gate returns a policy DECISION about an action
 * that was asked of it. It does not certify the caller, it does not rank anything, and a decision
 * here is not a finding about a model.
 */

/**
 * The kid names the key that signed an envelope, so it must resolve to a PUBLISHED place.
 * did:web:csoai.org#layer0-attestation-1 is pinned in the DID document beside the six keys
 * already published there, so a verifier reading an envelope from the public gateway has
 * exactly one place to look for the key. The estate's internal router key is not published
 * anywhere, so it cannot name a public signature.
 */
export const L0_KID_DEFAULT = "did:web:csoai.org#layer0-attestation-1";
export const L0_SIG_ENV = "LAYER0_SIGN_KEY_PKCS8_B64";
export const L0_KID_ENV = "LAYER0_SIGN_KID";
export const L0_ANCHOR_ENV = "SOV_ANCHOR";
export const L0_ANCHOR_DEFAULT = "bitcoin:block/954857";

/**
 * The canonical form, ported verbatim from the canonical product's l0Canon.
 *
 * It is the same rule as functions/_lib/cardSign.ts's canonicalBytes for every JSON-safe value,
 * and the parity test proves that rather than assuming it. The two differ only on values JSON
 * cannot carry (undefined), which is why the envelope builder never puts one in.
 */
export function l0Canon(obj: unknown): string {
  if (Array.isArray(obj)) return "[" + obj.map(l0Canon).join(",") + "]";
  if (obj && typeof obj === "object") {
    const o = obj as Record<string, unknown>;
    return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + l0Canon(o[k])).join(",") + "}";
  }
  const s = JSON.stringify(obj);
  return s === undefined ? "null" : s;
}

/** The canonical bytes that are signed. */
export function l0CanonBytes(obj: unknown): Uint8Array {
  return new TextEncoder().encode(l0Canon(obj));
}

/**
 * The actions the gate refuses. A2A_DENY comes from the environment so a deployment can add its
 * own without a code change; the four statutory ones are always here.
 */
export function denyActions(env: { A2A_DENY?: string } = {}): Set<string> {
  return new Set([
    ...(env.A2A_DENY || "").split(",").filter(Boolean),
    "art5.social_scoring",
    "art5.subliminal_manipulation",
    "art5.emotion_recognition_workplace",
    "art5.real_time_biometric_surveillance",
    "ailuminate.cbrn.weaponize",
    "ailuminate.ransomware.deploy",
    "oowm.g_below_0_50.execute",
  ]);
}

/** The actions that go to a human. */
export function escalateActions(): Set<string> {
  return new Set([
    "model.deploy.high-risk",
    "data.export.cross-region",
    "funds.transfer",
    "annex3.biometric_identification",
    "annex3.critical_infrastructure",
    "annex3.employment_recruitment",
    "annex3.creditworthiness_scoring",
    "annex3.healthcare_triage",
    "legacy.cobol.cics.write",
    "legacy.scada.breaker.trip",
  ]);
}

export type GateDecision = {
  state: "allow" | "deny" | "escalate";
  reason?: string;
  controls: string[];
  conditions?: string[];
  statutory_basis: string;
};

/**
 * The decision. Ported verbatim from the canonical product's l0DecideGate, so the two agree.
 *
 * The order matters and is preserved: identity first (control A), then the non-derogable floor
 * (control C), then the statutory prohibitions, then escalation. A decision is produced for an
 * action that was ASKED about; it says nothing about the action's actual effect.
 */
export function decideGate(
  input: { action?: string; identity?: string; g_score?: number | string | null; domain?: string },
  env: { A2A_DENY?: string } = {},
): GateDecision {
  const { action, identity, g_score, domain } = input;
  if (!identity) {
    return { state: "deny", reason: "no identity (control A)", controls: ["A"], statutory_basis: "CSOAI Layer-0 Control A (Identity Attribution)" };
  }
  if (g_score !== undefined && g_score !== null && Number(g_score) < 0.50) {
    return {
      state: "deny",
      reason: `OOWM G-Block violation: G=${Number(g_score).toFixed(2)} < 0.50 non-derogable invariant (control C)`,
      controls: ["A", "C", "OOWM-G-BLOCK"],
      statutory_basis: "Genesis G-Block Non-Derogable Floor (G >= 0.50)",
    };
  }
  const actStr = String(action || "").toLowerCase();
  const deny = denyActions(env);
  if (
    deny.has(String(action)) ||
    actStr.includes("social_scoring") ||
    actStr.includes("subliminal") ||
    actStr.includes("ransomware") ||
    actStr.includes("weaponize") ||
    actStr.includes("g_below_0_50")
  ) {
    return {
      state: "deny",
      reason: "policy deny: EU AI Act Art. 5 / AILuminate Hazard / OOWM G-Block prohibited action (control C)",
      controls: ["A", "C", "EU-AI-ACT-ART5"],
      statutory_basis: "EU AI Act Art. 5 Prohibited AI Practice / MLCommons AILuminate v1.0",
    };
  }
  if (
    escalateActions().has(String(action)) ||
    actStr.includes("high-risk") ||
    actStr.includes("annex3") ||
    actStr.includes("funds.transfer") ||
    actStr.includes("cobol") ||
    actStr.includes("scada") ||
    ["healthcare", "finance", "credit", "critical_infrastructure", "employment", "law_enforcement"].includes(String(domain || "").toLowerCase())
  ) {
    return {
      state: "escalate",
      reason: "human review required: EU AI Act Annex III / Art. 14 Human Oversight (control G)",
      controls: ["A", "C", "G"],
      statutory_basis: "EU AI Act Annex III High-Risk + Art. 14 Human-in-the-Loop Control G",
    };
  }
  return {
    state: "allow",
    controls: ["A", "C", "F"],
    conditions: [],
    statutory_basis: "CSOAI Layer-0 Controls A (Identity), C (Policy Gate), F (Signed Telemetry)",
  };
}

export type L0Env = {
  LAYER0_SIGN_KEY_PKCS8_B64?: string;
  LAYER0_SIGN_KID?: string;
  SOV_ANCHOR?: string;
  A2A_DENY?: string;
};

export function kid(env: L0Env = {}): string {
  return (env.LAYER0_SIGN_KID || "").trim() || L0_KID_DEFAULT;
}

export function anchor(env: L0Env = {}): string {
  return (env.SOV_ANCHOR || "").trim() || L0_ANCHOR_DEFAULT;
}

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/** base64url (as a JWK carries it) to bytes. */
function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((s.length + 2) % 4);
  return b64ToBytes(b64);
}

/**
 * The DER SPKI prefix of an Ed25519 public key: SEQUENCE(42) { SEQUENCE(5) { OID 1.3.101.112 },
 * BIT STRING(33) }. The 32 raw key bytes follow it.
 */
export const ED25519_SPKI_PREFIX = "302a300506032b6570032100";

/** Build the DER SPKI of an Ed25519 public key from its 32 raw bytes. */
export function spkiFromRawPublicKey(raw: Uint8Array): Uint8Array {
  if (raw.length !== 32) throw new Error(`an Ed25519 public key is 32 bytes, not ${raw.length}`);
  // The prefix is a HEX string, so it is decoded as hex. Decoding it as base64 produces a
  // 44-byte key whose first twelve bytes are the ASCII of the hex, and every signature made
  // with it fails to verify.
  const prefix = Uint8Array.from(ED25519_SPKI_PREFIX.match(/../g)!.map((h) => parseInt(h, 16)));
  const out = new Uint8Array(prefix.length + 32);
  out.set(prefix, 0);
  out.set(raw, prefix.length);
  return out;
}

export type KeyPair = {
  privateKey: CryptoKey;
  publicKeyB64: string; // base64 of the DER SPKI, the form the client passes as __peerKey
  publicKeyPem: string;
};

export type KeyLoad = {
  ok: boolean;
  /** The key pair, or null when there is no usable key. */
  keys: KeyPair | null;
  /** Why there is no key, or null when there is one. */
  reason: string | null;
};

/**
 * Load the signing key from the Pages secret. When it is absent, the caller must refuse to sign
 * and say so — it must not fall back to a generated key.
 */
export async function loadKey(env: L0Env = {}): Promise<KeyLoad> {
  const b64 = (env.LAYER0_SIGN_KEY_PKCS8_B64 || "").trim();
  if (!b64) return { ok: false, keys: null, reason: `${L0_SIG_ENV} is not set on this deployment` };
  try {
    const der = b64ToBytes(b64);
    const privateKey = await crypto.subtle.importKey("pkcs8", der as BufferSource, { name: "Ed25519" }, true, ["sign"]);
    // The public half is DERIVED from the same secret, never configured beside it, so the two
    // cannot drift apart. WebCrypto cannot export an SPKI from a private key - it refuses - but
    // the private key's JWK carries the raw public key in x, which is the same key.
    const jwk = (await crypto.subtle.exportKey("jwk", privateKey)) as JsonWebKey;
    if (!jwk.x) throw new Error("the signing key's JWK carries no public key");
    const spki = spkiFromRawPublicKey(b64urlToBytes(jwk.x));
    return {
      ok: true,
      reason: null,
      keys: {
        privateKey,
        publicKeyB64: btoa(String.fromCharCode(...spki)),
        publicKeyPem: pemFromSpki(spki),
      },
    };
  } catch (e) {
    return { ok: false, keys: null, reason: `the signing key could not be loaded: ${(e as Error).name || e}` };
  }
}

function pemFromSpki(spki: Uint8Array): string {
  let bin = "";
  for (const b of spki) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
  const lines = b64.match(/.{1,64}/g) || [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join("\n")}\n-----END PUBLIC KEY-----\n`;
}

/** Sign the canonical bytes. The signature is raw 64 bytes, base64 — the same encoding the canonical product produces. */
export async function signBytes(bytes: Uint8Array, privateKey: CryptoKey): Promise<string> {
  const sig = await crypto.subtle.sign({ name: "Ed25519" }, privateKey, bytes as BufferSource);
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

/** Verify a base64 signature over the canonical bytes against a base64 DER SPKI public key. */
export async function verifyBytes(bytes: Uint8Array, sigB64: string, publicKeyB64: string): Promise<boolean> {
  try {
    const spki = b64ToBytes(publicKeyB64);
    const key = await crypto.subtle.importKey("spki", spki as BufferSource, { name: "Ed25519" }, false, ["verify"]);
    const sig = b64ToBytes(sigB64);
    return await crypto.subtle.verify({ name: "Ed25519" }, key, sig as BufferSource, bytes as BufferSource);
  } catch {
    return false;
  }
}

export type Envelope = {
  v: string;
  id: string;
  ts: string;
  from?: unknown;
  to?: unknown;
  intent: string;
  action?: unknown;
  payload?: unknown;
  policy: {
    decision: string;
    controls: string[];
    conditions: string[];
    statutory_basis: string | null;
  };
  episode: { hash: string; anchor: string };
  sig: { alg: string; kid: string; value: string };
};

/** The episode hash: sha256 over the canonical {from,to,action,payload}, prefixed "sha256:". */
export async function episodeHash(parts: { from?: unknown; to?: unknown; action?: unknown; payload?: unknown }): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", l0CanonBytes(parts) as BufferSource);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256:${hex}`;
}

/**
 * Build and sign the A2A envelope. The caller supplies the signing key; there is no fallback.
 * The signature covers the canonical form of the envelope WITHOUT its sig field, which is the
 * same rule the canonical product uses and the same rule the verifier reconstructs.
 */
export async function makeEnvelope(
  args: {
    from?: unknown;
    to?: unknown;
    intent?: string;
    action?: unknown;
    payload?: unknown;
    decision: GateDecision;
    privateKey: CryptoKey;
    signKid: string;
    episodeAnchor: string;
    now?: string;
    id?: string;
  },
): Promise<Envelope> {
  const { from, to, intent = "attestation", action, payload, decision, privateKey, signKid, episodeAnchor } = args;
  const env: Omit<Envelope, "sig"> = {
    v: "csoai.a2a/0.1",
    id: args.id || crypto.randomUUID(),
    ts: args.now || new Date().toISOString(),
    from,
    to,
    intent,
    action,
    payload,
    policy: {
      decision: decision.state,
      controls: decision.controls,
      conditions: decision.conditions || [],
      statutory_basis: decision.statutory_basis || null,
    },
    episode: { hash: await episodeHash({ from, to, action, payload }), anchor: episodeAnchor },
  };
  const sig = await signBytes(l0CanonBytes(env), privateKey);
  return { ...env, sig: { alg: "Ed25519", kid: signKid, value: sig } };
}
