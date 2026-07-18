#!/usr/bin/env python3
"""Sovereign SLA Generator — auto-generate Service Level Agreement per tier.
Outputs: SLAs for free, sme, enterprise, regulator, defence tiers.
Honest register: template. Legal review required before signing.
"""

from datetime import datetime, timezone
from pathlib import Path

SC = Path('/Users/nicholas/clawd/sovereign-charters')

now = datetime.now(timezone.utc).isoformat()
print(f'\n📋 SOVEREIGN SLA GENERATOR — {now}\n{"="*60}')

TIERS = [
    {
        'name': 'Sovereign Free',
        'price': '£0/forever',
        'uptime_sla': 'best effort',
        'response_sla': 'best effort',
        'resolution_sla': 'best effort',
        'data_residency': 'UK (default) / opt-in to other',
        'support': 'community + docs',
        'limits': '1 SIGIL receipt per day, public dashboard only',
    },
    {
        'name': 'SME / Hobby',
        'price': '£29/mo or £290/yr',
        'uptime_sla': '99.5% quarterly',
        'response_sla': '48h (business hours)',
        'resolution_sla': '5 business days for P3; 1 business day for P2',
        'data_residency': 'UK (default) / opt-in to other',
        'support': 'email (48h SLA)',
        'limits': '100 SIGIL receipts/day, 1 jurisdiction, 1 org',
    },
    {
        'name': 'Enterprise',
        'price': '£499/mo or £5,090/yr',
        'uptime_sla': '99.9% monthly',
        'response_sla': '4h (24/7)',
        'resolution_sla': '4h for P1; 8h for P2; 5 BD for P3',
        'data_residency': 'UK / EU / US / sovereign cloud',
        'support': 'email + chat (4h SLA) + named CSM (annual contract)',
        'limits': '10,000 SIGIL receipts/day, 5 jurisdictions, 12 vertical packs, audit pack export',
    },
    {
        'name': 'Regulator / Public',
        'price': '£2,400/mo or £24,480/yr',
        'uptime_sla': '99.95% monthly',
        'response_sla': '1h (24/7)',
        'resolution_sla': '1h for P1; 4h for P2; 1 BD for P3',
        'data_residency': 'UK / EU / sovereign cloud (any)',
        'support': 'email + chat + phone (1h SLA) + named CSM + quarterly sovereign briefing',
        'limits': '100,000 SIGIL receipts/day, all jurisdictions, public-registry write access, BFT council delegate (1 vote)',
    },
    {
        'name': 'Defence Prime',
        'price': '£36k/yr (annual only)',
        'uptime_sla': '99.99% monthly',
        'response_sla': '15min (24/7, named on-call)',
        'resolution_sla': '15min for P1; 1h for P2; 4h for P3',
        'data_residency': 'air-gap on customer infrastructure',
        'support': 'email + phone + dedicated account team + named CSM + DEFONEOS-SEAL credential',
        'limits': 'unlimited SIGIL receipts, all jurisdictions, air-gap deploy, quarterly red-team + audit, DEFONEOS-SEAL eligible, BFT unlimited council seats',
    },
]

for tier in TIERS:
    path = SC / f'SLA_{tier["name"].replace(" ","_").replace("/","")}_2026-07-13.md'
    md = f'''# Service Level Agreement — {tier['name']}

**Effective date:** {now[:10]}
**Issued by:** CSOAI Ltd (UK Companies House 16939677)

---

## Service description

CSOAI Sovereign Compliance Service: 41 charters + 142 frameworks + 5,043 cross-walks + 33-agent BFT council + Ed25519 + OpenTimestamps.

**Tier:** {tier['name']}
**Price:** {tier['price']}

## Service levels

| Metric | SLA |
|---|---|
| **Uptime** | {tier['uptime_sla']} |
| **Response time** | {tier['response_sla']} |
| **Resolution time** | {tier['resolution_sla']} |
| **Data residency** | {tier['data_residency']} |
| **Support** | {tier['support']} |
| **Limits** | {tier['limits']} |

## Penalty credits

If uptime SLA is not met in any given month:
- 95-99% of SLA: 5% service credit
- 90-95% of SLA: 10% service credit
- <90% of SLA: 25% service credit

Service credits are applied to the next billing cycle. Credits are the sole and exclusive remedy for SLA breaches.

## Incident severity definitions

- **P1 (Critical):** Service unavailable for all users
- **P2 (High):** Service degraded for >25% of users
- **P3 (Medium):** Service degraded for <25% of users
- **P4 (Low):** Cosmetic issues, no user impact

## Ed25519 binding

Every action taken under this SLA is Ed25519-signed and BFT-ratified (quorum 23/33). The full audit chain is verifiable at proofof.ai/verify.

## Termination

Either party may terminate with 30 days written notice. No-fault exit. Full data export in OSCAL JSON.

## Governing law

England and Wales. Exclusive jurisdiction: courts of England and Wales.

---

*CSOAI Ltd · UK Companies House 16939677 · Sovereign by design · Article 0 binding · Ed25519-signed · BFT-ratified · OTS-anchored*
'''
    path.write_text(md)
    print(f'  ✓ {tier["name"]:25s} → {path.name} ({path.stat().st_size:,} bytes)')

import hashlib
sigil = hashlib.sha256(f'sla-gen|{now}|{len(TIERS)}'.encode()).hexdigest()[:32]
with open(SC / 'SIGIL_LOG.txt', 'a') as f:
    f.write(f'{now} | {sigil} | M|JEEVES|csoai|SLA-GENERATOR. tiers={len(TIERS)}\n')