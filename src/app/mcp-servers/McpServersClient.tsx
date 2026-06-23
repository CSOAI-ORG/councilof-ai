"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SectorGroup, Server, Stat, Tier, TierInfo } from "./servers";

interface McpServersClientProps {
  stats: Stat[];
  tiers: TierInfo[];
  sectorGroups: SectorGroup[];
}

const TIER_STYLES: Record<Tier, string> = {
  nano: "bg-slate-800 text-slate-300 border-slate-700",
  lvp: "bg-blue-950 text-blue-400 border-blue-800",
  mvp: "bg-purple-950 text-purple-400 border-purple-800",
  hvp: "bg-amber-950 text-amber-400 border-amber-800",
  elite: "bg-red-950 text-red-400 border-red-800",
};

const TIER_LABEL_COLORS: Record<Tier, string> = {
  nano: "text-slate-400",
  lvp: "text-blue-400",
  mvp: "text-purple-400",
  hvp: "text-amber-400",
  elite: "text-red-400",
};

const ALL_TIERS: (Tier | "all")[] = ["all", "nano", "lvp", "mvp", "hvp", "elite"];

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${TIER_STYLES[tier]}`}
    >
      {tier}
    </span>
  );
}

function ServerCard({ server, showSector }: { server: Server; showSector?: string }) {
  return (
    <div className="group flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-emerald-500/30 hover:bg-white/[0.05]">
      <div className="font-mono text-sm font-medium text-slate-200">{server.name}</div>
      <div className="flex flex-wrap items-center gap-2">
        <TierBadge tier={server.tier} />
        <span className="text-xs text-slate-400">{server.price}</span>
        {showSector && <span className="text-[10px] uppercase tracking-wider text-slate-500">{showSector}</span>}
        {server.extraSectors.length > 0 && (
          <span className="text-[10px] text-slate-500">+ {server.extraSectors.join(", ")}</span>
        )}
      </div>
    </div>
  );
}

export default function McpServersClient({ stats, tiers, sectorGroups }: McpServersClientProps) {
  const [search, setSearch] = useState("");
  const [activeTier, setActiveTier] = useState<Tier | "all">("all");
  const [activeSector, setActiveSector] = useState<string>("all");

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sectorGroups
      .map((group) => {
        const sectorMatch = activeSector === "all" || group.name === activeSector;
        if (!sectorMatch) return null;
        const servers = group.servers.filter((server) => {
          const tierMatch = activeTier === "all" || server.tier === activeTier;
          const searchMatch =
            !term ||
            server.name.toLowerCase().includes(term) ||
            server.tier.toLowerCase().includes(term) ||
            group.name.toLowerCase().includes(term) ||
            server.extraSectors.some((s) => s.toLowerCase().includes(term));
          return tierMatch && searchMatch;
        });
        return servers.length > 0 ? { ...group, servers } : null;
      })
      .filter(Boolean) as SectorGroup[];
  }, [sectorGroups, search, activeTier, activeSector]);

  const totalVisible = useMemo(
    () => filteredGroups.reduce((sum, group) => sum + group.servers.length, 0),
    [filteredGroups],
  );

  const activeFilters = [
    activeTier !== "all" ? `Tier: ${activeTier.toUpperCase()}` : null,
    activeSector !== "all" ? `Sector: ${activeSector}` : null,
    search.trim() ? `Search: "${search.trim()}"` : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-4 py-20">
        {/* Hero */}
        <div className="mb-16 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            CSOAI · MEOK AI Labs
          </span>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
            <span className="gradient-text">MCP Server Catalogue</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-300">
            Browse 271 published MCP servers across 12 industry sectors. Filter by tier, sector, or name. Every server
            has a public verify URL and a free keystone certificate.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center transition hover:-translate-y-1 hover:border-emerald-500/30"
              >
                <div className="text-2xl font-black text-emerald-400 sm:text-3xl">{stat.value}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/pricing"
              className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              View Pricing
            </Link>
            <Link
              href="https://meok.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-lg border border-emerald-500 px-6 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/10"
            >
              MEOK SDK →
            </Link>
            <Link
              href="https://meok.ai/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-lg border border-emerald-500 px-6 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/10"
            >
              Live Dashboard →
            </Link>
          </div>
        </div>

        {/* Sector cards */}
        <div className="mb-16">
          <h2 className="mb-2 text-2xl font-black tracking-tight sm:text-3xl">
            <span className="gradient-accent">By Industry Sector</span>
          </h2>
          <p className="mb-6 text-slate-400">
            Click a sector to filter all servers in that vertical. Each is mapped to a relevant compliance framework
            (EU AI Act, DORA, NIS2, HIPAA, etc.)
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sectorGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => setActiveSector(group.name)}
                className={`rounded-2xl border p-5 text-left transition hover:-translate-y-1 ${
                  activeSector === group.name
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-white/10 bg-white/[0.03] hover:border-emerald-500/30 hover:bg-white/[0.05]"
                }`}
              >
                <h3 className="mb-1 text-lg font-bold text-emerald-400">{group.name}</h3>
                <div className="text-sm text-slate-300">{group.count} servers</div>
                <div className="mt-2 text-xs text-slate-500">Filter list →</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tier cards */}
        <div className="mb-16">
          <h2 className="mb-2 text-2xl font-black tracking-tight sm:text-3xl">
            <span className="gradient-accent">By Pricing Tier</span>
          </h2>
          <p className="mb-6 text-slate-400">
            Each tier has a Stripe price, keystone cert, and lead-magnet CTA. Click a tier to filter all servers at that
            price point.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setActiveTier(tier.id)}
                className={`rounded-2xl border p-5 text-left transition hover:-translate-y-1 ${
                  activeTier === tier.id
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-white/10 bg-white/[0.03] hover:border-emerald-500/30 hover:bg-white/[0.05]"
                }`}
              >
                <h3 className={`mb-1 text-lg font-black uppercase ${TIER_LABEL_COLORS[tier.id]}`}>{tier.name}</h3>
                <div className="text-sm text-slate-300">
                  {tier.count} servers · {tier.price}
                </div>
                <div className="mt-2 text-xs text-slate-500">{tier.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <label htmlFor="mcp-search" className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                Search
              </label>
              <input
                id="mcp-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by server name, tier, or sector..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {ALL_TIERS.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    activeTier === tier
                      ? "bg-emerald-500 text-slate-950"
                      : "border border-white/10 bg-white/[0.03] text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400"
                  }`}
                >
                  {tier === "all" ? "All Tiers" : tier.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
              <span className="text-xs text-slate-500">Active:</span>
              {activeFilters.map((filter) => (
                <span key={filter} className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                  {filter}
                </span>
              ))}
              <button
                onClick={() => {
                  setSearch("");
                  setActiveTier("all");
                  setActiveSector("all");
                }}
                className="ml-auto text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight">
            <span className="gradient-accent">All Published Servers</span>
          </h2>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
            {totalVisible} shown
          </span>
        </div>

        {/* Server grid by sector */}
        {filteredGroups.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-slate-400">No servers match your filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setActiveTier("all");
                setActiveSector("all");
              }}
              className="mt-4 text-sm font-bold text-emerald-400 hover:text-emerald-300"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredGroups.map((group) => (
              <div key={group.id} id={`sec-${group.id}`}>
                <h3 className="mb-4 flex items-center gap-3 text-xl font-bold text-emerald-400">
                  {group.name}
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-xs text-slate-400">
                    {group.servers.length}
                  </span>
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.servers.map((server) => (
                    <ServerCard key={`${group.id}-${server.name}`} server={server} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Final CTA */}
        <div className="mt-20 flex flex-col items-center justify-between gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:flex-row sm:p-10">
          <p className="text-lg font-medium text-slate-200">
            Get your MCP server certified with a keystone certificate and live deployment.
          </p>
          <Link
            href="/pricing"
            className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            View Pricing →
          </Link>
        </div>
      </section>
    </div>
  );
}
