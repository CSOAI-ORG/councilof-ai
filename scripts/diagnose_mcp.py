#!/usr/bin/env python3
"""
MCP Marketplace Diagnostic Script
Scans all packages in mcp-marketplace to identify:
1. Missing def main()
2. Hardcoded auth paths
3. Missing pyproject.toml scripts
4. Missing requires-python
"""

import os
import re
from pathlib import Path

MARKETPLACE = Path("/Users/nicholas/clawd/mcp-marketplace")

def diagnose():
    packages = [d for d in MARKETPLACE.iterdir() if d.is_dir() and not d.name.startswith(("_", "."))]
    
    missing_main = []
    hardcoded_auth = []
    missing_scripts = []
    missing_requires_python = []
    missing_pyproject = []
    
    for pkg in sorted(packages):
        server_py = pkg / "server.py"
        pyproject = pkg / "pyproject.toml"
        
        if not server_py.exists():
            continue
            
        content = server_py.read_text()
        
        # Check for def main()
        if not re.search(r'^def main\s*\(\s*\)', content, re.MULTILINE):
            missing_main.append(pkg.name)
        
        # Check for hardcoded auth paths
        if re.search(r"sys\.path\.insert.*meok-labs-engine/shared", content):
            hardcoded_auth.append(pkg.name)
            
        # Check pyproject.toml
        if pyproject.exists():
            ppt = pyproject.read_text()
            if "[project.scripts]" not in ppt:
                missing_scripts.append(pkg.name)
            if "requires-python" not in ppt:
                missing_requires_python.append(pkg.name)
        else:
            missing_pyproject.append(pkg.name)
    
    print(f"Total packages scanned: {len(packages)}")
    print(f"\n1. Missing def main(): {len(missing_main)}")
    if missing_main:
        for p in missing_main[:20]:
            print(f"   - {p}")
        if len(missing_main) > 20:
            print(f"   ... and {len(missing_main) - 20} more")
    
    print(f"\n2. Hardcoded auth paths: {len(hardcoded_auth)}")
    if hardcoded_auth:
        for p in hardcoded_auth[:20]:
            print(f"   - {p}")
        if len(hardcoded_auth) > 20:
            print(f"   ... and {len(hardcoded_auth) - 20} more")
    
    print(f"\n3. Missing [project.scripts]: {len(missing_scripts)}")
    if missing_scripts:
        for p in missing_scripts[:20]:
            print(f"   - {p}")
        if len(missing_scripts) > 20:
            print(f"   ... and {len(missing_scripts) - 20} more")
    
    print(f"\n4. Missing requires-python: {len(missing_requires_python)}")
    if missing_requires_python:
        for p in missing_requires_python[:20]:
            print(f"   - {p}")
        if len(missing_requires_python) > 20:
            print(f"   ... and {len(missing_requires_python) - 20} more")
    
    print(f"\n5. Missing pyproject.toml: {len(missing_pyproject)}")
    if missing_pyproject:
        for p in missing_pyproject[:20]:
            print(f"   - {p}")
        if len(missing_pyproject) > 20:
            print(f"   ... and {len(missing_pyproject) - 20} more")

if __name__ == "__main__":
    diagnose()
