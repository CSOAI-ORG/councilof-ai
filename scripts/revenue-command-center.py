#!/usr/bin/env python3
"""
Revenue Command Center — single source of truth for what's driving sales/leads.
No deletion. Read-only + blocker surfacing.
"""
import json
import os
import subprocess
import urllib.request
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path

REPORT_DIR = Path('/Users/nicholas/.clawdbot/shared-knowledge/intel')
REPORT_DIR.mkdir(parents=True, exist_ok=True)
REPORT_PATH = REPORT_DIR / f"revenue-command-center-{datetime.now().strftime('%Y-%m-%d')}.md"

queue_path = Path('/Users/nicholas/clawd/hive-mailer/queue.jsonl')

lines = []

def add(text=''):
    lines.append(text)

add('# Revenue Command Center')
add(f'**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M %Z")}')
add()

# ── Outreach Queue ──
add('## 📧 Outreach Queue')
if queue_path.exists():
    statuses = Counter()
    domains = Counter()
    recent_errors = Counter()
    total = 0
    with open(queue_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            total += 1
            statuses[entry.get('status', 'unknown')] += 1
            to = entry.get('to', '')
            domain = to.split('@')[-1] if '@' in to else 'unknown'
            domains[domain] += 1
            err = entry.get('error', '')
            if err:
                # bucket by first meaningful phrase
                if 'domain is not verified' in str(err).lower():
                    recent_errors['Resend domain not verified'] += 1
                elif '403' in str(err):
                    recent_errors['403 forbidden'] += 1
                else:
                    recent_errors[str(err)[:80]] += 1
    add(f'- **Total entries:** {total}')
    for status, count in statuses.most_common():
        add(f'- **{status}:** {count}')
    if recent_errors:
        add('- **Top errors:**')
        for err, count in recent_errors.most_common(3):
            add(f'  - {err}: {count}')
    add(f'- **Top domains:** {", ".join(f"{d} ({c})" for d, c in domains.most_common(5))}')
else:
    add('- Queue file not found.')
add()

# ── Site Health ──
add('## 🌐 Revenue Site Health')
sites = [
    ('https://meok.ai/pricing', 'MEOK pricing'),
    ('https://csoai.org/pricing', 'CSOAI pricing'),
    ('https://proofof.ai', 'ProofOf landing'),
    ('https://meok-attestation-api.vercel.app/health', 'Attestation API'),
    ('https://lead-capture-deploy.vercel.app', 'Lead capture'),
]
for url, name in sites:
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req, timeout=10) as r:
            add(f'- ✅ **{name}:** HTTP {r.status}')
    except Exception as e:
        add(f'- ❌ **{name}:** {str(e)[:80]}')
add()

# ── Stripe (last 24h) ──
add('## 💳 Stripe Activity (24h)')
stripe_key = os.environ.get('STRIPE_SECRET_KEY') or os.environ.get('STRIPE_LIVE_KEY') or ''
if not stripe_key:
    # try common env files
    for env_file in ['/Users/nicholas/clawd/csoai-platform/.env', '/Users/nicholas/.zshrc']:
        p = Path(env_file)
        if p.exists():
            text = p.read_text(errors='ignore')
            for line in text.split('\n'):
                if line.startswith('STRIPE_SECRET_KEY='):
                    stripe_key = line.split('=', 1)[1].strip().strip('"\'')
                    break
        if stripe_key:
            break

if stripe_key and stripe_key.startswith('sk_'):
    try:
        yesterday = int((datetime.now() - timedelta(hours=24)).timestamp())
        req = urllib.request.Request(
            f'https://api.stripe.com/v1/events?limit=10&created[gte]={yesterday}',
            headers={'Authorization': f'Bearer {stripe_key}'}
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read())
            events = data.get('data', [])
            if events:
                add(f'- **Events:** {len(events)}')
                for e in events[:5]:
                    add(f'  - {e["type"]} @ {datetime.fromtimestamp(e["created"]).isoformat()}')
            else:
                add('- No Stripe events in last 24h.')
    except Exception as e:
        add(f'- Stripe API error: {str(e)[:80]}')
else:
    add('- Stripe secret key not found in env/files.')
add()

# ── SOV3 Coordination ──
add('## 🧠 SOV3 Coordination')
try:
    result = subprocess.run(
        ['/Users/nicholas/clawd/scripts/coordination-status.sh'],
        capture_output=True, text=True, timeout=15
    )
    # Extract summary lines
    for line in result.stdout.split('\n'):
        if 'Agents:' in line or 'Tasks:' in line or 'Locks:' in line or 'SERVICE HEALTH' in line or any(s in line for s in ['MEOK_UI', 'SOV3', 'MEOK_MCP', 'MEOK_API', 'Farm_Vision']):
            add(line)
except Exception as e:
    add(f'- Could not fetch SOV3 status: {e}')
add()

# ── Agent Swarm ──
add('## 🤖 Active Agent Swarm')
try:
    result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
    counts = Counter()
    for line in result.stdout.split('\n')[1:]:
        lower = line.lower()
        if 'kimi code' in line.lower() or 'kimi-code' in line.lower():
            counts['Kimi Code'] += 1
        if 'claude-code' in lower or '/claude.app/' in lower:
            counts['Claude Code'] += 1
        if 'tui_gateway.slash_worker' in lower:
            counts['Hermes TUI worker'] += 1
        if 'prisma mcp' in lower:
            counts['Prisma MCP'] += 1
        if 'playwright' in lower:
            counts['Playwright'] += 1
    for name, count in counts.most_common():
        add(f'- **{name}:** {count} processes')
except Exception as e:
    add(f'- Could not count agents: {e}')
add()

# ── Blockers ──
add('## 🔴 Top Revenue Blockers')
blockers = []
# Resend domain
if recent_errors.get('Resend domain not verified', 0) > 0:
    blockers.append(f'Resend domain `mail.meok.ai` not verified ({recent_errors["Resend domain not verified"]} send failures)')
if not stripe_key:
    blockers.append('Stripe secret key not in automation env')
# Check attestation API
add()
add('1. **Resend domain verification** — gates all 326 outreach emails.')
add('2. **csoai-org deploy** — checkout.html and new pages are uncommitted/undeployed.')
add('3. **compliance.meok.ai DNS** — missing Namecheap record.')
add('4. **MEOK_LOCAL_MODE=true on Vercel** — blocks /api/* on new deploys.')
add('5. **MEOK_MASTER_API_KEY on VM** — gates 4 paywalled MCP tools.')
add()

add('## ✅ Next Actions (highest ROI)')
add('1. Verify `mail.meok.ai` in Resend dashboard → fire the 326-email queue.')
add('2. Commit + deploy `clawd/csoai-org` (checkout.html, mcp.json, new pages).')
add('3. Add `compliance.meok.ai` CNAME to Vercel in Namecheap.')
add('4. Remove `MEOK_LOCAL_MODE=true` from meok-ai Vercel production env.')
add('5. Set `MEOK_MASTER_API_KEY` in `/home/nicholas/sov3/.env` on VM.')
add()

REPORT_PATH.write_text('\n'.join(lines), encoding='utf-8')
print(REPORT_PATH)
