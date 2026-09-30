/**
 * HomeHero — the first screen.
 *
 * WHAT IT HAS TO DO, in this order: say what this business is in plain words, show what is
 * measured RIGHT NOW off the live board, and hand the reader somewhere to go. It replaced a
 * seven-slide auto-rotating carousel (HeroSlides) whose first frame said "Measured, not
 * modelled" over a particle canvas — true, and unreadable to anyone who did not already know
 * what we do. A carousel also hides six of its seven claims from every reader who does not wait.
 *
 * THE COUNT LINE LIVES HERE NOW. The homepage prints totals.public_count exactly once (ruling of
 * 2026-09-16). It used to be printed by HomeGspcTable half a page down; the owner's instruction
 * of 2026-09-22 is that a cold reader must see what is measured in the FIRST screen, so the line
 * moved up and HomeGspcTable is mounted with showPublicCount={false}. One line, one place.
 *
 * NOTHING IS TYPED. Every figure is a field off the same GET /api/gspc read the board table
 * uses (one request per page, via the shared useGspcBoard hook). Before it lands the tiles show
 * "—"; if it never lands they say the board is unread and why. A placeholder number would be the
 * exact defect this instrument exists to catch, committed on our own front door.
 */
import { Link } from "wouter";
import { useGspcBoard, type GspcPayload } from "../board/useGspcBoard";
import { boardRunDates } from "@/lib/boardRunDates";

export interface HeroStat {
  /** What the number is, in the reader's words. */
  label: string;
  /** The figure, verbatim off the payload — or null when the payload does not carry it. */
  value: string | null;
  /** The qualifier that keeps the figure honest. Small, beside the number, never the headline. */
  note: string;
}

const nf = new Intl.NumberFormat("en-GB");

/**
 * The four hero figures, derived from totals. A figure the payload does not carry is null and
 * renders as "—" under its own label: the reader learns the slot exists and is unread, which is
 * a different fact from a zero.
 */
export function heroStats(data: GspcPayload | null): HeroStat[] {
  const t = data?.totals;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? nf.format(v) : null);
  const str = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v : null);
  return [
    {
      label: "on the board today",
      value: str(t?.public_count),
      note: "every declared slot and how many carry a real run",
    },
    {
      label: "graded rows behind it",
      value: num(t?.items),
      note: "each row is one answer a rule graded, not a model's opinion",
    },
    {
      label: "model fleets tested",
      value: num(t?.model_fleets),
      note: "one fleet per behavioural axis, all answering the same frozen questions",
    },
    {
      label: "runs graded from public facts",
      value: num(t?.fact_runs),
      note: "no model, no fleet, no judgement — a rule reads a public record",
    },
  ];
}

/**
 * SEPARATION, read live — the sentence that stops "23 measured" being read as "23 axes that
 * tell models apart".
 *
 * MEASURED means a run exists behind the slot. It does NOT mean the axis separated anybody: a
 * leader's margin over the fleet still has to survive a statistical test, and on this board most
 * of them have not been put to one. The board publishes all four figures (comparison_axes,
 * separated_leads, ties, untested_separations) and this reader prints them together or not at
 * all — a partial read here would reproduce the exact overstatement it exists to prevent.
 *
 * Returns null when the payload does not carry the fields, so the caller can say nothing rather
 * than imply a zero it did not read.
 */
export interface SeparationRead {
  comparison: number;
  separated: number;
  ties: number;
  untested: number;
}

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

/**
 * The stamp line: when the runs behind the board were made. measured_on.date verbatim, completed
 * with any run it does not name (effect-binding, 2026-09-22) read from that axis's own data —
 * see client/src/lib/boardRunDates.ts. Nothing typed.
 */
export function heroStamp(data: GspcPayload | null): string | null {
  return boardRunDates(data as Parameters<typeof boardRunDates>[0]);
}

function Stat({ stat }: { stat: HeroStat }) {
  return (
    // Inside the hero <dl>: a <div> group may hold only <dt>/<dd>, and the term comes first in
    // source order. The figure is shown first, so it carries order-first rather than moving.
    <div className="flex flex-col gap-1 border-t border-emerald-400/25 pt-3 sm:gap-1.5 sm:pt-4" data-hero-stat={stat.label}>
      <dt className="text-[13px] font-bold leading-tight text-emerald-100/90">{stat.label}</dt>
      <dd className="order-first font-mono text-lg font-black leading-none tracking-tight text-emerald-50 tabular-nums sm:text-2xl">
        {stat.value ?? "—"}
      </dd>
      <dd className="hidden text-xs leading-snug text-emerald-200/70 sm:block">{stat.note}</dd>
    </div>
  );
}

/**
 * THE THREE WAYS IN (owner brief 2026-09-30: the first screen answers "how do I use it").
 * Each is a real, working surface today: the AG-UI chat on /dashboard, the connector hub at
 * /connect/ (free MCP door, full MCP, A2A card), and the in-browser verifier. No capability is
 * named here that its page does not deliver.
 */
const WAYS_IN: { testid: string; href: string; verb: string; title: string; body: string }[] = [
  {
    testid: "hero-cta-ask",
    href: "/dashboard",
    verb: "Ask",
    title: "Ask in plain words",
    body: "Each answer names the tool that produced it, the record it cites and the state it returned.",
  },
  {
    testid: "hero-cta-connect",
    href: "/connect/",
    verb: "Connect",
    title: "Connect your agent",
    body: "Add the free MCP door to Claude, Cursor or any MCP client, or read the A2A agent card.",
  },
  {
    testid: "hero-cta-verify",
    href: "/gspc-verify",
    verb: "Verify",
    title: "Check a record yourself",
    body: "Paste a signed card and your own browser checks the signature. No account, free forever.",
  },
];

export default function HomeHero({
  data: injected,
  error: injectedError = null,
}: {
  data?: GspcPayload | null;
  error?: string | null;
}) {
  const live = useGspcBoard();
  const data = injected !== undefined ? injected : live.data;
  const error = injected !== undefined ? injectedError : live.error;
  const stats = heroStats(data);
  const stamp = heroStamp(data);
  const sep = separationRead(data);

  return (
    <section
      className="relative isolate overflow-hidden bg-[#04120c]"
      aria-labelledby="home-hero-h"
      data-testid="home-hero"
    >
      {/*
        One still, held well back. It carries no claim and no text; the alt says what it is.

        NOT ON PHONES (audit 2026-09-30 #4). It is decorative, and on a throttled phone it was the
        Largest Contentful Paint twice: once from the prerender at 2.8 s and again at 4.5 s when
        the client render re-created it. Below 640px the first <source> resolves to an inline
        1x1 GIF (no request) and the <img> is display:none, so the first screen is text on ink.
        From 640px up the responsive WebP set is unchanged; the JPEG stays as the fallback.
      */}
      <picture>
        <source
          media="(max-width: 639.98px)"
          srcSet="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        />
        <source
          type="image/webp"
          srcSet="/images/coliseum_hero_arena-640.webp 640w, /images/coliseum_hero_arena-1024.webp 1024w, /images/coliseum_hero_arena-1376.webp 1376w"
          sizes="100vw"
        />
        <img
          src="/images/coliseum_hero_arena.jpg"
          alt=""
          aria-hidden="true"
          width={1376}
          height={774}
          fetchPriority="high"
          decoding="async"
          className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover opacity-[0.55] sm:block"
        />
      </picture>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(110% 80% at 20% 8%, rgba(16,185,129,.24) 0%, transparent 62%), linear-gradient(180deg, rgba(4,18,12,.46) 0%, rgba(4,18,12,.78) 44%, rgba(4,18,12,.97) 100%)",
        }}
      />

      <div className="section-shell relative z-10 py-8 sm:py-14 lg:py-16">
        {/*
          LAYOUT. Phone: what we do -> what is live -> how to use it, in that order, one column.
          Desktop (lg): the same three blocks, with "what is live" beside the words instead of under
          them, so all three answers sit in the first 900px (audit 2026-09-30 #3).
        */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-x-12">
        <div className="lg:col-start-1 lg:row-start-1">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-300/85">
          Independent AI measurement<span className="hidden sm:inline"> · signed · free to re-check</span>
        </p>

        <h1
          id="home-hero-h"
          className="mt-4 max-w-4xl font-black tracking-[-0.03em] text-white sm:mt-5"
          style={{ fontSize: "clamp(1.75rem, 1rem + 2.9vw, 3rem)", lineHeight: 1.06 }}
        >
          We measure how AI systems behave,
          <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
            and publish the evidence so you can check it yourself.
          </span>
        </h1>

        {/* WHAT WE DO, in the reader's words: the three kinds of subject, how they are graded, and
            the three properties a stranger can hold us to (signed, re-checked, corrected in public). */}
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-emerald-50/90 sm:mt-5 sm:text-lg" data-testid="hero-what-we-do">
          We test AI models, agents and the endpoints they call against frozen, published tests, graded
          by fixed rules, never by another AI. Issued cards are signed, claims are{" "}
          <Link href="/claim-maintenance/" className="underline decoration-emerald-300/50 underline-offset-2 hover:text-white">
            re-checked on a schedule
          </Link>
          , and every error we find is{" "}
          <Link href="/corrections/" className="underline decoration-emerald-300/50 underline-offset-2 hover:text-white">
            corrected in public
          </Link>
          . Unmeasured stays visible.
        </p>

        </div>

        {/* WHAT IS LIVE NOW. One read, four fields, nothing typed. */}
        <div className="mt-6 max-w-4xl rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-[2px] sm:mt-8 sm:rounded-3xl sm:p-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-1 lg:self-start" data-testid="hero-board-glance">
          {error ? (
            <p className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
              The board is unread right now — {error}. Nothing is shown in its place.{" "}
              <a href="/api/gspc" className="font-bold underline underline-offset-2">
                Try the endpoint directly
              </a>
              .
            </p>
          ) : (
            <>
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Live now
              </p>
              <dl className="grid grid-cols-2 gap-x-5 gap-y-4 sm:gap-y-6">
                {stats.map((s) => (
                  <Stat key={s.label} stat={s} />
                ))}
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-emerald-200/75 sm:mt-5 sm:text-[13px]">
                Read live from{" "}
                <a href="/api/gspc" className="font-semibold text-emerald-300 underline decoration-dotted underline-offset-2">
                  GET /api/gspc
                </a>{" "}
                as this page rendered{stamp ? `; the runs behind it were made ${stamp}` : ""}. Nothing on
                this page is a certificate, and a tie between two models stays a tie.{" "}
                <a href="#board" className="font-semibold text-emerald-300 underline underline-offset-2" data-testid="hero-cta-board">
                  See what is measured →
                </a>
              </p>
            </>
          )}
        </div>

        {/* HOW TO USE IT: three doors, each a working surface. */}
        <nav aria-label="Three ways to use Council of AI" className="mt-6 max-w-4xl sm:mt-8 lg:col-start-1 lg:row-start-2">
          <ul className="grid list-none gap-3 p-0 sm:grid-cols-3">
            {WAYS_IN.map((w, i) => (
              <li key={w.testid}>
                <Link
                  href={w.href}
                  data-testid={w.testid}
                  className={
                    "group flex h-full flex-col rounded-2xl border px-4 py-3.5 transition sm:px-5 sm:py-4 " +
                    (i === 0
                      ? "border-emerald-300 bg-emerald-400 text-[#03110b] hover:bg-emerald-300"
                      : "border-emerald-300/35 bg-white/[0.04] text-emerald-50 hover:border-emerald-300/80 hover:bg-emerald-400/10")
                  }
                >
                  <span className={"font-mono text-xs font-bold uppercase tracking-[0.16em] " + (i === 0 ? "text-emerald-950/75" : "text-emerald-300")}>
                    {w.verb}
                  </span>
                  <span className="mt-1 text-base font-black leading-snug">
                    {w.title} <span aria-hidden="true" className="inline-block transition group-hover:translate-x-0.5">→</span>
                  </span>
                  <span className={"mt-1 text-[13px] leading-snug " + (i === 0 ? "text-emerald-950/80" : "text-emerald-100/75")}>{w.body}</span>
                </Link>
              </li>
            ))}
          </ul>
          {/*
            CROSS-PAGE, NOT AN IN-PAGE HOP. HomeMachineSurface moved to /how-we-work on
            2026-09-23; a plain <a> rather than a wouter Link, because the hash has to be honoured.
          */}
          <p className="mt-3">
            <a
              href="/how-we-work#machine-surface"
              className="inline-flex min-h-11 items-center font-mono text-[13px] font-semibold text-emerald-300/90 underline decoration-dotted underline-offset-4 hover:text-emerald-200"
              data-testid="hero-cta-agents"
            >
              Reading this as an agent? Every door is listed →
            </a>
          </p>
        </nav>
        </div>

        {/*
          THE QUALIFIER ON THE COUNT, and it is not optional. The tile above says how many slots
          carry a run; this says what that does and does not establish. Every figure is off the
          same read; if the board stops publishing the four separation fields this block
          disappears rather than guessing.
        */}
        {!error && sep ? (
          <div
            className="mt-6 max-w-4xl rounded-2xl border border-amber-300/30 bg-amber-300/[0.07] px-5 py-4"
            data-testid="hero-separation"
          >
            <p className="text-[13px] font-bold leading-snug text-amber-100">
              Measured is not the same as separated.
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-emerald-100/80">
              A slot counts as measured when a real run sits behind it. Whether the axis
              actually told two models apart is a second question, and across the{" "}
              <span className="font-mono font-bold text-emerald-100">{sep.comparison}</span>{" "}
              model-comparison axes the answer today is{" "}
              <span className="font-mono font-bold text-emerald-100">{sep.separated}</span>{" "}
              separated,{" "}
              <span className="font-mono font-bold text-emerald-100">{sep.ties}</span> tied and{" "}
              <span className="font-mono font-bold text-emerald-100">{sep.untested}</span>{" "}
              untested. A tie stays a tie and an untested axis stays untested; neither is
              rounded up into a ranking.
            </p>
          </div>
        ) : null}

        <p className="mt-5 max-w-2xl text-[13px] leading-relaxed text-emerald-100/75" data-testid="home-accountable-entity">
          Operated by CSOAI Ltd (UK Companies House 16939677), founded by Nicholas Templeman.{" "}
          <Link href="/about/" className="underline underline-offset-2">Who we are</Link>
        </p>
      </div>
    </section>
  );
}
