/**
 * GET /api/ras/x402-check?url=<https x402 resource> — ONE live GET of a public x402 resource,
 * scored by the rule of the daily census, returned with an Ed25519-signed receipt.
 *
 * THE RULE IS PORTED, NOT RE-INVENTED. scripts/census/x402-bazaar-conformance.py `probe()`,
 * field for field:
 *   conformant = HTTP 402 AND a PAYMENT-REQUIRED response header AND x402Version 2 in the BODY
 *                AND an extensions.bazaar object in the BODY
 *   x402_version / has_bazaar_extension / accepts come from the BODY; the header's own reading is
 *   kept beside them as header_x402_version / header_has_bazaar_extension (the census rule_note).
 *   scheme / network / amount are read from accepts[0] (body first, then header), as the census does.
 *   A response with neither a JSON body object nor a decodable header carries only
 *   {status, conformant:false}, as the census row does.
 * Differences from the census, all on the side of safety, none on the rule:
 *   - redirects are followed by hand and every hop is re-checked by functions/api/_ras_net.ts
 *     (urllib follows them silently); at most 5 hops
 *   - the body is read up to 1 MiB (the census reads it whole); `truncated` says when that bit
 *   - same 12 s timeout as the census
 * States: CONFORMANT / NOT_CONFORMANT / UNREACHABLE (status null: DNS, connect, TLS, timeout).
 * Every state is a DELIVERED result. NOT_CONFORMANT and UNREACHABLE are findings about the
 * target, and a paid check that finds them is delivered as them.
 *
 * Not: a seller's honesty, product quality, price, or whether a door delivers after payment.
 */
import { headFromGet } from "../_head";
import { x402Accepts, declareBazaarHttpGet } from "../_x402";
import { rasDoor, nowIso, type RasEnv, type RasComputation } from "../_ras_door";
import { checkUrl, checkUrlSyntax, guardedFetch, memoResolver, type Resolver, dohResolver } from "../_ras_net";
import { RAS_X402_CHECK_DESCRIPTION } from "../_x402_descriptions";

export const SCHEMA = "csoai.ras.x402-check/0.1";
export const KIND = "csoai.ras.x402-check/0.1";
export const ATTESTS = "one live GET of the named x402 resource at fetched_at, scored by the census conformance rule — a protocol-shape check, not a judgement of the seller";
export const CENSUS_RULE =
  "Conformant = HTTP 402 AND a PAYMENT-REQUIRED response header AND x402Version 2 in the body AND an extensions.bazaar block.";
export const RULE_SOURCE = "scripts/census/x402-bazaar-conformance.py probe() (schema csoai.x402-bazaar-conformance/0.2)";
export const TIMEOUT_MS = 12_000; // the census TIMEOUT
export const MAX_BYTES = 1024 * 1024;
const UA = "csoai-ras-x402-check/0.1 (census rule csoai.x402-bazaar-conformance/0.2; +https://councilof.ai)";

/** base64 → JSON the way Python's base64.b64decode(validate=False) + json.loads reads it. */
export function decodeHeaderJson(v: string): unknown {
  try {
    let s = v.replace(/[^A-Za-z0-9+/=_-]/g, "").replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
    while (s.length % 4) s += "=";
    const bin = atob(s);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** The census probe() row from one HTTP answer. Exported: the rule is tested without a network. */
export function censusRow(status: number, headers: Headers, body: Uint8Array): Record<string, unknown> {
  const row: Record<string, unknown> = { status };
  const prh = headers.get("payment-required");
  let hdr: unknown = null;
  if (prh) hdr = decodeHeaderJson(prh);
  let bod: unknown;
  try { bod = JSON.parse(new TextDecoder().decode(body) || "null"); } catch { bod = null; }
  const b = isObj(bod) ? bod : {};
  const h = isObj(hdr) ? hdr : {};
  if (!Object.keys(b).length && !Object.keys(h).length) {
    row.conformant = false;
    return row;
  }
  const accepts = (Array.isArray(b.accepts) && b.accepts.length ? b.accepts : Array.isArray(h.accepts) ? h.accepts : []) as unknown[];
  Object.assign(row, {
    payment_required_header: !!prh,
    x402_version: b.x402Version ?? null,
    has_accepts: accepts.length > 0,
    has_bazaar_extension: isObj(isObj(b.extensions) ? b.extensions.bazaar : null),
    header_x402_version: Object.keys(h).length ? (h.x402Version ?? null) : null,
    header_has_bazaar_extension: Object.keys(h).length ? isObj(isObj(h.extensions) ? h.extensions.bazaar : null) : null,
  });
  if (accepts.length && isObj(accepts[0])) {
    const a = accepts[0];
    Object.assign(row, { scheme: a.scheme ?? null, network: a.network ?? null, amount: String(a.amount || a.maxAmountRequired || "") });
  }
  row.conformant = status === 402 && row.payment_required_header === true && row.x402_version === 2 && row.has_bazaar_extension === true;
  return row;
}

export async function checkX402(target: string, baseResolver: Resolver = dohResolver): Promise<RasComputation> {
  const resolver = memoResolver(baseResolver);
  const fetched_at = nowIso();
  const pre = await checkUrl(target, resolver);
  if (pre.ok === false) {
    const status = pre.reason === "DNS_CHECK_UNAVAILABLE" ? 503 : 400;
    return { delivered: false, status, error: pre.reason === "DNS_CHECK_UNAVAILABLE" ? "dns_check_unavailable" : "url_refused", reason: `${pre.reason}: ${pre.detail}` };
  }
  const out = await guardedFetch(target, { method: "GET", headers: { "user-agent": UA }, timeoutMs: TIMEOUT_MS, maxBytes: MAX_BYTES, maxRedirects: 5, resolver });
  if (out.kind === "BLOCKED") return { delivered: false, status: 400, error: "url_refused", reason: `${out.reason}: ${out.detail}` };
  let row: Record<string, unknown>;
  let truncated = false;
  let finalUrl: string | null = null;
  if (out.kind === "RESPONSE") {
    row = censusRow(out.status, out.headers, out.body);
    truncated = out.truncated;
    finalUrl = out.final_url;
  } else {
    // The census row for DNS/TLS/timeout/refused: status None, error = the exception class.
    row = { status: null, error: out.kind === "TIMEOUT" ? "TimeoutError" : out.detail.split(":")[0] || "URLError", conformant: false };
  }
  const state = row.status === null ? "UNREACHABLE" : row.conformant ? "CONFORMANT" : "NOT_CONFORMANT";
  const payload: Record<string, unknown> = {
    kind: KIND,
    attests: ATTESTS,
    target: { url: target, host: pre.url.hostname, final_url: finalUrl },
    state,
    row,
    hops: out.hops.length,
    truncated,
    rule: CENSUS_RULE,
    rule_source: RULE_SOURCE,
    rule_note: "x402_version and has_bazaar_extension are read from the BODY; header_x402_version / header_has_bazaar_extension carry the PAYMENT-REQUIRED header's own reading.",
    paid: false,
    settled_target: false,
    elapsed_ms: "elapsed_ms" in out ? out.elapsed_ms : null,
    fetched_at,
  };
  return {
    delivered: true,
    payload,
    subject: `x402 challenge check of ${pre.url.hostname} — ${state}`,
    source_urls: [target],
    evidence: { hops: out.hops, ...(out.kind !== "RESPONSE" ? { error_detail: out.detail } : {}) },
    unmeasured: ["whether the door delivers after payment (nothing was paid)", ...(truncated ? ["body beyond 1 MiB"] : [])],
  };
}

export const onRequestGet: PagesFunction<RasEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const target = (url.searchParams.get("url") || "").trim();
  const resourceUrl = `${origin}/api/ras/x402-check`;
  const accepts = x402Accepts(env, resourceUrl, { skuId: "ras_fresh_read", tier: "per_read", description: RAS_X402_CHECK_DESCRIPTION, productId: "csoai.product.ras.x402_check" });
  const bazaar = declareBazaarHttpGet({
    method: "GET",
    queryParams: { url: target || "https://councilof.ai/api/free-door" },
    queryParamsSchema: { properties: { url: { type: "string", format: "uri", pattern: "^https://", description: "public https x402 resource URL, exactly as a buyer would GET it" } }, required: ["url"] },
    outputExample: { schema: SCHEMA, kind: "receipt", result: { kind: KIND, state: "CONFORMANT | NOT_CONFORMANT | UNREACHABLE", row: { status: 402, payment_required_header: true, x402_version: 2, has_bazaar_extension: true, conformant: true }, rule: CENSUS_RULE }, receipt: { sha256: "<hex>", sig_ed25519: "<hex or null>" } },
  });
  return rasDoor({
    request, env, schema: SCHEMA, surface: "ras.x402-check", resourceUrl,
    freePreviewPath: "/api/x402/index",
    description: RAS_X402_CHECK_DESCRIPTION,
    serviceName: "CSOAI x402 Check",
    tags: ["x402", "conformance", "bazaar", "receipt", "probe"],
    accepts, bazaar,
    deliverable: "one signed card-v0 receipt over a live GET of the named resource, scored by the daily census rule, with the census row verbatim",
    never: ["a payment to the target", "a judgement of the seller", "a grade", "a rank", "a certificate"],
    inputError: () => {
      if (!target) return { status: 400, error: "bad_request", reason: "pass url=<https x402 resource>" };
      const s = checkUrlSyntax(target);
      return s.ok === true ? null : { status: 400, error: "url_refused", reason: `${s.reason}: ${s.detail}` };
    },
    compute: () => checkX402(target),
    counter: "count:ras_x402_checks",
  });
};

export const onRequestPost = onRequestGet;

// HEAD answers as GET would, with no body and never with a payment (functions/api/_head.ts).
export const onRequestHead = headFromGet(onRequestGet);
