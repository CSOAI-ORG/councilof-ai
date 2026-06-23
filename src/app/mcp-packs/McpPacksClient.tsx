"use client";

import { useState } from "react";
import { getDatasetsForPack, PACK_DATA_MAPPINGS } from "@/lib/hive-catalog";

const packs = [
  {
    id: "pack_eu_ai_act",
    slug: "eu-ai-act",
    name: "EU AI Act Emergency Pack",
    desc: "7 MCP servers designed specifically to enforce EU AI Act Article 50 transparency and risk classification at runtime.",
    price: "£999",
    billing: "one-time",
    servers: ["csoai-layer0-compliance", "csoai-risk-classifier", "csoai-article50-watermark", "csoai-human-oversight-trigger"],
  },
  {
    id: "pack_growth",
    slug: "brand-distribution",
    name: "Brand & Distribution Pack",
    desc: "Automate your entire Go-To-Market strategy. AEO/GEO optimization, brand authority scoring, and conversion funnels built on the same 475-repo stack.",
    price: "£499",
    billing: "one-time",
    servers: ["csoai-brand-authority", "csoai-aeo-geo-optimizer", "csoai-conversion-funnel", "csoai-social-automation"],
  },
  {
    id: "pack_finance",
    slug: "agentic-finance",
    name: "Agentic Finance Pack",
    desc: "Pre-check compliance before any agent executes a payment via Stripe ACP, x402, or AP2.",
    price: "£1,499",
    billing: "annually",
    servers: ["csoai-payment-precheck", "csoai-aml-kyc-validator", "csoai-x402-tunnel", "csoai-stripe-acp-tunnel"],
  },
];

export default function McpPacks() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (productId: string) => {
    setLoading(productId);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) {
          setError("Payments are being set up. Email hello@meok.ai to purchase.");
        } else {
          setError(data?.message || "Checkout failed");
        }
        return;
      }
      if (data?.url) {
        window.open(data.url, "_self");
      }
    } catch (e: unknown) {
      setError((e as Error)?.message || "Network error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-20">
          <h1 className="text-6xl font-black mb-6 tracking-tighter bg-gradient-to-r from-white to-emerald-500 bg-clip-text text-transparent">
            PREMIUM MCP PACKS
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
            Monetizing 475 open-source assets into production-ready governance bundles. The missing software for the agentic economy.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {packs.map((p) => (
            <div
              key={p.id}
              className="p-10 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group flex flex-col"
            >
              <h3 className="text-2xl font-bold mb-4 text-emerald-400">{p.name}</h3>
              <p className="text-sm text-slate-400 mb-8 flex-grow leading-relaxed">{p.desc}</p>
              <div className="mb-8">
                <div className="text-4xl font-black">{p.price}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  {p.billing}
                </div>
              </div>
              <div className="border-t border-white/5 pt-6 mb-6">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">
                  Includes
                </span>
                <ul className="space-y-2">
                  {p.servers.map((s) => (
                    <li key={s} className="text-xs font-mono text-slate-300">
                      / {s}
                    </li>
                  ))}
                </ul>
              </div>
              {p.slug && (
                <div className="border-t border-white/5 pt-6 mb-10">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                    Data fuel
                  </span>
                  <p className="mb-3 text-xs text-slate-500">
                    {PACK_DATA_MAPPINGS.find((m) => m.slug === p.slug)?.explanation}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getDatasetsForPack(p.slug)
                      .slice(0, 4)
                      .map((d) => (
                        <a
                          key={d.name}
                          href={d.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-300 transition hover:border-emerald-500/40 hover:text-emerald-400"
                          title={d.keyData}
                        >
                          {d.name}
                        </a>
                      ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => handlePurchase(p.id)}
                disabled={loading !== null}
                className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20"
              >
                {loading === p.id ? "Redirecting to Stripe…" : "Purchase Pack"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
