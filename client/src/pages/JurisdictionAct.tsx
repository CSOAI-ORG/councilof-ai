import { useEffect } from "react";
import SovereignSpot from "../components/SovereignSpot";

// JurisdictionAct - data-driven non-EU AI-regulation page (uk / canada / china / singapore).
// Fast-moving area; each carries an "evolving / verify status" disclaimer + FAQ JSON-LD.
type Faq = { q: string; a: string };
type J = { key: string; eyebrow: string; title: string; intro: string; approach: string; points: string[]; faqs: Faq[] };
const JX: Record<string, J> = {
  uk: {
    key: "uk", eyebrow: "CSOAI - United Kingdom",
    title: "UK AI regulation",
    intro: "The UK has chosen a pro-innovation, principles-based path rather than a single AI act - existing regulators apply five cross-sector principles to AI in their domains.",
    approach: "Principles-based, regulator-led (no omnibus AI law)",
    points: ["Five principles: safety, transparency, fairness, accountability, contestability", "Existing regulators (ICO, FCA, Ofcom, CMA) apply them sector by sector", "AI Safety Institute evaluates frontier models", "Targeted legislation possible for the most powerful models"],
    faqs: [
      { q: "Does the UK have an AI law?", a: "Not a single comprehensive one. The UK uses a pro-innovation, principles-based approach in which existing sector regulators apply five cross-cutting AI principles. Targeted legislation for frontier models remains under discussion." },
      { q: "How is the UK approach different from the EU AI Act?", a: "The EU AI Act is a binding, risk-tiered omnibus law; the UK relies on existing regulators applying principles, with lighter central legislation." },
      { q: "Who regulates AI in the UK?", a: "Sector regulators such as the ICO, FCA, Ofcom, and CMA, supported by the AI Safety Institute for frontier-model evaluation." },
    ],
  },
  canada: {
    key: "canada", eyebrow: "CSOAI - Canada",
    title: "Canada AIDA (Bill C-27)",
    intro: "Canada's Artificial Intelligence and Data Act (AIDA) was proposed within Bill C-27, but the bill died on the order paper on 6 January 2025 when Parliament was prorogued. AIDA is not law; the government signalled in June 2025 that it will not return in its original form - only parts may survive in a new framework. Verify the latest position.",
    approach: "AIDA proposal lapsed - Bill C-27 died Jan 2025; no comprehensive AI law in force",
    points: ["Focus on high-impact AI systems", "Risk-assessment, mitigation, and transparency duties", "Record-keeping and incident reporting", "Oversight via a proposed AI and Data Commissioner"],
    faqs: [
      { q: "What is Canada's AIDA?", a: "The Artificial Intelligence and Data Act, proposed within Bill C-27, would have regulated high-impact AI systems with risk-assessment, mitigation, transparency, and record-keeping duties. However, Bill C-27 died on the order paper in January 2025, so AIDA is not in force." },
      { q: "Is AIDA in force?", a: "No. AIDA was part of Bill C-27, which died on the order paper on 6 January 2025 when Parliament was prorogued. It is not law. The government indicated in June 2025 that AIDA will not return as drafted; only parts may resurface in a future framework." },
      { q: "What is a high-impact AI system under AIDA?", a: "AIDA centres obligations on AI systems likely to have a significant impact on individuals; the precise scope was to be set out in regulations." },
    ],
  },
  china: {
    key: "china", eyebrow: "CSOAI - China",
    title: "China AI law",
    intro: "China regulates AI through a series of targeted, use-based rules rather than one omnibus act - covering recommendation algorithms, deep synthesis, and generative AI, alongside data and personal-information laws.",
    approach: "Vertical, use-based rules + data/PI laws",
    points: ["Algorithm recommendation management provisions", "Deep synthesis (deepfake) provisions with labelling", "Generative AI interim measures (2023)", "PIPL and Data Security Law underpin the regime"],
    faqs: [
      { q: "Does China have an AI law?", a: "China does not have a single omnibus AI act but regulates AI through targeted rules - on recommendation algorithms, deep synthesis, and generative AI - layered on top of the PIPL and Data Security Law." },
      { q: "How does China regulate generative AI?", a: "Through interim measures introduced in 2023 that set requirements for providers of public-facing generative AI, including content, data, and labelling obligations." },
      { q: "Does China require labelling of AI content?", a: "Yes. China's deep-synthesis and generative-AI rules include requirements to label synthetic or AI-generated content." },
    ],
  },
  singapore: {
    key: "singapore", eyebrow: "CSOAI - Singapore",
    title: "Singapore AI governance",
    intro: "Singapore favours a voluntary, pro-business approach centred on the Model AI Governance Framework and practical testing tools rather than binding legislation.",
    approach: "Voluntary framework + testing tools",
    points: ["Model AI Governance Framework (and a generative-AI edition)", "AI Verify - a testing framework and toolkit", "Sector guidance (e.g. finance) from regulators", "Emphasis on practical, deployable governance"],
    faqs: [
      { q: "Does Singapore have AI regulation?", a: "Singapore primarily uses voluntary governance - the Model AI Governance Framework and the AI Verify testing toolkit - rather than a binding AI law, complemented by sector guidance." },
      { q: "What is AI Verify?", a: "AI Verify is Singapore's testing framework and software toolkit that helps organisations validate the performance of their AI systems against governance principles." },
      { q: "Is the Model AI Governance Framework mandatory?", a: "No. It is voluntary guidance, though widely referenced as a practical baseline and extended with a generative-AI edition." },
    ],
  },
  korea: {
    key: "korea", eyebrow: "CSOAI - South Korea",
    title: "South Korea Basic AI Act",
    intro: "South Korea's Basic Act on AI entered into force in January 2026. It applies extraterritorially where AI systems affect users in Korea and introduces duties for high-impact and generative AI.",
    approach: "Binding framework law, extraterritorial (in force Jan 2026)",
    points: ["Applies extraterritorially where AI affects Korean users", "Duties for 'high-impact' AI: risk management, human oversight, documentation", "Transparency + labelling for generative-AI outputs", "Overseen by the Ministry of Science and ICT (MSIT)"],
    faqs: [
      { q: "Is South Korea's AI Basic Act in force?", a: "Yes - South Korea's Basic Act on AI entered into force in January 2026 and applies extraterritorially where AI systems affect users in Korea. Verify the current grace periods and implementing rules, which continue to develop." },
      { q: "Who does the Korean AI Basic Act apply to?", a: "Providers and deployers of AI - including overseas ones - whose systems affect users in Korea, with heightened duties for 'high-impact' and generative AI." },
      { q: "What does it require?", a: "Risk management, human oversight, documentation and transparency, plus labelling of generative-AI outputs; oversight sits with the Ministry of Science and ICT (MSIT)." },
    ],
  },
  usfederal: {
    key: "usfederal", eyebrow: "CSOAI - United States (federal)",
    title: "US federal AI policy",
    intro: "The US has no comprehensive federal AI law. Federal policy is set through executive action and is currently deregulatory and pro-innovation, leaving most binding rules to the states.",
    approach: "Executive-led, deregulatory (no omnibus federal AI law)",
    points: ["One AI-specific federal statute so far: the TAKE IT DOWN Act (non-consensual AI imagery)", "Deregulatory executive orders + policy frameworks (2025-2026)", "Sector regulators (e.g. FTC) apply existing law to AI", "Binding AI rules largely sit at the state level (CO, TX, CA, UT)"],
    faqs: [
      { q: "Does the US have a federal AI law?", a: "No comprehensive one. Congress has enacted the TAKE IT DOWN Act (targeting non-consensual AI-generated imagery); broader federal AI policy is set by executive orders and frameworks and is currently deregulatory. Most binding AI obligations are at the state level." },
      { q: "How is the US federal approach different from the EU AI Act?", a: "The EU AI Act is a binding, risk-tiered omnibus law. The US federal approach is executive-led and pro-innovation, with the substantive obligations mostly coming from individual states (Colorado, Texas, California, Utah)." },
      { q: "Which US states regulate AI?", a: "Notably Colorado (SB 26-189 / ADMT, which in May 2026 repealed and replaced the original SB 24-205 AI Act; effective 1 Jan 2027), Texas (TRAIGA), California (AI transparency laws) and Utah, plus NYC Local Law 144 for hiring - see the US state pages." },
    ],
  },
};
export default function JurisdictionAct({ jx }: { jx: string }) {
  const j = JX[jx] || JX.uk;
  useEffect(() => { document.title = j.title + " | CSOAI"; }, [j.title]);
  useEffect(() => {
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.text = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": j.faqs.map((f) => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })) });
    document.head.appendChild(sc);
    return () => { document.head.removeChild(sc); };
  }, [j.key]);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-5xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">{j.eyebrow}</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">{j.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">{j.intro}</p>
          <div className="mt-5 inline-block rounded-xl bg-white/10 px-4 py-2 text-sm text-emerald-50/90">Approach: <b>{j.approach}</b></div>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900">Key points</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {j.points.map((p) => (<div key={p} className="flex items-start gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700"><span className="mt-0.5 text-emerald-600 font-black">+</span>{p}</div>))}
        </div>
        <h2 className="mt-10 text-xl font-bold text-gray-900">Questions, answered</h2>
        <div className="mt-4 space-y-3">
          {j.faqs.map((f) => (<div key={f.q} className="rounded-2xl border border-gray-200 p-5"><div className="font-bold text-gray-900">{f.q}</div><p className="mt-1 text-sm text-gray-600">{f.a}</p></div>))}
        </div>
        <p className="mt-6 text-xs text-gray-400">AI regulation worldwide is evolving fast. This reflects the position as of June 2026 and is not legal advice - verify current law for your jurisdiction.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/ai-governance" className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">The full guide -&gt;</a>
          <a href="/regions" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">By region -&gt;</a>
          <a href="/readiness" className="rounded-xl border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Scan my readiness -&gt;</a>
        </div>
      </section>
      <section className="bg-[#03110b] py-10"><div className="mx-auto max-w-5xl px-6">
        <SovereignSpot topic={j.title + " — obligations, who must act, and the first move"} layer="regulators" suggest={"What must a company do to comply with " + j.title + "?"} />
      </div></section>
    </div>
  );
}
