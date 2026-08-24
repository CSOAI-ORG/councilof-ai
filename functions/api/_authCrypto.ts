/**
 * Auth crypto for Cloudflare Pages Functions — same Ed25519 spine as assess.ts.
 * Runs on apex (councilof.ai), not GCP. RunPod/Oracle handle compute; login lives here.
 */

export interface AuthEnv {
  ASSESS_SIGNING_KEY_PKCS8_B64?: string;
  SOV_ARENA_STATE?: KVNamespace;
}

const TOKEN_TTL_MS = 30 * 864e5;

export function canonical(o: unknown): string {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
  const rec = o as Record<string, unknown>;
  return "{" + Object.keys(rec).sort().map((k) => JSON.stringify(k) + ":" + canonical(rec[k])).join(",") + "}";
}

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function hashPassword(pw: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return hex(bits);
}

export async function issueToken(env: AuthEnv, user: { email: string; name: string }): Promise<string> {
  const body = { sub: user.email, name: user.name || "", iat: Date.now(), exp: Date.now() + TOKEN_TTL_MS };
  const payload = canonical(body);
  const b64 = env.ASSESS_SIGNING_KEY_PKCS8_B64;
  if (!b64) {
    return btoa(JSON.stringify({ payload, sig: "", alg: "UNSIGNED" }));
  }
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, false, ["sign"]);
  const sigBytes = await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(payload));
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
  return btoa(JSON.stringify({ payload, sig }));
}

export async function verifyToken(env: AuthEnv, token: string): Promise<{ sub: string; name: string } | null> {
  try {
    const parsed = JSON.parse(atob(token)) as { payload: string; sig?: string; alg?: string };
    if (parsed.alg === "UNSIGNED") {
      const body = JSON.parse(parsed.payload) as { sub: string; name: string; exp: number };
      if (body.exp < Date.now()) return null;
      return { sub: body.sub, name: body.name };
    }
    const b64 = env.ASSESS_SIGNING_KEY_PKCS8_B64;
    if (!b64 || !parsed.sig) return null;
    const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["verify"]);
    const sigBytes = Uint8Array.from(atob(parsed.sig), (c) => c.charCodeAt(0));
    const ok = await crypto.subtle.verify("Ed25519", key, sigBytes, new TextEncoder().encode(parsed.payload));
    if (!ok) return null;
    const body = JSON.parse(parsed.payload) as { sub: string; name: string; exp: number };
    if (body.exp < Date.now()) return null;
    return { sub: body.sub, name: body.name };
  } catch {
    return null;
  }
}

export const DEMO_USER = {
  email: "demo@csoai.com",
  password: "demo123",
  name: "Demo User",
};

export function userKey(email: string): string {
  return `auth:user:${String(email).toLowerCase()}`;
}

export interface StoredUser {
  email: string;
  name: string;
  salt: string;
  pw: string;
  created_at: string;
}
