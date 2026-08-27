import { useEffect } from "react";

// /global-ai-regulation — a crawlable, citable index of every major AI regime,
// each linking to its CSOAI page. Doubles as the internal-linking hub that makes
// the jurisdiction pages discoverable (to users AND answer engines). Verified
// mid-2026. Dataset + FAQPage schema for answer-engine citability.
type Row = { region: string; law: string; status: string; tone: string; href: string };
const ROWS: Row[] = [
  { region: "🇪🇺 European Union", law: "EU AI Act (Reg. 2024/1689)", status: "In force — GPAI live; Art. 50 + penalties from 2 Aug 2026; high-risk deferred to 2 Dec 2027 / 2 Aug 2028 (Digital Omnibus, Reg (EU) 2026/1744)", tone: "amber", href: "/ai-governance" },
  { region: "🇪🇺 EU — transparency", law: "Article 50 (transparency/marking)", status: "2 Aug 2026 (legacy marking 2 Dec 2026)", tone: "amber", href: "/article-50" },
  { region: "🇪🇺 EU — finance", law: "DORA (Reg. 2022/2554)", status: "Active enforcement 2026 — RoI audits, TLPT", tone: "amber", href: "/dora" },
  { region: "🇪🇺 EU — cyber (networks)", law: "NIS2 (Dir. 2022/2555)", status: "Transposition deadline Oct 2026", tone: "amber", href: "/nis2" },
  { region: "🇪🇺 EU — cyber (products)", law: "Cyber Resilience Act (2024/2847)", status: "Reporting 11 Sep 2026; main obligations 11 Dec 2027", tone: "amber", href: "/cra" },
  { region: "🇺🇸 United States", law: "Federal AI policy", status: "No omnibus law — executive-led, deregulatory; state-led rules", tone: "slate", href: "/us-ai-regulation" },
  { region: "🇺🇸 Colorado", law: "SB 189 (ADMT)", status: "SB 24-205 repealed May 2026 → ADMT law, eff. 1 Jan 2027", tone: "slate", href: "/colorado-ai-act" },
  { region: "🇺🇸 Texas", law: "TRAIGA (HB 149)", status: "In force 1 Jan 2026", tone: "emerald", href: "/texas-ai-act" },
  { region: "🇺🇸 California", law: "AI Transparency Act + GenAI training-data", status: "In force 1 Jan 2026", tone: "emerald", href: "/california-ai-law" },
  { region: "🇬🇧 United Kingdom", law: "Principles-based (no omnibus)", status: "Sector regulators (ICO/FCA/Ofcom/CMA) + AISI", tone: "slate", href: "/uk-ai-regulation" },
  { region: "🇨🇦 Canada", law: "AIDA (Bill C-27)", status: "Proposed — status uncertain; verify", tone: "slate", href: "/canada-aida" },
  { region: "🇨🇳 China", law: "GenAI Measures + synthetic-content ID", status: "In force (content-labelling from Sep 2025)", tone: "emerald", href: "/china-ai-law" },
  { region: "🇸🇬 Singapore", law: "Model AI Governance Framework + AI Verify", status: "Voluntary + testing toolkit", tone: "slate", href: "/singapore-ai-governance" },
  { region: "🇰🇷 South Korea", law: "Basic AI Act", status: "In force Jan 2026 — extraterritorial", tone: "emerald", href: "/south-korea-ai-act" },
];
const TONE: Record<string, string> = { amber: "border-amber-400/30 text-amber-200", emerald: "border-emerald-400/30 text-emerald-200", slate: "border-slate-400/25 text-slate-200" };
const FAQ = [
  { q: "Which countries regulate AI in 2026?", a: "The EU (AI Act), the US at state level (Colorado, Texas, California, Utah) with an executive-led federal approach, the UK (principles-based), China (generative-AI + synthetic-content rules), South Korea (Basic AI Act, in force Jan 2026), Singapore (voluntary framework), and Canada (proposed AIDA). The EU AI Act remains the only comprehensive, binding, risk-tiered regime." },
  { q: "What is the biggest AI regulation deadline in 2026?", a: "2 August 2026 — the EU AI Act's Article 50 transparency obligations and GPAI supervision become enforceable, with fines up to €15M or 3% of turnover. Legacy generative systems have until 2 December 2026 for machine-readable content marking." },
  { q: "How does CSOAI keep up with all of these?", a: "CSOAI maps every regime to one control set via a published-framework crosswalk, tracks the enforcement dates live, and produces Layer-0 (Ed25519) signed evidence — so complying once crosswalks everywhere. Each regime has a dedicated, current page linked here." },
];

export default function GlobalAIRegulation() {
  useEffect(() => { document.title = "Global AI regulation tracker 2026 — every regime, current | CSOAI"; }, []);
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "Dataset", name: "CSOAI Global AI Regulation Tracker 2026", description: "Current status of every major AI regulation worldwide — EU AI Act, US state + federal, UK, Canada, China, Singapore, South Korea.", creator: { "@type": "Organization", name: "CSOAI", url: "https://csoai.org" }, url: "https://csoai.org/global-ai-regulation" },
    { "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ] };
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Global AI regulation tracker · verified mid-2026</p>
        <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Every AI regime, <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">one map.</span></h1>
        <p className="mt-4 max-w-3xl text-lg text-emerald-100/80">Where AI law stands right now, worldwide — and the CSOAI page for each. Comply once; the published-framework <a href="/crosswalk" className="text-emerald-300 underline">crosswalk</a> maps it everywhere.</p>

        <div className="mt-8 space-y-2">
          {ROWS.map((r) => (
            <a key={r.region + r.law} href={r.href} className="flex flex-col gap-1 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4 transition hover:border-emerald-400/40 hover:bg-[#06180f] sm:flex-row sm:items-center sm:gap-4">
              <div className="w-full font-black text-emerald-100 sm:w-56 sm:shrink-0">{r.region}</div>
              <div className="flex-1"><div className="text-sm font-semibold text-emerald-100/90">{r.law}</div><div className="text-xs text-emerald-100/70">{r.status}</div></div>
              <span className={"shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold " + TONE[r.tone]}>open →</span>
            </a>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <a href="/crosswalk" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-[#03110b] hover:bg-emerald-400">The framework crosswalk →</a>
          <a href="/classifier" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Classify your AI →</a>
          <a href="/agent-governance" className="rounded-xl border border-emerald-500/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-white/5">Agent governance →</a>
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
        <p className="mt-6 text-[11px] text-emerald-300/70">Status verified mid-2026. Fast-moving area — indicative, not legal advice; verify against primary sources.</p>
      </div>
    </div>
  );
}
