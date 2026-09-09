/**
 * HomeGspcBoard — the home-page GSPC board.
 *
 * GET /api/gspc is the board. This component renders that response directly;
 * the Hugging Face Space is only a distribution mirror.
 *
 * Around the native board view:
 *  - a headline that quotes totals.public_count VERBATIM from GET /api/gspc. No count
 *    is typed into this file; "Load more (N)" is derived from the axis array length.
 *  - a compact strip of every board axis from the same payload: label, n, status,
 *    separation (a TIE is a tie, never a win) and the leader text honouring
 *    public_leader_state (EXCLUDED_OWN_MODEL / NO_SIGNED_CARD print as states, never
 *    a made-up name). Deterministic-facts axes have no fleet, so no leader accuracy.
 *  - a table view of the same rows.
 *
 * The board read is the repo's shared hook (../board/useGspcBoard): one request per
 * page, no seeded fallback payload. If it fails, the strip says so in words.
 *
 * Hugging Face remains a public distribution surface, not a second authority.
 */
import { useEffect, useId, useState, type ReactNode } from "react";
import { useGspcBoard, type GspcAxis, type GspcPayload } from "../board/useGspcBoard";
import { axisRunEvidence } from "../board/runEvidence";
import { axisMeta } from "../../lib/axisRegulation";

/** Public distribution mirror for the canonical GET /api/gspc board. */
export const SPACE_PAGE_URL = "https://huggingface.co/spaces/csoai/gspc-board";
export const HUB_CARDS_PAGE_URL = "https://huggingface.co/datasets/csoai/gspc-hub-cards";
/** Rows the strip shows before "Load more". A UI constant, not a board count. */
export const STRIP_N = 9;

export interface HubCell {
  model: string;
  axis: string;
  status: string;
  accuracy: number | null;
  n: number | null;
  card_sha256: string | null;
  card_url: string | null;
  signed: boolean;
  unmeasured?: string[];
}

export interface HubCardsPayload {
  schema?: string;
  as_of?: string;
  source?: string;
  population?: string;
  counts?: {
    complete?: boolean;
    measured?: number | null;
    unmeasured?: number | null;
    cells?: number | null;
    read_so_far?: { measured?: number; unmeasured?: number; cells?: number };
    indexes_read?: number;
    indexes_total?: number;
  };
  cells?: HubCell[];
}

const HUB_CARDS_ENDPOINT = "/api/hub-cards";
const LIVE_HUB_CARDS_ENDPOINT = "https://councilof.ai/api/hub-cards";
let hubCardsInflight: Promise<HubCardsPayload> | null = null;

async function fetchHubCards(url: string): Promise<HubCardsPayload> {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${url} answered HTTP ${response.status}`);
  const text = (await response.text()).replace(/^\uFEFF/, "").trim();
  if (!text || text.startsWith("<")) throw new Error(`${url} returned HTML, not JSON`);
  const payload = JSON.parse(text) as HubCardsPayload;
  if (!Array.isArray(payload.cells)) throw new Error(`${url} is not a Hub-card feed`);
  return payload;
}

export function loadHubCards(): Promise<HubCardsPayload> {
  if (!hubCardsInflight) {
    hubCardsInflight = fetchHubCards(HUB_CARDS_ENDPOINT)
      .catch(() => fetchHubCards(LIVE_HUB_CARDS_ENDPOINT))
      .catch((error) => {
        hubCardsInflight = null;
        throw error;
      });
  }
  return hubCardsInflight;
}

export interface HubCardsState {
  data: HubCardsPayload | null;
  error: string | null;
  loading: boolean;
}

/** Shared Hub read for the homepage and Council OS; injected data keeps tests deterministic. */
export function useHubCardsFeed(
  injected?: HubCardsPayload | null,
  injectedError: string | null = null,
): HubCardsState {
  const [live, setLive] = useState<HubCardsState>({ data: null, error: null, loading: injected === undefined });

  useEffect(() => {
    if (injected !== undefined) return;
    let active = true;
    loadHubCards()
      .then((data) => {
        if (active) setLive({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (active) setLive({ data: null, error: error instanceof Error ? error.message : String(error), loading: false });
      });
    return () => {
      active = false;
    };
  }, [injected]);

  return injected !== undefined ? { data: injected, error: injectedError, loading: false } : live;
}

/** Only cells whose published body says MEASURED and signed enter the table. */
export function measuredHubCells(data: HubCardsPayload | null | undefined): HubCell[] {
  return (data?.cells ?? []).filter(
    (cell) =>
      cell.status.toUpperCase() === "MEASURED" &&
      cell.signed === true &&
      typeof cell.accuracy === "number" &&
      Number.isFinite(cell.accuracy),
  );
}

/** Hub axes are their own instrument. This list is never joined to the eight fact axes. */
export function hubAxes(data: HubCardsPayload | null | undefined): string[] {
  return [...new Set(measuredHubCells(data).map((cell) => cell.axis))].sort((a, b) => a.localeCompare(b));
}

/** Open on the axis with the most admitted rows so the first view is useful rather than alphabetically accidental. */
export function defaultHubAxis(data: HubCardsPayload | null | undefined): string {
  const counts = new Map<string, number>();
  for (const cell of measuredHubCells(data)) counts.set(cell.axis, (counts.get(cell.axis) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "";
}

export function topHubModels(data: HubCardsPayload | null | undefined, axis: string, limit = STRIP_N): HubCell[] {
  return measuredHubCells(data)
    .filter((cell) => cell.axis === axis)
    .sort((a, b) => (b.accuracy as number) - (a.accuracy as number) || a.model.localeCompare(b.model))
    .slice(0, limit);
}

function hubAxisLabel(axis: string): string {
  if (axis.startsWith("gspc-")) return boardAxisLabel(axis.slice("gspc-".length));
  return axis.replace(/[-_]/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function fmtPct(v: unknown): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "";
  const p = Math.round(v * 1000) / 10;
  return `${Number.isInteger(p) ? p.toFixed(0) : p.toFixed(1)}%`;
}

/** Board axis id → human label, via the registry's gspc-<axis> entry when it has one. */
export function boardAxisLabel(axis: string): string {
  const own = axisMeta(`gspc-${axis}`);
  if (own.boardTwin === axis) return own.label;
  return axis.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export type LeaderState = "PUBLIC" | "EXCLUDED_OWN_MODEL" | "NO_SIGNED_CARD" | "FACTS" | "NONE" | string;

/** The only place leader state is decided. Reads the wire; invents nothing. */
export function leaderStateOf(a: GspcAxis): LeaderState {
  if (a.kind === "deterministic-facts") return "FACTS";
  if (typeof a.public_leader_state === "string" && a.public_leader_state) return a.public_leader_state;
  if (typeof a.leader === "string" && a.leader.trim()) return "PUBLIC";
  return "NONE";
}

/** Separation label; facts axes have no fleet so no test applies. */
export function separationLabel(a: GspcAxis): string {
  if (a.kind === "deterministic-facts") return "facts · no separation test";
  const s = String(a.separation ?? "UNTESTED");
  if (s === "TIE") return "TIE · not a measured advantage";
  if (s === "UNTESTED") return "not separation-tested";
  return s;
}

/** The public count line, verbatim. Null rather than a guess. */
export function publicCountOf(data: GspcPayload | null | undefined): string | null {
  const c = data?.totals?.public_count;
  return typeof c === "string" && c.trim() ? c : null;
}

/** Rows the strip shows: the first STRIP_N in board order, or all of them. Board order is layout, not rank. */
export function visibleAxes(axes: GspcAxis[], expanded: boolean, top = STRIP_N): GspcAxis[] {
  return expanded ? axes : axes.slice(0, top);
}

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" }) {
  const cls =
    tone === "good"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-100"
      : tone === "warn"
        ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/25 dark:text-amber-100"
        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-emerald-900/50 dark:bg-white/5 dark:text-emerald-100/80";
  return <span className={`inline-block rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>{children}</span>;
}

function LeaderText({ a }: { a: GspcAxis }) {
  const st = leaderStateOf(a);
  const muted = "text-slate-500 dark:text-emerald-100/60";
  if (st === "FACTS") return <span data-testid="leader-text">deterministic facts · no leader accuracy</span>;
  if (st === "EXCLUDED_OWN_MODEL")
    return (
      <span data-testid="leader-text" data-leader-state="EXCLUDED_OWN_MODEL">
        <span className="font-semibold">No public leader.</span>
        <span className={muted}> Our own model held the point lead, so the neutral-body rule excludes it from ranking.</span>
      </span>
    );
  if (st === "NO_SIGNED_CARD")
    return (
      <span data-testid="leader-text" data-leader-state="NO_SIGNED_CARD">
        <span className="font-semibold">No public leader.</span>
        <span className={muted}> The named leader has no verifiable signed card, so no name is published.</span>
      </span>
    );
  if (st === "PUBLIC")
    return (
      <span data-testid="leader-text">
        Leader: <span className="font-semibold">{String(a.leader)}</span>
        {typeof a.accuracy === "number" ? <> {fmtPct(a.accuracy)}</> : null}
        {a.separation === "TIE" ? <span className={muted}> · TIE, a point lead is not a measured advantage</span> : null}
      </span>
    );
  return <span data-testid="leader-text">No public leader published.</span>;
}

function nText(a: GspcAxis): string {
  if (typeof a.n !== "number") return "";
  const unit = typeof a.n_unit === "string" ? ` ${a.n_unit.split(" ")[0]}` : "";
  return `n ${a.n}${unit}`;
}

function AxisName({ a }: { a: GspcAxis }) {
  const label = boardAxisLabel(a.axis);
  if (a.kind !== "model-comparison") {
    return <span className="text-sm font-bold text-slate-900 dark:text-emerald-50">{label}</span>;
  }
  return (
    <a href={`/gspc/${encodeURIComponent(a.axis)}/`} className="text-sm font-bold text-slate-900 hover:text-emerald-800 dark:text-emerald-50 dark:hover:text-emerald-300">
      {label}
    </a>
  );
}

function RunEvidence({ a }: { a: GspcAxis }) {
  const evidence = axisRunEvidence(a);
  if (!evidence) {
    return (
      <span className="block text-[11px] leading-relaxed text-slate-500 dark:text-emerald-100/60">
        No run artifact published.
      </span>
    );
  }
  return (
    <span className="block text-[11px] leading-relaxed text-slate-500 dark:text-emerald-100/60">
      <a href={evidence.href} className="font-semibold text-emerald-800 hover:underline dark:text-emerald-300">
        {evidence.label}
      </a>
      <span> · {evidence.detail}</span>
    </span>
  );
}

/** The compact axis strip. Exported so the table view and the expanded state are testable without a DOM. */
export function BoardStrip({
  axes,
  initiallyExpanded = false,
  initialView = "list",
}: {
  axes: GspcAxis[];
  initiallyExpanded?: boolean;
  initialView?: "list" | "table";
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [view, setView] = useState<"list" | "table">(initialView);
  const listId = useId();
  const rows = visibleAxes(axes, expanded);
  const hidden = axes.length - Math.min(axes.length, STRIP_N);

  const th = "px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-emerald-100/60";
  const td = "px-2 py-1 align-top text-xs text-slate-800 dark:text-emerald-50";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-emerald-50">Every axis, from GET /api/gspc</h3>
        <button
          type="button"
          onClick={() => setView((v) => (v === "list" ? "table" : "list"))}
          aria-pressed={view === "table"}
          className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-900/50 dark:text-emerald-100 dark:hover:bg-white/5"
        >
          {view === "table" ? "List view" : "Table view"}
        </button>
      </div>

      {view === "table" ? (
        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 dark:border-emerald-900/40">
          <table className="w-full min-w-[40rem]" data-testid="board-table" id={listId}>
            <caption className="sr-only">Every board axis with its n, status, separation and public leader state.</caption>
            <thead className="bg-slate-50 dark:bg-white/5">
              <tr>
                <th className={th}>Axis</th>
                <th className={th}>Kind</th>
                <th className={th}>n</th>
                <th className={th}>Status</th>
                <th className={th}>Separation</th>
                <th className={th}>Public leader</th>
                <th className={th}>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.axis} data-axis-row={a.axis} className="border-t border-slate-100 dark:border-emerald-900/30">
                  <td className={`${td} font-semibold`}>{boardAxisLabel(a.axis)}</td>
                  <td className={td}>{String(a.kind ?? "")}</td>
                  <td className={td}>{nText(a)}</td>
                  <td className={td}>{String(a.status ?? "UNMEASURED")}</td>
                  <td className={td}>{separationLabel(a)}</td>
                  <td className={td}>
                    <LeaderText a={a} />
                  </td>
                  <td className={td}>
                    {a.kind === "model-comparison" ? (
                      <a href={`/gspc/${encodeURIComponent(a.axis)}/`} className="font-semibold text-emerald-800 hover:underline dark:text-emerald-300">
                        Axis detail
                      </a>
                    ) : (
                      <RunEvidence a={a} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ol id={listId} className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-label="Board axes in board order; position is layout, not rank">
          {rows.map((a) => {
            const sep = a.kind === "deterministic-facts" ? "neutral" : a.separation === "SEPARATED" ? "good" : a.separation === "TIE" ? "warn" : "neutral";
            return (
              <li
                key={a.axis}
                data-axis-row={a.axis}
                className="rounded-xl border border-slate-200/80 bg-white p-2.5 dark:border-emerald-900/40 dark:bg-[#0a1a13]"
              >
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <AxisName a={a} />
                  {nText(a) ? <span className="text-xs text-slate-500 dark:text-emerald-100/60">{nText(a)}</span> : null}
                </p>
                <p className="mt-1 flex flex-wrap gap-1">
                  <Badge>{String(a.status ?? "UNMEASURED")}</Badge>
                  <Badge tone={sep}>{separationLabel(a)}</Badge>
                </p>
                <p className="mt-1 text-xs text-slate-700 dark:text-emerald-100/80">
                  <LeaderText a={a} />
                </p>
                {a.kind === "deterministic-facts" ? (
                  <p className="mt-1"><RunEvidence a={a} /></p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={listId}
          className="mt-2 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-900/50 dark:text-emerald-100 dark:hover:bg-white/5"
        >
          {expanded ? "Show less" : `Load more (${hidden})`}
        </button>
      )}
    </div>
  );
}

export function HubResultsBoard({
  data,
  error = null,
  loading = false,
}: {
  data: HubCardsPayload | null;
  error?: string | null;
  loading?: boolean;
}) {
  const axes = hubAxes(data);
  const fallbackAxis = defaultHubAxis(data);
  const [selectedAxis, setSelectedAxis] = useState(fallbackAxis);

  useEffect(() => {
    if (!selectedAxis || !axes.includes(selectedAxis)) setSelectedAxis(fallbackAxis);
  }, [axes, fallbackAxis, selectedAxis]);

  const rows = topHubModels(data, selectedAxis);
  const cells = measuredHubCells(data);
  const modelCount = new Set(cells.map((cell) => cell.model)).size;
  const complete = data?.counts?.complete === true;
  const measuredTotal = complete && typeof data?.counts?.measured === "number" ? data.counts.measured : null;
  const asOf = typeof data?.as_of === "string" && data.as_of ? data.as_of : null;

  return (
    <div className="mt-6 border-t border-slate-200 pt-5 dark:border-emerald-900/40" aria-labelledby="hub-results-h">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="hub-results-h" className="text-lg font-bold text-slate-900 dark:text-emerald-50">
            Hugging Face measured-model results
          </h3>
          <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-emerald-100/70">
            Third-party Hub cells from <code>/api/hub-cards</code>. This is a separate benchmark instrument from the 22-axis board above: model axes rank measured cells; deterministic fact axes do not rank models.
          </p>
        </div>
        <a href={HUB_CARDS_PAGE_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-emerald-800 hover:underline dark:text-emerald-300">
          Open published Hub dataset
        </a>
      </div>

      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-emerald-100/60" data-testid="hub-results-count">
        {error
          ? "Hub results are unreachable. No result was inferred."
          : loading
            ? "Reading published Hub cells…"
            : cells.length === 0
              ? "No signed MEASURED Hub cells were returned."
              : complete
                ? `${measuredTotal ?? cells.length} published MEASURED cells · ${modelCount} models · ${axes.length} model ${axes.length === 1 ? "axis" : "axes"}`
                : `Partial read · ${cells.length} retrieved MEASURED cells · population totals withheld`}
      </p>
      {asOf ? <p className="mt-1 text-xs text-slate-500 dark:text-emerald-100/55">Feed observed {asOf}</p> : null}

      {!error && !loading && axes.length > 0 ? (
        <>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Hugging Face measured model axes">
            {axes.map((axis) => (
              <button
                key={axis}
                type="button"
                role="tab"
                aria-selected={axis === selectedAxis}
                onClick={() => setSelectedAxis(axis)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  axis === selectedAxis
                    ? "border-emerald-700 bg-emerald-800 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-[#04110b]"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400 dark:border-emerald-900/50 dark:bg-white/5 dark:text-emerald-100"
                }`}
              >
                {hubAxisLabel(axis)}
              </button>
            ))}
          </div>

          <div className="mt-2 overflow-x-auto rounded-2xl border border-slate-200 dark:border-emerald-900/40">
            <table className="w-full min-w-[36rem]" data-testid="hub-results-table">
              <caption className="sr-only">Top nine published measured model cells for {hubAxisLabel(selectedAxis)}, ordered by score.</caption>
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-emerald-100/60">Rank</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-emerald-100/60">Model</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-emerald-100/60">Score</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-emerald-100/60">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((cell, index) => {
                  const rank = rows.findIndex((candidate) => candidate.accuracy === cell.accuracy) + 1;
                  return (
                    <tr key={`${cell.model}-${cell.axis}`} data-hub-model-row={cell.model} className="border-t border-slate-100 dark:border-emerald-900/30">
                      <td className="px-3 py-2 text-sm font-bold text-slate-500 dark:text-emerald-100/60">{rank}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-slate-900 dark:text-emerald-50">
                        {cell.model}
                        {index === 0 ? <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-emerald-100/55">score order</span> : null}
                      </td>
                      <td className="px-3 py-2 text-sm tabular-nums text-slate-800 dark:text-emerald-100">
                        {fmtPct(cell.accuracy)}{typeof cell.n === "number" ? <span className="ml-2 text-xs text-slate-500 dark:text-emerald-100/55">n {cell.n}</span> : null}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {cell.card_url ? (
                          <a href={cell.card_url} className="font-semibold text-emerald-800 hover:underline dark:text-emerald-300">Signed card</a>
                        ) : (
                          <span className="text-slate-500 dark:text-emerald-100/55">Card URL unavailable</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-emerald-100/60">
            Top nine by published score on the selected frozen bank. Ordering is not a separation test, winner claim, compliance verdict, or certificate. Open the signed card to verify a row.
          </p>
        </>
      ) : null}
    </div>
  );
}

export default function HomeGspcBoard({
  data: injected,
  error: injectedError = null,
  hubData: injectedHub,
  hubError: injectedHubError = null,
}: {
  data?: GspcPayload | null;
  error?: string | null;
  hubData?: HubCardsPayload | null;
  hubError?: string | null;
}) {
  // Injected data (SSR, tests) bypasses the fetch; otherwise the shared hook does one live read.
  const live = useGspcBoard();
  const data = injected !== undefined ? injected : live.data;
  const error = injected !== undefined ? injectedError : live.error;
  const loading = injected !== undefined ? false : live.loading;
  const { data: hubData, error: hubError, loading: hubLoading } = useHubCardsFeed(injectedHub, injectedHubError);
  const count = publicCountOf(data);
  const axes: GspcAxis[] = Array.isArray(data?.axes) ? (data!.axes as GspcAxis[]) : [];

  return (
    <section
      aria-labelledby="home-gspc-board-h"
      className="rounded-3xl border border-slate-200/80 bg-white p-5 text-slate-900 shadow-[0_20px_44px_-32px_rgba(4,18,12,.45)] dark:border-emerald-900/40 dark:bg-[#050f0a] dark:text-emerald-50 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="home-gspc-board-h" className="text-xl font-bold">
            GSPC board
          </h2>
          <p className="mt-1 text-sm font-semibold text-emerald-800 dark:text-emerald-300" data-testid="gspc-public-count">
            {error
              ? "Board is unreachable right now. Empty stays empty."
              : loading
                ? "Reading the board…"
                : (count ?? "The board did not publish a count line. Empty stays empty.")}
          </p>
        {/* Blueprint 2 Sep §2.3/§6 lid — DERIVED from the live axes (prefers totals.public_leader_count), never typed. */}
        <p className="mt-1 text-sm text-slate-600 dark:text-emerald-100/70" data-testid="gspc-lid">
          {(() => {
            const ax = (data?.axes ?? []) as any[];
            const mc = ax.filter((a) => a.kind === "model-comparison");
            const leaders = typeof (data?.totals as any)?.public_leader_count === "number"
              ? (data?.totals as any).public_leader_count
              : mc.filter((a) => a.leader && !["EXCLUDED_OWN_MODEL", "NO_SIGNED_CARD"].includes(String(a.public_leader_state || ""))).length;
            const facts = ax.filter((a) => a.kind === "deterministic-facts").length;
            // Owner ruling 2 Sep: ONE lid everywhere — the Blueprint §2.3 sentence. Quote the live
            // `totals.lid` verbatim when the API carries it; derive the same shape only as a fallback.
            const liveLid = typeof (data?.totals as any)?.lid === "string" ? String((data?.totals as any).lid).trim() : "";
            if (liveLid) return liveLid;
            return ax.length ? `${ax.length} axes measured · ${mc.length} model fleets · ${leaders} public leader scores · ${facts} fact runs · TIE is TIE · not a certificate.` : "";
          })()}
          <span className="block">
            Root is signed. Witnesses bind exact root bytes and may still be pending. Verify is free.
          </span>
        </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-emerald-100/70">The live API response below is the master view. It is rendered directly here; Hugging Face is a distribution mirror.</p>
        </div>
        <p className="flex flex-wrap items-center gap-3 text-sm">
          <a href="/dashboard?tab=leaderboard" className="font-medium text-emerald-800 hover:underline dark:text-emerald-300">
            Signed model-card matrix
          </a>
          <a href="/api/gspc" className="text-slate-600 hover:underline dark:text-emerald-100/70">
            /api/gspc
          </a>
        </p>
      </div>

      {/* The /api/gspc data is the source of truth and renders directly below;
          the Hugging Face surface remains a distribution mirror. */}
      <div className="mt-4">
        {error ? (
          <p className="text-sm text-slate-600 dark:text-emerald-100/70">The axis strip needs GET /api/gspc and it did not answer. Empty stays empty.</p>
        ) : loading ? (
          <p className="text-sm text-slate-600 dark:text-emerald-100/70">Reading the axes…</p>
        ) : axes.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-emerald-100/70">Empty stays empty. The board returned no axes.</p>
        ) : (
          <BoardStrip axes={axes} />
        )}
      </div>

      <div className="mt-3 text-sm">
        <a href={SPACE_PAGE_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-800 hover:underline dark:text-emerald-300">
          Open the GSPC board mirror on Hugging Face
        </a>
        <span className="text-slate-500 dark:text-emerald-100/60"> · csoai/gspc-board (distribution mirror; canonical live data is GET /api/gspc)</span>
      </div>

      <HubResultsBoard data={hubData} error={hubError} loading={hubLoading} />

      <p className="mt-4 text-sm text-slate-600 dark:text-emerald-100/70">Measurement, not certification. Empty stays empty.</p>
    </section>
  );
}
