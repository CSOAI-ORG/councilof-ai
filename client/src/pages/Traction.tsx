import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

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
    <Helmet><title>Evidence, adoption and commercial proof | Council of AI</title><meta name="description" content="Live, source-linked evidence of CSOAI measurement coverage, signed records, commissioned work, independent discovery and commercial proof." /></Helmet>
    <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.18),transparent_36%)]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-emerald-300">Live evidence · no vanity inflation</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Proof of operation, in public.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">CSOAI measures AI systems, agents and digital rails, signs admitted results and publishes corrections. Technical reach, independent discovery and actual paid demand are separated so every claim can survive diligence.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/start" className="rounded-full bg-emerald-400 px-5 py-3 font-bold text-slate-950">Commission a measurement</Link><Link href="/gspc-verify" className="rounded-full border border-slate-600 px-5 py-3 font-bold">Verify evidence</Link><a href="/api/revenue" className="rounded-full border border-slate-600 px-5 py-3 font-bold">Inspect revenue JSON</a></div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LiveCard label="Admitted cards in current root" value={live.root?.cards} source="/root.json" detail={live.root ? `as of ${live.root.asOf}` : "UNCHECKABLE"} />
        <LiveCard label="Distinct non-self payers" value={live.revenue?.payers} source="/api/revenue" detail={live.revenue ? `${live.revenue.settlements} outside settlement${live.revenue.settlements === 1 ? "" : "s"}` : "UNCHECKABLE"} />
        <LiveCard label="Settled outside value" value={usdc} source="/api/revenue" detail="USDC · self and zero-value tests excluded" />
        <LiveCard label="Outside commissions" value={live.commissions?.outside} source="/api/commissions" detail={live.commissions ? `${live.commissions.excluded} self-paid or zero-value test${live.commissions.excluded === 1 ? "" : "s"} excluded${live.commissions.unknown ? ` · ${live.commissions.unknown} origin UNCHECKABLE` : ""}` : "UNCHECKABLE"} />
      </div>
      {live.failed.length ? <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 font-mono text-xs text-amber-200">UNCHECKABLE now: {live.failed.join(", ")}. No cached number substituted.</p> : null}
    </section>

    <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-14 lg:grid-cols-3">
      <Authority eyebrow="Independent discovery" title="Glama Quality A" href="https://glama.ai/mcp/servers/CSOAI-ORG/councilof-ai">The flagship GSPC MCP is independently indexed with twelve discoverable tools. Directory quality is distribution evidence, not a customer count or endorsement.</Authority>
      <Authority eyebrow="Open standards participation" title="W3C Community Group" href="https://www.w3.org/community/agent-conformance/">Founder Nicholas Templeman participates in the W3C Agent Conformance and Benchmarking Community Group. Participation does not imply W3C endorsement, certification or conformance.</Authority>
      <Authority eyebrow="Machine-commerce discovery" title="x402 public listing" href="https://www.x402scan.com/server/9b8bcb34-6c9f-45d6-b881-9a6afe7bf6b5">The explorer exposes Council resources to agents. Explorer activity uses different definitions; only the strict ledger above counts verified non-self payers.</Authority>
    </section>

    <section className="border-y border-white/10 bg-slate-900/70"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-2">
      <div><p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300">Operating evidence</p><h2 className="mt-3 text-2xl font-black">A public instrument, commercially early</h2><p className="mt-4 leading-7 text-slate-300">The product and distribution rails operate. Repeat demand, retained feeds and broader outside payment remain the next commercial proof. Indexed resources, downloads, repositories and founder-funded tests are never presented as customers.</p></div>
      <dl className="grid gap-3 sm:grid-cols-2"><Datum label="Coverage families" value={live.coverage === null ? "UNCHECKABLE" : String(live.coverage)} href="/api/coverage" /><Datum label="Worker state" value={live.worker ?? "UNCHECKABLE"} href="/api/worker" /><Datum label="Published corrections" value={live.corrections === null ? "UNCHECKABLE" : String(live.corrections)} href="/api/corrections" /><Datum label="Methods" value="Reproducible" href="/methodology" /></dl>
    </div></section>

    <section className="mx-auto max-w-6xl px-5 py-14"><h2 className="text-2xl font-black">The diligence path</h2><div className="mt-5 grid gap-4 md:grid-cols-3"><Step n="01" title="Inspect" body="Read the current root, coverage ledger and methodology." href="/root.json" /><Step n="02" title="Verify" body="Check a signed card and inspect corrections before trusting a claim." href="/gspc-verify" /><Step n="03" title="Commission" body="Move a real subject through queue, mill, signature and publication." href="/start" /></div></section>
  </section>;
}

function LiveCard({ label, value, source, detail }: { label: string; value?: string | number; source: string; detail: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><div className="text-3xl font-black tabular-nums">{value ?? "—"}</div><div className="mt-2 text-sm font-semibold">{label}</div><div className="mt-1 text-xs text-slate-400">{detail}</div><a href={source} className="mt-3 inline-block font-mono text-[11px] text-emerald-300 underline">{source}</a></div>; }
function Authority({ eyebrow, title, href, children }: { eyebrow: string; title: string; href: string; children: React.ReactNode }) { return <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-slate-700 bg-slate-900 p-6 hover:border-emerald-400/60"><div className="font-mono text-[11px] uppercase tracking-[.18em] text-emerald-300">{eyebrow}</div><h2 className="mt-3 text-xl font-black">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-300">{children}</p><span className="mt-5 inline-block text-sm font-bold text-emerald-300">Inspect source →</span></a>; }
function Datum({ label, value, href }: { label: string; value: string; href: string }) { return <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4"><dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 font-mono text-sm text-emerald-200">{value}</dd><dd className="mt-2"><a href={href} className="inline-block text-xs text-slate-400 underline">Inspect<span className="sr-only"> {label}</span></a></dd></div>; }
function Step({ n, title, body, href }: { n: string; title: string; body: string; href: string }) { return <Link href={href} className="rounded-2xl border border-slate-700 p-5 hover:border-emerald-400/60"><span className="font-mono text-xs text-emerald-300">{n}</span><h3 className="mt-2 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></Link>; }
