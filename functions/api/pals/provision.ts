/**
 * POST /api/pals/provision — build a staff member.
 *
 * Refused when the PAL_MEMORY_KV store is unbound, rather than pretending it was saved. A staff
 * member is scoped to a namespace and can be revoked; it does not become a published measurement.
 *
 * WHY THIS FILE EXISTS. The registry published this exact path in its endpoint map, and the
 * dispatch for it was written and correct in `functions/api/pals.ts`. Pages routes by FILE, so
 * this path answered 404 from the platform, before the dispatch ran. The logic is re-exported,
 * not repeated.
 */

export { onRequestPost, onRequestOptions } from "../pals";
