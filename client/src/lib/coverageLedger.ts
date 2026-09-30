export type CoverageCell = {
  value: number | null;
  source: string;
  field: string;
  unavailable?: string;
};

export type CoverageRow = {
  id: "gspc" | "stablecoins" | "xrpl" | "swift" | "banks" | "x402" | "mcp" | "a2a" | "erc8004" | "ap2" | "wrappers" | "bazaar";
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
  /** GET /.well-known/agent-card.json — the published A2A card whose skills[] the a2a row counts. */
  a2a_card: unknown;
  erc8004: unknown;
  wrappers: unknown;
  root_kinds: unknown;
  bazaar: unknown;
};

/**
 * Values the reader holds in its own bundle rather than fetching. `mcpTools` is the
 * MCP tool table — the same definitions `tools/list` serves (functions/mcp/gspc-tools.json
 * + paid-tools.json). Absent → the MCP row's indexed cell is null, never a typed count.
 */
export type CoverageLedgerContext = {
  mcpTools?: { free: readonly string[]; paid: readonly string[] } | null;
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
export function buildCoverageLedger(
  input: CoverageLedgerInput,
  context: CoverageLedgerContext = {},
): CoverageRow[] {
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
  const mcpPaidNames = Array.isArray(record(mcp?.paid_tools)?.names)
    ? (record(mcp?.paid_tools)!.names as unknown[])
    : null;
  const mcpTools = context.mcpTools ?? null;
  // The tool table is bundled with this deploy; GET /mcp is the running server. Count the
  // table only while the server answers, and refuse the count if the server's own paid list
  // disagrees with the table — two sources that disagree are not one number.
  const mcpTableAgrees =
    mcpTools !== null &&
    (mcpPaidNames === null ||
      (mcpPaidNames.length === mcpTools.paid.length &&
        mcpPaidNames.every((name) => mcpTools.paid.includes(String(name)))));
  const mcpToolCount =
    mcp?.ok === true && typeof mcpServerInfo?.version === "string" && mcpTools && mcpTableAgrees
      ? mcpTools.free.length + mcpTools.paid.length
      : null;
  const a2a = record(input.a2a);
  const a2aCard = record(input.a2a_card);
  const a2aSkills = Array.isArray(a2aCard?.skills) ? (a2aCard!.skills as unknown[]) : null;
  const a2aSkillIds = (a2aSkills ?? [])
    .map((skill) => record(skill)?.id)
    .filter((id): id is string => typeof id === "string");
  const erc8004 = record(input.erc8004);
  const ercTotals = record(erc8004?.registry_totals);
  const x402Count = Array.isArray(x402?.resources) ? array(x402?.resources).length : null;
  const known = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) ? String(value) : "?";
  const wrappers = record(input.wrappers);
  const rootKinds = record(input.root_kinds);
  const kindCounts = record(rootKinds?.by_kind) ?? {};
  const wrapperSigned = typeof kindCounts["csoai.wrapper.parity/0.1"] === "number" ? (kindCounts["csoai.wrapper.parity/0.1"] as number) : null;
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
  const a2aCardSource = "GET /.well-known/agent-card.json";
  // The row reads this probe file (functions/api/coverage.ts SOURCES.erc8004). There is no
  // GET /api/erc8004 on this origin — the label used to name one, and it 404s.
  const erc8004Source =
    "GET /interop/erc8004-callable/probe-registered-vs-callable-2026-09-02.json (census scripts/x402/erc8004_census.py)";
  const wrappersSource = "GET /interop/wrapped-asset-parity-latest.json (scripts/readers/wrapped-asset-parity-reader.mjs)";

  const bazaarSource = "https://huggingface.co/datasets/csoai/x402-bazaar-conformance/resolve/main/summary-latest.json";
  const bazaar = (input.bazaar && typeof input.bazaar === "object" ? (input.bazaar as Record<string, unknown>) : null);
  const bzHosts = bazaar && typeof bazaar.hosts_distinct === "number" ? (bazaar.hosts_distinct as number) : null;
  const bzHead = bazaar && bazaar.headline && typeof bazaar.headline === "object" ? (bazaar.headline as Record<string, unknown>) : null;
  const bzIdx = bazaar && bazaar.indexes && typeof bazaar.indexes === "object" ? (bazaar.indexes as Record<string, Record<string, unknown>>) : null;
  const bzNum = (v: unknown) => (typeof v === "number" ? v : null);
  const rootKindsSource = "GET /interop/root-kinds.json (scripts/publish_public_root.py kinds_index — per-kind leaves under the ONE root, regenerated every root)";

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
        x402Count,
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
        mcpToolCount,
        mcpSource,
        "tools/list definitions (functions/mcp/gspc-tools.json + paid-tools.json), counted while GET /mcp answers ok with server_info.version",
        mcpTools === null
          ? "the MCP tool table is not available to this reader"
          : !mcpTableAgrees
            ? "GET /mcp paid_tools.names disagrees with the bundled tool table"
            : "source did not publish this stage",
      ),
      measured: absent(
        mcpSource,
        "measured_tools (implemented tool count is not a measurement)",
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
      note:
        mcpToolCount !== null && mcpTools
          ? `MCP server v${String(mcpServerInfo?.version)} serves ${mcpToolCount} tools (${mcpTools.free.length} free readers + ${mcpTools.paid.length} x402-metered evidence tools), counted from the tool table tools/list serves. That is an implemented-tool index, not a measurement.`
          : "MCP tool count unavailable at this read — the row is null, not zero. That count would be an implemented-tool index, not a measurement.",
    },
    {
      id: "a2a",
      label: "A2A skills",
      href: "/api/a2a",
      unit: "skills",
      indexed: field(
        a2a?.protocolVersion === "1.0" && a2aSkills ? a2aSkills.length : null,
        a2aCardSource,
        "skills.length (counted while GET /api/a2a answers protocolVersion 1.0)",
      ),
      measured: absent(
        a2aSource,
        "measured_skills (implemented skill count is not a measurement)",
      ),
      signed: absent(a2aSource, "signed_skills"),
      rooted: absent(a2aSource, "rooted_skills"),
      witnessed: absent(a2aSource, "witnessed_skills"),
      anchored: absent(a2aSource, "anchored_skills"),
      paid: absent(a2aSource, "paid_skills"),
      writesBoard: false,
      note:
        a2a?.protocolVersion === "1.0" && a2aSkills
          ? `A2A v1.0 JSON-RPC endpoint. ${a2aSkills.length} implemented skills are indexed from the published agent card; implementation is not measurement. Skills: ${a2aSkillIds.join(", ") || "none named"}. No task store, no streaming.`
          : "A2A skill count unavailable at this read (endpoint or agent card not read) — the row is null, not zero.",
    },
    {
      id: "erc8004",
      label: "ERC-8004 registry",
      // The directory has no index on Pages (404); link the probe record this row is read from.
      href: "/interop/erc8004-callable/probe-registered-vs-callable-2026-09-02.json",
      unit: "registrations",
      indexed: field(
        ercTotals?.registered_all_indexer ?? null,
        erc8004Source,
        "registry_totals.registered_all_indexer",
      ),
      measured: absent(
        erc8004Source,
        "measured_registrations (indexer census is not a measurement)",
      ),
      signed: absent(erc8004Source, "signed_registrations"),
      rooted: absent(erc8004Source, "rooted_registrations"),
      witnessed: absent(erc8004Source, "witnessed_registrations"),
      anchored: absent(erc8004Source, "anchored_registrations"),
      paid: absent(erc8004Source, "paid_registrations"),
      writesBoard: false,
      note: erc8004
        ? `ERC-8004 Trustless Agents identity registry. The indexed total is an indexer census, not a measured or chain-verified registration count. Singleton at 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432. Probe of ${String(erc8004.indexer ?? "?")} at ${String(erc8004.probed_at ?? "?")}: ${known(ercTotals?.registered_all_indexer)} registered, ${known(ercTotals?.with_feedback_ge1)} with at least one feedback. Per-chain counts are not published by this source and are not repeated here.`
        : "ERC-8004 indexer probe unavailable at this read — the row is null, not zero.",
    },
    {
      id: "wrappers",
      label: "Wrapped assets",
      href: "/interop/wrapped-asset-parity-latest.json",
      unit: "pairs",
      indexed: field(wrapperRecords ? wrapperRecords.length : null, wrappersSource, "records.length"),
      // A parity read is not a measurement: the card doctrine reserves MEASURED for graded banks.
      measured: absent(wrappersSource, "measured_pairs (a read is not a measurement; no pair is graded)"),
      // Leaves of kind csoai.wrapper.parity/0.1 under the current root: signed AND rooted by
      // construction (a leaf enters root.json only after the board signer signed it).
      signed: field(wrapperSigned, rootKindsSource, 'by_kind["csoai.wrapper.parity/0.1"]'),
      rooted: field(wrapperSigned, rootKindsSource, 'by_kind["csoai.wrapper.parity/0.1"] (every leaf of the root is rooted)'),
      witnessed: absent(wrappersSource, "witnessed_pairs"),
      anchored: absent(wrappersSource, "anchored_pairs"),
      paid: absent(wrappersSource, "paid_pairs (door /api/wrapper is live; settlements are counted by /api/revenue, never here)"),
      writesBoard: false,
      note: `Bridged and custodial stablecoin/asset wrappers read from public RPC at pinned finalized blocks. States never collapsed — escrow-parity reads: ${known(wrapperCounts.ESCROW_PARITY_READ)}, native issuance (uncheckable): ${known(wrapperCounts.UNCHECKABLE_NATIVE_ISSUANCE)}, custodial (indexed only): ${known(wrapperCounts.INDEXED_CUSTODIAL)}, unmeasured: ${known(wrapperCounts.UNMEASURED)} ("?" = not published at this read, never 0). A ratio, not a rate, not a reserve attestation; nothing is ever "unbacked". Door: GET /api/wrapper?id=<pair>.`,
    },
    {
      id: "bazaar",
      label: "x402 Bazaars (strangers' doors)",
      href: bazaarSource,
      unit: "hosts",
      // Distinct hosts listed in either public Bazaar (Coinbase CDP + PayAI), enumerated to
      // completion by the pod's daily census — an INDEX of other people's doors, never ours.
      indexed: field(bzHosts, bazaarSource, "hosts_distinct"),
      // One GET per host and a check for 402 + PAYMENT-REQUIRED + x402Version 2 + extensions.bazaar
      // is a PROBE of conformance, not a graded measurement: the doctrine reserves MEASURED for
      // banks with n and a scorer. The conformant count lives in the note, derived, never typed.
      measured: absent(bazaarSource, "measured_hosts (a conformance probe is not a graded measurement)"),
      signed: absent(bazaarSource, "signed_hosts (the census is published, not signed; nothing about strangers' doors is a card)"),
      rooted: absent(bazaarSource, "rooted_hosts"),
      witnessed: absent(bazaarSource, "witnessed_hosts"),
      anchored: absent(bazaarSource, "anchored_hosts"),
      paid: absent(bazaarSource, "paid_hosts (the census pays nothing and settles nothing)"),
      writesBoard: false,
      note: bazaar
        ? `Daily census from the pod: ${bzNum(bazaar.hosts_probed) ?? "?"} distinct hosts probed across CDP (${bzNum(bzIdx?.cdp?.resources) ?? "?"} resources) and PayAI (${bzNum(bzIdx?.payai?.resources) ?? "?"}); ${bzNum(bzHead?.conformant) ?? "?"} answered a conformant v2 402 with a bazaar block (${bzNum(bzHead?.conformant_pct) ?? "?"}%), ${bzNum(bzHead?.unreachable) ?? "?"} unreachable; as_of ${String(bazaar.as_of ?? "?")}. Third-party doors only — our own ${known(x402Count)} doors are the x402 row. Nothing paid, nothing signed.`
        : "Daily census from the pod (csoai/x402-bazaar-conformance on Hugging Face): unavailable at this read — the row is null, not zero.",
    },
  ];
}
