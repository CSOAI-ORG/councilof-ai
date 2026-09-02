// EnterpriseTrust — an HONEST trust strip a CISO scans for. No fabricated SOC 2 /
// G2 badges (CSOAI doesn't hold those). Only real, verifiable signals: Ed25519
// signing, framework ALIGNMENT (not certification), open source, coordinated vuln
// disclosure, the BFT care-floor, and the real UK company registration.
const SIGNALS: { icon: string; label: string; sub: string; href?: string }[] = [
  { icon: "✶", label: "Ed25519 · Layer 0", sub: "Every decision cryptographically signed", href: "/workbench" },
  { icon: "⚖", label: "Multi-provider measurement", sub: "No single vendor grades itself. Fleet size is live on GET /api/gspc.", href: "/benchmarks" },
  { icon: "◫", label: "Aligned to published frameworks", sub: "EU AI Act · NIST · ISO 42001 · DORA · NIS2", href: "/crosswalk" },
  { icon: "◍", label: "Open source · MIT", sub: "Open measurement tooling, inspectable", href: "/tool-commons" },
  { icon: "🛡", label: "Coordinated disclosure", sub: "Published security.txt + CVD policy", href: "/vulnerability-disclosure" },
  { icon: "🏛", label: "CSOAI Ltd · UK", sub: "Companies House 16939677", href: "/about" },
];

export default function EnterpriseTrust() {
  return (
    // `bg-[#04120c]` was already the correct brand ink — it is now the shared
    // `.surface-ink` token so it stays locked to the Council OS band above it.
    <section className="section-y-sm surface-ink border-y" style={{ borderColor: "var(--ink-border)" }}>
      <div className="section-shell">
        <p className="t-kicker ink-kicker text-center font-mono">Built for the people who get audited</p>
        {/* h-full on the anchor as well as the card: without it the grid items
            stretched but the cards inside did not, so the row read ragged. */}
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SIGNALS.map((s) => {
            const Inner = (
              <div className="ink-card flex h-full flex-col items-center rounded-xl px-3 py-5 text-center">
                <span className="text-xl leading-none text-emerald-300/90" aria-hidden>{s.icon}</span>
                <span className="mt-2.5 text-[13px] font-bold leading-snug">{s.label}</span>
                <span className="ink-muted mt-1.5 text-[11px] leading-snug">{s.sub}</span>
              </div>
            );
            return s.href ? <a key={s.label} href={s.href} className="block h-full">{Inner}</a> : <div key={s.label} className="h-full">{Inner}</div>;
          })}
        </div>
        {/* Memberships & registrations — only EXECUTED agreements badge as members.
            C2PA: docusign 7C9592DB executed 2026-08-06 · OIN: signed 2026-08-15 ·
            LOT Network: welcome mail 2026-08-24 (membership live). */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <a href="/about" className="ink-card flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold">
            <span aria-hidden>🪪</span> C2PA Contributor Member
            <span className="ink-muted font-normal">· Linux Foundation project</span>
          </a>
          <a href="/about" className="ink-card flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold">
            <span aria-hidden>🛡</span> Open Invention Network
            <span className="ink-muted font-normal">· member</span>
          </a>
          <a href="/about" className="ink-card flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold">
            <span aria-hidden>🤝</span> LOT Network
            <span className="ink-muted font-normal">· member</span>
          </a>
        </div>
        {/* One CTA, not two, and the honesty line folded into it. This band previously
            stacked five rows — signals, memberships, a pricing slogan, a CTA pair and a
            disclaimer — directly under UpsellStrip's three cards, which repeated the same
            two links again. UpsellStrip is gone and this is one row. */}
        <div className="mt-9 flex flex-col items-center gap-4">
          <a href="/assess" className="rounded-xl bg-emerald-400 px-7 py-3.5 text-sm font-black text-[#04120c] transition-colors hover:bg-emerald-300">
            Get your first signed measurement — free →
          </a>
          <p className="ink-muted measure measure-center text-center text-[12px] leading-relaxed">
            We show what is verifiable, not badges we do not hold. We are not certified to
            SOC 2 or ISO/IEC 42001 and we do not claim to be. <a href="/dashboard?task=pricing-overview&tab=measured" className="underline underline-offset-2 hover:text-emerald-200">How the free rail works</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
