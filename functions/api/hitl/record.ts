/**
 * GET /api/hitl/record — the signed receipts: the decisions that were taken, and the receipts
 * that prove them.
 *
 * WHY THIS FILE EXISTS. See `functions/api/hitl/modules/index.ts`: the dispatch in
 * `functions/api/hitl.ts` was correct, but Pages routes by FILE, so `/api/hitl/record` answered
 * 404 from the platform. The record of what the humans decided was unreachable.
 */

export { onRequestGet, onRequestOptions, onRequestHead } from "../hitl";
