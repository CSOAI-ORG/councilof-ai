import {
  A_PLUS_PLUS_PLUS,
  CENSUS_STEPS,
  ELIGIBILITY_STATES,
  HUNDRED_ENVELOPE,
  HUNDRED_RULING,
  HUB_LISTING,
  MILLIONS_NEVER_CLAIM,
  MILLIONS_PUBLIC_CLAIM,
  PERMISSIONLESS_NEVER,
  PERMISSIONLESS_UNLOCKS,
  PLANTED_CATALOG,
  PLANTED_QUEUE,
} from "@/lib/hundredGate";

export default function HundredGate() {
  return (
    <section className="mt-16 space-y-8" data-testid="hundred-gate" aria-labelledby="hundred-gate-h">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-700">
          Millions · 100/100 A+++ · then permissionless
        </p>
        <h2 id="hundred-gate-h" className="mt-2 text-2xl font-black tracking-tight text-slate-900">
          {HUNDRED_RULING}
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          Hugging Face lists more than two million model repos. Cover them with a
          Speed 0 census — Hub API metadata and LFS sha256, no weight download.
          Run only unique licence-eligible lineages. When one hundred of those are
          done to the A+++ bar, N-sites becomes permissionless for flags, census
          refresh and publisher discussions. A rank is never sold.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Public claim after a signed census: {MILLIONS_PUBLIC_CLAIM}
        </p>
        <p className="mt-3 text-sm font-semibold text-rose-900">
          Never say: {MILLIONS_NEVER_CLAIM}
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5" data-testid="hundred-envelope">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-900">
          Quality envelope · 100 unique lineages
        </p>
        <p className="mt-2 font-mono text-sm text-emerald-950">
          {HUNDRED_ENVELOPE.lineages} × {HUNDRED_ENVELOPE.measured_axes} × n=
          {HUNDRED_ENVELOPE.n} = {HUNDRED_ENVELOPE.responses.toLocaleString()} responses
        </p>
        <p className="mt-1 text-sm text-emerald-900/80">{HUNDRED_ENVELOPE.assumption}</p>
        <p className="mt-2 text-[13px] text-emerald-950">
          About {(HUNDRED_ENVELOPE.tokens_approx / 1_000_000).toFixed(1)} million
          tokens under that assumption — the quality spend. Not two million
          inferences.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900">Speed 0 — how millions get listed</h3>
        <p className="mt-1 text-[13px] text-slate-500">{HUB_LISTING.list}</p>
        <p className="mt-1 text-[13px] text-slate-500">{HUB_LISTING.digest}</p>
        <p className="mt-1 text-[13px] text-slate-500">{HUB_LISTING.rate}</p>
        <p className="mt-1 text-[13px] text-slate-500">{HUB_LISTING.mcp_limit}</p>
        <p className="mt-1 text-[13px] text-slate-500">{HUB_LISTING.no_total}</p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-800">
          {CENSUS_STEPS.map((step) => (
            <li key={step.id} data-testid={`census-step-${step.id}`}>
              <span className="font-semibold">{step.title}.</span> {step.does}
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5" data-testid="planted-queue">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-600">
          Already planted · still UNMEASURED
        </p>
        <p className="mt-2 text-sm text-slate-800">
          <a href={PLANTED_QUEUE.href} className="font-semibold text-emerald-800 hover:underline">
            hub-queue
          </a>{" "}
          {PLANTED_QUEUE.n.toLocaleString()} named Hub ids · {PLANTED_QUEUE.status_all} ·{" "}
          {PLANTED_QUEUE.n_measured} measured · as of {PLANTED_QUEUE.as_of.slice(0, 10)}.{" "}
          {PLANTED_QUEUE.filter}.
        </p>
        <p className="mt-2 text-sm text-slate-800">
          <a href={PLANTED_CATALOG.href} className="font-semibold text-emerald-800 hover:underline">
            living-catalog
          </a>{" "}
          {PLANTED_CATALOG.items} discovery items · {PLANTED_CATALOG.schema}. Not a sweep
          engine.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900">Eligibility — one state per listing</h3>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {ELIGIBILITY_STATES.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              data-testid={`elig-${row.id}`}
            >
              <span className="font-mono text-[11px] text-emerald-800">{row.id}</span>
              <p className="mt-1 text-slate-600">{row.means}</p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900">A+++ — the 100 must each pass</h3>
        <p className="mt-1 text-[13px] text-slate-500">
          A+++ is this gate’s quality bar. It is not a public grade for sale.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-800">
          {A_PLUS_PLUS_PLUS.map((row) => (
            <li key={row.id} data-testid={`aplus-${row.id}`}>
              <span className="font-semibold">{row.title}.</span> {row.must}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5" data-testid="unlock-does">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-900">
            After 100/100 · permissionless does
          </p>
          <ul className="mt-3 space-y-2 text-sm text-emerald-950">
            {PERMISSIONLESS_UNLOCKS.map((row) => (
              <li key={row.id}>
                <span className="font-semibold">{row.title}.</span> {row.does}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5" data-testid="unlock-never">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-rose-900">
            After 100/100 · still never
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-rose-950">
            {PERMISSIONLESS_NEVER.map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
