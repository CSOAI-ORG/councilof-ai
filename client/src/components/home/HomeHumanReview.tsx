import { Link } from "wouter";

export const HUMAN_REVIEW_STEPS = [
  {
    id: "challenge",
    title: "The AI staff member stops and escalates",
    body: "A request to publish, release, send or approve becomes a challenge with its subject, proposed action and supporting record. The AI staff member does not perform the act itself.",
  },
  {
    id: "competency",
    title: "The reviewer reads the live record",
    body: "A short reading check uses the current board. The answer is checked when it is submitted and again before a decision.",
  },
  {
    id: "decision",
    title: "An operator records the decision",
    body: "Choose APPROVED, HOLD or REJECTED when the review service is available. The record captures the decision and the operator name supplied; it does not verify the person's identity or authority.",
  },
  {
    id: "receipt",
    title: "A receipt preserves the decision",
    body: "The result shows whether the decision was saved and signed. A receipt does not prove the proposed action happened or that the decision was right.",
  },
] as const;

/** The visible home-page explanation of the same gated workflow rendered in Council OS. */
export default function HomeHumanReview() {
  return (
    <section
      id="human-review"
      aria-labelledby="home-human-review-h"
      className="border-t border-emerald-800/60 bg-[#061811] section-y text-emerald-50"
      data-testid="home-human-review"
    >
      <div className="section-shell">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          <div>
            <p className="t-kicker text-amber-300">Human in the loop · H.I.M.</p>
            <h2 id="home-human-review-h" className="t-band mt-3 text-white">
              AI proposes. Review and record the decision.
            </h2>
            <p className="t-lede mt-4 text-emerald-100/75">
              Inspect the proposal and evidence, check your understanding, and keep a record of the decision. Recording a decision does not authorize or perform the proposed action.
            </p>
            <Link
              href="/dashboard?tab=staff"
              className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-amber-300 px-5 py-3 text-sm font-black text-[#102013] transition hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
              data-testid="home-human-review-cta"
            >
              Open staff &amp; human review →
            </Link>
            <p className="mt-4 max-w-xl text-xs leading-relaxed text-emerald-100/60">
              The console shows the review service's current availability and each receipt's status. Human identity, permission to act and the outcome need separate verification.
            </p>
          </div>
          <ol className="grid list-none gap-3 p-0 sm:grid-cols-2">
            {HUMAN_REVIEW_STEPS.map((step, index) => (
              <li
                key={step.id}
                data-human-review-step={step.id}
                className="rounded-2xl border border-emerald-700/60 bg-emerald-950/50 p-5 sm:p-6"
              >
                <span className="font-mono text-xs font-black tabular-nums text-amber-300">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-lg font-black leading-snug text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-emerald-100/70">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
