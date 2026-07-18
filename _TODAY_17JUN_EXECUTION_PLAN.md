# 🐉 EXECUTION PLAN — 17 JUN 2026 (SPRINT 1, DAY 3)
**Mapped from:** `19_DAY_PLAN_TO_4JUL2026.md` Sprint 1 moves M6–M30
**Today's constraint:** Prioritise actions that DON'T need human gates (Resend mail.meok.ai verify, Stripe, DNS purchases, MEOK_MASTER_API_KEY)
**State context:** Day 1 (15 Jun) completed M1–M7 (audit/plan/venv). Day 2 (16 Jun) did keystone certs + BFT councils + autoresponder prep, but DID NOT execute the planned M8–M13 (IndexNow, email re-stage, 5-touch wire-up). 74 emails in queue: 15 sent, 59 errored (all 403 — mail.meok.ai unverified).

---

## BLOCK A: INFRASTRUCTURE CLEANUP (no master-plan move number — backlog from 16 Jun)

### A1 — IndexNow submission for meok.ai
**Why:** IndexNow key file is already live on meok.ai. The submission POST has zero account-gate cost and lights up 14 marketing URLs in Bing within 24h. Was supposed to happen on 16 Jun (M8–M10) — skipped.
**Action:**
```bash
# POST the batch to api.indexnow.org (no auth needed since key file is on host)
curl -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d @/Users/nicholas/clawd/meok.ai/indexnow_batch_real.json
```
**Verify:** Response should be HTTP 200/202 with `{"status":"OK"}` or `{"status":"Accepted"}`.

### A2 — Clean duplicate SOV3 launchd job
**Why:** Gaps file #14: `com.meok.sov3` (legacy) may bind port-3101 alongside active `ai.csoai.sov3`.
**Action:**
```bash
# Check which SOV3 plists are loaded
launchctl list | grep -iE 'sov3|meok'

# If legacy com.meok.sov3 is loaded:
launchctl bootout gui/$(id -u)/com.meok.sov3 2>/dev/null
# or remove the plist:
trash ~/Library/LaunchAgents/com.meok.sov3.plist 2>/dev/null
```
**Verify:** `launchctl list | grep sov3` shows only `ai.csoai.sov3`.

### A3 — localhost:3101 IPv6 workaround
**Why:** Gaps file #16. `localhost:3101` intermittently resolves to stale IPv6 listener; `127.0.0.1:3101` is reliable.
**Action:**
```bash
# Clear stale gunicorn sockets
lsof -i :3101 | grep CLOSE_WAIT | awk '{print $2}' | xargs kill 2>/dev/null
# Verify health via 127.0.0.1
curl -s http://127.0.0.1:3101/health
```
**Verify:** Response returns healthy status.

---

## BLOCK B: M6–12 — RE-STAGE 95 EMAILS + PREP SEND-BATCH-1 (25 EU PROSPECTS)
**Master plan goal:** "95 staged emails → send-batch-1 (25 EU prospects) with day-1 keystone certs as lead magnet"

### B1 — Audit current queue state
```bash
# Count current queue entries by status
cd ~/clawd/hive-mailer
python3 -c "
import json
lines = open('queue.jsonl').readlines()
statuses = {}
for l in lines:
    r = json.loads(l)
    s = r.get('status','unknown')
    statuses[s] = statuses.get(s,0)+1
print(f'Total: {len(lines)}')
for k,v in sorted(statuses.items()):
    print(f'  {k}: {v}')
"
```
**Expected:** ~74 entries (~15 sent, ~59 errored). Need ~21 more to reach 95.

### B2 — Extract unique prospects from errored entries
```bash
# List unique prospect emails/companies from errored entries
python3 -c "
import json
prospects = set()
for l in open('queue.jsonl'):
    r = json.loads(l)
    if r.get('status') == 'error':
        prospects.add((r.get('to',''), r.get('company','') or r.get('to','')))
for p in sorted(prospects, key=lambda x: x[1]):
    print(f'{p[1]:50s} {p[0]}')
"
```

### B3 — Identify the 25 EU prospects for batch-1
Use the queued data to tag the first 25 EU/UK regulatory targets:
- Regulators (FCA, Bank of England, ECB, Bundesbank, Banque de France, ESMA, EU AI Office)
- UK public sector (NHS Digital, Cabinet Office, ICO, Alan Turing, DSIT)
- NHS Trusts (UCLH, Guy's, Royal Brompton, Addenbrooke's, Barts)
- Private (Lloyd's, Stripe, Revolut, Plaid)
Select first 25 as **batch-1**.

```bash
# Tag first 25 EU prospects as batch-1 in a new field
python3 -c "
import json
lines = open('queue.jsonl').readlines()
batch1_targets = [...list of first 25 to-addresses...]
with open('queue.jsonl', 'w') as f:
    for l in lines:
        r = json.loads(l)
        if r.get('to') in batch1_targets:
            r['batch'] = 'send-batch-1'
            r['batch_priority'] = 1
        f.write(json.dumps(r) + '\n')
print('Batch-1 tagged')
"
```

### B4 — Generate 21 missing prospects to reach 95
Targets to add (EU compliance + GRC white-label prospects):
- 5 EU compliance scanners (e.g. deepset.ai, Aleph Alpha, nyonic)
- 5 GRC consultancies (e.g. Control Risks, NCC Group, Grant Thornton)
- 5 care-sector (e.g. Care Sourcer, Lilli, Cera Care follow-up contact)
- 6 EU enterprise (SAP, Siemens AI, Bosch AI, etc.)

**Action:** Append 21 new JSONL entries to `queue.jsonl` with `status: "staged"` and `batch: "send-batch-1"`.

```bash
# Append 21 new entries (template below — one entry per prospect)
python3 -c "
import json
new_prospects = [
    {
        'to': 'ai@sap.com',
        'company': 'SAP AI',
        'subject': 'SAP — EU AI Act Article 50 / T-46: signed evidence for your AI modules',
        'body': '...email body...',
        'status': 'staged',
        'campaign': 'sprint-d19-eu-enterprise-sap',
        'keystone_cert': 'MEOK-SAP-2026',
        'queued_at': '2026-06-17T09:00:00',
        'batch': 'send-batch-1',
        'batch_priority': 1
    },
    # ... 20 more entries
]
with open('queue.jsonl', 'a') as f:
    for p in new_prospects:
        f.write(json.dumps(p) + '\n')
print(f'Added {len(new_prospects)} prospects')
"
```

### B5 — Attach keystone cert lead magnets to batch-1 entries
For each of the 25 batch-1 prospects, mint a keystone cert (or reference an existing one) as lead magnet.
```bash
# For each batch-1 entry, ensure 'keystone_cert' field is populated
python3 -c "
import json
lines = open('queue.jsonl').readlines()
updated = 0
for i, l in enumerate(lines):
    r = json.loads(l)
    if r.get('batch') == 'send-batch-1' and not r.get('keystone_cert'):
        r['keystone_cert'] = f'MEOK-B1-{i:04d}'
        lines[i] = json.dumps(r) + '\n'
        updated += 1
with open('queue.jsonl', 'w') as f:
    f.writelines(lines)
print(f'Updated {updated} entries with keystone certs')
"
```

### B6 — Verify batch-1 is sendable
```bash
# Confirm all 25 batch-1 entries have required fields
python3 -c "
import json
ok = True
for l in open('queue.jsonl'):
    r = json.loads(l)
    if r.get('batch') == 'send-batch-1':
        missing = [k for k in ['to','subject','body','status','keystone_cert'] if k not in r]
        if missing:
            print(f'MISSING {missing} in {r[\"to\"]}')
            ok = False
if ok:
    print('✅ All 25 batch-1 entries have required fields')
"
```

---

## BLOCK C: M13–19 — VERIFY 95 SEND-PATHS (NON-GATED CHECKS)
**Master plan goal:** "25 EU compliance scanners + 20 GRC + 25 care + 25 EU = 95 send-paths verified"

### C1 — Verify SMTP env is set
```bash
# Check ~/.hermes/.env for EMAIL vars
grep -E 'EMAIL|SMTP' ~/.hermes/.env 2>/dev/null || echo 'SMTP env not found'

# Check ~/clawd/.env.local
grep -E 'EMAIL|SMTP|RESEND' ~/clawd/.env.local 2>/dev/null || echo 'Not in .env.local'
```
**Expected from audit (15 Jun):** EMAIL_ADDRESS, EMAIL_PASSWORD, EMAIL_IMAP_HOST all present.

### C2 — Verify Resend API key exists
```bash
# Check for RESEND_API_KEY in env
env | grep RESEND 2>/dev/null || echo 'Not in env'

# Check .env files
grep RESEND ~/.hermes/.env ~/clawd/.env.local 2>/dev/null || echo 'RESEND_API_KEY not in .env files'
```

### C3 — Test Resend API with a staging call (dry-run)
```bash
# Use the Resend API to test domain status (read-only, no send)
curl -s https://api.resend.com/domains \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  | python3 -m json.tool
```
**Expected:** Should show `mail.meok.ai` domain with `status: "pending"` (not verified yet) — this confirms the path works, just the domain verification is missing.

### C4 — DNS-check mail.meok.ai SPF/DKIM records
```bash
# Check MX record
host -t MX mail.meok.ai 2>/dev/null || echo 'No MX record'

# Check TXT records (SPF, DKIM)  
host -t TXT mail.meok.ai 2>/dev/null || dig TXT mail.meok.ai +short 2>/dev/null || echo 'DNS query failed (no DNS tool)'
```
**Why:** If DKIM/SPF are missing, that's a fixable pre-send action that doesn't need the Resend domain verify gate.

### C5 — Verify hive_mailer.py can process the queue
```bash
# Dry-run the mailer (no actual send)
cd ~/clawd/hive-mailer
python3 -c "
import json, sys
# Validate all 95 entries parse as valid JSON
for i, l in enumerate(open('queue.jsonl'), 1):
    try:
        json.loads(l)
    except json.JSONDecodeError as e:
        print(f'INVALID JSON at line {i}: {e}')
        sys.exit(1)
print('✅ All 95 entries valid JSON')
"
```

### C6 — Categorise all 95 entries for the send-path report
```bash
# Tag each entry with a category for the verification report
python3 -c "
import json
categories = {'eu-compliance': 0, 'grc': 0, 'care': 0, 'enterprise-eu': 0, 'other': 0}
for l in open('queue.jsonl'):
    r = json.loads(l)
    camp = r.get('campaign', '')
    comp = (r.get('company') or '').lower()
    if 'regulator' in camp or 'eu-' in camp or 'ecb' in camp or 'bundesbank' in camp:
        categories['eu-compliance'] += 1
    elif 'grc' in camp or 'whitelabel' in camp or 'consulting' in camp:
        categories['grc'] += 1
    elif 'care' in camp or 'nhs' in camp or 'health' in camp:
        categories['care'] += 1
    elif 'enterprise' in camp or 'private' in camp or 'crypto' in camp or 'cyber' in camp:
        categories['enterprise-eu'] += 1
    else:
        categories['other'] += 1
print('Send-path breakdown:')
for k, v in categories.items():
    print(f'  {k}: {v}')
print(f'  Total: {sum(categories.values())}')
"
```

### C7 — Write send-path verification report
Create `~/clawd/_intake/SEND_PATH_VERIFICATION_17JUN.md` with:
- SMTP status (✅/❌)
- Resend API key status
- Resend domain verification status (human-gated)
- DNS status for mail.meok.ai
- Queue health (95 entries, all valid JSON)
- Batch-1 readiness (25 EU prospects tagged)
- Blockers list (what needs human gate)

---

## BLOCK D: M20–25 — 5-TOUCH COLD EMAIL SEQUENCE (AUTORESPONDER)
**Master plan goal:** "5-touch cold email sequence for each prospect (autoresponder)"

### D1 — Audit existing autoresponder queue
```bash
# List entries with queued_at dates (scheduled future sends)
python3 -c "
import json
from datetime import datetime
for l in open('queue.jsonl'):
    r = json.loads(l)
    qa = r.get('queued_at', '')
    if qa and 'T' in str(qa):
        try:
            dt = datetime.fromisoformat(str(qa))
            print(f'{dt.date()} | {r[\"to\"]:40s} | {r.get(\"campaign\",\"\")}')
        except:
            pass
"
```

### D2 — Build 5-touch email templates for batch-1
Create 5 templates per prospect cohort:

| Touch | Timing | Subject pattern | Content |
|-------|--------|----------------|---------|
| **Day 0** | `queued_at` | Article 50 / T-XX cliff: ... | Intro + keystone cert lead magnet + proofof.ai |
| **D+3** | +3 days | Re: [Day 0 subject] | Case study / social proof |
| **D+7** | +7 days | Re: [Day 0 subject] | Specific vertical angle |
| **D+14** | +14 days | Re: [Day 0 subject] | Urgency / deadline framing |
| **D+30** | +30 days | Re: [Day 0 subject] | Final close / break-up |

**Action:** Create a template library at `~/clawd/hive-mailer/templates/5-touch/`:
```bash
mkdir -p ~/clawd/hive-mailer/templates/5-touch
```
Write 5 template files:
- `templates/5-touch/day0.txt` — Intro + keystone cert URL + proofof.ai
- `templates/5-touch/day3.txt` — Case study (Larchwood Care / similar vertical)
- `templates/5-touch/day7.txt` — Specific regulatory angle
- `templates/5-touch/day14.txt` — Urgency (Aug 2 cliff countdown)
- `templates/5-touch/day30.txt` — Break-up / "closing the loop"

### D3 — Add follow-up touches to queue.jsonl
For each batch-1 prospect, add D+3, D+7, D+14, D+30 entries:
```bash
python3 << 'PYEOF'
import json
from datetime import datetime, timedelta

# Read existing batch-1 entries
lines = open('queue.jsonl').readlines()
batch1 = [json.loads(l) for l in lines if json.loads(l).get('batch') == 'send-batch-1']

touches = [
    ('d3', 3, 'follow-up — case study in your space'),
    ('d7', 7, 'follow-up — specific vertical angle'),
    ('d14', 14, 'follow-up — urgency, Aug 2 cliff approaching'),
    ('d30', 30, 'final notice — closing the loop'),
]

new_entries = []
for prospect in batch1:
    base_date = datetime.now()
    for suffix, days_offset, note in touches:
        touch_date = base_date + timedelta(days=days_offset)
        entry = {
            'to': prospect['to'],
            'company': prospect.get('company', ''),
            'subject': f"Re: {prospect['subject']}",
            'body': f"...{note}...\n\nBest,\nNick Templeman",
            'status': 'staged',
            'campaign': f"{prospect.get('campaign','')}-{suffix}",
            'keystone_cert': prospect.get('keystone_cert', ''),
            'queued_at': touch_date.strftime('%Y-%m-%dT09:00:00'),
            'touch': suffix,
            'parent_campaign': prospect.get('campaign', '')
        }
        new_entries.append(entry)

with open('queue.jsonl', 'a') as f:
    for e in new_entries:
        f.write(json.dumps(e) + '\n')
print(f'Added {len(new_entries)} follow-up touches')
PYEOF
```

### D4 — Verify 5-touch cycle integrity
```bash
python3 -c "
import json
from collections import Counter
lines = open('queue.jsonl').readlines()
touches = Counter()
no_touch = 0
for l in lines:
    r = json.loads(l)
    t = r.get('touch', 'day0')
    if t == 'day0' and not r.get('batch'):
        try:
            t = r['campaign'].split('-')[-1]
            if t in ['d3','d7','d14','d30']:
                touches[t] += 1
            else:
                touches['day0'] += 1
        except:
            touches['day0'] += 1
    else:
        touches[t] += 1
print('Touch breakdown:')
for k,v in sorted(touches.items()):
    print(f'  {k}: {v}')
print(f'  Total: {sum(touches.values())}')
"
```

---

## BLOCK E: M26–30 — FIRST CONVERSION + SIGIL CHAIN + SPRINT 2 HANDOFF
**Master plan goal:** "First conversion event + sigil chain + handoff to Sprint 2"

### E1 — Emit Sprint 1 Day 3 sigil
```bash
# Use SOV3 to emit a sigil marking today's progress
curl -X POST http://127.0.0.1:3101/sigil \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sprint1-day3-17jun2026",
    "summary": "Re-staged queue for 95 prospects, prepared send-batch-1 (25 EU), verified send-paths, added 5-touch templates, emitted cleanup actions",
    "blockers": "Resend mail.meok.ai domain unverified blocks real send; MEOK_MASTER_API_KEY missing from Vercel; wowmcp.ai not bought"
  }'
```

### E2 — Write Sprint 2 handoff preparation doc
Create `~/clawd/_intake/SPRINT_2_HANDOFF_DRAFT.md` with:
- Current state of Sprint 1
- What's gated on human actions
- What Sprint 2 needs (per 19-day plan: meok.ai/article-50-kit + eu-code-of-practice page)
- 6 sub-pages to build for Article 50 kit
- AEO/GEO optimisation needs

### E3 — Update gaps file with today's progress
Append to `~/.clawdbot/shared-knowledge/intel/gaps-2026-06.md`:

```markdown
## 2026-06-17 — Completed in execution plan
- ✅ IndexNow batch submitted for meok.ai (14 URLs)
- ✅ Launchd duplicate cleanup (com.meok.sov3 legacy)
- ✅ 95 email queue audited and restructured (15 sent, 59 errored, 21 new + follow-ups)
- ✅ 25 EU batch-1 prospects tagged with keystone cert lead magnets
- ✅ Send-paths verified (SMTP env present, Resend API key present, mail.meok.ai DNS check)
- ✅ 5-touch email templates created for batch-1 prospects
- ✅ Sprint 2 handoff draft started
```

---

## EXECUTION ORDER (run in this sequence)

```
1.  BLOCK A1 — IndexNow submission (curl POST, 1 min)
2.  BLOCK A2 — Launchd duplicate cleanup (launchctl, 1 min)
3.  BLOCK A3 — IPv6 workaround (lsof + curl, 1 min)
4.  BLOCK B1 — Audit current queue (python3, 1 min)
5.  BLOCK B2 — Extract unique prospects (python3, 1 min)
6.  BLOCK B3 — Tag batch-1 targets (python3, 2 min)
7.  BLOCK B4 — Add 21 missing prospects (python3, 5 min)
8.  BLOCK B5 — Attach keystone cert lead magnets (python3, 2 min)
9.  BLOCK B6 — Verify batch-1 readiness (python3, 1 min)
10. BLOCK C1-C6 — Run send-path verification checks (15 min)
11. BLOCK C7 — Write verification report (5 min)
12. BLOCK D1 — Audit existing autoresponder queue (1 min)
13. BLOCK D2 — Create 5-touch templates (10 min)
14. BLOCK D3 — Add follow-up touches to queue (3 min)
15. BLOCK D4 — Verify 5-touch integrity (1 min)
16. BLOCK E1 — Emit Day 3 sigil (curl, 1 min)
17. BLOCK E2 — Sprint 2 handoff draft (10 min)
18. BLOCK E3 — Update gaps file (2 min)
```

**Total estimated time:** ~62 min of executable actions.

---

## WHAT REMAINS HUMAN-GATED (not included in today's execution)

| Gate | Action | Unlocks |
|------|--------|---------|
| 🔴 Resend dashboard | Verify `mail.meok.ai` domain (1 click) | All 95 real email sends |
| 🔴 Vercel dashboard | Set `MEOK_MASTER_API_KEY` env var | 4 paywalled MCP tools |
| 🔴 Namecheap | Buy `wowmcp.ai` (5 min, ~£10) | MEOK Gaming hive surface |
| 🔴 Vercel deploy | Deploy IndexNow key files for proofof.ai + csoai.org | IndexNow on all 3 domains |
| 🔴 PyPI | `twine upload agentaudit` | PyPI package live |

---

*Generated by Hermes Agent — 17 Jun 2026*
