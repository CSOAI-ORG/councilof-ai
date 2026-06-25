import { useEffect, useMemo, useState } from "react";

// OpenGridWorks OS — the unified launcher. One surface where an end user opens every
// CSOAI governance tool working together: the live Sovereign Town heartbeat, the Layer 0
// status, and a launchpad of every app. This is os.csoai.org's home.

type App = { name: string; desc: string; href: string; glyph: string; tone: string; ext?: boolean };

const APPS: App[] = [
  { name: "Sovereign Town", desc: "The signed record of AI governance — governed vs ungoverned, live.", href: "/sovereign-town", glyph: "▦", tone: "from-amber-500/20 to-amber-400/5 border-amber-400/30" },
  { name: "Command Center", desc: "Your whole governance program on one screen.", href: "/command-center", glyph: "◉", tone: "from-emerald-500/20 to-emerald-400/5 border-emerald-400/30" },
  { name: "Layer 0 Protocol", desc: "The 8 trust controls every governed agent stands on.", href: "/layer0", glyph: "▥", tone: "from-amber-500/20 to-amber-400/5 border-amber-400/30" },
  { name: "Regulation Atlas", desc: "Live AI law across 40+ jurisdictions — what applies, what to do.", href: "/global-regulations", glyph: "❖", tone: "from-teal-500/20 to-teal-400/5 border-teal-400/30" },
  { name: "Readiness Check", desc: "Free 2-minute AI governance maturity assessment.", href: "/readiness-assessment", glyph: "✓", tone: "from-emerald-500/20 to-emerald-400/5 border-emerald-400/30" },
  { name: "Framework Crosswalks", desc: "One control set mapped across EU AI Act, NIST, ISO 42001, TC260.", href: "/crosswalks", glyph: "⇄", tone: "from-blue-500/20 to-blue-400/5 border-blue-400/30" },
  { name: "MCP Fleet", desc: "216 governed MCP servers across 10 hives — Layer 0 wrapped.", href: "/mcp-fleet", glyph: "⊟", tone: "from-emerald-500/20 to-emerald-400/5 border-emerald-400/30" },
  { name: "Hive Grid", desc: "Every tool a hive with a sovereign queen — learning, aware, ensembled.", href: "/hives", glyph: "⬡", tone: "from-violet-500/20 to-violet-400/5 border-violet-400/30" },
  { name: "Distribution", desc: "Every endpoint we ship to — PyPI, npm, glama, mcpize, GitHub — with Layer 0 coverage.", href: "/distribution", glyph: "⌖", tone: "from-teal-500/20 to-teal-400/5 border-teal-400/30" },
  { name: "Immersive Globe", desc: "177 jurisdictions, sovereign nodes, agent swarm — one Earth.", href: "/globe.html", glyph: "◍", tone: "from-teal-500/20 to-teal-400/5 border-teal-400/30", ext: true },
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

function fmt(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
  if (n >= 1e6) return Math.round(n / 1e6) + "M";
  if (n >= 1e3) return Math.round(n / 1e3) + "k";
  return String(n);
}

export default function OsLauncher() {
  const [ep, setEp] = useState(1446621120);
  const [ung, setUng] = useState(121043036);
  const [live, setLive] = useState(false);
  const [ring, setRing] = useState(0);

  useEffect(() => {
    document.title = "OpenGridWorks OS — CSOAI";
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

  return (
    <div className="min-h-screen bg-[#05080e] text-[#e7f6ef]" style={{ backgroundImage: "radial-gradient(1200px 600px at 50% -10%, rgba(16,185,129,0.10), transparent 60%)" }}>
      {/* top status bar */}
      <header className="flex flex-wrap items-center gap-4 border-b border-emerald-500/15 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-2 font-semibold">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 12px #34d399" }} />
          OpenGridWorks <span className="text-emerald-300/70 font-mono text-[11px] uppercase tracking-[2px]">OS</span>
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
            <p className="mt-4 max-w-xl text-emerald-50/80">
              Every CSOAI tool, one surface. Watch the governed‑vs‑ungoverned moat in real time, then launch any
              app — all standing on one signed Layer 0 floor, externally anchored to Bitcoin.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/certification" className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Get certified →</a>
              <a href="/globe.html" className="rounded-lg border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Launch the globe</a>
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
              <div className="text-[11px] text-emerald-100/50">Article 50 readiness</div>
              <div className="mt-1 text-[11px] text-emerald-100/40">Layer 0 · 8 controls</div>
            </div>
          </div>
        </div>
      </section>

      {/* app launchpad */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Applications</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {APPS.map((a) => (
            <a
              key={a.name}
              href={a.href}
              {...(a.ext ? {} : {})}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${a.tone} p-5 transition hover:scale-[1.015] hover:shadow-[0_0_30px_-8px_rgba(16,185,129,0.35)]`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/30 text-xl text-emerald-200">{a.glyph}</div>
                <div className="flex-1">
                  <div className="font-semibold text-white">{a.name} <span className="opacity-0 transition group-hover:opacity-100">→</span></div>
                  <p className="mt-1 text-[13px] leading-snug text-emerald-50/70">{a.desc}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-5 text-sm text-emerald-100/60">
          One signed floor under every endpoint — sites, MCP servers, packages, plugins and tools — governed by
          Layer 0 and verifiable offline. <span className="text-emerald-300">This is the substrate, not just a site.</span>
        </div>
      </section>
    </div>
  );
}
