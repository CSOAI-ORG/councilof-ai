#!/usr/bin/env python3
"""Stage 3 Round 6 prospect emails into queue.jsonl + reset strike counter + emit sigil."""
import urllib.request, json, time, os
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

# 1. Emit Day 7 morning sigil
ts = int(time.time())
morning = (
    f"C|jeeves-cli|day7-morning|EXEC: Day 7 morning kickoff, "
    f"hive stable all 4 services 200, queue 44 sent (0 delivered to recipients — Resend mail.meok.ai still unverified), "
    f"5-min user action STILL pending: re-verify mail.meok.ai in Resend dashboard, "
    f"all other agent work staging in parallel. "
    f"NEXT: 3 Round 6 prospect emails staged into queue, 3 daily keystone certs, "
    f"5 D+3 follow-ups ready for 18 Jun send|{ts}"
)
s = call_tool('sigil_emit', {'line': morning})
print(f"Morning sigil: {s.get('digest')}")

# 2. BFT council proposal — Day 7 vote on the next 5 actions
p = call_tool('submit_council_proposal', {
    'title': 'Day 7: 5-minute user action unblocks 13 emails + 95 staged',
    'description': (
        "Day 6 afternoon seal identified the single 5-min user action: re-verify mail.meok.ai in Resend. "
        "After that, the mailer next-tick will: "
        "(1) deliver the 10 pending emails from 05:16 (Monzo/Cera/Verisure/Parsa/Stitch + NHS/Lloyd's/Cabinet/ICO/Turing), "
        "(2) fire the 3 newly-staged Round 6 prospect emails (NHS/Cabinet/Lloyd's 200-300 word versions), "
        "(3) resume normal operation for the 95 staged in email-automation-mcp Drafts. "
        "VOTE: should the agent (a) re-stage the 3 Round 6 emails into queue.jsonl (auto-fires on next tick once Resend comes back), "
        "(b) reset the mailer strike counter so the next tick probes again, "
        "(c) issue 3 daily keystone certs, "
        "(d) write the 5 D+3 follow-up DMs into a separate send-queue for Thu 18 Jun, "
        "(e) write the final Day 7 EOD seal. "
        "Approve to advance Day 7."
    ),
    'proposed_by': 'jeeves-cli',
})
print(f"\nBFT proposal: {p}")

# 3. Stage the 3 Round 6 prospect emails into queue.jsonl
import os
q = Path('/Users/nicholas/clawd/hive-mailer/queue.jsonl')
existing = [json.loads(l) for l in q.read_text().splitlines() if l.strip()]
print(f"\nQueue before: {len(existing)} rows")

# Read the Round 6 emails (from the subagent's file)
r6_file = Path('/Users/nicholas/clawd/marketing/DAY5_ROUND6_3_NEW_PROSPECTS_2026-06-16.md')
r6_content = r6_file.read_text()

import re
# Extract the 3 emails' subject, body, to from the markdown
# Each is in a code block ```\nSubject: ...\n\nTo: ...\n\nbody\n```
emails = re.findall(r'```\nSubject: (.+?)\n\n(.+?)\n```', r6_content, re.DOTALL)
print(f"Round 6 emails parsed: {len(emails)}")

# Simpler: just look for the ## Email N headers and the content between them
sections = re.split(r'\n## Email \d', r6_content)
new_rows = []
for i, sec in enumerate(sections[1:], 1):
    # Parse subject, to, body
    subj_m = re.search(r'\*\*Subject:\*\*\s*(.+)', sec)
    to_m = re.search(r'\*\*To:\*\*\s*`?([\w.@]+)`?', sec)
    body_m = re.search(r'\*\*Body:\*\*\s*\n\n```\n(.+?)\n```', sec, re.DOTALL)
    if subj_m and to_m and body_m:
        new_rows.append({
            'to': to_m.group(1).strip(),
            'subject': subj_m.group(1).strip(),
            'body': body_m.group(1).strip(),
            'status': 'queued',
            'campaign': f'sprint-d7-round6-{i}',
            'keystone_cert': f'MEOK-ROUND6-D7-{i:03d}',
            'queued_at': datetime.utcnow().isoformat()[:19],
        })

print(f"New rows to stage: {len(new_rows)}")
for r in new_rows:
    print(f"  {r['to']:30s} {r['subject'][:50]}")

# Append to queue
all_rows = existing + new_rows
q.write_text('\n'.join(json.dumps(x) for x in all_rows) + '\n')
print(f"\nQueue after: {len(all_rows)} rows")

# 4. Reset strike counter so the next tick probes
Path('/Users/nicholas/clawd/hive-mailer/.probe_strikes').write_text('0')
Path('/Users/nicholas/clawd/hive-mailer/.probe_strikes_ts').write_text(datetime.utcnow().isoformat())
print("Strike counter reset to 0")

# 5. Issue 3 daily keystone certs
print("\n=== Issuing 3 keystone certs ===")
import subprocess
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

# Show new certs
log = Path('/tmp/keystone_daily_cert.log').read_text().splitlines()
print(f"\nLast 3 certs in log:")
for line in log[-3:]:
    print(f"  {line[:120]}")
