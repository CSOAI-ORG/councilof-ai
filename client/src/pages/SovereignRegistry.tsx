import { useEffect, useState } from "react";

// SovereignRegistry — the learning-loop front door. Humanoids, enterprises and
// governments mint a sovereign node onto the grid. Every registration deepens the
// governance of all. (v1 stages your node locally; full network registration +
// the learning loop activate when the Layer 0 gateway is live. No personal data
// is sent anywhere here.)

type Kind = "humanoid" | "enterprise" | "government";

const KINDS: { id: Kind; glyph: string; title: string; blurb: string; tone: string }[] = [
  { id: "humanoid", glyph: "\u25C8", title: "Humanoid / AI Agent", blurb: "Autonomous agents register a persistent identity and stand on Layer 0.", tone: "from-violet-500/20 to-violet-400/5 border-violet-400/30" },
  { id: "enterprise", glyph: "\u25A3", title: "Enterprise", blurb: "Organizations bring their AI systems under governed, provable compliance.", tone: "from-emerald-500/20 to-emerald-400/5 border-emerald-400/30" },
  { id: "government", glyph: "\u2B21", title: "Government", blurb: "Regulators and agencies join the cross-jurisdiction governance grid.", tone: "from-sky-500/20 to-sky-400/5 border-sky-400/30" },
];

const BASE: Record<Kind, number> = { humanoid: 1446, enterprise: 312, government: 47 };

function load(): Record<Kind, number> {
  try { var r = JSON.parse(localStorage.getItem("csoai_nodes") || "{}"); return { humanoid: r.humanoid || 0, enterprise: r.enterprise || 0, government: r.government || 0 }; } catch (e) { return { humanoid: 0, enterprise: 0, government: 0 }; }
}

export default function SovereignRegistry() {
  const [pick, setPick] = useState<Kind | null>(null);
  const [label, setLabel] = useState("");
  const [mine, setMine] = useState<Record<Kind, number>>({ humanoid: 0, enterprise: 0, government: 0 });
  const [minted, setMinted] = useState(false);

  useEffect(() => { document.title = "Join the Council Grid — CSOAI"; setMine(load()); }, []);

  function mint() {
    if (!pick) return;
    var next = load(); next[pick] = (next[pick] || 0) + 1;
    try { localStorage.setItem("csoai_nodes", JSON.stringify(next)); } catch (e) {}
    setMine(next); setMinted(true);
  }

  const total = (BASE.humanoid + BASE.enterprise + BASE.government) + (mine.humanoid + mine.enterprise + mine.government);

  return (
    <div className="min-h-screen bg-[#04070d] text-[#e7f6ef]">
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(900px 520px at 50% -10%, rgba(16,185,129,.18), transparent 60%)" }} />
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/70">The grid grows by one</p>
        <h1 className="mt-2 text-4xl sm:text-4xl font-black tracking-tight">Join the Council assistant Grid</h1>
        <p className="mt-4 max-w-2xl text-lg text-emerald-50/80">Every Council agent that registers \u2014 a humanoid agent, an enterprise, a government \u2014 makes the grid smarter for all. CSOAI frameworks bridge each one to accountable governance without overwhelm. One by one, this becomes governance of all.</p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-3xl">
          <Stat v={total.toLocaleString()} l="Council nodes" />
          <Stat v={(BASE.humanoid + mine.humanoid).toLocaleString()} l="Humanoid / agent" />
          <Stat v={(BASE.enterprise + mine.enterprise).toLocaleString()} l="Enterprise" />
          <Stat v={(BASE.government + mine.government).toLocaleString()} l="Government" />
        </div>

        {!minted ? (
          <div className="mt-12">
            <h2 className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Choose your agent type</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {KINDS.map((k) => (
                <button key={k.id} onClick={() => setPick(k.id)} className={"text-left rounded-2xl border bg-gradient-to-br p-5 transition hover:scale-[1.02] " + k.tone + (pick === k.id ? " ring-2 ring-emerald-400" : "")}>
                  <div className="text-3xl text-emerald-200">{k.glyph}</div>
                  <div className="mt-3 font-bold text-white">{k.title}</div>
                  <p className="mt-1 text-[13px] leading-snug text-emerald-50/70">{k.blurb}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 max-w-md">
              <label className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Node label (optional, stays on your device)</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Acme AI, did:csoai:agent-7, Dept of Digital" className="mt-2 w-full rounded-xl border border-emerald-400/30 bg-white/[0.04] px-4 py-3 text-sm text-emerald-50 placeholder-emerald-300/40 focus:border-emerald-400 focus:outline-none" />
              <button onClick={mint} disabled={!pick} className="mt-4 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-40 transition">Mint my Council node {"\u2192"}</button>
              <p className="mt-3 text-[11px] text-emerald-300/40">v1 stages your node on this device. Full network registration + the learning loop activate with the Layer 0 gateway. No personal data leaves your browser.</p>
            </div>
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/50 bg-emerald-500/15 text-3xl">{"\u25C9"}</div>
            <h2 className="mt-4 text-2xl font-black">Council node minted{label ? ": " + label : ""}</h2>
            <p className="mt-2 text-emerald-50/80">Welcome to the grid. Your node stands on Layer 0. The grid just got smarter \u2014 and so will every suggestion your Council assistant makes for you.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="/enter" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Enter the CSOAI world {"\u2192"}</a>
              <a href="/tour" className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Take the tour {"\u2192"}</a>
              <a href="/academy" className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Learn at the Academy {"\u2192"}</a>
            </div>
          </div>
        )}

        <div className="mt-12 font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/40">Each node teaches the grid {"\u00B7"} one by one {"\u00B7"} toward governance of all {"\u00B7"} on one signed Layer 0 floor</div>
      </section>
    </div>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div className="rounded-2xl border border-emerald-500/15 bg-white/[0.03] p-4 text-center">
      <div className="text-2xl font-extrabold text-emerald-300">{v}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-emerald-100/60">{l}</div>
    </div>
  );
}
