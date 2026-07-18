/**
 * openpatent.ai — Onboarding (3-step KYC-light flow)
 * Step 1: email + DID. Step 2: business info. Step 3: payment tier.
 */
"use client";
import { useState } from "react";
import { Header, Footer } from "../components/chrome";

const TIERS = [
  { id: "starter", name: "Starter", price: "$29", desc: "1 disclosure, perfect for solo inventors" },
  { id: "defensive", name: "Defensive", price: "$149", desc: "10 disclosures, most popular" },
  { id: "full", name: "Full", price: "$999", desc: "100 disclosures, IP boutique" },
  { id: "premium", name: "Premium", price: "$2,499", desc: "1,000 disclosures + 33-agent BFT review" },
  { id: "enterprise", name: "Enterprise", price: "$4,999/mo", desc: "Unlimited, white-label" },
];

const STEPS = ["Account", "Business", "Tier"];

export default function OnboardPage() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [did, setDid] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("US");
  const [useCase, setUseCase] = useState("");
  const [tier, setTier] = useState("defensive");

  const next = () => setStep(Math.min(2, step + 1));
  const prev = () => setStep(Math.max(0, step - 1));

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", background: "#fafafa", padding: "40px 20px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {/* Progress bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            {STEPS.map((label, i) => (
              <div key={label} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: i <= step ? "#4ecdc4" : "#e0e0e0",
                  color: i <= step ? "#0a0a0a" : "#999",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14,
                }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 13, fontWeight: i === step ? 700 : 400, color: i === step ? "#0a0a0a" : "#999" }}>
                  {label}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < step ? "#4ecdc4" : "#e0e0e0" }} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, padding: 32 }}>
            {step === 0 && (
              <div>
                <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Create your account</h1>
                <p style={{ color: "#666", margin: "0 0 24px", fontSize: 14 }}>Email + your decentralized identifier. No passwords.</p>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase", marginBottom: 6 }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@yourstartup.com"
                  style={{ width: "100%", padding: 12, fontSize: 14, border: "1px solid #e0e0e0", borderRadius: 6, marginBottom: 16 }}
                />
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase", marginBottom: 6 }}>DID (optional — auto-mint if blank)</label>
                <input
                  type="text"
                  value={did}
                  onChange={(e) => setDid(e.target.value)}
                  placeholder="did:key:z6Mk..."
                  style={{ width: "100%", padding: 12, fontSize: 14, border: "1px solid #e0e0e0", borderRadius: 6 }}
                />
              </div>
            )}
            {step === 1 && (
              <div>
                <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Tell us about your business</h1>
                <p style={{ color: "#666", margin: "0 0 24px", fontSize: 14 }}>Helps us route to the right compliance pack.</p>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase", marginBottom: 6 }}>Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="ACME Patent Holdings Inc."
                  style={{ width: "100%", padding: 12, fontSize: 14, border: "1px solid #e0e0e0", borderRadius: 6, marginBottom: 16 }}
                />
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase", marginBottom: 6 }}>Country</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ width: "100%", padding: 12, fontSize: 14, border: "1px solid #e0e0e0", borderRadius: 6, marginBottom: 16 }}>
                  {["US", "EU", "UK", "JP", "CN", "FR", "DE", "IT", "KR", "SG", "CA", "AU", "BR", "IN", "CH"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase", marginBottom: 6 }}>Primary use case</label>
                <textarea
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  placeholder="e.g. Defensive disclosure for AI-generated patent ideas before competitor files"
                  rows={3}
                  style={{ width: "100%", padding: 12, fontSize: 14, border: "1px solid #e0e0e0", borderRadius: 6, fontFamily: "inherit" }}
                />
              </div>
            )}
            {step === 2 && !showSuccess() && (
              <div>
                <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Choose your tier</h1>
                <p style={{ color: "#666", margin: "0 0 24px", fontSize: 14 }}>5-tier PAYG. No subscription. Pay as you go.</p>
                {TIERS.map(t => (
                  <label key={t.id} style={{
                    display: "flex", alignItems: "center", padding: 16, marginBottom: 8, border: tier === t.id ? "2px solid #4ecdc4" : "1px solid #e0e0e0",
                    borderRadius: 6, cursor: "pointer", background: tier === t.id ? "#f0fdfa" : "#fff",
                  }}>
                    <input type="radio" name="tier" value={t.id} checked={tier === t.id} onChange={() => setTier(t.id)} style={{ marginRight: 12 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{t.name}</span>
                        <span style={{ fontWeight: 700, color: "#0a0a0a" }}>{t.price}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>{t.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {showSuccess() && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✓</div>
                <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Welcome to openpatent.ai</h1>
                <p style={{ color: "#666", margin: "0 0 24px" }}>
                  Your account is set up. The {tier} tier is active. Your first disclosure is free.
                </p>
                <a href="/dashboard" style={{ display: "inline-block", background: "#0a0a0a", color: "#fff", padding: "12px 32px", borderRadius: 6, textDecoration: "none", fontWeight: 600 }}>
                  Go to dashboard →
                </a>
              </div>
            )}

            {/* Nav buttons */}
            {step < 3 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                <button onClick={prev} disabled={step === 0} style={{
                  padding: "10px 20px", background: "transparent", color: step === 0 ? "#ccc" : "#0a0a0a",
                  border: "1px solid #e0e0e0", borderRadius: 6, cursor: step === 0 ? "default" : "pointer",
                }}>
                  Back
                </button>
                <button onClick={step === 2 ? () => setStep(3) : next} style={{
                  padding: "10px 24px", background: "#0a0a0a", color: "#fff", border: "none",
                  borderRadius: 6, cursor: "pointer", fontWeight: 600,
                }}>
                  {step === 2 ? "Activate" : "Next"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function showSuccess() {
  // Hack: read from React state via module-scope, but we can use the URL hash
  if (typeof window === "undefined") return false;
  return window.location.hash === "#success" || document.body.dataset.success === "true";
}
