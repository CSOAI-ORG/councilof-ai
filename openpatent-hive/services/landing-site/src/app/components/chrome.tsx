/**
 * Shared chrome — header, footer
 */

export function Header() {
  return (
    <header style={{
      background: "#0a0a0a",
      color: "#fff",
      padding: "16px 20px",
      position: "sticky",
      top: 0,
      zIndex: 100,
      borderBottom: "1px solid #222",
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <a href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, background: "#4ecdc4", borderRadius: "50%", display: "inline-block" }} />
          openpatent.ai
        </a>
        <nav style={{ display: "flex", gap: 20, fontSize: 14, flexWrap: "wrap" }}>
          <a href="/" style={{ color: "#aaa", textDecoration: "none" }}>Home</a>
          <a href="/industries/legal" style={{ color: "#aaa", textDecoration: "none" }}>Industries</a>
          <a href="/domains" style={{ color: "#aaa", textDecoration: "none" }}>Domains</a>
          <a href="/dashboard" style={{ color: "#aaa", textDecoration: "none" }}>Dashboard</a>
          <a href="https://mcp.openpatent.ai" style={{ color: "#aaa", textDecoration: "none" }}>MCP</a>
          <a href="https://verify.openpatent.ai" style={{ color: "#aaa", textDecoration: "none" }}>Verify</a>
          <a href="https://github.com/CSOAI-ORG/patentmcp" style={{ color: "#aaa", textDecoration: "none" }}>GitHub</a>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer style={{
      background: "#0a0a0a",
      color: "#888",
      padding: "40px 20px 20px",
      borderTop: "1px solid #222",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 30, marginBottom: 30 }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, marginBottom: 12 }}>openpatent.ai</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              Sovereign invention protection for the AI age. 6-layer cryptographic proof, 33-agent BFT council, 10+ jurisdictions.
            </div>
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, marginBottom: 12 }}>Product</div>
            <div style={{ fontSize: 13, lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 4 }}>
              <a href="/industries/legal" style={{ color: "#888", textDecoration: "none" }}>Legal Tech</a>
              <a href="/industries/gaming" style={{ color: "#888", textDecoration: "none" }}>Gaming</a>
              <a href="/industries/ip-castle" style={{ color: "#888", textDecoration: "none" }}>IP Castle</a>
              <a href="/industries/sovereign-substrate" style={{ color: "#888", textDecoration: "none" }}>Sovereign Substrate</a>
            </div>
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, marginBottom: 12 }}>Developers</div>
            <div style={{ fontSize: 13, lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 4 }}>
              <a href="https://api.openpatent.ai/docs" style={{ color: "#888", textDecoration: "none" }}>API / Swagger</a>
              <a href="https://mcp.openpatent.ai" style={{ color: "#888", textDecoration: "none" }}>MCP Server</a>
              <a href="https://github.com/CSOAI-ORG/patentmcp" style={{ color: "#888", textDecoration: "none" }}>GitHub</a>
              <a href="/domains" style={{ color: "#888", textDecoration: "none" }}>.ai Domain Fleet</a>
            </div>
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, marginBottom: 12 }}>Company</div>
            <div style={{ fontSize: 13, lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 4 }}>
              <span>CSOAI Ltd UK 16939677</span>
              <a href="https://csoai.org" style={{ color: "#888", textDecoration: "none" }}>csoai.org</a>
              <span>35.242.143.249 (sovereign)</span>
              <a href="mailto:founder@csoai.org" style={{ color: "#888", textDecoration: "none" }}>founder@csoai.org</a>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #222", paddingTop: 20, fontSize: 12, textAlign: "center" }}>
          The hive remembers. The dragon knows. The sovereign companion never forgets.
        </div>
      </div>
    </footer>
  );
}
