import { HF_LIVING_RULING, HF_PLANTED, HF_VIEWERS } from "@/lib/hfLivingRecord";

/**
 * Native planted-record strip. Links out to Hugging Face.
 * Never an iframe of a Space. Never a second living board.
 */
export default function HfLivingRecord({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-labelledby="hf-record-h"
      className={
        compact
          ? "mt-8 rounded-2xl border border-slate-200 bg-white/80 p-4"
          : "mt-10 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(4,18,12,.45)] sm:p-7"
      }
      data-testid="hf-living-record"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-700">
        Hugging Face record
      </p>
      <h2 id="hf-record-h" className="mt-2 text-xl font-bold text-slate-900">
        The signed record lives on the Hub
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{HF_LIVING_RULING}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {HF_PLANTED.map((r) => (
          <li key={r.id}>
            <a
              href={r.href}
              className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 hover:border-emerald-400/50 hover:bg-emerald-50/40"
            >
              <span className="font-mono text-[13px] font-semibold text-slate-900">csoai/{r.id}</span>
              <span className="mt-1 block text-[13px] leading-relaxed text-slate-600">{r.role}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[12px] text-slate-500">
        Viewers open on the Hub. We do not iframe them here.
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        {HF_VIEWERS.map((v) => (
          <li key={v.id}>
            <a href={v.href} className="font-medium text-emerald-800 hover:underline">
              {v.id.replace("space-", "")}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
