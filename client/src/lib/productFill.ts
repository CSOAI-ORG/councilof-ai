/**
 * How every SKU is filled — one signed cell, many views.
 *
 * Plugins, GPAI packs, RAS, XRPL pointers, ERC-3643 (T-REX) attester feeds and
 * OpenTelemetry spans do not average into a fused “SOV grade.” The coverage
 * index counts signed rows. The corrections ledger is HTTP and append-only.
 * XRPL may later anchor a digest. None of those writes MEASURED.
 */

export type FillLayer =
  | "cell"
  | "pack"
  | "index"
  | "ledger"
  | "anchor"
  | "telemetry"
  | "forbidden";

export type FillRow = {
  id: string;
  layer: FillLayer;
  title: string;
  fills: string;
  never: string;
  href: string;
  status: "live" | "enquiry" | "devnet" | "gated" | "do-not";
};

export const FILL_RULING =
  "One signed GSPC cell fills every product by view. Nothing downstream writes MEASURED.";

export const FILL_PIPELINE = [
  "Signed cell — subject digest × axis × instrument × n. The only MEASURED write.",
  "Pack — GPAI / RAS / insurer four-class assembly of cells, omissions and a corrections excerpt.",
  "Coverage index — N measured of M declared slots. Counts rows. Never predicts. Never a fused grade.",
  "Corrections ledger — GET /api/corrections. Append-only facts about our history, not a score.",
  "Optional digest anchor — XRPL memo / XLS-70 after custody and mainnet proof. Pointer, not a grade.",
  "Optional attester feed — ERC-3643 / T-REX partner role, never issuer, never a bond we mint.",
  "Optional harness spans — OpenTelemetry of our workers. Debug and cost. Not a partner trace. Not a grade.",
] as const;

export const FILL_ROWS: FillRow[] = [
  {
    id: "verify",
    layer: "cell",
    title: "Verify",
    fills: "The signed card. Browser WebCrypto. Free forever.",
    never: "A certificate. An upload. A login.",
    href: "/gspc-verify",
    status: "live",
  },
  {
    id: "run",
    layer: "cell",
    title: "Run / re-attest",
    fills: "Another cell when the subject or the instrument moves. Get measured is the lead.",
    never: "A purchased public rank.",
    href: "/assess",
    status: "enquiry",
  },
  {
    id: "gpai",
    layer: "pack",
    title: "GPAI evidence pack",
    fills: "The same cells plus documentation triage (marking, training-data summary, GPAI status). Unknown stays unknown.",
    never: "A conformity mark. An Article 50 compliance stamp. Automatic remediation.",
    href: "/gpai-evidence",
    status: "enquiry",
  },
  {
    id: "ras",
    layer: "pack",
    title: "Risk assurance / insurer pack",
    fills: "Four-class mapping: transparency, lineage, active controls, named owners. Baseline for someone else’s SLA.",
    never: "A parametric trigger. An underwrite. A share of anything written on a card.",
    href: "/api/evidence-pack",
    status: "enquiry",
  },
  {
    id: "ledger-sku",
    layer: "pack",
    title: "Ledger SKU",
    fills: "Signed evidence feed and packs for insurers and procurement.",
    never: "A purchased public rank.",
    href: "/contact?arm=ledger",
    status: "enquiry",
  },
  {
    id: "data-sku",
    layer: "pack",
    title: "Data SKU",
    fills: "Licensed traces, preference pairs, incident rows.",
    never: "A score. A vendor can buy data and cannot buy a grade.",
    href: "/contact?arm=data",
    status: "enquiry",
  },
  {
    id: "coverage-index",
    layer: "index",
    title: "Coverage index",
    fills: "N measured of M declared slots. Machine schema csoai.sov-signal-index/1 already published as a row count.",
    never: "A fused SOV grade. A forecast. An investable index. A bond coupon.",
    href: "/signals/sov-signal.signed.json",
    status: "live",
  },
  {
    id: "corrections",
    layer: "ledger",
    title: "Corrections ledger",
    fills: "What we got wrong, how it was caught, the dated fix. The uncopyable honesty asset.",
    never: "A GSPC score. An XRPL product. A highlight reel.",
    href: "/api/corrections",
    status: "live",
  },
  {
    id: "xrpl",
    layer: "anchor",
    title: "XRPL digest pointer",
    fills: "DEVNET Payment memo + XLS-70 CredentialCreate pointing at a published card index.",
    never: "A GSPC grade. A bond. A rating. A market. MEASURED.",
    href: "/xrpl-attest",
    status: "devnet",
  },
  {
    id: "trex",
    layer: "anchor",
    title: "ERC-3643 / T-REX attester",
    fills: "Partner attester feed of a digest we already signed. Planned once a live issuer exists.",
    never: "Issuer. Release bond. Security we mint. MEASURED.",
    href: "/distribution-integrity",
    status: "gated",
  },
  {
    id: "otel",
    layer: "telemetry",
    title: "OpenTelemetry harness spans",
    fills: "Spans of our own workers: load, parse, cost, retry. Debug the funnel.",
    never: "Partner traces on the home page. A bank score. MEASURED.",
    href: "/harness",
    status: "gated",
  },
  {
    id: "plugin",
    layer: "cell",
    title: "GSPC plugin / MCP",
    fills: "Reads the public board: board_totals, get_axis, verify_card, list_cards.",
    never: "A 23rd axis. Chat harvest. A feed of new scores into the coverage index.",
    href: "/tools",
    status: "live",
  },
  {
    id: "fused-sov",
    layer: "forbidden",
    title: "Fused SOV grade from all plugins",
    fills: "Nothing. Plugins do not emit scores. Cells stay per-axis.",
    never: "Average, Elo, or coupon from every plugin and every site.",
    href: "/api/gspc",
    status: "do-not",
  },
  {
    id: "release-bond",
    layer: "forbidden",
    title: "Release / performance bond from a GSPC score",
    fills: "Nothing. We do not issue securities. A relying party may price their own contract against a pack.",
    never: "Council as issuer, underwriter, or coupon oracle.",
    href: "/insurers",
    status: "do-not",
  },
];

export function fillByLayer(layer: FillLayer): FillRow[] {
  return FILL_ROWS.filter((r) => r.layer === layer);
}

export function fillSkuIds(): string[] {
  return FILL_ROWS.filter((r) => ["verify", "run", "ledger-sku", "data-sku"].includes(r.id)).map((r) => r.id);
}
