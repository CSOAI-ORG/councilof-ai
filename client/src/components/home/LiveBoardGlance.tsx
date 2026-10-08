/**
 * The homepage evidence explorer. Counts share the same validated board snapshot;
 * comparison separation, fact coverage and the model census have distinct units.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  useGspcBoard,
  type GspcAxis,
  type GspcPayload,
} from "../board/useGspcBoard";
import { boardRunDates } from "@/lib/boardRunDates";
import ModelCountKey from "@/components/ModelCountKey";
import "./livingBoard.css";

export interface SeparationRead {
  comparison: number;
  separated: number;
  ties: number;
  untested: number;
}
const integer = (v: unknown): number | null =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : null;
export function separationRead(
  data: GspcPayload | null,
): SeparationRead | null {
  const t = data?.totals;
  const comparison = integer(t?.comparison_axes),
    separated = integer(t?.separated_leads);
  const ties = integer(t?.ties),
    untested = integer(t?.untested_separations);
  if (
    comparison === null ||
    separated === null ||
    ties === null ||
    untested === null
  )
    return null;
  if (separated + ties + untested !== comparison) return null;
  return { comparison, separated, ties, untested };
}
export type TileState =
  | "SEPARATED"
  | "TIE"
  | "UNTESTED"
  | "FACT_RUN"
  | "UNMEASURED"
  | "UNKNOWN";
export interface Tile {
  axis: string;
  bench: string | null;
  group: "comparison" | "facts" | "declared";
  state: TileState;
  n: number | null;
  row: GspcAxis;
}
export function boardTiles(data: GspcPayload | null): Tile[] {
  return (Array.isArray(data?.axes) ? data.axes : [])
    .filter((a) => typeof a?.axis === "string" && a.axis)
    .map((a) => {
      const group =
        a.kind === "model-comparison"
          ? "comparison"
          : a.kind === "deterministic-facts"
            ? "facts"
            : "declared";
      const state: TileState =
        a.status !== "MEASURED"
          ? "UNMEASURED"
          : group === "facts"
            ? "FACT_RUN"
            : group === "comparison" &&
                ["SEPARATED", "TIE", "UNTESTED"].includes(String(a.separation))
              ? (a.separation as TileState)
              : "UNKNOWN";
      return {
        axis: a.axis,
        bench: typeof a.bench === "string" ? a.bench : null,
        group,
        state,
        n: integer(a.n),
        row: a,
      };
    });
}
export const STATE_TEXT: Record<TileState, string> = {
  SEPARATED: "Separated",
  TIE: "Tie",
  UNTESTED: "Separation untested",
  FACT_RUN: "Fact run",
  UNMEASURED: "Unmeasured",
  UNKNOWN: "State unavailable",
};
export function axisLabel(axis: string): string {
  return axis.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
/** Evidence links must be supplied by the row. Missing links are never guessed. */
export function evidenceHref(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim() || /[\u0000-\u0020\\]/.test(v))
    return null;
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  try {
    return new URL(v).protocol === "https:" ? v : null;
  } catch {
    return null;
  }
}
export function measurementDate(a: GspcAxis): string {
  const mt = a.measurement_time;
  if (mt && typeof mt === "object") {
    const d = mt as Record<string, unknown>;
    if (typeof d.observed_at === "string")
      return d.observed_at + " · exact time";
    if (typeof d.observed_on === "string")
      return d.observed_on + " · day precision";
    if (typeof d.not_after === "string") return "No later than " + d.not_after;
  }
  return typeof a.facts_as_of === "string"
    ? a.facts_as_of + " · source as of"
    : "Date not published on this row";
}
const pct = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1
    ? (v * 100).toFixed(1) + "%"
    : null;
export function axisMetric(t: Tile): { label: string; value: string } | null {
  const a = t.row;
  if (t.state === "UNMEASURED" || t.state === "UNKNOWN") return null;
  if (t.group === "facts")
    return typeof a.coverage === "string"
      ? { label: "Published coverage", value: a.coverage }
      : null;
  if (
    a.public_leader_state !== "EXCLUDED_OWN_MODEL" &&
    a.public_leader_state !== "NO_SIGNED_CARD" &&
    pct(a.accuracy)
  )
    return {
      label:
        typeof a.accuracy_is === "string"
          ? a.accuracy_is
          : "Top observed score",
      value: pct(a.accuracy)!,
    };
  return pct(a.fleet_mean)
    ? { label: "Fleet mean", value: pct(a.fleet_mean)! }
    : null;
}
interface ModelsHeadline {
  third_party_models: number;
  own_models_excluded: number | null;
  own_unconfirmed?: number;
}
export function modelsHeadline(doc: unknown): ModelsHeadline | null {
  const d = doc as {
    schema?: unknown;
    headline?: Record<string, unknown>;
    models?: unknown;
  };
  if (d?.schema !== "csoai.models-measured/0.1" || !Array.isArray(d.models))
    return null;
  const n = integer(d.headline?.third_party_models),
    own = integer(d.headline?.own_models_excluded);
  if (
    n === null ||
    d.models.filter((m) => m?.kind === "third_party").length !== n
  )
    return null;
  if (
    d.headline?.own_models_excluded !== undefined &&
    (own === null || d.models.filter((m) => m?.kind === "own").length !== own)
  )
    return null;
  const unconfirmed = integer(d.headline?.own_unconfirmed);
  if (
    d.headline?.own_unconfirmed !== undefined &&
    (unconfirmed === null ||
      d.models.filter((m) => m?.kind === "own_unconfirmed").length !==
        unconfirmed)
  )
    return null;
  return {
    third_party_models: n,
    own_models_excluded: own,
    ...(unconfirmed === null ? {} : { own_unconfirmed: unconfirmed }),
  };
}
function useModelsHeadline() {
  const [state, setState] = useState<{
    data: ModelsHeadline | null;
    error: boolean;
  }>({ data: null, error: false });
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let alive = true;
    fetch("/interop/models-measured.json", {
      headers: { accept: "application/json" },
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw Error("Model census unavailable");
        return r.json();
      })
      .then((j) => {
        const data = modelsHeadline(j);
        if (!data) throw Error("Model census unreadable");
        if (alive) setState({ data, error: false });
      })
      .catch(() => {
        if (alive) setState({ data: null, error: true });
      })
      .finally(() => clearTimeout(timer));
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);
  return state;
}
const nf = new Intl.NumberFormat("en-GB");
/** Use the producer's resolved URL; never reconstruct a bank link from a slug. */
export function datasetHref(axis: GspcAxis): string | null {
  if (axis.dataset_url_state === "UNRESOLVABLE") return null;
  if (Object.prototype.hasOwnProperty.call(axis, "dataset_url"))
    return evidenceHref(axis.dataset_url);
  return evidenceHref(axis.dataset);
}

function AxisDetail({ tile }: { tile: Tile }) {
  const a = tile.row,
    metric = axisMetric(tile);
  const evidence = evidenceHref(a.evidence_url),
    dataset = datasetHref(a),
    modelCard = evidenceHref(a.leader_card_url);
  const attestation =
    a.run_attestation === "ED25519_SIGNED"
      ? "Run declares an Ed25519 signature"
      : a.run_attestation === "CONTENT_ADDRESSED_UNSIGNED"
        ? "Content-addressed unsigned run"
        : "Run attestation not declared";
  const explanation =
    tile.state === "UNMEASURED"
      ? "This declared slot has no measured result. No score is inferred."
      : tile.group === "facts"
        ? "A deterministic check follows the instrument's published method. This run has no model ranking or separation test."
        : tile.state === "TIE"
          ? "The published test did not establish an advantage. A higher point estimate is not a measured win."
          : tile.state === "UNTESTED"
            ? "A measurement exists, but public comparison separation has not been established."
            : tile.state === "SEPARATED"
              ? "The source reports separation for this comparison. Read the test and its scope before quoting it."
              : "The source did not publish a usable state.";
  return (
    <aside
      id="gspc-axis-detail"
      className="gspc-detail"
      aria-labelledby="gspc-detail-title"
      data-testid="board-axis-detail"
    >
      <div className="gspc-detail-kicker">Inspect an axis</div>
      <h3 id="gspc-detail-title" tabIndex={-1}>
        {axisLabel(tile.axis)}
      </h3>
      <span className={"gspc-state state-" + tile.state.toLowerCase()}>
        {STATE_TEXT[tile.state]}
      </span>
      <p className="gspc-detail-explanation">{explanation}</p>
      {typeof a.task === "string" ? (
        <p className="gspc-task">{a.task}</p>
      ) : null}
      <dl className="gspc-detail-facts">
        <div>
          <dt>Instrument</dt>
          <dd>{tile.bench ?? "Not published"}</dd>
        </div>
        <div>
          <dt>Sample</dt>
          <dd>
            {tile.n === null ? "Not published" : nf.format(tile.n)}
            {typeof a.n_unit === "string" ? " " + a.n_unit : ""}
          </dd>
        </div>
        <div>
          <dt>Measured</dt>
          <dd>{measurementDate(a)}</dd>
        </div>
        {metric ? (
          <div>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ) : null}
        {tile.group === "comparison" ? (
          <div>
            <dt>Public top observation</dt>
            <dd>
              {a.public_leader_state === "EXCLUDED_OWN_MODEL"
                ? "Own model excluded"
                : a.public_leader_state === "NO_SIGNED_CARD"
                  ? "No signed card for named model"
                  : typeof a.leader === "string"
                    ? a.leader
                    : "No public model named"}
            </dd>
          </div>
        ) : null}
        {Array.isArray(a.interval) &&
        a.interval.length === 2 &&
        pct(a.interval[0]) &&
        pct(a.interval[1]) ? (
          <div>
            <dt>Published interval</dt>
            <dd>
              {pct(a.interval[0])}–{pct(a.interval[1])}
            </dd>
          </div>
        ) : null}
        {typeof a.separation_p === "number" ? (
          <div>
            <dt>Separation p</dt>
            <dd>{String(a.separation_p)}</dd>
          </div>
        ) : null}
      </dl>
      <div className="gspc-evidence-box">
        <strong>Follow the evidence</strong>
        <p>{attestation}. A declared signature still needs verification.</p>
        {evidence ? (
          <a href={evidence}>Open published run ↗</a>
        ) : (
          <span>No run link published on this row</span>
        )}
        {dataset ? (
          <a href={dataset}>
            {tile.group === "comparison"
              ? "Open the question bank"
              : "Open published data"}{" "}
            ↗
          </a>
        ) : typeof a.dataset === "string" ? (
          <p>
            {tile.group === "comparison" ? "Bank" : "Source"}: {a.dataset}
          </p>
        ) : null}
        {a.dataset_url_state === "UNRESOLVABLE" ? (
          <p>Source marks the dataset URL unresolved.</p>
        ) : null}
        {modelCard ? (
          <a href={modelCard}>Inspect public model card ↗</a>
        ) : null}
        <Link href="/gspc-verify">Open the free verifier →</Link>
      </div>
      {typeof a.note === "string" ||
      typeof a.n_note === "string" ||
      typeof a.coverage_note === "string" ||
      typeof a.separation_basis === "string" ? (
        <details className="gspc-source-notes">
          <summary>Scope and source notes</summary>
          {[a.note, a.n_note, a.coverage_note, a.separation_basis]
            .filter((v) => typeof v === "string")
            .map((v, i) => (
              <p key={i}>{String(v)}</p>
            ))}
        </details>
      ) : null}
    </aside>
  );
}
export default function LiveBoardGlance({
  data: injected,
  error: injectedError = null,
  models: injectedModels,
}: {
  data?: GspcPayload | null;
  error?: string | null;
  models?: ModelsHeadline | null;
}) {
  const live = useGspcBoard(),
    fetched = useModelsHeadline();
  const data = injected !== undefined ? injected : live.data;
  const error = injected !== undefined ? injectedError : live.error;
  const loading = injected !== undefined ? false : live.loading;
  const models = injectedModels !== undefined ? injectedModels : fetched.data;
  const tiles = useMemo(() => boardTiles(data), [data]),
    sep = separationRead(data);
  const [group, setGroup] = useState("all"),
    [query, setQuery] = useState(""),
    [state, setState] = useState("all");
  const [selected, setSelected] = useState("");
  const [selectionIntent, setSelectionIntent] = useState(0);
  useEffect(() => {
    if (!selectionIntent || !window.matchMedia("(max-width: 760px)").matches)
      return;
    const heading = document.getElementById("gspc-detail-title");
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [selectionIntent]);
  const filtered = tiles.filter(
    (t) =>
      (group === "all" || t.group === group) &&
      (state === "all" || t.state === state) &&
      (
        axisLabel(t.axis) +
        " " +
        (t.bench ?? "") +
        " " +
        String(t.row.task ?? "")
      )
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const current =
    filtered.find((t) => t.axis === selected) ?? filtered[0] ?? null;
  const stamp = boardRunDates(data),
    measured = integer(data?.totals?.measured_axes);
  const facts = integer(data?.totals?.fact_runs),
    unread = !data;
  const reading = injected === undefined && live.refreshing;
  const readAt = injected === undefined ? live.readAt : null;
  return (
    <section
      id="board"
      className="gspc-home-board scroll-mt-20"
      aria-labelledby="home-board-h"
      data-testid="home-board-glance"
    >
      <div className="section-shell">
        <div className="gspc-board-heading">
          <div>
            <p className="gspc-eyebrow">
              GSPC · public measurement observatory
            </p>
            <h2 id="home-board-h">
              The living board<span>.</span>
            </h2>
            <p className="gspc-board-intro">
              Explore what was tested. See what the result can support. Open the
              evidence behind it.
            </p>
          </div>
          <div className="gspc-read-state" role="status" aria-live="polite">
            <span
              className={
                "gspc-read-dot " + (error ? "is-error" : data ? "is-ready" : "")
              }
              aria-hidden="true"
            />
            <span>
              <time dateTime={readAt ?? undefined}>
                {loading
                  ? "Reading the board…"
                  : reading
                    ? "Refreshing…"
                    : error
                      ? data
                        ? "Refresh failed · retained snapshot"
                        : "Board unreadable"
                      : readAt
                        ? "Read " +
                          readAt.slice(0, 10) +
                          " " +
                          readAt.slice(11, 19) +
                          " UTC"
                        : "Published snapshot"}
              </time>
            </span>
            <button
              type="button"
              onClick={() => void live.refresh()}
              disabled={loading || reading || injected !== undefined}
              aria-label="Refresh board data"
            >
              Refresh ↻
            </button>
          </div>
        </div>
        {error ? (
          <div role="alert" className="gspc-error">
            {data
              ? "The refresh failed. The previous dated snapshot remains below."
              : "The board could not be read. No result or zero has been inferred."}{" "}
            {data && readAt ? (
              <p>
                Last successful read:{" "}
                <time dateTime={readAt}>
                  {readAt.slice(0, 10)} {readAt.slice(11, 19)} UTC
                </time>
                . Measurement dates remain in each record.
              </p>
            ) : null}
            <a href="/api/gspc">Open the source</a>
            <details>
              <summary>Read error</summary>
              {error}
            </details>
          </div>
        ) : null}
        {unread && !loading ? (
          <p className="gspc-empty">
            Use Refresh to try again, or open the published source.
          </p>
        ) : (
          <>
            <dl className="gspc-summary" data-testid="board-glance-figures">
              <div>
                <dt>Axes with measurements</dt>
                <dd data-testid="board-public-count">
                  {measured === null ? "—" : nf.format(measured)}
                  <span>
                    {typeof data?.totals?.axes === "number"
                      ? " / " + nf.format(data.totals.axes)
                      : ""}
                  </span>
                </dd>
                <p>
                  {typeof data?.totals?.unmeasured_axes === "number"
                    ? data.totals.unmeasured_axes + " unmeasured slots"
                    : "Read from the board"}
                </p>
              </div>
              <div>
                <dt>Model-comparison axes</dt>
                <dd data-testid="board-separation">
                  {sep ? nf.format(sep.comparison) : "—"}
                </dd>
                <p>
                  {sep
                    ? sep.separated +
                      " separated · " +
                      sep.ties +
                      " tie · " +
                      sep.untested +
                      " untested"
                    : "Separation counts unavailable"}
                </p>
              </div>
              <div>
                <dt>Public fact runs</dt>
                <dd>{facts === null ? "—" : nf.format(facts)}</dd>
                <p>Deterministic instrument checks · no model ranking</p>
              </div>
              <div>
                <dt>
                  <Link href="/models-measured/">
                    External models in measured-card census ↗
                  </Link>
                </dt>
                <dd data-testid="board-models-measured">
                  {models ? nf.format(models.third_party_models) : "—"}
                </dd>
                <p>
                  {models?.own_models_excluded !== null &&
                  models?.own_models_excluded !== undefined
                    ? "Our " +
                      nf.format(models.own_models_excluded) +
                      " own models are excluded" +
                      (models.own_unconfirmed !== undefined
                        ? " · " +
                          nf.format(models.own_unconfirmed) +
                          " ownership-unconfirmed entries stay separate"
                        : "")
                    : fetched.error
                      ? "Model census unavailable"
                      : "A separate source from axis counts"}
                </p>
              </div>
            </dl>
            {sep ? (
              <div
                className="gspc-separation"
                aria-label="Comparison separation"
              >
                <p>
                  <strong>Measured is not the same as separated.</strong> A tie
                  stays a tie; an untested separation is not a win.
                </p>
                <div className="gspc-separation-track" aria-hidden="true">
                  {sep.comparison ? (
                    <>
                      <span
                        className="separated"
                        style={{
                          width: (sep.separated / sep.comparison) * 100 + "%",
                        }}
                      />
                      <span
                        className="tied"
                        style={{
                          width: (sep.ties / sep.comparison) * 100 + "%",
                        }}
                      />
                      <span
                        className="untested"
                        style={{
                          width: (sep.untested / sep.comparison) * 100 + "%",
                        }}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="gspc-explorer">
              <div className="gspc-toolbar">
                <div
                  className="gspc-filters"
                  role="group"
                  aria-label="Measurement types"
                >
                  {[
                    ["all", "All axes"],
                    ["comparison", "Model comparisons"],
                    ["facts", "Fact runs"],
                    ...(tiles.some((t) => t.group === "declared")
                      ? [["declared", "Declared slots"]]
                      : []),
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={group === id}
                      onClick={() => {
                        setGroup(id);
                        setState("all");
                      }}
                      className={group === id ? "active" : ""}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="gspc-search-controls">
                  <label>
                    <span className="sr-only">Search measurement axes</span>
                    <input
                      type="search"
                      placeholder="Search axes or instruments…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <label>
                    <span className="sr-only">Filter measurement state</span>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    >
                      <option value="all">Every state</option>
                      {[...new Set(tiles.map((t) => t.state))].map((s) => (
                        <option key={s} value={s}>
                          {STATE_TEXT[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <p className="gspc-result-count" role="status">
                {loading
                  ? "Loading the published axes…"
                  : filtered.length +
                    " of " +
                    tiles.length +
                    " axes shown · select an axis to inspect its record"}
              </p>
              <div className="gspc-explorer-body">
                <ul
                  className={"gspc-axis-grid" + (loading ? " is-loading" : "")}
                  aria-busy={loading}
                  aria-label={loading ? "Loading the board" : "Published measurement axes"}
                >
                  {filtered.map((t) => {
                    const metric = axisMetric(t);
                    return (
                      <li key={t.axis} data-axis={t.axis} data-state={t.state}>
                        <button
                          type="button"
                          className={
                            "gspc-axis-card " +
                            (current?.axis === t.axis ? "selected" : "")
                          }
                          aria-pressed={current?.axis === t.axis}
                          aria-controls="gspc-axis-detail"
                          onClick={() => {
                            setSelected(t.axis);
                            setSelectionIntent((n) => n + 1);
                          }}
                        >
                          <span className="gspc-card-kind">
                            {t.group === "comparison"
                              ? "MODEL COMPARISON"
                              : t.group === "facts"
                                ? "PUBLIC FACTS"
                                : "DECLARED SLOT"}
                          </span>
                          <strong>{axisLabel(t.axis)}</strong>
                          <span className="gspc-card-bench">
                            {t.bench ?? "Instrument not published"}
                          </span>
                          <span className="gspc-card-bottom">
                            <span
                              className={
                                "gspc-state state-" + t.state.toLowerCase()
                              }
                            >
                              {STATE_TEXT[t.state]}
                            </span>
                            <span aria-hidden="true">↗</span>
                          </span>
                          {metric ? (
                            <span className="gspc-card-metric">
                              {metric.label} <b>{metric.value}</b>
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {current ? (
                  <AxisDetail key={current.axis} tile={current} />
                ) : (
                  <div className="gspc-empty">
                    {loading
                      ? "Reading the board…"
                      : "No axis matches those filters."}
                    {!loading ? (
                      <button
                        onClick={() => {
                          setGroup("all");
                          setState("all");
                          setQuery("");
                        }}
                      >
                        Clear filters
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            <div className="gspc-board-foot">
              <p>
                Refresh updates the read time, not the measurement date.
                {stamp ? " Published runs: " + stamp + "." : ""} Measurement,
                not certification.
              </p>
              <nav aria-label="More board evidence">
                <Link href="/board">Full board →</Link>
                <a href="/api/gspc">GET /api/gspc ↗</a>
                <Link href="/models-measured/">Model census →</Link>
              </nav>
            </div>
            <ModelCountKey className="gspc-count-key" />
          </>
        )}
      </div>
    </section>
  );
}
