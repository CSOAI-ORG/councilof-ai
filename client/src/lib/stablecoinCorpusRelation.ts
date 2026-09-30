/**
 * The three stablecoin figures this site publishes, kept apart (corpus_relation).
 *
 *   readiness    public/interop/stablecoin-universe-2026-09/readiness.json
 *                assets in the frozen discovery index that carry asset-level measurement evidence
 *   supply read  public/interop/stablecoin-corpus-index-2026-09-16.json
 *                assets of the same frozen universe with at least one deployment whose on-chain supply
 *                figure was read at a named block — one dated read, not refreshed since
 *   parity       /api/xl — the newest signed cross-ledger daily record (csoai/cross-ledger-supply)
 *                a daily selection of assets whose issuer-published deployment list was compared with
 *                what each ledger answered, one state per asset
 *
 * Different populations, different dates, different units. They are never added, never reconciled
 * and never substituted for one another. Every number is read from its own file when the page loads;
 * nothing here types a figure, and nothing here combines two of them into one.
 */
import { loadStablecoinReadinessOnce, type StablecoinReadiness } from "@/lib/stablecoinReadiness";

export const READINESS_URL = "/interop/stablecoin-universe-2026-09/readiness.json";
export const SUPPLY_INDEX_URL = "/interop/stablecoin-corpus-index-2026-09-16.json";
export const XL_URL = "/api/xl";
export const XL_SIGNED_URL = "/api/xl?part=signed";
export const XL_DATASET_URL = "https://huggingface.co/datasets/csoai/cross-ledger-supply/tree/main/xl-daily";
export const XL_SCHEMA = "csoai.cross-ledger-xl-daily/0.1";
export const SUPPLY_INDEX_SCHEMA = "csoai.stablecoin-corpus-index/0.1";

/** The relation itself: static, so it is on the page even when a figure cannot be read. */
export const CORPUS_RELATION = {
  relation: "SEPARATE_CORPORA",
  corpora: ["readiness", "supply_read", "parity"],
  never: ["added together", "reconciled", "substituted for one another"],
  why: "Each figure counts a different population, on a different date, in a different unit. A sum or a difference of two of them has no meaning, and a figure from one is never quoted as another.",
} as const;

/**
 * HELD — owner-gated (next-level plan 2026-09-28, owner decision 6: "the three named stablecoin
 * determinations. Approve the vocabulary."). When the owner names them, set the three public names here
 * (and the test that pins this to null); each card then shows its name. Until then the page uses only
 * state words that are already public (CONSISTENT, INCONSISTENT, UNCHECKABLE, UNMEASURED).
 */
export const DETERMINATION_NAMES: Readonly<Record<(typeof CORPUS_RELATION.corpora)[number], string>> | null = null;

/** The same words the entity pages use for these states (functions/_lib/reach/core.ts STATE_MEANING). */
export const PARITY_MEANING: Record<string, string> = {
  CONSISTENT: "every public statement read agrees with what was observed",
  INCONSISTENT: "two public statements disagree; this does not say which one is true",
  UNCHECKABLE: "a comparison was attempted but could not be made",
  UNMEASURED: "not measured by the records this page reads",
};
const PARITY_ORDER = ["CONSISTENT", "INCONSISTENT", "UNCHECKABLE"];

export type Tally = { state: string; n: number }[];

export type ReadinessFigure = { as_of: string; indexed_assets: number; measured_assets: number; source: string };
export type SupplyReadFigure = {
  as_of: string;
  universe_assets: number;
  assets_read: number;
  by_reader: { reader: string; assets: number }[];
  disjointness: string;
  not_a_supply_total: string;
  source: string;
};
export type ParityFigure = { date: string; as_of: string; assets: number; states: Tally; source: string };

export type XlRecord = {
  schema: typeof XL_SCHEMA;
  date: string;
  as_of: string;
  what_this_is?: string;
  measurement_only?: string;
  selection?: { frame_n?: number; quintile?: number; k?: number; selected?: { why?: string }[] };
  assets: Record<string, { asset?: string; issuer?: string; deployments_listed?: number; deployments_read?: number }>;
  deployments: { evidence_kind?: string }[];
  parity: { asset_states: Record<string, string> };
  unmeasured_selected?: unknown[];
  uncheckable?: unknown[];
  evidence_kind_legend?: Record<string, string>;
  consensus_check?: Record<string, string>;
  changes?: {
    state?: string;
    previous?: { date?: string };
    membership?: Record<string, unknown[]>;
  };
};
export type LoadedXl = { record: XlRecord; sha256: string | null; signature: string | null; version: string | null };

const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const obj = (x: unknown): Record<string, unknown> | null => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : null);

/** Count a list of state names, in `order` (default: the three parity states), then any other name A-Z. */
export function tally(names: string[], order: readonly string[] = PARITY_ORDER): Tally {
  const m = new Map<string, number>();
  for (const n of names) m.set(n, (m.get(n) ?? 0) + 1);
  const pos = (s: string) => (order.includes(s) ? order.indexOf(s) : order.length);
  return [...m.entries()].map(([state, n]) => ({ state, n })).sort((a, b) => pos(a.state) - pos(b.state) || a.state.localeCompare(b.state));
}

export function readinessFigure(r: StablecoinReadiness): ReadinessFigure {
  return { as_of: r.as_of, indexed_assets: r.coverage.indexed_assets, measured_assets: r.coverage.deeply_measured_assets, source: READINESS_URL };
}

export function supplyReadFigure(value: unknown): SupplyReadFigure {
  const j = obj(value);
  if (!j || j.schema !== SUPPLY_INDEX_SCHEMA) throw new Error("supply-read index contract invalid");
  const readers = obj(j.by_reader) ?? {};
  const by_reader = Object.entries(readers)
    .map(([reader, v]) => ({ reader, assets: obj(v)?.measured_assets }))
    .filter((x): x is { reader: string; assets: number } => isNum(x.assets));
  const disj = obj(j.disjointness_checked);
  if (!isNum(j.universe_asset_count) || !isNum(j.assets_with_at_least_one_measured_deployment) || typeof j.as_of !== "string")
    throw new Error("supply-read index contract invalid");
  return {
    as_of: j.as_of,
    universe_assets: j.universe_asset_count,
    assets_read: j.assets_with_at_least_one_measured_deployment,
    by_reader,
    disjointness: typeof disj?.result === "string" ? disj.result : "UNCHECKED",
    not_a_supply_total: typeof j.not_a_supply_total === "string" ? j.not_a_supply_total : "",
    source: SUPPLY_INDEX_URL,
  };
}

export function isXlRecord(value: unknown): value is XlRecord {
  const j = obj(value);
  return !!j && j.schema === XL_SCHEMA && typeof j.date === "string" && typeof j.as_of === "string" &&
    !!obj(j.assets) && Array.isArray(j.deployments) && !!obj(obj(j.parity)?.asset_states);
}

export function parityFigure(x: XlRecord): ParityFigure {
  const states = Object.values(x.parity.asset_states);
  return { date: x.date, as_of: x.as_of, assets: states.length, states: tally(states), source: XL_URL };
}

/** What the cross-ledger section shows: every figure is the length of an array in the record. */
export function crossLedgerSummary(x: XlRecord) {
  const selected = x.selection?.selected ?? [];
  const m = x.changes?.membership ?? {};
  const len = (k: string) => (Array.isArray(m[k]) ? (m[k] as unknown[]).length : null);
  return {
    date: x.date,
    as_of: x.as_of,
    assets_in_record: Object.keys(x.assets).length,
    selection: {
      k: isNum(x.selection?.k) ? x.selection!.k! : null,
      frame_n: isNum(x.selection?.frame_n) ? x.selection!.frame_n! : null,
      quintile: isNum(x.selection?.quintile) ? x.selection!.quintile! : null,
      added_by_name: selected.filter((s) => s?.why === "owner_named").length,
    },
    deployments_read: x.deployments.length,
    // in the record's own legend order (the evidence ladder, strongest first)
    evidence_kinds: tally(x.deployments.map((d) => String(d.evidence_kind ?? "UNLABELLED")), Object.keys(x.evidence_kind_legend ?? {})),
    selected_without_issuer_list: (x.unmeasured_selected ?? []).length,
    not_read: (x.uncheckable ?? []).length,
    changes: x.changes?.state === "COMPARED"
      ? { previous: x.changes.previous?.date ?? null, deployments_added: len("deployments_added"), deployments_removed: len("deployments_removed") }
      : null,
  };
}

export async function loadReadinessFigure(): Promise<ReadinessFigure> {
  return readinessFigure(await loadStablecoinReadinessOnce());
}

export async function loadSupplyReadFigure(signal?: AbortSignal): Promise<SupplyReadFigure> {
  const r = await fetch(SUPPLY_INDEX_URL, { signal, headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`supply-read index unavailable (${r.status})`);
  return supplyReadFigure(await r.json());
}

/** The signed record through the site's verbatim proxy; the proxy answers 200 only after the signature verifies. */
export async function loadXl(signal?: AbortSignal): Promise<LoadedXl> {
  const r = await fetch(XL_URL, { signal, headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`cross-ledger record unavailable (${r.status})`);
  const signature = r.headers.get("x-csoai-signature");
  if (signature !== "VERIFIES") throw new Error("cross-ledger record signature not verified");
  const value: unknown = await r.json();
  if (!isXlRecord(value)) throw new Error("cross-ledger record contract invalid");
  return { record: value, sha256: r.headers.get("x-csoai-record-sha256"), signature, version: r.headers.get("x-csoai-record-version") };
}
