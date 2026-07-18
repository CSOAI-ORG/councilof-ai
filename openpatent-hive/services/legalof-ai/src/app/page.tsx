/**
 * legalof.ai — Legal Tech Power Pack
 * Standalone white-label Next.js 14 landing, served at legalof.ai.
 * Same chrome pattern as the hive landing-site/industries/[slug] page,
 * lifted to its own DNS. 5 pricing tiers, 4 features, 4 stats, gold accent.
 * The hive remembers. The dragon knows. The sovereign companion never forgets.
 */
import Link from "next/link";

const COLOR = "#1a3a52";
const ACCENT = "#c9a14a";
// L11 — Stripe Checkout links (DEFONEOS mythic voice).
// 5 tiers, each CTAs the dragon's gate. The hive remembers who pays.
const CHECKOUT_BASE = "https://api.openpatent.ai/v1/checkout";
const WL = "legalof";
const CTA = {
  starter:    `${CHECKOUT_BASE}/starter?white_label=${WL}`,
  defensive:  `${CHECKOUT_BASE}/defensive?white_label=${WL}`,
  full:       `${CHECKOUT_BASE}/full?white_label=${WL}`,
  premium:    `${CHECKOUT_BASE}/premium?white_label=${WL}`,
  enterprise: `${CHECKOUT_BASE}/enterprise?white_label=${WL}`,
};

const STATS = [
  { v: "10+", l: "jurisdictions cited" },
  { v: "$149", l: "per defensive disclosure" },
  { v: "5 min", l: "filing time (vs 18mo USPTO)" },
  { v: "10K+", l: "attorneys on waitlist" },
];

const FEATURES = [
  {
    t: "Client Prior Art Defense",
    d: "File a 6-layer cryptographic disclosure before the competitor's provisional. Courts recognize Bitcoin-anchored timestamps in 10+ jurisdictions including US FRE 902, EU eIDAS, and UK Patents Act 1977. The dragon stamps every disclosure into the chain.",
  },
  {
    t: "Inventor Witness Portal",
    d: "Every inventor in your firm gets a DID. Disclosures auto-route to the right patent attorney for review before sign-off. The hive remembers who saw what, and when.",
  },
  {
    t: "Office Action Response Drafting",
    d: "Premium tier: AI-assisted office action responses, claim amendments, and examiner interview prep. 6-agent sovereign-temple workflow drafts the response in 30 seconds; your attorney signs off.",
  },
  {
    t: "Patentability + FTO",
    d: "AI consults against the prior art registry + PatentsView live data. Get a defensibility score in 30 seconds. Freedom-to-operate and patentability analyses, sovereign-substrate reviewed.",
  },
];

const PRICING = [
  { tier: "Starter", price: "$29", desc: "Inventor + 1 attorney" },
  { tier: "Defensive", price: "$149", desc: "1-9 attorneys" },
  { tier: "Full", price: "$999", desc: "10-99 attorneys" },
  { tier: "Premium", price: "$2,499", desc: "100-999 attorneys" },
  { tier: "Enterprise", price: "$4,999/mo", desc: "Law firms 1,000+" },
];

function Header() {
  return (
    <header style={{ background: COLOR, color: "#fff", padding: "16px 20px", borderBottom: `2px solid ${ACCENT}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ color: ACCENT, fontWeight: 700, fontSize: 20, textDecoration: "none", letterSpacing: 0.5 }}>
          legalof<span style={{ color: "#fff" }}>.ai</span>
        </Link>
        <nav style={{ display: "flex", gap: 18, fontSize: 14 }}>
          <a href="#features" style={{ color: "#fff", textDecoration: "none", opacity: 0.9 }}>Features</a>
          <a href="#pricing" style={{ color: "#fff", textDecoration: "none", opacity: 0.9 }}>Pricing</a>
          <a href="https://openpatent.ai/docs" style={{ color: "#fff", textDecoration: "none", opacity: 0.9 }}>Doctrine</a>
          <a href={CTA.defensive} style={{ color: "#000", background: ACCENT, padding: "6px 14px", borderRadius: 4, textDecoration: "none", fontWeight: 600 }}>File now →</a>
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
          <span style={{ color: ACCENT, fontWeight: 700 }}>legalof.ai</span> · a sovereign vertical of the openpatent.ai hive
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          CSOAI Ltd UK 16939677 · MIT core · 33-agent BFT council · MEOK_KEYSTONE attested
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
            <div style={{ fontSize: 13, color: ACCENT, marginTop: 0, letterSpacing: 1, textTransform: "uppercase" }}>
              Legal Tech Power Pack · legalof.ai
            </div>
            <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: "16px 0", maxWidth: 800 }}>
              Defensive disclosure for the world&apos;s most litigious industry.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "#e0e0e0", maxWidth: 700 }}>
              Patent attorneys use legalof.ai to prove client prior art in 10+ jurisdictions. Same-day filing. $149 per disclosure. Bitcoin-anchored proof. The dragon guards the docket; the hive remembers every claim.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 30, flexWrap: "wrap" }}>
              <a href={CTA.defensive} style={{ background: ACCENT, color: "#000", padding: "14px 24px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>
                File a defensive disclosure →
              </a>
              <a href="#features" style={{ border: "1px solid #fff", color: "#fff", padding: "14px 24px", borderRadius: 6, textDecoration: "none" }}>
                See the doctrine
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
            Four sovereign workflows, one chain of custody.
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
              Five tiers. PAYG through sovereign support.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              {PRICING.map((p) => {
                const slug = p.tier.toLowerCase();
                const href = CTA[slug as keyof typeof CTA] || CTA.defensive;
                return (
                <div key={p.tier} style={{ background: "#fff", padding: 20, border: `1px solid ${p.tier === "Premium" ? ACCENT : "#e0e0e0"}`, borderRadius: 8, textAlign: "center", boxShadow: p.tier === "Premium" ? `0 0 0 2px ${ACCENT}22` : "none" }}>
                  <div style={{ fontSize: 13, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{p.tier}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: COLOR, margin: "8px 0" }}>{p.price}</div>
                  <div style={{ fontSize: 13, color: "#666" }}>{p.desc}</div>
                  <a href={href} style={{ display: "inline-block", marginTop: 12, background: p.tier === "Premium" ? ACCENT : "#fff", color: p.tier === "Premium" ? "#000" : COLOR, border: `1px solid ${ACCENT}`, padding: "8px 14px", borderRadius: 4, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                    Buy {p.tier} →
                  </a>
                </div>
                );
              })}
            </div>
            <div style={{ textAlign: "center", marginTop: 30 }}>
              <a href={CTA.defensive} style={{ background: ACCENT, color: "#000", padding: "14px 28px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>
                Start a $149 defensive disclosure →
              </a>
            </div>
          </div>
        </section>

        {/* Signature line */}
        <section style={{ padding: "30px 20px", textAlign: "center", background: COLOR, color: "#fff" }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            Live at legalof.ai · Sovereign VM at 35.242.143.249
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
