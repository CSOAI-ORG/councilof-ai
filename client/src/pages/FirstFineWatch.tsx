import { useEffect, useState } from "react";
import { FINES, DEADLINES } from "@/data/enforcement";
import { builtInFineWatch, dateLabel, eurLabel, readFineWatch, type FineWatchRead } from "@/data/firstFineWatch";

/**
 * First-Fine Watch. The headline is read from GET /api/fines with the date the record was last
 * checked; a figure older than FRESH_DAYS carries "Not updated since <date>" (firstFineWatch.ts).
 * Until the feed answers, the last verified figure shipped with the page is shown with its own date
 * and the same label, so no reader is ever shown an old figure as today's.
 */
export default function FirstFineWatch() {
  const [read, setRead] = useState<FineWatchRead>(() => builtInFineWatch());
  const [feed, setFeed] = useState<"loading" | "live" | "unread">("loading");

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/fines", { headers: { accept: "application/json" }, signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => {
        const live = readFineWatch(j);
        if (live) {
          setRead(live);
          setFeed("live");
        } else setFeed("unread");
      })
      .catch(() => {
        if (!ac.signal.aborted) setFeed("unread");
      });
    return () => ac.abort();
  }, []);

  const checked = dateLabel(read.asOf);
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">First-Fine Watch</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700 sm:text-base">
          Has anyone been fined under the EU AI Act yet? We keep a public, signed record of reported AI enforcement and
          watch it for the first fine.
        </p>

        <section
          aria-labelledby="ffw-headline"
          className="mt-6 rounded-2xl bg-[#04120c] p-5 text-white sm:p-6"
          data-testid="ffw-headline"
          data-stale={read.stale ? "true" : "false"}
          data-from={read.from}
        >
          <p className="flex flex-wrap items-center gap-2">
            {read.stale ? (
              <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-950" data-testid="ffw-stale">
                Not updated since {checked}
              </span>
            ) : (
              <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-950" data-testid="ffw-fresh">
                Checked {checked}
              </span>
            )}
          </p>
          <h2 id="ffw-headline" className="mt-3">
            <span className="block font-mono text-4xl font-black tracking-tight text-emerald-200 sm:text-5xl" data-testid="ffw-figure">
              {eurLabel(read.eur)}
            </span>
            <span className="mt-1 block text-base font-semibold text-white sm:text-lg">
              in EU AI Act fines found, as of <time dateTime={read.asOf}>{checked}</time>
            </span>
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-emerald-50/90">
            Fining powers for general-purpose AI models began on <time dateTime={read.powersOn}>{dateLabel(read.powersOn)}</time>.
            At this check, {read.daysPowersToCheck} days later, no fine had been published.
          </p>
          {read.stale ? (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-amber-100" data-testid="ffw-stale-note">
              This record has not been re-checked for {read.ageDays} days. A fine published after {checked} would not
              appear here.
            </p>
          ) : null}
          <p className="mt-3 text-xs text-emerald-50/70" data-testid="ffw-source">
            {feed === "loading"
              ? "Reading the live record…"
              : feed === "live"
                ? "Read just now from the live record, which carries its own check date."
                : "The live record could not be read just now; this is the last verified figure, with its date."}{" "}
            <a href="/api/fines" className="font-semibold text-emerald-200 underline underline-offset-2">
              Open the signed record
            </a>
          </p>
        </section>

        <h2 className="mt-8 text-lg font-bold">Reported AI and AI-adjacent enforcement</h2>
        <p className="mt-1 text-xs text-slate-600">Public secondary sources, as of <time dateTime={read.asOf}>{checked}</time>. Reported, not re-verified by us.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left text-xs uppercase text-slate-600">
                <th scope="col" className="py-2 pr-3">Who</th>
                <th scope="col" className="pr-3">Rule</th>
                <th scope="col" className="pr-3">Amount</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {FINES.map((f) => (
                <tr key={f.actor} className="border-b border-slate-200 align-top">
                  <td className="py-2 pr-3 font-medium">{f.actor}</td>
                  <td className="pr-3 text-slate-700">{f.regime}</td>
                  <td className="pr-3 font-mono text-slate-900">{f.amount}</td>
                  <td className="text-slate-700">{f.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-8 text-lg font-bold">Regulatory deadlines</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {DEADLINES.map((d) => (
            <div key={d.name} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="font-mono text-sm font-bold text-emerald-900">{d.date}</div>
              <div className="text-sm text-slate-900">{d.name}</div>
              <div className="text-xs text-slate-600">{d.note}</div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-slate-600">
          Free to read and to verify. A record of reported enforcement: not a rating, not a certification.
        </p>
      </div>
    </div>
  );
}
