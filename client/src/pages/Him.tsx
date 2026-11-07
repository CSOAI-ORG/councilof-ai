import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { HUMAN_REVIEW_STEPS } from "@/components/home/HomeHumanReview";

/**
 * MEOK H.I.M. — the human-in-the-loop layer, named.
 *
 * H.I.M. was already woven through the estate — the staff console's live gates,
 * evidence-delivery review, the axis specialists' HOLD gates — but it had no page,
 * no menu door and no name a stranger could find. This page is the named front
 * door: it reuses the homepage's own four-step explanation (one source of truth)
 * and links only to surfaces that already exist. It claims no new capability:
 * no autonomous action, no signature, no admission — the words below stay inside
 * what those panes already say.
 */

const HIM_GATES = [
  {
    id: "staff",
    title: "Staff & human review",
    body: "Inspect an AI staff proposal, answer a reading check against the current record, and see whether decision recording, signing and persistence are available. The console does not establish the operator's identity or authority to execute the proposal.",
    href: "/dashboard?tab=staff",
  },
  {
    id: "evidence-delivery",
    title: "Evidence delivery review",
    body: "A local evidence draft goes through MEOK H.I.M. review before anything is submitted — and submission returns an unsigned A2A message. It does not measure, sign, anchor or durably store.",
    href: "/dashboard?tab=evidence-delivery",
  },
  {
    id: "axis-specialists",
    title: "Axis specialists under HOLD",
    body: "Inspect the published specialist roster and its individual audit records. Recommendations stay under MEOK H.I.M. HOLD gates. No proposal is applied by itself.",
    href: "/dashboard?tab=axis-specialists",
  },
  {
    id: "research",
    title: "Continuous research watch",
    body: "Every measured axis names its authoritative sources and what still needs a human: missing runtime, safe automation and the review that re-measurement requires.",
    href: "/dashboard?tab=research",
  },
] as const;

export default function Him() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Helmet>
        <title>MEOK H.I.M. — the human in the loop · Council of AI</title>
        <meta
          name="description"
          content="Inspect an AI proposal, check your understanding of its record and retain a decision receipt. Human identity, authority and executed effects need separate verification."
        />
      </Helmet>

      <section
        aria-labelledby="him-h"
        className="border-b border-emerald-800/60 bg-[#061811] text-emerald-50"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-amber-300">
            MEOK H.I.M. · Human in the loop
          </p>
          <h1 id="him-h" className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
            AI proposes. Review and record the decision.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-emerald-100/80">
            A measurement records what was observed. It does not grant permission to act.
            MEOK H.I.M. is the name for the human layer kept across Council OS: the escalation,
            the reading check, the operator gate and the receipt. Recording a decision does not
            establish the person's identity or authorize the proposed action.
          </p>
          <Link
            href="/dashboard?tab=staff"
            className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-amber-300 px-5 py-3 text-sm font-black text-[#102013] transition hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
          >
            Open the live review console →
          </Link>
        </div>
      </section>

      <section aria-labelledby="him-steps-h" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 id="him-steps-h" className="text-xl font-black tracking-tight text-slate-900">
          The four steps, every time
        </h2>
        <ol className="mt-6 grid list-none gap-3 p-0 sm:grid-cols-2">
          {HUMAN_REVIEW_STEPS.map((step, index) => (
            <li
              key={step.id}
              className="rounded-2xl border border-emerald-800/40 bg-emerald-950/5 p-5"
            >
              <span className="font-mono text-xs font-black tabular-nums text-emerald-800">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-base font-black leading-snug text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="him-gates-h" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <h2 id="him-gates-h" className="text-xl font-black tracking-tight text-slate-900">
          Where H.I.M. stands guard
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {HIM_GATES.map((gate) => (
            <Link
              key={gate.id}
              href={gate.href}
              className="group rounded-2xl border border-border bg-white p-5 transition hover:border-emerald-700/60 hover:shadow-[0_4px_0_rgba(4,98,74,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-900">
                {gate.title} <span aria-hidden="true" className="text-emerald-700">→</span>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{gate.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="him-limits-h" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl border border-amber-300/70 bg-amber-50 p-6">
          <h2 id="him-limits-h" className="text-base font-black text-amber-950">
            What H.I.M. is not
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-amber-950/90">
            <li>Not autonomous: the operator token controls access to decision recording; it does not establish a person's identity or permission to execute.</li>
            <li>Never a rubber stamp: the console never turns a missing operator token, signing key or decision store into a green light.</li>
            <li>Not a verdict on itself: a receipt records that a decision happened — it does not certify that the decision was right.</li>
            <li>Not an execution grant: a recorded review is separate from the acting system's authorization checks and any observed effect.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
