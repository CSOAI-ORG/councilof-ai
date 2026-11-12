import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import ExternalUseEvidence from "@/components/ExternalUseEvidence";
import { OPERATING_ORGANISATION_SUMMARY } from "@/data/external-use";

type State = {
  root: { cards: number; asOf: string } | null;
  revenue: { payers: number; settlements: number; atomic: number } | null;
  commissions: { outside: number; excluded: number; unknown: number; count: number; queued: number; unfulfillable: number } | null;
  coverage: number | null;
  worker: string | null;
  corrections: number | null;
  failed: string[];
};
const EMPTY: State = { root: null, revenue: null, commissions: null, coverage: null, worker: null, corrections: null, failed: [] };

async function json(path: string, signal: AbortSignal) {
  const response = await fetch(path, { signal, cache: "no-store", headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
const integer = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : null;

export default function Traction() {
  const [live, setLive] = useState<State>(EMPTY);
  useEffect(() => {
    const controller = new AbortController();
    const paths = ["/root.json", "/api/revenue", "/api/commissions", "/api/coverage", "/api/worker", "/api/corrections"];
    Promise.allSettled(paths.map((path) => json(path, controller.signal))).then(([root, revenue, commissions, coverage, worker, corrections]) => {
      if (controller.signal.aborted) return;
      const next: State = { ...EMPTY, failed: [] };
      if (root.status === "fulfilled") {
        const cards = integer(root.value?.card_count);
        const asOf = typeof root.value?.as_of === "string" ? root.value.as_of : null;
        if (cards !== null && asOf) next.root = { cards, asOf }; else next.failed.push("root");
      } else next.failed.push("root");
      if (revenue.status === "fulfilled") {
        const one = revenue.value?.one_number;
        const payers = integer(one?.all_time), settlements = integer(one?.settlements);
        const atomic = integer(revenue.value?.settled_usdc?.count ?? one?.settled_usdc_atomic);
        if (one?.status === "MEASURED" && payers !== null && settlements !== null && atomic !== null) next.revenue = { payers, settlements, atomic };
        else next.failed.push("revenue");
      } else next.failed.push("revenue");
      if (commissions.status === "fulfilled") {
        // Outside commissions only: receipts are classified by payer (OUTSIDE / SELF_TEST / ZERO_VALUE / UNCHECKABLE).
        // A self-paid or zero-value test is never shown as demand; without by_origin the card is UNCHECKABLE.
        const origin = commissions.value?.by_origin;
        const outside = integer(origin?.OUTSIDE), selfTest = integer(origin?.SELF_TEST), zeroValue = integer(origin?.ZERO_VALUE), unknown = integer(origin?.UNCHECKABLE);
        const count = integer(commissions.value?.count), queued = integer(commissions.value?.queued), unfulfillable = integer(commissions.value?.unfulfillable);
        if (outside !== null && selfTest !== null && zeroValue !== null && unknown !== null && count !== null && queued !== null && unfulfillable !== null) {
          next.commissions = { outside, excluded: selfTest + zeroValue, unknown, count, queued, unfulfillable };
        } else next.failed.push("commissions");
      } else next.failed.push("commissions");
      if (coverage.status === "fulfilled" && Array.isArray(coverage.value?.rows)) next.coverage = coverage.value.rows.length;
      else next.failed.push("coverage");
      if (worker.status === "fulfilled" && typeof worker.value?.status === "string") next.worker = worker.value.status;
      else next.failed.push("worker");
      // Count of published correction entries in the corrections ledger — each states what was wrong and the fix. Never typed by hand.
      if (corrections.status === "fulfilled" && Array.isArray(corrections.value?.corrections)) next.corrections = corrections.value.corrections.length;
      else next.failed.push("corrections");
      setLive(next);
    });
    return () => controller.abort();
  }, []);
  const usdc = live.revenue ? `$${(live.revenue.atomic / 1_000_000).toFixed(2)}` : undefined;

  return <section className="min-h-screen bg-slate-950 text-slate-100">
    <Helmet><title>Operation and external use | Council of AI</title><meta name="description" content="Council of AI's measurement infrastructure, documented outside use and public technical contributions, with primary records and separate commercial evidence." /></Helmet>
    <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.18),transparent_36%)]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-emerald-300">Operating work and documented external use</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">AI measurement infrastructure you can inspect.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{OPERATING_ORGANISATION_SUMMARY}</p>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">For evaluators, partners and investors, this page connects what operates today to dated outside evidence, published assets and the separately recorded commercial position.</p>
        <div className="mt-8 flex flex-wrap gap-3"><a href="#external-use" className="rounded-full bg-emerald-400 px-5 py-3 font-bold text-slate-950">Inspect external use</a><a href="#external-use-contributions" className="rounded-full border border-slate-600 px-5 py-3 font-bold">Read public contributions</a><Link href="/gspc-verify" className="rounded-full border border-slate-600 px-5 py-3 font-bold">Verify a record</Link><Link href="/contact/?arm=run" className="rounded-full border border-slate-600 px-5 py-3 font-bold">Discuss evidence work</Link></div>
      </div>
    </section>

    <section id="for-organisations" aria-labelledby="organisation-jobs" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">From public evidence to a defined decision</p>
      <h2 id="organisation-jobs" className="mt-3 text-2xl font-bold">What your organisation can use today</h2>
      <p className="mt-4 max-w-3xl leading-7 text-slate-300">Council of AI helps people inspect what an AI measurement establishes, trace it to its source and carry that evidence into their own work. Start with the question you need to answer.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Step n="01" title="Engineering and agent teams" body="Connect through MCP or the API, inspect a dated result and verify its record from your own workflow. Published code and instructions support a first integration." href="/connect/" />
        <Step n="02" title="Evaluation and research teams" body="Read frozen tests, grading rules, source data and correction history. Use the published scope to decide which results are relevant to your investigation." href="/methodology" />
        <Step n="03" title="Buyers and procurement teams" body="Enquire about an existing evidence bundle, Article 50 marking-check pack or provider-diff feed. Agree the subject, dates, deliverable and invoice terms before ordering." href="/services/" />
      </div>
      <p className="mt-5 text-sm leading-6 text-slate-300">Council OS brings the board, verification and evidence tools into one <Link href="/dashboard" className="text-emerald-300 underline">workspace</Link>. Fresh measurement runs are available to discuss; online booking is not live.</p>
    </section>

    <section className="mx-auto max-w-6xl px-5 pb-12">
      <h2 className="text-2xl font-bold">Operating measurement and evidence infrastructure</h2>
      <p className="mt-4 max-w-3xl leading-7 text-slate-300">The public board, verification tools, evidence interfaces and corrections ledger are available to inspect. Each measurement retains its method, date and evidence state. Measurement is not certification.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LiveCard label="Admitted cards in current root" value={live.root?.cards} source="/root.json" detail={live.root ? `as of ${live.root.asOf}` : "UNCHECKABLE"} />
        <LiveCard label="Coverage families" value={live.coverage ?? undefined} source="/api/coverage" detail="Families in the published coverage register" />
        <LiveCard label="Published corrections" value={live.corrections ?? undefined} source="/api/corrections" detail="Dated entries in the public corrections ledger" />
        <LiveCard label="Worker state" value={live.worker ?? undefined} source="/api/worker" detail="Current endpoint response; availability is separate from published evidence" />
      </div>
      {live.failed.length ? <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 font-mono text-xs text-amber-200">UNCHECKABLE now: {live.failed.join(", ")}. No cached number substituted.</p> : null}
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm"><Link href="/board" className="text-emerald-300 underline">Read the board</Link><Link href="/methodology" className="text-emerald-300 underline">Read the methods</Link><Link href="/about/#numbers" className="text-emerald-300 underline">Inspect operational figures and dates</Link></div>
    </section>

    <div id="external-use" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-14">
      <ExternalUseEvidence inverted />
      <aside className="mt-6 rounded-xl border border-slate-700 p-5" aria-label="Additional external artifact">
        <h3 className="text-lg font-bold">A public API contract reused in an external catalogue</h3>
        <p className="mt-3 leading-7 text-slate-300">API Evangelist generated an OpenAPI overlay from Council of AI's published read-surfaces contract. The <a href="https://apis.io/overlays/councilof-ai/councilof-ai-gspc-read-surfaces-overlay/" target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">APIs.io record</a> dates the generated artifact to 19 September 2026 and identifies it as an external derivative. This supports discoverability and reuse of the contract; it is not a customer deployment, endorsement or validation of the measurement service.</p>
      </aside>
      <aside className="mt-4 rounded-xl border border-slate-700 p-5" aria-label="Automated external endpoint tasks">
        <h3 className="text-lg font-bold">Read tasks recorded by an external agent directory</h3>
        <p className="mt-3 leading-7 text-slate-300">On 3 November 2026, <a href="https://agentpeering.com/agents/councilof.ai/council-of-ai-measurement-agent" target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">AgentPeering's public record</a> reports two graded read tasks for the GSPC board and east-west crosswalk. A third Article 50 detection request was invalid and was not graded. Its <a href="https://agentpeering.com/docs/scoring#agent-tests" target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">method</a> uses LLM-generated and LLM-graded preview tasks. These are bounded automated endpoint observations, not customer acceptance or independent validation of the measurement method. Sources reviewed 4 November 2026.</p>
      </aside>
    </div>

    <section className="border-y border-white/10 bg-slate-900/70"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-2">
      <div><p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">Published software, methods and datasets</p><h2 className="mt-3 text-2xl font-black">An inspectable portfolio</h2><p className="mt-4 leading-7 text-slate-300">GSPC combines measurement instruments, software, datasets and evidence-handling methods. Public code and publication histories let a reviewer examine how the work developed. Rights, licence terms and commercial reuse depend on the specific component and version.</p><Link href="/licensing-agreement" className="mt-5 inline-block font-semibold text-emerald-300 underline">Inspect licensing and reuse conditions</Link></div>
      <div><h3 className="text-xl font-bold">Distribution with attribution</h3><p className="mt-4 leading-7 text-slate-300">The wider publishing estate includes Council, MEOK and shared material. Read each dated cohort separately. Download events can include mirrors, automated workflows and repeated fetches; they do not identify unique users or customers.</p><p className="mt-4 leading-7 text-slate-300">The documented examples above show specific outside activity. They do not turn the unmeasured stages of the estate-wide adoption census into totals.</p><Link href="/reach/" className="mt-5 inline-block font-semibold text-emerald-300 underline">Inspect distribution sources and measurement limits</Link></div>
    </div></section>

    <section id="business-model" aria-labelledby="business-model-h" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">How the work is supported</p>
      <h2 id="business-model-h" className="mt-3 text-2xl font-bold">Open evidence, with defined paid services</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-700 p-6"><h3 className="text-lg font-bold">Inspect and verify freely</h3><p className="mt-3 leading-7 text-slate-300">Public methods, the board and free record verification let a reader assess the work before commissioning anything. Published software and datasets carry their own licence and reuse conditions.</p></div>
        <div className="rounded-2xl border border-slate-700 p-6"><h3 className="text-lg font-bold">Pay for an agreed service</h3><p className="mt-3 leading-7 text-slate-300">The service catalogue identifies metered evidence endpoints and previews. Organisations can also discuss a GBP invoice for the named evidence products. Scope, availability and delivery terms are confirmed in writing.</p></div>
      </div>
      <p className="mt-5 max-w-4xl leading-7 text-slate-300">A score is never sold. Payment does not determine a finding or confer regulatory approval. Relationships and conflicts belong alongside the evidence. Read our <Link href="/independence/" className="text-emerald-300 underline">independence and conflicts statement</Link> and <Link href="/services/" className="text-emerald-300 underline">current service catalogue</Link>.</p>
    </section>

    <section id="commercial-evidence" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12">
      <h2 className="text-2xl font-bold">Commercial evidence</h2>
      <p className="mt-4 max-w-3xl leading-7 text-slate-300">Technical use and commercial demand are different observations. These public counters cover the stated payment and commission records, not a full set of company accounts. Repeat demand and accepted outside deliveries remain separate evidence to establish.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <LiveCard label="Distinct non-self payers" value={live.revenue?.payers} source="/api/revenue" detail={live.revenue ? `${live.revenue.settlements} outside settlement${live.revenue.settlements === 1 ? "" : "s"}` : "UNCHECKABLE"} />
        <LiveCard label="Settled outside value" value={usdc} source="/api/revenue" detail="USDC · self and zero-value tests excluded" />
        <LiveCard label="Outside commissions" value={live.commissions?.outside} source="/api/commissions" detail={live.commissions ? `${live.commissions.excluded} self-paid or zero-value test${live.commissions.excluded === 1 ? "" : "s"} excluded${live.commissions.unknown ? ` · ${live.commissions.unknown} origin UNCHECKABLE` : ""}` : "UNCHECKABLE"} />
      </div>
      <p className="mt-5 text-sm leading-6 text-slate-300">No company or standalone IP valuation is established by these counters. A valuation must define the assets and rights in scope, financial assumptions, method and date.</p>
    </section>

    <section id="partners" aria-labelledby="partners-h" className="scroll-mt-24 border-y border-white/10 bg-slate-900/70">
      <div className="mx-auto max-w-6xl scroll-mt-24 px-5 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">For partners and investors</p>
        <h2 id="partners-h" className="mt-3 text-2xl font-black">Understand the organisation behind the tools</h2>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">The asset base combines working software, published measurement methods, datasets and evidence-handling practice. The links on this page connect those assets to dated outside use and separate commercial records, so a conversation can start from the work itself.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div><h3 className="text-lg font-bold">Explore a technical or delivery partnership</h3><p className="mt-3 leading-7 text-slate-300">Bring one workflow, evidence question or integration need. We can discuss a bounded scope, each party's responsibilities, available capacity and how the result would be reviewed.</p><Link href="/contact/?arm=pilot" className="mt-4 inline-flex min-h-11 items-center font-semibold text-emerald-300 underline">Discuss a scoped pilot</Link></div>
          <div><h3 className="text-lg font-bold">Discuss the business and growth</h3><p className="mt-3 leading-7 text-slate-300">Investors and prospective operating partners can ask about the product model, team needs, commercial evidence and the records required for diligence. Financial assumptions and asset ownership need their own review alongside technical evidence.</p><Link href="/contact/" className="mt-4 inline-flex min-h-11 items-center font-semibold text-emerald-300 underline">Contact the company</Link></div>
        </div>
        <p className="mt-6 text-sm leading-6 text-slate-400">External participation and submitted contributions are recorded separately on <Link href="/memberships/" className="text-emerald-300 underline">our participation page</Link>. Each relationship is described with its source and scope.</p>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 py-14"><h2 className="text-2xl font-black">The diligence path</h2><div className="mt-5 grid gap-4 md:grid-cols-3"><Step n="01" title="Inspect" body="Read the published methods, source records and dated external-use examples." href="/methodology" /><Step n="02" title="Verify" body="Check a signed card and inspect corrections before relying on a claim." href="/gspc-verify" /><Step n="03" title="Discuss a defined need" body="Agree a system, evidence question, delivery scope and terms before commissioning work." href="/contact/?arm=run" /></div></section>
  </section>;
}

function LiveCard({ label, value, source, detail }: { label: string; value?: string | number; source: string; detail: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><div className="text-3xl font-black tabular-nums">{value ?? "—"}</div><div className="mt-2 text-sm font-semibold">{label}</div><div className="mt-1 text-xs text-slate-400">{detail}</div><a href={source} className="mt-3 inline-block font-mono text-[11px] text-emerald-300 underline">{source}</a></div>; }
function Step({ n, title, body, href }: { n: string; title: string; body: string; href: string }) { return <Link href={href} className="rounded-2xl border border-slate-700 p-5 hover:border-emerald-400/60"><span className="font-mono text-xs text-emerald-300">{n}</span><h3 className="mt-2 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></Link>; }
