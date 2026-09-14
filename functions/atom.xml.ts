/**
 * GET /atom.xml — third conventional alias of the one feed at /api/feed.xml.
 * Same handler, same items. See ./feed.xml.ts for why the aliases exist.
 * Feed readers and answer engines probe /atom.xml by convention; without this
 * file Pages falls through to the SPA 404 shell.
 */
export { onRequestGet } from "./api/feed.xml";
