#!/usr/bin/env python3
"""Batch fix: Add requires-python to pyproject.toml files missing it."""
import os

BASE = os.path.expanduser("~/clawd/mcp-marketplace")
fixed = 0
skipped = 0

for entry in sorted(os.listdir(BASE)):
    toml_path = os.path.join(BASE, entry, "pyproject.toml")
    if not os.path.isfile(toml_path):
        continue

    with open(toml_path, "r") as f:
        content = f.read()

    if "requires-python" in content:
        skipped += 1
        continue

    # Insert requires-python after the version line
    import re
    new_content = re.sub(
        r'(version\s*=\s*"[^"]+")',
        r'\1\nrequires-python = ">=3.10"',
        content,
        count=1,
    )

    with open(toml_path, "w") as f:
        f.write(new_content)

    fixed += 1

print(f"✅ Fixed: {fixed}")
print(f"⏭️  Already OK: {skipped}")
