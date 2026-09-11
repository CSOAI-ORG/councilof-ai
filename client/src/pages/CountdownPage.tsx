import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

type Deadline = {
  date: string;
  instrument: string;
  what: string;
  basis?: string;
  status?: string;
};

type RegulationFeed = {
  verified_as_of?: string;
  headline_correction?: string;
  scope_note?: string;
  deadlines?: Deadline[];
};

function daysUntil(iso: string, now: Date): number {
  const t = Date.parse(iso + "T00:00:00Z");
  if (!Number.isFinite(t)) return NaN;
  return Math.ceil((t - now.getTime()) / 86400000);
}

export default function CountdownPage() {
  const [feed, setFeed] = useState<RegulationFeed | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [now] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/regulation")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!cancelled) setFeed(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message || "UNCHECKABLE");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const upcoming = (feed?.deadlines || [])
    .map((d) => ({ ...d, days: daysUntil(d.date, now) }))
    .filter((d) => Number.isFinite(d.days) && d.days >= 0)
    .sort((a, b) => a.days - b.days);

  const past = (feed?.deadlines || [])
    .map((d) => ({ ...d, days: daysUntil(d.date, now) }))
    .filter((d) => Number.isFinite(d.days) && d.days < 0)
    .sort((a, b) => b.days - a.days);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Regulatory countdown | Council of AI</title>
        <meta
          name="description"
          content="Live EU AI Act and related deadlines derived from /api/regulation. Not a compliance determination."
        />
      </Helmet>
      <section className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          Derived from GET /api/regulation
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Countdown</h1>
        <p className="mt-4 leading-7 text-slate-300">
          Dates come from the live feed. This page does not type them. A cited deadline is
          regulatory context, not a determination that anyone is compliant. Measurement, not
          certification.
        </p>
        {feed?.headline_correction ? (
          <p className="mt-4 rounded-xl border border-amber-300/30 bg-amber-950/40 p-4 text-sm leading-6 text-amber-100">
            {feed.headline_correction}
          </p>
        ) : null}
        {err ? (
          <p className="mt-6 font-mono text-sm text-rose-300">Feed UNCHECKABLE: {err}</p>
        ) : !feed ? (
          <p className="mt-6 font-mono text-sm text-slate-400">Loading feed…</p>
        ) : (
          <>
            <p className="mt-4 font-mono text-xs text-slate-500">
              verified_as_of {feed.verified_as_of || "UNCHECKABLE"} · clock {now.toISOString()}
            </p>
            <h2 className="mt-10 text-xl font-bold">Next</h2>
            <ul className="mt-4 space-y-3">
              {upcoming.map((d) => (
                <li
                  key={d.date + d.what}
                  className="rounded-xl border border-slate-700 bg-slate-900/80 p-4"
                >
                  <div className="font-mono text-emerald-300">
                    {d.days} day{d.days === 1 ? "" : "s"} · {d.date}
                  </div>
                  <div className="mt-1 text-sm text-slate-200">
                    {d.instrument}: {d.what}
                  </div>
                  {d.status ? (
                    <div className="mt-1 font-mono text-xs text-slate-500">{d.status}</div>
                  ) : null}
                </li>
              ))}
            </ul>
            <h2 className="mt-10 text-xl font-bold">Already in force (this feed)</h2>
            <ul className="mt-4 space-y-3">
              {past.slice(0, 8).map((d) => (
                <li
                  key={d.date + d.what}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
                >
                  <div className="font-mono text-slate-400">
                    {d.date} · {Math.abs(d.days)} days ago
                  </div>
                  <div className="mt-1 text-sm text-slate-300">
                    {d.instrument}: {d.what}
                  </div>
                </li>
              ))}
            </ul>
            <section className="mt-10 rounded-xl border border-slate-700 p-5">
              <h2 className="text-xl font-bold">Enforcement tracker</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                EU AI Act Article 99 fining powers are in this feed as regulatory context. This
                page does not maintain a fine register. Public AI Act fines issued in this estate:
                <strong> 0 recorded here</strong>. Investigations opened:{" "}
                <strong>UNCHECKABLE</strong> (no official public investigation register is ingested).
                Watching. Not a legal conclusion.
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Deepfake marking is Article 50 context, not a product claim. Verify stays free:{" "}
                <Link href="/gspc-verify" className="text-emerald-300 underline">
                  /gspc-verify
                </Link>
                . CRA reporting clocks:{" "}
                <Link href="/cra-readiness" className="text-emerald-300 underline">
                  /cra-readiness
                </Link>
                .
              </p>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
