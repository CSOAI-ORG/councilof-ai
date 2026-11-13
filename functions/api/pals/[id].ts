/**
 * GET /api/pals/:id — one staff member, by id or by slug.
 *
 * WHY THIS FILE EXISTS. The registry published an endpoint map naming `GET /api/pals/<id>`, and
 * the dispatch for it was written and correct in `functions/api/pals.ts`. But a Cloudflare Pages
 * Function is reached by its own FILE: `functions/api/pals.ts` answered `/api/pals` and nothing
 * else, so every other path in the published map answered 404 from the platform before the
 * dispatch could run. The registry advertised doors it did not have.
 *
 * The logic is not repeated here — it is re-exported. See `_published-endpoint-routes.test.ts`,
 * which fails if the published map ever names a path with no route file behind it.
 */

export { onRequestGet, onRequestOptions, onRequestHead } from "../pals";
