/**
 * GET /api/x402-trust-seller?host=<catalog-host>
 *
 * Per-skin seller-side trust page: a catalog owner sees a pointer at their own
 * verified-count door, sold as MCP `commission_card` (request-attestation).
 *
 * Free preview (no x-payment): this document. Paid step: the same origin's
 * /api/request-attestation?subject=<host> — a 402, never a grade.
 * Host names belong HERE (the owner's own row). They never appear in
 * /interop/x402-trust/latest.json counts.
 */
const HOST_RE = /^[A-Za-z0-9][A-Za-z0-9.-]{0,253}$/;

export const PAID_TOOL = "commission_card";
export const PAID_ROUTE = "/api/request-attestation";

export function sellerBody(origin: string, host: string | null): Record<string, unknown> {
  const base = origin.replace(/\/$/, "");
  const subject = host && HOST_RE.test(host) ? host : null;
  const paid = subject
    ? `${base}${PAID_ROUTE}?subject=${encodeURIComponent(subject)}`
    : `${base}${PAID_ROUTE}?subject=<catalog-host>`;
  return {
    schema: "csoai.x402-trust-seller/0.1",
    as_of: new Date().toISOString(),
    host: subject,
    counts_aggregate: `${base}/interop/x402-trust/latest.json`,
    paid_step: paid,
    sold_as: PAID_TOOL,
    mcp: `tools/call ${PAID_TOOL} {subject: ${JSON.stringify(subject || "<catalog-host>")}}`,
    free_preview: true,
    risk_verdict: "UNMEASURED",
    note: "A catalog owner commissions a signed card of their own rows' verified counts. Payment never mints a MEASURED cell. Verification stays free.",
    never: ["a grade", "a rank", "a certificate", "a MEASURED cell minted by payment"],
  };
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const host = (url.searchParams.get("host") || "").trim() || null;
  if (host && !HOST_RE.test(host)) {
    return Response.json(
      { schema: "csoai.x402-trust-seller/0.1", error: "bad_request", reason: "host: DNS label, 1–253 chars" },
      { status: 400, headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } },
    );
  }
  return Response.json(sellerBody(origin, host), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
};
