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
    body: "The reviewer completes the relevant competency module. The server checks the answer against the current board when it is submitted and again before a decision.",
  },
  {
    id: "decision",
    title: "A named human decides with authority",
    body: "APPROVED, HOLD or REJECTED requires the deployment's configured operator authority. Without it, the decision path stays deliberately locked.",
  },
  {
    id: "receipt",
    title: "The receipt states what actually happened",
    body: "A receipt is signed only when the signing key is configured, and persisted only when the decision store is bound. It records a decision; it does not certify that the decision was right.",
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
              AI can propose. A named human decides.
            </h2>
            <p className="t-lede mt-4 text-emerald-100/75">
              A measurement records what was observed. It does not grant permission to act. Council OS keeps the escalation, competence check, operator gate and receipt in one inspectable workflow.
            </p>
            <Link
              href="/dashboard?tab=staff"
              className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-amber-300 px-5 py-3 text-sm font-black text-[#102013] transition hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
              data-testid="home-human-review-cta"
            >
              Open staff &amp; human review →
            </Link>
            <p className="mt-4 max-w-xl text-xs leading-relaxed text-emerald-100/60">
              The console reads the deployment's live gates. It never turns a missing operator token, signing key or decision store into a green light.
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
