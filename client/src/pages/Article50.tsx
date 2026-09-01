import { useEffect } from "react";
import { COUNTS, AI_SYSTEM_COMPONENTS } from "@/lib/ai-surfaces";
import CesiumPortalCard from "@/components/CesiumPortalCard";
import FaqBlock from "@/components/FaqBlock";
import SpotInfographic from "@/components/SpotInfographic";
import { LANE4 } from "@/data/lane4Content";

const L4 = LANE4["article-50"];

// /article-50 — the EU AI Act transparency cliff. Verified dates (July 2026):
// Article 50 transparency obligations apply from 2 Aug 2026; machine-readable
// marking of synthetic content has a grace period to 2 Dec 2026 for systems
// already on the market; GPAI models on the market before 2 Aug 2025 have
// until 2 Aug 2027. Fines for transparency breaches: up to €15M or 3%.
function days(to: string) { return Math.max(0, Math.ceil((new Date(to + "T00:00:00Z").getTime() - Date.now()) / 86400000)); }

const CHECKLIST: { art: string; t: string; law: string; us: string; link?: { href: string; label: string } }[] = [
  {
    art: "Art. 50(1)",
    t: "AI-interaction disclosure",
    law: "If people interact with an AI system, they must be told it is an AI system at the time of the first interaction — in a way that is clear and distinguishable from the rest of the page, and that meets the applicable accessibility requirements. The only escape is when it is obvious from the circumstances.",
    us: "Every surface on this site is classified in a public registry. The ones that talk to a live model mount a first-interaction notice above the input — a keyboard-reachable live region that collapses to a persistent marker, never disappears. The ones that are deterministic say so instead of staying vague.",
    link: { href: "/ai-transparency", label: "The registry, surface by surface →" },
  },
  {
    art: "Art. 50(2)",
    t: "Machine-readable marking of synthetic content",
    law: "Providers of AI systems that generate synthetic audio, image, video or text must mark the output as artificially generated in a machine-readable way — detectable, effective, interoperable, robust. This is the direction the C2PA content-provenance ecosystem and the Code of Practice on marking are converging on.",
    us: "Nothing on this site generates synthetic audio, image, video or text, so there is no output to mark — the registry says so out loud. We also measured whether the ecosystem's existing marks survive in the wild: 0 of 20 assets kept their provenance. If we ever ship generative output, the marking obligation attaches immediately — no grace period for features launched after 2 Aug 2026.",
    link: { href: "/provenance-finding", label: "The 0-of-20 provenance finding →" },
  },
  {
    art: "Art. 50(3)",
    t: "Emotion recognition & biometric categorisation",
    law: "People exposed to an emotion-recognition or biometric-categorisation system must be informed that such a system is operating on them, and it must process their data under the data-protection rules.",
    us: "This site operates no emotion-recognition and no biometric-categorisation system. Nothing here infers how you feel or what you are.",
  },
  {
    art: "Art. 50(4)",
    t: "Deepfake & AI-generated text labelling",
    law: "AI-generated or -manipulated image, audio or video that resembles real people, places or events (a deepfake) must be visibly labelled as artificial. Text generated to inform the public on matters of public interest must be disclosed as AI-generated — with one exception: when a natural or legal person holds editorial responsibility and the text has been through human review, the disclosure duty does not apply.",
    us: "No generated media is published here. The words on this site are written by people; where tooling assists research or drafting, a named person reviews and holds editorial responsibility before anything ships — which is exactly the discipline the exception is designed to reward, not a loophole to hide behind.",
  },
  {
    art: "Art. 50(1),(5)",
    t: "Accessibility & language",
    law: "The disclosure must meet the accessibility requirements of the European Accessibility Act (Directive (EU) 2019/882), and it must reach the person — which in practice means clear language the user can understand.",
    us: "The notice is a real live region with role and tab order, not a tooltip; dismissing it leaves a permanent one-line marker rather than removing it. The Council assistant answers in the visitor's own language where it can, keeping statutory names in their canonical form.",
    link: { href: "/ai-transparency", label: "How the notice is built →" },
  },
  {
    art: "good practice",
    t: "Evidence-keeping",
    law: "Article 50 does not spell out an evidence duty, but enforcement will ask one question: prove the disclosure was in place on a given date. A claim without an artefact is half a compliance story.",
    us: "The surface registry lives in source control, every change to it is a commit, and a guard in the release gate fails the build if a surface starts calling a model without being registered and noticed. The public decision chain is recomputable in your browser.",
    link: { href: "/gspc-verify", label: "Recompute the chain →" },
  },
];

const TIMELINE = [
  { d: "2 Feb 2025", t: "Prohibited practices (Art. 5) banned — already in force." },
  { d: "2 Aug 2025", t: "GPAI provider obligations began." },
  { d: "2 Aug 2026", t: "Article 50 transparency obligations apply — and market-surveillance enforcement is live from day one. No grace period for anything launched after this date." },
  { d: "2 Dec 2026", t: "End of the marking grace period for synthetic-content systems that were already on the market before 2 Aug 2026." },
  { d: "2 Dec 2027", t: "Annex III high-risk obligations (EUR-Lex). We measure. We do not certify." },
  { d: "2 Aug 2027", t: "Legacy GPAI models (on the market before 2 Aug 2025) must be fully compliant." },
];

const FAQ = [
  { q: "What does EU AI Act Article 50 require?", a: "Article 50 sets transparency duties: AI systems that interact with people must disclose they are AI at the first interaction; providers of generative AI must machine-readable-mark synthetic audio, image, video and text as AI-generated; people exposed to emotion-recognition or biometric-categorisation systems must be told; and deepfakes plus AI-generated public-interest text must be clearly labelled — the last with an exception where a person holds editorial responsibility after human review." },
  { q: "When does Article 50 take effect?", a: "Article 50 transparency obligations — and the enforcement powers behind them — apply from 2 August 2026. Systems already on the market have a marking grace period until 2 December 2026 for synthetic content, and GPAI models placed on the market before 2 August 2025 have until 2 August 2027. Anything launched after 2 August 2026 must comply immediately." },
  { q: "What are the penalties for breaching Article 50?", a: "Non-compliance with transparency obligations can attract fines of up to €15 million or 3% of total worldwide annual turnover, whichever is higher, alongside national market-surveillance enforcement. (Higher tiers exist for other articles — up to €35M or 7% for prohibited practices.)" },
  { q: "What is the editorial-responsibility exception?", a: "AI-generated text published to inform the public does not have to be labelled as AI-generated if a natural or legal person holds editorial responsibility for it and it has undergone human review. It rewards genuine editorial control; it is not a way to launder unreviewed generated text through a nominal editor." },
  { q: "How does CSOAI treat Article 50?", a: "CSOAI maps Article 50 to measurable controls (surface registry, first-interaction disclosure, provenance marks) and publishes how it treats its own surfaces at /ai-transparency. That is measurement and evidence, not a transparency certificate." },
];

export default function Article50() {
  useEffect(() => { document.title = "EU AI Act Article 50 — transparency obligations, in force from 2 Aug 2026 | CSOAI"; }, []);
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  const aug = days("2026-08-02"), dec = days("2026-12-02"), annex = days("2027-12-02");
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">EU AI Act · Article 50 · transparency</p>
        <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">The transparency <span className="bg-gradient-to-r from-amber-300 to-emerald-300 bg-clip-text text-transparent">cliff.</span></h1>
        <p className="mt-4 max-w-3xl text-lg text-emerald-100/80">If your AI talks to people or generates content, Article 50 lands on you. Disclosure and machine-readable marking of AI content — with real fines (up to <b>€15M or 3%</b> of turnover) and enforcement from day one.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4"><div className="text-3xl font-black text-amber-200">{aug}</div><div className="text-sm text-amber-100/80">days → obligation + enforcement live (2 Aug 2026)</div></div>
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4"><div className="text-3xl font-black text-amber-200">{dec}</div><div className="text-sm text-amber-100/80">days → marking grace period ends (2 Dec 2026)</div></div>
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4"><div className="text-3xl font-black text-emerald-200">{annex}</div><div className="text-sm text-emerald-100/80">days → Annex III high-risk (2 Dec 2027)</div></div>
        </div>

        {/* 3D portal — the measurement lens over the region where Article 50 binds */}
        <div className="mt-8">
          <CesiumPortalCard lens="csoai" preset="eu" dark />
        </div>

        {/* THE FULL CHECKLIST */}
        <h2 className="mt-12 text-2xl font-black tracking-tight">The full checklist — and what we do about each line</h2>
        <p className="mt-2 text-[13px] text-emerald-100/60">
          We sell Article 50 tooling, so each obligation below is paired with what happens on this
          site — not what a brochure says should happen.
        </p>
        <div className="mt-5 space-y-4">
          {CHECKLIST.map((c) => (
            <div key={c.art + c.t} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300/90">{c.art}</span>
                <span className="text-[15px] font-black text-emerald-50">{c.t}</span>
              </div>
              <p className="mt-2 text-[13px] text-emerald-100/75 leading-relaxed">{c.law}</p>
              <p className="mt-3 border-t border-emerald-500/10 pt-3 text-[13px] leading-relaxed text-emerald-100/85">
                <strong className="text-emerald-50">On this site:</strong> {c.us}
              </p>
              {c.link && (
                <a href={c.link.href} className="mt-2 inline-block text-[12px] font-semibold text-emerald-300 hover:underline">
                  {c.link.label}
                </a>
              )}
            </div>
          ))}
        </div>

        {/* TIMELINE */}
        <h2 className="mt-12 text-2xl font-black tracking-tight">The timeline</h2>
        <div className="mt-4 space-y-2">
          {TIMELINE.map((t) => (
            <div key={t.d} className="flex gap-4 rounded-xl border border-emerald-500/15 bg-[#05140d] px-4 py-3">
              <span className="w-24 shrink-0 font-mono text-[12px] font-bold text-amber-200">{t.d}</span>
              <span className="text-[13px] text-emerald-100/75">{t.t}</span>
            </div>
          ))}
        </div>

        {/* SELF-CONFORMANCE */}
        <div className="mt-10 rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.07] p-6">
          <h2 className="text-xl font-black tracking-tight">We sell this. Here is us, under it.</h2>
          <p className="mt-2 text-[13px] text-emerald-100/80 leading-relaxed">
            From 2 August 2026 this page&apos;s obligations apply to csoai.org itself. So the whole
            site is measured the same way we would measure yours:{" "}
            <strong className="text-emerald-50">
              {COUNTS.total} interactive surfaces classified — {COUNTS.rule_based} rule-based,{" "}
              {COUNTS.ai_system} AI-system routes across {AI_SYSTEM_COMPONENTS} components
            </strong>{" "}
            — each with its mechanism and its notice state published. Where a surface is not yet
            classified it defaults to the strictest reading, not the friendliest.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/ai-transparency" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-[#03110b] hover:bg-emerald-400">Our Article 50 self-conformance record →</a>
            <a href="/gspc-verify" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Recompute our chain →</a>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-5">
          <div className="text-sm font-black text-emerald-100">Get Article-50-ready with CSOAI</div>
          <p className="mt-1 text-sm text-emerald-100/75">Surface classification, first-interaction disclosure patterns, C2PA / content-provenance marking, and <b>Layer-0 signed evidence</b> that it was in place — reproducible for auditors.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/assess" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-[#03110b] hover:bg-emerald-400">Get your signed readiness assessment →</a>
            <a href="/classifier" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Does Article 50 apply to my AI? →</a>
            <a href="/readiness" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Full 2 Aug readiness →</a>
            <a href="/crosswalk" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Framework crosswalk →</a>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-black">Frequently asked</h2>
          <div className="mt-4 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-4">
                <summary className="cursor-pointer font-semibold text-emerald-100">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-emerald-100/75">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <SpotInfographic title={L4.spotTitle} stats={L4.spotStats} source={L4.spotSource} />
        <FaqBlock title={L4.faqTitle} intro={L4.faqIntro} items={L4.faq} />
        <p className="mt-6 text-[11px] text-emerald-300/70">Dates verified August 2026 (Digital Omnibus, Reg (EU) 2026/1744, in force 27 July 2026). Indicative guidance, not legal advice — verify against primary EU sources.</p>
      </div>
    </div>
  );
}
