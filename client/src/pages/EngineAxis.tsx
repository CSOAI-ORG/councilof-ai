import { useEffect } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StackHonestyBanner } from "@/components/StackHonestyBanner";
import { COUNTS as GSPC_COUNTS } from "@/lib/gspcAxes";
import { STACK_STATS, BOND_MARKET_REPORTED_T, REGISTER_CHIP } from "@/lib/stackHonesty";
import {
  ATTACK_VECTORS,
  BOND_MARKET_LAYERS,
  BRIDGE_LAYERS,
  BRIDGE_REPOS,
  COBOL_SYMBIOSIS,
  DOMAIN_FLYWHEELS,
  ENGINE_AXIS_DIAGRAM,
  FINANCIAL_AXES,
  FIRST_REPO_SPEC,
  GOVERNANCE_CAPABILITIES,
  REVENUE_PROJECTION,
  SOVOS_FLYWHEEL,
} from "@/data/engine-axis";
import { CONTEXT_FIREWALL_INDICES } from "@/data/contextFirewallIndices";
import { openLobby } from "@/lib/lobbyLink";
import CouncilOsPageShell from "@/components/os/CouncilOsPageShell";

const ENTRY_COLOR: Record<string, string> = {
  low: "text-slate-500",
  high: "text-emerald-400",
  "very-high": "text-amber-400",
  maximum: "text-violet-400",
};

export default function EngineAxis() {
  useEffect(() => {
    document.title = "Engine Axis — one sign for all markets | Council of AI";
  }, []);

  return (
    <CouncilOsPageShell
      title="Engine axis"
      subtitle="Financial axes 18–25 — bond, insurance, COBOL, east-west crossings"
      className="min-h-screen bg-[#04070d] text-slate-200"
    >
      <header className="border-b border-white/8 bg-[#080c14]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-400 mb-2">SovOS · Engine Axis</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">One engine signs all crossings</h1>
          <p className="mt-4 max-w-3xl text-slate-400 leading-relaxed">
            Banks · insurance · AI · COBOL · bonds · indices · equities · east-to-east — all pass through the same
            Y-axis (trust / verification) before they can move on X (time / velocity). CSOAI is the body — measurement,
            governance, insurer evidence. MEOK is the public head — gaming, NPC agents, arenas. Two heads, one SovOS
            engine. The flywheels are designed to solve friction in the middle; what is live vs planned is labelled below.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
              GSPC {GSPC_COUNTS.measured}/{GSPC_COUNTS.total} measured
            </Badge>
            <Badge variant="outline" className="border-violet-500/30 text-violet-300">
              +{FINANCIAL_AXES.length} financial axes (slots 18–25)
            </Badge>
            <Badge variant="outline" className="border-amber-500/30 text-amber-300">
              {STACK_STATS.mcpServers} MCP servers · {STACK_STATS.hiveFrameworks} hive frameworks
            </Badge>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/venturi"><Button className="bg-emerald-600 hover:bg-emerald-700">Bond Venturi</Button></Link>
            <Link href="/instruments"><Button variant="outline" className="border-white/15">Eunomia Router</Button></Link>
            <Link href="/insurers"><Button variant="outline" className="border-white/15">Insurers</Button></Link>
            <Button
              variant="outline"
              className="border-amber-500/30 text-amber-300"
              onClick={() =>
                openLobby({
                  prompt:
                    "Map a UK SME bond trade through the hive framework crosswalk — which layers sign, and what is still DESIGN vs MEASURED?",
                })
              }
            >
              Ask Council Lobby
            </Button>
          </div>
          <div className="mt-8">
            <StackHonestyBanner
              note="Financial axes 18–25 and bridge repos are mostly PLANNED/SPEC. GSPC core axes 1–13 are the only MEASURED finance-adjacent evidence today."
            />
          </div>
        </div>
      </header>

      {/* SovOS flywheel */}
      <section className="border-b border-white/8 bg-[#0a0f18]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-lg font-bold text-white mb-6">Two heads, one body — SovOS flywheel</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-emerald-500/20 p-5">
              <h3 className="font-semibold text-emerald-300">{SOVOS_FLYWHEEL.csoai.label}</h3>
              <p className="mt-2 text-sm text-slate-400">{SOVOS_FLYWHEEL.csoai.role}</p>
              <p className="mt-3 text-xs text-slate-500">{SOVOS_FLYWHEEL.csoai.signs}</p>
            </div>
            <div className="rounded-xl border border-violet-500/20 p-5">
              <h3 className="font-semibold text-violet-300">{SOVOS_FLYWHEEL.meok.label}</h3>
              <p className="mt-2 text-sm text-slate-400">{SOVOS_FLYWHEEL.meok.role}</p>
              <p className="mt-3 text-xs text-slate-500">{SOVOS_FLYWHEEL.meok.signs}</p>
            </div>
            <div className="rounded-xl border border-amber-500/20 p-5">
              <h3 className="font-semibold text-amber-300">{SOVOS_FLYWHEEL.sovos.label}</h3>
              <p className="mt-2 text-sm text-slate-400">{SOVOS_FLYWHEEL.sovos.role}</p>
            </div>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-400">
            {SOVOS_FLYWHEEL.sovos.loop.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      {/* Financial axes 18-25 */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-lg font-bold text-white mb-2">Financial axes — slots 18–25 (the new nerves)</h2>
        <p className="text-sm text-slate-500 mb-6">
          Core GSPC axes 1–{GSPC_COUNTS.total} are frozen measurement instruments. These extend the engine into
          markets — honest status until banks and insurers publish frozen banks.
        </p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase text-slate-500">
                <th className="p-3">Slot</th>
                <th className="p-3">Axis</th>
                <th className="p-3">Metaphor</th>
                <th className="p-3">Function</th>
                <th className="p-3">Bridge target</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {FINANCIAL_AXES.map((a) => (
                <tr key={a.slot} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 font-mono text-violet-400">{a.slot}</td>
                  <td className="p-3 text-white">{a.domain}</td>
                  <td className="p-3 text-slate-500">{a.metaphor}</td>
                  <td className="p-3 text-slate-400 text-xs">{a.function}</td>
                  <td className="p-3 text-slate-500 text-xs">{a.bridgeTarget}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={`text-[10px] ${REGISTER_CHIP[a.status]}`}>
                      {a.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        <h3 className="mt-10 text-base font-bold text-white mb-2">Labour &amp; AI-economy companions — UNMEASURED first</h3>
        <p className="text-sm text-slate-500 mb-4">
          Candidates on the same honesty rail. Contextual firewall only — never GSPC cell inputs.{" "}
          <Link href="/indices" className="text-emerald-400 hover:underline">
            /indices
          </Link>
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {CONTEXT_FIREWALL_INDICES.map((i) => (
            <Link key={i.slug} href={i.path}>
              <a className="block rounded-xl border border-rose-500/20 bg-rose-950/20 p-4 hover:border-rose-400/40">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-semibold text-white">{i.title}</span>
                  <Badge variant="outline" className="text-[10px] border-rose-400/40 text-rose-200">
                    {i.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500">{i.candidacy}</p>
              </a>
            </Link>
          ))}
        </div>
      </section>

      {/* Bridge layers */}
      <section className="border-t border-white/8 bg-[#0a0f18]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-lg font-bold text-white mb-2">Four bridge layers — how domains connect</h2>
          <p className="text-sm text-slate-500 mb-8">
            Banks + insurance + AI + COBOL + bonds + stocks + east-to-east — not separate products, one metabolic
            architecture. Each bridge lists MCP repos that exist today vs DESIGN wiring.
          </p>
          <div className="space-y-8">
            {BRIDGE_LAYERS.map((b) => (
              <div key={b.id} className="rounded-xl border border-white/10 p-5">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-semibold text-white">{b.title}</h3>
                  <Badge variant="outline" className={`text-[10px] ${REGISTER_CHIP[b.register]}`}>
                    {b.register}
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 mb-4">{b.subtitle}</p>
                <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 text-xs font-mono text-emerald-100/90 leading-relaxed whitespace-pre">
                  {b.diagram}
                </pre>
                <div className="mt-3 flex flex-wrap gap-1">
                  {b.mcpSlugs.map((s) => (
                    <Link key={s} href={`/mcp/${s}`}>
                      <a className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400 hover:text-emerald-400">
                        {s}
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Domain flywheels */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-lg font-bold text-white mb-6">Domain flywheels — friction in the middle</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {DOMAIN_FLYWHEELS.map((f) => (
            <div key={f.id} className="rounded-xl border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-white text-sm">{f.title}</h3>
                <Badge variant="outline" className={`text-[10px] ${REGISTER_CHIP[f.register]}`}>
                  {f.register}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mb-3">{f.from}</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-slate-400">
                {f.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Governance capabilities */}
      <section className="border-t border-white/8 bg-[#0a0f18]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-lg font-bold text-white mb-2">Governance safety — what exists vs what is planned</h2>
          <p className="text-sm text-slate-500 mb-6">
            The moat is the weave — signed measurement + MCP fleet + care ethics + BFT council + MEOK eval data.
            Not a single feature. This table is honest about wire status.
          </p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase text-slate-500">
                  <th className="p-3">Capability</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {GOVERNANCE_CAPABILITIES.map((c) => (
                  <tr key={c.capability} className="border-b border-white/5">
                    <td className="p-3 text-white">{c.capability}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-[10px] ${REGISTER_CHIP[c.status]}`}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-500 text-xs">{c.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* $130T anatomy */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-lg font-bold text-white mb-2">
          ${BOND_MARKET_REPORTED_T}T anatomy — five stacked markets
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 mr-2">REPORTED</Badge>
          Industry context — not CSOAI measurement. SME/municipal is maximum entry in our design thesis.
        </p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase text-slate-500">
                <th className="p-3">Layer</th>
                <th className="p-3">Size (REPORTED)</th>
                <th className="p-3">Speed</th>
                <th className="p-3">Entry</th>
                <th className="p-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {BOND_MARKET_LAYERS.map((l) => (
                <tr key={l.id} className="border-b border-white/5">
                  <td className="p-3 text-white">{l.name}</td>
                  <td className="p-3">${l.sizeT}T</td>
                  <td className="p-3 text-slate-400">{l.speed}</td>
                  <td className={`p-3 capitalize ${ENTRY_COLOR[l.entry]}`}>{l.entry}</td>
                  <td className="p-3 text-slate-500 text-xs">{l.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Engine axis diagram */}
      <section className="border-t border-white/8 bg-[#0a0f18]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-lg font-bold text-white mb-4">The engine axis — Y × X</h2>
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-6 text-xs font-mono text-emerald-100 leading-relaxed whitespace-pre">
            {ENGINE_AXIS_DIAGRAM}
          </pre>
          <pre className="mt-6 overflow-x-auto rounded-xl border border-amber-500/20 bg-amber-950/10 p-6 text-xs font-mono text-amber-100/90 leading-relaxed whitespace-pre">
            {COBOL_SYMBIOSIS}
          </pre>
        </div>
      </section>

      {/* 7 attack vectors */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-lg font-bold text-white mb-6">Seven friction vectors</h2>
        <ul className="space-y-4">
          {ATTACK_VECTORS.map((v) => (
            <li key={v.id} className="rounded-xl border border-white/10 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-white">{v.title}</h3>
                <Badge variant="outline" className={`text-[10px] ${REGISTER_CHIP[v.register]}`}>
                  {v.register}
                </Badge>
                <code className="text-[10px] text-amber-400/80">{v.eunomiaUri}</code>
              </div>
              <p className="mt-2 text-xs text-slate-500">{v.problem}</p>
              <p className="mt-2 text-sm text-slate-400">{v.solution}</p>
              <p className="mt-2 text-xs text-violet-400">{v.designNote}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {v.mcpSlugs.map((s) => (
                  <Link key={s} href={`/mcp/${s}`}>
                    <a className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400 hover:text-emerald-400">
                      {s}
                    </a>
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Bridge repos + revenue + first repo */}
      <section className="border-t border-white/8 bg-[#0a0f18]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 pb-20">
          <h2 className="text-lg font-bold text-white mb-4">Five bridge repos — venturi throats</h2>
          <p className="text-sm text-slate-500 mb-6">
            Not 25 new repos. Five bridges that connect the existing {STACK_STATS.mcpServers} MCP fleet across domains.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
            {BRIDGE_REPOS.map((r) => (
              <div key={r.name} className="rounded-lg border border-white/10 p-4">
                <div className="flex justify-between gap-2">
                  <p className="font-mono text-sm text-emerald-300">CSOAI-ORG/{r.name}</p>
                  <Badge variant="outline" className={`text-[10px] ${REGISTER_CHIP[r.status]}`}>
                    {r.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">{r.role}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.modules.map((m) => (
                    <span key={m} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                      /{m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-bold text-white mb-2">Revenue scenarios</h2>
          <p className="text-sm text-slate-500 mb-4">
            <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-400 mr-2">DESIGN</Badge>
            Not forecasts. Not committed. Scenario math only.
          </p>
          <div className="overflow-x-auto rounded-xl border border-white/10 mb-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase text-slate-500">
                  <th className="p-3">Stream</th>
                  <th className="p-3">Year 1</th>
                  <th className="p-3">Year 3</th>
                  <th className="p-3">Year 5</th>
                </tr>
              </thead>
              <tbody>
                {REVENUE_PROJECTION.map((r) => (
                  <tr key={r.stream} className="border-b border-white/5">
                    <td className="p-3 text-slate-300">{r.stream}</td>
                    <td className="p-3 text-slate-500">{r.y1}</td>
                    <td className="p-3 text-slate-500">{r.y3}</td>
                    <td className="p-3 text-slate-500">{r.y5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-emerald-300">First repo to build</h3>
              <Badge variant="outline" className={`text-[10px] ${REGISTER_CHIP[FIRST_REPO_SPEC.register]}`}>
                {FIRST_REPO_SPEC.register}
              </Badge>
            </div>
            <p className="font-mono text-sm text-white">{FIRST_REPO_SPEC.name}</p>
            <p className="mt-2 text-sm text-slate-400">{FIRST_REPO_SPEC.description}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {FIRST_REPO_SPEC.modules.map((m) => (
                <span key={m} className="rounded bg-white/5 px-2 py-1 text-xs font-mono text-slate-400">
                  /{m}
                </span>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              Agent API:{" "}
              <a href="/api/finance/settle" className="text-emerald-400 hover:underline">
                POST /api/finance/settle
              </a>
              {" · "}
              <a href="/api/finance/anatomy" className="text-emerald-400 hover:underline">
                GET /api/finance/anatomy
              </a>
            </p>
          </div>
        </div>
      </section>
    </CouncilOsPageShell>
  );
}
