/**
 * GET /api/pop/{population} — the population doors: one metered read-transform per measured
 * population the estate already publishes (registry: functions/api/_population.ts).
 *
 *   ?preview=1   free — state, n, as_of, source, counts and caveats, read from the artifact now.
 *   (no header)  402 — the challenge. resource.url is PATH-SCOPED (no query): PayAI lists only
 *                query-less URLs today, so /api/pop/stablecoins is the door, not ?id=.
 *   X-PAYMENT    READ BEFORE SETTLE — the full slice is read first; an UNMEASURED read answers
 *                the 402 again with the reason and settles nothing. Otherwise: the rows, a small
 *                card-v0 attestation leaf over (state, n, as_of, source, rows_sha256) signed under
 *                did:web:csoai.org#board-attestation-1 when the Pages key is present (else
 *                sig_ed25519 null with unsigned_reason), and `settle` as the facilitator reported it.
 *
 * The amount lives ONLY in the 402 (same SKU/tier as the data feed door: issuance:reserve, so the
 * promo/normal amounts and payTo are whatever the existing doors advertise — nothing is typed
 * here). No count is typed anywhere on this surface: every number is what the reader derived
 * from the artifact on this request, and a count that could not be read is null with a reason.
 *
 * What is sold: assembly — the slice, its digest and an independent signature over the reading.
 * Never: a grade, a rank, a verdict about any row, or a paywall on the artifact itself (every
 * source path is a free public file or a free endpoint, named in `source`).
 */
import {
  verifyX402Payment,
  x402Accepts,
  buildPaymentRequiredV2,
  declareBazaarHttpGet,
  paymentRequiredResponseSigned,
  hasPaymentHeader,
  CSOAI_LID,
  type X402Env,
} from "./_x402";
import { railMode } from "./_x402_config";
import { signPayload, canonicalBytes, sha256Hex } from "../_lib/cardSign";
import { POPULATIONS, POPULATION_IDS, findPopulation, makeIo, toPreview, type Reading } from "./_population";

type Env = X402Env & { BOARD_SIGN_KEY_PKCS8_B64?: string; REVENUE_KV?: KVNamespace };

export const SCHEMA = "csoai.population-door/0.1";
export const LEAF_KIND = "csoai.population.slice/0.1";
export const SKU = { skuId: "issuance", tier: "reserve" } as const;

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", ...extraHeaders },
  });

export const ID_RE = /^[a-z0-9-]+$/;

/** `/api/pop/<id>` → `<id>`; anything else is not a door. */
export function populationIdFromPath(pathname: string): string {
  const m = pathname.match(/^\/api\/pop\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]).toLowerCase() : "";
}

export const resourceUrlFor = (origin: string, id: string) => `${origin}/api/pop/${id}`;

/** The one sentence the 402 carries: the population, its as_of and its count — read, never typed. */
export function describe(entry: { title: string; population: string }, r: Reading): string {
  const count = r.n === null ? `count ${r.state} (${r.reason || "no total is published"})` : `${r.n} ${r.n_unit}`;
  const asOf = r.as_of ? `as of ${r.as_of}` : `as_of unavailable at challenge time${r.reason ? ` (${r.reason})` : ""}`;
  return `Population door: ${entry.title} — ${count}, ${asOf}, state ${r.state}. ${entry.population}. A read-transform of the estate's own published artifact, with a signed digest of the slice. Not a grade, not a rank.`;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const id = populationIdFromPath(url.pathname);
  const preview = url.searchParams.get("preview") === "1";
  const entry = id && ID_RE.test(id) ? findPopulation(id) : undefined;
  const known = [...POPULATION_IDS];

  if (!entry) {
    // Unknown population: 404 with the known ids. A presented payment never settles here.
    return json(
      { schema: SCHEMA, error: "not_found", reason: `${id || "<population>"} is not a population door. No payment was taken for a 404.`, known_ids: known, doors: known.map((k) => resourceUrlFor(origin, k)), free_preview: `${origin}/api/pop/<population>?preview=1`, catalog: `${origin}/api/x402` },
      404,
    );
  }

  const io = makeIo(request);
  const resourceUrl = resourceUrlFor(origin, entry.id);
  const paid = hasPaymentHeader(request);
  // Read once: the head for a bare GET or a preview, the full slice when a payment is presented.
  const reading = await entry.read(io, paid && !preview);
  const head = toPreview(reading);
  const description = describe(entry, reading);
  const accepts = x402Accepts(env, resourceUrl, { ...SKU, description, productId: `csoai.product.population.${entry.id}` });

  const challenge = (notPaidReason: string, extra: { error?: string; csoai?: Record<string, unknown> } = {}) => {
    const pr = buildPaymentRequiredV2({
      resourceUrl,
      description,
      serviceName: "CSOAI Population Door",
      tags: entry.tags.slice(0, 5),
      accepts,
      // Path-scoped: no queryParams, no queryParamsSchema. The door IS the URL.
      bazaar: declareBazaarHttpGet({
        method: "GET",
        outputExample: {
          schema: SCHEMA,
          kind: "slice",
          id: entry.id,
          state: head.state,
          n: head.n,
          n_unit: head.n_unit,
          as_of: head.as_of,
          source: head.source,
          rows: "<the population rows / artifact bytes, verbatim>",
          attestation: { schema: "https://councilof.ai/schema/card-v0.json", surface: "population.slice", payload: { kind: LEAF_KIND, rows_sha256: "<hex>" }, sha256: "<hex>", sig_ed25519: "<hex or null>" },
          settle: { transaction: "<0x… or null>", network: "<caip2 or null>", payer: "<0x… or null>" },
        },
      }),
      csoai: {
        schema: SCHEMA,
        per: "population-slice",
        population: entry.id,
        lid: CSOAI_LID,
        // The free reading, in the challenge BODY, so a buyer sees what the slice is before paying.
        // Named `preview` because encodePaymentRequiredHeader drops csoai.preview from the header:
        // the 16 KiB header limit is what costs a door its listing, and a reading can be large.
        preview: head,
        never: ["a grade", "a rank", "a verdict about any row", "a paywall on the source artifact", "a certificate"],
        deliverable: `the ${entry.title} slice: ${reading.rows_unit || "the population rows verbatim from the artifact(s) in source[]"}, plus a card-v0 attestation leaf over the reading (sha256 of the rows, signed when the Pages key is present) and the facilitator's settle record`,
        free_preview: `${resourceUrl}?preview=1`,
        free_sources: head.source,
        rail: railMode(env),
        not_paid_reason: notPaidReason,
        catalog: `${origin}/api/x402`,
        all_doors: known.map((k) => resourceUrlFor(origin, k)),
        ...(extra.csoai || {}),
      },
    });
    return paymentRequiredResponseSigned(extra.error ? { ...pr, error: extra.error } : pr, env);
  };

  if (preview) {
    return json({
      schema: SCHEMA,
      kind: "preview",
      id: entry.id,
      title: entry.title,
      population: entry.population,
      ...head,
      buy: { resource: resourceUrl, how: "GET the resource → 402 → pay accepts[] (x402) → retry with X-PAYMENT", catalog: `${origin}/api/x402`, all_doors: known.map((k) => resourceUrlFor(origin, k)) },
      rail: railMode(env),
    });
  }

  if (!paid) {
    return challenge((await verifyX402Payment(request, env, resourceUrl, accepts[0])).reason);
  }

  // READ BEFORE SETTLE: a slice that could not be read is never charged for.
  if (reading.state === "UNMEASURED" || reading.rows === undefined) {
    return challenge(
      `read before settle: the population read came back ${reading.state}${reading.reason ? ` (${reading.reason})` : ""}. The payment was not sent to the facilitator, so nothing was settled. Check the free preview before paying again.`,
      { error: `Population read ${reading.state} — payment not settled`, csoai: { read_before_settle: { state: reading.state, reason: reading.reason, unmeasured: reading.unmeasured, settled: false } } },
    );
  }

  const fetched_at = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const rowsBytes = canonicalBytes(reading.rows);
  const rows_sha256 = await sha256Hex(rowsBytes);
  const payload: Record<string, unknown> = {
    kind: LEAF_KIND,
    attests: "a digest of the slice as read from the named artifact(s) at fetched_at — a read, not a grade, not a rank, not a verdict about any row",
    id: entry.id,
    state: reading.state,
    n: reading.n,
    n_unit: reading.n_unit,
    as_of: reading.as_of,
    source: reading.source,
    rows_sha256,
    rows_bytes: rowsBytes.byteLength,
    rows_unit: reading.rows_unit || null,
    fetched_at,
    unmeasured: reading.unmeasured,
  };
  let leaf;
  try {
    leaf = await signPayload(payload, env.BOARD_SIGN_KEY_PKCS8_B64);
  } catch (e) {
    return json({ schema: SCHEMA, error: "uncheckable", reason: (e as Error).message, settled: false }, 500);
  }
  const attestation = {
    schema: "https://councilof.ai/schema/card-v0.json",
    surface: "population.slice",
    subject: `${entry.title} — ${reading.state}`,
    as_of: fetched_at,
    source_urls: reading.source.map((s) => (s.startsWith("/") ? `${origin}${s}` : s)),
    payload,
    ...(leaf.did ? { did: leaf.did } : { did_intended: "did:web:csoai.org#board-attestation-1" }),
    sha256: leaf.sha256,
    sig_ed25519: leaf.sig_ed25519,
    unsigned_reason: leaf.unsigned_reason,
    tags: ["eater:population-door", `population:${entry.id}`, `state:${reading.state}`, leaf.sig_ed25519 ? "signed" : "unsigned"],
    unmeasured: [...reading.unmeasured, ...(leaf.sig_ed25519 ? [] : [/absent/.test(leaf.unsigned_reason || "") ? "sig_ed25519 (no Pages key)" : "sig_ed25519 (sign failed)"])],
  };

  const payment = await verifyX402Payment(request, env, resourceUrl, accepts[0]);
  if (!payment.ok) return challenge(payment.reason);

  if (env.REVENUE_KV) {
    try {
      const n = Number((await env.REVENUE_KV.get("count:population_slices")) || "0") + 1;
      await env.REVENUE_KV.put("count:population_slices", String(n));
    } catch { /* never blocks a paid deliverable */ }
  }

  return json(
    {
      schema: SCHEMA,
      kind: "slice",
      id: entry.id,
      title: entry.title,
      population: entry.population,
      ...head,
      rows_unit: reading.rows_unit || null,
      rows: reading.rows,
      attestation,
      settle: payment.settlement || null,
      ...(payment.receipt ? { receipt: payment.receipt } : {}),
      ...(payment.receiptGap ? { receipt_gap: payment.receiptGap } : {}),
      verify: `${origin}/gspc-verify`,
    },
    200,
    {
      "x-csoai-slice-sha256": leaf.sha256,
      "x-csoai-signed": leaf.sig_ed25519 ? "true" : "false",
      ...(payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {}),
    },
  );
};

/** Gold-402's gate POSTs {}. The path selects the population; body is ignored. */
export const onRequestPost = onRequestGet;

export { POPULATIONS, POPULATION_IDS };
