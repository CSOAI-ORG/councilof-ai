/**
 * External SOV / revenue / XRPL / T-REX form — audit against live truth.
 *
 * An outside brief (2026-08-30) mapped three commercial arms onto Council.
 * Keep the map. Do not keep its stale board counts, public seat prices,
 * fused investable index, Council-minted bonds, or “300+ MCP servers are
 * this product.” Living board: GET /api/gspc — 22 axis · 15 measured.
 */

export type AuditVerdict = "keep" | "stale" | "false" | "forbidden";

export type AuditClaim = {
  id: string;
  claim: string;
  verdict: AuditVerdict;
  live: string;
};

export const SOV_AUDIT_RULING =
  "Use the external form as a map of arms. The living board, the four SKUs and the fill path decide what is true.";

export const SOV_AUDIT_SOURCE = {
  title: "SOV unified architecture — revenue, XRPL, T-REX",
  dated: "2026-08-30",
  role: "External brief. Not a signed card. Not GET /api/gspc.",
} as const;

export const LIVE_PIN = {
  board_schema: "csoai.gspc-axes/0.5",
  public_count: "22 axis · 15 measured",
  axes: 22,
  measured_axes: 15,
  items: 893,
  corrections: 30,
  index_schema: "csoai.sov-signal-index/1",
  index_rows: 15,
  index_not_certification: true,
  issuer: "CSOAI Ltd UK 16939677",
  hf_user: "csoai",
  hf_datasets_listed: 76,
  hf_spaces_listed: 34,
  board_dataset: "csoai/gspc-board",
  boards_alias_note:
    "csoai/gspc-boards exists as a separate benchmark-register tree. It is not the living board mirror.",
  mcp_planted: "board_totals · get_axis · verify_card · list_cards · get_root · get_card · verify_inclusion",
  x402: "csoai.x402/0.1 — pay for pack assembly. The board stays free. Public card does not carry a payTo.",
} as const;

export const SOV_AUDIT_CLAIMS: AuditClaim[] = [
  {
    id: "one-cell-many-views",
    claim: "One signed measurement can feed measurement, data and digest-anchor views.",
    verdict: "keep",
    live: "Already the fill path. Nothing downstream writes MEASURED.",
  },
  {
    id: "four-skus",
    claim: "Commercial doors are verify, run / re-attest, ledger and data.",
    verdict: "keep",
    live: "/products. GPAI, RAS, academy and financial are modules, not a fifth SKU.",
  },
  {
    id: "verify-free",
    claim: "Signed cards verify offline. No login. did:web:csoai.org is the pin.",
    verdict: "keep",
    live: "/gspc-verify and pin did:web:csoai.org#card-attestation-1.",
  },
  {
    id: "corrections-append",
    claim: "The corrections ledger is public, append-only and never silently edited.",
    verdict: "keep",
    live: "GET /api/corrections — 30 entries. Honesty asset, not a score.",
  },
  {
    id: "dr-0007",
    claim: "A retracted consensus claim is a credibility asset, not a product to revive.",
    verdict: "keep",
    live: "Do not put the withdrawn 33-agent council back on a public door.",
  },
  {
    id: "xrpl-devnet",
    claim: "XRPL attestation exists as a DEVNET pointer: memo + XLS-70 URI at a card index.",
    verdict: "stale",
    live: "/xrpl-attest is a /root.json reader. GET /api/xrpl 200 n=16, writes_board false. Historical DEVNET hashes are not this feed. Not a grade.",
  },
  {
    id: "no-mainnet-grade",
    claim: "There is no XRPL mainnet attestation that writes MEASURED.",
    verdict: "keep",
    live: "True gap. No mainnet attestation writes MEASURED. Historical DEVNET hashes only. Do not close it by inventing an issuer account.",
  },
  {
    id: "trex-absent-issuer",
    claim: "There is no live T-REX / ERC-3643 token CSOAI issues.",
    verdict: "keep",
    live: "Planned later role is partner attester of a digest we already signed. Never issuer.",
  },
  {
    id: "no-sov-token",
    claim: "There is no tradable SOV index token and no release-bond product.",
    verdict: "keep",
    live: "csoai.sov-signal-index/1 counts 15 signed rows. not_a_certification: true.",
  },
  {
    id: "x402-assembly",
    claim: "Agents may pay to assemble a pack. Payment never buys a score.",
    verdict: "keep",
    live: "csoai.x402/0.1. paid_for: assembly. not: score, certificate, pay-to-pass.",
  },
  {
    id: "insurance-enquiry",
    claim: "Insurers and procurement can licence a pack or a data feed.",
    verdict: "keep",
    live: "RAS / Ledger / Data on enquiry. We do not underwrite or price a coupon.",
  },
  {
    id: "hf-record",
    claim: "Hugging Face is the public signing record, not one CSOAI repo per model.",
    verdict: "keep",
    live: "User csoai: 76 listed datasets, 34 Spaces, collection and gspc-board already planted.",
  },
  {
    id: "stale-board-counts",
    claim: "13 measured axes, 14-slot instrument, 818 items, 7-model fleet.",
    verdict: "stale",
    live: "GET /api/gspc: 22 axis · 15 measured · 893 items. Quote the living board.",
  },
  {
    id: "six-axis",
    claim: "Six-axis benchmarks are the published GSPC product.",
    verdict: "stale",
    live: "15 measured instruments. Jail is the MEASURED floor, not a sixth-axis brand.",
  },
  {
    id: "no-hf-org",
    claim: "No Hugging Face organisation, Spaces or model cards exist.",
    verdict: "false",
    live: "csoai exists. gspc-board, verify, flywheel, east-west, council-os and banks are planted. gspc-boards is a different register, not the living board.",
  },
  {
    id: "mcp-three-hundred",
    claim: "The planted GSPC product is a suite of hundreds of MCP servers.",
    verdict: "false",
    live: "Official registry io.github.CSOAI-ORG/gspc. HTTP /mcp is seven read tools. Extra catalogues are not this product.",
  },
  {
    id: "iso-42001",
    claim: "ISO 42001 is a live Council conformity product.",
    verdict: "false",
    live: "We measure. We are not a notified body and we do not sell ISO 42001.",
  },
  {
    id: "bft-product",
    claim: "A designed 33-agent council is a live public product.",
    verdict: "false",
    live: "Retracted. Do not rebuild it as a door or a grade.",
  },
  {
    id: "seat-prices",
    claim: "Public metrology seat prices belong on the site and in partner letters.",
    verdict: "forbidden",
    live: "A rank is never sold. Verify is free. Paid SKUs stay on enquiry.",
  },
  {
    id: "fused-sov-token",
    claim: "Average GSPC scores, compliance rates and discovery into a tradable SOV token.",
    verdict: "forbidden",
    live: "The coverage index counts rows. It never predicts, never coupons, never fuses a grade.",
  },
  {
    id: "release-bond-oracle",
    claim: "Council issues release bonds whose coupon depends on a GSPC score threshold.",
    verdict: "forbidden",
    live: "A relying party may price their own contract against a pack. We do not issue securities.",
  },
  {
    id: "onchain-measured",
    claim: "A Solidity or XRPL write can become the MEASURED record.",
    verdict: "forbidden",
    live: "Only a signed GSPC cell writes MEASURED. Chains may later point at a digest.",
  },
  {
    id: "art50-credential",
    claim: "Mint an EU-AI-Act-compliant or Article 50-marked on-ledger credential from a run.",
    verdict: "forbidden",
    live: "A GSPC-M run is not an Article 50 audit. Unknown stays unknown.",
  },
  {
    id: "invented-issuer",
    claim: "Stand up a public XRPL issuer account and start mainnet credentials this week.",
    verdict: "forbidden",
    live: "This VM has no custody keys. Do not invent a receiver or a payTo.",
  },
];

export const KEEP_ARMS = [
  {
    id: "arm-measure",
    title: "Arm 1 — measurement and re-attest",
    maps: "Verify + Run. Signed cells. Get measured is the lead.",
  },
  {
    id: "arm-intel",
    title: "Arm 2 — packs and data",
    maps: "Ledger + Data + RAS / GPAI modules. Enquiry. Licensed traces, never a purchased rank.",
  },
  {
    id: "arm-anchor",
    title: "Arm 3 — optional digest anchors",
    maps: "XRPL public-root reader now (/root.json + /api/xrpl n=16). T-REX attester later, with a live partner issuer. Never a Council-minted token.",
  },
] as const;

export function claimsByVerdict(verdict: AuditVerdict): AuditClaim[] {
  return SOV_AUDIT_CLAIMS.filter((c) => c.verdict === verdict);
}

export function keepCount(): number {
  return claimsByVerdict("keep").length;
}
