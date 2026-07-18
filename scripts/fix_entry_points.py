#!/usr/bin/env python3
"""Batch fix: Add def main() to all MCP servers missing it."""
import os, re, sys

BASE = os.path.expanduser("~/clawd/mcp-marketplace")
fixed = 0
skipped = 0
errors = []

for entry in sorted(os.listdir(BASE)):
    server_path = os.path.join(BASE, entry, "server.py")
    if not os.path.isfile(server_path):
        continue

    with open(server_path, "r") as f:
        content = f.read()

    # Already has def main()
    if re.search(r'^def main\(\):$', content, re.MULTILINE):
        skipped += 1
        continue

    # Replace: if __name__ == "__main__":\n    mcp.run()
    # With: the same but calling main(), and add a main() function before it
    old_main_block = re.search(
        r'if __name__ == "__main__":\s*\n\s+mcp\.run\(\)',
        content, re.MULTILINE
    )

    if not old_main_block:
        # Try alternative pattern
        old_main_block = re.search(
            r'if __name__ == ["\']__main__["\']:\s*\n\s+mcp\.run\(\)',
            content, re.MULTILINE
        )

    if not old_main_block:
        errors.append(f"{entry}: Could not find __main__ block")
        continue

    new_content = (
        content[:old_main_block.start()]
        + "\n\ndef main():\n    \"\"\"Entry point for the mcp command.\"\"\"\n    mcp.run()\n\n"
        + old_main_block.group().replace("mcp.run()", "main()")
        + content[old_main_block.end():]
    )

    with open(server_path, "w") as f:
        f.write(new_content)

    fixed += 1

print(f"✅ Fixed: {fixed}")
print(f"⏭️  Already OK: {skipped}")
if errors:
    print(f"❌ Errors ({len(errors)}):")
    for e in errors:
        print(f"   - {e}")
else:
    print("❌ Errors: 0")
