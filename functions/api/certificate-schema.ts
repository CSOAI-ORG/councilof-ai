/**
 * GET /api/certificate-schema — the schema URL the issuer and the verifier agree on.
 *
 * PHASE3 line C.2: "Certificate payload schema fixed (what's attested, expiry,
 * verification URL)". This is the contract. When M4 wires signing-key access
 * into the Pages function, the issuer reads this and emits at most the fields
 * named here. When csoai_verify runs against a cert, it recomputes the id from
 * these same fields and rejects any deviation.
 */

import certSchema from "../../public/schemas/csoai-certificate-0.1.schema.json";

export const onRequestGet: PagesFunction = async () => {
  const body = {
    schema: "csoai.certificate-schema-endpoint/0.1",
    endpoint: "/api/certificate-schema",
    methods: { GET: "describe the csoai.certificate/0.1 schema; consumer does not need a network round-trip to verify a cert — they re-derive this same shape from public/schemas/" },
    contract:
      "The certificate payload must conform to csoai.certificate/0.1 (this endpoint). " +
      "Any future version (csoai.certificate/0.2) will be a strict superset; the issuer " +
      "must never emit a payload that drops required fields from the current minor. " +
      "Refunds (csoai.refund-record/0.1) revoke without erasing; the certificate stays " +
      "in the historical record with its payload intact.",
    schema_url: "/schemas/csoai-certificate-0.1.schema.json",
    schema_version: "csoai.certificate/0.1",
    required_fields: [
      "schema", "certificate_id", "issued_at", "issuer_did", "subject",
      "entitlement", "scope", "limits", "verification", "integrity",
    ],
    hard_doctrine: [
      "cert is a measurement credential — non_certification is always true",
      "cert is not an endorsement of the subject — non_promotion is always true",
      "issuer never includes private key material in the payload",
      "writes_board: false — issuance does not modify the public board",
      "subject.email_hash is optional; cert id is sha256 of canonical payload",
    ],
    relationships: {
      "verified_by": [
        "tools/verify/csoai_verify.py (signature, root inclusion)",
        "public/schemas/csoai-certificate-0.1.schema.json (shape)",
      ],
      "superseded_by": [
        "csoai.refund-record/0.1 (revoked without erasing; original certificate stays in the historical trail)",
      ],
      "signed_by": [
        "did:web:csoai.org#board-attestation-1 (the board-attestation key)",
      ],
    },
    schema_json: certSchema,
  };
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
