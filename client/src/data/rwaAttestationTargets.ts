/**
 * RWA attestation targets — EAT-shaped stubs from compass corpus
 * (wf-67a7e7b4 … Signed Attestations on Tokenized RWAs, Aug 2026).
 *
 * signing_state: unsigned. Not MEASURED. Re-verify explorer addresses before any attach.
 * Weight corpus toward *distributed* instruments (headline XRPL RWA overstates issuer-held lines).
 * Measurement, not accusation. Scores never sold. Not credit ratings / NRSRO product.
 */

export type RwaRail = "xrpl-memo" | "xrpl-credential" | "eas-offchain" | "eas-onchain";

export type RwaAttestationTarget = {
  name: string;
  slug: string;
  chain: "xrpl" | "ethereum" | "dual" | "solana" | "adjacent";
  tier: 1 | 2 | 3;
  /** Public issuer r-address or contract — re-verify on explorer before use */
  public_id: string;
  public_artifact: string;
  estate_tool: string;
  unsigned_to_signed_play: string;
  signing_state: "unsigned";
  recommended_rail: RwaRail;
  notes: string;
  /** Optional cluster for EVM catalog breadth (not a grade) */
  cluster?: string;
};

export const RWA_EAT_DOCTRINE =
  "Permissionless pointer to a signed measurement card. Unsolicited ≠ endorsed. Mapping/attestation ≠ determination or credit rating. Scores never sold.";

/** Compass corpus framing — strategy, not MEASURED traction. */
export const RWA_CORPUS_NOTE =
  "XRPL ~42-asset registry (Blockworks Q2 2026); EVM into hundreds (Ondo Stocks 438+, Securitize 130+, Backed 60+). Independent verification is a documented gap (IOSCO FR/17/2025). Free unsolicited reference layer first; paid index/API only after third-party citation — never sell a score.";

export const RWA_ATTESTATION_TARGETS: RwaAttestationTarget[] = [
  /* ── Tier 1 — Stage-2/3 marquee ─────────────────────────────────────── */
  {
    name: "Aviva Investors USD Liquidity Fund (tokenized)",
    slug: "aviva-usd-liquidity-xrpl",
    chain: "xrpl",
    tier: 1,
    public_id: "TBD — verify on XRPScan at attach time",
    public_artifact:
      "CBI-approved Ireland UCITS tokenized share class (Jul 2026); BNY Mellon custody; Komainu digital custody; Licuido tokenization; RLUSD DvP",
    estate_tool: "card-issuance + ClaimGuard-row",
    unsigned_to_signed_play:
      "Freeze public regulatory/custody facts; sign measurement card; XRPL Memo hash pointer (v1). Provisional Credential only after counsel.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Highest credibility-borrow XRPL target; regulated security — measurement not rating. Ripple–Aviva / Licuido adjacency.",
    cluster: "xrpl-mmf",
  },
  {
    name: "BlackRock BUIDL",
    slug: "blackrock-buidl",
    chain: "ethereum",
    tier: 1,
    public_id: "0x7712c34205737192402172409a8f7ccef8aa2aec",
    public_artifact:
      "Etherscan Securitize DS Token + RWA.xyz; multi-chain (ETH/Sol/Avax/Polygon/Arb/Op/Aptos/BNB); BNY Mellon custody; PwC auditor",
    estate_tool: "card-issuance + ClaimGuard-row",
    unsigned_to_signed_play:
      "EAS off-chain attest recipient=contract with verdict_sha256; escalate on-chain EAS for marquee discoverability.",
    signing_state: "unsigned",
    recommended_rail: "eas-offchain",
    notes: "Confirm contract on Etherscan immediately before attest — lookalikes exist. Max prestige EAS recipient.",
    cluster: "securitize",
  },
  {
    name: "Ondo OUSG",
    slug: "ondo-ousg",
    chain: "dual",
    tier: 1,
    public_id: "rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p",
    public_artifact:
      "XRPScan issuer (currency OUSG) + Ethereum listings; BUIDL/FOBXX/WTGXX/ULTRA backing; RLUSD mint/redeem; QP-restricted",
    estate_tool: "arena-probe + card-issuance",
    unsigned_to_signed_play:
      "Dual-chain: Memo on XRPL + EAS off-chain on Ethereum naming the same card hash.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Stage-2 reference implementation alongside BUIDL and JMWH. Re-verify r-address on XRPScan before attach.",
    cluster: "ondo",
  },
  {
    name: "Franklin Templeton BENJI (FOBXX)",
    slug: "franklin-benji",
    chain: "ethereum",
    tier: 1,
    public_id: "0x3DDc84940Ab509C11B20B76B466933f40b750dc9",
    public_artifact: "Etherscan security token + '40 Act fund disclosures; DBS×Franklin×Ripple partnership coverage",
    estate_tool: "card-issuance + ClaimGuard-row",
    unsigned_to_signed_play: "EAS off-chain → optional on-chain for easscan.org index.",
    signing_state: "unsigned",
    recommended_rail: "eas-offchain",
    notes: "AUM figures vary by source — cite dated primary pages only.",
    cluster: "tokenized-mmf",
  },
  {
    name: "Guggenheim / Zeconomy Digital Commercial Paper",
    slug: "guggenheim-dcp-xrpl",
    chain: "xrpl",
    tier: 1,
    public_id: "TBD — verify Zeconomy / Great Bridge Capital issuer on XRPScan",
    public_artifact:
      "Public Moody's P-1 coverage + XRPL issuance pages; bankruptcy-remote SPV; QIB/QP; maturity-matched US Treasuries",
    estate_tool: "ClaimGuard-row + card-issuance",
    unsigned_to_signed_play:
      "Independent measurement card beside existing P-1 — never echo Moody's number as ours.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Second opinion posture; do not imply CRA registration. Bond-tokenization adjacency.",
    cluster: "xrpl-bonds",
  },
  {
    name: "Apollo ACRED",
    slug: "apollo-acred",
    chain: "ethereum",
    tier: 1,
    public_id: "0x17418038ecF73BA4026c4f428547BF099706F27B",
    public_artifact: "Etherscan + Securitize fund pages (Reg D feeder into Apollo Diversified Credit)",
    estate_tool: "card-issuance",
    unsigned_to_signed_play: "EAS off-chain attestation to contract; card on OS+DSH.",
    signing_state: "unsigned",
    recommended_rail: "eas-offchain",
    notes: "Regulated feeder — measurement attestation language only.",
    cluster: "securitize",
  },
  {
    name: "Archax × abrdn USD Liquidity Fund",
    slug: "archax-abrdn-mmf-xrpl",
    chain: "xrpl",
    tier: 1,
    public_id: "rKCu4CucpepQ6N89c8T5GuX2jkxzCST18Q",
    public_artifact:
      "XRPScan issuer; first tokenized MMF on XRPL (Nov 2024); FCA-regulated Archax; abrdn US Dollar Liquidity Fund (Lux)",
    estate_tool: "card-issuance + ClaimGuard-row",
    unsigned_to_signed_play: "Memo on public issuance facts; note no active on-ledger issuance if still true at attach.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Re-verify on-ledger activity on XRPScan before publish.",
    cluster: "xrpl-mmf",
  },
  {
    name: "Justoken JMWH",
    slug: "justoken-jmwh",
    chain: "xrpl",
    tier: 3,
    public_id: "TBD — verify on XRPScan / RWA.xyz",
    public_artifact:
      "Blockworks/RWA.xyz represented vs distributed stats (Q2 2026: ~$2.23B represented, issuer-held)",
    estate_tool: "corpus-feed + ClaimGuard-row",
    unsigned_to_signed_play:
      "Sign a factual represented≠distributed card from public explorer stats — demonstrative EAT, not accusation.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes:
      "Flagship proof-of-why-independent-measurement. Caveat: headline XRPL RWA overstates adoption — weight indexes to distributed value (~$386M Q2 2026).",
    cluster: "xrpl-commodities",
  },

  /* ── Tier 2 — XRPL named instruments + settlement rails ─────────────── */
  {
    name: "Ripple USD (RLUSD)",
    slug: "ripple-rlusd",
    chain: "xrpl",
    tier: 2,
    public_id: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
    public_artifact: "XRPL issuer + NYDFS limited-purpose trust pages; Deloitte reserve attestation coverage",
    estate_tool: "card-issuance",
    unsigned_to_signed_play: "Memo tagging settlement-backbone public facts; lower securities sensitivity.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Cash leg for XRPL RWA DvP — still not a rating.",
    cluster: "xrpl-stablecoins",
  },
  {
    name: "OpenEden TBILL (TBL)",
    slug: "openeden-tbill-xrpl",
    chain: "xrpl",
    tier: 2,
    public_id: "rJNE2NNz83GJYtWVLwMvchDWEon3huWnFn",
    public_artifact: "XRPScan issuer currency TBL; tokenized US T-bills; fractional unit denomination (not $1/token)",
    estate_tool: "card-issuance + ClaimGuard-row",
    unsigned_to_signed_play: "Freeze denomination/outstanding semantics from explorer; Memo hash pointer.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Treat aggregator USD conversions as approximations; cite primary explorer.",
    cluster: "xrpl-treasuries",
  },
  {
    name: "Société Générale-FORGE EURCV",
    slug: "sg-forge-eurcv",
    chain: "xrpl",
    tier: 2,
    public_id: "TBD — verify MiCA EURCV issuer on XRPScan",
    public_artifact: "SG-FORGE MiCA-licensed euro stablecoin pages; XRPL settlement asset coverage",
    estate_tool: "card-issuance",
    unsigned_to_signed_play: "Memo on public MiCA/issuer facts; counsel before EU-facing risk language.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Bank digital-bond adjacency (issuer cluster), not an issuance mandate.",
    cluster: "xrpl-stablecoins",
  },
  {
    name: "Schuman Financial EURØP",
    slug: "schuman-europ-xrpl",
    chain: "xrpl",
    tier: 2,
    public_id: "TBD — verify ACPR EMT issuer on XRPScan",
    public_artifact: "MiCA EMT; KPMG reserve audit coverage; EURØP/RLUSD Permissioned DEX pair",
    estate_tool: "card-issuance",
    unsigned_to_signed_play: "Memo on public EMT/audit facts.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Native XRPL MiCA euro stablecoin — lower securities sensitivity than funds.",
    cluster: "xrpl-stablecoins",
  },
  {
    name: "Braza Bank USDB",
    slug: "braza-usdb-xrpl",
    chain: "xrpl",
    tier: 2,
    public_id: "rB3y9EPnq1ZrZP3aXgfyfdXQThzdXMrLMc",
    public_artifact: "XRPScan issuer; USD stablecoin backed by US/Brazilian gov bonds; Braza On app",
    estate_tool: "card-issuance",
    unsigned_to_signed_play: "Memo on public issuer + outstanding from explorer.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Re-verify outstanding on XRPScan before attach.",
    cluster: "xrpl-stablecoins",
  },
  {
    name: "Braza Bank BBRL",
    slug: "braza-bbrl-xrpl",
    chain: "xrpl",
    tier: 2,
    public_id: "rH5CJsqvNqZGxrMyGaqLEoMWRYcVTAPZMt",
    public_artifact: "XRPScan issuer; BRL stablecoin; aggregator FX conversions are approximate",
    estate_tool: "card-issuance",
    unsigned_to_signed_play: "Memo with on-ledger outstanding; avoid unverified USD FX as MEASURED.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Caveat: ~$0.20/BBRL aggregator conversions — cite primary only.",
    cluster: "xrpl-stablecoins",
  },
  {
    name: "Ctrl Alt / Dubai Land Department titles",
    slug: "ctrl-alt-dld-xrpl",
    chain: "xrpl",
    tier: 2,
    public_id: "TBD — verify ARVA / ownership token issuers on XRPScan",
    public_artifact:
      "DLD + Ctrl Alt (VARA VASP) + PRYPCO Mint; Phase 1/2 public coverage; Ripple Custody",
    estate_tool: "card-issuance + ClaimGuard-row",
    unsigned_to_signed_play: "Freeze public Phase facts; Memo; counsel on real-estate ARVA framing.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Government-adjacent real estate — factual public-artifact measurement only.",
    cluster: "xrpl-realestate",
  },
  {
    name: "VanEck VBILL",
    slug: "vaneck-vbill",
    chain: "ethereum",
    tier: 2,
    public_id: "TBD — verify Securitize-deployed contract on Etherscan",
    public_artifact: "Securitize tokenized Treasury fund pages",
    estate_tool: "card-issuance",
    unsigned_to_signed_play: "EAS off-chain to verified contract.",
    signing_state: "unsigned",
    recommended_rail: "eas-offchain",
    notes: "Securitize cluster breadth — confirm address before Stage 2.",
    cluster: "securitize",
  },
  {
    name: "Ondo USDY",
    slug: "ondo-usdy",
    chain: "ethereum",
    tier: 2,
    public_id: "TBD — verify whitelist contract on Etherscan",
    public_artifact: "Ondo yield-bearing stablecoin pages; contract-level whitelist",
    estate_tool: "card-issuance + ClaimGuard-row",
    unsigned_to_signed_play: "EAS off-chain; document whitelist facts from public artifact.",
    signing_state: "unsigned",
    recommended_rail: "eas-offchain",
    notes: "Same Ondo cluster as OUSG / Ondo Stocks.",
    cluster: "ondo",
  },
  {
    name: "Superstate USTB",
    slug: "superstate-ustb",
    chain: "ethereum",
    tier: 2,
    public_id: "TBD — verify on Etherscan",
    public_artifact: "Short Duration US Government Securities Fund; managed-whitelist model",
    estate_tool: "card-issuance",
    unsigned_to_signed_play: "EAS off-chain to contract.",
    signing_state: "unsigned",
    recommended_rail: "eas-offchain",
    notes: "Institutional whitelist MMF cluster.",
    cluster: "tokenized-mmf",
  },
  {
    name: "Backed bCSPX (Core S&P 500)",
    slug: "backed-bcspx",
    chain: "ethereum",
    tier: 2,
    public_id: "TBD — verify Backed Assets (JE) tracker on Etherscan",
    public_artifact: "Backed Finance bToken/xStocks catalog; Swiss/Jersey SPV 1:1 tracker certificates",
    estate_tool: "card-issuance",
    unsigned_to_signed_play: "EAS off-chain; catalog later expands to 60+ Backed tickers.",
    signing_state: "unsigned",
    recommended_rail: "eas-offchain",
    notes: "Tokenized-equity sub-sector seed (Backed/Ondo/Dinari).",
    cluster: "backed",
  },

  /* ── Tier 3 — demonstrative / adjacent / commodity ──────────────────── */
  {
    name: "GateHub XAU (gold)",
    slug: "gatehub-xau-xrpl",
    chain: "xrpl",
    tier: 3,
    public_id: "TBD — verify GateHub XAU issuer on XRPScan",
    public_artifact: "1 gram allocated gold per token; XRPL DEX settlement; GateHub USD/EUR/GBP adjacency",
    estate_tool: "card-issuance",
    unsigned_to_signed_play: "Memo on public issuer + allocation claims from primary pages.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Commodity RWA — still factual and sourced.",
    cluster: "xrpl-commodities",
  },
  {
    name: "Ctrl Alt / Billiton diamonds (announced)",
    slug: "ctrl-alt-billiton-diamonds",
    chain: "xrpl",
    tier: 3,
    public_id: "TBD — verify if/when on-ledger",
    public_artifact: "Public announcement coverage (~$280M diamonds on XRPL alongside DLD Phase 2)",
    estate_tool: "ClaimGuard-row",
    unsigned_to_signed_play: "Only after on-ledger artifact exists; until then UNMEASURED announcement claim.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Announcement ≠ issuance — stay UNMEASURED until explorer proof.",
    cluster: "xrpl-commodities",
  },
  {
    name: "Kyobo Life government-bond settlement pilot",
    slug: "kyobo-life-xrpl-pilot",
    chain: "xrpl",
    tier: 3,
    public_id: "TBD — pilot; verify public disclosures",
    public_artifact: "South Korea Kyobo Life tokenized government-bond settlement pilot (Q2 2026 coverage)",
    estate_tool: "card-issuance",
    unsigned_to_signed_play: "Measurement of public pilot facts only; parametric/insurance adjacency note.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Insurance underwriting adjacency — not a payout oracle product in Stage 1.",
    cluster: "xrpl-bonds",
  },
  {
    name: "SBI START Bonds (ibet for Fin)",
    slug: "sbi-start-bonds",
    chain: "adjacent",
    tier: 3,
    public_id: "N/A — Osaka Digital Exchange START PTS / ibet for Fin (not native XRPL)",
    public_artifact: "SBI ¥10bn ST bond public coverage; BOOSTRY ibet; XRP rewards adjacency",
    estate_tool: "ClaimGuard-row",
    unsigned_to_signed_play: "Off-chain card only until a public DLT address exists; label chain=adjacent honestly.",
    signing_state: "unsigned",
    recommended_rail: "eas-offchain",
    notes: "XRPL-ecosystem-adjacent, not XRPL-native. Do not invent an r-address.",
    cluster: "asia-st",
  },
  {
    name: "Paxos Gold (PAXG)",
    slug: "paxos-paxg",
    chain: "ethereum",
    tier: 3,
    public_id: "TBD — verify PAXG contract on Etherscan",
    public_artifact: "Tokenized gold public pages (~$1B+ class alongside XAUT)",
    estate_tool: "card-issuance",
    unsigned_to_signed_play: "EAS off-chain to verified contract.",
    signing_state: "unsigned",
    recommended_rail: "eas-offchain",
    notes: "Commodity reference; cite primary reserve/audit pages only.",
    cluster: "tokenized-gold",
  },
  {
    name: "Hashnote USYC",
    slug: "hashnote-usyc",
    chain: "ethereum",
    tier: 3,
    public_id: "TBD — verify on Etherscan",
    public_artifact: "Institutional tokenized Treasury/money-market pages",
    estate_tool: "card-issuance",
    unsigned_to_signed_play: "EAS off-chain.",
    signing_state: "unsigned",
    recommended_rail: "eas-offchain",
    notes: "Institutional MMF cluster breadth.",
    cluster: "tokenized-mmf",
  },
];

/** Catalog clusters for later Stage-3+ breadth (not individual MEASURED rows yet). */
export const RWA_EVM_CATALOG_CLUSTERS: {
  id: string;
  label: string;
  approx_instruments: string;
  note: string;
}[] = [
  {
    id: "ondo-stocks",
    label: "Ondo Stocks",
    approx_instruments: "438+ tokenized US stocks/ETFs (ETH/Sol/BNB)",
    note: "Enumerate by ticker/chain; full contract-hash list not in one public registry — Stage 3+ after counsel.",
  },
  {
    id: "securitize",
    label: "Securitize DS Tokens",
    approx_instruments: "130+ tokens; $4.6B+ administered",
    note: "Includes BUIDL, ACRED, VBILL, Hamilton Lane, KKR feeders — expand per verified contract.",
  },
  {
    id: "backed",
    label: "Backed Finance bTokens / xStocks",
    approx_instruments: "60+ equities/ETFs",
    note: "Seed row: bCSPX. Multi-chain + CCIP — verify chain-specific addresses at attach.",
  },
  {
    id: "private-credit",
    label: "Private credit (Centrifuge / Maple / Goldfinch / Clearpool)",
    approx_instruments: "protocol pools (variable)",
    note: "Protocol-level KYC — permissionless attest still possible on public pool contracts.",
  },
];

export const RWA_STAGE =
  "Stage 1: data+doctrine only (no mainnet attach). Stage 2: testnet Memo+EAS on OUSG/BUIDL/JMWH. Stage 3: mainnet top 10 + catalog breadth. GTM: free reference layer → cited source → paid index/API (scores never sold)." as const;

export const RWA_STAGE2_REFS = ["ondo-ousg", "blackrock-buidl", "justoken-jmwh"] as const;
