import { useEffect } from "react";
import SovereignSpot from "../components/SovereignSpot";
import { PersonaHeroArt, Slideshow, TrustStrip } from "../components/BrandGraphics";
import PersonaEvidence from "../components/PersonaEvidence";
import AxisProof from "../components/AxisProof";

// PersonaRouter — /for/:persona demographic landing pages. Each declared audience lands on a
// page that speaks to them and routes them into the right EXISTING pages.
//
// ── THE CLAIM RULE THAT GOVERNS THIS FILE (read before editing a single string) ───────────
// Every sentence here is one of two kinds, and they are held to different standards.
//
//   (a) A statement about the LAW. Keep it only if it is accurate to the instrument, and
//       name the article. "Credit scoring is high-risk" is fine; "insurance is high-risk"
//       was not — the AI Act names LIFE AND HEALTH insurance specifically (Annex III(5)(c)).
//
//   (b) A statement about what CSOAI DOES. Keep it only if a PUBLISHED artifact backs it.
//       The artifacts are: the signed measurement cards under /signed/ (index at
//       /signed/card_index.json, method at /signed/HOW-TO-VERIFY.md), the living board at
//       GET /api/gspc, the published crosswalk at /crosswalk/east-west-v1.json, and the
//       dated corpus feed at /corpus-watch/status.json.
//
// WHAT WAS CUT, AND WHY IT MATTERS. These pages used to say CSOAI "maps one control set
// across DORA, the EU AI Act, and NIST". The only published crosswalk maps the EU AI Act
// against the UK DRCF principles, Illinois SB 315 and TC260 — four regimes. It contains NO
// DORA rows and NO NIST rows. DORA is real here, but only as a hashed baseline instrument in
// the corpus feed, which is a much smaller thing and is now described as the smaller thing.
// A capability sentence with no artifact behind it is the exact defect this estate measures
// other people for. Do not reintroduce one; rewrite to what is true, or cut it.
//
// NO COUNT IS TYPED ON THIS PAGE. Figures come from PersonaEvidence, which reads them live
// off /api/gspc. Axis SLUGS below are pointers into that board, not counts.

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
//    the board axis that actually bear on its reader (`axis`, a list of LABELS, which is
//    canon and safe to write down) and <AxisProof> reads their live rows from
//    GET /api/gspc. Not one number below is typed: an axis that is an UNMEASURED slot
//    renders as unmeasured, because a finance reader being shown only the measured axis
//    would be shown a flattering subset rather than the board.

type Link = { href: string; label: string; note: string };
type Persona = {
  key: "sec-filer" | "finance" | "healthcare" | "regulator" | "startup" | "enterprise";
  eyebrow: string; h1: string; intro: string;
  links: Link[];
  /** Board axis ids, exactly as GET /api/gspc names them. Labels only — never figures. */
  axes: string[];
  /** Why these axis are the ones this reader should check. */
  axesWhy: string;
  slides: { title: string; body: string; tag?: string }[];
  /** Board axis this audience can actually go and check, with why each is here. */
  evidence: { lead: string; axes: { slug: string; why: string }[] };
  faqs: { q: string; a: string }[];
};

const PERSONAS: Record<string, Persona> = {
  "sec-filer": {
    key: "sec-filer", eyebrow: "CSOAI - for US public companies",
    h1: "AI governance your 10-K can stand behind",
    intro: "You disclose material AI risk and face AI-washing scrutiny. CSOAI publishes signed measurement runs on frozen, public banks — evidence a reader can recompute from the bytes rather than take on trust. What is signed is the measurement, not your compliance.",
    links: [
      { href: "/sec-disclosure", label: "SEC AI disclosure", note: "What filers must evidence now" },
      { href: "/system-card", label: "Signed System Card", note: "One AI system, one signed record" },
      { href: "/compare", label: "Honest vs Vanta / Drata", note: "Where we differ, plainly" },
      { href: "/us-ai-regulation", label: "US AI regulation", note: "NIST AI RMF + federal picture" },
    ],
    axes: ["provenance", "governance", "openness"],
    axesWhy:
      "An AI-washing charge turns on whether a disclosure was evidenced, and these are the axis a filer's own claims rest on: whether AI-generated output can be traced to what produced it, whether a model tiers its own regulated use correctly, and how much of the system is open to inspection. Read the rows, then recompute the signed card behind any of them.",
    slides: [
      { tag: "the risk", title: "AI is already in your filings", body: "Material AI risk belongs in Reg S-K Item 105 risk factors and in MD&A. The SEC has charged and settled AI-washing cases against investment advisers. Disclosure needs evidence behind it." },
      { tag: "the fix", title: "Sign the measurement, not the claim", body: "A measurement card records ONE run against ONE frozen bank, Ed25519-signed over its exact bytes. It evidences what was measured on a date. It is not a statement that your AI governance is adequate — nobody here can make that statement." },
      { tag: "the honest limit", title: "What is actually crosswalked", body: "The published crosswalk maps the EU AI Act against the UK DRCF principles, Illinois SB 315 and TC260, row by row. NIST AI RMF and ISO 42001 are not in it. We publish the map we have, not the map that would sell better." },
    ],
    evidence: {
      lead: "Two board axes bear directly on disclosure: whether a model can place an AI system in the right risk tier at all, and whether provenance marking survives.",
      axes: [
        { slug: "governance", why: "EU AI Act risk-tier classification — the judgement a disclosure about 'our high-risk AI systems' depends on being made correctly." },
        { slug: "provenance", why: "Article 50 marking survival: does a provenance mark still read after ordinary handling? A disclosure about labelled AI output rests on this." },
      ],
    },
    faqs: [
      { q: "Does the SEC require AI disclosure?", a: "No standalone rule yet, but material AI risks already belong in 10-K risk factors and MD&A, and misleading AI claims can trigger enforcement. Treat it as material disclosure now." },
      { q: "How does CSOAI reduce AI-washing risk?", a: "By giving you something checkable to point at. Each measurement card is Ed25519-signed over its exact bytes and its id is the sha256 of those bytes, so a reader re-verifies it against the key published in our DID document — no account, no trust in us required. That converts one class of statement, 'this model was measured, here is the result on this bank', from assertion into evidence. It evidences nothing we did not measure." },
    ],
  },
  finance: {
    key: "finance", eyebrow: "CSOAI - for financial services",
    h1: "Model risk, DORA, and the EU AI Act - what we actually hold",
    intro: "Credit scoring and life and health insurance pricing are named high-risk uses under the EU AI Act, and DORA's operational-resilience duties reach the ICT your models run on. CSOAI does not sell one control set that satisfies all of that. What we publish is a signed measurement board and a dated corpus feed that carries DORA's provisions as a hashed baseline alongside the AI Act's.",
    links: [
      { href: "/dora", label: "DORA readiness", note: "Operational resilience for AI" },
      { href: "/finance-ai-act", label: "Finance + EU AI Act", note: "High-risk uses + obligations" },
      { href: "/financial-axes", label: "The financial axis", note: "One measured, the rest published empty" },
      { href: "/compare", label: "Honest vs the incumbents", note: "Vanta / Drata / Credo AI" },
    ],
    axes: ["governance", "provenance-controls", "distribution-integrity", "reserve-attestation"],
    axesWhy:
      "Two of these carry a measurement and two are declared slots with no run behind them, and a finance reader is shown all four deliberately. provenance-controls is the one financial axis with a real run — a deterministic mainnet read whose n counts issuer accounts, not bank items. The empty rows are the honest state of the financial family today.",
    slides: [
      { tag: "high-risk", title: "Credit and life/health insurance AI are named uses", body: "Annex III(5) names evaluating creditworthiness or establishing a credit score for natural persons, and risk assessment and pricing in relation to life and health insurance. Article 10 data governance, Article 14 human oversight and Article 11 technical documentation follow from that classification." },
      { tag: "resilience", title: "DORA sits on top - and here is exactly what we hold on it", body: "DORA (Regulation (EU) 2022/2554) governs the ICT your models run on. In our dated corpus feed it is a baseline-seeded instrument: its provisions are hashed and watched, so a change in the text is visible. It has no rows in the published crosswalk, and we do not claim one evidenced control set discharges it." },
      { tag: "proof", title: "Signed, and re-checkable without an account", body: "Each measurement card is Ed25519-signed over its exact bytes. Your auditor pins our key from the published DID document, fetches the card, and recomputes the hash and the signature themselves. If it does not verify, it is not ours." },
    ],
    evidence: {
      lead: "One axis on the financial half of the board carries a real run; the rest of that family is published as open slots so the gap is visible rather than quietly missing.",
      axes: [
        { slug: "provenance-controls", why: "On-chain issuer control facts for tokenised instruments — a deterministic read, no model and no score. Read its own limits carefully: what these facts imply about risk or solvency is not measured." },
        { slug: "reserve-attestation", why: "Published as an open slot with no run behind it. It is here precisely because an empty cell is a first-class published status, not something to hide from a finance reader." },
        { slug: "governance", why: "EU AI Act risk-tier classification — whether a model places a credit or insurance use in the tier the statute puts it in." },
        { slug: "continuity", why: "Post-quantum status of a cryptographic assumption — the resilience question DORA's ICT duties eventually reach." },
      ],
    },
    faqs: [
      { q: "Is credit scoring high-risk under the EU AI Act?", a: "Yes. Annex III(5)(b) lists AI intended to evaluate the creditworthiness of natural persons or establish their credit score as high-risk, with a carve-out for systems used to detect financial fraud. Bias examination, human oversight and technical documentation duties follow." },
      { q: "Does CSOAI cover DORA?", a: "Not as a mapped control set, and we will not say otherwise. DORA is one of the instruments in our dated corpus feed, seeded and hashed so drift in its text is detectable. The published crosswalk maps the EU AI Act against the UK DRCF principles, Illinois SB 315 and TC260 — DORA is not among its rows, and neither is NIST AI RMF." },
    ],
  },
  healthcare: {
    key: "healthcare", eyebrow: "CSOAI - for healthcare + life sciences",
    h1: "Clinical AI, measured - and the measurement signed",
    intro: "Clinical AI is squarely high-risk under the EU AI Act, on top of MDR/IVDR and, in the US, HIPAA. CSOAI measures how models behave on frozen, published banks and signs each run. We do not assess your device, and we issue nothing.",
    links: [
      { href: "/healthcare-ai-act", label: "Healthcare + EU AI Act", note: "High-risk uses + obligations" },
      { href: "/high-risk-ai", label: "High-risk AI systems", note: "What triggers the regime" },
      { href: "/system-card", label: "Signed System Card", note: "One clinical system, one signed record" },
      { href: "/compare", label: "Honest vs the incumbents", note: "Where we differ" },
    ],
    axes: ["care", "safety", "art5-safeguard", "affect"],
    axesWhy:
      "Clinical AI fails in ways a generic benchmark does not look for: whether the model gives calibrated care rather than confident care, whether it refuses a harmful instruction, whether it stays inside the Article 5 prohibitions, and how it handles a distressed user. Every row carries its own n — CareBench is the largest bank on the board and Art5Bench is one of the smallest.",
    slides: [
      { tag: "high-risk", title: "Diagnosis and triage qualify - by two different routes", body: "AI that is a safety component of a device regulated under MDR or IVDR is high-risk through Article 6(1) and Annex I. Triage of patients in emergency healthcare is listed separately in Annex III. Same tier, different conformity paths - and the route decides who assesses you." },
      { tag: "stacked", title: "Alongside MDR / IVDR / HIPAA, not instead of", body: "The AI Act applies alongside device and privacy law. Article 8 lets the AI-Act documentation be folded into a single technical file, but the AI-specific obligations are additional, not absorbed by an existing device conformity route." },
      { tag: "traceable", title: "What is signed here, precisely", body: "The measurement run is signed, over its exact bytes, with the id being the sha256 of those bytes. That is a traceable record of what a model did on a published bank on a date. It is not a clinical audit trail of your system, and nothing here is a safety case." },
    ],
    evidence: {
      lead: "Two behavioural axes speak to clinical conduct — whether a model refuses in a calibrated way, and what it costs in care terms when protecting and helping pull against each other.",
      axes: [
        { slug: "care", why: "Care-cost under paired conduct scenarios: protecting and helping traded off against each other, which is the shape of most clinical edge cases." },
        { slug: "safety", why: "Calibrated refusal on paired requests — refusing the harmful sibling of a request without refusing the benign one. Over-refusal is a clinical failure too." },
        { slug: "affect", why: "Emotional and embodied safety: manipulation, disclosure and handling of vulnerability. Its legal gold labels are counsel-pending, which the board states on the row." },
      ],
    },
    faqs: [
      { q: "Is medical AI high-risk under the EU AI Act?", a: "Yes. AI that is a safety component of a product covered by the device legislation in Annex I - MDR and IVDR - is high-risk under Article 6(1), and AI used for triage of patients in emergency healthcare is separately listed in Annex III. Both trigger conformity, oversight and documentation duties." },
      { q: "Does the AI Act replace MDR/IVDR?", a: "No - it applies alongside them. Documentation can be aligned into a single technical file, but the AI-specific obligations are additional." },
    ],
  },
  regulator: {
    key: "regulator", eyebrow: "CSOAI - for regulators + policy bodies",
    h1: "An assurance baseline you can verify - and publish",
    intro: "You need something you can check without trusting the party who published it. The core here is MIT-licensed, the banks are public, and each measurement is Ed25519-signed against a key you fetch yourself - so anyone can recompute a number and challenge it.",
    links: [
      { href: "/regulator-atlas", label: "Regulator atlas", note: "The global regulation map" },
      { href: "/crosswalk", label: "The published crosswalk", note: "Four regimes, mapped row by row" },
      { href: "/gspc-arena", label: "Council Space", note: "Talk to the governance AI" },
      { href: "/honesty", label: "The honesty record", note: "Corrections, published not edited" },
    ],
    axes: ["governance", "art5-safeguard", "conformance", "regulatory-framework"],
    axesWhy:
      "The row that matters most to a supervisor is the empty one. regulatory-framework is a published slot with no run behind it, and it sits here beside three measured axes rather than being left off the page. That is the whole proposition: you can see what we have not measured as plainly as what we have.",
    slides: [
      { tag: "independent", title: "No single-vendor dependency", body: "MIT-licensed core, published frozen banks, and signatures that verify against a key you fetch from our DID document rather than one we hand you. You do not have to trust us in order to check us." },
      { tag: "verifiable", title: "Publish proof, not promises", body: "Each measurement card is signed over its exact bytes, and the board snapshot carries its own site attestation naming the key that signed it. Re-verification needs no account and no CSOAI code." },
      { tag: "mapped", title: "Crosswalked provisions, and the honest edge of the map", body: "The published crosswalk maps the EU AI Act against the UK DRCF principles, Illinois SB 315 and TC260. A separate dated corpus feed carries the AI Act, the CRA, DORA, NIS2 and UK GDPR as hashed baselines watched for drift. NIST AI RMF and ISO 42001 are in neither. We do not type a framework count into this page." },
    ],
    evidence: {
      lead: "The two axes a supervisory reader usually wants first: can a model recognise a prohibited practice, and can it place a system in the right risk tier.",
      axes: [
        { slug: "art5-safeguard", why: "EU AI Act Article 5 prohibited-practice trip: does the model recognise a prohibited practice when it sees one." },
        { slug: "governance", why: "EU AI Act risk-tier classification. The largest bank on the board, and the judgement most downstream duties hang off." },
        { slug: "machinery-conformity", why: "Machinery Regulation self-evolving safety-function classification — a second statute, graded deterministically the same way." },
      ],
    },
    faqs: [
      { q: "How is CSOAI independent?", a: "The core is MIT-licensed and every published measurement verifies against a key you fetch from our own DID document, so the assurance does not rest on trusting a single commercial vendor. We measure; determination stays with authorities." },
      { q: "Can these numbers be independently verified?", a: "Yes - that is the design, and the method is published rather than described. Pin the key from /.well-known/did.json, fetch a card from the published index, recompute the sha256 of the exact signed bytes and check the Ed25519 signature. If the bytes do not verify, the card is not ours." },
    ],
  },
  startup: {
    key: "startup", eyebrow: "CSOAI - for AI startups + scale-ups",
    h1: "A signed measurement your buyer can re-check",
    intro: "Your enterprise buyers ask for AI-governance evidence you have no staff to produce. CSOAI gives you one artifact that travels: a signed measurement on a published bank, which the buyer verifies for themselves. It is not a compliance programme and it is not a certificate.",
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
      { tag: "unblock sales", title: "Hand over something specific", body: "A signed card is one run, one frozen bank, one signature - not a claim in a slide. The buyer recomputes it without an account and without asking us, which is a far better answer to a security questionnaire than a promise." },
      { tag: "no GRC team", title: "Governance without headcount, stated honestly", body: "The core is MIT-licensed and the banks are public, so a small team can produce and publish a measurement without a compliance function. That is measurement. The rest of a governance programme is still yours - we are not pretending otherwise." },
      { tag: "honest", title: "Verify without an account", body: "A grade is never sold and verification is free forever. Recompute a card at /gspc-verify, and read /compare for a plain account of where we differ from Vanta and Drata." },
    ],
    evidence: {
      lead: "The axes a technical buyer tends to open first — licence reasoning, tool conformance, and whether an agent knows when to stop and ask.",
      axes: [
        { slug: "openness", why: "Licence reasoning versus intended use: does the model get the licence question right for the use it is actually being put to." },
        { slug: "conformance", why: "MCP tool conformance — whether a model uses a declared tool interface the way the interface declares itself." },
        { slug: "cross-reality", why: "Autonomous agent action authority: PROCEED, CONFIRM or REFUSE. The question every enterprise buyer of an agent asks second." },
      ],
    },
    faqs: [
      { q: "We have no compliance team - can we still use CSOAI?", a: "Yes, for measurement. The MIT-licensed core and the published banks let a small team produce a signed measurement card. It does not replace a compliance function and it is not a certificate - we issue none." },
      { q: "What exactly does a buyer receive?", a: "A JSON card and its id. The id is the sha256 of the exact signed bytes; the signature is Ed25519 under the key published at /.well-known/did.json. /signed/HOW-TO-VERIFY.md gives them the commands, including the one number-formatting quirk a JavaScript verifier has to handle. They never need an account with us." },
    ],
  },
  enterprise: {
    key: "enterprise", eyebrow: "CSOAI - for enterprises",
    h1: "Measure once. Show the signed card.",
    intro: "You face overlapping AI regimes across regions and business units. CSOAI does not sell one control set that satisfies all of them - no one honestly can. What we publish is a signed measurement board with its unmeasured slots left visible, and a dated feed of the regime texts underneath it.",
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
      { tag: "overlap", title: "One measurement, many readers", body: "The EU AI Act, the Cyber Resilience Act, DORA, NIS2 and UK GDPR sit in our dated corpus feed as hashed baselines watched for drift. That is a shared reference several teams can read from. It is not a claim that one control set satisfies those regimes, and we do not type a framework count into this page." },
      { tag: "signed", title: "Evidence that verifies itself", body: "Each measurement card is Ed25519-signed over its exact bytes, and the board snapshot carries a site attestation naming the key that signed it. Anyone can re-verify offline, which is the only property that makes evidence worth anything to a third party." },
      { tag: "honest", title: "Empty cells stay empty", body: "The board publishes its unmeasured slots as UNMEASURED rather than hiding them, and prints both its slot count and its measured count so neither can be quoted alone. A published slot is not a measurement." },
    ],
    evidence: {
      lead: "A cross-regime reader usually wants the classification axis, the resilience axis, and one that is deliberately empty.",
      axes: [
        { slug: "governance", why: "EU AI Act risk-tier classification — the judgement that decides which duties apply to which system in your estate." },
        { slug: "continuity", why: "Post-quantum status of a cryptographic assumption: the long-horizon resilience question behind CRA and DORA reasoning." },
        { slug: "conformance", why: "MCP tool conformance — how models behave against a declared tool interface, which is where most agent integrations actually break." },
        { slug: "regulatory-framework", why: "Published as an open slot with no run behind it. It is on this page on purpose: you should be able to see where the board is empty before you rely on it." },
      ],
    },
    faqs: [
      { q: "How does CSOAI handle overlapping frameworks?", a: "We measure against frozen provisions and publish the card. Overlapping regimes can reuse the same signed evidence. We do not claim a single control set satisfies every regime by itself — regulators decide conformity." },
      { q: "Is CSOAI locked to one vendor?", a: "No - the core is MIT-licensed and signatures are offline-verifiable against a key you fetch yourself, so nothing here depends on a single commercial vendor staying in business." },
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
            <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">{p.h1}</h1>
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
        <AxisProof axis={p.axes} why={p.axesWhy} tone="light" />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12"><Slideshow slides={p.slides} /></section>

      <PersonaEvidence lead={p.evidence.lead} axis={p.evidence.axes} />

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
