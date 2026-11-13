/**
 * POST /api/hitl/decision — record a human decision: APPROVED, HOLD or REJECTED.
 *
 * THE OPERATOR TOKEN NEVER ENTERS THE MODEL. The decision path requires an operator token, read
 * from the environment variable `COUNCIL_HITL_DECIDE_TOKEN` and never from the request body. A
 * body field travels through the model's context and into every transcript that holds it; an
 * environment variable does not. With no token configured, this door says the decision path is
 * locked and names the variable — and it does not decide anything.
 *
 * The decider must first answer the competency module for the axis under review, and the
 * answer is re-checked against the LIVE board at signing time, so a stale answer cannot open the
 * gate. The receipt is signed under the Council's board attestation key and says whether it was
 * signed or honestly unsigned.
 *
 * WHY THIS FILE EXISTS. See `functions/api/hitl/modules/index.ts`: the dispatch in
 * `functions/api/hitl.ts` was correct, but Pages routes by FILE, so `/api/hitl/decision`
 * answered 404 from the platform. This is the door the whole human-in-the-loop path exists for.
 */

export { onRequestPost, onRequestOptions } from "../hitl";
