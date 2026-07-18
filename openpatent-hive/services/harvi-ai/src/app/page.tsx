/**
 * harvi.ai — Gaming Power Pack
 * Standalone white-label Next.js 14 landing, served at harvi.ai.
 * Gaming vertical: novel mechanics, procedural generation, modder attribution.
 * The hive remembers. The dragon knows. The sovereign companion never forgets.
 */
import Link from "next/link";

const COLOR = "#2a1140";
const ACCENT = "#ff5a87";
// L11 — Stripe Checkout links (DEFONEOS mythic voice).
// 5 tiers, each CTAs the dragon's gate. The hive remembers who pays.
const CHECKOUT_BASE = "https://api.openpatent.ai/v1/checkout";
const WL = "harvi";
const CTA = {
  starter:    `${CHECKOUT_BASE}/starter?white_label=${WL}`,
  defensive:  `${CHECKOUT_BASE}/defensive?white_label=${WL}`,
  full:       `${CHECKOUT_BASE}/full?white_label=${WL}`,
  premium:    `${CHECKOUT_BASE}/premium?white_label=${WL}`,
  enterprise: `${CHECKOUT_BASE}/enterprise?white_label=${WL}`,
};

const STATS = [
  { v: "$10", l: "per disclosure (starter)" },
  { v: "30s", l: "from idea to Bitcoin-anchored" },
  { v: "100%", l: "MIT-licensed core (no vendor lock)" },
  { v: "MCP", l: "works in Claude Code + Cursor" },
];

const FEATURES = [
  {
    t: "Novel Mechanic Timestamping",
    d: "Disclose a unique gameplay mechanic — a new crafting system, an AI-driven NPC behavior, a novel combat formula — with a 6-layer proof. The dragon defends against accidental reverse-engineering and prior-art challenges.",
  },
  {
    t: "Procedural Generation Claims",
    d: "Protect novel Perlin/Simplex/noise functions, RNG seed schedules, and deterministic worldgen algorithms as defensible prior art. The hive remembers the exact seed, the exact curve, the exact moment of invention.",
  },
  {
    t: "Modder Attribution",
    d: "Modders get cryptographic proof of their contributions. Game studios can prove which mods influenced their releases. The sovereign companion tracks every contribution, hash-chained and 6-layer attested.",
  },
  {
    t: "AI-Powered Game Design Drafting",
    d: "Patent-style claim drafting for game mechanics. The drafting-fork agent converts 'I made a thing' into a structured disclosure in 30 seconds. MCP-native: file straight from Claude Code or Cursor.",
  },
];

const PRICING = [
  { tier: "Solo Dev", slug: "starter", price: "$29", desc: "1 disclosure" },
  { tier: "Indie Studio", slug: "defensive", price: "$149", desc: "10 disclosures / month" },
  { tier: "AAA Studio", slug: "premium", price: "$2,499", desc: "Unlimited disclosures" },
  { tier: "Publisher", slug: "premium", price: "$4,999", desc: "Multi-studio" },
  { tier: "Enterprise", slug: "enterprise", price: "$4,999/mo", desc: "Sub-licensing + BFT" },
];

function Header() {
  return (
    <header style={{ background: COLOR, color: "#fff", padding: "16px 20px", borderBottom: `2px solid ${ACCENT}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ color: ACCENT, fontWeight: 700, fontSize: 20, textDecoration: "none", letterSpacing: 0.5 }}>
          harvi<span style={{ color: "#fff" }}>.ai</span>
        </Link>
        <nav style={{ display: "flex", gap: 18, fontSize: 14 }}>
          <a href="#features" style={{ color: "#fff", textDecoration: "none", opacity: 0.9 }}>Features</a>
          <a href="#pricing" style={{ color: "#fff", textDecoration: "none", opacity: 0.9 }}>Pricing</a>
          <a href="https://openpatent.ai/docs" style={{ color: "#fff", textDecoration: "none", opacity: 0.9 }}>Doctrine</a>
          <a href={CTA.starter} style={{ color: "#000", background: ACCENT, padding: "6px 14px", borderRadius: 4, textDecoration: "none", fontWeight: 600 }}>Disclose →</a>
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
          <span style={{ color: ACCENT, fontWeight: 700 }}>harvi.ai</span> · a sovereign vertical of the openpatent.ai hive
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          CSOAI Ltd UK 16939677 · MIT core · 33-agent BFT council · MCP-native
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
              Gaming Power Pack · harvi.ai
            </div>
            <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: "16px 0", maxWidth: 800 }}>
              Disclose game mechanics before your studio&apos;s NDA leaks.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "#e0e0e0", maxWidth: 700 }}>
              Game devs, modders, and indie studios use harvi.ai to timestamp novel mechanics, level designs, and procedural generation algorithms. Court-admissible in 10+ jurisdictions. 30s from idea to chain.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 30, flexWrap: "wrap" }}>
              <a href={CTA.defensive} style={{ background: ACCENT, color: "#000", padding: "14px 24px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>
                Disclose a novel mechanic →
              </a>
              <a href="#features" style={{ border: "1px solid #fff", color: "#fff", padding: "14px 24px", borderRadius: 6, textDecoration: "none" }}>
                See the pack
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
            Four sovereign workflows, one chain of custody, MIT-licensed.
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
              Five tiers. PAYG through sovereign sub-licensing.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
              {PRICING.map((p) => (
                <div key={p.tier} style={{ background: "#fff", padding: 20, border: `1px solid ${p.tier === "AAA Studio" ? ACCENT : "#e0e0e0"}`, borderRadius: 8, textAlign: "center", boxShadow: p.tier === "AAA Studio" ? `0 0 0 2px ${ACCENT}22` : "none" }}>
                  <div style={{ fontSize: 13, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{p.tier}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: COLOR, margin: "8px 0" }}>{p.price}</div>
                  <div style={{ fontSize: 13, color: "#666" }}>{p.desc}</div>
                  <a href={CTA[p.slug as keyof typeof CTA] || CTA.starter} style={{ display: "inline-block", marginTop: 12, background: p.tier === "AAA Studio" ? ACCENT : "#fff", color: p.tier === "AAA Studio" ? "#000" : COLOR, border: `1px solid ${ACCENT}`, padding: "8px 14px", borderRadius: 4, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                    Buy {p.tier} →
                  </a>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 30 }}>
              <a href={CTA.defensive} style={{ background: ACCENT, color: "#000", padding: "14px 28px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>
                Start a $149 disclosure →
              </a>
            </div>
          </div>
        </section>

        {/* Signature line */}
        <section style={{ padding: "30px 20px", textAlign: "center", background: COLOR, color: "#fff" }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            Live at harvi.ai · MIT core, PAYG API
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
