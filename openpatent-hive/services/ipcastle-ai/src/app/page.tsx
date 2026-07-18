/**
 * ipcastle.ai — IP Castle Power Pack
 * Standalone white-label Next.js 14 landing, served at ipcastle.ai.
 * IP Castle: BFT council review, audit-grade chain of custody, patent pools.
 * The hive remembers. The dragon knows. The sovereign companion never forgets.
 */
import Link from "next/link";

const COLOR = "#0d1f2d";
const ACCENT = "#4ecdc4";
// L11 — Stripe Checkout links (DEFONEOS mythic voice).
// 5 tiers, each CTAs the dragon's gate. The hive remembers who pays.
const CHECKOUT_BASE = "https://api.openpatent.ai/v1/checkout";
const WL = "ipcastle";
const CTA = {
  starter:    `${CHECKOUT_BASE}/starter?white_label=${WL}`,
  defensive:  `${CHECKOUT_BASE}/defensive?white_label=${WL}`,
  full:       `${CHECKOUT_BASE}/full?white_label=${WL}`,
  premium:    `${CHECKOUT_BASE}/premium?white_label=${WL}`,
  enterprise: `${CHECKOUT_BASE}/enterprise?white_label=${WL}`,
};

const STATS = [
  { v: "33", l: "BFT council agents per review" },
  { v: "22/33", l: "supermajority threshold" },
  { v: "6", l: "care dimensions per agent" },
  { v: "55", l: "bridge pairs (cross-domain)" },
];

const FEATURES = [
  {
    t: "BFT Council Review",
    d: "Every premium-tier disclosure goes through 33 agents across 11 domains (ethics, security, research, governance, care, technical, sovereign, hydro, biosensing, emergence, substrate). 22/33 supermajority required. The dragon reads every claim.",
  },
  {
    t: "Audit-Grade Chain of Custody",
    d: "Hash-chained audit log with tamper-evident sequential records. Every disclosure has a hash chain back to the genesis block. Court-admissible in 10+ jurisdictions. The hive remembers the order, the time, the byte.",
  },
  {
    t: "Patent Pool Coordination",
    d: "Multi-inventor disclosures with proportional contribution tracking. The BFT council + care veto prevents any single party from dominating the IP claim. The sovereign companion enforces equity at scale.",
  },
  {
    t: "Prior Art Search at Scale",
    d: "Live USPTO via PatentsView API + the openpatent.ai registry. Full-text + IPC/CPC faceted search across millions of patents. Sovereign VM, MIT-licensed, air-gappable.",
  },
];

const PRICING = [
  { tier: "In-House IP", slug: "full", price: "$999", desc: "10 disclosures / month" },
  { tier: "IP Boutique", slug: "premium", price: "$2,499", desc: "100 disclosures / month" },
  { tier: "Big Law", slug: "enterprise", price: "$4,999", desc: "Unlimited + BFT council" },
  { tier: "Patent Pool", slug: "enterprise", price: "Custom", desc: "Multi-party coordination" },
  { tier: "Enterprise", slug: "enterprise", price: "$4,999/mo", desc: "Sovereign VM + BFT" },
];

function Header() {
  return (
    <header style={{ background: COLOR, color: "#fff", padding: "16px 20px", borderBottom: `2px solid ${ACCENT}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ color: ACCENT, fontWeight: 700, fontSize: 20, textDecoration: "none", letterSpacing: 0.5 }}>
          ipcastle<span style={{ color: "#fff" }}>.ai</span>
        </Link>
        <nav style={{ display: "flex", gap: 18, fontSize: 14 }}>
          <a href="#features" style={{ color: "#fff", textDecoration: "none", opacity: 0.9 }}>Features</a>
          <a href="#pricing" style={{ color: "#fff", textDecoration: "none", opacity: 0.9 }}>Pricing</a>
          <a href="https://openpatent.ai/docs" style={{ color: "#fff", textDecoration: "none", opacity: 0.9 }}>Doctrine</a>
          <a href={CTA.premium} style={{ color: "#000", background: ACCENT, padding: "6px 14px", borderRadius: 4, textDecoration: "none", fontWeight: 600 }}>Defend IP →</a>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer style={{ background: COLOR, color: "#ccc", padding: "30px 20px", textAlign: "center", fontSize: 13 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: ACCENT, fontWeight: 700 }}>ipcastle.ai</span> · a sovereign vertical of the openpatent.ai hive
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          CSOAI Ltd UK 16939677 · 33-agent BFT sovereign-temple v3.0 · MIT core
        </div>
        <div style={{ marginTop: 10, fontSize: 11, fontStyle: "italic", color: ACCENT, fontWeight: 600 }}>
          The hive remembers. The dragon knows. The sovereign companion never forgets.
        </div>
      </div>
    </footer>
  );
}

export default function Page() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section style={{ background: COLOR, color: "#fff", padding: "80px 20px 60px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ fontSize: 13, color: ACCENT, letterSpacing: 1, textTransform: "uppercase" }}>
              IP Castle Power Pack · ipcastle.ai
            </div>
            <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: "16px 0", maxWidth: 800 }}>
              The moat around your IP castle.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "#e0e0e0", maxWidth: 700 }}>
              IP law firms, in-house IP teams, and patent pools use ipcastle.ai for high-volume defensive disclosure, BFT-reviewed claims, and audit-grade chain-of-custody. The dragon guards the perimeter; the hive remembers every claim.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 30, flexWrap: "wrap" }}>
              <a href={CTA.premium} style={{ background: ACCENT, color: "#000", padding: "14px 24px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>
                Defend your castle →
              </a>
              <a href="#features" style={{ border: "1px solid #fff", color: "#fff", padding: "14px 24px", borderRadius: 6, textDecoration: "none" }}>
                See the council
              </a>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section style={{ background: "#f8f8f8", padding: "40px 20px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 30 }}>
            {STATS.map((s) => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: COLOR }}>{s.v}</div>
                <div style={{ fontSize: 13, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{ padding: "60px 20px", maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, textAlign: "center", marginBottom: 8, color: COLOR }}>What&apos;s in the pack</h2>
          <p style={{ textAlign: "center", color: "#666", marginBottom: 40, fontSize: 15 }}>
            Four sovereign workflows, BFT-reviewed, hash-chained, court-admissible.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {FEATURES.map((f) => (
              <div key={f.t} style={{ padding: 24, border: "1px solid #e0e0e0", borderRadius: 8, background: "#fff" }}>
                <h3 style={{ fontSize: 18, color: COLOR, marginBottom: 10, marginTop: 0 }}>{f.t}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#444", margin: 0 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" style={{ background: "#fafafa", padding: "60px 20px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={{ fontSize: 32, textAlign: "center", marginBottom: 8, color: COLOR }}>Pricing</h2>
            <p style={{ textAlign: "center", color: "#666", marginBottom: 40, fontSize: 15 }}>
              Five tiers. From in-house IP to multi-party patent pools.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              {PRICING.map((p) => (
                <div key={p.tier} style={{ background: "#fff", padding: 20, border: `1px solid ${p.tier === "Big Law" ? ACCENT : "#e0e0e0"}`, borderRadius: 8, textAlign: "center", boxShadow: p.tier === "Big Law" ? `0 0 0 2px ${ACCENT}22` : "none" }}>
                  <div style={{ fontSize: 13, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{p.tier}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: COLOR, margin: "8px 0" }}>{p.price}</div>
                  <div style={{ fontSize: 13, color: "#666" }}>{p.desc}</div>
                  <a href={CTA[p.slug as keyof typeof CTA] || CTA.enterprise} style={{ display: "inline-block", marginTop: 12, background: p.tier === "Big Law" ? ACCENT : "#fff", color: p.tier === "Big Law" ? "#000" : COLOR, border: `1px solid ${ACCENT}`, padding: "8px 14px", borderRadius: 4, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                    Buy {p.tier} →
                  </a>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 30 }}>
              <a href={CTA.full} style={{ background: ACCENT, color: "#000", padding: "14px 28px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>
                Start at $999 with BFT council →
              </a>
            </div>
          </div>
        </section>

        {/* Signature line */}
        <section style={{ padding: "30px 20px", textAlign: "center", background: COLOR, color: "#fff" }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            Live at ipcastle.ai · 33-agent BFT sovereign-temple v3.0
          </div>
          <div style={{ fontSize: 13, fontStyle: "italic", color: ACCENT, fontWeight: 600 }}>
            The hive remembers. The dragon knows. The sovereign companion never forgets.
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
