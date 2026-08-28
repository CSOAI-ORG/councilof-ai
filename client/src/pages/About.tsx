import {
  Users, Target, Shield, Globe, Award, Building2, Heart, Zap, CheckCircle2, FileCheck,
  TrendingUp, Clock, MapPin, BarChart2
} from "lucide-react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useBoardCount } from "@/lib/boardCount";
import { useEstateFacts } from "@/lib/estateFacts";

// Animated counter component
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setIsVisible(true);
        setHasAnimated(true);
      }
    }, { threshold: 0.1 });

    const element = document.getElementById(`counter-${target}`);
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [hasAnimated, target]);

  useEffect(() => {
    if (!isVisible) return;

    let currentCount = 0;
    const increment = target / 50;
    const interval = setInterval(() => {
      currentCount += increment;
      if (currentCount >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(currentCount));
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isVisible, target]);

  return (
    <span id={`counter-${target}`}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function LiveBoardCount() {
  const [label, setLabel] = useState("…");
  useEffect(() => {
    fetch("/api/gspc")
      .then((r) => r.json())
      .then((d) => {
        const count = d?.totals?.public_count;
        setLabel(typeof count === "string" && count.trim() ? count : "see /api/gspc");
      })
      .catch(() => setLabel("see /api/gspc"));
  }, []);
  return (
    <>
      <div className="text-2xl font-bold text-emerald-600 mb-2 leading-snug">{label}</div>
      <p className="text-gray-600 font-semibold">
        Living GSPC board — counts from GET /api/gspc. The larger number counts slots; the smaller
        counts measurements. A published slot exists so a gap is visible, and is not evidence that
        anything was measured.
      </p>
    </>
  );
}

// Hero stats bar component
function HeroStatsBar() {
  // qa-sweep 2026-08-19: unverified counters removed ("10,000+ analysts", "33 agents",
  // "40+ nations" had no source endpoint). Only numbers with a published source remain;
  // board counts defer to GET /api/gspc.
  // copy-truth 2026-08-26: the last two TYPED figures went too. "417" is real — it is
  // the provision count inside the signed Article 50 pack's corpus anchor — but typing
  // it here detaches it from the hash that makes it checkable, so the tile now points
  // at the pack. "4 global frameworks" was typed beside a homepage FAQ claiming
  // thirteen; the published crosswalk covers four REGIMES, so the tile names them.
  const [boardCount, setBoardCount] = useState("…");
  const facts = useEstateFacts();
  const cardCount = `${facts.bodiesValid} of ${facts.bodiesPublished} verify`;
  useEffect(() => {
    fetch("/api/gspc")
      .then((r) => r.json())
      .then((d) => {
        const count = d?.totals?.public_count;
        setBoardCount(typeof count === "string" && count.trim() ? count : "GET /api/gspc");
      })
      .catch(() => setBoardCount("GET /api/gspc"));
  }, []);
  const stats = [
    { label: "Living GSPC board — GET /api/gspc", value: boardCount },
    { label: "Signed cards published and verifying — GET /api/state", value: cardCount },
    { label: "Frozen provision bank — anchored by a published corpus hash", value: "/packs/eu-article-50" },
    { label: "Published crosswalk — EU · UK · US-IL · CN", value: "/crosswalk/east-west-v1.json" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-12 border-t border-white/20">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="text-lg md:text-xl font-bold text-emerald-300 mb-2 leading-snug">
            {stat.value}
          </div>
          <p className="text-sm md:text-base text-gray-300">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

// Pulsing live indicator
function LiveIndicator() {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative w-3 h-3">
        <div className="absolute inset-0 bg-emerald-400 rounded-full animate-pulse"></div>
        <div className="absolute inset-1 bg-emerald-500 rounded-full"></div>
      </div>
      <span className="text-sm font-semibold text-emerald-300">Live</span>
    </div>
  );
}

export default function About() {
  // Board counts, derived from GET /api/gspc. No count is typed on this page.
  const board = useBoardCount();
  // Card-chain counts, derived from GET /api/state -> card_chain, which is built from
  // scripts/derive-chain-facts.mjs re-verifying every published body.
  const facts = useEstateFacts();
  useEffect(() => {
    document.title = "About the Council of AI — a UK measurement body | Council of AI";
    let m = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!m) { m = document.createElement("meta"); m.name = "description"; document.head.appendChild(m); }
    m.content = "The Council of AI (CSOAI LTD, UK Companies House 16939677) is an independent AI measurement body: deterministic measurement, Ed25519-signed records, no certification and no accreditation chain. Live board counts: GET /api/gspc.";
  }, []);
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Origin Story */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-24">
        <div className="container max-w-4xl">
          <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Our Story</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
            We measure AI systems, sign the result, and publish what we could not measure
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed mb-8">
            In 2024, as artificial intelligence began transforming every industry, a critical question emerged:
            <span className="text-emerald-300 font-semibold"> Who watches the watchmen?</span> Governments scrambled to regulate.
            Companies rushed to comply. But one thing was missing: <span className="font-semibold">trained professionals who could actually monitor AI systems for safety.</span>
          </p>
          <p className="text-xl text-gray-300 leading-relaxed">
            That's when CSOAI was born—not as another AI company, but as <span className="text-emerald-300 font-semibold">the solution to two problems at once</span>:
            making AI behaviour checkable by people who are not the vendor, and training the people who will have to do the checking.
          </p>
          <HeroStatsBar />
        </div>
      </div>

      {/* The Problem We're Solving */}
      <div className="bg-white py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-red-50 text-red-600 border-red-200">The Problem</Badge>
            <h2 className="text-4xl font-bold mb-6">AI is Taking Jobs. We're Creating Them.</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              AI displacement forecasts vary enormously and we have measured none of them, so we
              will not put a number here. What is not a forecast: the EU AI Act already requires
              human oversight of high-risk systems under Article 14, and someone has to do it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="p-8 border-l-4 border-red-500 border-2 border-red-100 bg-red-50/50">
              <h3 className="text-2xl font-bold mb-4 text-red-900">Without CSOAI</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>AI systems deployed without proper safety review</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>Companies struggle to find qualified compliance staff</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>Nobody outside the vendor can re-run the test that produced the claim</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>Governments lack trained personnel for AI oversight</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 border-l-4 border-emerald-500 border-2 border-emerald-200 bg-emerald-50/50">
              <h3 className="text-2xl font-bold mb-4 text-emerald-900">With CSOAI</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <span>Every published finding links to a signed, recomputable record</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <span>Free training, and completion records that say what they are</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <span>A published corrections ledger — appended, never edited, including our own failures</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <span>An open, recomputable method — the banks, the grader and the rows are published, so anyone can disagree with us in our own units</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Our Mission & Approach */}
      <div className="bg-slate-50 py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-50 text-emerald-600 border-emerald-200">Our Mission</Badge>
            <h2 className="text-4xl font-bold mb-6">Protecting Humanity While Creating Careers</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              We are not a certification body and never will be — we measure, sign and publish
              evidence, and the competent authorities decide. What we are building is the
              infrastructure for a role we think the law is about to require:
              <span className="font-semibold text-emerald-600"> the AI Safety Analyst</span>. That
              this becomes a large profession is our bet, not a measurement — we have no forecast to
              cite and we are not going to invent one.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center bg-white hover:shadow-lg transition-shadow">
              <div className="inline-flex p-4 bg-emerald-100 rounded-full mb-4">
                <Target className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Train</h3>
              <p className="text-gray-600">
                Comprehensive training on EU AI Act, NIST AI RMF, and ISO 42001 frameworks. No coding required.
              </p>
            </Card>

            <Card className="p-8 text-center bg-white hover:shadow-lg transition-shadow">
              <div className="inline-flex p-4 bg-emerald-100 rounded-full mb-4">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Complete</h3>
              <p className="text-gray-600">
                Finish the assessment and the Academy issues a completion record: a signed statement
                that you demonstrated the material on a date. It is not a certification, not an
                accreditation, and confers no regulatory status of any kind — we issue no conformity
                marks to anyone, ourselves included.
              </p>
            </Card>

            <Card className="p-8 text-center bg-white hover:shadow-lg transition-shadow">
              <div className="inline-flex p-4 bg-emerald-100 rounded-full mb-4">
                <Zap className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Contribute</h3>
              <p className="text-gray-600">
                Challenge a published measurement, re-run a frozen bank, or file a correction — the
                harness and the banks are public and a correction that lands is published under your
                name. A paid analyst marketplace is <strong>not yet available</strong>: we have no
                roster, no matching and no engagements to offer, and we will not describe one before
                it exists.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Global Presence Section */}
      <div className="bg-white py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-50 text-blue-600 border-blue-200">Global Coverage</Badge>
            <h2 className="text-4xl font-bold mb-6">What is crosswalked, and what is only tracked</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Our published, signed crosswalk maps one measurement across four regimes: the EU AI
              Act, the UK DRCF alignment, Illinois SB 315, and the Chinese TC260 alignment. That
              file is at <code>/crosswalk/east-west-v1.json</code> and it is the whole of what is
              crosswalked today. We track and write about many more jurisdictions than four; those
              are reference pages, not crosswalked measurement, and this page will not blur the two.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-6 w-6 text-blue-600" />
                <h3 className="text-2xl font-bold text-blue-900">North America</h3>
              </div>
              <p className="text-gray-700"><strong>Crosswalked:</strong> Illinois SB 315. <strong>Tracked, not crosswalked:</strong> NIST AI RMF, federal guidance and other state AI laws — reference coverage we write about, with no signed crosswalk behind it yet.</p>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-6 w-6 text-emerald-600" />
                <h3 className="text-2xl font-bold text-emerald-900">Europe</h3>
              </div>
              <p className="text-gray-700"><strong>Crosswalked:</strong> the EU AI Act, and the UK DRCF alignment beside it. This is the deepest coverage we have — the frozen provision bank behind it is anchored by a published corpus hash. Measurement, never certification.</p>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-6 w-6 text-amber-600" />
                <h3 className="text-2xl font-bold text-amber-900">Asia-Pacific</h3>
              </div>
              <p className="text-gray-700"><strong>Crosswalked:</strong> the Chinese TC260 alignment. <strong>Tracked, not crosswalked:</strong> Japan, India, Australia and Southeast Asia.</p>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-6 w-6 text-rose-600" />
                <h3 className="text-2xl font-bold text-rose-900">Middle East & Africa</h3>
              </div>
              <p className="text-gray-700"><strong>Tracked, not crosswalked:</strong> emerging AI-governance regimes across the Middle East and Africa. Nothing here is measured yet, and saying so is the point of the column.</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Why We're Different - Timeline Style */}
      <div className="bg-slate-50 py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-50 text-emerald-600 border-emerald-200">What Makes Us Different</Badge>
            <h2 className="text-4xl font-bold mb-6">We're Not Just Talking. We're Building.</h2>
          </div>

          <div className="space-y-8">
            {/* Timeline item 1 */}
            <div className="relative">
              <div className="flex gap-8">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">1</div>
                  <div className="w-1 h-20 bg-emerald-200 mt-2"></div>
                </div>
                <Card className="p-8 flex-1 bg-white">
                  <h3 className="text-2xl font-bold mb-4">Multi-provider oversight <span className="text-sm font-semibold text-amber-600">— designed, not yet measured</span></h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Oversight spread across providers so no single vendor decides alone. The council-seat figure is an architecture, not a measurement — cross-checking measured today is n_eff 1.21 of 3, published in our Refutation Ledger. Historically this page described a multi-agent council
                    across multiple AI providers (OpenAI, Anthropic, Google, DeepSeek, and more). No single company
                    controls the outcome.
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Why it matters:</strong> When a company's own AI reviews their AI, there's a conflict of interest.
                    Our multi-vendor approach ensures unbiased safety assessments.
                  </p>
                </Card>
              </div>
            </div>

            {/* Timeline item 2 */}
            <div className="relative">
              <div className="flex gap-8">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">2</div>
                  <div className="w-1 h-20 bg-emerald-200 mt-2"></div>
                </div>
                <Card className="p-8 flex-1 bg-white">
                  <h3 className="text-2xl font-bold mb-4">👁️ Watchdog: a public intake</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    There is a public intake for behaviour that looks wrong, at{" "}
                    <Link href="/public-watchdog" className="text-emerald-700 underline">/public-watchdog</Link>.
                    What it is: somewhere to report, that anyone can use. What it is not: a published
                    incident register — we do not yet operate one, and a triaged public register of
                    reports is <strong>not yet available</strong>. We also hold nobody accountable:
                    we measure, and only a regulator can approve, ban, fine or clear anything.
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Why it matters:</strong> an intake with no register behind it is worth
                    less than one with, and pretending otherwise is the kind of claim this page
                    exists to retire.
                  </p>
                </Card>
              </div>
            </div>

            {/* Timeline item 3 */}
            <div className="relative">
              <div className="flex gap-8">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">3</div>
                  <div className="w-1 h-20 bg-purple-200 mt-2"></div>
                </div>
                <Card className="p-8 flex-1 bg-white">
                  <h3 className="text-2xl font-bold mb-4">🔄 Re-attest, never edit</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    A model measured in August is not a model measured next year, so a measurement is
                    a dated record and never a standing verdict. When we re-measure, we issue a NEW
                    signed card and the old one stands — history here is append-only, and drift is
                    visible by comparing dated cards. Scheduled automatic re-attestation is{" "}
                    <strong>not yet available</strong>: re-measurement is arranged run by run today,
                    so do not read this as a monitoring subscription.
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Why it matters:</strong> a PDF from six months ago describes a model that
                    no longer exists. A dated, signed card at least tells you which model it describes.
                  </p>
                </Card>
              </div>
            </div>

            {/* Timeline item 4 */}
            <div className="relative">
              <div className="flex gap-8">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">4</div>
                </div>
                <Card className="p-8 flex-1 bg-white">
                  <h3 className="text-2xl font-bold mb-4">💼 Free training, and an honest account of where it leads</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Council Academy training is free and its completion records are free. What we have
                    not measured, and will not assert: how many people this puts into work, what they
                    earn, or how our focus compares with other organisations&apos; — we have measured
                    one rating organisation on one criterion and that is the whole of our comparative
                    evidence. The training exists and is free; the career outcome is unmeasured.
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Why it matters:</strong> a training pipeline that promises income it has
                    not measured is selling something. Free training with an unmeasured outcome,
                    stated as such, is the honest version of the same offer.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* By the Numbers - Animated Stats Section */}
      <div className="bg-white py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-50 text-emerald-600 border-emerald-200">Metrics</Badge>
            <h2 className="text-4xl font-bold mb-6">By the Numbers</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Every figure below is read from a live endpoint at page load, with the artifact and
              the date it came from. None is typed into this page — that rule exists because typing
              them once produced five different axis counts across this site simultaneously.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* qa-sweep 2026-08-19: "33 AI Agents in Council", "10,000+ Analysts in Training"
                and "$150/hr Max Analyst Earnings" removed — unverified counters / pricing with
                no source endpoint. Board counts defer to GET /api/gspc. */}
            <Card className="p-8 text-center bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
              <BarChart2 className="h-8 w-8 text-emerald-600 mx-auto mb-4" />
              <LiveBoardCount />
            </Card>

            <Card className="p-8 text-center bg-gradient-to-br from-purple-50 to-white border-purple-200">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-4" />
              <div className="text-2xl font-bold text-purple-600 mb-2 leading-snug">
                {facts.bodiesValid} of {facts.bodiesPublished}
              </div>
              <p className="text-gray-600 font-semibold">
                Published cards that verify under our single public key — counts from GET /api/state
              </p>
            </Card>

            <Card className="p-8 text-center bg-gradient-to-br from-rose-50 to-white border-rose-200">
              <div className="h-8 w-8 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🟢</span>
              </div>
              <div className="text-4xl font-bold text-rose-600 mb-2">
                Unmeasured
              </div>
              <p className="text-gray-600 font-semibold">Platform Uptime — see /status for probed services</p>
            </Card>

            <Card className="p-8 text-center bg-gradient-to-br from-teal-50 to-white border-teal-200">
              <Globe className="h-8 w-8 text-teal-600 mx-auto mb-4" />
              <div className="text-2xl font-bold text-teal-600 mb-2 leading-snug">
                {facts.withheldAttested} of {facts.withheld}
              </div>
              <p className="text-gray-600 font-semibold">
                Withheld cards a signature actually attests. The rest are disclosed in an unsigned
                manifest — see <Link href="/honesty" className="underline">the honesty gate</Link>
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Our Commitment */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-20">
        <div className="container max-w-4xl text-center">
          <Heart className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6">Our Commitment to You</h2>
          <p className="text-xl text-gray-300 leading-relaxed mb-8">
            We build in public. The banks, the grader, the rows, the signing keys and the
            corrections are all published, so the way to disagree with us is to recompute a number
            and show us a different one — and if you do, it goes in the ledger under your name.
            CSOAI LTD is a UK company (Companies House 16939677) with shareholders like any other;
            what makes us checkable is not our ownership but that{" "}
            <span className="text-emerald-300 font-semibold">nobody we measure pays for their place on the board, their score, or their removal from either</span>,
            and verification is free forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/academy">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Start Training Today
              </Button>
            </Link>
            <Link href="/academy">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Open the academy
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recognition & Standards */}
      <div className="bg-slate-50 py-20">
        <div className="container max-w-4xl">
          <Card className="p-10 bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-emerald-200">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="p-6 bg-white rounded-full shadow-lg">
                <Award className="h-16 w-16 text-emerald-600" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-3xl font-bold mb-4">Aligned with Global Standards</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Our training and our instruments are written against three reference frameworks —
                  the EU AI Act (Europe), NIST AI RMF (United States) and ISO/IEC 42001
                  (International). Written against is not measured against, and the difference is
                  the whole point: the EU AI Act is the only one of the three with a frozen,
                  corpus-anchored provision bank and a published crosswalk behind it. NIST AI RMF
                  and ISO/IEC 42001 inform how the instruments were designed; no signed crosswalk
                  to either is published, so treat them as reference rather than as coverage. We
                  hold no accreditation under any of the three, issue no conformity assessment, and
                  a course completion attests training and never conformity.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {/* These read as credentials CSOAI holds. It holds none. "Compliant" and
                      "Certified" were removed 2026-08-20 — /trust-center lists every ISO mark as
                      In Progress, and we issue no conformity assessment of any kind. */}
                  <Badge variant="outline" className="text-sm py-2 px-4">EU AI Act — frozen bank + published crosswalk</Badge>
                  <Badge variant="outline" className="text-sm py-2 px-4">NIST AI RMF — reference, no published crosswalk</Badge>
                  <Badge variant="outline" className="text-sm py-2 px-4">ISO/IEC 42001 — reference, no published crosswalk</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Professional Insurance & Compliance */}
      <div className="bg-white py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-50 text-blue-600 border-blue-200">Trust & Protection</Badge>
            <h2 className="text-4xl font-bold mb-6">Professionally Insured & Regulated</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              CSOAI LTD operates with full professional indemnity insurance, protecting our clients and partners.
            </p>
          </div>

          <Card className="p-8 border-l-4 border-blue-500 border-2 border-blue-200 bg-white">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="p-6 bg-blue-100 rounded-full">
                <FileCheck className="h-12 w-12 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Professional Indemnity Insurance</h3>
                <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-gray-500">Company</p>
                    <p className="font-semibold">CSOAI LTD</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Coverage</p>
                    <p className="font-semibold text-emerald-600">Up to £5,000,000</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Policy Number</p>
                    <p className="font-semibold">CHPR5355800XB</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Valid Until</p>
                    <p className="font-semibold">13 January 2027</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Insurer</p>
                    <p className="font-semibold">Simply Business (Xbridge Limited)</p>
                  </div>
                  <div>
                    <p className="text-gray-500">FCA Registration</p>
                    <p className="font-semibold">No: 313348</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            <Card className="p-6 text-center bg-gradient-to-br from-emerald-50 to-white border-emerald-200 hover:shadow-lg transition-shadow">
              <Shield className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
              <h4 className="font-bold mb-2">Client Protection</h4>
              <p className="text-sm text-gray-600">Full coverage for professional services and advice</p>
            </Card>
            <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-white border-blue-200 hover:shadow-lg transition-shadow">
              <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-bold mb-2">UK Registered</h4>
              <p className="text-sm text-gray-600">Companies House No: 16939677</p>
              <p className="text-xs text-gray-500 mt-1">Registered in England & Wales</p>
            </Card>
            <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-white border-purple-200 hover:shadow-lg transition-shadow">
              <Globe className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h4 className="font-bold mb-2">Global Coverage</h4>
              <p className="text-sm text-gray-600">Insurance coverage extends worldwide</p>
            </Card>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-50 py-20">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-slate-200 text-slate-700 border-slate-300">FAQs</Badge>
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about CSOAI</p>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-white border-l-4 border-emerald-500 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-3">Who can become an AI Safety Analyst?</h3>
              <p className="text-gray-600 leading-relaxed">
                Anyone with critical thinking and attention to detail. You do not need a computer
                science degree or coding experience. The training covers AI governance frameworks,
                risk classification and how our measurement method works — enough to read a system
                and a card critically. It does not make you a qualified auditor, it confers no
                regulatory standing, and it is not a route to accreditation, because we hold none to
                pass on.
              </p>
            </Card>

            <Card className="p-6 bg-white border-l-4 border-emerald-500 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-3">How long does the attestation exam take?</h3>
              <p className="text-gray-600 leading-relaxed">
                The exam is 50 questions in 90 minutes with a 70% passing threshold, and you can
                retake it as often as you need. We have not published completion times or a
                first-attempt pass rate, so we are not going to quote either — there is no cohort
                record behind those figures. What you get on passing is a completion record: a
                statement that you demonstrated the material on a date. Not a certification, not an
                accreditation, and no regulatory status.
              </p>
            </Card>

            <Card className="p-6 bg-white border-l-4 border-emerald-500 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-3">What do AI Safety Analysts actually do?</h3>
              <p className="text-gray-600 leading-relaxed">
                The honest answer is that this role is a bet on where the law is going, not a job we
                are currently staffing — see the earnings question below. The training covers reading
                a system against the EU AI Act and against the NIST AI RMF and ISO/IEC 42001 as
                reference frameworks: classifying risk, checking documentation, and writing up what
                is evidenced and what is not. What it does not cover, because we do not do it:
                making a final safety determination. Nobody here makes one. Determination stays with
                the competent authorities, and our part is the measurement they can recompute.
              </p>
            </Card>

            <Card className="p-6 bg-white border-l-4 border-emerald-500 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-3">How much can I earn?</h3>
              <p className="text-gray-600 leading-relaxed">
                There are no analyst engagements to offer today. A paid analyst programme is{" "}
                <strong>not yet available</strong> — no roster, no matching, no published terms and
                no cohort — and we are not going to describe rates, hours or a body of working
                analysts before any of that exists. What is available now is free: the training, the
                completion records, the banks, the grading code and the right to challenge any
                published measurement.
              </p>
            </Card>

            <Card className="p-6 bg-white border-l-4 border-emerald-500 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-3">Why should companies trust CSOAI?</h3>
              <p className="text-gray-600 leading-relaxed">
                Not on our architecture, and we will say why. We once claimed that a multi-provider
                council delivers decorrelated, unbiased review; we then measured how independent
                those seats actually were and got an effective n of 1.21 against 3 nominal legs, so
                we withdrew the guarantee (DR-0007) rather than rewording it. Trust us on the things
                you can check instead: no model judges a model — every verdict is deterministic code
                against pre-written gold labels; every published card verifies offline against a key
                in our DID document, with no account and no permission; nobody we measure pays for
                their place on the board, their score, or their removal from either; and what we got
                wrong is appended in public at /api/corrections and never edited.
              </p>
            </Card>

            <Card className="p-6 bg-white border-l-4 border-emerald-500 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-3">How is CSOAI different from other AI safety organizations?</h3>
              <p className="text-gray-600 leading-relaxed">
                We have not surveyed the field, so we will not tell you what most AI safety
                organisations do — our own claims register records comparative coverage of the
                evaluation landscape as UNMEASURED (CR-020). What we can describe is what we
                publish: a measurement instrument — {board.public_count}, live from GET /api/gspc,
                where a slot with no run behind it is published UNMEASURED and never counted as a
                measurement — over frozen benchmarks, open on Hugging Face and Kaggle with the
                scoring code, so anyone can recompute what we claim or dispute an answer key. And we
                publish the results that go against us: our own fine-tunes sit below the base models
                they were built on in our own signed arena reference. That is on{" "}
                <Link href="/honesty" className="text-emerald-700 underline">the honesty gate</Link>,
                read live from the artifact rather than typed.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-white py-20">
        <div className="container max-w-4xl">
          <Card className="p-12 bg-gradient-to-br from-slate-900 to-emerald-900 text-white text-center">
            <h2 className="text-4xl font-bold mb-6">Start with the free rail</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Training is free and the whole verification rail is free forever. We do not sell a
              grade, we do not certify anyone, and we cannot determine anyone's compliance — that
              stays with the competent authorities. What we can do is measure, sign, and publish
              what we could not measure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/academy">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Start Free Training
                </Button>
              </Link>
              <Link href="/os?lobby=measured&task=enterprise-start">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Enterprise lobby
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
