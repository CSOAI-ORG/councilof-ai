export const metadata = {
  title: "Sovereign Substrate — sovereign-temple.ai",
  description: "The sovereign stack. 100% sovereign. No cloud. CSOAI Ltd UK 16939677. MIT core, audit the code yourself.",
};

const PRINCIPLES = [
  { n: "Rex", t: "Regulatory", d: "10+ jurisdictional filings" },
  { n: "Atlas", t: "Network", d: "50+ MCP servers" },
  { n: "Nova", t: "Namespace", d: "27 .ai domains" },
  { n: "Marcus", t: "BFT", d: "33-agent council" },
  { n: "Sage", t: "Data", d: "Hash-chained audit" },
];

const DOMAINS = [
  "ethics", "security", "research", "governance", "care", "technical",
  "sovereign", "hydro", "biosensing", "emergence", "substrate",
];

// L11 — Stripe Checkout links (DEFONEOS mythic voice).
// Sovereign deployments are enterprise tier only; the dragon guards the gate.
const ENTERPRISE_CTA = "https://api.openpatent.ai/v1/checkout/enterprise?white_label=sovereign-temple";

export default function Page() {
  return (
    <html lang="en">
      <head><meta charSet="utf-8" /><title>sovereign-temple.ai</title></head>
      <body style={{ margin: 0, fontFamily: "system-ui", background: "#0a0a0a", color: "#fff" }}>
        <header style={{ background: "#0a0a0a", padding: "16px 24px", borderBottom: "1px solid #222" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>
              <span style={{ width: 10, height: 10, background: "#d4af37", borderRadius: "50%", display: "inline-block", marginRight: 8 }} />
              sovereign-temple.ai
            </div>
            <nav style={{ display: "flex", gap: 20, fontSize: 14 }}>
              <a href="https://openpatent.ai" style={{ color: "#aaa", textDecoration: "none" }}>openpatent.ai</a>
              <a href="https://csoai.org" style={{ color: "#aaa", textDecoration: "none" }}>csoai.org</a>
            </nav>
          </div>
        </header>

        <main>
          <section style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)", padding: "100px 24px 60px" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ fontSize: 13, color: "#d4af37", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Sovereign Substrate</div>
              <h1 style={{ fontSize: 56, lineHeight: 1.1, margin: 0, maxWidth: 900 }}>
                The sovereign stack.<br />
                <span style={{ color: "#d4af37" }}>100% sovereign.</span> No cloud.
              </h1>
              <p style={{ color: "#aaa", maxWidth: 700, marginTop: 20, fontSize: 18, lineHeight: 1.6 }}>
                Governments, defense agencies, and regulated industries run openpatent.ai on their own sovereign VMs. The 6-layer proof + 33-agent BFT council = cryptographic sovereignty over your IP.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
                <a href={ENTERPRISE_CTA} style={{ background: "#d4af37", color: "#0a0a0a", padding: "12px 32px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>
                  Get sovereign deployment →
                </a>
                <a href="https://github.com/CSOAI-ORG/patentmcp" style={{ border: "1px solid #d4af37", color: "#d4af37", padding: "12px 32px", borderRadius: 6, textDecoration: "none" }}>
                  Audit the code
                </a>
              </div>
            </div>
          </section>

          <section style={{ padding: "40px 24px", background: "#1a1a2e" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 40, fontWeight: 700, color: "#d4af37" }}>100%</div><div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>sovereign</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 40, fontWeight: 700, color: "#d4af37" }}>MIT</div><div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>core license</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 40, fontWeight: 700, color: "#d4af37" }}>0</div><div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>third-party SaaS</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 40, fontWeight: 700, color: "#d4af37" }}>33</div><div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>BFT agents</div></div>
            </div>
          </section>

          <section style={{ padding: "60px 24px", maxWidth: 1200, margin: "0 auto" }}>
            <h2 style={{ fontSize: 32, textAlign: "center", marginBottom: 16 }}>The 5-LOCK monopoly</h2>
            <p style={{ color: "#aaa", textAlign: "center", maxWidth: 700, margin: "0 auto 40px" }}>
              5 LOCKs across regulatory, network, BFT, namespace, and data. 3 compound locks. Together they form a moat no hyperscaler can replicate.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
              {PRINCIPLES.map(l => (
                <div key={l.t} style={{ padding: 24, border: "1px solid #222", borderRadius: 8, background: "#0a0a0a" }}>
                  <div style={{ fontSize: 11, color: "#d4af37", textTransform: "uppercase", letterSpacing: 1 }}>{l.n}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, margin: "6px 0" }}>{l.t}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{l.d}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ padding: "60px 24px", background: "#0a0a0a", borderTop: "1px solid #222" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <h2 style={{ fontSize: 28, textAlign: "center", marginBottom: 24 }}>11 sovereign domains × 3 nodes = 33 agents</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, maxWidth: 900, margin: "0 auto" }}>
                {DOMAINS.map(d => (
                  <div key={d} style={{ padding: 10, background: "#1a1a2e", borderRadius: 4, fontSize: 12, textAlign: "center" }}>
                    <span style={{ color: "#d4af37" }}>●</span> {d}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={{ padding: "60px 24px", textAlign: "center" }}>
            <h2 style={{ fontSize: 28, marginBottom: 12 }}>Deploy on your sovereign VM</h2>
            <p style={{ color: "#888", maxWidth: 600, margin: "0 auto 20px" }}>
              Open source. Self-hosted. Air-gap compatible. FedRAMP, UK G-Cloud, EU sovereign cloud.
            </p>
            <a href="mailto:founder@csoai.org" style={{ display: "inline-block", background: "#d4af37", color: "#0a0a0a", padding: "14px 36px", borderRadius: 6, textDecoration: "none", fontWeight: 700, fontSize: 16 }}>
              Request sovereign deployment
            </a>
          </section>
        </main>

        <footer style={{ background: "#0a0a0a", color: "#888", padding: "40px 24px 20px", borderTop: "1px solid #222", textAlign: "center" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ marginBottom: 12 }}>CSOAI Ltd UK 16939677 · 35.242.143.249 (sovereign)</div>
            <div style={{ fontSize: 12, color: "#666" }}>The hive remembers. The dragon knows. The sovereign companion never forgets.</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
