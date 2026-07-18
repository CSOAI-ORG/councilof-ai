#!/usr/bin/env python3
"""Day 9 morning audit — verify 6 gates + audit conversion pipeline + Write HN draft."""
import urllib.request, json, time, os, subprocess
from pathlib import Path
from datetime import datetime
from collections import Counter

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

# === GATE 1: SOV3 health + sigchain integrity ===
print("=== GATE 1: SOV3 + sigchain ===")
h = call_tool('sovereign_health_check')
print(f"  SOV3: {h.get('status')}, components={len(h.get('components', {}))}/~10")

# Sigchain transcript
tr = call_tool('sigil_transcript', {})
recent = tr.get('recent', []) if isinstance(tr, dict) else []
print(f"  Recent sigils: {len(recent)}")
# Check chain integrity (each prev_sig = previous signature)
integrity_issues = []
for i, s in enumerate(recent[1:], 1):
    if s.get('prev_sig','') and recent[i-1].get('signature',''):
        if s['prev_sig'] != recent[i-1]['signature']:
            integrity_issues.append(f"sigil {i}: prev_sig mismatch")
print(f"  Chain integrity: {'✅ intact' if not integrity_issues else '❌ ' + str(integrity_issues)}")
print(f"  Last 3 sigils:")
for s in recent[-3:]:
    print(f"    {s.get('digest','')[:16]}  prev={s.get('prev_sig','')[:20]}")

# === GATE 2: Mailer queue + Resend probe ===
print("\n=== GATE 2: Mailer queue ===")
q = Path('/Users/nicholas/clawd/hive-mailer/queue.jsonl')
rows = [json.loads(l) for l in q.read_text().splitlines() if l.strip()]
by_status = Counter(r.get('status','?') for r in rows)
print(f"  Total: {len(rows)} rows")
for s, n in sorted(by_status.items()):
    print(f"    {s}: {n}")
# Resend probe
strikes = Path('/Users/nicholas/clawd/hive-mailer/.probe_strikes').read_text().strip()
ts = Path('/Users/nicholas/clawd/hive-mailer/.probe_strikes_ts').read_text().strip()
print(f"  Strike counter: {strikes}/9 (last probe {ts})")

# === GATE 3: keystone + indexnow + sigchain via SOV3 ===
print("\n=== GATE 3: Public + keystone ===")
import os
os.environ['SSL_CERT_FILE'] = '/Users/nicholas/Library/Python/3.14/lib/python/site-packages/certifi/cacert.pem'
for url, name in [
    ('https://meok-attestation-api.vercel.app/health', 'keystone'),
    ('https://meok.ai/', 'meok.ai'),
    ('https://proofof.ai/', 'proofof.ai'),
    ('https://csoai.org/', 'csoai.org'),
]:
    try:
        r = urllib.request.urlopen(url, timeout=5)
        print(f"  ✅ {name:20s} HTTP {r.status}")
    except urllib.error.HTTPError as e:
        print(f"  ⚠️  {name:20s} HTTP {e.code}")
    except Exception as e:
        print(f"  ❌ {name:20s} {type(e).__name__}")

# === GATE 4: launchd plist state ===
print("\n=== GATE 4: launchd plist state ===")
r = subprocess.run(['launchctl', 'list'], capture_output=True, text=True)
for j in ['com.meok.sov3-gunicorn', 'com.meok.ops.daily-keystone-cert', 'com.csoai.auto-fire-emails',
          'com.meok.weekly-indexnow', 'com.meok.status-ping', 'com.meok.daily-sov3-sigil']:
    found = [l for l in r.stdout.splitlines() if j in l]
    if found:
        parts = found[0].split('\t')
        pid = parts[0] if parts[0] else '-'
        print(f"  {'✅' if pid != '-' else '⚠️ '} {j:40s} PID={pid}")
    else:
        # Check if plist file exists
        plist = Path.home() / 'Library/LaunchAgents' / f'{j}.plist'
        if plist.exists():
            print(f"  📄 {j:40s} STAGED (not loaded)")
        else:
            print(f"  ❌ {j:40s} NO PLIST")

# === GATE 5: keystone certs this week ===
print("\n=== GATE 5: keystone certs ===")
log = Path('/tmp/keystone_daily_cert.log').read_text().splitlines()
this_week = [l for l in log if '2026-06-1' in l]
print(f"  Total certs this week: {len(this_week)}")
# Day breakdown
from collections import defaultdict
by_day = defaultdict(int)
for l in this_week:
    date = l.split('T')[0]
    by_day[date] += 1
for d, n in sorted(by_day.items()):
    print(f"    {d}: {n} certs")

# === GATE 6: BFT council state ===
print("\n=== GATE 6: BFT council ===")
# Look for proposals
import os
bft_proposals_dir = Path.home() / '.clawdbot' / 'shared-knowledge' / 'bft' / 'proposals'
if bft_proposals_dir.exists():
    proposals = list(bft_proposals_dir.glob('*.json'))
    print(f"  Proposals on disk: {len(proposals)}")
    for p in proposals:
        d = json.loads(p.read_text())
        print(f"    {p.name}: {d.get('title','?')[:50]}")
else:
    print(f"  Proposals dir not found: {bft_proposals_dir}")
    # Try the SOV3 BFT council
    print("  (BFT council state tracked via SOV3 sigils, see chain transcript above)")

# === AUDIT: who's the user, who's editing ===
print("\n=== AUDIT: provenance of the 10 new queued rows ===")
# Look at the queued rows that were added between Day 8 EOD and now
for r in rows:
    if r.get('campaign','').startswith('sprint-d9-') or r.get('campaign','').startswith('sprint-d10-eu-'):
        # Show details
        print(f"  {r.get('campaign','?'):40s}  to={r.get('to','?')[:30]}  queued_at={r.get('queued_at','?')}  status={r.get('status','?')}")
        # Body first 80 chars
        body = r.get('body','')
        print(f"    body: {body[:120]}")

# === SOV3 BFT council proposals (via tool call) ===
print("\n=== BFT council proposals (via SOV3 tool) ===")
p = call_tool('submit_council_proposal', {
    'title': 'Day 9: 6-gate audit + Show HN draft + blog post + Watchdog Cert',
    'description': (
        "Day 9 morning — 3 hours after Day 8 EOD. Found 10 NEW queued rows that I (Day 9 agent) did not add: "
        "5 EU regulators (Banque de France, Deutsche Bundesbank, ESMA, EU AI Office, ECB) + "
        "5 UK regulators (Bank of England, Lloyd's Market Association, NHS England, UK Dept for Science, UK FCA). "
        "These look like a 'regulator Crown Jewels' outreach batch — possibly added by a parallel session, "
        "or by the user (Nick) directly editing queue.jsonl. The mailer has been auto-ticking every 30 min "
        "(strike 6/9 now), probing mail.meok.ai (still 403). "
        "Day 9 plan: (1) verify the 6 gates (read-only), (2) audit the conversion pipeline (BFT state, sigchain, queue forensics), "
        "(3) draft a Show HN post from the 5-day timeline, (4) write a 1,500-word blog post, "
        "(5) stage 1 Watchdog Cert as a pre-emptive asset for the first inbound, "
        "(6) emit Day 9 sigil + final seal. Approve."
    ),
    'proposed_by': 'jeeves-cli-day9',
})
print(f"  {p}")
