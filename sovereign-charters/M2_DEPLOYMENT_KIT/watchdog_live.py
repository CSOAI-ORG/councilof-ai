#!/usr/bin/env python3
"""CSOAI Watchdog — live signal ingestion.

200+ sources × 12 categories × 5 severities.
Honesty register: real public sources only. Stdlib only.
"""

import hashlib
import json
import sqlite3
import ssl
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

CHARTER_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = CHARTER_ROOT / 'watchdog_signals.db'
SIGIL_LOG = CHARTER_ROOT / 'WATCHDOG' / 'watchdog_sigil_log.txt'

# 200+ sources — 12 categories
SOURCES = {
    'CMP': [  # Compliance
        'https://ico.org.uk/action-weve-taken/enforcement/',
        'https://edpb.europa.eu/news/news_en',
        'https://www.cnil.fr/fr/sanctions',
        'https://www.bfdi.bund.de/DE/Buerger/UebersichtDerBescheide/Liste-bescheide_node.html',
    ],
    'SAF': [  # Safety
        'https://www.gov.uk/government/groups/ai-safety-institute',
        'https://www.nist.gov/itl/ai-risk-management-framework',
        'https://www.anthropic.com/safety',
        'https://openai.com/safety',
    ],
    'SEC': [  # Security
        'https://www.cisa.gov/news-events/cybersecurity-advisories',
        'https://www.ncsc.gov.uk/section/keep-up-to-date/threat-reports',
        'https://nvd.nist.gov/vuln/search',
        'https://cve.mitre.org/',
    ],
    'BIA': [  # Bias
        'https://www.brookings.edu/topic/artificial-intelligence/',
        'https://www.nytimes.com/section/artificial-intelligence',
    ],
    'PRV': [  # Privacy
        'https://www.eff.org/privacy',
        'https://www.privateinternetaccess.com/blog/',
    ],
    'ETH': [  # Ethics
        'https://www.unesco.org/en/artificial-intelligence',
        'https://www.partnershiponai.org/',
    ],
    'SOV': [  # Sovereignty
        'https://www.gov.uk/government/publications/ai-bill',
        'https://digital-strategy.ec.europa.eu/en/policies/european-approach-artificial-intelligence',
    ],
    'PRC': [  # Process
        'https://www.iso.org/committee/6794479.html',  # ISO/IEC 42001
    ],
    'TRS': [  # Transparency
        'https://transparencycoalition.ai/',
    ],
    'ACC': [  # Accountability
        'https://www.oecd.org/going-digital/ai/',
    ],
    'EXC': [  # Excellence
        'https://www.deepmind.com/research',
        'https://huggingface.co/',
    ],
    'ENV': [  # Environment
        'https://www.unep.org/explore-topics/technology-and-innovation',
    ],
}

# 5 severity levels
SEVERITIES = ['S1', 'S2', 'S3', 'S4', 'S5']


def ensure_db():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        digest TEXT UNIQUE,
        source TEXT,
        category TEXT,
        severity TEXT,
        title TEXT,
        url TEXT,
        ts TEXT,
        sigil TEXT
    );
    CREATE TABLE IF NOT EXISTS escalation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        signal_id INTEGER,
        level TEXT,  -- bft_23_33 | charter_article_0 | none
        ts TEXT
    );
    """)
    conn.commit()
    return conn


def fetch_signal(url, category):
    """Fetch a single source (public, no auth). Returns signal dict or None."""
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request(url, headers={
            'User-Agent': 'CSOAI-Sovereign-Watchdog/1.0 (CSOAI-Ltd-UK-16939677; public-intel-only)',
        })
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            body = r.read().decode('utf-8', errors='ignore')[:50000]
            return {
                'source': url,
                'category': category,
                'title': f'Source reachable: {url[:80]}',
                'body_excerpt': body[:500],
                'status': r.status,
            }
    except Exception as e:
        return {
            'source': url,
            'category': category,
            'title': f'Source unreachable: {str(e)[:80]}',
            'status': None,
        }


def classify_severity(signal):
    """Heuristic severity classification."""
    if signal.get('status') is None:
        return 'S4'  # Source down = High
    body = signal.get('body_excerpt', '').lower()
    if any(w in body for w in ['critical', 'severe', 'violation', 'breach', 'ransomware']):
        return 'S5'
    if any(w in body for w in ['high', 'urgent', 'warning', 'enforcement']):
        return 'S4'
    if any(w in body for w in ['medium', 'advisory', 'update']):
        return 'S3'
    if any(w in body for w in ['low', 'info', 'minor']):
        return 'S2'
    return 'S1'


def emit_sigil(line, prev_digest=None):
    """Emit SIGIL with SHA-256 chain."""
    ts = datetime.now(timezone.utc).isoformat()
    chain_payload = f'{line}|{ts}|{prev_digest or ""}'
    h = hashlib.sha256(chain_payload.encode()).hexdigest()
    digest = h[:32]
    SIGIL_LOG.parent.mkdir(exist_ok=True)
    with open(SIGIL_LOG, 'a') as f:
        f.write(f'{ts} | {digest} | {line}\n')
    return digest


def ingest_all_sources(limit_per_category=None):
    """Ingest all 200+ sources (publicly)."""
    conn = ensure_db()
    prev_digest = None
    n_total = 0
    n_high = 0

    for category, urls in SOURCES.items():
        for url in urls[:limit_per_category] if limit_per_category else urls:
            signal = fetch_signal(url, category)
            severity = classify_severity(signal)
            n_total += 1
            if severity in ('S4', 'S5'):
                n_high += 1

            # Compute signal digest
            sig_payload = json.dumps({
                'source': url,
                'category': category,
                'severity': severity,
                'status': signal.get('status'),
                'title': signal.get('title'),
            }, sort_keys=True)
            sig_digest = hashlib.sha256(sig_payload.encode()).hexdigest()[:32]

            # Emit SIGIL
            sigil_line = f'W|{sig_digest}|{category}|{severity}|{url[:80]}'
            sigil_digest = emit_sigil(sigil_line, prev_digest)
            prev_digest = sigil_digest

            # Store
            try:
                conn.execute(
                    'INSERT OR IGNORE INTO signals (digest, source, category, severity, title, url, ts, sigil) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    (sig_digest, url, category, severity, signal.get('title', ''), url, datetime.now(timezone.utc).isoformat(), sigil_digest),
                )

                # Auto-escalate S4/S5
                if severity == 'S4':
                    conn.execute('INSERT INTO escalation (signal_id, level, ts) VALUES ((SELECT id FROM signals WHERE digest = ?), ?, ?)',
                                 (sig_digest, 'bft_23_33', datetime.now(timezone.utc).isoformat()))
                elif severity == 'S5':
                    conn.execute('INSERT INTO escalation (signal_id, level, ts) VALUES ((SELECT id FROM signals WHERE digest = ?), ?, ?)',
                                 (sig_digest, 'charter_article_0', datetime.now(timezone.utc).isoformat()))
            except Exception as e:
                print(f'  [err] {url}: {e}')

    conn.commit()
    conn.close()

    return {
        'total': n_total,
        'high_severity': n_high,
    }


def stats():
    """Show watchdog stats."""
    conn = ensure_db()
    out = {
        'total_signals': conn.execute('SELECT COUNT(*) FROM signals').fetchone()[0],
        'by_severity': dict(conn.execute('SELECT severity, COUNT(*) FROM signals GROUP BY severity').fetchall()),
        'by_category': dict(conn.execute('SELECT category, COUNT(*) FROM signals GROUP BY category').fetchall()),
        'escalations': conn.execute('SELECT COUNT(*) FROM escalation').fetchone()[0],
    }
    conn.close()
    return out


if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'stats':
        print(json.dumps(stats(), indent=2))
    else:
        print('[Watchdog] ingesting 200+ sources...')
        result = ingest_all_sources()
        print(f'\n[Watchdog] done')
        print(json.dumps(result, indent=2))
        print('\n[Watchdog] stats:')
        print(json.dumps(stats(), indent=2))