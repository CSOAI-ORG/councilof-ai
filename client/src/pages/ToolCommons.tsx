/**
 * ToolCommons — /tools, the published MCP catalogue.
 *
 * WHAT WAS WRONG (found by operating it, 2026-08-26)
 *  1. The headline read `${data.total} published MCP servers`. `total` is the number of
 *     TOOLS MATCHING THE CURRENT QUERY, not servers. The page loads with q="governance",
 *     which matches nothing, so it opened on "0 published MCP servers" — and the document
 *     title with it — while /api/tools reported 4 tools on 1 probed server. Typing
 *     "measure" changed the headline to "3 published MCP servers". A number that moves
 *     with the search box is not a count of anything.
 *  2. The result cards rendered m.clusterLabel, m.tools and m.connect. /api/tools returns
 *     none of those fields, so every card showed an empty badge, the words "undefined
 *     tools" (rendered as a bare "tools"), an empty command box — and its Copy button put
 *     the string "undefined" on the clipboard. A copy control that yields a fake artifact
 *     is the failure this estate exists to eliminate.
 *
 * Both numbers now come from the payload by field name: catalogue_total (probed tools) and
 * server_count (distinct probed servers), neither of which moves when you search.
 */
import { useEffect, useState } from "react";
import ToolRunner from "../components/ToolRunner";
import { isEmbedded } from "@/lib/embed";
const GW: string = ((import.meta as any).env && (import.meta as any).env.VITE_KNOWLEDGE_BASE) || "/api";
const EX = ["audit", "compliance", "EU AI Act", "payments", "defence", "identity"];
export default function ToolCommons() {
  const [q, setQ] = useState(""); const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(false); const [copied, setCopied] = useState("");
  const framed = typeof window !== "undefined" && isEmbedded();
  useEffect(() => { document.title = "Tool Commons — published MCP | CSOAI"; run("governance"); }, []);
  useEffect(() => {
    if (data?.catalogue_total != null) document.title = `Tool Commons — ${data.catalogue_total} probed MCP tools | CSOAI`;
  }, [data]);
  async function run(query?: string) {
    const term = (query !== undefined ? query : q).trim() || "governance"; setQ(term); setLoading(true);
    try { const r = await fetch(GW + "/tools?q=" + encodeURIComponent(term)); if (r.ok) setData(await r.json()); } catch (e) {}
    setLoading(false);
  }
  // Never put "undefined" on someone's clipboard: no value, no copy, no "Copied" badge.
  function copy(cmd: string | undefined | null, name: string) {
    if (!cmd) { setCopied(""); return; }
    try { navigator.clipboard.writeText(cmd); setCopied(name); setTimeout(() => setCopied(""), 1200); } catch (e) {}
  }
  const matches = (data && (data.tools || data.matches)) || [];
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 50% -10%, rgba(16,185,129,.20), transparent 60%)" }} />
        <div className="relative mx-auto max-w-4xl px-6 pt-16 pb-10 text-center">
          {!framed && (
            <a href="/?lobby=tools" className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70 hover:text-emerald-200">Council OS · tools</a>
          )}
          <h1 className="mt-3 text-5xl sm:text-6xl font-black tracking-tight">The open <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">tool commons.</span></h1>
          <p className="mt-4 mx-auto max-w-xl text-lg text-emerald-100/80">{data?.catalogue_total != null ? `${data.catalogue_total} probed tool${data.catalogue_total === 1 ? "" : "s"} on ${data.server_count} reachable MCP server${data.server_count === 1 ? "" : "s"}` : "Published MCP servers"} — search them, copy an endpoint, run them inside Council OS. Every tool below was returned by a live tools/list call{data?.probe_finished ? ` on ${String(data.probe_finished).slice(0, 10)}` : ""}; it is a dated probe, not a live meter.</p>
          <div className="mt-7 flex gap-2 max-w-2xl mx-auto"><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="Search published tools…" className="flex-1 rounded-xl border border-emerald-500/30 bg-black/40 px-5 py-4 text-base text-emerald-50 placeholder-emerald-300/30 focus:border-emerald-400 focus:outline-none" /><button onClick={() => run()} className="rounded-xl bg-emerald-500 px-6 py-4 text-base font-bold text-[#03110b] hover:bg-emerald-400">{loading ? "..." : "Search"}</button></div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">{EX.map((e) => (<button key={e} onClick={() => run(e)} className="rounded-full border border-emerald-400/25 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-200/80 hover:bg-emerald-500/15">{e}</button>))}</div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-6 pt-8">
        <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-b from-emerald-500/10 to-transparent p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/70">Install the governance layer</p>
              <p className="mt-1 text-sm text-emerald-100/80">One command drops CSOAI Layer-0 signing, verification &amp; governed compliance into Claude Code, Cursor, or any MCP agent. Live on npm.</p>
            </div>
            <a href="https://www.npmjs.com/package/csoai-governance-mcp" target="_blank" rel="noopener noreferrer" className="shrink-0 font-mono text-[11px] text-emerald-300/75 underline hover:text-emerald-200">npm ↗</a>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-black/50 px-3 py-2.5 text-[12px] text-emerald-200">claude mcp add csoai-governance -- npx -y csoai-governance-mcp</code>
            <button onClick={() => copy("claude mcp add csoai-governance -- npx -y csoai-governance-mcp", "__mcp")} className="shrink-0 rounded-lg bg-emerald-500 px-3 py-2.5 text-[12px] font-bold text-[#03110b] hover:bg-emerald-400">{copied === "__mcp" ? "Copied" : "Copy"}</button>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-6 pt-8">
        <ToolRunner />
        <p className="mt-3 text-center text-[11px] uppercase tracking-[2px] text-emerald-300/75">↑ run live · ↓ connect the full fleet into your own agent</p>
      </section>
      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((m: any) => (
            <div key={m.name} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
              <div className="flex items-center justify-between gap-2"><div className="truncate font-mono text-sm font-bold text-emerald-100">{m.name}</div><span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{m.server}</span></div>
              {m.description && <p className="mt-2 text-xs leading-relaxed text-emerald-100/70">{m.description}</p>}
              <div className="mt-2 font-mono text-[10px] uppercase tracking-wide text-emerald-300/60">
                {m.required_args?.length ? `required: ${m.required_args.join(", ")}` : "no required arguments"}
                {m.last_probed ? ` · probed ${String(m.last_probed).slice(0, 10)}` : ""}
              </div>
              <div className="mt-3 flex items-center gap-2"><code className="flex-1 truncate rounded-lg bg-black/40 px-2.5 py-1.5 text-[11px] text-emerald-300/80">{m.server_endpoint}</code><button onClick={() => copy(m.server_endpoint, m.name)} disabled={!m.server_endpoint} className="shrink-0 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-40">{copied === m.name ? "Copied" : "Copy endpoint"}</button></div>
            </div>
          ))}
        </div>
        {matches.length === 0 && !loading && <p className="text-center text-sm text-emerald-300/75">No tools matched - try another term.</p>}
        <p className="mt-8 text-center text-xs text-emerald-300/75">Every tool is governed by Layer 0 and signed. Open, MIT-licensed, council-tuned by construction. Live via the Council gateway.</p>
      </section>
    </div>
  );
}
