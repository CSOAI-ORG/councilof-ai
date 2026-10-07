/**
 * /api/art50/marking-evidence — the Article 50 marking-evidence pack.
 *
 * ONE QUESTION, MEASURED BY BYTES: does this generative output carry a machine-readable mark that
 * the named methods can DETECT, right now? The answer is a point-in-time measurement, signed
 * (Ed25519, did:web:csoai.org#board-attestation-1) and timestamped, beside the verbatim Article
 * 50(2) text (hash + EUR-Lex URL) and the dates it turns on, each with its verbatim basis (no fine
 * ceiling since 2026-09-30 — see functions/_lib/art50Law.ts). It is an independently
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
 *   &commissioned_by=<org>&invoice=gbp         invoice rail: the free measurement, unsigned, plus a
 *                                              reference "CSOAI-A50-<id>" recorded in REVENUE_KV
 *                                              (art50-invoice:<ref>, counted as invoice_requested).
 *                                              The owner invoices in GBP; no price stated here. The
 *                                              SIGNED pack is released only after the owner marks
 *                                              the reference paid (REVENUE_KV art50-invoice-paid:<ref>)
 *                                              and the buyer repeats the same request.
 *
 * INVOICE = A QUOTATION UNTIL PAID (7 Oct 2026, sell organ SG-04 + M1). Until this date invoice=gbp
 * signed and returned the pack at once and counted it as an issuance, so any caller could get a
 * signed pack by typing any organisation name, and nothing ever raised the invoice. It now follows
 * the evidence-bundle rule: a reference and the free measurement, never the signed pack, until the
 * owner marks the reference paid. The reference names one organisation and one output's bytes, so
 * the same request asked again finds the same reference and, once marked paid, its pack.
 *
 * SCOPE, IN EVERY PACK (owner-approved, 7 Oct 2026; functions/_lib/art50Scope.ts): the pack detects C2PA
 * and IPTC metadata only; NOT_DETECTED does not mean "unmarked", because Article 50(2) is
 * technology-neutral; and CSOAI is a C2PA member. The preview, the 402 and the delivered pack carry
 * `scope`, and the signed leaf carries its short form.
 *
 * SCOPE, IN EVERY PACK (owner-approved, 7 Oct 2026; functions/_lib/art50Scope.ts): the pack detects C2PA
 * and IPTC metadata only; NOT_DETECTED does not mean "unmarked", because Article 50(2) is
 * technology-neutral; and CSOAI is a C2PA member. The preview, the 402 and the delivered pack carry
 * `scope`, and the signed leaf carries its short form.
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
import { headFromGet } from "../_head";
import { verifyX402Payment, x402Accepts, buildPaymentRequiredV2, declareBazaarHttpGet, paymentRequiredResponseSigned, hasPaymentHeader, CSOAI_LID, type X402Env } from "../_x402";
import { railMode } from "../_x402_config";
import { signPayload, cardV0, canonicalBytes, PAYLOAD_CAP_BYTES } from "../../_lib/cardSign";
import { inspectC2pa, sha256, xmpDigitalSourceType, type C2paInspection } from "../../_lib/c2pa";
import { ART50_SOURCES, ART50_DATES, art50LawBlock, art50TextSha256 } from "../../_lib/art50Law";
import { invoiceHandoff, INVOICE_CONTACT } from "../_invoice_handoff";
import { ART50_MARKING_EVIDENCE_DESCRIPTION } from "../_x402_descriptions";
import { ART50_SCOPE, ART50_SCOPE_SIGNED } from "../../_lib/art50Scope";

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
          if (b.byteLength === 0) return { ...none, error: "bytes_b64 decodes to an empty body" };
          if (b.byteLength > MAX_BYTES) return { ...none, error: `bytes_b64 exceeds ${MAX_BYTES} byte cap` };
          return { ...none, bytes: b, source: "upload" };
        } catch {
          return { ...none, error: "bytes_b64 not decodable" };
        }
      }
      if (typeof body.manifest_b64 === "string" && body.manifest_b64) {
        try {
          const manifest = b64ToBytes(body.manifest_b64);
          if (manifest.byteLength === 0) return { ...none, error: "manifest_b64 decodes to an empty body" };
          if (manifest.byteLength > MAX_BYTES) return { ...none, error: `manifest_b64 exceeds ${MAX_BYTES} byte cap` };
          return { ...none, manifest, source: "manifest-only" };
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

/**
 * HOW SHORT THE SIGNED LEAF'S FREE TEXT IS, BY LEVEL (7 Oct 2026). Level 0 is the historical shape.
 * signPayload refuses a payload over PAYLOAD_CAP_BYTES, and on the x402 rail it runs AFTER the
 * facilitator has settled — so a leaf that does not fit used to mean a buyer charged and handed a
 * bare 500 (measured on the pod: a re-saved AI JPEG with IPTC DETECTED and the C2PA notes at 120
 * characters came to 3,254 bytes). fitLeafPayload walks these levels until the leaf fits, and the
 * handler runs it BEFORE settlement with the widest payment block a settle can add. Only free text
 * shortens: every method, result, statement, gap code, the scope and the law block stay. The full
 * text rides in the response's `measurement` whenever a level above 0 was used.
 */
export const LEAF_TRIM_LEVELS = [
  { note: 120, statement: 200, gap: 150 },
  { note: 60, statement: 160, gap: 80 },
  { note: 0, statement: 120, gap: 40 },
  { note: 0, statement: 80, gap: 0 },
] as const;

/**
 * The widest payment block a settlement can put in the leaf, for the pre-settlement fit: an EVM
 * transaction hash is 66 characters and a Solana signature at most 88; payers are 42 or 44. Each
 * field here is longer than any of those, so a leaf that fits with this block fits with the real one.
 */
export const PAYMENT_BLOCK_WORST_CASE: Record<string, unknown> = {
  mode: "x402",
  network: "n".repeat(64),
  transaction: "t".repeat(132),
  payer: "p".repeat(132),
};

/** The signed leaf body at a trim level, the smallest level that fits the cap, or null when none does. */
export async function fitLeafPayload(
  m: Measurement,
  fetched_at: string,
  payment: Record<string, unknown> | null,
  cap: number = PAYLOAD_CAP_BYTES,
): Promise<{ payload: Record<string, unknown>; level: number; bytes: number } | null> {
  for (let level = 0; level < LEAF_TRIM_LEVELS.length; level++) {
    const payload = await leafPayload(m, fetched_at, payment, level);
    const bytes = canonicalBytes(payload).byteLength;
    if (bytes <= cap) return { payload, level, bytes };
  }
  return null;
}

/** The signed leaf body. Kept under 3072 bytes by fitLeafPayload: statements + short notes, never the verbatim prose. */
async function leafPayload(m: Measurement, fetched_at: string, payment: Record<string, unknown> | null, level = 0): Promise<Record<string, unknown>> {
  const t = LEAF_TRIM_LEVELS[level];
  return {
    kind: KIND,
    attests: "point-in-time detection of a machine-readable mark by the methods listed in checked[]; independently signed, timestamped measurement — not a conformity opinion, not a guarantee",
    subject: { sha256: m.subject.sha256, bytes: m.subject.bytes, container: m.subject.container, source: m.subject.source },
    fetched_at,
    checked: m.checked.map((c) => (c.note && t.note > 0 ? { method: c.method, result: c.result, note: c.note.slice(0, t.note) } : { method: c.method, result: c.result })),
    statements: m.statements.slice(0, 4).map((s) => s.slice(0, t.statement)),
    scope: ART50_SCOPE_SIGNED,
    gaps: Object.fromEntries(Object.entries(m.gaps).map(([k, v]) => [k, v.slice(0, t.gap)])),
    ...(level > 0 ? { trim_level: level } : {}),
    law: {
      article: "Art 50(2) Reg (EU) 2024/1689",
      text_sha256: await art50TextSha256(),
      url: ART50_SOURCES.eur_lex,
      applies_from: ART50_DATES.applies_from,
      pre_existing_until: ART50_DATES.pre_existing_systems_until,
      pre_existing_basis: "Art 111(4) Reg (EU) 2024/1689, added by Reg (EU) 2026/1744 Art 1(39)(b)",
    },
    ...(payment ? { payment } : {}),
    lid: CSOAI_LID,
  };
}

/**
 * The invoice reference names ONE organisation and ONE output's bytes: sha256(organisation, lower-
 * cased | subject sha256). Stable on purpose (7 Oct 2026): asking again for the same bytes returns
 * the same reference, so the owner's paid mark is found when the buyer comes back. It used to fold
 * in fetched_at, so every request got a new reference and no payment could ever be matched to one.
 */
export async function invoiceReference(org: string, subjectSha: string | null): Promise<string> {
  const h = await sha256(new TextEncoder().encode(`${org.trim().toLowerCase()}|${subjectSha ?? "-"}`));
  return `CSOAI-A50-${h.slice(0, 10).toUpperCase()}`;
}

/** REVENUE_KV keys of the invoice rail. Nothing but the owner writes the paid mark. */
export const INVOICE_REQUEST_PREFIX = "art50-invoice:";
export const INVOICE_PAID_PREFIX = "art50-invoice-paid:";
export const INVOICE_REQUESTED_COUNTER = "count:invoice_requested";

const INVOICE_ISSUER = "CSOAI LTD (Companies House 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE";
const INVOICE_GBP_NOTE =
  "returns this free measurement, unsigned, and a reference recorded with the organisation named; the signed pack is " +
  "released once CSOAI LTD marks that reference paid and the same request is made again";

/** One invoice request as stored. No contact details: the buyer's email is how CSOAI reaches them. */
export type InvoiceRequestRecord = {
  reference: string;
  commissioned_by: string;
  subject_sha256: string | null;
  subject_bytes: number | null;
  url: string | null;
  requested_at: string;
  state: "AWAITING_PAYMENT" | "RELEASED";
  contact: null;
  released_at?: string;
  leaf_sha256?: string;
};

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

  // THE CHALLENGE NAMES THE RESOURCE THE BUYER ASKED FOR, QUERY INCLUDED (2026-09-26). A GET is
  // priced per named output (`url=`), and this door used to advertise the bare path in
  // resource.url and accepts[].resource while every other door kept its query — so the facilitator
  // and any index heard of a different resource from the one paid for. A POST (bytes/manifest in
  // the body) has no query to keep. functions/.well-known/x402-listing-parity.test.ts pins it.
  const namedOutput = request.method === "GET" ? url.searchParams.get("url") : null;
  const challengeUrl = (() => {
    if (!namedOutput) return resourceUrl;
    const u = new URL(resourceUrl);
    u.searchParams.set("url", namedOutput);
    return u.toString();
  })();

  const input = await readInput(request, url);
  if (input.error) return json({ schema: KIND, error: "uncheckable", reason: input.error, url: input.url, http: input.http }, input.error.includes("cap") ? 413 : 400);
  if (!input.source) {
    if (preview) {
      return json(
        {
          schema: KIND,
          error: "bad_request",
          reason: "supply url=<https://…> or POST the bytes / a manifest to measure",
        },
        400,
      );
    }
    if (hasPaymentHeader(request)) {
      return json(
        {
          schema: KIND,
          error: "bad_request",
          reason: "supply url=<https://…> or POST the bytes / a manifest to measure before presenting payment",
        },
        400,
      );
    }
    const description = ART50_MARKING_EVIDENCE_DESCRIPTION;
    const accepts = x402Accepts(env, challengeUrl, { skuId: "request_attestation", tier: "per_request", description });
    // Computed once, used twice: the 402 advertises this block and the paid path echoes the SAME
    // object into the PaymentPayload sent to the facilitator (specs/extensions/bazaar.md, Client
    // Behavior) — that echo is what gets a resource catalogued.
    const bazaar = declareBazaarHttpGet({
      method: "GET",
      queryParams: { url: "https://councilof.ai/og-image.png" },
      queryParamsSchema: {
        properties: {
          url: { type: "string", format: "uri", description: "HTTPS URL of the output to measure" },
          preview: { type: "string", const: "1" },
        },
        required: ["url"],
      },
      outputExample: { schema: KIND, measurement: { checked: [] } },
    });
    const payment = await verifyX402Payment(request, env, challengeUrl, accepts[0], { bazaar });
    if (!payment.ok) {
      return paymentRequiredResponseSigned(
        buildPaymentRequiredV2({
          resourceUrl: challengeUrl,
          description,
          serviceName: "CSOAI Art50 Marking",
          tags: ["art50", "marking", "c2pa", "x402"],
          accepts,
          bazaar,
          csoai: { schema: KIND, lid: CSOAI_LID, never: ["conformity", "certificate"] },
        }),
        env,
      );
    }
    return json(
      {
        schema: KIND,
        error: "bad_request",
        reason: "supply url=<https://…> or POST the bytes / a manifest to measure",
      },
      400,
    );
  }
  const fetched_at = new Date().toISOString();
  const m = await measure(input);
  const law = await art50LawBlock();
  const description = ART50_MARKING_EVIDENCE_DESCRIPTION;

  // No measurable input means no deliverable. Reject it before either the x402 facilitator or
  // invoice-reference path is entered; payment may never precede deliverability validation.
  if (!m) return json({ schema: KIND, error: "bad_request", reason: "supply url=<https://…> or POST the bytes / a manifest to measure" }, 400);

  // FREE preview — the full measurement, unsigned. Nothing withheld but the signature.
  if (preview) {
    return json({
      schema: KIND,
      mode: "preview",
      signed: false,
      fetched_at,
      scope: ART50_SCOPE,
      measurement: m,
      law,
      how_to_commission: {
        x402: `${resourceUrl} (same request without preview=1 — the 402 carries the price)`,
        invoice_gbp: `${resourceUrl}?commissioned_by=<organisation>&invoice=gbp`,
        invoice_gbp_note: INVOICE_GBP_NOTE,
      },
      note: "Preview: same measurement, no signature, no card. Marking results are stated as detected / not detected by the named method at fetched_at.",
    });
  }

  let payment: Record<string, unknown> | null = null;
  let paymentResponseHeader: string | undefined;
  // Set only on the invoice rail once the owner's paid mark is found: the stored request (null
  // when the buyer's request was never recorded) and its reference, so the release is written back.
  let invoiceRelease: { reference: string; existing: InvoiceRequestRecord | null } | null = null;
  if (invoice) {
    const reference = await invoiceReference(org, m.subject.sha256);
    const kv = env.REVENUE_KV ?? null;
    const requestKey = `${INVOICE_REQUEST_PREFIX}${reference}`;
    let paidMark: string | null = null;
    let existing: InvoiceRequestRecord | null = null;
    let readFailed = false;
    if (kv) {
      try {
        paidMark = await kv.get(`${INVOICE_PAID_PREFIX}${reference}`);
        const raw = await kv.get(requestKey);
        existing = raw ? (JSON.parse(raw) as InvoiceRequestRecord) : null;
      } catch {
        // An unreadable store releases nothing and records nothing: it is not a paid mark.
        readFailed = true;
        paidMark = null;
        existing = null;
      }
    }

    if (!paidMark) {
      // NOT PAID (or not readable): the free measurement and a reference, never the signed pack.
      // The request is recorded once per reference and counted once, apart from issuances.
      let recorded = !!existing;
      if (kv && !existing && !readFailed) {
        const rec: InvoiceRequestRecord = {
          reference,
          commissioned_by: org,
          subject_sha256: m.subject.sha256,
          subject_bytes: m.subject.bytes,
          url: m.subject.url,
          requested_at: fetched_at,
          state: "AWAITING_PAYMENT",
          contact: null,
        };
        try {
          await kv.put(requestKey, JSON.stringify(rec));
          recorded = true;
          try {
            const n = Number((await kv.get(INVOICE_REQUESTED_COUNTER)) || "0") + 1;
            await kv.put(INVOICE_REQUESTED_COUNTER, String(n));
          } catch {
            /* the record stands; a tally failure is not a second request */
          }
        } catch {
          recorded = false;
        }
      }
      const what = `Article 50 marking evidence, output sha256 ${m.subject.sha256 ?? "unknown"}`;
      const handoff = invoiceHandoff(
        reference,
        what,
        recorded ? { store: `REVENUE_KV ${requestKey}`, holds: "the organisation you named, the output's URL and the sha256 of the bytes measured" } : null,
      );
      const repeat = request.method === "GET" ? url.toString() : `POST the same bytes to ${url.toString()}`;
      return json({
        schema: KIND,
        mode: "invoice-gbp",
        state: "AWAITING_PAYMENT",
        signed: false,
        card: null,
        bytes: 0,
        unsigned_reason: `not released: the signed pack is released once CSOAI LTD marks reference ${reference} paid`,
        fetched_at,
        scope: ART50_SCOPE,
        measurement: m,
        law,
        payment: { mode: "invoice-gbp", reference, commissioned_by: org, currency: "GBP", state: "AWAITING_PAYMENT" },
        invoice: {
          issuer: INVOICE_ISSUER,
          currency: "GBP",
          reference,
          amount: null,
          amount_note: "stated on the owner-issued invoice, never by this Function",
          ...handoff,
        },
        release: {
          when: "after CSOAI LTD marks this reference paid, once the invoice settles. No agent and no request can mark it.",
          how: `make the same request again after payment: ${repeat}`,
          same_bytes: `the reference names these bytes (sha256 ${m.subject.sha256 ?? "unknown"}) and this organisation; if the output at the URL changes, its reference changes too`,
        },
        ...(readFailed ? { store_note: "REVENUE_KV could not be read, so this request was not recorded and no paid mark could be checked" } : {}),
        note: "Quotation: the same measurement as the free preview, unsigned, with no card. Nothing is signed or released by this request.",
      });
    }
    payment = { mode: "invoice-gbp", reference, commissioned_by: org, currency: "GBP", state: "MARKED_PAID" };
    invoiceRelease = { reference, existing };
  } else {
    const accepts = x402Accepts(env, challengeUrl, { skuId: SKU, tier: "pack", description });
    // Computed once, used twice: the 402 advertises this block and the paid path echoes the SAME
    // object into the PaymentPayload sent to the facilitator (specs/extensions/bazaar.md, Client
    // Behavior) — that echo is what gets a resource catalogued.
    const bazaar = declareBazaarHttpGet({
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
    });
    // THE LEAF MUST FIT BEFORE ANY MONEY MOVES (7 Oct 2026). verifyX402Payment settles; a leaf too
    // big to sign after that is a buyer charged for nothing. The measurement is already known here,
    // so fit it now with the widest payment block a settle can add, and refuse before settling if
    // even the shortest level cannot fit.
    if (!(await fitLeafPayload(m, fetched_at, PAYMENT_BLOCK_WORST_CASE))) {
      return json(
        {
          schema: KIND,
          error: "undeliverable",
          reason: `this output's signed leaf cannot fit the ${PAYLOAD_CAP_BYTES}-byte cap at any trim level, so no payment is asked for or settled; the free preview still measures it`,
          payment_taken: false,
          free_preview: `${resourceUrl}?preview=1`,
        },
        422,
      );
    }
    const paid = await verifyX402Payment(request, env, challengeUrl, accepts[0], { bazaar });
    if (!paid.ok) {
      const paymentRequired = buildPaymentRequiredV2({
        resourceUrl: challengeUrl,
        description,
        serviceName: "CSOAI Article 50 marking evidence",
        tags: ["article-50", "c2pa", "marking", "measurement", "x402"],
        accepts,
        bazaar,
        csoai: {
          schema: KIND,
          per: "pack (1 output × 1 point in time)",
          lid: CSOAI_LID,
          never: ["conformity opinion", "guarantee", "certificate", "grade"],
          deliverable: "one card-v0 leaf, surface art50.marking-evidence, ≤3KB payload, Ed25519-signed when the Pages key is present",
          scope: ART50_SCOPE,
          preview: m,
          free_preview: `${resourceUrl}?preview=1&url=…`,
          invoice_gbp: `${resourceUrl}?commissioned_by=<organisation>&invoice=gbp`,
          invoice_gbp_note: INVOICE_GBP_NOTE,
          rail: railMode(env),
          not_paid_reason: paid.reason,
          catalog: `${origin}/api/x402`,
        },
      });
      return paymentRequiredResponseSigned(paymentRequired, env);
    }
    payment = { mode: "x402", network: paid.settlement?.network || null, transaction: paid.settlement?.transaction || null, payer: paid.settlement?.payer || null };
    paymentResponseHeader = paid.paymentResponse;
  }

  // PAID AND NOT SIGNED IS NEVER A BARE 500 (7 Oct 2026). By here the buyer has paid (x402 settled,
  // or an invoice marked paid). If the leaf still cannot be signed, the answer carries what was
  // measured, the payment as settled, a recorded failure and the refund path — never just an error.
  const paidNotSigned = async (reason: string): Promise<Response> => {
    const key = `art50-undelivered:${String(payment!.transaction ?? payment!.reference ?? fetched_at)}`;
    const failure = { at: fetched_at, reason, payment, subject_sha256: m.subject.sha256, url: m.subject.url };
    let recorded: string | null = null;
    if (env.REVENUE_KV) {
      try {
        await env.REVENUE_KV.put(key, JSON.stringify(failure));
        recorded = `REVENUE_KV ${key}`;
      } catch {
        recorded = null;
      }
    }
    const ref = String(payment!.transaction ?? payment!.reference ?? "(none named)");
    const subject = `CSOAI art50 paid, not delivered: ${ref}`;
    const body = `Payment: ${JSON.stringify(payment)}\nOutput sha256: ${m.subject.sha256 ?? "unknown"}\nAt: ${fetched_at}\nReason: ${reason}\n\nPlease refund this payment or re-issue the signed pack.`;
    return json(
      {
        schema: KIND,
        error: "paid_not_delivered",
        reason: `the signed pack could not be issued after payment: ${reason}`,
        payment_settled: payment!.mode === "x402" ? !!payment!.transaction || null : null,
        payment,
        delivered: "the measurement below, unsigned; no card was issued",
        scope: ART50_SCOPE,
        measurement: m,
        law,
        failure_recorded: recorded !== null,
        failure_record: recorded,
        refund: {
          how: `Email ${INVOICE_CONTACT} with the transaction or reference below. CSOAI LTD refunds the payment or re-issues the signed pack; do not pay again for the same output.`,
          reference: ref,
          contact: INVOICE_CONTACT,
          mailto: `mailto:${INVOICE_CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
        },
        note: "Payment may have settled even though this answer is not 200. Check the transaction before retrying.",
      },
      500,
      paymentResponseHeader ? { "x-payment-response": paymentResponseHeader } : {},
    );
  };

  const fitted = await fitLeafPayload(m, fetched_at, payment);
  if (!fitted) return paidNotSigned(`payload exceeds the ${PAYLOAD_CAP_BYTES}-byte cap at every trim level`);
  const payload = fitted.payload;
  let leaf;
  try {
    leaf = await signPayload(payload, env.BOARD_SIGN_KEY_PKCS8_B64);
  } catch (e) {
    return paidNotSigned((e as Error).message);
  }
  const tx = payment.transaction as string | null | undefined;
  const card = cardV0({
    surface: SURFACE,
    subject: m.subject.sha256 ? `sha256:${m.subject.sha256}` : (m.subject.url ?? "unknown"),
    as_of: fetched_at,
    source_urls: [resourceUrl, ...(m.subject.url ? [m.subject.url] : []), ART50_SOURCES.eur_lex, ART50_SOURCES.eur_lex_2026_1744, ...(tx ? [`https://basescan.org/tx/${tx}`] : [])],
    payload,
    leaf,
    tags: [`rail:${payment.mode}`, `sku:${SKU}`, "article-50"],
    unmeasured: m.unmeasured,
  });

  if (env.REVENUE_KV) {
    try {
      // An invoice pack counts as an issuance once, at its first release; asking again after that
      // re-delivers the pack for the same paid reference and is not a second sale.
      const firstRelease = !invoiceRelease || invoiceRelease.existing?.state !== "RELEASED";
      if (firstRelease) {
        const n = Number((await env.REVENUE_KV.get("count:issuances")) || "0") + 1;
        await env.REVENUE_KV.put("count:issuances", String(n));
      }
      await env.REVENUE_KV.put(`art50:${leaf.sha256}`, JSON.stringify({ subject: m.subject.sha256, payment, as_of: fetched_at }));
      if (invoiceRelease && firstRelease) {
        const base: InvoiceRequestRecord = invoiceRelease.existing ?? {
          reference: invoiceRelease.reference,
          commissioned_by: org,
          subject_sha256: m.subject.sha256,
          subject_bytes: m.subject.bytes,
          url: m.subject.url,
          requested_at: fetched_at,
          state: "AWAITING_PAYMENT",
          contact: null,
        };
        await env.REVENUE_KV.put(
          `${INVOICE_REQUEST_PREFIX}${invoiceRelease.reference}`,
          JSON.stringify({ ...base, state: "RELEASED", released_at: fetched_at, leaf_sha256: leaf.sha256 }),
        );
      }
    } catch {
      /* a tally failure never blocks a deliverable */
    }
  }

  return json(
    {
      schema: KIND,
      mode: payment.mode,
      scope: ART50_SCOPE,
      card,
      law,
      detail: m.detail,
      ...(fitted.level > 0
        ? {
            measurement: m,
            leaf_trim: `the signed leaf's free text (notes, statements, gap reasons) was shortened to trim level ${fitted.level} of ${LEAF_TRIM_LEVELS.length - 1} to fit the ${PAYLOAD_CAP_BYTES}-byte cap; every method, result and gap code is kept, and the full text is in measurement`,
          }
        : {}),
      signed: !!leaf.sig_ed25519,
      unsigned_reason: leaf.sig_ed25519 ? null : leaf.unsigned_reason?.startsWith("BOARD_SIGN_KEY") ? "no signing key bound in the Pages env (BOARD_SIGN_KEY_PKCS8_B64); the leaf is issued unsigned and says so in unmeasured[]" : leaf.unsigned_reason,
      bytes: leaf.bytes,
      payment,
      ...(payment.mode === "invoice-gbp"
        ? {
            state: "RELEASED",
            invoice: {
              issuer: INVOICE_ISSUER,
              currency: "GBP",
              reference: payment.reference,
              amount: null,
              amount_note: "stated on the owner-issued invoice, never by this Function",
              state: "MARKED_PAID",
              note: "Released because CSOAI LTD marked this reference paid. Asking again re-delivers the pack for the same bytes; it is not a second sale.",
            },
          }
        : {}),
      verify: `${origin}/gspc-verify`,
      verify_how: "paste `card` into the free checker at /gspc-verify, or POST it to /api/verify; both read card-v0 leaves under the pinned did:web:csoai.org#board-attestation-1 key",
      note: "Independently signed, timestamped measurement of mark detection at fetched_at, by C2PA and IPTC metadata methods only (see scope). Not a conformity opinion, not a guarantee, not a certificate. Root inclusion follows the public-root workflow.",
    },
    200,
    paymentResponseHeader ? { "x-payment-response": paymentResponseHeader } : {},
  );
};

export const onRequestGet = handle;
export const onRequestPost = handle;

// HEAD answers as GET would, with no body and never with a payment (functions/api/_head.ts).
export const onRequestHead = headFromGet(handle);
