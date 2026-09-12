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
    title: "Mill receipts: signature, lifecycle and regulation states separated",
    link: "https://councilof.ai/interop/mill-receipt-readiness.json",
    date: "Fri, 11 Sep 2026 10:50:00 GMT",
    desc: "Production readback verifies 36 of 36 outer Ed25519 signatures. All 36 inner records still declare STAGED_UNSIGNED. Five carry direct regulation links and 31 are unlinked; unlinked records have no regulation score. These are independent states, not one pass label.",
  },
  {
    title: "Stablecoin estate: 425 indexed is not 425 measured",
    link: "https://councilof.ai/interop/stablecoin-universe-2026-09/readiness.json",
    date: "Fri, 11 Sep 2026 09:45:00 GMT",
    desc: "The frozen index contains 425 assets, 1,640 asset-chain entries and 211 reported chains. One asset has independent measurement evidence and 424 do not. Asset-specific A2A, MCP, x402 and settlement coverage remain zero; generic protocol doors are reported separately.",
  },
  {
    title: "GSPC board: 22 axis · 22 measured — living lock (after #1077)",
    link: "https://councilof.ai/api/gspc",
    date: "Tue, 01 Sep 2026 17:21:00 GMT",
    desc: "Live board is 22 axis · 22 measured · 0 empty. Cite totals.public_count from GET /api/gspc. #1077 restored all eight financial/domain deterministic-facts runs after the #1074 15/7 regression. Historical RSS items below keep their sitting-day wording; counts typed there are superseded by the live board.",
  },
  {
    title: "GSPC board: 22 axis · 15 measured — historical sitting-day (28 Aug)",
    link: "https://councilof.ai/api/gspc",
    date: "Thu, 28 Aug 2026 04:55:00 GMT",
    desc: "Sitting-day wording for 28 Aug 2026: board then derived 22 axis · 15 measured · 7 empty. Superseded by the live board — cite totals.public_count from GET /api/gspc (now 22 axis · 22 measured).",
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
    title: "Correction: swarm point leader retained; separation claim withdrawn",
    link: "https://councilof.ai/api/gspc",
    date: "Sat, 12 Sep 2026 09:00:00 GMT",
    desc: "The signed wave-2b candidate cards support qwen2.5:7b as the point leader (0.4444), followed by qwen3:4b (0.4070). They do not publish paired rows or compatible intervals, so the earlier SEPARATED claim is withdrawn and the live axis is UNTESTED for separation. Measurement remains; unsupported statistical certainty does not.",
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
