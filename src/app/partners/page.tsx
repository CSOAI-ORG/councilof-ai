import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner Program — CSOAI / MEOK AI Labs",
  description:
    "White-label compliance attestations, co-deliver sector templates, integrate Layer 0 checks into GRC tooling. 20–30% partner margin on referred business.",
  alternates: { canonical: "/partners" },
};

const capabilities = [
  { name: "Ed25519-signed attestations", benefit: "Tamper-evident, regulator-ready evidence" },
  { name: "Public verify endpoint", benefit: "Clients verify without a CSOAI login" },
  { name: "234+ MCP servers", benefit: "Pre-built tools across EU AI Act, DORA, NIS2, GDPR, ISO 42001" },
  { name: "BFT sovereign council", benefit: "No single point of failure in high-stakes decisions" },
  { name: "Open APIs and specs", benefit: "Easy integration, no vendor lock-in" },
];

const idealPartners = [
  "GRC consultancies advising on EU AI Act / UK AI Bill",
  "System integrators deploying agentic solutions",
  "Regulated enterprises seeking compliance tooling",
  "AI safety organisations needing verification infrastructure",
];

export default function PartnersPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "CSOAI Partner Program",
    url: "https://csoai.org/partners",
    description: "Partner with CSOAI to white-label, refer and integrate Layer 0 compliance.",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
          <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-6">
            Partner Program
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-6">
            Build on Layer 0
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            AI agents are being deployed across regulated industries without a standard trust layer.
            Partner with CSOAI to deliver the open, sovereign, runtime-enforceable Layer 0 your
            clients need.
          </p>
        </div>
      </section>

      <section className="py-20 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tighter mb-6">The opportunity</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "White-label compliance attestations for client engagements",
              "Refer the Article 50 Kit to EU AI Act-affected customers",
              "Co-deliver sector-specific compliance templates",
              "Integrate Layer 0 checks into existing GRC tooling",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5"
              >
                <span className="text-emerald-400 mt-1">✓</span>
                <span className="text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-white/5 bg-slate-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tighter mb-10">What we provide</h2>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            {capabilities.map((c, idx) => (
              <div
                key={c.name}
                className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-8 p-5 ${
                  idx !== capabilities.length - 1 ? "border-b border-white/10" : ""
                } ${idx % 2 === 0 ? "bg-white/[0.02]" : "bg-white/[0.04]"}`}
              >
                <div className="sm:w-1/2 font-bold">{c.name}</div>
                <div className="sm:w-1/2 text-slate-400">{c.benefit}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tighter mb-6">Commercial model</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { name: "Article 50 Kit", price: "£999 one-time" },
              { name: "Professional", price: "£199/mo" },
              { name: "Enterprise", price: "£999+/mo custom" },
              { name: "Partner margin", price: "20–30%" },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center"
              >
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                  {t.name}
                </p>
                <p className="text-xl font-black text-emerald-400">{t.price}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-400">White-label pricing is available on request.</p>
        </div>
      </section>

      <section className="py-20 border-b border-white/5 bg-slate-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tighter mb-6">Ideal partners</h2>
          <div className="space-y-3">
            {idealPartners.map((p) => (
              <div key={p} className="flex items-center gap-3 text-slate-300">
                <span className="text-emerald-400">→</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-8 sm:p-12">
            <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4">
              Now open
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-6">
              Aethelgard Design Partner Pilot
            </h2>
            <p className="text-lg text-slate-300 mb-6 max-w-2xl">
              We are recruiting 3–5 partners to stress-test the live 3D BFT governance town ahead of the EU AI Act Article 50 deadline. 8 weeks, non-binding LOI, early API access, co-branded readiness assets, and preferential pricing.
            </p>
            <ul className="grid sm:grid-cols-2 gap-3 mb-8 text-slate-300">
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> GRC consultancies</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> System integrators</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Regulated enterprises</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> AI safety organisations</li>
            </ul>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://try.meok.ai/town-3d"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition"
              >
                See the live town →
              </a>
              <a
                href="mailto:partnerships@meok.ai?subject=Aethelgard%20Design%20Partner%20Pilot"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-bold transition"
              >
                Apply for the pilot
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-6">
              Become a partner
            </h2>
            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              Book a 30-minute partner call or email partnerships@meok.ai.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://meok.ai/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition"
              >
                Book a partner call →
              </a>
              <a
                href="mailto:partnerships@meok.ai"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-bold transition"
              >
                Email partnerships@meok.ai
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
