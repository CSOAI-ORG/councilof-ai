import { useEffect } from "react";

// UsStateAct - data-driven US state AI-law page (colorado / texas / california).
import SovereignSpot from "../components/SovereignSpot";
// State AI law is fast-moving; each page carries an "evolving law" disclaimer and
// FAQPage JSON-LD. Date-accurate as of June 2026; not legal advice.

type Faq = { q: string; a: string };
type St = { key: string; eyebrow: string; title: string; intro: string; scope: string[]; duties: string[]; faqs: Faq[] };
const STATES: Record<string, St> = {
  colorado: {
    key: "colorado", eyebrow: "CSOAI - Colorado AI Act",
    title: "Colorado AI regulation (SB 24-205 repealed → ADMT law SB 26-189)",
    intro: "The first comprehensive US state AI law. It targets algorithmic discrimination in consequential decisions and imposes a duty of reasonable care on developers and deployers of high-risk AI. Effective 2026 (verify the current date - it has been amended).",
    scope: ["High-risk AI in employment decisions", "Lending and financial services", "Housing and insurance", "Healthcare, legal, and education access"],
    duties: ["Use reasonable care to avoid algorithmic discrimination", "Complete impact assessments for high-risk systems", "Notify consumers when AI drives a consequential decision", "Disclose to the Attorney General on discovery of risk"],
    faqs: [
      { q: "What does the Colorado AI Act require?", a: "It requires developers and deployers of high-risk AI to use reasonable care to protect consumers from algorithmic discrimination, complete impact assessments, and provide consumer notices for consequential decisions." },
      { q: "When does the Colorado AI Act take effect?", a: "Important update: the original Colorado AI Act (SB 24-205) was repealed before taking effect and replaced by a new Automated Decision Making Technology (ADMT) law, SB 26-189, scheduled to take effect 1 January 2027 with a 60-day cure period and Attorney-General-only enforcement. Verify the current text, as state AI laws are evolving." },
      { q: "Who does it apply to?", a: "Both developers and deployers of high-risk AI systems used in consequential decisions affecting Colorado consumers." },
    ],
  },
  texas: {
    key: "texas", eyebrow: "CSOAI - Texas TRAIGA",
    title: "Texas Responsible AI Governance Act (TRAIGA)",
    intro: "Texas takes a prohibited-use approach: rather than a broad risk regime, it bans specific harmful AI uses and adds duties for government and certain private deployers. Effective 2026 (verify the current date).",
    scope: ["AI intended to manipulate human behavior unlawfully", "Government social-scoring systems", "Unlawful biometric and surveillance uses", "Certain government AI deployments"],
    duties: ["Avoid prohibited and manipulative AI uses", "Government disclosure of AI interactions", "Honor the banned-use list", "Cooperate with state oversight"],
    faqs: [
      { q: "What is the Texas Responsible AI Governance Act?", a: "TRAIGA is a Texas AI law that focuses on banning specific harmful AI uses - such as unlawful manipulation, government social scoring, and certain biometric uses - and adds duties for government and some private deployers." },
      { q: "How is TRAIGA different from the Colorado AI Act?", a: "Colorado uses a broad high-risk / anti-discrimination framework, while Texas TRAIGA centers on a prohibited-use list and government-focused duties." },
      { q: "When does TRAIGA take effect?", a: "TRAIGA took effect on 1 January 2026." },
    ],
  },
  california: {
    key: "california", eyebrow: "CSOAI - California AI laws",
    title: "California AI laws - the patchwork",
    intro: "California has no single AI act; instead a set of targeted laws apply - training-data transparency, AI content disclosure, and automated-decision rules under privacy law. Together they form one of the toughest US environments.",
    scope: ["Generative-AI training-data transparency (AB 2013)", "AI content disclosure / watermarking (SB 942)", "Automated decision-making technology under CPRA", "Sector rules (employment, health, elections)"],
    duties: ["Publish training-data documentation for GenAI", "Disclose and mark AI-generated content", "Honor opt-outs and access rights for automated decisions", "Run risk assessments under CPRA rulemaking"],
    faqs: [
      { q: "Does California have an AI law?", a: "California has no single AI act but several targeted laws, including AB 2013 (training-data transparency), SB 942 (AI content disclosure), and automated-decision-making rules under the CPRA." },
      { q: "What is California AB 2013?", a: "AB 2013 requires developers of generative AI to publish documentation about the data used to train their systems." },
      { q: "Do CPRA rules cover AI?", a: "Yes. California's privacy rulemaking covers automated decision-making technology, including access, opt-out, and risk-assessment expectations." },
    ],
  },
};

export default function UsStateAct({ state }: { state: string }) {
  const s = STATES[state] || STATES.colorado;
  useEffect(() => { document.title = s.title + " | CSOAI"; }, [s.title]);
  useEffect(() => {
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.text = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": s.faqs.map((f) => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })) });
    document.head.appendChild(sc);
    return () => { document.head.removeChild(sc); };
  }, [s.key]);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">{s.eyebrow}</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">{s.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">{s.intro}</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">What it covers</h2>
          <ul className="mt-4 space-y-2">
            {s.scope.map((x) => (<li key={x} className="flex items-start gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700"><span className="mt-0.5 text-amber-500 font-black">!</span>{x}</li>))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">What you must do</h2>
          <ul className="mt-4 space-y-2">
            {s.duties.map((x) => (<li key={x} className="flex items-start gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700"><span className="mt-0.5 text-emerald-600 font-black">+</span>{x}</li>))}
          </ul>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 pb-8">
        <h2 className="text-xl font-bold text-gray-900">Questions, answered</h2>
        <div className="mt-4 space-y-3">
          {s.faqs.map((f) => (<div key={f.q} className="rounded-2xl border border-gray-200 p-5"><div className="font-bold text-gray-900">{f.q}</div><p className="mt-1 text-sm text-gray-600">{f.a}</p></div>))}
        </div>
        <p className="mt-6 text-xs text-gray-400">US state AI laws are evolving quickly. This reflects the position as of June 2026 and is not legal advice - verify current effective dates and requirements.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/regions" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">All US + global regs -&gt;</a>
          <a href="/readiness" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Scan my readiness -&gt;</a>
          <a href="/nist-vs-eu-ai-act" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">NIST + EU AI Act -&gt;</a>
        </div>
      </section>
      <section className="bg-[#03110b] py-10"><div className="mx-auto max-w-5xl px-6">
        <SovereignSpot topic={(s.title || "this US state AI law") + " — who's covered and what to do"} layer="regulators" suggest={"Who must comply with " + (s.title || "this law") + ", and by when?"} />
      </div></section>
    </div>
  );
}
