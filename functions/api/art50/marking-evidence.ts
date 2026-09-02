/**
 * /api/art50/marking-evidence — the Article 50 marking-evidence pack.
 *
 * ONE QUESTION, MEASURED BY BYTES: does this generative output carry a machine-readable mark that
 * the named methods can DETECT, right now? The answer is a point-in-time measurement, signed
 * (Ed25519, did:web:csoai.org#board-attestation-1) and timestamped, beside the verbatim Article
 * 50(2) text (hash + EUR-Lex URL) and the Article 99(4) fine ceiling. It is an independently
 * signed, timestamped measurement. It is not a conformity opinion, not a guarantee, and it is
 * never described as legal evidence — a self-signed card is admissible but carries no presumption.
 *
 *   GET  ?url=<https://…>                      fetch the bytes (≤ 20 MiB), measure
 *   POST <raw bytes>                           buyer-supplied bytes (any non-JSON content-type)
 *   POST {"url"|"bytes_b64"|"manifest_b64"}    JSON form; manifest_b64 = manifest-only mode
 *
 *   &preview=1                                 FREE: the same measurement, unsigned, no card sha
 *   (no flag)                                  x402 rail: 402 challenge (price lives only there)
 *                                              → paid: signed card-v0 leaf
 *   &commissioned_by=<org>&invoice=gbp         invoice rail: signed pack now, payment
 *                                              {mode:"invoice-gbp", reference:"CSOAI-A50-<id>"} —
 *                                              the owner invoices in GBP; no price stated here.
 *
 * WORDING RULE (binding): results read "marking not detected by method <z>". Never "absent",
 * never "non-compliant"/"compliant"/"certified"/"safe". Watermarks are spoofable and strippable,
 * so the pack attests DETECTION at a time, never a guarantee about the generator.
 *
 * WHAT IS DETERMINISTIC (functions/_lib/c2pa.ts): C2PA manifest-store presence, assertion hashes,
 * the c2pa.hash.data hard binding, and the COSE_Sign1 claim signature under the leaf's own key;
 * IPTC DigitalSourceType from XMP. WHAT IS UNCHECKABLE (and why, in `gaps`): chain trust (no trust
 * list bundled), SynthID and every keyed watermark (no public key-free detector), and the
 * open-source DWT-DCT detector (public, but not implemented in this Function).
 */
import { verifyX402Payment, x402Accepts, buildPaymentRequiredV2, declareBazaarHttpGet, paymentRequiredResponse, CSOAI_LID, type X402Env } from "../_x402";
import { railMode } from "../_x402_config";
import { signPayload, cardV0 } from "../../_lib/cardSign";
import { inspectC2pa, sha256, xmpDigitalSourceType, type C2paInspection } from "../../_lib/c2pa";
import { ART50_SOURCES, ART50_DATES, art50LawBlock, art50TextSha256 } from "../../_lib/art50Law";

type Env = X402Env & { BOARD_SIGN_KEY_PKCS8_B64?: string; REVENUE_KV?: KVNamespace };

export const KIND = "csoai.art50.marking-evidence/0.1";
export const SURFACE = "art50.marking-evidence";
const SKU = "art50_marking_evidence";
const MAX_BYTES = 20 * 1024 * 1024;
const ORG_RE = /^[A-Za-z0-9][A-Za-z0-9 .,&'()_/-]{1,79}$/;

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", ...extra },
  });

const b64ToBytes = (s: string): Uint8Array => Uint8Array.from(atob(s.replace(/\s+/g, "")), (c) => c.charCodeAt(0));

// ───────────────────────────── input ─────────────────────────────
type Input = {
  bytes: Uint8Array | null;
  manifest: Uint8Array | null;
  source: "url" | "upload" | "manifest-only" | null;
  url: string | null;
  http: { status: number; content_type: string | null; content_length: number | null } | null;
  error: string | null;
};

function urlAllowed(u: URL): string | null {
  if (u.protocol !== "https:" && u.protocol !== "http:") return "url must be http(s)";
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|\[?fc|\[?fd)/.test(h)) {
    return "url must be public";
  }
  return null;
}

async function fetchAsset(raw: string): Promise<Input> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { bytes: null, manifest: null, source: null, url: raw, http: null, error: "url not parseable" };
  }
  const bad = urlAllowed(u);
  if (bad) return { bytes: null, manifest: null, source: null, url: raw, http: null, error: bad };
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20_000);
  try {
    const r = await fetch(u.toString(), { signal: ctl.signal, redirect: "follow", headers: { accept: "*/*", "user-agent": "csoai-art50-marking-evidence/0.1 (+https://councilof.ai)" } });
    const http = { status: r.status, content_type: r.headers.get("content-type"), content_length: r.headers.get("content-length") ? Number(r.headers.get("content-length")) : null };
    if (!r.ok) return { bytes: null, manifest: null, source: null, url: raw, http, error: `fetch returned HTTP ${r.status}` };
    if (http.content_length != null && http.content_length > MAX_BYTES) return { bytes: null, manifest: null, source: null, url: raw, http, error: `content-length ${http.content_length} exceeds ${MAX_BYTES} byte cap` };
    const buf = new Uint8Array(await r.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) return { bytes: null, manifest: null, source: null, url: raw, http, error: `body ${buf.byteLength} exceeds ${MAX_BYTES} byte cap` };
    if (buf.byteLength === 0) return { bytes: null, manifest: null, source: null, url: raw, http, error: "empty body" };
    return { bytes: buf, manifest: null, source: "url", url: raw, http, error: null };
  } catch (e) {
    return { bytes: null, manifest: null, source: null, url: raw, http: null, error: `fetch failed: ${(e as Error).name || e}` };
  } finally {
    clearTimeout(t);
  }
}

async function readInput(request: Request, url: URL): Promise<Input> {
  const none: Input = { bytes: null, manifest: null, source: null, url: null, http: null, error: null };
  if (request.method === "POST") {
    const ct = (request.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("application/json")) {
      let body: Record<string, unknown>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return { ...none, error: "body must be JSON" };
      }
      if (typeof body.bytes_b64 === "string" && body.bytes_b64) {
        try {
          const b = b64ToBytes(body.bytes_b64);
          if (b.byteLength > MAX_BYTES) return { ...none, error: `bytes_b64 exceeds ${MAX_BYTES} byte cap` };
          return { ...none, bytes: b, source: "upload" };
        } catch {
          return { ...none, error: "bytes_b64 not decodable" };
        }
      }
      if (typeof body.manifest_b64 === "string" && body.manifest_b64) {
        try {
          return { ...none, manifest: b64ToBytes(body.manifest_b64), source: "manifest-only" };
        } catch {
          return { ...none, error: "manifest_b64 not decodable" };
        }
      }
      if (typeof body.url === "string" && body.url) return fetchAsset(body.url);
      return { ...none, error: "JSON body needs url, bytes_b64 or manifest_b64" };
    }
    const buf = new Uint8Array(await request.arrayBuffer());
    if (buf.byteLength === 0) return { ...none, error: "empty body" };
    if (buf.byteLength > MAX_BYTES) return { ...none, error: `body exceeds ${MAX_BYTES} byte cap` };
    return { ...none, bytes: buf, source: "upload" };
  }
  const q = (url.searchParams.get("url") || "").trim();
  if (q) return fetchAsset(q);
  return none;
}

// ───────────────────────────── measurement ─────────────────────────────
type Check = { method: string; result: string; note?: string };

/** The reason codes behind every UNCHECKABLE line. Short, because they ride inside the ≤3KB leaf. */
const GAPS: Record<string, string> = {
  "c2pa.chain-trust": "no C2PA trust list bundled; the leaf verifies its own signature only (anchor with c2patool --trust separately)",
  "watermark.synthid": "no public key-free detector: SynthID text detection needs the deployer's watermark keys (github.com/google-deepmind/synthid-text); image/audio/video detection is Google-hosted, not public",
  "watermark.keyed": "detectors published (Meta Stable Signature / Video Seal, github.com/facebookresearch/videoseal) but keyed to the deployer's private key; Digimarc/IMATAG proprietary",
  "watermark.dwtdct": "public detector exists (ShieldMnt/invisible-watermark, the Stable Diffusion 'SDV2' DWT-DCT mark) but is not implemented in this Function",
  "text.watermark": "no public detector for statistical text watermarks without the deployer's keys",
};

export type Measurement = {
  subject: { sha256: string | null; bytes: number | null; container: string; source: Input["source"]; url: string | null };
  checked: Check[];
  unmeasured: string[];
  gaps: Record<string, string>;
  statements: string[];
  detail: C2paInspection | null;
};

export async function measure(input: Input): Promise<Measurement> {
  const asset = input.bytes;
  const c2 = asset || input.manifest ? await inspectC2pa(asset, input.manifest ?? undefined) : null;
  const dst = asset ? xmpDigitalSourceType(asset) : null;
  const checked: Check[] = [];
  const unmeasured: string[] = [];
  const gaps: Record<string, string> = {};
  const statements: string[] = [];
  const gap = (k: string, why = GAPS[k]) => {
    unmeasured.push(k);
    gaps[k] = why;
  };

  if (c2) {
    const present = c2.manifest_store_present;
    checked.push({ method: "c2pa.manifest-store", result: present ? "DETECTED" : "NOT_DETECTED", ...(present ? { note: `${c2.manifest_count} manifest(s); active ${c2.active_manifest_label ?? "?"}; generator ${c2.claim?.claim_generator ?? "?"}` } : {}) });
    statements.push(present ? "marking detected by method c2pa.manifest-store" : "marking not detected by method c2pa.manifest-store");
    if (present) {
      checked.push({ method: "c2pa.assertion-hashes", result: c2.assertion_hashes.status, ...(c2.assertion_hashes.reason ? { note: c2.assertion_hashes.reason } : { note: `${c2.assertion_hashes.checked} recomputed` }) });
      checked.push({ method: "c2pa.hard-binding", result: c2.data_hash.status, ...(c2.data_hash.reason ? { note: c2.data_hash.reason } : { note: `${c2.data_hash.binding} ${c2.data_hash.alg ?? ""} ${c2.data_hash.exclusions} exclusion(s)`.trim() }) });
      checked.push({ method: "c2pa.claim-signature", result: c2.signature.status, note: c2.signature.reason ?? `${c2.signature.cose_alg} by leaf ${c2.signature.leaf_cn ?? "?"}; chain ${c2.signature.chain_length ?? "?"}; timestamp ${c2.signature.timestamp ?? "?"}` });
      statements.push(`claim signature ${c2.signature.status}; hard binding ${c2.data_hash.status}; chain trust UNCHECKABLE`);
      if (c2.data_hash.status === "UNCHECKABLE") gap("c2pa.hard-binding", c2.data_hash.reason || "not recomputable");
    }
    gap("c2pa.chain-trust");
  } else {
    gap("c2pa.manifest-store", "no bytes or manifest supplied");
  }

  if (asset) {
    checked.push({ method: "iptc.digitalSourceType", result: dst ? "DETECTED" : "NOT_DETECTED", ...(dst ? { note: dst } : {}) });
    statements.push(dst ? `marking detected by method iptc.digitalSourceType (${dst})` : "marking not detected by method iptc.digitalSourceType");
  } else {
    gap("iptc.digitalSourceType", "asset bytes not supplied");
  }

  for (const k of ["watermark.synthid", "watermark.keyed", "watermark.dwtdct", "text.watermark"]) gap(k);
  statements.push("watermarks UNCHECKABLE by this Function (see gaps): a mark not detected here may still exist, and a mark detected here can be forged — detection at a time, not a guarantee");

  return {
    subject: {
      sha256: asset ? await sha256(asset) : input.manifest ? await sha256(input.manifest) : null,
      bytes: asset ? asset.byteLength : input.manifest ? input.manifest.byteLength : null,
      container: c2?.container ?? "unknown",
      source: input.source,
      url: input.url,
    },
    checked,
    unmeasured,
    gaps,
    statements,
    detail: c2,
  };
}

/** The signed leaf body. Kept far under 3072 bytes: statements + short notes, never the verbatim prose. */
async function leafPayload(m: Measurement, fetched_at: string, payment: Record<string, unknown> | null): Promise<Record<string, unknown>> {
  return {
    kind: KIND,
    attests: "point-in-time detection of a machine-readable mark by the methods listed in checked[]; independently signed, timestamped measurement — not a conformity opinion, not a guarantee",
    subject: { sha256: m.subject.sha256, bytes: m.subject.bytes, container: m.subject.container, source: m.subject.source },
    fetched_at,
    checked: m.checked.map((c) => (c.note ? { method: c.method, result: c.result, note: c.note.slice(0, 120) } : { method: c.method, result: c.result })),
    statements: m.statements.slice(0, 4).map((s) => s.slice(0, 200)),
    gaps: Object.fromEntries(Object.entries(m.gaps).map(([k, v]) => [k, v.slice(0, 150)])),
    law: {
      article: "Art 50(2) Reg (EU) 2024/1689",
      text_sha256: await art50TextSha256(),
      url: ART50_SOURCES.eur_lex,
      applies_from: ART50_DATES.applies_from,
      pre_existing_until: ART50_DATES.pre_existing_systems_until,
      fine_ceiling: "Art 99(4)(g): up to EUR 15,000,000 or 3% worldwide annual turnover, whichever higher",
    },
    ...(payment ? { payment } : {}),
    lid: CSOAI_LID,
  };
}

async function invoiceReference(org: string, subjectSha: string | null, fetched_at: string): Promise<string> {
  const h = await sha256(new TextEncoder().encode(`${org}|${subjectSha ?? "-"}|${fetched_at}`));
  return `CSOAI-A50-${h.slice(0, 10).toUpperCase()}`;
}

// ───────────────────────────── handler ─────────────────────────────
const handle: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const resourceUrl = new URL("/api/art50/marking-evidence", origin).toString();
  const preview = url.searchParams.get("preview") === "1";
  const invoice = url.searchParams.get("invoice") === "gbp";
  const org = (url.searchParams.get("commissioned_by") || "").trim();
  if (invoice && !ORG_RE.test(org)) {
    return json({ schema: KIND, error: "bad_request", reason: "invoice=gbp needs commissioned_by=<organisation> (2–80 chars of letters, digits, space . , & ' ( ) _ / -)" }, 400);
  }

  const input = await readInput(request, url);
  if (input.error) return json({ schema: KIND, error: "uncheckable", reason: input.error, url: input.url, http: input.http }, input.error.includes("cap") ? 413 : 400);
  const fetched_at = new Date().toISOString();
  const m = input.source ? await measure(input) : null;
  const law = await art50LawBlock();
  const description =
    "Article 50 marking evidence: one signed card-v0 leaf recording whether a machine-readable mark was DETECTED in one output by named methods at one time (C2PA recomputed; watermarks UNCHECKABLE where no public detector exists). Beside it, the verbatim Art 50(2) text hash and the Art 99(4) ceiling. Detection at a time, never a conformity opinion. " +
    CSOAI_LID +
    ".";

  // FREE preview — the full measurement, unsigned. Nothing withheld but the signature.
  if (preview) {
    return json({
      schema: KIND,
      mode: "preview",
      signed: false,
      fetched_at,
      measurement: m,
      law,
      how_to_commission: {
        x402: `${resourceUrl} (same request without preview=1 — the 402 carries the price)`,
        invoice_gbp: `${resourceUrl}?commissioned_by=<organisation>&invoice=gbp`,
      },
      note: "Preview: same measurement, no signature, no card. Marking results are stated as detected / not detected by the named method at fetched_at.",
    });
  }

  let payment: Record<string, unknown> | null = null;
  let paymentResponseHeader: string | undefined;
  if (invoice) {
    const reference = await invoiceReference(org, m?.subject.sha256 ?? null, fetched_at);
    payment = { mode: "invoice-gbp", reference, commissioned_by: org, currency: "GBP" };
  } else {
    const accepts = x402Accepts(env, resourceUrl, { skuId: SKU, tier: "pack", description });
    const paid = await verifyX402Payment(request, env, resourceUrl, accepts[0]);
    if (!paid.ok) {
      const paymentRequired = buildPaymentRequiredV2({
        resourceUrl,
        description,
        serviceName: "CSOAI Article 50 marking evidence",
        tags: ["article-50", "c2pa", "marking", "measurement", "x402"],
        accepts,
        bazaar: declareBazaarHttpGet({
          method: "GET",
          queryParams: { url: input.url || "https://example.org/output.jpg" },
          queryParamsSchema: {
            properties: {
              url: { type: "string", description: "Public URL of the generative output to measure (≤ 20 MiB); or POST the bytes" },
              preview: { type: "string", description: "1 = free unsigned measurement" },
            },
            required: ["url"],
          },
          outputExample: {
            schema: "https://councilof.ai/schema/card-v0.json",
            surface: SURFACE,
            payload: { kind: KIND, checked: [{ method: "c2pa.manifest-store", result: "NOT_DETECTED" }], statements: ["marking not detected by method c2pa.manifest-store"] },
            sig_ed25519: "<hex or null>",
            unmeasured: ["root_inclusion", "watermark.synthid"],
          },
        }),
        csoai: {
          schema: KIND,
          per: "pack (1 output × 1 point in time)",
          lid: CSOAI_LID,
          never: ["conformity opinion", "guarantee", "certificate", "grade"],
          deliverable: "one card-v0 leaf, surface art50.marking-evidence, ≤3KB payload, Ed25519-signed when the Pages key is present",
          preview: m,
          free_preview: `${resourceUrl}?preview=1&url=…`,
          invoice_gbp: `${resourceUrl}?commissioned_by=<organisation>&invoice=gbp`,
          rail: railMode(env),
          not_paid_reason: paid.reason,
          catalog: `${origin}/api/x402`,
        },
      });
      return paymentRequiredResponse(paymentRequired);
    }
    payment = { mode: "x402", network: paid.settlement?.network || null, transaction: paid.settlement?.transaction || null, payer: paid.settlement?.payer || null };
    paymentResponseHeader = paid.paymentResponse;
  }

  if (!m) return json({ schema: KIND, error: "bad_request", reason: "supply url=<https://…> or POST the bytes / a manifest to measure" }, 400);

  const payload = await leafPayload(m, fetched_at, payment);
  let leaf;
  try {
    leaf = await signPayload(payload, env.BOARD_SIGN_KEY_PKCS8_B64);
  } catch (e) {
    return json({ schema: KIND, error: "uncheckable", reason: (e as Error).message }, 500);
  }
  const tx = payment.transaction as string | null | undefined;
  const card = cardV0({
    surface: SURFACE,
    subject: m.subject.sha256 ? `sha256:${m.subject.sha256}` : (m.subject.url ?? "unknown"),
    as_of: fetched_at,
    source_urls: [resourceUrl, ...(m.subject.url ? [m.subject.url] : []), ART50_SOURCES.eur_lex, ...(tx ? [`https://basescan.org/tx/${tx}`] : [])],
    payload,
    leaf,
    tags: [`rail:${payment.mode}`, `sku:${SKU}`, "article-50"],
    unmeasured: m.unmeasured,
  });

  if (env.REVENUE_KV) {
    try {
      const n = Number((await env.REVENUE_KV.get("count:issuances")) || "0") + 1;
      await env.REVENUE_KV.put("count:issuances", String(n));
      await env.REVENUE_KV.put(`art50:${leaf.sha256}`, JSON.stringify({ subject: m.subject.sha256, payment, as_of: fetched_at }));
    } catch {
      /* a tally failure never blocks a deliverable */
    }
  }

  return json(
    {
      schema: KIND,
      mode: payment.mode,
      card,
      law,
      detail: m.detail,
      signed: !!leaf.sig_ed25519,
      unsigned_reason: leaf.sig_ed25519 ? null : leaf.unsigned_reason?.startsWith("BOARD_SIGN_KEY") ? "no signing key bound in the Pages env (BOARD_SIGN_KEY_PKCS8_B64); the leaf is issued unsigned and says so in unmeasured[]" : leaf.unsigned_reason,
      bytes: leaf.bytes,
      payment,
      ...(payment.mode === "invoice-gbp"
        ? { invoice: { issuer: "CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE", currency: "GBP", reference: payment.reference, amount: null, amount_note: "stated on the owner-issued invoice, never by this Function" } }
        : {}),
      verify: `${origin}/gspc-verify`,
      note: "Independently signed, timestamped measurement of mark detection at fetched_at. Not a conformity opinion, not a guarantee, not a certificate. Root inclusion follows the public-root workflow.",
    },
    200,
    paymentResponseHeader ? { "x-payment-response": paymentResponseHeader } : {},
  );
};

export const onRequestGet = handle;
export const onRequestPost = handle;
