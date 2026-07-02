import { useEffect, useMemo, useState } from "react";
import { REGIMES, type Regime } from "../data/regulators";
import { chargeSovereign } from "../lib/sovCharge";

// /regulators — the Regulator Atlas. Every major AI + cyber regime, its top-7
// tools, and its next-7 movements — with the live Sovereign giving a current
// read on any of them. The structured spine the Sovereign acts on.

const GW = "https://os.meok.ai/api";
const STATUS: Record<string, { label: string; cls: string }> = {
  "in-force": { label: "In force", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  "phasing-in": { label: "Phasing in", cls: "bg-amber-500/15 text-amber-200 border-amber-400/30" },
  "voluntary": { label: "Voluntary", cls: "bg-sky-500/15 text-sky-200 border-sky-400/30" },
  "proposed": { label: "Proposed", cls: "bg-violet-500/15 text-violet-200 border-violet-400/30" },
  "shifting": { label: "Status shifting", cls: "bg-rose-500/15 text-rose-200 border-rose-400/30" },
};
const KINDS = [{ id: "all", label: "All regimes" }, { id: "ai", label: "AI governance" }, { id: "cyber", label: "Cybersecurity" }, { id: "data", label: "Data protection" }] as const;

function RegCard({ r }: { r: Regime }) {
  const [ans, setAns] = useState(""); const [busy, setBusy] = useState(false);
  async function ask() {
    setBusy(true); setAns(""); chargeSovereign(6);
    try {
      const m = "You are the CSOAI Sovereign. In 3 sentences give a current, practical read on " + r.name + " (" + r.region + "): who must act now, the single most urgent obligation, and the smartest first move. Be specific and current.";
      const res = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: m }) });
      if (res.ok) { const d = await res.json(); if (d && d.response && d.model !== "idle" && !/travell?er|companion|walks beside|i'?m sorry|can'?t help|on your journey|dear friend|kindred|as an ai language|remembering/i.test(String(d.response))) setAns(String(d.response)); }
    } catch (e) {}
    if (!ans) setAns((a) => a || "Live read unavailable right now — the collected obligations and dates below have what you need.");
    setBusy(false);
  }
  const st = STATUS[r.status];
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-emerald-50">{r.name}</div>
          <div className="mt-0.5 text-xs text-emerald-300/60">{r.region} · {r.authority}</div>
        </div>
        <span className={"shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide " + st.cls}>{st.label}</span>
      </div>
      <p className="mt-3 text-sm text-emerald-100/75">{r.summary}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-300/70">Top 7 tools needed</div>
          <ol className="mt-2 space-y-1 text-[13px] text-emerald-100/80">
            {r.topTools.map((t, i) => (<li key={i} className="flex gap-2"><span className="text-emerald-400/60">{i + 1}.</span><span>{t}</span></li>))}
          </ol>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-amber-300/70">Next 7 dates & movements</div>
          <ul className="mt-2 space-y-1 text-[13px] text-emerald-100/80">
            {r.nextDates.map((d, i) => (<li key={i} className="flex gap-2"><span className="shrink-0 font-mono text-[11px] text-amber-200/80">{d.date}</span><span className="text-emerald-100/70">{d.event}</span></li>))}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
        <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-300/70">How CSOAI covers it</div>
        <p className="mt-1 text-[13px] text-emerald-100/80">{r.csoai}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={ask} disabled={busy} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-60">{busy ? "Reading…" : "Ask the Sovereign for a live read"}</button>
        {r.hiveSlug && <a href={"/hive/" + r.hiveSlug} className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/5">Open in the Hive →</a>}
        <a href={"/graph?demo=" + encodeURIComponent("an organisation subject to " + r.name)} className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/5">Govern a case →</a>
      </div>
      {ans && <div className="mt-3 whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-[13px] text-emerald-50/90">{ans}</div>}
    </div>
  );
}

export default function RegulatorAtlas() {
  const [kind, setKind] = useState<string>("all");
  useEffect(() => { document.title = "The Regulator Atlas — every AI + cyber regime, tools & dates | CSOAI"; }, []);
  const list = useMemo(() => (kind === "all" ? REGIMES : REGIMES.filter((r) => r.kind === kind)), [kind]);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(900px 420px at 50% -10%, rgba(16,185,129,.16), transparent 60%)" }} />
        <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-9 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS · the regulator atlas</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">Every regulator. <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">The tools and the clock.</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-emerald-100/80">The major AI and cybersecurity regimes worldwide — each with the top 7 tools you need and the next 7 dates that matter. The Sovereign gives a live read on any of them, then does the work: classify, assess, sign.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {KINDS.map((k) => (<button key={k.id} onClick={() => setKind(k.id)} className={"rounded-full border px-4 py-1.5 text-xs font-bold " + (kind === k.id ? "border-emerald-400 bg-emerald-500/20 text-emerald-100" : "border-emerald-500/25 text-emerald-200/70 hover:bg-white/5")}>{k.label}</button>))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-5 lg:grid-cols-2">{list.map((r) => <RegCard key={r.slug} r={r} />)}</div>

        <div className="mt-8 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4 text-center text-xs text-amber-100/70">
          Dates and obligations are compiled from established framework knowledge and evolve constantly — always verify against the primary regulator before you rely on a specific date. The Sovereign's live read pulls the current picture; volatile items are marked <b className="text-amber-200">Status shifting</b>.
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-6 text-center">
          <div className="text-sm font-bold text-emerald-100">Comply once. Crosswalk everywhere.</div>
          <p className="mx-auto mt-1 max-w-2xl text-[13px] text-emerald-100/70">One evidence set, mapped across every regime above — signed to Layer 0, provable not promised. That's the difference between a governance program and a pile of PDFs.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a href="/hive" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Open the Framework Hive →</a>
            <a href="/scan" className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20">Scan your own cyber (God's Eye) →</a>
            <a href="/why" className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Why CSOAI vs the rest →</a>
          </div>
        </div>
      </section>
    </div>
  );
}
