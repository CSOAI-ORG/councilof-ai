# CSOAI Red-Team / Strategic-Gaps Analysis

## P0 gaps (fix immediately)

| Gap | Risk | Fix |
|---|---|---|
| **No accepted regulator-facing attestation track record** | Watchdog Certificates' evidentiary value unproven | Publish pilot MOU or letter of comfort from UK/EU competent authority or accredited CAB |
| **"5-of-5 BFT" claim is technically misleading** | False-advertising / legal liability risk; 5-of-5 tolerates zero Byzantine faults | Correct messaging to "5-voter consensus with threshold signatures" or re-architect to 4-of-7 |
| **Missing privacy/Terms/cookie/schema/analytics on csoai.org** | Trust-destroying for a compliance vendor | Ship Tier-1 trust fixes: privacy policy, ToS, cookie banner, JSON-LD, GA4, favicon |
| **No small-business/startup tier** | Losing high-volume SME segment | Launch £49/mo self-serve Article 50 tier |

## P1 gaps

| Gap | Risk | Fix |
|---|---|---|
| No DORA / NIS2 / eIDAS 2.0 product pages | Missing live/imminent enforcement windows | Create `/dora`, `/nis2`, `/eidas2` urgency pages |
| Weak EAT signals | No named experts, case studies, standards-body engagement | Add team profiles, 3 case studies, engagement log, white-paper library |
| No public security whitepaper | Enterprise buyers cannot assess key management, revocation, supply-chain risk | Publish "CSOAI Trust & Security" page |
| MCP security opportunity under-exploited | MCP RCE crisis ongoing; CSOAI has scanners but no commercial SKU | Launch "MCP Security Audit" (£999/audit) |

## P2 gaps

- No public Trust Center (`trust.csoai.org`)
- No Vanta/Drata/OneTrust connectors
- No Slack/Teams/GitHub native apps
- No sample Watchdog report on site
- No 404 page / loading states

---

## Competitor weaknesses to exploit

### Vanta / Drata / OneTrust

- US-first / CLOUD Act exposure
- No agent identity layer
- No x402 / agent payment compliance
- High entry price, no SMB tier
- Closed ecosystem
- Weak regulator-facing attestation

### Credo AI / Holistic AI / Modulos

- Premium pricing, enterprise-only
- Limited protocol coverage (no MCP/A2A/AP2/x402 native)
- No payments/commerce layer

### IBM / Microsoft / AWS

- Complexity / 6–12 month implementation
- No runtime agent enforcement
- No cryptographic audit receipts
- Vendor lock-in

---

## Market openings

| Deadline | Regulation | Opportunity |
|---|---|---|
| 2 Aug 2026 | EU AI Act Article 50 | Emergency Kit, chatbot disclosure + watermarking audit |
| 30 Jun 2026 | Colorado SB 24-205 | Algorithmic discrimination impact assessment templates |
| Jun 2026 | NIS2 first audits | Supply-chain attestation + incident reporting bundle |
| 11 Sep 2026 | EU Cyber Resilience Act | AI-BOM + SBOM attestation service |
| Dec 2026 | eIDAS 2.0 EUDIW | `did:csoai` + EUDI wallet integration |
| 1 Jan 2027 | California SB 942 / AB 853 | Watermarking + provenance service |

---

## Technical / security gaps

### Identity & revocation

- `did:csoai` not on W3C universal resolver
- No published revocation flow for Watchdog Certificates
- No key-ceremony / HSM documentation

**Fix:** publish DID method spec, revocation endpoint, key-custody architecture.

### BFT architecture

**Issue:** "5-of-5 BFT" cannot tolerate faults. Re-architect or rebrand.

### Supply-chain attestation

- 535 repos without SBOM/provenance
- No signed container/PyPI releases
- No dependency vulnerability dashboard

**Fix:** sign releases with Sigstore/cosign, publish SBOMs, vulnerability dashboard.

### Audit trail integrity

- Polygon PoA is centralised
- No eIDAS QES / RFC 3161 timestamp option
- Human override logs may use service accounts

**Fix:** add optional qualified timestamping, tie overrides to named users.

### Worm Hive / tunnels

- Manual/semi-managed SSH tunnels between Mac/M2/GCP VM
- No public security model docs
- Self-healing cron can mask intrusions

**Fix:** document tunnel security, rotate keys, isolate high-sensitivity hives.

### Human-in-the-loop failure modes

- Oversight theatre
- Automation bias / 99%+ approval rates
- No request-layer kill switch
- Override attribution gaps

**Fix:** add "Article 14 Oversight Audit" tool scoring real deployments.

---

## EAT gaps

| Dimension | Current | Fix |
|---|---|---|
| Expertise | 535 repos, no named editorial board | Council of Experts page, white papers |
| Authoritativeness | Claims independent standards body | Seek BSI/CEN/IEEE liaison status |
| Trustworthiness | UK Companies House listed | Add auditor, DPO contact, financial accountability |
| Citations | Claims cite frameworks | Inline citations + methodology docs |
| Case studies | None | 3 anonymised studies with metrics |
| Team | Thin bios | Expand credentials / photos / LinkedIn |

---

## 14 / 30 / 90-day action matrix

### 14 days

1. Fix trust fundamentals (privacy, ToS, cookies, schema, analytics, favicon)
2. Correct BFT messaging or re-architect council quorum
3. Launch Article 50 Emergency Kit landing page with countdown
4. Publish sample Watchdog Certificate/report
5. Create `/dora`, `/nis2`, `/eidas2` pages

### 30 days

6. Launch £49/mo self-serve SMB tier
7. Ship Trust Center (`trust.csoai.org`)
8. Open x402 Foundation membership conversation
9. Initiate UKAS-accredited CAB contact for Watchdog evaluation
10. Launch MCP Security Audit SKU

### 90 days

11. Build Vanta/Drata evidence-export integration
12. Sign all releases with Sigstore; publish SBOM dashboard
13. Publish 3 case studies + EU AI Act white paper
14. Apply to EU/UK regulatory sandbox for attestation acceptance pilot
15. Expand EAT: named experts, standards liaison, DPO/auditor transparency
