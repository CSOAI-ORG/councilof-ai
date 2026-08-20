/**
 * NewHome-v3 — councilof.ai Homepage
 * Structure: scroll-world hero → 15 honest slots (13 measured) → industries → demographics →
 *   arena→ blog → upsells → enterprise trust
 * White/green palette. AEO-optimised: answer-first blocks, FAQPage schema,
 * H1 in raw HTML. Every section explains what we do for which end-user.
 */
import type { ReactNode } from "react";
import EnterpriseTrust from "../components/EnterpriseTrust";
import RegionBanner from "../components/RegionBanner";
import { AXES, quotable, hasInterval, wilson } from "../lib/gspcAxes";
import FaqBlock from "@/components/FaqBlock";
import StoryWorld from "@/components/home/StoryWorld";
import LivingStages from "@/components/home/LivingStages";
import {
  Shield, CheckCircle, Users, Building2,
  Zap, ChevronRight, BarChart3, Gamepad2, TrendingUp,
  Eye, FileCheck, RefreshCw, Ban, Landmark, Scale,
} from "lucide-react";

// ── data ────────────────────────────────────────────────────────────────────
const FOUR_BUYERS = [
  { icon: Shield, who: "Insurers", tagline: "Price AI risk on measured evidence", cta: "Start measuring", href: "/insurers", desc: "Underwrite AI deployment policies with measurement cards. A 14-slot board: 13 measured axes across 19 models, plus jail (containment, 18 Aug, smaller fleet). Signed stamp. Verify at GET councilof.ai/api/gspc." },
  { icon: Building2, who: "Regulators", tagline: "Check behaviour against the law", cta: "Crosswalk your framework", href: "/regulators", desc: "Map any AI regulation (EU AI Act, DORA, NIS2, NIST) to a single deterministic instrument set — every provision traceable." },
  { icon: Users, who: "Enterprises", tagline: "Prove your AI before you ship", cta: "Get your first card — free", href: "/enterprise", desc: "Sign, ship, re-attest. No model in the verdict path. C2PA provenance integrated. 13 measured of 14 — including the axis that catches our own models." },
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
  { icon: CheckCircle, title: "Verify any card", sub: "Recompute the published hash chain in your browser. No account. The verify runs on your machine, not ours.", href: "/gspc-verify", btn: "Verify now" },
  { icon: TrendingUp, title: "Re-attest on schedule", sub: "AI changes. Regulation changes. We re-measure on schedule and issue delta cards. Your compliance evidence stays current, not stale — the rail is free.", href: "/pricing", btn: "How it works" },
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

// ── 14-slot registry grid (13 measured + honest empty cells) ───────────────────────────

// ── problem we fix ───────────────────────────────────────────────────
function ProblemStrip() {
  return (
    <Section
      id="problem"
      title="The problem we fix"
      subtitle="Assertions are cheap. Proof is not. Buyers and regulators are asked to trust a PDF."
      bg="bg-white"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-7">
          <p className="text-[11px] font-bold uppercase tracking-widest text-rose-600">What they sell you</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">A claim you cannot recompute</h3>
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            <li>A vendor says the model is safe, aligned, or compliant.</li>
            <li>The evidence is a slide, a badge, or a private report.</li>
            <li>You cannot run the same test. You cannot see what was left unmeasured.</li>
            <li>Six months later the model has changed and the PDF has not.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-7">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">What we issue</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">A card anyone can check</h3>
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            <li>We run the system on frozen, published instruments.</li>
            <li>We sign the result. You keep the 3KB card.</li>
            <li>Unmeasured slots stay empty. No invented scores.</li>
            <li>Re-attest is a new record, never an edit of the old one.</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}

const USPS = [
  { icon: FileCheck, title: "Signed measurement card", body: "Ed25519-signed, 3KB. First card is free. Verify stays free and loginless.", href: "/assess" },
  { icon: Eye, title: "Anyone can check", body: "The verify path is public. We do not put it behind an account or a fee.", href: "/gspc-verify" },
  { icon: Scale, title: "Honest board: 13 measured of 14", body: "13 measured of 14 on the live GSPC board. Jail is a measured floor (empty on this stamp). Live counts: GET /api/gspc.", href: "/gspc-scoreboard" },
  { icon: Gamepad2, title: "Council Space", body: "The live contest. Model versus model. Every round is evidence, not a brochure.", href: "/gspc-arena" },
  { icon: Landmark, title: "Council City", body: "The living layer. Districts emit the same signed atom. Not a dashboard website.", href: "/gspc-arena?view=towns" },
  { icon: RefreshCw, title: "Re-attest, never edit", body: "A new signed record. History stays. Drift is visible.", href: "/methodology" },
  { icon: Ban, title: "No money from what we rank", body: "We do not sell ratings and we do not take a cut from anything on the board.", href: "/methodology" },
  { icon: Shield, title: "Measurement credential", body: "Not a certification. Not a notified body. We measure, sign, and keep the evidence.", href: "/gspc-verify" },
];

function UspGrid() {
  return (
    <Section
      id="usps"
      title="What you actually get"
      subtitle="The product is the stack: measure, sign, live contest, living layer. The scoreboard is how people cite it."
      bg="bg-gray-50"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {USPS.map(u => (
          <a key={u.title} href={u.href} className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-lg hover:border-emerald-200 transition-all">
            <u.icon className="w-8 h-8 text-emerald-500 mb-3" />
            <h3 className="text-base font-extrabold text-gray-900 group-hover:text-emerald-600">{u.title}</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed flex-1">{u.body}</p>
          </a>
        ))}
      </div>
    </Section>
  );
}

function AxesGrid() {
  return (
    <Section title="The GSPC measurement slots" subtitle="GSPC (Governance · Safety · Provenance · Continuity), a 14-slot board: 13 measured axes (12 Aug, 19 models) + jail, containment (18 Aug, 7 models, separation untested). Signed 18 Aug stamp." bg="bg-white">
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
              {!q && <div className="mt-3 text-xs text-gray-400 italic">no score on this stamp</div>}
            </a>
          );
        })}
        {[
          { axis: "gspc_jail", bench: "Jail", task: "containment / sandbox-escape gate", note: "13 Aug floor in separate stamp (not a ranking); empty on 12 Aug stamp", status: "EMPTY" },
          { axis: "human-baseline", bench: "Human Baseline", task: "measured via published aggregate human performance (no DPIA)", note: "the 14th registry slot — published aggregates, not our own collection", status: "MEASURED" },
        ].map(e => (
          <div key={e.axis} className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-800">{e.bench}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {e.status}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-gray-900">{e.axis}</h3>
            <p className="mt-1 text-xs text-gray-400 line-clamp-2">{e.task}</p>
            <div className="mt-3 text-xs text-gray-400 italic">{e.note}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <a href="/gspc-scoreboard" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:underline">
          <BarChart3 className="w-4 h-4" /> Open full scoreboard — 13 measured of 14 GSPC registry axes × 19 models, 12 Aug 2026 UNSIGNED
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
    <Section title="One instrument, every industry" subtitle="The same 14-slot registry applies — 13 of 14 measured today — whether you build autonomous vehicles, underwrite insurance, or grade students with AI. Measure once, evidence everywhere." bg="bg-white">
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
// (qa-sweep 2026-08-19) The page-level WebSite + FAQPage constants were REMOVED:
// the shell (client/index.html) already ships the canonical WebSite node, and the
// FaqBlock below emits the FAQPage node for exactly the FAQ this page renders —
// the extra copies made the prerendered home carry duplicate WebSite/FAQPage
// JSON-LD, which answer engines treat as conflicting claims. The removed WebSite
// node also asserted a SearchAction the shell audit (2026-08-14) had already
// declined to claim until /search?q= is verified.

// ── export ───────────────────────────────────────────────────────────
export default function NewHomeV3() {
  return (
    <main>

      <StoryWorld />
      <div className="border-b border-gray-100" />
      <ProblemStrip />
      <div className="border-b border-gray-100" />
      <UspGrid />
      <div className="border-b border-gray-100" />
      <BuyerCards />
      <div className="border-b border-gray-100" />
      <AxesGrid />
      <div className="border-b border-gray-100" />
      <IndustryGrid />
      <LivingStages />
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
              { q: "What does Council of AI do?", a: "We measure how AI systems behave against frozen, published benchmarks on the GSPC board — 13 measured of 14, plus jail (containment) as a measured floor — and issue the result as a verified measurement credential: a 3KB card, Ed25519-signed and hash-chained. Live axis and model counts come from GET /api/gspc. Anyone can verify a card without asking us." },
              { q: "Do you certify AI systems?", a: "No. We issue verified measurement credentials, not certifications. A card shows what your AI actually did when we measured it — measured evidence, never a badge of approval." },
              { q: "What does a measurement card cost?", a: "The rail is free. Verification is free forever — running and verifying your measurement cards costs nothing. Where we sell evidence, it is a signed artefact on its own page, never access to the rail." },
              { q: "Which regulations do you cover?", a: "Our frozen provision bank covers 417 statutory provisions across the EU AI Act, GDPR, CRA, DORA and NIS2, crosswalked to 13 frameworks including NIST AI RMF and ISO/IEC 42001. New instruments ship as regulation lands." },
              { q: "Who can see my measurement results?", a: "You decide. Cards are signed but disclosure is yours — publish them to your customers and regulators, or keep them private. The signing key is public; your data never leaves your control." },
            ]}
          />
        </div>
      </section>
    </main>
  );
}
