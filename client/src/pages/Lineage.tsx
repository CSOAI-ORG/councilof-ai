import { useEffect } from "react";

// Current design commentary. Historical analogies are inspiration, not validation of software.
const IDEAS = [
  {
    inspiration: "Councils and deliberative assemblies",
    question: "How can different views be heard, objections recorded and responsibility assigned?",
    check: "A review process needs named participants, stated authority and a record of decisions. Multiple agents alone do not establish independent oversight.",
  },
  {
    inspiration: "Seals, witnesses and written records",
    question: "How can a later reader check which record was issued and whether it changed?",
    check: "A signature can establish integrity under a key. The truth of the content, the signer's authority and the evidence behind it require separate checks.",
  },
  {
    inspiration: "Shared rules and exchange networks",
    question: "How can different participants exchange records without one interface controlling every step?",
    check: "Published formats, test fixtures and interoperable tools can be inspected and rerun. Compatibility must be tested against specific versions.",
  },
  {
    inspiration: "Layered defences",
    question: "What happens when a check fails, a source disappears or an actor exceeds their authority?",
    check: "Each control needs a defined scope and a way to test failure. A diagram or a number of layers is not evidence of effective protection.",
  },
];

export default function Lineage() {
  useEffect(() => { document.title = "Design lineage | Council of AI"; }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 py-16 text-white sm:py-20">
        <div className="relative mx-auto max-w-5xl px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-emerald-300">Council of AI · design inspiration</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Old questions. Testable systems.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-emerald-50">
            Who may decide, using what evidence, and how can a decision be challenged?
            These questions guide our work on AI measurement, records and human responsibility.
            Councils, witnesses, shared rules and layered defences offer useful design analogies.
          </p>
          <p className="mt-4 max-w-3xl leading-7 text-emerald-100">
            This page describes inspiration. It does not establish historical equivalence, a cognitive law,
            or proof that a modern implementation works. Those claims need their own evidence.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12 sm:py-16" aria-labelledby="lineage-ideas">
        <h2 id="lineage-ideas" className="text-2xl font-bold">Ideas that become review questions</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {IDEAS.map((idea) => (
            <article key={idea.inspiration} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-bold">{idea.inspiration}</h3>
              <p className="mt-3 font-medium leading-7">{idea.question}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{idea.check}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-emerald-600/30 bg-emerald-500/5 p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Judge the current work by its evidence</h2>
          <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
            For users, partners and investors, the useful questions are what operates today, what others have
            run or implemented, what rights apply to the assets, and what commercial demand is recorded.
            Design inspiration does not establish adoption, effectiveness or company value.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/traction/" className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800">Inspect operation and external use</a>
            <a href="/methodology/" className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 py-3 font-semibold underline underline-offset-4">Read the methods</a>
            <a href="/gspc-verify/" className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 py-3 font-semibold underline underline-offset-4">Verify a record</a>
          </div>
        </div>
      </section>
    </div>
  );
}
