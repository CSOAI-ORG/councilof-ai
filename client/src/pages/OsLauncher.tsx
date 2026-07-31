import { useEffect, useMemo, useState } from "react";
import { chargeSovereign } from "../lib/sovCharge";
import TrustMarquee from "../components/TrustMarquee";
import ToolRunner from "../components/ToolRunner";
import { detectLocale } from "../lib/locale";
const OS_LOCALE = detectLocale();

const OS_GW: string = ((import.meta as any).env?.VITE_KNOWLEDGE_BASE) || "https://os.meok.ai/api";
const OS_APP_ROUTES: Record<string, string> = { revenue: "/pricing", pricing: "/pricing", plans: "/pricing", king: "/try", council: "/try", try: "/try", setup: "/start", onboard: "/start", graph: "/graph", knowledge: "/graph", space: "/sov-space", sim: "/sov-space", simulation: "/sov-space", tools: "/tool-commons", commons: "/commons", status: "/status", os: "/os", emergence: "/emergence", egg: "/emergence", certification: "/certification", academy: "/academy", evidence: "/evidence", oscal: "/oscal", models: "/models", policy: "/policy-generator", layer0: "/trust-center", distribution: "/distribution" };
function osRoute(a: any): string | null { if (!a || !a.command) return null; if (a.command === "open_url" && a.args && a.args.url) return String(a.args.url); if (a.command === "open_app" && a.args && a.args.id) return OS_APP_ROUTES[String(a.args.id).toLowerCase()] || null; if (a.command === "govern") return "/graph"; return null; }

// CSOAI OS — the unified launcher. One surface where an end user opens every
// CSOAI governance tool working together: the live Sovereign Town heartbeat, the Layer 0
// status, and a launchpad of every app. This is os.csoai.org's home.

type App = { name: string; desc: string; href: string; glyph: string; tone: string; ext?: boolean; pro?: boolean };

const APPS: App[] = [
  // The measurement wing — the GSPC instrument, its measured results, and the ledger that
  // refuted us. These existed as routes but were absent from the OS: the AI-OS surface and the
  // instrument surface were two unconnected products on one domain.
  { name: "The GSPC Instrument", desc: "Describe an AI system; four deterministic lenses read it against 417 frozen statutory provisions and cite what binds. No model in the verdict, nothing leaves your browser.", href: "/instrument", glyph: "⚖", tone: "from-emerald-500/30 to-teal-400/10 border-emerald-400/40" },
  { name: "Measured Results", desc: "Every benchmark on one page — including the losses. 0 of 20 assets survived the provenance battery; the refutation ledger holds all 8 of our own killed theses.", href: "/benchmarks", glyph: "◫", tone: "from-emerald-500/25 to-amber-400/10 border-emerald-400/35" },
  { name: "Try the Council", desc: "30-second WOW — type a compliance question, watch the council debate it and seal a signed verdict. The front door.", href: "/try", glyph: "◆", tone: "from-emerald-500/30 to-teal-400/10 border-emerald-400/40" },
  { name: "Live Demo & Tour", desc: "Watch the OS run itself — the Sovereign flies the globe, opens the tools and narrates it all, by voice and chat. 2-min demo or 6-min tour.", href: "/demo", glyph: "▶", tone: "from-emerald-500/30 to-teal-400/10 border-emerald-400/40" },
  { name: "Governance Graph", desc: "The governed Google — ask about any company, place or AI system and get jurisdiction, live framework stack and a reasoned read.", href: "/graph", glyph: "❖", tone: "from-emerald-500/30 to-teal-400/10 border-emerald-400/40" },
  { name: "The Framework Hive", desc: "Click any framework — EU AI Act, NIST, ISO 42001, GDPR, cyber (CRA/NIS2/DORA) — and get everything collected: obligations, penalties, sectors, threats, crosswalks, deadline clock. Then simulate, comply, train.", href: "/hive", glyph: "⬡", tone: "from-emerald-500/30 to-teal-400/10 border-emerald-400/40" },
  { name: "The Ontology", desc: "The semantic layer for AI governance — like Palantir's ontology but for AI: objects (frameworks, agents, orgs, threats, people), how they relate, and the actions you can take. Live on the globe.", href: "/ontology", glyph: "❈", tone: "from-emerald-500/25 to-violet-400/10 border-emerald-400/35" },
  { name: "Signed AI System Card", desc: "The missing primitive for JSP 936 / EU AI Act / NIST assurance: an independent, Ed25519-signed, offline-verifiable record that an AI system was governed. Issue one, verify it yourself, watch tampering get rejected.", href: "/system-card", glyph: "✶", tone: "from-emerald-500/25 to-amber-400/10 border-emerald-400/35", pro: true },
  { name: "The Safe Space", desc: "One safe space for all AI governance — every framework, standard, cyber regime, AI-lab safety spec and the open-source commons, crosswalked to Layer 0 and credited. Test, simulate, prove.", href: "/safe-space", glyph: "❋", tone: "from-emerald-500/25 to-sky-400/10 border-emerald-400/35" },
  { name: "Personal Protection", desc: "Deepfake, impersonation and AI-scam shield for execs, governments, creators — and everyone. Sign what's really you so a fake fails verification (proofof.ai + Layer 0). One stop, for all people of the earth.", href: "/protect", glyph: "🛡", tone: "from-emerald-500/25 to-rose-400/10 border-emerald-400/35" },
  { name: "Sov Space", desc: "Simulate a real-world governance experiment — the council deliberates live and seals a signed verdict with a ledger hash.", href: "/sov-space", glyph: "◈", tone: "from-emerald-500/25 to-sky-400/10 border-emerald-400/35" },
  { name: "Tool Commons", desc: "Search 370+ governed MCP tools — copy a pip install, wire it into your stack, Layer 0 covered.", href: "/tool-commons", glyph: "⊟", tone: "from-cyan-500/20 to-emerald-400/5 border-cyan-400/30" },
  { name: "Open Commons", desc: "Creative-Commons media search, keyless — build in the open.", href: "/commons", glyph: "◐", tone: "from-sky-500/20 to-emerald-400/5 border-sky-400/30" },
  { name: "Your Sovereign twin", desc: "Your AI learns you as you use the OS and grows into your own AI character.", href: "/emergence", glyph: "◍", tone: "from-amber-500/20 to-emerald-400/5 border-amber-400/30", pro: true },
  { name: "System Status", desc: "The transparency board — every core system, live.", href: "/status", glyph: "◉", tone: "from-teal-500/20 to-teal-400/5 border-teal-400/30" },
  { name: "Global AI Watchdog", desc: "The public watchdog for humans, agents, humanoids and systems — report a signal, watch the world heat-map by problem layer, live.", href: "/watchdog-map", glyph: "◎", tone: "from-rose-500/20 to-amber-400/5 border-rose-400/30" },
  { name: "ONE OS — agents & humanoids", desc: "The proof of concept: live-track every agent and humanoid, PDCA auto-simulation, and watch the Sovereign stop a rogue swarm before it ungoverns — signed.", href: "/poc", glyph: "⬢", tone: "from-emerald-500/25 to-rose-400/10 border-emerald-400/35", pro: true },
  { name: "The Sovereign Network", desc: "The ecosystem in the open — twenty signed agent domains, from proofof.ai to safetyof.ai, each answerable to one council and sealed to Layer 0.", href: "/network", glyph: "◇", tone: "from-cyan-500/20 to-emerald-400/5 border-cyan-400/30" },
  { name: "The Regulator Atlas", desc: "Every major AI + cyber regime — EU AI Act, NIST, ISO 42001, NIS2, DORA, CRA and more — with the top 7 tools you need and the next 7 dates that matter. Live Sovereign read on any of them.", href: "/regulators", glyph: "🗺", tone: "from-emerald-500/20 to-teal-400/5 border-emerald-400/30" },
  { name: "Cyber self-scan", desc: "Scan your own business with a stack of reputable open-source security tools; the Sovereign triages the findings, maps them to the frameworks that bite, and guides the fix. Signed to Layer 0.", href: "/scan", glyph: "🛰", tone: "from-cyan-500/20 to-emerald-400/5 border-cyan-400/30", pro: true },
  { name: "Governance Workbench", desc: "The AI OS as a workbench on SOV3 — run a governance skill and get a signed, reproducible, council-reviewed artifact. Every output sealed to Layer 0. The auditable-artifact standard, done the CSOAI way.", href: "/workbench", glyph: "🧬", tone: "from-emerald-500/20 to-cyan-400/5 border-emerald-400/30", pro: true },
  { name: "Why CSOAI vs the rest", desc: "What we do that Vanta, Credo and OneTrust don't — open-source core, free training + certification, Council of AI, self-scan, and value back to you, not middlemen.", href: "/why", glyph: "⭐", tone: "from-amber-500/20 to-emerald-400/5 border-amber-400/30" },
  { name: "Rediscovered, Not Invented", desc: "The 4,000-year lineage — every CSOAI system mapped to the ancient original that ran empires.", href: "/lineage", glyph: "𓉴", tone: "from-amber-500/20 to-emerald-400/5 border-amber-400/30" },
  { name: "Relevance Map", desc: "What governs what — pick your industry, see the relevant CSOAI bridges, frameworks and gaps.", href: "/map", glyph: "◌", tone: "from-sky-500/20 to-emerald-400/5 border-sky-400/30" },
  { name: "Framework Temples", desc: "Each regulation a temple at its real-world seat — step inside for the visual breakdown.", href: "/temples", glyph: "卂", tone: "from-amber-500/20 to-teal-400/5 border-amber-400/30" },
  { name: "Industry Playbooks", desc: "For your sector: the AI scenario, risk tier, frameworks, the CSOAI bridges that cover you, and the steps.", href: "/playbooks", glyph: "▣", tone: "from-emerald-500/20 to-sky-400/5 border-emerald-400/30" },
  { name: "Sovereign Town", desc: "The signed record of AI governance — governed vs ungoverned, live.", href: "/sovereign-town", glyph: "▦", tone: "from-amber-500/20 to-amber-400/5 border-amber-400/30" },
  { name: "Command Center", desc: "Your whole governance program on one screen.", href: "/command-center", glyph: "◉", tone: "from-emerald-500/20 to-emerald-400/5 border-emerald-400/30" },
  { name: "Layer 0 Protocol", desc: "The 8 trust controls every governed agent stands on.", href: "/trust-center", glyph: "▥", tone: "from-amber-500/20 to-amber-400/5 border-amber-400/30" },
  { name: "Regulation Atlas", desc: "Live AI law across 40+ jurisdictions — what applies, what to do.", href: "/global-regulations", glyph: "❖", tone: "from-teal-500/20 to-teal-400/5 border-teal-400/30" },
  { name: "Governance Pulse", desc: "Live feed of every regulation move worldwide — synced daily from the grid.", href: "/pulse", glyph: "◈", tone: "from-teal-500/20 to-teal-400/5 border-teal-400/30" },
  { name: "Legacy Bridge", desc: "COBOL & mainframe, governed into the agentic economy — Layer 0 control H.", href: "/legacy", glyph: "▤", tone: "from-slate-500/20 to-slate-400/5 border-slate-400/30" },
  { name: "Social OS", desc: "Your AI character as your social presence — 50+ platforms, one inbox, governed posting.", href: "/social", glyph: "◐", tone: "from-sky-500/20 to-emerald-400/5 border-sky-400/30" },
  { name: "Crown Jewels", desc: "308 open-source goldmines + 121 black swans, tiered and mapped to the OS — the absorption marketplace.", href: "/jewels", glyph: "◆", tone: "from-cyan-500/20 to-amber-400/5 border-cyan-400/30" },
  { name: "Sov Towns", desc: "The learning multiplication engine — towns ingest white papers, simulate, spawn, and compound governed data.", href: "/towns", glyph: "❋", tone: "from-emerald-500/20 to-teal-400/5 border-emerald-400/30" },
  { name: "Sovereign Minds", desc: "The cognition & voice layer — perceive, remember, reflect, plan, act. A mind for every town and node.", href: "/minds", glyph: "◉", tone: "from-emerald-500/20 to-cyan-400/5 border-emerald-400/30" },
  { name: "Readiness Check", desc: "Free 2-minute AI governance maturity assessment.", href: "/readiness-assessment", glyph: "✓", tone: "from-emerald-500/20 to-emerald-400/5 border-emerald-400/30" },
  { name: "Framework Crosswalks", desc: "One control set mapped across EU AI Act, NIST, ISO 42001, TC260.", href: "/crosswalks", glyph: "⇄", tone: "from-blue-500/20 to-blue-400/5 border-blue-400/30" },
  { name: "MCP Fleet", desc: "216 governed MCP servers catalogued across 10 hives — Layer 0 wrapped. Live wiring lands with the API server.", href: "/mcp-fleet", glyph: "⊟", tone: "from-emerald-500/20 to-emerald-400/5 border-emerald-400/30" },
  { name: "Hive Grid", desc: "Every tool a hive with a sovereign queen — learning, aware, ensembled.", href: "/hives", glyph: "⬡", tone: "from-violet-500/20 to-violet-400/5 border-violet-400/30" },
  { name: "Distribution", desc: "Every endpoint we ship to — PyPI, npm, glama, mcpize, GitHub — with Layer 0 coverage.", href: "/distribution", glyph: "⌖", tone: "from-teal-500/20 to-teal-400/5 border-teal-400/30" },
  { name: "Working Tools", desc: "Article 50 passport generator, real-time compliance dashboard, heatmap, Council of AI votes, charter network, capability matrix, buyer evidence index — all in-browser, no sign-up.", href: "/tools/index.html", glyph: "⚒", tone: "from-emerald-500/20 to-teal-400/5 border-emerald-400/30", ext: true },
  { name: "Measured Evidence", desc: "The numbers with reproduce paths — GovComp gate 32/32, primary-verified gap matrix, 0.0% benign FPR — plus what we do NOT claim.", href: "/measured.html", glyph: "✓", tone: "from-emerald-500/20 to-teal-400/5 border-emerald-400/30", ext: true },
  { name: "Immersive Globe", desc: "177 jurisdictions, sovereign nodes, agent swarm — one Earth.", href: "/globe3d.html", glyph: "◍", tone: "from-teal-500/20 to-teal-400/5 border-teal-400/30", ext: true },
  { name: "3D Governance Earth", desc: "Photorealistic CesiumJS globe with cross-region arcs.", href: "/globe3d.html", glyph: "✺", tone: "from-sky-500/20 to-sky-400/5 border-sky-400/30", ext: true },
  { name: "OSCAL Studio", desc: "Import/export NIST OSCAL — FedRAMP 20x ready.", href: "/oscal", glyph: "⌬", tone: "from-emerald-500/20 to-emerald-400/5 border-emerald-400/30" },
  { name: "Evidence Hub", desc: "Continuous, automated compliance evidence.", href: "/evidence", glyph: "⊞", tone: "from-emerald-500/20 to-emerald-400/5 border-emerald-400/30" },
  { name: "Model Registry", desc: "Model cards + bias / fairness audits.", href: "/models", glyph: "⊛", tone: "from-violet-500/20 to-violet-400/5 border-violet-400/30" },
  { name: "Framework Catalog", desc: "28 frameworks + partner network for the rest.", href: "/framework-catalog", glyph: "▤", tone: "from-blue-500/20 to-blue-400/5 border-blue-400/30" },
  { name: "Policy Generator", desc: "Generate a board-ready AI policy in seconds.", href: "/policy-generator", glyph: "✎", tone: "from-emerald-500/20 to-emerald-400/5 border-emerald-400/30" },
  { name: "Risk Heatmap", desc: "Likelihood × impact matrix + risk register.", href: "/risk-heatmap", glyph: "▦", tone: "from-rose-500/20 to-rose-400/5 border-rose-400/30" },
  { name: "Webhooks", desc: "Real-time, HMAC-signed integration mesh.", href: "/webhooks", glyph: "⌁", tone: "from-cyan-500/20 to-cyan-400/5 border-cyan-400/30" },
  { name: "Sovereign Academy", desc: "Learn governance as a guided journey \u2014 Foundations to certification.", href: "/academy", glyph: "\u2738", tone: "from-violet-500/20 to-violet-400/5 border-violet-400/30" },
  { name: "Join the Grid", desc: "Register your sovereign node \u2014 humanoid, enterprise or government.", href: "/register", glyph: "\u2B21", tone: "from-emerald-500/20 to-emerald-400/5 border-emerald-400/30" },
  { name: "Get Certified", desc: "Earn a Watchdog Certificate — provable proof your AI is governed.", href: "/certification", glyph: "✦", tone: "from-amber-500/20 to-amber-400/5 border-amber-400/30" },
  { name: "Pricing & Plans", desc: "From a free risk check to enterprise governance.", href: "/pricing", glyph: "◆", tone: "from-emerald-500/20 to-emerald-400/5 border-emerald-400/30" },
];

// SaaS grid categories — buckets each app so the launcher reads like a real app store.
const CAT_MAP: Record<string, string> = {
  "/try": "Govern", "/graph": "Govern", "/hive": "Govern", "/sov-space": "Govern", "/system-card": "Govern", "/regulators": "Govern", "/playbooks": "Govern", "/crosswalks": "Govern", "/policy-generator": "Govern", "/command-center": "Govern", "/readiness-assessment": "Govern", "/framework-catalog": "Govern", "/global-regulations": "Govern", "/pulse": "Govern",
  "/scan": "Cyber & protect", "/watchdog-map": "Cyber & protect", "/risk-heatmap": "Cyber & protect", "/protect": "Cyber & protect", "/poc": "Cyber & protect",
  "/network": "Ecosystem", "/safe-space": "Ecosystem", "/jewels": "Ecosystem", "/towns": "Ecosystem", "/minds": "Ecosystem", "/social": "Ecosystem", "/lineage": "Ecosystem", "/why": "Ecosystem", "/sovereign-town": "Ecosystem", "/ontology": "Ecosystem",
  "/workbench": "Data & proof", "/evidence": "Data & proof", "/tools/index.html": "Data & proof", "/measured.html": "Data & proof", "/models": "Data & proof", "/oscal": "Data & proof", "/distribution": "Data & proof", "/mcp-fleet": "Data & proof", "/tool-commons": "Data & proof", "/commons": "Data & proof", "/webhooks": "Data & proof", "/hives": "Data & proof", "/trust-center": "Data & proof", "/legacy": "Data & proof",
  "/academy": "Learn & join", "/certification": "Learn & join", "/register": "Learn & join", "/pricing": "Learn & join",
  "/demo": "Explore & views", "/emergence": "Explore & views", "/map": "Explore & views", "/temples": "Explore & views", "/status": "Explore & views", "/globe.html": "Explore & views", "/globe3d.html": "Explore & views", "/world-3d": "Explore & views",
};
const CATS = ["All", "Govern", "Cyber & protect", "Ecosystem", "Data & proof", "Learn & join", "Explore & views"];
function catOf(href: string) { return CAT_MAP[href] || "Explore & views"; }

function fmt(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
  if (n >= 1e6) return Math.round(n / 1e6) + "M";
  if (n >= 1e3) return Math.round(n / 1e3) + "k";
  return String(n);
}

export default function OsLauncher() {
  const [ep, setEp] = useState(649000000); // ledger-verified floor (2026-07); live feed overrides when reachable
  const [ung, setUng] = useState(54300000); // ledger-verified counterfactual floor (2026-07); live feed overrides
  const [live, setLive] = useState(false);
  const [ring, setRing] = useState(0);
  const [ask, setAsk] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const shown = useMemo(() => APPS.filter((a) => (cat === "All" || catOf(a.href) === cat) && (!q.trim() || (a.name + " " + a.desc).toLowerCase().includes(q.trim().toLowerCase()))), [q, cat]);

  async function runAsk() {
    const t = ask.trim(); if (!t) return;
    setAsking(true); setAnswer(""); chargeSovereign(4);
    // Orchestrate first: the OS home speaks AND opens the right app.
    try {
      const r = await fetch(OS_GW + "/orchestrate", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: t, context: { path: "/os", title: "OS launcher" } }) });
      if (r.ok) { const d = await r.json(); if (d && (d.say || d.actions)) {
        const route = (Array.isArray(d.actions) ? d.actions : []).map(osRoute).find(Boolean) as string | undefined;
        if (d.say) setAnswer(String(d.say));
        if (route) { setTimeout(() => { if (/^https?:\/\//.test(route)) window.open(route, "_blank"); else window.location.assign(route); }, 900); setAsking(false); return; }
        if (d.say) { setAsking(false); return; }
      } }
    } catch (e) {}
    // Fallback: rich reasoned answer.
    try {
      const r = await fetch(OS_GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: t }) });
      if (r.ok) { const d = await r.json(); if (d && d.response && d.model !== "idle" && !/travell?er|companion|walks beside|i'?m sorry|can'?t help|on your journey|dear friend|kindred|as an ai language|remembering/i.test(String(d.response))) setAnswer(String(d.response)); }
    } catch (e) {}
    setAsking(false);
  }

  useEffect(() => {
    document.title = "CSOAI OS — the AI governance operating system";
    fetch("https://proofof-site.vercel.app/sovereign-town/status.json", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.cum_episodes === "number") setEp(d.cum_episodes);
        if (typeof d.ungoverned_crimes === "number") setUng(d.ungoverned_crimes);
        setLive(true);
      })
      .catch(() => {});
    let v = 0;
    const iv = setInterval(() => { v += 2; setRing(Math.min(v, 73)); if (v >= 73) clearInterval(iv); }, 22);
    return () => clearInterval(iv);
  }, []);

  const C = 138.2;
  const dash = useMemo(() => (C * (1 - ring / 100)).toFixed(1), [ring]);
  const grouped = cat === "All" && !q.trim();
  const Tile = (a: App) => (
    <a key={a.name} href={a.href} className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${a.tone} p-5 transition hover:scale-[1.015] hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.35)]`}>
      {a.pro && <span title="Operator tier — advanced / defence-grade capability" className="absolute right-3 top-3 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[1.5px] text-amber-200/90">Operator · Pro</span>}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/30 text-xl text-emerald-200">{a.glyph}</div>
        <div className="flex-1">
          <div className="font-semibold text-white">{a.name} <span className="opacity-0 transition group-hover:opacity-100">→</span></div>
          <p className="mt-1 text-[13px] leading-snug text-emerald-50/70">{a.desc}</p>
        </div>
      </div>
    </a>
  );

  return (
    <div className="min-h-screen bg-[#05080e] text-[#e7f6ef]" style={{ backgroundImage: "radial-gradient(1200px 600px at 50% -10%, rgba(16,185,129,0.10), transparent 60%)" }}>
      {/* top status bar */}
      <header className="flex flex-wrap items-center gap-4 border-b border-emerald-500/15 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-2 font-semibold">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 12px #34d399" }} />
          CSOAI <span className="text-emerald-300/70 font-mono text-[11px] uppercase tracking-[2px]">OS</span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-5 font-mono text-xs">
          <span className="text-emerald-300/80">{live ? "● LIVE" : "○ snapshot"}</span>
          <span><b className="text-emerald-300">{fmt(ep)}+</b> <span className="text-emerald-100/50">signed episodes</span></span>
          <span><b className="text-emerald-300">0</b> <span className="text-emerald-100/50">governed crimes</span></span>
          <span><b className="text-amber-300">{fmt(ung)}+</b> <span className="text-emerald-100/50">ungoverned</span></span>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-6">
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex-1 min-w-[280px]">
            <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/70">The AI governance operating system</p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight">Open the grid.</h1>
            <p className="mt-2 text-sm text-emerald-200/85">📍 <b className="text-emerald-100">{OS_LOCALE.region.label}</b> — {OS_LOCALE.greeting} <span className="text-emerald-300/55">Governs here: {OS_LOCALE.region.frameworks.slice(0, 3).join(" · ")}.</span></p>
            <p className="mt-4 max-w-xl text-emerald-50/80">
              Every CSOAI tool, one surface. Watch the governed‑vs‑ungoverned moat in real time, then launch any
              app — all standing on one signed Layer 0 floor, externally anchored to Bitcoin.
            </p>
            <div className="mt-6">
              <div className="flex gap-2">
                <input value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runAsk(); }} placeholder="Ask your Sovereign anything…" className="flex-1 rounded-xl border border-emerald-500/30 bg-black/40 px-5 py-3.5 text-emerald-50 placeholder-emerald-300/40 focus:border-emerald-400 focus:outline-none" />
                <button onClick={runAsk} className="rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-60" disabled={asking}>{asking ? "Reasoning…" : "Ask"}</button>
              </div>
              {answer && <div className="mt-3 whitespace-pre-wrap rounded-xl border border-emerald-400/25 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-emerald-50/90">{answer}</div>}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/certification" className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Get certified →</a>
              <a href="/globe3d.html" className="rounded-lg border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Launch the globe</a>
              <a href="/command-center" className="rounded-lg border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Command Center</a>
            </div>
          </div>
          {/* layer 0 readiness ring */}
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-white/[0.03] p-5">
            <svg width="64" height="64" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="5" />
              <circle cx="26" cy="26" r="22" fill="none" stroke="#34d399" strokeWidth="5" strokeLinecap="round" strokeDasharray="138.2" strokeDashoffset={dash} transform="rotate(-90 26 26)" />
            </svg>
            <div>
              <div className="font-mono text-lg text-emerald-300">{ring}%</div>
              <div className="text-[11px] text-emerald-100/50">CSOAI Layer-0 coverage</div>
              <div className="mt-1 text-[11px] text-emerald-100/40">platform build · 8 controls</div>
            </div>
          </div>
        </div>
      </section>

      {/* app launchpad */}
      <section className="mx-auto max-w-6xl px-6 pb-2">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-emerald-300/60">Run a live governed tool — right here</div>
        <ToolRunner />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Applications</h2>
          <span className="rounded-full border border-emerald-500/25 px-2 py-0.5 font-mono text-[10px] text-emerald-300/60">{shown.length} / {APPS.length}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search apps…" className="ml-auto w-full sm:w-64 rounded-lg border border-emerald-500/25 bg-black/40 px-3 py-1.5 text-sm text-emerald-50 placeholder-emerald-300/40 focus:border-emerald-400 focus:outline-none" />
        </div>
        <div className="mb-5 flex flex-wrap gap-1.5">
          {CATS.map((c) => (<button key={c} onClick={() => setCat(c)} className={"rounded-full border px-3 py-1 text-xs font-bold " + (cat === c ? "border-emerald-400 bg-emerald-500/20 text-emerald-100" : "border-emerald-500/25 text-emerald-200/60 hover:bg-white/5")}>{c}</button>))}
        </div>
        {grouped ? (
          CATS.slice(1).map((c) => { const items = APPS.filter((a) => catOf(a.href) === c); if (!items.length) return null; return (
            <div key={c} className="mb-8">
              <button onClick={() => setCollapsed((s) => ({ ...s, [c]: !s[c] }))} className="mb-3 flex w-full items-center gap-2 text-left hover:opacity-90">
                <span className={"text-emerald-300/70 transition-transform " + (collapsed[c] ? "" : "rotate-90")}>▸</span>
                <h3 className="text-sm font-bold text-emerald-100">{c}</h3>
                <span className="rounded-full border border-emerald-500/20 px-2 py-0.5 font-mono text-[10px] text-emerald-300/50">{items.length}</span>
              </button>
              {!collapsed[c] && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(Tile)}</div>}
            </div>
          ); })
        ) : shown.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map(Tile)}</div>
        ) : (
          <div className="rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-8 text-center text-sm text-emerald-100/50">No apps match "{q}". <button onClick={() => { setQ(""); setCat("All"); }} className="text-emerald-300 underline">Clear</button></div>
        )}

        <div className="mt-10 rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-5 text-sm text-emerald-100/60">
          One signed floor under every endpoint — sites, MCP servers, packages, plugins and tools — governed by
          Layer 0 and verifiable offline. <span className="text-emerald-300">This is the substrate, not just a site.</span>
        </div>

        <div className="mt-10 border-t border-emerald-500/15 pt-8">
          <TrustMarquee variant="full" dark speed={70} />
        </div>
      </section>
    </div>
  );
}
