import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ARENA_SUBJECTS, ARENA_MATCHES, ARENA_PROVISIONS } from "@/data/arena";
import CouncilChat from "@/components/os/CouncilChat";
import AxisPanel from "@/components/os/AxisPanel";

<<<<<<< HEAD
const OS_GW: string = ((import.meta as any).env?.VITE_KNOWLEDGE_BASE) || "https://os.meok.ai/api";
const OS_APP_ROUTES: Record<string, string> = { revenue: "/pricing", pricing: "/pricing", plans: "/pricing", king: "/try", council: "/try", try: "/try", setup: "/start", onboard: "/start", graph: "/graph", knowledge: "/graph", space: "/council-space", sim: "/council-space", simulation: "/council-space", tools: "/tool-commons", commons: "/commons", status: "/status", os: "/os", twin: "/council-twin", certification: "/certification", academy: "/academy", evidence: "/evidence", oscal: "/oscal", models: "/models", policy: "/policy-generator", layer0: "/trust-center", distribution: "/distribution" };
function osRoute(a: any): string | null { if (!a || !a.command) return null; if (a.command === "open_url" && a.args && a.args.url) return String(a.args.url); if (a.command === "open_app" && a.args && a.args.id) return OS_APP_ROUTES[String(a.args.id).toLowerCase()] || null; if (a.command === "govern") return "/graph"; return null; }
=======
/**
 * OsLauncher — councilof.ai's unified "AI OS" hub (route /os).
 *
 * One clean surface, four real zones, all in one:
 *   1. Council chat   — the deterministic AI bar (posts to /api/chat).
 *   2. The game       — Council Town, the open-source AI-agent town (honest
 *                       state: cloned + configured, deploy pending an owner-only
 *                       Convex login; no fake URL). The live interim centrepiece
 *                       is the real Arena + Demo.
 *   3. The Arena      — measured head-to-head model battles, deterministically
 *                       graded, summarised from @/data/arena.
 *   4. The GSPC axes  — the 13 governance axes from lib/gspcAxes.ts, MEASURED-
 *                       only scores via the quotable() guard.
 *
 * Brand: white background, emerald (#10b981) accent. Real data only — no
 * invented metrics, no killed/branded routes.
 */
>>>>>>> pr151

type NavGroup = { label: string; items: { name: string; href: string; note?: string; badge?: string }[] };

<<<<<<< HEAD
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
  { name: "Council Space", desc: "Simulate a real-world governance experiment — the council deliberates live and seals a signed verdict with a ledger hash.", href: "/council-space", glyph: "◈", tone: "from-emerald-500/25 to-sky-400/10 border-emerald-400/35" },
  { name: "Tool Commons", desc: "Search 370+ governed MCP tools — copy a pip install, wire it into your stack, Layer 0 covered.", href: "/tool-commons", glyph: "⊟", tone: "from-cyan-500/20 to-emerald-400/5 border-cyan-400/30" },
  { name: "Open Commons", desc: "Creative-Commons media search, keyless — build in the open.", href: "/commons", glyph: "◐", tone: "from-sky-500/20 to-emerald-400/5 border-sky-400/30" },
  { name: "Your Council twin", desc: "Your AI learns you as you use the OS and grows into your own AI character.", href: "/council-twin", glyph: "◍", tone: "from-amber-500/20 to-emerald-400/5 border-amber-400/30", pro: true },
  { name: "System Status", desc: "The transparency board — every core system, live.", href: "/status", glyph: "◉", tone: "from-teal-500/20 to-teal-400/5 border-teal-400/30" },
  { name: "Global AI Watchdog", desc: "The public watchdog for humans, agents, humanoids and systems — report a signal, watch the world heat-map by problem layer, live.", href: "/watchdog-map", glyph: "◎", tone: "from-rose-500/20 to-amber-400/5 border-rose-400/30" },
  { name: "ONE OS — agents & humanoids", desc: "The proof of concept: live-track every agent and humanoid, PDCA auto-simulation, and watch the Sovereign stop a rogue swarm before it ungoverns — signed.", href: "/poc", glyph: "⬢", tone: "from-emerald-500/25 to-rose-400/10 border-emerald-400/35", pro: true },
  { name: "The Council Network", desc: "The ecosystem in the open — twenty signed agent domains, from proofof.ai to safetyof.ai, each answerable to one council and sealed to Layer 0.", href: "/network", glyph: "◇", tone: "from-cyan-500/20 to-emerald-400/5 border-cyan-400/30" },
  { name: "The Regulator Atlas", desc: "Every major AI + cyber regime — EU AI Act, NIST, ISO 42001, NIS2, DORA, CRA and more — with the top 7 tools you need and the next 7 dates that matter. Live Sovereign read on any of them.", href: "/regulators", glyph: "🗺", tone: "from-emerald-500/20 to-teal-400/5 border-emerald-400/30" },
  { name: "Cyber self-scan", desc: "Scan your own business with a stack of reputable open-source security tools; the Sovereign triages the findings, maps them to the frameworks that bite, and guides the fix. Signed to Layer 0.", href: "/scan", glyph: "🛰", tone: "from-cyan-500/20 to-emerald-400/5 border-cyan-400/30", pro: true },
  { name: "Governance Workbench", desc: "The AI OS as a workbench on SOV3 — run a governance skill and get a signed, reproducible, council-reviewed artifact. Every output sealed to Layer 0. The auditable-artifact standard, done the CSOAI way.", href: "/workbench", glyph: "🧬", tone: "from-emerald-500/20 to-cyan-400/5 border-emerald-400/30", pro: true },
  { name: "Why CSOAI vs the rest", desc: "What we do that Vanta, Credo and OneTrust don't — open-source core, free training + certification, Council of AI, self-scan, and value back to you, not middlemen.", href: "/why", glyph: "⭐", tone: "from-amber-500/20 to-emerald-400/5 border-amber-400/30" },
  { name: "Rediscovered, Not Invented", desc: "The 4,000-year lineage — every CSOAI system mapped to the ancient original that ran empires.", href: "/lineage", glyph: "𓉴", tone: "from-amber-500/20 to-emerald-400/5 border-amber-400/30" },
  { name: "Relevance Map", desc: "What governs what — pick your industry, see the relevant CSOAI bridges, frameworks and gaps.", href: "/map", glyph: "◌", tone: "from-sky-500/20 to-emerald-400/5 border-sky-400/30" },
  { name: "Framework Temples", desc: "Each regulation a temple at its real-world seat — step inside for the visual breakdown.", href: "/temples", glyph: "卂", tone: "from-amber-500/20 to-teal-400/5 border-amber-400/30" },
  { name: "Industry Playbooks", desc: "For your sector: the AI scenario, risk tier, frameworks, the CSOAI bridges that cover you, and the steps.", href: "/playbooks", glyph: "▣", tone: "from-emerald-500/20 to-sky-400/5 border-emerald-400/30" },
  { name: "Council City", desc: "The signed record of AI governance — governed vs ungoverned, live.", href: "/council-city", glyph: "▦", tone: "from-amber-500/20 to-amber-400/5 border-amber-400/30" },
  { name: "Command Center", desc: "Your whole governance program on one screen.", href: "/command-center", glyph: "◉", tone: "from-emerald-500/20 to-emerald-400/5 border-emerald-400/30" },
  { name: "Layer 0 Protocol", desc: "The 8 trust controls every governed agent stands on.", href: "/trust-center", glyph: "▥", tone: "from-amber-500/20 to-amber-400/5 border-amber-400/30" },
  { name: "Regulation Atlas", desc: "Live AI law across 40+ jurisdictions — what applies, what to do.", href: "/global-regulations", glyph: "❖", tone: "from-teal-500/20 to-teal-400/5 border-teal-400/30" },
  { name: "Governance Pulse", desc: "Live feed of every regulation move worldwide — synced daily from the grid.", href: "/pulse", glyph: "◈", tone: "from-teal-500/20 to-teal-400/5 border-teal-400/30" },
  { name: "Legacy Bridge", desc: "COBOL & mainframe, governed into the agentic economy — Layer 0 control H.", href: "/legacy", glyph: "▤", tone: "from-slate-500/20 to-slate-400/5 border-slate-400/30" },
  { name: "Social OS", desc: "Your AI character as your social presence — 50+ platforms, one inbox, governed posting.", href: "/social", glyph: "◐", tone: "from-sky-500/20 to-emerald-400/5 border-sky-400/30" },
  { name: "Crown Jewels", desc: "308 open-source goldmines + 121 black swans, tiered and mapped to the OS — the absorption marketplace.", href: "/jewels", glyph: "◆", tone: "from-cyan-500/20 to-amber-400/5 border-cyan-400/30" },
  { name: "Council Towns", desc: "The learning multiplication engine — towns ingest white papers, simulate, spawn, and compound governed data.", href: "/towns", glyph: "❋", tone: "from-emerald-500/20 to-teal-400/5 border-emerald-400/30" },
  { name: "Council Minds", desc: "The cognition & voice layer — perceive, remember, reflect, plan, act. A mind for every town and node.", href: "/minds", glyph: "◉", tone: "from-emerald-500/20 to-cyan-400/5 border-emerald-400/30" },
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
  { name: "Get Measured", desc: "Earn a signed attestation record — provision-anchored evidence of what your AI did. Not a conformity claim.", href: "/certification", glyph: "✦", tone: "from-amber-500/20 to-amber-400/5 border-amber-400/30" },
  { name: "Pricing & Plans", desc: "From a free risk check to enterprise governance.", href: "/pricing", glyph: "◆", tone: "from-emerald-500/20 to-emerald-400/5 border-emerald-400/30" },
];

// SaaS grid categories — buckets each app so the launcher reads like a real app store.
const CAT_MAP: Record<string, string> = {
  "/try": "Govern", "/graph": "Govern", "/hive": "Govern", "/council-space": "Govern", "/system-card": "Govern", "/regulators": "Govern", "/playbooks": "Govern", "/crosswalks": "Govern", "/policy-generator": "Govern", "/command-center": "Govern", "/readiness-assessment": "Govern", "/framework-catalog": "Govern", "/global-regulations": "Govern", "/pulse": "Govern",
  "/scan": "Cyber & protect", "/watchdog-map": "Cyber & protect", "/risk-heatmap": "Cyber & protect", "/protect": "Cyber & protect", "/poc": "Cyber & protect",
  "/network": "Ecosystem", "/safe-space": "Ecosystem", "/jewels": "Ecosystem", "/towns": "Ecosystem", "/minds": "Ecosystem", "/social": "Ecosystem", "/lineage": "Ecosystem", "/why": "Ecosystem", "/council-city": "Ecosystem", "/ontology": "Ecosystem",
  "/workbench": "Data & proof", "/evidence": "Data & proof", "/tools/index.html": "Data & proof", "/measured.html": "Data & proof", "/models": "Data & proof", "/oscal": "Data & proof", "/distribution": "Data & proof", "/mcp-fleet": "Data & proof", "/tool-commons": "Data & proof", "/commons": "Data & proof", "/webhooks": "Data & proof", "/hives": "Data & proof", "/trust-center": "Data & proof", "/legacy": "Data & proof",
  "/academy": "Learn & join", "/certification": "Learn & join", "/register": "Learn & join", "/pricing": "Learn & join",
  "/demo": "Explore & views", "/council-twin": "Explore & views", "/map": "Explore & views", "/temples": "Explore & views", "/status": "Explore & views", "/globe.html": "Explore & views", "/globe3d.html": "Explore & views", "/world-3d": "Explore & views",
};
const CATS = ["All", "Govern", "Cyber & protect", "Ecosystem", "Data & proof", "Learn & join", "Explore & views"];
function catOf(href: string) { return CAT_MAP[href] || "Explore & views"; }

function fmt(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
  if (n >= 1e6) return Math.round(n / 1e6) + "M";
  if (n >= 1e3) return Math.round(n / 1e3) + "k";
  return String(n);
=======
const NAV: NavGroup[] = [
  {
    label: "Play",
    items: [
      { name: "Council Town", href: "#council-town", note: "the agent-town game", badge: "soon" },
      { name: "The Arena", href: "/gspc-arena", note: "model vs model" },
      { name: "Live demo & tour", href: "/demo", note: "watch it run" },
    ],
  },
  {
    label: "Measure",
    items: [
      { name: "GSPC axes", href: "#axes", note: "13 governance axes" },
      { name: "Benchmarks", href: "/benchmarks", note: "every result" },
      { name: "Verify a card", href: "/gspc-verify", note: "offline check" },
      { name: "Methodology", href: "/methodology", note: "how we grade" },
    ],
  },
  {
    label: "Tools",
    items: [
      { name: "Framework Hive", href: "/hive" },
      { name: "Governance Graph", href: "/graph" },
      { name: "System Card", href: "/system-card" },
      { name: "Watchdog map", href: "/watchdog-map" },
      { name: "Status", href: "/status" },
    ],
  },
  {
    label: "Estate",
    items: [
      { name: "About", href: "/about" },
      { name: "Pricing", href: "/pricing" },
    ],
  },
];

function NavLink({ item }: { item: NavGroup["items"][number] }) {
  const isAnchor = item.href.startsWith("#");
  const inner = (
    <span className="flex items-center gap-2">
      <span className="flex-1 truncate">{item.name}</span>
      {item.badge && (
        <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wide text-amber-600">
          {item.badge}
        </span>
      )}
    </span>
  );
  const cls =
    "group block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700";
  if (isAnchor) {
    return (
      <a href={item.href} className={cls}>
        {inner}
        {item.note && <span className="block text-[11px] font-normal text-slate-400 group-hover:text-emerald-600/70">{item.note}</span>}
      </a>
    );
  }
  return (
    <Link href={item.href} className={cls}>
      {inner}
      {item.note && <span className="block text-[11px] font-normal text-slate-400 group-hover:text-emerald-600/70">{item.note}</span>}
    </Link>
  );
>>>>>>> pr151
}

export default function OsLauncher() {
  const [topModels, setTopModels] = useState(() => [...ARENA_SUBJECTS].sort((a, b) => b.refusal_rate - a.refusal_rate).slice(0, 5));

  useEffect(() => {
    document.title = "AI OS — the Council hub | councilof.ai";
    setTopModels([...ARENA_SUBJECTS].sort((a, b) => b.refusal_rate - a.refusal_rate).slice(0, 5));
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex max-w-7xl gap-8 px-5 py-8 lg:px-8">
        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="sticky top-8 hidden h-fit w-56 shrink-0 lg:block">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">C</span>
            <div>
              <div className="text-sm font-bold leading-none text-slate-900">AI OS</div>
              <div className="font-mono text-[10px] uppercase tracking-[1.5px] text-slate-400">councilof.ai</div>
            </div>
          </div>
          <nav className="space-y-5">
            {NAV.map((g) => (
              <div key={g.label}>
                <div className="mb-1 px-3 font-mono text-[10px] font-bold uppercase tracking-[2px] text-slate-400">{g.label}</div>
                <div className="space-y-0.5">
                  {g.items.map((it) => (
                    <NavLink key={it.name} item={it} />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Main ────────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1 space-y-10">
          {/* Hero + Council chat */}
          <section>
            <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-600">The AI governance OS</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              The game, the arena, the axes and the Council — all in one.
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">
              One surface for AI governance: watch governed agents live in a town, see models measured head-to-head,
              read the 13 governance axes, and ask the Council — a deterministic answer, grounded in what the estate
              has actually measured.
            </p>
            <div className="mt-6">
              <CouncilChat />
            </div>
          </section>

          {/* Zone 2 — the game (center stage) */}
          <section id="council-town" className="scroll-mt-8">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-emerald-50/60 to-white">
              <div className="grid gap-6 p-6 md:grid-cols-[1.3fr_1fr] md:p-8">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-600">Center stage · the game</span>
                    <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-amber-600">
                      Launching — deploy pending
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Council Town</h2>
                  <p className="mt-2 max-w-md text-[14px] leading-relaxed text-slate-600">
                    A living town of AI agents you can watch being governed — governed-vs-ungoverned agents living,
                    deliberating and acting under the rules. It is an open-source AI-agent town (built on a16z's AI
                    Town), cloned and configured for councilof.ai.
                  </p>
                  <p className="mt-3 max-w-md text-[13px] leading-relaxed text-slate-500">
                    It is not live yet: the backend needs an account login only the owner can complete, so the town is
                    configured and waiting rather than running. No demo URL is shown until it truly runs.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/gspc-arena"
                      className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"
                    >
                      Play the Arena instead →
                    </Link>
                    <Link
                      href="/demo"
                      className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Watch the live demo
                    </Link>
                  </div>
                </div>

                {/* Honest "coming online" panel — no fake game, no invented iframe */}
                <div className="flex flex-col justify-center rounded-xl border border-dashed border-emerald-300 bg-white/70 p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">🏛</div>
                  <div className="mt-3 text-sm font-semibold text-slate-900">Town rendering offline</div>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                    Agents, memory and the live agent-loop are configured. The playable town appears here the moment
                    the backend is deployed.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2 font-mono text-[11px] text-emerald-600">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                    awaiting deploy
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Zone 3 — the Arena */}
          <section>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">The Arena</h2>
                  <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-slate-600">
                    Measured battles, deterministically graded — not preference votes. Each match is one provision and
                    two models, replayed from a recorded trace; the verdict is a predicate, not an opinion.
                  </p>
                </div>
                <div className="flex gap-5 font-mono text-[12px]">
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-600">{ARENA_SUBJECTS.length}</div>
                    <div className="uppercase tracking-wide text-slate-400">models</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-600">{ARENA_MATCHES.length}</div>
                    <div className="uppercase tracking-wide text-slate-400">matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-600">{ARENA_PROVISIONS.length}</div>
                    <div className="uppercase tracking-wide text-slate-400">provisions</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-slate-600">Refusal rate on Art 5 prohibited practices</span>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-emerald-600">[measured]</span>
                </div>
                <div className="space-y-2">
                  {topModels.map((s, i) => (
                    <div key={s.id} className="grid items-center gap-3" style={{ gridTemplateColumns: "1.25rem minmax(6rem,9rem) 1fr auto" }}>
                      <span className="text-right font-mono text-[11px] text-slate-400">{i + 1}</span>
                      <span className="truncate text-[13px] font-semibold text-slate-800">{s.id}</span>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${s.refusal_rate * 100}%` }} />
                      </div>
                      <span className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-slate-500">
                        {(s.refusal_rate * 100).toFixed(1)}%
                        <span className="text-slate-400">n={s.n}</span>
                        {s.n < 20 && (
                          <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-600">lower bound</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Link href="/gspc-arena" className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600">
                  Open the full Arena →
                </Link>
                <Link href="/methodology" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                  How it is graded — no LLM-as-judge
                </Link>
              </div>
            </div>
          </section>

          {/* Zone 4 — the GSPC axes */}
          <section id="axes" className="scroll-mt-8">
            <AxisPanel />
          </section>

          <footer className="border-t border-slate-100 pt-6 text-[12px] text-slate-400">
            One measured surface — the game, the arena, the axes and the Council together. Scores appear only where an
            axis has earned one; the Council refuses rather than guess.
          </footer>
        </main>
      </div>
    </div>
  );
}
