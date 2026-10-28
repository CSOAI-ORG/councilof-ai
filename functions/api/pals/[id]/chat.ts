/**
 * POST /api/pals/:id/chat — ask one staff member a question.
 *
 * The reply carries its own provenance: `grounded` when a published record answered and no model
 * was consulted, `model` when the model spoke on the records, `ungrounded` when no published
 * record answers it, `refused` when a reply would have broken a standing rule, and `escalated`
 * when the question asked the staff member to publish, release, send or approve something — in
 * which case the reply carries a challenge for a human instead of an answer.
 *
 * WHY THIS FILE EXISTS. The registry published this exact path in its endpoint map, and the
 * dispatch for it was written and correct in `functions/api/pals.ts`. Pages routes by FILE, so
 * `functions/api/pals.ts` answered `/api/pals` and nothing else — this path answered 404 from
 * the platform, before the dispatch ran. Every question to every staff member died at the door,
 * through the route the registry itself published. The logic is re-exported, not repeated.
 */

export { onRequestPost, onRequestOptions } from "../../pals";
