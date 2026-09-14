/**
 * GET /atom.xml — conventional apex Atom alias of the live corrections Atom feed.
 *
 * Canonical implementation: /feeds/corrections.atom (DERIVED ledger; verified HTTP 200).
 * Re-export keeps both paths byte-identical — one engine, no second feed, no invented scores.
 *
 * WHY. Feed readers and crawlers probe /atom.xml by convention. The estate already publishes
 * Atom at /feeds/corrections.atom (linked from llms.txt and <link rel="alternate">), but the
 * conventional apex path 404'd (stranger audit 2026-09-14). Same defect class as /feed.xml
 * before its alias of /api/feed.xml.
 */
export { onRequestGet } from "./feeds/corrections.atom";
