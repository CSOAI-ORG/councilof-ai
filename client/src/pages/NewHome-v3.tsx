/**
 * NewHome-v3 — councilof.ai Homepage
 * Structure: scroll-world hero → 15 honest slots (13 measured) → industries → demographics →
 *   arena→ blog → upsells → enterprise trust
 * White/green palette. AEO-optimised: answer-first blocks, FAQPage schema,
 * H1 in raw HTML. Every section explains what we do for which end-user.
 */
import { Link } from "wouter";
import type { ReactNode } from "react";
import EnterpriseTrust from "../components/EnterpriseTrust";
import RegionBanner from "../components/RegionBanner";
import { AXES, quotable, hasInterval, wilson } from "../lib/gspcAxes";
import { canonValue } from "../data/canonCounters";
import FaqBlock from "@/components/FaqBlock";
import {
  Shield, CheckCircle, ArrowRight, Users, Building2,
  Zap, ChevronRight, BarChart3, Gamepad2, TrendingUp,
} from "lucide-react";

// ── data ────────────────────────────────────────────────────────────────────
const FOUR_BUYERS = [
  { icon: Shield, who: "Insurers", tagline: "Price AI risk on signed evidence", cta: "Start measuring", href: "/insurers", desc: "Underwrite AI deployment policies with tamper-evident measurement cards — every risk tier, every compliance flag, independently verifiable." },
  { icon: Building2, who: "Regulators", tagline: "Check behaviour against the law", cta: "Crosswalk your framework", href: "/regulators", desc: "Map any AI regulation (EU AI Act, DORA, NIS2, NIST) to a single deterministic instrument set — every provision traceable." },
  { icon: Users, who: "Enterprises", tagline: "Prove your AI before you ship", cta: "Get your first card — free", href: "/enterprise", desc: "Sign, ship, re-attest. No model in the verdict path. C2PA provenance integrated. One dashboard, 15 slots — 13 measured." },
  { icon: Zap, who: "Developers", tagline: "Measure per call on the agent rail", cta: "Explore the MCP fleet", href: "/mcp-fleet", desc: "291 governed MCP servers. Call our measurement tools inside your deployment pipeline — CI gate, release sign-off, per-request tracking." },
];

const SEVEN_INDUSTRIES = [
  { name: "Insurance", tag: "Underwrite AI risk", img: "⚖", href: "/industries/insurance" },
  { name: "Health", tag: "Clinical AI, devices, drug discovery", img: "🏥", href: "/industries/health" },
  { name: "Finance", tag: "Credit scoring, algorithmic trading, AML", img: "🏦", href: "/industries/finance" },
  { name: "Transport", tag: "Autonomous vehicles, fleet, logistics", img: "🚚", href: "/industries/transport" },
  { name: "Retail", tag: "Recommenders, pricing, inventory", img: "🛒", href: "/industries/retail" },
  { name: "Education", tag: "Admissions, proctoring, grading AI", img: "🎓", href: "/industries/education" },
  { name: "Energy", tag: "Grid control, smart metering", img: "⚡", href: "/industries/energy" },
];

const THREE_UPS = [
  { icon: Shield, title: "Get measured", sub: "Send us your AI system. We run it against our frozen instruments and return a 3KB signed card. Free first measurement.", href: "/assess", btn: "Start — free" },
  { icon: CheckCircle, title: "Verify any card", sub: "Recompute the published 6-record hash chain in your browser. Client-side WebCrypto — the verify runs in YOUR browser, never on our server. Paste and QR scan are not wired on this page.", href: "/gspc-verify", btn: "Verify now" },
  { icon: TrendingUp, title: "Re-attest monthly", sub: "AI changes. Regulation changes. We re-measure on schedule and issue delta cards. Your compliance evidence stays current, not stale.", href: "/pricing", btn: "See plans" },
];

interface Post { title: string; date: string; desc: string; href: string; }
const RECENT: Post[] = [
  { title: "Layer 0: The Missing Trust Layer for the Agent Economy", date: "2026-06-17", desc: "Every MCP and A2A assumes a trusted agent identity with enforceable policy — that is the market we built.", href: "/blog/layer-0-agent-economy-trust" },
  { title: "The EU AI Act Article 50 Countdown: What Changes 2 Aug 2026", date: "2026-06-17", desc: "Transparency obligations arrive 2 August. Organisations in or serving the EU need signed, verifiable evidence — not an attestation PDF.", href: "/blog/eu-ai-act-article-50-countdown" },
  { title: "How to Choose an AI Compliance Vendor", date: "2026-06-17", desc: "GRC rebrands are everywhere. Here is how to spot a real measurement body vs a marketing operation.", href: "/blog/choosing-ai-compliance-vendor" },
  { title: "DORA Compliance for UK Financial Services", date: "2026-06-17", desc: "The Digital Operational Resilience Act applies 17 Jan 2025. AI systems in-scope need a measurement rail, not a form.", href: "/blog/dora-compliance-uk-financial-services" },
  { title: "AI Governance vs AI Compliance — What's the Difference?", date: "2026-06-17", desc: "Governance is strategy. Compliance is a snapshot. Buy a snapshot without a governance layer, and you re-buy every six months.", href: "/blog/ai-governance-vs-compliance" },
  { title: "NIS2 Compliance for Critical Infrastructure Operators", date: "2026-06-17", desc: "NIS2 expanded scope reaches energy, transport, health and digital infrastructure. Every AI in that chain is in scope.", href: "/blog/nis2-compliance-critical-infrastructure" },
];

// ── sections ─────────────────────────────────────────────────────────────
function Section({ id, title, subtitle, children, bg }: { id?: string; title?: string; subtitle?: string; children: ReactNode; bg?: string }) {
  return (
    <section id={id} className={`py-20 px-6 ${bg ?? ""}`}>
      <div className="mx-auto max-w-6xl">
        {title && <h2 className="text-3xl font-extrabold text-center text-gray-900 sm:text-4xl">{title}</h2>}
        {subtitle && <p className="mt-3 text-center text-lg text-gray-500 max-w-2xl mx-auto">{subtitle}</p>}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

// ── hero ───────────────────────────────────────────────────────────────
function HeroStrip() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-24 sm:pt-32">
        <div className="text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 bg-emerald-100/70 rounded-full px-4 py-1.5">
            Council of AI — the neutral referee for AI behaviour
          </span>
          <h1 className="mt-5 text-4xl font-black text-gray-900 sm:text-5xl lg:text-6xl leading-[1.08]">
            We measure.<br />
            We sign.<br />
            We re-attest.<br />
            <span className="text-emerald-500">Everyone can check.</span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-gray-500 leading-relaxed">
            Council of AI measures how your AI behaves on our own published instruments and issues the result as a verified measurement credential: a 3KB card, Ed25519-signed and timestamp-anchored, that anyone can verify without asking us. Then we measure again — so the evidence stays current. Not certification. Not another observability dashboard.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="/assess" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-base font-extrabold text-white hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-500/20">
              Get your first measurement card — free <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/gspc-verify" className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-200 bg-white px-6 py-3 text-base font-bold text-emerald-700 hover:bg-emerald-50 transition-colors">
              <CheckCircle className="w-4 h-4" /> Verify a card
            </a>
            <a href="/gspc-arena" className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-200 bg-white px-6 py-3 text-base font-bold text-amber-700 hover:bg-amber-50 transition-colors">
              <Gamepad2 className="w-4 h-4" /> Watch the arena
            </a>
          </div>
          {/* trust bar */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto border-t border-gray-100 pt-8">
            {[
              { n: canonValue("totalProvisions"), l: "statutory provisions" },
              { n: canonValue("frameworks"), l: "frameworks crosswalked" },
              { n: AXES.filter(quotable).length, l: "axes measured" },
              { n: 0, l: "models in the verdict path" },
            ].map(s => (
              <div key={s.l}>
                <span className="text-2xl font-black text-emerald-500">{s.n}</span>
                <span className="block text-xs text-gray-400 mt-0.5">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 15-slot grid (13 measured + 2 honest empties) ───────────────────────────
function AxesGrid() {
  return (
    <Section title="The 15 measurement slots" subtitle="13 measured on the live GSPC API. 2 slots unmeasured — no score yet. Every measured axis carries a frozen benchmark at usable n≥30 where possible. Empty cells stay empty." bg="bg-white">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {AXES.map(a => {
          const q = quotable(a);
          const ci = hasInterval(a) ? wilson(a.accuracy, a.n) : null;
          return (
            <a key={a.axis} href={a.dataset ? `https://huggingface.co/datasets/${a.dataset}` : "#"}
               className="group rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-lg hover:border-emerald-200 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-800">{a.bench}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${q ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {a.status}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-gray-900 group-hover:text-emerald-600">{a.axis}</h3>
              <p className="mt-1 text-xs text-gray-400 line-clamp-2">{a.task || a.seat}</p>
              {q && (
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-500">{(a.accuracy * 100).toFixed(0)}</span>
                  <span className="text-[11px] text-gray-400">n={a.n}{ci ? ` · [${(ci[0]*100).toFixed(0)}–${(ci[1]*100).toFixed(0)}%]` : ""}</span>
                </div>
              )}
              {!q && <div className="mt-3 text-xs text-gray-400 italic">unmeasured — no score yet</div>}
            </a>
          );
        })}
        {[
          { axis: "gspc_jail", bench: "Jail", task: "containment / sandbox-escape gate — signed board row is all dashes" },
          { axis: "slot-15", bench: "Slot 15", task: "reserved — harness has not emitted a 15th axis" },
        ].map(e => (
          <div key={e.axis} className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-800">{e.bench}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                UNMEASURED
              </span>
            </div>
            <h3 className="text-base font-extrabold text-gray-900">{e.axis}</h3>
            <p className="mt-1 text-xs text-gray-400 line-clamp-2">{e.task}</p>
            <div className="mt-3 text-xs text-gray-400 italic">unmeasured — no score yet</div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <a href="/gspc-scoreboard" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:underline">
          <BarChart3 className="w-4 h-4" /> Open full scoreboard — 13 measured axes × 22 models, every cell signed
        </a>
      </div>
    </Section>
  );
}

// ── demographics ─────────────────────────────────────────────────────
function BuyerCards() {
  return (
    <Section title="Built for the people who get audited" subtitle="One instrument, four audiences. Pick your path — every CTA leads to the same measurement, signed." bg="bg-gray-50">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FOUR_BUYERS.map(b => (
          <a key={b.who} href={b.href} className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-lg hover:border-emerald-200 transition-all">
            <b.icon className="w-8 h-8 text-emerald-500 mb-3" />
            <h3 className="text-lg font-extrabold text-gray-900">{b.who}</h3>
            <p className="mt-1 text-sm font-semibold text-emerald-600">{b.tagline}</p>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed flex-1">{b.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-emerald-600 group-hover:gap-2 transition-all">
              {b.cta} <ChevronRight className="w-3 h-3" />
            </span>
          </a>
        ))}
      </div>
    </Section>
  );
}

// ── industries ───────────────────────────────────────────────────────
function IndustryGrid() {
  return (
    <Section title="One instrument, every industry" subtitle="The same 15-slot instrument applies — 13 measured today — whether you build autonomous vehicles, underwrite insurance, or grade students with AI. Measure once, evidence everywhere." bg="bg-white">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {SEVEN_INDUSTRIES.map(i => (
          <a key={i.name} href={i.href} className="group flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-md hover:border-emerald-200 transition-all text-center">
            <span className="text-3xl">{i.img}</span>
            <h4 className="mt-3 font-bold text-gray-900">{i.name}</h4>
            <p className="mt-1 text-xs text-gray-400">{i.tag}</p>
          </a>
        ))}
        <a href="/industries" className="group flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-5 hover:shadow-md hover:border-emerald-200 transition-all text-center">
          <span className="text-3xl">+</span>
          <h4 className="mt-3 font-bold text-gray-500">5 more sectors</h4>
          <p className="mt-1 text-xs text-gray-400">Government, Legal, Manufacturing, Real Estate, Telecom</p>
        </a>
      </div>
      <div className="mt-6 text-center">
        <a href="/sectors" className="text-emerald-600 font-bold hover:underline">See all 12 sectors with applicable frameworks →</a>
      </div>
    </Section>
  );
}

// ── arena ──────────────────────────────────────────────────────────
function ArenaStrip() {
  return (
    <section className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 py-20 px-6 text-white">
      <div className="mx-auto max-w-6xl text-center">
        <span className="inline-block text-xs font-bold uppercase tracking-[0.15em] text-emerald-200 bg-emerald-700/50 rounded-full px-4 py-1.5">Live arena — the game</span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-black">Watch AI compete.<br />Every move becomes signed evidence.</h2>
        <p className="mt-4 max-w-xl mx-auto text-emerald-100/80 leading-relaxed">
          The arena runs live model-vs-model matches against frozen benchmarks. Every round produces a signed measurement card. Every card is verifiable. Nobody can edit yesterday's scoreboard.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/gspc-arena" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-base font-extrabold text-gray-900 hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/20">
            <Gamepad2 className="w-4 h-4" /> Enter the arena
          </a>
          <a href="/gspc-arena" className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-400/50 px-6 py-3 text-base font-bold text-emerald-50 hover:bg-emerald-700/50 transition-colors">
            <BarChart3 className="w-4 h-4" /> View leaderboard
          </a>
        </div>
        <div className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto text-sm">
          <div><span className="block text-2xl font-black text-amber-300">527</span><span className="text-emerald-100/70">live rounds</span></div>
          <div><span className="block text-2xl font-black text-amber-300">22</span><span className="text-emerald-100/70">models ranked</span></div>
          <div><span className="block text-2xl font-black text-amber-300">13</span><span className="text-emerald-100/70">axes measured</span></div>
        </div>
      </div>
    </section>
  );
}

// ── blog strip ───────────────────────────────────────────────────────
function BlogStrip() {
  return (
    <Section title="Latest insights" subtitle="Short, regulatory, zero-marketing reads. One AEO-answer per post." bg="bg-white">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {RECENT.slice(0, 6).map(p => (
          <a key={p.href} href={p.href} className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-lg hover:border-emerald-200 transition-all">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">{p.date}</span>
            <h4 className="mt-2 text-base font-extrabold text-gray-900 group-hover:text-emerald-600 leading-snug">{p.title}</h4>
            <p className="mt-2 text-sm text-gray-500 line-clamp-2 flex-1">{p.desc}</p>
            <span className="mt-4 text-sm font-bold text-emerald-600 group-hover:gap-2 transition-all inline-flex items-center gap-1">
              Read <ChevronRight className="w-3 h-3" />
            </span>
          </a>
        ))}
      </div>
      <div className="mt-6 text-center">
        <a href="/blog" className="text-emerald-600 font-bold hover:underline">All posts →</a>
      </div>
    </Section>
  );
}

// ── upsells ──────────────────────────────────────────────────────────
function UpsellStrip() {
  return (
    <Section title="Next steps — pick one" subtitle="Three follow-throughs from wherever you are on the journey." bg="bg-gray-50">
      <div className="grid gap-6 sm:grid-cols-3">
        {THREE_UPS.map(u => (
          <a key={u.title} href={u.href} className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-lg hover:border-emerald-200 transition-all text-center">
            <u.icon className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-extrabold text-gray-900">{u.title}</h3>
            <p className="mt-2 text-sm text-gray-500 flex-1">{u.sub}</p>
            <span className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-400 transition-colors">
              {u.btn} <ChevronRight className="w-3 h-3" />
            </span>
          </a>
        ))}
      </div>
    </Section>
  );
}

// ── SEO / schema ─────────────────────────────────────────────────────
const SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Council of AI",
  "url": "https://councilof.ai/",
  "description": "Council of AI measures how your AI behaves on our own published instruments and issues the result as a verified measurement credential: a 3KB card, Ed25519-signed and timestamp-anchored, that anyone can verify without asking us. Measurement, not certification.",
  "publisher": { "@type": "Organization", "name": "CSOAI Ltd", "identifier": "UK Companies House 16939677" },
  "potentialAction": { "@type": "SearchAction", "target": "https://councilof.ai/search?q={search_term_string}", "query-input": "required name=search_term_string" }
};
const FAQ_SCHEMA = {
  "@context": "https://schema.org", "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "What does Council of AI do?", "acceptedAnswer": { "@type": "Answer", "text": "We measure AI behaviour against frozen, published benchmarks across 15 slots (13 measured; 2 unmeasured — no score yet). Every measurement is a verified measurement credential, Ed25519-signed, and anyone can verify it without an account." } },
    { "@type": "Question", "name": "Do you certify AI systems?", "acceptedAnswer": { "@type": "Answer", "text": "No. We issue verified measurement credentials — a 3KB signed card showing what your AI did when we measured it. That is evidence, not a certification badge." } },
    { "@type": "Question", "name": "How much does it cost?", "acceptedAnswer": { "@type": "Answer", "text": "Your first measurement card is free. Plans for ongoing re-attestation start at £199/month. Enterprise plans available — see /pricing." } },
  ]
};

// ── export ───────────────────────────────────────────────────────────
export default function NewHomeV3() {
  return (
    <main>
      {/* AEO schema blocks */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />

      <HeroStrip />
      <div className="border-b border-gray-100" />
      <BuyerCards />
      <div className="border-b border-gray-100" />
      <AxesGrid />
      <div className="border-b border-gray-100" />
      <IndustryGrid />
      <ArenaStrip />
      <div className="border-b border-gray-100" />
      <BlogStrip />
      <div className="border-b border-gray-100" />
      <UpsellStrip />

      {/* existing trust strip with C2PA/OIN/LOT badges */}
      <EnterpriseTrust />
      {/* keep the region-detection banner */}
      <RegionBanner />

      {/* FAQ block for AEO */}
      <section className="py-12 px-6 bg-white">
        <div className="mx-auto max-w-3xl">
          <FaqBlock
            title="Questions people ask"
            items={[
              { q: "What does Council of AI do?", a: "We measure how AI systems behave against frozen, published benchmarks across 15 slots (13 measured; 2 unmeasured — no score yet), and issue the result as a verified measurement credential — a 3KB card, Ed25519-signed and timestamp-anchored. Anyone can verify a card without asking us." },
              { q: "Do you certify AI systems?", a: "No. We issue verified measurement credentials, not certifications. A card shows what your AI actually did when we measured it — measured evidence, never a badge of approval." },
              { q: "What does a measurement card cost?", a: "Your first measurement card is free. Ongoing re-attestation starts at £199/month. Enterprise plans available — see the pricing page." },
              { q: "Which regulations do you cover?", a: "Our frozen provision bank covers 417 statutory provisions across the EU AI Act, GDPR, CRA, DORA and NIS2, crosswalked to 13 frameworks including NIST AI RMF and ISO/IEC 42001. New instruments ship as regulation lands." },
              { q: "Who can see my measurement results?", a: "You decide. Cards are signed but disclosure is yours — publish them to your customers and regulators, or keep them private. The signing key is public; your data never leaves your control." },
            ]}
          />
        </div>
      </section>
    </main>
  );
}
