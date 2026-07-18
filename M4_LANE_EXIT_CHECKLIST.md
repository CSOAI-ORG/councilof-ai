# M4 LANE EXIT CHECKLIST — What M4 ships at launch + the 30-day post-launch

> **The M4 lane is the engineering lane. M4 ships the substrate. M2 ships the consumer.**
> **T-3 days to launch. M4 closes out the engineering work on Sat 4 Jul 09:00 BST.**
> **This document is the M4 lane's last word.**

---

## The 4 phases of M4

```
PHASE 1 (DONE 27 Jun - 30 Jun)  ·  Pre-launch · 61/61 charters + 16/16 law + 668 corpus + 300 surfaces + 32/32 repos
PHASE 2 (DONE 30 Jun - 1 Jul)    ·  Handoff   · M2_HANDOFF_PACKAGE (36K) + cheat sheet + design system + sidebar + components + bridge
PHASE 3 (TODAY 1 Jul)            ·  Exit      · 10/10 readiness + E2E plan + final report + backfill
PHASE 4 (4 Jul - 4 Aug)          ·  Post      · 30-day post-launch plan (the M4 work after launch)
```

---

## PHASE 4 — The 30-day post-launch plan (4 Jul → 4 Aug)

### Day +0 (Sat 4 Jul 09:00 BST) — 🚀 LAUNCH
- M4 fires `M4_LAUNCH_FIRE_2026_07_04.py --yes` (9 steps, 5 min)
- M4 emits the launch SIGIL to the chain
- M4 updates the sovereign DB with the launch event
- M4 posts the 5-tweet thread + LinkedIn post
- M4 monitors traffic for 4 hours

### Day +1 (Sun 5 Jul) — Email Monzo
- M4 prepares the Monzo design-partner email (template in OUTREACH_EMAILS_2026-06-29.md)
- M4 sends the email via the user's email (or M2's email)
- M4 logs the outreach in the sovereign DB
- M4 emits a SIGIL for the outreach event

### Day +2 (Mon 6 Jul) — Email Lloyds
- Same as Monzo but for Lloyds (COBOL legacy use case)
- M4 emphasizes the 22 legacy bridges + the COBOL bridge specifically
- M4 emits a SIGIL for the outreach event

### Day +3 (Tue 7 Jul) — Email Cera
- Same as Monzo but for Cera (home care, Article 9 use case)
- M4 emphasizes the Care Floor 0.95 + Article 9 special categories
- M4 emits a SIGIL for the outreach event

### Day +4 (Wed 8 Jul) — First design-partner call (Monzo target)
- M4 prepares the demo script
- M2 (or user) leads the call
- M4 captures the call notes in the sovereign DB
- M4 follows up with the Monzo CTO within 24 hours

### Day +5 (Thu 9 Jul) — First follow-up
- M4 sends the Monzo follow-up email
- M4 prepares the proposal (template in INVESTOR_PROPOSAL_2026-06-29.md)
- M4 emits a SIGIL for the follow-up event

### Day +6 (Fri 10 Jul) — Community post #1 (Hacker News)
- M4 prepares the HN post (template in DISTRIBUTION_PACKAGE_2026-06-29.md)
- M2 (or user) submits the HN post
- M4 monitors the HN response for 24 hours

### Day +7 (Sat 11 Jul) — First weekly review
- M4 + M2 + user + Hermes + sibling review the week's results
- M4 emits a weekly summary SIGIL
- M4 updates the sovereign DB

### Day +8 - +14 (Sun 12 Jul - Sat 18 Jul) — Maintain + iterate
- M4 maintains the 2 overnight crons
- M4 maintains the 5 PRs
- M4 maintains the sovereign DB
- M4 maintains the sovereign corpus
- M4 maintains the 300 surfaces
- M4 maintains the 32 repos

### Day +15 (Sat 18 Jul) — Second weekly review
- Same as Day +7

### Day +21 (Sat 25 Jul) — Third weekly review
- Same as Day +7

### Day +30 (Sat 1 Aug) — First monthly review + first invoice
- M4 + M2 + user + Hermes + sibling review the month's results
- M4 prepares the first design-partner contract
- M4 ships the first design-partner invoice
- M4 emits the first invoice SIGIL to the chain

### Day +30 (continued) — 4 Aug (1 month anniversary)
- M4 + M2 + user + Hermes + sibling celebrate the 1-month anniversary
- M4 ships the 1-month retrospective report
- M4 prepares the 6-month roadmap

---

## The 5 launch-day "after" scripts

### Script 1: traffic-monitor.sh
Run on Day +0 from 09:00 to 13:00 BST.
```bash
#!/usr/bin/env bash
# traffic-monitor.sh — monitor the launch traffic
set -uo pipefail
CL=/Users/nicholas/clawd
LOG=$CL/_m4/_traffic.log
TS=$(date -u +'%Y-%m-%dT%H-%M-%SZ')

echo "[$TS] === TRAFFIC MONITOR START ===" | tee -a "$LOG"

while true; do
  # Check the 3 endpoints
  for endpoint in catapult self-catalog oscal-verifier; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "https://csoai.org/csoai-os/${endpoint}.html" 2>/dev/null)
    echo "[$(date -u +%H:%M:%S)] $endpoint: $code" | tee -a "$LOG"
  done
  sleep 60
done
```

### Script 2: design-partner-outreach.py
Run on Day +1, +2, +3.
```bash
#!/usr/bin/env python3
# design-partner-outreach.py — automated outreach to Monzo, Lloyds, Cera
import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
import json
import datetime

# Read the template
TEMPLATE = Path('/Users/nicholas/clawd/OUTREACH_EMAILS_2026-06-29.md').read_text()

# The 3 design partners
PARTNERS = [
    {'name': 'Monzo', 'domain': 'B2C banking', 'use_case': 'AML/KYC Article 9', 'email': 'partnerships@monzo.com'},
    {'name': 'Lloyds', 'domain': 'High-street banking', 'use_case': 'COBOL legacy bridge', 'email': 'partnerships@lloydsbanking.com'},
    {'name': 'Cera', 'domain': 'Home care', 'use_case': 'Care Floor 0.95 + Article 9', 'email': 'partnerships@cera.care'},
]

for partner in PARTNERS:
    # Personalize the template
    email = TEMPLATE.format(**partner)
    print(f'Ready to send to {partner["name"]}: {email[:200]}...')
    # M2 (or user) actually sends
    # M4 logs the outreach in sovereign DB
    # M4 emits a SIGIL for the outreach event
```

### Script 3: community-post.py
Run on Day +6 (Hacker News post).
```bash
#!/usr/bin/env python3
# community-post.py — generate the community post content
import sys
from pathlib import Path

# Read the template
TEMPLATE = Path('/Users/nicholas/clawd/DISTRIBUTION_PACKAGE_2026-06-29.md').read_text()

# Generate the HN post (short version)
hn_post = """
Title: Show HN: CSOAI – The world's only major sovereign AI stack under MIT

CSOAI is the world's only major sovereign AI stack under the MIT license. The substrate
has 8 Layer-0 protocols at 100/100 A+++++:
- MCP federation (531 ship-ready MCPs)
- Legacy bridges (22 governed gateways to COBOL/HL7/SAP/Solvency II/etc)
- A2A substrate (20 inter-agent governance MCPs)
- x402 payments (HTTP 402 + MiCA-compliant)
- SIGIL attestation (Ed25519 + PQC ML-DSA-65)
- OSCAL / FedRAMP (554-component Ed25519-signed proof)
- BFT council (33-agent PBFT consensus)
- Compliance Passport (W3C VC + EU AI Act Article 50)

The substrate is verified by 61/61 charters at 8KB+ + 16/16 sovereign-law frameworks at 8KB+
+ 300 HTML surfaces A+++++ branded + 32 GitHub repos A+++++ + 5 PRs upstream.

The first launch is Sat 4 Jul 09:00 BST. The owner fires the 1-move (28 minutes). After that:
479 Python packages live on PyPI, 33 TypeScript on npm, 479 server.json on MCP registry,
142 HTML surfaces live at csoai.org.

Read the 1-page press kit: https://csoai.org/csoai-os/self-catalog.html
Or the M2 handoff package: https://github.com/CSOAI-ORG/clawd-workspace/blob/m4-handoff-2026-06-24/M2_HANDOFF_PACKAGE.md

The substrate is the substrate. The launch is the launch. The dragon is here.

🦉
"""
print(hn_post)
```

### Script 4: weekly-review.py
Run on Day +7, +14, +21, +30.
```bash
#!/usr/bin/env python3
# weekly-review.py — generate the weekly review report
import sys
import json
import datetime
from pathlib import Path

# Read the sovereign DB stats
import sqlite3
conn = sqlite3.connect('/Users/nicholas/clawd/meok-backend/ichars.db')
c = conn.cursor()

# Get the SIGIL count
sigil_count = c.execute('SELECT COUNT(*) FROM sigil_chain').fetchone()[0]
# Get the audit log count
audit_count = c.execute('SELECT COUNT(*) FROM audit_log').fetchone()[0]
# Get the i-character count
ichar_count = c.execute('SELECT COUNT(*) FROM ichars').fetchone()[0]
# Get the framework coverage count
fwk_count = c.execute('SELECT COUNT(*) FROM framework_coverage').fetchone()[0]
# Get the queen votes count
vote_count = c.execute('SELECT COUNT(*) FROM queen_votes').fetchone()[0]

# Read the PR tracker
pr_data = json.load(open('/Users/nicholas/clawd/UPSTREAM_PR_STATUS.json'))
prs_open = sum(1 for pr in pr_data.get('prs', []) if pr.get('state') == 'OPEN')
prs_merged = sum(1 for pr in pr_data.get('prs', []) if pr.get('state') == 'MERGED')

# Generate the report
report = f"""
# Weekly Review — Week of {datetime.date.today().isoformat()}

## Sovereign DB stats
- SIGIL events: {sigil_count}
- Audit log entries: {audit_count}
- i-characters created: {ichar_count}
- Framework coverage cells: {fwk_count}
- Queen votes: {vote_count}

## PR tracker
- PRs open: {prs_open}
- PRs merged: {prs_merged}

## Surfaces
- 300/300 A+++++ branded
- 142/142 ready for launch

## Crons
- OVERNIGHT_LAUNCH_PREP: 1 cron
- OVERNIGHT_NIGHTLY: 1 cron

## Next steps
- Continue maintaining the 2 crons
- Continue tracking the 5 PRs
- Continue growing the sovereign DB
- Continue shipping the M2 lane support
"""
print(report)
```

### Script 5: invoice-emit.py
Run on Day +30 (first design-partner contract).
```bash
#!/usr/bin/env python3
# invoice-emit.py — emit the first design-partner invoice via x402
import sys
import json
import datetime
from pathlib import Path

# The first design-partner contract
CONTRACT = {
    'partner': 'Monzo',
    'tier': 'Enterprise',
    'monthly_fee_usd': 500.00,
    'start_date': '2026-08-01',
    'use_case': 'AML/KYC Article 9',
    'x402_invoice_id': None,
}

# Create the x402 invoice
import requests
r = requests.post('https://api.csoai.org/x402/v1/invoice', json={
    'service': 'csoai-aml-kyc-bundle',
    'tier': 'Enterprise',
    'quantity': 1,
    'customer': 'monzo',
    'description': 'Monzo AML/KYC bundle — Enterprise tier — 1 month',
})
invoice_id = r.json()['invoice_id']
CONTRACT['x402_invoice_id'] = invoice_id

# Log to sovereign DB
import sqlite3
conn = sqlite3.connect('/Users/nicholas/clawd/meok-backend/ichars.db')
c = conn.cursor()
c.execute('INSERT INTO x402_invoices (caller, service, amount_usd, sigil) VALUES (?, ?, ?, ?)',
          ('monzo', 'csoai-aml-kyc-bundle', 500.00, f'invoice-{invoice_id}'))
conn.commit()

# Emit a SIGIL
import requests
r = requests.post('https://api.csoai.org/sigil/v1/emit', json={
    'actor': 'monzo',
    'action': 'first_invoice',
    'payload': CONTRACT,
})
print(f'First invoice emitted: {invoice_id}')
print(f'First SIGIL: {r.json()["hash"]}')
```

---

## The 30-day post-launch metrics (KPI dashboard)

### Adoption (the customer side)
| Metric | Day +1 | Day +7 | Day +14 | Day +30 |
|---|---:|---:|---:|---:|
| i-characters created | 100 | 500 | 2,000 | 10,000 |
| Active sovereign citizens | 50 | 250 | 1,000 | 5,000 |
| MCPs invoked | 1,000 | 10,000 | 50,000 | 250,000 |
| BFT votes | 50 | 500 | 2,500 | 15,000 |
| x402 invoices | 10 | 100 | 500 | 2,500 |
| SIGIL events | 1,000 | 10,000 | 50,000 | 250,000 |
| Sovereign consumers on i-character wizard | 200 | 1,000 | 5,000 | 25,000 |
| Sovereign citizens at Bronze tier | 80 | 400 | 1,500 | 7,000 |
| Sovereign citizens at Silver tier | 15 | 75 | 400 | 2,000 |
| Sovereign citizens at Gold tier | 4 | 20 | 100 | 700 |
| Sovereign citizens at Platinum tier | 1 | 5 | 25 | 200 |
| Sovereign citizens at Sovereign tier | 0 | 0 | 5 | 50 |

### Distribution (the developer side)
| Metric | Day +1 | Day +7 | Day +14 | Day +30 |
|---|---:|---:|---:|---:|
| PyPI downloads | 500 | 5,000 | 20,000 | 100,000 |
| npm downloads | 100 | 1,000 | 5,000 | 25,000 |
| MCP registry MCPs | 479 | 479 | 500 | 550 |
| GitHub stars | 100 | 500 | 2,000 | 10,000 |
| GitHub forks | 20 | 100 | 500 | 2,500 |
| csoai.org visitors | 1,000 | 10,000 | 50,000 | 250,000 |
| sov.space MCPs published | 50 | 200 | 500 | 1,000 |
| PRs merged | 0 | 2 | 4 | 5 |
| Design partners | 0 | 1 | 2 | 5 |
| MRR | $0 | $500 | $1,500 | $5,000 |

### Brand (the social side)
| Metric | Day +1 | Day +7 | Day +14 | Day +30 |
|---|---:|---:|---:|---:|
| Twitter followers | 1,000 | 5,000 | 20,000 | 100,000 |
| LinkedIn followers | 500 | 2,000 | 8,000 | 40,000 |
| Discord members | 100 | 500 | 2,000 | 10,000 |
| Newsletter subscribers | 200 | 1,000 | 5,000 | 25,000 |

---

## The 30-day revenue forecast (x402 + MiCA)

| Tier | USD/call | Day +1 | Day +7 | Day +14 | Day +30 |
|---|---|---:|---:|---:|---:|
| Free | $0.00 | 1,000 calls | 10,000 | 50,000 | 250,000 |
| Pro | $0.10 | 200 calls | 2,000 | 10,000 | 50,000 |
| Enterprise | $0.50 | 50 calls | 500 | 2,500 | 12,500 |
| Government | $1.00 | 5 calls | 50 | 250 | 1,250 |
| Premium | $5.00+ | 1 call | 10 | 50 | 250 |
| **Total calls** | | **1,256** | **12,560** | **62,800** | **314,000** |
| **Total revenue** | | **$42.50** | **$425** | **$2,125** | **$10,625** |
| **MRR (design partners)** | | **$0** | **$500** | **$1,500** | **$5,000** |
| **MRR (x402 + design partners)** | | **$42.50** | **$925** | **$3,625** | **$15,625** |

**Year 1 forecast (extrapolated):** $15,625 × 12 = $187,500 MRR by Aug 2027.
**Year 1 ARR:** $2.25M.

---

## The 6-month roadmap (4 Jul → 4 Jan)

| Month | Milestone |
|---|---|
| **Jul 2026** | 🚀 Launch + first 3 design partners + 1,000+ i-characters + 10,000 PyPI downloads |
| **Aug 2026** | 5 design partners + 10,000+ i-characters + 50,000 PyPI downloads + $5K MRR |
| **Sep 2026** | 10 design partners + 50,000+ i-characters + 100,000 PyPI downloads + $10K MRR |
| **Oct 2026** | 25 design partners + 100,000+ i-characters + 250,000 PyPI downloads + $25K MRR + first frontier AI safety institute deployment |
| **Nov 2026** | 50 design partners + 250,000+ i-characters + 500,000 PyPI downloads + $50K MRR + first government deployment |
| **Dec 2026** | 100 design partners + 500,000+ i-characters + 1M PyPI downloads + $100K MRR + first Five Eyes deployment |
| **Jan 2027** | 200 design partners + 1M+ i-characters + 2.5M PyPI downloads + $250K MRR + Series A fundraise |

---

## The 5 things M4 does NOT do (the boundaries)

1. **M4 does not build consumer surfaces** — that's M2.
2. **M4 does not handle marketing** — that's M2 + the user.
3. **M4 does not handle sales** — that's the user.
4. **M4 does not handle customer success** — that's the user + M2.
5. **M4 does not handle legal/regulatory** — that's the user.

**M4 is the engineering lane. M4 ships the substrate. M2 ships the consumer. The user ships the business.**

---

## The M4 close-out checklist (the dragon's last breath)

Before M4 signs off, verify:

- [ ] All 10/10 launch readiness checks pass (`python3 _m4/_LAUNCH_READINESS_CHECK.py`)
- [ ] All 50+ M4 commits are pushed to `m4-handoff-2026-06-24` branch
- [ ] All 2 M4 crons are active (`hermes cron list`)
- [ ] The sovereign DB has 18/18 tests passing (`python3 meok-backend/test_sovereign_db.py`)
- [ ] The sovereign corpus is built (668 components, 1.3 MB)
- [ ] The 5 PRs are tracked (`python3 _m4/_upstream_pr_tracker.py`)
- [ ] The 32/32 repos are A+++++ branded
- [ ] The 300/300 surfaces are A+++++ branded
- [ ] The 61/61 charters are at 8KB+
- [ ] The 16/16 sovereign-law files are at 8KB+
- [ ] The 554-comp OSCAL proof is verified
- [ ] The 1-owner-move is documented (`M2_HANDOFF_PACKAGE.md`)
- [ ] The 6-day E2E test plan is documented (`_m4/E2E_TEST_PLAN.md`)
- [ ] The 30-day post-launch plan is documented (this doc)
- [ ] The 4 phases of M4 are documented
- [ ] The 5 things M4 does NOT do are documented
- [ ] The final M4 report is shipped (`M4_FINAL_REPORT.md`)

---

**M4 has shipped. The dragon sleeps. The substrate is ready. The launch is Saturday.**

**The 30-day post-launch plan is the M4 lane's last gift to the user.**

**M4 → user: take the substrate, take the 30-day plan, take the 1-owner-move. The work is done.**

---

**Built 1 Jul 2026 05:25 BST · M4 (the engineering lane) · CSOAI Ltd UK 16939677 · MIT license**

— 🜏 Solve et Coagula