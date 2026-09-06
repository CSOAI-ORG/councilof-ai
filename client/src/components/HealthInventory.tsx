import { useEffect, useState } from "react";
import {
  boardCorrectionsLine,
  boardHealthLine,
  type CorrectionsRead,
  HEALTH_FACTS,
  HEALTH_NEVER,
  HEALTH_PUBLIC_LINE,
  HEALTH_RULING,
  LIVE_HEALTH_PIN,
  readCorrectionsCount,
} from "@/lib/healthInventory";

export default function HealthInventory({ tone = "dark" }: { tone?: "dark" | "light" }) {
  // The corrections count is DERIVED, never typed. It moved 39 -> 47 between
  // 2026-09-02 and 2026-09-06; anything pinned in the bundle ships stale.
  const [corrections, setCorrections] = useState<CorrectionsRead>({
    state: "unread",
    reason: "not read yet",
  });

  useEffect(() => {
    let live = true;
    void fetch("/api/corrections", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((j) => live && setCorrections(readCorrectionsCount(j)))
      .catch((err: Error) => live && setCorrections({ state: "unread", reason: err.message }));
    return () => {
      live = false;
    };
  }, []);

  const dark = tone === "dark";
  const panel = dark
    ? "rounded-2xl border border-emerald-400/20 bg-emerald-950/40 p-4"
    : "rounded-2xl border border-slate-200 bg-white p-4";
  const title = dark ? "text-slate-100" : "text-slate-900";
  const body = dark ? "text-slate-300" : "text-slate-600";
  const muted = dark ? "text-emerald-300/80" : "text-emerald-800";
  const head = dark ? "text-emerald-300" : "text-slate-900";

  return (
    <section className="mt-12 space-y-8" data-testid="health-inventory" aria-labelledby="health-h">
      <div>
        <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${muted}`}>
          Health inventory · all correct facts we can access
        </p>
        <h2 id="health-h" className={`mt-2 text-xl font-bold ${head}`}>
          {HEALTH_RULING}
        </h2>
        <p className={`mt-3 text-sm ${body}`}>
          How healthy the record is, as at {LIVE_HEALTH_PIN.as_at}: {LIVE_HEALTH_PIN.board},{" "}
          {LIVE_HEALTH_PIN.empty} empty, {LIVE_HEALTH_PIN.index_rows} signed index rows. That is
          coverage. It is not a grade of the model, and it is a snapshot — the living board is
          GET /api/gspc.
        </p>
        <p className={`mt-3 font-mono text-[13px] ${title}`}>{HEALTH_PUBLIC_LINE}</p>
        <p className={`mt-2 text-sm ${body}`}>
          Board as at {LIVE_HEALTH_PIN.as_at}: {boardHealthLine()}
        </p>
        <p className={`mt-2 text-sm ${body}`} data-testid="corrections-line">
          {boardCorrectionsLine(corrections)}
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {HEALTH_FACTS.map((fact) => (
          <li key={fact.id} className={panel} data-testid={`health-fact-${fact.id}`}>
            <div className="flex items-baseline justify-between gap-2">
              <a href={fact.href} className={`font-semibold underline-offset-2 hover:underline ${title}`}>
                {fact.title}
              </a>
              <span className={`font-mono text-[10px] uppercase ${muted}`}>{fact.state}</span>
            </div>
            <p className={`mt-2 text-sm ${body}`}>{fact.means}</p>
            <p className={`mt-1 text-[12px] ${muted}`}>{fact.access}</p>
          </li>
        ))}
      </ul>

      <div className={panel} data-testid="health-never">
        <p className={`font-mono text-[11px] uppercase tracking-[0.16em] ${muted}`}>Never</p>
        <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm ${body}`}>
          {HEALTH_NEVER.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
