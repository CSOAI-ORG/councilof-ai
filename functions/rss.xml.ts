/**
 * GET /rss.xml — second conventional alias of the one feed at /api/feed.xml.
 * Same handler, same items. See ./feed.xml.ts for why the aliases exist.
 */
export { onRequestGet } from "./api/feed.xml";
