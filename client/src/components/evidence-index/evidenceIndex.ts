/**
 * evidenceIndex — pure logic for the GSPC evidence index (dashboard pane + HF Space).
 *
 * A read-only projection of GET /api/coverage (csoai.master-coverage/0.1) and
 * GET /api/worker (csoai.worker-state/0.1). It never signs, promotes, writes or
 * calls a paid tool. Ported from the third-party review build of 15 Sep 2026; the
 * captured snapshot and review banner were dropped — production reads live, and a
 * failed refresh keeps the previous read on screen explicitly marked NOT live.
 *
 * RULES THIS FILE HOLDS STILL FOR evidenceIndex.test.ts:
 *   · unknown stays null (rendered "—"); an explicit source zero stays 0;
 *   · a failed owning source nulls every cell of its row — cached counts never
 *     read as a fresh success;
 *   · duplicate or missing family ids reject the whole response;
 *   · relationships are only the source/field pairs the reader declares — no
 *     subject, card or root membership edge is ever inferred;
 *   · shared-ledger paid values are labelled and never totalled;
 *   · compare holds at most COMPARE_LIMIT families;
 *   · URL state lives in ei_* params and every unrelated param survives.
 */

export const STAGES = [
  "indexed",
  "measured",
  "signed",
  "rooted",
  "witnessed",
  "anchored",
  "paid",
] as const;
export type Stage = (typeof STAGES)[number];

export const VIEWS = ["index", "relationships", "compute", "connect"] as const;
export type View = (typeof VIEWS)[number];

export const FILTERS = ["all", "gaps", "measured"] as const;
export type Filter = (typeof FILTERS)[number];

export const COMPARE_LIMIT = 3;
export const COVERAGE_SCHEMA = "csoai.master-coverage/0.1";
export const WORKER_SCHEMA = "csoai.worker-state/0.1";
export const DEFAULT_ORIGIN = "https://councilof.ai";

export type CellState = "reported" | "unavailable";

export type NormalizedCell = {
  value: number | null;
  state: CellState;
  reason: string;
  source: string;
  field: string;
};

export type NormalizedRow = {
  id: string;
  label: string;
  unit: string;
  href: string | null;
  note: string;
  cells: Record<Stage, NormalizedCell>;
  sourceState: "reported" | "unavailable" | "not published";
};

export type NormalizedCoverage = {
  rows: NormalizedRow[];
  complete: boolean;
  sourceCount: number;
};

type Obj = Record<string, unknown>;

export const isObject = (x: unknown): x is Obj =>
  x !== null && typeof x === "object" && !Array.isArray(x);

/** Only https links without credentials survive; relative links resolve against `base`. */
export function safeLink(value: unknown, base: string = DEFAULT_ORIGIN): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const u = new URL(value, base);
    return u.protocol === "https:" && !u.username && !u.password ? u.href : null;
  } catch {
    return null;
  }
}

export function stageCell(cell: unknown): NormalizedCell {
  if (!isObject(cell)) {
    return {
      value: null,
      state: "unavailable",
      reason: "The source did not publish this stage.",
      source: "",
      field: "",
    };
  }
  const valid =
    typeof cell.value === "number" && Number.isFinite(cell.value) && cell.value >= 0;
  const unavailable = typeof cell.unavailable === "string" && cell.unavailable.length > 0;
  const reported = valid && !unavailable;
  return {
    value: reported ? (cell.value as number) : null,
    state: reported ? "reported" : "unavailable",
    reason: unavailable
      ? (cell.unavailable as string)
      : valid
        ? "Reported by the named source; not independently verified here."
        : "No valid count published.",
    source: typeof cell.source === "string" ? cell.source : "",
    field: typeof cell.field === "string" ? cell.field : "",
  };
}

export function normalizeCoverage(
  doc: unknown,
  base: string = DEFAULT_ORIGIN,
): NormalizedCoverage {
  if (!isObject(doc) || doc.schema !== COVERAGE_SCHEMA || !Array.isArray(doc.rows)) {
    throw new Error(`Unsupported coverage response. Expected ${COVERAGE_SCHEMA}.`);
  }
  const sources = isObject(doc.sources) ? doc.sources : {};
  const seen = new Set<string>();
  const rows = doc.rows.map((r): NormalizedRow => {
    if (
      !isObject(r) ||
      typeof r.id !== "string" ||
      !r.id ||
      seen.has(r.id) ||
      typeof r.label !== "string"
    ) {
      throw new Error("Invalid or duplicate evidence-family identity.");
    }
    seen.add(r.id);
    const source = isObject(sources[r.id]) ? (sources[r.id] as Obj) : null;
    const sourceFailed = Boolean(
      source &&
        (source.parsed === false ||
          (typeof source.http === "number" && source.http >= 400) ||
          source.error),
    );
    const cells = Object.fromEntries(
      STAGES.map((k) => [k, stageCell(r[k])]),
    ) as Record<Stage, NormalizedCell>;
    // Failure of a row's owning source must not turn cached counts into a fresh success.
    if (sourceFailed && source) {
      const why = String(source.error || source.http || "unparsed");
      for (const c of Object.values(cells)) {
        c.value = null;
        c.state = "unavailable";
        c.reason = `Owning source failed: ${why}`;
      }
    }
    return {
      id: r.id,
      label: r.label,
      unit: typeof r.unit === "string" ? r.unit : "unspecified unit",
      href: safeLink(r.href, base),
      note: typeof r.note === "string" ? r.note : "",
      cells,
      sourceState: sourceFailed ? "unavailable" : source ? "reported" : "not published",
    };
  });
  return {
    rows,
    complete: doc.complete === true && rows.every((r) => r.sourceState === "reported"),
    sourceCount: Object.keys(sources).length,
  };
}

export function filteredRows(
  rows: NormalizedRow[],
  query = "",
  filter: Filter = "all",
): NormalizedRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => {
    const text = [r.id, r.label, r.unit, r.note, ...STAGES.map((k) => r.cells[k].source)]
      .join(" ")
      .toLowerCase();
    if (q && !text.includes(q)) return false;
    if (filter === "gaps") return STAGES.some((k) => r.cells[k].value === null);
    // Only a reported, non-zero measured cell "reports a measurement"; null is not 0.
    if (filter === "measured") return (r.cells.measured.value ?? 0) > 0;
    return true;
  });
}

/** Keep a selection only while its family is still visible. */
export function reconcileSelection(id: string | null, rows: NormalizedRow[]): string | null {
  return id !== null && rows.some((r) => r.id === id) ? id : null;
}

/** Pin/unpin a family for side-by-side comparison, capped at COMPARE_LIMIT. */
export function toggleCompare(
  compare: readonly string[],
  id: string,
  checked: boolean,
): { compare: string[]; refused: boolean } {
  if (!checked) return { compare: compare.filter((x) => x !== id), refused: false };
  if (compare.includes(id)) return { compare: [...compare], refused: false };
  if (compare.length >= COMPARE_LIMIT) return { compare: [...compare], refused: true };
  return { compare: [...compare, id], refused: false };
}

export function formatCount(x: unknown): string {
  return typeof x === "number" && Number.isFinite(x)
    ? new Intl.NumberFormat("en-GB").format(x)
    : "—";
}

/** "Shared ledger" / "Financial runs" scope labels for cells whose object differs from the row's unit. */
export function scopeHint(row: NormalizedRow, stage: Stage): string {
  const c = row.cells[stage];
  if (stage === "paid" && c.field === "one_number.settlements") return "Shared ledger";
  if (row.id === "gspc" && stage === "signed") return "Financial runs";
  return "";
}

export type WorkerView = {
  endpoint: string;
  state: string;
  reason: string;
  heartbeat: string | null;
  lastSuccess: string | null;
  minutesSinceSuccess: number | null;
  successes: number | null;
  failures: number | null;
  jobs: number | null;
  started: string | null;
  scope: string;
};

export function workerView(doc: unknown, now: number = Date.now()): WorkerView {
  if (!isObject(doc) || doc.schema !== WORKER_SCHEMA) {
    throw new Error("Unsupported worker response.");
  }
  const w = isObject(doc.worker) ? doc.worker : {};
  const stamp = (x: unknown) =>
    typeof x === "string" && Number.isFinite(Date.parse(x)) ? x : null;
  const success = stamp(w.last_success_at);
  const age = success
    ? Math.max(0, Math.floor((now - Date.parse(success)) / 60000))
    : null;
  return {
    endpoint: typeof doc.status === "string" ? doc.status : "UNKNOWN",
    state: typeof w.state === "string" ? w.state : "UNKNOWN",
    reason: typeof w.detail_code === "string" ? w.detail_code : "No reason published",
    heartbeat: stamp(w.updated_at),
    lastSuccess: success,
    minutesSinceSuccess: age,
    successes: stageCell({ value: w.successful_runs }).value,
    failures: stageCell({ value: w.failed_runs }).value,
    jobs: stageCell({ value: w.jobs_total }).value,
    started: stamp(w.started_at),
    scope:
      typeof doc.counters_scope === "string"
        ? doc.counters_scope
        : "Process-local counters; not published measurements.",
  };
}

export type RelationshipEdge = {
  from: string;
  relation: string;
  to: string;
  field: string;
  value: number | null;
  claim: string;
};

/** Only documentary source-field edges; never fabricated subject/card/root membership. */
export function relationshipRows(row: NormalizedRow): RelationshipEdge[] {
  return STAGES.filter((k) => row.cells[k].source).map((k) => ({
    from: row.id,
    relation: `reports ${k}`,
    to: row.cells[k].source,
    field: row.cells[k].field,
    value: row.cells[k].value,
    claim: "source-declared relationship; not an inclusion proof",
  }));
}

export type ViewState = {
  view: View;
  query: string;
  filter: Filter;
  selected: string | null;
};

export function readView(search: string): ViewState {
  const p = new URLSearchParams(search);
  const v = p.get("ei_view");
  const f = p.get("ei_filter");
  return {
    view: (VIEWS as readonly string[]).includes(v ?? "") ? (v as View) : "index",
    query: p.get("ei_q") || "",
    filter: (FILTERS as readonly string[]).includes(f ?? "") ? (f as Filter) : "all",
    selected: p.get("ei_subject") || null,
  };
}

/** Write ei_* state into `href`, preserving the dashboard tab, embed flag and every unrelated param. */
export function viewURL(href: string, state: ViewState): string {
  const u = new URL(href);
  const values: Record<string, string | null> = {
    ei_view: state.view === "index" ? "" : state.view,
    ei_q: state.query,
    ei_filter: state.filter === "all" ? "" : state.filter,
    ei_subject: state.selected,
  };
  for (const [k, v] of Object.entries(values)) {
    if (v) u.searchParams.set(k, v);
    else u.searchParams.delete(k);
  }
  return u.href;
}

export function exportRows(
  rows: NormalizedRow[],
  observedAt: string | null,
  origin: string = DEFAULT_ORIGIN,
) {
  return {
    schema: "csoai.coverage-view-export/0.1",
    kind: "UNSIGNED_DERIVED_VIEW",
    observed_at: observedAt,
    source: `${origin}/api/coverage`,
    cryptography_verified: false,
    notice:
      "Reported counts retain their own source, field and unit. Do not total unlike units or treat payment as measurement.",
    rows,
  };
}

export type ReadMode = "not loaded" | "live read" | "retained, not live";

export type CoverageReadState = {
  data: NormalizedCoverage | null;
  observedAt: string | null;
  mode: ReadMode;
  error: string;
};

/**
 * Fold one refresh outcome into the previous read. A failed refresh never discards
 * or refreshes the previous data: it is kept, its observation time is kept, and it is
 * labelled "retained, not live". Nothing is substituted when there was no prior read.
 */
export function applyCoverageRead(
  prev: CoverageReadState,
  outcome: { ok: true; body: unknown } | { ok: false; error: string },
  now: string,
  base: string = DEFAULT_ORIGIN,
): CoverageReadState {
  if (outcome.ok) {
    try {
      return { data: normalizeCoverage(outcome.body, base), observedAt: now, mode: "live read", error: "" };
    } catch (e) {
      return {
        ...prev,
        mode: prev.data ? "retained, not live" : "not loaded",
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
  return {
    ...prev,
    mode: prev.data ? "retained, not live" : "not loaded",
    error: ("error" in outcome && outcome.error) || "Coverage request failed.",
  };
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function readJSON(
  url: string,
  {
    fetchImpl = (u, i) => fetch(u, i),
    signal,
    timeout = 10000,
  }: { fetchImpl?: FetchLike; signal?: AbortSignal; timeout?: number } = {},
): Promise<unknown> {
  const ac = new AbortController();
  const stop = () => ac.abort();
  if (signal?.aborted) ac.abort();
  else signal?.addEventListener("abort", stop, { once: true });
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const r = await fetchImpl(url, {
      headers: { accept: "application/json" },
      credentials: "omit",
      signal: ac.signal,
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`Source returned HTTP ${r.status}. No value substituted.`);
    const ct = r.headers.get("content-type") || "";
    if (!ct.includes("json")) throw new Error("Source returned a non-JSON page. No value substituted.");
    return await r.json();
  } catch (e) {
    if (ac.signal.aborted && !signal?.aborted) {
      throw new Error("Source timed out. Retry when available.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", stop);
  }
}
