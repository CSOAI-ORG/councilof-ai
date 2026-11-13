/**
 * GET  /api/hitl/modules — the competency curriculum, derived from the live board.
 * POST /api/hitl/modules — answer one module; the answer is checked against the live record.
 *
 * WHY THIS FILE EXISTS. The whole human-in-the-loop path was written, correct, in
 * `functions/api/hitl.ts`, which dispatches on the sub-path. A Cloudflare Pages Function is
 * reached by its own FILE though, so `functions/api/hitl.ts` answered `/api/hitl` and nothing
 * else, and every path below answered 404 from the platform before the dispatch ran. The
 * curriculum was published inside `/api/hitl`; the door to ANSWER it did not exist.
 *
 * This file is thin on purpose. The logic stays in one place — `../../hitl` — and what was
 * missing was the routing, not the behaviour. Re-exporting the handlers keeps the two in step:
 * there is exactly one implementation of the competency gate, and it is the one that decides
 * whether a human is competent enough to sign.
 */

export { onRequestGet, onRequestPost, onRequestOptions, onRequestHead } from "../../hitl";
