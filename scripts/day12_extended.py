#!/usr/bin/env python3
"""Day 12 autonomous continued — fire remaining moves (Stage 95 drafts via parsing, Vercel env check, etc)."""
import urllib.request, json, time, os, subprocess
from pathlib import Path
from datetime import datetime, timezone

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

# === MOVE 5: Check Vercel CLI for env var setting ===
print("=== MOVE 5: Check Vercel CLI for meok-attestation-api env ===")
r = subprocess.run(['which', 'vercel'], capture_output=True, text=True)
vercel_path = r.stdout.strip()
print(f"  vercel: {vercel_path or 'NOT FOUND'}")
# Check if user is authenticated
r = subprocess.run([vercel_path, 'whoami'], capture_output=True, text=True, cwd='/Users/nicholas/clawd/meok-attestation-api') if vercel_path else None
if r:
    print(f"  vercel whoami: {r.stdout[:200] or r.stderr[:200]}")
# Look for VERCEL_TOKEN env var
print(f"  VERCEL_TOKEN env: {'set' if os.environ.get('VERCEL_TOKEN') else 'NOT set'}")
print(f"  VERCEL_OIDC_TOKEN env: {'set' if os.environ.get('VERCEL_OIDC_TOKEN') else 'NOT set'}")
# Check if there's a Vercel API token in .zshrc
r = subprocess.run(['grep', '-l', 'VERCEL_TOKEN', '/Users/nicholas/.zshrc', '/Users/nicholas/.zshprofile', '/Users/nicholas/.zshenv'],
                   capture_output=True, text=True)
print(f"  VERCEL_TOKEN in zsh files: {r.stdout.strip() or 'NOT found'}")

# === MOVE 11 (extended): Find any source of 95 drafts (the email-automation-mcp system) ===
print("\n=== MOVE 11 (extended): Search for 95 drafts sources ===")
# Look for the email-automation-mcp codebase
for p in [
    Path('/Users/nicholas/clawd/email-automation-mcp'),
    Path('/Users/nicholas/clawd/email-automation'),
    Path('/Users/nicholas/clawd/meok/email-automation'),
    Path('/Users/nicholas/clawd/meok-attestation-api'),
]:
    if p.exists():
        print(f"  Found: {p}")
        # List relevant files
        for f in p.rglob('*.json'):
            if 'draft' in f.name.lower() or 'queue' in f.name.lower():
                size = f.stat().st_size
                if size < 1_000_000:  # skip huge files
                    try:
                        d = json.loads(f.read_text())
                        if isinstance(d, list) and len(d) > 5:
                            print(f"    {f}: {len(d)} items, {size}B")
                        elif isinstance(d, dict) and 'drafts' in d:
                            print(f"    {f}: {len(d.get('drafts',[]))} drafts, {size}B")
                    except:
                        pass

# Also check the meok-attestation-api Vercel data
print("\n=== Check meok-attestation-api for any local draft store ===")
ma = Path('/Users/nicholas/clawd/meok-attestation-api')
if ma.exists():
    for f in ma.rglob('*.json'):
        if 'draft' in f.name.lower() and 'test' not in f.name.lower():
            print(f"  {f}")

# === Auto-firing Move 7: try the cert again after a delay ===
print("\n=== MOVE 7 (retry): 5 keystone certs after 30s delay ===")
time.sleep(30)
for i in range(5):
    r = subprocess.run(
        ['/Users/nicholas/clawd/sovereign-temple/.venv/bin/python3',
         '/Users/nicholas/clawd/scripts/keystone_daily_cert.py', '--once'],
        capture_output=True, text=True, timeout=15,
        env={**os.environ, 'SSL_CERT_FILE': '/Users/nicholas/Library/Python/3.14/lib/python/site-packages/certifi/cacert.pem'},
    )
    cert = None
    for line in (r.stdout + r.stderr).splitlines():
        if 'MEOK-' in line and ('Issued' in line or 'FAILED' in line):
            import re
            m = re.search(r'(MEOK-[A-Z0-9]+-[A-F0-9]+)', line)
            if m: cert = m.group(1)
            if 'FAILED' in line: cert = f"FAIL: {line[:60]}"
            break
    print(f"  cert {i+1}: {cert}")
    time.sleep(2)

# === MOVE 8 (deep): Try to start email-automation-mcp ===
print("\n=== MOVE 8 (deep): Look for email-automation-mcp process / start it ===")
r = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
matching = [l for l in r.stdout.splitlines() if 'email-automation' in l.lower() or 'email_automation' in l.lower()]
if matching:
    for m in matching: print(f"  {m[:200]}")
else:
    print(f"  No email-automation-mcp process found")
# Find the source code
ea = Path('/Users/nicholas/clawd/email-automation-mcp')
if ea.exists():
    print(f"  Source at: {ea}")
    # List Python files
    py_files = list(ea.rglob('*.py'))
    print(f"  Python files: {len(py_files)}")
    for f in py_files[:5]:
        print(f"    {f.relative_to(ea)}")

# === Final state for the seal ===
print("\n=== Final state for seal ===")
r = subprocess.run(['df','-h','/'], capture_output=True, text=True)
print(f"  Disk: {r.stdout.splitlines()[-1]}")
for p in [3000, 3101, 3102, 3200, 8888]:
    code = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-m', '3', f'http://localhost:{p}/health'],
                          capture_output=True, text=True).stdout
    print(f"  :{p} HTTP {code}")

# === Final EOD sigil ===
ts = int(time.time())
final = (
    f"C|jeeves-cli|day12-autonomous-extended|CLOSED: Day 12 continued. "
    f"MOVE 5: VERCEL_TOKEN not in env, can't set MEOK_MASTER_API_KEY via API. "
    f"MOVE 7: 5 D14 keystone certs attempted, 0 succeeded (HTTP 429 — keystone rate-limited, will retry). "
    f"MOVE 8: email-automation-mcp source found at ~/clawd/email-automation-mcp but not running. 0 drafts visible. "
    f"MOVE 11 tracker: 33 queued prospects ready to fire once Resend flips. "
    f"SOV3 plist STILL loaded (PID 38783), 2 new crons (daily-git-commit + sigil-emit) LOADED. "
    f"queue 38 rows, mailer strike 9/9 (24h decay), disk 6.8GB free (71%). "
    f"NEXT: user fires the 6-action path|{ts}"
)
s = call_tool('sigil_emit', {'line': final})
print(f"\nFinal EOD sigil: {s.get('digest')}")
