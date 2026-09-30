/**
 * LiveBoardGlance — the live GSPC board, compact, on the front door (owner, 30 Sep 2026: "the live
 * GSPC board must be ON the home page").
 *
 * Every axis the board publishes is a tile with its state. Nothing is typed: the tiles, the count
 * line, the separation line and the group sizes are all read from GET /api/gspc (the shared
 * useGspcBoard read, so one request per page; the prerender bakes the same read into the HTML and
 * the client refreshes it). The model count beside it is read from /interop/models-measured.json,
 * which scripts/build-models-measured.mjs derives from the signed cards at build time.
 *
 * ONE PLACE FOR EACH FIGURE. totals.public_count and the separation line are printed here and
 * nowhere else on the home page. The separation line is never dropped from beside the count: a
 * run behind a slot is not the same as an axis that told two models apart (read all four fields,
 * or print none of them). UNMEASURED is a first-class state and gets its own tile style; it is
 * never hidden and never shown as zero.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useGspcBoard, type GspcAxis, type GspcPayload } from "../board/useGspcBoard";
import { boardRunDates } from "@/lib/boardRunDates";

export interface SeparationRead {
  comparison: number;
  separated: number;
  ties: number;
  untested: number;
}

/** All four separation fields, or null. A partial read must never render as a zero. */
export function separationRead(data: GspcPayload | null): SeparationRead | null {
  const t = data?.totals;
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const comparison = n(t?.comparison_axes);
  const separated = n(t?.separated_leads);
  const ties = n(t?.ties);
  const untested = n(t?.untested_separations);
  if (comparison === null || separated === null || ties === null || untested === null) return null;
  return { comparison, separated, ties, untested };
}

export type TileState = "SEPARATED" | "TIE" | "UNTESTED" | "FACT_RUN" | "UNMEASURED";

export interface Tile {
  axis: string;
  bench: string | null;
  group: "comparison" | "facts";
  state: TileState;
  n: number | null;
}

/** One tile per published axis, in the board's own order. The state is read, never inferred upward. */
export function boardTiles(data: GspcPayload | null): Tile[] {
  const axes: GspcAxis[] = Array.isArray(data?.axes) ? (data!.axes as GspcAxis[]) : [];
  return axes
    .filter((a) => typeof a?.axis === "string" && a.axis)
    .map((a) => {
      const comparison = a.kind === "model-comparison";
      const measured = a.status === "MEASURED";
      let state: TileState = "UNMEASURED";
      if (measured && comparison) {
        state = a.separation === "SEPARATED" ? "SEPARATED" : a.separation === "TIE" ? "TIE" : "UNTESTED";
      } else if (measured) {
        state = "FACT_RUN";
      }
      return {
        axis: a.axis,
        bench: typeof a.bench === "string" && a.bench ? a.bench : null,
        group: comparison ? "comparison" : "facts",
        state,
        n: typeof a.n === "number" && Number.isFinite(a.n) ? a.n : null,
      };
    });
}

const STATE_TEXT: Record<TileState, string> = {
  SEPARATED: "Separated",
  TIE: "Tie",
  UNTESTED: "Untested",
  FACT_RUN: "Fact run",
  UNMEASURED: "Unmeasured",
};

// AA on a white card (checked through a canvas, not getComputedStyle, per verify-ui-by-looking).
const STATE_CLASS: Record<TileState, string> = {
  SEPARATED: "bg-emerald-700 text-white",
  TIE: "bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-100",
  UNTESTED: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  FACT_RUN: "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100",
  UNMEASURED: "bg-amber-100 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100",
};

const nf = new Intl.NumberFormat("en-GB");

interface ModelsHeadline {
  third_party_models: number;
  own_models_excluded: number | null;
}

/** /interop/models-measured.json → headline, or null. The headline must agree with its own rows. */
export function modelsHeadline(doc: unknown): ModelsHeadline | null {
  const d = doc as { schema?: unknown; headline?: Record<string, unknown>; models?: unknown };
  if (d?.schema !== "csoai.models-measured/0.1" || !Array.isArray(d.models)) return null;
  const n = d.headline?.third_party_models;
  if (typeof n !== "number" || !Number.isSafeInteger(n) || n <= 0) return null;
  const rows = (d.models as { kind?: unknown }[]).filter((m) => m?.kind === "third_party").length;
  if (rows !== n) return null;
  const own = d.headline?.own_models_excluded;
  return { third_party_models: n, own_models_excluded: typeof own === "number" ? own : null };
}

function useModelsHeadline(): ModelsHeadline | null {
  const [h, setH] = useState<ModelsHeadline | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/interop/models-measured.json", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive) setH(modelsHeadline(j));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return h;
}

function TileItem({ t }: { t: Tile }) {
  const dashed = t.state === "UNMEASURED";
  return (
    <li
      className={
        "flex min-w-0 flex-col justify-between gap-2 rounded-xl border bg-card px-3 py-2.5 " +
        (dashed ? "border-dashed border-amber-500/70" : "border-border")
      }
      data-axis={t.axis}
      data-state={t.state}
    >
      <span className="block min-w-0">
        <span className="block truncate text-[13px] font-bold leading-tight text-foreground" title={t.axis}>
          {t.axis}
        </span>
        {t.bench ? <span className="mt-0.5 block truncate text-xs leading-tight text-muted-foreground">{t.bench}</span> : null}
      </span>
      <span className="flex items-center justify-between gap-2">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold leading-tight ${STATE_CLASS[t.state]}`}>
          {STATE_TEXT[t.state]}
        </span>
        {t.n !== null ? <span className="font-mono text-xs text-muted-foreground tabular-nums">n {nf.format(t.n)}</span> : null}
      </span>
    </li>
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
  const live = useGspcBoard();
  const fetched = useModelsHeadline();
  const data = injected !== undefined ? injected : live.data;
  const error = injected !== undefined ? injectedError : live.error;
  const models = injectedModels !== undefined ? injectedModels : fetched;
  const tiles = boardTiles(data);
  const sep = separationRead(data);
  const count = typeof data?.totals?.public_count === "string" ? data.totals.public_count : null;
  const stamp = boardRunDates(data as Parameters<typeof boardRunDates>[0]);
  const comparison = tiles.filter((t) => t.group === "comparison");
  const facts = tiles.filter((t) => t.group === "facts");

  return (
    <section
      id="board"
      aria-labelledby="home-board-h"
      className="surface-base section-y scroll-mt-20 border-t border-border"
      data-testid="home-board-glance"
    >
      <div className="section-shell">
        <p className="t-kicker flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
          </span>
          Live now
        </p>
        <h2 id="home-board-h" className="t-band mt-3 max-w-3xl text-foreground">
          The living board
        </h2>

        {error ? (
          <p className="mt-6 max-w-3xl rounded-2xl border border-amber-500/50 bg-amber-50 px-5 py-4 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
            The board is unread right now ({error}). Nothing is shown in its place.{" "}
            <a href="/api/gspc" className="font-bold underline underline-offset-2">
              Read the endpoint directly
            </a>
            .
          </p>
        ) : (
          <>
            <dl className="mt-6 grid max-w-5xl gap-x-8 gap-y-4 sm:grid-cols-3" data-testid="board-glance-figures">
              <div className="flex flex-col">
                <dt className="text-[13px] font-semibold text-muted-foreground">on the board</dt>
                <dd className="order-first font-mono text-2xl font-black tracking-tight text-foreground sm:text-3xl" data-testid="board-public-count">
                  {count ?? "—"}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-[13px] font-semibold text-muted-foreground">
                  {sep ? `model-comparison axes: ${sep.separated} separated, ${sep.ties} tie, ${sep.untested} untested` : "model-comparison axes"}
                </dt>
                <dd className="order-first font-mono text-2xl font-black tracking-tight text-foreground sm:text-3xl" data-testid="board-separation">
                  {sep ? nf.format(sep.comparison) : "—"}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-[13px] font-semibold text-muted-foreground">
                  <Link href="/models-measured/" className="underline decoration-dotted underline-offset-2 hover:text-foreground">
                    AI models measured on frozen banks
                  </Link>
                  {models?.own_models_excluded ? `; our own ${models.own_models_excluded} are listed apart, never counted in` : ""}
                </dt>
                <dd className="order-first font-mono text-2xl font-black tracking-tight text-foreground sm:text-3xl" data-testid="board-models-measured">
                  {models ? nf.format(models.third_party_models) : "—"}
                </dd>
              </div>
            </dl>

            {comparison.length > 0 ? (
              <>
                <h3 className="mt-9 text-sm font-bold text-foreground">
                  Model comparisons <span className="font-normal text-muted-foreground">· {comparison.length} axes · models answer the same frozen questions</span>
                </h3>
                <ul className="mt-3 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7" aria-label="Model-comparison axes and their state">
                  {comparison.map((t) => (
                    <TileItem key={t.axis} t={t} />
                  ))}
                </ul>
              </>
            ) : null}
            {facts.length > 0 ? (
              <>
                <h3 className="mt-7 text-sm font-bold text-foreground">
                  Fact runs <span className="font-normal text-muted-foreground">· {facts.length} axes · a rule reads a public record; no model, no ranking</span>
                </h3>
                <ul className="mt-3 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7" aria-label="Fact-run axes and their state">
                  {facts.map((t) => (
                    <TileItem key={t.axis} t={t} />
                  ))}
                </ul>
              </>
            ) : null}
            {tiles.length === 0 ? <div className="mt-8 min-h-[18rem]" aria-busy="true" aria-label="Loading the board" /> : null}

            <p className="mt-6 max-w-4xl text-[13px] leading-relaxed text-muted-foreground">
              A tie stays a tie and an untested axis stays untested; neither is rounded up into a ranking, and an
              unmeasured slot is shown as unmeasured, never as zero. Read live from{" "}
              <a href="/api/gspc" className="font-semibold text-emerald-800 underline underline-offset-2 dark:text-emerald-300">
                GET /api/gspc
              </a>
              {stamp ? `; the runs behind it were made ${stamp}` : ""}. Nothing here is a certificate.
            </p>
            <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
              <Link href="/board" className="inline-flex min-h-11 items-center text-emerald-800 underline underline-offset-4 dark:text-emerald-300" data-testid="board-glance-full">
                Open the full board →
              </Link>
              <a href="/about/#numbers" className="inline-flex min-h-11 items-center text-emerald-800 underline underline-offset-4 dark:text-emerald-300">
                What the states mean →
              </a>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
