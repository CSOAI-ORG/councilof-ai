/**
 * openpatent.ai — Docs: API Reference
 * The full surface of api.openpatent.ai — links to the live Swagger.
 */
import Link from "next/link";
import { Header, Footer } from "../../components/chrome";

export const metadata = {
  title: "API Reference — openpatent.ai docs",
  description: "The 6-layer cryptographic invention disclosure API. Live Swagger at /api/docs.",
};

const ENDPOINTS = [
  { method: "POST", path: "/v1/disclosure", tag: "disclosure", desc: "Submit an invention, get a 6-layer proof, Bitcoin OTS anchor, and attestation URL." },
  { method: "POST", path: "/v1/disclose/batch", tag: "batch", desc: "Submit up to 100 disclosures in a single request. Sequential processing, ordered results." },
  { method: "POST", path: "/v1/verify", tag: "verify", desc: "Verify a 6-layer cryptographic proof. Pass disclosure_json, document_base64, or document_hash." },
  { method: "POST", path: "/v1/search", tag: "search", desc: "Search the prior art registry. Full-text + IPC/CPC faceted search." },
  { method: "GET", path: "/v1/disclosure/{hash}", tag: "disclosure", desc: "Fetch a disclosure by 16-char hash prefix." },
  { method: "GET", path: "/v1/stats", tag: "meta", desc: "System statistics: total disclosures, jurisdictions, 24h activity." },
  { method: "GET", path: "/v1/bft/proposals", tag: "bft-queue", desc: "List pending BFT council review proposals, paginated. The dragon weighs each one." },
  { method: "GET", path: "/v1/bft/queue", tag: "bft-queue", desc: "Per-agent review queue with statuses (33 agents × pending/in_review/approved/rejected)." },
  { method: "POST", path: "/v1/draft-claims", tag: "draft", desc: "AI-assisted patent claim drafting (premium+)." },
  { method: "POST", path: "/v1/draft-prosecution", tag: "draft", desc: "Office action response drafting (premium+)." },
  { method: "POST", path: "/v1/consult", tag: "consult", desc: "Patentability + FTO consultation (premium+)." },
  { method: "POST", path: "/v1/strategy", tag: "draft", desc: "Filing strategy + licensing targets (premium+)." },
  { method: "POST", path: "/v1/litigate", tag: "draft", desc: "Claim construction + invalidity analysis (premium+)." },
  { method: "POST", path: "/v1/manage", tag: "draft", desc: "Docket tracking + deadline summaries (premium+)." },
  { method: "GET", path: "/v1/leaderboard", tag: "community", desc: "Top 10 DIDs by disclosure count + BFT approvals. The hive ranks its sovereign companions." },
  { method: "GET", path: "/v1/community", tag: "community", desc: "Hive-wide stats: total disclosures, unique inventors, jurisdictions, last 24h activity." },
  { method: "GET", path: "/pricing", tag: "meta", desc: "PAYG tier table (5 tiers: starter / defensive / full / premium / enterprise)." },
  { method: "GET", path: "/legal", tag: "legal", desc: "Jurisdictions + 12+ legal precedent badges (US, EU, UK, China, France, Japan, Italy, WIPO, ...)." },
  { method: "GET", path: "/health", tag: "meta", desc: "Gateway + dependency health (patentmcp, worker, bft)." },
  { method: "GET", path: "/.well-known/mcp.json", tag: "meta", desc: "MCP server manifest — discoverable by Claude Code, Cursor, Windsurf." },
  { method: "GET", path: "/openapi.json", tag: "meta", desc: "OpenAPI 3.1 schema (machine-readable)." },
  { method: "GET", path: "/docs", tag: "meta", desc: "Swagger UI for the gateway. Try every endpoint in the browser." },
];

const TAG_COLORS: Record<string, string> = {
  disclosure: "#4ecdc4",
  batch: "#7dd3fc",
  verify: "#4ecdc4",
  search: "#4ecdc4",
  draft: "#a78bfa",
  consult: "#a78bfa",
  "bft-queue": "#d4af37",
  meta: "#888",
  legal: "#c9a14a",
  community: "#f472b6",
};

export default function ApiReference() {
  return (
    <>
      <Header />
      <main>
        <section style={{ background: "#0a0a1a", color: "#fff", padding: "80px 20px 60px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <Link href="/docs" style={{ color: "#4ecdc4", fontSize: 13, textDecoration: "none" }}>← back to docs</Link>
            <div style={{ fontSize: 13, color: "#4ecdc4", marginTop: 20, letterSpacing: 1, textTransform: "uppercase" }}>
              OpenPatent.ai API · v1.0.0
            </div>
            <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: "16px 0", maxWidth: 800 }}>
              The full surface of the hive.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "#c0c0c0", maxWidth: 700 }}>
              22 endpoints across 11 OpenAPI tags. Every response carries the DEFONEOS signature.
              Try them live in Swagger.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
              <a href="https://api.openpatent.ai/docs" className="cta-primary" style={{ background: "#4ecdc4", color: "#000", padding: "12px 24px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>
                Open Swagger UI →
              </a>
              <a href="https://api.openpatent.ai/openapi.json" style={{ border: "1px solid #fff", color: "#fff", padding: "12px 24px", borderRadius: 6, textDecoration: "none" }}>
                Download OpenAPI 3.1
              </a>
            </div>
          </div>
        </section>

        <section style={{ padding: "60px 20px", maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, marginBottom: 8 }}>Endpoints</h2>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
            The base URL is <code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: 4 }}>https://api.openpatent.ai</code>.
            All endpoints return JSON. Every response includes a <code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: 4 }}>_sig</code> field.
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            {ENDPOINTS.map((e) => (
              <div key={`${e.method}-${e.path}`} style={{
                display: "grid", gridTemplateColumns: "70px 1fr 100px", gap: 16,
                padding: 16, border: "1px solid #e0e0e0", borderRadius: 6, alignItems: "center",
                background: "#fff",
              }}>
                <span style={{
                  background: e.method === "GET" ? "#0a0a1a" : "#4ecdc4",
                  color: e.method === "GET" ? "#4ecdc4" : "#0a0a1a",
                  padding: "4px 8px", borderRadius: 4,
                  fontSize: 12, fontWeight: 700, textAlign: "center",
                  fontFamily: "ui-monospace, monospace",
                }}>
                  {e.method}
                </span>
                <div>
                  <code style={{ fontSize: 14, fontWeight: 600, color: "#0a0a1a" }}>{e.path}</code>
                  <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{e.desc}</div>
                </div>
                <span style={{
                  background: TAG_COLORS[e.tag] || "#888",
                  color: "#000",
                  padding: "4px 8px", borderRadius: 4,
                  fontSize: 11, fontWeight: 600, textAlign: "center",
                }}>
                  {e.tag}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: "#f8f8f8", padding: "60px 20px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: 28, marginBottom: 16 }}>Try it live</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "#444", marginBottom: 16 }}>
              The Swagger UI at <a href="https://api.openpatent.ai/docs" style={{ color: "#4ecdc4" }}>https://api.openpatent.ai/docs</a> lets
              you exercise every endpoint from the browser. The ReDoc view at
              <a href="https://api.openpatent.ai/redoc" style={{ color: "#4ecdc4", marginLeft: 6 }}>https://api.openpatent.ai/redoc</a> provides
              a more readable reference.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "#444", marginBottom: 24 }}>
              For MCP-aware agents (Claude Code, Cursor, Windsurf), the manifest at
              <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4, margin: "0 6px" }}>https://api.openpatent.ai/.well-known/mcp.json</code>
              registers three tools: <code>disclose_invention</code>, <code>verify_disclosure</code>, and <code>search_prior_art</code>.
            </p>
            <Link href="/docs/pricing" style={{ background: "#0a0a1a", color: "#4ecdc4", padding: "12px 24px", borderRadius: 6, textDecoration: "none" }}>
              See pricing →
            </Link>
          </div>
        </section>

        <section style={{ padding: "30px 20px", textAlign: "center", background: "#0a0a1a", color: "#fff" }}>
          <div style={{ fontSize: 14, fontStyle: "italic", color: "#d4af37", fontWeight: 600 }}>
            The hive remembers. The dragon knows. The sovereign companion never forgets.
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
