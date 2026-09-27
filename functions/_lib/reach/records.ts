/**
 * /feeds/records.xml (Atom 1.0) and /feeds/records.json (JSON Feed 1.1) — one entry per new dated
 * record, DERIVED from the artifacts, never typed:
 *   - every entry in the corrections ledger (functions/api/corrections.ts LEDGER);
 *   - every daily measurement-capsule index whose signature verifies (one daily note each);
 *   - every dated evidence note (client/src/data/evidence-notes.json, via functions/feeds/notes.xml).
 * Each entry's date is the record's own date, never the time of the request, so an unchanged record
 * never looks new to a reader.
 */
import { type Ctx, SITE } from "./core";
import { correctionLink, isPending, ledgerEntries } from "./corrections";
import { verifiedDays } from "./notes";
import { entries as evidenceNotes } from "../../feeds/notes.xml";

export interface Rec { id: string; url: string; title: string; summary: string; date: string; kind: "correction" | "daily-note" | "evidence-note" }

const iso = (s: string): string | null => {
  if (!s || s === "UNRECORDED") return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00Z` : s);
  return isNaN(d.getTime()) ? null : d.toISOString().replace(/\.\d{3}Z$/, "Z");
};

export async function records(ctx: Ctx): Promise<Rec[]> {
  const out: Rec[] = [];
  for (const c of ledgerEntries()) {
    const when = iso(String((c as { published_at?: string }).published_at || "")) || iso(String(c.date || ""));
    if (!when) continue;
    out.push({
      id: `tag:councilof.ai,2026:correction:${c.id}`, url: `${SITE}${correctionLink(c.id)}`, kind: "correction", date: when,
      title: `Correction ${c.id}${isPending(c) ? " (pending)" : ""}`,
      summary: [c.what_was_wrong, c.status ? `Status: ${c.status}` : ""].filter(Boolean).join("\n\n"),
    });
  }
  for (const d of await verifiedDays(ctx)) {
    const when = iso(d.as_of || d.date);
    if (!when) continue;
    out.push({
      id: `tag:councilof.ai,2026:daily-note:${d.date}`, url: `${SITE}/notes/daily/${d.date}/`, kind: "daily-note", date: when,
      title: `What changed on ${d.date}`, summary: `Generated from the signed daily measurement-capsule index for ${d.date}: counts of what changed, by batch, with links to the entity pages.`,
    });
  }
  for (const n of evidenceNotes()) {
    const when = iso(n.iso);
    if (!when) continue;
    out.push({ id: `tag:councilof.ai,2026:evidence-note:${n.link.replace(/^.*\/notes\//, "").replace(/\/$/, "")}`, url: n.link, kind: "evidence-note", date: when, title: n.title, summary: n.body.slice(0, 1200) });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const FEED_TITLE = "Council of AI — new records";
export const FEED_SUBTITLE = "Every new dated record: corrections, daily measurement notes and evidence notes. Derived from the artifacts; measurement, not certification.";

export function atomFeed(recs: Rec[]): string {
  const updated = recs[0]?.date ?? "2026-01-01T00:00:00Z";
  const entries = recs.map((r) => `  <entry>
    <id>${x(r.id)}</id>
    <title>${x(r.title)}</title>
    <link rel="alternate" type="text/html" href="${x(r.url)}"/>
    <updated>${r.date}</updated>
    <published>${r.date}</published>
    <category term="${r.kind}"/>
    <summary type="text">${x(r.summary)}</summary>
  </entry>`).join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${SITE}/feeds/records.xml</id>
  <title>${x(FEED_TITLE)}</title>
  <subtitle>${x(FEED_SUBTITLE)}</subtitle>
  <link rel="self" type="application/atom+xml" href="${SITE}/feeds/records.xml"/>
  <link rel="alternate" type="text/html" href="${SITE}/notes/daily/"/>
  <updated>${updated}</updated>
  <author><name>Council of AI (CSOAI Ltd)</name><uri>${SITE}/</uri></author>
  <rights>CC BY 4.0</rights>
${entries}
</feed>
`;
}

export function jsonFeed(recs: Rec[]): string {
  return JSON.stringify({
    version: "https://jsonfeed.org/version/1.1",
    title: FEED_TITLE,
    home_page_url: `${SITE}/notes/daily/`,
    feed_url: `${SITE}/feeds/records.json`,
    description: FEED_SUBTITLE,
    language: "en",
    authors: [{ name: "Council of AI (CSOAI Ltd)", url: `${SITE}/` }],
    items: recs.map((r) => ({ id: r.id, url: r.url, title: r.title, content_text: r.summary, date_published: r.date, date_modified: r.date, tags: [r.kind] })),
  }, null, 1) + "\n";
}
