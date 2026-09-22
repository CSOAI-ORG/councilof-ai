/**
 * HomeReach — how far the work has travelled, and how much of it verifies.
 *
 * THE HEADINGS ARE IN THE READER'S LANGUAGE; THE QUALIFIERS STAY (owner, 2026-09-22). The state
 * words this estate publishes — PARTIAL, UNCHECKABLE, UNMEASURED, "catalogued", "measured" — are
 * honest and they stay on screen, but they sit beside the figure in small type. The heading says
 * what the number means to a person.
 *
 * THE DISTRIBUTION PILLS ARE NOT OURS TO RENDER. LiveCounters owns /api/footprint, its funnel
 * order and its pill labels, and a second lane is rewriting the measurement behind it. This band
 * mounts it and writes the surrounding sentence; it does not touch a figure, a label or a state.
 *
 * AND IT MOUNTS THE HERO VARIANT, NOT THE WHOLE FUNNEL (owner, 2026-09-22). Four of the seven
 * funnel stages can only say UNMEASURED today, and a column of them was the first thing a
 * visitor read. The commercial stages — paying wallets, repeat payers, institutions — are not
 * front-page material either, in pills or in prose: a single paying wallet beside a large
 * distribution figure tells a first-time reader nothing true about either. None of it is
 * deleted or softened. The complete funnel, every stage, every state, every source and the
 * honesty line, stays published at /api/footprint, which is where that discipline is the
 * argument. This band writes the sentence around whichever stages LiveCounters renders and
 * names none of them itself, so it cannot re-introduce one in prose.
 *
 * THREE CARD CORPORA, NEVER ADDED. The signed card index and the public root are different sets
 * of different things with zero identifiers in common, and the estate's own validator says so.
 * The one number behind which a check actually ran — how many card bodies re-verified — carries
 * the word "measured"; the root's leaf count carries "catalogued". Printing them in one row
 * without their kinds is how three true numbers became one wrong sentence before.
 */
import { Link } from "wouter";
import LiveCounters from "@/components/LiveCounters";
import {
  corpusOverlap,
  rootLeafCount,
  signedCardsVerified,
  type ReadState,
  type StatePayload,
} from "./homeReads";

export interface CorpusLine {
  figure: string;
  headline: string;
  qualifier: string;
}

/**
 * The evidence lines, from /api/state. Each carries its own kind: a body that re-verified is a
 * measured fact, a leaf counted on the root is a catalogued one, and the two are named apart.
 */
export function corpusLines(read: ReadState<StatePayload>): CorpusLine[] | { unread: string } {
  if (read.kind === "loading") return [];
  if (read.kind === "failed") return { unread: read.reason };
  const s = read.payload;
  const verified = signedCardsVerified(s);
  const leaves = rootLeafCount(s);
  const overlap = corpusOverlap(s);
  const lines: CorpusLine[] = [];
  if (verified)
    lines.push({
      figure: String(verified.value),
      headline: "signed records re-checked and still valid",
      qualifier: `kind: ${verified.kind} — a check was actually run over these bodies`,
    });
  if (leaves !== null)
    lines.push({
      figure: String(leaves),
      headline: "records sealed under the one signed root",
      qualifier: "kind: catalogued — counted on the root, a different set from the one above",
    });
  if (overlap !== null)
    lines.push({
      figure: String(overlap),
      headline: "identifiers the two sets have in common",
      qualifier: "they are separate populations; adding them would be a number about nothing",
    });
  return lines;
}

function Line({ line }: { line: CorpusLine }) {
  return (
    <div className="border-t border-border pt-5" data-corpus-line={line.headline}>
      <p className="font-mono text-3xl font-black tabular-nums text-foreground sm:text-4xl">{line.figure}</p>
      <p className="mt-2 text-[15px] font-bold leading-snug text-foreground">{line.headline}</p>
      <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">{line.qualifier}</p>
    </div>
  );
}

export default function HomeReach({ state }: { state: ReadState<StatePayload> }) {
  const lines = corpusLines(state);
  return (
    <section
      id="reach"
      aria-labelledby="reach-h"
      className="surface-base section-y border-t border-border"
      data-testid="home-reach"
    >
      <div className="section-shell">
        <p className="t-kicker text-emerald-700 dark:text-emerald-300">Where the work has got to</p>
        <h2 id="reach-h" className="t-band mt-4 max-w-3xl text-foreground">
          The work travels, and it holds up when you check it.
        </h2>
        <p className="t-lede measure mt-5 text-muted-foreground">
          Two different questions, and mixing them is how every adoption number you have ever read
          became meaningless. How far the packages and listings have reached is one measurement.
          Whether the evidence itself survives a re-check is another, and it is the one that
          matters.
        </p>

        {/*
          How far it reaches. LiveCounters owns /api/footprint, its stages and its labels; this
          band mounts it and writes the sentence around it, never a figure inside it. The hero
          variant is deliberate: it carries the stages that have something to say today, and the
          full stage-by-stage funnel — including every stage still unmeasured — is published in
          one place at /api/footprint rather than as a column of UNMEASURED on the front door.
        */}
        <div className="mt-10">
          <h3 className="text-xl font-black tracking-tight text-foreground">How far it reaches</h3>
          <div className="mt-4">
            <LiveCounters variant="hero" />
          </div>
          {/*
            The short view must never read as the complete one. Four more stages carry no number
            at all, and the wallets that have paid us are one of them — a reader who wants the
            uncomfortable half is one click away from it, by name, not by hunting.
          */}
          <p className="mt-5 text-[14px] leading-relaxed text-muted-foreground">
            That is the short view.{" "}
            <Link
              href="/reach"
              className="font-bold text-emerald-700 underline underline-offset-4 dark:text-emerald-300"
            >
              The whole funnel — all seven stages, including the four we cannot measure and what
              each of them would need
            </Link>
            .
          </p>
        </div>

        {/* What actually verifies. Three numbers, three kinds, never added. */}
        <div className="mt-14">
          <h3 className="text-xl font-black tracking-tight text-foreground">And when you check the evidence itself</h3>
          {Array.isArray(lines) ? (
            lines.length ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                {lines.map((l) => (
                  <Line key={l.headline} line={l} />
                ))}
              </div>
            ) : (
              <p className="mt-4 font-mono text-sm text-muted-foreground">reading /api/state …</p>
            )
          ) : (
            <p className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm text-foreground">
              The evidence state could not be read — {lines.unread}. Nothing is shown in its place.
            </p>
          )}
          <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
            These are separate sets of separate records. Say which one you mean, every time — and
            never add them.{" "}
            <a href="/api/state" className="font-semibold text-emerald-700 underline underline-offset-2 dark:text-emerald-300">
              How every one of these counts was derived
            </a>
            .
          </p>
        </div>

      </div>
    </section>
  );
}
