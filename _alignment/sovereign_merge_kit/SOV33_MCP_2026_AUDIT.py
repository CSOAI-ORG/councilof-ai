#!/usr/bin/env python3
"""
SOV33_MCP_2026_AUDIT.py — MCP 2026-07-28 stateless audit for sovereign-temple.
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

PURPOSE: The MCP 2026-07-28 spec ships 28 Jul 2026 with BREAKING CHANGES:
  - REMOVED: `initialize` handshake
  - REMOVED: `Mcp-Session-Id` header
  - NEW: `Mcp-Method` / `Mcp-Name` routing headers (required)
  - NEW: `Mcp-Session-Id` REMOVED (server must be stateless)
  - NEW: Trace Context in `_meta`
  - NEW: MCP Apps (server-rendered UIs)
  - NEW: Tasks extension (polling)

THIS SCRIPT audits every MCP server in the empire for these breaking changes.
"""
import sys, os, json, re, hashlib
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


SIGIL_FILE = Path.home() / '.sovereign' / 'mcp_2026_audit.sigil.jsonl'

# The 6 breaking changes to audit for
BREAKING = [
    {
        'id': 'BREAKING-1',
        'change': 'REMOVED: initialize handshake',
        'check_regex': r'(?:async\s+)?def\s+initialize\s*\(',
        'severity': 'HIGH',
    },
    {
        'id': 'BREAKING-2',
        'change': 'REMOVED: Mcp-Session-Id header',
        'check_strings': ['Mcp-Session-Id', '_session_id', 'session_id='],
        'severity': 'HIGH',
    },
    {
        'id': 'BREAKING-3',
        'change': 'REMOVED: sticky sessions',
        'check_strings': ['sticky', 'session_cookie', 'session_affinity'],
        'severity': 'MEDIUM',
    },
    {
        'id': 'BREAKING-4',
        'change': 'NEW required: Mcp-Method / Mcp-Name routing headers',
        'check_strings': ['Mcp-Method', 'Mcp-Name'],
        'present': True,  # This is a POSITIVE check
        'severity': 'INFO',
    },
    {
        'id': 'BREAKING-5',
        'change': 'NEW: Trace Context in _meta (W3C)',
        'check_strings': ['traceparent', 'tracestate', 'trace_context'],
        'severity': 'LOW',
    },
    {
        'id': 'BREAKING-6',
        'change': 'NEW: response caching (ttlMs, cacheScope)',
        'check_strings': ['ttlMs', 'cacheScope', '_meta.cache'],
        'severity': 'LOW',
    },
]


def audit_file(filepath: Path) -> list:
    """Audit a single file for breaking-change patterns."""
    issues = []
    try:
        text = filepath.read_text()
    except Exception:
        return issues

    for br in BREAKING:
        if br.get('present'):
            # Positive check (should HAVE this)
            found = any(s in text for s in br['check_strings'])
            if not found:
                issues.append({
                    'id': br['id'],
                    'change': br['change'],
                    'severity': br['severity'],
                    'file': str(filepath),
                    'action': f'ADD {br["check_strings"]} for {br["change"]}',
                })
        elif 'check_regex' in br:
            # Regex check
            if re.search(br['check_regex'], text):
                issues.append({
                    'id': br['id'],
                    'change': br['change'],
                    'severity': br['severity'],
                    'file': str(filepath),
                    'action': f'REMOVE {br["check_regex"]} pattern (initialize handshake removed in 2026-07-28)',
                })
        elif 'check_strings' in br:
            for s in br['check_strings']:
                if s in text:
                    issues.append({
                        'id': br['id'],
                        'change': br['change'],
                        'severity': br['severity'],
                        'file': str(filepath),
                        'action': f'REMOVE "{s}" usage ({br["change"]})',
                    })
                    break  # one issue per file per breaking change
    return issues


def audit_sovereign_empire() -> dict:
    """Audit all MCP servers in the sovereign empire."""
    # Search roots for MCP server code
    roots = [
        Path('/Users/nicholas/clawd/sovereign-temple-public'),
        Path('/Users/nicholas/clawd/sovereign-temple-live'),
        Path('/Users/nicholas/clawd/meok-compliance-gateway'),
        Path('/Users/nicholas/clawd/csoai-mcp-monetization'),
        Path('/Users/nicholas/clawd/council-of-mcps'),
    ]

    all_issues = []
    files_audited = 0
    files_with_issues = set()

    for root in roots:
        if not root.exists():
            continue
        for py_file in root.rglob('*.py'):
            # Skip tests and __pycache__
            if '__pycache__' in str(py_file) or '/tests/' in str(py_file):
                continue
            # Only audit files that LOOK like MCP servers (have mcp/server in name or import)
            text = None
            try:
                text = py_file.read_text()
            except Exception:
                continue
            if 'mcp' not in text.lower() and 'sov3' not in text.lower():
                continue
            files_audited += 1
            issues = audit_file(py_file)
            if issues:
                files_with_issues.add(str(py_file))
            all_issues.extend(issues)

    # Tally
    by_severity = {'HIGH': 0, 'MEDIUM': 0, 'LOW': 0, 'INFO': 0}
    by_change = {}
    for issue in all_issues:
        by_severity[issue['severity']] += 1
        by_change[issue['id']] = by_change.get(issue['id'], 0) + 1

    # Days until 28 Jul 2026
    deadline = datetime(2026, 7, 28, tzinfo=timezone.utc)
    today = datetime.now(timezone.utc)
    days_left = (deadline - today).days

    # SIGIL
    SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {
        'hop': 'MCP_2026_AUDIT',
        'files_audited': files_audited,
        'files_with_issues': len(files_with_issues),
        'total_issues': len(all_issues),
        'high_severity': by_severity['HIGH'],
        'days_left_until_deadline': days_left,
        'prev_hash': prev,
    }
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps({**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}) + '\n')

    return {
        'files_audited': files_audited,
        'files_with_issues': len(files_with_issues),
        'total_issues': len(all_issues),
        'by_severity': by_severity,
        'by_change': by_change,
        'days_until_deadline': days_left,
        'issues': all_issues[:20],  # First 20 issues
        'sigil': str(SIGIL_FILE),
    }


def print_audit():
    print()
    print('=' * 70)
    print('SOV33 MCP 2026-07-28 STATELESS AUDIT')
    print('=' * 70)
    print()
    r = audit_sovereign_empire()

    print(f'  Files audited:        {r["files_audited"]}')
    print(f'  Files with issues:    {r["files_with_issues"]}')
    print(f'  Total issues:         {r["total_issues"]}')
    print(f'  Days until deadline:  {r["days_until_deadline"]}')
    print()
    print(f'  By severity:')
    for sev, count in r['by_severity'].items():
        if count > 0:
            mark = '🔴' if sev == 'HIGH' else '🟡' if sev == 'MEDIUM' else '⚪'
            print(f'    {mark} {sev}: {count}')
    print()

    print(f'  By breaking change:')
    for change_id, count in sorted(r['by_change'].items()):
        print(f'    {change_id}: {count} files affected')
    print()

    print(f'  Top issues:')
    for issue in r['issues'][:10]:
        print(f'    [{issue["severity"]}] {issue["id"]}: {issue["change"]}')
        print(f'        File: {Path(issue["file"]).name}')
        print(f'        Action: {issue["action"][:80]}...')
        print()

    print('=' * 70)
    print('  MIGRATION PLAN:')
    print('  1. meok-compliance-gateway has stateless_check.py — DONE')
    print('  2. sovereign-temple-public/sov3_mcp_bridge.py uses session_id — TODO')
    print('  3. Update all MCP clients to drop Mcp-Session-Id header')
    print('  4. Add Mcp-Method / Mcp-Name routing headers')
    print('  5. Move state to round-robin load balancer')
    print(f'  SIGIL: {r["sigil"]}')


if __name__ == '__main__':
    print_audit()
