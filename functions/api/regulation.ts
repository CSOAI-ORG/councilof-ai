// /api/regulation — the verified regulation-deadline feed (empty-chair #2).
//
// Every date verified against primary law on the stated date; every entry
// carries its legal basis. REPORTED grammar does not apply — these are
// statements OF law, cited to the instrument itself. A wrong date here is a
// corrections-ledger event: corrections are appended, never silently edited.
// Quarterly re-verification is the product promise.
//
// CC-BY-4.0. Council of AI (CSOAI Ltd, UK Companies House 16939677).

const FEED = {
  schema: "csoai.regulation-deadlines/0.1",
  verified_as_of: "2026-08-19",
  reverification_cadence: "quarterly, and on any provision-change event from the daily reg-watch detector",
  license: "CC-BY-4.0",
  publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
  corrections_policy: "appended, never edited — a wrong date here is a published correction, not a silent fix",
  headline_correction: "The EU AI Act's high-risk obligations did NOT take effect 2 August 2026: the Digital Omnibus (Reg (EU) 2026/1744, in force 27 July 2026) deferred stand-alone Annex III high-risk to 2 December 2027 and product-embedded Annex I high-risk to 2 August 2028.",
  deadlines: [
    { date: "2025-02-02", instrument: "EU AI Act", what: "Article 5 prohibited practices + Article 4 AI literacy duties in force", basis: "Reg (EU) 2024/1689 Art 113", status: "IN_FORCE" },
    { date: "2025-08-02", instrument: "EU AI Act", what: "GPAI model provider obligations (Arts 53–55) + governance rules in force", basis: "Reg (EU) 2024/1689 Art 113", status: "IN_FORCE" },
    { date: "2025-09-01", instrument: "China GB 45438-2025", what: "Mandatory AI-generated content labelling (visible + implicit metadata/watermark)", basis: "CAC/MIIT/MPS/NRTA joint measures", status: "IN_FORCE" },
    { date: "2026-01-01", instrument: "Texas TRAIGA (HB 149)", what: "Intent-based prohibitions, AG-exclusive enforcement, 60-day cure", basis: "HB 149", status: "IN_FORCE" },
    { date: "2026-01-01", instrument: "California SB 53", what: "Transparency in Frontier AI Act — large frontier developers (> $500M revenue)", basis: "Ch. 138, Statutes of 2025", status: "IN_FORCE" },
    { date: "2026-01-22", instrument: "South Korea AI Basic Act", what: "High-impact + generative AI obligations; extraterritorial representative duty; one-year fine grace", basis: "Framework Act, promulgated 2025-01-21", status: "IN_FORCE" },
    { date: "2026-08-02", instrument: "EU AI Act", what: "Article 50 transparency + full penalty/market-surveillance regime + AI Office GPAI enforcement in force (NOT high-risk — see deferral)", basis: "Reg (EU) 2024/1689 Art 113", status: "IN_FORCE" },
    { date: "2026-09-11", instrument: "EU Cyber Resilience Act", what: "Article 14 vulnerability/incident reporting live (24h early warning / 72h notification via ENISA Single Reporting Platform; covers legacy products)", basis: "Reg (EU) 2024/2847 Art 14/16", status: "UPCOMING", penalty: "up to €15M or 2.5% turnover" },
    { date: "2026-12-02", instrument: "EU AI Act Art 50(2)", what: "Marking grace ends for generative systems placed on market before 2 Aug 2026", basis: "Art 111(4), inserted by Digital Omnibus Reg (EU) 2026/1744 Art 1(39)(b)", status: "UPCOMING", penalty: "up to €15M or 3% turnover (Art 99(4)(g))" },
    { date: "2026-12-02", instrument: "EU AI Act Art 5 (new)", what: "Prohibitions on AI generating non-consensual intimate imagery and CSAM take effect", basis: "Digital Omnibus amendments", status: "UPCOMING", penalty: "up to €35M or 7% turnover" },
    { date: "2026-12-09", instrument: "EU Product Liability Directive", what: "Member-state transposition deadline — software and AI enter strict no-fault liability", basis: "Dir (EU) 2024/2853 Art 24", status: "UPCOMING" },
    { date: "2026-12-10", instrument: "Australia Privacy Act", what: "Automated-decision transparency obligation takes effect", basis: "Privacy Act amendment", status: "UPCOMING" },
    { date: "2027-01-01", instrument: "Illinois SB 315", what: "Frontier-developer disclosure statements begin (audit mandate follows 2028-01-01)", basis: "Public Act 104-0538 §18(a), §10(d)", status: "UPCOMING", penalty: "up to $1M first / $3M subsequent" },
    { date: "2027-01-01", instrument: "New York RAISE Act", what: "Frontier transparency + 72-hour incident reporting to NYDFS oversight office", basis: "S6953B/A6453B as amended 2026-03-27", status: "UPCOMING" },
    { date: "2027-01-01", instrument: "Colorado SB 26-189", what: "ADMT disclosure/transparency framework (replaces repealed SB 24-205)", basis: "SB 26-189, signed 2026-05-14", status: "UPCOMING" },
    { date: "2027-08-02", instrument: "EU AI Act", what: "Pre-Aug-2025 GPAI models must reach compliance; national regulatory-sandbox obligation", basis: "Reg (EU) 2024/1689 as amended", status: "UPCOMING" },
    { date: "2027-12-02", instrument: "EU AI Act", what: "Stand-alone Annex III HIGH-RISK obligations apply (deferred from 2 Aug 2026)", basis: "Digital Omnibus Reg (EU) 2026/1744", status: "UPCOMING" },
    { date: "2028-01-01", instrument: "Illinois SB 315", what: "Mandatory annual independent third-party audits of frontier developers — the first US audit mandate", basis: "Public Act 104-0538 §10(d)", status: "UPCOMING" },
    { date: "2028-08-02", instrument: "EU AI Act", what: "Product-embedded Annex I HIGH-RISK obligations apply (deferred from 2 Aug 2027)", basis: "Digital Omnibus Reg (EU) 2026/1744", status: "UPCOMING" },
  ],
  disputed: [
    { item: "Council of Europe Framework Convention on AI (CETS 225) entry-into-force status", note: "sources disagree as of the verification date; stated honestly rather than guessed" },
  ],
  demand_creating: ["Illinois SB 315 §10(d) audit mandate", "NY RAISE", "California SB 53", "EU CRA Article 14"],
};

export const onRequestGet: PagesFunction = async () => {
  return new Response(JSON.stringify(FEED, null, 2), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
};
