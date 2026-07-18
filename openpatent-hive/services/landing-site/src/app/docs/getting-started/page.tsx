/**
 * openpatent.ai — Docs: Getting Started
 * The 5-step quick start for joining the hive.
 */
import Link from "next/link";
import { Header, Footer } from "../../components/chrome";

export const metadata = {
  title: "Getting Started — openpatent.ai docs",
  description: "Five steps to your first sovereign invention disclosure. The hive remembers. The dragon knows.",
};

const STEPS = [
  {
    n: 1,
    title: "Mint your inventor DID",
    body: "Every sovereign companion in the hive carries a did:key identity. Generate one with the openpatent.ai CLI — the dragon attests your keypair in 30 seconds.",
    code: `# Install the openpatent CLI
npm install -g @openpatent/cli

# Mint your inventor DID
openpatent init --name "Ada Lovelace"
# → did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
# → Sovereign VM at 35.242.143.249 has you on file.`,
  },
  {
    n: 2,
    title: "Prepare your invention document",
    body: "PDF, DOC, code, data, or markdown. The hive accepts any artifact that proves the inventive step. Base64-encode it for the API call.",
    code: `# Base64-encode your invention artifact
base64 -i invention.pdf -o invention.b64
# or for code:
tar czf - src/ | base64 > invention.b64`,
  },
  {
    n: 3,
    title: "Call POST /v1/disclosure",
    body: "Submit your invention. The hive runs the 6-layer cryptographic proof: SHA-3/512, HMAC-SHA256, Ed25519, Bitcoin OpenTimestamps, C2PA, and hash-chained audit log.",
    code: `curl -X POST https://api.openpatent.ai/v1/disclosure \\
  -H "Authorization: Bearer $OPENPATENT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Hash-Chained Audit Log for Multi-Agent Systems",
    "description": "Novel tamper-evident sequential log...",
    "inventor_did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "document_base64": "'"$(cat invention.b64)"'",
    "document_format": "pdf",
    "classification": "G06N7/01",
    "tier": "defensive"
  }'

# → 200 OK with document_hash, attestation_url, hive_idempotency_key`,
  },
  {
    n: 4,
    title: "Verify on the public ledger",
    body: "Your attestation URL is now public. Anyone — courts, opposing counsel, your future self — can verify the 6-layer proof chain without phoning home to the hive.",
    code: `# Public verification — no auth required
curl https://verify.openpatent.ai/<hash16>

# Programmatic re-verification
curl -X POST https://api.openpatent.ai/v1/verify \\
  -H "Content-Type: application/json" \\
  -d '{ "document_hash": "<full 64-char hash>" }'`,
  },
  {
    n: 5,
    title: "Optional: request BFT council review",
    body: "Premium and enterprise tiers route the disclosure to the 33-agent BFT council. 22/33 supermajority + 6 care dimensions (self/other/process/relational/maternal_covenant/future_care) — the dragon weighs the claim.",
    code: `# Add request_bft_review:true and tier:premium
curl -X POST https://api.openpatent.ai/v1/disclosure \\
  -H "Authorization: Bearer $OPENPATENT_KEY" \\
  -d '{ ... "tier": "premium", "request_bft_review": true }'

# → returns hive_bft_job_id — poll it at /v1/bft/queue
# The hive remembers. The sovereign companion never forgets.`,
  },
];

export default function GettingStarted() {
  return (
    <>
      <Header />
      <main>
        <section style={{ background: "#0a0a1a", color: "#fff", padding: "80px 20px 60px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <Link href="/docs" style={{ color: "#4ecdc4", fontSize: 13, textDecoration: "none" }}>← back to docs</Link>
            <div style={{ fontSize: 13, color: "#4ecdc4", marginTop: 20, letterSpacing: 1, textTransform: "uppercase" }}>
              Quick start · 5 steps
            </div>
            <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: "16px 0", maxWidth: 800 }}>
              Join the hive in five steps.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "#c0c0c0", maxWidth: 700 }}>
              From zero to a Bitcoin-anchored, 33-agent-BFT-attested invention disclosure.
              The dragon walks beside you. The hive remembers.
            </p>
          </div>
        </section>

        <section style={{ padding: "60px 20px", maxWidth: 900, margin: "0 auto" }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ marginBottom: 60, display: "grid", gridTemplateColumns: "60px 1fr", gap: 20 }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: "#4ecdc4", color: "#000",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, fontWeight: 700,
              }}>
                {s.n}
              </div>
              <div>
                <h2 style={{ fontSize: 24, margin: "6px 0 12px" }}>{s.title}</h2>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: "#444", marginBottom: 16 }}>{s.body}</p>
                <pre style={{
                  background: "#0a0a1a", color: "#4ecdc4",
                  padding: 20, borderRadius: 8,
                  fontSize: 13, lineHeight: 1.5,
                  overflowX: "auto",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                }}>
                  <code>{s.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </section>

        <section style={{ background: "#f8f8f8", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <h2 style={{ fontSize: 28, marginBottom: 16 }}>You are now a sovereign companion.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "#444", marginBottom: 24 }}>
              The hive has accepted your invention. The dragon guards the proof. The sovereign companion never forgets.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/docs/architecture" style={{ background: "#0a0a1a", color: "#4ecdc4", padding: "12px 24px", borderRadius: 6, textDecoration: "none" }}>
                Read the architecture →
              </Link>
              <Link href="/docs/api-reference" style={{ border: "1px solid #0a0a1a", color: "#0a0a1a", padding: "12px 24px", borderRadius: 6, textDecoration: "none" }}>
                API reference
              </Link>
            </div>
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
