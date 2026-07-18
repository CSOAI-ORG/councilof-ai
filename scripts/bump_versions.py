#!/usr/bin/env python3
"""
MCP Marketplace Version Standardization
Bumps versions for packages that were fixed (def main + auth paths).
Strategy:
- 1.0.4 → 1.0.5 (bug fix: added entry point, removed hardcoded path)
- 1.0.0 → 1.0.1 (bug fix: added entry point)
- Others: leave as-is (already have proper semver)
"""

import re
from pathlib import Path

MARKETPLACE = Path("/Users/nicholas/clawd/mcp-marketplace")

def bump_version(pkg_dir: Path, dry_run: bool = True):
    pyproject = pkg_dir / "pyproject.toml"
    if not pyproject.exists():
        return False, "no pyproject.toml"
    
    content = pyproject.read_text()
    original = content
    
    # Find version line
    ver_match = re.search(r'^version\s*=\s*"([^"]+)"', content, re.MULTILINE)
    if not ver_match:
        return False, "no version found"
    
    old_ver = ver_match.group(1)
    
    # Only bump specific versions
    bump_map = {
        "1.0.4": "1.0.5",
        "1.0.0": "1.0.1",
    }
    
    new_ver = bump_map.get(old_ver)
    if not new_ver:
        return False, f"version {old_ver} unchanged"
    
    content = content.replace(f'version = "{old_ver}"', f'version = "{new_ver}"', 1)
    
    if content != original:
        if not dry_run:
            pyproject.write_text(content)
        return True, f"{old_ver} → {new_ver}"
    
    return False, "no change"

def main():
    import sys
    dry_run = "--apply" not in sys.argv
    mode = "DRY RUN" if dry_run else "APPLYING"
    
    packages = [d for d in MARKETPLACE.iterdir() if d.is_dir() and not d.name.startswith(('_', '.'))]
    bumped = 0
    details = []
    
    for pkg in sorted(packages):
        ok, msg = bump_version(pkg, dry_run=dry_run)
        if ok:
            bumped += 1
            details.append(f"  {pkg.name}: {msg}")
    
    print(f"[{mode}] Bumped {bumped} packages")
    for d in details[:30]:
        print(d)
    if len(details) > 30:
        print(f"  ... and {len(details) - 30} more")
    
    if dry_run and bumped > 0:
        print(f"\nRun with --apply to execute")

if __name__ == "__main__":
    main()
