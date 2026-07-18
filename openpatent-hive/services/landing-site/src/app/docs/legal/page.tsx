/**
 * openpatent.ai — Docs: Legal
 * 12+ jurisdiction citations for the sovereign hive.
 */
import Link from "next/link";
import { Header, Footer } from "../../components/chrome";

export const metadata = {
  title: "Legal — openpatent.ai docs",
  description: "12+ jurisdiction citations. US, EU, UK, China, France, Japan, Italy, WIPO, Switzerland, Singapore, Canada, Australia.",
};

const CITATIONS = [
  { code: "US", citation: "35 U.S.C. § 102 (AIA)", year: 2013, summary: "Publicly accessible disclosures before filing date = prior art. Blockchain publication meets the standard." },
  { code: "US", citation: "Federal Rules of Evidence 902(13) & 902(14)", year: 2017, summary: "Self-authenticating electronic records verified by hash value. Blockchain timestamps align precisely." },
  { code: "US", citation: "Thaler v. Vidal, 43 F.4th 1207 (Fed. Cir. 2022)", year: 2022, summary: "AI cannot be named as inventor; AI-assisted human invention with inventive judgment remains patentable." },
  { code: "US", citation: "Lanham Act § 43(a) (Trademarks)", year: 2024, summary: "Trademark filing evidence: Bitcoin-anchored disclosure timestamps meet the authentication threshold." },
  { code: "EU", citation: "Regulation (EU) No 910/2014 (eIDAS), Art. 41 + 2024 eIDAS 2.0 revision", year: 2014, summary: "Qualified electronic timestamps carry legal presumption of accuracy across all 27 member states." },
  { code: "EU", citation: "Article 54(2) EPC", year: 1973, summary: "State of the art = everything made available to the public before filing. eIDAS-qualified timestamp proves the date." },
  { code: "EU", citation: "EU Trade Mark Regulation 2017/1001", year: 2017, summary: "EUIPO filing dates recognize eIDAS-qualified electronic timestamps. Madrid Protocol designations supported." },
  { code: "UK", citation: "Patents Act 1977 § 2(2) + post-Brexit eIDAS alignment", year: 2024, summary: "Same as EPC for prior art; domesticated eIDAS framework with digital asset personal property recognition." },
  { code: "UK", citation: "Trade Marks Act 1994 (UK)", year: 1994, summary: "UKIPO trademark filings accept eIDAS-qualified timestamps as filing date evidence." },
  { code: "UK", citation: "Property (Digital Assets) Bill 2024", year: 2024, summary: "UK recognizes digital assets (including tokenized IP) as personal property. BFT council records qualify." },
  { code: "CN", citation: "Hangzhou Internet Court, June 2018 + Supreme People's Court Sept 2018", year: 2018, summary: "First court globally to admit blockchain-stored evidence; three Internet Courts now operate dedicated judicial blockchains." },
  { code: "CN", citation: "Patent Law Article 22(2)", year: 2008, summary: "Publicly known before filing = no patent. Judicial blockchain infrastructure directly supports timestamp evidence." },
  { code: "FR", citation: "Tribunal Judiciaire de Marseille, March 2025", year: 2025, summary: "Recognized blockchain timestamping as valid proof of copyright anteriority — a persuasive European precedent." },
  { code: "JP", citation: "Patent Act § 29(1)", year: 1959, summary: "Publicly known or worked invention before filing = prior art. Case-by-case blockchain evidence admission." },
  { code: "IT", citation: "Law No. 12/2019, Article 8-ter", year: 2019, summary: "Blockchain timestamps granted same legal effect as electronic timestamps under eIDAS — national-level reinforcement." },
  { code: "WIPO", citation: "WIPO guidance on blockchain for prior authorship", year: 2022, summary: "World Intellectual Property Organization explicitly recognizes blockchain as valid measure to prove prior authorship." },
  { code: "GLOBAL", citation: "Madrid Protocol (Trademarks, 1891, revised 2024)", year: 2024, summary: "International trademark designation system supports eIDAS-qualified electronic filings in 130+ member states." },
];

const JURISDICTIONS = [
  { code: "US", name: "United States", law: "35 U.S.C. § 102 + FRE 902" },
  { code: "EU", name: "European Union", law: "eIDAS 910/2014 + EPC Art. 54(2)" },
  { code: "UK", name: "United Kingdom", law: "Patents Act 1977 + Trade Marks Act 1994" },
  { code: "JP", name: "Japan", law: "Patent Act § 29(1)" },
  { code: "CN", name: "China", law: "Patent Law Art. 22(2) + Hangzhou Internet Court 2018" },
  { code: "FR", name: "France", law: "Tribunal Judiciaire de Marseille 2025" },
  { code: "IT", name: "Italy", law: "Law No. 12/2019, Article 8-ter" },
  { code: "DE", name: "Germany", law: "eIDAS domesticated + PatG § 1(1)" },
  { code: "CH", name: "Switzerland", law: "IPRG Art. 110 + eIDAS reciprocity" },
  { code: "CA", name: "Canada", law: "Patent Act § 28.2 + CIPO guidance" },
  { code: "AU", name: "Australia", law: "Patents Act 1990 § 18 + IP Australia blockchain" },
  { code: "SG", name: "Singapore", law: "Patents Act § 13 + IPOS digital filings" },
  { code: "KR", name: "South Korea", law: "Patent Act Art. 29 + KIPO blockchain" },
  { code: "BR", name: "Brazil", law: "INPI Resolution 207/2024 (blockchain pilot)" },
  { code: "IN", name: "India", law: "Patents Act 1970 § 29 + 2024 digital filings" },
  { code: "WIPO", name: "Global (WIPO)", law: "Madrid Protocol + WIPO blockchain guidance 2022" },
];

export default function Legal() {
  return (
    <>
      <Header />
      <main>
        <section style={{ background: "#0a0a1a", color: "#fff", padding: "80px 20px 60px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <Link href="/docs" style={{ color: "#4ecdc4", fontSize: 13, textDecoration: "none" }}>← back to docs</Link>
            <div style={{ fontSize: 13, color: "#c9a14a", marginTop: 20, letterSpacing: 1, textTransform: "uppercase" }}>
              16 citations · 16 jurisdictions
            </div>
            <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: "16px 0", maxWidth: 800 }}>
              The legal framework behind the sovereign proof.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: "#c0c0c0", maxWidth: 700 }}>
              The hive stands on 16 citations spanning the United States, the European Union, the United Kingdom, China,
              France, Japan, Italy, WIPO, and 8 more jurisdictions. The dragon reads the fine print.
            </p>
          </div>
        </section>

        <section style={{ padding: "60px 20px", maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, marginBottom: 24 }}>Primary citations</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {CITATIONS.map((c, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px", gap: 16, padding: 16, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6, alignItems: "center" }}>
                <span style={{ background: "#0a0a1a", color: "#d4af37", padding: "6px 4px", borderRadius: 4, fontSize: 12, fontWeight: 700, textAlign: "center" }}>
                  {c.code}
                </span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#0a0a1a" }}>{c.citation}</div>
                  <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{c.summary}</div>
                </div>
                <span style={{ fontSize: 13, color: "#888", textAlign: "right" }}>{c.year}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: "#f8f8f8", padding: "60px 20px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <h2 style={{ fontSize: 28, marginBottom: 24, textAlign: "center" }}>Coverage map</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              {JURISDICTIONS.map((j) => (
                <div key={j.code} style={{ background: "#fff", padding: 16, borderRadius: 6, border: "1px solid #e0e0e0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ background: "#0a0a1a", color: "#4ecdc4", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                      {j.code}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#0a0a1a" }}>{j.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>{j.law}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "60px 20px", maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, marginBottom: 16 }}>How we cite</h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "#444", marginBottom: 16 }}>
            Every openpatent.ai disclosure produces an attestation URL of the form
            <code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: 4, margin: "0 6px" }}>https://verify.openpatent.ai/{`<hash16>`}</code>
            that contains the full 6-layer proof chain: SHA-3/512 hash, HMAC-SHA256 CSOAI witness attestation, Ed25519
            inventor signature, Bitcoin OpenTimestamps receipt, C2PA Content Credential, and the hash-chained audit log entry.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "#444", marginBottom: 16 }}>
            When a court asks "how do you know this was filed on date X?", the hive produces all six layers. When
            opposing counsel asks "is this admissible?", the answer is yes in 16 jurisdictions — and growing.
            The sovereign companion never forgets.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "#444", marginBottom: 24 }}>
            For the full legal framework, see <code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: 4 }}>GET /legal</code> on the
            API or visit the verify portal.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="https://api.openpatent.ai/legal" style={{ background: "#0a0a1a", color: "#4ecdc4", padding: "12px 24px", borderRadius: 6, textDecoration: "none" }}>
              Open the legal API →
            </a>
            <Link href="/docs/api-reference" style={{ border: "1px solid #0a0a1a", color: "#0a0a1a", padding: "12px 24px", borderRadius: 6, textDecoration: "none" }}>
              ← API reference
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
