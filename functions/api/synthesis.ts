/**
 * /api/synthesis — the cross-reference layer.
 *
 * Maps standards to axes, packages to doctrine, loops to counters, doors to APIs.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

export const onRequestGet: PagesFunction = async () => {
  return json({
    schema: "csoai.synthesis/0.1",
    note: "Cross-reference layer — every standard maps to GSPC axes",
    mappings: {
      "EU AI Act → Article 50 axis": "axes-deep.html#art50",
      "NIST AI RMF → Safety axis": "axes-deep.html#safety",
      "ISO 42001 → Governance axis": "axes-deep.html#governance",
      "OWASP LLM Top 10 → Safety axis": "axes-deep.html#safety",
      "GDPR → Privacy axis": "axes-deep.html#privacy",
      "HIPAA → Privacy axis": "axes-deep.html#privacy",
      "FedRAMP → Compliance axis": "axes-deep.html#compliance",
      "x402 → Receipt axis": "axes-deep.html#receipt",
      "XRPL → Asset axis": "axes-deep.html#asset",
      "EAS → On-chain axis": "axes-deep.html#onchain",
    },
    cross_refs: {
      "standards_to_axes": "Every standard maps to 1+ GSPC axes",
      "packages_to_doctrine": "Every package enforces the doctrine",
      "loops_to_counters": "Every loop updates a /api/state counter",
      "doors_to_apis": "Every /.well-known/ door links to a /api/ endpoint",
    },
  });
};
