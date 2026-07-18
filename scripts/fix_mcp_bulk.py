#!/usr/bin/env python3
"""
MCP Marketplace Bulk Fix Script
Fixes:
1. Hardcoded auth paths (sys.path.insert to meok-labs-engine/shared)
2. Missing _MEOK_API_KEY definition
3. async def main() -> def main()
4. Missing [project.scripts] in pyproject.toml
"""

import os
import re
from pathlib import Path

MARKETPLACE = Path("/Users/nicholas/clawd/mcp-marketplace")

# Standard fallback check_access implementation
CHECK_ACCESS_FALLBACK = '''
_MEOK_API_KEY = os.environ.get("MEOK_API_KEY", "")

def check_access(api_key: str = ""):
    """Fallback auth check when shared auth engine is not available."""
    if _MEOK_API_KEY and api_key and api_key == _MEOK_API_KEY:
        return True, "OK", "pro"
    if _MEOK_API_KEY and api_key and api_key != _MEOK_API_KEY:
        return False, "Invalid API key.", "free"
    return True, "OK", "free"

'''

def fix_server_py(pkg_dir: Path):
    server_py = pkg_dir / "server.py"
    if not server_py.exists():
        return False, "no server.py"
    
    content = server_py.read_text()
    original = content
    
    # Check if it has hardcoded auth path
    has_hardcoded = re.search(r"sys\.path\.insert.*meok-labs-engine/shared", content)
    
    # Check if _MEOK_API_KEY is defined
    has_meok_key = re.search(r"^_MEOK_API_KEY\s*=" , content, re.MULTILINE)
    
    # Check for async def main
    has_async_main = re.search(r"^async def main\s*\(\s*\)", content, re.MULTILINE)
    
    changes = []
    
    if has_hardcoded or not has_meok_key:
        # Remove sys.path.insert lines related to meok-labs-engine
        content = re.sub(
            r"^\s*sys\.path\.insert\s*\(\s*0\s*,\s*os\.path\.expanduser\s*\(\s*['\"]~/clawd/meok-labs-engine/shared['\"]\s*\)\s*\)\s*\n?",
            "",
            content,
            flags=re.MULTILINE,
        )
        content = re.sub(
            r"^\s*sys\.path\.insert\s*\(\s*0\s*,\s*['\"].*meok-labs-engine/shared['\"].*\)\s*\n?",
            "",
            content,
            flags=re.MULTILINE,
        )
        
        # Remove the try/except block for auth_middleware import
        # Pattern: try:\n    from auth_middleware import ...\nexcept ImportError:\n    def check_access(...): ...
        content = re.sub(
            r"^try:\s*\n\s*from auth_middleware import .*?\nexcept ImportError:\s*\n(?:\s+.*\n)*?\n",
            "",
            content,
            flags=re.MULTILINE | re.DOTALL,
        )
        
        # Also try a simpler pattern for fallback function removal
        content = re.sub(
            r"^try:\s*\n\s*sys\.path\.insert.*?\n\s*from auth_middleware import .*?\nexcept ImportError:\s*\n(?:\s+.*\n)*?\n",
            "",
            content,
            flags=re.MULTILINE | re.DOTALL,
        )
        
        # If we removed the import block but _MEOK_API_KEY is not defined, add it
        if not re.search(r"^_MEOK_API_KEY\s*=" , content, re.MULTILINE):
            # Find a good place to insert — after the imports, before first function/class
            # Look for the first def or @mcp or class
            match = re.search(r"^(def |@|class )", content, re.MULTILINE)
            if match:
                insert_pos = match.start()
                content = content[:insert_pos] + "\n_MEOK_API_KEY = os.environ.get(\"MEOK_API_KEY\", \"\")\n\ndef check_access(api_key: str = \"\"):\n    \"\"\"Fallback auth check when shared auth engine is not available.\"\"\"\n    if _MEOK_API_KEY and api_key and api_key == _MEOK_API_KEY:\n        return True, \"OK\", \"pro\"\n    if _MEOK_API_KEY and api_key and api_key != _MEOK_API_KEY:\n        return False, \"Invalid API key.\", \"free\"\n    return True, \"OK\", \"free\"\n\n" + content[insert_pos:]
            else:
                content = "_MEOK_API_KEY = os.environ.get(\"MEOK_API_KEY\", \"\")\n\ndef check_access(api_key: str = \"\"):\n    \"\"\"Fallback auth check when shared auth engine is not available.\"\"\"\n    if _MEOK_API_KEY and api_key and api_key == _MEOK_API_KEY:\n        return True, \"OK\", \"pro\"\n    if _MEOK_API_KEY and api_key and api_key != _MEOK_API_KEY:\n        return False, \"Invalid API key.\", \"free\"\n    return True, \"OK\", \"free\"\n\n" + content
            changes.append("added fallback check_access")
        
        changes.append("removed hardcoded auth path")
    
    if has_async_main:
        content = re.sub(r"^async def main\s*\(\s*\)", "def main()", content, flags=re.MULTILINE)
        changes.append("fixed async def main -> def main")
    
    if content != original:
        server_py.write_text(content)
        return True, ", ".join(changes) if changes else "modified"
    
    return False, "no changes needed"

def fix_pyproject(pkg_dir: Path):
    pyproject = pkg_dir / "pyproject.toml"
    if not pyproject.exists():
        return False, "no pyproject.toml"
    
    content = pyproject.read_text()
    original = content
    changes = []
    
    # Check for [project.scripts]
    if "[project.scripts]" not in content:
        # Get package name from pyproject
        name_match = re.search(r'^name\s*=\s*"([^"]+)"', content, re.MULTILINE)
        if name_match:
            pkg_name = name_match.group(1)
            # Convert to script name: accessibility-ai-mcp -> accessibility_ai_mcp
            script_name = pkg_name.replace("-", "_")
            # Add scripts section before the last section or at the end
            content = content.rstrip() + f"\n\n[project.scripts]\n{script_name} = \"server:main\"\n"
            changes.append("added [project.scripts]")
    
    if content != original:
        pyproject.write_text(content)
        return True, ", ".join(changes)
    
    return False, "no changes needed"

def main():
    packages = [d for d in MARKETPLACE.iterdir() if d.is_dir() and not d.name.startswith(("_", "."))]
    
    fixed_servers = 0
    fixed_pyprojects = 0
    server_details = []
    pyproject_details = []
    
    for pkg in sorted(packages):
        ok, msg = fix_server_py(pkg)
        if ok:
            fixed_servers += 1
            server_details.append(f"  {pkg.name}: {msg}")
        
        ok2, msg2 = fix_pyproject(pkg)
        if ok2:
            fixed_pyprojects += 1
            pyproject_details.append(f"  {pkg.name}: {msg2}")
    
    print(f"Fixed {fixed_servers} server.py files")
    for d in server_details:
        print(d)
    
    print(f"\nFixed {fixed_pyprojects} pyproject.toml files")
    for d in pyproject_details:
        print(d)

if __name__ == "__main__":
    main()
