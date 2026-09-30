/**
 * /reach — the whole funnel, including every stage we cannot measure.
 *
 * THE ROUTE IS /reach, AND SO IS THE FILE. /distribution is taken twice over: the ROUTE serves
 * the content-review notice (withdrawn in an earlier audit), and pages/Distribution.tsx is the
 * Layer-0 coverage map. Re-using either silently changes what an existing link or an existing
 * page means. The route-surface gate caught the first; `git show --stat` reporting a
 * modification where an addition was expected caught the second, after it had already happened.
 *
 * WHY THIS PAGE EXISTS. The home page and the site footer carry the two stages that have a
 * figure worth a stranger's attention. The owner's ruling of 2026-09-22 was that the commercial
 * stages and the unmeasured ones come OFF the front page — and that they stay published in full
 * somewhere a reader reaches in one click, because the difference between not leading with a
 * weakness and hiding one is exactly that click. This is that page.
 *
 * THE ARGUMENT IS THE UNMEASURED HALF. Four of the seven stages carry no number, and this page
 * exists to say what each of them would need before it could carry one. A funnel that reports
 * only what it can count is a vanity metric; a funnel that names what it cannot count, and what
 * would have to be true to change that, is a measurement. The "what it would take" line under
 * each stage is the row's OWN `reason` field, printed verbatim from /api/footprint — not our
 * summary of it, which could drift from the producer the moment the producer changed.
 *
 * NO CONVERSION RATE, EVER. Seven stages are seven measurements of seven different populations,
 * taken by different methods over different windows. Dividing one by another manufactures a rate
 * nobody measured, and it is the single most common way an adoption figure becomes a lie. This
 * page does no arithmetic across stages, and neither does the component it mounts.
 *
 * NOTHING HERE IS TYPED AND NOTHING HERE IS OURS TO COMPUTE. LiveCounters owns /api/footprint,
 * the funnel order, the labels and the pills. This page mounts variant="funnel", reads the same
 * endpoint for the per-stage reasons, and writes the surrounding argument.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import LiveCounters from "@/components/LiveCounters";
import {
  FULL_FUNNEL_STAGES,
  FUNNEL_LABELS,
  type FootprintPayload,
  type FootprintRow,
  type StageKey,
} from "@/components/liveCountersFormat";
import { useFootprintPayload } from "@/components/home/useHomeReads";
import { setMetaDescription } from "@/lib/utils";

const PAGE_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "How far this work reaches, and what we have not measured",
  url: "https://councilof.ai/reach",
  description:
    "Seven separate measurements of seven separate things: registry listings, downloads, non-mirror downloads, observed executions, paying wallets, repeat payers and institutions. Each stage carries its own state and, where it has no number, the reason it has none. No stage is added to another and no conversion rate is derived.",
  isPartOf: { "@type": "WebSite", url: "https://councilof.ai" },
};

/** What each stage counts, in the reader's words. The state and the reason come off the wire. */
export const STAGE_MEANING: Record<StageKey, string> = {
  registry_listings: "How many named things we publish are actually listed in a public registry.",
  gross_distribution: "Reported package-download events, counted package by package. PyPI uses third-party Pepy; npm and Hugging Face use their public APIs.",
  qualified_distribution: "The same downloads with mirrors, build servers and crawlers taken out.",
  observed_execution: "How many times something we published was actually run, rather than fetched.",
  economic_use: "How many distinct wallets, that are not ours, have paid for something.",
  repeat_payers: "How many of those came back and paid again.",
  institutional_use: "How many named organisations are using this, as organisations.",
  board: "The measurement board's own totals.",
  signed_cards: "Signed records that re-verify.",
  github_stars: "Stars on the public repository.",
};

export interface StageLine {
  key: StageKey;
  label: string;
  meaning: string;
  state: string;
  /** The row's own account of why it says what it says. Verbatim, or null. */
  reason: string | null;
}

/**
 * One line per funnel stage, in funnel order. A stage the payload does not carry says so; it is
 * never dropped, because a stage that quietly disappears is how a funnel flatters itself.
 */
export function stageLines(payload: FootprintPayload | null): StageLine[] {
  return FULL_FUNNEL_STAGES.map((key) => {
    const row = payload?.[key] as FootprintRow | undefined;
    const reason = typeof row?.reason === "string" && row.reason.trim() !== "" ? row.reason : null;
    return {
      key,
      label: FUNNEL_LABELS[key],
      meaning: STAGE_MEANING[key],
      state: typeof row?.state === "string" ? row.state : payload ? "absent from the payload" : "reading",
      reason,
    };
  });
}

const STATE_TONE: Record<string, string> = {
  READ: "border-emerald-600/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
  PARTIAL: "border-emerald-600/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
  STALE: "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  UNCHECKABLE: "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  UNMEASURED: "border-border bg-muted text-muted-foreground",
};

function StageRow({ line }: { line: StageLine }) {
  const tone = STATE_TONE[line.state] ?? "border-border bg-muted text-muted-foreground";
  return (
    <li className="grid gap-2 border-t border-border py-6 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-8" data-stage-row={line.key}>
      <div>
        <p className="text-[15px] font-black leading-snug text-foreground">{line.label}</p>
        <span className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold ${tone}`}>
          {line.state}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-[15px] leading-relaxed text-foreground">{line.meaning}</p>
        {line.reason ? (
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            <span className="font-bold text-foreground/80">What it would take: </span>
            {line.reason}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export default function Distribution() {
  const read = useFootprintPayload();
  const payload = read.kind === "ready" ? read.payload : null;
  const lines = stageLines(payload);

  useEffect(() => {
    document.title = "How far this work reaches — Council of AI";
    setMetaDescription(
      "Seven separate measurements of seven separate things, each with its own state and, where it has no number, the reason it has none. Nothing is added across stages and no conversion rate is derived.",
    );
  }, []);

  return (
    <section data-testid="distribution-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_LD) }} />

      <section className="surface-ink section-y">
        <div className="section-shell">
          <p className="t-kicker ink-kicker">Distribution, in full</p>
          <h1 className="t-band mt-4 max-w-4xl text-[color:var(--ink-foreground)]">
            How far this work reaches — and the four things we still cannot tell you.
          </h1>
          <p className="t-lede measure mt-6 ink-muted">
            This is the whole picture, not the flattering part of it. Seven stages, measured seven
            different ways, over different spans of time, about different populations. Three of
            them carry a number today. Four do not, and each one says why.
          </p>
          <p className="measure mt-5 text-[15px] leading-relaxed ink-muted">
            You will not find a conversion rate on this page. Dividing one of these stages by
            another would invent a ratio nobody measured — it is the most common way an adoption
            figure stops being true, and we would rather publish four blanks than one of those.
          </p>
        </div>
      </section>

      {/* The pills, exactly as LiveCounters renders them: every stage, every state, its own line. */}
      <section className="surface-base section-y-sm border-t border-border" aria-label="Every funnel stage, read live">
        <LiveCounters variant="funnel" />
      </section>

      <section className="surface-base section-y border-t border-border" aria-labelledby="stages-h">
        <div className="section-shell">
          <h2 id="stages-h" className="t-section text-foreground">
            What each stage counts, and what the empty ones would need
          </h2>
          <p className="t-lede measure mt-4 text-muted-foreground">
            The line under each stage is that stage&apos;s own account of itself, printed word for
            word from{" "}
            <a href="/api/footprint" className="font-semibold text-emerald-700 underline underline-offset-2 dark:text-emerald-300">
              /api/footprint
            </a>
            . It is not our summary of the reason, so it cannot drift away from the thing that
            produces it.
          </p>
          {read.kind === "failed" ? (
            <p className="mt-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm text-foreground">
              The funnel could not be read just now — {read.reason}. Nothing is shown in its place.
            </p>
          ) : (
            <ul className="mt-8 border-b border-border">
              {lines.map((l) => (
                <StageRow key={l.key} line={l} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="surface-sunken section-y border-t border-border" aria-labelledby="why-h">
        <div className="section-shell grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 id="why-h" className="t-section text-foreground">
              Why we publish the blanks
            </h2>
            <p className="t-lede mt-4 text-muted-foreground">
              A download is not a person. A person is not a customer. Every adoption number you
              have ever been shown collapses those three, and once they are collapsed there is no
              way back to what was actually counted.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              So we keep them apart, publish each one with the date and the source it came from,
              and leave the stages we have not instrumented visibly empty. An empty stage here is
              not a gap in the reporting — it is the reporting. It tells you precisely what we do
              and do not know about our own reach, which is the same standard we hold every system
              we measure to.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <h3 className="text-lg font-black tracking-tight text-foreground">Where to go next</h3>
            <ul className="mt-5 space-y-4 text-[15px]">
              <li>
                <Link href="/" className="font-bold text-emerald-700 underline underline-offset-4 dark:text-emerald-300">
                  The front page
                </Link>
                <span className="mt-1 block text-[13.5px] text-muted-foreground">
                  what we measure, and the short view of what the work reaches
                </span>
              </li>
              <li>
                <Link href="/methodology" className="font-bold text-emerald-700 underline underline-offset-4 dark:text-emerald-300">
                  How a measurement is made
                </Link>
                <span className="mt-1 block text-[13.5px] text-muted-foreground">
                  the same discipline, applied to the systems we test rather than to ourselves
                </span>
              </li>
              <li>
                <Link href="/refutation-ledger" className="font-bold text-emerald-700 underline underline-offset-4 dark:text-emerald-300">
                  Everything we have had to correct
                </Link>
                <span className="mt-1 block text-[13.5px] text-muted-foreground">
                  what was wrong, how it was caught and what changed, dated
                </span>
              </li>
              <li>
                <a href="/interop/distribution-latest.json" className="font-bold text-emerald-700 underline underline-offset-4 dark:text-emerald-300">
                  The package-by-package evidence
                </a>
                <span className="mt-1 block text-[13.5px] text-muted-foreground">
                  every package counted, with its own figure, so you can recount it yourself
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </section>
  );
}
