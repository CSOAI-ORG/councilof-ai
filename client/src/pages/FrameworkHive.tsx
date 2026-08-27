import { useEffect, useMemo, useState } from "react";
import { useRoute, Link } from "wouter";
import { HIVE, getHive, HIVE_STATUS_COLOR, type HiveFramework } from "../data/hive-frameworks";
import { chargeSovereign } from "../lib/sovCharge";

import { askSovereign } from "../lib/sovAsk";
import AISystemNotice from "../components/AISystemNotice";
const GW = "/api";
async function askSov(q: string): Promise<string> {
  // Route through the CSOAI-Sovereign guard (role-framed + companion-bleed rejected).
  const r = await askSovereign(q, { fallback: "" });
  return r.ok ? r.text : "";
}
function daysTo(iso?: string): number | null { if (!iso) return null; const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000); return d; }

// Real, published open-source MCP tools per framework (github.com/CSOAI-ORG) — Layer 0 governed.
const REAL_MCP: Record<string, string[]> = {
  "eu-ai-act": ["eu-ai-act-compliance-mcp", "csoai-governance-crosswalk-mcp"],
  "gdpr": ["gdpr-compliance-ai-mcp"],
  "iso-42001": ["iso-42001-ai-mcp"],
  "iso-42005": ["iso-42001-ai-mcp"],
  "nist-ai-rmf": ["csoai-governance-crosswalk-mcp", "bias-detection-mcp"],
  "cra": ["dora-nis2-crosswalk-mcp"],
  "nis2": ["dora-nis2-crosswalk-mcp"],
  "dora": ["dora-nis2-crosswalk-mcp", "mifid-ii-ai-mcp"],
  "hipaa": ["healthcare-ai-governance-mcp"],
  "council-of-europe-ai-convention": ["csoai-governance-crosswalk-mcp"],
  "oecd-ai-principles": ["csoai-governance-crosswalk-mcp"],
  "unesco-ai-ethics": ["csoai-governance-crosswalk-mcp"],
  "uk-aisi": ["csoai-governance-crosswalk-mcp"],
  "korea-ai-basic-act": ["csoai-governance-crosswalk-mcp"],
  "singapore-agentic-ai": ["csoai-governance-crosswalk-mcp"],
};

function Hero() {
  return (
    <section className="border-b border-emerald-500/15 bg-[#03110b]">
      <div className="mx-auto max-w-6xl px-6 pt-14 pb-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS · the framework hive</p>
        <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight text-emerald-50">Every framework. <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">Everything collected.</span></h1>
        <p className="mx-auto mt-3 max-w-2xl text-emerald-100/75">Click any framework and your Council assistant brings the whole hive together — who must comply, the obligations, penalties, sectors, cyber threats, crosswalks, and the deadline clock. Then it helps you simulate, get compliant, and get trained.</p>
      </div>
    </section>
  );
}

function Card({ f }: { f: HiveFramework }) {
  const d = daysTo(f.deadline);
  return (
    <Link href={"/hive/" + f.slug} className="group relative flex flex-col rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5 transition hover:scale-[1.01] hover:border-emerald-400/50">
      <div className="flex items-center justify-between">
        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: HIVE_STATUS_COLOR[f.status] + "22", color: HIVE_STATUS_COLOR[f.status] }}>{f.status}</span>
        <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-emerald-300/50">{f.seat}</span>
      </div>
      <div className="mt-2 text-lg font-bold text-emerald-50">{f.name}</div>
      <p className="mt-1 flex-1 text-[13px] leading-snug text-emerald-100/70">{f.summary.slice(0, 130)}…</p>
      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="text-emerald-300/60">{f.authority}</span>
        {d != null && d > 0 ? <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-bold text-amber-200">{d}d to deadline</span> : <span className="text-emerald-300/40">in force</span>}
      </div>
    </Link>
  );
}

function Detail({ f }: { f: HiveFramework }) {
  const [q, setQ] = useState("");
  const [ans, setAns] = useState("");
  const [busy, setBusy] = useState(false);
  const d = daysTo(f.deadline);
  useEffect(() => { document.title = f.name + " — the Hive | CSOAI"; }, [f]);
  async function ask(text?: string) {
    const m = (text ?? q).trim() || ("Explain " + f.name + " for a CISO in 4 sentences: who must comply, the top obligations, the penalty, and the single most urgent action.");
    setBusy(true); setAns(""); chargeSovereign(6);
    const out = await askSov(m + " (Context: " + f.name + ", " + f.authority + ", status " + f.status + ".)");
    setAns(out || "I could not reach live reasoning just now — the collected hive below has what you need, and you can run a live simulation.");
    setBusy(false);
  }
  const simQ = encodeURIComponent("An organisation subject to " + f.name + " deploying a high-risk AI system");
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/hive" className="text-sm text-emerald-300/70 hover:text-emerald-200">← All frameworks</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ background: HIVE_STATUS_COLOR[f.status] + "22", color: HIVE_STATUS_COLOR[f.status] }}>{f.status}</span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-50">{f.name}</h1>
      </div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">{f.authority} · {f.seat} · effective {f.effective}</div>
      {d != null && d > 0 && f.deadlineLabel && (
        <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-amber-100">
          <span className="text-2xl font-black text-amber-200">{d} days</span> <span className="text-sm">until {f.deadlineLabel} ({new Date(f.deadline!).toLocaleDateString()})</span>
        </div>
      )}
      <p className="mt-4 max-w-3xl text-emerald-100/85 leading-relaxed">{f.summary}</p>

      {/* Sovereign action bar */}
      <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-4">
        <div className="text-sm font-bold text-emerald-200">Your Council assistant — do it all here</div>
        {/* Article 50(1) AI-interaction disclosure — EU AI Act applies from 2 Aug 2026. */}
        <div role="status" aria-live="polite" className="mt-2 rounded-md border border-amber-400/35 bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold text-amber-100">
          You are interacting with an AI system.
        </div>
        <div className="mt-2 flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") ask(); }} placeholder={"Ask anything about " + f.name + "…"} className="flex-1 rounded-lg border border-emerald-400/30 bg-black/30 px-3 py-2 text-sm text-emerald-50 placeholder-emerald-300/40 focus:border-emerald-400 focus:outline-none" />
          <button onClick={() => ask()} disabled={busy} className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-60">{busy ? "…" : "Ask"}</button>
        </div>
        {ans && <div className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg bg-black/30 px-3 py-2 text-sm leading-relaxed text-emerald-50/90">{ans}</div>}
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={"/gspc-arena?demo=" + simQ} className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-emerald-500/20">▶ Run a compliance simulation</a>
          <a href="/readiness-assessment" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">Get compliant — 2-min check</a>
          <a href="/academy" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">Get trained</a>
          <a href="/system-card" className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100 hover:bg-amber-400/20">Get a signed System Card</a>
          <a href={"/frameworks/" + f.slug} className="rounded-full border border-emerald-400/25 px-3 py-1.5 text-xs text-emerald-200/80 hover:bg-white/5">Full clause-by-clause crosswalk →</a>
        </div>
      </div>

      {/* Collected grid */}
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Panel title="Who must comply">
          <ul className="space-y-1.5 text-sm text-emerald-100/85">{f.whoMustComply.map((w) => <li key={w} className="flex gap-2"><span className="text-emerald-400">▸</span>{w}</li>)}</ul>
        </Panel>
        <Panel title="Penalties">
          <p className="text-sm text-emerald-100/85">{f.penalties}</p>
        </Panel>
        <Panel title="Key obligations" wide>
          <div className="grid gap-2 sm:grid-cols-2">{f.keyObligations.map((o) => (<div key={o.t} className="rounded-lg border border-emerald-500/15 bg-black/20 p-3"><div className="text-sm font-bold text-emerald-100">{o.t}</div><div className="mt-0.5 text-[12px] text-emerald-100/70">{o.d}</div></div>))}</div>
        </Panel>
        <Panel title="Sectors in scope">
          <div className="flex flex-wrap gap-1.5">{f.sectors.map((s) => <span key={s} className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[12px] text-emerald-100/80">{s}</span>)}</div>
        </Panel>
        <Panel title="Threats & cybersecurity it addresses">
          <div className="flex flex-wrap gap-1.5">{f.threats.map((t) => <span key={t} className="rounded-full border border-rose-400/25 bg-rose-500/5 px-2.5 py-1 text-[12px] text-rose-100/80">{t}</span>)}</div>
        </Panel>
        <Panel title="Crosswalks — comply once, cover many">
          <div className="flex flex-wrap gap-1.5">{f.crosswalk.map((c) => { const rel = HIVE.find((h) => h.name === c); return rel ? <Link key={c} href={"/hive/" + rel.slug} className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[12px] font-semibold text-emerald-100 hover:bg-emerald-500/20">{c} →</Link> : <span key={c} className="rounded-full border border-emerald-500/20 px-2.5 py-1 text-[12px] text-emerald-100/70">{c}</span>; })}</div>
        </Panel>
        <Panel title="CSOAI Layer 0 mapping" wide>
          <p className="text-sm text-emerald-100/85">{f.csoaiArticles}</p>
          {(REAL_MCP[f.slug] || []).length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[1.5px] text-emerald-300/60">Governed MCP tools — open source, pip/npx install</div>
              <div className="flex flex-wrap gap-1.5">{(REAL_MCP[f.slug] || []).map((r) => (
                <a key={r} href={"https://github.com/CSOAI-ORG/" + r} target="_blank" rel="noreferrer" className="rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 font-mono text-[11px] text-emerald-200 hover:bg-emerald-500/20">⎇ {r}</a>
              ))}</div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
function Panel({ title, children, wide }: { title: string; children: any; wide?: boolean }) {
  return (
    <div className={"rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5 " + (wide ? "md:col-span-2" : "")}>
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/60">{title}</div>
      {children}
    </div>
  );
}

export default function FrameworkHive() {
  const [, params] = useRoute("/hive/:slug");
  const [search, setSearch] = useState("");
  useEffect(() => { if (!params) document.title = "The Framework Hive — every AI framework, collected | CSOAI"; }, [params]);
  useEffect(() => { if (!params) { const q = new URLSearchParams(window.location.search).get("q"); if (q) setSearch(q); } }, [params]);
  const f = params ? getHive(params.slug) : undefined;
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return HIVE;
    return HIVE.filter((h) => (h.name + " " + h.summary + " " + h.sectors.join(" ") + " " + h.status + " " + h.authority).toLowerCase().includes(q));
  }, [search]);

  if (params && f) return <div className="min-h-screen bg-[#03110b] text-emerald-50"><Detail f={f} /></div>;
  if (params && !f) return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50 flex items-center justify-center">
      <div className="text-center"><div className="text-lg font-bold">Framework not in the hive yet.</div><Link href="/hive" className="mt-2 inline-block text-emerald-300 hover:underline">← Back to the hive</Link></div>
    </div>
  );
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <Hero />
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mx-auto mb-6 max-w-md">
          <AISystemNotice route="/hive/:slug" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search frameworks, sectors, threats…" className="w-full rounded-xl border border-emerald-500/25 bg-[#05140d] px-4 py-2.5 text-sm text-emerald-50 placeholder-emerald-300/40 focus:border-emerald-400 focus:outline-none" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((f) => <Card key={f.slug} f={f} />)}</div>
        <p className="mt-8 text-center text-xs text-emerald-300/50">{HIVE.length} frameworks collected · comply once, crosswalk everywhere · every action signed to Layer 0</p>
      </section>
    </div>
  );
}
