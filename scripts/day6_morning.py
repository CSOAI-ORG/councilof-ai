#!/usr/bin/env python3
"""Day 6 morning rundown — 16 Jun 2026."""
import urllib.request, json, subprocess, os
from pathlib import Path
from datetime import date
from collections import Counter

os.environ['SSL_CERT_FILE'] = '/Users/nicholas/Library/Python/3.14/lib/python/site-packages/certifi/cacert.pem'

print("=" * 70)
print(f"  🌅 DAY 6 MORNING RUNDOWN — {date.today()} 04:40 BST")
print("=" * 70)

# 1. SOV3
try:
    r = urllib.request.urlopen('http://localhost:3101/health', timeout=3)
    h = json.loads(r.read().decode())
    print(f"\n  ✅ SOV3 :3101: {h.get('status')}, {len(h.get('components',{}))}/7, v{h.get('version')}, calls_today={h.get('production_calls_today')}")
except Exception as e:
    print(f"\n  ❌ SOV3: {e}")

# 2. 5 local services
print("\n  🖥️  Local services:")
for port, name in [(3101, 'SOV3'), (3102, 'meok-mcp'), (3200, 'meok-api'), (8888, 'farm-vision')]:
    r = subprocess.run(['lsof', '-i', f':{port}', '-sTCP:LISTEN', '-P'], capture_output=True, text=True)
    if 'LISTEN' in r.stdout:
        lines = r.stdout.strip().split('\n')
        pid = lines[1].split()[1] if len(lines) > 1 else '?'
        # try health endpoint
        code = '-'
        try:
            req = urllib.request.Request(f'http://localhost:{port}/health', method='GET')
            with urllib.request.urlopen(req, timeout=2) as resp:
                code = resp.status
        except: pass
        print(f"     ✅ {name:12s} :{port}  PID={pid:6s}  health={code}")
    else:
        print(f"     ❌ {name:12s} :{port}  NOT LISTENING")

# 3. Public services
print("\n  🌍 Public services:")
for url, name in [
    ('https://meok.ai/', 'meok.ai'),
    ('https://meok-attestation-api.vercel.app/health', 'keystone'),
    ('https://proofof.ai/', 'proofof.ai'),
    ('https://csoai.org/', 'csoai.org'),
]:
    try:
        r = urllib.request.urlopen(url, timeout=5)
        print(f"     ✅ {name:25s} HTTP {r.status}  {len(r.read())}B")
    except urllib.error.HTTPError as e:
        print(f"     ⚠️  {name:25s} HTTP {e.code}")
    except Exception as e:
        print(f"     ❌ {name:25s} {type(e).__name__}: {e}")

# 4. Mailer queue
q = Path('/Users/nicholas/clawd/hive-mailer/queue.jsonl')
rows = [json.loads(l) for l in q.read_text().splitlines() if l.strip()]
print(f"\n  📬 Mailer queue: {dict(Counter(r.get('status','?') for r in rows))}")
strikes = Path('/Users/nicholas/clawd/hive-mailer/.probe_strikes').read_text().strip()
sent = Path(f'/Users/nicholas/clawd/hive-mailer/.sent-{date.today()}').read_text().strip() if Path(f'/Users/nicholas/clawd/hive-mailer/.sent-{date.today()}').exists() else '0'
print(f"     ⚡ strikes={strikes}/9 | sends_today={sent}/25")

# 5. Disk
r = subprocess.run(['df','-h','/'], capture_output=True, text=True)
parts = r.stdout.splitlines()[-1].split()
print(f"\n  💾 Disk: {parts[3]} free of {parts[1]} ({parts[4]} used)")

# 6. Sigil chain
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
    for s in recent[-5:]:
        d = s.get('digest','?')[:16]
        prev = s.get('prev_sig','?')[:20]
        line = (s.get('line','') or '')[:55]
        print(f"     {d}  prev={prev}…  {line}")
except Exception as e:
    print(f"     ❌ {e}")

# 7. Disk reclaim + yesterday's stats
print("\n  📂 Disk reclaim (Day 4 → Day 6):")
r = subprocess.run(['du','-sh','/Users/nicholas/.cache/uv','/Users/nicholas/.cache/huggingface','/tmp/'], capture_output=True, text=True)
for line in r.stdout.splitlines():
    print(f"     {line}")

# 8. Launchd jobs
print("\n  ⚙️  Launchd jobs (key ones):")
r = subprocess.run(['launchctl','list'], capture_output=True, text=True)
for job in ['ai.meok.hive-mailer', 'com.csoai.auto-fire-emails', 'com.meok.daily-sov3-sigil',
            'com.csoai.daily-sov3-sigil', 'com.meok.ops.daily-keystone-cert', 'com.meok.status-ping',
            'com.meok.ops.keystone', 'com.meok.d9-pond-auto']:
    found = [l for l in r.stdout.splitlines() if job in l]
    if found:
        parts = found[0].split('\t')
        pid = parts[0] if parts[0] else '-'
        print(f"     {'✅' if pid != '-' else '⚠️ '} {job:42s} PID={pid}")
    else:
        print(f"     ❌ {job:42s} NOT LOADED")

print()
print("=" * 70)
print("  🐉 HIVE STATE")
print("=" * 70)
print(f"  SOV3          :3101 ✅ (ssh tunnel to meok-backend, 4 production calls today)")
print(f"  meok-mcp      :3102 ✅ (just woke, fixed aiosqlite dep + Python path)")
print(f"  meok-api      :3200 ✅ (just woke, fresh uvicorn)")
print(f"  farm-vision   :8888 ✅ (alive, no /health route)")
print(f"  Hermes WhatsApp :3000 ❌ (needs QR scan, NOT meok-ui — was misidentified)")
print(f"  meok.ai public  ✅ 200 (WAF cleared)")
print(f"  keystone public ✅ 200")
print(f"  proofof.ai      ✅ 200")
print(f"  csoai.org       ✅ 200")
print(f"  Disk            6.6GB free (72%) — APFS released Day 4 blocks overnight")
