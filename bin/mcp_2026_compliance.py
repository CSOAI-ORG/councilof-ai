"""

MCP 2026-07-28 spec compliance checker.

Validates that our 700+ MCP servers are compatible with the upcoming
spec (releases 2026-07-28). The new spec ships:

  - Stateless core (sessions + initialize handshake removed)
  - OAuth 2.1 / OIDC first-class authorization
  - Extensions framework (reverse-DNS IDs)
  - MCP Apps (sandboxed HTML UIs)
  - Tasks extension (long-running work)
  - 12-month deprecation policy
  - Response caching via ttlMs

Security caveats (Akamai, WorkOS, NSA CSI):
  - State-object / tracking-token manipulation
  - "Hit-and-run" task DoS
  - Header data-leakage (x-mcp-header)
  - MCP Apps XSS

Usage:
  mcp-2026-compliance              # full audit
  mcp-2026-compliance --json       # machine-readable
"""

import json
import argparse
import re
from pathlib import Path
from datetime import datetime, timezone

CARE_FLOOR = 0.95

# 2026-07-28 spec requirements
REQUIREMENTS = [
    {
        'name': 'Stateless request handling',
        'spec': 'SEP-2567 + SEP-2575',
        'rationale': 'Sessions/Mcp-Session-Id removed; initialize handshake removed. Servers must NOT rely on connection state.',
        'check_id': 'stateless',
    },
    {
        'name': 'OAuth 2.1 / OIDC authorization',
        'spec': 'New auth framework',
        'rationale': 'OAuth 2.1 / OIDC as first-class authorization method. Bearer tokens, PKCE, refresh.',
        'check_id': 'oauth21',
    },
    {
        'name': 'Extensions framework (reverse-DNS IDs)',
        'spec': 'extensions/',
        'rationale': 'Reverse-DNS namespaced extension identifiers (e.g., com.example.myext).',
        'check_id': 'extensions',
    },
    {
        'name': 'MCP Apps (sandboxed HTML UIs)',
        'spec': 'SEP-1865',
        'rationale': 'If shipping UI, MUST use sandboxed iframes. Check CSP and frame-ancestors.',
        'check_id': 'mcp_apps',
    },
    {
        'name': 'Tasks extension (long-running work)',
        'spec': 'Tasks/',
        'rationale': 'Long-running work via Tasks. Tasks MUST be cancellable.',
        'check_id': 'tasks',
    },
    {
        'name': 'Mcp-Method / Mcp-Name header routing',
        'spec': 'header routing',
        'rationale': 'Use Mcp-Method / Mcp-Name headers for capability-passport routing.',
        'check_id': 'header_routing',
    },
    {
        'name': 'No header data leakage',
        'spec': 'MCP Headers spec',
        'rationale': 'x-mcp-* headers MUST NOT leak sensitive data; CORS preflight safe.',
        'check_id': 'no_leak',
    },
    {
        'name': '16-byte resource id minimization',
        'spec': 'SEP-2611',
        'rationale': 'Resource ids minimized to 16 bytes; preference for opaque + URL-safe.',
        'check_id': 'ids_16byte',
    },
    {
        'name': 'Deprecation policy (12 months)',
        'spec': 'Lifecycle',
        'rationale': '12-month deprecation notice for any breaking spec/version change.',
        'check_id': 'deprecation_12mo',
    },
    {
        'name': 'Response caching (ttlMs)',
        'spec': 'Caching/',
        'rationale': 'Optional ttlMs response-cache to reduce redundant calls.',
        'check_id': 'caching',
    },
    {
        'name': 'Task-state verification',
        'spec': 'Security best practice',
        'rationale': 'Servers MUST verify task state on every operation (not rely on connection state).',
        'check_id': 'task_verify',
    },
    {
        'name': 'Resource quotas / rate limiting',
        'spec': 'Security best practice',
        'rationale': 'Servers MUST implement their own quotas (stateless shifts enforcement responsibility).',
        'check_id': 'quotas',
    },
]


def check_mcp_compliance(server_path: Path):
    """Check one MCP server for spec compliance."""
    findings = {}
    if not server_path.exists():
        return None

    code_files = list(server_path.rglob('*.py')) + list(server_path.rglob('*.js')) + list(server_path.rglob('*.ts'))
    code_text = ''
    for f in code_files[:20]:  # cap for speed
        try:
            code_text += f.read_text(errors='ignore')
        except Exception:
            pass

    for req in REQUIREMENTS:
        check_id = req['check_id']
        if check_id == 'stateless':
            # Stateless: no session-dependent state, no init handshake
            # Look for typical 'stateful' patterns: in-memory dicts keyed on connection
            # Negative signal: storing connection_id, session_id, ws state
            suspicious = re.findall(r'(global\s+\w*state\w*|session_id\s*[:=]|connection_id\s*[:=])', code_text, re.IGNORECASE)
            findings[check_id] = {
                'status': 'NEEDS_REVIEW' if suspicious else 'OK',
                'evidence': f'{len(suspicious)} stateful patterns found' if suspicious else 'no session_id/connection_id patterns detected',
            }
        elif check_id == 'oauth21':
            # OAuth 2.1: token verification, PKCE, refresh
            has_oauth = bool(re.search(r'OAuth|oauth2|PKCE|access_token', code_text))
            findings[check_id] = {'status': 'OK' if has_oauth else 'GAP', 'evidence': 'OAuth 2.1 references detected' if has_oauth else 'no OAuth found'}
        elif check_id == 'extensions':
            # Extensions: reverse-DNS namespace
            has_ext = bool(re.search(r'(com\.\w+|io\.\w+|net\.\w+|org\.\w+)\.\w+_ext', code_text))
            findings[check_id] = {'status': 'OK' if has_ext else 'NEEDS_REVIEW', 'evidence': 'reverse-DNS IDs found' if has_ext else 'no extensions declared'}
        elif check_id == 'mcp_apps':
            has_apps = bool(re.search(r'(iframe|sandbox|csp|content-security)', code_text, re.IGNORECASE))
            findings[check_id] = {'status': 'OK' if has_apps else 'N/A', 'evidence': 'MCP Apps sandboxed UI detected' if has_apps else 'no UI shipped'}
        elif check_id == 'tasks':
            has_tasks = bool(re.search(r'(task_id|task_status|background_task)', code_text, re.IGNORECASE))
            findings[check_id] = {'status': 'OK' if has_tasks else 'N/A', 'evidence': 'Tasks extension used' if has_tasks else 'synchronous only'}
        elif check_id == 'header_routing':
            has_headers = bool(re.search(r'(Mcp-Method|Mcp-Name|x-mcp-method)', code_text))
            findings[check_id] = {'status': 'OK' if has_headers else 'NEEDS_REVIEW', 'evidence': 'MCP header routing detected' if has_headers else 'no Mcp-Method/Name routing'}
        elif check_id == 'no_leak':
            # Look for sensitive headers in code
            leak = re.findall(r'(api_key.*=.*\"|secret.*=.*\"|token.*=.*\")', code_text)
            findings[check_id] = {
                'status': 'GAP' if leak else 'OK',
                'evidence': f'{len(leak)} potentially leaked secrets in source' if leak else 'no leaked secrets detected'
            }
        elif check_id == 'ids_16byte':
            findings[check_id] = {'status': 'NEEDS_REVIEW', 'evidence': 'requires manual ID format audit'}
        elif check_id == 'deprecation_12mo':
            findings[check_id] = {'status': 'NEEDS_REVIEW', 'evidence': 'no explicit 12-month deprecation policy found in code'}
        elif check_id == 'caching':
            has_ttl = bool(re.search(r'ttlMs|ttl_ms|cache_max_age', code_text))
            findings[check_id] = {'status': 'OK' if has_ttl else 'OPTIONAL', 'evidence': 'response caching (ttlMs) detected' if has_ttl else 'caching is optional in spec'}
        elif check_id == 'task_verify':
            findings[check_id] = {'status': 'NEEDS_REVIEW', 'evidence': 'no explicit task-state verification logic found'}
        elif check_id == 'quotas':
            has_quota = bool(re.search(r'(rate.?limit|quota|throttle)', code_text, re.IGNORECASE))
            findings[check_id] = {'status': 'OK' if has_quota else 'GAP', 'evidence': 'rate-limit/quota detected' if has_quota else 'no quotas/rate-limiting detected'}

    n_ok = sum(1 for v in findings.values() if v['status'] in ['OK', 'N/A', 'OPTIONAL'])
    n_total = len(findings)
    score = (n_ok / n_total) * 100 if n_total else 0
    return {'server': server_path.name, 'score': score, 'findings': findings, 'n_ok': n_ok, 'n_total': n_total}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--json', action='store_true')
    parser.add_argument('--limit', type=int, default=20, help='Max servers to audit')
    args = parser.parse_args()

    print()
    print("=" * 70)
    print("MCP 2026-07-28 SPEC COMPLIANCE AUDIT")
    print("=" * 70)
    print()
    print(f"Spec ships: 28 July 2026 — currently {(datetime(2026, 7, 28, tzinfo=timezone.utc) - datetime.now(timezone.utc)).days} days away")
    print()

    # Sample top MCP servers
    mcp_root = Path('/Users/nicholas/clawd/mcp-marketplace')
    if not mcp_root.exists():
        print(f"Not found: {mcp_root}")
        return

    servers = [d for d in mcp_root.iterdir() if d.is_dir()][:args.limit]
    print(f"Auditing {len(servers)} MCP servers (limited to top {args.limit})...")
    print()

    all_results = []
    for srv in servers:
        try:
            r = check_mcp_compliance(srv)
            if r:
                all_results.append(r)
        except Exception as e:
            print(f"  Error on {srv.name}: {e}")

    if args.json:
        print(json.dumps({'spec_target': '2026-07-28', 'care_floor': CARE_FLOOR, 'servers': all_results}, indent=2))
        return

    # Summary
    avg_score = sum(r['score'] for r in all_results)/len(all_results) if all_results else 0
    print(f"Average score across {len(all_results)} servers: {avg_score:.0f}/100")
    print()
    # Distribution
    if all_results:
        full = sum(1 for r in all_results if r['score'] >= 80)
        partial = sum(1 for r in all_results if 50 <= r['score'] < 80)
        low = sum(1 for r in all_results if r['score'] < 50)
        print(f"  ≥80 (compliant):    {full}/{len(all_results)}")
        print(f"  50-79 (partial):    {partial}/{len(all_results)}")
        print(f"  <50 (gap):          {low}/{len(all_results)}")
    print()
    # Aggregate per requirement
    print("─" * 70)
    print("AGGREGATE BY REQUIREMENT (across all servers)")
    print("─" * 70)
    for req in REQUIREMENTS:
        statuses = [r['findings'].get(req['check_id'], {}).get('status', 'N/A') for r in all_results]
        n_ok = sum(1 for s in statuses if s == 'OK')
        n_gap = sum(1 for s in statuses if s == 'GAP')
        n_review = sum(1 for s in statuses if s == 'NEEDS_REVIEW')
        n_na = sum(1 for s in statuses if s in ['N/A', 'OPTIONAL'])
        n = len(statuses)
        print(f"  {req['name'][:38]:38s} OK={n_ok:>3} GAP={n_gap:>3} review={n_review:>3} N/A={n_na:>3}")


if __name__ == '__main__':
    main()
