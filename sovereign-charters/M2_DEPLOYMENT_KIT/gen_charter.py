#!/usr/bin/env python3
"""
CHARTER GENERATOR
==================
Generates a new sovereign charter from the canonical 11-Article template.

Usage:
  python3 gen_charter.py 36 hive-name "Industry Description"
  python3 gen_charter.py --interactive

(c) 2026 CSOAI Ltd · UK Companies House 16939677
"""

import os, sys
from pathlib import Path
from datetime import datetime

CHARTER_DIR = Path("/Users/nicholas/clawd/sovereign-charters")
TEMPLATE = (CHARTER_DIR / "00-MASTER-CHARTER-TEMPLATE.md").read_text()

HIVES = {
    "csoai": "AI Governance Standards",
    "meok": "Sovereign AI OS",
    "proofof": "Cryptographic Attestation",
    # ... full list
}


def gen_charter(num, slug, description, industry_sic="62090"):
    """Generate a new sovereign charter file."""

    filename = f"{num}-{slug}-charter.md"
    filepath = CHARTER_DIR / filename

    if filepath.exists():
        print(f"[WARN] {filename} already exists. Skipping.")
        return False

    title = slug.replace("-", " ").replace("_", " ").title()
    timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    content = f"""# SOVEREIGN CHARTER — {title.upper()}
## {slug}.ai
## CSOAI Ltd · UK Companies House 16939677 · London, United Kingdom

> **Charter Article 0**: Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. **CA3O is the CMKC for AI.**

## ARTICLE I — SOVEREIGN FOUNDATION
| Field | Value |
|---|---|
| **Hive Slug** | `{slug}` |
| **Domain** | `{slug}.ai` |
| **Industry** | {description} |
| **UK SIC Code** | {industry_sic} |
| **Governance Body** | CSOAI Ltd (UK 16939677) |
| **Certification Authority** | MEOK AI Labs + CSOAI Watchdog Certification |
| **Ed25519 Public Key** | (reserved for signing ceremony) |
| **SIGIL Chain Entry** | (pending signing) |
| **BFT Council Ratification** | Council #{slug.upper()[:3]}-001 — Quorum 23/33 |

## ARTICLE II — INDUSTRY DOMAIN & MARKET

### II.A — Scope
{description}

### II.B — Market Size & Barriers
- **Global TAM**: £X.XB
- **Current Barrier to Entry**: (describe existing barriers)
- **Sovereign Barrier Drop**: Free training + Ed25519-signed certification removes barriers

### II.C — Black Swan Event Windows
- (List 2-3 industry-specific black swan windows with dates)

## ARTICLE III — FREE TRAINING PATHWAY

### III.A — Training Architecture

| Tier | Name | Modules | Duration | Cert |
|---|---|---|---|---|
| **T1** | Foundation | (5 modules) | 6-8 weeks | CASA-1 |
| **T2** | Practitioner | (5 modules) | 10-12 weeks | CASA-2 |
| **T3** | Lead Auditor | (5 modules) | 14-16 weeks | CASA-3 |
| **T4** | Director | (5 modules) | 18-24 weeks | CASA-4 |

### III.B — UE5 Simulation Scenarios

1. **Scenario 1**: (detailed scenario description)
2. **Scenario 2**: (detailed scenario description)
3. **Scenario 3**: (detailed scenario description)
4. **Scenario 4**: (detailed scenario description)
5. **Scenario 5**: (detailed scenario description)

### III.C — UBI Starter Integration
- Foundation (T1) → Training marketplace access (£300/mo)
- Practitioner (T2) → Project marketplace contracts (£600/mo)
- Lead Auditor (T3) → Audit contracts (£900/mo)
- Director (T4) → Industry governance council presidency (£1,200/mo)

## ARTICLE IV — COMPLIANCE & GOVERNANCE

| Framework | Coverage | MCP Tool |
|---|---|---|
| EU AI Act (industry-relevant articles) | 100% | (tool) |
| GDPR (Articles 5-21) | 100% | (tool) |
| ISO 42001:2023 | 100% | (tool) |
| NIST AI RMF 1.0 | 100% | (tool) |
| (industry-specific) | 100% | (tool) |

## ARTICLE V — UNIVERSAL CROSS-WALK MAP

| Target Hive | Relationship |
|---|---|
| **csoai** | Watchdog certification authority |
| **meok** | MCP infrastructure provider |
| **proofof** | Signed attestation issuer |
| (5-10 more cross-walks to relevant hives) |

## ARTICLE VI — ED25519 SIGNATURE CHAIN

```
Charter ID: CSOAI-CHARTER-{slug}-{timestamp[:10]}
SHA-256: (reserved — computed at signing)
Ed25519 Public Key: (reserved for signing ceremony)
Ed25519 Signature: (reserved)
SIGIL Digest: (reserved)
OTS Bitcoin Anchor: pending
BFT Ratification: Council #{slug.upper()[:3]}-001, 23/33 votes
Timestamp: {timestamp}
```

---

> *"{title} without verification is opinion. {title} with Ed25519 is sovereign governance."* 🐉
"""

    filepath.write_text(content)
    print(f"[OK] Created: {filepath}")
    print(f"     Size: {len(content):,} bytes")
    print(f"     Edit to fill in sections II.A, III.A-B, IV, V with real content")
    return True


def main():
    if len(sys.argv) < 4 and sys.argv[1] != "--interactive":
        print(__doc__)
        print("\nExample:")
        print('  python3 gen_charter.py 36 fishprocessing "Fish processing & cold chain logistics"')
        return 1

    if sys.argv[1] == "--interactive":
        print("Interactive charter generator")
        print("=" * 50)
        num = input("Charter number (e.g. 36): ").strip()
        slug = input("Hive slug (e.g. fishprocessing): ").strip()
        desc = input("Industry description: ").strip()
        sic = input("UK SIC code (default 62090): ").strip() or "62090"
        gen_charter(num, slug, desc, sic)
        return 0

    num = sys.argv[1].zfill(2)  # zero-pad
    slug = sys.argv[2]
    desc = sys.argv[3]
    sic = sys.argv[4] if len(sys.argv) > 4 else "62090"

    gen_charter(num, slug, desc, sic)
    return 0


if __name__ == "__main__":
    sys.exit(main() or 0)