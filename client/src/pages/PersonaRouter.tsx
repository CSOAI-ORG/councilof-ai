import { useEffect } from "react";
import SovereignSpot from "../components/SovereignSpot";
import { PersonaHeroArt, Slideshow, TrustStrip } from "../components/BrandGraphics";
import AxisProof from "../components/AxisProof";

// PersonaRouter — /for/:persona audience pages.
//
// TWO DEFECTS THIS FILE NOW CARRIES THE FIX FOR.
//
// 1. These pages were unreachable. Seven Pages Functions under functions/for/ answered
//    every one of them with a 308 to the bare homepage, so all seven URLs were
//    byte-identical and none of this differentiated content was ever served. The
//    functions are deleted; the router below is what a reader gets.
//
// 2. Once reachable, they still named no axis, no n and no card — the measurement was
//    absent from the measurement company's own audience pages. Each persona now declares
//    the board axes that actually bear on its reader (`axes`, a list of LABELS, which is
//    canon and safe to write down) and <AxisProof> reads their live rows from
//    GET /api/gspc. Not one number below is typed: an axis that is an UNMEASURED slot
//    renders as unmeasured, because a finance reader being shown only the measured axes
//    would be shown a flattering subset rather than the board.

type Link = { href: string; label: string; note: string };
type Persona = {
  key: "sec-filer" | "finance" | "healthcare" | "regulator" | "startup" | "enterprise";
  eyebrow: string; h1: string; intro: string;
  links: Link[];
  /** Board axis ids, exactly as GET /api/gspc names them. Labels only — never figures. */
  axes: string[];
  /** Why these axes are the ones this reader should check. */
  axesWhy: string;
  slides: { title: string; body: string; tag?: string }[];
  faqs: { q: string; a: string }[];
};

const PERSONAS: Record<string, Persona> = {
  "sec-filer": {
    key: "sec-filer", eyebrow: "CSOAI - for US public companies",
    h1: "AI governance your 10-K can stand behind",
    intro: "You disclose material AI risk and face AI-washing scrutiny. CSOAI turns AI-governance claims into signed, offline-verifiable evidence - so your filings rest on proof, not assertion.",
    links: [
      { href: "/sec-disclosure", label: "SEC AI disclosure", note: "What filers must evidence now" },
      { href: "/system-card", label: "Signed System Card", note: "Board-ready, per AI system" },
      { href: "/compare", label: "Honest vs Vanta / Drata", note: "Where we differ, plainly" },
      { href: "/us-ai-regulation", label: "US AI regulation", note: "NIST AI RMF + federal picture" },
    ],
    axes: ["provenance", "governance", "openness"],
    axesWhy:
      "An AI-washing charge turns on whether a disclosure was evidenced, and these are the axes a filer's own claims rest on: whether AI-generated output can be traced to what produced it, whether a model tiers its own regulated use correctly, and how much of the system is open to inspection. Read the rows, then recompute the signed card behind any of them.",
    slides: [
      { tag: "the risk", title: "AI is already in your filings", body: "Material AI risks belong in Reg S-K Item 105 risk factors and MD&A. The SEC has settled AI-washing charges. Disclosure needs evidence." },
      { tag: "the fix", title: "Sign what you claim", body: "A signed System Card per AI system means every capability claim is backed by verifiable proof - the antidote to AI-washing." },
      { tag: "the reuse", title: "One control set, every regime", body: "Map NIST AI RMF, ISO 42001, and the EU AI Act once. Comply once, evidence everywhere." },
    ],
    faqs: [
      { q: "Does the SEC require AI disclosure?", a: "No standalone rule yet, but material AI risks already belong in 10-K risk factors and MD&A, and misleading AI claims can trigger enforcement. Treat it as material disclosure now." },
      { q: "How does CSOAI reduce AI-washing risk?", a: "By backing every AI-governance claim with a signed, offline-verifiable System Card - so disclosures are evidenced, not asserted." },
    ],
  },
  finance: {
    key: "finance", eyebrow: "CSOAI - for financial services",
    h1: "Model risk, DORA, and the EU AI Act - evidenced once",
    intro: "Credit, insurance, and lending AI are named high-risk. CSOAI maps one control set across DORA, the EU AI Act, and NIST - with signed evidence your regulators and auditors can verify.",
    links: [
      { href: "/dora", label: "DORA readiness", note: "Operational resilience for AI" },
      { href: "/finance-ai-act", label: "Finance + EU AI Act", note: "High-risk uses + obligations" },
      { href: "/system-card", label: "Signed System Card", note: "Per model, verifiable" },
      { href: "/compare", label: "Honest vs the incumbents", note: "Vanta / Drata / Credo AI" },
    ],
    axes: ["governance", "provenance-controls", "distribution-integrity", "reserve-attestation"],
    axesWhy:
      "Two of these carry a measurement and two are declared slots with no run behind them, and a finance reader is shown all four deliberately. provenance-controls is the one financial axis with a real run — a deterministic mainnet read whose n counts issuer accounts, not bank items. The empty rows are the honest state of the financial family today.",
    slides: [
      { tag: "high-risk", title: "Credit + insurance AI are named uses", body: "Creditworthiness scoring and insurance pricing are explicit high-risk uses under the EU AI Act - bias testing, explainability, and oversight all apply." },
      { tag: "resilience", title: "DORA on top", body: "Operational-resilience duties layer over your AI. One evidenced control set satisfies the overlap instead of three parallel programs." },
      { tag: "proof", title: "Signed, auditor-checkable", body: "Every governed action is Ed25519-signed and verifiable offline - your auditor checks it in a browser, no vendor account." },
    ],
    faqs: [
      { q: "Is credit scoring high-risk under the EU AI Act?", a: "Yes - evaluating creditworthiness or setting credit scores for individuals is explicitly listed as high-risk, triggering bias testing, oversight, and documentation." },
      { q: "Does CSOAI cover DORA?", a: "Yes. CSOAI maps DORA operational-resilience controls alongside the EU AI Act and NIST so financial firms evidence the overlap once." },
    ],
  },
  healthcare: {
    key: "healthcare", eyebrow: "CSOAI - for healthcare + life sciences",
    h1: "Prove your clinical AI is safe - and evidenced",
    intro: "Clinical AI is squarely high-risk under the EU AI Act, on top of MDR/IVDR and HIPAA. CSOAI gives you signed, verifiable evidence of oversight, bias testing, and traceability.",
    links: [
      { href: "/healthcare-ai-act", label: "Healthcare + EU AI Act", note: "High-risk uses + obligations" },
      { href: "/high-risk-ai", label: "High-risk AI systems", note: "What triggers the regime" },
      { href: "/system-card", label: "Signed System Card", note: "Per clinical system" },
      { href: "/compare", label: "Honest vs the incumbents", note: "Where we differ" },
    ],
    axes: ["care", "safety", "art5-safeguard", "affect"],
    axesWhy:
      "Clinical AI fails in ways a generic benchmark does not look for: whether the model gives calibrated care rather than confident care, whether it refuses a harmful instruction, whether it stays inside the Article 5 prohibitions, and how it handles a distressed user. Every row carries its own n — CareBench is the largest bank on the board and Art5Bench is one of the smallest.",
    slides: [
      { tag: "high-risk", title: "Diagnosis + triage AI qualify", body: "AI for diagnosis, triage, or as a medical-device safety component is high-risk - conformity, oversight, and documentation duties apply." },
      { tag: "stacked", title: "On top of MDR / IVDR / HIPAA", body: "The AI Act sits alongside device and privacy law. Align the work, but the AI-specific obligations are additional - CSOAI maps them." },
      { tag: "traceable", title: "Signed clinical audit trail", body: "Every governed decision is logged and Ed25519-signed - traceability a regulator or safety officer can verify." },
    ],
    faqs: [
      { q: "Is medical AI high-risk under the EU AI Act?", a: "Yes - AI for diagnosis, triage, or as a medical-device safety component is high-risk, triggering conformity, oversight, and documentation duties." },
      { q: "Does the AI Act replace MDR/IVDR?", a: "No - it applies alongside them. Conformity work can be aligned, but the AI-specific obligations are additional." },
    ],
  },
  regulator: {
    key: "regulator", eyebrow: "CSOAI - for regulators + policy bodies",
    h1: "An assurance baseline you can verify - and publish",
    intro: "You need to evidence, not just assert, an AI-assurance posture. CSOAI is the independent, open-source layer where every governed action is signed and offline-verifiable by anyone.",
    links: [
      { href: "/regulator-atlas", label: "Regulator atlas", note: "The global regulation map" },
      { href: "/government-dashboard", label: "Government dashboard", note: "Posture at a glance" },
      { href: "/gspc-arena", label: "Council Space", note: "Talk to the governance AI" },
      { href: "/globe", label: "The governance globe", note: "Live, signed, worldwide" },
    ],
    axes: ["governance", "art5-safeguard", "conformance", "regulatory-framework"],
    axesWhy:
      "The row that matters most to a supervisor is the empty one. regulatory-framework is a published slot with no run behind it, and it sits here beside three measured axes rather than being left off the page. That is the whole proposition: you can see what we have not measured as plainly as what we have.",
    slides: [
      { tag: "independent", title: "No single-vendor dependency", body: "Open-source core, offline-verifiable signatures - assurance that does not rest on trusting one commercial vendor." },
      { tag: "verifiable", title: "Publish proof, not promises", body: "Every governed action is Ed25519-signed and checkable in a browser - the assurance baseline can be independently verified." },
      { tag: "mapped", title: "Crosswalked provisions, published as measured", body: "EU AI Act, NIST AI RMF, ISO 42001 and the dated regulation feed — a shared reference you can recompute. We do not type a framework count into this page." },
    ],
    faqs: [
      { q: "How is CSOAI independent?", a: "The core is open-source and its governance signatures are offline-verifiable, so assurance does not depend on trusting a single commercial vendor." },
      { q: "Can our claims be independently verified?", a: "Yes. Every governed action is Ed25519-signed and can be checked in any browser without a CSOAI account." },
    ],
  },
  startup: {
    key: "startup", eyebrow: "CSOAI - for AI startups + scale-ups",
    h1: "Enterprise-grade AI governance without a GRC team",
    intro: "Your enterprise buyers ask for AI governance you do not have staff to run. CSOAI gives you a signed System Card and a mapped control set - fast, open-source, and honest.",
    links: [
      { href: "/assess", label: "Get measured", note: "What the run attests — and does not" },
      { href: "/system-card", label: "Signed System Card", note: "The artifact buyers can recompute" },
      { href: "/gspc-verify", label: "Verify a card", note: "No account. Free forever." },
      { href: "/compare", label: "Honest vs the incumbents", note: "Measurement vs GRC" },
    ],
    axes: ["conformance", "openness", "provenance", "jail"],
    axesWhy:
      "These are the four your enterprise buyer's security team will ask about, and each row here is a number they can recompute without an account and without asking us. Hand them the axis name and the card; they do not have to trust the vendor claiming it.",
    slides: [
      { tag: "unblock sales", title: "Answer the security questionnaire", body: "A signed System Card is the artifact enterprise buyers ask for - hand it over instead of stalling the deal." },
      { tag: "no GRC team", title: "Governance without headcount", body: "Open-source core + a mapped control set means you evidence governance without hiring a compliance function." },
      { tag: "honest", title: "Verify without an account", body: "A grade is never sold. Recompute a card at /gspc-verify. Honest about what we do versus Vanta and Drata." },
    ],
    faqs: [
      { q: "We have no compliance team - can we still use CSOAI?", a: "Yes. The open-source core plus a mapped control set lets a small team produce a signed System Card without a dedicated GRC function." },
      { q: "Will this unblock enterprise deals?", a: "Often - a signed System Card is exactly the governance artifact enterprise security teams request." },
    ],
  },
  enterprise: {
    key: "enterprise", eyebrow: "CSOAI - for enterprises",
    h1: "Measure once. Show the signed card.",
    intro: "You face overlapping AI regimes across regions and business units. CSOAI maps one signed control set across all of them - so you stop rebuilding the same evidence for every framework.",
    links: [
      { href: "/industries", label: "Industry solutions", note: "Your sector, mapped" },
      { href: "/methodology", label: "The method", note: "Deterministic grading, published n" },
      { href: "/system-card", label: "Signed System Card", note: "Per AI system" },
      { href: "/gspc-scoreboard", label: "Living board", note: "Empty cells stay empty" },
    ],
    axes: ["governance", "continuity", "safety", "detector-interop"],
    axesWhy:
      "Overlapping regimes reuse the same evidence, so the useful question is what the evidence actually says. These four rows carry the n, the interval and the separation verdict behind each figure — including where the lead is a TIE, which is not a win and is never presented as one.",
    slides: [
      { tag: "overlap", title: "One measurement, many regimes", body: "EU AI Act, NIST, ISO 42001, DORA, NIS2 — measure once, show the signed card. We do not type a control-set count into this page." },
      { tag: "signed", title: "Evidence that verifies itself", body: "Every governed action is Ed25519-signed and offline-verifiable - defensible in front of auditors and regulators." },
      { tag: "honest", title: "Independent + transparent", body: "No vendor lock-in, open-source core, and honest positioning vs Vanta, Drata, Credo AI, and OneTrust." },
    ],
    faqs: [
      { q: "How does CSOAI handle overlapping frameworks?", a: "We measure against frozen provisions and publish the card. Overlapping regimes can reuse the same signed evidence. We do not claim a single control set satisfies every regime by itself — regulators decide conformity." },
      { q: "Is CSOAI locked to one vendor?", a: "No - the core is open-source and signatures are offline-verifiable, avoiding single-vendor dependency." },
    ],
  },
};

export default function PersonaRouter({ persona }: { persona: string }) {
  const p = PERSONAS[persona] || PERSONAS.enterprise;
  useEffect(() => { document.title = p.h1 + " | CSOAI"; }, [p.h1]);
  useEffect(() => {
    const sc = document.createElement("script");
    sc.type = "application/ld+json";
    sc.text = JSON.stringify({
      "@context": "https://schema.org", "@type": "FAQPage",
      "mainEntity": p.faqs.map((f) => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
    });
    document.head.appendChild(sc);
    return () => { document.head.removeChild(sc); };
  }, [p.key]);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 85% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6 grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">{p.eyebrow}</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">{p.h1}</h1>
            <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">{p.intro}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={p.links[0].href} className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-emerald-400">{p.links[0].label} -&gt;</a>
              {/* Was "Get a signed System Card". Cards are signed on the measurement node and
                  there is no self-service issuance (see /harness), so "get" promised a
                  transaction the estate does not offer. The link goes to the page that
                  explains what a signed card is; the verb now matches. */}
              <a href="/system-card" className="rounded-xl border border-emerald-300/40 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">What a signed System Card is -&gt;</a>
            </div>
          </div>
          <PersonaHeroArt persona={p.key} className="w-full max-w-md justify-self-center" />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900">Your path with CSOAI</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {p.links.map((l) => (
            <a key={l.href} href={l.href} className="group rounded-2xl border border-gray-200 p-5 hover:border-emerald-400 hover:shadow-lg transition">
              <div className="font-bold text-gray-900 group-hover:text-emerald-700">{l.label}</div>
              <p className="mt-1 text-sm text-gray-500">{l.note}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-emerald-600">Open -&gt;</span>
            </a>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-4">
        <AxisProof axes={p.axes} why={p.axesWhy} tone="light" />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12"><Slideshow slides={p.slides} /></section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <TrustStrip className="[&_div]:!bg-emerald-50/60 [&_.text-emerald-300]:!text-emerald-700 [&_.text-emerald-50\\/60]:!text-emerald-600/70 [&_div]:!border-emerald-200" />
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-8">
        <h2 className="text-xl font-bold text-gray-900">Questions, answered</h2>
        <div className="mt-4 space-y-3">
          {p.faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-gray-200 p-5">
              <div className="font-bold text-gray-900">{f.q}</div>
              <p className="mt-1 text-sm text-gray-600">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#03110b] py-10"><div className="mx-auto max-w-6xl px-6">
        <SovereignSpot topic={p.key} layer="regulators" task="sector-brief" suggest={"What should " + p.key + " do first for AI governance with signed evidence?"} />
      </div></section>
    </div>
  );
}
