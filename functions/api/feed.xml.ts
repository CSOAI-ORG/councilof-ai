// functions/api/feed.xml — RSS 2.0 of estate state changes (watch-subscription v0.2).
//
// The retention primitive from the flywheel doctrine: a changing state you care
// about + a free, no-identity way to watch it. Zero PII (RSS stores nothing on
// the client).
//
// v0.2 (2026-09-16): items are DERIVED at serve time, never typed here.
//   · the GSPC board-count line — live from GET /api/gspc (B-03, 2026-09-15), always first,
//     never a stale count; an honest "unavailable" line when the board cannot be read.
//   · one item per axis report — from /reports/index.json (scripts/build-axis-reports.mjs),
//     each dated by its newest source card, so a new signed card reaches this feed with no
//     code edit. MEASURED carries n; UNMEASURED carries its reason. Nothing carries a grade.
//   · one item for the regulation-findings index — from /signed/findings_index.json, counts
//     read from the file, dated by its as_of.
// Newest first, capped at 50 derived items after the board line. The hand-typed history that
// used to live here was retired with this change: no test read it, and a feed that is code
// cannot be the durable record — /feeds/corrections.xml and /interop/** are.

interface FeedItem {
  title: string;
  link: string;
  date: string; // RFC 822
  desc: string;
}

export const CAP = 50;

const esc = (s: string) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const rfc822 = (iso: unknown, fallback: string) => {
  const d = new Date(String(iso ?? ""));
  return Number.isNaN(d.getTime()) ? fallback : d.toUTCString();
};

async function fetchJson(origin: string, path: string): Promise<any | null> {
  try {
    const r = await fetch(new URL(path, origin).toString(), { headers: { "User-Agent": "feed.xml/1.0", accept: "application/json" } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function fetchBoardItem(origin: string): Promise<FeedItem> {
  const now = new Date().toUTCString();
  const gspc = await fetchJson(origin, "/api/gspc");
  const t = gspc?.totals;
  if (t?.public_count) {
    return {
      title: `GSPC board: ${t.public_count} — live`,
      link: `${origin}/api/gspc`,
      date: now,
      desc: `Derived live from GET /api/gspc. ${t.model_fleets ?? "?"} model fleets · ${t.fact_runs ?? "?"} fact runs · ${t.items ?? "?"} items. ${t.count_grammar ?? "Cite totals.public_count from GET /api/gspc."}`,
    };
  }
  // Honest fallback: never fabricate a count.
  return {
    title: "GSPC board: live count unavailable",
    link: `${origin}/api/gspc`,
    date: now,
    desc: "The board count could not be derived from GET /api/gspc at this time. Cite totals.public_count directly. Never fabricate a count.",
  };
}

export function reportItems(index: any, origin: string, now: string): Array<FeedItem & { sort: number }> {
  const rows: any[] = Array.isArray(index?.reports) ? index.reports : [];
  return rows.map((r) => {
    const measured = r.status === "MEASURED";
    const status = measured ? `MEASURED (n=${r.n} ${r.n_unit ?? ""})`.trim() : "UNMEASURED";
    const obligations = r.obligations === "UNMAPPED" ? "obligations UNMAPPED" : `${r.obligations} crosswalk pointer(s), relevant-to only`;
    const d = new Date(String(r.as_of ?? ""));
    return {
      title: `${r.subject} × ${r.axis}: ${status}`,
      link: `${origin}${r.api ?? `/api/report?subject=${encodeURIComponent(r.slug)}&axis=${encodeURIComponent(r.axis)}`}`,
      date: rfc822(r.as_of, now),
      sort: Number.isNaN(d.getTime()) ? 0 : d.getTime(),
      desc: `${measured ? "" : `UNMEASURED — ${r.reason ?? "reason not stated"}. `}${r.source_cards ?? "?"} signed source card(s); ${obligations}; ${r.rooted ? "carried by a published card root" : "NOT_YET_ROOTED"}. canonical_sha256 ${r.canonical_sha256 ?? "?"}. Measurement, not certification.`,
    };
  });
}

export function findingsItem(fi: any, origin: string, now: string): (FeedItem & { sort: number }) | null {
  const c = fi?.counts;
  if (!c || typeof c.findings !== "number") return null;
  const d = new Date(String(fi.as_of ?? ""));
  return {
    title: `Regulation-findings index: ${c.findings} findings · ${c.models} models · ${c.axes} axes · ${c.regulators} regulators`,
    link: `${origin}/signed/findings_index.json`,
    date: rfc822(fi.as_of, now),
    sort: Number.isNaN(d.getTime()) ? 0 : d.getTime(),
    desc: `Every locally verified (model × axis) card joined to its crosswalk pointers and statutory fine tier. ${typeof c.unmeasured_cells === "number" ? `${c.unmeasured_cells} of ${c.possible_cells} possible cells are unmeasured and honestly absent. ` : ""}Pointers are relevant-to, never a determination; no fine is asserted owed.`,
  };
}

export async function deriveItems(origin: string): Promise<FeedItem[]> {
  const now = new Date().toUTCString();
  const [board, index, fi] = await Promise.all([
    fetchBoardItem(origin),
    fetchJson(origin, "/reports/index.json"),
    fetchJson(origin, "/signed/findings_index.json"),
  ]);
  const derived = [...reportItems(index, origin, now)];
  const f = findingsItem(fi, origin, now);
  if (f) derived.push(f);
  if (!derived.length) {
    derived.push({
      title: "Derived items unavailable",
      link: `${origin}/api/report`,
      date: now,
      sort: 0,
      desc: "Neither /reports/index.json nor /signed/findings_index.json could be read from this deployment, so no report items are listed. Nothing is fabricated in their place.",
    });
  }
  derived.sort((a, b) => b.sort - a.sort || a.title.localeCompare(b.title));
  return [board, ...derived.slice(0, CAP).map(({ sort: _s, ...i }) => i)];
}

export const onRequestGet: PagesFunction = async (ctx) => {
  const origin = new URL(ctx.request.url).origin;
  const allItems = await deriveItems(origin);

  const items = allItems.map(
    (i) => `    <item>
      <title>${esc(i.title)}</title>
      <link>${esc(i.link)}</link>
      <pubDate>${i.date}</pubDate>
      <guid isPermaLink="false">${esc(i.link)}#${i.date.replace(/[^0-9]/g, "")}</guid>
      <description>${esc(i.desc)}</description>
    </item>`,
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Council of AI — state changes</title>
    <link>https://councilof.ai/</link>
    <description>MEASURED boards, REPORTED context, regulation-change events and corrections from the independent AI-measurement body. Measurement, not certification. Verification free forever. Derived feeds at /feeds/.</description>
    <language>en-gb</language>
    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml" />
    <atom:link href="${origin}/feeds" rel="alternate" type="text/html" />
${items}
  </channel>
</rss>`;
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=1800",
      "access-control-allow-origin": "*",
    },
  });
};
