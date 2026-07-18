#!/usr/bin/env python3
"""Vendor / Partner Integration Research — mines vendor caches for compliance signals.

Sources:
- OpenAI/Anthropic/DeepMind/Meta/Mistral status blogs (cached)
- Vendor security.txt, trust pages (live fetch)
- Compliance certifications announced

Output: vendor_research_2026-07-13.json
"""

import hashlib
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SC = Path('/Users/nicholas/clawd/sovereign-charters')
WATCHDOG = SC / 'WATCHDOG' / 'data'
OUT = SC / 'vendor_research_2026-07-13.json'

VENDOR_TRUST_PAGES = [
    ('OpenAI', 'https://openai.com/security'),
    ('OpenAI', 'https://trust.openai.com/'),
    ('Anthropic', 'https://www.anthropic.com/security'),
    ('Anthropic', 'https://trust.anthropic.com/'),
    ('DeepMind', 'https://deepmind.google/about/responsibility-safety/'),
    ('Meta AI', 'https://ai.meta.com/responsibility/'),
    ('Mistral', 'https://mistral.ai/security/'),
    ('Hugging Face', 'https://huggingface.co/security'),
    ('AWS AI', 'https://aws.amazon.com/compliance/'),
    ('Azure AI', 'https://learn.microsoft.com/en-us/azure/azure-sql/security/azure-services'),
]

# Compliance signals we're hunting for
COMPLIANCE_SIGNALS = {
    'soc2': r'\bSOC\s*2\b|\bService Organization Control',
    'iso27001': r'\bISO/IEC?\s*27001\b|\bISO\s+27001\b',
    'iso42001': r'\bISO/IEC?\s*42001\b|\bISO\s+42001\b',
    'hipaa': r'\bHIPAA\b|\bHealth Insurance Portability',
    'gdpr': r'\bGDPR\b|\bGeneral Data Protection',
    'fedramp': r'\bFedRAMP\b',
    'c5': r'\bBSI\s+C5\b|\bC5\s+(?:Type|2025)\b',
    'txo': r'\bTexas\s+Data\s+Privacy\b|\bTDPSA\b',
    'ccpa': r'\bCCPA\b|\bCalifornia Consumer Privacy',
    'ai_act': r'\bEU\s+AI\s+Act\b',
    'nis2': r'\bNIS\s*2\b',
    'dora': r'\bDORA\b|\bDigital Operational Resilience',
    'pci': r'\bPCI\s+DSS\b',
    'iso_9001': r'\bISO\s+9001\b',
}


def fetch(url, timeout=15):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'CSOAI-Sovereign-Research/1.0 (CSOAI-Ltd-UK-16939677)',
        'Accept': 'text/html,application/xhtml+xml'
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return None, str(e)


def strip_html(text):
    text = re.sub(r'<script[^>]*>.*?</script>', ' ', text, flags=re.DOTALL | re.I)
    text = re.sub(r'<style[^>]*>.*?</style>', ' ', text, flags=re.DOTALL | re.I)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def main():
    now = datetime.now(timezone.utc).isoformat()
    print(f'\nVENDOR / PARTNER INTEGRATION RESEARCH — {now}\n{"="*60}')

    results = []

    # Phase 1: read cached vendor .bin files
    vendor_dir = WATCHDOG / 'vendor'
    if vendor_dir.exists():
        for p in sorted(vendor_dir.glob('*.bin')):
            raw = p.read_text(errors='ignore')
            text = strip_html(raw)
            signals_found = {}
            for sig, pat in COMPLIANCE_SIGNALS.items():
                matches = re.findall(pat, text, re.I)
                if matches:
                    signals_found[sig] = len(matches)
            results.append({
                'vendor': p.stem.replace('_', ' '),
                'source': f'cached:{p.name}',
                'size': len(raw),
                'title_match': (re.search(r'<title>(.*?)</title>', raw) or [None, ''])[1] if re.search(r'<title>(.*?)</title>', raw) else '',
                'signals_found': signals_found,
                'signal_total': sum(signals_found.values())
            })
            print(f'  ✓ {p.name:35s} {len(raw):>8,} bytes  signals={signals_found}')

    # Phase 2: live fetch trust pages
    print('\nLive fetches:')
    for vendor, url in VENDOR_TRUST_PAGES:
        print(f'  → {vendor}: {url[:60]}')
        status, body = fetch(url)
        if status == 200:
            text = strip_html(body)
            signals_found = {}
            for sig, pat in COMPLIANCE_SIGNALS.items():
                matches = re.findall(pat, text, re.I)
                if matches:
                    signals_found[sig] = len(matches)
            results.append({
                'vendor': vendor,
                'source': f'live:{url}',
                'size': len(body),
                'title_match': re.search(r'<title>(.*?)</title>', body).group(1) if re.search(r'<title>(.*?)</title>', body) else '',
                'signals_found': signals_found,
                'signal_total': sum(signals_found.values())
            })
            print(f'    ✓ {len(body):>8,} bytes  signals={signals_found}')
        else:
            print(f'    ✗ {status}: {str(body)[:80]}')

    # Aggregate by signal
    signal_aggregates = {}
    for r in results:
        for sig, count in r['signals_found'].items():
            signal_aggregates[sig] = signal_aggregates.get(sig, 0) + count

    # Vendor leaderboard (by signal total)
    vendor_leaderboard = sorted(results, key=lambda r: -r['signal_total'])

    sigil = hashlib.sha256(f'vendor-research|{now}|{len(results)}'.encode()).hexdigest()[:32]

    out_doc = {
        'generated_at': now,
        'sources': len(results),
        'vendors_checked': [r['vendor'] for r in results],
        'signal_aggregates': dict(sorted(signal_aggregates.items(), key=lambda x: -x[1])),
        'vendor_leaderboard': [{'vendor': r['vendor'], 'source': r['source'], 'signal_total': r['signal_total'], 'signals': r['signals_found']} for r in vendor_leaderboard],
        'all_results': results,
        'sigil': sigil,
        'honest_register': [
            'Cached vendor .bin files may be stale.',
            'Live fetches only test the homepage — full SOC2 reports etc are behind login.',
            'Compliance signals are heuristic — manual verification required before citing in sales.',
            'No LLM inference. Stdlib only.'
        ],
        'next_actions': [
            'Compare vendor compliance coverage to CSOAI cross-walks.',
            'Use as sales intelligence for vendor replacement pitches.',
            'Re-run weekly as vendors update trust pages.'
        ]
    }

    OUT.write_text(json.dumps(out_doc, indent=2))

    print(f'\n{"="*60}')
    print(f'VENDOR RESEARCH COMPLETE')
    print(f'  Vendors checked: {len(results)}')
    print(f'  Total signals: {sum(signal_aggregates.values())}')
    print(f'  Top signals:')
    for sig, c in sorted(signal_aggregates.items(), key=lambda x: -x[1])[:10]:
        print(f'    {sig:15s} {c:3d} mentions')
    print(f'\n✓ Saved: {OUT} ({OUT.stat().st_size:,} bytes)')
    print(f'✓ SIGIL: {sigil}')

    # SIGIL_LOG
    with open(SC / 'SIGIL_LOG.txt', 'a') as f:
        f.write(f'{now} | {sigil} | M|JEEVES|csoai|VENDOR-RESEARCH. vendors={len(results)} signals={sum(signal_aggregates.values())}\n')


if __name__ == '__main__':
    main()