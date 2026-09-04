/**
 * /api/learn-loop — quarantined pre-release surface.
 *
 * @openapi-unavailable
 *
 * The former implementation generated hash-shaped placeholders and labelled
 * them as Ed25519, OpenTimestamps, Rekor, EAS and BFT evidence. A digest is not
 * any of those records. This route therefore fails closed until one durable
 * pipeline can return independently verifiable identifiers for the exact
 * bytes it received.
 *
 * Candidate learning remains available inside Council OS, but it is explicitly
 * local/candidate state: it is not written to the training corpus and it never
 * becomes a signed measurement without admission, review and the real writer.
 */

const BODY = {
  schema: "csoai.learn-loop/0.2",
  status: "UNAVAILABLE",
  lifecycle: "QUARANTINED_PRE_RELEASE",
  reason:
    "No durable, independently verifiable learning-evidence pipeline is published. The previous route emitted placeholders and has been withdrawn.",
  available_now: {
    candidate_review: "/dashboard?tab=learn",
    signed_card_verification: "/gspc-verify",
    public_root: "/root.json",
  },
  reenable_only_when: [
    "the admitted card verifies under the pinned did:web:csoai.org key",
    "the card is included in the exact signed public root",
    "every returned witness identifier resolves and binds those exact bytes",
    "training-corpus admission records consent, provenance and human review",
  ],
  measurement_not_certification: true,
} as const;

function unavailable(): Response {
  return new Response(JSON.stringify(BODY, null, 2), {
    status: 503,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": "86400",
      "access-control-allow-origin": "*",
    },
  });
}

export const onRequestGet: PagesFunction = async () => unavailable();
export const onRequestPost: PagesFunction = async () => unavailable();
