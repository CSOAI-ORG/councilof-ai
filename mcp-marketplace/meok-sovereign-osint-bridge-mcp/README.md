# 🔍 meok-sovereign-osint-bridge-mcp

**MEOK Sovereign OSINT Bridge MCP** — Ethical, consent-gated OSINT bridge. Wraps 10+ open-source OSINT tools with explicit consent + care-floor enforcement.

## Why This Exists

The OSINT ecosystem has gone mainstream:
- **SherlockSearch.com** — real-time facial OSINT from phone camera (54.5K TikTok likes)
- **Apify Face Search OSINT** — $0.05/search commercial offering
- **Maigret** — 35K stars, 3000+ site dossier by username
- **Sherlock** — 86K stars, social media username lookup
- **OpenALPR** — 11K stars, automatic license plate recognition
- **InsightFace** — 29K stars, state-of-the-art face analysis
- **SpiderFoot** — OSINT automation
- **theHarvester** — email/subdomain harvesting
- **holehe** — email → social profile lookup (11K stars)

**The problem:** These tools are powerful but most have NO consent layer. Anyone can be targeted.

**The solution:** This MCP wraps ALL of them with:
- Explicit consent tokens required
- Audit trail (SIGIL-signed receipts)
- Care-floor: NO individual surveillance, NO profiling, NO commercial data-broker use
- UK GDPR + DPA 2018 + PECR compliance built-in

## Tools (11)

| Tool | Purpose |
|---|---|
| `lookup_username` | Username lookup across 3000+ sites (Maigret + Sherlock) |
| `check_email` | Email → social profile lookup (holehe) |
| `scan_plate` | License plate recognition (OpenALPR / HyperLPR) — **requires plate owner consent** |
| `verify_face` | Face verification (InsightFace) — **requires subject consent** |
| `extract_ocr` | OCR document/ID extraction (PaddleOCR / EasyOCR / Tesseract) — **requires document owner consent** |
| `harvest_emails` | Email/subdomain harvesting (theHarvester) — **domain-scoped only** |
| `automate_osint` | Full OSINT automation (SpiderFoot) — **requires case ID + consent token** |
| `social_extract` | Profile URL → structured data (socid-extractor) — **public data only** |
| `validate_consent` | Validate a consent token before any lookup |
| `audit_trail` | Get audit trail of all OSINT operations (SIGIL-signed) |
| `osint_care_floor` | Get care-floor rules + enforcement status |

## Care Floor — THE BIG ONE

### Red Lines (HARD STOPS)
- ❌ **NO individual surveillance** — every lookup requires explicit consent
- ❌ **NO face recognition on unsuspecting individuals** — street scanning = FORBIDDEN
- ❌ **NO license plate tracking** — single lookup OK, bulk tracking FORBIDDEN
- ❌ **NO bulk PII harvesting** for commercial data brokers
- ❌ **NO profiling** for advertising, credit scoring, or employment
- ❌ **NO sharing of OSINT results externally** without consent
- ❌ **NO use against journalists, activists, dissidents**

### Allowed (with consent)
- ✅ **Self-lookup** — searching for your OWN digital footprint
- ✅ **Security research** — penetration testing with written authorization
- ✅ **Law enforcement** — with court order / warrant
- ✅ **Academic research** — IRB-approved studies
- ✅ **Fraud investigation** — corporate fraud with board approval
- ✅ **Defensive verification** — confirming identity claims for KYC/AML
- ✅ **SIGIL-signed audit trail** for every operation

## Consent Token Format

Every operation requires a consent token:
```json
{
  "consent_id": "cons_<uuid>",
  "subject": "self | authorized_party | warrant_ref",
  "scope": "username | email | plate | face | document",
  "target": "<the target being looked up>",
  "purpose": "self_check | security_research | law_enforcement | academic | fraud_investigation",
  "expiry": "ISO-8601 timestamp",
  "issued_by": "operator name + organization",
  "warrant_ref": "<optional court order reference>"
}
```

## Installation

```bash
pip install meok-sovereign-osint-bridge-mcp
# Plus dependencies for actual scanning:
pip install maigret sherlock-project openalpr insightface paddleocr easyocr
```

## Upstream Attribution

| Tool | Stars | License | Use |
|---|---|---|---|
| [sherlock-project/sherlock](https://github.com/sherlock-project/sherlock) | 86K | MIT | Username lookup |
| [soxoj/maigret](https://github.com/soxoj/maigret) | 35K | MIT | 3000+ site dossier |
| [deepinsight/insightface](https://github.com/deepinsight/insightface) | 29K | MIT | Face analysis |
| [openalpr/openalpr](https://github.com/openalpr/openalpr) | 11K | AGPL | License plate |
| [szad670401/HyperLPR](https://github.com/szad670401/HyperLPR) | 6K | Apache | License plate |
| [megadose/holehe](https://github.com/megadose/holehe) | 11K | GPL | Email → social |
| [jivoi/awesome-osint](https://github.com/jivoi/awesome-osint) | 27K | Other | Curated list |

## License

MIT — MEOK AI Labs / CSOAI Ltd (UK 16939677)