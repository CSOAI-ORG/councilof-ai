#!/usr/bin/env python3
"""Batch fix: Add try/except ImportError fallback for auth_middleware imports.

Pattern: replaces:
    from auth_middleware import check_access
or:
    from auth_middleware import check_access as _shared_check_access
with a try/except that provides a fallback using _MEOK_API_KEY env var.

Only fixes files that import from auth_middleware but DON'T already have the fallback.
"""
import os, re

BASE = os.path.expanduser("~/clawd/mcp-marketplace")
fixed = 0
skipped = 0
already_ok = 0
no_auth_import = 0

FALLBACK = '''try:
    sys.path.insert(0, os.path.expanduser("~/clawd/meok-labs-engine/shared"))
    from auth_middleware import check_access as _shared_check_access
except ImportError:
    def _shared_check_access(api_key: str = ""):
        """Fallback when shared auth engine is not available."""
        if _MEOK_API_KEY and api_key and api_key == _MEOK_API_KEY:
            return True, "OK", "pro"
        if _MEOK_API_KEY and api_key and api_key != _MEOK_API_KEY:
            return False, "Invalid API key.", "free"
        return True, "OK", "free"

'''

for entry in sorted(os.listdir(BASE)):
    server_path = os.path.join(BASE, entry, "server.py")
    if not os.path.isfile(server_path):
        continue

    with open(server_path, "r") as f:
        content = f.read()

    # Check if it imports from auth_middleware
    if "from auth_middleware import" not in content and "from auth_middleware import" not in content.replace(" ", ""):
        no_auth_import += 1
        continue

    # Already has proper fallback (has a def _shared_check_access with fallback comment)
    if 'def _shared_check_access(api_key: str = "")' in content and 'Fallback' in content:
        already_ok += 1
        continue

    # Find the auth_middleware import block and replace it
    # Pattern 1: from auth_middleware import check_access
    # Pattern 2: from auth_middleware import check_access as _shared_check_access
    # These might be inside a try/except or standalone

    # Check if there's a bare import without try/except
    auth_pattern = r'(from auth_middleware import check_access\b[^\n]*)'
    match = re.search(auth_pattern, content)
    if not match:
        # Try without the import but with the path insert
        auth_pattern2 = r'(sys\.path\.insert\(0,\s*os\.path\.expanduser\("~/clawd/meok-labs-engine/shared"\)\)\s*\n\s*from auth_middleware import[^\n]*)'
        match = re.search(auth_pattern2, content)

    if not match:
        skipped += 1
        continue

    old_import = match.group(0)

    # Check if it's already wrapped in try/except
    before = content[max(0, match.start() - 50):match.start()]
    if "try:" in before and "except ImportError" not in content[match.start():match.start() + 200]:
        # Already has a try but no except for this? Actually check more carefully
        pass

    if "try:" in before:
        # It's already wrapped, check if the except is proper
        after_chunk = content[match.end():match.end() + 300]
        if "except ImportError:" in after_chunk:
            already_ok += 1
            continue

    # Build replacement: wrap the import in try/except with fallback
    # Strip any leading whitespace from the match to maintain indentation
    leading_ws = ""
    ws_match = re.match(r'^(\s*)', old_import)
    if ws_match:
        leading_ws = ws_match.group(1)

    indented_fallback = FALLBACK.replace('\n', '\n' + leading_ws).rstrip(leading_ws)

    # Only replace the first occurrence if there are multiple (unlikely)
    new_content = content.replace(old_import, indented_fallback, 1)

    with open(server_path, "w") as f:
        f.write(new_content)

    fixed += 1

print(f"✅ Fixed (added fallback): {fixed}")
print(f"⚠️  Skipped (no match found): {skipped}")
print(f"⏭️  Already OK: {already_ok}")
print(f"📦 No auth_middleware import: {no_auth_import}")
print(f"📊 Total processed: {fixed + skipped + already_ok + no_auth_import}")
