#!/usr/bin/env python3
"""
MCP Marketplace Safe Fix Script v3
Ultra-conservative approach:
1. Remove ONLY sys.path.insert lines containing 'meok-labs-engine'
2. Add def main() if missing (at end of file)
3. Never remove blocks, never touch other content
"""

import os
import re
from pathlib import Path

MARKETPLACE = Path("/Users/nicholas/clawd/mcp-marketplace")

def fix_package(pkg_dir: Path, dry_run: bool = True):
    server_py = pkg_dir / "server.py"
    if not server_py.exists():
        return False, "no server.py"

    content = server_py.read_text()
    original = content
    lines = content.split('\n')
    new_lines = []
    changes = []

    # Pass 1: Remove ONLY sys.path.insert lines with meok-labs-engine
    for line in lines:
        stripped = line.strip()
        if 'sys.path.insert' in stripped and 'meok-labs-engine' in stripped:
            continue
        new_lines.append(line)

    # Check if content changed from removal
    content_after_removal = '\n'.join(new_lines)
    if content_after_removal != original:
        changes.append("removed hardcoded auth path")

    # Pass 2: Check for def main
    has_def_main = re.search(r'^def main\s*\(', content_after_removal, re.MULTILINE)
    has_async_main = re.search(r'^async def main\s*\(', content_after_removal, re.MULTILINE)

    if not has_def_main and not has_async_main:
        # Check if there's already `if __name__ == "__main__":` with `mcp.run()`
        if re.search(r"if __name__\s*==\s*['\"]__main__['\"]", content_after_removal):
            # Check if the block just calls mcp.run()
            match = re.search(r"if __name__\s*==\s*['\"]__main__['\"]\s*:\s*\n\s*(\S.*)", content_after_removal)
            if match:
                inner = match.group(1).strip()
                if 'mcp.run()' in inner:
                    # Replace the __main__ block with def main + __main__
                    content_fixed = re.sub(
                        r"if __name__\s*==\s*['\"]__main__['\"]\s*:\s*\n\s*\S.*",
                        "def main():\n    mcp.run()\n\nif __name__ == '__main__':\n    main()",
                        content_after_removal,
                    )
                    changes.append("added def main")
                    content_after_removal = content_fixed
        else:
            # No __main__ block at all, add def main + __main__ at end
            content_after_removal = content_after_removal.rstrip() + "\n\n\ndef main():\n    mcp.run()\n\n\nif __name__ == '__main__':\n    main()\n"
            changes.append("added def main + __main__")

    if has_async_main and not has_def_main:
        content_after_removal = re.sub(r'^async def main\s*\(\s*\)', 'def main()', content_after_removal, flags=re.MULTILINE)
        changes.append("fixed async def main")

    if content_after_removal != original:
        if not dry_run:
            server_py.write_text(content_after_removal)
        return True, ", ".join(changes)

    return False, "no changes"

def main():
    import sys
    dry_run = "--apply" not in sys.argv
    mode = "DRY RUN" if dry_run else "APPLYING"

    packages = [d for d in MARKETPLACE.iterdir() if d.is_dir() and not d.name.startswith(('_', '.'))]
    fixed = 0
    details = []

    for pkg in sorted(packages):
        ok, msg = fix_package(pkg, dry_run=dry_run)
        if ok:
            fixed += 1
            details.append(f"  {pkg.name}: {msg}")

    print(f"[{mode}] Would fix {fixed} packages")
    for d in details[:30]:
        print(d)
    if len(details) > 30:
        print(f"  ... and {len(details) - 30} more")

    if dry_run and fixed > 0:
        print(f"\nRun with --apply to execute fixes")

if __name__ == "__main__":
    main()
