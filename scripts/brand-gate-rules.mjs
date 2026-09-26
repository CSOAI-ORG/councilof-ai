// brand-gate-rules — the forbidden DISPLAY patterns, shared by scripts/brand-gate.mjs (rendered
// HTML + static JSON) and functions/api/corrections.served-text.test.ts (the JSON a Function serves
// and the browser renders, which the build-time gate cannot see). One list, two readers.
// Moved verbatim out of brand-gate.mjs on 2026-09-26 (staging/integration-20260926).

export const RULES = [
  {
    id: "retracted_fault_tolerance",
    pattern: /\bbyzantine\b|\bBFT\b|fault[\s-]?toleran(?:t|ce)/i,
    // The retraction itself, the ledger, the charter and the design/method notes may name it.
    allowOn: /refut|retract|ledger|counter-?canon|charter|methodolog|quorum/i,
    // …and ANY page may DISCLOSE the retraction — the point is to block the ASSERTION, not the
    // honest "this claim was retracted / is unproven". If a retraction marker sits within ~90
    // chars of the hit, it is disclosure, not a claim, and passes. ("Our 33-agent council…live
    // fault-tolerance is unproven (n_eff 1.21 of 3)" is exactly the copy we WANT to keep.)
    nearAllow: /retract|withdrawn|unproven|not\s+(?:be\s+)?fault|n_eff|correlat|no longer|is unproven|designed|theatre|effective.{0,10}vote/i,
    why: 'RETRACTED 2026-07-29 — "Byzantine/BFT/fault-tolerant" asserts the withdrawn claim (n_eff≈1.21/3). Use "designed 33-agent council" + "23/33 threshold".',
  },
  {
    id: "sovereign_brand",
    pattern: /\bsovereign\b/i,
    // "Sovereign wealth fund" is a financial instrument, not our brand. The financial axes
    // name real funds (persona-tests.json carries the Norwegian Oil Fund); a gate that
    // forced those to be renamed would falsify domain vocabulary to satisfy a branding rule.
    nearAllow: /wealth\s+fund|oil\s+fund|\bSWF\b/i,
    why: 'De-branded surface: "Sovereign" is not the product name. Use Council / Council Signal / the measurement engine.',
  },
  {
    id: "internal_codenames",
    // sov3 / sov33 / sov34 (and hyphenated variants like sov33-dist-c3), SOVOS,
    // dorado, cibola — internal names, never public. Caught live on /benchmarks
    // 2026-08-25 because this class was missing from the gate.
    pattern: /\bsovos\b|\bsov3\d*(?:-[a-z0-9-]+)?\b|\bdorado\b|\bcibola\b/i,
    why: "Internal codename on a public surface. Use the public-canon name (Council / the fine-tune's neutral description).",
  },
  {
    id: "defoneos_codename",
    // Kill standalone DEFONEOS / DEFONEOS-SEAL as product copy. Do not trip
    // measured model IDs (clan-defoneos-plain) or published MCP artifact names
    // (csoai-defoneos-mcp) — renaming those would falsify the record.
    // /status and /system may name the 2026-07-31 cross-wired deploy.
    pattern: /(?<![A-Za-z0-9-])defoneos(?:-seal)?(?![A-Za-z0-9-])/i,
    allowOn: /status|system|refut|retract|ledger|counter-?canon/i,
    why: "Internal product name. Public credential is the Ed25519-signed GSPC card.",
  },
  {
    id: "cert_overclaim",
    // No trailing \b: CamelCase-derived titles concatenate the brand ("CEASAITraining"
    // shipped on /library because \bCEASAI\b missed it — qa-sweep 2026-08-19).
    pattern: /\bCEASAI/i,
    why: 'CSOAI issues measurement credentials, not certifications. "CEASAI" is killed.',
  },
  {
    id: "framework_overclaim",
    pattern: /\b30\s+(?:regulatory\s+)?frameworks\b|\b26\s+frameworks\b|1,686\s+controls/i,
    why: '"30/26 frameworks" and "1,686 controls" are unevidenced. Live counts live at GET /api/gspc.',
  },
  {
    id: "first_card_price_imply",
    pattern: /first card.{0,24}free/i,
    why: 'Implies later cards are sold. HO.2: a grade is never sold. Say verify stays free.',
  },
  {
    id: "pricing_leak",
    // HO.2 (ruled): no pricing on any public surface — verification is free forever, a grade is
    // never sold. Two priced strings ($0.005/card on /start, $45–150/hr on /about) shipped live
    // and were caught only by the manual qa-sweep 2026-08-19. This makes it a hard build-fail:
    // a currency amount bound to a per-unit or subscription cadence is OUR pricing (distinct from
    // regulation PENALTY amounts, which read "€35M or 7%", never "/mo" or "/card").
    pattern: /(?:£|\$|€)\s?\d[\d,.]*\s?(?:[-–]\s?(?:£|\$|€)?\s?\d[\d,.]*)?(?:\/|\bper\s)(?:mo\b|month|year|yr\b|card|hr\b|hour|seat|user|assessment|report|query|call|run)/i,
    // A page may DISCLOSE the no-pricing rule ("we never charge £/$ per anything") near the hit.
    nearAllow: /free\s+forever|never\s+(?:sold|charge|priced)|no\s+pricing|not\s+for\s+sale|a\s+grade\s+is\s+never/i,
    why: 'HO.2: no pricing on public surfaces — verification is free forever, a grade is never sold. Remove the amount.',
  },
  {
    id: "internal_strategy_codename",
    pattern: /crown[\s-]?jewels?|goldmines|black swans|\bOWEM\b|\bSIGIL\b/i,
    why: "Internal strategy / codename was never for the public surface.",
  },
  {
    id: "gpai_code_signature",
    pattern: /signed the GPAI Code|GPAI Code of Practice signator|we (?:have )?signed (?:the )?GPAI Code/i,
    nearAllow: /do not sign|not a signator|we do not sign|not sign the GPAI/i,
    why: "We are not a GPAI Code signatory. Transparency CoP (detection/marking tool) only, if signed. C2PA remains planned until CR-012 is live.",
  },
  {
    id: "certify_claim",
    // Product-offer strings only. Retraction copy ("we do not certify", "never
    // certification", "we certify nothing") must keep shipping — nearAllow
    // covers those. Do not use a blanket certif* pattern: /library still lists
    // retired /how-it-works/certification paths as index text.
    // Includes "CSOAI Certified" via \bCSOAI certif (no trailing \b — CamelCase).
    pattern: /\bget certified\b|\bwe certify\b|\bcertified by CSOAI\b|\bCSOAI certif/i,
    nearAllow: /we certify nothing|do not certify|does not certify|never certify|certify nothing|not certify|no such mark|issues no certif|misrepresent.{0,40}certif|certificate shop|training record/i,
    why: 'Measurement credential, never certification. Do not offer "get certified".',
  },
  {
    id: "rank_for_sale",
    // Three paid arms only: Run/re-attest, Ledger (feed/packs), Data (corpus).
    // Verify is free. A public rank / score / grade is never the SKU.
    // Retraction ("never a purchased public rank", "can never buy a score") stays.
    pattern: /rank for sale|bought rank|buy a (?:rank|ranking|score|grade)|purchased public rank|sell(?:ing)? (?:the |a )?(?:score|rank|grade)|score for sale|paid (?:public )?rank/i,
    nearAllow: /never (?:a )?(?:bought|purchased|buy)|never (?:the |a )?(?:score|rank|grade)|never sell|do not sell|does not sell|grade is never sold|a grade is never sold|a rank is never sold|can never buy a score|nobody ranked pays|not for sale|whoever is selling/i,
    why: "Paid arms are Run/re-attest, Ledger, and Data. A rank or score is never sold. Verify is free.",
  },
  {
    id: "inspect_scorer",
    // GSPC grade is the estate harness + Ed25519 card. Inspect AI / LLM-as-judge
    // is not the scorer. Do not trip "Quality inspection", PyPI inspect-signed-receipt,
    // or honest "no LLM-as-judge" methodology copy.
    pattern: /inspect[\s_-]?(?:ai\s+)?scorer|\binspect_ai\b.{0,24}scorer|model_graded_fact|llm[\s-]?as[\s-]?judge|model[\s-]?as[\s-]?judge/i,
    nearAllow: /no llm[\s-]?as[\s-]?judge|not llm[\s-]?as[\s-]?judge|not (?:an? )?inspect|not (?:a )?model[\s-]?as[\s-]?judge|do not wrap|harness is not inspect|no `?model_graded_fact|never .{0,20}llm[\s-]?as[\s-]?judge/i,
    why: "GSPC grade is the estate harness + signed card, not Inspect / model-judge. Do not wrap a bank in Inspect model_graded_fact.",
  },
  {
    id: "false_art50_nov",
    // EUR-Lex: Art 50 applied 2 Aug 2026; some marking 2 Dec 2026; Annex III 2 Dec 2027.
    // "2 Nov 2026" / "November 2026 cliff" is a dead Digital-Omnibus rumour.
    pattern: /2\s+Nov(?:ember)?\s+2026|November 2026 cliff/i,
    nearAllow: /not 2 Nov|wrong date|EUR-Lex|2 August 2026|2 Aug 2026/i,
    why: "EUR-Lex only: Art 50 applied 2 Aug 2026; marking grace 2 Dec 2026; Annex III 2 Dec 2027. There is no 2 Nov 2026 cliff.",
  },
  {
    id: "hub_queue_stickers",
    // 2410 is the Hub queue length (all UNMEASURED). Do not ship 2410 scores/stickers.
    // Negative lookahead skips arXiv 2410.07959. nearAllow keeps the honest queue sentence.
    pattern: /\b2,?410\b(?!\.\d).{0,48}(?:sticker|badge|scores?|leaderboard|VALID cards?)|(?:sticker|badge|scores?|leaderboard).{0,48}\b2,?410\b(?!\.\d)/i,
    nearAllow: /unmeasured|named sites|hub-queue|empty stays empty|status_all|no score/i,
    why: "hub-queue is 2410 named UNMEASURED ids, not 2410 scores or stickers. Empty stays empty.",
  },
  {
    id: "measured_index_sticker",
    // C-2026-0826-05: MEASURED-INDEX-v0.1 was an over-claim. Keep the correction
    // until NEW signed cards exist. Disclosure of the withdrawn label stays.
    pattern: /MEASURED-INDEX-v0\.1/i,
    nearAllow: /over-claim|overclaim|superseded|C-2026-0826-05|withdrawn|do not restore|correction/i,
    why: "C-2026-0826-05: MEASURED-INDEX-v0.1 is withdrawn. Board GET /api/gspc is UNMEASURED until a new card. Do not restore the sticker.",
  },
  {
    id: "infra_leak",
    // Any localhost:<port>, not just 4400: prerender binds an OS-assigned port unless --port
    // is passed, so a missed canonical rewrite can now bake ANY port into the shipped HTML.
    pattern: /localhost:\d+|os\.meok\.ai|oracle-micro/i,
    why: "Infra hostname / staging origin must not ship. Use the public API councilof.ai/api/gspc.",
  },
];
