// functions/api/_skus.ts — the machine-readable SKU manifest the x402 metering reads.
//
// WHY THIS FILE (and why it is `_skus.ts`, not `public/pricing-skus.json`):
// doctrine (CLAUDE.md + BOARD-RULING.md, echoed by scripts/price-gate.mjs) is *no public
// $ prices on the site*. A price living under public/ would be served as a static asset and
// price-gate would (correctly) treat any surface that renders it as a published price. So the
// price atoms live HERE, in a Functions-only module (the leading underscore keeps it off the
// route table — it is code, never a fetchable URL, never prerendered, never scanned by
// price-gate/facts-gate which only walk dist/client HTML). Prices reach a caller in exactly one
// place: the x402 `accepts` challenge inside a 402 response (the metered rail), which is how
// x402 is *supposed* to state an amount. The free board (GET /api/gspc, /verify) never imports
// this file and never shows a number from it.
//
// EVERY PRICE HERE IS AN ESTIMATE / OWNER-DECISION. The numbers are working anchors from
// EXEC-A-REVENUE.md, not agreed list prices. Each is overridable at runtime by a Cloudflare
// env var (an owner sets the real number without a code change), and the whole manifest is
// tagged so no downstream surface can present these as settled prices.
//
// THE INVARIANT THIS FILE ENFORCES: we sell issuance, assembly, and a durable independent
// signature — never a grade, never a pass/fail, never a certificate, and the board stays free.
// assertNoSaleOfGrade() below makes "sell a grade" un-representable: a SKU cannot declare a
// `sells` value outside the allow-list, and the module throws at load if one ever does.

export const USDC_BASE = {
  // USDC on Base — the asset the estate's x402 manifest (public/.well-known/x402.json) already
  // advertises. Kept here so the atomic-unit maths (x402 `maxAmountRequired`) is done in one place.
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  network: "base",
  decimals: 6,
  symbol: "USDC",
} as const;

/** What a SKU is allowed to sell. Anything not on this list is a doctrine violation. */
export type Sellable = "issuance" | "assembly" | "independent-signature" | "throughput-and-cadence";
const ALLOWED_SELLABLES: ReadonlySet<Sellable> = new Set([
  "issuance",
  "assembly",
  "independent-signature",
  "throughput-and-cadence",
]);
/** The things doctrine forbids selling — encoded so a reviewer sees the boundary in code. */
export const NEVER_SOLD = [
  "a grade",
  "a score",
  "a pass/fail verdict",
  "a certificate of conformity",
  "verification (free forever)",
  "a place on the board",
] as const;

export type PriceBand = {
  /** Default price in USD. An ESTIMATE — never a published/list price. */
  usd: number;
  /** The honest range from EXEC-A; the point estimate above sits inside it. */
  range_usd: [number, number];
  /** Cloudflare env var an owner sets to override `usd` at runtime (no code change). */
  env_override: string;
  label: "ESTIMATE";
};

export type Sku = {
  id: string;
  name: string;
  /** Exactly what the buyer receives — the honest artifact, never an outcome. */
  artifact: string;
  /** The metered unit. Revenue is counted in these, never in seats/users. */
  unit: string;
  /** What this SKU sells. Constrained to Sellable; validated at load. */
  sells: Sellable;
  /** Price band(s). Some SKUs have more than one tier (re-serve vs fresh run). */
  prices: Record<string, PriceBand>;
  /** How settlement happens for this SKU. */
  rail: "x402" | "x402-or-invoice";
  notes: string;
};

const band = (usd: number, range: [number, number], env_override: string): PriceBand => ({
  usd,
  range_usd: range,
  env_override,
  label: "ESTIMATE",
});

// ─────────────────────────────────────────────────────────────────────────────
// The three SKUs (EXEC-A-REVENUE.md §1). All sell the WORK + the durable signature;
// the buyer can always recompute for free.
// ─────────────────────────────────────────────────────────────────────────────
export const SKUS: Record<string, Sku> = {
  // SKU-1 — Signed Measurement (ISSUANCE). Metered per signed card.
  issuance: {
    id: "issuance",
    name: "Signed Measurement (issuance)",
    artifact:
      "one cards/<sha16>.json — sha256, did:web:csoai.org#board-attestation-1, sig_ed25519, " +
      "payload, source_urls, unmeasured[], plus the proof[] inclusion path to root.json",
    unit: "1 card issued (1 subject × 1 frozen probe × 1 timestamp)",
    sells: "issuance",
    prices: {
      // The estate already ships $0.02/unit (eunomia-data.ts) — the anchor atom.
      reserve: band(0.02, [0.02, 0.1], "X402_PRICE_ISSUANCE_RESERVE_USD"),
      // A fresh model-behaviour run carries real fleet GPU cost.
      fresh_run: band(0.5, [0.5, 5.0], "X402_PRICE_ISSUANCE_FRESH_USD"),
    },
    rail: "x402",
    notes:
      "Re-serving a frozen probe is fractions of a cent (an API pull + one Ed25519 sign + a " +
      "Pages Function invocation); a fresh run is priced to cover fleet compute. Sold in metered " +
      "blocks via x402. They pay for OUR signature + Merkle anchor, not to avoid the maths.",
  },

  // SKU-2 — Compliance Evidence Bundle (PROOF). Metered per bundle.
  evidence_bundle: {
    id: "evidence_bundle",
    name: "Compliance Evidence Bundle (proof)",
    artifact:
      "a pack directory: <bench>.json + <bench>.sig.json (detached Ed25519) + " +
      "<bench>_oscal.json (OSCAL 1.1.0 assessment-results) — e.g. public/packs/eu-article-50/",
    unit: "1 bundle = 1 subject × 1 regulation-obligation × 1 recompute cycle",
    sells: "assembly",
    prices: {
      bundle: band(250, [250, 2500], "X402_PRICE_BUNDLE_USD"),
      // Quarterly drift-recompute — the renewing line.
      recompute_yr: band(1000, [1000, 8000], "PRICE_BUNDLE_RECOMPUTE_YR_USD"),
    },
    rail: "x402-or-invoice",
    notes:
      "Substitutes for an auditor line-item; unblocks a stalled procurement. Assembled from " +
      "already-signed cards + the OSCAL wrapper. Large charge: x402 for the programmatic path, " +
      "or a CSOAI LTD invoice for a first human deal (owner-decision; agent never moves funds).",
  },

  // SKU-3 — Enterprise Rail Licence. Metered per issuance/bundle, or annual band + overage.
  enterprise_rail: {
    id: "enterprise_rail",
    name: "Enterprise Rail Licence",
    artifact:
      "an x402-gated API/MCP contract over the same Functions (/api/proof, /api/issue, " +
      "/api/bundle) keyed to the licensee, returning SKU-1/SKU-2 artifacts, plus a recompute SLA",
    unit: "per-call x402 (the $0.02 atom scaled) OR an annual volume band + cadence SLA",
    sells: "throughput-and-cadence",
    prices: {
      base_yr: band(10000, [10000, 50000], "PRICE_RAIL_BASE_YR_USD"),
      // Metered overage above the band settles on the same atom.
      overage_call: band(0.02, [0.02, 0.1], "X402_PRICE_RAIL_OVERAGE_USD"),
    },
    rail: "x402-or-invoice",
    notes:
      "Licenses throughput + cadence, not an outcome. No seats-as-users; meter on " +
      "issuances/bundles. GUARDRAIL: the licence provides independent measurement of PUBLIC " +
      "artifacts; it never asserts the customer is DORA-/CRA-compliant — that stays the entity's " +
      "and its auditor's call.",
  },
};

/** The doctrine invariants, carried as data so an API surface can echo them verbatim. */
export const INVARIANTS = {
  board_is_free: "GET /api/gspc and /verify are free forever; no SKU gates them.",
  never_a_grade:
    "No SKU sells a grade, a score, a pass/fail verdict, or a certificate of conformity.",
  measurement_not_certification:
    "CSOAI is an independent measurement body (CSOAI LTD, UK 16939677). It issues measurements " +
    "and signed attestations, never certificates of conformity.",
  recomputable_for_free:
    "Every artifact a SKU delivers is independently recomputable; the buyer pays for issuance, " +
    "assembly, and a durable independent signature — not for the answer.",
  no_public_price: "These price atoms never appear on the free board; they surface only in an x402 402 challenge.",
} as const;

/**
 * assertNoSaleOfGrade — load-time guard. Makes "sell a grade" un-representable: every SKU's
 * `sells` must be on the allow-list, so no future edit can quietly add a grade-selling SKU
 * without this throwing at import (and taking every metered endpoint down with it — fail-closed
 * on doctrine, not just on payment).
 */
export function assertNoSaleOfGrade(): void {
  for (const [key, sku] of Object.entries(SKUS)) {
    if (!ALLOWED_SELLABLES.has(sku.sells)) {
      throw new Error(
        `SKU '${key}' declares sells='${sku.sells}', which is not an allowed sellable ` +
          `(${[...ALLOWED_SELLABLES].join(", ")}). A grade/score/verdict is never sold.`,
      );
    }
  }
}
assertNoSaleOfGrade();

/**
 * usdToAtomic — convert a USD price into the atomic string x402 `maxAmountRequired` expects,
 * on the assumption of a 1:1 USDC peg. Uses the asset's declared decimals. Returned as a string
 * because x402 encodes atomic amounts as decimal strings (and JS numbers cannot hold big values).
 */
export function usdToAtomic(usd: number, decimals: number = USDC_BASE.decimals): string {
  if (!Number.isFinite(usd) || usd < 0) throw new Error(`usdToAtomic: bad usd '${usd}'`);
  // Do the scaling in integer cents-of-atomic space to avoid float drift.
  const scaled = Math.round(usd * 10 ** decimals);
  return String(scaled);
}

/**
 * resolvePriceUsd — the price the metering should charge for a SKU tier, honouring an owner's
 * env override. `env[band.env_override]` (a string, as Cloudflare passes it) wins over the
 * ESTIMATE default. Unknown sku/tier throws (a caller asking for a price that does not exist is
 * a bug, not a free grant).
 */
export function resolvePriceUsd(
  skuId: string,
  tier: string,
  env: Record<string, string | undefined> = {},
): number {
  const sku = SKUS[skuId];
  if (!sku) throw new Error(`resolvePriceUsd: unknown sku '${skuId}'`);
  const b = sku.prices[tier];
  if (!b) throw new Error(`resolvePriceUsd: unknown tier '${tier}' for sku '${skuId}'`);
  const override = env[b.env_override];
  if (override != null && override !== "") {
    const n = Number(override);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return b.usd;
}
