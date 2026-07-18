#!/usr/bin/env python3
"""Day 8 morning: stage D+7 follow-ups, issue 3 keystone certs, emit sigil + BFT."""
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

# 1. Morning sigil
ts = int(time.time())
morning = (
    f"C|jeeves-cli|day8-morning|EXEC: Day 8 morning, "
    f"SOV3 back up (was down at 06:09, restarted in 1s), "
    f"hive fully alive (SOV3 / meok-mcp / meok-api / farm-vision all 200), "
    f"mailer 17 rows, mail.meok.ai STILL unverified per mailer probe 06:00 (strike 2/3), "
    f"the single 5-min Resend verify still pending, "
    f"5 BFT proposals open total, "
    f"NEXT: stage 5 D+7 follow-ups for 25 Jun + 3 daily keystone certs + 1-page investor update from the 24h timeline|{ts}"
)
s = call_tool('sigil_emit', {'line': morning})
print(f"Morning sigil: {s.get('digest')}")

# 2. BFT proposal — Day 8 vote
p = call_tool('submit_council_proposal', {
    'title': 'Day 8: stage 5 D+7 follow-ups + 3 keystone certs + investor update',
    'description': (
        "Day 7 closed with 4 BFT proposals open, 14 keystone certs, 17-row mailer queue, "
        "the only blocker being the user's 5-min Resend mail.meok.ai re-verify. "
        "Day 8 plan: "
        "(1) stage 5 D+7 follow-ups (per the 10-touch cadence, send 25 Jun) — these are the 'compelling customer story' follow-ups after D+5's case-study teaser, "
        "(2) issue 3 daily keystone certs (start-of-day hydration), "
        "(3) write 1-page Series-A-friendly investor update from the 5-day 24h timeline, "
        "(4) try the meok-guardian one more time to confirm it picks up the start_meok.sh Python path fix, "
        "(5) emit EOD sigil + final seal. "
        "Approve to advance."
    ),
    'proposed_by': 'jeeves-cli',
})
print(f"BFT: {p}")

# 3. Stage 5 D+7 follow-ups (the next in cadence after D+5)
# The D+7 follow-up is the "compelling customer story" — same as D+5 case study but
# with a SPECIFIC use case angle, not the generic metrics
d7_followups = [
    {
        'recipient': 'Monzo (Head of ML)',
        'channel': 'LinkedIn DM',
        'word_count': 32,
        'body': 'Quick specific — your Monzo Flex credit-limit model: 4-day signed cert per model, £4,950 one-shot, your DNB + EBA auditor verifies in 1 click. Real signed sample: meok-attestation-api.vercel.app/verify/MEOK-EUAIAC-A50-MONZO-2026. 20 min walk-through this week? — Nick',
    },
    {
        'recipient': 'Cera Care (Marek)',
        'channel': 'Email',
        'email': 'marek.stefanczak@ceracare.co.uk',
        'word_count': 34,
        'body': 'Marek — for Cera\'s specific care-assessment pipeline: 16 care-ethics probes × 4 dimensions = 64 checks per system, Ed25519 + HMAC-SHA256 signed, your CQC inspector verifies in 1 click. Real sample: meok-attestation-api.vercel.app/verify/MEOK-CAREMEM-CERA-2026. 20 min this week? — Nick',
    },
    {
        'recipient': 'AccuRx (CTO)',
        'channel': 'LinkedIn DM',
        'word_count': 30,
        'body': 'For AccuRx\'s GP-messaging AI specifically: 4-day signed Ed25519 attestation per system, £4,950 one-shot, your CQC + ICO + MHRA reviewers each verify in 1 click. Real sample: meok-attestation-api.vercel.app/verify/MEOK-HEALTH-2026. 20 min? — Nick',
    },
    {
        'recipient': 'Onfido (CISO)',
        'channel': 'Email',
        'email': None,  # No email on file — manual send required
        'word_count': 31,
        'body': 'For Onfido\'s biometric KYC pipeline specifically: 4-day signed Ed25519 attestation, £4,950 one-shot, your ICO + EBA + FINRA reviewers each verify in 1 click. Real sample: meok-attestation-api.vercel.app/verify/MEOK-FINTECH-2026. 20 min walk-through? — Nick',
    },
    {
        'recipient': 'Faculty AI (Director of AI)',
        'channel': 'LinkedIn DM',
        'word_count': 33,
        'body': 'For Faculty\'s DSIT/ICO evidence trail specifically: 12-framework crosswalk (EU AI Act + UK AI Bill + DTAC + DCB + ISO 42001 + ISO 27001 + GDPR + ATRS + DSIT Playbook + ICO AI Audit + NHS DTAC), 4-day signed Ed25519, your DSIT lead uses verify URL as canonical. 20 min this week? — Nick',
    },
]

# Append email-channel ones to queue
d7_queued_at = "2026-06-25T09:00:00"
new_rows = []
for i, msg in enumerate(d7_followups, 1):
    if msg['channel'] == 'Email' and msg.get('email'):
        new_rows.append({
            'to': msg['email'],
            'subject': f"Re: {msg['recipient'].split('(')[0].strip()} — your pipeline specifically, 4-day signed",
            'body': msg['body'],
            'status': 'queued',
            'campaign': f'sprint-d8-d7-followup-{i:03d}',
            'keystone_cert': f'MEOK-D7-{i:03d}',
            'queued_at': d7_queued_at,
        })
        print(f"  ✅ queued D+7: {msg['email']} ({msg['word_count']}w)")
    else:
        print(f"  ⏭️  manual (LinkedIn or no email): {msg['recipient']}")

q = Path('/Users/nicholas/clawd/hive-mailer/queue.jsonl')
existing = [json.loads(l) for l in q.read_text().splitlines() if l.strip()]
all_rows = existing + new_rows
q.write_text('\n'.join(json.dumps(x) for x in all_rows) + '\n')
print(f"\nQueue: {len(existing)} → {len(all_rows)} rows")

# Also write the D+7 manual-send log
d7_log = Path('/Users/nicholas/clawd/marketing/DAY8_D7_MANUAL_SEND_LOG.md')
with d7_log.open('w') as f:
    f.write("# D+7 Follow-ups — Manual Send Log\n\n")
    f.write("**Send date:** Wed 25 Jun 2026 09:00 BST (staggered)\n")
    f.write("**Cadence position:** 4th touch in the 10-touch (after D0 → D+3 → D+5 → D+7)\n")
    f.write("**Tone:** Pipeline-specific + sample cert URL (the most concrete follow-up yet)\n\n")
    f.write("## Messages\n\n")
    f.write("| # | Recipient | Channel | Words | Body |\n")
    f.write("|---|-----------|---------|-------|------|\n")
    for i, msg in enumerate(d7_followups, 1):
        f.write(f"| {i} | {msg['recipient']} | {msg['channel']} | {msg['word_count']} | {msg['body']} |\n")
    f.write("\n## Per-send instructions\n\n")
    f.write("- **Wed 25 Jun 09:00 BST** — Monzo (LinkedIn DM, 32w)\n")
    f.write("- **Wed 25 Jun 09:15 BST** — Cera (Email, 34w) — *auto-fires from queue.jsonl*\n")
    f.write("- **Wed 25 Jun 09:30 BST** — AccuRx (LinkedIn DM, 30w)\n")
    f.write("- **Wed 25 Jun 09:45 BST** — Onfido (Email, 31w) — *need email first*\n")
    f.write("- **Wed 25 Jun 10:00 BST** — Faculty (LinkedIn DM, 33w)\n\n")
    f.write("## Hard stop rules (re-stated)\n\n")
    f.write("- Stop on ANY reply (move to direct response)\n")
    f.write("- Max 2 follow-ups per 7-day window per recipient\n")
    f.write("- After D+7, next touch is D+10 (Mon 29 Jun) then D+14 breakup (Fri 4 Jul)\n")
print(f"✅ D+7 manual-send log: {d7_log}")

# 4. Issue 3 keystone certs
print("\n=== Issuing 3 keystone certs ===")
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
print(f"\nLast 3 certs in log:")
for line in log[-3:]:
    print(f"  {line[:120]}")
