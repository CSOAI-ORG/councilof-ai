/** Validate the published matrix before rendering any coverage or tool link. */
export type ToolRef = { tool: string; href: string; kind: string; note: string };
export type LabelSource = { from: string; label: string };
export type ProvisionRow = {
  provision_id: string;
  instrument: string;
  provision_class: string;
  title_or_label_from_artifacts: LabelSource[] | null;
  tooling_wired: ToolRef[];
  status: "WIRED" | "PARTIAL" | "UNMEASURED";
  evidence: string[];
};
export type Matrix = {
  schema: string;
  layer: string;
  title: string;
  as_of: string | null;
  grounded_in: { path: string; sha256: string; role: string }[];
  instrument_scope: {
    name: string;
    celex: string;
    instrument_label: string;
    frozen_identifier_count: number;
    inventory_frozen_provision_counter: number;
    inventory_state: string;
    inventory_limitation: string | null;
    corpus_root_recomputed: boolean;
    corpus_root: string;
    deadline_register_rows_naming_this_instrument: number;
  };
  status_vocabulary: Record<string, string>;
  counts: { total: number; WIRED: number; PARTIAL: number; UNMEASURED: number };
  truth_boundaries: string[];
  provisions: ProvisionRow[];
  gpai_code_of_practice: {
    note: string;
    honest_sentence: string | null;
    artifacts: { path: string; sha256: string; as_of?: string; measured?: Record<string, unknown> }[];
  };
  discovery_doors: ToolRef[];
};


const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const integer = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const digest = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
function requireValue(ok: unknown): asserts ok {
  if (!ok) throw new Error("The published matrix is incomplete or inconsistent.");
}

export function safeToolHref(value: unknown): string | null {
  if (!text(value) || value !== value.trim() || /[\\\u0000-\u0020\u007f]/.test(value)) return null;
  if (!(value.startsWith("/") && !value.startsWith("//")) && !value.startsWith("https://")) return null;
  try {
    const url = new URL(value, "https://councilof.ai");
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return value;
  } catch { return null; }
}
function tool(v: unknown): boolean {
  return object(v) && text(v.tool) && safeToolHref(v.href) !== null && text(v.kind) && typeof v.note === "string";
}
function strings(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(x => typeof x === "string");
}
function stamp(v: unknown): boolean {
  return v === null || (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v)));
}

export function parseGpaiMatrix(value: unknown): Matrix {
  requireValue(object(value) && value.schema === "csoai.gpai-matrix/0.1");
  requireValue(text(value.layer) && text(value.title) && stamp(value.as_of));
  requireValue(Array.isArray(value.grounded_in) && value.grounded_in.every(x => object(x) && text(x.path) && digest(x.sha256) && text(x.role)));
  const scope = value.instrument_scope;
  requireValue(object(scope));
  for (const key of ["name", "celex", "instrument_label", "inventory_state"]) requireValue(text(scope[key]));
  for (const key of ["frozen_identifier_count", "inventory_frozen_provision_counter", "deadline_register_rows_naming_this_instrument"]) requireValue(integer(scope[key]));
  requireValue(scope.inventory_limitation === null || typeof scope.inventory_limitation === "string");
  requireValue(typeof scope.corpus_root_recomputed === "boolean" && digest(scope.corpus_root));
  requireValue((scope.inventory_frozen_provision_counter as number) >= (scope.frozen_identifier_count as number));
  const statuses = ["WIRED", "PARTIAL", "UNMEASURED"] as const;
  requireValue(object(value.status_vocabulary) && Object.values(value.status_vocabulary).every(text));
  for (const state of statuses) requireValue(text(value.status_vocabulary[state]));
  requireValue(Array.isArray(value.provisions) && strings(value.truth_boundaries));
  requireValue(Array.isArray(value.discovery_doors) && value.discovery_doors.every(tool));
  const seen = new Set<string>();
  const actual = { WIRED: 0, PARTIAL: 0, UNMEASURED: 0 };
  for (const row of value.provisions) {
    requireValue(object(row) && text(row.provision_id) && !seen.has(row.provision_id));
    seen.add(row.provision_id);
    requireValue(text(row.instrument) && text(row.provision_class));
    requireValue(typeof row.status === "string" && statuses.includes(row.status as typeof statuses[number]));
    requireValue(strings(row.evidence) && Array.isArray(row.tooling_wired) && row.tooling_wired.every(tool));
    requireValue(row.title_or_label_from_artifacts === null || (Array.isArray(row.title_or_label_from_artifacts) && row.title_or_label_from_artifacts.every(x => object(x) && text(x.from) && text(x.label))));
    actual[row.status as typeof statuses[number]] += 1;
  }
  requireValue(object(value.counts) && integer(value.counts.total) && value.counts.total === value.provisions.length && scope.frozen_identifier_count === value.provisions.length);
  for (const state of statuses) requireValue(integer(value.counts[state]) && value.counts[state] === actual[state]);
  const cop = value.gpai_code_of_practice;
  requireValue(object(cop) && typeof cop.note === "string" && (cop.honest_sentence === null || typeof cop.honest_sentence === "string") && Array.isArray(cop.artifacts));
  for (const a of cop.artifacts) {
    requireValue(object(a) && text(a.path) && digest(a.sha256));
    requireValue(a.as_of === undefined || stamp(a.as_of));
    requireValue(a.measured === undefined || object(a.measured));
  }
  return value as unknown as Matrix;
}
