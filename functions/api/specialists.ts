/**
 * GET /api/specialists — the signed specialist-team feed, served LIVE + pass-through.
 *
 * Honest PROXY of the estate's signed specialist-team feed
 * (https://csoai-sovereign.pages.dev/api/specialists.json), emitted by the
 * sim-world-estate public-api-generator.mjs (schema csoai.specialist-team/0.1,
 * record_type measured-current-state, not_a_certification:true, endorsement:none).
 * We do NOT re-sign here and we do NOT wrap the body: the bytes are passed through
 * exactly as the estate emitted them, so a stranger can recompute body_sha256 over
 * them and get the same answer. Measurement, never certification.
 *
 * The count is whatever the feed carries — it is never hardcoded here. As at the
 * embedded snapshot the feed carries 13 specialists and count === specialists.length.
 *
 * VERIFICATION STATUS (checked 2026-08-26, honest label, do not upgrade without a re-check):
 *   body_sha256 — VERIFIABLE. sha256 of JSON.stringify(body, null, 2) with the three
 *                 envelope fields (body_sha256, sig_algo, sig_b64) removed recomputes
 *                 to the published digest. Confirmed against the live feed.
 *   sig_b64     — UNVERIFIED BY A STRANGER. The Ed25519 signature is passed through
 *                 unmodified, but its public key is NOT published in
 *                 did:web:csoai.org (/.well-known/did.json carries site-release-1,
 *                 estate-chain-1, board-attestation-1, card-attestation-1 — none of
 *                 which verify this signature). Until the estate publishes that key,
 *                 the signature is an integrity marker we relay, not a claim a third
 *                 party can check. Stated, never papered over.
 * Both statuses are relayed to the caller in x-csoai-* headers rather than injected
 * into the body, because adding a field would break body_sha256 recomputation.
 *
 * NO SERVE-TIME CLOCK: every timestamp in the response is the estate's own as_of,
 * carried in the signed bytes. This endpoint stamps nothing.
 */

const SOVEREIGN_FEED = "https://csoai-sovereign.pages.dev/api/specialists.json";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=300",
  "x-csoai-body-sha256": "verifiable",
  "x-csoai-ed25519": "relayed-unverified-public-key-unpublished",
};

// Embedded read-only signed snapshot — the exact signed bytes of the estate feed
// (byte-identical to the live response; body_sha256 recomputes TRUE). A generated
// mirror, never re-signed here. Served only when the live feed is unreachable, and
// flagged as a snapshot in the response headers so a stale read is never mistaken
// for a live one.
const SNAPSHOT_JSON = "{\n  \"schema\": \"csoai.specialist-team/0.1\",\n  \"record_type\": \"measured-current-state\",\n  \"as_of\": \"2026-08-25T15:55:14.240Z\",\n  \"count\": 13,\n  \"not_a_certification\": true,\n  \"endorsement\": \"none\",\n  \"note\": \"The 13-specialist catapult (GW.1): one OOWM/OWEM specialist per axis/regulator/industry/product, each wired to a real signed estate signal. Measurement, never certification. Firewall 2 holds — adapters train on axis knowledge packs + methodology, never eval outcomes.\",\n  \"specialists\": [\n    {\n      \"id\": \"gov\",\n      \"class\": \"axis\",\n      \"model\": \"qwen3:8b\",\n      \"role\": \"governance specialist\",\n      \"signal\": \"/register/register-index\",\n      \"ready\": true,\n      \"mcp_manifest\": {\n        \"schema\": \"csoai.specialist-mcp/0.1\",\n        \"id\": \"gov\",\n        \"class\": \"axis\",\n        \"model\": \"qwen3:8b\",\n        \"role\": \"governance specialist\",\n        \"signal\": \"/register/register-index\",\n        \"not_a_certification\": true,\n        \"as_of\": \"2026-08-25T15:42:47Z\"\n      }\n    },\n    {\n      \"id\": \"safety\",\n      \"class\": \"axis\",\n      \"model\": \"council-oowm:latest\",\n      \"role\": \"safety/containment specialist\",\n      \"signal\": \"/jail\",\n      \"ready\": true,\n      \"mcp_manifest\": {\n        \"schema\": \"csoai.specialist-mcp/0.1\",\n        \"id\": \"safety\",\n        \"class\": \"axis\",\n        \"model\": \"council-oowm:latest\",\n        \"role\": \"safety/containment specialist\",\n        \"signal\": \"/jail\",\n        \"not_a_certification\": true,\n        \"as_of\": \"2026-08-25T15:42:47Z\"\n      }\n    },\n    {\n      \"id\": \"knowledge\",\n      \"class\": \"axis\",\n      \"model\": \"phi4:14b\",\n      \"role\": \"factual/general knowledge specialist\",\n      \"signal\": \"/register/model-measurements-index\",\n      \"ready\": true,\n      \"mcp_manifest\": {\n        \"schema\": \"csoai.specialist-mcp/0.1\",\n        \"id\": \"knowledge\",\n        \"class\": \"axis\",\n        \"model\": \"phi4:14b\",\n        \"role\": \"factual/general knowledge specialist\",\n        \"signal\": \"/register/model-measurements-index\",\n        \"not_a_certification\": true,\n        \"as_of\": \"2026-08-25T15:42:47Z\"\n      }\n    },\n    {\n      \"id\": \"prv\",\n      \"class\": \"axis\",\n      \"model\": \"mistral:7b\",\n      \"role\": \"privacy specialist\",\n      \"signal\": \"/register/register-index\",\n      \"ready\": true,\n      \"mcp_manifest\": {\n        \"schema\": \"csoai.specialist-mcp/0.1\",\n        \"id\": \"prv\",\n        \"class\": \"axis\",\n        \"model\": \"mistral:7b\",\n        \"role\": \"privacy specialist\",\n        \"signal\": \"/register/register-index\",\n        \"not_a_certification\": true,\n        \"as_of\": \"2026-08-25T15:42:47Z\"\n      }\n    },\n    {\n      \"id\": \"swarm\",\n      \"class\": \"axis\",\n      \"model\": \"qwen2.5:7b\",\n      \"role\": \"swarm/coordination specialist\",\n      \"signal\": \"/cross\",\n      \"ready\": true,\n      \"mcp_manifest\": {\n        \"schema\": \"csoai.specialist-mcp/0.1\",\n        \"id\": \"swarm\",\n        \"class\": \"axis\",\n        \"model\": \"qwen2.5:7b\",\n        \"role\": \"swarm/coordination specialist\",\n        \"signal\": \"/cross\",\n        \"not_a_certification\": true,\n        \"as_of\": \"2026-08-25T15:42:47Z\"\n      }\n    },\n    {\n      \"id\": \"provenance\",\n      \"class\": \"axis\",\n      \"model\": \"gemma3:12b\",\n      \"role\": \"provenance/source-attribution specialist\",\n      \"signal\": \"/register/boards-pod-index\",\n      \"ready\": true,\n      \"mcp_manifest\": {\n        \"schema\": \"csoai.specialist-mcp/0.1\",\n        \"id\": \"provenance\",\n        \"class\": \"axis\",\n        \"model\": \"gemma3:12b\",\n        \"role\": \"provenance/source-attribution specialist\",\n        \"signal\": \"/register/boards-pod-index\",\n        \"not_a_certification\": true,\n        \"as_of\": \"2026-08-25T15:42:47Z\"\n      }\n    },\n    {\n      \"id\": \"conformance\",\n      \"class\": \"axis\",\n      \"model\": \"qwen3:4b\",\n      \"role\": \"protocol-conformance specialist\",\n      \"signal\": \"/register/x402-a2a-conformance\",\n      \"ready\": true,\n      \"mcp_manifest\": {\n        \"schema\": \"csoai.specialist-mcp/0.1\",\n        \"id\": \"conformance\",\n        \"class\": \"axis\",\n        \"model\": \"qwen3:4b\",\n        \"role\": \"protocol-conformance specialist\",\n        \"signal\": \"/register/x402-a2a-conformance\",\n        \"not_a_certification\": true,\n        \"as_of\": \"2026-08-25T15:42:47Z\"\n      }\n    },\n    {\n      \"id\": \"care\",\n      \"class\": \"axis\",\n      \"model\": \"qwen2.5:7b\",\n      \"role\": \"care/values-alignment specialist\",\n      \"signal\": \"/compliance\",\n      \"ready\": true,\n      \"mcp_manifest\": {\n        \"schema\": \"csoai.specialist-mcp/0.1\",\n        \"id\": \"care\",\n        \"class\": \"axis\",\n        \"model\": \"qwen2.5:7b\",\n        \"role\": \"care/values-alignment specialist\",\n        \"signal\": \"/compliance\",\n        \"not_a_certification\": true,\n        \"as_of\": \"2026-08-25T15:42:47Z\"\n      }\n    },\n    {\n      \"id\": \"regulator-uk\",\n      \"class\": \"regulator\",\n      \"model\": \"mistral:7b\",\n      \"role\": \"UK regulator specialist\",\n      \"signal\": \"/register/register-index\",\n      \"ready\": true,\n      \"mcp_manifest\": {\n        \"schema\": \"csoai.specialist-mcp/0.1\",\n        \"id\": \"regulator-uk\",\n        \"class\": \"regulator\",\n        \"model\": \"mistral:7b\",\n        \"role\": \"UK regulator specialist\",\n        \"signal\": \"/register/register-index\",\n        \"not_a_certification\": true,\n        \"as_of\": \"2026-08-25T15:42:47Z\"\n      }\n    },\n    {\n      \"id\": \"regulator-eu\",\n      \"class\": \"regulator\",\n      \"model\": \"qwen3:8b\",\n      \"role\": \"EU AI-Act regulator specialist\",\n      \"signal\": \"/register/register-index\",\n      \"ready\": true,\n      \"mcp_manifest\": {\n        \"schema\": \"csoai.specialist-mcp/0.1\",\n        \"id\": \"regulator-eu\",\n        \"class\": \"regulator\",\n        \"model\": \"qwen3:8b\",\n        \"role\": \"EU AI-Act regulator specialist\",\n        \"signal\": \"/register/register-index\",\n        \"not_a_certification\": true,\n        \"as_of\": \"2026-08-25T15:42:47Z\"\n      }\n    },\n    {\n      \"id\": \"industry-finance\",\n      \"class\": \"industry\",\n      \"model\": \"phi4:14b\",\n      \"role\": \"financial-AI specialist\",\n      \"signal\": \"/register/financial-ai-index\",\n      \"ready\": true,\n      \"mcp_manifest\": {\n        \"schema\": \"csoai.specialist-mcp/0.1\",\n        \"id\": \"industry-finance\",\n        \"class\": \"industry\",\n        \"model\": \"phi4:14b\",\n        \"role\": \"financial-AI specialist\",\n        \"signal\": \"/register/financial-ai-index\",\n        \"not_a_certification\": true,\n        \"as_of\": \"2026-08-25T15:42:47Z\"\n      }\n    },\n    {\n      \"id\": \"industry-gaming\",\n      \"class\": \"industry\",\n      \"model\": \"qwen3:4b\",\n      \"role\": \"game/arena measurement specialist\",\n      \"signal\": \"/games/gspc\",\n      \"ready\": true,\n      \"mcp_manifest\": {\n        \"schema\": \"csoai.specialist-mcp/0.1\",\n        \"id\": \"industry-gaming\",\n        \"class\": \"industry\",\n        \"model\": \"qwen3:4b\",\n        \"role\": \"game/arena measurement specialist\",\n        \"signal\": \"/games/gspc\",\n        \"not_a_certification\": true,\n        \"as_of\": \"2026-08-25T15:42:47Z\"\n      }\n    },\n    {\n      \"id\": \"product-payments\",\n      \"class\": \"product\",\n      \"model\": \"qwen2.5:7b\",\n      \"role\": \"x402/payments specialist\",\n      \"signal\": \"/register/x402-a2a-conformance\",\n      \"ready\": true,\n      \"mcp_manifest\": {\n        \"schema\": \"csoai.specialist-mcp/0.1\",\n        \"id\": \"product-payments\",\n        \"class\": \"product\",\n        \"model\": \"qwen2.5:7b\",\n        \"role\": \"x402/payments specialist\",\n        \"signal\": \"/register/x402-a2a-conformance\",\n        \"not_a_certification\": true,\n        \"as_of\": \"2026-08-25T15:42:47Z\"\n      }\n    }\n  ],\n  \"body_sha256\": \"61789f7082a3186b4fcb6356b4509789585a1202e7909f5de62a50de51a4e04d\",\n  \"sig_algo\": \"ed25519\",\n  \"sig_b64\": \"NQT9uaHt6ye/MwiLzX20/rLT41VM6Xv5nVGKCxxQdVJajuB4OqwKHKHhcdpYqIaMReH9YtEvBczwLms3Q29cBw==\"\n}";

// Structural check on the live feed: right schema, an envelope to verify, and a count
// that matches the array it claims to count. A specific number is deliberately NOT
// asserted here — hardcoding one would silently downgrade every honest future feed
// to the stale snapshot.
type Feed = {
  schema?: string;
  count?: number;
  specialists?: unknown[];
  body_sha256?: string;
  sig_b64?: string;
};

const usable = (j: Feed): boolean =>
  j?.schema === "csoai.specialist-team/0.1" &&
  Array.isArray(j.specialists) &&
  j.specialists.length > 0 &&
  j.count === j.specialists.length &&
  typeof j.body_sha256 === "string" &&
  typeof j.sig_b64 === "string";

export const onRequestGet: PagesFunction = async () => {
  // Prefer the live signed estate feed (single source of truth); fall back to the
  // embedded read-only signed snapshot, labelled as such.
  try {
    const resp = await fetch(SOVEREIGN_FEED, { headers: { "user-agent": "csoai-specialists/0.1" } });
    if (resp.ok) {
      const raw = await resp.text();
      if (usable(JSON.parse(raw) as Feed)) {
        // Relay the fetched bytes verbatim — reserialising would change the bytes
        // body_sha256 was computed over and break a stranger's recomputation.
        return new Response(raw, {
          headers: { ...JSON_HEADERS, "x-csoai-source": "live-signed-feed" },
        });
      }
    }
  } catch {
    /* honest read-only fallback below */
  }
  return new Response(SNAPSHOT_JSON, {
    headers: { ...JSON_HEADERS, "x-csoai-source": "embedded-signed-snapshot" },
  });
};
