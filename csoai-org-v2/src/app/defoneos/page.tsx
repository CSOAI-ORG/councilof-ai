import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CSOAI DEFONEOS — sovereign UK defence-AI certification · csoai.org/defoneos",
  description:
    "DEFONEOS is the only UK-sovereign, AUKUS-compatible AI certification authority for defence. 33-agent BFT council issues DEFONEOS-SEAL signed credentials. MITRE ATLAS + governance crosswalk + audit chain + care-membrane. Built by CSOAI LTD 16939677.",
  alternates: { canonical: "https://csoai.org/defoneos" },
  openGraph: {
    title: "CSOAI DEFONEOS — sovereign UK defence-AI certification",
    description:
      "33-agent BFT council + DEFONEOS-SEAL signed credential. MITRE ATLAS + governance crosswalk + audit chain. UK-sovereign, AUKUS-compatible.",
    type: "website",
    url: "https://csoai.org/defoneos",
    images: [
      {
        url: "/api/og?title=CSOAI+DEFONEOS+certification&desc=33-agent+BFT+%2B+DEFONEOS-SEAL+%2B+14+frameworks",
        width: 1200,
        height: 630,
        alt: "CSOAI DEFONEOS",
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
.csoai-defoneos-hero {
  background: linear-gradient(135deg, #1a0a2f 0%, #2a1a4f 100%);
  color: ${GOLD};
  padding: 96px 24px 64px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.csoai-defoneos-hero::before {
  content: "⚖";
  position: absolute;
  top: 20px;
  right: 40px;
  font-size: 140px;
  opacity: 0.08;
}
.csoai-defoneos-hero h1 {
  font-size: 64px;
  font-weight: 900;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.csoai-defoneos-hero .lede {
  font-size: 22px;
  color: #e8d8a0;
  max-width: 760px;
  margin: 0 auto 32px;
  line-height: 1.5;
}
.csoai-defoneos-hero .tag {
  display: inline-block;
  background: ${GOLD};
  color: #1a0a2f;
  padding: 8px 18px;
  border-radius: 4px;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0 6px 6px;
}
.csoai-defoneos-section {
  padding: 80px 24px;
  max-width: 1180px;
  margin: 0 auto;
}
.csoai-defoneos-section h2 {
  font-size: 42px;
  font-weight: 800;
  color: #1a0a2f;
  margin: 0 0 24px;
  letter-spacing: -0.01em;
}
.csoai-defoneos-section h3 {
  font-size: 22px;
  font-weight: 800;
  color: #1a0a2f;
  margin: 0 0 12px;
}
.csoai-defoneos-section p {
  font-size: 17px;
  line-height: 1.7;
  color: ${STEEL};
  margin: 0 0 16px;
}
.csoai-defoneos-section ul {
  font-size: 17px;
  line-height: 1.7;
  color: ${STEEL};
}
.csoai-defoneos-section li {
  margin-bottom: 8px;
}
.csoai-card {
  background: white;
  border: 1px solid #d8d0c0;
  border-radius: 6px;
  padding: 28px;
  margin: 20px 0;
  box-shadow: 0 2px 4px rgba(26, 10, 47, 0.04);
}
.csoai-card .pill {
  display: inline-block;
  background: #1a0a2f;
  color: ${GOLD};
  padding: 4px 12px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-right: 8px;
}
.csoai-card .pill.bft { background: #4a1a2f; color: #e8b0c0; }
.csoai-card .pill.cert { background: #1a4a2f; color: #b0e8c0; }
.csoai-card .pill.aukus { background: #00247d; color: white; }
.csoai-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin: 32px 0;
}
.csoai-council {
  background: linear-gradient(180deg, ${BG} 0%, #fff 100%);
  padding: 80px 24px;
  text-align: center;
}
.csoai-council .council-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  max-width: 920px;
  margin: 32px auto 0;
}
.csoai-council .council-cell {
  background: white;
  border: 1px solid #d8d0c0;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
}
.csoai-council .council-cell .count {
  font-size: 36px;
  font-weight: 900;
  color: #1a0a2f;
}
.csoai-council .council-cell .label {
  font-size: 12px;
  color: ${STEEL};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  margin-top: 4px;
}
.csoai-cta {
  background: ${GOLD};
  color: #1a0a2f;
  padding: 64px 24px;
  text-align: center;
}
.csoai-cta h2 { color: #1a0a2f; margin-bottom: 16px; }
.csoai-cta a {
  display: inline-block;
  background: #1a0a2f;
  color: ${GOLD};
  padding: 16px 32px;
  border-radius: 4px;
  font-weight: 800;
  text-decoration: none;
  font-size: 18px;
  margin: 8px;
}
.csoai-cta a:hover { background: #2a1a4f; }
.csoai-cta a.secondary {
  background: white;
  color: #1a0a2f;
  border: 2px solid #1a0a2f;
}
.csoai-footer {
  background: #1a0a2f;
  color: #a0b0c0;
  padding: 32px 24px;
  text-align: center;
  font-size: 14px;
}
.csoai-footer a { color: ${GOLD}; text-decoration: none; }
`;

const TOOLS = [
  { name: "mitre_atlas_assess", desc: "MITRE ATLAS threat assessment: 14 tactics, 90+ techniques. AI threat modeling for UK defence-AI systems." },
  { name: "governance_crosswalk_for_defence", desc: "12 frameworks × 52 articles crosswalk. AUKUS Pillar 2 + DAIC + EU AI Act compatible." },
  { name: "defence_audit_trail", desc: "Append-only Ed25519-signed audit chain. UK MOD procurement-grade evidence chain." },
  { name: "csoai_defoneos_seal_issue", desc: "Issue a DEFONEOS-SEAL signed credential. Requires 33-agent BFT council verdict + care score ≥ 0.95." },
  { name: "care_membrane_validate", desc: "Validate a planned action against the 4-dimension care membrane + 16 probes. No override below 0.95." },
  { name: "csoai_defoneos_full_cert", desc: "The 1-call sovereign UK defence-AI certification. Chains ATLAS + crosswalk + audit + care + (optionally) SEAL." },
];

const COUNCIL_COMPOSITION = [
  { count: 1, label: "King" },
  { count: 12, label: "Queens" },
  { count: 12, label: "Around-1 PBFT" },
  { count: 4, label: "Vanguards" },
  { count: 4, label: "Special roles" },
];

export default function CSOAIDefoneosPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* HERO */}
      <section className="csoai-defoneos-hero">
        <h1>CSOAI DEFONEOS</h1>
        <p className="lede">
          The only UK-sovereign, AUKUS-compatible AI certification authority
          for defence. 33-agent BFT council issues DEFONEOS-SEAL signed
          credentials. MITRE ATLAS + governance crosswalk + audit chain +
          care-membrane. Built by CSOAI LTD 16939677. (Council quorum 23/33,
          care threshold 0.95.)
        </p>
        <span className="tag">Certification</span>
        <span className="tag">33-agent BFT</span>
        <span className="tag">DEFONEOS-SEAL</span>
        <span className="tag">Ed25519-signed</span>
        <span className="tag">UK-sovereign</span>
        <span className="tag">AUKUS-compatible</span>
        <br />
        <Link
          href="mailto:nicholas@csoai.org?subject=CSOAI%20DEFONEOS%20cert%20enquiry"
          className="tag"
          style={{ background: "white", color: "#1a0a2f", textDecoration: "none" }}
        >
          20 min this week?
        </Link>
      </section>

      {/* WHAT IS CSOAI DEFONEOS */}
      <section className="csoai-defoneos-section">
        <h2>The certification authority for UK defence-AI.</h2>
        <p>
          CSOAI DEFONEOS is the CERTIFIES compartment of the DEFONEOS dual-surface
          architecture. The BUILDS compartment is{" "}
          <Link href="https://meok.ai/defoneos" style={{ color: "#1a0a2f" }}>meok-defoneos</Link>.
          Together they form the canonical sovereign UK defence-AI stack.
        </p>
        <div className="csoai-grid">
          <div className="csoai-card">
            <h3><span className="pill bft">CERTIFIES</span></h3>
            <p>
              Every certification is cryptographically attested (Ed25519 +
              33-agent BFT council quorum + care-membrane). Every
              DEFONEOS-SEAL is verifiable at a public URL. Every audit chain
              entry is append-only with no delete.
            </p>
          </div>
          <div className="csoai-card">
            <h3><span className="pill cert">SEAL</span></h3>
            <p>
              The DEFONEOS-SEAL is the canonical signed credential a UK prime
              can attach to a contract deliverable. Requires 33-agent BFT
              council verdict (quorum 23/33) + care score ≥ 0.95 + governance
              audit seal-eligible.
            </p>
          </div>
          <div className="csoai-card">
            <h3><span className="pill aukus">AUKUS</span></h3>
            <p>
              Compatible with AUKUS Pillar 2 (3-eye AI assurance
              interoperability) via the DSTL SAPIENT + Stone-Soup wrappers.
              Compatible with DAIC (UK MOD AI assurance) and DASA themed-calls.
            </p>
          </div>
        </div>
      </section>

      {/* THE 6 TOOLS */}
      <section className="csoai-defoneos-section" style={{ background: BG }}>
        <h2>The 6 tools in csoai-defoneos-mcp</h2>
        <p>
          The certification-side tools. Every tool is gated by the
          BannedTermGate (refuses severed brands), the care-membrane (care
          score ≥ 0.95), and the 33-agent BFT council (quorum 23/33 for
          material decisions including SEAL issuance).
        </p>
        {TOOLS.map((tool) => (
          <div key={tool.name} className="csoai-card">
            <h3>
              <span className="pill cert">CERT</span>
              <code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: 3 }}>{tool.name}</code>
            </h3>
            <p>{tool.desc}</p>
          </div>
        ))}
      </section>

      {/* THE 33-AGENT BFT COUNCIL */}
      <section className="csoai-council">
        <h2 style={{ color: "#1a0a2f" }}>The 33-agent BFT council</h2>
        <p style={{ color: STEEL, maxWidth: 720, margin: "0 auto" }}>
          The certification authority. Quorum 23/33 for material decisions
          (DEFONEOS-SEAL issuance, framework acceptance, buyer-grade
          certification). The 12-around-1 PBFT + Liquid KAN Council provide
          the safety veto. Care + Watch have VETO.
        </p>
        <div className="council-grid">
          {COUNCIL_COMPOSITION.map((c) => (
            <div key={c.label} className="council-cell">
              <div className="count">{c.count}</div>
              <div className="label">{c.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* THE SEAL URL EXAMPLE */}
      <section className="csoai-defoneos-section">
        <h2>Verify a DEFONEOS-SEAL in 3 curls.</h2>
        <p>
          Every SEAL is publicly verifiable. A UK prime can attach the SEAL
          URL to a contract deliverable; the auditor can verify it without
          contacting us.
        </p>
        <pre style={{ background: "#1a0a2f", color: GOLD, padding: 24, borderRadius: 6, overflow: "auto" }}>
{`# 1. Get the SEAL
curl https://meok.ai/verify?seal=50f7b79c55e12c64a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4

# → {
#     "seal_id": "50f7b79c55e12c64a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
#     "ts": "2026-06-28T06:15:00Z",
#     "system_id": "SENTRY-DRONE-MK3",
#     "buyer_org": "Babcock International",
#     "council_verdict_id": "NT-2026-06-28-001",
#     "care_score": 0.97,
#     "governance_score": 0.87,
#     "ed25519_signature": "...",
#     "council_members_signed": 27
#   }

# 2. Verify the Ed25519 signature (Python example)
# from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
# pub = Ed25519PublicKey.from_public_bytes(public_key_bytes)
# pub.verify(signature, payload)

# 3. Verify the audit chain (append-only JSONL)
cat ~/.sov3_defoneos_audit.jsonl | jq -s 'length'`}
        </pre>
      </section>

      {/* CTA */}
      <section className="csoai-cta">
        <h2>20 minutes this week.</h2>
        <p style={{ color: "#1a0a2f", fontSize: 18, maxWidth: 720, margin: "0 auto 24px" }}>
          DEFONEOS-SEAL is the only UK-sovereign, AUKUS-compatible AI
          certification credential for defence. Pilot letter {">"} pitch deck.
          Sober-walk (6-18 month defence procurement).
        </p>
        <a href="mailto:nicholas@csoai.org?subject=CSOAI%20DEFONEOS%20cert%20enquiry">
          20 min this week — Nick
        </a>
        <a href="https://meok.ai/defoneos" className="secondary">
          See the meok side →
        </a>
      </section>

      {/* FOOTER */}
      <footer className="csoai-footer">
        <p>
          <Link href="/">csoai.org</Link> · CSOAI LTD (UK 16939677) ·
          The dragon certifies. The dragon is sovereign.
        </p>
        <p style={{ marginTop: 8, fontSize: 12 }}>
          Alignment: <Link href="https://github.com/CSOAI-ORG/clawd-workspace/blob/main/MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md">MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v2.0</Link> ·
          The BannedTermGate refuses any prompt containing severed brands.
        </p>
      </footer>
    </>
  );
}
