import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { headline, readState, type StateCell, type StateRead } from "@/lib/liveState";

/**
 * /status — what the estate can presently establish, read from GET /api/state.
 *
 * Before 2026-09-06 this route rendered ContentReviewNotice: "This legacy page
 * is temporarily withdrawn", noindex,nofollow. It is a PRIMARY_PATH under
 * Evidence (client/src/data/library-ia.ts) and a stop on the product tour,
 * where demoTour.ts narrates it as "The status page reports the checks it
 * actually performs." Meanwhile the prerendered title said "System Status |
 * CSOAI". The title promised a page the body withdrew.
 *
 * This page performs no checks of its own and computes nothing. It quotes
 * /api/state by field name, keeps every figure's `kind`, renders the payload's
 * own cautions, and prints the list of things that endpoint refuses to speak
 * for. If the endpoint does not answer, the page says so — it does not fall
 * back to a remembered number.
 */

function Cell({ c }: { c: StateCell }) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm capitalize text-slate-300">{c.label}</span>
        {c.kind ? (
          <span className="rounded-md border border-emerald-400/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
            {c.kind}
          </span>
        ) : null}
      </div>
      <div className="mt-1 text-2xl font-bold text-slate-50">{c.value}</div>
      <div className="mt-1 font-mono text-[11px] text-slate-500">{c.field}</div>
      {c.as_of ? (
        <div className="mt-1 text-[11px] text-slate-400">
          as at {c.as_of}
          {c.as_of_field ? <span className="text-slate-500"> · from {c.as_of_field}</span> : null}
        </div>
      ) : null}
      {c.note ? <p className="mt-2 text-[12px] leading-snug text-slate-400">{c.note}</p> : null}
    </div>
  );
}

export default function Status() {
  const [read, setRead] = useState<StateRead>({ state: "unread", reason: "not read yet" });
  const [raw, setRaw] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;
    void fetch("/api/state", { headers: { accept: "application/json" }, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((j) => {
        if (!alive) return;
        setRaw(j);
        setRead(readState(j));
      })
      .catch((err: Error) => alive && setRead({ state: "unread", reason: err.message }));
    return () => {
      alive = false;
    };
  }, []);

  const head = raw ? headline(raw) : null;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>System Status | CSOAI</title>
        <meta
          name="description"
          content="What Council of AI can presently establish, read live from GET /api/state — every figure with the kind and date the endpoint gave it."
        />
      </Helmet>

      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">
          System status · read from GET /api/state
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          What we can establish right now.
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">
          Every figure below is quoted from <code className="text-slate-200">GET /api/state</code> by
          field name, with the <em>kind</em> and date that endpoint attached to it. Nothing on this
          page is computed here and nothing is added up: a declared slot, a catalogue entry and a
          verified measurement are different kinds of fact, and the endpoint's own contract says
          they are never summed. If a number is not in that payload, it is not established, and it
          is not here.
        </p>

        {read.state === "unread" ? (
          <div
            data-testid="state-unread"
            className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-950/20 p-5"
          >
            <p className="font-mono text-xs uppercase tracking-widest text-amber-300">Unread</p>
            <p className="mt-2 leading-7 text-slate-300">
              <code className="text-slate-200">GET /api/state</code> did not answer ({read.reason}).
              This page has nothing to report, which is not the same as reporting zero — no figure
              is shown rather than a remembered one.
            </p>
          </div>
        ) : (
          <>
            {head ? (
              <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-950/25 p-5">
                <div className="text-3xl font-black text-emerald-200">{head.value}</div>
                <div className="mt-1 font-mono text-[11px] text-emerald-300/70">
                  public_count · {head.kind}
                  {head.as_of ? ` · as at ${head.as_of}` : ""}
                </div>
                {head.note ? <p className="mt-2 text-sm text-slate-300">{head.note}</p> : null}
              </div>
            ) : null}

            <div className="mt-8 space-y-8">
              {read.sections.map((s) => (
                <section key={s.id} data-testid={`state-section-${s.id}`}>
                  <h2 className="text-xl font-bold capitalize text-slate-100">{s.title}</h2>
                  <div className="mt-1 font-mono text-[11px] text-slate-500">
                    {s.authority ? <>authority {s.authority}</> : null}
                    {s.live_endpoint ? <> · live {s.live_endpoint}</> : null}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {s.cells.map((c) => (
                      <Cell key={c.field} c={c} />
                    ))}
                  </div>
                  {s.cautions.map((t) => (
                    <p key={t.slice(0, 40)} className="mt-3 text-[12px] leading-snug text-amber-200/80">
                      {t}
                    </p>
                  ))}
                </section>
              ))}
            </div>

            {read.notCovered.length ? (
              <section className="mt-12" data-testid="state-not-covered">
                <h2 className="text-xl font-bold text-slate-100">What this page does not cover</h2>
                <p className="mt-1 text-sm text-slate-400">
                  The endpoint speaks only for the committed artifacts above. These are named as out
                  of scope, with the reason.
                </p>
                <ul className="mt-3 space-y-2">
                  {read.notCovered.map((n) => (
                    <li
                      key={n.subject}
                      className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-3"
                    >
                      <span className="font-semibold text-slate-200">{n.subject}</span>
                      {n.why_not ? (
                        <p className="mt-1 text-[12px] leading-snug text-slate-400">{n.why_not}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {read.doctrine ? (
              <p className="mt-10 border-t border-slate-800 pt-5 text-[12px] leading-snug text-slate-400">
                {read.doctrine}
              </p>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
