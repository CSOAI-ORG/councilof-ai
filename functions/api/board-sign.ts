/**
 * POST /api/board-sign — GitHub OIDC only.
 * Signs a card-v0 payload with Pages secret BOARD_SIGN_KEY_PKCS8_B64.
 * The PKCS8 never leaves Cloudflare. Never logs the key. Not a grade.
 */
import { canonicalBytes } from "../_lib/cardSign";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

const AUD = "https://councilof.ai/api/board-sign";
const ISS = "https://token.actions.githubusercontent.com";
const REPO = "CSOAI-ORG/councilof-ai";
const DID = "did:web:csoai.org#board-attestation-1";

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// Canonical form lives in ONE place (functions/_lib/cardSign.ts) — shared with the metered
// endpoints that issue card-v0 leaves, so no two signers can disagree on the preimage.
const canonical = canonicalBytes;

async function verifyOidc(token: string): Promise<void> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("jwt");
  const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[0]))) as { kid?: string; alg?: string };
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1]))) as Record<string, unknown>;
  if (header.alg !== "RS256") throw new Error("alg");
  if (payload.iss !== ISS) throw new Error("iss");
  const aud = payload.aud;
  const allowed = new Set([AUD, "https://councilof.ai", "https://github.com/CSOAI-ORG/councilof-ai"]);
  const audList = Array.isArray(aud) ? aud : [aud];
  if (!audList.some((a) => typeof a === "string" && allowed.has(a))) throw new Error("aud");
  if (payload.repository !== REPO) throw new Error("repo");
  const wf = String(payload.job_workflow_ref || payload.workflow || payload.workflow_ref || "");
  const allowedWf = ["public-root", "hf-fin-shells", "hf-inference-mill"];
  if (!allowedWf.some((w) => wf.includes(w))) throw new Error("workflow");
  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now() - 30_000) throw new Error("exp");
  const jwks = (await (await fetch(`${ISS}/.well-known/jwks`)).json()) as { keys: JsonWebKey[] };
  const jwk = jwks.keys.find((k) => (k as JsonWebKey & { kid?: string }).kid === header.kid);
  if (!jwk) throw new Error("kid");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlToBytes(parts[2]) as BufferSource,
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!ok) throw new Error("sig");
}

export const onRequestPost: PagesFunction<{ BOARD_SIGN_KEY_PKCS8_B64: string }> = async ({ request, env }) => {
  try {
    const auth = request.headers.get("authorization") || "";
    const tok = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!tok) return json({ error: "unauthorized", reason: "GitHub OIDC bearer required" }, 401);
    await verifyOidc(tok);
  } catch (e) {
    return json({ error: "unauthorized", reason: "OIDC rejected", detail: String((e as Error).message || e) }, 401);
  }

  const pkcs8b64 = (env.BOARD_SIGN_KEY_PKCS8_B64 || "").trim();
  if (!pkcs8b64) {
    return json({ error: "uncheckable", reason: "BOARD_SIGN_KEY_PKCS8_B64 absent in Pages env" }, 503);
  }

  let body: { payload?: unknown };
  try {
    body = (await request.json()) as { payload?: unknown };
  } catch {
    return json({ error: "bad_request", reason: "JSON body required" }, 400);
  }
  if (!body.payload || typeof body.payload !== "object") {
    return json({ error: "bad_request", reason: "payload object required" }, 400);
  }
  const bytes = canonical(body.payload);
  if (bytes.byteLength > 3072) {
    return json({ error: "bad_request", reason: "payload exceeds 3KB cap" }, 400);
  }

  try {
    const der = Uint8Array.from(atob(pkcs8b64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("pkcs8", der as BufferSource, { name: "Ed25519" }, false, ["sign"]);
    const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, key, bytes as BufferSource));
    const hex = [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
    return json({
      schema: "csoai.board-sign/0.1",
      did: DID,
      sig_ed25519: hex,
      payload_sha256: [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource))]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
      note: "Signed on Pages. PKCS8 never left Cloudflare. Not a certificate.",
    });
  } catch (e) {
    return json({ error: "uncheckable", reason: "sign failed", detail: String((e as Error).name || e) }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, content-type" } });
