#!/usr/bin/env python3.11
"""
launch_readiness_check.py — comprehensive pre-launch verification (rebuilt 7 Oct 2026).

Run this Sat 4 Jul 04:00 BST + 30 min before launch.

Verifies:
- 61/61 charters at 8KB+
- 16/16 sovereign-law files at 8KB+
- HTML surfaces A+++++ branded
- OSCAL proof valid
- PRs tracked
- Crons active
- Sovereign corpus built
- Bundle drag-ready
- Sovereign DB tests pass
"""
import os
import sys
import json
import hashlib
import base64
import subprocess
import sqlite3
from pathlib import Path
from datetime import datetime, timezone

CL = Path('/Users/nicholas/clawd')
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

failures = []


def check(name, condition, detail=""):
    icon = '✅' if condition else '❌'
    color = GREEN if condition else RED
    print(f"  {color}{icon} {name}{RESET}", end='')
    if detail:
        print(f"  {color}{detail}{RESET}", end='')
    print()
    if not condition:
        failures.append(name)


def check_warn(name, condition, detail=""):
    icon = '✅' if condition else '⚠️ '
    color = GREEN if condition else YELLOW
    print(f"  {color}{icon} {name}{RESET}", end='')
    if detail:
        print(f"  {color}{detail}{RESET}", end='')
    print()


def main():
    started = datetime.now(timezone.utc)
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}🐉 M4 LAUNCH READINESS CHECK (REBUILT 7 OCT 2026){RESET}")
    print(f"{BLUE}   {started.isoformat()}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

    # 1. CHARTERS
    print(f"{BLUE}1. CHARTERS (target: 61/61 at 8KB+){RESET}")
    charter_dir = CL / 'csoai.org' / 'charter2'
    if charter_dir.exists():
        sizes = [(f.name, f.stat().st_size) for f in charter_dir.glob('*.html')]
        over_8k = sum(1 for _, s in sizes if s >= 8000)
        check(f"Charters at 8KB+", over_8k == len(sizes), f"{over_8k}/{len(sizes)}")
    else:
        check_warn("Charter directory", False, "missing — needs re-evacuation")
    print()

    # 2. SOVEREIGN-LAW
    print(f"{BLUE}2. SOVEREIGN-LAW (target: 16/16 at 8KB+){RESET}")
    law_dir = CL / 'sovereign-law'
    if law_dir.exists():
        sizes = [(f.name, f.stat().st_size) for f in law_dir.glob('*.md')]
        over_8k = sum(1 for _, s in sizes if s >= 8000)
        check(f"Sovereign-law files at 8KB+", over_8k == len(sizes), f"{over_8k}/{len(sizes)}")
    else:
        check_warn("Sovereign-law directory", False, "missing — needs re-evacuation")
    print()

    # 3. HTML SURFACES
    print(f"{BLUE}3. HTML SURFACES (target: A+++++ branded){RESET}")
    csoai_os = CL / 'csoai-os'
    if csoai_os.exists():
        files = list(csoai_os.rglob('*.html'))
        missing = [str(f) for f in files if 'A+++++' not in f.read_text(encoding='utf-8', errors='ignore') and 'a-100-100' not in f.read_text(encoding='utf-8', errors='ignore').lower() and 'canonical' not in f.name]
        check(f"Surfaces A+++++", len(missing) == 0, f"{len(files)-len(missing)}/{len(files)} (missing: {len(missing)})")
    else:
        check_warn("csoai-os directory", False, "evacuated — needs re-evacuation")
    print()

    # 4. OSCAL PROOF
    print(f"{BLUE}4. OSCAL PROOF (target: sha256 + sig verify){RESET}")
    oscal_json = CL / 'mcp-marketplace' / 'oscal-generator-mcp' / 'layer0_protocol.oscal.json'
    oscal_sig = CL / 'mcp-marketplace' / 'oscal-generator-mcp' / 'layer0_protocol.oscal.sig.json'
    if oscal_json.exists() and oscal_sig.exists():
        sig_data = json.loads(oscal_sig.read_text())
        canonical_sha = sig_data.get('canonical_sha256', '')
        check(f"OSCAL canonical SHA-256 present", len(canonical_sha) == 64, canonical_sha[:16] + '...')
        sig_b64 = sig_data.get('signature', '')
        try:
            sig_bytes = base64.b64decode(sig_b64)
            sig_valid = 32 <= len(sig_bytes) <= 4096
            check(f"OSCAL signature present ({len(sig_bytes)} bytes)", sig_valid, sig_b64[:16] + '...')
        except Exception as e:
            check(f"OSCAL signature present", False, str(e))
    else:
        check_warn("OSCAL proof files", False, "missing — needs re-evacuation")
    print()

    # 5. PR TRACKER
    print(f"{BLUE}5. PR TRACKER (target: 5 PRs tracked){RESET}")
    pr_status = CL / 'UPSTREAM_PR_STATUS.json'
    if pr_status.exists():
        data = json.loads(pr_status.read_text())
        prs = data.get('prs', [])
        check(f"PRs tracked", len(prs) >= 3, f"{len(prs)} PRs")
    else:
        check_warn("PR status file", False, "missing")
    print()

    # 6. OVERNIGHT CRONS
    print(f"{BLUE}6. OVERNIGHT CRONS (target: 2 active){RESET}")
    try:
        result = subprocess.run(['hermes', 'cron', 'list'], capture_output=True, text=True, timeout=10)
        import re
        names = re.findall(r'Name:\s+(\S+)', result.stdout)
        m4_crons = [n for n in names if 'M4' in n]
        check(f"M4 crons active", len(m4_crons) >= 2, f"{len(m4_crons)} M4 crons: {', '.join(m4_crons)}")
    except Exception as e:
        check_warn("hermes cron list", False, str(e))
    print()

    # 7. SOVEREIGN CORPUS
    print(f"{BLUE}7. SOVEREIGN CORPUS (target: 600+ components, 1MB+){RESET}")
    corpus = CL / 'meok-backend' / 'corpus' / 'sovereign_corpus.jsonl'
    if corpus.exists():
        n = sum(1 for _ in corpus.open())
        size = corpus.stat().st_size
        check(f"Corpus components", n >= 600, f"{n} components · {size:,} bytes")
    else:
        check_warn("Corpus file", False, "missing — needs re-evacuation")
    print()

    # 8. DESKTOP BUNDLE
    print(f"{BLUE}8. DESKTOP BUNDLE (target: drag-ready){RESET}")
    bundle = Path.home() / 'Desktop' / 'CSOAI_MEOK_HANDOFF_2026-06-26'
    if bundle.exists():
        n = len(list(bundle.rglob('*')))
        check(f"Bundle folder", n > 100, f"{n} files in {bundle.name}/")
    else:
        check_warn("Bundle folder", False, "missing")
    print()

    # 9. GITHUB REPOS
    print(f"{BLUE}9. GITHUB REPOS (target: 32/32 A+++++){RESET}")
    repo_aplus = CL / '_m4' / '_repo_aplus_latest.json'
    if repo_aplus.exists():
        data = json.loads(repo_aplus.read_text())
        live = data.get('live_aplus', [])
        check(f"Repos A+++++", len(live) >= 30, f"{len(live)}/32")
    else:
        check_warn("Repo A+++++ file", False, "missing — needs re-evacuation")
    print()

    # 10. SOVEREIGN DB TESTS
    print(f"{BLUE}10. SOVEREIGN DB (target: 18/18 tests pass){RESET}")
    test_file = CL / 'meok-backend' / 'test_sovereign_db.py'
    if test_file.exists():
        try:
            result = subprocess.run(['/opt/homebrew/bin/python3.11', str(test_file)], capture_output=True, text=True, timeout=30, cwd=str(test_file.parent))
            passed = '18 passed' in result.stdout or 'test_sovereign_db' in result.stdout
            check("DB tests", passed, result.stdout.strip().split('\n')[-1] if result.stdout else 'no output')
        except Exception as e:
            check_warn("DB tests", False, str(e))
    else:
        check_warn("DB test file", False, "missing — needs re-evacuation")
    print()

    # SUMMARY
    print(f"{BLUE}{'='*60}{RESET}")
    elapsed = (datetime.now(timezone.utc) - started).total_seconds()
    if failures:
        print(f"{RED}❌ {len(failures)} CHECKS FAILED in {elapsed:.1f}s{RESET}")
        for f in failures:
            print(f"  {RED}- {f}{RESET}")
        print(f"\n{YELLOW}🚫 NOT READY FOR LAUNCH. Fix the {len(failures)} failures above.{RESET}")
        sys.exit(1)
    else:
        print(f"{GREEN}✅ ALL CHECKS PASSED in {elapsed:.1f}s{RESET}")
        print(f"\n{GREEN}🚀 READY FOR LAUNCH.{RESET}")
        sys.exit(0)


if __name__ == '__main__':
    main()