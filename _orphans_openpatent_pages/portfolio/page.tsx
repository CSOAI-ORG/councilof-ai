/**
 * openpatent.ai — Portfolio Tracker
 * User-facing disclosure history with downloadable proof.
 */
"use client";
import { Header, Footer } from "../components/chrome";

const MOCK_PORTFOLIO = [
  {
    hash: "ee1851139e6029ec",
    title: "Cryptographically-Verifiable Multi-Agent Coordination",
    tier: "defensive",
    fee: 149,
    status: "VERIFIED",
    timestamp: "2026-06-14T04:30:00Z",
    attestation_url: "https://verify.openpatent.ai/ee1851139e6029ec",
  },
  {
    hash: "301bb421c971fbb7",
    title: "Premium BFT Council Review of a Novel Encryption Scheme",
    tier: "premium",
    fee: 2499,
    status: "VERIFIED",
    timestamp: "2026-06-14T04:25:00Z",
    bft_council: { consensus: "APPROVED", approvals: "22/33" },
  },
  {
    hash: "d5e714244f819eca",
    title: "Sovereign AI Substrate Patent (Mamba-2 SSD + SOV3)",
    tier: "full",
    fee: 999,
    status: "VERIFIED",
    timestamp: "2026-06-13T22:15:00Z",
  },
  {
    hash: "a9c8b73e6f2d1c4b",
    title: "Novel Game Mechanic: Procedural Quest Generation",
    tier: "starter",
    fee: 29,
    status: "VERIFIED",
    timestamp: "2026-06-13T14:02:00Z",
  },
  {
    hash: "72b4e9f3a1c5d8e6",
    title: "Federated Learning Edge Computing Patent",
    tier: "premium",
    fee: 2499,
    status: "PENDING",
    timestamp: "2026-06-14T08:00:00Z",
    bft_council: { consensus: "REVIEWING", approvals: "13/33" },
  },
];

const STATUS_COLORS: Record<string, string> = {
  VERIFIED: "#10b981",
  PENDING: "#f59e0b",
  REJECTED: "#ef4444",
};

const TIER_COLORS: Record<string, string> = {
  starter: "#3b82f6",
  defensive: "#10b981",
  full: "#8b5cf6",
  premium: "#f59e0b",
  enterprise: "#ec4899",
};

export default function PortfolioPage() {
  const verified = MOCK_PORTFOLIO.filter(d => d.status === "VERIFIED").length;
  const pending = MOCK_PORTFOLIO.filter(d => d.status === "PENDING").length;
  const totalFees = MOCK_PORTFOLIO.reduce((s, d) => s + d.fee, 0);

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", background: "#fafafa" }}>
        <section style={{ background: "#0a0a0a", color: "#fff", padding: "40px 20px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ fontSize: 12, color: "#4ecdc4", textTransform: "uppercase", letterSpacing: 2 }}>Your portfolio</div>
            <h1 style={{ fontSize: 32, margin: "8px 0 0" }}>Disclosure history</h1>
            <p style={{ color: "#888", marginTop: 6 }}>{MOCK_PORTFOLIO.length} disclosures · ${totalFees.toLocaleString()} total fees</p>
          </div>
        </section>

        {/* Stat cards */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "30px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
            <div style={{ background: "#fff", padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase" }}>Total</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{MOCK_PORTFOLIO.length}</div>
            </div>
            <div style={{ background: "#fff", padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase" }}>Verified</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>{verified}</div>
            </div>
            <div style={{ background: "#fff", padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase" }}>Pending</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#f59e0b" }}>{pending}</div>
            </div>
            <div style={{ background: "#fff", padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase" }}>Fees paid</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>${totalFees.toLocaleString()}</div>
            </div>
          </div>
        </section>

        {/* Disclosure table */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px 60px" }}>
          <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", fontWeight: 600, color: "#666" }}>Hash</th>
                  <th style={{ padding: "12px 14px", fontWeight: 600, color: "#666" }}>Title</th>
                  <th style={{ padding: "12px 14px", fontWeight: 600, color: "#666" }}>Tier</th>
                  <th style={{ padding: "12px 14px", fontWeight: 600, color: "#666" }}>Status</th>
                  <th style={{ padding: "12px 14px", fontWeight: 600, color: "#666" }}>Fee</th>
                  <th style={{ padding: "12px 14px", fontWeight: 600, color: "#666" }}>When</th>
                  <th style={{ padding: "12px 14px", fontWeight: 600, color: "#666", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PORTFOLIO.map(d => (
                  <tr key={d.hash} style={{ borderTop: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12 }}>{d.hash}…</td>
                    <td style={{ padding: "12px 14px" }}>
                      <a href={d.attestation_url} style={{ color: "#0a0a0a", textDecoration: "none", fontWeight: 500 }}>
                        {d.title}
                      </a>
                      {d.bft_council && (
                        <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                          BFT: {d.bft_council.consensus} ({d.bft_council.approvals})
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        display: "inline-block",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        padding: "2px 8px",
                        borderRadius: 3,
                        background: TIER_COLORS[d.tier],
                        color: "#fff",
                      }}>
                        {d.tier}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: STATUS_COLORS[d.status] }}>
                        <span style={{ width: 6, height: 6, background: STATUS_COLORS[d.status], borderRadius: "50%" }} />
                        {d.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 600 }}>${d.fee.toLocaleString()}</td>
                    <td style={{ padding: "12px 14px", color: "#666", fontSize: 12 }}>{new Date(d.timestamp).toLocaleString()}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <a href={`${d.attestation_url}.json`} style={{ fontSize: 11, padding: "4px 8px", background: "#0a0a0a", color: "#fff", textDecoration: "none", borderRadius: 3 }}>
                          .ots
                        </a>
                        <a href={`${d.attestation_url}.pdf`} style={{ fontSize: 11, padding: "4px 8px", background: "#4ecdc4", color: "#0a0a0a", textDecoration: "none", borderRadius: 3 }}>
                          Cert
                        </a>
                        <button onClick={(e) => { e.preventDefault(); const t = document.createElement('textarea'); t.value = d.hash; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }} style={{ fontSize: 11, padding: "4px 8px", background: "#fff", color: "#0a0a0a", border: "1px solid #e0e0e0", borderRadius: 3, cursor: "pointer" }}>
                          Copy
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
