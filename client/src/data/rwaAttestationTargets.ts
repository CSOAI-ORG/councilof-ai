/**
 * RWA attestation targets — EAT-shaped stubs from compass research (Aug 2026).
 * signing_state: unsigned. Not MEASURED. Re-verify explorer addresses before any attach.
 * Measurement, not accusation. Scores never sold. Not credit ratings.
 */

export type RwaRail = "xrpl-memo" | "xrpl-credential" | "eas-offchain" | "eas-onchain";

export type RwaAttestationTarget = {
  name: string;
  slug: string;
  chain: "xrpl" | "ethereum" | "dual";
  tier: 1 | 2 | 3;
  /** Public issuer r-address or contract — re-verify on explorer before use */
  public_id: string;
  public_artifact: string;
  estate_tool: string;
  unsigned_to_signed_play: string;
  signing_state: "unsigned";
  recommended_rail: RwaRail;
  notes: string;
};

export const RWA_EAT_DOCTRINE =
  "Permissionless pointer to a signed measurement card. Unsolicited ≠ endorsed. Mapping/attestation ≠ determination or credit rating. Scores never sold.";

export const RWA_ATTESTATION_TARGETS: RwaAttestationTarget[] = [
  {
    name: "Aviva Investors USD Liquidity Fund (tokenized)",
    slug: "aviva-usd-liquidity-xrpl",
    chain: "xrpl",
    tier: 1,
    public_id: "TBD — verify on XRPScan at attach time",
    public_artifact: "CBI-approved UCITS tokenized share class; Ripple/Licuido stack coverage",
    estate_tool: "card-issuance + ClaimGuard-row",
    unsigned_to_signed_play:
      "Freeze public regulatory/custody facts; sign measurement card; XRPL Memo hash pointer (v1). Provisional Credential only after counsel.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Highest credibility-borrow XRPL target; regulated security — measurement not rating.",
  },
  {
    name: "BlackRock BUIDL",
    slug: "blackrock-buidl",
    chain: "ethereum",
    tier: 1,
    public_id: "0x7712c34205737192402172409a8f7ccef8aa2aec",
    public_artifact: "Etherscan Securitize-deployed security token + RWA.xyz AUM pages",
    estate_tool: "card-issuance + ClaimGuard-row",
    unsigned_to_signed_play:
      "EAS off-chain attest recipient=contract with verdict_sha256; escalate on-chain EAS for marquee discoverability.",
    signing_state: "unsigned",
    recommended_rail: "eas-offchain",
    notes: "Confirm contract on Etherscan immediately before attest — lookalikes exist.",
  },
  {
    name: "Ondo OUSG",
    slug: "ondo-ousg",
    chain: "dual",
    tier: 1,
    public_id: "rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p",
    public_artifact: "XRPL issuer + Ethereum listings; JPMorgan/Mastercard settlement coverage",
    estate_tool: "arena-probe + card-issuance",
    unsigned_to_signed_play:
      "Dual-chain: Memo on XRPL + EAS off-chain on Ethereum naming the same card hash.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Stage-2 reference implementation alongside BUIDL and JMWH.",
  },
  {
    name: "Franklin Templeton BENJI",
    slug: "franklin-benji",
    chain: "ethereum",
    tier: 1,
    public_id: "0x3DDc84940Ab509C11B20B76B466933f40b750dc9",
    public_artifact: "Etherscan security token + '40 Act fund disclosures",
    estate_tool: "card-issuance + ClaimGuard-row",
    unsigned_to_signed_play: "EAS off-chain → optional on-chain for easscan.org index.",
    signing_state: "unsigned",
    recommended_rail: "eas-offchain",
    notes: "AUM figures vary by source — cite dated primary pages only.",
  },
  {
    name: "Guggenheim / Zeconomy Digital Commercial Paper",
    slug: "guggenheim-dcp-xrpl",
    chain: "xrpl",
    tier: 1,
    public_id: "TBD — verify Zeconomy issuer on XRPScan",
    public_artifact: "Public Moody's P-1 coverage + XRPL issuance pages",
    estate_tool: "ClaimGuard-row + card-issuance",
    unsigned_to_signed_play:
      "Independent measurement card beside existing P-1 — never echo Moody's number as ours.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Second opinion posture; do not imply CRA registration.",
  },
  {
    name: "Apollo ACRED",
    slug: "apollo-acred",
    chain: "ethereum",
    tier: 1,
    public_id: "0x17418038ecF73BA4026c4f428547BF099706F27B",
    public_artifact: "Etherscan + Securitize fund pages",
    estate_tool: "card-issuance",
    unsigned_to_signed_play: "EAS off-chain attestation to contract; card on OS+DSH.",
    signing_state: "unsigned",
    recommended_rail: "eas-offchain",
    notes: "Regulated feeder — measurement attestation language only.",
  },
  {
    name: "Justoken JMWH",
    slug: "justoken-jmwh",
    chain: "xrpl",
    tier: 3,
    public_id: "TBD — verify on XRPScan / RWA.xyz",
    public_artifact: "RWA.xyz represented vs distributed stats; public holder/volume figures",
    estate_tool: "corpus-feed + ClaimGuard-row",
    unsigned_to_signed_play:
      "Sign a factual represented≠distributed card from public explorer stats — demonstrative EAT, not accusation.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Flagship proof-of-why-independent-measurement; single-source investigation — prefer on-chain primary stats.",
  },
  {
    name: "RLUSD",
    slug: "ripple-rlusd",
    chain: "xrpl",
    tier: 2,
    public_id: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
    public_artifact: "XRPL issuer + NYDFS-regulated stablecoin public pages",
    estate_tool: "card-issuance",
    unsigned_to_signed_play: "Memo tagging settlement-backbone public facts; lower securities sensitivity.",
    signing_state: "unsigned",
    recommended_rail: "xrpl-memo",
    notes: "Settlement rail adjacency — still not a rating.",
  },
];

export const RWA_STAGE =
  "Stage 1: data+doctrine only. Stage 2: testnet Memo+EAS on OUSG/BUIDL/JMWH. Stage 3: mainnet top 10." as const;
