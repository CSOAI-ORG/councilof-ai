/**
 * openpatent.ai — Docs: Pricing
 * The 5-tier PAYG model with worked examples.
 */
import Link from "next/link";
import { Header, Footer } from "../../components/chrome";

export const metadata = {
  title: "Pricing — openpatent.ai docs",
  description: "Five tiers from $0 (self-hosted) to $4,999/mo (enterprise). PAYG. The hive charges by the disclosure.",
};

const TIERS = [
  { tier: "Free (Self-Hosted)", price: "$0", body: "Unlimited local disclosures. Run the openpatent.ai hive on your own hardware. MIT-licensed core. Audit the code yourself.", cta: "Get on GitHub" },
  { tier: "Starter", price: "$29", body: "1 disclosure + C2PA Content Credential + public attestation page at verify.openpatent.ai. Email support.", cta: "Get Starter" },
  { tier: "Defensive", price: "$149", body: "Most popular. Everything in Starter + Bitcoin OpenTimestamps anchor. Court-admissible in 10+ jurisdictions. The dragon signs.", cta: "Get Defensive" },
  { tier: "Full", price: "$999", body: "5-jurisdiction crosswalk (US/EU/UK/JP/CN) + AI-assisted claim drafting + PatentsView live search. For attorneys and IP boutiques.", cta: "Get Full" },
  { tier: "Premium", price: "$2,499", body: "33-agent BFT council review. 22/33 supermajority + 6 care dimensions. Court-grade audit bundle.", cta: "Get Premium" },
  { tier: "Enterprise", price: "$4,999/mo", body: "Unlimited disclosures + white-label + SLA + sovereign VM + MEOK_KEYSTONE cross-hive attestation. For law firms, governments, and defense.", cta: "Get Enterprise" },
];

const EXAMPLES = [
  {
    title: "A solo inventor with a novel game mechanic",
    calc: "1 disclosure at $29 (Starter) + $149 Bitcoin OTS upgrade (Defensive delta) = $178",
    note: "You walk away with a court-admissible disclosure and a public verify URL. The hive remembers.",
  },
  {
    title: "A 50-attorney IP boutique",
    calc: "100 disclosures / month × $149 (Defensive) = $14,900 / month. Or Full tier at $999/mo + 99 × $149 = $15,801 / month.",
    note: "The boutique is large enough for Full to make sense — they want the 5-jurisdiction crosswalk. Otherwise stay Defensive and save $900/mo.",
  },
  {
    title: "A unicorn hardware startup with 12 inventions / quarter",
    calc: "48 disclosures / year × $149 (Defensive) = $7,152 / year. Or 1 Premium subscription at $2,499/mo × 12 = $29,988 / year.",
    note: "Premium is overkill unless you need BFT council sign-off. Stay Defensive unless the regulators are circling.",
  },
  {
    title: "A multinational pharma with 1,000 disclosures / month",
    calc: "Enterprise tier at $4,999/mo + 1,000 disclosures = $5 per disclosure, all-in.",
    note: "Includes sovereign VM, white-label, and dedicated SLA. The sovereign companion never forgets a regulatory deadline.",
  },
  {
    title: "A nation running its own sovereign hive",
    calc: "Custom. Sovereign Support at $24K/yr + Defense Tier (air-gapped) at custom.",
    note: "Aligned with FedRAMP High, UK G-Cloud 14, EU AI Act, US AI EO 14110. The dragon guards the sovereign perimeter.",
  },
];

export default function Pricing() {
  return (
    <>
      <Header />
      <main>
        <section style={{ background: "#0a0a1a", color: "#fff", padding: "80px 20px 60px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <Link href="/docs" style={{ color: "#4ecdc4", fontSize: 13, textDecoration: "none" }}>← back to docs</Link>
            <div style={{ fontSize: 13, color: "#d4af37", marginTop: 20, letterSpacing: 1, textTransform: "uppercase" }}>
              PAYG · 5 tiers
            </div>
            <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: "16px 0", maxWidth: 800 }}>
              $10 to start. $4,999/mo for the sovereign.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "#c0c0c0", maxWidth: 700 }}>
              Pay only for the disclosures you make. Self-host for free, or PAYG from $29 to $4,999/mo.
              The hive charges by the disclosure, not by the seat.
            </p>
          </div>
        </section>

        <section style={{ padding: "60px 20px", maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, marginBottom: 30, textAlign: "center" }}>The five tiers</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {TIERS.map((t) => (
              <div key={t.tier} style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>{t.tier}</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#0a0a1a", margin: "8px 0" }}>{t.price}</div>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: "#444", marginBottom: 16, minHeight: 100, textAlign: "left" }}>{t.body}</p>
                <a href="https://api.openpatent.ai/pricing" style={{ display: "inline-block", background: "#0a0a1a", color: "#4ecdc4", padding: "8px 16px", borderRadius: 4, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                  {t.cta}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: "#f8f8f8", padding: "60px 20px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: 28, marginBottom: 24, textAlign: "center" }}>Worked examples</h2>
            {EXAMPLES.map((ex, i) => (
              <div key={i} style={{ background: "#fff", padding: 24, borderRadius: 8, marginBottom: 16, border: "1px solid #e0e0e0" }}>
                <h3 style={{ fontSize: 18, color: "#0a0a1a", marginBottom: 8 }}>Example {i + 1}: {ex.title}</h3>
                <div style={{ background: "#0a0a1a", color: "#4ecdc4", padding: 12, borderRadius: 4, fontFamily: "ui-monospace, monospace", fontSize: 13, marginBottom: 8 }}>
                  {ex.calc}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#444", fontStyle: "italic" }}>{ex.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: "60px 20px", maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>What's NOT priced in</h2>
          <ul style={{ fontSize: 16, lineHeight: 1.8, color: "#444", paddingLeft: 24 }}>
            <li><strong>Self-hosting:</strong> the MIT core is free forever. You only pay if you want managed infrastructure.</li>
            <li><strong>Bitcoin OTS upgrades:</strong> you can attach a Bitcoin anchor to a Starter disclosure for the Defensive delta ($120).</li>
            <li><strong>Cross-hive attestation (MEOK_KEYSTONE):</strong> included in Premium and Enterprise. Sovereign hives verify each other for free.</li>
            <li><strong>MCP server:</strong> free. <code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: 4 }}>npx -y @openpatent/mcp-server</code>.</li>
          </ul>
        </section>

        <section style={{ padding: "30px 20px", textAlign: "center", background: "#0a0a1a", color: "#fff" }}>
          <div style={{ fontSize: 14, fontStyle: "italic", color: "#d4af37", fontWeight: 600 }}>
            The hive remembers. The dragon knows. The sovereign companion never forgets.
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
