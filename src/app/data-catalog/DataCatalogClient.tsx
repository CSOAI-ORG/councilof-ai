"use client";

import { useMemo, useState } from "react";
import type { DataCatalogEntry } from "@/types/data-catalog";

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function badgeColor(category: string) {
  const map: Record<string, string> = {
    regulatory: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    financial: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    company: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    government: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    geographic: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    cyber: "bg-red-500/10 text-red-400 border-red-500/20",
    trade: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    academic: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };
  const key = slugify(category).split("-")[0];
  return map[key] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
}

export default function DataCatalogClient({ entries }: { entries: DataCatalogEntry[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [license, setLicense] = useState<string>("");
  const [format, setFormat] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");

  const categories = useMemo(
    () => Array.from(new Set(entries.map((e) => e.category))).sort(),
    [entries]
  );
  const licenses = useMemo(
    () => Array.from(new Set(entries.map((e) => e.license).filter(Boolean))).sort(),
    [entries]
  );
  const formats = useMemo(
    () => Array.from(new Set(entries.map((e) => e.format).filter(Boolean))).sort(),
    [entries]
  );
  const apiOptions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.apiKey).filter(Boolean))).sort(),
    [entries]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return entries.filter((e) => {
      const matchesQuery =
        !q ||
        e.name.toLowerCase().includes(q) ||
        (e.keyData && e.keyData.toLowerCase().includes(q)) ||
        (e.format && e.format.toLowerCase().includes(q));
      const matchesCategory = !category || e.category === category;
      const matchesLicense = !license || e.license === license;
      const matchesFormat = !format || e.format === format;
      const matchesApi = !apiKey || e.apiKey === apiKey;
      return matchesQuery && matchesCategory && matchesLicense && matchesFormat && matchesApi;
    });
  }, [entries, query, category, license, format, apiKey]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
          Open Data
        </div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
          Free Data Catalog
        </h1>
        <p className="mb-8 max-w-3xl text-lg text-slate-400">
          127 open datasets CSOAI uses for training, compliance, threat intelligence, finance, and
          world modelling. Filter, export, or plug them straight into your agent pipeline.
        </p>

        <div className="mb-10 flex flex-wrap items-center gap-4">
          <a
            href="/api/data-catalog"
            className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:border-emerald-500/40"
          >
            Download JSON
          </a>
          <a
            href="/api/data-catalog?format=csv"
            className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:border-emerald-500/40"
          >
            Download CSV
          </a>
          <span className="text-sm text-slate-500">{filtered.length} sources shown</span>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, data, format..."
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none lg:col-span-2"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
          >
            <option value="">All licenses</option>
            {licenses.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
          >
            <option value="">All formats</option>
            {formats.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {apiOptions.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2">
            <span className="py-2 text-sm text-slate-500">API key:</span>
            {["", "No", "Free reg"].map((opt) => (
              <button
                key={opt || "all"}
                onClick={() => setApiKey(opt)}
                className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                  apiKey === opt
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                    : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600"
                }`}
              >
                {opt || "Any"}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((entry) => (
            <a
              key={entry.name + entry.category}
              href={entry.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-500/30 hover:bg-white/[0.05]"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400">
                  {entry.name}
                </h3>
                <span
                  className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${badgeColor(
                    entry.category
                  )}`}
                >
                  {entry.category.split(" ")[0]}
                </span>
              </div>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-400">
                {entry.keyData || "Open data source"}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                {entry.format && (
                  <span className="rounded-md bg-slate-900 px-2 py-1 border border-slate-800">
                    {entry.format}
                  </span>
                )}
                {entry.license && (
                  <span className="rounded-md bg-slate-900 px-2 py-1 border border-slate-800">
                    {entry.license}
                  </span>
                )}
                {entry.apiKey && (
                  <span className="rounded-md bg-slate-900 px-2 py-1 border border-slate-800">
                    {entry.apiKey}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <p className="text-lg font-bold text-slate-300">No sources match your filters.</p>
            <button
              onClick={() => {
                setQuery("");
                setCategory("");
                setLicense("");
                setFormat("");
                setApiKey("");
              }}
              className="mt-4 text-emerald-400 hover:text-emerald-300"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
