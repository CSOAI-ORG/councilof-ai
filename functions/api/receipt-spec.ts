/**
 * GET /api/receipt-spec — RECEIPT-SPEC-0.1 metadata for agents.
 */
interface Env {}

const META = {
  schema: "csoai.receipt-spec-meta/0.1",
  spec_version: "0.1",
  media_type: "csoai.measurement-card/0.1",
  doctrine: "measurement-not-certification",
  published: "2026-08-23",
  issuer: "CSOAI Ltd (UK Companies House 16939677)",
  surfaces: {
    spec_page: "https://councilof.ai/receipt-spec",
    spec_markdown: "https://councilof.ai/docs/SOVOS/RECEIPT-SPEC-0.1.md",
    json_schema: "https://councilof.ai/.well-known/schemas/agent-measurement-card.schema.json",
    scitt_profile: "https://councilof.ai/.well-known/scitt.json",
    verify: "https://councilof.ai/gspc-verify",
    agent_runbook: "https://councilof.ai/agent-runbook",
    launch_post: "https://councilof.ai/blog/receipt-spec-0-1",
    ownership_plan: "https://councilof.ai/ownership",
  },
  signer: "did:web:csoai.org#card-attestation-1",
  verification_paths: ["browser-gspc-verify", "cli-did-json", "scitt-receipt-planned"],
  canonicalization: "recursive sort_keys, compact JSON, dual envelope A/B (see RECEIPT-SPEC §4)",
};

export const onRequestGet: PagesFunction<Env> = async () =>
  new Response(JSON.stringify(META, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
