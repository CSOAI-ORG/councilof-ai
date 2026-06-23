"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

function daysUntil(date: Date) {
  const now = new Date();
  const ms = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

const DEADLINE = new Date("2026-08-02T00:00:00Z");
const GRANDFATHER_DEADLINE = new Date("2026-12-02T00:00:00Z");

export default function Article50CalculatorClient() {
  const [turnover, setTurnover] = useState(50);
  const [isChatbot, setIsChatbot] = useState(true);

  const days = daysUntil(DEADLINE);
  const grandDays = daysUntil(GRANDFATHER_DEADLINE);
  const fine = useMemo(() => Math.min(turnover * 0.03, 15), [turnover]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-400">
          EU AI Act
        </div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">Article 50 Calculator</h1>
        <p className="mb-12 text-lg text-slate-400">
          Estimate your EU AI Act Article 50 exposure and see how many days remain to become compliant.
        </p>

        <div className="mb-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <div className="mb-2 text-5xl font-black text-emerald-400">{days}</div>
            <div className="text-sm text-slate-500">Days until 2 August 2026</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <div className="mb-2 text-5xl font-black text-amber-400">{grandDays}</div>
            <div className="text-sm text-slate-500">Days until grandfathering closes (2 Dec 2026)</div>
          </div>
        </div>

        <div className="mb-12 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="mb-6 text-2xl font-bold">Penalty exposure</h2>
          <label className="mb-2 block text-sm font-bold text-slate-300">
            Global annual turnover: €{turnover}M
          </label>
          <input
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
              id="chatbot"
              type="checkbox"
              checked={isChatbot}
              onChange={(e) => setIsChatbot(e.target.checked)}
              className="h-5 w-5 accent-emerald-500"
            />
            <label htmlFor="chatbot" className="text-sm text-slate-300">
              My system is in scope of Article 50 (chatbot, synthetic content, emotion/biometric categorisation, deepfake, or public-interest text)
            </label>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-6">
            <div className="mb-1 text-sm text-slate-500">Estimated maximum fine</div>
            <div className="text-4xl font-black text-amber-400">
              €{fine.toFixed(isChatbot ? 1 : 0)}M
            </div>
            {!isChatbot && (
              <p className="mt-2 text-sm text-slate-400">
                Article 50 transparency obligations primarily apply to GPAI systems and chatbots. Other articles may still apply.
              </p>
            )}
          </div>
        </div>

        <div className="mb-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8">
          <h2 className="mb-4 text-2xl font-bold">Ready to remove the risk?</h2>
          <p className="mb-6 text-slate-300">
            CSOAI&apos;s Article 50 Kit gives you disclosure strings, watermarking templates, human oversight triggers,
            and 12 months of Pro governance — starting at £999.
          </p>
          <Link href="/article-50-kit" className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600">
            Get the Article 50 Kit →
          </Link>
        </div>
      </div>
    </div>
  );
}
