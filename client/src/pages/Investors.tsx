import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";

/**
 * /investors — the company brief for investors and prospective partners.
 *
 * Copy rules (same contract as /traction):
 * - No figure on this page is typed by hand. Commercial and evidence counters are read live
 *   from the endpoints that own them; a failed read shows "unavailable", never a guess.
 * - Targets are labelled as targets. Nothing in the milestones section is claimed as done.
 * - Measurement only, and payment never changes a finding. The page says what we do in the words
 *   the home hero, /about/ and the lead of /llms.txt use (24 Nov 2026: one front-door story), and
 *   every outside claim links its primary source.
 */

type Live = {
  payers: number | null;
  settledAtomic: number | null;
  outsideCommissions: number | null;
  cards: number | null;
  rootAsOf: string | null;
  corrections: number | null;
};
const EMPTY: Live = { payers: null, settledAtomic: null, outsideCommissions: null, cards: null, rootAsOf: null, corrections: null };

async function json(path: string, signal: AbortSignal) {
  const response = await fetch(path, { signal, cache: "no-store", headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
const integer = (value: unknown) => (Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : null);

type Source = { label: string; href: string };

const PROBLEMS: { title: string; body: string; source?: Source }[] = [
  {
    title: "Claims written by the party being judged",
    body: "Model cards, vendor PDFs and leaderboard screenshots are produced by the people who benefit from them. A buyer usually cannot re-run them or see what was left out.",
  },
  {
    title: "Rules with dates on them",
    body: "EU AI Act transparency duties under Article 50 apply from 2 August 2026, and the marking grace period for systems already on the market ends on 2 December 2026. Deployers need evidence they can put in a file.",
    source: { label: "Article 50 dates", href: "/article-50/" },
  },
  {
    title: "Underwriters and auditors need records, not slides",
    body: "Insurance, audit and procurement decisions need machine-readable evidence with a source, a date and a method that someone else can check.",
  },
];

const BUILT = [
  { title: "A public measurement board", body: "Frozen tests across model behaviour, agent surfaces and public facts. Ties and untested comparisons are published as ties and untested, not rounded into a ranking.", href: "/dashboard/?tab=board", cta: "Open the board" },
  { title: "Free verification", body: "Signed records can be re-checked in the browser against our published keys. Checking is free and needs no account.", href: "/gspc-verify/", cta: "Verify a record" },
  { title: "A public corrections ledger", body: "Every correction is dated and kept. Earlier results stay in the history instead of being quietly replaced.", href: "/corrections/", cta: "Read the corrections" },
  { title: "Agent-native access", body: "The same evidence is available over MCP and an HTTP API, with metered evidence requests that agents can pay for per call.", href: "/connect/", cta: "Connect a client" },
  { title: "A frozen regulatory corpus", body: "Hashed provisions of the EU AI Act, GDPR, CRA, DORA, NIS2 and CSRD that reproduce from the EU's official publication service, so evidence can be tied to the exact text it addresses.", href: "/methodology/", cta: "Read the methodology" },
];

const COMPOUNDS = [
  { title: "History cannot be back-filled", body: "Each dated, signed record adds to a time series. A newcomer can copy a method; it cannot recreate observations it did not make at the time." },
  { title: "Buyer-pays, never issuer-pays", body: "Methods are frozen before a request is accepted, negative results are published, and payment never changes a finding. The incentive problem of issuer-paid grades is designed out." },
  { title: "Open by default", body: "Methods, datasets and verifiers are public. Trust comes from inspection by others rather than from our own description of ourselves." },
];

const MODEL = [
  { title: "Read and verify", who: "Developers, agents, researchers, the public", body: "Free, permanently. This is the distribution layer and the reason a paid record is worth anything." },
  { title: "Scoped evidence", who: "Deployers and their counsel", body: "Per-system checks and evidence packs bound to a stated question, for example Article 50 marking evidence." },
  { title: "Re-checks", who: "Teams that ship often", body: "The same frozen check run again when a system changes, each run delivered as its own dated record." },
  { title: "Reliance-grade evidence and data", who: "Insurers, auditors, enterprise buyers", body: "Multi-reviewer attestation for decisions that carry liability, and licences to the dated time series." },
];

const MILESTONES = [
  "A witnessed key ceremony with independent custodians, followed by fresh public anchors for the evidence root.",
  "More reproductions of our tests by parties with no relationship to us.",
  "Repeat outside buyers who accept a delivered evidence pack in writing.",
  "A first written reliance on our evidence by an auditor or insurer.",
];

/** Each item links the third party's own record; each answered 200 on 2026-11-24. */
const OUTSIDE: { text: string; source: Source }[] = [
  {
    text: "An outside operator reran a pinned evidence artifact of ours on three platforms and reproduced the expected outcomes.",
    source: { label: "the operator's run", href: "https://github.com/probityai/agent-evidence-vectors/actions/runs/41583335594" },
  },
  {
    text: "A contributor built runnable fixtures on our published proposal, and they were merged into a W3C Community Group repository.",
    source: { label: "the merged fixtures", href: "https://github.com/w3c-cg/aikr/pull/25" },
  },
  {
    text: "The UK Competition and Markets Authority hosts our non-confidential consultation response.",
    source: { label: "the response on GOV.UK", href: "https://assets.publishing.service.gov.uk/media/6adb87142263175ac2aca3e0/Council_of_AI.pdf" },
  },
  {
    text: "Another author's IETF Internet-Draft discusses and cites our research.",
    source: { label: "the citing draft", href: "https://datatracker.ietf.org/doc/draft-gruszka-evaluation-receipt-mappings/04/" },
  },
];

export default function Investors() {
  const [live, setLive] = useState<Live>(EMPTY);
  useEffect(() => {
    const controller = new AbortController();
    const paths = ["/api/revenue", "/api/commissions", "/root.json", "/api/corrections"];
    Promise.allSettled(paths.map((path) => json(path, controller.signal))).then(([revenue, commissions, root, corrections]) => {
      if (controller.signal.aborted) return;
      const next: Live = { ...EMPTY };
      if (revenue.status === "fulfilled") {
        const one = revenue.value?.one_number;
        if (one?.status === "MEASURED") {
          next.payers = integer(one?.all_time);
          next.settledAtomic = integer(revenue.value?.settled_usdc?.count ?? one?.settled_usdc_atomic);
        }
      }
      if (commissions.status === "fulfilled") next.outsideCommissions = integer(commissions.value?.by_origin?.OUTSIDE);
      if (root.status === "fulfilled") {
        next.cards = integer(root.value?.card_count);
        next.rootAsOf = typeof root.value?.as_of === "string" ? root.value.as_of : null;
      }
      if (corrections.status === "fulfilled" && Array.isArray(corrections.value?.corrections)) next.corrections = corrections.value.corrections.length;
      setLive(next);
    });
    return () => controller.abort();
  }, []);

  const show = (value: number | null) => (value === null ? "unavailable" : value.toLocaleString("en-GB"));
  // The amount is settled USDC, shown in its own unit. A dollar figure reads as a price, and the deploy-only
  // price gate refuses it (22 Nov 2026: it blocked every production deploy after this page landed).
  const usdc = live.settledAtomic === null ? "unavailable" : `${(live.settledAtomic / 1_000_000).toFixed(2)} USDC`;
  const counters = [
    { value: show(live.payers), label: "Distinct outside payers", note: "All time · self-tests excluded", href: "/api/revenue" },
    { value: usdc, label: "Settled outside value", note: "Received from outside payers · self and zero-value tests excluded", href: "/api/revenue" },
    { value: show(live.outsideCommissions), label: "Outside commissions", note: "Paid measurement commissions from outside parties", href: "/api/commissions" },
    { value: show(live.cards), label: "Admitted records in the current root", note: live.rootAsOf ? `as of ${live.rootAsOf}` : "Signed evidence root", href: "/root.json" },
    { value: show(live.corrections), label: "Published corrections", note: "Dated entries in the public ledger", href: "/api/corrections" },
  ];

  return (
    <section className="min-h-screen bg-slate-950 text-slate-100" data-testid="investors-page">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.18),transparent_36%)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-emerald-300">Company brief · for investors and partners</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
            AI is bought, insured and regulated on claims nobody can check.
            <span className="block text-emerald-300">We make them checkable.</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Council of AI is the public name of CSOAI Ltd, a UK company. We run frozen tests on AI models, agents and the systems
            they call, and publish signed records that anyone can re-check for free. We sell scoped evidence to the organisations
            that have to rely on it. Payment never buys a better result (
            <Link href="/how-we-work/" className="text-emerald-300 underline">how we are funded</Link>).
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact/" className="rounded-full bg-emerald-400 px-5 py-3 font-bold text-slate-950" data-testid="investors-cta-contact">Talk to the founder</Link>
            <a href="#diligence" className="rounded-full border border-slate-600 px-5 py-3 font-bold">Follow the diligence path</a>
            <Link href="/gspc-verify/" className="rounded-full border border-slate-600 px-5 py-3 font-bold">Verify a record yourself</Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="inv-problem" className="mx-auto max-w-6xl px-5 py-14">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">The problem</p>
        <h2 id="inv-problem" className="mt-3 text-3xl font-bold">Decisions about AI rest on evidence that cannot be re-checked.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PROBLEMS.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-700 p-6">
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="mt-3 leading-7 text-slate-300">{item.body}</p>
              {item.source ? (
                <Link href={item.source.href} className="mt-3 inline-flex items-center gap-1 font-semibold text-emerald-300">
                  {item.source.label} <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="inv-built" className="border-y border-white/10 bg-slate-900/50">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">Operating today</p>
          <h2 id="inv-built" className="mt-3 text-3xl font-bold">What is already built and public</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BUILT.map((item) => (
              <div key={item.title} className="flex flex-col rounded-2xl border border-slate-700 bg-slate-950 p-6">
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-3 flex-1 leading-7 text-slate-300">{item.body}</p>
                <Link href={item.href} className="mt-4 inline-flex items-center gap-1 font-semibold text-emerald-300">
                  {item.cta} <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="inv-compounds" className="mx-auto max-w-6xl px-5 py-14">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">Why it compounds</p>
        <h2 id="inv-compounds" className="mt-3 text-3xl font-bold">The asset is a dated, independently checkable record.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {COMPOUNDS.map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-700 p-6">
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="mt-3 leading-7 text-slate-300">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="inv-model" className="border-y border-white/10 bg-slate-900/50">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">Business model</p>
          <h2 id="inv-model" className="mt-3 text-3xl font-bold">Free to check. Paid to rely on.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {MODEL.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-700 bg-slate-950 p-6">
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-1 text-sm text-emerald-300">{item.who}</p>
                <p className="mt-3 leading-7 text-slate-300">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-4xl leading-7 text-slate-300">
            Scope, cost and delivery are agreed in writing before any paid work. See the{" "}
            <Link href="/services/" className="text-emerald-300 underline">service catalogue</Link> and our{" "}
            <Link href="/independence/" className="text-emerald-300 underline">independence and conflicts statement</Link>.
          </p>
        </div>
      </section>

      <section aria-labelledby="inv-stage" className="mx-auto max-w-6xl px-5 py-14" data-testid="investors-counters">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">Where we are</p>
        <h2 id="inv-stage" className="mt-3 text-3xl font-bold">Early, and published as it is.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">
          These counters are read live from our own endpoints when this page loads. They are not projections. Technical use
          and paid demand are different observations, and we report them separately.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {counters.map((item) => (
            <a key={item.label} href={item.href} className="rounded-2xl border border-slate-700 p-5 hover:border-emerald-400">
              <div className="text-3xl font-black">{item.value}</div>
              <div className="mt-2 font-semibold">{item.label}</div>
              <div className="mt-1 text-sm text-slate-400">{item.note}</div>
            </a>
          ))}
        </div>
        <p className="mt-6 leading-7 text-slate-300">
          Outside use, with dates and sources, is on the{" "}
          <Link href="/traction/" className="text-emerald-300 underline">operation and external use</Link> page.
        </p>
      </section>

      <section aria-labelledby="inv-outside" className="border-y border-white/10 bg-slate-900/50">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">Outside evidence</p>
          <h2 id="inv-outside" className="mt-3 text-3xl font-bold">Others have run, built on and cited the work.</h2>
          <ul className="mt-6 max-w-4xl list-disc space-y-3 pl-6 leading-7 text-slate-300">
            {OUTSIDE.map((item) => (
              <li key={item.source.href}>
                {item.text}{" "}
                <a href={item.source.href} className="text-emerald-300 underline" rel="noopener noreferrer">{item.source.label}</a>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-4xl leading-7 text-slate-300">
            Each item has its own scope and primary source. None is a customer count or a standard, and none means that the body concerned vouches for us.{" "}
            <Link href="/traction/" className="text-emerald-300 underline">Inspect each record</Link>.
          </p>
        </div>
      </section>

      <section aria-labelledby="inv-next" className="mx-auto max-w-6xl px-5 py-14">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">What we are working towards</p>
        <h2 id="inv-next" className="mt-3 text-3xl font-bold">Milestones we will be measured against</h2>
        <ol className="mt-6 max-w-4xl list-decimal space-y-3 pl-6 leading-7 text-slate-300">
          {MILESTONES.map((line) => <li key={line}>{line}</li>)}
        </ol>
        <p className="mt-6 max-w-4xl text-sm leading-6 text-slate-400">These are targets. Nothing in this list is claimed as done on this page.</p>
      </section>

      <section aria-labelledby="inv-governance" className="border-y border-white/10 bg-slate-900/50">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">Governance and independence</p>
          <h2 id="inv-governance" className="mt-3 text-3xl font-bold">Founder-led today. Designed not to stay founder-controlled.</h2>
          <p className="mt-4 max-w-4xl leading-7 text-slate-300">
            Oversight is being designed as a reviewer council with no fixed chair and a facilitator chosen by lot. Its reviewers
            would come from several organisations, and no single organisation would hold a blocking share. The founder would hold
            one vote on oversight while leading the company. Until that council is seated, CSOAI Ltd is founder-led.
          </p>
          <p className="mt-4 max-w-4xl leading-7 text-slate-300">
            Where we take part in standards and open-source bodies, each relationship is listed with its evidence on{" "}
            <Link href="/memberships/" className="text-emerald-300 underline">where we take part</Link>. Taking part does not mean a body vouches for our work.
          </p>
        </div>
      </section>

      <section id="diligence" aria-labelledby="inv-diligence" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-14">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">The diligence path</p>
        <h2 id="inv-diligence" className="mt-3 text-3xl font-bold">Check us before you talk to us.</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { n: "01", t: "Read the methods", b: "Frozen procedures, grading rules and scope.", href: "/methodology/" },
            { n: "02", t: "Verify a record", b: "Re-check a signed record against our published keys.", href: "/gspc-verify/" },
            { n: "03", t: "Read the counters", b: "Commercial and evidence counters, straight from the endpoints.", href: "/api/revenue" },
            { n: "04", t: "Ask for the company pack", b: "Registration, method versions, evidence root, corrections and commercial records.", href: "/contact/" },
          ].map((step) => (
            <li key={step.n} className="rounded-2xl border border-slate-700 p-6">
              <div className="font-mono text-sm text-emerald-300">{step.n}</div>
              <h3 className="mt-2 text-lg font-bold">{step.t}</h3>
              <p className="mt-2 leading-7 text-slate-300">{step.b}</p>
              <a href={step.href} className="mt-3 inline-flex items-center gap-1 font-semibold text-emerald-300">Open <ArrowUpRight size={15} aria-hidden="true" /></a>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">The company</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              CSOAI Ltd · registered in England and Wales ·{" "}
              <a href="https://find-and-update.company-information.service.gov.uk/company/16939677" className="text-emerald-300 underline">Companies House 16939677</a>.
              Founder: Nicholas Templeman (<a href="https://orcid.org/0009-0001-3869-1068" className="text-emerald-300 underline">ORCID</a>).
              The company holds no designation, registration or licence under any AI-verification or AI-audit scheme, and has not applied for one.
            </p>
          </div>
          <Link href="/contact/" className="self-start rounded-full bg-emerald-400 px-6 py-3 font-bold text-slate-950 md:self-auto">Talk to the founder</Link>
        </div>
      </section>
    </section>
  );
}
