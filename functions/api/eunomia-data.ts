// functions/api/eunomia-data.ts — commercial x402 DATA endpoint (SOVOS Part IX canon).
// Serves the signed enforcement corpus + deadline calendar as RAW DATA to commercial
// buyers (insurers, bond desks, vendors) behind an x402 payment gate. R8: this is
// DATA-only — never scores, never ranked. Regulators + public get the signed stream
// free (see /first-fine-watch).
export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const key = url.searchParams.has("key") ? "keyed" : "public";
  // x-payment header is the only accepted payment proof; ?x402=paid is NOT payment.
  const paid = context.request.headers.get("x-payment") != null;
  const origin = url.origin;
  const fines = [
    { actor: "Clearview AI", jurisdiction: "EU/UK/IT", regime: "GDPR", amount: ">€100M", status: "cumulative (multi-MSA)" },
    { actor: "FTC (US)", jurisdiction: "US", regime: "FTC Act / ECOA", amount: "~$85M", status: "order (partly suspended)" },
    { actor: "UK ICO", jurisdiction: "UK", regime: "UK GDPR", amount: "~£17M", status: "AI-adjacent" },
    { actor: "OpenAI", jurisdiction: "IT", regime: "GDPR", amount: "€15M", status: "annulled (Mar 2025)" },
    { actor: "EU AI Act (GPAI / Art 101)", jurisdiction: "EU", regime: "EU AI Act", amount: "€0", status: "FIRST-FINE WATCH" },
  ];
  const deadlines = [
    { name: "Texas AI systems registration portal", date: "2026-09-01", note: "state AI disclosure" },
    { name: "DRCF (UK) AI disclosure", date: "2026-09-02", note: "Digital Regulation Cooperation Forum" },
    { name: "EU AI Act Art 50(2) transparency grace ends", date: "2026-12-02", note: "GPAI transparency" },
    { name: "Korea AI Act grace period ends", date: "2027-01-22", note: "Korea AI Basic Act" },
    { name: "Illinois AI audits (265 ILCS)", date: "2028-01-01", note: "state AI audit" },
  ];
  const gate = {
    kind: "x402",
    price_usd: 0.02,
    per: "query",
    pay_url: `${origin}/api/eunomia-data`,
    settle_mcp: "https://github.com/CSOAI-ORG/csoai-coinbase-x402-receipt-mcp",
    data_only: true,
  };

  // Default: return 402 with gate info. Only paid requests (x-payment header) get data.
  if (!paid) {
    return new Response(
      JSON.stringify({
        lane: "commercial-data",
        schema: "csoai.eunomia-data/0.1",
        gate,
        payment_required: {
          amount_usd: 0.02,
          instruction: "Complete x402 settlement via settle_mcp, then retry with x-payment header.",
        },
      }, null, 2),
      {
        status: 402,
        headers: { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "no-store" },
      },
    );
  }

  return new Response(
    JSON.stringify({
      lane: "commercial-data",
      schema: "csoai.eunomia-data/0.1",
      note: "x402 DATA product — never scores, never ranked. Regulators/public free (R8) via /first-fine-watch.",
      signed: false,
      signature_absent: "This endpoint returns unsigned data. The signed First-Fine Watch feed is /api/fines, signed with did:web:csoai.org#board-attestation-1.",
      key_mode: key,
      gate,
      data: { fines, deadlines },
    }, null, 2),
    {
      headers: { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "public, max-age=300" },
    },
  );
};
