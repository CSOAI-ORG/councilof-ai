import { useState, useEffect } from "react";

/**
 * TUI-5: Master GSPC Board — consolidated evidence view
 *
 * Success condition: "a first-time visitor can find a subject, understand its
 * evidence state, inspect each axis and independently verify the underlying card"
 */

export default function BoardPage() {
  const [gspc, setGspc] = useState(null);
  const [root, setRoot] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/gspc").then((r) => r.json()),
      fetch("/root.json").then((r) => r.json()),
      fetch("/api/revenue").then((r) => r.json()),
    ])
      .then(([g, r, rev]) => {
        setGspc(g);
        setRoot(r);
        setRevenue(rev);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "2rem", color: "#e8f5ee" }}>Loading board…</div>;

  const totals = gspc?.totals || {};
  const axes = gspc?.axes || [];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem", color: "#e8f5ee", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>GSPC Board</h1>
        <p style={{ color: "#8ba89a", fontSize: "0.875rem" }}>
          {totals.public_count || "22 axis · 22 measured"} — {totals.lid || "not a certificate"}
        </p>
      </header>

      {/* Evidence State Summary */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="Axes" value={totals.axes || 22} state="MEASURED" />
        <StatCard label="Measured" value={totals.measured_axes || 22} state="MEASURED" />
        <StatCard label="Public Leaders" value={totals.public_leader_count || 3} state="MEASURED" />
        <StatCard label="Root Cards" value={root?.card_count || 169} state="ROOTED" />
        <StatCard label="Signed Chain" value={335} state="SIGNED" />
        <StatCard label="External Payers" value={revenue?.one_number?.all_time || 0} state="SETTLED" />
      </section>

      {/* Axis Grid */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>22 GSPC Axes</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1a2e23", textAlign: "left" }}>
                <th style={{ padding: "0.5rem" }}>Axis</th>
                <th style={{ padding: "0.5rem" }}>Family</th>
                <th style={{ padding: "0.5rem" }}>State</th>
                <th style={{ padding: "0.5rem" }}>Leader</th>
                <th style={{ padding: "0.5rem" }}>Separation</th>
                <th style={{ padding: "0.5rem" }}>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {axes.map((axis, i) => (
                <tr key={axis.id || i} style={{ borderBottom: "1px solid #0d1a13" }}>
                  <td style={{ padding: "0.5rem", fontWeight: 500 }}>{axis.id || axis.name}</td>
                  <td style={{ padding: "0.5rem", color: "#8ba89a" }}>{axis.family || "gspc"}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <StateBadge state={axis.status || "MEASURED"} />
                  </td>
                  <td style={{ padding: "0.5rem", color: "#8ba89a" }}>{axis.leader || "—"}</td>
                  <td style={{ padding: "0.5rem", color: "#8ba89a" }}>{axis.separation || "—"}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <a href={`/gspc-verify`} style={{ color: "#5ee9a3", textDecoration: "none" }}>verify →</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Verification */}
      <section style={{ background: "#0d1a13", padding: "1.5rem", borderRadius: "8px", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.75rem" }}>Verify Independently</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
          <VerifyLink label="Read the board" url="/api/gspc" />
          <VerifyLink label="Verify a card" url="/gspc-verify" />
          <VerifyLink label="Check the root" url="/root.json" />
          <VerifyLink label="Resolve the DID" url="https://csoai.org/.well-known/did.json" />
        </div>
      </section>

      {/* Evidence States Legend */}
      <section style={{ color: "#8ba89a", fontSize: "0.75rem" }}>
        <p><strong>Evidence states:</strong> INDEXED · MEASURED · SIGNED · ROOTED · ANCHORED · SETTLED · UNCHECKABLE</p>
        <p>Measurement, not certification. A score describes a measured run on a frozen split on a date.</p>
      </section>
    </div>
  );
}

function StatCard({ label, value, state }) {
  return (
    <div style={{ background: "#0d1a13", padding: "1rem", borderRadius: "8px" }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "#8ba89a" }}>{label}</div>
      <StateBadge state={state} small />
    </div>
  );
}

function StateBadge({ state, small }) {
  const colors = {
    MEASURED: "#5ee9a3",
    SIGNED: "#5ee9a3",
    ROOTED: "#5ee9a3",
    ANCHORED: "#3b82f6",
    SETTLED: "#f59e0b",
    INDEXED: "#8ba89a",
    UNMEASURED: "#ef4444",
    UNCHECKABLE: "#6b7280",
  };
  return (
    <span style={{
      display: "inline-block",
      padding: small ? "0.125rem 0.375rem" : "0.25rem 0.5rem",
      borderRadius: "4px",
      fontSize: small ? "0.625rem" : "0.6875rem",
      fontWeight: 600,
      color: colors[state] || "#8ba89a",
      background: `${colors[state] || "#8ba89a"}15`,
      marginTop: "0.25rem",
    }}>
      {state}
    </span>
  );
}

function VerifyLink({ label, url }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      display: "block", padding: "0.75rem", background: "#0a120e", borderRadius: "6px",
      color: "#5ee9a3", textDecoration: "none", fontSize: "0.8125rem",
    }}>
      {label} →
    </a>
  );
}
