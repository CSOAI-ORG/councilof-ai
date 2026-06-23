"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Tier = "prohibited" | "high" | "limited" | "minimal";

const TOTAL_STEPS = 4;

export default function HighRiskClassifierClient() {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Tier | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const quizRef = useRef<HTMLDivElement>(null);

  const go = (i: number) => {
    setResult(null);
    setStep(i);
  };

  const answer = (tier: Tier) => {
    setResult(tier);
  };

  const reset = () => {
    setResult(null);
    setStep(0);
    if (quizRef.current) {
      quizRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    if (result !== null && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [result]);

  const progress = result !== null ? 100 : (step / TOTAL_STEPS) * 100;

  const optionButtonClass =
    "block w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left text-white transition hover:border-amber-400/50 hover:bg-amber-400/5";
  const optionSmallClass = "mt-1 block text-sm text-slate-400";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-20">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
            ⏱ EU AI Act Article 50 transparency duties apply 2 August 2026
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">
            Is My AI System <span className="text-amber-400">High-Risk?</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-slate-400">
            An interactive decision guide built on the published text of the EU AI Act (Regulation
            (EU) 2024/1689). Walk the Annex III categories and the Article 6(3) filter to get an
            instant classification and your next obligations.
          </p>
        </div>

        {/* Quiz */}
        <div
          ref={quizRef}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"
        >
          <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {result === null && step === 0 && (
            <div>
              <h3 className="mb-2 text-xl font-bold text-amber-400">
                Step 1 — Prohibited practices (Article 5)
              </h3>
              <p className="mb-6 text-sm text-slate-400">
                Does your system do any of the following? Social scoring of individuals; untargeted
                scraping of facial images to build recognition databases; manipulative subliminal or
                deceptive techniques that cause harm; real-time remote biometric identification in
                public spaces for law enforcement (outside narrow exceptions); emotion inference in
                workplaces or schools; or biometric categorisation by protected characteristics.
              </p>
              <button onClick={() => answer("prohibited")} className={optionButtonClass}>
                Yes — one or more applies
                <small className={optionSmallClass}>The system performs a banned practice.</small>
              </button>
              <button onClick={() => go(1)} className={optionButtonClass}>
                No — none of these apply
                <small className={optionSmallClass}>Continue to Annex III screening.</small>
              </button>
            </div>
          )}

          {result === null && step === 1 && (
            <div>
              <h3 className="mb-2 text-xl font-bold text-amber-400">
                Step 2 — Annex III domains
              </h3>
              <p className="mb-6 text-sm text-slate-400">
                Is the AI system used in, or as a safety component within, any of these eight
                domains?
              </p>
              <button onClick={() => go(2)} className={optionButtonClass}>
                Yes — biometrics, critical infrastructure, education, employment/HR, essential
                public or private services (e.g. credit, insurance, benefits), law enforcement,
                migration/border control, or justice/democratic processes
                <small className={optionSmallClass}>Continue to the narrow-task filter.</small>
              </button>
              <button onClick={() => go(3)} className={optionButtonClass}>
                No — none of these domains
                <small className={optionSmallClass}>Skip to transparency check.</small>
              </button>
            </div>
          )}

          {result === null && step === 2 && (
            <div>
              <h3 className="mb-2 text-xl font-bold text-amber-400">
                Step 3 — Article 6(3) narrow-task filter
              </h3>
              <p className="mb-6 text-sm text-slate-400">
                Within that domain, does the system ONLY perform a narrow procedural task, improve
                the result of a completed human activity, detect decision-making patterns without
                replacing human judgement, or do preparatory work — AND it does NOT profile natural
                persons?
              </p>
              <button onClick={() => answer("limited")} className={optionButtonClass}>
                Yes — it is a narrow, non-profiling task
                <small className={optionSmallClass}>
                  Likely exempt from high-risk under Article 6(3); transparency duties may still
                  apply.
                </small>
              </button>
              <button onClick={() => answer("high")} className={optionButtonClass}>
                No — it materially influences outcomes or profiles people
                <small className={optionSmallClass}>Classified high-risk.</small>
              </button>
            </div>
          )}

          {result === null && step === 3 && (
            <div>
              <h3 className="mb-2 text-xl font-bold text-amber-400">
                Step 4 — Transparency triggers (Article 50)
              </h3>
              <p className="mb-6 text-sm text-slate-400">
                Does the system interact directly with people (e.g. a chatbot), generate synthetic
                audio/image/video/text, perform emotion recognition or biometric categorisation, or
                produce deepfakes?
              </p>
              <button onClick={() => answer("limited")} className={optionButtonClass}>
                Yes — one or more applies
                <small className={optionSmallClass}>
                  Limited-risk: Article 50 transparency obligations apply.
                </small>
              </button>
              <button onClick={() => answer("minimal")} className={optionButtonClass}>
                No — none of these apply
                <small className={optionSmallClass}>Minimal risk: voluntary codes of conduct.</small>
              </button>
            </div>
          )}

          {result === "prohibited" && (
            <div
              ref={resultRef}
              className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 sm:p-8"
            >
              <h3 className="mb-4 text-2xl font-bold">🚫 Prohibited</h3>
              <p className="mb-4 text-slate-300">
                Your system appears to fall under an Article 5 prohibited practice. These cannot be
                placed on or used in the EU market. The prohibition has been in force since{" "}
                <strong className="text-white">2 February 2025</strong>.
              </p>
              <ul className="mb-6 list-none space-y-3 text-slate-300">
                <li className="relative pl-6 before:absolute before:left-0 before:text-amber-400 before:content-['→']">
                  Stop deployment in the EU and document the assessment.
                </li>
                <li className="relative pl-6 before:absolute before:left-0 before:text-amber-400 before:content-['→']">
                  Redesign to remove the banned function, or confirm a narrow legal exception with
                  counsel.
                </li>
                <li className="relative pl-6 before:absolute before:left-0 before:text-amber-400 before:content-['→']">
                  Penalties reach up to €35m or 7% of global annual turnover.
                </li>
              </ul>
              <button onClick={reset} className="rounded-lg border border-white/25 px-4 py-2 text-sm text-slate-400 transition hover:border-amber-400 hover:text-amber-400">
                ↺ Start over
              </button>
            </div>
          )}

          {result === "high" && (
            <div
              ref={resultRef}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8"
            >
              <h3 className="mb-4 text-2xl font-bold">⚠️ High-Risk (Annex III)</h3>
              <p className="mb-4 text-slate-300">
                Your system is likely high-risk. Obligations apply from{" "}
                <strong className="text-white">2 August 2026</strong> for Annex III use cases. You
                must put in place:
              </p>
              <ul className="mb-6 list-none space-y-3 text-slate-300">
                <li className="relative pl-6 before:absolute before:left-0 before:text-amber-400 before:content-['→']">
                  A continuous risk-management system and data-governance controls.
                </li>
                <li className="relative pl-6 before:absolute before:left-0 before:text-amber-400 before:content-['→']">
                  Technical documentation, automatic logging, and traceability.
                </li>
                <li className="relative pl-6 before:absolute before:left-0 before:text-amber-400 before:content-['→']">
                  Human oversight, plus accuracy, robustness, and cybersecurity measures.
                </li>
                <li className="relative pl-6 before:absolute before:left-0 before:text-amber-400 before:content-['→']">
                  A conformity assessment and registration in the EU high-risk database.
                </li>
                <li className="relative pl-6 before:absolute before:left-0 before:text-amber-400 before:content-['→']">
                  Clear instructions for use for downstream deployers.
                </li>
              </ul>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/pricing"
                  className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600"
                >
                  See CASA certification &amp; audit support
                </Link>
                <button onClick={reset} className="rounded-lg border border-white/25 px-4 py-2 text-sm text-slate-400 transition hover:border-amber-400 hover:text-amber-400">
                  ↺ Start over
                </button>
              </div>
            </div>
          )}

          {result === "limited" && (
            <div
              ref={resultRef}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 sm:p-8"
            >
              <h3 className="mb-4 text-2xl font-bold">
                ℹ️ Limited-Risk — Transparency obligations
              </h3>
              <p className="mb-4 text-slate-300">
                Your system is not high-risk, but it carries{" "}
                <strong className="text-white">Article 50</strong> transparency duties that apply
                from <strong className="text-white">2 August 2026</strong>.
              </p>
              <ul className="mb-6 list-none space-y-3 text-slate-300">
                <li className="relative pl-6 before:absolute before:left-0 before:text-amber-400 before:content-['→']">
                  Tell users they are interacting with an AI system.
                </li>
                <li className="relative pl-6 before:absolute before:left-0 before:text-amber-400 before:content-['→']">
                  Mark synthetic and AI-generated content in a machine-readable way.
                </li>
                <li className="relative pl-6 before:absolute before:left-0 before:text-amber-400 before:content-['→']">
                  Disclose deepfakes and AI-generated text on matters of public interest.
                </li>
                <li className="relative pl-6 before:absolute before:left-0 before:text-amber-400 before:content-['→']">
                  Inform people subject to emotion recognition or biometric categorisation.
                </li>
              </ul>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/article-50-explained"
                  className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600"
                >
                  Read the Article 50 guide
                </Link>
                <button onClick={reset} className="rounded-lg border border-white/25 px-4 py-2 text-sm text-slate-400 transition hover:border-amber-400 hover:text-amber-400">
                  ↺ Start over
                </button>
              </div>
            </div>
          )}

          {result === "minimal" && (
            <div
              ref={resultRef}
              className="rounded-2xl border border-emerald-600/30 bg-emerald-600/10 p-6 sm:p-8"
            >
              <h3 className="mb-4 text-2xl font-bold">✅ Minimal-Risk</h3>
              <p className="mb-4 text-slate-300">
                Your system appears to fall outside the prohibited, high-risk, and transparency
                tiers. No mandatory obligations apply, but best practice still matters.
              </p>
              <ul className="mb-6 list-none space-y-3 text-slate-300">
                <li className="relative pl-6 before:absolute before:left-0 before:text-amber-400 before:content-['→']">
                  Adopt a voluntary code of conduct.
                </li>
                <li className="relative pl-6 before:absolute before:left-0 before:text-amber-400 before:content-['→']">
                  Keep documentation in case the use case changes.
                </li>
                <li className="relative pl-6 before:absolute before:left-0 before:text-amber-400 before:content-['→']">
                  Re-run this check whenever you add features that profile people or generate
                  content.
                </li>
              </ul>
              <button onClick={reset} className="rounded-lg border border-white/25 px-4 py-2 text-sm text-slate-400 transition hover:border-amber-400 hover:text-amber-400">
                ↺ Start over
              </button>
            </div>
          )}

          <p className="mt-8 border-t border-white/10 pt-6 text-xs text-slate-500">
            This is an educational triage tool based on the published text of Regulation (EU)
            2024/1689 (EU AI Act). It is not legal advice and does not replace a documented
            conformity assessment. Verify edge cases against the official text and, where needed,
            with qualified counsel.
          </p>
        </div>
      </div>

      {/* Risk tiers */}
      <section className="border-t border-white/10 bg-slate-900/30 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-4 text-3xl font-black tracking-tighter sm:text-4xl">
            The four <span className="text-amber-400">risk tiers</span>
          </h2>
          <p className="mb-8 max-w-3xl text-lg text-slate-400">
            The EU AI Act is risk-based. Every system lands in one of four tiers, and the tier
            determines the obligations.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h4 className="mb-2 font-bold text-amber-400">Unacceptable</h4>
              <p className="text-sm text-slate-400">
                Banned outright under Article 5 — social scoring, manipulative techniques,
                untargeted biometric scraping. In force since Feb 2025.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h4 className="mb-2 font-bold text-amber-400">High-Risk</h4>
              <p className="text-sm text-slate-400">
                Annex III use cases and Annex I safety components. Full conformity regime; Annex
                III applies Dec 2027 (delayed by the Digital Omnibus), Annex I Aug 2027.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h4 className="mb-2 font-bold text-amber-400">Limited-Risk</h4>
              <p className="text-sm text-slate-400">
                Chatbots, generative content, deepfakes, emotion recognition. Article 50
                transparency duties from Aug 2026.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h4 className="mb-2 font-bold text-amber-400">Minimal-Risk</h4>
              <p className="text-sm text-slate-400">
                Everything else — spam filters, recommendation engines, most consumer AI. Voluntary
                codes only.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
