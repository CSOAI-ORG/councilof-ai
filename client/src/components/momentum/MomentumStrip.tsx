/**
 * MomentumStrip — the live number strip read from GET /api/momentum.
 *
 * Every figure is a link to the source it was read from, carries its own "as of" date, and says
 * in words what it counts. Figures the endpoint omitted (their source failed on that read) are
 * simply absent: the strip never prints a 0, a dash-for-a-number or a remembered value. If the
 * whole read fails the strip renders nothing.
 *
 * Variants:
 *   band  — the home page: a full-width ink band, headline tier + second tier.
 *   panel — inner pages (/about, /tools, /verify-server, /methodology): one rounded ink card
 *           with the subset of figures that page is about.
 */
import { TrendingUp } from "lucide-react";
import {
  fmtDay,
  fmtStamp,
  isExternal,
  pick,
  useMomentum,
  type MomentumFigure,
  type MomentumPayload,
  type MomentumRead,
} from "./momentum";

export const HOME_HEADLINE = ["pypi_all_time", "hf_downloads_30d_other", "capsules", "census_rows"];
export const HOME_SECOND = ["board", "signed_cards", "corrections", "mcp_tools", "x402_doors", "hf_datasets"];

export function LiveDot({ live }: { live: boolean }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
      {live && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${live ? "bg-emerald-400" : "bg-amber-300"}`} />
    </span>
  );
}

function extProps(href: string) {
  return isExternal(href) ? { rel: "noopener noreferrer" } : {};
}

export function FigureCell({ f, size }: { f: MomentumFigure; size: "xl" | "lg" | "md" }) {
  const num =
    size === "xl"
      ? "text-[2.35rem] sm:text-5xl lg:text-[3.6rem]"
      : size === "lg"
        ? "text-[1.85rem] sm:text-4xl"
        : "text-[1.6rem] sm:text-3xl";
  return (
    <li className="min-w-0" data-testid={`momentum-figure-${f.id}`}>
      <a
        href={f.source_url}
        {...extProps(f.source_url)}
        className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-kicker)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)]"
        title={`Source: ${f.source_label}`}
      >
        <span
          aria-hidden="true"
          className={`block font-primary font-black leading-none tracking-tight tabular-nums text-[var(--ink-foreground)] ${num}`}
        >
          {f.display}
        </span>
        <span className="sr-only">{f.display_sr} </span>
        <span className="mt-2.5 block text-[13px] font-semibold leading-snug text-[var(--ink-foreground)] decoration-[var(--ink-kicker)] underline-offset-4 group-hover:underline sm:text-sm">
          {f.label}
        </span>
        <span className="sr-only">. Source: {f.source_label}.</span>
      </a>
      {f.trend && (
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11.5px] font-bold text-[var(--ink-kicker)]">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
          {f.trend.text}
        </p>
      )}
      {f.detail && <p className="ink-muted mt-1.5 text-xs leading-relaxed">{f.detail}</p>}
      <p className="ink-muted mt-1 text-[11px] leading-relaxed">
        as of <time dateTime={f.as_of}>{fmtDay(f.as_of)}</time>
      </p>
    </li>
  );
}

function Header({ payload, origin, compact }: { payload: MomentumPayload; origin: "live" | "snapshot"; compact?: boolean }) {
  const live = origin === "live";
  return (
    <p className="t-kicker ink-kicker flex flex-wrap items-center gap-x-2 gap-y-1" data-testid="momentum-origin" data-origin={origin}>
      <LiveDot live={live} />
      <span>{live ? "Live" : "Snapshot"}</span>
      <span aria-hidden="true">·</span>
      <span className="normal-case tracking-normal">
        {live ? "read" : "taken"} <time dateTime={payload.generated_at}>{fmtStamp(payload.generated_at)}</time>
      </span>
      {!compact && !live && <span className="sr-only">This is the snapshot taken when the page was built; the live read did not answer.</span>}
    </p>
  );
}

export default function MomentumStrip({
  variant = "band",
  ids,
  title,
  injected,
}: {
  variant?: "band" | "panel";
  /** panel only: which figures, in order. */
  ids?: string[];
  title?: string;
  injected?: MomentumRead;
}) {
  const read = useMomentum(injected);
  if (read.kind === "failed") return null;

  if (variant === "panel") {
    if (read.kind !== "ready") {
      return <div className="my-8 h-56 rounded-3xl bg-[var(--ink)] opacity-90" aria-busy="true" aria-label="Loading live figures" />;
    }
    const figs = pick(read.payload, ids);
    if (!figs.length) return null;
    const cols = figs.length >= 4 ? "lg:grid-cols-4" : figs.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
    return (
      <section
        aria-labelledby="momentum-panel-h"
        data-testid="momentum-panel"
        className="surface-ink relative my-10 overflow-hidden rounded-3xl border border-[var(--ink-border)] p-6 shadow-[0_24px_60px_-40px_rgba(3,17,11,.8)] sm:p-8"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_100%_0%,rgba(16,185,129,.16),transparent_60%)]" />
        <div className="relative">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <Header payload={read.payload} origin={read.origin} compact />
            <a href={read.payload.methodology_url} className="ink-kicker text-xs font-bold underline underline-offset-4 hover:text-white">
              How these are measured
            </a>
          </div>
          <h2 id="momentum-panel-h" className="mt-3 text-xl font-black tracking-tight text-[var(--ink-foreground)] sm:text-2xl">
            {title ?? "Counted live, from the source"}
          </h2>
          <ul className={`mt-7 grid list-none grid-cols-2 gap-x-5 gap-y-7 p-0 sm:grid-cols-3 ${cols}`}>
            {figs.map((f) => (
              <FigureCell key={f.id} f={f} size="lg" />
            ))}
          </ul>
        </div>
      </section>
    );
  }

  // band
  return (
    <section
      id="momentum"
      aria-labelledby="momentum-h"
      data-testid="momentum-strip"
      aria-busy={read.kind === "loading"}
      className="surface-ink relative overflow-hidden border-y border-[var(--ink-border)]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_70%_at_88%_0%,rgba(16,185,129,.18),transparent_62%),radial-gradient(40%_60%_at_0%_100%,rgba(16,185,129,.08),transparent_60%)]" />
      <div className="section-shell relative py-12 sm:py-16">
        {read.kind !== "ready" ? (
          <div className="min-h-[34rem] sm:min-h-[26rem]" />
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div className="min-w-0">
                <Header payload={read.payload} origin={read.origin} />
                <h2 id="momentum-h" className="t-band mt-3 max-w-3xl text-[var(--ink-foreground)]">
                  Measured in public. Published every day.
                </h2>
              </div>
              <a
                href={read.payload.methodology_url}
                className="ink-kicker inline-flex min-h-[44px] items-center text-sm font-bold underline underline-offset-4 hover:text-white"
              >
                How these are measured →
              </a>
            </div>
            <ul className="mt-10 grid list-none grid-cols-2 gap-x-5 gap-y-9 p-0 lg:grid-cols-4 lg:gap-x-8" data-testid="momentum-headline">
              {pick(read.payload, HOME_HEADLINE).map((f) => (
                <FigureCell key={f.id} f={f} size="xl" />
              ))}
            </ul>
            <ul
              className="mt-10 grid list-none grid-cols-2 gap-x-5 gap-y-8 border-t border-[var(--ink-border)] p-0 pt-9 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-6"
              data-testid="momentum-second"
            >
              {pick(read.payload, HOME_SECOND).map((f) => (
                <FigureCell key={f.id} f={f} size="md" />
              ))}
            </ul>
            <p className="ink-muted mt-9 max-w-4xl text-xs leading-relaxed">
              Each number links to the source it was read from and carries its own date. A source that does not answer
              is left out, never shown as zero. Download counts include mirrors and automated traffic, so they are not
              people or customers.{" "}
              <a href="/api/momentum" className="ink-kicker underline underline-offset-2 hover:text-white">
                Every figure as JSON
              </a>
              .
            </p>
          </>
        )}
      </div>
    </section>
  );
}
