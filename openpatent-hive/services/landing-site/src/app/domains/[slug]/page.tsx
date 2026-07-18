/**
 * openpatent.ai — Per-Domain Landing Pages
 * 27 .ai domains × 1 dynamic route
 * The hive's namespace, one moat at a time.
 */
import Link from "next/link";
import { Header, Footer } from "../../components/chrome";

export const metadata = {
  title: "Sovereign .ai Domain — openpatent.ai",
  description: "27 sovereign .ai domains. 5-LOCK monopoly. 33-agent BFT council. Court-admissible in 10+ jurisdictions.",
};

const DOMAINS: Record<string, { d: string; t: string; v: string; s: string; tagline: string; color: string }> = {
  // Core (4)
  "openpatent-ai": { d: "openpatent.ai", t: "core", v: "£8.5M", s: "live", tagline: "Sovereign invention protection", color: "#4ecdc4" },
  "sovereign-ai-ai": { d: "sovereign-ai.ai", t: "core", v: "£3.2M", s: "staged", tagline: "Sovereign AI substrate", color: "#4ecdc4" },
  "csoai-ai": { d: "csoai.ai", t: "core", v: "£1.8M", s: "live", tagline: "CSOAI corporate", color: "#4ecdc4" },
  "sovereign-temple-ai": { d: "sovereign-temple.ai", t: "core", v: "£4.1M", s: "staged", tagline: "BFT sovereign-temple v3.0", color: "#4ecdc4" },
  // Legal / IP (4)
  "legalof-ai": { d: "legalof.ai", t: "legal", v: "£5.2M", s: "staged", tagline: "Legal Tech power pack", color: "#c9a14a" },
  "ipcastle-ai": { d: "ipcastle.ai", t: "legal", v: "£3.8M", s: "staged", tagline: "IP Castle power pack", color: "#c9a14a" },
  "patentmcp-ai": { d: "patentmcp.ai", t: "legal", v: "£2.4M", s: "live", tagline: "MIT-licensed 6-layer core", color: "#c9a14a" },
  "courtbot-ai": { d: "courtbot.ai", t: "legal", v: "£1.1M", s: "staged", tagline: "Court filing automation", color: "#c9a14a" },
  // Gaming (3)
  "harvi-ai": { d: "harvi.ai", t: "gaming", v: "£2.9M", s: "staged", tagline: "Gaming power pack", color: "#ff5a87" },
  "hydro-ai-ai": { d: "hydro-ai.ai", t: "gaming", v: "£1.4M", s: "staged", tagline: "Hydroponics + AI agents", color: "#ff5a87" },
  "biosensing-ai-ai": { d: "biosensing-ai.ai", t: "gaming", v: "£1.7M", s: "staged", tagline: "Bio-signal processing", color: "#ff5a87" },
  // Sovereign (3)
  "sovereignos-ai": { d: "sovereignos.ai", t: "sovereign", v: "£6.3M", s: "staged", tagline: "Sovereign OS", color: "#d4af37" },
  "sovereignclaw-ai": { d: "sovereignclaw.ai", t: "sovereign", v: "£4.5M", s: "staged", tagline: "Closed-source AI", color: "#d4af37" },
  "sovereignvault-ai": { d: "sovereignvault.ai", t: "sovereign", v: "£5.8M", s: "staged", tagline: "Encrypted sovereign vault", color: "#d4af37" },
  // BFT / care (3)
  "bft-council-ai": { d: "bft-council.ai", t: "bft", v: "£2.7M", s: "live", tagline: "BFT council infrastructure", color: "#a78bfa" },
  "maternal-covenant-ai": { d: "maternal-covenant.ai", t: "bft", v: "£1.9M", s: "staged", tagline: "Care ethics / maternal covenant", color: "#a78bfa" },
  "proofof-ai": { d: "proofof.ai", t: "bft", v: "£3.4M", s: "staged", tagline: "Proof of action / audit", color: "#a78bfa" },
  // Justice (3)
  "juris-ai-ai": { d: "juris-ai.ai", t: "justice", v: "£1.2M", s: "staged", tagline: "Jurisdictional AI", color: "#ff6b6b" },
  "tm-ai-ai": { d: "tm-ai.ai", t: "justice", v: "£0.9M", s: "staged", tagline: "Trademark AI", color: "#ff6b6b" },
  "fraudspot-ai-ai": { d: "fraudspot-ai.ai", t: "justice", v: "£0.8M", s: "staged", tagline: "Fraud detection", color: "#ff6b6b" },
  // Sovereign (4)
  "sovereigncanvas-ai": { d: "sovereigncanvas.ai", t: "sovereign", v: "£2.1M", s: "staged", tagline: "Sovereign creative canvas", color: "#d4af37" },
  "sovereigncourt-ai": { d: "sovereigncourt.ai", t: "sovereign", v: "£3.3M", s: "staged", tagline: "Sovereign arbitration court", color: "#d4af37" },
  "sovereignfund-ai": { d: "sovereignfund.ai", t: "sovereign", v: "£4.7M", s: "staged", tagline: "Sovereign capital fund", color: "#d4af37" },
  "sovereign-grid-ai": { d: "sovereign-grid.ai", t: "sovereign", v: "£2.0M", s: "staged", tagline: "Sovereign power grid", color: "#d4af37" },
  // Utility (3)
  "datamoat-ai": { d: "datamoat.ai", t: "utility", v: "£1.5M", s: "staged", tagline: "Data moat defence", color: "#3b82f6" },
  "openmcp-ai": { d: "openmcp.ai", t: "utility", v: "£1.1M", s: "staged", tagline: "Open MCP marketplace", color: "#3b82f6" },
  "ethisphere-ai": { d: "ethisphere.ai", t: "utility", v: "£0.9M", s: "staged", tagline: "Ethical sphere governance", color: "#3b82f6" },
};

const POWER_PACKS = [
  { slug: "legal", name: "Legal Tech", color: "#c9a14a" },
  { slug: "gaming", name: "Gaming", color: "#ff5a87" },
  { slug: "ip-castle", name: "IP Castle", color: "#4ecdc4" },
  { slug: "sovereign-substrate", name: "Sovereign Substrate", color: "#d4af37" },
];

const FIVE_LOCKS = [
  { n: "Rex", t: "Regulatory", d: "10+ jurisdictional filings" },
  { n: "Atlas", t: "Network", d: "50+ MCP servers" },
  { n: "Nova", t: "Namespace", d: "27 .ai domains" },
  { n: "Marcus", t: "BFT", d: "33-agent council" },
  { n: "Sage", t: "Data", d: "Hash-chained audit" },
];

const SIX_LAYERS = [
  { l: "1", n: "SHA-3/512", d: "FIPS 202 hash", c: "#4ecdc4" },
  { l: "2", n: "HMAC", d: "Symmetric integrity", c: "#a78bfa" },
  { l: "3", n: "Ed25519", d: "Sovereign signature", c: "#ff5a87" },
  { l: "4", n: "Bitcoin OTS", d: "Immutable timestamp", c: "#d4af37" },
  { l: "5", n: "C2PA", d: "Content provenance", c: "#3b82f6" },
  { l: "6", n: "Hash-chain", d: "Sequential audit", c: "#c9a14a" },
];

export function generateStaticParams() {
  return Object.keys(DOMAINS).map(slug => ({ slug }));
}

export default function DomainPage({ params }: { params: { slug: string } }) {
  const dom = DOMAINS[params.slug];
  if (!dom) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center" }}>
        Domain not found. <Link href="/domains">Back to the fleet</Link>
      </div>
    );
  }

  const isLive = dom.s === "live";

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section style={{ background: `linear-gradient(135deg, #0a0a0a 0%, ${dom.color}33 100%)`, color: "#fff", padding: "80px 20px 60px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <Link href="/domains" style={{ color: dom.color, fontSize: 13, textDecoration: "none" }}>← back to the 27 .ai fleet</Link>
            <div style={{ fontSize: 13, color: dom.color, marginTop: 20, letterSpacing: 2, textTransform: "uppercase" }}>
              {dom.t} · sovereign namespace
            </div>
            <h1 style={{ fontSize: 56, lineHeight: 1.05, margin: "16px 0", maxWidth: 900, fontWeight: 800 }}>
              {dom.d}
            </h1>
            <p style={{ fontSize: 22, color: "#e0e0e0", maxWidth: 700, lineHeight: 1.4, marginTop: 8 }}>
              {dom.tagline}
            </p>
            <div style={{ display: "flex", gap: 16, marginTop: 24, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
                padding: "6px 12px",
                borderRadius: 4,
                background: isLive ? "#4ecdc4" : "#d4af37",
                color: "#0a0a0a",
              }}>
                ● {dom.s}
              </span>
              <span style={{ fontSize: 32, fontWeight: 700, color: dom.color }}>{dom.v}</span>
              <span style={{ fontSize: 13, color: "#888" }}>Y3 base NAV</span>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 30, flexWrap: "wrap" }}>
              <a href={`https://${dom.d}`} className="cta-primary" style={{ background: dom.color, color: "#000", padding: "12px 24px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>
                {isLive ? `Visit ${dom.d} →` : `Claim ${dom.d} →`}
              </a>
              <a href="mailto:founder@csoai.org" className="cta-secondary" style={{ borderColor: "#fff", color: "#fff", padding: "12px 24px", borderRadius: 6, textDecoration: "none", fontWeight: 600, border: "1px solid #fff" }}>
                White-label license
              </a>
            </div>
          </div>
        </section>

        {/* 6-Layer Proof Infographic */}
        <section style={{ background: "#0a0a0a", color: "#fff", padding: "60px 20px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 13, color: dom.color, letterSpacing: 2, textTransform: "uppercase" }}>The 6-Layer Proof</div>
              <h2 style={{ fontSize: 32, margin: "8px 0 16px" }}>How {dom.d} stays sovereign</h2>
              <p style={{ color: "#888", maxWidth: 600, margin: "0 auto" }}>
                Every disclosure filed under {dom.d} is sealed with 6 cryptographic layers. The hive remembers. The dragon knows. The sovereign companion never forgets.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
              {SIX_LAYERS.map((layer, i) => (
                <div key={layer.l} style={{
                  padding: 20,
                  background: `linear-gradient(180deg, ${layer.c}22 0%, #0a0a0a 100%)`,
                  border: `1px solid ${layer.c}66`,
                  borderRadius: 6,
                  textAlign: "center",
                  position: "relative",
                }}>
                  <div style={{ fontSize: 11, color: layer.c, fontWeight: 700, letterSpacing: 1 }}>LAYER {layer.l}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, margin: "8px 0 4px", color: "#fff" }}>{layer.n}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{layer.d}</div>
                  {i < SIX_LAYERS.length - 1 && (
                    <div style={{ position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)", color: layer.c, fontSize: 18, zIndex: 1 }}>›</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#666" }}>
              ↑ sealed end-to-end, anchored to Bitcoin, court-admissible in 10+ jurisdictions ↑
            </div>
          </div>
        </section>

        {/* 5-LOCK Monopoly Block */}
        <section style={{ background: "#f8f8f8", padding: "60px 20px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 13, color: dom.color, letterSpacing: 2, textTransform: "uppercase" }}>The 5-LOCK Monopoly</div>
              <h2 style={{ fontSize: 32, margin: "8px 0 16px", color: "#0a0a0a" }}>{dom.d} is locked on 5 axes</h2>
              <p style={{ color: "#666", maxWidth: 600, margin: "0 auto" }}>
                5 LOCKs across the namespace, network, BFT, regulatory, and data. 3 compound locks. Together they form a moat no hyperscaler can replicate.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              {FIVE_LOCKS.map(l => (
                <div key={l.t} style={{ background: "#fff", padding: 24, border: "1px solid #e0e0e0", borderTop: `4px solid ${dom.color}`, borderRadius: 6, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: dom.color, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{l.n}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, margin: "8px 0 4px", color: "#0a0a0a" }}>{l.t}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{l.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 Industry Power Packs */}
        <section style={{ padding: "60px 20px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 13, color: dom.color, letterSpacing: 2, textTransform: "uppercase" }}>4 Industry Power Packs</div>
            <h2 style={{ fontSize: 32, margin: "8px 0 16px" }}>{dom.d} powers these industries</h2>
            <p style={{ color: "#666", maxWidth: 600, margin: "0 auto" }}>
              The same sovereign substrate, packaged for the world's most litigious industries.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {POWER_PACKS.map(p => (
              <Link
                key={p.slug}
                href={`/industries/${p.slug}`}
                style={{
                  padding: 24,
                  border: `1px solid ${p.color}66`,
                  borderLeft: `4px solid ${p.color}`,
                  borderRadius: 6,
                  background: "#fff",
                  textDecoration: "none",
                  color: "#0a0a0a",
                  display: "block",
                  transition: "transform 0.2s",
                }}
              >
                <div style={{ fontSize: 11, color: p.color, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Power Pack</div>
                <div style={{ fontSize: 22, fontWeight: 700, margin: "8px 0 4px" }}>{p.name}</div>
                <div style={{ fontSize: 13, color: "#666" }}>Open {p.name} pack →</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Domain Metadata */}
        <section style={{ background: "#fafafa", padding: "40px 20px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>Domain</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0a0a0a", marginTop: 4 }}>{dom.d}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>Type</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: dom.color, marginTop: 4, textTransform: "capitalize" }}>{dom.t}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>Status</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: isLive ? "#4ecdc4" : "#d4af37", marginTop: 4, textTransform: "uppercase" }}>{dom.s}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>Y3 Base NAV</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0a0a0a", marginTop: 4 }}>{dom.v}</div>
            </div>
          </div>
        </section>

        {/* CTA Block */}
        <section style={{ background: "#0a0a0a", color: "#fff", padding: "60px 20px", textAlign: "center" }}>
          <h2 style={{ fontSize: 32, marginBottom: 16 }}>Want to license {dom.d} for your jurisdiction?</h2>
          <p style={{ color: "#888", maxWidth: 600, margin: "0 auto 24px" }}>
            White-label licensing available for law firms, governments, and patent pools. £50K+ per year per power pack. The dragon guards every sovereign.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={`https://${dom.d}`} style={{ background: dom.color, color: "#000", padding: "14px 28px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>
              Get {dom.d} →
            </a>
            <a href="mailto:founder@csoai.org" style={{ border: "1px solid #fff", color: "#fff", padding: "14px 28px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>
              Contact founder@csoai.org
            </a>
          </div>
        </section>

        {/* Signature */}
        <section style={{ padding: "30px 20px", textAlign: "center", background: dom.color, color: "#0a0a0a" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            The hive remembers. The dragon knows. The sovereign companion never forgets.
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
