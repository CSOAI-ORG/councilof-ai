/**
 * POST /api/receipts/verify — hand it an x402 offer-receipt artefact, get VALID or INVALID and
 * the reason. Free forever, like every verification surface in this estate.
 *
 * THIS DOOR IS A CONVENIENCE, NOT THE TRUTH. Everything it does, a stranger can do with
 * /.well-known/did.json and sixty lines of Python (scripts/verify_receipt.py), and the answer it
 * gives is worth exactly as much as the reader's willingness to believe us. That is why the
 * response names the key it used and the document it read it from: a caller who does not trust
 * this endpoint can repeat the check and must get the same answer, or one of us is wrong.
 *
 * Signature validity and signer AUTHORIZATION are reported separately, because the spec insists
 * on the distinction (§4.5.1): "an attacker can generate a valid key pair, sign an offer or
 * receipt for any resourceUrl, and present it as legitimate — the signature will verify, but the
 * key has no relationship to the service." A forged artefact from a self-minted key must come
 * back INVALID with THAT reason, never with "bad signature", or the reader learns the wrong
 * lesson about what went wrong.
 *
 * Authorization rule here, stated so it can be argued with: a kid is authorised for a resourceUrl
 * when the kid resolves in the DID document of the host that serves the resource. We publish one
 * DID document, at csoai.org, and it governs councilof.ai and csoai.org. An artefact naming any
 * other host is NOT_OURS — we decline to adjudicate it rather than answering for a domain we do
 * not control.
 */

/// <reference types="@cloudflare/workers-types" />

import { parseJws, publicKeyFromVerificationMethod, b64urlDecode } from "../_x402_jws";
import { verifyOffer, OFFER_RECEIPT_SPEC_SHA, OFFER_RECEIPT_SPEC_URL } from "../_x402_offer";
import { verifyReceipt } from "../_x402_receipt";

/** The one DID document that speaks for this estate. */
export const DID_DOC_URL = "https://csoai.org/.well-known/did.json";
/** Hosts this document is authorised to sign for. Anything else is another estate's problem. */
export const AUTHORISED_HOSTS = ["csoai.org", "www.csoai.org", "councilof.ai", "www.councilof.ai"];

type DidDoc = { verificationMethod?: { id?: string }[] };

/**
 * resolveKidFromDid — fetch the DID document and return the raw Ed25519 public key for `kid`,
 * but only when `resourceUrl` is a host this document may speak for.
 *
 * Returns null for every failure, and writes the reason into `out.reason`, because the caller
 * needs to tell "the key is not in the document" from "the document did not load" from "that URL
 * is not ours" — three different problems with three different fixes.
 */
export async function resolveKidFromDid(
  kid: string,
  resourceUrl: string,
  fetchDoc: (url: string) => Promise<DidDoc | null>,
  out: { reason?: string } = {},
): Promise<Uint8Array | null> {
  let host: string;
  try {
    host = new URL(resourceUrl).host.toLowerCase();
  } catch {
    out.reason = `resourceUrl ${JSON.stringify(resourceUrl)} is not a URL, so no document can be said to govern it`;
    return null;
  }
  if (!AUTHORISED_HOSTS.includes(host)) {
    out.reason =
      `${host} is not a host this DID document speaks for (${AUTHORISED_HOSTS.join(", ")}). ` +
      `The signature may well be valid; we decline to say whether the key was authorised for someone else's service.`;
    return null;
  }
  const doc = await fetchDoc(DID_DOC_URL);
  if (!doc) {
    out.reason = `could not read ${DID_DOC_URL}, so authorisation could not be established either way`;
    return null;
  }
  const vm = (doc.verificationMethod || []).find((m) => m && m.id === kid);
  if (!vm) {
    out.reason = `kid ${kid} is not listed in verificationMethod at ${DID_DOC_URL}`;
    return null;
  }
  const key = publicKeyFromVerificationMethod(vm);
  if (!key) {
    out.reason = `kid ${kid} is listed but carries no Ed25519 OKP publicKeyJwk we can use`;
    return null;
  }
  return key;
}

const defaultFetchDoc = async (url: string): Promise<DidDoc | null> => {
  try {
    const r = await fetch(url, { cf: { cacheTtl: 300 } } as RequestInit);
    return r.ok ? ((await r.json()) as DidDoc) : null;
  } catch {
    return null;
  }
};

export type VerifyBody = {
  /** A compact JWS, or the wire object {format:"jws", signature}. Either is accepted. */
  receipt?: unknown;
  offer?: unknown;
  jws?: string;
  kind?: "receipt" | "offer";
};

/** Pull the compact JWS out of whatever shape the caller sent. */
export function extractJws(body: VerifyBody): { jws: string | null; kind: "receipt" | "offer" | null; reason: string } {
  const pick = (v: unknown): string | null => {
    if (typeof v === "string") return v;
    if (v && typeof v === "object") {
      const o = v as { format?: string; signature?: unknown; payload?: unknown };
      if (o.payload !== undefined && o.format === "jws") {
        return null; // §3.1.1: payload MUST be omitted beside a JWS. Refuse rather than guess.
      }
      if (typeof o.signature === "string") return o.signature;
    }
    return null;
  };
  if (body.receipt !== undefined) {
    const j = pick(body.receipt);
    return j
      ? { jws: j, kind: "receipt", reason: "" }
      : { jws: null, kind: "receipt", reason: "receipt is neither a compact JWS string nor {format:'jws', signature} without a payload (spec §3.1.1)" };
  }
  if (body.offer !== undefined) {
    const j = pick(body.offer);
    return j
      ? { jws: j, kind: "offer", reason: "" }
      : { jws: null, kind: "offer", reason: "offer is neither a compact JWS string nor {format:'jws', signature} without a payload (spec §3.1.1)" };
  }
  if (typeof body.jws === "string") {
    return { jws: body.jws, kind: body.kind || null, reason: "" };
  }
  return { jws: null, kind: null, reason: "send {\"receipt\": <compact jws or wire object>} or {\"offer\": …}" };
}

/**
 * Which artefact is this? An offer commits to terms (it has `amount`); a receipt confirms
 * delivery (it has `payer` and `issuedAt`). We read the payload rather than trusting the caller's
 * label, and we say which one we decided it was.
 */
export function sniffKind(payload: Record<string, unknown>): "receipt" | "offer" | null {
  if (typeof payload.payer === "string" && typeof payload.issuedAt === "number") return "receipt";
  if (typeof payload.amount === "string" && typeof payload.scheme === "string") return "offer";
  return null;
}

export async function handle(
  request: Request,
  fetchDoc: (url: string) => Promise<DidDoc | null> = defaultFetchDoc,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<Response> {
  const base = {
    schema: "csoai.x402.receipt-verdict/0.1",
    as_of: new Date().toISOString(),
    spec: OFFER_RECEIPT_SPEC_URL,
    spec_commit: OFFER_RECEIPT_SPEC_SHA,
    did_document: DID_DOC_URL,
    honesty:
      "This endpoint is a convenience. The same check runs offline with scripts/verify_receipt.py " +
      "and /.well-known/did.json; if our answer and yours differ, ours is not the one that counts.",
  };
  const bad = (reason: string, status = 400) =>
    Response.json({ ...base, verdict: "INVALID", reason, checks: null }, { status, headers: { "cache-control": "no-store" } });

  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return bad("body is not JSON");
  }
  if (!body || typeof body !== "object") return bad("body is not a JSON object");

  const { jws, kind: claimed, reason } = extractJws(body);
  if (!jws) return bad(reason);

  let parsed;
  try {
    parsed = parseJws(jws);
  } catch (e) {
    return bad((e as Error).message);
  }

  const kind = sniffKind(parsed.payload) || claimed;
  if (!kind) {
    return bad("payload is neither an offer (amount+scheme) nor a receipt (payer+issuedAt) — spec §4.2 / §5.2");
  }

  const resourceUrl = String(parsed.payload.resourceUrl ?? "");
  const authNote: { reason?: string } = {};
  const resolve = (kid: string, ru: string) => resolveKidFromDid(kid, ru, fetchDoc, authNote);

  const verdict =
    kind === "receipt"
      ? await verifyReceipt(jws, resolve, nowSeconds)
      : await verifyOffer(jws, resolve, nowSeconds);

  return Response.json(
    {
      ...base,
      verdict: verdict.ok ? "VALID" : "INVALID",
      kind,
      reason: verdict.ok ? verdict.reason : authNote.reason || verdict.reason,
      kid: verdict.kid,
      resource_url: resourceUrl || null,
      payload: verdict.payload,
      checks: verdict.checks,
      // Said out loud because the spec says a verifier MUST distinguish them (§4.5.1).
      signature_valid: verdict.checks.signature === true,
      signer_authorised: verdict.checks.kid_resolved === true,
      recompute:
        "python3 scripts/verify_receipt.py --jws <the string you sent> — it fetches the DID document " +
        "itself and never contacts this endpoint.",
    },
    { status: 200, headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } },
  );
}

export const onRequestPost: PagesFunction = async ({ request }) => handle(request);

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });

/** GET says what the door is for rather than 405-ing an agent that guessed the method. */
export const onRequestGet: PagesFunction = async ({ request }) =>
  Response.json(
    {
      schema: "csoai.x402.receipt-verdict/0.1",
      method: "POST",
      body: { receipt: "<compact JWS string, or {format:'jws', signature}>" },
      also_accepts: { offer: "<the same, for a signed offer from a 402>" },
      spec: OFFER_RECEIPT_SPEC_URL,
      did_document: DID_DOC_URL,
      offline: "scripts/verify_receipt.py in the councilof-ai repository does this without us.",
      example: `curl -sX POST ${new URL(request.url).origin}/api/receipts/verify -H 'content-type: application/json' -d '{"receipt":"eyJ…"}'`,
    },
    { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } },
  );

// Re-exported so the test can build a tampered payload without importing the JWS module twice.
export { b64urlDecode };
