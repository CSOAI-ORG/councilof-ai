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

/** The stamp line: when the runs behind the board were made, verbatim from measured_on.date. */
export function heroStamp(data: GspcPayload | null): string | null {
  const d = (data?.measured_on as { date?: unknown } | undefined)?.date;
  return typeof d === "string" && d.trim() !== "" ? d : null;
}

function Stat({ stat }: { stat: HeroStat }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-emerald-400/25 pt-4" data-hero-stat={stat.label}>
      <span className="font-mono text-xl font-black leading-none tracking-tight text-emerald-50 tabular-nums sm:text-2xl">
        {stat.value ?? "—"}
      </span>
      <span className="text-[13px] font-bold leading-tight text-emerald-100/90">{stat.label}</span>
      <span className="text-[12px] leading-snug text-emerald-200/60">{stat.note}</span>
    </div>
  );
}

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

  return (
    <section
      className="relative isolate overflow-hidden bg-[#04120c]"
      aria-labelledby="home-hero-h"
      data-testid="home-hero"
    >
      {/* One still, held well back. It carries no claim and no text; the alt says what it is. */}
      <img
        src="/images/coliseum_hero_arena.jpg"
        alt=""
        aria-hidden="true"
        width={1376}
        height={774}
        fetchPriority="high"
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.62]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(110% 80% at 20% 8%, rgba(16,185,129,.24) 0%, transparent 62%), linear-gradient(180deg, rgba(4,18,12,.46) 0%, rgba(4,18,12,.74) 44%, rgba(4,18,12,.97) 100%)",
        }}
      />

      <div className="section-shell relative z-10 py-14 sm:py-24 lg:py-32">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-300/80">
          Independent measurement · signed evidence · free to re-check
        </p>

        <h1
          id="home-hero-h"
          className="mt-6 max-w-4xl font-black tracking-[-0.03em] text-white"
          style={{ fontSize: "clamp(2rem, 1.15rem + 3.9vw, 4.25rem)", lineHeight: 1.04 }}
        >
          We measure how AI systems behave,
          <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
            and sign the answer so you never take our word for it.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-[1.55] text-emerald-50/90 sm:text-xl">
          Frozen, published tests. Every answer graded by a rule, never by another AI. Every
          result signed, and free for anyone to re-check — forever, without an account. What we
          have not measured, the board says so.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <a
            href="#board"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-400 px-7 text-base font-black text-[#03110b] shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-300"
            data-testid="hero-cta-board"
          >
            See what is measured →
          </a>
          <Link
            href="/gspc-verify"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-300/40 px-7 text-base font-bold text-emerald-100 transition hover:border-emerald-300/80 hover:bg-emerald-400/10"
            data-testid="hero-cta-verify"
          >
            Check a record yourself
          </Link>
          <a
            href="#machine-surface"
            className="inline-flex min-h-12 items-center px-1 font-mono text-[13px] font-semibold text-emerald-300/85 underline decoration-dotted underline-offset-4 hover:text-emerald-200"
            data-testid="hero-cta-agents"
          >
            Reading this as an agent? Every door is listed →
          </a>
        </div>

        {/* The live board, at a glance. One read, four fields, nothing typed. */}
        <div className="mt-12 max-w-4xl" data-testid="hero-board-glance">
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
              <dl className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
                {stats.map((s) => (
                  <Stat key={s.label} stat={s} />
                ))}
              </dl>
              <p className="mt-6 text-[12.5px] leading-relaxed text-emerald-200/65">
                Read live from{" "}
                <a href="/api/gspc" className="font-semibold text-emerald-300 underline decoration-dotted underline-offset-2">
                  GET /api/gspc
                </a>{" "}
                as this page rendered{stamp ? `; the runs behind it were made ${stamp}` : ""}. Nothing on
                this page is a certificate, and a tie between two models stays a tie.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
