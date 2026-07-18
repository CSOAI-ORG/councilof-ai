#!/usr/bin/env python3
"""
MCP Marketplace Safe Fix Script v2
Carefully fixes:
1. Hardcoded auth paths (removes sys.path.insert lines only)
2. Adds self-contained check_access fallback
3. Adds def main() if missing
"""

import os
import re
from pathlib import Path

MARKETPLACE = Path("/Users/nicholas/clawd/mcp-marketplace")

FALLBACK_CHECK_ACCESS = """_MEOK_API_KEY = os.environ.get("MEOK_API_KEY", "")


def check_access(api_key: str = ""):
    """Fallback auth check when shared auth engine is not available."""
    if _MEOK_API_KEY and api_key and api_key == _MEOK_API_KEY:
        return True, "OK", "pro"
    if _MEOK_API_KEY and api_key and api_key != _MEOK_API_KEY:
        return False, "Invalid API key.", "free"
    return True, "OK", "free"


"""

def fix_package(pkg_dir: Path):
    server_py = pkg_dir / "server.py"
    if not server_py.exists():
        return False, "no server.py"
    
    content = server_py.read_text()
    original = content
    lines = content.split('\n')
    new_lines = []
    changes = []
    
    # Track state for removing auth import block
    in_try_block = False
    in_except_block = False
    try_block_indent = None
    brace_depth = 0
    skip_until_blank = False
    
    # First pass: identify lines to keep/remove
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Skip sys.path.insert lines with meok-labs-engine
        if 'sys.path.insert' in stripped and 'meok-labs-engine' in stripped:
            i += 1
            continue
        
        # Handle try: block for auth_middleware import
        if stripped == 'try:':
            # Look ahead to see if this is the auth import block
            if i + 1 < len(lines) and 'auth_middleware' in lines[i + 1]:
                in_try_block = True
                try_block_indent = len(line) - len(line.lstrip())
                i += 1
                continue
        
        if in_try_block:
            if stripped.startswith('except'):
                in_try_block = False
                in_except_block = True
                i += 1
                continue
            i += 1
            continue
        
        if in_except_block:
            # Skip lines in except block until we hit a blank line or dedent
            if stripped == '':
                in_except_block = False
                i += 1
                continue
            # Check if line is dedented (new top-level statement)
            current_indent = len(line) - len(line.lstrip())
            if current_indent <= try_block_indent and stripped:
                in_except_block = False
                # Don't skip this line, it's the next statement
                new_lines.append(line)
                i += 1
                continue
            i += 1
            continue
        
        new_lines.append(line)
        i += 1
    
    # Check if we have check_access defined
    content_fixed = '\n'.join(new_lines)
    has_check_access = 'def check_access(' in content_fixed
    has_meok_key = '_MEOK_API_KEY' in content_fixed
    
    if not has_check_access:
        # Insert fallback at the top, after any shebang/encoding comments
        insert_idx = 0
        for idx, line in enumerate(new_lines):
            if line.startswith('#') or line.strip() == '':
                insert_idx = idx + 1
            else:
                break
        
        # Find where imports start and insert after docstring if present
        # Actually, let's insert right after any initial comments/shebang
        # but before the first import or docstring
        first_real_idx = 0
        for idx, line in enumerate(new_lines):
            stripped = line.strip()
            if stripped and not stripped.startswith('#'):
                first_real_idx = idx
                break
        
        # Insert the fallback before the first real content
        new_lines.insert(first_real_idx, FALLBACK_CHECK_ACCESS.rstrip())
        changes.append("added fallback check_access")
    
    # Check for def main
    has_def_main = re.search(r'^def main\s*\(', '\n'.join(new_lines), re.MULTILINE)
    has_async_main = re.search(r'^async def main\s*\(', '\n'.join(new_lines), re.MULTILINE)
    
    if not has_def_main and not has_async_main:
        # Find "if __name__ == '__main__':" and add def main before it
        for idx, line in enumerate(new_lines):
            if re.search(r"if __name__\s*==\s*['\"]__main__['\"]", line):
                # Check if the next line is just `mcp.run()` or `main()`
                indent = '    '  # 4 spaces
                if idx + 1 < len(new_lines):
                    next_line = new_lines[idx + 1].strip()
                    if 'mcp.run()' in next_line:
                        # Replace with def main + if __main__
                        new_lines[idx] = 'def main():'
                        new_lines[idx + 1] = f'    {next_line}'
                        new_lines.insert(idx + 2, '')
                        new_lines.insert(idx + 3, f"if __name__ == '__main__':")
                        new_lines.insert(idx + 4, '    main()')
                        changes.append("added def main")
                        break
                    elif next_line == 'main()':
                        # Already has main() call but no def
                        new_lines.insert(idx, 'def main():')
                        new_lines.insert(idx + 1, f'    mcp.run()')
                        new_lines.insert(idx + 2, '')
                        changes.append("added def main")
                        break
    
    if has_async_main and not has_def_main:
        # Fix async def main -> def main
        content_fixed = '\n'.join(new_lines)
        content_fixed = re.sub(r'^async def main\s*\(\s*\)', 'def main()', content_fixed, flags=re.MULTILINE)
        new_lines = content_fixed.split('\n')
        changes.append("fixed async def main")
    
    final_content = '\n'.join(new_lines)
    
    if final_content != original:
        # DRY RUN - comment out to apply
        # server_py.write_text(final_content)
        return True, ", ".join(changes) if changes else "modified"
    
    return False, "no changes needed"

def main():
    packages = [d for d in MARKETPLACE.iterdir() if d.is_dir() and not d.name.startswith(('_', '.'))]
    
    fixed = 0
    details = []
    
    for pkg in sorted(packages):
        ok, msg = fix_package(pkg)
        if ok:
            fixed += 1
            details.append(f"  {pkg.name}: {msg}")
    
    print(f"Would fix {fixed} packages")
    for d in details[:30]:
        print(d)
    if len(details) > 30:
        print(f"  ... and {len(details) - 30} more")

if __name__ == "__main__":
    main()
