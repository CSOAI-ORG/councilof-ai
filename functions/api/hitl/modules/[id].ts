/**
 * GET /api/hitl/modules/:id — one competency module, with its briefing and its four options.
 *
 * The module id is the axis id (for example `governance`). The briefing is derived from that
 * axis's OWN published record, read live on every request, so it cannot drift from what the
 * Council publishes; the correct option is not published here and is re-derived from the live
 * board when the answer is checked.
 *
 * WHY THIS FILE EXISTS. See `functions/api/hitl/modules/index.ts`: the dispatch in
 * `functions/api/hitl.ts` was correct and complete, but Pages routes by FILE, so the sub-path
 * never reached it. The logic is not repeated here — it is re-exported.
 */

export { onRequestGet, onRequestOptions, onRequestHead } from "../../hitl";
