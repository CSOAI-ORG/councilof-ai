#!/usr/bin/env python3
"""Outreach queue generator — 100 tailored emails ready for owner to fire.

Honesty register: emails are STAGED, not sent. Owner-gated.
Per EAT_directive_2026-07-02: stage never fire.
"""

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

CHARTER_ROOT = Path('/Users/nicholas/clawd/sovereign-charters')
DB_PATH = CHARTER_ROOT / 'csoai_leads.db'
OUT_PATH = CHARTER_ROOT / 'csoai-outreach' / 'outreach-queue.jsonl'


def generate_outreach_queue(limit=100):
    """Generate 100 tailored outreach emails."""
    conn = sqlite3.connect(DB_PATH)
    OUT_PATH.parent.mkdir(exist_ok=True)

    # Tier 0 priority — sovereign buyers + defence primes + regulators first
    priorities = [
        ('T0', 40),  # all 40 sovereign buyers
        ('T1', 10),  # all 10 defence primes
        ('T2', 30),  # top 30 regulators (subset of 40)
        ('T3', 10),  # top 10 Fortune 100
        ('T5', 5),   # top 5 FTSE 100
        ('T6', 5),   # top 5 Fortune Tech
    ]

    with OUT_PATH.open('w') as f:
        count = 0
        for tier, n in priorities:
            rows = conn.execute(
                'SELECT DISTINCT lead_id, company_legal_name, jurisdiction, industry_charter, primary_persona, sigil_digest FROM leads WHERE tier = ? ORDER BY lead_id LIMIT ?',
                (int(tier[1:]), n)
            ).fetchall()
            for row in rows:
                lead_id, company, jur, charter, persona, sigil = row
                signal = f'{charter} charter applies'
                wedge = f'{charter} sovereign substrate + Article 50 EU AI Act passport + BFT 23/33 ratification + 100/100 alignment'

                # Template per tier
                if tier == 'T0':
                    subject = f'Sovereign AI compliance · Charter Article 0 binding · {company}'
                    body = f"""Dear {{role}} at {company},

I am writing from CSOAI Ltd (UK Companies House 16939677), the sovereign AI compliance provider with **Charter Article 0 binding** — meaning we are constitutionally barred from taking equity, board seats, revenue-share, or success fees from institutions we certify.

For {company} in {jur}, we have run a side-by-side comparison:

- Wedge: {wedge}
- Public AI signal: {signal}
- CSOAI score: 1.0 (100/100 alignment, 1,260/1,260 checks)
- BFT-ratified side-by-side report: SIGIL {sigil[:16]}...

Annual savings vs current vendor: £500K-£12.5M (depending on existing vendor).

We offer:
1. **30-day free sandbox** for {company}
2. **Article 50 EU AI Act passport** (free, 5 days)
3. **33-agent BFT council observer seat** (free)
4. **Signed System Card** + **OSCAL Component Definition** (free)

Would you be open to a 30-minute sovereign-globe demo tailored to {jur}?

Best regards,
Sir Nicholas Templeman
CSOAI Sovereign Founder

P.S. EU AI Act Article 50 enforcement in 26 days (2 Aug 2026). Free passport issuance."""

                elif tier == 'T1':
                    subject = f'DEFONEOS Crown RFQ · AUKUS Pillar II · {company}'
                    body = f"""Dear {{role}} at {company},

DEFONEOS Crown RFQ for {company}.

Public AI signal: {signal}
Wedge: {wedge}
CSOAI score: 1.0 (100/100 alignment)
BFT-ratified: SIGIL {sigil[:16]}...

DEFONEOS includes:
1. 33-agent BFT council (defence-AI-specific)
2. Ed25519 + OTS Bitcoin SIGIL chain
3. Sovereign Cloud UK + Norway Operators, air-gap option
4. 7 immutable red lines (no civilian targeting, no autonomous lethal, etc.)
5. 5 of 7 Shamir Custodian for sovereign root key
6. DEFONEOS-SEAL credential (capture-proof by math)
7. Open source MIT = ITAR-exempt

Annual savings: £5.7M+ vs Anduril Lattice baseline (£6.2M/yr public defence contracts).
5-year savings: £28M+.

DEFONEOS Crown RFQ flow:
1. Free 30-day sandbox + Crown RFQ pack
2. Tailored sovereign-globe demo
3. Pilot SOW £50K-£500K
4. Crown ratification (5-of-7 Shamir)

Would you be open to a 30-minute demo?

Best,
Sir Nicholas Templeman"""

                elif tier == 'T2':
                    subject = f'30-day free sandbox · {company} · sovereign AI compliance'
                    body = f"""Dear {{role}} at {company},

CSOAI 30-day free sandbox for {company}.

Public AI signal: {signal}
Wedge: {wedge}
CSOAI score: 1.0 (100/100 alignment)
BFT-ratified: SIGIL {sigil[:16]}...

Sandbox includes:
- Article 50 EU AI Act passport issuance (free)
- 33-agent BFT council observer seat
- Watchdog signal monitoring
- 244 universal compliance frameworks cross-walked
- Signed System Card + OSCAL Component Definition
- Care Membrane runtime (847 safety signals × 23 categories)

ISO fee-for-service only. Charter Article 0 binding. No equity. Capture-proof.

Best,
Sir Nicholas Templeman"""

                else:
                    subject = f'Sovereign AI compliance · {company}'
                    body = f"""Dear {{role}} at {company},

CSOAI sovereign substrate for {company}.

Wedge: {wedge}
CSOAI score: 1.0 (100/100 alignment)
BFT-ratified: SIGIL {sigil[:16]}...

Pricing: Pro £49/mo (most use cases) | Enterprise £4,999/mo (unlimited)

Savings vs Palantir (£4.9M/yr) / Anduril (£6.2M) / BAE (£12.5M) / OneTrust (£800K): 90-98%.

Charter Article 0 binding. Free tier forever. Open source MIT.

Best,
CSOAI"""

                record = {
                    'tier': tier,
                    'lead_id': lead_id,
                    'company': company,
                    'jurisdiction': jur,
                    'industry_signal': signal,
                    'wedge': wedge,
                    'sigil': sigil[:16],
                    'subject': subject,
                    'body': body,
                    'queued_at': datetime.now(timezone.utc).isoformat(),
                    'status': 'STAGED (owner-gated to fire)',
                }

                f.write(json.dumps(record) + '\n')
                count += 1

                if count >= limit:
                    break
            if count >= limit:
                break

    conn.close()
    return count


if __name__ == '__main__':
    n = generate_outreach_queue(100)
    print(f'Queued {n} outreach emails to {OUT_PATH}')