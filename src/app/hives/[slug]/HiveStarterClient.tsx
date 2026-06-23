"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DataCatalogEntry, HiveDefinition } from "@/types/data-catalog";

export default function HiveStarterClient({
  hive,
  entries,
}: {
  hive: HiveDefinition;
  entries: DataCatalogEntry[];
}) {
  const [query, setQuery] = useState("");

  const formats = useMemo(
    () => Array.from(new Set(entries.map((e) => e.format).filter(Boolean))).sort(),
    [entries]
  );
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return entries.filter(
      (e) =>
        !q ||
        e.name.toLowerCase().includes(q) ||
        (e.keyData && e.keyData.toLowerCase().includes(q))
    );
  }, [entries, query]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <Link
          href="/hives"
          className="mb-6 inline-block text-sm font-bold text-slate-500 hover:text-emerald-400"
        >
          ← All Hives
        </Link>
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest"
          style={{ borderColor: `${hive.color}40`, color: hive.color, backgroundColor: `${hive.color}15` }}
        >
          Starter Pack
        </div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">{hive.name}</h1>
        <p className="mb-4 max-w-3xl text-lg text-slate-400">{hive.description}</p>
        <p className="mb-10 max-w-3xl text-slate-300">{hive.useCase}</p>

        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-3xl font-black" style={{ color: hive.color }}>
              {entries.length}
            </div>
            <div className="text-sm text-slate-500">Open data sources</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-3xl font-black" style={{ color: hive.color }}>
              {formats.length}
            </div>
            <div className="text-sm text-slate-500">Formats represented</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-3xl font-black" style={{ color: hive.color }}>
              $0
            </div>
            <div className="text-sm text-slate-500">Annual data cost</div>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-4">
          <a
            href={`/api/data-catalog?format=csv`}
            className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:border-emerald-500/40"
          >
            Download full catalog CSV
          </a>
          <a
            href="/data-catalog"
            className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:border-emerald-500/40"
          >
            Explore all datasets
          </a>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter this hive's datasets..."
          className="mb-8 w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((entry) => (
            <a
              key={entry.name}
              href={entry.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-500/30 hover:bg-white/[0.05]"
            >
              <h3 className="mb-2 text-lg font-bold text-white group-hover:text-emerald-400">
                {entry.name}
              </h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-400">
                {entry.keyData || "Open data source"}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                {entry.format && (
                  <span className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1">
                    {entry.format}
                  </span>
                )}
                {entry.license && (
                  <span className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1">
                    {entry.license}
                  </span>
                )}
                {entry.apiKey && (
                  <span className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1">
                    {entry.apiKey}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <p className="text-lg font-bold text-slate-300">No datasets match your filter.</p>
            <button onClick={() => setQuery("")} className="mt-4 text-emerald-400 hover:text-emerald-300">
              Clear filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
