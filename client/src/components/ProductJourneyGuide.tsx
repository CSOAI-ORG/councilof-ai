import catalog from "../../../public/catalog.json";

/** A task view of the existing catalogue, not another product or authority registry. */
export default function ProductJourneyGuide() {
  return (
    <section aria-labelledby="product-journeys-heading" className="mt-10">
      <p className="font-mono text-xs uppercase tracking-wider text-emerald-400">Data, tools and end-user workflows</p>
      <h2 id="product-journeys-heading" className="mt-2 text-2xl font-bold text-slate-100">Choose the task, then inspect the evidence.</h2>
      <p className="mt-3 max-w-3xl leading-7 text-slate-300">
        Measurement, verification, rechecks, learning and integrations share the same evidence foundation.
        Each path below identifies its input, output, limits and recovery route. You do not need to buy a review to use the public data tools.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {catalog.journeys.map((journey) => (
          <article key={journey.id} data-testid={`product-journey-${journey.id}`} className="flex min-w-0 flex-col rounded-2xl border border-emerald-400/25 bg-emerald-950/30 p-5 sm:p-6">
            <p className="font-mono text-xs uppercase tracking-wide text-emerald-300">{journey.mode}</p>
            <h3 className="mt-2 text-xl font-bold leading-snug text-slate-100">{journey.title}</h3>
            <p className="mt-3 leading-7 text-slate-300">{journey.summary}</p>
            <details className="mt-4 rounded-lg border border-emerald-400/20 px-3">
              <summary className="min-h-11 cursor-pointer py-3 font-semibold text-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">Inputs, output and recovery</summary>
              <dl className="space-y-3 pb-3 text-sm leading-6 text-slate-300">
                <div><dt className="font-semibold text-slate-100">Bring</dt><dd>{journey.input}</dd></div>
                <div><dt className="font-semibold text-slate-100">Receive</dt><dd>{journey.output}</dd></div>
                <div><dt className="font-semibold text-slate-100">Retain or recover</dt><dd>{journey.recovery}</dd></div>
              </dl>
              <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-300">
                {journey.steps.map((step, index) => <li key={`${journey.id}-${index}`}>{step}</li>)}
              </ol>
              <p className="mb-4 border-t border-emerald-400/20 pt-3 text-sm leading-6 text-slate-300"><strong className="text-slate-100">Boundary: </strong>{journey.boundary}</p>
            </details>
            <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5">
              <a href={journey.href} className="inline-flex min-h-11 items-center rounded-lg border border-emerald-400/40 px-3 py-2 font-semibold text-emerald-200 hover:bg-emerald-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">{journey.action}<span aria-hidden="true" className="ml-2">→</span></a>
              {journey.secondary ? <a href={journey.secondary.href} className="inline-flex min-h-11 items-center py-2 text-sm text-emerald-200 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">{journey.secondary.label}</a> : null}
            </div>
          </article>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">Catalogue edition: {catalog.updated}. This dates the product guide, not a measurement, legal review or platform installation. Existing service and payment boundaries remain unchanged.</p>
    </section>
  );
}
