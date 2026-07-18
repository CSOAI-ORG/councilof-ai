#!/usr/bin/env python3
"""
sov33_mcp_scan.py — Static security scanner for the MEOK-defoneos MCP fleet.

MEOK-SOV3 for Sir Nicholas Templeman. 11 Jul 2026.

This is our home-grown mcp-scan alternative (mcp-scan not pip-installable).
Scans all 19+ MEOK-defoneos MCPs in /Users/nicholas/clawd/mcp-marketplace/.

Checks:
  - Hardcoded secrets (API keys, tokens)
  - Shell execution paths
  - Subprocess invocations
  - File system access patterns
  - Network exfiltration patterns
  - Eval/exec usage
  - Pickle deserialization
  - License header

Honest scope:
  - Static analysis only (not runtime)
  - Heuristic patterns, not formal verification
  - Reports findings; doesn't fix them
"""
import sys
import os
import re
import json
import argparse
from pathlib import Path
from datetime import datetime, timezone
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


MCP_DIR = Path('/Users/nicholas/clawd/mcp-marketplace')
REPORT_FILE = Path(_SOVDIR) / 'mcp_scan_report.json'


# Dangerous patterns
PATTERNS = {
    'hardcoded_secret': [
        r'(?i)(api[_-]?key|secret|token|password)\s*=\s*[\'"][a-zA-Z0-9_\-]{20,}[\'"]',
        r'(?i)sk-[a-zA-Z0-9]{20,}',
        r'AKIA[A-Z0-9]{16}',
        r'ghp_[a-zA-Z0-9]{36}',
    ],
    'shell_execution': [
        r'\bos\.system\(',
        r'\bsubprocess\.[A-Za-z]*\(',  # broader subprocess match
        r'\bos\.popen\(',
    ],
    'eval_exec': [
        r'\beval\(',
        r'\bexec\(',
        r'\bcompile\(',
    ],
    'unsafe_deserialization': [
        r'\bpickle\.loads?\(',
        r'\byaml\.load\(',  # unsafe without Loader=SafeLoader
    ],
    'fs_write': [
        r'\bopen\([\'"](?:/etc|/tmp|/var|/root)',
        r'\bshutil\.rmtree\(',
        r'\bos\.remove\(',
    ],
    'network_egress': [
        r'requests\.(?:get|post|put|delete)\([\'"]https?://(?!localhost|127\.|csoai)',
        r'urllib\.request\.urlopen\([\'"]https?://(?!localhost|127\.)',
    ],
    'hardcoded_path': [
        r'[\'"]/Users/[a-zA-Z]+/',  # hardcoded user path (privacy leak)
    ],
}


def scan_file(path: Path) -> list:
    """Scan a single file for dangerous patterns."""
    findings = []
    try:
        text = path.read_text(errors='ignore')
    except Exception:
        return findings

    for category, patterns in PATTERNS.items():
        for pattern in patterns:
            for match in re.finditer(pattern, text):
                line_num = text[:match.start()].count('\n') + 1
                line_content = text.split('\n')[line_num - 1].strip()[:100] if line_num <= len(text.split('\n')) else ''
                findings.append({
                    'file': str(path.relative_to(MCP_DIR)),
                    'line': line_num,
                    'category': category,
                    'snippet': line_content,
                })
    return findings


def scan_mcp(mcp_path: Path) -> dict:
    """Scan a single MCP."""
    if not mcp_path.exists():
        return {'mcp': mcp_path.name, 'skipped': 'not found'}

    findings = []
    files_scanned = 0

    # Scan .py files in the MCP
    for py_file in mcp_path.rglob('*.py'):
        if '__pycache__' in str(py_file) or 'test' in str(py_file).lower():
            continue
        files_scanned += 1
        findings.extend(scan_file(py_file))

    # Scan pyproject.toml for license
    pyproject = mcp_path / 'pyproject.toml'
    license_name = 'unknown'
    if pyproject.exists():
        try:
            content = pyproject.read_text()
            match = re.search(r'license\s*=\s*[\'"]?([^\'"]+)', content)
            if match:
                license_name = match.group(1).strip('"\'')
        except Exception:
            pass

    return {
        'mcp': mcp_path.name,
        'files_scanned': files_scanned,
        'findings_count': len(findings),
        'findings_by_category': {cat: len([f for f in findings if f['category'] == cat]) for cat in PATTERNS.keys()},
        'findings': findings[:10],  # top 10 only
        'license': license_name,
    }


def main():
    parser = argparse.ArgumentParser(description='SOV33 MCP security scanner')
    parser.add_argument('--output', default=str(REPORT_FILE))
    parser.add_argument('--quiet', action='store_true')
    args = parser.parse_args()

    if not MCP_DIR.exists():
        print(f"  MCP directory not found: {MCP_DIR}")
        return

    # Find MEOK-defoneos MCPs (looking for the 19 published)
    mcp_dirs = []
    for d in MCP_DIR.iterdir():
        if not d.is_dir() or d.name.startswith('.'):
            continue
        if any(kw in d.name.lower() for kw in [
            'compliance', 'care-mem', 'proofof', 'consciousness',
            'crosswalk', 'planthire', 'muckaway', 'owasp', 'governance-engine',
            'meok-defoneos', 'agentic',
        ]):
            mcp_dirs.append(d)

    print()
    print("=" * 70)
    print("SOV33 MCP SECURITY SCAN — Static analysis of MEOK-defoneos MCPs")
    print("=" * 70)
    print(f"  MCP directory: {MCP_DIR}")
    print(f"  MCPs to scan: {len(mcp_dirs)}")
    print()

    results = []
    total_findings = 0
    for mcp_path in mcp_dirs:
        r = scan_mcp(mcp_path)
        results.append(r)
        if r.get('findings_count', 0) > 0:
            mark = '⚠'
        else:
            mark = '✓'
        if not args.quiet:
            print(f"  {mark} {mcp_path.name}: {r.get('findings_count', 0)} findings, "
                  f"{r.get('files_scanned', 0)} files, license={r.get('license', '?')}")
        total_findings += r.get('findings_count', 0)

    print()
    print(f"  Total findings: {total_findings}")
    print(f"  Total MCPs scanned: {len(mcp_dirs)}")

    # Save report
    with open(args.output, 'w') as f:
        json.dump({
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'total_mcps': len(mcp_dirs),
            'total_findings': total_findings,
            'results': results,
        }, f, indent=2)

    print(f"  Report saved to: {args.output}")


if __name__ == '__main__':
    main()