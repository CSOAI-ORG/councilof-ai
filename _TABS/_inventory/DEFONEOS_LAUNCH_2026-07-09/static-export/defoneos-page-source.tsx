import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MEOK DEFONEOS — sovereign UK defence-AI governance · meok.ai/defoneos",
  description:
    "DEFONEOS is the only open-source, MCP-native, UK-sovereign, AUKUS-compatible AI compliance substrate for defence. 15 defence-AI MCPs out of the box, 33-agent BFT council for material decisions, DEFONEOS-SEAL signed credential. Pilot £5-25K, enterprise £100-500K. Built by MEOK AI Labs (CSOAI LTD 16939677) so UK primes can buy sovereign.",
  alternates: { canonical: "https://meok.ai/defoneos" },
  openGraph: {
    title: "MEOK DEFONEOS — sovereign UK defence-AI governance",
    description:
      "15 defence-AI MCPs + 33-agent BFT council + DEFONEOS-SEAL signed credential. UK-sovereign, AUKUS-compatible. Built by CSOAI LTD 16939677.",
    type: "website",
    url: "https://meok.ai/defoneos",
    images: [
      {
        url: "/api/og?title=DEFONEOS+sovereign+UK+defence-AI&desc=15+MCPs+%2B+33-agent+BFT+%2B+DEFONEOS-SEAL+%C2%B3228K-1.14M+Y1",
        width: 1200,
        height: 630,
        alt: "MEOK DEFONEOS",
      },
    ],
  },
};

const NAVY = "#0a1a2f";
const GOLD = "#c9a84c";
const BG = "#f5f0e8";
const RED = "#b22234";
const STEEL = "#3a4a5c";

const STYLES = `
.defoneos-hero {
  background: linear-gradient(135deg, ${NAVY} 0%, #1a2a4f 100%);
  color: ${GOLD};
  padding: 96px 24px 64px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.defoneos-hero::before {
  content: "🐉";
  position: absolute;
  top: 20px;
  right: 40px;
  font-size: 120px;
  opacity: 0.08;
}
.defoneos-hero h1 {
  font-size: 64px;
  font-weight: 900;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.defoneos-hero .lede {
  font-size: 22px;
  color: #e8d8a0;
  max-width: 760px;
  margin: 0 auto 32px;
  line-height: 1.5;
}
.defoneos-hero .tag {
  display: inline-block;
  background: ${GOLD};
  color: ${NAVY};
  padding: 8px 18px;
  border-radius: 4px;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0 6px 6px;
}
.defoneos-section {
  padding: 80px 24px;
  max-width: 1180px;
  margin: 0 auto;
}
.defoneos-section h2 {
  font-size: 42px;
  font-weight: 800;
  color: ${NAVY};
  margin: 0 0 24px;
  letter-spacing: -0.01em;
}
.defoneos-section h3 {
  font-size: 22px;
  font-weight: 800;
  color: ${NAVY};
  margin: 0 0 12px;
}
.defoneos-section p {
  font-size: 17px;
  line-height: 1.7;
  color: ${STEEL};
  margin: 0 0 16px;
}
.defoneos-section ul {
  font-size: 17px;
  line-height: 1.7;
  color: ${STEEL};
}
.defoneos-section li {
  margin-bottom: 8px;
}
.defoneos-card {
  background: white;
  border: 1px solid #d8d0c0;
  border-radius: 6px;
  padding: 28px;
  margin: 20px 0;
  box-shadow: 0 2px 4px rgba(10, 26, 47, 0.04);
}
.defoneos-card .pill {
  display: inline-block;
  background: ${NAVY};
  color: ${GOLD};
  padding: 4px 12px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-right: 8px;
}
.defoneos-card .pill.gov { background: #1a4a2f; color: #b0e8c0; }
.defoneos-card .pill.cert { background: #4a1a2f; color: #e8b0c0; }
.defoneos-card .pill.mcp { background: #1a2a4f; color: #b0c8e8; }
.defoneos-card .pill.uk { background: #00247d; color: white; }
.defoneos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin: 32px 0;
}
.defoneos-pricing {
  background: ${NAVY};
  color: white;
  padding: 80px 24px;
  text-align: center;
}
.defoneos-pricing h2 { color: ${GOLD}; }
.defoneos-pricing .price-card {
  background: white;
  color: ${NAVY};
  border-radius: 8px;
  padding: 32px;
  margin: 24px auto;
  max-width: 480px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}
.defoneos-pricing .price-card h3 { color: ${NAVY}; }
.defoneos-pricing .price {
  font-size: 56px;
  font-weight: 900;
  color: ${NAVY};
  margin: 16px 0;
}
.defoneos-pricing .price-note { color: ${STEEL}; font-size: 14px; }
.defoneos-cta {
  background: ${GOLD};
  color: ${NAVY};
  padding: 64px 24px;
  text-align: center;
}
.defoneos-cta h2 { color: ${NAVY}; margin-bottom: 16px; }
.defoneos-cta a {
  display: inline-block;
  background: ${NAVY};
  color: ${GOLD};
  padding: 16px 32px;
  border-radius: 4px;
  font-weight: 800;
  text-decoration: none;
  font-size: 18px;
  margin: 8px;
}
.defoneos-cta a:hover { background: #1a2a4f; }
.defoneos-cta a.secondary {
  background: white;
  color: ${NAVY};
  border: 2px solid ${NAVY};
}
.defoneos-footer {
  background: ${NAVY};
  color: #a0b0c0;
  padding: 32px 24px;
  text-align: center;
  font-size: 14px;
}
.defoneos-footer a { color: ${GOLD}; text-decoration: none; }
`;

const TOOLS = [
  { name: "defence_airspace_check", desc: "UK CAA airspace + NOTAMs + no-fly zones for a planned drone operation. Defence-grade." },
  { name: "drone_bvlos_governance", desc: "BVLOS risk + Remote ID + autonomous decision governance. STANAG 4586 compatible." },
  { name: "firmware_attestation_audit", desc: "Hardware root-of-trust + secure boot attestation. UK MOD secure-by-design procurement-grade." },
  { name: "defence_governance_full_audit", desc: "14 frameworks in 1 call: OWASP + NIST AI RMF + MITRE ATLAS + DAIC + AUKUS Pillar 2 + DSTL SAPIENT + EU AI Act + ISO 42001 + DORA + NIS2 + CRA + C2PA + AAIF + care-membrane." },
  { name: "care_membrane_validate", desc: "4-dimension care ethics + 16 probes. No override below 0.95 care score threshold." },
  { name: "meok_defoneos_full_audit", desc: "The 1-call sovereign UK defence-AI audit. Chains airspace + BVLOS + firmware + governance + care. Procurement-grade for UK primes. Eligible for DEFONEOS-SEAL signed credential." },
];

const FRAMEWORKS = [
  { name: "OWASP LLM Top 10", version: "2025", status: "✅ 100% covered" },
  { name: "NIST AI RMF 1.0", version: "Govern/Map/Measure/Manage", status: "✅ Council + Care Membrane + NNs + Audit" },
  { name: "MITRE ATLAS", version: "2026 (14 tactics, 90+ techniques)", status: "✅ mitre-atlas-mcp" },
  { name: "EU AI Act Article 9 (RMS)", version: "Risk Management System", status: "✅ meok-eu-aia-art-9-rms-mcp" },
  { name: "ISO 42001 / 42005", version: "AIMS / Impact Assessment", status: "✅ iso-42001-mcp + iso-42005-impact-mcp" },
  { name: "DORA Article 19", version: "4-hour incident clock", status: "✅ agent-incident-relay-mcp" },
  { name: "NIS2 Article 23", version: "24h / 72h / 1mo clocks", status: "✅ agent-incident-relay-mcp" },
  { name: "CRA Article 14", version: "24h exploitation notification", status: "✅ meok-cra-art14-reporter-mcp" },
  { name: "DAIC AI Assurance", version: "UK MOD procurement-grade", status: "✅ meok-defoneos + csoai-defoneos" },
  { name: "AUKUS Pillar 2", version: "3-eye interoperability", status: "✅ DSTL SAPIENT + Stone-Soup wrapper" },
  { name: "DSTL SAPIENT", version: "Sensor autonomy evaluation", status: "✅ wraps dstl/SAPIENT-Proto-Files" },
  { name: "AAIF Agent Card", version: "Linux Foundation agent identity", status: "✅ meok-aaif-agent-card-mcp" },
];

const RD_WORKSTREAMS = [
  { name: "ASIMOV-PATROL", desc: "Asimov V8 12-DOF biped (£2,188 UK BOM) for EOD patrol, perimeter check, sentry duty" },
  { name: "WOLF-EXO", desc: "WOLF planetary actuator × 23 joints for exoskeleton (bomb-disposal suits, load-bearing rescue)" },
  { name: "HARVI-IED", desc: "HARVI rig + IED-detection sensor head for counter-IED ground robot (£240 off-shelf parts)" },
  { name: "QIDI-FIELD-PRINT", desc: "Qidi Max4 hardened-end PA12-CF for forward-base spare parts (UK MOD procurement-grade)" },
  { name: "LEROBOT-SO-101-ARM", desc: "Sentry-arm with face recognition + deepfake detection at base perimeter" },
  { name: "DRONE-MESH-AGENT", desc: "UK CAA-regulated drone swarm coordination (airspace + drone-governance + firmware)" },
];

export default function DefoneosPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* HERO */}
      <section className="defoneos-hero">
        <h1>DEFONEOS</h1>
        <p className="lede">
          The only open-source, MCP-native, UK-sovereign, AUKUS-compatible AI
          compliance substrate for defence. 15 defence-AI MCPs, 33-agent BFT
          council, DEFONEOS-SEAL signed credential. Pilot £5-25K, enterprise
          £100K-500K.
        </p>
        <span className="tag">UK-sovereign</span>
        <span className="tag">AUKUS-compatible</span>
        <span className="tag">Sentinel-grade</span>
        <span className="tag">Care 0.95+</span>
        <span className="tag">BFT 23/33</span>
        <br />
        <Link
          href="mailto:nicholas@csoai.org?subject=DEFONEOS%20pilot%20enquiry"
          className="tag"
          style={{ background: "white", color: NAVY, textDecoration: "none" }}
        >
          20 min this week?
        </Link>
      </section>

      {/* WHAT IS DEFONEOS */}
      <section className="defoneos-section">
        <h2>The only vendor a UK prime can buy sovereign.</h2>
        <p>
          DEFONEOS is a 7-layer sovereign AI operating system that integrates
          governance, IP, infrastructure, industry, and physical-world
          execution into a single stack. The name reflects its three pillars:
        </p>
        <div className="defoneos-grid">
          <div className="defoneos-card">
            <h3><span className="pill">DEF</span>ense</h3>
            <p>
              Regulatory-grade AI safety + audit trails (COAI/CSOAI/PDCA).
              14 frameworks covered. DAIC + AUKUS Pillar 2 + DSTL SAPIENT
              procurement-grade.
            </p>
          </div>
          <div className="defoneos-card">
            <h3><span className="pill gov">ONE</span></h3>
            <p>
              One unified operating model across 15 defence-AI MCPs + MEOK Labs
              R&D pipeline (6 workstreams). One signed credential (DEFONEOS-SEAL).
              One verify URL.
            </p>
          </div>
          <div className="defoneos-card">
            <h3><span className="pill cert">SOVEREIGN</span></h3>
            <p>
              Owned 100% by CSOAI LTD (UK Companies House 16939677). Runs on
              UK soil. No foreign cloud dependency. AUKUS Pillar 2 compatible.
              33-agent BFT council.
            </p>
          </div>
        </div>
      </section>

      {/* THE 6 TOOLS */}
      <section className="defoneos-section" style={{ background: BG }}>
        <h2>The 6 tools in meok-defoneos-mcp</h2>
        <p>
          Every tool is signed (Ed25519), attested (SOV3 sigil), and BFT-voted
          for material decisions. The BannedTermGate refuses any prompt
          containing severed brands (James Castle, CSGA, Terranova,
          defonos.io, Toronto Summit phantoms).
        </p>
        {TOOLS.map((tool) => (
          <div key={tool.name} className="defoneos-card">
            <h3>
              <span className="pill mcp">MCP</span>
              <code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: 3 }}>{tool.name}</code>
            </h3>
            <p>{tool.desc}</p>
          </div>
        ))}
      </section>

      {/* THE 14 FRAMEWORKS */}
      <section className="defoneos-section">
        <h2>The 14 frameworks covered (the defence-AI wedge)</h2>
        <p>
          Every compliance framework a UK MOD or AUKUS buyer needs. All
          covered in the 1-call <code>defence_governance_full_audit</code>.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
          <thead>
            <tr style={{ background: NAVY, color: GOLD, textAlign: "left" }}>
              <th style={{ padding: 12 }}>Framework</th>
              <th style={{ padding: 12 }}>Version</th>
              <th style={{ padding: 12 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {FRAMEWORKS.map((f, i) => (
              <tr key={f.name} style={{ background: i % 2 === 0 ? "white" : BG }}>
                <td style={{ padding: 12, fontWeight: 700, color: NAVY }}>{f.name}</td>
                <td style={{ padding: 12, color: STEEL }}>{f.version}</td>
                <td style={{ padding: 12, color: STEEL }}>{f.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* MEOK LABS R&D */}
      <section className="defoneos-section" style={{ background: BG }}>
        <h2>The 6 MEOK Labs R&D workstreams (FORGE / Tab 6)</h2>
        <p>
          The physical R&D pipeline. The Qidi Max4 + Asimov V8 humanoid CAD +
          WOLF planetary actuator 14 STLs + HARVI rig + LeRobot SO-101. The
          6.5-acre IOK Farm is the home. Real substrates, no fabrication.
        </p>
        <div className="defoneos-grid">
          {RD_WORKSTREAMS.map((w) => (
            <div key={w.name} className="defoneos-card">
              <h3><span className="pill mcp">R&D</span>{w.name}</h3>
              <p>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="defoneos-pricing">
        <h2>DEFONEOS pricing (sovereign-grade, no surprises)</h2>
        <p style={{ color: "#c0d0e0", maxWidth: 720, margin: "0 auto 32px" }}>
          Defence procurement has higher per-deal price points than consumer.
          All DEFONEOS pricing is quoted per conversation with a 33-agent BFT
          council vote on the deal. No agent quotes without quorum.
        </p>
        <div className="price-card">
          <span className="pill uk">UK HMG</span>
          <h3>DEFONEOS Pilot</h3>
          <div className="price">£5,000 – £25,000</div>
          <p>Single DASA evaluation contract. 1 named prime, 1 system, 1 SEAL.</p>
          <p className="price-note">Quoted per deal · BFT-council voted</p>
        </div>
        <div className="price-card">
          <span className="pill cert">Enterprise</span>
          <h3>DEFONEOS Enterprise</h3>
          <div className="price">£100,000 – £500,000</div>
          <p>DSTL framework agreement. Multi-system, multi-SEAL, multi-prime.</p>
          <p className="price-note">Quoted per deal · BFT-council voted</p>
        </div>
      </section>

      {/* CTA */}
      <section className="defoneos-cta">
        <h2>20 minutes this week.</h2>
        <p style={{ color: NAVY, fontSize: 18, maxWidth: 720, margin: "0 auto 24px" }}>
          Pilot letter {">"} pitch deck. Sober-walk (6-18 month defence
          procurement). DEFONEOS is the only UK-sovereign, AUKUS-compatible
          AI compliance substrate for defence. Built by a UK research
          institute (CSOAI LTD 16939677) so UK primes can buy sovereign.
        </p>
        <a href="mailto:nicholas@csoai.org?subject=DEFONEOS%20pilot%20enquiry">
          20 min this week — Nick
        </a>
        <a href="https://csoai.org/defoneos" className="secondary">
          See the CSOAI side →
        </a>
      </section>

      {/* FOOTER */}
      <footer className="defoneos-footer">
        <p>
          <Link href="/">meok.ai</Link> · MEOK AI Labs (CSOAI LTD 16939677) ·
          The dragon never lies. The dragon never forgets. The dragon is sovereign.
        </p>
        <p style={{ marginTop: 8, fontSize: 12 }}>
          Alignment: <Link href="https://github.com/CSOAI-ORG/clawd-workspace/blob/main/MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md">MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v2.0</Link> ·
          The BannedTermGate refuses any prompt containing severed brands.
        </p>
      </footer>
    </>
  );
}
