import {useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useSearch } from "wouter";
import { Search, ExternalLink, ShieldCheck, Boxes, Layers, ArrowRight, Github, Terminal, Cloud, Plug, KeyRound } from "lucide-react";
import registry from "@/data/mcpRegistry.json";

type Server = {
  slug: string;
  name: string;
  description: string;
  url: string;
  category: string;
  frameworks: string[];
  language: string;
  builtInHouse: boolean;
  updatedAt: string | null;
};

const ALL_SERVERS = (registry.servers as Server[]) || [];
const CATEGORIES = (registry.categories as { name: string; count: number }[]) || [];
const FRAMEWORKS = (registry.frameworkCounts as { name: string; count: number }[]) || [];

export default function MCPRegistry() {
  useEffect(() => { document.title = `MCP Fleet — ${registry.total}+ AI Governance Tools | CSOAI`; }, []);
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(params.get("category") || "All");
  const [activeFramework, setActiveFramework] = useState<string>(params.get("framework") || "All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_SERVERS.filter((s) => {
      if (activeCategory !== "All" && s.category !== activeCategory) return false;
      if (activeFramework !== "All" && !s.frameworks.includes(activeFramework)) return false;
      if (q && !(`${s.name} ${s.description} ${s.slug}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [query, activeCategory, activeFramework]);

  return (
    <div className="min-h-screen bg-white">
      {/* EU AI Act urgency banner */}
      <div className="bg-rose-600 text-white text-sm">
        <div className="container max-w-6xl py-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
          <span className="font-semibold">⏱ EU AI Act GPAI obligations are live (2 Aug 2026).</span>
          <span className="text-rose-100">Get audit-ready with the fleet —</span>
          <a href="/contact" className="underline font-medium hover:text-white">
            book a free 15-min diagnostic →
          </a>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-white via-emerald-50 to-emerald-100 text-gray-900 py-20">
        <div className="container max-w-5xl">
          <Badge className="mb-6 bg-emerald-500/20 text-emerald-700 border-emerald-500/30">A2A Substrate</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            The <span className="text-emerald-600">{registry.total}-MCP</span> Governance Fleet
          </h1>
          <p className="text-xl text-gray-700 leading-relaxed max-w-3xl mb-8">
            Every CSOAI tool is powered by Model Context Protocol servers — production compliance, safety and
            agent-infrastructure tools that any AI agent or human can call. Each one emits signed, auditable evidence
            mapped to the major global frameworks.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 shadow-sm border border-emerald-100">
              <Boxes className="h-5 w-5 text-emerald-600" />
              <span className="font-bold text-2xl">{registry.total}</span>
              <span className="text-gray-600">MCP servers</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 shadow-sm border border-emerald-100">
              <Layers className="h-5 w-5 text-emerald-600" />
              <span className="font-bold text-2xl">{CATEGORIES.length}</span>
              <span className="text-gray-600">categories</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 shadow-sm border border-emerald-100">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span className="font-bold text-2xl">{FRAMEWORKS.length}</span>
              <span className="text-gray-600">frameworks covered</span>
            </div>
          </div>

          {/* Self-serve developer path */}
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/signup?source=mcp-api-key">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" /> Get a free API key
              </Button>
            </Link>
            <Link href="/api-docs">
              <Button size="lg" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                Read the API docs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Trust dimensions — JI.2: probed fleet vs catalogue; signer pin; production MCP */}
      <div className="border-b bg-white">
        <div className="container max-w-5xl py-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Trust, not catalogue alone</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-700">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
              <p className="font-semibold text-emerald-800">Probed vs catalogued</p>
              <p className="mt-1 text-gray-600">
                Reachable servers come from <code className="text-xs">/api/mcp</code> probes — never summed with directory-only ids.
              </p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
              <p className="font-semibold text-emerald-800">Signer pin</p>
              <p className="mt-1 text-gray-600">
                Cards verify against <a href="/.well-known/did.json" className="text-emerald-700 underline">did:web</a> — an unpublished key fails even when signature bytes parse.
              </p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
              <p className="font-semibold text-emerald-800">Production MCP</p>
              <p className="mt-1 text-gray-600">
                <code className="text-xs">POST /mcp</code> exposes measure · verify · jail-probe · enter-arena for Cursor, Claude, and other agents.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How they run */}
      <div className="border-b bg-gray-50">
        <div className="container max-w-5xl py-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Three ways to run any MCP</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Terminal className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">PyPI (local / stdio)</p>
                <code className="text-xs text-gray-500">pip install &lt;name&gt;</code>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Plug className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Smithery</p>
                <code className="text-xs text-gray-500">npx @smithery/cli install &lt;name&gt;</code>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Cloud className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Hosted gateway</p>
                <code className="text-xs text-gray-500">api.meok.ai/v1/&lt;slug&gt;/&lt;tool&gt;</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="container max-w-6xl py-10">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${registry.total} MCP tools…`}
            className="pl-11 h-12 text-base"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          <FilterPill label={`All (${ALL_SERVERS.length})`} active={activeCategory === "All"} onClick={() => setActiveCategory("All")} />
          {CATEGORIES.map((c) => (
            <FilterPill key={c.name} label={`${c.name} (${c.count})`} active={activeCategory === c.name} onClick={() => setActiveCategory(c.name)} />
          ))}
        </div>

        {/* Framework filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <FilterPill label="Any framework" active={activeFramework === "All"} onClick={() => setActiveFramework("All")} variant="framework" />
          {FRAMEWORKS.map((f) => (
            <FilterPill key={f.name} label={`${f.name} (${f.count})`} active={activeFramework === f.name} onClick={() => setActiveFramework(f.name)} variant="framework" />
          ))}
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Showing <span className="font-semibold text-gray-900">{filtered.length}</span> of {ALL_SERVERS.length} servers
        </p>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s) => (
            <Card key={s.slug} className="p-5 flex flex-col border hover:border-emerald-400 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Link href={`/mcp/${s.slug}`}>
                  <h3 className="font-bold text-base leading-tight hover:text-emerald-600 cursor-pointer">{s.name}</h3>
                </Link>
                {s.builtInHouse && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] shrink-0">In-house</Badge>}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed flex-1">{s.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Badge variant="outline" className="text-[10px] text-gray-600">{s.category}</Badge>
                {s.frameworks.map((fw) => (
                  <Badge key={fw} className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{fw}</Badge>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Link href={`/mcp/${s.slug}`}>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer">
                    Details <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                >
                  <Github className="h-3.5 w-3.5" /> source
                </a>
              </div>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-500">No MCP servers match your filters.</div>
        )}
      </div>

      {/* Revenue CTA */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-900 text-white py-20">
        <div className="container max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Put the full fleet to work</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect your AI agents and compliance teams to all {registry.total} MCP tools through one gated endpoint
            (<code className="text-emerald-300">api.meok.ai</code>) — with bearer-token auth, per-user audit trails and
            signed, framework-mapped evidence on every call.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-8 text-left">
            <div className="bg-white/10 rounded-xl p-5 border border-white/10">
              <p className="text-sm text-emerald-300 font-semibold">Full MCP suite</p>
              <p className="text-sm text-gray-300 mt-1">Every governance tool + EU AI Act tracking, signed evidence on every call</p>
            </div>
            <div className="bg-white/10 rounded-xl p-5 border border-white/10">
              <p className="text-sm text-emerald-300 font-semibold">Enterprise</p>
              <p className="text-sm text-gray-300 mt-1">Custom dev + SLA + dedicated support</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Book a free 15-min EU AI Act diagnostic <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Link href="/?lobby=measured&task=pricing-overview">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                How the free rail works
              </Button>
            </Link>
            <Link href="/?lobby=measured&task=enterprise-start">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Enterprise lobby
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
  variant = "category",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  variant?: "category" | "framework";
}) {
  const base = "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer";
  const on = variant === "framework" ? "bg-blue-600 text-white border-blue-600" : "bg-emerald-600 text-white border-emerald-600";
  const off = "bg-white text-gray-600 border-gray-200 hover:border-gray-300";
  return (
    <button type="button" onClick={onClick} className={`${base} ${active ? on : off}`}>
      {label}
    </button>
  );
}
