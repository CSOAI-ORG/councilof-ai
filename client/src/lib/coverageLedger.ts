export type CoverageCell = {
  value: number | null;
  source: string;
  field: string;
  unavailable?: string;
};

export type CoverageRow = {
  id: "gspc" | "stablecoins" | "xrpl" | "swift" | "banks" | "x402";
  label: string;
  href: string;
  unit: string;
  indexed: CoverageCell;
  measured: CoverageCell;
  signed: CoverageCell;
  rooted: CoverageCell;
  witnessed: CoverageCell;
  anchored: CoverageCell;
  paid: CoverageCell;
  writesBoard: boolean | null;
  note: string;
};

export type CoverageLedgerInput = {
  gspc: unknown;
  stablecoins: unknown;
  xrpl: unknown;
  swift: unknown;
  banks: unknown;
  x402: unknown;
  revenue: unknown;
};

export type CoverageSnapshot = {
  schema: "csoai.master-coverage/0.1";
  complete: boolean;
  rows: CoverageRow[];
};

const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const array = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const finite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const field = (
  value: unknown,
  source: string,
  name: string,
  unavailable = "source did not publish this stage",
): CoverageCell => {
  const parsed = finite(value);
  return parsed === null
    ? { value: null, source, field: name, unavailable }
    : { value: parsed, source, field: name };
};

const absent = (source: string, name: string): CoverageCell =>
  field(null, source, name);

function countWhere(
  values: unknown,
  predicate: (row: Record<string, unknown>) => boolean,
): number | null {
  if (!Array.isArray(values)) return null;
  return values.map(record).filter((row) => row && predicate(row)).length;
}

function bool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function isCoverageSnapshot(value: unknown): value is CoverageSnapshot {
  const snapshot = record(value);
  return (
    snapshot?.schema === "csoai.master-coverage/0.1" &&
    typeof snapshot.complete === "boolean" &&
    Array.isArray(snapshot.rows)
  );
}

/**
 * Put the estate's existing readers beside one another without upgrading any
 * discovery row into a measurement. Each cell retains the endpoint and field
 * that produced it. Null means that lifecycle stage is not published for that
 * universe; it is never rendered as zero.
 */
export function buildCoverageLedger(input: CoverageLedgerInput): CoverageRow[] {
  const gspc = record(input.gspc);
  const gspcTotals = record(gspc?.totals);
  const gspcAttestations = record(gspcTotals?.financial_run_attestations);
  const stablecoins = record(input.stablecoins);
  const stablecoinCoverage = record(stablecoins?.coverage);
  const xrpl = record(input.xrpl);
  const xrplAssets = xrpl?.assets;
  const swift = record(input.swift);
  const banks = record(input.banks);
  const bankRows = banks?.banks;
  const x402 = record(input.x402);
  const revenue = record(input.revenue);
  const revenueNumber = record(revenue?.one_number);

  const gspcSource = "GET /api/gspc";
  const stablecoinSource =
    "GET /interop/stablecoin-universe-2026-09/readiness.json";
  const xrplSource = "GET /api/xrpl";
  const swiftSource = "GET /api/swift";
  const bankSource = "GET /api/bank-complete";
  const x402Source = "GET /api/x402";
  const revenueSource = "GET /api/revenue";

  return [
    {
      id: "gspc",
      label: "GSPC axes",
      href: "/dashboard?tab=board",
      unit: "axes",
      indexed: field(gspcTotals?.axes, gspcSource, "totals.axes"),
      measured: field(
        gspcTotals?.measured_axes,
        gspcSource,
        "totals.measured_axes",
      ),
      signed: field(
        gspcAttestations?.ed25519_signed,
        gspcSource,
        "totals.financial_run_attestations.ed25519_signed",
      ),
      rooted: absent(gspcSource, "rooted_axes"),
      witnessed: absent(gspcSource, "witnessed_axes"),
      anchored: absent(gspcSource, "anchored_axes"),
      paid: absent(gspcSource, "paid_axes"),
      writesBoard: true,
      note: "The signed count is for deterministic financial runs only. Model cards and the public root are separate corpora.",
    },
    {
      id: "stablecoins",
      label: "Stablecoin universe",
      href: "/dashboard?tab=swift#stablecoins",
      unit: "assets",
      indexed: field(
        stablecoinCoverage?.indexed_assets,
        stablecoinSource,
        "coverage.indexed_assets",
      ),
      measured: field(
        stablecoinCoverage?.deeply_measured_assets,
        stablecoinSource,
        "coverage.deeply_measured_assets",
      ),
      signed: field(
        stablecoinCoverage?.asset_measurements_signed,
        stablecoinSource,
        "coverage.asset_measurements_signed",
      ),
      rooted: field(
        stablecoinCoverage?.asset_measurements_current_root_included,
        stablecoinSource,
        "coverage.asset_measurements_current_root_included",
      ),
      witnessed: field(
        stablecoinCoverage?.asset_measurements_rekor_witnessed_via_root,
        stablecoinSource,
        "coverage.asset_measurements_rekor_witnessed_via_root",
      ),
      anchored: field(
        stablecoinCoverage?.asset_measurements_bitcoin_anchored_via_current_root,
        stablecoinSource,
        "coverage.asset_measurements_bitcoin_anchored_via_current_root",
      ),
      paid: field(
        stablecoinCoverage?.asset_specific_x402_settlements_verified,
        stablecoinSource,
        "coverage.asset_specific_x402_settlements_verified",
      ),
      writesBoard: false,
      note: "The signed index commitment proves the frozen catalogue bytes. It does not measure every indexed asset.",
    },
    {
      id: "xrpl",
      label: "XRPL reader",
      href: "/dashboard?tab=xrpl",
      unit: "instruments",
      indexed: field(xrpl?.n, xrplSource, "n"),
      measured: field(
        countWhere(
          xrplAssets,
          (asset) =>
            asset.holders_state === "MEASURED" ||
            asset.supply_state === "MEASURED",
        ),
        xrplSource,
        "assets[holders_state|supply_state=MEASURED]",
      ),
      signed: field(
        countWhere(
          xrplAssets,
          (asset) =>
            typeof asset.sig_ed25519 === "string" &&
            asset.sig_ed25519.length > 0,
        ),
        xrplSource,
        "assets[sig_ed25519].length",
      ),
      rooted: absent(xrplSource, "rooted_instruments"),
      witnessed: absent(xrplSource, "witnessed_instruments"),
      anchored: absent(xrplSource, "anchored_instruments"),
      paid: absent(xrplSource, "paid_instruments"),
      writesBoard: bool(xrpl?.writes_board),
      note: "Row signatures and holder or supply measurements are separate states; the served reader fields adjudicate each count.",
    },
    {
      id: "swift",
      label: "SWIFT census",
      href: "/dashboard?tab=swift",
      unit: "institutions",
      indexed: field(swift?.n, swiftSource, "n"),
      measured: field(swift?.n_measured, swiftSource, "n_measured"),
      signed: absent(swiftSource, "signed_institutions"),
      rooted: absent(swiftSource, "rooted_institutions"),
      witnessed: absent(swiftSource, "witnessed_institutions"),
      anchored: absent(swiftSource, "anchored_institutions"),
      paid: absent(swiftSource, "paid_institutions"),
      writesBoard: bool(swift?.writes_board),
      note: "Discovered, committed and live are census rungs. Only the measured rung means a frozen-bank run.",
    },
    {
      id: "banks",
      label: "Bank readiness",
      href: "/api/bank-complete",
      unit: "banks",
      indexed: field(banks?.total_banks, bankSource, "total_banks"),
      measured: field(
        countWhere(bankRows, (bank) => bank.status === "MEASURED"),
        bankSource,
        "banks[status=MEASURED].length",
      ),
      signed: absent(bankSource, "signed_banks"),
      rooted: absent(bankSource, "rooted_banks"),
      witnessed: absent(bankSource, "witnessed_banks"),
      anchored: absent(bankSource, "anchored_banks"),
      paid: absent(bankSource, "paid_banks"),
      writesBoard: bool(banks?.writes_board),
      note: "Registry rows in DISCOVERED or UNCHECKABLE state are not measurements, customers, or partners.",
    },
    {
      id: "x402",
      label: "x402 resources",
      href: "/api/x402",
      unit: "doors",
      indexed: field(
        Array.isArray(x402?.resources) ? array(x402?.resources).length : null,
        x402Source,
        "resources.length",
      ),
      measured: absent(x402Source, "measured_resources"),
      signed: absent(x402Source, "signed_resources"),
      rooted: absent(x402Source, "rooted_resources"),
      witnessed: absent(x402Source, "witnessed_resources"),
      anchored: absent(x402Source, "anchored_resources"),
      paid: field(
        revenueNumber?.settlements,
        revenueSource,
        "one_number.settlements",
      ),
      writesBoard: false,
      note: "Paid counts only facilitator-confirmed, non-self, non-zero settlements; a listed door is not revenue.",
    },
  ];
}
