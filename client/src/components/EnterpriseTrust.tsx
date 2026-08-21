// EnterpriseTrust — an HONEST trust strip a CISO scans for. No fabricated SOC 2 /
// G2 badges (CSOAI doesn't hold those). Only real, verifiable signals: Ed25519
// signing, framework ALIGNMENT (not certification), open source, coordinated vuln
// disclosure, the BFT care-floor, and the real UK company registration.
const SIGNALS: { icon: string; label: string; sub: string; href?: string }[] = [
  { icon: "✶", label: "Ed25519 · Layer 0", sub: "Every decision cryptographically signed", href: "/workbench" },
  { icon: "⚖", label: "Multi-provider measurement", sub: "No single vendor grades itself. Fleet size is live on GET /api/gspc.", href: "/benchmarks" },
  { icon: "◨", label: "Aligned to 13 frameworks", sub: "EU AI Act · NIST · ISO 42001 · DORA · NIS2", href: "/crosswalk" },
  { icon: "◍", label: "Open source · MIT", sub: "Open measurement tooling, inspectable", href: "/tool-commons" },
  { icon: "🛡", label: "Coordinated disclosure", sub: "Published security.txt + CVD policy", href: "/vulnerability-disclosure" },
  { icon: "🏛", label: "CSOAI Ltd · UK", sub: "Companies House 16939677", href: "/about" },
];

export default function EnterpriseTrust() {
  return (
    <section className="border-y border-emerald-500/15 bg-[#04120c]">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-center font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/80">Built for the people who get audited</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SIGNALS.map((s) => {
            const Inner = (
              <div className="flex h-full flex-col items-center rounded-xl border border-emerald-500/20 bg-black/20 px-3 py-4 text-center transition hover:border-emerald-400/40">
                <span className="text-xl">{s.icon}</span>
                <span className="mt-2 text-[13px] font-bold text-emerald-50">{s.label}</span>
                <span className="mt-1 text-[11px] leading-snug text-emerald-100/70">{s.sub}</span>
              </div>
            );
            return s.href ? <a key={s.label} href={s.href} className="block">{Inner}</a> : <div key={s.label}>{Inner}</div>;
          })}
        </div>
        {/* Memberships & registrations — only EXECUTED agreements badge as members.
            C2PA: docusign 7C9592DB executed 2026-08-06 · OIN: signed 2026-08-15 ·
            LOT Network: application submitted, membership pending (labelled). */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <a href="/about" className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-black/30 px-4 py-1.5 text-[12px] font-semibold text-emerald-50 hover:border-emerald-400/50">
            <span aria-hidden>🪪</span> C2PA Contributor Member
            <span className="text-emerald-300/80 font-normal">· Linux Foundation project</span>
          </a>
          <a href="/about" className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-black/30 px-4 py-1.5 text-[12px] font-semibold text-emerald-50 hover:border-emerald-400/50">
            <span aria-hidden>🛡</span> Open Invention Network
            <span className="text-emerald-300/80 font-normal">· member</span>
          </a>
          <a href="/about" className="flex items-center gap-2 rounded-full border border-amber-400/25 bg-black/30 px-4 py-1.5 text-[12px] font-semibold text-amber-50 hover:border-amber-300/50">
            <span aria-hidden>🤝</span> LOT Network
            <span className="text-amber-300/80 font-normal">· application submitted</span>
          </a>
        </div>
        {/* One CTA, not two, and the honesty line folded into it. This band previously
            stacked five rows — signals, memberships, a pricing slogan, a CTA pair and a
            disclaimer — directly under UpsellStrip's three cards, which repeated the same
            two links again. UpsellStrip is gone and this is one row. */}
        <div className="mt-7 flex flex-col items-center gap-3">
          <a href="/assess" className="rounded-xl bg-emerald-500 px-7 py-3 text-sm font-black text-[#03110b] hover:bg-emerald-400">
            Get your first signed measurement — free →
          </a>
          <p className="max-w-2xl text-center text-[11px] leading-relaxed text-emerald-100/60">
            We show what is verifiable, not badges we do not hold. We are not certified to
            SOC 2 or ISO/IEC 42001 and we do not claim to be. <a href="/pricing" className="underline hover:text-emerald-200">Pricing</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
