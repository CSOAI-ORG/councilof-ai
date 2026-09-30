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
 *   - Connect: the number of tools tools/list returns (passed in; read by the workspace);
 *   - Learn: the exercises in /academy/exercises/exercises.json;
 *   - SovX: counts.pairs in /api/wrapper/index.json;
 *   - Corrections: ledgers.corrections_in_this_deploy (/api/state);
 *   - Claim maintenance: ledgers.claim_maintenance.counts, each outcome named, never summed.
 * No number is typed. Loading shows a role="status" placeholder; a failed read says so in words.
 */
import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight, Coins } from "lucide-react";
import { useGspcBoard } from "@/components/board/useGspcBoard";
import { boardTiles, separationRead, type TileState } from "@/components/home/LiveBoardGlance";
import {
  claimMaintenanceFigure,
  correctionsFigure,
  exercisesFigure,
  sovxFigure,
  useLiveJson,
  verifiedCardsFigure,
  type Figure,
  type LiveRead,
} from "./useLiveJson";
import { useModelsCount } from "./useModelsCount";

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
      <span className="font-mono text-base font-black text-foreground">{f.value}</span> {f.label}
      <span className="block truncate font-mono text-xs" title={f.source + (f.as_of ? ` · as of ${f.as_of}` : "")}>
        {f.source}
      </span>
    </p>
  );
}

const TILE_DOT: Record<TileState, string> = {
  SEPARATED: "bg-emerald-800",
  TIE: "bg-sky-600",
  UNTESTED: "bg-slate-500",
  FACT_RUN: "bg-teal-600",
  UNMEASURED: "bg-amber-600",
};
const TILE_WORD: Record<TileState, string> = {
  SEPARATED: "separated",
  TIE: "tie",
  UNTESTED: "untested",
  FACT_RUN: "fact run",
  UNMEASURED: "unmeasured",
};

/** The board, compact: the count line WITH its separation line, the model count, one dot per axis. */
function WorkspaceBoardCard() {
  const { data, error } = useGspcBoard();
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
        Live board
      </p>
      <h2 id="ws-board-h" className="mt-2 text-xl font-black tracking-tight text-foreground">
        The GSPC board
      </h2>
      {error ? (
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
          <p className="mt-3 font-mono text-2xl font-black tracking-tight text-foreground sm:text-3xl" data-testid="ws-board-count">
            {count}
          </p>
          <p className="mt-1 text-sm leading-snug text-muted-foreground" data-testid="ws-board-separation">
            {sepLine ?? (sep ? `${sep.separated} of ${sep.comparison} model-comparison axes separated · ${sep.ties} TIE · ${sep.untested} UNTESTED` : "separation line not in the payload")}
          </p>
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
                  AI models measured on frozen banks
                </Link>
                ; our own are listed apart, never counted in.
              </>
            )}
          </p>
          <p className="mt-3 text-xs leading-snug text-muted-foreground">
            A tie stays a tie; untested stays untested. Read live from <a className="font-semibold text-emerald-800 underline underline-offset-2" href="/api/gspc">GET /api/gspc</a>. Not a certificate.
          </p>
        </>
      )}
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold">
        <Link href="/dashboard?tab=board" className="inline-flex min-h-11 items-center text-emerald-800 underline underline-offset-4">
          Open the live board →
        </Link>
        <Link href="/board/" className="inline-flex min-h-11 items-center text-emerald-800 underline underline-offset-4">
          Full page
        </Link>
      </p>
    </section>
  );
}

type Place = {
  id: string;
  href: string;
  title: string;
  job: string;
  img: { base: string; w: number; h: number } | null;
  figure: ReactNode;
};

function PlaceCard({ p }: { p: Place }) {
  return (
    <li className="min-w-0">
      <Link
        href={p.href}
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

export default function GspcWorkspaceHome({
  talk,
  toolCount,
  toolState,
}: {
  /** The AG-UI TalkPanel, rendered by the workspace so its ref stays with the composer. */
  talk: ReactNode;
  toolCount: number | null;
  toolState: "loading" | "ready" | "failed";
}) {
  const state = useLiveJson("/api/state");
  const wrappers = useLiveJson("/api/wrapper/index.json");
  const exercises = useLiveJson("/academy/exercises/exercises.json");

  const toolsRead: LiveRead<unknown> =
    toolState === "loading"
      ? { state: "loading", data: null, error: null }
      : toolState === "failed" || toolCount === null
        ? { state: "error", data: null, error: "tools/list did not answer" }
        : { state: "ok", data: toolCount, error: null };

  const places: Place[] = [
    {
      id: "verify",
      href: "/dashboard?tab=verify",
      title: "Verify",
      job: "Paste a signed card; your browser recomputes its hash and signature. Free, nothing uploaded.",
      img: { base: "/images/home/evidence-card", w: 480, h: 268 },
      figure: <LiveFigureLine read={state} pick={verifiedCardsFigure} testId="ws-fig-verify" />,
    },
    {
      id: "connect",
      href: "/dashboard?tab=connect",
      title: "Connect",
      job: "One line adds the GSPC tools to Claude, Cursor or any MCP client. A2A, AG-UI and A2UI too.",
      img: { base: "/images/home/plugin", w: 480, h: 258 },
      figure: (
        <LiveFigureLine
          read={toolsRead}
          pick={(n) => (typeof n === "number" ? { value: String(n), label: "tools declared by tools/list; a tool is runtime-observed only after its own tools/call", source: "POST /mcp → tools/list", as_of: null } : null)}
          testId="ws-fig-connect"
        />
      ),
    },
    {
      id: "route",
      href: "/dashboard?tab=route",
      title: "Route",
      job: "Your candidates and your policy in; a decision and an unsigned route record out. Decide-only.",
      img: { base: "/images/home/receipt", w: 480, h: 192 },
      figure: (
        <p className="mt-3 text-[13px] leading-snug text-muted-foreground">
          A tie is printed as <span className="font-mono font-bold text-foreground">TIE</span>, untested as{" "}
          <span className="font-mono font-bold text-foreground">UNTESTED</span>; the tie-break rule is yours and is recorded.
        </p>
      ),
    },
    {
      id: "learn",
      href: "/dashboard?tab=learn",
      title: "Learn",
      job: "Reproduce a published measurement in your browser, then practise on the same frozen questions.",
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
      job: "What we got wrong, how it was caught and what changed. Signed records are superseded, never edited.",
      img: { base: "/images/home/watchdog", w: 480, h: 268 },
      figure: <LiveFigureLine read={state} pick={correctionsFigure} testId="ws-fig-corrections" />,
    },
    {
      id: "claims",
      href: "/dashboard?tab=claims",
      title: "Claim maintenance",
      job: "Published claims are re-read against their sources on a schedule, and re-measured, marked stale or retired.",
      img: { base: "/images/home/clock", w: 480, h: 360 },
      figure: <LiveFigureLine read={state} pick={claimMaintenanceFigure} testId="ws-fig-claims" />,
    },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto" data-testid="gspc-workspace-home">
      <section className="relative isolate overflow-hidden bg-[#04120c]" aria-labelledby="ws-h">
        <picture>
          <source media="(max-width: 1023.98px)" srcSet="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
          <source type="image/webp" srcSet="/images/home/evidence-card-800.webp 800w, /images/home/evidence-card-1376.webp 1376w" sizes="50vw" />
          <img
            src="/images/home/evidence-card-800.webp"
            alt=""
            aria-hidden="true"
            width={800}
            height={447}
            decoding="async"
            className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-70 lg:block"
          />
        </picture>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 90% at 12% 0%, rgba(16,185,129,.22) 0%, transparent 60%), linear-gradient(90deg, rgba(4,18,12,1) 0%, rgba(4,18,12,.96) 50%, rgba(4,18,12,.55) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8 sm:py-10 lg:px-12">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">GSPC · Council OS workspace</p>
          <h1
            id="ws-h"
            className="mt-3 max-w-2xl font-black tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(1.6rem, 1rem + 2vw, 2.6rem)", lineHeight: 1.08 }}
          >
            Ask, check and connect, over the live board.
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-emerald-50/90">
            Every answer names the tool and the signed record behind it. Every figure is read live. Verifying is free.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#ws-ask"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-400 px-6 text-base font-black text-[#03110b] transition hover:bg-emerald-300 motion-reduce:transition-none"
              data-testid="ws-cta-ask"
            >
              Ask a question ↓
            </a>
            <Link
              href="/dashboard?tab=verify"
              className="hidden min-h-12 items-center justify-center rounded-xl border border-emerald-300/50 px-6 text-base font-bold text-emerald-50 transition hover:border-emerald-300 hover:bg-emerald-400/10 motion-reduce:transition-none sm:inline-flex"
            >
              Verify a card
            </Link>
            <Link
              href="/dashboard?tab=connect"
              className="hidden min-h-12 items-center justify-center rounded-xl border border-emerald-300/50 px-6 text-base font-bold text-emerald-50 transition hover:border-emerald-300 hover:bg-emerald-400/10 motion-reduce:transition-none sm:inline-flex"
            >
              Connect your agent
            </Link>
          </div>
          {/* Phone: one primary action (Ask); the other two are a quiet row (ONE-PRODUCT-PLAN §4 rule 7). */}
          <p className="mt-3 flex gap-5 text-sm font-bold sm:hidden">
            <Link href="/dashboard?tab=verify" className="inline-flex min-h-11 items-center text-emerald-200 underline underline-offset-4">
              Verify a card
            </Link>
            <Link href="/dashboard?tab=connect" className="inline-flex min-h-11 items-center text-emerald-200 underline underline-offset-4">
              Connect your agent
            </Link>
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
        <div className="grid gap-6 xl:grid-cols-12">
          <section id="ws-ask" aria-labelledby="ws-ask-h" className="min-w-0 scroll-mt-4 xl:col-span-7">
            <p className="t-kicker text-emerald-800">Ask the Council</p>
            <h2 id="ws-ask-h" className="mt-2 text-xl font-black tracking-tight text-foreground">
              Ask in plain words
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Answers are fields of the named tool&apos;s output, the same tools <code className="font-mono text-[0.9em]">/mcp</code> serves. No model
              writes them; if there is no evidence, the answer says so.
            </p>
            {talk}
          </section>
          <div className="min-w-0 xl:col-span-5">
            <WorkspaceBoardCard />
          </div>
        </div>

        <section aria-labelledby="ws-places-h" className="mt-10">
          <p className="t-kicker text-emerald-800">What you can do next</p>
          <h2 id="ws-places-h" className="mt-2 text-xl font-black tracking-tight text-foreground">
            Verify, connect, route, learn, and see what we corrected
          </h2>
          <ul className="mt-5 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-4">
            {places.map((p) => (
              <PlaceCard key={p.id} p={p} />
            ))}
          </ul>
        </section>

        <p className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
          Council of AI measures. It does not certify, and a rank is never sold. Agents get the same answers over{" "}
          <Link href="/agents/" className="font-semibold text-emerald-800 underline underline-offset-2">MCP, A2A, AG-UI and A2UI</Link>.
        </p>
      </div>
    </div>
  );
}
