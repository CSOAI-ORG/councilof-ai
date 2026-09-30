/**
 * GET /api/xl — the signed cross-ledger daily record, free and verbatim: the newest xl-daily record on the public Hugging Face dataset csoai/cross-ledger-supply, byte for byte as published, served only after its Ed25519-signed wrapper verifies under the pinned board key and pins the sha256 of exactly these bytes. ?date=YYYY-MM-DD serves that day's record; ?part=signed serves the signed wrapper itself. A record that does not verify is never served (503). The values are each ledger's own supply figure (totalSupply() or its equivalent), not issued or outstanding supply, reserves or redeemability, and nothing here ranks issuers.
 *
 * WHY A PROXY AND NOT A COPY. The record is produced and signed once a day on the measurement host
 * and published as new dated files (a day's record is never overwritten; a re-derivation is a new vN
 * directory). Copying it into the site would add a second, unsigned publication path. This route adds
 * nothing and removes nothing: the body is the published file, its strong ETag is its sha256, and the
 * headers name where it came from and what verified it. Anyone can repeat the check offline:
 *   1. sha256(body) == x-csoai-record-sha256 == signed wrapper payload.artifact.sha256
 *   2. sha256(canonical JSON of payload) == signature.payload_sha256
 *   3. Ed25519 verify signature.sig_ed25519 with did:web:csoai.org#board-attestation-1 (/.well-known/did.json)
 *
 * FREE. No payment challenge is issued here, ever; verification is free.
 *
 * WITHHOLDING. The record is raw signed data. The rendered entity pages (/stablecoins/<asset>/<chain>/)
 * withhold a finding while a correction against it is pending; this route cannot edit signed bytes,
 * so it points at the corrections ledger (Link rel="corrections") instead.
 */
import { type Ctx, SITE, SourceError, errorJson, fetchSource, sha256Hex, utf8 } from "../_lib/reach/core";
import { XL_DS, xlLocate } from "../_lib/reach/stablecoins";
import { blobUrl, resolveUrl } from "../_lib/reach/hf";
import { verifySidecar } from "../_lib/measurementCapsule";
import { headFromGet } from "./_head";

export const XL_SCHEMA = "csoai.cross-ledger-xl-daily/0.1";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TTL_S = 900;

type Json = Record<string, unknown>;
const rec = (x: unknown): Json | null => (x && typeof x === "object" && !Array.isArray(x) ? (x as Json) : null);

function jsonError(req: Request, status: 400 | 404 | 405 | 503, what: string, detail: string): Response {
  const base = status === 400
    ? { status: 400, body: JSON.stringify({ schema: "csoai.reach-error/0.1", status: 400, state: "BAD_REQUEST", subject: what, detail, usage: `${SITE}/api/xl · ?date=YYYY-MM-DD · ?part=record|signed` }, null, 1), contentType: "application/json; charset=utf-8", headers: {} as Record<string, string> }
    : errorJson(status, what, detail, 120);
  const headers: Record<string, string> = {
    "content-type": base.contentType,
    "cache-control": "no-store, no-transform",
    "access-control-allow-origin": "*",
    "x-content-type-options": "nosniff",
    ...(base.headers || {}),
  };
  if (status === 405) headers.allow = "GET, HEAD";
  return new Response(req.method === "HEAD" ? null : base.body, { status, headers });
}

const httpDate = (iso: unknown) => {
  const d = typeof iso === "string" ? new Date(iso) : null;
  return d && !isNaN(d.getTime()) ? d.toUTCString() : null;
};

export const onRequestGet = async (ctx: Ctx): Promise<Response> => {
  const req = ctx.request;
  if (req.method !== "GET" && req.method !== "HEAD") return jsonError(req, 405, "/api/xl", "only GET and HEAD are served");
  const u = new URL(req.url);
  const date = u.searchParams.get("date");
  const part = u.searchParams.get("part") ?? "record";
  if (date !== null && !DATE_RE.test(date)) return jsonError(req, 400, "date", "date must be YYYY-MM-DD");
  if (part !== "record" && part !== "signed") return jsonError(req, 400, "part", "part must be record or signed");

  try {
    const loc = await xlLocate(ctx, date ?? undefined);
    if (!loc) return jsonError(req, 404, `xl-daily ${date}`, "no signed cross-ledger record is published for this date");
    const [recB, sigB] = await Promise.all([
      fetchSource(ctx, resolveUrl(XL_DS, loc.path), `${XL_DS}/${loc.path}`, TTL_S),
      fetchSource(ctx, resolveUrl(XL_DS, loc.signedPath), `${XL_DS}/${loc.signedPath}`, TTL_S),
    ]);
    let sidecar: unknown, record: Json | null;
    try {
      sidecar = JSON.parse(utf8(sigB));
      record = rec(JSON.parse(utf8(recB)));
    } catch {
      throw new SourceError(`${XL_DS}/${loc.path}`, "record or signed wrapper is not JSON");
    }
    if (!record || record.schema !== XL_SCHEMA) throw new SourceError(`${XL_DS}/${loc.path}`, `record schema is not ${XL_SCHEMA}`);
    const sig = await verifySidecar({ state: "OK", url: resolveUrl(XL_DS, loc.signedPath), text: utf8(sigB), json: sidecar }, utf8(recB));
    if (sig.state !== "VERIFIES") throw new SourceError(`${XL_DS}/${loc.path}`, `signature ${sig.state}${sig.reason ? `: ${sig.reason}` : ""}`);
    // verifySidecar pins the sha256 of the decoded text; a verbatim proxy pins the raw bytes it serves.
    const recordSha = await sha256Hex(recB);
    const pinned = rec(rec(rec(sidecar)?.payload)?.artifact)?.sha256;
    if (pinned !== recordSha) throw new SourceError(`${XL_DS}/${loc.path}`, "the signed wrapper does not pin these exact bytes");

    const body = part === "signed" ? sigB : recB;
    const bodySha = part === "signed" ? await sha256Hex(sigB) : recordSha;
    const etag = `"sha256-${bodySha}"`;
    const headers: Record<string, string> = {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${TTL_S}, no-transform`,
      "access-control-allow-origin": "*",
      "access-control-expose-headers": "etag, last-modified, link, x-csoai-source, x-csoai-part, x-csoai-record-date, x-csoai-record-version, x-csoai-record-sha256, x-csoai-signature, x-csoai-signer, x-csoai-signed-wrapper, x-csoai-access",
      "x-content-type-options": "nosniff",
      etag,
      "x-csoai-source": resolveUrl(XL_DS, part === "signed" ? loc.signedPath : loc.path),
      "x-csoai-part": part,
      "x-csoai-record-date": loc.date,
      "x-csoai-record-version": loc.version,
      "x-csoai-record-sha256": recordSha,
      "x-csoai-signature": sig.state,
      "x-csoai-signer": String(sig.did ?? ""),
      "x-csoai-signed-wrapper": resolveUrl(XL_DS, loc.signedPath),
      "x-csoai-access": "free",
      link: [
        `<${blobUrl(XL_DS, loc.path)}>; rel="canonical"`,
        `<${resolveUrl(XL_DS, loc.signedPath)}>; rel="describedby"`,
        `<${SITE}/.well-known/did.json>; rel="service-desc"`,
        `<${SITE}/api/corrections>; rel="corrections"`,
      ].join(", "),
    };
    const lm = httpDate(record.as_of);
    if (lm) headers["last-modified"] = lm;
    const inm = req.headers.get("if-none-match");
    if (inm && inm.split(",").map((s) => s.trim().replace(/^W\//, "")).some((t) => t === etag || t === "*")) {
      return new Response(null, { status: 304, headers });
    }
    return new Response(req.method === "HEAD" ? null : (body as unknown as BodyInit), { status: 200, headers });
  } catch (e) {
    const detail = e instanceof SourceError ? `${e.source}: ${e.detail}` : ((e as Error)?.message || "unexpected error").slice(0, 160);
    return jsonError(req, 503, e instanceof SourceError ? e.source : "/api/xl", detail);
  }
};

/** HEAD: the status and headers GET would answer, with no body (Pages dispatches HEAD only to this export). */
export const onRequestHead = headFromGet(onRequestGet);
