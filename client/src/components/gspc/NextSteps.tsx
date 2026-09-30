/**
 * NextSteps — "What you can do next": three plain actions after a result, so no pane is a dead end.
 * Every item is a real destination in the workspace or a served page; none sends anything.
 */
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export interface NextStep {
  href: string;
  title: string;
  body: string;
}

export default function NextSteps({ steps, testId = "next-steps" }: { steps: NextStep[]; testId?: string }) {
  if (!steps.length) return null;
  return (
    <section aria-labelledby={`${testId}-h`} className="mt-8 rounded-3xl bg-[#04120c] p-5 text-emerald-50 sm:p-6" data-testid={testId}>
      <h3 id={`${testId}-h`} className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
        What you can do next
      </h3>
      <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.href} className="min-w-0">
            <Link
              href={s.href}
              className="group flex h-full flex-col rounded-2xl border border-emerald-300/25 p-4 transition hover:border-emerald-300/70 hover:bg-emerald-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 motion-reduce:transition-none"
            >
              <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                {s.title}
                <ArrowRight className="h-4 w-4 text-emerald-300 transition group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
              </span>
              <span className="mt-1 text-sm leading-relaxed text-emerald-50/85">{s.body}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
