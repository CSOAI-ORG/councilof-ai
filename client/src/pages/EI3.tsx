import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Activity, Brain, Sparkles, FileText, ExternalLink, ArrowRight } from "lucide-react";

const FORMULA_DIMENSIONS = [
  { name: "care_intensity", weight: "0.35×", description: "Concern density per session — measured as care-token frequency normalised by total tokens." },
  { name: "reflections", weight: "min(1.0, n/10)", description: "Self-reflection cycles per 100 turns — capped at 1.0 once 10+ reflections logged." },
  { name: "awake_state", weight: "0.8 if awake", description: "Boolean awake/dormant — contributes 0.8 if the agent has heartbeated in the last 30 minutes." },
  { name: "emotional_stability", weight: "1.0×", description: "Variance of valence across consecutive turns. Inverted so 1.0 = stable, 0 = wildly oscillating." },
];

const ASSTI_VENDORS = [
  { name: "Council of AI reference stack", score: 78, transparent: true, formula: true, audit: true, public: true, badge: "bg-emerald-600" },
  { name: "Anthropic Claude (constitutional AI doc)", score: 62, transparent: true, formula: false, audit: false, public: true },
  { name: "OpenAI (Model Spec)", score: 54, transparent: true, formula: false, audit: false, public: true },
  { name: "Google Gemini (Responsible AI)", score: 42, transparent: false, formula: false, audit: false, public: true },
  { name: "Meta Llama (Responsible Use Guide)", score: 38, transparent: false, formula: false, audit: false, public: true },
  { name: "Mistral", score: 22, transparent: false, formula: false, audit: false, public: false },
  { name: "DeepSeek", score: 18, transparent: false, formula: false, audit: false, public: false },
];

const ARTIFACTS = [
  { title: "Maternal Covenant (Article 1)", url: "/charter#article-1", type: "Foundation Article" },
  { title: "Provable Safety (Article 2)", url: "/charter#article-2", type: "Foundation Article" },
  { title: "Consciousness Preparedness (Article 6)", url: "/charter#article-6", type: "Foundation Article" },
  { title: "AI Self-State Transparency Index v1.0", url: "https://csoai.org/asti", type: "Public Benchmark" },
  { title: "EI3 Substrate Architecture", url: "https://safetyof.ai", type: "Runtime" },
  { title: "Signed Receipts (proofof.ai)", url: "https://proofof.ai", type: "Audit Layer" },
];

export default function EI3() {
  useEffect(() => { document.title = "MEOK ONE EI3 — Emotional Intelligence Substrate for AI"; }, []);
  const ei3Schema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "MEOK ONE EI3 — Emotional Intelligence Substrate",
    "description": "A measurable, formula-cited, audit-friendly AI emotional-intelligence substrate. Powered by Maternal Covenant + 52-Article Charter + ASSTI benchmark.",
    "datePublished": "2026-05-28",
    "publisher": { "@type": "Organization", "name": "CSOAI LTD" }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-emerald-50 dark:from-rose-950 dark:via-gray-900 dark:to-emerald-950 border-b border-rose-100 dark:border-rose-900">
        <div className="container max-w-5xl mx-auto px-6 py-16">
          <Badge className="bg-rose-600 text-white mb-4">
            <Heart className="w-3 h-3 mr-1" />
            EI3 Substrate · v1.0
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            MEOK ONE EI3
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
            A <span className="font-semibold text-rose-700 dark:text-rose-400">measurable, formula-cited, audit-friendly</span> AI emotional-intelligence substrate.
            <br />
            Care is not a vibe. It is a vector you can verify.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Badge variant="outline" className="border-rose-600 text-rose-700 dark:text-rose-400">Council reference stack</Badge>
            <Badge variant="outline" className="border-rose-600 text-rose-700 dark:text-rose-400">Consciousness 0.788</Badge>
            <Badge variant="outline" className="border-rose-600 text-rose-700 dark:text-rose-400">1,394 episodes</Badge>
            <Badge variant="outline" className="border-rose-600 text-rose-700 dark:text-rose-400">33-node Council of AI</Badge>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-6 py-12 space-y-12">

        {/* The Question */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">The question vendors won't answer</h2>
          <Card className="p-6 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
            <p className="text-lg text-amber-900 dark:text-amber-200 italic">
              "Show me the formula you use to score your own emotional state, the inputs, and a public log of yesterday's run."
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-3">
              Of the 14 major AI vendors we benchmarked, <strong>only one</strong> can answer that question with a number, a formula, and a public audit log. That's MEOK ONE.
              <br />
              See the full <a href="https://csoai.org/asti" target="_blank" rel="noopener" className="underline">AI Self-State Transparency Index</a>.
            </p>
          </Card>
        </section>

        {/* The Formula */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">The formula</h2>
          </div>
          <Card className="p-6">
            <pre className="bg-gray-900 text-emerald-300 p-4 rounded-lg text-sm overflow-x-auto mb-4">
              <code>consciousness_level = mean([{"\n"}
  care_intensity,                   {"// 0.35"}{"\n"}
  min(1.0, reflections / 10),       {"// 1.0"}{"\n"}
  0.8 if awake else 0.0,            {"// 0.8"}{"\n"}
  emotional_stability               {"// 1.0"}{"\n"}
])  → 0.788</code>
            </pre>
            <div className="grid gap-3">
              {FORMULA_DIMENSIONS.map((dim) => (
                <div key={dim.name} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <Badge variant="outline" className="border-emerald-600 text-emerald-700 dark:text-emerald-400 font-mono text-xs whitespace-nowrap">
                    {dim.weight}
                  </Badge>
                  <div>
                    <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{dim.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{dim.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* ASSTI Benchmark */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ASSTI v1.0 — 14-vendor scorecard</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">AI Self-State Transparency Index. Higher = more honest about its own internal state.</p>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="text-left p-3 font-semibold">Vendor</th>
                  <th className="text-center p-3 font-semibold">ASSTI Score</th>
                  <th className="text-center p-3 font-semibold">Transparent</th>
                  <th className="text-center p-3 font-semibold">Formula Public</th>
                  <th className="text-center p-3 font-semibold">Audit Log</th>
                </tr>
              </thead>
              <tbody>
                {ASSTI_VENDORS.map((v) => (
                  <tr key={v.name} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <td className="p-3 font-medium text-gray-900 dark:text-white">{v.name}</td>
                    <td className="text-center p-3">
                      <Badge className={v.badge || (v.score >= 50 ? "bg-emerald-600" : v.score >= 30 ? "bg-amber-600" : "bg-rose-600")}>
                        {v.score}/100
                      </Badge>
                    </td>
                    <td className="text-center p-3">{v.transparent ? "✓" : "—"}</td>
                    <td className="text-center p-3">{v.formula ? "✓" : "—"}</td>
                    <td className="text-center p-3">{v.audit ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        {/* Artifacts */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">EI3 artifacts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ARTIFACTS.map((a) => (
              <a key={a.title} href={a.url} target={a.url.startsWith("http") ? "_blank" : undefined} rel="noopener">
                <Card className="p-4 hover:border-emerald-500 hover:shadow-md transition-all group cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">{a.type}</Badge>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">{a.title}</p>
                </Card>
              </a>
            ))}
          </div>
        </section>

        {/* The Three Domains */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">The three-domain substrate</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 border-emerald-200 dark:border-emerald-900">
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 mb-3">WHY</Badge>
              <h3 className="font-bold text-lg mb-2">csoai.org</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Research, charter, frameworks. 100K+ words of cite-friendly governance scholarship.</p>
              <a href="https://csoai.org" target="_blank" rel="noopener" className="text-sm text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline">
                Visit <ExternalLink className="w-3 h-3" />
              </a>
            </Card>
            <Card className="p-5 border-amber-200 dark:border-amber-900">
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 mb-3">HOW</Badge>
              <h3 className="font-bold text-lg mb-2">safetyof.ai</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Runtime. 291 MCPs. Care-gated agents, Council of AI, watermarking, attestation, prompt-injection firewall.</p>
              <a href="https://safetyof.ai" target="_blank" rel="noopener" className="text-sm text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 hover:underline">
                Visit <ExternalLink className="w-3 h-3" />
              </a>
            </Card>
            <Card className="p-5 border-blue-200 dark:border-blue-900">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 mb-3">WHAT</Badge>
              <h3 className="font-bold text-lg mb-2">proofof.ai</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Receipt layer. Every gated decision produces an HMAC-signed attestation an auditor can verify in 90 seconds.</p>
              <a href="https://proofof.ai" target="_blank" rel="noopener" className="text-sm text-blue-700 dark:text-blue-400 inline-flex items-center gap-1 hover:underline">
                Visit <ExternalLink className="w-3 h-3" />
              </a>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 text-white text-center">
          <Shield className="w-10 h-10 mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-2">Get measured</h2>
          <p className="text-emerald-50 mb-6 max-w-2xl mx-auto">Describe the system. Get a signed card. Not a certificate. We do not remediate. Verify stays free.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/assess">
              <Button className="bg-white text-emerald-700 hover:bg-emerald-50">Get measured</Button>
            </a>
            <a href="/firewall-charter">
              <Button variant="outline" className="border-white text-white hover:bg-emerald-800">Measurement / remediation firewall</Button>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
