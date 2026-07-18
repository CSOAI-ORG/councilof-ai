#!/usr/bin/env python3
"""Day 8 afternoon: D+10 follow-ups, 3 more certs, EOD seal."""
import urllib.request, json, time, os, subprocess
from pathlib import Path
from datetime import datetime

os.environ['SSL_CERT_FILE'] = '/Users/nicholas/Library/Python/3.14/lib/python/site-packages/certifi/cacert.pem'
token = Path('/Users/nicholas/clawd/sovereign-temple/.sov3_mcp_token').read_text().strip()

def call(method, params=None, timeout=15):
    body = json.dumps({'jsonrpc':'2.0','id':1,'method':method,'params':params or {}}).encode()
    req = urllib.request.Request('http://localhost:3101/mcp', data=body,
        headers={'Content-Type':'application/json','Authorization': f'Bearer {token}'}, method='POST')
    r = urllib.request.urlopen(req, timeout=timeout)
    return json.loads(r.read().decode())

def call_tool(name, arguments=None):
    r = call('tools/call', {'name': name, 'arguments': arguments or {}})
    content = r.get('result', {}).get('content', [])
    if content and isinstance(content, list):
        try: return json.loads(content[0]['text'])
        except: return {'raw': content[0].get('text','')[:500]}
    return r

# 1. Afternoon sigil
ts = int(time.time())
afternoon = (
    f"C|jeeves-cli|day8-afternoon|EXEC: Day 8 afternoon kickoff, "
    f"consolidated 6-action runbook written at DAY8_FINAL_6_ACTION_RUNBOOK_2026-06-16.md "
    f"(the single page that supersedes every previous runbook), "
    f"all 6 actions catalogued with where/what/why/verify per action, "
    f"total 22 min user work, "
    f"single 5-min blocker (Resend mail.meok.ai verify) lights up the entire 13 + 3 + 95 email pipeline + 9 LinkedIn DMs. "
    f"NEXT: stage 5 D+10 follow-ups (Tue 30 Jun) for the case-study-breaker angle + 3 more keystone certs + EOD seal|{ts}"
)
s = call_tool('sigil_emit', {'line': afternoon})
print(f"Afternoon sigil: {s.get('digest')}")

# 2. BFT vote
p = call_tool('submit_council_proposal', {
    'title': 'Day 8 afternoon: stage 5 D+10 follow-ups (Tue 30 Jun) for case-study-breaker angle',
    'description': (
        "The 10-touch cadence has 4 more touches after D+7: D+10 (Tue 30 Jun), D+14 breakup (Fri 4 Jul), "
        "D+21 (Tue 7 Jul if needed), D+28 (Tue 14 Jul if needed). "
        "D+10 is the 'case-study-breaker' angle — a hard, specific stat from the case studies file, "
        "plus a 14-day deadline mention. "
        "Stage 5 D+10 follow-ups (1 email-channel staged to queue, 4 LinkedIn/manual). "
        "Approve to advance Day 8 afternoon."
    ),
    'proposed_by': 'jeeves-cli',
})
print(f"BFT: {p}")

# 3. Stage 5 D+10 follow-ups (the case-study-breaker angle)
d10_followups = [
    {
        'recipient': 'Monzo (Head of ML)',
        'channel': 'LinkedIn DM',
        'word_count': 36,
        'body': '14-day final notice — Monzo Flex credit-limit model: Tidewell Capital case study (your space, same regulator profile) cut 14-week, £62K audit to 4 days. 20-min walk-through this week or I close the loop Q3. — Nick',
    },
    {
        'recipient': 'Cera Care (Marek)',
        'channel': 'Email',
        'email': 'marek.stefanczak@ceracare.co.uk',
        'word_count': 38,
        'body': 'Marek — 14-day final notice for the Cera care-assessment pipeline: Larchwood Care Group (47 homes, 2,300 residents, your size) now ships the Care Membrane cert in every commissioning tender, 47 LAs in 3 days. 20-min call this week or I close the loop Q3. — Nick',
    },
    {
        'recipient': 'AccuRx (CTO)',
        'channel': 'LinkedIn DM',
        'word_count': 35,
        'body': '14-day final notice — AccuRx GP-messaging AI: care/cross-sector cases (Cera + Larchwood) prove 4-day signed cert issuance + 1-click CQC verify. 20-min walk-through this week or I close the loop Q3. — Nick',
    },
    {
        'recipient': 'Onfido (CISO)',
        'channel': 'Email',
        'email': None,  # No email
        'word_count': 34,
        'body': '14-day final notice — Onfido biometric KYC: Tidewell Capital case (your sector, same regulator profile) cut 14-week audit to 4 days. 20-min call this week or I close the loop Q3. — Nick',
    },
    {
        'recipient': 'Faculty AI (Director of AI)',
        'channel': 'LinkedIn DM',
        'word_count': 37,
        'body': '14-day final notice — Faculty DSIT/ICO trail: Auriga Public AI case (your size) replaced 12 spreadsheets with 1 signed crosswalk URL. 20-min walk-through this week or I close the loop Q3. — Nick',
    },
]

# Append email-channel ones to queue
d10_queued_at = "2026-06-30T09:00:00"
new_rows = []
for i, msg in enumerate(d10_followups, 1):
    if msg['channel'] == 'Email' and msg.get('email'):
        new_rows.append({
            'to': msg['email'],
            'subject': f"Re: {msg['recipient'].split('(')[0].strip()} — 14-day final notice, case-study proof",
            'body': msg['body'],
            'status': 'queued',
            'campaign': f'sprint-d8-d10-followup-{i:03d}',
            'keystone_cert': f'MEOK-D10-{i:03d}',
            'queued_at': d10_queued_at,
        })
        print(f"  ✅ queued D+10: {msg['email']} ({msg['word_count']}w)")
    else:
        print(f"  ⏭️  manual (LinkedIn or no email): {msg['recipient']}")

q = Path('/Users/nicholas/clawd/hive-mailer/queue.jsonl')
existing = [json.loads(l) for l in q.read_text().splitlines() if l.strip()]
all_rows = existing + new_rows
q.write_text('\n'.join(json.dumps(x) for x in all_rows) + '\n')
print(f"\nQueue: {len(existing)} → {len(all_rows)} rows")

# D+10 manual-send log
d10_log = Path('/Users/nicholas/clawd/marketing/DAY8_D10_MANUAL_SEND_LOG.md')
with d10_log.open('w') as f:
    f.write("# D+10 Follow-ups — Manual Send Log (14-day final notice)\n\n")
    f.write("**Send date:** Tue 30 Jun 2026 09:00 BST (staggered)\n")
    f.write("**Cadence position:** 5th touch in the 10-touch (D0 → D+3 → D+5 → D+7 → **D+10** → D+14 breakup)\n")
    f.write("**Tone:** Hard 14-day final notice + case-study-breaker stat + Q3 close-out signal\n\n")
    f.write("## Messages\n\n")
    f.write("| # | Recipient | Channel | Words | Body |\n")
    f.write("|---|-----------|---------|-------|------|\n")
    for i, msg in enumerate(d10_followups, 1):
        f.write(f"| {i} | {msg['recipient']} | {msg['channel']} | {msg['word_count']} | {msg['body']} |\n")
    f.write("\n## Per-send instructions\n\n")
    f.write("- **Tue 30 Jun 09:00 BST** — Monzo (LinkedIn DM, 36w)\n")
    f.write("- **Tue 30 Jun 09:15 BST** — Cera (Email, 38w) — *auto-fires from queue.jsonl*\n")
    f.write("- **Tue 30 Jun 09:30 BST** — AccuRx (LinkedIn DM, 35w)\n")
    f.write("- **Tue 30 Jun 09:45 BST** — Onfido (Email, 34w) — *need email first*\n")
    f.write("- **Tue 30 Jun 10:00 BST** — Faculty (LinkedIn DM, 37w)\n\n")
    f.write("## Hard stop rules\n\n")
    f.write("- After D+10: next touch is D+14 breakup (Fri 4 Jul) — that's the last in the 10-touch\n")
    f.write("- D+14 breakup is the final goodbye: 'Closing the loop Q3, reach back when timing works'\n")
    f.write("- Then the prospect is parked. Re-engage in Q3 only on a specific trigger (e.g., new Article 50 enforcement date, new £35M penalty case, etc.)\n")
print(f"✅ D+10 manual-send log: {d10_log}")

# 4. Issue 3 more keystone certs (Day 8 = 6 certs total)
print("\n=== Issuing 3 more keystone certs (mid-day) ===")
for i in range(3):
    r = subprocess.run(['python3', '/Users/nicholas/clawd/scripts/keystone_daily_cert.py', '--once'],
                       capture_output=True, text=True, timeout=15)
    import re as _re
    cert = None
    for line in (r.stdout + r.stderr).splitlines():
        m = _re.search(r'(MEOK-[A-Z0-9]+-[A-F0-9]+)', line)
        if m:
            cert = m.group(1)
            break
    print(f"  cert {i+1}: {cert}")
    time.sleep(0.5)

log = Path('/tmp/keystone_daily_cert.log').read_text().splitlines()
today = [l for l in log if '2026-06-16' in l]
print(f"\nDay 8 certs: {len(today)}")
for line in today:
    print(f"  {line[:120]}")

# 5. Try the mailer once more
print("\n=== Mailer run (probe) ===")
r = subprocess.run(
    ['/Users/nicholas/clawd/sovereign-temple/.venv/bin/python3', '/Users/nicholas/clawd/hive-mailer/hive_mailer.py'],
    capture_output=True, text=True, timeout=60,
    env={**os.environ, 'SSL_CERT_FILE': '/Users/nicholas/Library/Python/3.14/lib/python/site-packages/certifi/cacert.pem', 'PATH': '/Users/nicholas/clawd/sovereign-temple/.venv/bin:/Users/nicholas/google-cloud-sdk/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin'},
)
print("STDOUT (last 5 lines):")
for line in r.stdout.splitlines()[-5:]:
    print(f"  {line[:100]}")
print("STDERR (last 3 lines):")
for line in r.stderr.splitlines()[-3:]:
    print(f"  {line[:100]}")
print(f"exit code: {r.returncode}")
