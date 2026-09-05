/**
 * GET /feed.xml — the conventional path for the feed that already exists at /api/feed.xml.
 *
 * A pure alias. Same handler, same items, one canonical feed — this file adds no second engine
 * and no second set of items, because two surfaces generating the same feed would drift and the
 * estate would then have to reconcile them.
 *
 * WHY IT IS NEEDED. The feed was real and well-written and nobody could find it. Feed readers,
 * crawlers and answer engines probe /feed.xml and /rss.xml by convention; /api/feed.xml is not a
 * path anything guesses. It was also absent from llms.txt, from robots.txt, and from the HTML as
 * a <link rel="alternate">, so there was no route to it except knowing it was there. A return
 * path that cannot be discovered is the same as no return path.
 */
export { onRequestGet } from "./api/feed.xml";
