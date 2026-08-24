// functions/api/eunomia-data.ts — commercial x402 DATA endpoint (SOVOS Part IX canon).
// Serves the signed enforcement corpus + deadline calendar as RAW DATA to commercial
// buyers (insurers, bond desks, vendors) behind an x402 payment gate. R8: this is
// DATA-only — never scores, never anything ranked. Regulators + public get the
// signed stream free (see /first-fine-watch).
export const onRequestGet: PagesFunction = async (context) => {
  const key = context.request.url.includes("key=") ? "keyed" : "public";
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
  return new Response(JSON.stringify({
    lane: "commercial-data", schema: "csoai.eunomia-data/0.1",
    note: "x402 DATA product — never scores, never ranked. Regulators/public free (R8) via /first-fine-watch.",
    signer: "did:web:csoai.org#estate-chain-1", key_mode: key,
    gate: { kind: "x402", price_usd: 0.02, per: "query", pay_url: "", data_only: true },
    data: { fines, deadlines },
  }, null, 2), { headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });
};
