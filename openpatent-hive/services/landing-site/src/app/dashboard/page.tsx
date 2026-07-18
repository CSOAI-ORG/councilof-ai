/**
 * openpatent.ai — User Dashboard
 * Disclosure history + verification status + downloadable proof
 */
import { Header, Footer } from "../components/chrome";

export const metadata = {
  title: "Dashboard — openpatent.ai",
  description: "Your sovereign invention portfolio. Live status across all 9 services.",
};

// Mock data — in production this would call the api-gateway /v1/registry + /v1/stats
const MOCK_DISCLOSURES = [
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
    title: "Premium BFT Council Review",
    tier: "premium",
    fee: 2499,
    status: "VERIFIED",
    timestamp: "2026-06-14T04:25:00Z",
    bft_council: { consensus: "APPROVED", approvals: "22/33" },
  },
  {
    hash: "d5e714244f819eca",
    title: "Sovereign AI Substrate Patent",
    tier: "full",
    fee: 999,
    status: "PENDING",
    timestamp: "2026-06-13T22:15:00Z",
  },
];

const MOCK_SERVICES = [
  { name: "patentmcp", port: 3210, status: "healthy" },
  { name: "api-gateway", port: 3211, status: "healthy" },
  { name: "worker", port: 3212, status: "healthy" },
  { name: "bft-council", port: 3215, status: "healthy" },
  { name: "x402-router", port: 3217, status: "healthy" },
  { name: "primitives", port: 3218, status: "healthy" },
  { name: "verify-page", port: 3213, status: "healthy" },
  { name: "mcp-manifest", port: 3214, status: "healthy" },
  { name: "drafting-fork", port: 3216, status: "healthy" },
];

const STATUS_COLORS: Record<string, string> = {
  healthy: "#4ecdc4",
  degraded: "#fbbf24",
  down: "#ef4444",
};

const TIER_COLORS: Record<string, string> = {
  starter: "#3b82f6",
  defensive: "#10b981",
  full: "#8b5cf6",
  premium: "#f59e0b",
  enterprise: "#ec4899",
};

export default function DashboardPage() {
  const verifiedCount = MOCK_DISCLOSURES.filter(d => d.status === "VERIFIED").length;
  const pendingCount = MOCK_DISCLOSURES.filter(d => d.status === "PENDING").length;
  const totalFees = MOCK_DISCLOSURES.reduce((s, d) => s + d.fee, 0);

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", background: "#fafafa" }}>
        {/* Header bar */}
        <section style={{ background: "#0a0a0a", color: "#fff", padding: "40px 20px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ fontSize: 12, color: "#4ecdc4", textTransform: "uppercase", letterSpacing: 2 }}>Your hive</div>
            <h1 style={{ fontSize: 32, margin: "8px 0 0" }}>Dashboard</h1>
            <p style={{ color: "#888", marginTop: 6 }}>All disclosures, BFT reviews, and live service health in one place.</p>
          </div>
        </section>

        {/* Stat cards */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "30px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <div style={{ background: "#fff", padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase" }}>Disclosures</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#0a0a0a" }}>{MOCK_DISCLOSURES.length}</div>
            </div>
            <div style={{ background: "#fff", padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase" }}>Verified</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#10b981" }}>{verifiedCount}</div>
            </div>
            <div style={{ background: "#fff", padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase" }}>Pending</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#f59e0b" }}>{pendingCount}</div>
            </div>
            <div style={{ background: "#fff", padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase" }}>Total fees</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#0a0a0a" }}>${totalFees.toLocaleString()}</div>
            </div>
          </div>
        </section>

        {/* Disclosures table */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px 40px" }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Disclosure history</h2>
          <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#666" }}>Hash</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#666" }}>Title</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#666" }}>Tier</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#666" }}>Status</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#666" }}>Fee</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#666" }}>When</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_DISCLOSURES.map(d => (
                  <tr key={d.hash} style={{ borderTop: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12 }}>{d.hash}…</td>
                    <td style={{ padding: "12px 16px" }}>
                      <a href={d.attestation_url} style={{ color: "#0a0a0a", textDecoration: "none", fontWeight: 500 }}>
                        {d.title}
                      </a>
                      {d.bft_council && (
                        <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                          BFT: {d.bft_council.consensus} ({d.bft_council.approvals})
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        display: "inline-block",
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        padding: "2px 8px",
                        borderRadius: 3,
                        background: TIER_COLORS[d.tier],
                        color: "#fff",
                        letterSpacing: 0.5,
                      }}>
                        {d.tier}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        color: d.status === "VERIFIED" ? "#10b981" : "#f59e0b",
                      }}>
                        <span style={{ width: 6, height: 6, background: d.status === "VERIFIED" ? "#10b981" : "#f59e0b", borderRadius: "50%" }} />
                        {d.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>${d.fee}</td>
                    <td style={{ padding: "12px 16px", color: "#666", fontSize: 12 }}>{new Date(d.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Service health grid */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px 60px" }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Live service health</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {MOCK_SERVICES.map(s => (
              <div key={s.name} style={{
                background: "#fff",
                padding: 16,
                border: `1px solid ${STATUS_COLORS[s.status]}33`,
                borderLeft: `3px solid ${STATUS_COLORS[s.status]}`,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}>
                <div style={{ width: 10, height: 10, background: STATUS_COLORS[s.status], borderRadius: "50%" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0a0a0a" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>:{s.port}</div>
                </div>
                <div style={{ fontSize: 10, textTransform: "uppercase", color: STATUS_COLORS[s.status], fontWeight: 600 }}>{s.status}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px 60px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <a href="https://api.openpatent.ai/docs" style={{
              padding: 16,
              background: "#0a0a0a",
              color: "#fff",
              borderRadius: 6,
              textDecoration: "none",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", color: "#4ecdc4" }}>API</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>Swagger UI →</div>
            </a>
            <a href="https://verify.openpatent.ai" style={{
              padding: 16,
              background: "#fff",
              color: "#0a0a0a",
              border: "1px solid #e0e0e0",
              borderRadius: 6,
              textDecoration: "none",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", color: "#10b981" }}>Verify</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>verify.openpatent.ai →</div>
            </a>
            <a href="https://mcp.openpatent.ai" style={{
              padding: 16,
              background: "#fff",
              color: "#0a0a0a",
              border: "1px solid #e0e0e0",
              borderRadius: 6,
              textDecoration: "none",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", color: "#8b5cf6" }}>MCP</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>mcp.openpatent.ai →</div>
            </a>
            <a href="https://github.com/CSOAI-ORG/patentmcp" style={{
              padding: 16,
              background: "#fff",
              color: "#0a0a0a",
              border: "1px solid #e0e0e0",
              borderRadius: 6,
              textDecoration: "none",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", color: "#666" }}>GitHub</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>CSOAI-ORG →</div>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
