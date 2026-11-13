import {
  HF_LIVING_RULING,
  HF_PLANTED,
  HF_VIEWERS,
  KAGGLE_AND_HF_COMPETITIONS,
} from "@/lib/hfLivingRecord";
import { STAFF_PALS_ROSTER } from "@/lib/sovPersona";

/**
 * Native planted-record strip. Links out to Hugging Face and companion distribution mirrors.
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-700">
            Hugging Face &amp; Kaggle signed records, cohorts &amp; competitions
          </p>
          <h2 id="hf-record-h" className="mt-2 text-xl font-bold text-slate-900">
            The signed record lives on the Hub &amp; Kaggle
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <a
            href="/dashboard?tab=leaderboard#hub-and-mill-cohorts"
            className="rounded-lg border border-emerald-700/30 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-900 hover:bg-emerald-100"
          >
            Hugging Face Hub cells &amp; 166-model registry →
          </a>
          <a
            href="/models-measured/"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-800 hover:border-emerald-400"
          >
            /models-measured/ →
          </a>
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{HF_LIVING_RULING}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {HF_PLANTED.map((r) => (
          <li key={r.id}>
            <a
              href={r.href}
              className="block h-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 hover:border-emerald-400/50 hover:bg-emerald-50/40"
            >
              <span className="font-mono text-[13px] font-semibold text-slate-900">csoai/{r.id}</span>
              <span className="mt-1 block text-[13px] leading-relaxed text-slate-600">{r.role}</span>
            </a>
          </li>
        ))}
        <li>
          <a
            href="https://huggingface.co/datasets/csoai/gspc-hub-cards"
            className="block h-full rounded-xl border border-emerald-700/25 bg-emerald-50/60 px-3 py-3 hover:border-emerald-500/60 hover:bg-emerald-50"
          >
            <span className="font-mono text-[13px] font-semibold text-emerald-950">csoai/gspc-hub-cards</span>
            <span className="mt-1 block text-[13px] leading-relaxed text-slate-700">
              Third-party Hugging Face model-axis observations (served live via GET /api/hub-cards). Separate from the Council fleet.
            </span>
          </a>
        </li>
      </ul>

      <div className="mt-5 rounded-2xl border border-emerald-700/20 bg-emerald-50/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Kaggle &amp; Hugging Face Competition &amp; Benchmark Tracks
          </p>
          <span className="font-mono text-[11px] text-slate-600">
            CSOAI White + Green · CC0-1.0 / MIT-0 · Cite GET /api/gspc
          </span>
        </div>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {KAGGLE_AND_HF_COMPETITIONS.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                className="block h-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:border-emerald-500/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold text-emerald-800">
                    {item.platform} · {item.license}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">{item.axis}</span>
                </div>
                <span className="mt-1 block text-[13px] font-semibold text-slate-900">
                  {item.title}
                </span>
                <span className="mt-1 block text-[12px] leading-relaxed text-slate-600">
                  {item.role}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

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
        <li>
          <a href="https://huggingface.co/csoai" className="font-medium text-emerald-800 hover:underline">
            huggingface.co/csoai (all datasets &amp; Spaces)
          </a>
        </li>
        <li>
          <a href="https://www.kaggle.com/nicktempleman/datasets" className="font-medium text-emerald-800 hover:underline">
            Kaggle mirror (nicktempleman)
          </a>
        </li>
      </ul>
      <div className="mt-4 border-t border-slate-200/80 pt-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          CSOAI × MEOK Professional Staff PALS ({STAFF_PALS_ROSTER.length} bound specialists)
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {STAFF_PALS_ROSTER.map((pal) => (
            <a
              key={pal.id}
              href="/welcome"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-700 hover:border-emerald-400"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pal.accent }} />
              <span className="font-semibold text-slate-900">{pal.name}</span>
              <span className="text-slate-500">· {pal.title}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
