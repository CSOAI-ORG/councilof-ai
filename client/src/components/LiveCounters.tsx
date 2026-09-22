/**
 * LiveCounters — badge pills for the adoption funnel, read live from GET /api/footprint.
 *
 * The funnel enforces download ≠ user ≠ execution ≠ customer ≠ recurring customer: each pill is
 * one stage, read from its own source, and nothing is added across stages. A pill prints a
 * number ONLY when the payload carries one for that stage, and never bare: PARTIAL prints "≥ N"
 * and STALE prints "N · stale", so the state travels with the figure instead of beside it.
 * UNCHECKABLE and UNMEASURED print as those words. Download pills also print the window the
 * figure covers, because a 30-day count and a cumulative count are different measurements and a
 * reader who is not told which one they are looking at will assume. Before the payload lands —
 * and in an automated snapshot, where a baked number would be stale the moment it was read —
 * every pill prints "—". No number in this file is typed; every figure comes from /api/footprint.
 *
 * Variants:
 *   hero   — home page, the three stages a first reader should see, plus the honesty line once.
 *   footer — site chrome, the whole funnel compact.
 *
 * The board's totals.public_count is deliberately NOT a hero pill: the homepage carries ONE
 * count line (HomeGspcTable's) by the 2026-09-16 ruling recorded in LivingStages.tsx. Pass
 * `showBoard` to add it where that ruling does not apply.
 *
 * Formatting and state mapping live in ./liveCountersFormat.ts so they can be tested without React.
 */

import { useEffect, useState } from "react";
import { FOOTER_STAGES, HERO_STAGES, pillsFor, type FootprintPayload, type Pill, type StageKey } from "./liveCountersFormat";

export const FOOTPRINT_ENDPOINT = "/api/footprint";

type Status = { kind: "loading" } | { kind: "snapshot" } | { kind: "ready"; payload: FootprintPayload } | { kind: "failed"; reason: string };

/** An automated browser (the prerender, an e2e run) must not bake a figure into HTML. */
function isSnapshot(): boolean {
  if (typeof navigator === "undefined") return true;
  return (navigator as Navigator & { webdriver?: boolean }).webdriver === true;
}

function useFootprint(): Status {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  useEffect(() => {
    if (isSnapshot()) {
      setStatus({ kind: "snapshot" });
      return;
    }
    let alive = true;
    fetch(FOOTPRINT_ENDPOINT, { headers: { accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`${FOOTPRINT_ENDPOINT} answered HTTP ${r.status}`);
        const text = (await r.text()).trim();
        if (!text || text.startsWith("<")) throw new Error(`${FOOTPRINT_ENDPOINT} returned HTML, not JSON`);
        return JSON.parse(text) as FootprintPayload;
      })
      .then((payload) => {
        if (alive) setStatus({ kind: "ready", payload });
      })
      .catch((e) => {
        if (alive) setStatus({ kind: "failed", reason: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      alive = false;
    };
  }, []);
  return status;
}

/** Every tone the formatter can produce must have a class here: a state with no colour is a
 *  state a reader does not see. The test asserts this map is exhaustive over Pill["tone"]. */
export const TONE: Record<Pill["tone"], string> = {
  numeric: "border-emerald-600/30 bg-white text-slate-900",
  PARTIAL: "border-sky-500/40 bg-sky-50 text-sky-900",
  STALE: "border-orange-400/60 bg-orange-50 text-orange-900",
  UNCHECKABLE: "border-amber-400/50 bg-amber-50 text-amber-900",
  UNMEASURED: "border-slate-300 bg-slate-50 text-slate-600",
};

function PillView({ pill, compact, placeholder }: { pill: Pill; compact: boolean; placeholder: string | null }) {
  const text = placeholder ?? pill.text;
  const tone = placeholder ? "border-slate-200 bg-white text-slate-500" : TONE[pill.tone];
  // The evidence artifact when the row was read out of one, otherwise the upstream source.
  const link = placeholder ? null : (pill.evidenceHref ?? pill.href);
  const linkLabel = pill.evidenceHref ? "evidence" : "source";
  return (
    <li
      data-stage={pill.key}
      data-state={placeholder ? "pending" : pill.tone}
      data-window={placeholder ? undefined : (pill.window ?? undefined)}
      title={placeholder ? `${pill.label} · reading ${FOOTPRINT_ENDPOINT}` : pill.title}
      className={`inline-flex items-center gap-1.5 rounded-full border ${compact ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs"} ${tone}`}
    >
      <span className="font-semibold uppercase tracking-wide text-[0.85em] text-slate-500">{pill.label}</span>
      <span className="font-black tabular-nums">{text}</span>
      {!placeholder && pill.window && (
        <span data-testid={`window-${pill.key}`} className="font-normal text-[0.85em] text-slate-500">
          {pill.window}
        </span>
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${linkLabel === "evidence" ? "Evidence" : "Source"} for ${pill.label}`}
          className="text-[0.8em] font-medium text-emerald-700 underline decoration-dotted underline-offset-2 hover:text-emerald-900"
        >
          {linkLabel}
        </a>
      )}
    </li>
  );
}

export interface LiveCountersProps {
  variant: "hero" | "footer";
  /** Add the board's totals.public_count pill. Off by default on the homepage (one count line per page). */
  showBoard?: boolean;
}

export default function LiveCounters({ variant, showBoard = false }: LiveCountersProps) {
  const status = useFootprint();
  const compact = variant === "footer";
  const stages: StageKey[] = [...(variant === "hero" ? HERO_STAGES : FOOTER_STAGES), ...(showBoard ? (["board"] as StageKey[]) : [])];

  const payload = status.kind === "ready" ? status.payload : null;
  const pills = pillsFor(payload, stages);
  // "—" while nothing has landed and in a snapshot. A failed fetch on a live page is a fact worth
  // printing: every pill says UNCHECKABLE, with the reason in its tooltip.
  const placeholder = status.kind === "loading" || status.kind === "snapshot" ? "—" : null;
  const failed = status.kind === "failed" ? status.reason : null;

  const honesty =
    payload?.honesty ??
    "Gross counts are published separately from mirror-adjusted and economically verified adoption, because downloads are not users and users are not customers.";

  return (
    <section
      data-testid={`live-counters-${variant}`}
      data-status={status.kind}
      aria-label="Adoption funnel, read live"
      className={compact ? "mb-6 text-center" : "mx-auto max-w-6xl px-4 pt-8"}
    >
      <ul className={`flex flex-wrap ${compact ? "justify-center gap-1.5" : "gap-2"}`}>
        {pills.map((pill) => (
          <PillView
            key={pill.key}
            pill={
              failed
                ? { ...pill, text: "UNCHECKABLE", tone: "UNCHECKABLE", href: null, evidenceHref: null, window: null, title: `${pill.label} · ${failed}` }
                : pill
            }
            compact={compact}
            placeholder={placeholder}
          />
        ))}
      </ul>
      {variant === "hero" && (
        <p className="mt-2 text-xs text-slate-500">
          {honesty}{" "}
          <a href={FOOTPRINT_ENDPOINT} className="text-emerald-700 underline decoration-dotted underline-offset-2">
            Every figure, its source and its as-of
          </a>
          .
        </p>
      )}
      {compact && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          One pill per stage, each from its own source.{" "}
          <a href={FOOTPRINT_ENDPOINT} className="underline decoration-dotted underline-offset-2">
            /api/footprint
          </a>
        </p>
      )}
    </section>
  );
}
