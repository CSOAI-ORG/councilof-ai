/**
 * /yield — the yield dashboard (V3 brief G5.6).
 *
 * One number per family per week:
 *   yield = proofs_sold + feed_subs + attributed_inbound
 *
 * Fetches /api/yield and renders a table with a week/month toggle. Grand total is shown
 * prominently. Derived from live settlement data — never typed by hand.
 *
 * Uses the same Tailwind patterns as YieldStatus.tsx and X402Leaderboard.tsx.
 */
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

type FamilyYield = {
  family: string;
  proofs_sold: number;
  feed_subs: number;
  attributed_inbound: number;
  yield_total: number;
};

type YieldData = {
  schema: string;
  as_of: string;
  period: "week" | "month";
  period_ms: number;
  families: FamilyYield[];
  total_yield: number;
  source: string;
  contract: {
    definition: string;
    formula: string;
    null_rule: string;
    excludes_self: string;
    excludes_zero_value: string;
  };
};

function FamilyLabel({ family }: { family: string }) {
  const labels: Record<string, string> = {
    proofs: "Proofs",
    feeds: "Feed Subs",
    attributed: "Attributed Inbound",
  };
  return <>{labels[family] ?? family}</>;
}

export default function YieldDashboard() {
  const [data, setData] = useState<YieldData | null>(null);
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/yield?period=${period}`, {
          cache: "no-store",
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d: YieldData = await res.json();
        if (!cancelled) {
          setData(d);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [period]);

  return (
    <section className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Yield Dashboard | Council of AI</title>
        <meta
          name="description"
          content="One number per family per week: yield = proofs sold + feed subs + attributed inbound. Derived from settlement data, never typed."
        />
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Helmet>
      <section className="mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          Derived from settlements · never typed
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Yield Dashboard</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">
          One number per family per period: yield = proofs sold + feed subs + attributed inbound.
          Data from gateway logs and the x402 settlement layer. Self-settlements and zero-value
          settlements excluded.
        </p>

        {/* Period toggle */}
        <div className="mt-6 flex gap-2">
          {(["week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                period === p
                  ? "bg-emerald-600 text-white"
                  : "border border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              {p === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>

        {/* Error */}
        {err ? (
          <p className="mt-6 font-mono text-sm text-rose-300">{err}</p>
        ) : null}

        {/* Grand total */}
        {data ? (
          <div className="mt-8 rounded-xl border border-emerald-700/40 bg-emerald-950/30 p-6">
            <p className="text-xs uppercase tracking-wide text-emerald-400">
              Total yield · {data.period}
            </p>
            <p className="mt-2 text-5xl font-black tabular-nums text-emerald-300">
              {data.total_yield}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {data.source}
            </p>
          </div>
        ) : !err ? (
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <p className="text-sm text-slate-400">Loading yield data…</p>
          </div>
        ) : null}

        {/* Family table */}
        {data && data.families.length > 0 ? (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs uppercase text-slate-500">
                  <th className="py-3 pr-4">Family</th>
                  <th className="py-3 pr-4 text-right">Proofs Sold</th>
                  <th className="py-3 pr-4 text-right">Feed Subs</th>
                  <th className="py-3 pr-4 text-right">Attributed</th>
                  <th className="py-3 text-right">Total Yield</th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                {data.families.map((f) => (
                  <tr key={f.family} className="border-b border-slate-800/60">
                    <td className="py-3 pr-4 font-sans font-medium text-slate-200">
                      <FamilyLabel family={f.family} />
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-slate-300">
                      {f.proofs_sold}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-slate-300">
                      {f.feed_subs}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-slate-300">
                      {f.attributed_inbound}
                    </td>
                    <td className="py-3 text-right tabular-nums font-semibold text-emerald-300">
                      {f.yield_total}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-600">
                  <td className="py-3 pr-4 font-sans font-bold text-slate-100">Grand Total</td>
                  <td className="py-3 pr-4 text-right font-mono tabular-nums text-slate-300">
                    {data.families.reduce((s, f) => s + f.proofs_sold, 0)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono tabular-nums text-slate-300">
                    {data.families.reduce((s, f) => s + f.feed_subs, 0)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono tabular-nums text-slate-300">
                    {data.families.reduce((s, f) => s + f.attributed_inbound, 0)}
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums text-lg font-bold text-emerald-200">
                    {data.total_yield}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : null}

        {/* Contract / honesty block */}
        {data ? (
          <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-sm font-semibold text-slate-300">Contract</h2>
            <dl className="mt-3 space-y-2 text-xs text-slate-400">
              <div>
                <dt className="inline text-slate-500">Formula: </dt>
                <dd className="inline font-mono">{data.contract.formula}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Null rule: </dt>
                <dd className="inline">{data.contract.null_rule}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Excludes self: </dt>
                <dd className="inline">{data.contract.excludes_self}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Excludes zero-value: </dt>
                <dd className="inline">{data.contract.excludes_zero_value}</dd>
              </div>
            </dl>
            <p className="mt-3 font-mono text-xs text-slate-500">
              as_of {data.as_of} · period {data.period} · schema {data.schema}
            </p>
          </section>
        ) : null}

        {/* Navigation */}
        <div className="mt-10 flex gap-4 text-sm">
          <Link href="/status" className="text-emerald-400 hover:underline">
            ← Yield status
          </Link>
          <Link href="/status/internal" className="text-emerald-400 hover:underline">
            Weekly scorecard
          </Link>
          <Link href="/api/revenue" className="text-emerald-400 hover:underline">
            /api/revenue
          </Link>
        </div>
      </section>
    </section>
  );
}
