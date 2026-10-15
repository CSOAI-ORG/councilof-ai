/**
 * POST /api/sign — seal an artifact (text, or its sha256) with an Ed25519 signature. GET explains how.
 *
 * WHY THIS EXISTS. mcp/csoai-governance `csoai_sign` posts here and has answered 404 since 0.1.0
 * (#3232 documents it). The capability is "CSOAI's server saw exactly these bytes at time T" —
 * a timestamped, tamper-evident seal. It measures nothing, scores nothing and certifies nothing.
 *
 * KEY SCOPE. Every existing estate key is scoped by its own module (route key: route records only;
 * board key: board leaves only). Reusing one to sign caller-supplied bytes would let anyone obtain
 * an estate-key signature over arbitrary text. So this door uses its OWN key and kid:
 *   secret  ARTIFACT_SIGN_KEY_PKCS8_B64   (Ed25519 PKCS#8, Cloudflare Pages secret, server-side only)
 *   kid     did:web:csoai.org#artifact-seal-1
 * And it never signs the caller's bytes raw: it signs the RFC-8785-style canonical JSON of an
 * envelope {profile, artifact_sha256, sealed_at}, so a seal can never be replayed as some other
 * estate document.
 *
 * FAIL CLOSED. No secret / not Ed25519 => 503 SIGNER_UNAVAILABLE with the reason. Never logs and
 * never returns key bytes; only the public half is returned.
 */
import { canonicalBytes, sha256Hex } from "../_lib/cardSign";
import { headFromGet } from "./_head";

export const ARTIFACT_SEAL_KID = "did:web:csoai.org#artifact-seal-1";
export const ARTIFACT_SEAL_PROFILE = "csoai.artifact-seal/0.1";
export const MAX_ARTIFACT_BYTES = 1_000_000;

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...CORS },
  });
const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

type Env = { ARTIFACT_SIGN_KEY_PKCS8_B64?: string };
type Seal = { sign: (m: Uint8Array) => Promise<Uint8Array>; publicKeyHex: string };

export async function artifactSigner(pkcs8b64: string | undefined): Promise<Seal | { unavailable: string }> {
  const b64 = (pkcs8b64 || "").trim();
  if (!b64) return { unavailable: "ARTIFACT_SIGN_KEY_PKCS8_B64 is not provisioned in this environment" };
  try {
    const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("pkcs8", der as BufferSource, { name: "Ed25519" }, true, ["sign"]);
    const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
    const x = String(jwk.x || "").replace(/-/g, "+").replace(/_/g, "/");
    const pub = Uint8Array.from(atob(x + "=".repeat((4 - (x.length % 4)) % 4)), (c) => c.charCodeAt(0));
    return {
      publicKeyHex: hex(pub),
      sign: async (m) => new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, key, m as BufferSource)),
    };
  } catch {
    return { unavailable: "the configured artifact key could not be imported as Ed25519 PKCS#8" };
  }
}

export async function sealArtifact(input: { message?: unknown; sha256?: unknown }, signer: Seal, now = new Date()) {
  let digest: string;
  if (typeof input.sha256 === "string" && /^[0-9a-f]{64}$/i.test(input.sha256)) digest = input.sha256.toLowerCase();
  else if (typeof input.message === "string" && input.message.length) {
    const bytes = new TextEncoder().encode(input.message);
    if (bytes.length > MAX_ARTIFACT_BYTES) return { error: `artifact over ${MAX_ARTIFACT_BYTES} bytes; post its sha256 instead`, status: 413 };
    digest = await sha256Hex(bytes);
  } else return { error: "post {message: string} or {sha256: <64 hex>}", status: 400 };
  const envelope = { profile: ARTIFACT_SEAL_PROFILE, artifact_sha256: digest, sealed_at: now.toISOString() };
  const bytes = canonicalBytes(envelope);
  const canonical = new TextDecoder().decode(bytes);
  const sig = hex(await signer.sign(bytes));
  return {
    sealed: true, alg: "ed25519", kid: ARTIFACT_SEAL_KID, envelope, canonical,
    signature: sig, publicKey: signer.publicKeyHex,
    fingerprint: "SOV:" + (await sha256Hex(new TextEncoder().encode(sig))).slice(0, 16),
    note: "Ed25519 over the canonical envelope bytes. Attests the server saw this sha256 at sealed_at. Certifies nothing.",
  };
}

export const onRequestOptions = () => new Response(null, { status: 204, headers: CORS });

export const onRequestGet = () =>
  json({
    endpoint: "/api/sign", method: "POST", body: "{message: string} or {sha256: '<64 hex>'}",
    profile: ARTIFACT_SEAL_PROFILE, kid: ARTIFACT_SEAL_KID,
    verify: "Ed25519-verify `signature` over the UTF-8 bytes of `canonical` with `publicKey`; check envelope.artifact_sha256 = sha256(your artifact).",
    free: true, certifies: "nothing",
  });

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; } catch { return json({ error: "body must be JSON" }, 400); }
  const signer = await artifactSigner(env.ARTIFACT_SIGN_KEY_PKCS8_B64);
  if ("unavailable" in signer) return json({ error: "SIGNER_UNAVAILABLE", reason: signer.unavailable, sealed: false }, 503);
  const r = await sealArtifact(body, signer);
  if ("error" in r) return json({ error: r.error, sealed: false }, r.status);
  return json(r);
};

export const onRequestHead = headFromGet(onRequestGet);
