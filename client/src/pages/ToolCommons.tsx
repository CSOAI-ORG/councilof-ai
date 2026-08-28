import { useEffect, useState } from "react";
import ToolRunner from "../components/ToolRunner";
import { isEmbedded } from "@/lib/embed";

/**
 * /tools — the MCP tool commons, described as the probe actually found it.
 *
 * ── THE THREE DEFECTS THIS REWRITE CLOSES ────────────────────────────────────
 *
 * 1. THE HEADLINE COUNT COUNTED THE WRONG THING. The page rendered
 *    `{data.total} published MCP servers`. `total` in /api/tools is the number
 *    of TOOLS MATCHING THE CURRENT QUERY, and the page opens with the query
 *    "governance" — which that endpoint's own header comment records as
 *    returning zero, because no reachable server exposes a governance-named
 *    tool. So the hero, and the document title, read a tool count as a server
 *    count, of a filtered subset, and called the result "published".
 *
 * 2. THE CLOSING CLAIMS HAD NO ARTIFACT. "Every tool is governed by Layer 0 and
 *    signed. Open, MIT-licensed, council-tuned by construction." These are
 *    third-party MCP servers. We do not sign them, we did not license them, and
 *    "council-tuned by construction" describes nothing that exists. Cut, not
 *    softened — there is no weaker true version of a claim about someone else's
 *    software.
 *
 * 3. THE UNPROBED CATALOGUE WAS INVISIBLE. /api/tools separates what it PROBED
 *    (a live tools/list call, recorded in evidence/mcp-registry.json) from what
 *    is merely CATALOGUED, and carries an external catalogue whose own
 *    probe_state says it is unverifiable from any machine without that private
 *    checkout. All three states are now on the page, named, with the larger
 *    number never standing in for the smaller.
 *
 * Every figure below is read from GET /api/tools. None is written into this file.
 */

const GW: string = ((import.meta as any).env && (import.meta as any).env.VITE_KNOWLEDGE_BASE) || "/api";
const EX = ["audit", "compliance", "EU AI Act", "payments", "defence", "identity"];

interface ToolsPayload {
  total?: number;
  total_kind?: string;
  catalogue_total?: number;
  server_count?: number;
  query?: string | null;
  probe_method?: string;
  probe_host?: string;
  probe_finished?: string | null;
  catalogued_not_probed_servers?: number | null;
  tools_catalogued_not_probed?: number | null;
  external_catalogues_not_probed?: { id: string; count: number; unit: string; source: string; probe_state: string }[];
  tools?: any[];
  note?: string;
}

export default function ToolCommons() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<ToolsPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const framed = typeof window !== "undefined" && isEmbedded();

  useEffect(() => {
    document.title = "Tool commons — what the probe reached | Council of AI";
    run("");
  }, []);

  useEffect(() => {
    if (data?.server_count != null) {
      document.title = `Tool commons — ${data.server_count} server(s) reached by the probe | Council of AI`;
    }
  }, [data?.server_count]);

  async function run(query?: string) {
    const term = (query !== undefined ? query : q).trim();
    setQ(term);
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(GW + "/tools" + (term ? "?q=" + encodeURIComponent(term) : ""));
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
    setLoading(false);
  }

  function copy(cmd: string, name: string) {
    try {
      navigator.clipboard.writeText(cmd);
      setCopied(name);
      setTimeout(() => setCopied(""), 1200);
    } catch (e) {}
  }

  const matches = data?.tools || [];
  const ext = data?.external_catalogues_not_probed || [];

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 50% -10%, rgba(16,185,129,.20), transparent 60%)" }} />
        <div className="relative mx-auto max-w-4xl px-6 pt-16 pb-10 text-center">
          {!framed && (
            <a href="/os?lobby=tools" className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70 hover:text-emerald-200">Council OS · tools</a>
          )}
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            The open <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">tool commons.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-emerald-100/80">
            MCP servers, listed by what was actually reached. A server here was contacted and
            answered a live <code className="text-emerald-300">tools/list</code> call — not read out of
            a directory.
          </p>
          <div className="mx-auto mt-7 flex max-w-2xl gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") run(); }}
              placeholder="Search probed tools…"
              className="flex-1 rounded-xl border border-emerald-500/30 bg-black/40 px-5 py-4 text-base text-emerald-50 placeholder-emerald-300/30 focus:border-emerald-400 focus:outline-none"
            />
            <button onClick={() => run()} className="rounded-xl bg-emerald-500 px-6 py-4 text-base font-bold text-[#03110b] hover:bg-emerald-400">{loading ? "..." : "Search"}</button>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {EX.map((e) => (
              <button key={e} onClick={() => run(e)} className="rounded-full border border-emerald-400/25 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-200/80 hover:bg-emerald-500/15">{e}</button>
            ))}
          </div>
        </div>
      </section>

      {/* THE THREE STATES, NEVER SUMMED. This block is the honest headline the
          old hero number was standing in for. */}
      <section className="mx-auto max-w-4xl px-6 pt-8">
        {err && (
          <p className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4 text-sm text-amber-100/80">
            The catalogue could not be read ({err}). No count is shown in its place —
            <a href="/api/tools" className="ml-1 font-semibold text-emerald-300 underline">GET /api/tools</a> is
            the source of truth, not this page.
          </p>
        )}
        {data && (
          <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
            <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-300/70">
              What the probe found — three states, never added together
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-2xl font-black text-emerald-200">{data.server_count ?? "—"}</div>
                <div className="text-xs text-emerald-100/70">
                  server(s) <span className="font-semibold text-emerald-300">probed</span> — contacted and
                  answered, exposing {data.catalogue_total ?? "—"} tool(s) between them
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-200">{data.catalogued_not_probed_servers ?? "—"}</div>
                <div className="text-xs text-emerald-100/70">
                  server(s) <span className="font-semibold text-amber-300">catalogued</span> only — listed in
                  a register, never contacted. They contribute zero tools above.
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-200">{ext.length ? ext[0].count : "—"}</div>
                <div className="text-xs text-emerald-100/70">
                  {ext.length ? ext[0].unit : "entries"} in an external catalogue that is{" "}
                  <span className="font-semibold text-amber-300">unverifiable</span> from here — see below
                </div>
              </div>
            </div>
            {ext.map((c) => (
              <p key={c.id} className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-[12px] leading-relaxed text-amber-100/75">
                <span className="font-semibold">{c.id}</span> — {c.source}. {c.probe_state} It is shown so the
                number cannot be quoted as if it had been probed, and it is never added to the probed count.
              </p>
            ))}
            <p className="mt-3 text-[12px] leading-relaxed text-emerald-100/60">
              {data.probe_method && <>Probe method: <code className="text-emerald-300">{data.probe_method}</code>. </>}
              {data.probe_finished && <>Last probe finished {data.probe_finished}. </>}
              That timestamp is read from the recorded probe, not from the clock when you asked.
            </p>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-4xl px-6 pt-8">
        <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-b from-emerald-500/10 to-transparent p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/70">Install our own MCP server</p>
              <p className="mt-1 text-sm text-emerald-100/80">
                One command adds our published MCP server to Claude Code, Cursor, or any MCP client.
                Its own npm description is the artifact — read it there before you install it.
              </p>
              {/* The package's npm description asserts a governed-tool catalogue size. That
                  figure is not one of the probed numbers above and we have not verified it,
                  so it is not repeated here and the reader is told why. */}
              <p className="mt-1 text-[12px] leading-relaxed text-amber-100/70">
                Its npm description quotes a catalogue size we have not probed. The only counts on
                this page are the three above, and none of them is that figure.
              </p>
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
        <p className="mt-3 text-center text-[11px] uppercase tracking-[2px] text-emerald-300/75">↑ run live · ↓ connect a probed server into your own agent</p>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((m: any) => (
            <div key={`${m.server}:${m.name}`} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="truncate font-mono text-sm font-bold text-emerald-100">{m.name}</div>
                <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{m.status || "probed"}</span>
              </div>
              {m.description && <div className="mt-1 text-xs text-emerald-100/70">{m.description}</div>}
              <div className="mt-1 font-mono text-[11px] text-emerald-300/60">{m.server}</div>
              {m.server_endpoint && (
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-black/40 px-2.5 py-1.5 text-[11px] text-emerald-300/80">{m.server_endpoint}</code>
                  <button onClick={() => copy(m.server_endpoint, m.name)} className="shrink-0 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-[#03110b] hover:bg-emerald-400">{copied === m.name ? "Copied" : "Copy"}</button>
                </div>
              )}
              {m.last_probed && <div className="mt-2 text-[10px] text-emerald-300/50">last probed {m.last_probed}</div>}
            </div>
          ))}
        </div>
        {matches.length === 0 && !loading && !err && (
          <p className="text-center text-sm text-emerald-300/75">
            {data?.query
              ? `No probed tool matched "${data.query}". That is the honest answer, not an empty state — the reachable servers expose ${data?.catalogue_total ?? 0} tool(s) in total.`
              : "No probed tools to list."}
          </p>
        )}
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-emerald-300/70">
          {data?.note ||
            "Every tool listed was returned by a live MCP tools/list call. Servers with no published endpoint contribute zero tools and are reported separately."}{" "}
          These are third-party servers: we do not sign them, license them or vouch for them, and
          listing one is not an endorsement of it. What we sign is our own measurement cards —
          verify one at <a href="/gspc-verify" className="font-semibold text-emerald-300 underline">/gspc-verify</a>.
        </p>
      </section>
    </div>
  );
}
