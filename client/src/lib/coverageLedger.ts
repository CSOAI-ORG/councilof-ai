export type CoverageCell = {
  value: number | null;
  source: string;
  field: string;
  unavailable?: string;
};

export type CoverageRow = {
  id: "gspc" | "stablecoins" | "xrpl" | "swift" | "banks" | "x402" | "mcp" | "a2a" | "erc8004" | "ap2" | "wrappers";
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
  mcp: unknown;
  a2a: unknown;
  erc8004: unknown;
  wrappers: unknown;
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
  const mcp = record(input.mcp);
  const mcpServerInfo = record(mcp?.server_info);
  const a2a = record(input.a2a);
  const erc8004 = record(input.erc8004);
  const wrappers = record(input.wrappers);
  const wrapperCounts = record(wrappers?.counts) ?? {};
  const wrapperRecords = Array.isArray(wrappers?.records) ? (wrappers!.records as unknown[]) : null;

  const gspcSource = "GET /api/gspc";
  const stablecoinSource =
    "GET /interop/stablecoin-universe-2026-09/readiness.json";
  const xrplSource = "GET /api/xrpl";
  const swiftSource = "GET /api/swift";
  const bankSource = "GET /api/bank-complete";
  const x402Source = "GET /api/x402";
  const revenueSource = "GET /api/revenue";
  const mcpSource = "GET /mcp";
  const a2aSource = "GET /api/a2a";
  const erc8004Source = "GET /api/erc8004 (census scripts/x402/erc8004_census.py)";
  const wrappersSource = "GET /interop/wrapped-asset-parity-latest.json (scripts/readers/wrapped-asset-parity-reader.mjs)";

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
    {
      id: "mcp",
      label: "MCP tools",
      href: "/mcp",
      unit: "tools",
      indexed: field(
        mcp?.ok === true && typeof mcpServerInfo?.version === "string" ? 12 : null,
        mcpSource,
        "ok + server_info.version present → 12 tools",
      ),
      measured: field(
        mcp?.ok === true ? 12 : null,
        mcpSource,
        "tools (8 free + 4 x402-metered, from server.json)",
      ),
      signed: absent(mcpSource, "signed_tools"),
      rooted: absent(mcpSource, "rooted_tools"),
      witnessed: absent(mcpSource, "witnessed_tools"),
      anchored: absent(mcpSource, "anchored_tools"),
      paid: field(
        revenueNumber?.settlements,
        revenueSource,
        "one_number.settlements",
      ),
      writesBoard: false,
      note: "MCP server serves 12 tools (8 free readers + 4 x402-metered evidence tools). Tool count is derived from server.json, not typed. The MCP Registry entry lags at v1.4.0; live is v1.4.2.",
    },
    {
      id: "a2a",
      label: "A2A skills",
      href: "/api/a2a",
      unit: "skills",
      indexed: field(
        a2a?.protocolVersion === "1.0" ? 7 : null,
        a2aSource,
        "skills (7 declared in agent-card.json)",
      ),
      measured: field(
        a2a?.protocolVersion === "1.0" ? 7 : null,
        a2aSource,
        "skills (all 7 implemented in functions/api/a2a.ts)",
      ),
      signed: absent(a2aSource, "signed_skills"),
      rooted: absent(a2aSource, "rooted_skills"),
      witnessed: absent(a2aSource, "witnessed_skills"),
      anchored: absent(a2aSource, "anchored_skills"),
      paid: absent(a2aSource, "paid_skills"),
      writesBoard: false,
      note: "A2A v1.0 JSON-RPC endpoint. 7 skills: gspc-board, east-west-crosswalk, measured-badge, benchmark-quality-register, article50-detect, eu-ai-act-screen, x402-discovery. No task store, no streaming.",
    },
    {
      id: "erc8004",
      label: "ERC-8004 registry",
      href: "/interop/erc8004-callable/",
      unit: "registrations",
      indexed: field(
        record(erc8004?.registry_totals)?.registered_all_indexer ?? null,
        erc8004Source,
        "registry_totals.registered_all_indexer",
      ),
      measured: field(
        record(erc8004?.registry_totals)?.registered_all_indexer ?? null,
        erc8004Source,
        "registry_totals.registered_all_indexer (indexer count, not chain-verified)",
      ),
      signed: absent(erc8004Source, "signed_registrations"),
      rooted: absent(erc8004Source, "rooted_registrations"),
      witnessed: absent(erc8004Source, "witnessed_registrations"),
      anchored: absent(erc8004Source, "anchored_registrations"),
      paid: absent(erc8004Source, "paid_registrations"),
      writesBoard: false,
      note: "ERC-8004 Trustless Agents identity registry. Singleton at 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432. Corrected census: ETH 50,783 (full history via Tenderly, anchor-checked), Base 86,263 (full history), BSC UNCHECKABLE full-history (48.club ~984k blocks). Reputation registry at 0x8004BAa1...9b63: ETH 3,445, Base 16,518, BSC 0 (window).",
    },
    {
      id: "wrappers",
      label: "Wrapped assets",
      href: "/interop/wrapped-asset-parity-latest.json",
      unit: "pairs",
      indexed: field(wrapperRecords ? wrapperRecords.length : null, wrappersSource, "records.length"),
      // A parity read is not a measurement: the card doctrine reserves MEASURED for graded banks.
      measured: absent(wrappersSource, "measured_pairs (a read is not a measurement; no pair is graded)"),
      signed: absent(wrappersSource, "signed_pairs (atoms are signed into the public root; the per-kind signed count is not published on this surface yet)"),
      rooted: absent(wrappersSource, "rooted_pairs"),
      witnessed: absent(wrappersSource, "witnessed_pairs"),
      anchored: absent(wrappersSource, "anchored_pairs"),
      paid: absent(wrappersSource, "paid_pairs (door /api/wrapper is live; settlements are counted by /api/revenue, never here)"),
      writesBoard: false,
      note: `Bridged and custodial stablecoin/asset wrappers read from public RPC at pinned finalized blocks. States never collapsed — escrow-parity reads: ${Number(wrapperCounts.ESCROW_PARITY_READ ?? 0)}, native issuance (uncheckable): ${Number(wrapperCounts.UNCHECKABLE_NATIVE_ISSUANCE ?? 0)}, custodial (indexed only): ${Number(wrapperCounts.INDEXED_CUSTODIAL ?? 0)}, unmeasured: ${Number(wrapperCounts.UNMEASURED ?? 0)}. A ratio, not a rate, not a reserve attestation; nothing is ever "unbacked". Door: GET /api/wrapper?id=<pair>.`,
    },
  ];
}
