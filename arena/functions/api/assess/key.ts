/**
 * GET /api/assess/key — the verification half of the signed assessment.
 * AssessTool's copy tells readers to fetch the public key from here and check the signature
 * themselves; until now the path didn't exist. Returns the Ed25519 public key derived from the
 * same secret the signer uses — or an honest 404 when no key is provisioned, never a made-up key.
 */
interface Env { ASSESS_SIGNING_KEY_PKCS8_B64?: string }

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const b64 = ctx.env.ASSESS_SIGNING_KEY_PKCS8_B64;
  if (!b64) {
    return Response.json(
      { error: "no signing key provisioned — assessments are currently issued UNSIGNED" },
      { status: 404 }
    );
  }
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
  const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
  return Response.json(
    {
      kid: "assess-2026-07",
      alg: "Ed25519",
      pub_jwk_x: jwk.x,
      how_to_verify:
        "signature = Ed25519(sig) over the exact `signed_payload` string (canonical JSON, sorted keys, no whitespace). Verify with any Ed25519 library against pub_jwk_x (base64url raw public key).",
    },
    { headers: { "cache-control": "public, max-age=3600" } }
  );
};
