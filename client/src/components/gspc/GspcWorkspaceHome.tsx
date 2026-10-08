/**
 * GspcWorkspaceHome — the first screen of Council OS, the GSPC workspace (owner, 30 Sep 2026:
 * "GSPC is the product; Council OS is its workspace UI; one clean product").
 *
 * It uses the home page's own vocabulary: the ink ground (#04120c, green-black), the emerald
 * kicker, the section images from /images/home/, the t-* type scale and the 12 px floor.
 *
 * ONE FIGURE PER PLACE. Each number on this surface is printed once, beside its source:
 *   - the board card: totals.public_count and totals.separation_public_count (GET /api/gspc), and the
 *     model count (/interop/models-measured.json, derived from the signed cards at build time);
 *   - Verify: card_chain.bodies_verified_valid (/api/state, corpus 3 of three, kind measured);
 *   - For developers: the number of tools tools/list returns on /mcp/free, the door that card installs
 *     (read here, from that door; /mcp also lists the paid tools, so its length is not this number);
 *   - Learn: the exercises in /academy/exercises/exercises.json;
 *   - SovX: counts.pairs in /api/wrapper/index.json;
 *   - Corrections: ledgers.corrections_in_this_deploy (/api/state);
 *   - Claim maintenance: ledgers.claim_maintenance.counts, each outcome named, never summed.
 * No number is typed. Loading shows a role="status" placeholder; a failed read says so in words.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { listTools } from "@/lib/sovTools";
import { Link } from "wouter";
import { addMyResult, lookupFromRun, type FinishedLookupRun } from "@/lib/myResults";
import { ArrowRight, Coins } from "lucide-react";
import { useGspcBoard } from "@/components/board/useGspcBoard";
import { boardTiles, separationRead, type TileState } from "@/components/home/LiveBoardGlance";
import {
  correctionsFigure,
  exercisesFigure,
  sovxFigure,
  useLiveJson,
  type Figure,
  type LiveRead,
} from "./useLiveJson";
import { useModelsCount } from "./useModelsCount";
import { checkWords, chipOf, countsLine, dayLabel, readClaimChecks, registryWords, STATUS_WORDS } from "./claimChecks";
import GetResults from "./GetResults";
import CorpusCount from "./CorpusCount";
import { correctionHeadline, correctionHref } from "@/lib/correctionHeadline";
import ModelCountKey from "@/components/ModelCountKey";

const nf = new Intl.NumberFormat("en-GB");

/** A figure, its loading placeholder, or its failure in words. */
export function LiveFigureLine({
  read,
  pick,
  testId,
}: {
  read: LiveRead<unknown>;
  pick: (d: unknown) => Figure | null;
  testId: string;
}) {
  if (read.state === "loading")
    return (
      <p role="status" aria-live="polite" className="mt-3 text-[13px] text-muted-foreground" data-testid={testId} data-state="loading">
        <span className="inline-block h-3 w-24 animate-pulse rounded bg-muted align-middle motion-reduce:animate-none" aria-hidden="true" />
        <span className="sr-only">Reading the live figure</span>
      </p>
    );
  const f = read.state === "ok" ? pick(read.data) : null;
  if (!f)
    return (
      <p className="mt-3 text-[13px] text-amber-900" data-testid={testId} data-state="unread">
        Not read {read.state === "error" ? `(${read.error})` : "(the field is not in the payload)"}. Nothing is shown in its place.
      </p>
    );
  return (
    <p className="mt-3 text-[13px] leading-snug text-muted-foreground" data-testid={testId} data-state="live">
      {/* Where the figure came from is a tooltip, not a line of source paths on the card face. */}
      <span
        className="cursor-help font-mono text-base font-black text-foreground"
        title={`Read from ${f.source}${f.as_of ? ` · as of ${f.as_of}` : ""}`}
      >
        {f.value}
      </span>{" "}
      {f.label}
    </p>
  );
}

const TILE_DOT: Record<TileState, string> = {
  SEPARATED: "bg-emerald-800",
  TIE: "bg-sky-600",
  UNTESTED: "bg-slate-500",
  FACT_RUN: "bg-teal-600",
  UNMEASURED: "bg-amber-600",
  UNKNOWN: "bg-slate-400",
};
const TILE_WORD: Record<TileState, string> = {
  SEPARATED: "separated",
  TIE: "tie",
  UNTESTED: "untested",
  FACT_RUN: "fact run",
  UNMEASURED: "unmeasured",
  UNKNOWN: "state unavailable",
};
const TILE_LABEL: Record<TileState, string> = {
  SEPARATED: "Separated",
  TIE: "Tie",
  UNTESTED: "Untested",
  FACT_RUN: "Fact checks",
  UNMEASURED: "Unmeasured",
  UNKNOWN: "State unavailable",
};
// Jargon lives here, in the tooltip, not in the face of the card.
const TILE_HELP: Record<TileState, string> = {
  SEPARATED: "Model-comparison tests where one model was measurably apart from the rest (SEPARATED). Even then, nothing is called best.",
  TIE: "Model-comparison tests where the models measured could not be told apart (TIE). A tie stays a tie.",
  UNTESTED: "Model-comparison tests with too little data to test for a gap yet (UNTESTED).",
  FACT_RUN: "Tests that check facts about servers and public records rather than compare models (deterministic fact runs).",
  UNMEASURED: "Tests with no published run yet (UNMEASURED).",
  UNKNOWN: "The published axis state is unavailable. No run or comparison result is inferred (UNKNOWN).",
};

/** The board, compact: the count line WITH its separation line, the model count, one dot per axis. */
function WorkspaceBoardCard() {
  const { data, error, readAt } = useGspcBoard();
  const readDate = typeof readAt === "string" && Number.isFinite(Date.parse(readAt)) ? new Date(readAt) : null;
  const models = useModelsCount();
  const tiles = boardTiles(data);
  const sep = separationRead(data);
  const count = typeof data?.totals?.public_count === "string" ? data.totals.public_count : null;
  const sepLine = typeof data?.totals?.separation_public_count === "string" ? data.totals.separation_public_count : null;
  const legend = (Object.keys(TILE_WORD) as TileState[]).filter((s) => tiles.some((t) => t.state === s));
  return (
    <section
      aria-labelledby="ws-board-h"
      className="rounded-3xl border border-emerald-950/10 bg-card p-5 shadow-[0_24px_50px_-38px_rgba(4,18,12,.45)] sm:p-6"
      data-testid="ws-board"
    >
      <p className="t-kicker flex items-center gap-2 text-emerald-800">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
        </span>
        Live leaderboard
      </p>
      <h2 id="ws-board-h" className="mt-2 text-xl font-black tracking-tight text-foreground">
        What the tests show today
      </h2>
      {error && data ? (
        <p role="status" className="mt-4 rounded-2xl border border-amber-500/50 bg-amber-50 px-4 py-3 text-sm text-amber-950" data-testid="ws-board-refresh-error">
          The board could not be refreshed ({error}). Showing the last successful read.{" "}
          <a href="/api/gspc" className="font-bold underline underline-offset-2">Read GET /api/gspc directly</a>.
        </p>
      ) : null}
      {readDate ? (
        <p className="mt-3 text-xs leading-snug text-muted-foreground" data-testid="ws-board-read-at">
          Last successful read:{" "}
          <time dateTime={readAt}>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(readDate)} UTC</time>.
          {" "}This is the client read time; the published runs keep their own measurement dates.
        </p>
      ) : null}
      {error && !data ? (
        <p className="mt-4 rounded-2xl border border-amber-500/50 bg-amber-50 px-4 py-3 text-sm text-amber-950" data-testid="ws-board-error">
          The board is unread right now ({error}). Nothing is shown in its place.{" "}
          <a href="/api/gspc" className="font-bold underline underline-offset-2">Read GET /api/gspc directly</a>.
        </p>
      ) : !count ? (
        <div role="status" aria-live="polite" className="mt-4 space-y-2" data-testid="ws-board-loading">
          <span className="block h-7 w-48 animate-pulse rounded bg-muted motion-reduce:animate-none" aria-hidden="true" />
          <span className="block h-4 w-64 animate-pulse rounded bg-muted motion-reduce:animate-none" aria-hidden="true" />
          <span className="sr-only">Reading the live board</span>
        </div>
      ) : (
        <>
          <p
            className="mt-3 font-mono text-2xl font-black tracking-tight text-foreground sm:text-3xl"
            data-testid="ws-board-count"
            title="An axis is one test. Measured means a published run stands behind it."
          >
            {count}
          </p>
          <p className="mt-1 text-sm leading-snug text-muted-foreground" data-testid="ws-board-separation">
            {sepLine ?? (sep ? `${sep.separated} of ${sep.comparison} model-comparison axes separated · ${sep.ties} TIE · ${sep.untested} UNTESTED` : "separation line not in the payload")}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4" data-testid="ws-board-tiles">
            {(Object.keys(TILE_WORD) as TileState[])
              .filter((s) => (s !== "UNMEASURED" && s !== "UNKNOWN") || tiles.some((t) => t.state === s))
              .map((s) => (
                <div key={s} className="rounded-xl bg-muted/70 px-3 py-2" title={TILE_HELP[s]}>
                  <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <span className={`inline-block h-2.5 w-2.5 rounded-[3px] ${TILE_DOT[s]}`} aria-hidden="true" />
                    {TILE_LABEL[s]}
                  </dt>
                  <dd className="font-mono text-2xl font-black leading-tight text-foreground">{tiles.filter((t) => t.state === s).length}</dd>
                </div>
              ))}
          </dl>
          <ul className="mt-4 flex list-none flex-wrap gap-1.5 p-0" aria-label="Every axis and its state">
            {tiles.map((t) => (
              <li key={t.axis} title={`${t.axis}: ${TILE_WORD[t.state]}`} className="inline-flex">
                <span className={`block h-3.5 w-3.5 rounded-[5px] ${TILE_DOT[t.state]}`} aria-hidden="true" />
                <span className="sr-only">
                  {t.axis}: {TILE_WORD[t.state]}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
            {legend.map((s) => (
              <span key={s} className="inline-flex items-center gap-1">
                <span className={`inline-block h-2.5 w-2.5 rounded-[3px] ${TILE_DOT[s]}`} /> {TILE_WORD[s]}
              </span>
            ))}
          </p>
          <p className="mt-4 text-[13px] leading-snug text-muted-foreground" data-testid="ws-board-models">
            {models === null ? (
              "Model count not read."
            ) : (
              <>
                <span className="font-mono text-base font-black text-foreground">{nf.format(models)}</span>{" "}
                <Link href="/models-measured/" className="underline decoration-dotted underline-offset-2 hover:text-foreground">
                  AI models measured on fixed question sets
                </Link>
                ; our own are listed apart, never counted in.
              </>
            )}
          </p>
          <ModelCountKey className="mt-3" />
          <details className="group mt-3 rounded-xl border border-border px-3" data-testid="ws-board-records">
            <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-medium text-muted-foreground hover:text-foreground">
              How many signed records stand behind this
            </summary>
            <CorpusCount />
          </details>
          <p className="mt-3 text-xs leading-snug text-muted-foreground">
            A tie stays a tie; untested stays untested. Read live from <a className="font-semibold text-emerald-800 underline underline-offset-2" href="/api/gspc">GET /api/gspc</a>. Not a certificate.
          </p>
        </>
      )}
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold">
        <Link href="/dashboard?tab=board" className="inline-flex min-h-11 items-center text-emerald-800 underline underline-offset-4">
          Open the leaderboard →
        </Link>
        <a href="/board/" className="inline-flex min-h-11 items-center text-emerald-800 underline underline-offset-4">
          Public leaderboard page
        </a>
      </p>
    </section>
  );
}

type Place = {
  id: string;
  href: string;
  title: string;
  job: string;
  /** The technical words for this place, kept in the tooltip rather than on the card. */
  hint?: string;
  img: { base: string; w: number; h: number } | null;
  figure: ReactNode;
};

function PlaceCard({ p }: { p: Place }) {
  return (
    <li className="min-w-0">
      <Link
        href={p.href}
        title={p.hint}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-emerald-950/10 bg-card shadow-[0_1px_2px_rgba(6,21,15,0.04)] transition hover:border-emerald-700/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 motion-reduce:transition-none"
        data-testid={`ws-place-${p.id}`}
      >
        {p.img ? (
          <img
            src={`${p.img.base}-480.webp`}
            width={p.img.w}
            height={p.img.h}
            alt=""
            loading="lazy"
            decoding="async"
            className="aspect-[16/9] h-auto w-full bg-muted object-cover"
          />
        ) : (
          <span className="flex aspect-[16/9] w-full items-center justify-center bg-[#04120c]" aria-hidden="true">
            <Coins className="h-10 w-10 text-emerald-300" />
          </span>
        )}
        <span className="flex flex-1 flex-col p-4 sm:p-5">
          <span className="flex items-center gap-1.5 text-base font-black tracking-tight text-foreground">
            {p.title}
            <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-emerald-700 motion-reduce:transition-none" aria-hidden="true" />
          </span>
          <span className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.job}</span>
          <span className="mt-auto">{p.figure}</span>
        </span>
      </Link>
    </li>
  );
}

/**
 * The Claim maintenance place. Its numbers are the check rows counted for today (claimChecks.ts):
 * a check whose due date has passed with no completed run is overdue, whatever the last run wrote.
 * The whole card is its one button: it opens the list of checks in place, overdue first. Nothing on
 * it is typed. (7 Oct 2026 retest: the card linked to /dashboard?tab=claims, which embeds the
 * category page and its specification, not the checks; that page stays one link away below the list.)
 * Until the rows are read, or when they cannot be, it is the plain place card with that state said.
 */
function ClaimsPlaceCard({ p, read }: { p: Place; read: LiveRead<unknown> }) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const r = read.state === "ok" ? readClaimChecks(read.data) : null;
  useEffect(() => {
    if (open) listRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [open]);

  if (!r) {
    const figure =
      read.state === "loading" ? (
        <span role="status" aria-live="polite" className="mt-3 block text-[13px] text-muted-foreground" data-testid="ws-fig-claims" data-state="loading">
          <span className="inline-block h-3 w-24 animate-pulse rounded bg-muted align-middle motion-reduce:animate-none" aria-hidden="true" />
          <span className="sr-only">Reading the checks</span>
        </span>
      ) : (
        <span className="mt-3 block text-[13px] text-amber-900" data-testid="ws-fig-claims" data-state="unread">
          The checks could not be read {read.state === "error" ? `(${read.error})` : "(no check rows in the answer)"}. Nothing is shown in their place.
        </span>
      );
    return <PlaceCard p={{ ...p, figure }} />;
  }

  const chip = chipOf(r);
  const ran = dayLabel(r.runAt);
  return (
    <li className="min-w-0">
      <div
        className="flex h-full flex-col overflow-hidden rounded-3xl border border-emerald-950/10 bg-card shadow-[0_1px_2px_rgba(6,21,15,0.04)]"
        data-testid={`ws-place-${p.id}`}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls="ws-claims-checks"
          onClick={() => setOpen((v) => !v)}
          title={`Read from ${r.source}, counted for ${r.today}`}
          className="group flex flex-1 flex-col text-left transition hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 motion-reduce:transition-none"
          data-testid="ws-claims-open"
        >
          {p.img ? (
            <img
              src={`${p.img.base}-480.webp`}
              width={p.img.w}
              height={p.img.h}
              alt=""
              loading="lazy"
              decoding="async"
              className="aspect-[16/9] h-auto w-full bg-muted object-cover"
            />
          ) : null}
          <span className="flex w-full flex-1 flex-col p-4 sm:p-5">
            <span className="text-base font-black tracking-tight text-foreground">{p.title}</span>
            <span className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.job}</span>
            <span className="mt-auto block">
              <span className="mt-3 flex flex-wrap items-center gap-2 text-[13px] leading-snug text-muted-foreground" data-testid="ws-fig-claims" data-state="live">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${chip.tone === "warn" ? "bg-amber-100 text-amber-950" : "bg-emerald-100 text-emerald-950"}`}
                  data-testid="ws-claims-chip"
                >
                  {chip.text}
                </span>
                <span className="font-semibold text-foreground" data-testid="ws-claims-counts">
                  {countsLine(r)}
                </span>
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {ran ? `Last run ${ran}. Counted against today's date.` : "The last run date was not given. Counted against today's date."}
              </span>
              <span className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-800/30 bg-emerald-50 px-3.5 py-2 text-sm font-bold text-emerald-950 group-hover:border-emerald-700">
                {open ? "Hide the checks" : `See the ${r.rows.length} checks`}
                <ArrowRight className={`h-4 w-4 transition ${open ? "rotate-90" : ""} motion-reduce:transition-none`} aria-hidden="true" />
              </span>
            </span>
          </span>
        </button>
        <div id="ws-claims-checks" ref={listRef} hidden={!open} className="border-t border-border px-4 pb-4 pt-3 sm:px-5" data-testid="ws-claims-checks">
          <ul className="m-0 list-none space-y-2 p-0" aria-label="Scheduled re-checks, overdue first">
            {r.rows.map((c) => (
              <li key={`${c.registry}|${c.check}`} className="rounded-xl border border-border px-3 py-2 text-[13px] leading-snug" data-status={c.status}>
                <span
                  className={`mr-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    c.status === "overdue" || c.status === "not_read" ? "bg-amber-100 text-amber-950" : "bg-muted text-foreground"
                  }`}
                >
                  {STATUS_WORDS[c.status]}
                </span>
                <span className="font-semibold text-foreground">{registryWords(c.registry)}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {checkWords(c.check)} · due <time dateTime={c.due}>{dayLabel(c.due)}</time>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Overdue means the due date has passed and no completed run is recorded.{" "}
            <Link href={p.href} className="font-semibold text-emerald-800 underline underline-offset-2">
              How the schedule works
            </Link>
          </p>
        </div>
      </div>
    </li>
  );
}

/** What the home hands its TalkPanel: called once per finished run. */
export type TalkHooks = { onRunDone: (run: FinishedLookupRun) => void };

/**
 * Get results lookups waiting for their answer: question -> subject. When the run for that
 * question finishes, the lookup is saved to My results with the state the tool returned and the
 * record it cited (6 Oct 2026: it was saved before any answer, with no state at all).
 */
export function useLookupRecorder(save: typeof addMyResult = addMyResult) {
  const pending = useRef(new Map<string, string>());
  const expectLookup = useCallback((question: string, subject: string) => {
    pending.current.set(question.trim(), subject);
  }, []);
  const onRunDone = useCallback(
    (run: FinishedLookupRun) => {
      const key = run.question.trim();
      const subject = pending.current.get(key);
      if (!subject) return;
      pending.current.delete(key);
      save(lookupFromRun(subject, run));
    },
    [save],
  );
  return { expectLookup, onRunDone };
}

/**
 * The free door's own tools/list, read once. The card that shows this count installs
 * https://councilof.ai/mcp/free, so the count is that door's, never /mcp's (which adds the paid tools).
 */
export function useFreeDoorToolCount(list: typeof listTools = listTools): LiveRead<unknown> {
  const [read, setRead] = useState<LiveRead<unknown>>({ state: "loading", data: null, error: null });
  useEffect(() => {
    let cancelled = false;
    list("/mcp/free").then((reply) => {
      if (cancelled) return;
      setRead(
        reply.state === "ok"
          ? { state: "ok", data: reply.tools.length, error: null }
          : { state: "error", data: null, error: "tools/list on /mcp/free did not answer" },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [list]);
  return read;
}

export default function GspcWorkspaceHome({
  talk,
  onAsk,
}: {
  /** The AG-UI TalkPanel, rendered by the workspace so its ref stays with the composer. A function
   *  receives the hooks the home needs on that panel (onRunDone saves Get results lookups). */
  talk: ReactNode | ((hooks: TalkHooks) => ReactNode);
  /** Send a question to that TalkPanel (Get results uses it for the free lookup). */
  onAsk?: (question: string) => void;
}) {
  const { expectLookup, onRunDone } = useLookupRecorder();
  const askLookup = useCallback(
    (question: string, subject: string) => {
      expectLookup(question, subject);
      onAsk?.(question);
    },
    [expectLookup, onAsk],
  );
  const talkNode = typeof talk === "function" ? talk({ onRunDone }) : talk;
  const state = useLiveJson("/api/state");
  const wrappers = useLiveJson("/api/wrapper/index.json");
  const exercises = useLiveJson("/academy/exercises/exercises.json");

  const toolsRead = useFreeDoorToolCount();

  const places: Place[] = [
    {
      id: "verify",
      href: "/dashboard?tab=verify",
      title: "Verify",
      job: "Paste a result we published; your browser checks that it has not been changed and that we really issued it. Free, and nothing is uploaded.",
      hint: "Recomputes the record's SHA-256 hash and checks its Ed25519 signature against our published keys.",
      img: { base: "/images/home/evidence-card", w: 480, h: 268 },
      figure: (
        <p className="mt-3 text-[13px] leading-snug text-muted-foreground" data-testid="ws-fig-verify">
          Every check ends genuine (<span className="font-mono font-bold text-foreground">VALID</span>), not genuine (
          <span className="font-mono font-bold text-foreground">INVALID</span>) or not checkable (
          <span className="font-mono font-bold text-foreground">UNCHECKABLE</span>); never a silent pass.
        </p>
      ),
    },
    {
      // Tools audit, 6 Oct 2026: this place is the developer section, so it says so. Route (candidates
      // as JSON plus a tie-break rule) left this grid; it stays a sub-tab under For developers.
      id: "connect",
      href: "/dashboard?tab=connect",
      title: "For developers",
      job: "Use these free tools inside Claude, ChatGPT or Cursor, or add them to your own AI agent.",
      hint: "An MCP server; the same answers are also served over A2A, AG-UI and A2UI.",
      img: { base: "/images/home/plugin", w: 480, h: 258 },
      figure: (
        <LiveFigureLine
          read={toolsRead}
          pick={(n) => (typeof n === "number" ? { value: String(n), label: "free tools, no account", source: "POST https://councilof.ai/mcp/free → tools/list (the door this card installs; the paid tools are on /mcp only) · declared by tools/list; a tool is runtime-observed only after its own tools/call", as_of: null } : null)}
          testId="ws-fig-connect"
        />
      ),
    },
    {
      id: "learn",
      href: "/dashboard?tab=learn",
      title: "Learn",
      job: "Repeat a published test in your browser, then practise on the same fixed questions.",
      img: { base: "/images/home/arena", w: 480, h: 270 },
      figure: <LiveFigureLine read={exercises} pick={exercisesFigure} testId="ws-fig-learn" />,
    },
    {
      id: "sovx",
      href: "/dashboard?tab=sovx",
      title: "SovX",
      job: "Reads of wrapped and bridged stablecoins, for wallets and agents. A read is not a rating.",
      img: null,
      figure: <LiveFigureLine read={wrappers} pick={sovxFigure} testId="ws-fig-sovx" />,
    },
    {
      id: "corrections",
      href: "/dashboard?tab=corrections",
      title: "Corrections",
      job: "What we got wrong, how it was caught and what changed. Published results are replaced by new ones, never edited.",
      img: { base: "/images/home/watchdog", w: 480, h: 268 },
      figure: <LiveFigureLine read={state} pick={correctionsFigure} testId="ws-fig-corrections" />,
    },
    {
      // 7 Oct 2026 retest: this card printed the last run's frozen outcomes ("9 not yet due" while three
      // were overdue) and opened the specification page. It now counts the check rows for today and
      // its one button opens the list of checks in place (ClaimsPlaceCard). The href is the fallback
      // only: where the schedule rules and the register are explained.
      id: "claims",
      href: "/dashboard?tab=claims",
      title: "Claim maintenance",
      job: "Published claims are re-read against their sources on a schedule, and re-measured, marked stale or retired.",
      img: { base: "/images/home/clock", w: 480, h: 360 },
      figure: null,
    },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto" data-testid="gspc-workspace-home">
      <section className="relative isolate overflow-hidden bg-[#04120c]" aria-labelledby="ws-h">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 90% at 12% 0%, rgba(16,185,129,.22) 0%, transparent 60%), linear-gradient(90deg, rgba(4,18,12,1) 0%, rgba(4,18,12,.96) 60%, rgba(4,18,12,.85) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-8 sm:py-8 lg:px-12">
          <p className="hidden font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-300 sm:block">Council OS</p>
          <h1
            id="ws-h"
            className="mt-2 max-w-3xl font-black tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(1.35rem, 1rem + 2vw, 2.4rem)", lineHeight: 1.1 }}
          >
            Independent test results for AI models and servers, on request.
          </h1>
          {/* Phone: one plain line, so the Get results box is on the first screen. */}
          <p className="mt-2 text-sm leading-relaxed text-emerald-50/90 sm:hidden">
            Look up what is already measured (free), ask for a fresh run, and check any result yourself.
          </p>
          <ul className="mt-4 hidden max-w-5xl list-none gap-4 p-0 text-sm leading-relaxed text-emerald-50/90 sm:grid sm:grid-cols-3" data-testid="ws-plain">
            <li>
              <span className="block text-xs font-bold uppercase tracking-wide text-emerald-300">What this is</span>
              We test AI models and the servers they use, publish every result with a signature anyone can check, and never sell a grade.
            </li>
            <li>
              <span className="block text-xs font-bold uppercase tracking-wide text-emerald-300">What you can do</span>
              Look up what is already measured (free), ask for a fresh run, track it, and check any result yourself.
            </li>
            <li>
              <span className="block text-xs font-bold uppercase tracking-wide text-emerald-300">Corrections</span>
              <WhatsNew />
            </li>
          </ul>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
        <GetResults onAsk={onAsk ? askLookup : undefined} />

        <div className="mt-6 grid gap-6 xl:grid-cols-12">
          <section id="ws-answers" aria-labelledby="ws-ask-h" className="min-w-0 scroll-mt-4 xl:col-span-7">
            <h2 id="ws-ask-h" className="text-xl font-black tracking-tight text-foreground">
              Answers
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Free answers from what we have published. Each one says where it came from and links to the record so you can check it.
            </p>
            {talkNode}
          </section>
          <div className="min-w-0 xl:col-span-5">
            <WorkspaceBoardCard />
          </div>
        </div>

        <section aria-labelledby="ws-places-h" className="mt-10">
          <h2 id="ws-places-h" className="text-xl font-black tracking-tight text-foreground">
            More you can do
          </h2>
          <ul className="mt-4 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-4">
            {places.map((p) => (p.id === "claims" ? <ClaimsPlaceCard key={p.id} p={p} read={state} /> : <PlaceCard key={p.id} p={p} />))}
          </ul>
        </section>

        <p className="mt-8 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
          Council of AI measures. It does not certify, and a grade is never sold. Checking a result is always free.{" "}
          <Link href="/agents/" title="Over MCP, A2A, AG-UI and A2UI" className="font-semibold text-emerald-800 underline underline-offset-2">
            AI agents can ask the same questions directly
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

/** One live line: the newest published correction and the board's own date. Never typed. */
function WhatsNew() {
  const ledger = useLiveJson<{ corrections?: { id?: string; date?: string; what_was_wrong?: string }[] }>("/api/corrections");
  const latest = ledger.state === "ok" && Array.isArray(ledger.data?.corrections) ? ledger.data.corrections[0] : null;
  if (ledger.state === "loading")
    return (
      <span role="status" className="block text-emerald-50/70">
        Reading the latest change…
      </span>
    );
  if (!latest)
    return (
      <span className="block">
        The change log could not be read just now.{" "}
        <a href="/corrections/" className="font-semibold text-emerald-200 underline underline-offset-2">Open it</a>
      </span>
    );
  // Date plus the first sentence only; every correction stays published in full on /corrections/.
  const headline = correctionHeadline(latest.what_was_wrong) || latest.id;
  return (
    <span className="block" data-testid="ws-whats-new">
      <span className="line-clamp-2">
        <strong className="font-semibold">Latest correction:</strong> {latest.date ? `${latest.date}: ` : ""}
        {headline}
      </span>{" "}
      <a href={correctionHref(latest.id)} className="font-semibold text-emerald-200 underline underline-offset-2">
        Read the full correction
      </a>
    </span>
  );
}
