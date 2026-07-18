"use client";
import { useState } from "react";
import Link from "next/link";
import HeroBadge from "./components/HeroBadge";

function EmailCapture({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, source }) });
    if (res.ok) setStatus("success");
    else setStatus("error");
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-emerald-500" required />
      <button type="submit" disabled={status === "loading"} className="px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition disabled:opacity-50">
        {status === "loading" ? "..." : "Get Early Access"}
      </button>
      {status === "success" && <p className="text-emerald-400 text-sm w-full">You are on the list. We will be in touch.</p>}
      {status === "error" && <p className="text-red-400 text-sm w-full">Something went wrong. Please try again.</p>}
    </form>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      {/* Launch announcement banner */}
      <div className="bg-emerald-500 text-slate-950 py-2 px-4 text-center text-sm font-semibold">
        🚀 Milestone: the 47-agent AI town is now live in 3D with real attested governance data.{" "}
        <Link href="https://try.meok.ai/town-3d" className="underline hover:text-slate-800">
          Enter the town →
        </Link>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://csoai.org/#org",
                name: "CSOAI",
                url: "https://csoai.org",
                description:
                  "CSOAI — sovereign AI compliance and governance: EU AI Act Article 50 kits, the Council, and the MCP compliance stack.",
              },
              {
                "@type": "WebSite",
                "@id": "https://csoai.org/#website",
                url: "https://csoai.org",
                name: "CSOAI",
                publisher: { "@id": "https://csoai.org/#org" },
              },
            ],
          }),
        }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 border-b border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HeroBadge />
          <h1 className="text-5xl sm:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            CSOAI IS <br/>
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              LAYER 0
            </span>
          </h1>
          <p className="text-lg sm:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
            Google built coordination. Stripe built checkout. Anthropic built tools. <br className="hidden sm:block"/>
            <span className="text-white">CSOAI built the foundation.</span> Layer 0 identity, runtime policy enforcement, and a 47-agent governance simulation engine.
          </p>
          <div className="flex flex-col items-center justify-center gap-6">
            <EmailCapture source="hero" />
            <div className="flex items-center gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <span>475 GitHub Repos</span>
              <span className="w-1 h-1 bg-slate-800 rounded-full" />
              <span>14 PyPI Packages</span>
              <span className="w-1 h-1 bg-slate-800 rounded-full" />
              <span>13 Compliance Frameworks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Governance by Simulation */}
      <section id="town" className="py-32 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-3">The 47-Agent Town</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-6">
                Simulate governance before it becomes law.
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                Compliance platforms check boxes. CSOAI runs a living AI town where 47 autonomous agents govern 12
                industry domains — generating behavioural governance data no competitor can copy.
              </p>
              <ul className="space-y-3 mb-8 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400">→</span>
                  <span>Test EU AI Act scenarios before the deadline.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400">→</span>
                  <span>Model cross-border regulatory handoffs in real time.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400">→</span>
                  <span>Produce white papers and investor demos from live simulation output.</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="https://try.meok.ai/town-3d"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition"
                >
                  Enter 3D Town →
                </Link>
                <Link
                  href="/sovereign-town"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-bold transition"
                >
                  Explore Sovereign Town →
                </Link>
                <Link
                  href="/blog/launch-47-agent-town"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-medium transition"
                >
                  Read the launch post
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "47", label: "Autonomous agents" },
                { value: "12", label: "Industry domains" },
                { value: "1,000+", label: "Scenarios" },
                { value: "0", label: "Competitors" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center aspect-square"
                >
                  <p className="text-3xl font-black text-emerald-400">{s.value}</p>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The CSOAI Council — the live substrate */}
      <section id="council" className="py-32 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-3">The Council substrate</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-6">
                The independent authority that certifies AI is safe.
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                CSOAI sets the safety expectations, maintains the crosswalks
                between 20+ governance frameworks, and issues{" "}
                <strong className="text-white">Watchdog Certification</strong>:
                a cryptographically signed safety attestation with a public
                verify URL your regulator, customer or auditor checks{" "}
                <em>without contacting us</em>. Independence is the product.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-2xl font-black text-emerald-400">36</p>
                  <p className="text-xs text-slate-500">Council nodes (BFT)</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-2xl font-black text-cyan-400">235</p>
                  <p className="text-xs text-slate-500">Architecture nodes</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-2xl font-black text-violet-400">12</p>
                  <p className="text-xs text-slate-500">Expertise domains</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-2xl font-black text-amber-400">6</p>
                  <p className="text-xs text-slate-500">Legal regions</p>
                </div>
              </div>
              <Link
                href="/council"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition"
              >
                Enter the Council →
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { name: "Dome", desc: "12-domain expertise map", href: "/council/dome", color: "cyan" },
                { name: "Maps", desc: "36-node council graph + bridges", href: "/council/maps", color: "violet" },
                { name: "Compliance", desc: "13 frameworks · live posture", href: "/council/compliance", color: "emerald" },
                { name: "Law", desc: "Region-aware lookup (EU/UK/US/CA/APAC)", href: "/council/law", color: "amber" },
                { name: "Sigil", desc: "Agent language · live demo", href: "/council/sigil", color: "rose" },
              ].map((s) => (
                <Link
                  key={s.name}
                  href={s.href}
                  className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition"
                >
                  <div>
                    <p className="font-bold">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.desc}</p>
                  </div>
                  <span className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The 8 Layers Grid */}
      <section id="layers" className="py-32 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20">
            <h2 className="text-4xl font-bold mb-4">The 8 Layers of Trust</h2>
            <p className="text-slate-400 max-w-2xl">The missing identity and compliance foundation for AI agents, from W3C DIDs to Legacy Mainframe bridges.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: "L0-A", title: "Identity", desc: "did:csoai (W3C DID v1.1 + IETF AIP)" },
              { id: "L0-B", title: "Certification", desc: "Watchdog Certificates (Ed25519 + BFT-style council)" },
              { id: "L0-C", title: "Policy Engine", desc: "Plan-Do-Check-Act Runtime (<0.1ms latency)" },
              { id: "L0-D", title: "Cross-Regional", desc: "Agent-to-Agent Handoff (EU/US/UK/CN/SG/KR)" },
              { id: "L0-E", title: "Payments", desc: "Compliance Pre-Check (HTTP 402 + Agent Commerce Protocol)" },
              { id: "L0-F", title: "Audit", desc: "Cryptographic anchoring with Ed25519 attestations" },
              { id: "L0-G", title: "Human Loop", desc: "Byzantine-style Council Consensus" },
              { id: "L0-H", title: "Legacy", desc: "COBOL/Mainframe to Agent Bridge" }
            ].map((layer) => (
              <div key={layer.id} className="group p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all duration-300">
                <div className="text-emerald-500 font-bold text-xs tracking-widest mb-4 opacity-50 group-hover:opacity-100 transition-opacity">{layer.id}</div>
                <h3 className="text-xl font-bold mb-2">{layer.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{layer.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MCP Packs Teaser */}
      <section id="mcp-packs" className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Premium MCP Packs</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Monetizing 475 open-source assets into production-ready governance bundles. Secure your agents with curated server packs for Finance, Healthcare, and the EU AI Act.
              </p>
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">✓</div>
                  <span>Article 50 Transparency kit</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">✓</div>
                  <span>Agentic Finance Pre-check</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">✓</div>
                  <span>Global BFT Governance Mesh</span>
                </div>
              </div>
              <Link
                href="/mcp-packs"
                className="inline-flex px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20"
              >
                Browse MCP Packs
              </Link>
            </div>
            <div className="p-2 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10 aspect-square flex items-center justify-center">
               <div className="text-8xl font-black text-white/10">LAYER 0</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 border-t border-white/5 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Certification Tiers</h2>
            <p className="text-slate-400">From £1 smoke tests to full-stack institutional governance.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col">
              <div className="mb-8">
                <h3 className="text-slate-400 font-bold text-xs tracking-widest uppercase mb-4">Entry Level</h3>
                <div className="text-4xl font-bold">£1 <span className="text-lg font-normal text-slate-500">/scan</span></div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {["Smoke Test Scan", "OWASP Top 10 Check", "Basic PDF Report"].map((item) => (
                  <li key={item} className="flex items-center text-sm text-slate-300 gap-2"><span className="text-emerald-500">✓</span>{item}</li>
                ))}
              </ul>
              <Link
                href="https://proofof.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 transition font-bold"
              >
                Start Scan
              </Link>
            </div>
            <div className="p-8 rounded-3xl bg-emerald-500 text-slate-950 flex flex-col relative scale-105 shadow-2xl shadow-emerald-500/20">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-slate-950 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-xl">Recommended</div>
              <div className="mb-8">
                <h3 className="font-bold text-xs tracking-widest uppercase mb-4 opacity-70">Standard Certification</h3>
                <div className="text-4xl font-bold">£199 <span className="text-lg font-normal opacity-70">/mo</span></div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {["did:csoai Identity", "Watchdog Certificate", "PDCA Runtime Engine", "Public Verification", "Stripe ACP Tunnel"].map((item) => (
                  <li key={item} className="flex items-center text-sm font-bold gap-2"><span className="opacity-70">✓</span>{item}</li>
                ))}
              </ul>
              <Link
                href="https://buy.stripe.com/00wfZjbcw9ACcIBfL28k91K"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center w-full py-4 rounded-xl bg-slate-950 text-white hover:opacity-90 transition font-bold"
              >
                Get Certified
              </Link>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col">
              <div className="mb-8">
                <h3 className="text-slate-400 font-bold text-xs tracking-widest uppercase mb-4">Emergency Kit</h3>
                <div className="text-4xl font-bold">£999 <span className="text-lg font-normal text-slate-500">/one-time</span></div>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {["Art. 50 Transparency", "Risk Classification", "Human Oversight Plan", "Audit Log Setup", "Deadline Guarantee"].map((item) => (
                  <li key={item} className="flex items-center text-sm text-slate-300 gap-2"><span className="text-emerald-500">✓</span>{item}</li>
                ))}
              </ul>
              <Link
                href="/article-50-kit"
                className="block text-center w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 transition font-bold"
              >
                Secure Art. 50
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
