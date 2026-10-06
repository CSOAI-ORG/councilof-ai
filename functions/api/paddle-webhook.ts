/**
 * paddle-webhook — withdrawn: records are free and are never called certificates.
 * @openapi-retired
 *
 * Until 2026-09-28 this endpoint verified a Paddle payment, granted a KV entitlement and issued a
 * "csoai.certificate/0.1". That contradicted two standing rules at once: verification and records
 * are free (nothing is issued for payment), and CSOAI issues no certificates. The Academy's record
 * is csoai.completion-record/0.1 (public/schemas/csoai-completion-record-0.1.schema.json), issued
 * free when a published measurement is reproduced (scripts/academy/issue-completion-record.mjs).
 *
 * Every method now answers the repo's retired-endpoint shape (503 csoai.retired-endpoint/0.1,
 * code RETIRED — the convention scripts/capability-registry.mjs enforces). Nothing is verified,
 * stored or issued, and no secret is read. Paddle retries non-2xx deliveries, so the webhook
 * destination should also be disabled in the Paddle dashboard (owner action).
 */
import { headFromGet } from "./_head";

const BODY = {
  schema: "csoai.retired-endpoint/0.1",
  status: "UNAVAILABLE",
  code: "RETIRED",
  endpoint: "/api/paddle-webhook",
  message: "Withdrawn. This endpoint no longer verifies payments, grants entitlements or issues anything.",
  reason: "Records are free and are never sold. CSOAI issues no certificates.",
  replaced_by: {
    record: "csoai.completion-record/0.1",
    schema: "https://councilof.ai/schemas/csoai-completion-record-0.1.schema.json",
    how: "https://councilof.ai/academy/#completion-records",
  },
};

const retired = () =>
  new Response(JSON.stringify(BODY, null, 2), {
    status: 503,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

export const onRequestGet: PagesFunction = async () => retired();
export const onRequestPost: PagesFunction = async () => retired();

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
