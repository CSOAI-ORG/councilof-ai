// functions/api/feed.xml — RSS 2.0 of estate state changes (watch-subscription v0.1).
//
// The retention primitive from the flywheel doctrine: a changing state you care
// about + a free, no-identity way to watch it. Zero PII (RSS stores nothing on
// the client). Items are appended here with each shipped change — the feed is
// code, so every entry rides the same review+deploy gate as the site itself.

interface FeedItem {
  title: string;
  link: string;
  date: string; // RFC 822
  desc: string;
}

const ITEMS: FeedItem[] = [
  {
    title: "Arena feed live: 2,900+ signed AI-vs-AI rounds streaming",
    link: "https://councilof.ai/api/sov-arena/rounds.jsonl",
    date: "Wed, 19 Aug 2026 09:30:00 GMT",
    desc: "The live arena evidence feed is public: NDJSON rounds with per-model scores. Honest 503 when no live state — never a fabricated round.",
  },
  {
    title: "REPORTED — the third data state, published",
    link: "https://councilof.ai/api/reported",
    date: "Wed, 19 Aug 2026 08:00:00 GMT",
    desc: "Third-party figures, cited + timestamped ('reported by source, not measured here'), unsigned, never mixed with MEASURED. Five entries at launch.",
  },
  {
    title: "The Measurement/Remediation Firewall Charter",
    link: "https://councilof.ai/firewall-charter",
    date: "Wed, 19 Aug 2026 08:00:00 GMT",
    desc: "Seven published commitments: never operate the fixer; re-measurement free and unpurchasable; ranked-never-pay; signing-key isolation; disclosed-never-preferred affiliates; engagement fills the funnel, only sealed measurement fills the board; corrections appended, never edited.",
  },
  {
    title: "Regulation-change detector live (daily)",
    link: "https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/reg-watch.mjs",
    date: "Tue, 18 Aug 2026 23:00:00 GMT",
    desc: "EU AI Act, GDPR, Machinery Reg, DPA 2018, DUAA watched at their official sources; provision-change events emitted for the recurrency loop.",
  },
  {
    title: "SITTING 1: the GSPC 14-slot board — 13 measured of 14",
    link: "https://councilof.ai/api/gspc",
    date: "Tue, 18 Aug 2026 12:00:00 GMT",
    desc: "Jail (slot 14) promoted from the signed living board: 7-model fleet, separation untested, stated honestly. 3 of 13 canonical axes carry a separated leader; ties are ties.",
  },
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const onRequestGet: PagesFunction = async () => {
  const items = ITEMS.map(
    (i) => `    <item>
      <title>${esc(i.title)}</title>
      <link>${esc(i.link)}</link>
      <pubDate>${i.date}</pubDate>
      <guid isPermaLink="false">${esc(i.link)}#${i.date.replace(/[^0-9]/g, "")}</guid>
      <description>${esc(i.desc)}</description>
    </item>`,
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Council of AI — state changes</title>
    <link>https://councilof.ai/</link>
    <description>MEASURED boards, REPORTED context, regulation-change events and corrections from the independent AI-measurement body. Measurement, not certification. Verification free forever.</description>
    <language>en-gb</language>
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
