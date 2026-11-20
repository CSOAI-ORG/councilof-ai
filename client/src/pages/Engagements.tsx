import { Link } from "wouter";

/**
 * /engagements — what a scoped evidence engagement is, and what it is not.
 *
 * Static copy by design: this page has no counts, so nothing here is typed and nothing here goes stale.
 * The four offerings each name machinery that already ships (native-log ingest, claim maintenance,
 * dependency change records, connection audits). Prices are quoted privately and are never published.
 */

const OFFERINGS: Array<{ name: string; blurb: string; points: string[] }> = [
  {
    name: "Artifact qualification",
    blurb:
      "You have an evaluation log, model card, benchmark result or dataset. We qualify it.",
    points: [
      "Recount what it claims from its own bytes — declared versus observed, side by side",
      "State the mapping and versions used, and run a negative control that must discriminate",
      "Return dated evidence records in our published schema, preserving every limitation",
      "Missing or malformed evidence stays marked as such. It never becomes a pass",
    ],
  },
  {
    name: "Claim maintenance",
    blurb: "You cite numbers — ours or others'. We keep the citations honest over time.",
    points: [
      "Re-read the sources on a schedule, diffing extracted text rather than raw bytes",
      "Adjudicate each difference and publish corrections where a claim changed",
      "Deliver a register of what changed and which of your cited conclusions are affected",
    ],
  },
  {
    name: "Dependency change evidence",
    blurb: "You operate a set of approved MCP servers or AI dependencies.",
    points: [
      "Watch the published records for version, endpoint, package digest and configuration changes",
      "Deliver a dated change record stating which of your earlier checks may no longer apply",
      "Coverage is stated with every record; absence of a record is never treated as evidence of absence",
    ],
  },
  {
    name: "Connection audit",
    blurb: "We probe every endpoint you advertise — registries, catalogues, documentation.",
    points: [
      "Report which endpoints answer and which do not, with HTTP status and time",
      "Classify each as connected, wrong-path, dead-host or no-remote",
      "A listing that answers nothing costs more trust than absence; this finds those",
    ],
  },
];

const NOTS: Array<[string, string]> = [
  ["Not certification", "We measure; we do not certify, rank, or endorse. No engagement outcome is a grade, a mark or a badge."],
  ["Not a security audit", "A change record says re-check. It never says compromised. A connection audit names dead endpoints; it does not assess the software behind them."],
  ["Not safety assurance", "A recount of an evaluation log does not establish that the model ran as claimed, that a benchmark was uncontaminated, or that a system is safe."],
  ["Not silent", "Every method is stated, every limitation preserved, and every correction published in our public ledger."],
];

const FAQ: Array<[string, string]> = [
  ["Is this a security audit?", "No. A change record tells you that something changed and which earlier checks may not carry over. It does not tell you whether the new version is safe."],
  ["Do you certify AI systems?", "No. We measure and publish dated evidence with stated limits. Nothing we produce is a grade, a rank or a badge."],
  ["What does it cost?", "Quotes are private, dated and reference-specific, scoped before work starts. We do not publish prices."],
  ["What happens to our data?", "The engagement scope names it. We retain the artefacts needed to keep your evidence re-openable, under the data class declared in the scope, and nothing beyond it."],
  ["Who has used this?", "See traction for dated, qualified records of outside use — and their limits. Nobody there is a customer; we say so on the same page."],
  ["Can we self-serve first?", "Yes. The board, the verifier and the corrections ledger are free forever. Start with claim maintenance and the public root; an engagement is for when you want the same treatment applied to your own artefacts."],
];

export default function Engagements() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      <main className="mx-auto max-w-4xl px-5 pb-16 pt-10">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">
          engagements
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Evidence work, scoped and receipted
        </h1>
        <p className="mt-4 text-lg leading-7 text-slate-300">
          Council of AI helps you inspect what an AI measurement establishes, trace it to its source, and carry
          that evidence into your own work. An engagement is one bounded piece of that work, delivered with a
          receipt you can re-open later.
        </p>

        <section className="mt-10" aria-labelledby="offerings">
          <h2 id="offerings" className="text-xl font-bold">What we offer</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {OFFERINGS.map((o) => (
              <article key={o.name} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-lg font-bold text-emerald-300">{o.name}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-300">{o.blurb}</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
                  {o.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span aria-hidden className="text-emerald-500">·</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-5" aria-labelledby="not">
          <h2 id="not" className="text-xl font-bold">What this is not</h2>
          <dl className="mt-3 space-y-3 text-sm leading-6">
            {NOTS.map(([t, d]) => (
              <div key={t}>
                <dt className="font-semibold text-slate-200">{t}</dt>
                <dd className="text-slate-400">{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10" aria-labelledby="start">
          <h2 id="start" className="text-xl font-bold">How it starts</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Write to{" "}
            <a className="font-semibold text-emerald-300 underline" href="mailto:contact@csoai.org">
              contact@csoai.org
            </a>{" "}
            with the artefact or claim set and the decision it feeds. We reply with a scoped, dated,
            reference-specific quote. Prices are quoted privately and are never published.
          </p>
        </section>

        <section className="mt-10" aria-labelledby="faq">
          <h2 id="faq" className="text-xl font-bold">FAQ</h2>
          <div className="mt-3 space-y-4">
            {FAQ.map(([q, a]) => (
              <details key={q} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-200">{q}</summary>
                <p className="mt-2 text-sm leading-6 text-slate-400">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="mt-10 text-sm text-slate-400">
          Dated records of outside use — and what they do not establish — live on{" "}
          <Link className="text-emerald-300 underline" href="/traction">the traction page</Link>. The board,
          the verifier and the corrections ledger are{" "}
          <Link className="text-emerald-300 underline" href="/claim-maintenance">free forever</Link>.
        </p>
      </main>
    </div>
  );
}
