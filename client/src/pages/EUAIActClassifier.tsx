import { useEffect } from "react";
import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, ShieldCheck, ShieldX, Info, ArrowRight, ArrowLeft, RotateCcw,
  CheckCircle2, Sparkles,
} from 'lucide-react';

/**
 * Free, ungated EU AI Act Risk Classifier — classifies an AI system into the
 * Act's risk tiers (Prohibited / High-risk / Limited / Minimal) and returns the
 * obligations, deadlines and next steps. Rule-based (Regulation 2024/1689:
 * Art 5 prohibitions, Annex III high-risk, Art 50 transparency). Client-side,
 * no login — the top-of-funnel lead magnet.
 */

type Tier = 'prohibited' | 'high' | 'limited' | 'minimal';

const PROHIBITED = [
  { id: 'social-scoring', label: 'Social scoring of people by public authorities or on their behalf' },
  { id: 'manipulation', label: 'Subliminal / manipulative or deceptive techniques that distort behaviour and cause harm' },
  { id: 'vulnerability', label: 'Exploits vulnerabilities of a specific group (age, disability, social/economic situation)' },
  { id: 'rt-biometric', label: 'Real-time remote biometric identification in public spaces for law enforcement' },
  { id: 'biometric-cat', label: 'Biometric categorisation inferring sensitive attributes (race, politics, sexual orientation, beliefs)' },
  { id: 'emotion-work', label: 'Emotion recognition in the workplace or education settings' },
  { id: 'face-scraping', label: 'Untargeted scraping of facial images to build/expand recognition databases' },
  { id: 'predictive-policing', label: 'Predicting criminal offending based solely on profiling / personality' },
];

const HIGH_RISK = [
  { id: 'biometrics', label: 'Biometrics — remote identification, categorisation, or emotion recognition (where permitted)' },
  { id: 'critical-infra', label: 'Safety component of critical infrastructure (water, gas, electricity, traffic)' },
  { id: 'education', label: 'Education / vocational training — admissions, evaluation, exam monitoring' },
  { id: 'employment', label: 'Employment — recruitment, screening, promotion, task allocation, performance monitoring' },
  { id: 'essential-services', label: 'Access to essential services — credit scoring, insurance pricing, benefits, emergency dispatch' },
  { id: 'law-enforcement', label: 'Law enforcement — risk assessments, evidence evaluation, profiling' },
  { id: 'migration', label: 'Migration, asylum & border control' },
  { id: 'justice', label: 'Administration of justice & democratic processes (incl. influencing elections)' },
  { id: 'annex-i', label: 'Safety component of a product already regulated under EU law (medical devices, machinery, toys, vehicles…)' },
];

const TRANSPARENCY = [
  { id: 'chatbot', label: 'Interacts directly with people (chatbot / virtual assistant)' },
  { id: 'genai', label: 'Generates synthetic text, image, audio or video (incl. deepfakes / GenAI output)' },
  { id: 'emotion-other', label: 'Emotion recognition or biometric categorisation in permitted contexts' },
];

const TIER_META: Record<Tier, {
  title: string; color: string; bg: string; Icon: typeof ShieldAlert; verdict: string;
  obligations: string[]; deadline: string;
}> = {
  prohibited: {
    title: 'Prohibited', color: 'text-rose-400', bg: 'from-rose-500/20 to-rose-900/10', Icon: ShieldX,
    verdict: 'This use is banned under Article 5 of the EU AI Act.',
    deadline: 'In force since 2 Feb 2025',
    obligations: [
      'You may NOT place this system on the EU market or put it into service.',
      'Cease/redesign the prohibited practice immediately — fines up to €35M or 7% of global turnover.',
      'If a feature is the problem, scope it out and re-run this classifier on the compliant version.',
    ],
  },
  high: {
    title: 'High-Risk', color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-900/10', Icon: ShieldAlert,
    verdict: 'High-risk system under Annex III / Annex I — the full obligations apply.',
    deadline: 'Annex III: 2 Dec 2027 · Annex I (regulated products): 2 Aug 2028 — as amended by the Digital Omnibus, Reg (EU) 2026/1744',
    obligations: [
      'Risk management system (Art 9) + data governance (Art 10).',
      'Technical documentation (Art 11) + automatic logging (Art 12).',
      'Transparency & instructions for use (Art 13) + human oversight (Art 14).',
      'Accuracy, robustness & cybersecurity (Art 15).',
      'Conformity assessment + CE marking + EU database registration before market.',
      'Post-market monitoring + serious-incident reporting (Art 73).',
    ],
  },
  limited: {
    title: 'Limited-Risk', color: 'text-sky-400', bg: 'from-sky-500/20 to-sky-900/10', Icon: Info,
    verdict: 'Transparency obligations apply under Article 50.',
    deadline: 'In force since 2 Aug 2026 (legacy generative systems: marking grace to 2 Dec 2026)',
    obligations: [
      'Tell users they are interacting with an AI system (chatbots).',
      'Mark AI-generated/manipulated content as artificial (machine-readable, e.g. C2PA) — deepfake labelling.',
      'Disclose emotion-recognition / biometric-categorisation to the people exposed.',
      'Otherwise free to operate — no conformity assessment required.',
    ],
  },
  minimal: {
    title: 'Minimal-Risk', color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-900/10', Icon: ShieldCheck,
    verdict: 'No mandatory obligations under the EU AI Act today.',
    deadline: 'No fixed deadline',
    obligations: [
      'No mandatory requirements — the vast majority of AI systems land here.',
      'Voluntary codes of conduct encouraged (Art 95).',
      'Re-assess if you add features or change purpose — and watch GPAI obligations if you use large models.',
    ],
  },
};

const STEPS = [
  { key: 'prohibited', title: 'Banned practices', q: 'Does your AI system do ANY of the following?', sub: 'Article 5 — these uses are prohibited in the EU.', items: PROHIBITED },
  { key: 'high', title: 'High-risk domains', q: 'Is your system used in ANY of these areas?', sub: 'Annex III / Annex I — these trigger the full high-risk regime.', items: HIGH_RISK },
  { key: 'transparency', title: 'Transparency triggers', q: 'Does your system do ANY of these?', sub: 'Article 50 — these trigger transparency duties.', items: TRANSPARENCY },
] as const;

export default function EUAIActClassifier() {
  useEffect(() => { document.title = "Free EU AI Act Risk Classifier — Is Your AI High-Risk? | CSOAI"; }, []);
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Set<string>>>({ prohibited: new Set(), high: new Set(), transparency: new Set() });
  const [done, setDone] = useState(false);

  const tier: Tier = useMemo(() => {
    if (answers.prohibited.size > 0) return 'prohibited';
    if (answers.high.size > 0) return 'high';
    if (answers.transparency.size > 0) return 'limited';
    return 'minimal';
  }, [answers]);

  const toggle = (group: string, id: string) =>
    setAnswers((a) => {
      const n = new Set(a[group]); n.has(id) ? n.delete(id) : n.add(id);
      return { ...a, [group]: n };
    });

  const reset = () => { setAnswers({ prohibited: new Set(), high: new Set(), transparency: new Set() }); setStep(0); setDone(false); };
  const cur = STEPS[step];
  const meta = TIER_META[tier];

  const schema = {
    '@context': 'https://schema.org', '@type': 'HowTo',
    name: 'Classify your AI system under the EU AI Act',
    description: 'Free 3-step tool to determine your AI system\'s EU AI Act risk tier and obligations.',
    step: STEPS.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title, text: s.q })),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#070b14] to-[#0c1322] text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-4">
            <Sparkles className="w-4 h-4" /> Free · no login · 60 seconds
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">EU AI Act <span className="text-emerald-400">Risk Classifier</span></h1>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">Answer 3 quick questions and get your system's risk tier, the exact obligations, and your deadlines — the same classification consultants charge thousands for.</p>
        </div>

        {!done && (
          <>
            <div className="flex items-center gap-2 mb-6">
              {STEPS.map((s, i) => (
                <div key={s.key} className={`h-1.5 flex-1 rounded-full transition ${i <= step ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="text-xs uppercase tracking-wider text-emerald-400 font-bold">Step {step + 1} of {STEPS.length} · {cur.title}</div>
                <h2 className="text-xl font-bold mt-1">{cur.q}</h2>
                <p className="text-sm text-slate-500 mb-4">{cur.sub}</p>
                <div className="space-y-2">
                  {cur.items.map((it) => {
                    const checked = answers[cur.key].has(it.id);
                    return (
                      <button key={it.id} onClick={() => toggle(cur.key, it.id)} data-testid={`opt-${it.id}`}
                        className={`w-full text-left flex items-start gap-3 rounded-xl border p-3 transition ${checked ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'}`}>
                        <span className={`mt-0.5 w-5 h-5 rounded grid place-items-center shrink-0 ${checked ? 'bg-emerald-500 text-slate-950' : 'border border-slate-600'}`}>
                          {checked && <CheckCircle2 className="w-4 h-4" />}
                        </span>
                        <span className="text-sm text-slate-200">{it.label}</span>
                      </button>
                    );
                  })}
                  <button onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : setDone(true)} className="text-xs text-slate-500 hover:text-slate-300 pt-1">None of these apply →</button>
                </div>
                <div className="flex justify-between mt-6">
                  <button onClick={() => step === 0 ? null : setStep(step - 1)} disabled={step === 0}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 disabled:opacity-30"><ArrowLeft className="w-4 h-4" /> Back</button>
                  <button onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : setDone(true)} data-testid="classifier-next"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                    {step < STEPS.length - 1 ? 'Next' : 'See my result'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        )}

        {done && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
            <div className={`rounded-2xl border border-slate-700 bg-gradient-to-br ${meta.bg} p-6`}>
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-xl bg-slate-900/50"><meta.Icon className={`w-8 h-8 ${meta.color}`} /></span>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400">Your classification</div>
                  <h2 className={`text-3xl font-extrabold ${meta.color}`}>{meta.title}</h2>
                </div>
              </div>
              <p className="mt-4 text-slate-200 font-medium">{meta.verdict}</p>
              <p className="text-sm text-amber-300/90 mt-1">⏱ {meta.deadline}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h3 className="font-bold mb-3">What you must do</h3>
              <ul className="space-y-2">
                {meta.obligations.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />{o}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
              <h3 className="font-bold text-lg">Turn this into a compliance plan</h3>
              <p className="text-sm text-slate-400 mt-1 mb-4">CSOAI maps your tier to a step-by-step plan across 22 frameworks, generates audit-ready reports, and tracks your deadlines.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => setLocation('/signup?source=classifier')} className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Get my compliance plan →</button>
                <button onClick={() => setLocation('/opengridworks')} className="px-6 py-3 rounded-xl border border-slate-600 text-slate-200 hover:border-emerald-500 font-semibold">See global regulations map</button>
              </div>
            </div>
            <button onClick={reset} className="mx-auto flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300"><RotateCcw className="w-4 h-4" /> Classify another system</button>
            <p className="text-[11px] text-slate-600 text-center max-w-lg mx-auto">Indicative classification under Regulation (EU) 2024/1689 for guidance only — not legal advice. Edge cases (GPAI, dual-use, regulated products) may need expert review.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
