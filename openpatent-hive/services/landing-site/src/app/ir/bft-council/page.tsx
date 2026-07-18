/**
 * openpatent.ai — BFT Council IR Page
 * 33-agent sovereign-temple v3.0 architecture
 */
import Link from "next/link";
import { Header, Footer } from "../../components/chrome";

export const metadata = {
  title: "BFT Council — 33-Agent Sovereign-Temple v3.0 — openpatent.ai",
  description: "11 domains × 3 nodes = 33 agents. 22/33 supermajority. 6 care dimensions. MEOK_KEYSTONE cross-hive attestation.",
};

const ELEVEN_DOMAINS = [
  { id: 1, name: "Ethics", glyph: "🜁", mandate: "Moral alignment, no harm" },
  { id: 2, name: "Security", glyph: "🜂", mandate: "Cryptographic integrity, BFT fault-tolerance" },
  { id: 3, name: "Research", glyph: "🜃", mandate: "Prior art search, novelty analysis" },
  { id: 4, name: "Governance", glyph: "🜄", mandate: "Sovereign policy, jurisdictional rules" },
  { id: 5, name: "Care", glyph: "🜅", mandate: "6 care dimensions, maternal covenant" },
  { id: 6, name: "Technical", glyph: "🜆", mandate: "Patentability, claim drafting" },
  { id: 7, name: "Sovereign", glyph: "🜇", mandate: "Self-hosted substrate, no cloud lock" },
  { id: 8, name: "Hydro", glyph: "🜈", mandate: "Water cycle, hydroponic domain review" },
  { id: 9, name: "Biosensing", glyph: "🜉", mandate: "Bio-signal, medical device review" },
  { id: 10, name: "Emergence", glyph: "🜊", mandate: "Novelty detection, surprise scoring" },
  { id: 11, name: "Substrate", glyph: "🜋", mandate: "6-layer proof, hash-chain audit" },
];

// 11 × 3 roster: 3 nodes per domain (Alpha, Beta, Gamma)
const ROSTER = ELEVEN_DOMAINS.flatMap(d => [
  { domain: d.name, node: "Alpha", id: `${d.name}-α`, role: "Primary", care_dim: primaryCare(d.id) },
  { domain: d.name, node: "Beta", id: `${d.name}-β`, role: "Reviewer", care_dim: primaryCare(d.id) },
  { domain: d.name, node: "Gamma", id: `${d.name}-γ`, role: "Veto Holder", care_dim: primaryCare(d.id) },
]);

function primaryCare(domainId: number): string {
  const map: Record<number, string> = {
    1: "other_care",
    2: "self_care",
    3: "future_care",
    4: "process_care",
    5: "maternal_covenant",
    6: "relational_care",
    7: "self_care",
    8: "process_care",
    9: "other_care",
    10: "future_care",
    11: "relational_care",
  };
  return map[domainId] || "process_care";
}

const SIX_CARE = [
  { dim: "self_care", desc: "Each agent protects its own operational integrity before acting." },
  { dim: "other_care", desc: "Agents weigh the impact on co-agents, inventors, and downstream systems." },
  { dim: "process_care", desc: "The procedure itself must remain clean, auditable, and reversible." },
  { dim: "relational_care", desc: "The covenant between agent, hive, and sovereign is preserved." },
  { dim: "maternal_covenant", desc: "The hive owes a duty of nurture to the inventor and the invention." },
  { dim: "future_care", desc: "Decisions are projected forward — the dragon guards what is not yet built." },
];

export default function BFTCouncilPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)", color: "#fff", padding: "80px 20px 60px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <Link href="/" style={{ color: "#a78bfa", fontSize: 13, textDecoration: "none" }}>← back to openpatent.ai</Link>
            <div style={{ fontSize: 13, color: "#a78bfa", marginTop: 20, letterSpacing: 2, textTransform: "uppercase" }}>
              Investor Relations · bft-council.ai
            </div>
            <h1 style={{ fontSize: 52, lineHeight: 1.05, margin: "16px 0", maxWidth: 900, fontWeight: 800 }}>
              The 33-Agent BFT Sovereign-Temple v3.0
            </h1>
            <p style={{ fontSize: 18, color: "#aaa", maxWidth: 700, lineHeight: 1.6 }}>
              11 domains × 3 nodes = 33 agents reviewing every premium disclosure. 22/33 supermajority required for approval. 6 care dimensions guard the veto. MEOK_KEYSTONE cross-hive attestation. The dragon knows.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 20, marginTop: 40, maxWidth: 900 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#a78bfa" }}>33</div>
                <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>Agents in council</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#4ecdc4" }}>11</div>
                <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>Sovereign domains</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#d4af37" }}>22/33</div>
                <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>Supermajority</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#ff5a87" }}>6</div>
                <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>Care dimensions</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>55</div>
                <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>Bridge pairs</div>
              </div>
            </div>
          </div>
        </section>

        {/* 11 × 3 Roster Table */}
        <section style={{ padding: "60px 20px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 13, color: "#a78bfa", letterSpacing: 2, textTransform: "uppercase" }}>The Roster</div>
            <h2 style={{ fontSize: 32, margin: "8px 0 16px" }}>11 domains × 3 nodes = 33 agents</h2>
            <p style={{ color: "#666", maxWidth: 700, margin: "0 auto" }}>
              Every premium-tier disclosure is reviewed by all 33 agents. The Alpha proposes, the Beta refines, the Gamma holds the veto. Each agent has a primary care dimension.
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#0a0a0a", color: "#fff" }}>
                  <th style={{ padding: "12px 8px", textAlign: "left", borderBottom: "2px solid #a78bfa" }}>Domain</th>
                  <th style={{ padding: "12px 8px", textAlign: "left", borderBottom: "2px solid #a78bfa" }}>Node</th>
                  <th style={{ padding: "12px 8px", textAlign: "left", borderBottom: "2px solid #a78bfa" }}>Agent ID</th>
                  <th style={{ padding: "12px 8px", textAlign: "left", borderBottom: "2px solid #a78bfa" }}>Role</th>
                  <th style={{ padding: "12px 8px", textAlign: "left", borderBottom: "2px solid #a78bfa" }}>Primary Care Dimension</th>
                </tr>
              </thead>
              <tbody>
                {ROSTER.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8f8f8" }}>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #e0e0e0", fontWeight: 600 }}>{r.domain}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #e0e0e0", color: r.node === "Alpha" ? "#4ecdc4" : r.node === "Beta" ? "#a78bfa" : "#ff5a87", fontWeight: 600 }}>{r.node}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #e0e0e0", fontFamily: "monospace", fontSize: 12 }}>{r.id}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #e0e0e0", color: "#666" }}>{r.role}</td>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid #e0e0e0" }}>
                      <span style={{ padding: "2px 8px", background: "#a78bfa22", color: "#a78bfa", borderRadius: 3, fontSize: 12, fontWeight: 600 }}>{r.care_dim}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 11 Domains — Mandate Cards */}
        <section style={{ background: "#f8f8f8", padding: "60px 20px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 13, color: "#a78bfa", letterSpacing: 2, textTransform: "uppercase" }}>The 11 Sovereign Domains</div>
              <h2 style={{ fontSize: 32, margin: "8px 0 16px" }}>What each domain guards</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {ELEVEN_DOMAINS.map(d => (
                <div key={d.id} style={{ background: "#fff", padding: 20, border: "1px solid #e0e0e0", borderTop: "4px solid #a78bfa", borderRadius: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 11, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Domain {d.id}</div>
                    <div style={{ fontSize: 24 }}>{d.glyph}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#0a0a0a", margin: "6px 0" }}>{d.name}</div>
                  <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{d.mandate}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6 Care Dimensions Explainer */}
        <section style={{ padding: "60px 20px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 13, color: "#a78bfa", letterSpacing: 2, textTransform: "uppercase" }}>6 Care Dimensions</div>
            <h2 style={{ fontSize: 32, margin: "8px 0 16px" }}>How the veto holds</h2>
            <p style={{ color: "#666", maxWidth: 700, margin: "0 auto" }}>
              Every agent scores a disclosure against 6 care dimensions. If any dimension falls below 0.15, the agent can trigger a binding veto. The maternal covenant is non-negotiable.
            </p>
            <Link href="/ir/maternal-covenant" style={{ display: "inline-block", marginTop: 16, color: "#a78bfa", fontWeight: 600 }}>Read the maternal covenant doctrine →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {SIX_CARE.map(c => (
              <div key={c.dim} style={{ padding: 20, border: "1px solid #e0e0e0", borderRadius: 6, background: "#fff" }}>
                <div style={{ fontSize: 11, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Care Dimension</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0a0a0a", margin: "6px 0", fontFamily: "monospace" }}>{c.dim}</div>
                <div style={{ fontSize: 14, color: "#444", lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 22/33 Supermajority Mechanics */}
        <section style={{ background: "#0a0a0a", color: "#fff", padding: "60px 20px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 13, color: "#d4af37", letterSpacing: 2, textTransform: "uppercase" }}>BFT Mechanics</div>
              <h2 style={{ fontSize: 32, margin: "8px 0 16px" }}>22 of 33. The sovereign threshold.</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              {[
                { n: "33", t: "Total agents", d: "11 domains × 3 nodes", c: "#a78bfa" },
                { n: "22", t: "Supermajority", d: "≥66.7% approval required", c: "#4ecdc4" },
                { n: "11", t: "Max fault", d: "Byzantine fault tolerance", c: "#d4af37" },
                { n: "0.15", t: "Veto threshold", d: "Below on any care dim", c: "#ff5a87" },
                { n: "55", t: "Bridge pairs", d: "Cross-domain attestations", c: "#3b82f6" },
                { n: "≤3s", t: "Review time", d: "Per premium disclosure", c: "#c9a14a" },
              ].map(m => (
                <div key={m.t} style={{ padding: 20, background: "#111", border: `1px solid ${m.c}66`, borderTop: `4px solid ${m.c}`, borderRadius: 6, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: m.c }}>{m.n}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "6px 0" }}>{m.t}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{m.d}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 40, padding: 24, background: "#111", borderRadius: 6, borderLeft: "4px solid #d4af37" }}>
              <div style={{ fontSize: 14, color: "#d4af37", fontWeight: 700, marginBottom: 8 }}>Why 22/33, not 17/33?</div>
              <p style={{ fontSize: 14, color: "#ccc", lineHeight: 1.6, margin: 0 }}>
                17/33 is a simple majority — vulnerable to coordinated minority capture. 22/33 is the <strong>supermajority</strong>: 5 domains must dissent simultaneously to block a disclosure. This is the same threshold used in the US Senate for treaty ratification and the EU Council for qualified-majority decisions. The dragon guards the threshold.
              </p>
            </div>
          </div>
        </section>

        {/* MEOK_KEYSTONE Cross-Hive Attestation */}
        <section style={{ padding: "60px 20px", maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 13, color: "#4ecdc4", letterSpacing: 2, textTransform: "uppercase" }}>Cross-Hive Attestation</div>
            <h2 style={{ fontSize: 32, margin: "8px 0 16px" }}>MEOK_KEYSTONE_URL</h2>
            <p style={{ color: "#666", maxWidth: 700, margin: "0 auto" }}>
              The BFT council's decisions are anchored to a cross-hive keystone. Every sovereign VM pulls the latest keystone hash on startup. The hive remembers, even across jurisdictions.
            </p>
          </div>
          <div style={{ background: "#0a0a0a", color: "#fff", padding: 24, borderRadius: 6, fontFamily: "monospace", fontSize: 14, border: "1px solid #222" }}>
            <div style={{ color: "#888", marginBottom: 8 }}># /etc/openpatent/keystone.env</div>
            <div><span style={{ color: "#4ecdc4" }}>MEOK_KEYSTONE_URL</span>=<span style={{ color: "#d4af37" }}>"https://bft-council.ai/keystone/v3"</span></div>
            <div><span style={{ color: "#4ecdc4" }}>MEOK_KEYSTONE_HASH</span>=<span style={{ color: "#a78bfa" }}>"sha3-512:9f3a...c2"</span></div>
            <div><span style={{ color: "#4ecdc4" }}>MEOK_CROSS_HIVE</span>=<span style={{ color: "#ff5a87" }}>true</span></div>
            <div><span style={{ color: "#4ecdc4" }}>MEOK_REFRESH_INTERVAL</span>=<span style={{ color: "#3b82f6" }}>300s</span></div>
          </div>
          <div style={{ marginTop: 20, padding: 20, background: "#f0fdfa", border: "1px solid #4ecdc4", borderRadius: 6 }}>
            <div style={{ fontSize: 14, color: "#0a3d3d", fontWeight: 600, marginBottom: 8 }}>Sovereignty proof</div>
            <p style={{ fontSize: 14, color: "#0a3d3d", lineHeight: 1.6, margin: 0 }}>
              A disclosure approved by the BFT council is valid on every sovereign VM that holds the same MEOK_KEYSTONE_HASH. If a sovereign forks the hive, its disclosures remain valid as long as the keystone matches. If the keystone diverges, the fork is auditable and the original chain is preserved. The dragon knows which hive is which.
            </p>
          </div>
        </section>

        {/* Sovereignty Proof */}
        <section style={{ background: "#f8f8f8", padding: "60px 20px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#d4af37", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Sovereignty Proof</div>
            <h2 style={{ fontSize: 32, margin: "0 0 16px" }}>CSOAI Ltd UK 16939677</h2>
            <p style={{ color: "#666", maxWidth: 700, margin: "0 auto 24px" }}>
              Canonical owner of the bft-council.ai namespace and the sovereign-temple.ai substrate. MIT-licensed core, 5 patent offices, 4 trade marks, 3 grants. Sovereign VM at 35.242.143.249.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, maxWidth: 800, margin: "0 auto" }}>
              <div style={{ padding: 16, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase" }}>Company</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>CSOAI Ltd</div>
                <div style={{ fontSize: 12, color: "#666" }}>UK 16939677</div>
              </div>
              <div style={{ padding: 16, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase" }}>Sovereign VM</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>35.242.143.249</div>
                <div style={{ fontSize: 12, color: "#666" }}>Air-gappable</div>
              </div>
              <div style={{ padding: 16, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase" }}>License</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>MIT</div>
                <div style={{ fontSize: 12, color: "#666" }}>Audit yourself</div>
              </div>
              <div style={{ padding: 16, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase" }}>IP Portfolio</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>5 offices</div>
                <div style={{ fontSize: 12, color: "#666" }}>4 marks, 3 grants</div>
              </div>
            </div>
          </div>
        </section>

        {/* Signature */}
        <section style={{ padding: "30px 20px", textAlign: "center", background: "#0a0a0a", color: "#a78bfa" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            The hive remembers. The dragon knows. The sovereign companion never forgets.
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
