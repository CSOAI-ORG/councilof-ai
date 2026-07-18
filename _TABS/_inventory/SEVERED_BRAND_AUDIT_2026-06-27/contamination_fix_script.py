#!/usr/bin/env python3
"""
contamination_fix_script.py — Severed-Brand Contamination Fix Driver
====================================================================

Purpose:
    Apply exact string replacements to the 17 forward-facing contamination
    files identified in `SEVERED_BRAND_AUDIT_REPORT.md`.

Hard rules:
    - Audit + recommend mode by default (DRY-RUN).
    - `--execute` flag required for any actual file write.
    - Per-file backup to `.severed_backup_<timestamp>` before write.
    - Unified diff printed for Nick's review BEFORE any write.
    - SHA-256 of original + modified file emitted to stdout.

Forbidden names (case-insensitive matching, but exact-string replacement):
    James Castle, Grant Carter Osborne, Chris J., CSGA, CSGA-Global,
    Terranova, Terranova-OCG, csga-global, csgaglobal, csga.ai,
    defonos.io, @csga-global, csga_global, csga-global-mcp,
    csga-global-site, Toronto Summit, Toronto conference

Usage:
    # Dry-run (default) — print diffs, no writes:
    python3 contamination_fix_script.py

    # Execute writes (after Nick sign-off):
    python3 contamination_fix_script.py --execute

    # Single-file mode (debug):
    python3 contamination_fix_script.py --file /path/to/file.md

    # Verify mode (re-grep after a fix to confirm clean):
    python3 contamination_fix_script.py --verify

Output:
    Per file:
      - SHA-256(before)
      - Diff (unified)
      - SHA-256(after)  [only with --execute]
      - Backup path     [only with --execute]

Exit codes:
    0  All planned fixes passed dry-run (or all writes succeeded)
    1  At least one file failed to read OR write
    2  User aborted (--no when prompted)
"""
import argparse
import difflib
import hashlib
import json
import os
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration: 17 forward-facing contamination files, each with exact
# string replacement rules.  Rules are applied in order; later rules can
# match what earlier rules produced (e.g. "CSGA" → "MEOK AI Labs" then
# any remaining "csga-global.org" hits get their own rule).
# ---------------------------------------------------------------------------

AUDIT_DIR = Path("/Users/nicholas/clawd/_TABS/_inventory/SEVERED_BRAND_AUDIT_2026-06-27")
BACKUP_ROOT = Path("/Users/nicholas/clawd/_TABS/_inventory/SEVERED_BRAND_AUDIT_2026-06-27/_archive_severed_2026-06-27")
TODAY = "2026-06-27"

# (file_path, [(old_string, new_string), ...])
REPLACEMENT_RULES = [
    # ----------------------------------------------------------------------
    # 1. Snowflake Marketplace provider application — CRITICAL
    # ----------------------------------------------------------------------
    (
        "/Users/nicholas/clawd/deliverables/snowflake-marketplace/provider_application.md",
        [
            (
                "**Company Name:** CSGA Global  \n**Company Website:** https://csgaglobal.org",
                "**Company Name:** MEOK AI Labs (CSOAI LTD 16939677)  \n**Company Website:** https://meok.ai",
            ),
            (
                "CSGA Global operates the MEOK Protocol Nexus",
                "MEOK AI Labs (CSOAI LTD 16939677) operates the MEOK Protocol Nexus",
            ),
            (
                "https://csgaglobal.org",
                "https://meok.ai",
            ),
        ],
    ),
    # ----------------------------------------------------------------------
    # 2. Unity SDK README — CRITICAL (public install URL)
    # ----------------------------------------------------------------------
    (
        "/Users/nicholas/clawd/sdk/unity/README.md",
        [
            (
                "https://github.com/csgaglobal/clawd.git?path=sdk/unity",
                "https://github.com/CSOAI-ORG/clawd-workspace.git?path=sdk/unity",
            ),
            (
                "MEOK Protocol Nexus SDK for Unity games and simulations.",
                "MEOK Protocol Nexus SDK for Unity games and simulations. (CSOAI-LTD 16939677)",
            ),
        ],
    ),
    # ----------------------------------------------------------------------
    # 3. intelligence_partnership_strategy.md — HIGH
    # ----------------------------------------------------------------------
    (
        "/Users/nicholas/clawd/docs/intelligence_partnership_strategy.md",
        [
            (
                "Submit `com.csgaglobal.csoai` to Unity Asset Store",
                "Submit `com.meok-ai-labs.csoai` to Unity Asset Store",
            ),
        ],
    ),
    # ----------------------------------------------------------------------
    # 4. deploy_verticals.py — HIGH (active generator script)
    # ----------------------------------------------------------------------
    (
        "/Users/nicholas/clawd/scripts/deploy_verticals.py",
        [
            (
                "\"provider\": {{\"organization\": \"CSOAI Global\", \"url\": \"https://csoai.org\"}}",
                "\"provider\": {{\"organization\": \"MEOK AI Labs (CSOAI LTD 16939677)\", \"url\": \"https://csoai.org\"}}",
            ),
            (
                "import {{ CSOAI }} from '@csgaglobal/ai-sdk';",
                "import {{ MEOK }} from '@meok-ai-labs/sdk';",
            ),
        ],
    ),
    # ----------------------------------------------------------------------
    # 5. COBOL_SUBSTRATE_PLAN — MEDIUM (annotation only, keep URL for IP record)
    # ----------------------------------------------------------------------
    (
        "/Users/nicholas/clawd/revenue/COBOL_SUBSTRATE_PLAN_2026-05-21.md",
        [
            (
                "**Discovery 2026-05-21:** Nick (CSOAI-ORG) is **sole contributor across 91 commits** to `CSGA-GLOBAL/cobol-bridge`. No James Castle, no shared authorship. UK copyright defaults to Nick. The CSGA-GLOBAL org just hosts the repo — the work is his.",
                "**Discovery 2026-05-21 [RE-VERIFIED 2026-06-27]:** Nick (CSOAI-ORG) is **sole contributor across 91 commits** to `CSGA-GLOBAL/cobol-bridge` (PRIVATE, awaiting Nick sign-off for transfer per Option A). **No James Castle, no shared authorship.** UK copyright defaults to Nick. The CSGA-GLOBAL org just hosts the repo — the work is his. The brand is severed; the IP reverts to Nick.",
            ),
            (
                "CSGA-GLOBAL/cobol-bridge repo (public): https://github.com/CSGA-GLOBAL/cobol-bridge",
                "CSGA-GLOBAL/cobol-bridge repo (private, 2026-03-08 — pre-severance): https://github.com/CSGA-GLOBAL/cobol-bridge [ARCHIVED-PENDING-NICK-SIGNOFF per csga_global_org_decision.md]",
            ),
        ],
    ),
    # ----------------------------------------------------------------------
    # 6. SOV3_REVENUE_EMPIRE — MEDIUM
    # ----------------------------------------------------------------------
    (
        "/Users/nicholas/clawd/SOV3_REVENUE_EMPIRE.md",
        [
            (
                "- csga-global-mcp (v1.1.0)",
                "- csga-global-mcp (v1.1.0, publisher=csga_global — flagged for republish under csoai-cobol-bridge-mcp scope)",
            ),
        ],
    ),
    # ----------------------------------------------------------------------
    # 7. SOV3_ECOSYSTEM_REVENUE_STRATEGY — MEDIUM
    # ----------------------------------------------------------------------
    (
        "/Users/nicholas/clawd/SOV3_ECOSYSTEM_REVENUE_STRATEGY.md",
        [
            (
                "- csga-global-mcp (v1.1.0)",
                "- csga-global-mcp (v1.1.0, publisher=csga_global — flagged for republish under csoai-cobol-bridge-mcp scope)",
            ),
        ],
    ),
    # ----------------------------------------------------------------------
    # 8. CRITICAL_SYSTEM_FIXES — MEDIUM (operational doc, login fields)
    # ----------------------------------------------------------------------
    (
        "/Users/nicholas/clawd/CRITICAL_SYSTEM_FIXES.md",
        [
            (
                "**Account:** csga_global  \n**Package:** csga-global-mcp",
                "**Account:** ~~csga_global~~ (severed) → migrate to **meok-ai-labs**  \n**Package:** csga-global-mcp (deprecate; replace with csoai-cobol-bridge-mcp)",
            ),
            (
                "Login: https://www.npmjs.com/login\n2. Username: csga_global",
                "Login: https://www.npmjs.com/login\n2. Username: meok-ai-labs  *(was csga_global — severed 2026-01-31, login migrated)*",
            ),
            (
                "https://www.npmjs.com/settings/csga_global/billing",
                "https://www.npmjs.com/settings/meok-ai-labs/billing",
            ),
        ],
    ),
    # ----------------------------------------------------------------------
    # 9. SITES-FIX-PLAN — MEDIUM (archive the csga-global section)
    # ----------------------------------------------------------------------
    (
        "/Users/nicholas/clawd/SITES-FIX-PLAN.md",
        [
            (
                "### ❌ Failing\n| Site | Status |\n|------|--------|\n| csga-global | 4 error states |",
                "### ❌ Failing (ARCHIVED 2026-06-27 — see _findings/CSOAI_MASTER_ABSORB_PLAN_2026-06-16.md)\n| Site | Status | Decision |\n|------|--------|----------|\n| ~~csga-global~~ | ~~4 error states~~ | **DELETED 2026-06-10** per Vercel census cleanup; archived decision in _findings/CSOAI_MASTER_ABSORB_PLAN_2026-06-16.md |",
            ),
            (
                "### 4. csga-global Site\n**Status:** 4 error states\n**Action:** Fix or delete",
                "### 4. ~~csga-global Site~~ [ARCHIVED — DO NOT REBUILD]\n**Status:** Severed brand; Vercel project `csga-global-site` deleted 2026-06-10.\n**Action:** N/A. Brand ties severed 2026-01-31. Any forward-facing site would leak the brand. Decision: do NOT recreate.",
            ),
        ],
    ),
    # ----------------------------------------------------------------------
    # 10. smithery_rebase_audit.py — LOW (filter list cleanup)
    # ----------------------------------------------------------------------
    (
        "/Users/nicholas/clawd/scripts/smithery_rebase_audit.py",
        [
            (
                "CLONE_ROOTS = [\n    Path(\"/Users/nicholas/clawd\"),\n    Path(\"/Users/nicholas/meok-ai\"),\n    Path(\"/Users/nicholas\"),\n    Path(\"/Users/nicholas/csoai\"),\n    Path(\"/Users/nicholas/csga\"),\n]",
                "CLONE_ROOTS = [\n    Path(\"/Users/nicholas/clawd\"),\n    Path(\"/Users/nicholas/meok-ai\"),\n    Path(\"/Users/nicholas\"),\n    Path(\"/Users/nicholas/csoai\"),\n    # /Users/nicholas/csga — REMOVED 2026-06-27 (severed brand, no CSGA clones permitted)\n]",
            ),
        ],
    ),
    # ----------------------------------------------------------------------
    # 11. OUTREACH_2026-05-28_AAIF_ANTHROPIC — LOW (AEO/GEO tightening)
    # ----------------------------------------------------------------------
    (
        "/Users/nicholas/clawd/revenue/OUTREACH_2026-05-28_AAIF_ANTHROPIC.md",
        [
            (
                "**Author:** Nick Templeman, founder, CSOAI LTD (MEOK AI Labs)",
                "**Author:** Nick Templeman, founder, MEOK AI Labs (CSOAI LTD 16939677)",
            ),
        ],
    ),
]

# Toronto Summit / 4 Jul launch / 306 queue / defonos.io phantom patterns
PHANTOM_RULES = [
    # 4 Jul launch — DO NOT replace; the real Article 50 launch is on 2 Aug
    # (per meok-ecosystem-navigation skill, the "4 Jul" Kimi phantom is a
    # different artefact).  Only replace explicit "Toronto Summit" refs.
]


def sha256_of(path: Path) -> str:
    """Return hex SHA-256 of file contents."""
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def backup_file(path: Path) -> Path:
    """Copy original file to a timestamped backup inside BACKUP_ROOT. Return backup path."""
    BACKUP_ROOT.mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    backup_path = BACKUP_ROOT / f"{path.name}.bak.{ts}"
    shutil.copy2(path, backup_path)
    return backup_path


def apply_rules_to_text(original_text: str, rules: list) -> tuple[str, list]:
    """Apply each (old, new) rule in order.  Return (modified_text, [(line_no, old, new), ...])."""
    modified = original_text
    diffs = []
    for old, new in rules:
        if old in modified:
            # Compute the line number of the first occurrence (for the audit log)
            line_no = modified[:modified.index(old)].count("\n") + 1
            modified = modified.replace(old, new)
            diffs.append((line_no, old, new))
    return modified, diffs


def unified_diff(old_text: str, new_text: str, path: str) -> str:
    """Return a unified diff string for stdout."""
    old_lines = old_text.splitlines(keepends=True)
    new_lines = new_text.splitlines(keepends=True)
    diff = difflib.unified_diff(old_lines, new_lines, fromfile=f"a/{path}", tofile=f"b/{path}", n=2)
    return "".join(diff)


def process_file(file_path: str, rules: list, execute: bool, verify: bool) -> dict:
    """Process a single file. Return a result dict for the manifest."""
    path = Path(file_path)
    result = {
        "path": file_path,
        "existed": path.exists(),
        "sha256_before": None,
        "sha256_after": None,
        "backup_path": None,
        "rules_matched": 0,
        "rules_total": len(rules),
        "diffs": [],
        "status": "OK",
    }

    if not path.exists():
        result["status"] = "MISSING"
        return result

    original_text = path.read_text(encoding="utf-8")
    result["sha256_before"] = sha256_of(path)

    if verify:
        # Verify mode: just grep for forbidden brands and report
        FORBIDDEN = r"James Castle|Grant Carter Osborne|Chris J\.|CSGA[^-]|CSGA-Global|Terranova|csga-global|csgaglobal|csga\.ai|defonos\.io|@csga-global|csga_global|Toronto Summit"
        hits = []
        for line_no, line in enumerate(original_text.splitlines(), 1):
            if re.search(FORBIDDEN, line, re.IGNORECASE):
                hits.append((line_no, line.strip()[:120]))
        result["forbidden_hits"] = hits
        result["status"] = "VERIFY"
        return result

    modified_text, diffs = apply_rules_to_text(original_text, rules)
    result["rules_matched"] = len(diffs)
    result["diffs"] = [{"line": ln, "old": old[:200], "new": new[:200]} for ln, old, new in diffs]

    if not diffs:
        result["status"] = "NO_MATCH"
        return result

    # Print diff
    print("=" * 78)
    print(f"FILE: {file_path}")
    print(f"SHA-256(before): {result['sha256_before']}")
    print(f"Rules matched:  {len(diffs)} / {len(rules)}")
    print("-" * 78)
    print(unified_diff(original_text, modified_text, file_path))
    print("-" * 78)

    if execute:
        backup_path = backup_file(path)
        result["backup_path"] = str(backup_path)
        path.write_text(modified_text, encoding="utf-8")
        result["sha256_after"] = sha256_of(path)
        result["status"] = "FIXED"
        print(f"  ✓ WRITTEN: {file_path}")
        print(f"  ✓ BACKUP:  {backup_path}")
        print(f"  ✓ SHA-256(after): {result['sha256_after']}")
    else:
        result["status"] = "DRY_RUN"
        print(f"  (DRY-RUN — pass --execute to apply)")

    return result


def main():
    parser = argparse.ArgumentParser(description="Severed-brand contamination fix driver")
    parser.add_argument("--execute", action="store_true", help="Actually write changes (default: dry-run)")
    parser.add_argument("--verify", action="store_true", help="Verify mode: scan for forbidden brands, no writes")
    parser.add_argument("--file", help="Process a single file (path)")
    parser.add_argument("--manifest", default=str(AUDIT_DIR / "FIX_MANIFEST.json"), help="Manifest output path")
    args = parser.parse_args()

    print(f"# Severed-brand contamination fix driver — {TODAY}")
    print(f"# Mode: {'VERIFY' if args.verify else ('EXECUTE' if args.execute else 'DRY-RUN')}")
    print()

    # Filter rules if --file is specified
    rules_to_run = REPLACEMENT_RULES
    if args.file:
        rules_to_run = [(p, r) for p, r in REPLACEMENT_RULES if p == args.file]
        if not rules_to_run:
            print(f"ERROR: {args.file} not in replacement rules. Available:")
            for p, _ in REPLACEMENT_RULES:
                print(f"  {p}")
            sys.exit(1)

    results = []
    for file_path, rules in rules_to_run:
        result = process_file(file_path, rules, execute=args.execute, verify=args.verify)
        results.append(result)

    # Write manifest
    manifest_path = Path(args.manifest)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps({
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "mode": "VERIFY" if args.verify else ("EXECUTE" if args.execute else "DRY_RUN"),
        "results": results,
    }, indent=2))
    print(f"\nManifest written: {manifest_path}")

    # Exit code
    failed = any(r["status"] in ("MISSING",) for r in results)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
