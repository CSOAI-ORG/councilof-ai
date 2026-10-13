/**
 * GET /api/coverage-evidence — the TUI-2 coverage evidence row, as an x402 paid door.
 *
 * WHAT THIS IS. The assembled evidence row for ONE named asset from the dated coverage record
 * (finance/full-spread canonical, CSOAI-ORG/sovos-harness PR #13): canonical identity,
 * measurement state with its method and observation date, the provenance digests the row was
 * quoted from (canonical version + SHA-256), and this record's anchor state — kept honest:
 * the record's evidence packs are UNSIGNED (signed_evidence_packs: 0) until the owner-intake
 * signing runs, and Rekor/OTS anchoring is an estate surface, never implied per row. The row
 * is embedded (_coverage_rows.ts) with its canonical version and SHA-256 so a settle echoes
 * the SAME bytes it was quoted against; freshness is stated, never implied.
 *
 * WHAT IT NEVER RETURNS. No grade, no score, no pass/fail, no ranking — measurement is not
 * certification. DEEP_MEASURED, UNMEASURED_REASON_DOCUMENTED and INDEXED_METADATA_ONLY stay
 * three distinct states in every response.
 *
 * FREE vs PAID. ?preview=1 (no payment header) returns identity + state + as_of — enough to
 * evaluate. The full row answers 402 without a payment header (buildPaymentRequiredV2) and
 * 200 with one verified by verifyX402Payment, which records THE ONE NUMBER via
 * recordSettlement. Verification of our public artefacts stays free on the public board —
 * this door sells assembly (the packaged row), never access to truth.
 */
import { buildPaymentRequiredV2, declareBazaarHttpGet, hasPaymentHeader, paymentRequiredResponseSigned, verifyX402Payment, x402Accepts, CSOAI_LID, type X402Env } from "./_x402";
import { headFromGet } from "./_head";
import { COVERAGE_EVIDENCE_DESCRIPTION } from "./_x402_descriptions";
import { COVERAGE, type CoverageRow } from "./_coverage_rows";

export const KIND = "csoai.coverage-evidence/0.1";
export const SKU_ID = "coverage_evidence";
export const TIER = "per_request";
export const PRODUCT_ID = "csoai.product.coverage_evidence";

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", ...extra },
  });

/** Resolve ?asset= — numeric DefiLlama id first, then a symbol with collision honesty. */
function resolve(asset: string): { id: string; row: CoverageRow } | { ambiguous: string[] } | null {
  const key = asset.trim().toLowerCase();
  if (/^\d+$/.test(key) && COVERAGE.rows[key]) return { id: key, row: COVERAGE.rows[key] };
  const ids = COVERAGE.by_symbol[key] ?? [];
  if (ids.length === 1 && COVERAGE.rows[ids[0]]) return { id: ids[0], row: COVERAGE.rows[ids[0]] };
  if (ids.length > 1) return { ambiguous: ids };
  // Name lookup (unique only) — ?asset=tether must resolve the way ?asset=373 and ?asset=usdt do.
  const named = Object.entries(COVERAGE.rows).filter(([, r]) => (r.n || "").toLowerCase() === key).map(([id]) => id);
  if (named.length === 1 && COVERAGE.rows[named[0]]) return { id: named[0], row: COVERAGE.rows[named[0]] };
  if (named.length > 1) return { ambiguous: named };
  return null;
}

function previewBody(id: string, row: CoverageRow) {
  return {
    schema: KIND,
    preview: true,
    asset: { defillama_id: id, symbol: row.s, name: row.n, chain: row.c },
    state: row.st,
    as_of: COVERAGE.as_of,
    canonical: { version: COVERAGE.canonical_version, sha256: COVERAGE.canonical_sha256, pr: COVERAGE.pr },
    settles_buys: "the assembled row: method + measured_at (or the published reason), identity verification flag, provenance digests, this record's honest anchor state, payment echo",
    note: "Free preview — enough to evaluate. Measurement is not certification; verification of our public artefacts stays free on the public board.",
  };
}

function fullBody(id: string, row: CoverageRow, payment: unknown) {
  return {
    schema: KIND,
    asset: { defillama_id: id, symbol: row.s, name: row.n, chain: row.c },
    measurement: {
      state: row.st,
      measured_at: row.at ?? null,
      method: row.meth ?? null,
      identity_verified_onchain: row.idv ?? null,
      reason: row.rsn ?? null,
    },
    provenance: {
      record: `CSOAI-ORG/sovos-harness ${COVERAGE.pr}`,
      branch: COVERAGE.branch,
      canonical_version: COVERAGE.canonical_version,
      canonical_sha256: COVERAGE.canonical_sha256,
      as_of: COVERAGE.as_of,
      measurement_not_certification: COVERAGE.measurement_not_certification,
      signed_evidence_packs: COVERAGE.signed_evidence_packs,
    },
    anchors: {
      signed_evidence_packs: COVERAGE.signed_evidence_packs,
      note: "This record's rows are unsigned (0 signed packs) and carry no per-row Rekor/OTS anchor yet; anchoring is an estate surface reported separately, never inferred here.",
    },
    counts: COVERAGE.counts,
    payment,
    disclaimer: "Measurement is not certification. DEEP_MEASURED is measured on that chain's public interface at measured_at; UNMEASURED_REASON_DOCUMENTED publishes why not; INDEXED_METADATA_ONLY is indexed only.",
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  // The door charges its PATH, not a concrete query URL: a buyer's target never becomes a
  // catalogue row (x402-ras-doors 64e556117). The listing builds its terms the same way.
  const resourceUrl = `${origin}/api/coverage-evidence`;
  const asset = url.searchParams.get("asset");
  const bazaar = declareBazaarHttpGet({
    method: "GET",
    queryParams: { asset: "373", preview: "1" },
    queryParamsSchema: {
      properties: {
        asset: { type: "string", description: "numeric DefiLlama stablecoin id (or a symbol; collisions return 409 with candidates)" },
        preview: { type: "string", const: "1", description: "free preview: identity + state + as_of only" },
      },
      required: ["asset"],
    },
    outputExample: { schema: KIND, asset: { defillama_id: "373", symbol: "USDT", name: "Tether", chain: "Ethereum" }, state: "DEEP_MEASURED" },
  });
  const isPreview = url.searchParams.get("preview") === "1";
  const accepts = x402Accepts(env, resourceUrl, { skuId: SKU_ID, tier: TIER, description: COVERAGE_EVIDENCE_DESCRIPTION, productId: PRODUCT_ID });
  // PATH-SCOPED DOCTRINE (x402-ras-doors 64e556117): a stranger or index — and the parity test
  // that impersonates one — gets a priced challenge with the PATH only, never a raw input error
  // and never the buyer's query echoed back. Input errors ride the challenge as a hint; they are
  // only answered as errors where a row would be served (so a settle is never wasted on a target
  // that cannot exist: ambiguous/unresolvable input is challenged BEFORE verify).
  const challenge = (inputNote?: string) =>
    paymentRequiredResponseSigned(buildPaymentRequiredV2({
      resourceUrl,
      description: COVERAGE_EVIDENCE_DESCRIPTION,
      serviceName: "CSOAI Coverage Evidence",
      tags: ["stablecoins", "coverage", "measurement", "evidence", "x402"],
      accepts,
      bazaar,
      csoai: {
        schema: KIND,
        lid: CSOAI_LID,
        never: ["grade", "score", "certificate", "ranking"],
        deliverable: "one assembled JSON evidence row for the named asset: canonical identity, measurement state + method + measured_at (or the published reason), provenance digests (canonical version + SHA-256), and this record's honest anchor state",
        free_preview: `${resourceUrl}?asset=tether&preview=1`,
        catalog: `${origin}/api/x402`,
        ...(inputNote ? { input_note: inputNote } : {}),
      },
    }), env);

  // FREE PREVIEW rail: honest input errors allowed (it is not the paid rail, not the listing).
  if (isPreview && !hasPaymentHeader(request)) {
    if (!asset) return json({ error: "bad_request", error_description: "required query parameter 'asset' is missing", hint: "asset = numeric DefiLlama id, a symbol, or an exact asset name", kind: KIND, free_preview: `${resourceUrl}?asset=tether&preview=1` }, 400);
    const prev = resolve(asset);
    if (!prev) return json({ error: "unknown_asset", error_description: `asset '${asset}' is not in this coverage record (${COVERAGE.counts.indexed} indexed ids as_of ${COVERAGE.as_of})`, kind: KIND, record: { canonical_version: COVERAGE.canonical_version, canonical_sha256: COVERAGE.canonical_sha256, pr: COVERAGE.pr } }, 404);
    if ("ambiguous" in prev) return json({ error: "ambiguous_symbol", error_description: `name '${asset}' matches ${prev.ambiguous.length} ids; name the id`, candidates: prev.ambiguous.map((id) => ({ defillama_id: id, symbol: COVERAGE.rows[id].s, name: COVERAGE.rows[id].n, state: COVERAGE.rows[id].st })), kind: KIND }, 409);
    return json(previewBody(prev.id, prev.row));
  }

  if (!asset) {
    if (hasPaymentHeader(request)) return challenge("required query parameter 'asset' is missing");
    return json({ error: "bad_request", error_description: "required query parameter 'asset' is missing", hint: "asset = numeric DefiLlama id (or a symbol/name; collisions ask for the id)", kind: KIND, free_preview: `${resourceUrl}?asset=tether&preview=1`, catalog: `${origin}/api/x402` }, 400);
  }

  const resolved = resolve(asset);
  if (!resolved) {
    // Not a catalogue hit: challenge first (path only) — never leak the buyer's target, never 404 a
    // stranger into a dead end that an indexer would record as a broken listing.
    return challenge(`asset '${asset}' is not in this coverage record (${COVERAGE.counts.indexed} indexed ids as_of ${COVERAGE.as_of}); an id outside it cannot be answered from these bytes`);
  }
  if ("ambiguous" in resolved) {
    return challenge(`asset name '${asset}' matches ${resolved.ambiguous.length} ids — send the numeric id: ${resolved.ambiguous.join(", ")}`);
  }

  const { id, row } = resolved;

  // Free preview on the paid rail's path (listing's free_preview URL includes preview=1):
  if (isPreview && !hasPaymentHeader(request)) return json(previewBody(id, row));

  const paid = await verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar });
  if (!paid.ok) {
    return paymentRequiredResponseSigned(buildPaymentRequiredV2({
      resourceUrl,
      description: COVERAGE_EVIDENCE_DESCRIPTION,
      serviceName: "CSOAI Coverage Evidence",
      tags: ["stablecoins", "coverage", "measurement", "evidence", "x402"],
      accepts,
      bazaar,
      csoai: {
        schema: KIND,
        lid: CSOAI_LID,
        never: ["grade", "score", "certificate", "ranking"],
        deliverable: "one assembled JSON evidence row for the named asset: canonical identity, measurement state + method + measured_at (or the published reason), provenance digests (canonical version + SHA-256), and this record's honest anchor state",
        free_preview: `${resourceUrl}?asset=${id}&preview=1`,
        catalog: `${origin}/api/x402`,
      },
    }), env);
  }

  const payment = {
    settled: true,
    transaction: paid.settlement?.transaction ?? null,
    payer: paid.settlement?.payer ?? null,
    network: paid.settlement?.network ?? null,
    bazaar: paid.settlement?.bazaar ?? null,
  };
  return json(fullBody(id, row, payment), 200, paid.paymentResponse ? { "x-payment-response": paid.paymentResponse } : {});
};

// HEAD must answer exactly as GET would (same status, PAYMENT-REQUIRED on the 402,
// no body): Pages answers HEAD with 404 unless the route exports it (_head.test).
export const onRequestHead = headFromGet(onRequestGet);
