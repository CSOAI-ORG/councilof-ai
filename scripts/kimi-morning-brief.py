#!/usr/bin/env python3
"""
KIMI Morning Brief — replaces Hermes daily-revenue-check, monday-outreach-brief,
vercel-health-check, sov3-coordination-pulse, and Morning Briefing.
Run manually or via cron. Writes a dated markdown report.
"""
import json
import os
import re
import subprocess
import urllib.request
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path

OUTDIR = Path('/Users/nicholas/.clawdbot/shared-knowledge/intel')
OUTDIR.mkdir(parents=True, exist_ok=True)
OUTFILE = OUTDIR / f"kimi-morning-brief-{datetime.now().strftime('%Y-%m-%d')}.md"

lines = []
def add(text=''):
    lines.append(text)

add('# Kimi Morning Brief')
add(f'**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M %Z")}')
add(f'**Status:** Kimi has taken over Hermes/Claude daily lanes. Hermes cron jobs paused (backup: `~/.hermes/cron/jobs.json.bak.2026-06-20-kimi-takeover`).')
add()

# ── Outreach Queue ──
add('## 📧 Outreach Queue Status')
queue_path = Path('/Users/nicholas/clawd/hive-mailer/queue.jsonl')
statuses = Counter()
errors = Counter()
total = 0
if queue_path.exists():
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
            err = str(entry.get('error', ''))
            if 'domain is not verified' in err.lower():
                errors['Resend domain not verified'] += 1
            elif err:
                errors[err[:80]] += 1
    add(f'- **Total prospects:** {total}')
    for status, count in statuses.most_common():
        add(f'- **{status}:** {count}')
    if errors:
        add('- **Blocked by:**')
        for err, count in errors.most_common(3):
            add(f'  - {err}: {count}')
else:
    add('- Queue file not found.')
add()

# ── Revenue / Stripe ──
add('## 💳 Revenue (24h)')
stripe_key = ''
for env_file in ['/Users/nicholas/clawd/csoai-platform/.env', '/Users/nicholas/.zshrc', '/Users/nicholas/.config/csoai/env']:
    p = Path(env_file)
    if p.exists():
        for line in p.read_text(errors='ignore').split('\n'):
            if line.startswith('STRIPE_SECRET_KEY='):
                stripe_key = line.split('=', 1)[1].strip().strip('"\'')
                break
    if stripe_key:
        break

stripe_events = []
if stripe_key and stripe_key.startswith('sk_'):
    try:
        yesterday = int((datetime.now() - timedelta(hours=24)).timestamp())
        req = urllib.request.Request(
            f'https://api.stripe.com/v1/events?limit=10&created[gte]={yesterday}',
            headers={'Authorization': f'Bearer {stripe_key}'}
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read())
            stripe_events = data.get('data', [])
            add(f'- **Stripe events (24h):** {len(stripe_events)}')
            for e in stripe_events[:5]:
                add(f'  - {e["type"]} @ {datetime.fromtimestamp(e["created"]).isoformat()}')
    except Exception as e:
        add(f'- **Stripe API:** {str(e)[:80]}')
else:
    add('- **Stripe API key:** not found in automation env.')

# Site health
sites = [
    ('https://meok.ai/pricing', 'meok.ai/pricing'),
    ('https://csoai.org/pricing', 'csoai.org/pricing'),
    ('https://proofof.ai', 'proofof.ai'),
    ('https://meok-attestation-api.vercel.app/health', 'Attestation API'),
    ('https://lead-capture-deploy.vercel.app', 'Lead capture'),
]
add('- **Site health:**')
for url, name in sites:
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req, timeout=10) as r:
            add(f'  - ✅ {name}: HTTP {r.status}')
    except Exception as e:
        add(f'  - ❌ {name}: {str(e)[:80]}')
add()

# ── SOV3 Status ──
add('## 🧠 SOV3 Coordination')
try:
    result = subprocess.run(
        ['/Users/nicholas/clawd/scripts/coordination-status.sh'],
        capture_output=True, text=True, timeout=15
    )
    for line in result.stdout.split('\n'):
        if any(s in line for s in ['Agents:', 'Tasks:', 'Locks:', 'MEOK_UI', 'SOV3', 'MEOK_MCP', 'MEOK_API', 'Farm_Vision']):
            add(line)
except Exception as e:
    add(f'- SOV3 status unavailable: {e}')
add()

# ── Agent Swarm ──
add('## 🤖 Agent Swarm (current)')
try:
    result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
    counts = Counter()
    for line in result.stdout.split('\n')[1:]:
        lower = line.lower()
        if 'kimi code' in lower or 'kimi-code' in lower or 'uvx kimi' in lower:
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

# ── Disk / VM ──
add('## 💾 Mac Disk')
try:
    df = subprocess.run(['df', '-h', '/System/Volumes/Data'], capture_output=True, text=True, timeout=5)
    for line in df.stdout.split('\n')[1:]:
        if line:
            parts = line.split()
            if len(parts) >= 5:
                add(f'- **Used:** {parts[4]} ({parts[2]} / {parts[1]})')
except Exception as e:
    add(f'- Disk check failed: {e}')
add()

add('## 🎯 Top 3 Revenue Actions Today')
add('1. **Verify `mail.meok.ai` in Resend** — unblocks 326 outreach emails immediately.')
add('2. **Commit + deploy `clawd/csoai-org`** — checkout + new compliance pages go live.')
add('3. **Set `MEOK_MASTER_API_KEY` on VM** — activates 4 paywalled MCP tools.')
add()

add('## 📝 Notes')
add('- Hermes cron jobs paused. This brief replaces: daily-revenue-check, monday-outreach-brief, vercel-health-check, sov3-coordination-pulse, Morning Briefing.')
add('- Run this script anytime: `python3 /Users/nicholas/clawd/scripts/kimi-morning-brief.py`')
add('- For live dashboard: `python3 /Users/nicholas/clawd/scripts/revenue-command-center.py`')

OUTFILE.write_text('\n'.join(lines), encoding='utf-8')
print(OUTFILE)
