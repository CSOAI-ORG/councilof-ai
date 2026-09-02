/**
 * HomeGspcBoard — the home-page GSPC board.
 *
 * THE SPACE IS THE BOARD. The living master board is the Hugging Face Space
 * csoai/gspc-board (static SDK). This component embeds it; it does not redraw it.
 * No bars, no bespoke ranking, no per-model chart lives here.
 *
 * Around the embed:
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
 * Embed origin verified 2026-09-02: https://csoai-gspc-live-board.static.hf.space
 * (302 → /index.html, 200, no frame-ancestors). https://csoai-gspc-board.hf.space
 * answers 404 and is not used. csoai/gspc-governance-leaderboard is PAUSED; not used.
 */
import { useId, useState, type ReactNode } from "react";
import { useGspcBoard, type GspcAxis, type GspcPayload } from "../board/useGspcBoard";
import { axisMeta } from "../../lib/axisRegulation";

/** Verified static-SDK embed origin of the living Space. */
export const SPACE_EMBED_ORIGIN = "https://csoai-gspc-live-board.static.hf.space";
export const SPACE_PAGE_URL = "https://huggingface.co/spaces/csoai/gspc-live-board";
export const SPACE_IFRAME_TITLE = "GSPC board — living, on Hugging Face";
/** Rows the strip shows before "Load more". A UI constant, not a board count. */
export const STRIP_N = 9;

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
      <span data-testid="leader-text">
        Public leader: <span className="font-mono font-semibold">EXCLUDED_OWN_MODEL — own council model excluded from the leader slot by the neutral-body rule</span>
        <span className={muted}> · own model held the point lead; not ranked</span>
      </span>
    );
  if (st === "NO_SIGNED_CARD")
    return (
      <span data-testid="leader-text">
        Public leader: <span className="font-mono font-semibold">NO_SIGNED_CARD — no signed card verifies for this leader, so none is printed</span>
        <span className={muted}> · no signed card behind the named leader; none asserted</span>
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
                  <a href={`/leaderboard#${encodeURIComponent(a.axis)}`} className="text-sm font-bold text-slate-900 hover:text-emerald-800 dark:text-emerald-50 dark:hover:text-emerald-300">
                    {boardAxisLabel(a.axis)}
                  </a>
                  {nText(a) ? <span className="text-xs text-slate-500 dark:text-emerald-100/60">{nText(a)}</span> : null}
                </p>
                <p className="mt-1 flex flex-wrap gap-1">
                  <Badge>{String(a.status ?? "UNMEASURED")}</Badge>
                  <Badge tone={sep}>{separationLabel(a)}</Badge>
                </p>
                <p className="mt-1 text-xs text-slate-700 dark:text-emerald-100/80">
                  <LeaderText a={a} />
                </p>
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

export default function HomeGspcBoard({ data: injected, error: injectedError = null }: { data?: GspcPayload | null; error?: string | null }) {
  // Injected data (SSR, tests) bypasses the fetch; otherwise the shared hook does one live read.
  const live = useGspcBoard();
  const data = injected !== undefined ? injected : live.data;
  const error = injected !== undefined ? injectedError : live.error;
  const loading = injected !== undefined ? false : live.loading;
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
          <span className="block">Root is signed and witnessed. Verify is free. Empty cells stay empty.</span>
        </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-emerald-100/70">The living board below is the master. This page embeds it and does not redraw it.</p>
        </div>
        <p className="flex flex-wrap items-center gap-3 text-sm">
          <a href="/dashboard?tab=leaderboard" className="font-medium text-emerald-800 hover:underline dark:text-emerald-300">
            Full leaderboard
          </a>
          <a href="/api/gspc" className="text-slate-600 hover:underline dark:text-emerald-100/70">
            /api/gspc
          </a>
        </p>
      </div>

      <figure className="mt-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-emerald-900/40 dark:bg-[#0a1a13]">
          <iframe
            src={SPACE_EMBED_ORIGIN}
            title={SPACE_IFRAME_TITLE}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups"
            referrerPolicy="strict-origin-when-cross-origin"
            className="block h-[720px] min-h-[720px] w-full border-0"
          />
        </div>
        <figcaption className="mt-2 text-sm">
          <a href={SPACE_PAGE_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-800 hover:underline dark:text-emerald-300">
            Open the living board on Hugging Face
          </a>
          <span className="text-slate-500 dark:text-emerald-100/60"> · csoai/gspc-live-board</span>
        </figcaption>
      </figure>

      <div className="mt-5">
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

      <p className="mt-4 text-sm text-slate-600 dark:text-emerald-100/70">Measurement, not certification. Empty stays empty.</p>
    </section>
  );
}
