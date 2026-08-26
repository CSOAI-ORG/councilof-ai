// functions/api/clarity.ts — MACHINE-READABILITY & CLARITY RECORD.
// Advertised in llms.txt since 08-22. Binary process facts about how regimes publish
// guidance; predicates only; signed; UNMEASURED honest where not verified. Never a
// certification of any regime. Signing mirrors /api/gspc: canonical JCS + Ed25519 via
// BOARD_SIGN_KEY_PKCS8_B64, key echoed via did:web:csoai.org#board-attestation-1.

interface Env { KV?: unknown; BOARD_SIGN_KEY_PKCS8_B64?: string }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const clarity: Record<string, unknown> = {
    schema: "csoai.clarity/0.2",
    note: "Binary process facts about how regimes publish AI guidance. Predicates only. Where not verified: UNMEASURED, stated honestly.",
    register: "REPORTED (attributed) where sourced; MEASURED only where we deterministically verified; never blended",
    predicates: {
      machine_readable: {
        gdpr: { value: true, source: "EUR-Lex machine-readable formats", verified: "MEASURED" },
        "eu-ai-act": { value: true, source: "EUR-Lex consolidated text", verified: "MEASURED" },
        "uk-osi": { value: false, source: "UK gov publish-advice pages", verified: "REPORTED" },
        "tc260": { value: false, source: "PRC standards portal (PDF-gated)", verified: "REPORTED" },
      },
      guidance_language: {
        english: { value: true, source: "primary publication language", verified: "MEASURED" },
        english_official: { value: "mixed", note: "varies by regime; not a clarity score", verified: "UNMEASURED" },
      },
      updates_published: {
        "eu-ai-act-implementing-acts": { value: true, source: "OJ L series", verified: "MEASURED" },
        "uk-ai-guidance": { value: true, source: "gov.uk updates", verified: "MEASURED" },
      },
    },
    not_a_certification: true,
    generated_at: new Date().toISOString(),
  };

  const b64 = context.env.BOARD_SIGN_KEY_PKCS8_B64;
  if (b64) {
    try {
      const canonical = (o: unknown): string => {
        if (o === null || typeof o !== "object") return JSON.stringify(o);
        if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
        const r = o as Record<string, unknown>;
        return "{" + Object.keys(r).sort().map((k) => JSON.stringify(k) + ":" + canonical(r[k])).join(",") + "}";
      };
      const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
      const signedBytes = canonical({ ...clarity, site_attestation: undefined });
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
      clarity.site_attestation = {
        attests: "integrity of this clarity record as published by the site (NOT a re-measurement)",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        public_key_x: jwk.x,
        sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this payload with the site_attestation field removed",
        verify: "fetch /.well-known/did.json → #board-attestation-1 public key → verify sig over canonical(payload minus site_attestation)",
      };
    } catch {
      clarity.site_attestation = { error: "signing key present but unusable — no signature emitted" };
    }
  }
  return Response.json(clarity, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
