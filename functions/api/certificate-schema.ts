/**
 * certificate-schema — withdrawn; the record is csoai.completion-record/0.1.
 * @openapi-retired
 *
 * This endpoint described csoai.certificate/0.1, the payload of the withdrawn paid issuer
 * (functions/api/paddle-webhook.ts). The schema is renamed and re-cut as a strict Open Badges 3.0
 * / VC 2.0 profile: public/schemas/csoai-completion-record-0.1.schema.json. The old schema file
 * stays published as a historical document so anything that cites it still resolves.
 */

const BODY = {
  schema: "csoai.retired-endpoint/0.1",
  status: "UNAVAILABLE",
  code: "RETIRED",
  endpoint: "/api/certificate-schema",
  message: "Withdrawn. The record schema is csoai.completion-record/0.1.",
  reason: "CSOAI issues no certificates. A completion record says one published measurement was reproduced.",
  replaced_by: {
    record: "csoai.completion-record/0.1",
    schema: "https://councilof.ai/schemas/csoai-completion-record-0.1.schema.json",
    verifier: "tools/verify/completion_record_verify.py",
  },
  historical: "https://councilof.ai/schemas/csoai-certificate-0.1.schema.json",
};

export const onRequestGet: PagesFunction = async () =>
  new Response(JSON.stringify(BODY, null, 2), {
    status: 503,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
