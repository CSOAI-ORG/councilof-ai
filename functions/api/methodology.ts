// functions/api/methodology.ts — MEASUREMENT METHODOLOGY (honest, deterministic).
// States HOW every instrument measures + the honesty rules + claims it refuses.
// Register: methodology is REFERENCE (how we measure), never a measurement itself.
// Signed (gspc pattern): canonical JCS over the body WITHOUT the attestation field.

interface Env { BOARD_SIGN_KEY_PKCS8_B64?: string }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const body: Record<string, unknown> = {
    schema: "csoai.methodology/0.1",
    doctrine: "measurement-not-certification \u00b7 nobody-ranked-pays \u00b7 corrections appended not edited",
    instruments: {
      gspc: {
        what: "22-slot GSPC board (14 GSPC + 8 financial/domain); cite live totals.public_count from GET /api/gspc — 22 slots, measured subset only is quotable",
        grading: "exact-label classification (expected=HIGH_RISK/0/1) OR keyword matching (must_inc); no model judges another model",
        quotability: "nothing quoted below n>=30 usable items; quotable computed, never asserted",
        canaries: "banned-term canaries excluded from scoring",
        transport_failures: "counted as OURS (not usable evidence about the model)",
      },
      boards: {
        what: "signed per-axis measurement boards (Ed25519 over canonical body)",
        verify: "recompute canonical -> sha256=content_id -> Ed25519(content_id) against did:web:csoai.org key",
        signing: "key never travels; public key published in did.json",
      },
      arena: {
        what: "live ELO rounds (KV-backed, honest-503 discipline)",
        register: "REPORTED unless signed; never fused with MEASURED cells",
      },
    },
    honesty_rules: [
      "measurement, not certification — never a 'safe'/'compliant' verdict",
      "public_count is derived from GET /api/gspc totals (measured of quotable); jail MEASURED with living-board separation TIE (2026-08-25) — a TIE is not a separated leader",
      "corrections appended, never edited",
      "no ranked party pays (nobody-ranked-pays)",
      "unmeasured axes stay UNMEASURED — never fabricated into a score",
    ],
    claims_refused: [
      "certification of any model",
      "vendor ranking paid by the ranked",
      "blockchain/on-chain attestation (we use Ed25519 + did:web — a plain auditable signature)",
      "fabricated capacity figures",
    ],
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
      const signedBytes = canonical(body);
      const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, true, ["sign"]);
      const sig = hex(await crypto.subtle.sign("Ed25519", key, new TextEncoder().encode(signedBytes)));
      const jwk = (await crypto.subtle.exportKey("jwk", key)) as JsonWebKey;
      body.site_attestation = {
        attests: "integrity of this methodology as published by the site (NOT a re-measurement)",
        signer: "did:web:csoai.org#board-attestation-1",
        alg: "Ed25519",
        sig,
        public_key_x: jwk.x,
        sig_input: "canonical JSON (recursively sorted keys, no whitespace) of this payload with the site_attestation field removed",
        verify: "fetch /.well-known/did.json → #board-attestation-1 public key → verify sig over canonical(payload minus site_attestation)",
      };
    } catch {
      body.site_attestation = { error: "signing key present but unusable — no signature emitted" };
    }
  }
  return Response.json(body, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
