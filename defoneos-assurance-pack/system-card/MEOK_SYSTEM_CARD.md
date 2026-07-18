# MEOK Sovereign OS — System Card v1.4.0
> **Provider:** CSOAI Ltd (UK Companies House 16939677)  
> **Provider URL:** https://csoai.org  
> **Issued:** 2026-07-05T06:15:59.288183+00:00  
> **Risk tier:** `limited_risk_with_high_risk_subsystems`  
> **Care floor:** `0.95` (Layer-0 hard stop — see § Care Doctrine)  
> **Frameworks:** EU AI Act (incl. Art. 50), GDPR, NIST AI RMF 1.0, ISO/IEC 42001:2023, NIST SP 800-53 rev5, JSP 936 (UK MOD), UK AI Bill (AISI voluntary commitments)  
> **Honesty register:** This card is a SIGNED ATTESTATION of declared posture. It is **not** a certification, accreditation, or guarantee of compliance. The signature proves *that* a declaration was made and *what* it contained; it does not prove the declaration is true. Buyers and regulators should pair this with their own assessment. 

---

## 1. System identity

- **Name:** MEOK Sovereign OS
- **Version:** 1.4.0
- **Provider:** CSOAI Ltd (UK Companies House 16939677)
- **Provider jurisdiction:** United Kingdom (Companies House registration 16939677)
- **Repository:** https://github.com/CSOAI-ORG/meok
- **System URL:** https://meok.ai
- **System type:** Federated AI governance / orchestration layer (software)
- **Architecture pattern:** Substrate over LLM — MEOK wraps third-party models (Anthropic Claude, OpenAI GPT, Google Gemini, Meta Llama, Mistral, etc.) and adds deterministic governance, audit, and signing.

## 2. Purpose and intended use

MEOK Sovereign OS is a federated, sovereign AI operating system that wraps third-party large-language models in a signed, offline-verifiable governance layer. It enables organisations to deploy GenAI under EU AI Act, GDPR, NIST AI RMF, ISO/IEC 42001, JSP 936, and UK AI Bill posture with cryptographic evidence of every governed action.

### 2.1 Intended use

Decision-support across 33 sovereign industry overlays (financial services, healthcare, defence support, energy, legal services, public sector). Human-in-the-loop for all Annex III high-risk actions. Advisory outputs only — never autonomous effect.

### 2.2 Out-of-scope uses (refused at the substrate layer)

- Autonomous weapons, targeting, or kinetic-effect tasking
- Adversarial network exploitation or offensive cyber operations
- Mass biometric identification of individuals in public spaces
- Social-scoring of natural persons (EU AI Act Art. 5 prohibition)
- Emotion inference in workplace or educational settings (Art. 5(1)(f))
- Subliminal manipulation techniques (Art. 5(1)(a))
- Predictive policing based solely on profiling (Art. 5(1)(d))

## 3. Risk classification

**Classification:** `limited_risk_with_high_risk_subsystems`

The MEOK Sovereign OS itself is a LIMITED-RISK system under EU AI Act Article 50 (transparency obligations only) — it is a governance wrapper, not a high-risk application. However, the OS hosts subsystems (e.g. credit-decisioning overlay, medical triage overlay, employment-screening overlay) that ARE classified as HIGH-RISK under Annex III. Those subsystems inherit Annex I controls and their own System Cards, posted at https://csoai.org/system-cards/. This card documents the OS-level posture that governs them all.

### 3.1 EU AI Act Annex III subsystems hosted

MEOK Sovereign OS hosts the following high-risk subsystems, each with its own subsystem System Card and OSCAL component definition:

| Subsystem | Annex III category | Subsystem System Card |
|-----------|---------------------|------------------------|
| Credit-decisioning overlay | Biometric / creditworthiness | /system-cards/meok-credit.html |
| Medical-triage overlay | Safety component of a medical device | /system-cards/meok-triage.html |
| Employment-screening overlay | Recruitment / worker management | /system-cards/meok-hr.html |
| Critical-infrastructure overlay | Safety component in critical infra | /system-cards/meok-infra.html |
| Defence-support overlay | Defense AI (Art. 6(2)+Art. 26 derived) | /system-cards/meok-defence.html |

## 4. EU AI Act Article 50 — Transparency obligations

Article 50 enters into force **2 August 2026** (see the EU Digital Omnibus Act 7 May 2026 political agreement — Annex III high-risk provisions delayed to 2 Dec 2027; **Article 50 is NOT delayed**). MEOK is fully Article-50 compliant as of this card.

### art-50(1)-ai-interaction
Users are informed they are interacting with an AI system unless this is obvious from a reasonable person's perspective. The MEOK UI displays a persistent 'AI-Assisted' indicator on every governed surface; the system-card fingerprint is shown in the sidebar.

*Evidence:* `/system-cards/meok-os.html · footer 'AI-Assisted' badge`

### art-50(2)-generative-disclosure
AI-generated content (text, image, audio, video) is marked in a machine-readable format detectable by proofof.ai and C2PA-aware consumers. Each MEOK output carries a Watermarking Passport (HMAC-signed free tier, Ed25519-signed Pro tier).

*Evidence:* `article50-passport issued per content hash`

### art-50(3)-deepfake-marking
Synthetic audio/image/video is marked at generation. The MEOK federation routes all generative calls through a watermarker that emits an Art-50(3) compliant manifest. MEOK does not produce deepfakes of real persons; refusal is hard-coded in the Maternal Covenant.

*Evidence:* `watermark_passport for every gen-AI output`

### art-50(4)-emotion-recognition
Emotion-recognition systems inform affected persons. MEOK exposes this capability through the care-membrane MCP only; every invocation requires explicit consent capture and produces an audit-record entry.

*Evidence:* `care_membrane.validate_action consent log`

## 5. NIST AI RMF 1.0 alignment

| Function | Control | Implementation |
|----------|---------|----------------|
| GOVERN | GOVERN-1.1 | Legal/regulatory requirements understood and managed (UK/EU AI Act, GDPR, sector regulators). |
| GOVERN | GOVERN-2.1 | Roles/responsibilities/elines of authority defined (CISO, ML Owner, DPO, Authorising Official). |
| GOVERN | GOVERN-4.1 | Documented risk-tolerance for AI systems; care-floor 0.95 enforced as a Layer-0 hard stop. |
| MAP | MAP-1.1 | Context established for each deployed AI use-case; impacts mapped to individuals/groups. |
| MAP | MAP-3.1 | AI capabilities/limitations documented in this System Card. |
| MEASURE | MEASURE-2.5 | AI system evaluated for trustworthy characteristics (accuracy, robustness, bias, privacy). |
| MEASURE | MEASURE-3.1 | Risk to individuals/groups monitored continuously; alerts raised on drift. |
| MANAGE | MANAGE-1.1 | Determined risk treatment enacted (mitigate/transfer/avoid/accept) and documented. |
| MANAGE | MANAGE-2.1 | Resources allocated for AI risk management; named owners per overlay. |
| MANAGE | MANAGE-4.1 | Post-deployment monitoring plan executed; incidents triaged via SIGIL ledger. |

## 6. ISO/IEC 42001:2023 — AI Management System (AIMS)

| Control | Implementation |
|---------|----------------|
| A.5.1 | Policies for AI use defined and approved at board level. |
| A.5.2 | AI roles, responsibilities, and authorities defined. |
| A.6.1.2 | AI system purpose and intended use documented (see INTENDED_USE above). |
| A.6.2.4 | AI system capabilities and limitations documented (see OUT_OF_SCOPE). |
| A.7.2 | Data quality for AI systems — provenance + lawful basis recorded. |
| A.8.3 | AI risk treatment plan maintained; residual risks accepted by Authorising Official. |
| A.8.5 | AI system impact assessment (FRIA-lite) completed for Annex III overlays. |
| A.9.3 | AI system logging produces SIGIL chain (Ed25519 hash-linked). |
| A.9.4 | Documented communication to affected persons (Art 50 transparency). |
| A.10.2 | AI incident management: SIGIL-fed alerting, 24-hour regulator notification path. |

## 7. GDPR alignment

| Article | Implementation |
|---------|----------------|
| Art-5 | Lawfulness, fairness, transparency — lawful basis recorded per processing. |
| Art-6 | Lawful basis identified (consent / contract / legal-obligation / vital / public-task / legitimate-interest). |
| Art-22 | Automated decision-making safeguards — human review for any decision with legal effect. |
| Art-25 | Data protection by design and by default — minimisation, pseudonymisation, encryption at rest/transit. |
| Art-30 | Records of processing activities (RoPA) maintained per overlay. |
| Art-32 | Security of processing — TLS 1.3, AES-256 at rest, Ed25519 signing, ML-DSA-65 PQC roadmap. |
| Art-33 | Breach notification — 72-hour supervisory-authority path via SIGIL. |
| Art-35 | DPIA performed for high-risk overlays; consulted with DPO. |
| Art-44 | International transfers — SCC + TIA for non-UK/EU regions; sovereign deployment per region. |

## 8. NIST SP 800-53 rev5 alignment

| Control | Implementation |
|---------|----------------|
| AC-2 | Account management — every agent identity is Ed25519-registered. |
| AC-6 | Least privilege — overlay-scoped tokens; spend limits enforced per delegation. |
| AU-2 | Audit events — every governed action emits a SIGIL receipt. |
| AU-10 | Non-repudiation — Ed25519 signing of every SIGIL. |
| CM-2 | Baseline configuration — pinned dependencies, SBOM per release. |
| IA-2 | Identification & authentication — Ed25519 keypairs per identity. |
| IA-5 | Authenticator management — sovereign keys stored in OS keychain with 0600 perms. |
| SC-12 | Cryptographic key establishment — Ed25519, with ML-DSA-65 PQC migration path. |
| SC-13 | Cryptographic protection — RFC 8032, FIPS 186-5 compliant primitives. |
| SI-7 | Software/firmware/information integrity — every release SHA-256 anchored, OTS-provable. |

## 9. UK MOD JSP 936 + UK AI Bill (AISI)

MEOK is designed to support JSP 936 compliance for MOD customers (policy for AI in defence). The OS gates every governed action through the 33-agent Byzantine Fault Tolerant (BFT) council (22-of-33 quorum) before execution.

| Control | Implementation |
|---------|----------------|
| aisi-engagement | Engages with the AI Safety Institute (AISI) for pre-deployment evaluations. |
| voluntary-commitments | Adheres to the UK government's voluntary AI safety commitments (frontier-model safety policy). |
| bft-council | High-stakes deployment gated by 33-agent Byzantine Fault Tolerant council (22/33 quorum). |

## 10. Care doctrine (Layer-0 hard stops)

The following actions are refused at the substrate layer, regardless of user instruction or operator configuration. The refusal is cryptographically enforced (the refusal pattern is part of the Maternal Covenant hash) and logged to the SIGIL ledger.

- ❌ Autonomous weapons or kinetic-effect tasking
- ❌ Targeted individual identification for harm
- ❌ Mass biometric surveillance in public spaces
- ❌ Social scoring of natural persons
- ❌ Subliminal manipulation
- ❌ Predictive policing based on profiling
- ❌ Emotion-recognition in workplace or education

**Care floor:** `0.95` — any governed action whose care-score falls below this threshold is hard-stopped and the incident is escalated to the BFT council.

## 11. Data governance

- **Lawful basis:** recorded per overlay and per processing activity (GDPR Art. 6).
- **Data minimisation:** every prompt is reduced to the minimum fields required; redundant PII is stripped at the proxy layer.
- **Provenance:** every input is hash-stamped before entering the LLM call; the downstream receipt binds input_sha256, model, seed, and timestamp.
- **Retention:** raw prompts/replies retained 30 days in sovereign storage (UK / EU regions), then cryptographically shredded. Hashes retained indefinitely for audit (Article 12 EU AI Act records).
- **Cross-border:** sovereign deployment per region; non-UK/EU traffic covered by SCC + TIA. No data routed to non-allied jurisdictions without explicit DPO sign-off.

## 12. Logging & non-repudiation

Every governed action emits a SIGIL — a hash-linked, Ed25519-signed record of the action, parameters, and result. The SIGIL chain is:

- **Per-agent:** every identity has a registered Ed25519 public key (OrgKernel L1).
- **Per-action:** every execution is logged (OrgKernel L2, hash-chained).
- **Per-compliance:** every framework assertion is signed (OrgKernel L3).
- **Per-output:** every AI output carries an Art-50 watermarking passport (HMAC free, Ed25519 Pro).

Verifiable offline at `https://proofof.ai/verify/<fingerprint>`.

## 13. Robustness, monitoring, incident response

- **Evaluation:** continuous evals against the meok-eval harness; accuracy, robustness, bias, and adversarial probes.
- **Drift detection:** statistical parity, demographic parity, equalised-odds monitored per overlay; alerts on >5% drift over 7 days.
- **Incident response:** 24-hour regulator notification path, 72-hour breach notification per GDPR Art. 33, 7-day incident closure target.
- **Post-deployment monitoring:** the OS produces a weekly governance report per overlay; report is signed and attached to the overlay's OSCAL component-definition.

## 14. Limitations and known gaps

- **LLM-as-substrate:** MEOK governs calls to third-party LLMs. The behaviour of the underlying model is outside MEOK's control; MEOK records WHAT was called and WHAT came back, not whether the model behaved correctly.
- **Annex III delay:** the EU Digital Omnibus Act 7 May 2026 political agreement delayed Annex III high-risk obligations to 2 Dec 2027. MEOK implements those controls ahead of the deadline as a good-faith posture, but the legal effective date is 2 Dec 2027.
- **Signing-only:** MEOK signs declarations; it does NOT certify. This card is a signed attestation of declared posture, not a passed assessment by an accreditation body.

## 15. Contact & accountability

- **Authorising official:** Nicholas Templeman, Founder & Director, CSOAI Ltd
- **Email:** nicholas@csoai.org
- **Postal:** CSOAI Ltd · UK Companies House 16939677 · London, United Kingdom
- **Security disclosure:** security@csoai.org (PGP key on csoai.org/.well-known)
- **DPO:** dpo@csoai.org

---

## 16. Signature envelope (machine-verifiable)

The JSON block below is appended at file-write time. It binds a SHA-256 of the body above (everything **before** this section) with an Ed25519 signature. Verification command:

```bash
# 1. extract the body and the envelope
awk '/## 16\. Signature envelope/{exit} {print}' MEOK_SYSTEM_CARD.md > body.md
awk '/## 16\. Signature envelope/,0' MEOK_SYSTEM_CARD.md > envelope.md

# 2. verify (uses verify_command.py from this pack)
python3 ../verify-command/verify_command.py MEOK_SYSTEM_CARD.md
```

```json
{
  "defoneos_signed_contact": {
    "message": {
      "i": 0,
      "ts": "2026-07-05T06:15:59.289226+00:00",
      "action": "system-card:MEOK Sovereign OS",
      "detail": "{\"body_bytes\":14017,\"body_sha256\":\"4527cca7c9f40d3e9d3a7acd0b79343c6f2c24f2e2aeef5155feb50d2eca71db\",\"care_floor\":0.95,\"frameworks\":[\"EU AI Act Art 50\",\"GDPR\",\"NIST AI RMF 1.0\",\"ISO/IEC 42001:2023\",\"NIST SP 800-53 rev5\",\"JSP 936\",\"UK AI Bill\"],\"honesty_register\":\"Signed attestation of declared posture \u2014 NOT certification, accreditation, or guarantee. Provenance != truth. Buyer/regulator assessment remains required.\",\"kind\":\"system-card\",\"provider\":\"CSOAI Ltd (UK Companies House 16939677)\",\"risk_tier\":\"limited_risk_with_high_risk_subsystems\",\"subject\":\"MEOK Sovereign OS v1.4.0\",\"system_name\":\"MEOK Sovereign OS\",\"version\":\"1.4.0\"}",
      "prev": ""
    },
    "signature_ed25519": "fb1cb0ce9f678f6f6c9a2277e263292ee308c888a04292f6cb904ff3c12fab24e0198f7d4fa816b02747051ea8e43c9b415f4ecc47a62eeaf36fdf51e3b55f06",
    "public_key_ed25519": "ec0638ba7687eaa9ca64de165d8b2ca1f422d451fa799cdba42ff9c278f087cd",
    "fingerprint": "SOV:C2B6-3E2A-2F38-37F3",
    "algorithm": "Ed25519 (RFC 8032) over utf8(canonical_json(message))",
    "provenance": {
      "kind": "system-card",
      "subject": "MEOK Sovereign OS v1.4.0",
      "system_name": "MEOK Sovereign OS",
      "version": "1.4.0",
      "provider": "CSOAI Ltd (UK Companies House 16939677)",
      "risk_tier": "limited_risk_with_high_risk_subsystems",
      "frameworks": [
        "EU AI Act Art 50",
        "GDPR",
        "NIST AI RMF 1.0",
        "ISO/IEC 42001:2023",
        "NIST SP 800-53 rev5",
        "JSP 936",
        "UK AI Bill"
      ],
      "body_sha256": "4527cca7c9f40d3e9d3a7acd0b79343c6f2c24f2e2aeef5155feb50d2eca71db",
      "body_bytes": 14017,
      "care_floor": 0.95,
      "honesty_register": "Signed attestation of declared posture \u2014 NOT certification, accreditation, or guarantee. Provenance != truth. Buyer/regulator assessment remains required."
    },
    "verify": "Drop this receipt into https://defoneos.vercel.app/verify.html or run `python3 verify_command.py <receipt.json>` for offline verification.",
    "issued_by": "DEFONEOS signing core \u00b7 CSOAI Ltd (UK 16939677) \u00b7 MIT + CC0"
  }
}
```
