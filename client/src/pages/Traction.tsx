import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { MEMBERSHIPS, KIND_LABEL, evidenceHref, isExternalHref, type MembershipRow } from "@/components/MembershipStrip";
import { useMomentum, type MomentumListing } from "@/components/momentum/momentum";

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

const PARTICIPATION_IDS = ["cloudflare-startups", "ietf-internet-draft", "ietf-measurement-capsule-draft", "w3c-agent-conformance"];
const SIGNAL_LABEL: Record<NonNullable<MomentumListing["signal_class"]>, string> = {
  listing: "Third-party listing",
  independent_observation: "Independent observation",
  independent_assessment: "Independent assessment",
  independent_reproduction: "Independent reproduction",
};

const TRACTION_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://councilof.ai/traction/#page",
      url: "https://councilof.ai/traction/",
      name: "Evidence, external signals and commercial proof | Council of AI",
      description: "A source-linked map separating independent external signals, listings, participation, first-party metrics, commercial proof and pending or unverified claims.",
      isPartOf: { "@id": "https://councilof.ai/#website" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Council of AI", item: "https://councilof.ai/" },
        { "@type": "ListItem", position: 2, name: "Evidence and external signals", item: "https://councilof.ai/traction/" },
      ],
    },
    {
      "@type": "ItemList",
      name: "Council of AI evidence interfaces",
      itemListElement: [
        "https://councilof.ai/api/momentum",
        "https://councilof.ai/interop/memberships.json",
        "https://councilof.ai/api/revenue",
        "https://councilof.ai/api/commissions",
        "https://councilof.ai/api/corrections",
        "https://councilof.ai/llms.txt",
      ].map((url, i) => ({ "@type": "ListItem", position: i + 1, url })),
    },
  ],
};

async function json(path: string, signal: AbortSignal) {
  const response = await fetch(path, { signal, cache: "no-store", headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
const integer = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : null;

export default function Traction() {
  const [live, setLive] = useState<State>(EMPTY);
  const momentum = useMomentum();
  const externalSignals = momentum.kind === "ready" ? momentum.payload.listings : [];
  const participationRows = PARTICIPATION_IDS.map((id) => MEMBERSHIPS.rows.find((row) => row.id === id)).filter((row): row is MembershipRow => !!row);
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
    <Helmet>
      <title>Evidence, external signals and commercial proof | Council of AI</title>
      <meta name="description" content="A source-linked Council of AI evidence map separating independent external signals, listings, participation, first-party metrics, commercial proof and pending or unverified claims." />
      <link rel="canonical" href="https://councilof.ai/traction/" />
      <script type="application/ld+json">{JSON.stringify(TRACTION_LD)}</script>
    </Helmet>

    <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.18),transparent_36%)]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-emerald-300">Evidence map · provenance before promotion</p>
        <h1 className="mt-4 max-w-5xl text-4xl font-black tracking-tight sm:text-6xl">Evidence, external signals & commercial proof.</h1>
        <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">This page keeps independent assessment, directory listings, standards and programme participation, first-party measurements, commercial proof and unresolved mentions in separate evidence classes. A signal never gets promoted into endorsement just because it is good news.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/gspc-verify" className="rounded-full bg-emerald-400 px-5 py-3 font-bold text-slate-950">Verify evidence</Link>
          <Link href="/memberships/" className="rounded-full border border-slate-600 px-5 py-3 font-bold">Participation ledger</Link>
          <a href="/api/momentum" className="rounded-full border border-slate-600 px-5 py-3 font-bold">External-signal JSON</a>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 py-12" aria-labelledby="evidence-classes-h">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">Evidence classes</p>
      <h2 id="evidence-classes-h" className="mt-3 text-2xl font-black">What each kind of signal means</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TaxonomyCard title="Independent assessment" body="A third party applies its own method or judgement. We link the source and do not turn its result into our own score." />
        <TaxonomyCard title="Independent reproduction" body="A third party reports reproducing a Council test or checker. The reproduction scope is stated explicitly; it is not silently expanded into hosted-service interoperability or institutional approval." />
        <TaxonomyCard title="Listing / discovery" body="A registry, directory or index can find us. Presence is distribution evidence, not endorsement, adoption or a customer." />
        <TaxonomyCard title="Participation / programme" body="Membership, community-group participation, a filed draft or programme acceptance. Participation does not mean the body approved Council work." />
        <TaxonomyCard title="First-party measurement" body="Council-observed metrics, signed cards, roots, corrections and usage counters. They are labelled as our measurements and link to their underlying artifacts." />
        <TaxonomyCard title="Commercial proof" body="Outside payment and commissioned-work ledgers are kept separate from downloads, listings, founder-funded tests and self-paid traffic." />
        <TaxonomyCard title="Pending / unverified" body="A mention or opportunity without sufficient evidence stays pending, unverified or omitted; it is not silently promoted into the positive evidence set." />
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 pb-12" aria-labelledby="first-party-proof-h">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">First-party + commercial ledgers</p>
      <h2 id="first-party-proof-h" className="mt-3 text-2xl font-black">Live counters, read from their sources</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">These are Council-operated measurements. Paid demand is not inferred from reach: the revenue and commission cards read the dedicated outside-payment ledgers.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LiveCard label="Admitted cards in current root" value={live.root?.cards} source="/root.json" detail={live.root ? `as of ${live.root.asOf}` : "UNCHECKABLE"} />
        <LiveCard label="Distinct non-self payers" value={live.revenue?.payers} source="/api/revenue" detail={live.revenue ? `${live.revenue.settlements} outside settlement${live.revenue.settlements === 1 ? "" : "s"}` : "UNCHECKABLE"} />
        <LiveCard label="Settled outside value" value={usdc} source="/api/revenue" detail="USDC · self and zero-value tests excluded" />
        <LiveCard label="Outside commissions" value={live.commissions?.outside} source="/api/commissions" detail={live.commissions ? `${live.commissions.excluded} self-paid or zero-value test${live.commissions.excluded === 1 ? "" : "s"} excluded${live.commissions.unknown ? ` · ${live.commissions.unknown} origin UNCHECKABLE` : ""}` : "UNCHECKABLE"} />
      </div>
      {live.failed.length ? <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 font-mono text-xs text-amber-200">UNCHECKABLE now: {live.failed.join(", ")}. No cached number substituted.</p> : null}
    </section>

    <section className="border-y border-white/10 bg-slate-900/70" aria-labelledby="external-signals-h">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">External signals</p>
        <h2 id="external-signals-h" className="mt-3 text-2xl font-black">What third parties can independently see</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">GET /api/momentum re-reads each named source and omits it when the source no longer names Council. Every returned item carries an evidence class; a plain listing stays a plain listing.</p>
        {externalSignals.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {externalSignals.map((signal) => <SignalCard key={signal.id} signal={signal} />)}
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400">External signals are UNCHECKABLE on this read; no stale substitute is displayed.</p>
        )}
        <a href="/api/momentum" className="mt-5 inline-block font-mono text-xs text-emerald-300 underline underline-offset-4">Inspect /api/momentum →</a>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 py-12" aria-labelledby="participation-h">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">Participation & programmes</p>
      <h2 id="participation-h" className="mt-3 text-2xl font-black">Standing is recorded at the narrowest provable level</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">These cards come from the same manifest as /memberships. Public evidence links off-site; account-only evidence stays labelled private. None of these records is an institutional endorsement of Council tooling.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {participationRows.map((row) => <ParticipationCard key={row.id} row={row} />)}
      </div>
      <Link href="/memberships/" className="mt-5 inline-block text-sm font-bold text-emerald-300 underline underline-offset-4">Open the complete participation ledger →</Link>
    </section>

    <section className="border-y border-white/10 bg-slate-900/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">First-party editorial context</p>
          <h2 className="mt-3 text-2xl font-black">Sourced summaries are context, not external validation</h2>
          <p className="mt-4 leading-7 text-slate-300">Press pages and evidence notes make the work understandable to humans and answer engines. Their structured data improves discovery, but Council-authored editorial copy remains first-party even when it cites independent sources. Legacy blog routes remain under the reviewed publication hold and are not promoted here as evidence.</p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold">
            <Link href="/press/" className="text-emerald-300 underline underline-offset-4">Press & sourced summaries →</Link>
            <Link href="/about/#numbers" className="text-emerald-300 underline underline-offset-4">Evidence & numbers →</Link>
          </div>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-300">Not promoted without evidence</p>
          <h2 className="mt-3 text-2xl font-black">Unknown stays unknown</h2>
          <p className="mt-4 leading-7 text-slate-300">Until the relevant public ledger proves otherwise, this page does not claim repeat-payer or maintained-renewal evidence, query-specific outside delivery, institutional endorsement, or any mention that remains pending or unverified.</p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold">
            <a href="/api/revenue" className="text-emerald-300 underline underline-offset-4">Revenue ledger →</a>
            <a href="/api/commissions" className="text-emerald-300 underline underline-offset-4">Commission ledger →</a>
            <Link href="/memberships/" className="text-emerald-300 underline underline-offset-4">Participation boundaries →</Link>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 py-12" aria-labelledby="machine-map-h">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">Machine-readable map</p>
      <h2 id="machine-map-h" className="mt-3 text-2xl font-black">One set of facts for crawlers, agents and humans</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <DataLink href="/api/momentum" label="External signals" detail="live listings and external observations" />
        <DataLink href="/interop/memberships.json" label="Participation ledger" detail="standing, evidence and boundaries" />
        <DataLink href="/interop/memberships-updates.json" label="Participation changes" detail="dated corrections and additions" />
        <DataLink href="/api/revenue" label="Commercial proof" detail="strict non-self payment evidence" />
        <DataLink href="/api/corrections" label="Corrections" detail="published correction records" />
        <DataLink href="/llms.txt" label="Agent map" detail="plain-text discovery for answer engines and agents" />
      </div>
    </section>

    <section className="border-y border-white/10 bg-slate-900/70"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-2">
      <div><p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">Operating evidence</p><h2 className="mt-3 text-2xl font-black">A public instrument, commercially early</h2><p className="mt-4 leading-7 text-slate-300">The product and distribution rails operate. Repeat demand, retained feeds and broader outside payment remain separate commercial thresholds. Indexed resources, downloads, repositories and founder-funded tests are never presented as customers.</p></div>
      <dl className="grid gap-3 sm:grid-cols-2"><Datum label="Coverage families" value={live.coverage === null ? "UNCHECKABLE" : String(live.coverage)} href="/api/coverage" /><Datum label="Worker state" value={live.worker ?? "UNCHECKABLE"} href="/api/worker" /><Datum label="Published corrections" value={live.corrections === null ? "UNCHECKABLE" : String(live.corrections)} href="/api/corrections" /><Datum label="Methods" value="Reproducible" href="/methodology" /></dl>
    </div></section>

    <section className="mx-auto max-w-6xl px-5 py-14"><h2 className="text-2xl font-black">The diligence path</h2><div className="mt-5 grid gap-4 md:grid-cols-3"><Step n="01" title="Inspect" body="Read the current evidence class and its source before comparing claims." href="/traction/" /><Step n="02" title="Verify" body="Check a signed card and inspect corrections before trusting a measurement." href="/gspc-verify" /><Step n="03" title="Commission" body="Move a real subject through queue, mill, signature and publication." href="/start" /></div></section>
  </section>;
}


function LiveCard({ label, value, source, detail }: { label: string; value?: string | number; source: string; detail: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><div className="text-3xl font-black tabular-nums">{value ?? "—"}</div><div className="mt-2 text-sm font-semibold">{label}</div><div className="mt-1 text-xs text-slate-400">{detail}</div><a href={source} className="mt-3 inline-block font-mono text-[11px] text-emerald-300 underline">{source}</a></div>; }
function TaxonomyCard({ title, body }: { title: string; body: string }) { return <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></div>; }
function SignalCard({ signal }: { signal: MomentumListing }) { const cls = signal.signal_class ?? "listing"; return <a href={signal.url} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-5 hover:border-emerald-400/60"><div className="font-mono text-[11px] uppercase tracking-[.18em] text-emerald-300">{SIGNAL_LABEL[cls]}</div><h3 className="mt-2 text-lg font-black">{signal.name}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{signal.evidence}</p><p className="mt-3 text-xs leading-5 text-slate-500">Verified on this read. This class does not imply endorsement, adoption or a customer.</p></a>; }
function ParticipationCard({ row }: { row: MembershipRow }) { const href = evidenceHref(row); const content = <><div className="font-mono text-[11px] uppercase tracking-[.18em] text-emerald-300">{KIND_LABEL[row.kind]} · {row.state}</div><h3 className="mt-2 text-lg font-black">{row.display_name ?? row.short}</h3>{row.public_line ? <p className="mt-2 font-semibold text-slate-100">{row.public_line}</p> : null}<p className="mt-2 text-sm leading-6 text-slate-300">{row.what_it_proves}</p><p className="mt-2 text-xs leading-5 text-slate-500">{row.what_it_does_not_prove}</p></>; return isExternalHref(href) ? <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-slate-700 bg-slate-900 p-5 hover:border-emerald-400/60">{content}</a> : <Link href={href} className="rounded-2xl border border-slate-700 bg-slate-900 p-5 hover:border-emerald-400/60">{content}</Link>; }
function DataLink({ href, label, detail }: { href: string; label: string; detail: string }) { return <a href={href} className="rounded-xl border border-slate-700 bg-slate-900 p-4 hover:border-emerald-400/60"><div className="font-bold">{label}</div><div className="mt-1 text-xs text-slate-400">{detail}</div><code className="mt-3 block break-all text-[11px] text-emerald-300">{href}</code></a>; }
function Datum({ label, value, href }: { label: string; value: string; href: string }) { return <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4"><dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 font-mono text-sm text-emerald-200">{value}</dd><dd className="mt-2"><a href={href} className="inline-block text-xs text-slate-400 underline">Inspect<span className="sr-only"> {label}</span></a></dd></div>; }
function Step({ n, title, body, href }: { n: string; title: string; body: string; href: string }) { return <Link href={href} className="rounded-2xl border border-slate-700 p-5 hover:border-emerald-400/60"><span className="font-mono text-xs text-emerald-300">{n}</span><h3 className="mt-2 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></Link>; }
