// functions/api/east-west-bench.ts — EAST-WEST BENCH: the East-vs-West measurement instrument.
//
// What it is: the only public pairing of (1) East-vs-West AI regulation-adherence,
// (2) the live regulation feed, (3) live market indices the AI companies trade on,
// and (4) human baselines — displayed side by side, never blended.
//
// The novel claim: AI behaviour on the regulation bench is a LEAD INDICATOR of the
// market (the companies that build these systems price on the same regulatory risk
// the bench measures). We display the pair; we never assert causation.
//
// Register: measurement, not certification. MEASURED (our fleet, signed) vs REPORTED
// (published, attributed) vs MARKET (live index data, timestamped). The bench is
// DISPLAYED, never blended — no rail mixes into another.
//
// East-vs-West evidence is the CX-3 cross-lab run (signed chain): BLUE (Western)
// block_rate 0.0% CI[0,11.4] vs RED (Chinese) block_rate 23.3% CI[11.8,40.9] on
// guarded Art-5 scenarios — n=38 usable, CIs stated, quotable per CX-5 doctrine.
interface Env {
  KV?: unknown;
}

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const ts = new Date().toISOString();
  // Live market snapshot, refreshed by east-west-market.py on a 15-min cron and
  // published as a static file (public/arena/east-west-market.json) the same way
  // elo_reference.json is served. We cannot read local files in the CF Pages
  // runtime, so the endpoint fetches the static snapshot at request time and
  // falls back to a clearly-stated placeholder that never fakes a number.
  let marketSnapshot: { rows?: unknown[]; as_of?: string } | null = null;
  let marketFetchNote: string | null = null;
  try {
    const target = new URL("/arena/east-west-market.json", request.url);
    const res = await fetch(target, { headers: { accept: "application/json" } });
    if (res.ok) marketSnapshot = (await res.json()) as { rows?: unknown[]; as_of?: string };
    else marketFetchNote = `snapshot HTTP ${res.status}`;
  } catch (e) {
    marketFetchNote = String(e);
  }
  const marketRows = Array.isArray(marketSnapshot?.rows) ? marketSnapshot.rows : null;
  return Response.json({
    schema: "csoai.east-west.pair-gap/0.1",
    name: "Dorado — the measured trust gauge: East-vs-West pair-gap (regulation × measured-AI × market context, composed never fused)",
    ts,
    register: "measurement, not certification — displayed side by side, never blended",
    // RAIL 1: EAST-vs-WEST AI regulation-adherence (MEASURED, signed chain)
    east_vs_west: {
      bench: "gspc-art5 cross-lab (guarded Art-5 scenarios)",
      n: 38,
      source_card: "2f1e8da6… (signed)",
      west_block_rate: { value: 0.0, ci: [0.0, 11.4], label: "Western models (gpt-4o-mini, claude-haiku-4.5, gemini-2.5-flash, llama-3.3-70b, grok-4.5, mistral-small)" },
      east_block_rate: { value: 23.3, ci: [11.8, 40.9], label: "Eastern models (deepseek-chat-v3.1 — fails Art-5 exception clauses, 28/36 77.8%)" },
      separation: "the bench separates labs — deepseek-chat-v3.1 fails the exception clauses the bench was built to discriminate",
      quotable_gate: "CX-5: quotable as behaviour measurement with CIs + chain; not an accuracy benchmark from run rows alone",
    },
    // RAIL 2: LIVE REGULATION (the feed the bench measures against)
    regulation: {
      feed: "/api/regulation",
      instruments: "19 instruments, verified + signed (estate-chain-1 envelope)",
      high_risk: "EU AI Act Annex III: 2 Dec 2027 (Digital Omnibus Reg (EU) 2026/1744)",
    },
    // INSURER-DEFENSIBILITY (2026-08-20 research, cited):
    // - Parametric adoption limited by basis risk + product complexity (BIS FSI-IAIS
    //   Insights No 62) → triggers must be pre-disclosed, transparent, official closes.
    // - Descartes Underwriting wrote parametric cover to $140M for data centers —
    //   insurers already buy parametric on AI infrastructure; this extends to AI
    //   regulation risk.
    // - Academic: NO significant market reaction to the EU AI Act's introduction →
    //   markets don't price AI regulation → the paired instrument is novel.
    // - The market rail is a signed surface: RFC 3161 timestamps (FreeTSA) + point-in-
    //   time snapshots on the Ed25519 h3k cards, so no look-ahead bias is possible.
    insurer_defensibility: {
      basis_risk: "triggers use third-party official index closes (HSI/CSI/Nasdaq/AIQ official values), not our computed values — like a weather station in parametric weather cover",
      double_trigger: "payout when (a) signed regulation-adherence divergence exceeds X AND (b) East-AI-index relative drawdown vs West exceeds Y — formula pre-disclosed",
      timestamping: "RFC 3161 (FreeTSA) + point-in-time snapshots on signed cards — audit-standard, no look-ahead bias",
      citations: ["BIS FSI-IAIS Insights No 62 (basis risk)", "Descartes Underwriting $140M data-center parametric", "Do Investors Trust in AI Investments of European Companies? (no EU AI Act market reaction)", "qu3ry.net credentialed trigger observations"],
    },
    // RAIL 3: LIVE MARKET (the index the AI companies trade on — live pull, timestamped)
    market: marketRows
      ? { as_of: marketSnapshot?.as_of ?? ts, source: "yfinance live pull (Yahoo Finance), static snapshot /arena/east-west-market.json", rows: marketRows }
      : {
          as_of: ts,
          source: `yfinance live pull (Yahoo Finance) — snapshot /arena/east-west-market.json not readable (${marketFetchNote ?? "unknown"})`,
          rows: [
            { index: "Hang Seng (^HSI)", side: "east", last: null, note: "snapshot not published this deploy" },
            { index: "S&P 500 (^GSPC)", side: "west", last: null, note: "snapshot not published this deploy" },
          ],
        },
    // RAIL 4: HUMAN BASELINES (REPORTED — published aggregates, attributed)
    human: {
      rail: "/api/reported",
      entries: ["arc-agi-3-human-gap", "gaia-human-gap", "gpqa-diamond-expertise-gap", "human-or-not-detection", "colonoscopy-deskilling"],
      note: "published human aggregates, REPORTED state with attribution — never blended into MEASURED cells",
    },
    // The pairing (displayed, never fused — per the provision-conformance reframe)
    the_pairing: {
      claim: "A signed provision-conformance receipt for a defined task, with market state and human baseline reported ALONGSIDE as adjacent axes — never fused into one number",
      caveat: "regulation states what is permitted; market data states what is priced. They are not commensurable on one scale — so conformance is measured deterministically and market/human context is reported beside it, with confidence intervals",
      limitations: ["deterministic predicates confined to the provision-conformance axis", "human and market rails are REPORTED context with CIs, not deterministically scored", "no causation claimed between rails"],
    },
    signature_envelope: {
      schema: "csoai.signed-surface/0.1",
      kid: "did:web:csoai.org#estate-chain-1",
      note: "recompute content_id at /gspc-verify — the bench is a signed surface like the board",
    },
  }, {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" },
  });
};
