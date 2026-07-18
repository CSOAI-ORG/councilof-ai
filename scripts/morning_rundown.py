#!/usr/bin/env python3
"""Morning health check — 16 Jun 2026."""
import urllib.request, json, subprocess
from pathlib import Path
from datetime import date
from collections import Counter

print("=" * 60)
print(f"  🌅 MORNING RUNDOWN — {date.today()} 04:32 BST")
print("=" * 60)

# 1. SOV3 still up?
try:
    r = urllib.request.urlopen('http://localhost:3101/health', timeout=3)
    h = json.loads(r.read().decode())
    print(f"\n  ✅ SOV3 :3101: {h.get('status')}, {len(h.get('components',{}))}/7 components, v{h.get('version')}")
    print(f"     production_calls_today: {h.get('production_calls_today', 'n/a')}")
except Exception as e:
    print(f"\n  ❌ SOV3 :3101: {e}")

# 2. All 5 local services alive?
print("\n  🖥️  Local services:")
for port, name in [(3000, 'meok-ui'), (3101, 'SOV3'), (3102, 'meok-mcp'), (3200, 'meok-api'), (8888, 'farm-vision')]:
    r = subprocess.run(['lsof', '-i', f':{port}', '-sTCP:LISTEN', '-P'], capture_output=True, text=True)
    if 'LISTEN' in r.stdout:
        lines = r.stdout.strip().split('\n')
        pid = lines[1].split()[1] if len(lines) > 1 else '?'
        print(f"     ✅ {name:12s} :{port}  PID={pid}")
    else:
        print(f"     ❌ {name:12s} :{port}  NOT LISTENING")

# 3. Public services
print("\n  🌍 Public services:")
for url, name in [
    ('https://meok.ai/', 'meok.ai'),
    ('https://www.meok.ai/', 'www.meok.ai'),
    ('https://meok-attestation-api.vercel.app/health', 'keystone'),
    ('https://proofof.ai/', 'proofof.ai'),
    ('https://csoai.org/', 'csoai.org'),
]:
    try:
        r = urllib.request.urlopen(url, timeout=5)
        body_size = len(r.read())
        print(f"     ✅ {name:25s} HTTP {r.status}  {body_size}B")
    except urllib.error.HTTPError as e:
        print(f"     ⚠️  {name:25s} HTTP {e.code}")
    except Exception as e:
        print(f"     ❌ {name:25s} {type(e).__name__}: {e}")

# 4. Mailer queue state
q = Path('/Users/nicholas/clawd/hive-mailer/queue.jsonl')
rows = [json.loads(l) for l in q.read_text().splitlines() if l.strip()]
print(f"\n  📬 Mailer queue: {dict(Counter(r.get('status','?') for r in rows))}")

# 5. Mailer strike counter + last probe
strikes_file = Path('/Users/nicholas/clawd/hive-mailer/.probe_strikes')
strikes = strikes_file.read_text().strip() if strikes_file.exists() else 'n/a'
sent_file = Path(f'/Users/nicholas/clawd/hive-mailer/.sent-{date.today()}')
sends_today = sent_file.read_text().strip() if sent_file.exists() else '0'
print(f"     ⚡ strikes: {strikes}/9  |  📊 sends today: {sends_today}/25")

# 6. Mailer.log tail
log_file = Path('/Users/nicholas/clawd/hive-mailer/mailer.log')
if log_file.exists():
    log_lines = log_file.read_text().splitlines()
    print(f"     📋 last 3 log lines:")
    for line in log_lines[-3:]:
        print(f"        {line[:90]}")

# 7. Sigil chain position
print("\n  🔗 Sigil chain:")
try:
    token = Path('/Users/nicholas/clawd/sovereign-temple/.sov3_mcp_token').read_text().strip()
    body = json.dumps({'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':'sigil_transcript','arguments':{}}}).encode()
    req = urllib.request.Request('http://localhost:3101/mcp', data=body,
        headers={'Content-Type':'application/json','Authorization': f'Bearer {token}'}, method='POST')
    r = json.loads(urllib.request.urlopen(req, timeout=5).read().decode())
    content = r.get('result', {}).get('content', [{}])
    t = json.loads(content[0].get('text','{}'))
    recent = t.get('recent', [])
    print(f"     chain length: {len(recent)} recent sigils")
    for s in recent[-3:]:
        d = s.get('digest','?')[:16]
        prev = s.get('prev_sig','?')[:20]
        line = (s.get('line','') or '')[:60]
        print(f"     {d}  prev={prev}  {line}")
except Exception as e:
    print(f"     ❌ sigil_transcript: {e}")

# 8. Disk state
r = subprocess.run(['df','-h','/'], capture_output=True, text=True)
parts = r.stdout.splitlines()[-1].split()
print(f"\n  💾 Disk: {parts[3]} free of {parts[1]} ({parts[4]} used)")

# 9. Launchd cron jobs (the conversion-critical ones)
print("\n  ⚙️  Launchd jobs (conversion-critical):")
r = subprocess.run(['launchctl','list'], capture_output=True, text=True)
for job in ['ai.meok.hive-mailer', 'com.csoai.auto-fire-emails', 'com.meok.auto-fire-emails',
            'com.csoai.weekly-indexnow', 'com.meok.weekly-indexnow', 'com.meok.status-ping',
            'com.meok.daily-sov3-sigil', 'com.csoai.daily-sov3-sigil',
            'com.meok.ops.keystone', 'com.meok.ops.daily-keystone-cert']:
    found = [l for l in r.stdout.splitlines() if job in l]
    if found:
        parts = found[0].split('\t')
        pid = parts[0] if parts[0] else '-'
        print(f"     {'✅' if pid != '-' else '⚠️ '} {job:40s} PID={pid}")
    else:
        print(f"     ❌ {job:40s} NOT LOADED")

# 10. BFT council open proposals
print("\n  🏛️  BFT council:")
try:
    token = Path('/Users/nicholas/clawd/sovereign-temple/.sov3_mcp_token').read_text().strip()
    body = json.dumps({'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':'vote_on_proposal','arguments':{}}}).encode()
    # Wrong arg shape, just probe
    body = json.dumps({'jsonrpc':'2.0','id':1,'method':'tools/list','params':{}}).encode()
    req = urllib.request.Request('http://localhost:3101/mcp', data=body,
        headers={'Content-Type':'application/json','Authorization': f'Bearer {token}'}, method='POST')
    r = json.loads(urllib.request.urlopen(req, timeout=5).read().decode())
    tools = r.get('result', {}).get('tools', [])
    bft = [t['name'] for t in tools if 'council' in t.get('name','').lower() or 'proposal' in t.get('name','').lower()]
    print(f"     council tools: {bft}")
    # Get dashboard
    body = json.dumps({'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':'coord_get_dashboard','arguments':{}}}).encode()
    req = urllib.request.Request('http://localhost:3101/mcp', data=body,
        headers={'Content-Type':'application/json','Authorization': f'Bearer {token}'}, method='POST')
    r = json.loads(urllib.request.urlopen(req, timeout=5).read().decode())
    content = r.get('result', {}).get('content', [{}])
    dash = json.loads(content[0].get('text','{}'))
    if 'tasks' in dash:
        open_tasks = sum(1 for t in dash.get('tasks', []) if t.get('status') in ('open','queued','assigned'))
        print(f"     open tasks: {open_tasks}")
except Exception as e:
    print(f"     ❌ bft probe: {e}")

print()
print("=" * 60)
print(f"  🌅 END MORNING RUNDOWN")
print("=" * 60)
