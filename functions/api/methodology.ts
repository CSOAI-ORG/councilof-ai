// functions/api/methodology.ts — MEASUREMENT METHODOLOGY (honest, deterministic).
// Advertised in llms.txt since 08-22 but never built (audit 2026-08-23 caught the 404).
// States HOW every instrument measures + the honesty rules + claims it refuses.
// Register: methodology is REFERENCE (how we measure), never a measurement itself.

export const onRequestGet: PagesFunction = async () => {
  const methodology = {
    schema: "csoai.methodology/0.1",
    doctrine: "measurement-not-certification \u00b7 nobody-ranked-pays \u00b7 corrections appended not edited",
    instruments: {
      gspc: {
        what: "14-slot GSPC board (quotable); cite live totals.public_count from GET /api/gspc — do not invent 22 axes",
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
      "public_count is derived from GET /api/gspc totals (measured_axes of quotable_axes); jail MEASURED with living-board separation TIE (2026-08-25) — a TIE is not a separated leader",
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
  return Response.json(methodology, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
