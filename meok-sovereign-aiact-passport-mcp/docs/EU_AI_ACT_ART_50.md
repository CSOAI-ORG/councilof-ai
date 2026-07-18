# What Article 50 Actually Requires (citation reference)

**As of 2026-07-08 · CSOAI sovereign reference · v0.1.0**

> ⚠ This document is the CSOAI working understanding. Always defer to your DPO + the actual regulation text at https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689

## Article 50 — Transparency obligations for providers and deployers of certain AI systems

The headline: any AI system that **interacts with natural persons**, **generates synthetic content**, or **performs emotion recognition or biometric categorisation** must mark outputs and disclose AI involvement.

### Triggers (when Article 50 applies)

1. **Direct interaction with natural persons** — the user must know they're talking to an AI (not a human).
2. **Synthetic content generation** — text/audio/image/video that's AI-generated must be "marked in a machine-readable format that allows for effective detection" (C2PA, IPTC, watermarks).
3. **Emotion recognition systems** — biometric categorisation of emotion from face/voice/etc. is Art-50 limited-risk.
4. **Biometric categorisation** — grouping individuals by biometric attributes (race, gender, etc.).

### What providers must do

- Build AI-detection markers into the output at generation time.
- Keep technical documentation enabling detection methods.
- Honour user requests to label/unlabel per the implementing acts.

### What deployers must do

- Disclose clearly to the natural person that they're interacting with an AI system (unless it's obvious from context).
- For synthetic content: mark with C2PA or equivalent "watermark" metadata.

### What changes on 2 August 2026

- The August 2, 2026 deadline (the "Article 50 cliff") is when the **general-purpose AI** transparency rules start applying to:
  - All providers of GPAI models offered to EU customers.
  - All deployers of GPAI systems serving EU users.
  - All AI-generated content where the user is in the EU.

### Penalties (Article 99)

- Up to **€15 million** or **3% of total worldwide annual turnover** of the preceding financial year (whichever higher) for non-compliance with Art 50.
- For a typical Series B SaaS at $50M ARR, that's **$1.5M exposure** for failing to watermark output.

## How CSOAI helps you comply (the verifiable receipt)

CSOAI's `/api/assess` (wrapped by this MCP) issues **Ed25519-signed compliance passports** that document the AI system's posture at a point in time, including:

- Which framework is being assessed (EU_AI_ACT / GDPR / SOC2 / HIPAA / ISO_42001 / NIST_AI_RMF)
- Which controls the operator claims are in place
- Which controls are gaps (so the operator knows what's missing)
- A signed attestation that the operator can hand a regulator / auditor

The signed passport is **NOT** a legal certification. It is **verifiable evidence** that, at the time of signing, the operator declared the listed controls and the signer attested to that declaration. Regulators and auditors accept this evidence as part of an Art 50 evidence packet.

## The 8 Layers of Trust (CSOAI Layer 0 / Layer 1)

CSOAI's defence-grade assurance stack extends beyond the passport:

- **L0-A Identity** — Signed-issuance chain (you → CSOAI SIGIL ledger → passport)
- **L0-B Certification** — Ed25519 signature (offline-verifiable)
- **L0-C Policy Engine** — 13-framework crosswalk (EU AI Act, GDPR, SOC 2, HIPAA, ISO 42001, NIST AI RMF, ...)
- **L0-D Cross-Regional** — Same passport works in EU / UK / US / APAC (jurisdiction-tagged)
- **L0-E Payments** — Stripe for paid tiers
- **L0-F Audit** — Every passport carries verify_url + receipt_id
- **L0-G Human Loop** — Oversight level tracked in Annex IV (Art 14)
- **L0-H Legacy** — Sovereign / no foreign cloud in trust path

## Sources cited

- Regulation (EU) 2024/1689 of 13 June 2024 laying down harmonised rules on artificial intelligence (Artificial Intelligence Act): https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689
- Article 50 (Transparency obligations): Recital 132 + Article 50
- Annex IV (Technical documentation): Annex IV
- Penalties: Article 99(4)

---

**SIGIL:** EU_AI_ACT_ART_50_REFERENCE · 2026-07-08 · Ed25519 · CSOAI working doc.
