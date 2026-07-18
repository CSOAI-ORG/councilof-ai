/**
 * openpatent.ai — Docs: Architecture
 * The 7-layer DEFONEOS Global Dome.
 */
import Link from "next/link";
import { Header, Footer } from "../../components/chrome";

export const metadata = {
  title: "Architecture — openpatent.ai docs",
  description: "The 7-layer DEFONEOS Global Dome. Sovereign substrate, 33-agent BFT council, MEOK keystone.",
};

const LAYERS = [
  { n: 7, t: "Sovereign Companion Layer", d: "Each inventor, attorney, and AI agent in the hive is a sovereign companion. DID-rooted identity, 6 care dimensions, maternal covenant binding. The dome's outer ring — every interaction is between named, accountable parties." },
  { n: 6, t: "BFT Council Layer (33 agents)", d: "11 domains × 3 nodes = 33 agents. 22/33 supermajority required. Care veto at 0.15 threshold on any of the 6 care dimensions. The dragon weighs the claim." },
  { n: 5, t: "MEOK_KEYSTONE Cross-Hive Attestation", d: "Sovereign hives verify each other's disclosures via MEOK_KEYSTONE_URL without leaking data outside the jurisdiction. Cross-domain bridge: 55 bridge pairs." },
  { n: 4, t: "6-Layer Cryptographic Proof", d: "SHA-3/512 document hash → HMAC-SHA256 CSOAI witness → Ed25519 inventor signature → Bitcoin OpenTimestamps anchor → C2PA Content Credential → hash-chained audit log. Court-admissible in 10+ jurisdictions." },
  { n: 3, t: "Hive Substrate (12 services)", d: "patentmcp · api-gateway · worker · bft-council · drafting-fork · sovereign-vault · sovereign-VM · sovereign-db · sovereign-fork · plus 3 more. MIT core, PAYG API. The dome's living tissue." },
  { n: 2, t: "Sovereign Infrastructure", d: "Self-hosted on your hardware. Air-gapped deployments for defense. CSOAI Ltd UK 16939677 is the canonical owner. Sovereign VM at 35.242.143.249." },
  { n: 1, t: "Inventive Substrate", d: "The bedrock: novel human invention, AI-assisted or human-only, the inventive step itself. The dome rests on the sovereign act of creation." },
];

export default function Architecture() {
  return (
    <>
      <Header />
      <main>
        <section style={{ background: "#0a0a1a", color: "#fff", padding: "80px 20px 60px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <Link href="/docs" style={{ color: "#4ecdc4", fontSize: 13, textDecoration: "none" }}>← back to docs</Link>
            <div style={{ fontSize: 13, color: "#d4af37", marginTop: 20, letterSpacing: 1, textTransform: "uppercase" }}>
              The DEFONEOS Global Dome · 7 layers
            </div>
            <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: "16px 0", maxWidth: 800 }}>
              The architecture of the sovereign hive.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "#c0c0c0", maxWidth: 700 }}>
              Seven concentric layers, from the inventive substrate to the sovereign companion.
              The dragon coils at the centre. The hive remembers every disclosure.
            </p>
          </div>
        </section>

        <section style={{ padding: "40px 20px", maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, marginBottom: 24, textAlign: "center" }}>The Dome — visual</h2>
          <pre style={{
            background: "#0a0a1a", color: "#4ecdc4",
            padding: 24, borderRadius: 8, fontSize: 12, lineHeight: 1.5,
            overflowX: "auto",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}>
{`flowchart TB
    L7["🜂 L7 · Sovereign Companion<br/>(DID, 6 care dimensions, maternal covenant)"]
    L6["🐉 L6 · 33-Agent BFT Council<br/>(11 domains × 3 nodes, 22/33 supermajority)"]
    L5["🔗 L5 · MEOK_KEYSTONE Cross-Hive<br/>(55 bridge pairs, sovereign attestation)"]
    L4["⛓ L4 · 6-Layer Cryptographic Proof<br/>(SHA-3/512 → HMAC → Ed25519 → OTS → C2PA → hash-chain)"]
    L3["🐝 L3 · Hive Substrate<br/>(12 services: patentmcp, gateway, bft, drafting, vault...)"]
    L2["🛡 L2 · Sovereign Infrastructure<br/>(self-hosted, air-gapped, CSOAI Ltd UK 16939677)"]
    L1["✦ L1 · Inventive Substrate<br/>(the novel human invention itself)"]

    L7 --> L6 --> L5 --> L4 --> L3 --> L2 --> L1
    L1 -.inventive step.-> L2
    L2 -.substrate.-> L3
    L3 -.proof chain.-> L4
    L4 -.attestation.-> L5
    L5 -.council review.-> L6
    L6 -.care veto / approval.-> L7

    style L7 fill:#1c2e4a,stroke:#7dd3fc,color:#fff
    style L6 fill:#2a0a3d,stroke:#a78bfa,color:#fff
    style L5 fill:#0d1f2d,stroke:#4ecdc4,color:#fff
    style L4 fill:#1a1a2e,stroke:#d4af37,color:#fff
    style L3 fill:#0a2e3d,stroke:#4ecdc4,color:#fff
    style L2 fill:#0a0a1a,stroke:#d4af37,color:#fff
    style L1 fill:#000,stroke:#fff,color:#fff`}
          </pre>
          <p style={{ fontSize: 12, color: "#666", textAlign: "center", marginTop: 12 }}>
            Render this in your IDE, paste into <a href="https://mermaid.live" style={{ color: "#4ecdc4" }}>mermaid.live</a>, or use it in your GitHub README.
          </p>
        </section>

        <section style={{ background: "#f8f8f8", padding: "60px 20px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: 32, textAlign: "center", marginBottom: 40 }}>The seven layers, narrated</h2>
            {LAYERS.map((l) => (
              <div key={l.n} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 20, marginBottom: 30, background: "#fff", padding: 24, borderRadius: 8, border: "1px solid #e0e0e0" }}>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: "#0a0a1a", color: "#d4af37",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 700,
                }}>
                  L{l.n}
                </div>
                <div>
                  <h3 style={{ fontSize: 20, margin: "4px 0 8px", color: "#0a0a1a" }}>{l.t}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: "#444" }}>{l.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ padding: "60px 20px", maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>Why seven layers?</h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "#444", marginBottom: 16 }}>
            The DEFONEOS Global Dome is a sovereignty stack, not a single SaaS product. Each layer is independently
            auditable, replaceable, and sovereign. You can run the whole stack on your own hardware (L2) and your
            hive will still attest to other sovereign hives (L5) without leaking data.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "#444", marginBottom: 24 }}>
            The 33-agent BFT council (L6) is what makes this more than a database with a Bitcoin anchor. Every
            premium disclosure is reviewed by 11 domain specialists × 3 nodes, with a binding care veto on the
            6 care dimensions. The dragon doesn't just watch — the dragon votes.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/docs/getting-started" style={{ background: "#0a0a1a", color: "#4ecdc4", padding: "12px 24px", borderRadius: 6, textDecoration: "none" }}>
              ← Getting started
            </Link>
            <Link href="/docs/api-reference" style={{ border: "1px solid #0a0a1a", color: "#0a0a1a", padding: "12px 24px", borderRadius: 6, textDecoration: "none" }}>
              API reference →
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
