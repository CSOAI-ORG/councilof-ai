/**
 * GET /.well-known/scitt-configuration — what a SCITT client finds when it probes the
 * conventional discovery path, stated truthfully: the estate operates NO transparency service.
 *
 * WHY THIS EXISTS. The path answered 404 (B-08, 2026-09-05). PR #2535 (15 Sep) added a 308 to
 * /.well-known/scitt.json by hand-editing public/_redirects, and scripts/generate-redirects.mjs
 * regenerated the file without it — the claim lived in the artifact and not in the producer.
 * A Pages Function is its own producer, and a document is more honest than a redirect: the
 * profile at scitt.json is a discovery profile, while this path, under RFC 9943 (the SCITT
 * architecture) and draft-ietf-scitt-scrapi (transparency-configuration), is where a client
 * expects a transparency service to describe its registration policy. Ours is: none.
 *
 * NOTHING HERE IS A REGISTRATION. No Signed Statement has been registered anywhere, no receipt
 * has been issued, and the public root is an independent Ed25519-signed Merkle root over
 * measurement-card digests with outside witnesses — not a SCITT log. A client that reads
 * `registration_policy` and stops has the whole truth.
 */
const ORIGIN = "https://councilof.ai";
export const SCITT_CONFIGURATION_URL = `${ORIGIN}/.well-known/scitt-configuration`;

export const SCITT_CONFIGURATION = {
  schema: "csoai.scitt-configuration/0.1",
  issuer: "did:web:csoai.org",
  issuer_did_document: "https://csoai.org/.well-known/did.json",
  transparency_service: {
    operated: false,
    status: "NOT_OPERATED",
    note:
      "CSOAI operates no SCITT transparency service. Nothing is registered, no receipts are issued, " +
      "and no registration endpoint exists. This document exists so the conventional discovery path " +
      "answers with that fact instead of a 404.",
  },
  registration_policy: "none — no transparency service operated",
  registration_endpoint: null,
  receipts_issued: false,
  signed_statements_registered: "NONE",
  what_exists_instead: {
    public_root: `${ORIGIN}/root.json`,
    public_root_api: `${ORIGIN}/api/root`,
    public_root_kind:
      "an Ed25519-signed Merkle root over measurement-card digests (did:web:csoai.org#board-attestation-1); " +
      "the leaf COUNT is inside the signed preimage and a verifier must bind it — see how_to_verify",
    witnesses: {
      rekor: `${ORIGIN}/interop/root-witness-latest.json`,
      opentimestamps: `${ORIGIN}/interop/ots/manifest.json`,
      note: "A witness entry is evidence that bytes existed at a time. It is not a SCITT receipt.",
    },
    how_to_verify: `${ORIGIN}/signed/HOW-TO-VERIFY-ROOT.md`,
    verify_free: `${ORIGIN}/gspc-verify`,
  },
  keys: `${ORIGIN}/.well-known/scitt-keys`,
  profile: `${ORIGIN}/.well-known/scitt.json`,
  standards: {
    architecture: "RFC 9943 — An Architecture for Trustworthy and Transparent Digital Supply Chains",
    configuration_convention: "draft-ietf-scitt-scrapi (transparency configuration)",
    relationship: "reference only; no conformance, registration, endorsement or participation claim",
  },
  doctrine: "measurement, never a grade; verification is free",
};

const body = JSON.stringify(SCITT_CONFIGURATION, null, 2) + "\n";
const bodyLength = new TextEncoder().encode(body).byteLength;
const allow = "GET, HEAD, OPTIONS";

// One method dispatcher, the api-catalog pattern: unsupported verbs never fall through to the SPA.
// This endpoint reads no request body, calls no service and holds no secret.
export const onRequest = ({ request }: { request: Request }): Response => {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "public, max-age=3600",
    "Access-Control-Allow-Origin": "*",
    Allow: allow,
  });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method === "HEAD") {
    headers.set("Content-Length", String(bodyLength));
    return new Response(null, { status: 200, headers });
  }
  if (request.method !== "GET") return new Response(null, { status: 405, headers });
  return new Response(body, { status: 200, headers });
};
