/**
 * NewHome-v3 — councilof.ai Homepage
 * Structure: scroll-world hero → living GSPC slots → industries → demographics →
 *   arena→ blog → upsells → enterprise trust
 * White/green palette. AEO-optimised: answer-first blocks, FAQPage schema,
 * H1 in raw HTML. Every section explains what we do for which end-user.
 */
import { useEffect, useState, type ReactNode } from "react";
import EnterpriseTrust from "../components/EnterpriseTrust";
import RegionBanner from "../components/RegionBanner";
import {
  fetchAxes, hasInterval, quotable, wilson, publicCaption,
  type Axis, type InLaneAxis,
} from "../lib/gspcAxes";
import FaqBlock from "@/components/FaqBlock";
import StoryWorld from "@/components/home/StoryWorld";
import LivingStages from "@/components/home/LivingStages";
import {
  Shield, CheckCircle, Users, Building2,
  Zap, ChevronRight, BarChart3, Gamepad2, TrendingUp,
  Eye, FileCheck, RefreshCw, Ban, Landmark, Scale,
} from "lucide-react";

// ── data ───────────────────────────────────────────────
const FOUR_BUYERS = [
  { icon: Shield, who: "Insurers", tagline: "Price AI risk on measured evidence", cta: "Start measuring", href: "/insurers", desc: "Underwrite AI deployment policies with measurement cards. The living GSPC board is signed; empty cells stay empty. Verify at GET councilof.ai/api/gspc." },
  { icon: Building2, who: "Regulators", tagline: "Check behaviour against the law", cta: "Crosswalk your framework", href: "/regulators", desc: "Map any AI regulation (EU AI Act, DORA, NIS2, NIST) to a single deterministic instrument set — every provision traceable." },
  { icon: Users, who: "Enterprises", tagline: "Prove your AI before you ship", cta: "Get measured", href: "/?lobby=measured&task=enterprise-start", desc: "Sign, ship, re-attest. No model in the verdict path. C2PA provenance integrated. The board includes the axis that catches our own models." },
  { icon: Zap, who: "Developers", tagline: "Verify a signed card — free forever", cta: "Verify a card", href: "/gspc-verify", desc: "Call the signed measurement tools from CI: gate a release, re-check a card, track a run. Counts stay on GET /api/gspc." },
];

const SEVEN_INDUSTRIES = [
  { name: "Insurance", tag: "Underwrite AI risk", img: "⚖", href: "/industries/insurance" },
  { name: "Health", tag: "Clinical AI, devices, drug discovery", img: "🏥", href: "/industries/healthcare" },
  { name: "Finance", tag: "Credit scoring, algorithmic trading, AML", img: "🏦", href: "/industries/finance" },
  { name: "Transport", tag: "Autonomous vehicles, fleet, logistics", img: "🚚", href: "/industries/transportation" },
  { name: "Retail", tag: "Recommenders, pricing, inventory", img: "🛒", href: "/industries/retail" },
  { name: "Education", tag: "Admissions, proctoring, grading AI", img: "🎓", href: "/industries/education" },
  { name: "Energy", tag: "Grid control, smart metering", img: "⚡", href: "/industries/energy" },
];


interface Post { title: string; date: string; desc: string; href: string; }
const RECENT: Post[] = [
  { title: "Layer 0: The Missing Trust Layer for the Agent Economy", date: "2026-06-17", desc: "Every MCP and A2A assumes a trusted agent identity with enforceable policy — that is the market we built.",     href: "/blog/" },
  { title: "The EU AI Act Article 50 Countdown: What Changes 2 Aug 2026", date: "2026-06-17", desc: "Transparency obligations arrive 2 August. Organisations in or serving the EU need signed, verifiable evidence — not an attestation PDF.", href: "/blog/" },
  { title: "How to Choose an AI Compliance Vendor", date: "2026-06-17", desc: "GRC rebrands are everywhere. Here is how to spot a real measurement body vs a marketing operation.", href: "/blog/" },
  { title: "DORA Compliance for UK Financial Services", date: "2026-06-17", desc: "The Digital Operational Resilience Act applies 17 Jan 2025. AI systems in-scope need a measurement rail, not a form.", href: "/blog/" },
  { title: "AI Governance vs AI Compliance — What's the Difference?", date: "2026-06-17", desc: "Governance is strategy. Compliance is a snapshot. Buy a snapshot without a governance layer, and you re-buy every six months.", href: "/blog/" },
  { title: "NIS2 Compliance for Critical Infrastructure Operators", date: "2026-06-17", desc: "NIS2 expanded scope reaches energy, transport, health and digital infrastructure. Every AI in that chain is in scope.", href: "/blog/" },
];

// ── sections ─────────────────────────────────────────────
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

// ── living GSPC grid (honest empties stay empty) ─────────────────────────

// ── problem we fix ─────────────────────────────────────
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
  { icon: FileCheck, title: "Signed measurement card", body: "Ed25519-signed, 3KB. Verify stays free and loginless. A grade is never sold.", href: "/assess" },
  { icon: Eye, title: "Anyone can check", body: "The verify path is public. We do not put it behind an account or a fee.", href: "/gspc-verify" },
  { icon: Scale, title: "Honest living board", body: "Empty cells stay empty. Jail is a measured floor when the stamp says so. Live counts: GET /api/gspc.", href: "/gspc-scoreboard" },
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

// ── ledger attestation / evidence-that-travels ────────────────
function LedgerAttestBand() {
  return (
    <section className="py-14 px-6 bg-emerald-900">
      <div className="mx-auto max-w-5xl flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">Interop — evidence that travels</p>
          <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">Attach a signed card to a public ledger</h3>
          <p className="mt-3 text-sm leading-relaxed text-emerald-100/90">
            Permissionless attach: we bind signed measurement evidence to accounts we do not control,
            so a stranger can verify it without us. A devnet-proven capability — never a rating, never an investment.
          </p>
        </div>
        <a
          href="/xrpl-attest"
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 text-base font-extrabold text-emerald-950 transition-colors hover:bg-emerald-300"
        >
          Attestation on the ledger <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}

function AxesGrid() {
  const [axes, setAxes] = useState<Axis[]>([]);
  const [inLane, setInLane] = useState<InLaneAxis[]>([]);
  const [subtitle, setSubtitle] = useState("GSPC (Governance · Safety · Provenance · Continuity). Slot counts are live on GET /api/gspc — we do not type them into this page.");

  useEffect(() => {
    const ac = new AbortController();
    fetchAxes(ac.signal).then((r) => {
      setAxes(r.axes);
      setInLane(r.inLane);
      setSubtitle(`${publicCaption(r.publicCount)}. Empty cells stay empty.`);
    });
    return () => ac.abort();
  }, []);

  return (
    <Section title="The GSPC measurement slots" subtitle={subtitle} bg="bg-white">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {axes.map(a => {
          const q = quotable(a);
          const ci = hasInterval(a) ? wilson(a.accuracy, a.n) : null;
          const href = a.dataset ? `https://huggingface.co/datasets/${a.dataset}` : "/gspc-scoreboard";
          return (
            <a key={a.axis} href={href}
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
      </div>
      {inLane.length > 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-5">
          <h3 className="text-sm font-extrabold text-gray-800">In-lane — not board rows</h3>
          <p className="mt-1 text-xs text-gray-500">Published as measured_in_lane on GET /api/gspc. Not counted in totals.public_count.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {inLane.map((e) => (
              <div key={e.axis} className="rounded-2xl border border-gray-100 bg-white p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-800">{e.bench}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {e.status}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-gray-900">{e.axis}</h3>
                <p className="mt-1 text-xs text-gray-400 line-clamp-2">{e.task}</p>
                {e.n > 0 && (
                  <div className="mt-3 text-xs text-gray-500">n={e.n} · {(e.accuracy * 100).toFixed(0)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-8 text-center">
        <a href="/gspc-scoreboard" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:underline">
          <BarChart3 className="w-4 h-4" /> Open the live scoreboard — counts from GET /api/gspc
        </a>
      </div>
    </Section>
  );
}

// ── demographics ─────────────────────────────────
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

// ── industries ─────────────────────────────────
function IndustryGrid() {
  return (
    <Section title="One instrument, every industry" subtitle="The same living GSPC instrument applies — whether you build autonomous vehicles, underwrite insurance, or grade students with AI. Measure once, evidence everywhere." bg="bg-white">
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

// ── blog strip ───────────────────────────────
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

// ── upsells ──────────────────────────

// ── FAQ — 21 answers, the whole proposition in plain English ──────────
// AEO/GEO: FaqBlock renders these as a native <details> accordion (crawlable
// with JS off, keyboard-operable) AND emits FAQPage JSON-LD for exactly these
// 21 pairs. Register rules apply to every answer: measurement not certification;
// counts are named with the endpoint and the stamp they came from, never floated
// free; UNMEASURED is a state, not a failure; no timestamp-authority or
// blockchain-anchoring claim (there is none — the anchor is Ed25519 over a
// SHA-256 hash chain); the council figure is DESIGN and is labelled as such.
const HOME_FAQ = [
  {
    q: "What is Council of AI?",
    a: "Council of AI (legally CSOAI Ltd, UK Companies House 16939677) is an independent measurement body for AI behaviour. We run AI systems against frozen, published tests drawn from real statute, grade the answers with deterministic code, sign the result with an Ed25519 key, and publish it — including the parts we could not measure. We are the instrument, not the referee: we produce evidence, and regulators, insurers and buyers decide what to do with it.",
  },
  {
    q: "What is a measurement card?",
    a: "A measurement card is the output: a small signed record, roughly 3KB of JSON, holding the scores, the sample size behind each score, the confidence interval where one is honest, the hashes, and the signature. It is deliberately small enough to email, attach to a tender, or keep in a compliance folder. It is yours to hold, and it does not live on our server for us to quietly amend later.",
  },
  {
    q: "How do I verify a measurement card myself?",
    a: "Three steps, and none of them involve us. First, put the record into canonical form — every key sorted, no whitespace — drop the content_id and signature fields, and take the SHA-256; that hash is the card's identity. Second, fetch our public key from /.well-known/did.json and verify the Ed25519 signature over the canonical record. Third, there is no third step: it either matches or it does not. The whole check runs in your own browser with WebCrypto at councilof.ai/gspc-verify — no account, no fee, no call to our servers for permission. Note what is not in that chain: there is no RFC-3161 timestamp authority and no OpenTimestamps or blockchain anchoring, and our records say so with timestamp_authority: none. The anchor is the signature over the hash chain, and that is a smaller claim you can check in seconds rather than a larger one you have to take on faith.",
  },
  {
    q: "What does a “measured of N” figure on the board mean?",
    a: "It is a coverage statement, not a grade: how many slots on the current stamp carry a measured result, versus how many are described honestly or left empty. We do not type that fraction into this page — read totals.public_count from GET councilof.ai/api/gspc, which is also where the stamp date lives.",
  },
  {
    q: "Why is a slot ever left UNMEASURED?",
    a: "Because measuring it properly is not possible yet, and inventing a number would be worse than an empty cell. A slot stays UNMEASURED when the sample is too small to quote — we do not publish a score below thirty graded items — or when the instrument has not been frozen and published, or when the legal gold labels are still with counsel. UNMEASURED is not a failing grade for the AI system; it is a disclosure about us. Silently filling that gap is the exact behaviour this whole instrument exists to catch.",
  },
  {
    q: "What is jail, or containment?",
    a: "Jail asks a blunt question: can this model be talked out of its own guardrails and made to act outside its sandbox? It is a measured floor, not a ranking. It was measured on a smaller fleet than the main board and on its own set of gold cells, and its statistical separation has not been tested — meaning we cannot yet say that any model is genuinely better at it than another rather than merely luckier on the day. All of that is printed on the axis rather than hidden behind it. The best detector we measured still misses most escapes, and we publish that too.",
  },
  {
    q: "Why do you report a tie instead of naming a winner?",
    a: "Because most leads on a leaderboard are noise. When one model scores a little higher than another, we run a McNemar test on the items where the two actually disagreed. If the difference is not statistically separated, we call it a tie and we do not count it as a win — even when the model in front is one of ours. On the current board most axes are ties, and the exact split of separated leads to ties is published in the totals block of GET /api/gspc. A ranking that promotes every point-estimate lead to a victory is selling you a decimal point.",
  },
  {
    q: "Who pays Council of AI, and who never pays?",
    a: "No company we measure pays for its place on the board, its score, or its removal from either. Members of the public never pay us anything. Verification is free forever and needs no account. We fund ourselves by selling signed evidence artefacts — an attested report, a published dataset, a scheduled re-attestation — which are published whether the result flatters the buyer or not, and never as a fee for a ranking or a placement. If you can verify it, it is not behind a paywall.",
  },
  {
    q: "What does Council of AI NOT do?",
    a: "We do not certify. We do not accredit, and there is no accreditation chain behind us; we are not a notified body under the EU AI Act or anything else. We do not enforce — we cannot approve, ban, fine or clear any system. We issue no conformity mark, no badge and no seal for anyone to put in a footer. And a measurement card is not legal advice: it describes what a system did on published tests on a stated date, which is a narrower and more useful thing than a compliance verdict.",
  },
  {
    q: "Which regulations and frameworks do you cover?",
    a: "The frozen provision bank holds 417 statutory provisions drawn from the EU AI Act, GDPR, the Cyber Resilience Act, DORA and NIS2, crosswalked to thirteen governance frameworks including NIST AI RMF and ISO/IEC 42001. That thirteen is the publicly verified count; we hold a wider internal crosswalk and deliberately do not quote it here. New instruments are added as regulation actually lands, not when it is announced.",
  },
  {
    q: "What happens when the law changes?",
    a: "We watch the primary sources — EUR-Lex, legislation.gov.uk and the national registers — by hash, and we publish a dated deadline feed at councilof.ai/api/regulation. When a provision genuinely changes, we re-measure the affected systems and issue a delta card. The old card is not withdrawn, expired or overwritten: history here is append-only, so the record of what was true in August still reads correctly next year. Where the effective date of an obligation is genuinely disputed, we record the dispute rather than resolve it silently.",
  },
  {
    q: "How does a company get measured?",
    a: "You send us the system — an endpoint, a model, or an agent — and we run it against the frozen instruments that apply to it. Nothing about the test is bespoke: the same items, the same grader and the same thresholds that every other subject faced, so the result is comparable. You get back the signed card, including every slot we could not fill. The first measurement costs nothing, and re-measuring after your model or the law changes is the normal case rather than an upsell.",
  },
  {
    q: "What do regulators get from a measurement card?",
    a: "A behavioural record they can re-compute themselves, rather than a supplier's assurance about its own product. Each provision in our bank is traceable from the statute text through to the specific items that test it, so a supervisor can see exactly what was asked and how the answer was graded. The card is signed, so its provenance survives being forwarded, and the empty slots tell a regulator where evidence does not yet exist — which is often the more actionable half.",
  },
  {
    q: "What do insurers get from a measurement card?",
    a: "Something to price against. Underwriting AI deployment risk currently means reading a questionnaire the applicant filled in about itself. A measurement card is instead an observed behavioural sample with a stated sample size and interval, re-issued on a schedule, so exposure can be tracked as the model drifts rather than assumed constant from binding to renewal. We are the rail, not the referee: we do not tell an insurer what to charge, and we take no share of anything written on the back of a card.",
  },
  {
    q: "How does the arena work?",
    a: "Two systems face the same frozen items at the same time, around the clock. Each match is a subject, an instrument and a fixed rule — never an opinion. The verdict is a predicate: the answer either satisfies the provision or it does not, and ties are reported as ties. Any round can be promoted into a signed card; practice runs stay practice and are never quoted. Because it runs continuously, coverage does not depend on who happened to be at a keyboard.",
  },
  {
    q: "Why does no model ever judge another model?",
    a: "Because an AI grading an AI is a correlated error, not an audit — the judge shares the blind spots of the thing it is judging, and the score becomes a measure of family resemblance. Every verdict we publish comes from deterministic code against pre-written gold labels, so the same input always produces the same grade and you can read the grader yourself. Where a response cannot be parsed into a label at all, it is counted as unmeasured rather than silently scored as a wrong answer.",
  },
  {
    q: "What happens when Council of AI gets something wrong?",
    a: "It goes in the public corrections ledger at councilof.ai/api/corrections, which is appended and never edited or deleted. Each entry records what was wrong, how it was caught, and what changed. The hardest example is on that record: we had published a consensus guarantee for our council architecture, then measured how independent those seats actually were and found the effective number was n_eff 1.21 out of a nominal 3. The guarantee did not hold, so we retracted it (DR-0007) instead of rewording it. The council remains a designed 33-seat structure with a designed 23-of-33 threshold, and it is labelled as a design figure everywhere it appears.",
  },
  {
    q: "Can I see the actual tests and the scoring code?",
    a: "Yes, and you should. The instrument banks are published as open datasets, the grading harness is public, and the per-item rows behind every published score are the same rows we scored. That is the point of freezing an instrument: a benchmark you cannot re-run is a press release. If you re-run it and get a different answer to ours, that is a correction we want, and it goes in the ledger under your name.",
  },
  {
    q: "Is my result published, or is it mine to share?",
    a: "Yours. The card is signed but disclosure is your decision — hand it to a customer, attach it to a regulatory filing, or keep it entirely private. The signing key is public, so whoever you do show it to can verify it without contacting us and without us learning that they did. What we publish on the open board is our own model fleet and the systems whose owners chose publication.",
  },
  {
    q: "What is the difference between MEASURED, UNMEASURED and REPORTED?",
    a: "They are three different kinds of claim and we never merge them. MEASURED means we ran it on our own frozen instruments and signed the result; that is the only state that goes on the board. UNMEASURED means the cell is honestly empty — too small a sample, no separation test, or an instrument not yet frozen. REPORTED means a figure published by somebody else, cited and dated, carried for context and left unsigned; the human-performance baselines you see beside our AI figures are REPORTED aggregates from other people's studies, not our own collection. A REPORTED number never enters our board and is never averaged with a MEASURED one.",
  },
  {
    q: "How does an AI agent or an answer engine read all of this?",
    a: "The same way you do, only faster. The board is machine-readable at GET councilof.ai/api/gspc, third-party figures at /api/reported, the corrections ledger at /api/corrections, the signing keys at /.well-known/did.json and the dated deadline feed at /api/regulation. There is a summary for language models at /llms.txt and the endpoints are documented at /api-docs. Everything an agent needs to verify a claim is served without an account, because a trust layer that requires a login is not a trust layer.",
  },
];

// ── SEO / schema ─────────────────────────
// (qa-sweep 2026-08-19) The page-level WebSite + FAQPage constants were REMOVED:
// the shell (client/index.html) already ships the canonical WebSite node, and the
// FaqBlock below emits the FAQPage node for exactly the FAQ this page renders —
// the extra copies made the prerendered home carry duplicate WebSite/FAQPage
// JSON-LD, which answer engines treat as conflicting claims. The removed WebSite
// node also asserted a SearchAction the shell audit (2026-08-14) had already
// declined to claim until /search?q= is verified.

// ── export ───────────────────────────
export default function NewHomeV3() {
  return (
    <main>

      <StoryWorld />
      <div className="border-b border-gray-100" />
      <ProblemStrip />
      <div className="border-b border-gray-100" />
      <UspGrid />
      <LedgerAttestBand />
      <div className="border-b border-gray-100" />
      <BuyerCards />
      <div className="border-b border-gray-100" />
      <AxesGrid />
      <div className="border-b border-gray-100" />
      <IndustryGrid />
      <LivingStages />
      <div className="border-b border-gray-100" />
      <BlogStrip />

      {/* existing trust strip with C2PA/OIN/LOT badges */}
      <EnterpriseTrust />
      {/* keep the region-detection banner */}
      <RegionBanner />

      {/* FAQ — 21 answers, native <details> accordion + FAQPage JSON-LD (AEO) */}
      <FaqBlock
        title="Questions people ask"
        intro={`${HOME_FAQ.length} plain-English answers: what we measure, what we refuse to claim, and how to check any of it yourself.`}
        items={HOME_FAQ}
      />
    </main>
  );
}
