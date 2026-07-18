# CSOAI Ltd — Data Processing Agreement (DPA)

**Effective date:** 2026-07-13

This DPA is entered into between:

**Controller:** [Customer name, address, registration]

**Processor:** CSOAI Ltd, UK Companies House 16939677

---

## 1. Subject matter and duration

The Processor will process Personal Data on behalf of the Controller in connection with the CSOAI Sovereign Compliance Service ("Service"). The DPA is effective from the Effective Date and continues for the duration of the Service Agreement.

## 2. Nature and purpose of processing

The Processor will process Personal Data for the following purposes:
- Provision of the CSOAI sovereign compliance service
- Generation of Ed25519-signed SIGIL receipts
- BFT 33-agent council ratification of sovereign actions
- OpenTimestamps anchoring to Bitcoin
- Customer support and service improvement
- Legal and regulatory compliance (UK GDPR / EU GDPR)

## 3. Categories of data subjects and personal data

**Data subjects:** Controller's employees, contractors, customers, end users.

**Categories of personal data:**
- Names, email addresses, organisation names
- IP addresses, browser user agents
- Service usage logs (timestamped, Ed25519-signed)
- SIGIL receipt payloads (Ed25519-signed, BFT-ratified)

**Special categories:** None processed by the Service.

## 4. Categories of recipients

Personal Data may be disclosed to:
- The Controller (data owner)
- BFT council members (Ed25519 public keys only)
- OpenTimestamps Bitcoin network (sha256 hashes only)
- proofof.ai verification service (SIGIL receipt hashes only)

The Processor does NOT disclose Personal Data to:
- Marketing or advertising networks
- Social media platforms
- Government agencies (except as required by law)

## 5. International transfers

The Processor operates the Service from the UK. International transfers are subject to:
- Adequacy decisions (where available)
- Standard Contractual Clauses (SCCs)
- UK International Data Transfer Agreement (IDTA)

The Controller may request data residency in a specific jurisdiction (UK, EU, US, sovereign cloud).

## 6. Security measures

The Processor implements:
- Ed25519 signing of every sovereign action
- BFT 33-agent council ratification (quorum 23/33)
- OpenTimestamps Bitcoin anchoring
- Article 0 binding (no action without a receipt)
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Regular security audits
- BFT council vote on every security-relevant change

## 7. Sub-processors

The Controller authorises the use of the following sub-processors:
- Vercel Inc. (hosting, US-based, EU-US Data Privacy Framework compliant)
- Sovereign VM substrate (GCP, UK region)
- OpenTimestamps calendar servers (public Bitcoin block references)

The Processor will notify the Controller of any new sub-processor at least 30 days in advance.

## 8. Data subject rights

The Processor will assist the Controller in fulfilling Data Subject rights:
- Right of access (Article 15)
- Right to rectification (Article 16)
- Right to erasure (Article 17)
- Right to restriction (Article 18)
- Right to data portability (Article 20)
- Right to object (Article 21)
- Right to not be subject to automated decision-making (Article 22)

## 9. Breach notification

The Processor will notify the Controller of any Personal Data breach within 24 hours of becoming aware of the breach.

## 10. Audit rights

The Controller has the right to audit the Processor's compliance with this DPA, with 30 days written notice, not more than once per year, at the Controller's cost.

## 11. Data return and deletion

On termination of the Service, the Processor will:
- Return all Personal Data to the Controller within 30 days
- Delete all Personal Data within 60 days
- Provide a written certificate of deletion

The Processor retains SIGIL receipt hashes (not Personal Data) for the duration of the sovereign chain.

## 12. Sub-processing, sub-contracting, and onward transfer

The Processor may engage sub-processors only with the Controller's prior written consent (which shall not be unreasonably withheld). The Processor will enter into a written agreement with each sub-processor that imposes the same data protection obligations as this DPA.

## 13. Governing law and jurisdiction

This DPA is governed by the laws of England and Wales. The parties submit to the exclusive jurisdiction of the courts of England and Wales.

## 14. Order of precedence

In the event of a conflict between this DPA and the Service Agreement, this DPA shall prevail in respect of Personal Data matters.

## 15. Ed25519 binding

The Controller acknowledges that every action taken under this DPA is Ed25519-signed and BFT-ratified (quorum 23/33). The full audit chain is verifiable at proofof.ai/verify.

## 16. Sovereign features

- **Article 0 binding** — no sovereign action without a SIGIL receipt
- **Ed25519 signing** — every action cryptographically signed
- **BFT council ratification** — 33-agent council, quorum 23/33
- **OpenTimestamps anchoring** — Bitcoin-anchored, tamper-evident
- **Sovereign by design** — no vendor lock-in, customer owns their data

---

**Signed:**

For the Controller: ___________________________ Date: __________

For the Processor (CSOAI Ltd): ___________________________ Date: __________

*Nicholas Templeman, Founder & CEO, CSOAI Ltd*
*UK Companies House 16939677*
*Ed25519-bound. BFT-ratified. OTS-anchored.*
