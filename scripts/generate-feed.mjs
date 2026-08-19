#!/usr/bin/env node
/**
 * generate-feed.mjs — RSS + JSON Feed of new GSPC cards/boards (SPRAY-out).
 * Consumers self-subscribe; feeds are the pull side of distribution.
 * Writes: dist/client/feed.xml (RSS 2.0) + dist/client/feed.json (JSON Feed 1.1)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");
const DIST = path.join(REPO, "dist", "client");

// Latest published items (from the canon; update as cards ship).
const ITEMS = [
  { id: "vals-proof-point", title: "Vals proof-point: signed recomputable measurement card",
    url: "https://councilof.ai/signed-verification-wall", date: "2026-08-19T00:00:00Z",
    summary: "A signed, recomputable measurement card — the verification primitive the incumbent lacks. Verify free, forever." },
  { id: "gspc-complete-tree", title: "The complete GSPC: core, extensions, ladder, benchmarks, humans",
    url: "https://councilof.ai/api/gspc", date: "2026-08-18T00:00:00Z",
    summary: "14-slot registry, 13 measured; human baseline boots via published aggregate baselines (no DPIA)." },
  { id: "honesty-gate", title: "Our own fine-tunes are losing our own arena",
    url: "https://councilof.ai/honesty", date: "2026-08-18T00:00:00Z",
    summary: "A measurer publishing the result that embarrasses it. Measurement, not certification." },
];

const siteUrl = "https://councilof.ai";

// RSS 2.0
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>Council of AI — signed measurement feed</title>
<link>${siteUrl}</link>
<description>Signed, deterministic AI-governance measurement results. Measurement, not certification.</description>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${ITEMS.map(i => `  <item>
    <title>${i.title}</title>
    <link>${i.url}</link>
    <guid isPermaLink="false">${i.id}</guid>
    <pubDate>${new Date(i.date).toUTCString()}</pubDate>
    <description>${i.summary}</description>
  </item>`).join("\n")}
</channel>
</rss>`;

// JSON Feed 1.1
const jsonFeed = {
  version: "https://jsonfeed.org/version/1.1",
  title: "Council of AI — signed measurement feed",
  home_page_url: siteUrl,
  feed_url: `${siteUrl}/feed.json`,
  description: "Signed, deterministic AI-governance measurement results. Measurement, not certification.",
  items: ITEMS.map(i => ({
    id: i.id, title: i.title, url: i.url, date_published: i.date, summary: i.summary,
  })),
};

fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, "feed.xml"), rss);
fs.writeFileSync(path.join(DIST, "feed.json"), JSON.stringify(jsonFeed, null, 2));
console.log(`feeds written -> dist/client/feed.xml + feed.json (${ITEMS.length} items)`);
