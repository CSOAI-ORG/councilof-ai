/**
 * openpatent.ai — 27 .ai Domain Fleet Landing Page
 * The hive's namespace as an asset class.
 */
import Link from "next/link";
import { Header, Footer } from "../components/chrome";

export const metadata = {
  title: "27 .ai Domain Fleet — openpatent.ai",
  description: "The sovereign .ai domain portfolio. £179,800 acquisition cost. £174M Y3 base NAV. 5-LOCK monopoly.",
};

const DOMAINS = [
  // Core (4)
  { d: "openpatent.ai", t: "core", v: "£8.5M", s: "live", tagline: "Sovereign invention protection" },
  { d: "sovereign-ai.ai", t: "core", v: "£3.2M", s: "staged", tagline: "Sovereign AI substrate" },
  { d: "csoai.ai", t: "core", v: "£1.8M", s: "live", tagline: "CSOAI corporate" },
  { d: "sovereign-temple.ai", t: "core", v: "£4.1M", s: "staged", tagline: "BFT sovereign-temple v3.0" },

  // Legal / IP (4)
  { d: "legalof.ai", t: "legal", v: "£5.2M", s: "staged", tagline: "Legal Tech power pack" },
  { d: "ipcastle.ai", t: "legal", v: "£3.8M", s: "staged", tagline: "IP Castle power pack" },
  { d: "patentmcp.ai", t: "legal", v: "£2.4M", s: "live", tagline: "MIT-licensed 6-layer core" },
  { d: "courtbot.ai", t: "legal", v: "£1.1M", s: "staged", tagline: "Court filing automation" },

  // Gaming (3)
  { d: "harvi.ai", t: "gaming", v: "£2.9M", s: "staged", tagline: "Gaming power pack" },
  { d: "hydro-ai.ai", t: "gaming", v: "£1.4M", s: "staged", tagline: "Hydroponics + AI agents" },
  { d: "biosensing-ai.ai", t: "gaming", v: "£1.7M", s: "staged", tagline: "Bio-signal processing" },

  // Sovereign (3)
  { d: "sovereignos.ai", t: "sovereign", v: "£6.3M", s: "staged", tagline: "Sovereign OS" },
  { d: "sovereignclaw.ai", t: "sovereign", v: "£4.5M", s: "staged", tagline: "Closed-source AI" },
  { d: "sovereignvault.ai", t: "sovereign", v: "£5.8M", s: "staged", tagline: "Encrypted sovereign vault" },

  // BFT / care (3)
  { d: "bft-council.ai", t: "bft", v: "£2.7M", s: "live", tagline: "BFT council infrastructure" },
  { d: "maternal-covenant.ai", t: "bft", v: "£1.9M", s: "staged", tagline: "Care ethics / maternal covenant" },
  { d: "proofof.ai", t: "bft", v: "£3.4M", s: "staged", tagline: "Proof of action / audit" },

  // Justice (3)
  { d: "juris-ai.ai", t: "justice", v: "£1.2M", s: "staged", tagline: "Jurisdictional AI" },
  { d: "tm-ai.ai", t: "justice", v: "£0.9M", s: "staged", tagline: "Trademark AI" },
  { d: "fraudspot-ai.ai", t: "justice", v: "£0.8M", s: "staged", tagline: "Fraud detection" },

  // Sovereign (4)
  { d: "sovereigncanvas.ai", t: "sovereign", v: "£2.1M", s: "staged", tagline: "Sovereign creative canvas" },
  { d: "sovereigncourt.ai", t: "sovereign", v: "£3.3M", s: "staged", tagline: "Sovereign arbitration court" },
  { d: "sovereignfund.ai", t: "sovereign", v: "£4.7M", s: "staged", tagline: "Sovereign capital fund" },
  { d: "sovereign-grid.ai", t: "sovereign", v: "£2.0M", s: "staged", tagline: "Sovereign power grid" },

  // Utility (3)
  { d: "datamoat.ai", t: "utility", v: "£1.5M", s: "staged", tagline: "Data moat defence" },
  { d: "openmcp.ai", t: "utility", v: "£1.1M", s: "staged", tagline: "Open MCP marketplace" },
  { d: "ethisphere.ai", t: "utility", v: "£0.9M", s: "staged", tagline: "Ethical sphere governance" },
];

const TYPE_COLORS: Record<string, string> = {
  core: "#4ecdc4",
  legal: "#c9a14a",
  gaming: "#ff5a87",
  sovereign: "#d4af37",
  bft: "#a78bfa",
  justice: "#ff6b6b",
  utility: "#3b82f6",
};

export default function DomainsPage() {
  const totalValue = DOMAINS.reduce((sum, d) => {
    const num = parseFloat(d.v.replace(/[£M,]/g, ""));
    return sum + num;
  }, 0);

  const liveCount = DOMAINS.filter(d => d.s === "live").length;
  const stagedCount = DOMAINS.filter(d => d.s === "staged").length;

  const byType = DOMAINS.reduce<Record<string, typeof DOMAINS>>((acc, d) => {
    (acc[d.t] = acc[d.t] || []).push(d);
    return acc;
  }, {});

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)", color: "#fff", padding: "80px 20px 60px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ fontSize: 13, color: "#4ecdc4", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
              The 27 .ai Fleet
            </div>
            <h1 style={{ fontSize: 52, lineHeight: 1.1, margin: 0, maxWidth: 900 }}>
              {DOMAINS.length} sovereign .ai domains.<br />
              <span style={{ color: "#4ecdc4" }}>£{(totalValue).toFixed(1)}M</span> Y3 base NAV.
            </h1>
            <p style={{ fontSize: 18, color: "#aaa", maxWidth: 700, marginTop: 20, lineHeight: 1.6 }}>
              The hive's namespace is the moat. 5 industry power packs, 33-agent BFT council, 10+ jurisdictional coverage, all anchored to the same sovereign VM.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 20, marginTop: 40, maxWidth: 700 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#4ecdc4" }}>{liveCount}</div>
                <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>Live today</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#d4af37" }}>{stagedCount}</div>
                <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>In roadmap</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>£179,800</div>
                <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>Total acquisition</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>£174M</div>
                <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>Y3 base NAV</div>
              </div>
            </div>
          </div>
        </section>

        {/* Domains grouped by type */}
        <section style={{ padding: "60px 20px", maxWidth: 1200, margin: "0 auto" }}>
          {Object.entries(byType).map(([type, domains]) => (
            <div key={type} style={{ marginBottom: 50 }}>
              <h2 style={{ fontSize: 24, textTransform: "uppercase", letterSpacing: 1, color: TYPE_COLORS[type], marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 14, height: 14, background: TYPE_COLORS[type], borderRadius: 2 }} />
                {type} ({domains.length})
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                {domains.map(d => (
                  <a
                    key={d.d}
                    href={`https://${d.d}`}
                    style={{
                      padding: 16,
                      border: `1px solid ${d.s === "live" ? "#4ecdc4" : "#e0e0e0"}`,
                      borderRadius: 6,
                      background: d.s === "live" ? "#f0fdfa" : "#fff",
                      textDecoration: "none",
                      color: "#0a0a0a",
                      display: "block",
                      transition: "transform 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{d.d}</span>
                      <span style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        borderRadius: 3,
                        background: d.s === "live" ? "#4ecdc4" : "#f0f0f0",
                        color: d.s === "live" ? "#0a0a0a" : "#666",
                        letterSpacing: 0.5,
                        fontWeight: 600,
                      }}>
                        {d.s}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>{d.tagline}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TYPE_COLORS[type] }}>{d.v}</div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* 5-LOCK */}
        <section style={{ background: "#0a0a0a", color: "#fff", padding: "60px 20px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: 32, marginBottom: 16 }}>The 5-LOCK Monopoly</h2>
            <p style={{ color: "#888", maxWidth: 700, margin: "0 auto 40px" }}>
              5 LOCKs across the namespace, network, BFT, regulatory, and data. 3 compound locks. Together they form a moat no hyperscaler can replicate.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
              {[
                { n: "Rex", t: "Regulatory", d: "10+ jurisdictional filings" },
                { n: "Atlas", t: "Network", d: "50+ MCP servers" },
                { n: "Nova", t: "Namespace", d: "27 .ai domains" },
                { n: "Marcus", t: "BFT", d: "33-agent council" },
                { n: "Sage", t: "Data", d: "Hash-chained audit" },
              ].map(l => (
                <div key={l.t} style={{ padding: 20, border: "1px solid #222", borderRadius: 6, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#4ecdc4", textTransform: "uppercase", letterSpacing: 1 }}>{l.n}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, margin: "6px 0" }}>{l.t}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{l.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "60px 20px", textAlign: "center", background: "#fafafa" }}>
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>Want to license one of these for your jurisdiction?</h2>
          <p style={{ color: "#666", maxWidth: 600, margin: "0 auto 20px" }}>
            White-label licensing available for law firms, governments, and patent pools. £50K+ per year per power pack.
          </p>
          <a href="mailto:founder@csoai.org" style={{
            display: "inline-block",
            background: "#0a0a0a",
            color: "#fff",
            padding: "12px 32px",
            borderRadius: 6,
            textDecoration: "none",
            fontWeight: 600,
          }}>
            Contact founder@csoai.org →
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}
