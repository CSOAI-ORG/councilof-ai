/**
 * GET /api/hitl/challenges — the review queue: the challenges waiting for a human, and the ones
 * already decided.
 *
 * WHY THIS FILE EXISTS. See `functions/api/hitl/modules/index.ts`: the dispatch in
 * `functions/api/hitl.ts` was correct, but Pages routes by FILE, so `/api/hitl/challenges`
 * answered 404 from the platform. A published review queue that cannot be read is not a queue.
 */

export { onRequestGet, onRequestOptions, onRequestHead } from "../hitl";
