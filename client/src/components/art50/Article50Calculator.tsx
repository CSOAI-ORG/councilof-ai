import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

/**
 * Article 50 exposure calculator — ported from donor csoai-org-v2
 * (src/app/article-50-calculator/Article50CalculatorClient.tsx) per CONSOLIDATION.md.
 *
 * Interactive estimator: days-to-deadline clocks + penalty exposure slider.
 * Pure client-side arithmetic, no backend call. Rethemed to the master wing
 * (dark-emerald on #03110b, same register as components/gspc and the ported
 * ProvenanceFinding page). Dates are the verified ones from /article-50:
 * Art 50 applies from 2 Aug 2026; grandfathering for pre-existing systems
 * closes 2 Dec 2026. Once a deadline passes the clock reads 0 — honest, not
 * hidden.
 */

function daysUntil(date: Date) {
  const now = new Date();
  const ms = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

const DEADLINE = new Date("2026-08-02T00:00:00Z");
const GRANDFATHER_DEADLINE = new Date("2026-12-02T00:00:00Z");

export default function Article50Calculator() {
  const [turnover, setTurnover] = useState(50);
  const [inScope, setInScope] = useState(true);

  useEffect(() => {
    document.title = "Article 50 Calculator — estimate your transparency exposure | CSOAI";
  }, []);

  const days = daysUntil(DEADLINE);
  const grandDays = daysUntil(GRANDFATHER_DEADLINE);
  // Art 83(5): transparency breaches — up to €15M or 3% of worldwide turnover,
  // whichever is higher. The slider models the turnover-based term.
  const fine = useMemo(() => Math.min(turnover * 0.03, 15), [turnover]);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="mx-auto max-w-4xl px-6 pt-14 pb-16">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
          EU AI Act · Article 50 · rule-based estimate
        </p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
          Article 50{" "}
          <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
            Calculator
          </span>
        </h1>
        <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
          Estimate your EU AI Act Article 50 exposure and see how the deadlines stack up.
          This is arithmetic on the published penalty article, not legal advice.
        </p>

        <div className="mt-10 mb-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6 text-center">
            <div className="mb-2 text-5xl font-black tabular-nums text-emerald-300">{days}</div>
            <div className="text-[13px] text-emerald-100/60">
              {days === 0 ? "Article 50 applies since 2 August 2026" : "Days until 2 August 2026"}
            </div>
          </div>
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/[0.06] p-6 text-center">
            <div className="mb-2 text-5xl font-black tabular-nums text-amber-300">{grandDays}</div>
            <div className="text-[13px] text-emerald-100/60">
              {grandDays === 0
                ? "Grandfathering closed 2 December 2026"
                : "Days until grandfathering closes (2 Dec 2026)"}
            </div>
          </div>
        </div>

        <div className="mb-10 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6 sm:p-8">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">Penalty exposure</h2>
          <label
            htmlFor="art50-turnover"
            className="mb-2 block text-sm font-bold text-emerald-100/85"
          >
            Global annual turnover: €{turnover}M
          </label>
          <input
            id="art50-turnover"
            type="range"
            min="5"
            max="5000"
            step="5"
            value={turnover}
            onChange={(e) => setTurnover(Number(e.target.value))}
            className="mb-6 w-full accent-emerald-500"
          />
          <div className="mb-6 flex items-center gap-3">
            <input
              id="art50-inscope"
              type="checkbox"
              checked={inScope}
              onChange={(e) => setInScope(e.target.checked)}
              className="h-5 w-5 accent-emerald-500"
            />
            <label htmlFor="art50-inscope" className="text-sm text-emerald-100/80">
              My system is in scope of Article 50 (chatbot, synthetic content,
              emotion/biometric categorisation, deepfake, or public-interest text)
            </label>
          </div>

          <div className="rounded-xl border border-amber-400/30 bg-amber-500/[0.08] p-6">
            <div className="mb-1 text-[13px] text-emerald-100/60">Estimated maximum fine</div>
            <div className="text-4xl font-black tabular-nums text-amber-300">
              €{fine.toFixed(inScope ? 1 : 0)}M
            </div>
            <p className="mt-2 text-[13px] text-emerald-100/60">
              Up to €15M or 3% of total worldwide annual turnover, whichever is higher.
              {!inScope &&
                " Article 50 transparency obligations primarily apply to GPAI systems and chatbots — other articles may still apply."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-6 sm:p-8">
          <h2 className="mb-3 text-2xl font-bold tracking-tight">Ready to remove the risk?</h2>
          <p className="mb-6 text-emerald-100/80 leading-relaxed">
            The Article 50 Kit ships disclosure strings, watermarking templates, human oversight
            triggers, and 12 months of signed attestations from the watermark-attest MCP.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/article-50"
              className="inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-[#03110b] transition hover:bg-emerald-400"
            >
              Get the Article 50 Kit →
            </Link>
            <Link
              href="/article-50"
              className="inline-block rounded-xl border border-emerald-400/40 px-6 py-3 text-sm font-bold text-emerald-100 transition hover:bg-white/5"
            >
              Read the full Article 50 breakdown
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
