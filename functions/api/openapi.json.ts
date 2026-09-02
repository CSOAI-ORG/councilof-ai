/**
 * GET /api/openapi.json — an OpenAPI 3.1 description of the PUBLIC read endpoints that
 * already exist, for ChatGPT / Custom-GPT Actions and any other schema importer.
 *
 * Honesty rules for this file:
 *   - Only endpoints that exist today are described. Adding a path here does not create
 *     it; the test at functions/api/openapi.test.ts checks every path resolves to a
 *     Pages Function or a static file in public/.
 *   - No count is typed. The description tells the client to quote totals.lid and
 *     totals.public_count from the live payload.
 *   - Signature verification is not an Action: an HTTP schema cannot run Ed25519. The
 *     spec hands the reader the card URL and the published recipe instead.
 *
 * Served by a Function (not a static file) so the `servers` entry always names the
 * origin it was fetched from, and so the catch-all /api/[[path]] 404 does not shadow it.
 */

export const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Council of AI — GSPC measurement (public read surfaces)",
    version: "0.1.0",
    description:
      "Independent AI-behaviour measurement by CSOAI Ltd. Measurement, not certification. " +
      "Quote totals.lid and totals.public_count from GET /api/gspc verbatim; never compose a count. " +
      "Three verification states exist: VALID, INVALID, UNCHECKABLE. Absence of a field means UNMEASURED. " +
      "TIE is never a win. A withheld leader (public_leader_state) is a state, not a zero. " +
      "Verify is free; a rank is never sold. Signature checks are not Actions: use /signed/HOW-TO-VERIFY.md.",
    contact: { name: "CSOAI Ltd", url: "https://councilof.ai", email: "nicholas@csoai.org" },
    license: { name: "Apache-2.0", url: "https://www.apache.org/licenses/LICENSE-2.0" },
  },
  servers: [{ url: "https://councilof.ai" }],
  paths: {
    "/api/gspc": {
      get: {
        operationId: "getBoard",
        summary: "The living GSPC board — the one authority",
        description:
          "Returns totals (print totals.lid and totals.public_count verbatim), state_enum, and one object per axis " +
          "with status, kind, separation, and either a public leader or a public_leader_state explaining why the " +
          "leader is withheld (EXCLUDED_OWN_MODEL, NO_SIGNED_CARD). Do not count the axes array; read totals.",
        responses: { "200": { description: "Board payload (application/json)." } },
      },
    },
    "/api/proof": {
      get: {
        operationId: "getProof",
        summary: "One free inclusion proof against the last published public root",
        description:
          "Pass sha=<64-hex>. 200 with kind=inclusion (index, proof[], merkle_root, as_of) when the sha is a leaf; " +
          "404 error=not_found when it is not a leaf (the root binds the public-root card set, not every signed " +
          "measurement card); 400 when sha is malformed. bundle=1 is an x402 (HTTP 402) paid re-serve, never required.",
        parameters: [
          { name: "sha", in: "query", required: true, schema: { type: "string", pattern: "^[0-9a-f]{64}$" }, description: "Leaf sha256, lowercase hex." },
        ],
        responses: {
          "200": { description: "Inclusion proof." },
          "400": { description: "Malformed sha." },
          "404": { description: "Not a leaf of the last published root." },
        },
      },
    },
    "/root.json": {
      get: {
        operationId: "getRoot",
        summary: "The last published public root (csoai.public-root/v0)",
        description: "Ed25519-signed envelope under did:web:csoai.org#board-attestation-1; card_sha256[] is bound by merkle_root. Recipe: /signed/HOW-TO-VERIFY-ROOT.md. Not a certificate.",
        responses: { "200": { description: "Root envelope." } },
      },
    },
    "/.well-known/did.json": {
      get: {
        operationId: "getDid",
        summary: "The DID document that publishes the signing keys",
        description: "verificationMethod[] carries the Ed25519 keys (card-attestation-1 signs measurement cards; board-attestation-1 signs the root and mill cards). Pin, do not fetch at check time.",
        responses: { "200": { description: "DID document." } },
      },
    },
    "/signed/card_index.json": {
      get: {
        operationId: "getCardIndex",
        summary: "Unsigned convenience index of the signed measurement cards",
        description: "cards[] with card (id), axis, card_url, signed. The index itself is not evidence; the card is.",
        responses: { "200": { description: "Card index." } },
      },
    },
    "/signed/cards/{id}.json": {
      get: {
        operationId: "getCard",
        summary: "One signed measurement card",
        description: "{alg, body, id, preimage_rule, pubkey, signature}. id = sha256 of the canonical body; verify per /signed/HOW-TO-VERIFY.md. Returns 404 for an unknown id.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", pattern: "^[0-9a-f]{64}$" } }],
        responses: { "200": { description: "Signed card." }, "404": { description: "No such card." } },
      },
    },
    "/signed/HOW-TO-VERIFY.md": {
      get: {
        operationId: "getVerifyRecipe",
        summary: "The published, offline card-verification recipe",
        responses: { "200": { description: "Markdown." } },
      },
    },
  },
} as const;

export const onRequestGet: PagesFunction = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const spec = { ...OPENAPI_SPEC, servers: [{ url: origin }] };
  return new Response(JSON.stringify(spec, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
