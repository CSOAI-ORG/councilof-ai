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
    title: "GSPC board: 14 measured of 14 quotable — jail separation MEASURED (TIE)",
    link: "https://councilof.ai/api/gspc",
    date: "Tue, 25 Aug 2026 17:10:00 GMT",
    desc: "Live public_count is now 14 measured of 14 quotable. Jail status MEASURED; separation TIE (n=71); untested_separations=0. Cite live totals.public_count — do not invent 22 axes. Historical RSS items below keep their sitting-day wording.",
  },
  {
    title: "The carder is live: deterministic fact-cards, and it caught us first",
    link: "https://github.com/CSOAI-ORG/carder",
    date: "Wed, 19 Aug 2026 13:30:00 GMT",
    desc: "One engine, four valves (datasets / benchmarks / leaderboards / models). Pilot on our own 29 datasets found 14 missing machine-readable licences and near-empty cards — all fixed same day, verified by re-card: 29/29 GREEN. Valve 2 then flagged our own repos' missing LICENSE files and the board API's missing licence field — also fixed same day. Right-of-reply pipeline shipped: no third-party card publishes without a token. Own assets first, always.",
  },
  {
    title: "/insurers — the evidence pack an underwriter can verify",
    link: "https://councilof.ai/insurers",
    date: "Wed, 19 Aug 2026 12:00:00 GMT",
    desc: "Card anatomy, offline curl verification, severity tails (CVaR@5% where n≥100), drift via reg-watch, and the honesty gate. No pricing; verification free forever.",
  },
  {
    title: "Verify one record, in your browser, with a shareable permalink",
    link: "https://councilof.ai/gspc-verify",
    date: "Wed, 19 Aug 2026 12:30:00 GMT",
    desc: "Paste any estate record: content_id recomputed (both envelope generations), Ed25519 checked against the published did.json keys via WebCrypto. Tested against a real card (PASS) and a tampered copy (FAIL). Unsigned records get an honest 'hash checked only' — never a fake pass.",
  },
  {
    title: "Swarm ungated: the first CI-resolved ordering on the swarm axis",
    link: "https://councilof.ai/api/gspc",
    date: "Tue, 19 Aug 2026 11:30:00 GMT",
    desc: "Owner ruling 19 Aug 2026: the wave-2b bank (37 independent items, 5-model fleet, n≥36/cell) resolves the swarm ordering — qwen2.5:7b's 95% lower bound (0.384) clears the runner-up's upper bound (0.372). Separated leads: 4 of 14. The retired PROTOCOL bank stays in the record as the honesty-clause example. Jail remains the board's only untested separation, so the public count stays 13 measured of 14.",
  },
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
