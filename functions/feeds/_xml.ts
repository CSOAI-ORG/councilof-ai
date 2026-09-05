// Shared feed rendering. One escaper, one RSS writer, one Atom writer — a feed that escapes
// its own text differently from its neighbour is a feed that breaks on the first apostrophe.
export const esc = (s: string): string =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface Entry {
  id: string;        // stable guid — never the position in a list
  title: string;
  link: string;
  iso: string;       // ISO-8601 date, read from the artifact, never new Date()
  body: string;
}

const rfc822 = (iso: string): string => {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return isNaN(d.getTime()) ? "" : d.toUTCString();
};

const HEAD = (title: string, self: string, desc: string) =>
  `  <title>${esc(title)}</title>\n  <link>https://councilof.ai/</link>\n` +
  `  <atom:link href="${esc(self)}" rel="self" type="application/rss+xml"/>\n` +
  `  <description>${esc(desc)}</description>\n  <language>en-gb</language>\n`;

export function rss(title: string, self: string, desc: string, entries: Entry[]): string {
  const items = entries.map((e) =>
    `  <item>\n    <title>${esc(e.title)}</title>\n    <link>${esc(e.link)}</link>\n` +
    `    <guid isPermaLink="false">${esc(e.id)}</guid>\n` +
    (rfc822(e.iso) ? `    <pubDate>${rfc822(e.iso)}</pubDate>\n` : "") +
    `    <description>${esc(e.body)}</description>\n  </item>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n${HEAD(title, self, desc)}${items}\n</channel>\n</rss>\n`;
}

export function atom(title: string, self: string, desc: string, entries: Entry[]): string {
  // updated = the newest entry's own timestamp, NOT the time this request was served. A feed
  // that stamps itself with now() reports a change on every poll and tells the reader nothing.
  const updated = entries.length ? new Date(entries[0].iso.length === 10 ? `${entries[0].iso}T00:00:00Z` : entries[0].iso).toISOString() : "";
  const items = entries.map((e) => {
    const iso = new Date(e.iso.length === 10 ? `${e.iso}T00:00:00Z` : e.iso).toISOString();
    return `  <entry>\n    <title>${esc(e.title)}</title>\n    <link href="${esc(e.link)}"/>\n` +
      `    <id>${esc(e.id)}</id>\n    <updated>${iso}</updated>\n` +
      `    <summary>${esc(e.body)}</summary>\n  </entry>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n` +
    `  <title>${esc(title)}</title>\n  <link href="https://councilof.ai/"/>\n  <link rel="self" href="${esc(self)}"/>\n` +
    `  <id>${esc(self)}</id>\n${updated ? `  <updated>${updated}</updated>\n` : ""}  <subtitle>${esc(desc)}</subtitle>\n${items}\n</feed>\n`;
}

export const FEED_HEADERS = {
  "content-type": "application/xml; charset=utf-8",
  "cache-control": "public, max-age=300",
  "access-control-allow-origin": "*",
};
