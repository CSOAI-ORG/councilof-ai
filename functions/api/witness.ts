/**
 * /api/witness — "attest what you're shown": existence of a SHA-256 digest at a time, sold to
 * machines over the existing x402 rail. Hash-only, never the content.
 *
 *   GET  ?sha256=<64hex>[&label=][&url=]   buyer names a digest — or a public URL we fetch ONCE
 *                                          (own UA, robots.txt honoured, never through a login,
 *                                          paywall or bot check → UNCHECKABLE) and hash server-side.
 *   POST <bytes ≤4 MiB>[?label=]           buyer-supplied bytes: hashed in the Function, then
 *                                          dropped. Nothing is stored, nothing republished. The
 *                                          access decision stays with the buyer.
 *
 *   no X-PAYMENT   → 402 challenge (the amount lives ONLY here) + a free preview of exactly what
 *                    will happen: the digest, the fetch outcome, the TSA, the anchors, the words.
 *   X-PAYMENT      → facilitator-settled → an RFC-3161 timestamp is requested over the digest
 *                    (public TSA; UNCHECKABLE with reason if it fails) → the entry is queued in
 *                    Cloudflare KV `WITNESS_KV` for the hourly public-root writer
 *                    (scripts/adapters/witness_queue.py) → 200 {status:"queued"}.
 *   WITNESS_KV not bound → 503 {"status":"NOT_YET"} BEFORE any settlement: no payment is taken
 *                    for a queue that does not exist.
 *   already queued / witnessed → 200 with the current state; no second charge.
 *
 * Doctrine: existence only, never certification; verify free (/api/witness/status, /api/proof,
 * root.json, Rekor, OTS); no prices in prose; a self-signed card carries no legal presumption.
 */
import {
  verifyX402Payment,
  x402Accepts,
  buildPaymentRequiredV2,
  declareBazaarHttpGet,
  paymentRequiredResponse,
  CSOAI_LID,
  type X402Env,
} from "./_x402";
import { railMode } from "./_x402_config";
import { sha256Hex } from "../_lib/cardSign";
import {
  ATTESTS,
  DEFAULT_TSA,
  ENTRY_SCHEMA,
  LABEL_RE,
  LEAF_KIND,
  MAX_POST_BYTES,
  PRESUMPTION,
  SHA_RE,
  UA,
  VERDICT_RE,
  WITNESS_SCHEMA,
  fetchOnce,
  guardTarget,
  json,
  kvKey,
  nowIso,
  publicView,
  requestTimestamp,
  type FetchOutcome,
  type WitnessEntry,
} from "./_witness";

type Env = X402Env & { WITNESS_KV?: KVNamespace; RFC3161_TSA_URL?: string };

const NEVER = [
  "storage or republication of the bytes",
  "a statement about what the bytes mean, whether they are lawful, or where they came from",
  "a certificate",
  "a legal presumption",
  "a bypass of any login, paywall, robots.txt or bot check",
];

async function handle(request: Request, env: Env, body: Uint8Array | null): Promise<Response> {
  const url = new URL(request.url);
  const origin = url.origin;
  const resourceUrl = `${origin}/api/witness`;
  const statusUrl = (sha: string) => `${origin}/api/witness/status?sha256=${sha}`;
  const label = (url.searchParams.get("label") || "").trim();
  const target = (url.searchParams.get("url") || "").trim();
  const supplied = (url.searchParams.get("sha256") || "").trim().toLowerCase();
  const bad = (reason: string, status = 400) => json({ schema: WITNESS_SCHEMA, error: status === 413 ? "too_large" : "bad_request", reason, usage: { get: `${resourceUrl}?sha256=<64hex>[&label=][&url=https://...]`, post: `${resourceUrl}[?label=]  (raw bytes ≤ ${MAX_POST_BYTES} B; hashed then dropped)` } }, status);

  if (!LABEL_RE.test(label)) return bad("label: ≤120 chars of [A-Za-z0-9 ._:/@+#()-]");
  if (label && VERDICT_RE.test(label)) return bad("label: carries a verdict word; a witnessed digest never carries a verdict");
  if (supplied && !SHA_RE.test(supplied)) return bad("sha256: 64 lowercase hex chars");

  // Resolve the digest: POST bytes (hashed, dropped) / a URL fetched once / a named digest.
  let sha256: string;
  let fetched: FetchOutcome | null = null;
  let targetUrl: URL | null = null;
  if (body) {
    if (target) return bad("POST hashes the body; pass url= on GET instead");
    if (body.byteLength === 0) return bad("empty body: nothing to hash");
    if (body.byteLength > MAX_POST_BYTES) return bad(`body ${body.byteLength} B > ${MAX_POST_BYTES} B cap`, 413);
    sha256 = await sha256Hex(body);
    body = null; // the bytes leave scope here; only the digest survives
  } else if (target) {
    const g = guardTarget(target);
    if (!g.ok) return bad(g.reason);
    targetUrl = g.url;
    fetched = await fetchOnce(targetUrl);
    if (fetched.status !== "HASHED" || !fetched.sha256) {
      // Fail closed BEFORE payment: an unfetchable resource is never charged for.
      return json(
        { schema: WITNESS_SCHEMA, status: "UNCHECKABLE", reason: fetched.reason, url_hash: await sha256Hex(new TextEncoder().encode(targetUrl.toString())), http_status: fetched.http_status, robots: fetched.robots, fetched_at: fetched.fetched_at, note: "Not fetched past an access wall or a robots.txt Disallow. Supply the bytes yourself (POST) if you hold them — the access decision is yours." },
        422,
      );
    }
    sha256 = fetched.sha256;
  } else if (supplied) {
    sha256 = supplied;
  } else {
    return bad("pass sha256=<64hex>, or url=https://..., or POST the bytes");
  }
  const suppliedMatches = fetched && supplied ? supplied === sha256 : null;
  const urlHash = targetUrl ? await sha256Hex(new TextEncoder().encode(targetUrl.toString())) : null;

  // Dedupe: an entry already queued or witnessed is returned as-is — never charged twice.
  const kv = env.WITNESS_KV;
  if (kv) {
    let existing: WitnessEntry | null = null;
    try {
      existing = (await kv.get(kvKey(sha256), "json")) as WitnessEntry | null;
    } catch {
      existing = null;
    }
    if (existing && existing.schema === ENTRY_SCHEMA) {
      return json({ schema: WITNESS_SCHEMA, status: existing.status, already: true, ...publicView(existing), status_url: statusUrl(sha256), note: "This digest is already on the rail; nothing was charged." });
    }
  }

  const tsa = (env.RFC3161_TSA_URL || DEFAULT_TSA).trim();
  const description =
    "Witness a SHA-256 digest: one public.notice leaf (csoai.witness.hash/0.1) in the next hourly public root, " +
    "signed under did:web:csoai.org#board-attestation-1, plus an RFC-3161 timestamp over the digest and the root's " +
    "Rekor + OpenTimestamps anchors. Existence of the digest only — never its content. " + CSOAI_LID + ".";
  const accepts = x402Accepts(env, resourceUrl, { skuId: "witness_hash", tier: "per_digest", description });
  const preview = {
    sha256,
    label: label || null,
    supplied_sha256_matches: suppliedMatches,
    target: fetched
      ? { url_hash: urlHash, http_status: fetched.http_status, bytes: fetched.bytes, headers: fetched.headers, redirected: fetched.redirected, robots: fetched.robots, fetched_at: fetched.fetched_at, user_agent: UA }
      : null,
    what_happens: [
      "settle the challenge below (x402, USDC on Base) — the only money move",
      `request an RFC-3161 timestamp over this digest from ${tsa} (UNCHECKABLE with reason if the TSA fails; the leaf still queues)`,
      "queue {sha256, label, url_hash?, fetched_at, http_status?, payment_ref, rfc3161} — never the bytes, never the URL in public",
      "the hourly public-root writer folds ONE public.notice leaf into root.json and signs it (did:web:csoai.org#board-attestation-1)",
      "the ONE root is anchored in Rekor and OpenTimestamps; /api/witness/status shows the leaf, the proof path and the anchors",
    ],
    leaf: { kind: LEAF_KIND, surface: "public.notice", attests: ATTESTS, cap_bytes: 3072 },
    presumption: PRESUMPTION,
    free_status: statusUrl(sha256),
    free_verify: `${origin}/api/proof?sha=<card sha256 from status>`,
    free_root: `${origin}/root.json`,
    free_anchors: `${origin}/interop/root-witness-latest.json`,
  };

  const hasPaymentHeader = !!(request.headers.get("x-payment") || request.headers.get("payment-signature"));
  if (hasPaymentHeader && !kv) {
    // The queue does not exist: refuse before settlement so nothing is charged.
    return json({ schema: WITNESS_SCHEMA, status: "NOT_YET", reason: "WITNESS_KV not bound", note: "No payment was taken. Bind the KV namespace on Pages (wrangler.jsonc kv_namespaces → WITNESS_KV) to open the queue.", preview }, 503);
  }
  const payment = hasPaymentHeader ? await verifyX402Payment(request, env, resourceUrl, accepts[0]) : { ok: false, reason: "no x-payment header" as string };

  if (!payment.ok) {
    const paymentRequired = buildPaymentRequiredV2({
      resourceUrl,
      description,
      serviceName: "CSOAI Witness Hash",
      tags: ["witness", "sha256", "rfc3161", "attestation", "x402"],
      accepts,
      bazaar: declareBazaarHttpGet({
        method: "GET",
        // Discovery examples only — never the caller's URL (it stays with the buyer's record).
        queryParams: { sha256: "<64-hex>", label: "<text>", url: "https://<public-url>" },
        queryParamsSchema: {
          properties: {
            sha256: { type: "string", description: "SHA-256 hex of the bytes to witness (or omit and pass url=)" },
            label: { type: "string", description: "Optional free label (≤120 chars, no verdict words); appears on the leaf" },
            url: { type: "string", description: "Optional public https URL; fetched once with our UA, robots honoured, hashed, never stored" },
          },
        },
        outputExample: { schema: WITNESS_SCHEMA, status: "queued", sha256: "<64hex>", rfc3161: { tsa, status: "TIMESTAMPED" }, status_url: statusUrl("<64hex>") },
      }),
      csoai: {
        schema: WITNESS_SCHEMA,
        per: "digest",
        lid: CSOAI_LID,
        never: NEVER,
        deliverable: "one public.notice leaf (csoai.witness.hash/0.1) in the next hourly signed root + an RFC-3161 timestamp over the digest + the root's Rekor/OTS anchors",
        preview,
        rail: railMode(env),
        not_paid_reason: payment.reason,
        catalog: `${origin}/api/x402`,
        explainer: `${origin}/pricing-free`,
      },
    });
    return paymentRequiredResponse(paymentRequired);
  }

  // Paid: timestamp, then queue. The TSA failing never voids the leaf — it is declared.
  const ts = await requestTimestamp(tsa, sha256);
  const queued_at = nowIso();
  const entry: WitnessEntry = {
    schema: ENTRY_SCHEMA,
    sha256,
    label,
    url: targetUrl ? targetUrl.toString() : null,
    url_hash: urlHash,
    fetched_at: fetched ? fetched.fetched_at : queued_at,
    http_status: fetched ? fetched.http_status : null,
    headers: fetched ? fetched.headers : null,
    payment_ref: payment.settlement?.transaction || `settled@${queued_at}`,
    payer: payment.settlement?.payer || null,
    network: payment.settlement?.network || null,
    rfc3161_tsa: ts.tsa,
    rfc3161_status: ts.status,
    rfc3161_reason: ts.reason,
    rfc3161_token: ts.token_b64,
    rfc3161_token_sha256: ts.token_sha256,
    status: "queued",
    queued_at,
    witnessed: null,
  };
  try {
    await kv!.put(kvKey(sha256), JSON.stringify(entry));
  } catch (e) {
    // Settled but not queued: say so plainly with the settle ref so the owner can reconcile.
    return json({ schema: WITNESS_SCHEMA, status: "UNCHECKABLE", reason: `queue write failed: ${(e as Error).message}`, payment_ref: entry.payment_ref, sha256, rfc3161: publicView(entry).rfc3161 }, 500, payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {});
  }
  return json(
    { schema: WITNESS_SCHEMA, ...publicView(entry), status_url: statusUrl(sha256), next_root: "hourly (public-root workflow); status flips to witnessed with the root as_of, merkle root, card sha256 and proof path", presumption: PRESUMPTION, never: NEVER },
    200,
    payment.paymentResponse ? { "x-payment-response": payment.paymentResponse } : {},
  );
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => handle(request, env, null);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_POST_BYTES) return json({ schema: WITNESS_SCHEMA, error: "too_large", reason: `content-length ${declared} > ${MAX_POST_BYTES} B cap` }, 413);
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await request.arrayBuffer());
  } catch (e) {
    return json({ schema: WITNESS_SCHEMA, error: "bad_request", reason: `body unreadable: ${(e as Error).name || "error"}` }, 400);
  }
  return handle(request, env, bytes);
};
