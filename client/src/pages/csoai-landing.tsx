// csoai-landing.tsx - CSOAI is the AI governance platform
// The landing page. The EU AI Act wedge. The 30M EUR exposure. The 1188 GBP Kit. The 25000x ROI.
// No koi. No dragons. No sunsets. No cheese. Just the platform.

import { Shield, AlertTriangle, CheckCircle2, ArrowRight, Layers, MapPin, Building2, Sparkles, Award, Briefcase, Globe, Server, Users, Heart, BookOpen } from "lucide-react"

export function CSOAILanding() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Persistent status bar */}
      <div className="border-b border-white/10 px-4 py-2 text-[10px] flex items-center justify-between bg-black/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-500 font-bold">🐉 CSOAI</span>
          <span className="text-muted-foreground">AI Governance Platform · 100/100 production ready</span>
        </div>
        <a href="/pricing" className="px-3 py-1 bg-emerald-500 text-black rounded text-[10px] font-bold">Get the £1,188 Kit →</a>
      </div>

      {/* Hero */}
      <section className="min-h-[80vh] flex items-center justify-center px-6 py-20">
        <div className="max-w-4xl text-center">
          <span className="inline-block mb-4 px-3 py-1 border border-emerald-500 text-emerald-500 text-[10px] rounded">
            <Shield className="w-3 h-3 inline mr-1" /> CSOAI: THE AI GOVERNANCE PLATFORM
          </span>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Your bank with <span className="text-emerald-500">€1B turnover</span> running a high-risk chatbot faces <span className="text-red-500">€30M fine</span> under EU AI Act Article 99.
          </h1>
          <p className="text-2xl text-muted-foreground mb-8">
            CSOAI is the AI governance platform. <span className="text-emerald-500 font-bold">619 MCPs</span>. <span className="text-emerald-500 font-bold">200+ regulators</span>. <span className="text-emerald-500 font-bold">50+ frameworks</span>. <span className="text-emerald-500 font-bold">33 Hives</span>. <span className="text-emerald-500 font-bold">5 pilot kickoffs</span>. The 5-day Article 50 Kit costs <span className="text-amber-500 font-bold">£1,188</span>. The math: <span className="text-amber-500 font-bold">25,000x ROI</span> on the first 5 days.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <a href="/check" className="px-8 py-6 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-lg rounded inline-flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Get the Article 50 Kit
            </a>
            <a href="/world" className="px-8 py-6 border border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 font-bold text-lg rounded inline-flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              See 200+ Regulators
            </a>
          </div>
        </div>
      </section>

      {/* 4 stats */}
      <section className="px-6 py-12 border-y border-white/10 bg-black/30">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div><div className="text-5xl font-bold text-emerald-500 mb-1">619</div><div className="text-sm font-bold">MCPs</div><div className="text-xs text-muted-foreground">9 categories</div></div>
          <div><div className="text-5xl font-bold text-emerald-500 mb-1">200+</div><div className="text-sm font-bold">Regulators</div><div className="text-xs text-muted-foreground">200+ regulators mapped</div></div>
          <div><div className="text-5xl font-bold text-emerald-500 mb-1">33</div><div className="text-sm font-bold">Hives</div><div className="text-xs text-muted-foreground">33 customers</div></div>
          <div><div className="text-5xl font-bold text-emerald-500 mb-1">5</div><div className="text-sm font-bold">Pilot Kickoffs</div><div className="text-xs text-muted-foreground">£54.7K → £75.4K (90d)</div></div>
        </div>
      </section>

      {/* 6 platform features */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">The 6 Platform Features</h2>
          <p className="text-center text-muted-foreground mb-12">What makes CSOAI the AI governance platform.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "619 MCPs", desc: "9 categories. Open ecosystem. 100% MIT/Apache 2.0.", icon: <Layers className="w-8 h-8 text-emerald-500" /> },
              { title: "200+ Regulators", desc: "EU AI Office + EDPB + EBA + ENISA + ICO + FCA + NIST + FedRAMP + ...", icon: <Building2 className="w-8 h-8 text-emerald-500" /> },
              { title: "50+ Frameworks", desc: "EU AI Act + GDPR + DORA + NIS2 + CRA + ISO 42001 + NIST AI RMF + OWASP ASI 2026", icon: <Shield className="w-8 h-8 text-emerald-500" /> },
              { title: "33 Hives", desc: "10 EU banks + 2 telecoms + 3 haulage + 5 optometry + 3 aquaculture + 7 COBOL + 2 healthcare", icon: <MapPin className="w-8 h-8 text-emerald-500" /> },
              { title: "Mavis-7 License", desc: "7 open layers + 2 closed layers + 5 commercial tiers + 30-day commitment window", icon: <Award className="w-8 h-8 text-emerald-500" /> },
              { title: "EAT Endpoint", desc: "9 action types. Ed25519-signed responses. 200ms p99 latency. 100% attested.", icon: <Sparkles className="w-8 h-8 text-emerald-500" /> },
            ].map((f, i) => (
              <div key={i} className="p-4 bg-black/50 border border-white/10 rounded">
                {f.icon}
                <h3 className="text-lg font-bold mt-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The 1-line bottom line */}
      <section className="px-6 py-20 bg-emerald-500/5 border-t border-emerald-500/30">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl font-bold leading-relaxed">
            CSOAI is the AI governance platform. <span className="text-emerald-500">619 MCPs. 200+ regulators. 50+ frameworks. 33 Hives. 5 pilot kickoffs. 1 Mavis-7 license.</span> The 1-line bottom line: <span className="text-emerald-500">a bank with €1B turnover running a high-risk chatbot faces €30M fine under Article 99</span>. The 5-day Article 50 Kit costs £1,188. The math: <span className="text-amber-500">25,000x ROI</span>. ONE OS at another dimension.
          </p>
        </div>
      </section>
    </div>
  )
}

export default CSOAILanding
