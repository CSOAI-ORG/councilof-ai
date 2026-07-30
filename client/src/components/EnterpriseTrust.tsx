// EnterpriseTrust — an HONEST trust strip a CISO scans for. No fabricated SOC 2 /
// G2 badges (CSOAI doesn't hold those). Only real, verifiable signals: Ed25519
// signing, framework ALIGNMENT (not certification), open source, coordinated vuln
// disclosure, the BFT care-floor, and the real UK company registration.
const SIGNALS: { icon: string; label: string; sub: string; href?: string }[] = [
  { icon: "✶", label: "Ed25519 · Layer 0", sub: "Every decision cryptographically signed", href: "/workbench" },
  { icon: "⚖", label: "33-agent Council of AI", sub: "Care-floor 0.95 · no single point of capture", href: "/try" },
  { icon: "◫", label: "Aligned to 13 frameworks", sub: "EU AI Act · NIST · ISO 42001 · DORA · NIS2", href: "/crosswalk" },
  { icon: "◍", label: "Open source · MIT", sub: "300+ governed MCP tools, inspectable", href: "/tool-commons" },
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
        <p className="mt-5 text-center text-sm font-semibold text-emerald-100/90">Governance shouldn't cost more than the AI it governs. Open-source core · free to start · own your data · <span className="text-emerald-300">no per-seat rent.</span></p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <a href="/assess" className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-[#03110b] hover:bg-emerald-400">Get your free signed assessment →</a>
          <a href="/pricing" className="rounded-xl border border-emerald-400/40 px-6 py-3 text-sm font-semibold text-emerald-100 hover:bg-white/5">See pricing →</a>
        </div>
        <p className="mt-2 text-center text-[11px] text-emerald-100/60">Honest by design: we show what's true and verifiable, not badges we don't hold. Formal certifications (e.g. SOC 2, ISO 42001) are pursued as the platform matures.</p>
      </div>
    </section>
  );
}
