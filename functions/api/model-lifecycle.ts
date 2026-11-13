/**
 * GET /api/model-lifecycle — upstream availability of a model family, joined to the measurement
 * this estate holds for it.
 *
 * WHY (4 Nov 2026). The estate publishes model measurements by identifier. `MiniMaxAI/MiniMax-M2.7`
 * is in public/interop/models-measured.json with 5 signed cards on 5 axes: a real, quotable
 * measurement. Nothing said that the vendor lists that family under "Retired Models" on its own
 * model list (read 2026-11-03), or that the two families still open to pay-as-you-go callers stop
 * on 2026-11-18. Availability lived on the vendor's site; measurement lived here; the two were
 * never joined, so a reader holding the measurement had no way to learn it.
 *
 * WHAT IS A MEASUREMENT AND WHAT IS NOT (the load-bearing distinction).
 *   - estate.estate.state = MEASURED is OURS: a signed, quotable card naming that family exists in
 *     this estate's card corpus. The card and axis counts are READ from
 *     public/interop/models-measured.json — never typed in this file.
 *   - estate.upstream_status is the VENDOR'S: its own statement about its own API surface, read on
 *     one date, carried as a reported record. It is not a measurement by us and it says nothing
 *     about how any model behaves.
 *
 * NOT A RANKING, NOT AN ENDORSEMENT, NOT A CERTIFICATION. Availability says a model can still be
 * called. It does not say the model is good, safe, compliant or approved, and this estate never
 * certifies. Verification of a signed measurement is free and separate: /gspc-verify/.
 *
 * UNMEASURED IS NOT ZERO. A family with no signed card is UNMEASURED: an observed absence in this
 * estate's corpus as at the corpus's own as_of. It is not a zero, not a failure, not a comparison,
 * and not a claim that the model cannot be measured.
 *
 * A FAMILY THAT HAS NOT BEEN RELEASED CARRIES NO NUMBER. MiniMax-M4 has no identifier, no release
 * date and no entry in the vendor's model list or release notes on the date read. It is listed as
 * NOT_RELEASED so a reader can see it was considered and it carries no measurement.
 *
 * DERIVED, NOT ASSERTED. Every number in this body is recomputed from two committed corpora by
 * scripts/build-model-lifecycle.mjs, and the sha256 of both inputs travels with it. Anyone can
 * re-run the builder and get these bytes. No serve-time clock: as_of is the date the vendor's
 * pages were read and it never moves on its own.
 */
import { MODEL_LIFECYCLE_SNAPSHOT } from "./_model-lifecycle-snapshot";
import { headFromGet } from "./_head";

export const onRequestGet: PagesFunction = async () => {
  return new Response(JSON.stringify(MODEL_LIFECYCLE_SNAPSHOT, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=600",
      "access-control-allow-origin": "*",
    },
  });
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to the static-asset 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
