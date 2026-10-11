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
import { headFromGet } from "./_head";
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
import { POPULATION_DESCRIPTIONS } from "./_x402_descriptions";
import { signPayload, canonicalBytes, sha256Hex } from "../_lib/cardSign";
import { POPULATIONS, POPULATION_IDS, findPopulation, makeIo, toPreview, type Reading } from "./_population";

import { makeDeliveryManifest, deliveryReadFailure, expectedDigest, rowCommitment, EXPECTED_ROWS_HEADER } from "./_population_manifest";

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

/**
 * The one live sentence the 402 carries (csoai.reading_sentence): the population, its count, as_of
 * and state — read, never typed. SHORT by design (public audit 2026-09-28, fix #29): it used to
 * append the population sentence and two lines of boilerplate, about 450 characters repeated in
 * every challenge. Those stay one GET away, free, at ?preview=1 (title, population, the reading).
 * An entry may phrase its own count (countPhrase) so the number is still the reading's.
 */
export function describe(entry: { title: string; population: string; countPhrase?: (n: number, unit: string) => string }, r: Reading): string {
  const count =
    r.n === null
      ? `count ${r.state} (${r.reason || "no total is published"})`
      : entry.countPhrase
        ? entry.countPhrase(r.n, r.n_unit)
        : `${r.n} ${r.n_unit}`;
  const asOf = r.as_of ? `as of ${r.as_of}` : `as_of unavailable at challenge time${r.reason ? ` (${r.reason})` : ""}`;
  return `${entry.title}: ${count}; ${asOf}, state ${r.state}.`;
}

/**
 * What the CHALLENGE carries of the free reading: the counts, dates, state and caveats, never the
 * head. The head is the artifact's own sample and ran to 13 KB on claim-watch, which made that
 * 402 29.7 KB (public audit 2026-09-28, fix #29). It is free, whole, at full_reading. `source` is
 * not repeated here: csoai.free_sources carries it once.
 */
export function challengePreview(head: Omit<Reading, "rows" | "rows_unit">, resourceUrl: string) {
  return {
    state: head.state,
    n: head.n,
    n_unit: head.n_unit,
    as_of: head.as_of,
    reason: head.reason,
    unmeasured: head.unmeasured,
    full_reading: `${resourceUrl}?preview=1`,
  };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const manifestRequest = /\/manifest\/?$/.test(url.pathname) || url.searchParams.get("manifest") === "1";
  const id = populationIdFromPath(manifestRequest ? url.pathname.replace(/\/manifest\/?$/, "") : url.pathname);
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
  let expected: string | null;
  try { expected = expectedDigest(request); }
  catch (e) { return json({ schema: SCHEMA, error: "invalid_expected_digest", reason: (e as Error).message, settled: false }, 400); }
  // Read once: the head for a bare GET or a preview, the full slice when a payment is presented.
  const reading = await entry.read(io, manifestRequest || (paid && !preview));
  if (manifestRequest) {
    const failure = deliveryReadFailure(reading);
    if (failure) return json({ schema: SCHEMA, kind: "manifest_unavailable", id, state: reading.state, reason: failure, settled: false }, 503);
    const manifest = await makeDeliveryManifest(entry, reading, origin);
    return json(manifest, 200, { "x-csoai-rows-sha256": manifest.evidence.rows_sha256, "access-control-allow-headers": `content-type, ${EXPECTED_ROWS_HEADER}` });
  }
  const head = toPreview(reading);
  // The 402's description is the CANONICAL text (functions/api/x402-descriptions.json pop_<id>) — the
  // bytes the manifest, llms.txt and the Bazaar extension's catalogue entry all carry (2026-09-28).
  // The live reading (count, as_of, state) rides in csoai.reading_sentence and csoai.preview instead.
  const liveSentence = describe(entry, reading);
  const description = POPULATION_DESCRIPTIONS[entry.id] ?? liveSentence;
  const accepts = x402Accepts(env, resourceUrl, { ...SKU, description, productId: `csoai.product.population.${entry.id}` });

  // THE DISCOVERY BLOCK IS COMPUTED ONCE AND USED TWICE (the free-door pattern). The 402 advertises
  // it, and verifyX402Payment echoes the SAME object into the v2 PaymentPayload the facilitator
  // catalogs from — specs/extensions/bazaar.md: "If the extension is omitted, discovery cataloging
  // will not occur." Until 2026-10-09 this block was built inside challenge() only, so every one of
  // the ten population doors advertised a conformant extensions.bazaar and then sent a settle
  // WITHOUT it: settleable, and permanently unindexed (PayAI catalogs off /verify and /settle, never
  // off a 402 — docs.payai.network/x402/facilitators/bazaar).
  const bazaar = declareBazaarHttpGet({
    method: "GET",
    // Path-scoped: no queryParams, no queryParamsSchema. The door IS the URL.
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
  });

  const challenge = (notPaidReason: string, extra: { error?: string; csoai?: Record<string, unknown> } = {}) => {
    const pr = buildPaymentRequiredV2({
      resourceUrl,
      description,
      serviceName: "CSOAI Population Door",
      tags: entry.tags.slice(0, 5),
      accepts,
      bazaar,
      csoai: {
        schema: SCHEMA,
        per: "population-slice",
        population: entry.id,
        lid: CSOAI_LID,
        // The free reading's counts, state and caveats in the challenge BODY, so a buyer sees what the
        // slice is before paying; the head (the sample, up to 13 KB) is one free GET away at
        // full_reading. Named `preview` because encodePaymentRequiredHeader drops csoai.preview from
        // the header: the 16 KiB header limit is what costs a door its listing.
        preview: challengePreview(head, resourceUrl),
        reading_sentence: liveSentence,
        never: ["a grade", "a rank", "a verdict about any row", "a paywall on the source artifact", "a certificate"],
        deliverable: `the ${entry.title} slice: ${reading.rows_unit || "the population rows verbatim from the artifact(s) in source[]"}, plus a card-v0 attestation leaf over the reading (sha256 of the rows, signed when the Pages key is present) and the facilitator's settle record`,
        free_preview: `${resourceUrl}?preview=1`,
        free_manifest: `${resourceUrl}/manifest`,
        free_sources: head.source,
        rail: railMode(env),
        not_paid_reason: notPaidReason,
        // Every door, with its text and terms, is in the catalogue; the ten-URL all_doors list is not
        // repeated in each challenge (it stays in the free preview's `buy` block and in 404s).
        catalog: `${origin}/api/x402`,
        ...(extra.csoai || {}),
      },
    });
    return paymentRequiredResponseSigned(extra.error ? { ...pr, error: extra.error } : pr, env);
  };

  // ONE WIRING POINT for both call sites below: the unpaid challenge asks verifyX402Payment only for
  // its refusal reason, the paid path for the settle — but both must hand the facilitator the same
  // discovery block, and only a settle that carries it is catalogued.
  const attemptPayment = () => verifyX402Payment(request, env, resourceUrl, accepts[0], { bazaar });

  if (preview) {
    return json({
      schema: SCHEMA,
      kind: "preview",
      id: entry.id,
      title: entry.title,
      population: entry.population,
      ...head,
      manifest: `${resourceUrl}/manifest`,
      buy: { resource: resourceUrl, how: "GET the resource → 402 → pay accepts[] (x402) → retry with X-PAYMENT", catalog: `${origin}/api/x402`, all_doors: known.map((k) => resourceUrlFor(origin, k)) },
      rail: railMode(env),
    });
  }

  if (!paid) {
    return challenge((await attemptPayment()).reason);
  }

  // READ BEFORE SETTLE: a slice that could not be read is never charged for.
  if (deliveryReadFailure(reading)) {
    return challenge(
      `read before settle: the population read came back ${reading.state}${reading.reason ? ` (${reading.reason})` : ""}. The payment was not sent to the facilitator, so nothing was settled. Check the free preview before paying again.`,
      { error: `Population read ${reading.state} — payment not settled`, csoai: { read_before_settle: { state: reading.state, reason: reading.reason, unmeasured: reading.unmeasured, settled: false } } },
    );
  }

  // Digest pin is checked before any key or payment facilitator operation.
  const deliverableManifest = await makeDeliveryManifest(entry, reading, origin);
  const committedRows = deliverableManifest.evidence;
  if (expected !== null && expected !== committedRows.rows_sha256) {
    return json({ schema: SCHEMA, error: "population_revision_changed", expected_rows_sha256: expected, current_rows_sha256: committedRows.rows_sha256, manifest: `${resourceUrl}/manifest`, settled: false, signing_attempted: false }, 409);
  }
  const fetched_at = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const rowsBytes = canonicalBytes(reading.rows);
  const rows_sha256 = committedRows.rows_sha256;
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

  const payment = await attemptPayment();
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
      delivery_manifest: deliverableManifest,
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

// HEAD answers as GET would, with no body and never with a payment (functions/api/_head.ts).
export const onRequestHead = headFromGet(onRequestGet);
