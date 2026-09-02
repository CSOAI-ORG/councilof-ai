/**
 * POST /api/card-sign — GitHub OIDC only, measurement-card key only.
 *
 * This endpoint is deliberately separate from /api/board-sign. A board snapshot
 * signature cannot be relabelled as a measurement-card signature. The private
 * key never leaves Cloudflare and its public half must equal the verifier pin.
 */
const ISS = "https://token.actions.githubusercontent.com";
const REPO = "CSOAI-ORG/councilof-ai";
const AUD = "https://councilof.ai/api/card-sign";
const DID = "did:web:csoai.org#card-attestation-1";
const PINNED_PUBKEY = "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38";

const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { "cache-control": "no-store", "access-control-allow-origin": "*" },
});

function b64urlBytes(value: string): Uint8Array {
  const normal = value.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(normal + "=".repeat((4 - normal.length % 4) % 4)), (char) => char.charCodeAt(0));
}

export function canonicalCardBody(value: unknown): string {
  if (value === null || typeof value !== "object") {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new Error("unserialisable value");
    return encoded;
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalCardBody).join(",") + "]";
  const record = value as Record<string, unknown>;
  return "{" + Object.keys(record).sort().map(
    (key) => JSON.stringify(key) + ":" + canonicalCardBody(record[key]),
  ).join(",") + "}";
}

const hex = (bytes: ArrayBuffer | Uint8Array) =>
  [...(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))].map((byte) => byte.toString(16).padStart(2, "0")).join("");

async function verifyOidc(token: string): Promise<void> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("jwt");
  const header = JSON.parse(new TextDecoder().decode(b64urlBytes(parts[0]))) as { kid?: string; alg?: string };
  const payload = JSON.parse(new TextDecoder().decode(b64urlBytes(parts[1]))) as Record<string, unknown>;
  if (header.alg !== "RS256" || payload.iss !== ISS || payload.repository !== REPO) throw new Error("claims");
  const audiences = (Array.isArray(payload.aud) ? payload.aud : [payload.aud])
    .filter((audience): audience is string => typeof audience === "string");
  if (!audiences.includes(AUD)) throw new Error("aud");
  const workflow = String(payload.job_workflow_ref || payload.workflow_ref || "");
  if (!workflow.includes("/.github/workflows/hf-fin-shells-measure.yml@")) throw new Error("workflow");
  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now() - 30_000) throw new Error("exp");
  const jwks = await (await fetch(`${ISS}/.well-known/jwks`)).json() as { keys: Array<JsonWebKey & { kid?: string }> };
  const jwk = jwks.keys.find((candidate) => candidate.kid === header.kid);
  if (!jwk) throw new Error("kid");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlBytes(parts[2]) as BufferSource,
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`) as BufferSource,
  );
  if (!valid) throw new Error("sig");
}

export const onRequestPost: PagesFunction<{ CARD_SIGN_KEY_PKCS8_B64?: string }> = async ({ request, env }) => {
  try {
    const auth = request.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) throw new Error("bearer");
    await verifyOidc(auth.slice(7).trim());
  } catch (cause) {
    return json({ error: "unauthorized", reason: "GitHub OIDC rejected", detail: (cause as Error).message }, 401);
  }

  let requestBody: { payload?: unknown };
  try { requestBody = await request.json(); }
  catch { return json({ error: "bad_request", reason: "JSON body required" }, 400); }
  if (!requestBody.payload || typeof requestBody.payload !== "object") {
    return json({ error: "bad_request", reason: "payload object required" }, 400);
  }
  const bytes = new TextEncoder().encode(canonicalCardBody(requestBody.payload));
  if (bytes.byteLength > 3072) return json({ error: "bad_request", reason: "payload exceeds 3KB cap" }, 400);

  const pkcs8 = (env.CARD_SIGN_KEY_PKCS8_B64 || "").trim();
  if (!pkcs8) return json({ error: "uncheckable", reason: "CARD_SIGN_KEY_PKCS8_B64 absent" }, 503);
  try {
    const key = await crypto.subtle.importKey(
      "pkcs8",
      Uint8Array.from(atob(pkcs8), (char) => char.charCodeAt(0)) as BufferSource,
      { name: "Ed25519" },
      true,
      ["sign"],
    );
    const jwk = await crypto.subtle.exportKey("jwk", key) as JsonWebKey;
    const publicHex = jwk.x ? hex(b64urlBytes(jwk.x)) : "";
    if (publicHex !== PINNED_PUBKEY) {
      return json({ error: "uncheckable", reason: "configured key does not match card-attestation verifier pin" }, 503);
    }
    const signature = await crypto.subtle.sign("Ed25519", key, bytes as BufferSource);
    const id = hex(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
    return json({
      schema: "csoai.card-sign/1",
      did: DID,
      alg: "Ed25519",
      preimage_rule: "jcs-rfc8785",
      pubkey: PINNED_PUBKEY,
      id,
      signature: hex(signature),
      note: "Integrity signature over these measurement-card bytes. Not a certificate or approval.",
    });
  } catch (cause) {
    return json({ error: "uncheckable", reason: "card signing failed", detail: (cause as Error).name }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, content-type" } });
