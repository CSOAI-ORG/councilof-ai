/**
 * EU AI Act Article 50 — Emergency Compliance Kit landing page
 *
 * 50 days to the cliff (2 August 2026). The Digital Omnibus delayed the
 * high-risk Annex III cliff by 12 months, but Article 50 (watermarking +
 * transparency for AI-generated content + chatbots) is LIVE on 2 Aug 2026.
 *
 * This page is the conversion surface for the £999 one-time Kit. After
 * the cliff, the price goes up — the Kit is intentionally the cheapest
 * way to comply on the cliff.
 *
 * Wired to the Stripe canonical ladder:
 * - £199/mo Pro — ongoing compliance
 * - £999 one-time Kit — one-time purchase
 * - £4,950 Assessment — full gap analysis + cert
 *
 * Uses meok-watermark-attest-mcp (5 tools) + meok-attestation-api
 * (Ed25519 SIGIL) under the hood. The /v/{cert_id} verify URL is
 * publicly readable.
 */

import { motion } from "framer-motion";
import {
  Shield, AlertTriangle, CheckCircle2, Clock, Calendar, ArrowRight,
  ExternalLink, FileText, Zap, Award, Euro, Mail, BookOpen, Lock,
  Server, Globe, Scale, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

// Canonical Stripe price IDs (from meok-attestation-api/checkout canonical ladder)
// £999 one-time Article 50 Kit: plink_...8k91H
// £199/mo Pro: plink_...8k91F
// £4,950 Assessment: plink_...8k91G
const STRIPE_KIT_URL = "https://buy.stripe.com/4gMcN7a8s6oq0ZTaqI8k91Z";
const STRIPE_PRO_URL = "https://buy.stripe.com/00wfZjbcw9ACcIBfL28k91K";
const STRIPE_ASSESSMENT_URL = "https://buy.stripe.com/cNieVf0xS7sueQJfL28k91G";

const ARTICLE_50_DEADLINE = "2026-08-02T00:00:00Z";
const DAYS_TO_CLIFF = 50; // Verified 2026-06-12

const OBLIGATIONS = [
  {
    code: "Art 50(1)",
    title: "Chatbot disclosure",
    trigger: "AI system that interacts with natural persons (chatbots, voice assistants)",
    obligation: "Inform natural persons they are interacting with an AI, unless obvious from context",
    surfaces: ["UI banner", "API response payload", "TTS opening", "Capability description"],
    fine: "€35M or 7% of global turnover",
  },
  {
    code: "Art 50(2)",
    title: "Synthetic content watermarking",
    trigger: "GPAI providers generating synthetic audio / image / video / text",
    obligation: "Mark outputs in machine-readable format + detectable as AI-generated",
    surfaces: ["C2PA manifest (metadata)", "Cryptographic watermark", "Provenance record"],
    fine: "€35M or 7% of global turnover",
  },
  {
    code: "Art 50(3)",
    title: "Emotion recognition + biometric categorisation",
    trigger: "Deployer of emotion-recognition OR biometric-categorisation system",
    obligation: "Inform exposed natural persons of system operation",
    surfaces: ["UI notice", "Privacy policy (GDPR + LED + Reg 2018/1725)"],
    fine: "€35M or 7% of global turnover",
  },
  {
    code: "Art 50(4)",
    title: "Deepfake disclosure",
    trigger: "Deployer generating/manipulating image/audio/video constituting a 'deep fake'",
    obligation: "Disclose that content has been artificially generated or manipulated",
    surfaces: ["On-image caption", "Metadata manifest", "UI label"],
    fine: "€35M or 7% of global turnover",
  },
  {
    code: "Art 50(4)",
    title: "AI-generated text on public-interest matters",
    trigger: "Deployer publishing AI-generated/manipulated text on matters of public interest",
    obligation: "Disclose the text has been artificially generated or manipulated",
    surfaces: ["Editorial footer", "Metadata", "UI notice"],
    fine: "€35M or 7% of global turnover",
  },
];

const KIT_DELIVERABLES = [
  {
    title: "Self-classification tool",
    detail: "Map your system to the 4 Art 50 sub-articles in 60 seconds. Free at csoai.org/council/sigil — backed by meok-watermark-attest-mcp.",
    icon: Shield,
  },
  {
    title: "5 disclosure-text templates × 5 surfaces × 5 languages",
    detail: "UI, API, metadata, TTS, image_caption × en, de, fr, es, it. For each triggered Art 50 sub-article. Drop-in, MIT-licensed, no attribution required.",
    icon: FileText,
  },
  {
    title: "C2PA manifest generator",
    detail: "Python + TypeScript reference implementation of a C2PA 2.0 manifest for AI-generated assets. Sign with your key OR with our SIGIL Ed25519 (free tier 1 cert/day, Pro unlimited).",
    icon: Lock,
  },
  {
    title: "Audit-evidence cert",
    detail: "One HMAC-SHA256-signed attestation via meok-attestation-api, with public /v/{id} verify URL. Auditor-friendly, hash-chained, no shadow keys.",
    icon: Award,
  },
  {
    title: "PIPIA-style self-assessment",
    detail: "Mandatory for high-risk processing per GDPR Art 35 / EU AI Act Art 27. We give you the 12-section template with example answers.",
    icon: BookOpen,
  },
  {
    title: "Cross-region watch",
    detail: "Map your Art 50 compliance posture to PIPL (China) + APPI (Japan) + Colorado AI Act (US) + UK AISI in one click. If you're shipping globally, you need this.",
    icon: Globe,
  },
];

export default function Article50Kit() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero — countdown + cliff framing */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold">
              <Clock className="w-3 h-3 mr-1" />
              {DAYS_TO_CLIFF} DAYS TO ENFORCEMENT
            </Badge>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              EU AI Act • Article 50
            </Badge>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-6 bg-gradient-to-r from-white via-emerald-200 to-cyan-200 bg-clip-text text-transparent">
            The Article 50 Emergency Kit.
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mb-4">
            <strong className="text-white">50 days.</strong> The EU AI Act Article 50
            (watermarking + transparency for AI-generated content, chatbots,
            deepfakes, emotion recognition) is fully applicable on{" "}
            <strong className="text-rose-300">2 August 2026</strong>. The
            Digital Omnibus delayed the high-risk Annex III cliff by 12
            months — but <strong>not</strong> Art 50. The cliff is real.
          </p>
          <p className="text-lg text-slate-400 max-w-3xl mb-8">
            The Article 50 Kit is the fastest path to compliance on the cliff.
            £999 one-time. No subscription. No retainer. No 6-week
            engagement. Real MCPs, real Ed25519 certs, real auditor-acceptable
            evidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-lg px-8 py-6">
              <a href={STRIPE_KIT_URL} target="_blank" rel="noreferrer">
                Get the Kit — £999
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10">
              <Link href="/council/sigil">
                Free self-classification
                <Shield className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-600 text-slate-300">
              <Link href="/council/sigil">
                Read the SIGIL spec
                <FileText className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>

          {/* 4-up: what / why / how / price */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Penalty for non-compliance</p>
              <p className="text-2xl font-black text-rose-300">€35M</p>
              <p className="text-xs text-slate-500">or 7% of global turnover</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Time to comply</p>
              <p className="text-2xl font-black text-emerald-300">~4 hours</p>
              <p className="text-xs text-slate-500">for most use cases</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Sub-articles covered</p>
              <p className="text-2xl font-black text-cyan-300">4 of 5</p>
              <p className="text-xs text-slate-500">all triggered by chat / gen / detect</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Languages</p>
              <p className="text-2xl font-black text-violet-300">5</p>
              <p className="text-xs text-slate-500">en, de, fr, es, it (more on ask)</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* What Article 50 actually requires */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-black mb-3">What Article 50 actually requires</h2>
        <p className="text-slate-400 mb-8 max-w-3xl">
          Article 50 is the transparency + watermarking clause. The Digital
          Omnibus delayed the high-risk Annex III cliff, but the 4 sub-articles
          below bite on 2 August 2026 regardless. Most AI products trigger
          at least 2.
        </p>
        <div className="space-y-3">
          {OBLIGATIONS.map((o) => (
            <div key={o.code + o.title} className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div>
                  <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 mb-2 mr-2">
                    {o.code}
                  </Badge>
                  <span className="text-lg font-bold text-white">{o.title}</span>
                </div>
                <span className="text-xs font-mono text-rose-300 bg-rose-500/10 px-2 py-1 rounded">
                  Fine: {o.fine}
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-2">
                <strong className="text-slate-300">Trigger:</strong> {o.trigger}
              </p>
              <p className="text-sm text-slate-400 mb-2">
                <strong className="text-slate-300">Obligation:</strong> {o.obligation}
              </p>
              <p className="text-xs text-slate-500">
                <strong className="text-slate-400">Surfaces:</strong> {o.surfaces.join(" • ")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What's in the Kit */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-black mb-3">What you get</h2>
        <p className="text-slate-400 mb-8 max-w-3xl">
          6 deliverables. Drop-in. MIT-licensed source. No retainer, no
          6-week engagement, no "we'll get back to you in Q3". The Kit
          is what the CSOAI team itself uses for our own AI products.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {KIT_DELIVERABLES.map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.title} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 shrink-0">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">{d.title}</h3>
                    <p className="text-sm text-slate-400">{d.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-black mb-3">How it works</h2>
        <div className="space-y-4">
          {[
            {
              step: "1",
              title: "Self-classify (5 min)",
              body: "Answer 8 yes/no questions about your AI system. The MCP returns which of the 4 sub-articles apply, the exact text templates, and the audit-evidence cert ID.",
            },
            {
              step: "2",
              title: "Drop in the templates (1-2 hours)",
              body: "Copy the disclosure text for each surface (UI / API / metadata / TTS / image_caption) into your product. For C2PA manifests, use the Python or TypeScript reference impl.",
            },
            {
              step: "3",
              title: "Sign an attestation (30 sec)",
              body: "Call meok-attestation-api /sign. We return cert_id + signature + /v/{id} verify URL. Auditor clicks the URL, sees the public key + payload + SIGIL kid. Done.",
            },
            {
              step: "4",
              title: "Hand the verify URL to your auditor (1 email)",
              body: "They don't need a backend, an account, or a CSOAI license. They paste the URL in any browser. They see: kid, pubkey, payload, signature, hash chain. Auditor-acceptable.",
            },
          ].map((s) => (
            <div key={s.step} className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-black shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-200 mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-300">{s.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing ladder */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-black mb-3">The ladder</h2>
        <p className="text-slate-400 mb-8 max-w-3xl">
          The Kit is the one-time purchase. If you need ongoing compliance
          + monitoring, the Pro tier adds unlimited signed attestations
          + dashboard. If you need a full gap analysis + written report,
          the Assessment is the on-call engagement.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-white/5 border border-emerald-500/30 ring-2 ring-emerald-500/20">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-3">
              <Zap className="w-3 h-3 mr-1" />
              THE KIT
            </Badge>
            <p className="text-4xl font-black text-white mb-1">£999</p>
            <p className="text-sm text-slate-400 mb-4">one-time</p>
            <ul className="space-y-2 text-sm text-slate-300 mb-6">
              <li>✓ Self-classification (1 cert, free)</li>
              <li>✓ 5 disclosure templates × 5 surfaces × 5 languages</li>
              <li>✓ C2PA manifest reference impl (Py + TS)</li>
              <li>✓ 1 audit-evidence attestation (HMAC-SHA256)</li>
              <li>✓ PIPIA self-assessment template</li>
              <li>✓ Cross-region watch (PIPL, APPI, Colorado, UK AISI)</li>
              <li>— No ongoing monitoring</li>
              <li>— No dashboard</li>
            </ul>
            <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold">
              <a href={STRIPE_KIT_URL} target="_blank" rel="noreferrer">
                Get the Kit — £999
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 mb-3">
              <Activity className="w-3 h-3 mr-1" />
              PRO
            </Badge>
            <p className="text-4xl font-black text-white mb-1">£199<span className="text-base font-normal text-slate-500">/mo</span></p>
            <p className="text-sm text-slate-400 mb-4">billed monthly</p>
            <ul className="space-y-2 text-sm text-slate-300 mb-6">
              <li>✓ Everything in the Kit</li>
              <li>✓ <strong>Unlimited</strong> audit attestations</li>
              <li>✓ Real-time Council substrate dashboard</li>
              <li>✓ Watchdog monitoring (4-hour checks)</li>
              <li>✓ Email alerts on framework changes</li>
              <li>✓ API access for in-pipeline signing</li>
              <li>✓ Priority support (1 business day)</li>
              <li>— No on-call engagement</li>
            </ul>
            <Button asChild variant="outline" className="w-full border-cyan-500/30 text-cyan-300">
              <a href={STRIPE_PRO_URL} target="_blank" rel="noreferrer">
                Start Pro — £199/mo
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 mb-3">
              <Scale className="w-3 h-3 mr-1" />
              ASSESSMENT
            </Badge>
            <p className="text-4xl font-black text-white mb-1">£4,950</p>
            <p className="text-sm text-slate-400 mb-4">one-time, 48-hour SLA</p>
            <ul className="space-y-2 text-sm text-slate-300 mb-6">
              <li>✓ Everything in Pro (1 month included)</li>
              <li>✓ Full gap analysis (5 frameworks: EU AI Act, GDPR, NIST RMF, ISO 42001, TC260)</li>
              <li>✓ Written report (regulator-format)</li>
              <li>✓ PIPIA authored for you</li>
              <li>✓ Risk classification + scoring</li>
              <li>✓ 2× 1-hour consultation calls</li>
              <li>✓ Auditor handoff (they get the cert + report directly)</li>
              <li>✓ 30-day post-delivery support</li>
            </ul>
            <Button asChild variant="outline" className="w-full border-violet-500/30 text-violet-300">
              <a href={STRIPE_ASSESSMENT_URL} target="_blank" rel="noreferrer">
                Book Assessment — £4,950
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl sm:text-4xl font-black mb-8">Honest FAQ</h2>
        <div className="space-y-4">
          {[
            {
              q: "Why £999 and not free?",
              a: "The disclosure templates, C2PA reference impl, and self-classification are MIT-licensed and free. The £999 pays for: (1) the audit-evidence attestation signed by the CSOAI engine spine (Ed25519, hash-chained, no shadow keys), (2) the cross-region watch (we maintain PIPL + APPI + Colorado + UK mappings), and (3) the 1 cert/day free tier of the attestation API. The MCPs are free. The signed proof is not.",
            },
            {
              q: "Will this actually pass an EU regulator audit?",
              a: "The output is the same artefacts an auditor expects: classified obligations, deployed disclosure text, signed attestation, and a hash-chained audit log. The attestation is publicly verifiable at /v/{id} without any account or backend access. If your auditor needs more (full gap analysis + written report), that's the £4,950 Assessment.",
            },
            {
              q: "Is this legal advice?",
              a: "No. The MCPs and templates are compliance tools, not legal advice. For binding interpretation of Art 50 in your specific situation, consult an EU AI Act lawyer (we can refer).",
            },
            {
              q: "What about PIPL (China) + APPI (Japan) + Colorado AI Act (US)?",
              a: "The cross-region watch is included in the Kit. One classification → multiple region flags. If you're shipping globally, you also need: PIPL Art 13 consent (if you handle Chinese PI), APPI cross-border consent (if you ship to Japan), Colorado AI Act SB24-205 (if you serve Colorado residents), and UK AISI expectations (if you ship to the UK).",
            },
            {
              q: "Why now and not after the cliff?",
              a: "Two reasons. (1) The EU AI Office has the power to issue fines from 2 Aug 2026. Your customers and partners will start asking for compliance evidence from that date. (2) Once the cliff hits, every AI shop in EU will be buying the same thing at the same time — Kit price goes up, support queue goes deep, signed attestations queue up. Buy on the cliff = buy at the back of the queue.",
            },
            {
              q: "What if the Digital Omnibus changes Article 50?",
              a: "It didn't. We track every Commission + Parliament + Council move on the EU AI Act, including the Digital Omnibus, the AI Act Omnibus, the Code of Practice, and the harmonised standards. If Art 50 changes, the MCP updates within 24 hours and your signed attestation still holds (the substrate is content-addressed).",
            },
          ].map((f) => (
            <details key={f.q} className="p-5 rounded-xl bg-white/5 border border-white/10">
              <summary className="font-bold text-white cursor-pointer">{f.q}</summary>
              <p className="mt-3 text-slate-300 text-sm leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            {DAYS_TO_CLIFF} days. Don't be the back of the queue.
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            Buy the Kit now. Run self-classify. Drop in the templates.
            Hand the verify URL to your auditor. Sleep through the cliff.
          </p>
          <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-lg px-12 py-7">
            <a href={STRIPE_KIT_URL} target="_blank" rel="noreferrer">
              Get the Article 50 Kit — £999
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </Button>
          <p className="text-xs text-slate-500 mt-4">
            £999 one-time. No subscription. No retainer. The Kit pays for
            itself the first time an EU regulator asks for your Art 50
            evidence.
          </p>
        </motion.div>
      </section>
    </main>
  );
}
