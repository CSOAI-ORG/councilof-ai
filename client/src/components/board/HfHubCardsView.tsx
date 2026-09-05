import { useEffect, useMemo, useState } from "react";

export const HF_HUB_CARDS_ENDPOINT = "/api/hub-cards";
export const HF_HUB_CARDS_DATASET_URL =
  "https://huggingface.co/datasets/csoai/gspc-hub-cards";
export const MAX_HF_HUB_CARDS_BYTES = 2_000_000;
export const HF_HUB_CARDS_TIMEOUT_MS = 12_000;

export interface HfHubCard {
  model: string;
  axis: string;
  status: string;
  accuracy: number | null;
  n: number | null;
  cardSha256: string;
  cardUrl: string;
  signed: boolean;
  alg: string | null;
  did: string | null;
  sourceVerdict: string | null;
  indexed: string | null;
  created: string | null;
  namePublished: boolean | null;
  unmeasured: string[];
  index: string;
}

export interface HfHubCardsPayload {
  schema: string;
  asOf: string | null;
  source: string;
  sourceRevision: string | null;
  sourceLastModified: string | null;
  population: string;
  indexesRead: number | null;
  indexesTotal: number | null;
  cells: HfHubCard[];
  droppedRows: number;
  sourceMalformedRows: number | null;
  indexes: HfHubIndexOutcome[];
}

export interface HfHubIndexOutcome {
  index: string;
  state: string;
  httpStatus: number | null;
  rows: number;
  malformedRows: number;
}

export interface HfHubCardsReadState {
  data: HfHubCardsPayload | null;
  error: string | null;
  loading: boolean;
  observedAt: string | null;
  retry: () => void;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const boundedText = (value: unknown, max: number): string | null =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.trim().length <= max &&
  !/[\u0000-\u001f\u007f]/.test(value.trim())
    ? value.trim()
    : null;

const finiteUnitOrNull = (value: unknown): number | null =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 1
    ? value
    : null;

const positiveIntegerOrNull = (value: unknown): number | null =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value > 0 &&
  value <= 10_000_000
    ? value
    : null;

const nonNegativeIntegerOrNull = (value: unknown): number | null =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 10_000
    ? value
    : null;

const isoOrNull = (value: unknown): string | null => {
  const candidate = boundedText(value, 64);
  return candidate && Number.isFinite(Date.parse(candidate)) ? candidate : null;
};

export function safeHfHubCardUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "councilof.ai")
      return null;
    if (
      !/^\/interop\/mill-cards-signed\/signed-[a-z0-9-]+-[a-f0-9]{12}\.json$/.test(
        url.pathname,
      )
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Parse the same-origin Hugging Face mirror without upgrading its claims.
 * Invalid rows are withheld and counted; they never become empty/zero cells.
 */
export function parseHfHubCards(
  value: unknown,
  allowedAxes: ReadonlySet<string>,
): HfHubCardsPayload {
  const root = asRecord(value);
  if (!root || root.schema !== "csoai.hub-cards/0.1")
    throw new Error("Unexpected Hugging Face card response schema.");
  if (root.source !== "huggingface.co/datasets/csoai/gspc-hub-cards")
    throw new Error("Unexpected Hugging Face card source.");
  if (!Array.isArray(root.cells) || root.cells.length > 1_500)
    throw new Error("Hugging Face card rows are missing or exceed the bound.");

  const cells: HfHubCard[] = [];
  let droppedRows = 0;
  for (const raw of root.cells) {
    const row = asRecord(raw);
    const model = boundedText(row?.model, 180);
    const axis = boundedText(row?.axis, 64);
    const status = boundedText(row?.status, 40);
    const cardSha256 = boundedText(row?.card_sha256, 64);
    const cardUrl = safeHfHubCardUrl(row?.card_url);
    const index = boundedText(row?.index, 80);
    if (
      !row ||
      !model ||
      !axis ||
      !allowedAxes.has(axis) ||
      !status ||
      !/^[A-Z][A-Z0-9_-]*$/.test(status) ||
      !cardSha256 ||
      !/^[a-f0-9]{64}$/.test(cardSha256) ||
      !cardUrl ||
      !index ||
      !/^INDEX(?:-[a-z0-9-]+)?\.jsonl$/.test(index)
    ) {
      droppedRows += 1;
      continue;
    }
    const unmeasured = Array.isArray(row.unmeasured)
      ? row.unmeasured
          .map((item) => boundedText(item, 120))
          .filter((item): item is string => item !== null)
          .slice(0, 20)
      : [];
    cells.push({
      model,
      axis,
      status,
      accuracy: finiteUnitOrNull(row.accuracy),
      n: positiveIntegerOrNull(row.n),
      cardSha256,
      cardUrl,
      signed: row.signed === true,
      alg: boundedText(row.alg, 40),
      did: boundedText(row.did, 200),
      sourceVerdict: boundedText(row.verdict, 40),
      indexed: isoOrNull(row.indexed),
      created: isoOrNull(row.created),
      namePublished:
        typeof row.name_published === "boolean" ? row.name_published : null,
      unmeasured,
      index,
    });
  }

  const counts = asRecord(root.counts);
  const indexes = Array.isArray(root.indexes)
    ? root.indexes.flatMap((raw): HfHubIndexOutcome[] => {
        const index = asRecord(raw);
        const name = boundedText(index?.index, 80);
        const state = boundedText(index?.state, 80);
        const rows = nonNegativeIntegerOrNull(index?.rows);
        const malformedRows = nonNegativeIntegerOrNull(index?.malformed_rows);
        if (!name || !state || rows === null || malformedRows === null) return [];
        return [{
          index: name,
          state,
          httpStatus:
            typeof index?.http_status === "number" &&
            Number.isInteger(index.http_status)
              ? index.http_status
              : null,
          rows,
          malformedRows,
        }];
      })
    : [];
  return {
    schema: root.schema,
    asOf: isoOrNull(root.as_of),
    source: root.source,
    sourceRevision:
      typeof root.source_revision === "string" &&
      /^[a-f0-9]{40,64}$/.test(root.source_revision)
        ? root.source_revision
        : null,
    sourceLastModified: isoOrNull(root.source_last_modified),
    population:
      boundedText(root.population, 240) ??
      "third-party models on the Hub — not the CSOAI fleet",
    indexesRead: nonNegativeIntegerOrNull(counts?.indexes_read),
    indexesTotal: nonNegativeIntegerOrNull(counts?.indexes_total),
    cells,
    droppedRows,
    sourceMalformedRows: nonNegativeIntegerOrNull(counts?.malformed_rows),
    indexes,
  };
}

export async function readHfHubCardsOnce(
  allowedAxes: ReadonlySet<string>,
  signal?: AbortSignal,
): Promise<HfHubCardsPayload> {
  const response = await fetch(HF_HUB_CARDS_ENDPOINT, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error(`/api/hub-cards answered HTTP ${response.status}.`);
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_HF_HUB_CARDS_BYTES)
    throw new Error("The Hugging Face card response exceeds the browser bound.");
  if (!response.body)
    throw new Error("The Hugging Face card response has no readable body.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let body = "";
  let bytes = 0;
  try {
    while (true) {
      signal?.throwIfAborted();
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > MAX_HF_HUB_CARDS_BYTES)
        throw new Error("The Hugging Face card response exceeds the browser bound.");
      body += decoder.decode(part.value, { stream: true });
    }
    body += decoder.decode();
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(body);
  } catch {
    throw new Error("The Hugging Face card response is not valid JSON.");
  }
  return parseHfHubCards(decoded, allowedAxes);
}

export function useHfHubCards(
  allowedAxes: ReadonlySet<string>,
): HfHubCardsReadState {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<
    Omit<HfHubCardsReadState, "retry">
  >({ data: null, error: null, loading: true, observedAt: null });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = window.setTimeout(
      () => controller.abort("timeout"),
      HF_HUB_CARDS_TIMEOUT_MS,
    );
    setState({ data: null, error: null, loading: true, observedAt: null });
    void readHfHubCardsOnce(allowedAxes, controller.signal)
      .then((data) => {
        if (!active) return;
        setState({
          data,
          error: null,
          loading: false,
          observedAt: new Date().toISOString(),
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          data: null,
          error:
            controller.signal.aborted
              ? "The Hugging Face card read timed out."
              : error instanceof Error
                ? error.message
                : "The Hugging Face card read failed.",
          loading: false,
          observedAt: null,
        });
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort("unmounted");
    };
  }, [allowedAxes, attempt]);

  return {
    ...state,
    retry: () => setAttempt((current) => current + 1),
  };
}

const displayDate = (cell: HfHubCard): string =>
  cell.indexed
    ? `indexed ${cell.indexed.slice(0, 10)}`
    : cell.created
      ? `source created ${cell.created.slice(0, 10)}`
      : "record date not published";

const pct = (value: number): string => `${(value * 100).toFixed(1)}%`;

export default function HfHubCardsView({
  data,
  error,
  loading,
  observedAt,
  onRetry,
}: {
  data: HfHubCardsPayload | null;
  error: string | null;
  loading: boolean;
  observedAt: string | null;
  onRetry: () => void;
}) {
  const [query, setQuery] = useState("");
  const [axis, setAxis] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const axes = useMemo(
    () => [...new Set((data?.cells ?? []).map((cell) => cell.axis))].sort(),
    [data],
  );
  const statuses = useMemo(
    () => [...new Set((data?.cells ?? []).map((cell) => cell.status))].sort(),
    [data],
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...(data?.cells ?? [])]
      .filter((cell) => axis === "all" || cell.axis === axis)
      .filter((cell) => status === "all" || cell.status === status)
      .filter(
        (cell) =>
          !needle ||
          cell.model.toLowerCase().includes(needle) ||
          cell.axis.toLowerCase().includes(needle) ||
          cell.cardSha256.includes(needle),
      )
      .sort(
        (left, right) =>
          left.model.localeCompare(right.model) ||
          left.axis.localeCompare(right.axis) ||
          (right.indexed ?? right.created ?? "").localeCompare(
            left.indexed ?? left.created ?? "",
          ) ||
          left.cardSha256.localeCompare(right.cardSha256),
      );
  }, [axis, data, query, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const rows = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const measured = data?.cells.filter((cell) => cell.status === "MEASURED").length ?? 0;
  const unmeasured = data?.cells.filter((cell) => cell.status === "UNMEASURED").length ?? 0;
  const indexesComplete =
    data?.indexes.length
      ? data.indexesTotal !== null &&
        data.indexesTotal > 0 &&
        data.indexes.length === data.indexesTotal &&
        data.indexes.every((item) => item.state.startsWith("READ"))
      : data?.indexesRead !== null &&
        data?.indexesTotal !== null &&
        (data?.indexesTotal ?? 0) > 0 &&
        (data?.indexesRead ?? 0) > 0 &&
        (data?.indexesRead ?? 0) <= (data?.indexesTotal ?? 0) &&
        data?.indexesRead === data?.indexesTotal;
  const sourceMalformed = data?.sourceMalformedRows ?? 0;

  const changeFilter = (change: () => void) => {
    change();
    setPage(0);
  };

  return (
    <section
      data-testid="hf-hub-cards-view"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <header className="border-b border-border bg-[#fafaf7] px-4 py-4 sm:px-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800">
          Published Hugging Face model cards
        </p>
        <h3 className="mt-1 text-xl font-semibold tracking-tight text-[#04120c]">
          Third-party Hub mill results
        </h3>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-700">
          This is a separate population from the current 22-axis board. Each row
          is a published model × axis card record mirrored from Hugging Face;
          rows are never added to board totals or used to fill its rankings.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
          <a
            href={HF_HUB_CARDS_DATASET_URL}
            className="font-semibold text-emerald-800 underline underline-offset-2"
          >
            Source dataset
          </a>
          <a
            href={HF_HUB_CARDS_ENDPOINT}
            className="font-semibold text-emerald-800 underline underline-offset-2"
          >
            Same-origin mirror JSON
          </a>
          <span>No automatic polling.</span>
        </div>
      </header>

      {loading && (
        <p className="px-5 py-10 text-center text-sm text-slate-600" role="status">
          Reading published Hugging Face model cards…
        </p>
      )}
      {error && (
        <div className="m-4 rounded-xl border border-rose-600/25 bg-rose-50 p-4" role="alert">
          <p className="font-semibold text-rose-900">
            Hugging Face card results are unreachable. No prior rows are shown as current.
          </p>
          <p className="mt-1 text-sm text-rose-800">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-lg border border-rose-900/20 bg-white px-3 py-2 text-xs font-semibold text-rose-900"
          >
            Try one fresh read
          </button>
        </div>
      )}

      {data && !error && (
        <>
          <dl className="grid gap-2 border-b border-border p-4 text-xs sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-emerald-800/10 bg-[#fafaf7] px-3 py-2">
              <dt className="font-semibold uppercase tracking-wide text-slate-600">Published rows</dt>
              <dd className="mt-1 font-mono text-emerald-900">{data.cells.length}</dd>
              <dd className="mt-1 text-[10px] text-slate-500">{measured} source-reported MEASURED · {unmeasured} UNMEASURED</dd>
            </div>
            <div className="rounded-xl border border-emerald-800/10 bg-[#fafaf7] px-3 py-2">
              <dt className="font-semibold uppercase tracking-wide text-slate-600">{data.sourceRevision ? "Indexes read" : "Indexes with rows (legacy mirror)"}</dt>
              <dd className="mt-1 font-mono text-slate-800">{data.indexesRead ?? "unknown"}/{data.indexesTotal ?? "unknown"}</dd>
              <dd className="mt-1 text-[10px] text-slate-500">{indexesComplete ? "All declared indexes were read." : "PARTIAL READ — missing rows are uncheckable."}</dd>
            </div>
            <div className="rounded-xl border border-emerald-800/10 bg-[#fafaf7] px-3 py-2">
              <dt className="font-semibold uppercase tracking-wide text-slate-600">Source observed</dt>
              <dd className="mt-1 font-mono text-slate-800">{observedAt?.replace("T", " ").replace(/\.\d{3}Z$/, "Z") ?? "not observed"}</dd>
              <dd className="mt-1 text-[10px] text-slate-500">API as_of {data.asOf?.slice(0, 19).replace("T", " ") ?? "not declared"}</dd>
              <dd className="mt-1 break-all font-mono text-[10px] text-slate-500">HF revision {data.sourceRevision ?? "not published by this mirror version"}</dd>
            </div>
            <div className="rounded-xl border border-emerald-800/10 bg-[#fafaf7] px-3 py-2">
              <dt className="font-semibold uppercase tracking-wide text-slate-600">Verification boundary</dt>
              <dd className="mt-1 text-slate-800">Status and signing are source-reported.</dd>
              <dd className="mt-1 text-[10px] text-slate-500">Rows are not reverified in this browser view.</dd>
            </div>
          </dl>

          {(data.droppedRows > 0 || sourceMalformed > 0 || !indexesComplete) && (
            <p className="mx-4 mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
              {data.droppedRows > 0 ? `${data.droppedRows} malformed or out-of-contract rows were withheld. ` : ""}
              {sourceMalformed > 0 ? `${sourceMalformed} malformed source index rows were withheld by the mirror. ` : ""}
              {!indexesComplete ? "This is a partial source read; absence is not a finding." : ""}
            </p>
          )}
          {data.indexes.length > 0 && (
            <details className="mx-4 mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
              <summary className="cursor-pointer font-semibold text-slate-800">Per-index read outcomes</summary>
              <ul className="mt-2 space-y-1 font-mono">
                {data.indexes.map((item) => (
                  <li key={item.index}>
                    {item.index} · {item.state} · rows {item.rows} · malformed {item.malformedRows}
                    {item.httpStatus === null ? "" : ` · HTTP ${item.httpStatus}`}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-3">
            <label className="text-xs font-semibold text-slate-700">
              Find a model, axis or hash
              <input
                type="search"
                value={query}
                onChange={(event) => changeFilter(() => setQuery(event.target.value))}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Axis cohort
              <select
                value={axis}
                onChange={(event) => changeFilter(() => setAxis(event.target.value))}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
              >
                <option value="all">All published axes</option>
                {axes.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Source-reported state
              <select
                value={status}
                onChange={(event) => changeFilter(() => setStatus(event.target.value))}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
              >
                <option value="all">All states</option>
                {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] text-left text-xs">
              <caption className="sr-only">Published Hugging Face model-card records. This is a card browser, not a ranking.</caption>
              <thead className="border-b border-border bg-emerald-950/5 text-[10px] uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Axis</th>
                  <th className="px-4 py-3">Source state</th>
                  <th className="px-4 py-3">Published figure</th>
                  <th className="px-4 py-3">Cohort</th>
                  <th className="px-4 py-3">Record date</th>
                  <th className="px-4 py-3">Evidence record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((cell) => {
                  const isMeasured = cell.status === "MEASURED";
                  const isQuotable =
                    isMeasured &&
                    cell.accuracy !== null &&
                    cell.n !== null &&
                    cell.n >= 30 &&
                    cell.namePublished !== false;
                  return (
                    <tr key={`${cell.cardSha256}:${cell.index}`} data-testid="hf-card-row">
                      <th scope="row" className="px-4 py-3 font-semibold text-[#04120c]">
                        {cell.namePublished === false ? "model name withheld" : cell.model}
                      </th>
                      <td className="px-4 py-3 font-mono text-slate-700">{cell.axis}</td>
                      <td className="px-4 py-3">
                        <span className={isMeasured ? "font-semibold text-emerald-800" : "font-semibold text-amber-800"}>
                          SOURCE-REPORTED {cell.status}
                        </span>
                        {cell.unmeasured.length > 0 && <span className="mt-1 block text-[10px] text-slate-500">{cell.unmeasured.join(", ")}</span>}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-slate-800">
                        {isQuotable ? pct(cell.accuracy as number) : "not quotable"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {cell.n === null ? "n not published" : `n=${cell.n}`} · third-party Hub mill
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {displayDate(cell)}
                        <span className="mt-1 block text-[10px] text-slate-500">Not assumed to be measurement time.</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <a href={cell.cardUrl} className="font-mono font-semibold text-emerald-800 underline underline-offset-2">
                          {cell.cardSha256.slice(0, 12)}…
                        </a>
                        <span className="mt-1 block text-[10px] text-slate-500">
                          {cell.signed ? `source reports ${cell.alg ?? "signed"}` : "source reports not signed"}
                          {cell.sourceVerdict ? ` · source verdict ${cell.sourceVerdict}` : ""}
                          {` · ${cell.index}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-600" colSpan={7}>
                      No published record matches these filters. This is not evidence that a model-axis record is absent.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-[#fafaf7] px-4 py-3 text-xs text-slate-600">
            <span>Showing {filtered.length ? safePage * pageSize + 1 : 0}–{Math.min((safePage + 1) * pageSize, filtered.length)} of {filtered.length} matching published records. Multiple publications for one model-axis stay separate.</span>
            <div className="flex gap-2">
              <button type="button" disabled={safePage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold disabled:opacity-40">Previous</button>
              <button type="button" disabled={safePage + 1 >= pages} onClick={() => setPage((value) => Math.min(pages - 1, value + 1))} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold disabled:opacity-40">Next</button>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}
